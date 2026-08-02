import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// The documented numbers, checked against the thing they describe.
//
// README.md and HANDOFF.md both state a test count, and both have been wrong
// more than once — 243 when it was 262, 262 when it was 271, 271 when it was
// 288. Every time for the same reason: the number is true when written and
// nothing notices when it stops being.
//
// It is a small lie and it matters more than its size. This repository's own
// rules say a claim nobody checked is worse than no claim, and those rules are
// enforced by tests rather than by asking politely — a documentation file that
// quietly drifts is the same failure in a different file extension. The first
// line of HANDOFF.md tells the next person that its numbers were counted from
// the repository rather than remembered. This is what makes that true.
//
// Deliberately not checked here: prose. Only the countable things, because
// only those can be wrong in a way a test can see.

const root = new URL('../../../', import.meta.url);
const readDoc = (name) => readFileSync(new URL(name, root), 'utf8');

const testFiles = () =>
  readdirSync(new URL('src/', root), { recursive: true })
    .filter(f => typeof f === 'string' && f.endsWith('.test.mjs'));

/**
 * How many tests there are, counted from the source.
 *
 * The obvious implementation — spawn `node --test` and read its total — is
 * wrong here in a way worth recording: this file is itself part of the suite,
 * so the subprocess runs it, and it spawns another. Counting the declarations
 * instead is both terminating and exact, because every test in this repository
 * is a top-level `test('...')` call. The check below enforces that, so the day
 * somebody generates tests in a loop this stops being quietly approximate and
 * starts failing loudly.
 */
function declaredTestCount() {
  let total = 0;
  for (const f of testFiles()) {
    const src = readFileSync(new URL(`src/${f}`, root), 'utf8');
    total += (src.match(/^test\(/gm) ?? []).length;
    // A test declared anywhere but the start of a line — inside a loop, a
    // helper, a describe — would make this count a guess.
    // [ \t] rather than \s: \s matches newlines too, so `^\s+test\(` spanned
    // a blank line into a top-level declaration and flagged every file.
    const indented = (src.match(/^[ \t]+test\(/gm) ?? []).length;
    if (indented > 0) throw new Error(`${f} declares ${indented} test(s) somewhere other than the top level; this count is no longer exact`);
  }
  return total;
}

test('every test file is reachable by the glob the docs tell people to run', () => {
  // If a test file ever lands somewhere `src/**/*.test.mjs` does not match, it
  // stops running and nothing says so. Cheap to check, and the failure it
  // prevents is silent.
  const found = testFiles();
  assert.ok(found.length > 0, 'no test files found at all — the glob or this test is wrong');
  for (const f of found) {
    assert.ok(f.includes('__tests__'), `${f} is outside __tests__ and may not be picked up`);
  }
});

test('README and HANDOFF agree with each other about the test count', () => {
  // Cross-checked before either is compared to reality, because when they
  // disagree the useful message is which two files to look at.
  const readme = readDoc('README.md').match(/npm test\s+#\s*(\d+) tests/);
  const handoff = readDoc('HANDOFF.md').match(/npm test\s+#\s*(\d+)개/);
  assert.ok(readme, 'README.md no longer states a test count in the expected shape');
  assert.ok(handoff, 'HANDOFF.md no longer states a test count in the expected shape');
  assert.equal(readme[1], handoff[1], 'README.md and HANDOFF.md claim different test counts');
});

test('the documented test count is the real one', () => {
  const claimed = Number(readDoc('README.md').match(/npm test\s+#\s*(\d+) tests/)[1]);
  const real = declaredTestCount();
  assert.ok(real > 0, 'counted no tests at all');
  // This test is one of the ones being counted, which is fine — it is counted
  // in both numbers or in neither.
  assert.equal(claimed, real, `docs say ${claimed} tests, the source declares ${real}`);
});
