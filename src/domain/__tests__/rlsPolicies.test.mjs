import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// The RLS policies, executed rather than read.
//
// ── Why this file exists ────────────────────────────────────────────────
//
// On 2026-09-01 a scoped `profiles`/`signups` policy was written, reviewed,
// covered by five tests, applied to production, and immediately rolled back:
// it recursed. `signups_read` asked a question about `signups` inside its own
// USING clause, so evaluating the policy required evaluating the policy, and
// both tables returned 42P17 to everybody — including a person reading their
// own row.
//
// All five tests checked the *text* of the SQL. Not one asked whether it
// runs, because nothing in this repo could run Postgres. That inability was
// the signal and it was read as an obstacle.
//
// PGlite is Postgres compiled to wasm. It runs the real planner, so it
// enforces RLS, resolves `security definer`, and raises 42P17 for the same
// reasons the real database does. The migration file is executed here
// verbatim — not transcribed — so a policy this repo ships cannot again be
// one nobody has run.
//
// The control below matters more than the rest of the file. It applies the
// policy that failed and requires it to fail here too. If the harness ever
// stops reproducing 42P17, it has stopped being able to detect it, and every
// other assertion in this file becomes decoration.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

const RETRY = 'supabase/migrations/2026-09-01b-scope-profile-reads-retry.sql';
const FAILED = 'supabase/migrations/2026-09-01-scope-profile-reads.sql';

// Production's shape: postgres owns the tables, RLS is on, nothing is marked
// `force row level security` — which is what lets a `security definer`
// function see past the policies and so end the recursion.
const BOOTSTRAP = `
create role anon;
create role authenticated;
create schema auth;
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid
$fn$;
grant usage on schema auth, public to anon, authenticated;

create table public.profiles (
  id uuid primary key,
  name text, nationality text, gender text,
  languages text[] default '{}',
  is_verified_host boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id),
  host_name text, host_nationality text, host_gender text,
  date date, seats int, cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.signups (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id),
  user_id uuid not null references public.profiles(id),
  name text, nationality text, note text default '', gender text,
  status text default 'accepted',
  created_at timestamptz not null default now(),
  unique (table_id, user_id)
);
alter table public.profiles enable row level security;
alter table public.tables   enable row level security;
alter table public.signups  enable row level security;
grant select on all tables in schema public to anon, authenticated;

-- 237 people, which is the number production has.
insert into public.profiles (id, name, nationality, gender)
select ('00000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
       'person ' || i, 'Somewhere', case when i % 2 = 0 then 'Woman' else 'Man' end
from generate_series(1, 237) i;

-- The two real tables, fifteen days apart, as on production — but written
-- relative to today rather than as the literal August dates they have there.
-- is_open_host() has a thirty-day window in it now, so fixed dates would make
-- this file quietly stop testing anything a month from now: every table would
-- fall out of the window and the assertions would keep passing for the wrong
-- reason.
insert into public.tables (id, host_id, host_name, date, seats, created_at) values
  ('11111111-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000001', 'host one', current_date - 26, 4, now() - interval '28 days'),
  ('11111111-0000-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000002', 'host two', current_date + 5,  4, now() - interval '13 days');

-- A meal from months ago. Its host is the whole point of the date window: they
-- once held an open invitation and no longer do, so a stranger has no business
-- reading their row. Their guest still does, through shares_a_table.
insert into public.tables (id, host_id, host_name, date, seats, created_at) values
  ('11111111-0000-4000-8000-000000000004',
   '00000000-0000-4000-8000-000000000004', 'host four', current_date - 200, 4, now() - interval '205 days');

-- A table that was called off, with somebody who had asked for a seat at it.
-- Its host is deliberately NOT covered by is_open_host, so this pair is the
-- only thing exercising the host-and-guest branch of shares_a_table. Without
-- it, breaking that branch on purpose still passed every assertion here.
insert into public.tables (id, host_id, host_name, date, seats, created_at, cancelled_at) values
  ('11111111-0000-4000-8000-000000000003',
   '00000000-0000-4000-8000-000000000003', 'host three', current_date + 2, 4, now() - interval '7 days', now() - interval '4 days');

insert into public.signups (table_id, user_id, name) values
  ('11111111-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000010', 'guest a'),
  ('11111111-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'guest b'),
  ('11111111-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', 'guest c'),
  ('11111111-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000013', 'guest d'),
  ('11111111-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000014', 'guest e');

-- One request still waiting on the host, and one already turned down. They
-- hold different numbers of seats and neither may be attributed to anybody by
-- a stranger, which is what seat_holds() has to get right.
insert into public.signups (table_id, user_id, name, status, gender) values
  ('11111111-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000015', 'guest f', 'pending', 'Woman'),
  ('11111111-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000016', 'guest g', 'declined', 'Woman');
`;

const OPEN_POLICIES = `
drop policy if exists profiles_read on public.profiles;
drop policy if exists tables_read   on public.tables;
drop policy if exists signups_read  on public.signups;
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy tables_read   on public.tables   for select to authenticated using (true);
create policy signups_read  on public.signups  for select to authenticated using (true);
`;

const HOST_ONE  = '00000000-0000-4000-8000-000000000001';
const HOST_TWO  = '00000000-0000-4000-8000-000000000002';
const GUEST     = '00000000-0000-4000-8000-000000000010'; // at table one
const NEIGHBOUR = '00000000-0000-4000-8000-000000000011'; // at table one too
const ELSEWHERE = '00000000-0000-4000-8000-000000000012'; // at table two
const UNSEATED  = '00000000-0000-4000-8000-0000000000ff'; // no profile row at all
const CALLED_OFF_HOST = '00000000-0000-4000-8000-000000000003';
const JILTED    = '00000000-0000-4000-8000-000000000013'; // asked for a seat at it
const PLAIN     = '00000000-0000-4000-8000-000000000050'; // a profile, nothing else
const LONG_AGO_HOST = '00000000-0000-4000-8000-000000000004'; // hosted 200 days ago
const LONG_AGO_GUEST = '00000000-0000-4000-8000-000000000014';
const TABLE_TWO = '11111111-0000-4000-8000-000000000002';
const TABLE_ONE = '11111111-0000-4000-8000-000000000001';

/**
 * The statements between `begin;` and `commit;` — the policy itself, without
 * the transaction around it.
 *
 * The wrapper is stripped rather than kept because a batch containing its own
 * `commit;` closes the transaction PGlite opened for the batch, and every
 * statement after that reports 25P02 instead of its own result. That produces
 * exactly the failure this file exists to rule out — a red that says nothing
 * about the SQL — so the transaction is left to the caller.
 */
const policyPart = (file) => {
  const sql = read(file);
  return sql.slice(sql.indexOf('\nbegin;') + '\nbegin;'.length, sql.indexOf('\ncommit;'));
};

const db = new PGlite();
await db.exec(BOOTSTRAP);
await db.exec(OPEN_POLICIES);

/**
 * Run `sql` as a signed-in person, in a transaction that is thrown away.
 *
 * The rollback in the catch is not tidiness. When a statement raises — which
 * is the whole point of the control below — the trailing `rollback;` of the
 * batch never runs, and every later query on this connection answers 25P02,
 * "current transaction is aborted", instead of doing its job. Without this,
 * one expected failure turns the rest of the file into reds that say nothing
 * about the SQL. It did, for three runs.
 */
async function as(uid, sql) {
  let out;
  try {
    out = await db.exec(
      `begin;
       select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true);
       set local role authenticated;
       ${sql}
       rollback;`);
  } catch (e) {
    await db.exec('rollback;').catch(() => {});
    throw e;
  }
  // The statement that was asked for is the one before `rollback;` — taken by
  // position, not by looking for the last result that happens to have rows in
  // it. That earlier version silently answered with the `set_config` row
  // whenever the real query returned nothing, so every "sees no rows" test
  // read 1 instead of 0 and two of them were vacuous until this line changed.
  return out[out.length - 2]?.rows ?? [];
}

const visibleTo = async (uid) =>
  (await as(uid, 'select id from public.profiles;')).map(r => r.id);

// ── The control ─────────────────────────────────────────────────────────

test('this harness reproduces the failure it was written for', async () => {
  await db.exec(policyPart(FAILED));
  let message = '';
  try {
    await as(GUEST, 'select count(*) from public.profiles;');
  } catch (e) { message = e.message; }
  await db.exec(OPEN_POLICIES);

  assert.match(message, /infinite recursion detected in policy/i,
    'the policy that took production down does not fail here, so this file '
    + 'cannot prove anything about the one that replaced it');
  assert.match(message, /"signups"/, 'the recursion is reported on the wrong relation');
});

// ── The file this repo actually ships ───────────────────────────────────

test('the retry runs, and its own verification block reports a closed table', async () => {
  // Verbatim, including the trailing `rollback;`. This is the paste the human
  // is asked to make, run exactly as they will run it.
  const out = await db.exec(read(RETRY));
  const rows = [...out].reverse().find(r => r.rows?.length && r.rows[0].step)?.rows;
  assert.ok(rows, 'the file produced no table of numbers');
  const n = Object.fromEntries(rows.map(r => [r.step, Number(r.number)]));

  // Positive criteria, in the form the pass conditions were written in.
  assert.equal(n.profiles_total, 237, 'the fixture is not the size production is');
  assert.ok(n.stranger_sees_profiles < 10,
    `stranger_sees_profiles should be a single digit, got ${n.stranger_sees_profiles}`);
  assert.equal(n.host_sees_own_row, 1, 'a host cannot read their own row');
  assert.ok(n.host_sees_profiles < 10,
    `host_sees_profiles should be a single digit, got ${n.host_sees_profiles}`);
});

test('running the file as written changes nothing — it ends in rollback', async () => {
  // The whole point of the shape the retry uses. If this ever fails, a human
  // pasting it to "just see the numbers" would be altering production.
  const live = await db.query(
    `select qual from pg_policies where tablename = 'profiles' and policyname = 'profiles_read'`);
  assert.equal(live.rows.length, 1);
  assert.match(live.rows[0].qual, /true/, 'the verification run left a policy behind');

  const fns = await db.query(
    `select proname from pg_proc where proname in ('is_open_host', 'shares_a_table')`);
  assert.equal(fns.rows.length, 0, 'the helper functions survived a rolled-back transaction');
});

// ── What it does once it is committed ───────────────────────────────────

//
// Each of these applies the migration for real — same file, `commit;` in place
// of `rollback;`. Flat rather than nested because docsHonesty.test.mjs counts
// `^test(` and refuses to guess at an indented one, and a test count that has
// to be guessed at is the thing that produced a red baseline on 8/30.

let committed = false;
async function ensureCommitted() {
  if (committed) return;
  await db.exec(read(RETRY).replace(/\nrollback;\s*$/, '\ncommit;\n'));
  committed = true;
}

test('a visitor who has joined nothing sees only the hosts of open tables', async () => {
  await ensureCommitted();
  assert.deepEqual([...await visibleTo(UNSEATED)].sort(), [HOST_ONE, HOST_TWO].sort());
});

test('a guest reads themselves, their host, and the person beside them', async () => {
  await ensureCommitted();
  const seen = await visibleTo(GUEST);
  assert.ok(seen.includes(GUEST), 'cannot read their own row');
  assert.ok(seen.includes(HOST_ONE), 'cannot read the host of the table they joined');
  assert.ok(seen.includes(NEIGHBOUR), 'cannot read the person sitting beside them');
});

test('a guest at somebody else’s table is not part of your evening', async () => {
  await ensureCommitted();
  const seen = await visibleTo(GUEST);
  // HOST_TWO stays readable — hosting an open table is a public act by design.
  // Their guest is not.
  assert.ok(!seen.includes(ELSEWHERE), 'a guest at a different table is readable');
  assert.ok(!seen.includes('00000000-0000-4000-8000-000000000050'),
    'somebody at no table at all is readable');
});

test('a plain member reads their own row and nothing else', async () => {
  // 235 of the 237 are this: a profile, no table, no seat. Two breaks had to
  // be tried before this test existed — deleting `id = auth.uid()` from the
  // policy outright left every other assertion green, because the only person
  // whose own row was being checked was a host, and a host is readable through
  // is_open_host anyway.
  await ensureCommitted();
  const seen = await visibleTo(PLAIN);
  assert.ok(seen.includes(PLAIN), 'a member cannot read their own profile');
  assert.deepEqual([...seen].sort(), [PLAIN, HOST_ONE, HOST_TWO].sort(),
    'a member sees more than themselves and the open hosts');
});

test('calling a table off does not hide the host from the people who asked', async () => {
  // The only test that exercises the host-and-guest branch of shares_a_table
  // on its own. Everywhere else the host is visible through is_open_host too,
  // so breaking this branch on purpose stayed green until this table existed.
  await ensureCommitted();
  const seen = await visibleTo(JILTED);
  assert.ok(seen.includes(CALLED_OFF_HOST),
    'the guest of a cancelled table can no longer see who cancelled on them');
  assert.ok(!(await visibleTo(PLAIN)).includes(CALLED_OFF_HOST),
    'the host of a cancelled table is readable by people with no connection to it');
});

test('hostRecord() still finds the host it renders', async () => {
  // supabaseBackend.js:630 — the one cross-user read the app makes by hand.
  // If this stops working the host card renders with no host, silently.
  await ensureCommitted();
  const rows = await as(UNSEATED,
    `select name, languages from public.profiles where id = '${HOST_ONE}';`);
  assert.equal(rows.length, 1, 'the host card would render with no host');
});

test('the avatar stack at your own table still has faces', async () => {
  // The `*, profiles (avatar_url)` embed on listSignups().
  await ensureCommitted();
  const rows = await as(GUEST,
    `select p.id from public.signups s join public.profiles p on p.id = s.user_id
      where s.table_id = '${TABLE_ONE}';`);
  assert.equal(rows.length, 2, 'faces disappear from a table you are sitting at');
});


test('a host who last cooked months ago is no longer public', async () => {
  // The date window. Without it `cancelled_at is null` alone means anybody who
  // has ever hosted stays readable for good, so the exposure only ever grows.
  await ensureCommitted();
  assert.ok(!(await visibleTo(PLAIN)).includes(LONG_AGO_HOST),
    'a host from 200 days ago is still readable by a stranger');
  // And nothing is actually lost: their guest keeps them, with no time limit.
  assert.ok((await visibleTo(LONG_AGO_GUEST)).includes(LONG_AGO_HOST),
    'the guest of a long-past table can no longer see who cooked for them');
});

// ── signups: closed, with the seat counts kept ──────────────────────────

test('a stranger reads no signup rows at all', async () => {
  await ensureCommitted();
  const rows = await as(UNSEATED, 'select id from public.signups;');
  assert.equal(rows.length, 0, 'names, nationalities and free-text notes are still readable');
});

test('a host reads every request at their own table, and only there', async () => {
  await ensureCommitted();
  const rows = await as(HOST_TWO, 'select table_id from public.signups;');
  assert.ok(rows.length > 0, 'a host cannot see who asked for a seat — the approval queue is empty');
  assert.ok(rows.every(r => r.table_id === TABLE_TWO), 'a host reads signups at tables they do not host');
});

test('a guest reads the table they are sitting at, and no other', async () => {
  await ensureCommitted();
  const rows = await as(GUEST, 'select table_id from public.signups;');
  assert.equal(rows.length, 2, 'a guest cannot see who else is coming to their own meal');
  assert.ok(rows.every(r => r.table_id === TABLE_ONE));
});

test('seat_holds gives a stranger the count without the people', async () => {
  // The whole reason signups could be closed today. Two accepted at table one,
  // one accepted plus one pending at table two, one at the cancelled table and
  // one at the long-past one. The cancelled table's seats do not count, and
  // neither does the declined request.
  await ensureCommitted();
  const rows = await as(UNSEATED, 'select table_id, status from public.seat_holds();');
  const perTable = {};
  for (const r of rows) perTable[r.table_id] = (perTable[r.table_id] ?? 0) + 1;
  assert.equal(perTable[TABLE_ONE], 2, 'the seat counter on table one would be wrong');
  assert.equal(perTable[TABLE_TWO], 2, 'a pending request must still hold its seat');
  assert.equal(perTable['11111111-0000-4000-8000-000000000003'], undefined,
    'a cancelled table still reports seats taken');
  assert.ok(rows.every(r => r.status !== 'declined'),
    'a stranger can count how many people a host turned away');
});

test('seat_holds cannot be made to name anybody', async () => {
  // A count is only anonymous if the shape carries nothing else. This asserts
  // the columns rather than the values, because a future column added "just
  // for the avatar" would pass every count assertion above while undoing the
  // reason the function exists.
  await ensureCommitted();
  const { rows } = await db.query(
    `select p.proname, pg_get_function_result(p.oid) as result
       from pg_proc p where p.proname = 'seat_holds'`);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].result, 'TABLE(table_id uuid, status text)',
    'seat_holds returns something other than a table id and a status');

  await assert.rejects(
    () => as(UNSEATED, 'select user_id from public.seat_holds();'),
    /user_id/, 'seat_holds exposes a user id');
});

test('the women filter is answered without publishing anybody’s gender', async () => {
  // Table two has a pending request from a woman; table one has neither a
  // woman host nor a woman guest. The stranger learns which tables match and
  // nothing else — no gender column and no per-table boolean is readable.
  await ensureCommitted();
  const ids = (await as(UNSEATED, 'select * from public.tables_with_woman();'))
    .map(r => r.tables_with_woman ?? r.id ?? Object.values(r)[0]);
  assert.ok(ids.includes(TABLE_TWO), 'a table with a woman at it is not being matched');
  assert.ok(!ids.includes(TABLE_ONE), 'a table with no woman at it is being matched');

  // And the raw genders stay unreadable, which is the point of asking at all.
  const leaked = await as(UNSEATED, 'select gender from public.signups;');
  assert.equal(leaked.length, 0, 'the gender column is readable after all');
});

test('the helpers are all security definer with a pinned search_path', async () => {
  // `security definer` is what lets a policy ask about signups without
  // re-entering signups' own policy — the failure that took production down.
  // The pinned search_path is what stops a caller redirecting `public` at a
  // schema of their own and changing what the function sees.
  await ensureCommitted();
  const { rows } = await db.query(
    `select proname, prosecdef, proconfig from pg_proc
      where proname in ('is_open_host', 'shares_a_table', 'at_same_table',
                        'seat_holds', 'tables_with_woman') order by proname`);
  assert.equal(rows.length, 5, 'a helper this migration declares is missing');
  for (const fn of rows) {
    assert.equal(fn.prosecdef, true, `${fn.proname} is not security definer — it will recurse`);
    assert.ok((fn.proconfig ?? []).some(c => c.startsWith('search_path=')),
      `${fn.proname} does not pin search_path`);
  }
});
