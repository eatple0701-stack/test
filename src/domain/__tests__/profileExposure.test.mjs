import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Who can read a participant's row.
//
// ── What was measured, on production, on 2026-09-01 ─────────────────────
//
// An anonymous session — the one this app hands everybody on their first
// load, before they have signed up for anything — could read every row of
// `profiles`. 237 of them, on day one of 2차 운영, each carrying a display
// name, a nationality, the languages somebody speaks and their gender.
//
//     GET /rest/v1/profiles?select=id  →  content-range: 0-236/237
//     role: authenticated, is_anonymous: true
//
// Only the count was read. Nobody's row was opened.
//
// One word did it: `for select to authenticated using (true)`.
// `authenticated` reads like "a member". Here it is not — the app signs
// everybody in anonymously on arrival so that browsing works before signup,
// so it means "anybody who has ever loaded the page".
//
// ── Why this test reads SQL instead of running it ──────────────────────
//
// There is no Postgres in the test environment, so the policy cannot be
// executed here. What can be pinned is the shape: that the two tables
// holding participant data are not readable by everybody, that the
// migration which fixes the live database exists, and that the schema file
// and the migration have not drifted apart. Editing schema.sql changes
// nothing that is already running — the migration is the file that has to
// be pasted into the SQL editor — and this test is what stops one of them
// being updated without the other.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

// The claims below are about SQL, not about the prose explaining it — and
// the prose quotes `using (true)` several times, which is exactly the trap
// that made two assertions in the previous batch pass on a comment.
const sqlOnly = (f) => read(f).split('\n').filter(l => !/^\s*--/.test(l)).join('\n');

const schema = sqlOnly('supabase/schema.sql');
const MIGRATION = 'supabase/migrations/2026-09-01-scope-profile-reads.sql';

/** The body of one `create policy <name> …;` statement. */
const policy = (sql, name) => {
  const at = sql.indexOf(`create policy ${name} on`);
  if (at < 0) return null;
  return sql.slice(at, sql.indexOf(';', at) + 1);
};

test('the tables holding participant data are not readable by everybody', () => {
  for (const name of ['profiles_read', 'signups_read']) {
    const p = policy(schema, name);
    assert.ok(p, `${name} is missing from schema.sql — RLS with no select policy denies everything`);
    assert.doesNotMatch(
      p, /using\s*\(\s*true\s*\)/,
      `${name} is open to every session, anonymous ones included`,
    );
    // The test that makes it a relationship rather than a different constant.
    assert.match(p, /auth\.uid\(\)/, `${name} does not mention who is asking`);
  }
});

test('a person can still read their own row', () => {
  // The failure mode of over-tightening: a policy so strict the profile
  // screen cannot read the profile it is showing you.
  assert.match(policy(schema, 'profiles_read'), /id = auth\.uid\(\)/);
  assert.match(policy(schema, 'signups_read'), /user_id = auth\.uid\(\)/);
});

test('the reads the app actually performs are still permitted', () => {
  // Three cross-user reads exist, and all three are legitimate. If the
  // policy stops covering one of them the app breaks silently — a null
  // avatar, a host card that renders nothing — so each is pinned to the
  // clause that allows it.
  const p = policy(schema, 'profiles_read');
  // supabaseBackend.js: select('name, avatar_url, languages').eq('id', hostId)
  // for a host whose table is on screen, before anybody has asked to join.
  assert.match(p, /t\.host_id = public\.profiles\.id and t\.cancelled_at is null/);
  // SIGNUP_COLUMNS = '*, profiles (avatar_url)' — guests at a table you host,
  assert.match(p, /s\.user_id = public\.profiles\.id\s*\n?\s*and t\.host_id = auth\.uid\(\)|where s\.user_id = public\.profiles\.id/);
  // and guests at a table you are also sitting at.
  assert.match(p, /theirs\.user_id = public\.profiles\.id/);
});

test('the migration that changes the live database exists and matches', () => {
  // schema.sql is documentation. The live policies only change when somebody
  // runs the migration, and the two drifting apart is how a repo comes to
  // describe a database that does not exist.
  assert.ok(fs.existsSync(path.join(root, MIGRATION)), `${MIGRATION} is missing`);
  const mig = sqlOnly(MIGRATION);
  // Whitespace removed entirely, not collapsed. These two files are written
  // and read by people and will never agree on where to break a line; what
  // must not differ is the statement. There are no string literals in either
  // policy, so whitespace carries nothing here.
  const same = (s) => s?.replace(/\s+/g, '');
  for (const name of ['profiles_read', 'signups_read']) {
    const a = same(policy(schema, name));
    const b = same(policy(mig, name));
    assert.ok(b, `${name} is not in the migration`);
    assert.equal(a, b, `${name} differs between schema.sql and the migration`);
  }
  // It has to be reversible: this lands on a live pilot, and the answer to
  // "something broke" must be one paste, not a debugging session.
  assert.match(read(MIGRATION), /Rollback/i);
  assert.match(read(MIGRATION), /using \(true\)/, 'the rollback does not restore the previous policy');
});

test('the tables that are public are public on purpose', () => {
  // Two policies keep `using (true)` and should: a table nobody can see is
  // not a table, and a review exists to be read by the next stranger
  // deciding whether to sit down. Listed so that a third one appearing is a
  // decision somebody makes rather than a line that slips in.
  const open = [...schema.matchAll(/create policy (\w+) on public\.(\w+)\s+for select to authenticated using \(\s*true\s*\)/g)]
    .map(m => m[1]);
  assert.deepEqual(open.sort(), ['reviews_read', 'tables_read']);
});
