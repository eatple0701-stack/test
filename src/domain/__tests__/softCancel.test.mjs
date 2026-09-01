process.env.TZ = 'Asia/Seoul';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// Cancelling a seat stops deleting the evidence that it was asked for.
//
// ── What was being lost ─────────────────────────────────────────────────
//
// cancelSignup() ran `.delete()`. Production this evening reads 3 tables,
// 2 signups and 8 notifications — three of them seat_requested — which only
// adds up if a request was made and erased. The final report is due 9/20 and
// counts seats requested; a delete removes exactly that number, and kept
// removing it for as long as the pilot ran.
//
// ── The trap this file exists for ───────────────────────────────────────
//
// `unique (table_id, user_id)` is what stops one person taking two seats.
// Under a hard delete, cancelling freed the pair and the same person could
// ask again. Under a soft one the row stays — so the constraint would refuse
// them for ever, and somebody who cancelled by mistake could never return to
// that table. It becomes a partial unique index over live rows, and the
// round trip is tested here rather than reasoned about.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const MIGRATION = 'supabase/migrations/2026-09-01e-signups-soft-cancel.sql';
const ROLLBACK = 'supabase/migrations/2026-09-01e-signups-soft-cancel-ROLLBACK.sql';
const LAPSE = 'supabase/migrations/2026-09-01c-seat-holds-lapse.sql';

const applyPart = (sql, end) =>
  sql.slice(sql.indexOf('\nbegin;') + '\nbegin;'.length, sql.indexOf(end));

// The shape production has before this migration: the unique constraint in
// place, no cancelled_at, no signup_id.
const BOOTSTRAP = `
create role authenticated;
-- The cancel policy is written in terms of auth.uid(), so the schema has to
-- exist. Nothing here runs as that role: what is under test is the seat
-- arithmetic and the constraint, and rlsPolicies.test.mjs is where the
-- policies themselves are exercised.
create schema auth;
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid
$fn$;
create table public.profiles (id uuid primary key, name text, languages text[] default '{}');
create table public.member_details (id uuid primary key references public.profiles(id), email text not null default '');
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id), host_name text, host_gender text, menu_id text,
  date date, time time, place text, seats int, cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.signups (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id),
  user_id uuid not null references public.profiles(id),
  name text, status text, attendance text,
  created_at timestamptz not null default now(),
  unique (table_id, user_id)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null, recipient text not null, subject text not null,
  body text not null, table_id uuid, created_at timestamptz default now(), sent_at timestamptz
);
insert into public.profiles (id, name) values
  ('00000000-0000-4000-8000-000000000001', 'host'),
  ('00000000-0000-4000-8000-000000000002', 'guest'),
  ('00000000-0000-4000-8000-000000000003', 'other');
insert into public.member_details (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'host@example.com'),
  ('00000000-0000-4000-8000-000000000002', 'guest@example.com');
`;

const HOST = '00000000-0000-4000-8000-000000000001';
const GUEST = '00000000-0000-4000-8000-000000000002';
const OTHER = '00000000-0000-4000-8000-000000000003';

const db = new PGlite();
await db.exec(BOOTSTRAP);
// 2026-09-01c is already applied in production; this file builds on it.
await db.exec(applyPart(read(LAPSE), '-- == Verification'));

// The notify_* bodies live in schema.sql, not in a migration, so they are
// taken from there rather than retyped — the same reason the rollback files
// are generated from it.
const schema = read('supabase/schema.sql');
const END = `end $${''}$;`;
const notifyFn = (name) => {
  const at = schema.indexOf(`create or replace function public.${name}() returns trigger`);
  return schema.slice(at, schema.indexOf(END, at) + END.length);
};
await db.exec([notifyFn('notify_seat_requested'), notifyFn('notify_seat_decided')].join('\n'));

await db.exec(`create trigger signups_seat_guard before insert on public.signups
  for each row execute function public.assert_seat_available();
create trigger trg_notify_seat_requested after insert on public.signups
  for each row execute function public.notify_seat_requested();
create trigger trg_notify_seat_decided after update on public.signups
  for each row execute function public.notify_seat_decided();`);

// Everything below runs against the migration under review.
await db.exec(applyPart(read(MIGRATION), '-- == Verification'));

async function newTable(seats = 4, daysAhead = 3) {
  const { rows } = await db.query(
    `insert into public.tables (host_id, host_name, menu_id, date, time, place, seats)
     values ($1,'h','samgyeopsal', current_date + ($2)::int, time '19:00', 'sd', $3) returning id`,
    [HOST, daysAhead, seats]);
  return rows[0].id;
}
const ask = (tableId, who, status = 'pending') => db.query(
  `insert into public.signups (table_id, user_id, name, status) values ($1,$2,'x',$3) returning id`,
  [tableId, who, status]).then(r => r.rows[0].id);
const cancel = (id) => db.query(
  `update public.signups set cancelled_at = now() where id = $1`, [id]);
const holds = (tableId) => db.query(
  `select count(*)::int as n from public.seat_holds() where table_id = $1`, [tableId])
  .then(r => r.rows[0].n);

// ── the reviewer's criteria ─────────────────────────────────────────────

test('a cancelled request frees its seat and keeps its row', async () => {
  const t = await newTable();
  const gone = await ask(t, GUEST, 'accepted');
  await ask(t, OTHER, 'accepted');
  await cancel(gone);

  assert.equal(await holds(t), 1, 'seat_holds still counts the cancelled request');
  const { rows } = await db.query(
    `select count(*)::int as n from public.signups where table_id = $1`, [t]);
  assert.equal(rows[0].n, 2, 'the record of the cancelled request was destroyed');
});

test('somebody who cancels can ask again — the constraint does not trap them', async () => {
  // The trap. `unique (table_id, user_id)` over every row would refuse this
  // for ever, so a person who cancelled by accident could never come back.
  const t = await newTable();
  const first = await ask(t, GUEST);
  await cancel(first);
  const second = await ask(t, GUEST);
  assert.notEqual(second, first, 'the second request did not create a row');

  const { rows } = await db.query(
    `select count(*)::int as n from public.signups where table_id = $1 and user_id = $2`, [t, GUEST]);
  assert.equal(rows[0].n, 2, 'both requests should be on the record');
  assert.equal(await holds(t), 1, 'only the live one holds a seat');
});

test('one live seat per person is still the rule', async () => {
  // What the constraint was for. Asking twice without cancelling has to fail,
  // or the partial index has given away the guarantee it replaced.
  const t = await newTable();
  await ask(t, GUEST);
  await assert.rejects(() => ask(t, GUEST), /duplicate key|signups_one_live_seat/,
    'the same person took two live seats at one table');
});

test('a cancelled request does not keep a table full', async () => {
  // The other half of the seat coming back: the guard has to let the next
  // person in. Three seats is the host plus two, so two guests fill it —
  // `seats` counts the host, which is how the app words it ("counting you").
  const t = await newTable(3);
  const a = await ask(t, GUEST, 'accepted');
  const b = await ask(t, OTHER, 'accepted');
  await assert.rejects(() => ask(t, HOST, 'pending'), /table_full/, 'the table should be full here');

  await cancel(b);
  const after = await ask(t, HOST, 'pending');
  assert.ok(after, 'the cancelled seat did not come back');
  assert.equal(await holds(t), 2, 'the live accepted seat plus the new request');
  assert.ok(a);
});

test('a withdrawn request is not one the host can answer into an email', async () => {
  const t = await newTable();
  const id = await ask(t, GUEST);
  await cancel(id);
  await db.query(`update public.signups set status = 'accepted' where id = $1`, [id]);
  const { rows } = await db.query(
    `select count(*)::int as n from public.notifications where kind = 'seat_decided' and signup_id = $1`,
    [id]);
  assert.equal(rows[0].n, 0, 'a cancelled request produced a confirmation email');
});

test('the outbox can finally be reconciled row by row', async () => {
  // The column that was missing. Before this, notifications recorded only
  // table_id, so "which signups produced no email" was a question no query
  // could answer — which is why that number could not be reported.
  const t = await newTable();
  const id = await ask(t, GUEST);
  const { rows } = await db.query(
    `select count(*)::int as n from public.signups s
      where s.id = $1
        and not exists (select 1 from public.notifications n
                         where n.signup_id = s.id and n.kind = 'seat_requested')`, [id]);
  assert.equal(rows[0].n, 0, 'the request produced no notification, or none that can be joined to it');

  const orphans = await db.query(
    `select count(*)::int as n from public.notifications n
      where n.kind = 'seat_requested' and n.signup_id is null`);
  assert.equal(orphans.rows[0].n, 0, 'a seat_requested email was written with no signup on it');
});

test('the migration adds a column and an index and touches no row', async () => {
  const before = await db.query('select count(*)::int as n from public.signups');
  await db.exec(applyPart(read(MIGRATION), '-- == Verification'));
  const after = await db.query('select count(*)::int as n from public.signups');
  assert.equal(after.rows[0].n, before.rows[0].n, 'reapplying the migration changed the data');

  const { rows } = await db.query(`
    select
      (select count(*)::int from information_schema.columns
        where table_name = 'signups' and column_name = 'cancelled_at')      as cancelled_column,
      (select count(*)::int from information_schema.columns
        where table_name = 'notifications' and column_name = 'signup_id')   as signup_id_column,
      (select count(*)::int from pg_indexes
        where indexname = 'signups_one_live_seat')                          as live_unique_index,
      (select count(*)::int from pg_constraint
        where conname = 'signups_table_id_user_id_key')                     as old_unique_constraint`);
  assert.deepEqual(rows[0],
    { cancelled_column: 1, signup_id_column: 1, live_unique_index: 1, old_unique_constraint: 0 });
});

test('the rollback restores the old arithmetic and destroys nothing', async () => {
  // Written before the forward file was applied, and run here. It leaves the
  // columns in place on purpose: dropping them would perform the original
  // bug deliberately.
  //
  // First, the warning the rollback file carries has to be true. By now
  // somebody has cancelled and asked again, so two rows share
  // (table_id, user_id) with one of them cancelled. Clearing cancelled_at
  // the way the file suggests makes both live, and restoring the old
  // constraint then MUST fail — that failure is the transaction refusing to
  // reshape data that no longer fits, rather than silently dropping one of
  // the two requests.
  await db.exec('begin');
  await assert.rejects(
    () => db.query(`update public.signups set cancelled_at = null where cancelled_at is not null`),
    /duplicate key|signups_one_live_seat/,
    'reviving cancelled requests gave one person two live seats at one table');
  await db.exec('rollback');

  // Cleared properly — the cancelled rows removed rather than revived — it
  // goes through.
  await db.query(`delete from public.notifications
    where signup_id in (select id from public.signups where cancelled_at is not null)`);
  await db.query(`delete from public.signups where cancelled_at is not null`);
  await db.exec(applyPart(read(ROLLBACK), '-- Passes when ALL THREE'));

  const { rows } = await db.query(`
    select
      (select count(*)::int from pg_indexes where indexname = 'signups_one_live_seat') as live_index_gone,
      (select count(*)::int from pg_constraint where conname = 'signups_table_id_user_id_key') as old_constraint_back,
      (select count(*)::int from information_schema.columns
        where (table_name = 'signups' and column_name = 'cancelled_at')
           or (table_name = 'notifications' and column_name = 'signup_id')) as columns_kept`);
  assert.deepEqual(rows[0], { live_index_gone: 0, old_constraint_back: 1, columns_kept: 2 });

  // Forward again, so the file leaves the database in the state it applies.
  await db.exec(applyPart(read(MIGRATION), '-- == Verification'));
});

test.after(async () => { await db.close(); });
