import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Every place this app reads `signups` or `profiles`, held as a list.
//
// ── Why a list ──────────────────────────────────────────────────────────
//
// Both of 2026-09-01's failures were the same mistake: tightening what a
// reader may see, and not counting all the readers.
//
//   42P17 — the scoped policy was written against the reads somebody
//   remembered, applied, and took every read of both tables down.
//
//   The morning regression — seat_holds() was merged into listAllSignups()
//   and not into listSignups(), so the card and the table page disagreed
//   about the same table and the page told a stranger nobody had sat down.
//
// Neither was hard to see once found. Both were invisible beforehand because
// nothing anywhere said how many readers there are. This file says nine, by
// name, and fails when that stops being true.
//
// ── This one reads the source, deliberately ─────────────────────────────
//
// CLAUDE.md says to assert what the code does rather than what it looks
// like, and this is the exception that rule allows for: "how many places
// read this table" is a fact about the source and there is no way to learn
// it at runtime without a database. Comments are stripped first, because a
// note *about* a read would otherwise count as one — which is exactly how
// two guards passed while matching prose earlier this week.
//
// The behaviour these paths must have is tested elsewhere and behaviourally:
// seatHolds.test.mjs for the merge, headcount.test.mjs for the two screens
// agreeing, rlsPolicies.test.mjs for what each reader is allowed to see.

const root = process.cwd();

/** The backend with `//` comment lines removed. */
const source = fs.readFileSync(path.join(root, 'src/data/supabaseBackend.js'), 'utf8')
  .replace(/\r\n/g, '\n')
  .split('\n')
  .map(l => l.replace(/^\s*\/\/.*$/, ''))
  .join('\n');

/**
 * Every read of signups/profiles, as `functionName → table`.
 *
 * A read is `.from('x')` whose statement also has `.select(` — an insert,
 * update or delete on the same table is not a reader and must not inflate
 * the count. Plus every call of the aggregate that stands in for the rows a
 * reader may not have.
 */
function readPaths() {
  const lines = source.split('\n');
  let fn = '(module scope)';
  const found = [];
  lines.forEach((line, i) => {
    const named = line.match(/^(?:export )?(?:async )?function (\w+)/);
    if (named) [, fn] = named;

    const from = line.match(/\.from\((["'])(signups|profiles)\1\)/);
    if (from && /\.select\(/.test(lines.slice(i, i + 3).join(' '))) {
      found.push(`${fn} → ${from[2]}`);
    }
    if (/rpc\((["'])seat_holds\1\)/.test(line)) found.push(`${fn} → seat_holds()`);
  });
  return [...new Set(found)];
}

// Nine, as of 2026-09-01. Every line here is a reader whose behaviour changes
// when an RLS policy does.
const EXPECTED = [
  // Own row only. Unaffected by any policy that keeps `id = auth.uid()`.
  'ensureProfile → profiles',
  'createTable → profiles',
  // One named host. This is what renders the host card before anybody has
  // asked for a seat, and it is why profiles_read has an is_open_host clause.
  'hostRecord → profiles',
  // The host's own past tables, for their record of meals held.
  'hostRecord → signups',
  // The two that feed a screen, and the two aggregates standing in for the
  // rows a stranger may not read. These four move together or the card and
  // the table page disagree — which they did, for a few hours.
  'listSignups → signups',
  'listSignups → seat_holds()',
  'listAllSignups → signups',
  'listAllSignups → seat_holds()',
  // Reads its own row back after inserting, to return the new signup.
  'createSignup → signups',
];

// The two that hand a collection of signups to a screen. Each has to fill in
// what RLS withheld, or the screen counts only what this reader happens to be
// allowed to see and calls that the whole table.
const MUST_MERGE = ['listSignups', 'listAllSignups'];

test('every reader of signups and profiles is on the list', () => {
  const actual = readPaths();
  assert.equal(actual.length, EXPECTED.length,
    `${actual.length} read paths, ${EXPECTED.length} on the list. Added: `
    + `${JSON.stringify(actual.filter(p => !EXPECTED.includes(p)))}; gone: `
    + `${JSON.stringify(EXPECTED.filter(p => !actual.includes(p)))}. `
    + 'A new reader has to be checked against the policies before it is added here.');
  assert.deepEqual([...actual].sort(), [...EXPECTED].sort());
});

test('both paths that feed a screen fill in what RLS withheld', () => {
  // The morning regression exactly: listAllSignups() merged and listSignups()
  // did not, so the same table read two ways.
  for (const fn of MUST_MERGE) {
    const at = source.indexOf(`export async function ${fn}(`);
    assert.ok(at > 0, `${fn} is gone — the list above needs revisiting`);
    const body = source.slice(at, source.indexOf('\n}', at));
    assert.match(body, /mergeSeatHolds\(/,
      `${fn} returns signups to a screen without merging seat_holds() — `
      + 'a stranger will be shown only the rows they may read, as if that were all of them');
    assert.match(body, /rpc\(['"]seat_holds['"]\)/,
      `${fn} does not ask for the aggregate it merges`);
  }
});

test('a write is not counted as a reader', () => {
  // The count is only meaningful if it means readers. cancelSignup and
  // decideSignup touch `signups` and must not appear.
  const actual = readPaths();
  for (const writer of ['cancelSignup', 'decideSignup', 'recordAttendance', 'saveProfileFields']) {
    assert.ok(!actual.some(p => p.startsWith(`${writer} →`)),
      `${writer} is being counted as a read path`);
  }
});

test('the extractor can still find anything at all', () => {
  // The failure mode of a source-reading test: the regex stops matching, the
  // list comes back empty, and every assertion above passes vacuously.
  assert.ok(readPaths().length >= 5, 'the extractor found almost nothing — it has stopped working');
  assert.ok(source.includes('mergeSeatHolds'), 'the file being read is not the backend');
});
