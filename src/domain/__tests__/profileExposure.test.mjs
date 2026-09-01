import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Who can read a participant's row. **Open, and known to be open.**
//
// ── The state this file records ────────────────────────────────────────
//
// An anonymous session — the one this app hands everybody on their first
// load, before they have signed up for anything — can read every row of
// `profiles`. Measured on production on 2026-09-01, day one of 2차 운영:
//
//     GET /rest/v1/profiles?select=id  →  content-range: 0-236/237
//     role: authenticated, is_anonymous: true
//
// Only the count was read. Nobody's row was opened.
//
// A scoped replacement was written, applied, and rolled back the same hour:
// it recursed (42P17), and while it was live nothing could read a profile at
// all, including its owner. The post-mortem is at the bottom of
// supabase/migrations/2026-09-01-scope-profile-reads.sql.
//
// ── Why the five checks below are `todo` and not deleted ───────────────
//
// They assert the state we want and do not have. Deleting them would lose
// the specification; making them pass would mean asserting that the current
// policy is fine, which is the one thing it is not. `todo` is the honest
// third option: the suite stays green, the runner prints them every time,
// and the day the fix lands they are un-todo'd rather than reinvented.
//
// The two tests that are NOT todo are true today: the failure is written
// down where the next person will find it, and the decision that has to be
// made first exists as a document.
//
// ── The order this has to happen in ───────────────────────────────────
//
// 1. Decide what `tables` publishes — docs/public-table-columns.md. Locking
//    `profiles` while host_name, host_nationality and host_gender sit on a
//    world-readable `tables` row locks a door beside an open window.
// 2. Break the recursion with `security definer` helpers. Inside such a
//    function RLS does not apply, so policy re-entry is impossible by
//    construction rather than by care.
// 3. Verify inside a transaction and commit only on a positive result —
//    `profiles_visible` is a single digit — never on the absence of an
//    error. Recursion aborts the transaction and production keeps the old
//    policy.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

// The claims here are about SQL, not about the prose explaining it — and the
// prose quotes `using (true)` repeatedly.
const sqlOnly = (f) => read(f).split('\n').filter(l => !/^\s*--/.test(l)).join('\n');
const schema = sqlOnly('supabase/schema.sql');

/** The body of one `create policy <name> …;` statement. */
const policy = (sql, name) => {
  const at = sql.indexOf(`create policy ${name} on`);
  return at < 0 ? null : sql.slice(at, sql.indexOf(';', at) + 1);
};

const OPEN = /using\s*\(\s*true\s*\)/;

// ── True today ──────────────────────────────────────────────────────────

test('schema.sql says what is actually live, including the part that is wrong', () => {
  // A repo that describes a database it does not have is worse than one that
  // admits the gap. These two policies are open right now and the file has
  // to say so, with the reason next to it.
  for (const name of ['profiles_read', 'signups_read']) {
    const p = policy(schema, name);
    assert.ok(p, `${name} is missing from schema.sql`);
    assert.match(p, OPEN, `${name} is no longer open — un-todo the checks below`);
  }
  const src = read('supabase/schema.sql');
  assert.match(src, /ROLLED BACK 2026-09-01/);
  assert.match(src, /42P17/, 'the reason it was rolled back is not recorded');
});

test('the failed attempt is written down where the next person will find it', () => {
  const mig = read('supabase/migrations/2026-09-01-scope-profile-reads.sql');
  assert.match(mig, /DO NOT RUN THIS FILE/);
  assert.match(mig, /infinite recursion detected in policy for relation "signups"/);
  // The mistake before the mistake, which is the part worth keeping.
  assert.match(mig, /checked the \*text\* of the SQL/);
  assert.match(mig, /security definer/);
  // And the verification shape the next attempt must use.
  assert.match(mig, /rollback;/);
  assert.match(mig, /profiles_visible/);
});

test('the decision that has to come first exists as a document', () => {
  const doc = read('docs/public-table-columns.md');
  // The columns that leak past any profiles policy.
  for (const col of ['chat_url', 'meeting_note', 'host_nationality', 'host_gender']) {
    assert.ok(doc.includes(col), `${col} is not covered by the proposal`);
  }
  // And the two places the sketch conflicted with what the app promises.
  assert.match(doc, /safetyPromise|안전 섹션/);
  assert.match(doc, /has_woman/);
});

// ── The state we want, and do not yet have ─────────────────────────────

const WHY = 'profiles/signups are open: the scoped policy recursed (42P17) and was '
  + 'rolled back 2026-09-01. Un-todo when the security-definer version lands.';

test('the tables holding participant data are not readable by everybody', { todo: WHY }, () => {
  for (const name of ['profiles_read', 'signups_read']) {
    const p = policy(schema, name);
    assert.doesNotMatch(p, OPEN, `${name} is open to every session, anonymous ones included`);
    assert.match(p, /auth\.uid\(\)/, `${name} does not mention who is asking`);
  }
});

test('a person can still read their own row', { todo: WHY }, () => {
  // The failure mode of over-tightening — and, as it turned out, of the
  // recursion too: while the scoped policy was live, a person could not read
  // the profile the app was showing them.
  assert.match(policy(schema, 'profiles_read'), /id = auth\.uid\(\)/);
  assert.match(policy(schema, 'signups_read'), /user_id = auth\.uid\(\)/);
});

test('no policy queries the table it is defined on', { todo: WHY }, () => {
  // This is the one that would have caught it. `signups_read` queried
  // `public.signups` inside its own USING clause: evaluating the policy
  // requires evaluating the policy. A helper marked `security definer` is
  // exempt from RLS, so the same lookup through one of those is fine — the
  // check is for a bare self-reference.
  for (const [name, table] of [['profiles_read', 'profiles'], ['signups_read', 'signups']]) {
    const p = policy(schema, name);
    const body = p.slice(p.indexOf('using'));
    const selfSelects = [...body.matchAll(new RegExp(`from public\\.${table}\\b`, 'g'))].length;
    assert.equal(selfSelects, 0, `${name} selects from public.${table} inside its own policy — 42P17`);
  }
});

test('the reads the app actually performs are still permitted', { todo: WHY }, () => {
  // Three cross-user reads exist and all three are legitimate: the host card
  // before anybody has asked to join, guest avatars at a table you host, and
  // guests at a table you are also sitting at. If the policy stops covering
  // one, the app breaks quietly — a null avatar, a host card with no host.
  const p = policy(schema, 'profiles_read');
  assert.match(p, /cancelled_at is null/);
  assert.match(p, /host_id = auth\.uid\(\)/);
});

test('the migration and schema.sql do not drift', { todo: WHY }, () => {
  // Whitespace removed rather than collapsed: two files written by people
  // will never agree on line breaks, and there are no string literals in
  // either policy.
  const mig = sqlOnly('supabase/migrations/2026-09-01-scope-profile-reads.sql');
  const same = (s) => s?.replace(/\s+/g, '');
  for (const name of ['profiles_read', 'signups_read']) {
    assert.equal(same(policy(schema, name)), same(policy(mig, name)), `${name} differs`);
  }
});

// ── Unaffected, and worth keeping green ────────────────────────────────

test('the tables that are public are public on purpose', () => {
  // Listed so a third one appearing is a decision somebody makes rather than
  // a line that slips in. `tables` is on this list today and should not stay
  // — see docs/public-table-columns.md.
  const open = [...schema.matchAll(/create policy (\w+) on public\.(\w+)\s+for select to authenticated using \(\s*true\s*\)/g)]
    .map(m => m[1]).sort();
  assert.deepEqual(open, ['profiles_read', 'reviews_read', 'signups_read', 'tables_read']);
});
