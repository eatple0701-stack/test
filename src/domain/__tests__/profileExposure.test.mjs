import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Who can read a participant's row. **Closed, on 2026-09-01.**
//
// ── What happened ───────────────────────────────────────────────────────
//
// Until that afternoon, `profiles` and `signups` were both
// `for select to authenticated using (true)`. On this app that is not "a
// member": every visitor is signed in anonymously on arrival so that
// browsing works before signup, so the role means anything that has loaded
// the page. Behind it sat 237 rows of display name, nationality, languages
// and gender.
//
//     before   GET /rest/v1/profiles?select=id  →  0-236/237
//     after    GET /rest/v1/profiles?select=id  →  0-3/4
//     after    GET /rest/v1/signups?select=id   →  */0
//
// Both measured on production from an anonymous session. The first scoped
// policy, written the same day, recursed (42P17) and was rolled back within
// minutes; the second went in with `security definer` helpers and was proved
// against a real Postgres first.
//
// ── What this file is for, now that it is closed ────────────────────────
//
// rlsPolicies.test.mjs runs the migration and proves the policy behaves.
// That says nothing about schema.sql — the file a fresh project runs — and
// if the two drift, a new environment comes up wide open while every test
// stays green. So this file asks one question the other cannot: does the
// schema define the same thing that was applied?
//
// It compares structure rather than searching for tokens. A check for
// "mentions auth.uid()" is the kind that passed for five different policies
// on the day this broke, one of which took production down.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

const RETRY = 'supabase/migrations/2026-09-01b-scope-profile-reads-retry.sql';

// The claims here are about SQL, not about the prose explaining it — and the
// prose quotes `using (true)` repeatedly.
const sqlOnly = (f) => read(f).split('\n').filter(l => !/^\s*--/.test(l)).join('\n');
const schema = sqlOnly('supabase/schema.sql');
const migration = sqlOnly(RETRY);

/** The body of one `create policy <name> …;` statement. */
const policy = (sql, name) => {
  const at = sql.indexOf(`create policy ${name} on`);
  return at < 0 ? null : sql.slice(at, sql.indexOf(';', at) + 1);
};

/** The body of one `create or replace function public.<name>(…) … $fn$…$fn$;` */
const fn = (sql, name) => {
  const at = sql.indexOf(`create or replace function public.${name}(`);
  if (at < 0) return null;
  const open = sql.indexOf('$fn$', at);
  const close = sql.indexOf('$fn$', open + 4);
  return close < 0 ? null : sql.slice(at, close + 4);
};

const tight = (s) => s?.replace(/\s+/g, '');
const OPEN = /using\s*\(\s*true\s*\)/;

const HELPERS = ['is_open_host', 'shares_a_table', 'at_same_table', 'seat_holds', 'tables_with_woman'];

// ── The exposure is closed ──────────────────────────────────────────────

test('the tables holding participant data are not readable by everybody', () => {
  for (const name of ['profiles_read', 'signups_read']) {
    const p = policy(schema, name);
    assert.ok(p, `${name} is missing from schema.sql`);
    assert.doesNotMatch(p, OPEN, `${name} is open to every session, anonymous ones included`);
    assert.match(p, /auth\.uid\(\)/, `${name} does not mention who is asking`);
  }
});

test('a person can still read their own row', () => {
  // The failure mode of over-tightening, and the one the first attempt
  // actually shipped: while it was live nobody could read the profile the
  // app was showing them.
  assert.match(policy(schema, 'profiles_read'), /id = auth\.uid\(\)/);
  assert.match(policy(schema, 'signups_read'), /user_id = auth\.uid\(\)/);
});

test('no policy queries the table it is defined on', () => {
  // This is the one that would have caught 42P17. `signups_read` queried
  // `public.signups` inside its own USING clause: evaluating the policy
  // required evaluating the policy. A `security definer` helper is exempt
  // from RLS, so the same lookup through one of those is fine — what is
  // checked is a bare self-reference.
  for (const [name, table] of [['profiles_read', 'profiles'], ['signups_read', 'signups']]) {
    const body = policy(schema, name).slice(policy(schema, name).indexOf('using'));
    const selfSelects = [...body.matchAll(new RegExp(`from public\\.${table}\\b`, 'g'))].length;
    assert.equal(selfSelects, 0, `${name} selects from public.${table} inside its own policy — 42P17`);
  }
});

test('every helper a policy leans on is security definer with a pinned path', () => {
  // Structural, because both properties are what make the recursion
  // impossible rather than unlikely: RLS does not apply inside a definer
  // function, and a pinned search_path stops a caller pointing `public` at a
  // schema of their own.
  for (const name of HELPERS) {
    const body = fn(schema, name);
    assert.ok(body, `${name} is missing from schema.sql`);
    assert.match(body, /security definer/, `${name} is not security definer`);
    assert.match(body, /set search_path = public/, `${name} does not pin search_path`);
  }
});

// ── schema.sql and the migration define the same database ───────────────

test('a fresh project comes up with the policies that were applied', () => {
  // The gap rlsPolicies.test.mjs cannot see. It runs the migration; nothing
  // runs schema.sql, so the two can drift and a new environment would come
  // up open while every other test stayed green.
  for (const name of ['profiles_read', 'signups_read']) {
    assert.equal(tight(policy(schema, name)), tight(policy(migration, name)),
      `${name} differs between schema.sql and the migration that was applied`);
  }
});

// Every migration that has actually been applied to production, oldest first.
//
// DELIBERATELY NOT the whole directory. 2026-09-01-scope-profile-reads.sql
// caused 42P17 and was rolled back; 2026-09-01d has not been applied and is
// waiting for approval. Comparing schema.sql against either would demand it
// declare something production does not have.
const APPLIED = [
  'supabase/migrations/2026-08-22-new-app-url.sql',
  RETRY,
  'supabase/migrations/2026-09-01c-seat-holds-lapse.sql',
  'supabase/migrations/2026-09-01e-signups-soft-cancel.sql',
  'supabase/migrations/2026-09-02a-rules-consents-history.sql',
];

/**
 * The last version of one function any applied migration left behind.
 *
 * This test used to compare every helper against 2026-09-01b, which was right
 * on the day it was written and became wrong twice over: 01c gave seat_holds
 * a clock and 01e taught it about withdrawn requests. Pinned to one file, the
 * test was asserting that schema.sql still held a definition production had
 * replaced — encoding the drift as the correct answer, in the file whose
 * entire job is to catch drift.
 */
const lastApplied = (name) => {
  let found = null;
  for (const file of APPLIED) {
    // anyFn, not fn: the old extractor looks only for $fn$ and, on a
    // plpgsql function quoted the other way, silently returns a slice
    // running to some later function - truthy, wrong, and it reported
    // assert_seat_decision_is_hosts as drifted while it was byte-identical.
    const body = anyFn(sqlOnly(file), name);
    if (body) found = { body, file };
  }
  return found;
};

test('the helpers do not drift from the last migration that defined them', () => {
  for (const name of HELPERS) {
    const latest = lastApplied(name);
    assert.ok(latest, `${name} is defined by no applied migration — check APPLIED`);
    assert.equal(tight(anyFn(schema, name)), tight(latest.body),
      `${name} in schema.sql is not what ${latest.file} left in production`);
  }
});

// ── Everything an applied migration left behind, not just the five ──────
//
// HELPERS is a hand-written list, and on 2026-09-01 it was the reason a day's
// worth of drift went unseen: seat_holds was on it and assert_seat_available
// was not, so schema.sql kept the pre-01c guard — the one that counts every
// signup row whatever its status — while every test stayed green. The bug
// that closes a four-seat table after three refusals was live in the file a
// fresh project is built from, and the audit that found it was a person
// reading two files side by side.
//
// So the list stops being hand-written. Whatever an applied migration
// defines, schema.sql has to declare too.

/**
 * The body of any `create or replace function public.<name>(…)`.
 *
 * This file uses two dollar quotings — $fn$ for the sql-language helpers and a
 * bare doubled dollar for the plpgsql ones — so the delimiter has to be
 * whichever opens FIRST after the header. Choosing by preference instead
 * matched a $fn$ belonging to a function further down the file and reported
 * assert_seat_available as drifted when it was byte-identical.
 */
const anyFn = (sql, name) => {
  const at = sql.indexOf(`create or replace function public.${name}(`);
  if (at < 0) return null;
  const candidates = ['$fn$', '$$']
    .map(q => ({ q, open: sql.indexOf(q, at) }))
    .filter(c => c.open >= 0)
    .sort((a, b) => a.open - b.open);
  if (!candidates.length) return null;
  const { q, open } = candidates[0];
  const close = sql.indexOf(q, open + q.length);
  return close < 0 ? null : sql.slice(at, close + q.length);
};

const declaredBy = (file) => {
  const sql = sqlOnly(file);
  return {
    functions: [...sql.matchAll(/create or replace function public\.(\w+)\s*\(/g)].map(m => m[1]),
    policies: [...sql.matchAll(/create policy (\w+) on public\.(\w+)/g)]
      .map(m => ({ name: m[1], table: m[2] })),
    columns: [...sql.matchAll(/alter table public\.(\w+)\s+add column if not exists (\w+)/g)]
      .map(m => ({ table: m[1], column: m[2] })),
  };
};

test('every function an applied migration defines is in schema.sql, with the same body', () => {
  const seen = new Set();
  for (const file of APPLIED) for (const name of declaredBy(file).functions) seen.add(name);
  assert.ok(seen.size >= 6, `only ${seen.size} functions found across the applied migrations`);

  for (const name of seen) {
    const latest = lastApplied(name);
    const mine = anyFn(schema, name);
    assert.ok(mine, `public.${name}() is defined by an applied migration and absent from schema.sql`);
    assert.ok(latest, `public.${name}() could not be extracted from any applied migration`);
    assert.equal(tight(mine), tight(latest.body),
      `public.${name}() in schema.sql is not the version that was applied`);
  }
});

test('every policy and column an applied migration adds is in schema.sql', () => {
  for (const file of APPLIED) {
    const { policies, columns } = declaredBy(file);
    for (const p of policies) {
      assert.ok(schema.includes(`create policy ${p.name} on public.${p.table}`),
        `${p.name} on ${p.table} was applied by ${file} and schema.sql does not create it`);
    }
    for (const c of columns) {
      assert.ok(
        new RegExp(`alter table public\\.${c.table}\\s+add column if not exists ${c.column}\\b`).test(schema),
        `${c.table}.${c.column} was applied by ${file} and schema.sql does not add it`);
    }
  }
});

test('the helper comparison is reading more than one migration', () => {
  // Without this the test above could pass by comparing everything against a
  // single file, which is the state it was just fixed out of. seat_holds has
  // been redefined since 01b and tables_with_woman has not, so the two must
  // come from different places.
  assert.equal(lastApplied('seat_holds').file,
    'supabase/migrations/2026-09-01e-signups-soft-cancel.sql');
  assert.equal(lastApplied('tables_with_woman').file,
    'supabase/migrations/2026-09-01e-signups-soft-cancel.sql');
  assert.equal(lastApplied('shares_a_table').file, RETRY);
});

test('seat_holds is the only thing a stranger gets, and it names nobody', () => {
  // Verified on production the day it landed: an anonymous session that
  // reads zero signup rows still got [{table_id, status}] back, and the card
  // rendered "2 going · 2자리 남음". The shape is what makes that safe, so
  // the shape is what is asserted — a column added later "just for the
  // avatar" would pass every count check in rlsPolicies.test.mjs.
  const body = fn(schema, 'seat_holds');
  assert.match(body, /returns table \(table_id uuid, status text\)/,
    'seat_holds returns something other than a table id and a status');
  assert.doesNotMatch(body, /\bs\.user_id\b|\bs\.name\b|\bs\.nationality\b|\bs\.note\b|\bs\.gender\b/,
    'seat_holds selects a column that identifies somebody');

  // Declined requests being excluded used to be asserted here as
  // /'pending', 'accepted'/ against the source text. It is not asserted here
  // any more, and the reason is worth keeping: 2026-09-01c rewrote the same
  // rule as an explicit two-branch condition with a clock in it, which
  // excludes declined requests exactly as before and does not contain that
  // string. A source-text check would have failed a correct change and — the
  // dangerous half — would have passed a broken one that happened to keep the
  // words. seatLapse.test.mjs executes the question against a real Postgres
  // instead: "a declined request never held one", with rows.
});

// ── The record of how it went wrong ─────────────────────────────────────

test('the failed attempt is still written down where the next person will find it', () => {
  const mig = read('supabase/migrations/2026-09-01-scope-profile-reads.sql');
  assert.match(mig, /DO NOT RUN THIS FILE/);
  assert.match(mig, /infinite recursion detected in policy for relation "signups"/);
  // The mistake before the mistake, which is the part worth keeping.
  assert.match(mig, /checked the \*text\* of the SQL/);
});

test('the replacement carries the verification it was proved with', () => {
  const retry = read(RETRY);
  assert.match(retry, /\nrollback;\s*$/,
    'the file a human is told to paste no longer ends in rollback');
  assert.match(retry, /member_sees_own_row/, 'the pass criteria do not check a plain member');
  const runner = read('src/domain/__tests__/rlsPolicies.test.mjs');
  assert.match(runner, /2026-09-01b-scope-profile-reads-retry\.sql/,
    'nothing executes the migration this repo ships');
});

test('the decisions behind the shape are recorded, not just the shape', () => {
  const doc = read('docs/public-table-columns.md');
  for (const term of ['chat_url', 'meeting_note', 'host_nationality', 'is_sample', 'seat_holds']) {
    assert.ok(doc.includes(term), `${term} is not covered by the decision document`);
  }
  // The two that are easiest to lose and hardest to re-derive.
  assert.match(doc, /30일|thirty/, 'the date window on is_open_host is not explained');
  assert.match(doc, /호스트만/, 'the host-only choice for the women filter is not explained');
});

// ── Unaffected, and worth keeping green ─────────────────────────────────

test('the tables that are public are public on purpose', () => {
  // Listed so a third one appearing is a decision somebody makes rather than
  // a line that slips in. `tables` is on this list and should not stay —
  // host_nationality, chat_url and meeting_note still ride on it. That is
  // track 2 in docs/public-table-columns.md.
  const open = [...schema.matchAll(/create policy (\w+) on public\.(\w+)\s+for select to authenticated using \(\s*true\s*\)/g)]
    .map(m => m[1]).sort();
  assert.deepEqual(open, ['reviews_read', 'tables_read']);
});
