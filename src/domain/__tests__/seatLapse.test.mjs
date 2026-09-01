process.env.TZ = 'Asia/Seoul';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { stillHolding, LAPSE_HOURS_BEFORE_MEAL } from '../policy/seatRequest.js';
import { seatsRemaining } from '../policy/table.js';
import { mergeSeatHolds } from '../policy/seatHolds.js';

// The lapse rule, asked of Postgres and of JavaScript at the same time.
//
// ── Why both ────────────────────────────────────────────────────────────
//
// seat_holds() replaced the signup rows a stranger may no longer read, so
// the seat count on a card now comes from SQL while the host's badge still
// comes from seatRequest.js. The first version of the function had no clock
// in it at all: a request nobody answered held its seat for ever, the badge
// said nobody was waiting, the card said the seat was taken, and the guest
// had been promised on the table page that an unanswered request "lapses and
// the seat goes back".
//
// So the number is not the thing to protect — the AGREEMENT is. Every case
// below builds one fixture, asks Postgres what seat_holds() returns and
// JavaScript what stillHolding() returns, and requires the same answer.
// Change twelve hours on either side alone and this fails.
//
// TZ is pinned at the top of the file, before anything reads a clock. The
// meal time is stored naive and the migration reads it as Asia/Seoul, which
// is where the meals are; `new Date('...T19:00')` reads it in whatever zone
// the process is in. Without the pin this file would pass in Seoul and fail
// on any other machine — the same shape as the fixed fixture dates that had
// to be rescued this morning.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const MIGRATION = 'supabase/migrations/2026-09-01c-seat-holds-lapse.sql';

const BOOTSTRAP = `
-- The migration grants execute to this role, so it has to exist. Nothing
-- here runs as it: the question is what the function returns, not who may
-- call it — rlsPolicies.test.mjs is where the policies are exercised.
create role authenticated;

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  host_id uuid, host_name text, menu_id text,
  date date, time time, place text, seats int,
  cancelled_at timestamptz, created_at timestamptz not null default now()
);
create table public.signups (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id),
  user_id uuid, name text, status text,
  created_at timestamptz not null default now()
);
`;

/** Everything between `begin;` and the verification block. */
const functions = (sql) =>
  sql.slice(sql.indexOf('\nbegin;') + '\nbegin;'.length, sql.indexOf('-- == Verification'));

const db = new PGlite();
await db.exec(BOOTSTRAP);
await db.exec(functions(read(MIGRATION)));

// Production already has this trigger; the migration deliberately does not
// recreate it. Creating it once here is what makes the file under test the
// same file production runs — and it is what lets the control below show
// that replacing the function body alone changes the rule.
await db.exec(`create trigger signups_seat_guard before insert on public.signups
  for each row execute function public.assert_seat_available();`);

/** A meal `hours` from now, in the shape both sides read it. */
function tableAt(hours) {
  const at = new Date(Date.now() + hours * 3600_000);
  const p = (n) => String(n).padStart(2, '0');
  return {
    date: `${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}`,
    time: `${p(at.getHours())}:${p(at.getMinutes())}`,
    seats: 4,
    cancelledAt: null,
  };
}

/** What Postgres says is held at a table with these signups. */
async function heldBySql(table, signups, cancelled = false) {
  const t = await db.query(
    `insert into public.tables (host_name, menu_id, date, time, place, seats, cancelled_at)
     values ('x','samgyeopsal',$1,$2,'x',$3,$4) returning id`,
    [table.date, table.time, table.seats, cancelled ? new Date().toISOString() : null]);
  const id = t.rows[0].id;
  for (const s of signups) {
    await db.query('insert into public.signups (table_id, name, status) values ($1,$2,$3)',
      [id, 'x', s.status]);
  }
  const held = await db.query('select status from public.seat_holds() where table_id = $1', [id]);
  return held.rows.map(r => r.status);
}

/** What JavaScript says is held at the same table. */
const heldByJs = (table, signups) =>
  stillHolding(signups, table).map(s => s.status);

const sorted = (a) => [...a].sort();

// ── The two sides have to agree ─────────────────────────────────────────

const CASES = [
  ['well before the deadline, a pending request holds its seat', 24,
    [{ status: 'accepted' }, { status: 'pending' }]],
  ['an hour before the deadline it still does', LAPSE_HOURS_BEFORE_MEAL + 1,
    [{ status: 'accepted' }, { status: 'pending' }]],
  ['an hour after it, the seat has gone back', LAPSE_HOURS_BEFORE_MEAL - 1,
    [{ status: 'accepted' }, { status: 'pending' }]],
  ['an accepted seat is held whatever the clock says', LAPSE_HOURS_BEFORE_MEAL - 6,
    [{ status: 'accepted' }, { status: 'accepted' }]],
  ['a declined request never held one', 24,
    [{ status: 'declined' }, { status: 'accepted' }]],
  ['a row written before statuses existed reads as accepted', LAPSE_HOURS_BEFORE_MEAL - 3,
    [{ status: null }]],
];

// One test rather than one per case, because docsHonesty.test.mjs counts
// `^test(` and refuses to guess at an indented one — and a test count that
// has to be guessed at is what produced a red baseline on 8/30. The case
// name is in the assertion message instead, so a failure still says which.
test('Postgres and JavaScript hold the same seats in every case', async () => {
  for (const [name, hours, signups] of CASES) {
    const table = tableAt(hours);
    const sql = await heldBySql(table, signups);
    const js = heldByJs(table, signups.map(s => ({ ...s, status: s.status ?? undefined })));
    assert.deepEqual(sorted(sql.map(s => s ?? 'accepted')), sorted(js.map(s => s ?? 'accepted')),
      `${name}: SQL held ${sql.length} seats and JavaScript held ${js.length} — `
      + 'the rule has been copied and the copies have drifted');
  }
});

test('the migration answers the case the pilot will actually hit', async () => {
  // The reviewer's pass criteria, in their words: one lapsed pending and one
  // live accepted, seat_holds() returns exactly one row.
  const held = await heldBySql(tableAt(LAPSE_HOURS_BEFORE_MEAL - 1),
    [{ status: 'pending' }, { status: 'accepted' }]);
  assert.equal(held.length, 1);
  assert.deepEqual(held, ['accepted']);
});

test('and the card then shows the lapsed seat back', async () => {
  // The other half of the criteria: the number a person reads, through the
  // real merge, so this covers the path from SQL to the rendered figure.
  //
  // Four seats, one accepted guest, one lapsed request — and the answer is
  // two, not three. `seats` counts the host, which is how the app words it
  // ("counting you"), so a full table of four is the host plus three. That
  // off-by-one is the kind that gets argued about rather than looked up, so
  // it is spelled out here.
  const table = { ...tableAt(LAPSE_HOURS_BEFORE_MEAL - 1), id: 't1' };
  const held = await heldBySql(table, [{ status: 'pending' }, { status: 'accepted' }]);
  const rows = mergeSeatHolds([], held.map(status => ({ table_id: 't1', status })));
  assert.equal(seatsRemaining(table, rows), 2, 'four seats, less the host and one accepted guest');

  // Note what this does NOT show. Feeding the card a lapsed pending on
  // purpose still yields two, because seatsRemaining() re-applies
  // stillHolding() to whatever it is given. The number a person reads was
  // never the thing at risk here — assert_seat_available() was, and that
  // is covered below.
  const stale = mergeSeatHolds([], [{ table_id: 't1', status: 'accepted' }, { table_id: 't1', status: 'pending' }]);
  assert.equal(seatsRemaining(table, stale), 2);
});

test('a lapsed request is not free real estate at a cancelled table either', async () => {
  const held = await heldBySql(tableAt(24), [{ status: 'accepted' }], true);
  assert.deepEqual(held, [], 'a called-off table still reports seats taken');
});

test('the number twelve is written down once, and SQL reads it', async () => {
  // Not a check that the source says "12" — that would pass while the
  // function ignored it. The window is asked for and compared with the
  // constant the client uses.
  const { rows } = await db.query('select extract(epoch from public.lapse_window()) as secs');
  assert.equal(Number(rows[0].secs), LAPSE_HOURS_BEFORE_MEAL * 3600,
    'lapse_window() and LAPSE_HOURS_BEFORE_MEAL are different lengths of time');
});

test('the meal time is read as Seoul, not as UTC', async () => {
  // The trap. A naive timestamp on Supabase would be read as UTC and every
  // Korean dinner would lapse nine hours off — which passes every "is it a
  // number" check and is wrong all day.
  const { rows } = await db.query(
    `select public.lapse_at(date '2026-09-03', time '19:00') as at`);
  const expected = Date.parse('2026-09-03T19:00:00+09:00') - LAPSE_HOURS_BEFORE_MEAL * 3600_000;
  assert.equal(new Date(rows[0].at).getTime(), expected,
    'lapse_at is not treating the meal time as Asia/Seoul');
});

test.after(async () => { await db.close(); });

// ── The trigger, which is the half that genuinely loses seats ───────────

/** The old guard, exactly as it stood in schema.sql before this migration. */
const OLD_GUARD = `
create or replace function public.assert_seat_available()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare capacity integer; taken integer;
begin
  select seats into capacity from public.tables where id = new.table_id for update;
  if capacity is null then raise exception 'table_not_found'; end if;
  select count(*) into taken from public.signups where table_id = new.table_id;
  if (taken + 1) >= capacity then raise exception 'table_full'; end if;
  return new;
end $$;`;

/** Try to take a seat. Returns null on success, or the exception name. */
async function tryToJoin(tableId) {
  try {
    await db.query('insert into public.signups (table_id, name, status) values ($1,$2,$3)',
      [tableId, 'newcomer', 'pending']);
    return null;
  } catch (e) {
    return e.message;
  }
}

/** A table with these signups already on it, and its id. */
async function tableWith(hours, signups) {
  const t = await db.query(
    `insert into public.tables (host_name, menu_id, date, time, place, seats)
     values ('x','samgyeopsal',$1,$2,'x',$3) returning id`,
    [tableAt(hours).date, tableAt(hours).time, 4]);
  const id = t.rows[0].id;
  for (const s of signups) {
    await db.query('insert into public.signups (table_id, name, status) values ($1,$2,$3)',
      [id, 'x', s]);
  }
  return id;
}

test('the guard this replaces really did lock a table with refusals', async () => {
  // The control. Three people turned away from a four-seat table, and the
  // old count(*) reads them as three seats gone — so nobody can ever join.
  // If this ever stops failing, the test below has stopped proving anything.
  await db.exec(OLD_GUARD);
  const id = await tableWith(24, ['declined', 'declined', 'declined']);
  const refused = await tryToJoin(id);
  assert.match(String(refused), /table_full/,
    'the old guard no longer locks the table, so the fix below has nothing to fix');

  // Put the fixed one back for everything after this.
  await db.exec(functions(read(MIGRATION)));
});

test('a host who turns three people away has not closed their table', async () => {
  const id = await tableWith(24, ['declined', 'declined', 'declined']);
  assert.equal(await tryToJoin(id), null,
    'a refused request is still holding a seat nobody is sitting in');
});

test('a request nobody answered gives its seat back', async () => {
  // Two lapsed requests at a table whose deadline has passed. Both seats are
  // free again, which is exactly what the guest was promised on the table
  // page — "this lapses and the seat goes back".
  const id = await tableWith(LAPSE_HOURS_BEFORE_MEAL - 1, ['pending', 'pending', 'accepted']);
  assert.equal(await tryToJoin(id), null, 'a lapsed request is still holding its seat');
});

test('a table that is genuinely full is still full', async () => {
  // The guard has to keep doing its job. Four seats, the host and three
  // accepted guests, so the next person is one too many — overbooking sends
  // a real person to a restaurant with no room for them.
  const id = await tableWith(24, ['accepted', 'accepted', 'accepted']);
  assert.match(String(await tryToJoin(id)), /table_full/);
});

test('a request still inside its window keeps holding the seat', async () => {
  // The opposite error: freeing a seat somebody is still waiting on would
  // let the host accept two people into one chair.
  const id = await tableWith(LAPSE_HOURS_BEFORE_MEAL + 1, ['pending', 'pending', 'accepted']);
  assert.match(String(await tryToJoin(id)), /table_full/);
});

test('the guard and the screen agree about how many may still join', async () => {
  // The failure a traveller would actually meet: the card offering a seat
  // and the insert answering `table_full`. Both sides are asked the same
  // question about the same table.
  for (const [hours, rows] of [
    [24, ['accepted', 'declined']],
    [LAPSE_HOURS_BEFORE_MEAL - 1, ['pending', 'accepted']],
    [LAPSE_HOURS_BEFORE_MEAL + 1, ['pending', 'accepted']],
    [24, ['accepted', 'accepted', 'accepted']],
  ]) {
    const id = await tableWith(hours, rows);
    const table = { ...tableAt(hours), id };
    const held = await db.query('select status from public.seat_holds() where table_id = $1', [id]);
    const screenSaysFree = seatsRemaining(table, held.rows.map(r => ({ ...r, tableId: id }))) > 0;
    const dbLetMeIn = (await tryToJoin(id)) === null;
    assert.equal(screenSaysFree, dbLetMeIn,
      `screen says ${screenSaysFree ? 'free' : 'full'} and the database says ${dbLetMeIn ? 'free' : 'full'} for ${rows.join('+')} at ${hours}h`);
  }
});

// ── The way back ────────────────────────────────────────────────────────
//
// Written and run before the forward migration is applied. On 2026-09-01 a
// policy went in with no undo prepared, and the minutes spent writing one
// were minutes production spent answering 42P17 to everybody.

const ROLLBACK = 'supabase/migrations/2026-09-01c-seat-holds-lapse-ROLLBACK.sql';
const rollbackBody = (sql) =>
  sql.slice(sql.indexOf('\nbegin;') + '\nbegin;'.length, sql.indexOf('-- ── Check'));

test('the rollback runs, and puts the old behaviour back', async () => {
  await db.exec(rollbackBody(read(ROLLBACK)));

  // The three-refusals lock is back — which is the point: rolling back is
  // safe and is not free, and a test saying so stops it being reached for
  // as a reflex.
  const locked = await tableWith(24, ['declined', 'declined', 'declined']);
  assert.match(String(await tryToJoin(locked)), /table_full/,
    'the rollback did not restore the guard that was live before');

  // And seat_holds() has no clock again.
  const stale = await heldBySql(tableAt(LAPSE_HOURS_BEFORE_MEAL - 1),
    [{ status: 'pending' }, { status: 'accepted' }]);
  assert.equal(stale.length, 2, 'seat_holds still applies the lapse rule after a rollback');
});

test('the rollback leaves nothing of the migration behind', async () => {
  // Its own check, run here so the numbers in the file are ones somebody has
  // actually seen rather than ones somebody expected.
  const { rows } = await db.query(`
    select
      (select count(*)::int from pg_proc where proname in ('lapse_window', 'lapse_at')) as helpers_left,
      (select count(*)::int from pg_proc where proname = 'seat_holds' and prosrc like '%lapse_at%') as seat_holds_has_clock`);
  assert.equal(rows[0].helpers_left, 0, 'a helper function survived the rollback');
  assert.equal(rows[0].seat_holds_has_clock, 0, 'seat_holds still calls lapse_at after the rollback');

  // Forward again, so this file leaves the database in the state it applies.
  await db.exec(functions(read(MIGRATION)));
  assert.equal(await tryToJoin(await tableWith(24, ['declined', 'declined', 'declined'])), null);
});
