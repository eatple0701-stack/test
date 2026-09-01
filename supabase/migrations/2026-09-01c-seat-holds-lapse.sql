-- A request that ran out of time gives its seat back.
--
-- == What is wrong ========================================================
--
-- seat_holds(), applied earlier today, counts a held seat as:
--
--     coalesce(s.status, 'accepted') in ('pending', 'accepted')
--
-- with no clock in it. src/domain/policy/seatRequest.js says something more
-- than that: a pending request holds its seat only until twelve hours before
-- the meal, and after that it has lapsed and the seat is free again. The
-- client has always known this — stillHolding() applies it, and
-- waitingForYou() was taught it this afternoon — so the two halves now
-- disagree:
--
--   the host's badge      says nobody is waiting (the request lapsed)
--   the seat count        says the seat is still taken (no clock in SQL)
--
-- And the guest was promised, on the table page: "If they do not answer,
-- this lapses and the seat goes back." It does not go back. A request nobody
-- answered holds a seat for ever and no new guest can take it.
--
-- Nothing has shown this yet because the one live request is accepted. It
-- appears the first time a pending one crosses 2026-09-03 07:00.
--
-- == The rule, and where it lives =========================================
--
-- LAPSE_HOURS_BEFORE_MEAL is 12, in seatRequest.js, and it stays the one
-- place the number is decided. This file reads it through
-- public.lapse_window(), so the SQL says "the lapse window" rather than "12"
-- and there is a single function to change if the policy ever moves.
--
-- Two copies of a rule is what this whole day has been about, so the copy is
-- not trusted to stay in step by care. rlsPolicies.test.mjs builds tables at
-- fixed offsets either side of the deadline, asks Postgres what seat_holds()
-- returns, asks stillHolding() in JavaScript the same question about the
-- same rows, and requires the two answers to be identical. Change the number
-- on one side and that test fails.
--
-- == Time zones, which are the trap here ==================================
--
-- `t.date + t.time` is a naive timestamp. Postgres would read it as UTC on
-- Supabase, and a Seoul dinner at 19:00 would lapse nine hours off. The
-- meals are in Korea, so the meal time is Asia/Seoul and this file says so.
--
-- The client reads the same fields in the BROWSER's zone —
-- `new Date('2026-09-03T19:00')` — which is Seoul for anybody actually going
-- to the meal, and is not for somebody browsing from Europe. That divergence
-- predates this file and is not fixed here; it is written down in
-- docs/rls-baseline-2026-09-01.md as its own item rather than quietly
-- half-corrected.

begin;

-- The one number, in one place on this side of the seam.
create or replace function public.lapse_window()
returns interval
language sql immutable set search_path = public as $fn$
  select interval '12 hours'
$fn$;

-- When a pending request at this table stops holding its seat.
create or replace function public.lapse_at(p_date date, p_time time)
returns timestamptz
language sql immutable set search_path = public as $fn$
  select ((p_date + p_time) at time zone 'Asia/Seoul') - public.lapse_window()
$fn$;

-- One row per held seat: which table, and how far the request got. Nothing
-- that identifies anybody — no user id, no name, no nationality, no note, no
-- gender. Declined requests are excluded because being turned away is the
-- most private state here, and a count including them would tell a stranger
-- how many people a host refused.
--
-- An accepted seat is held whatever the clock says: the guest is coming.
-- A pending one is held only while there is still time to answer it.
create or replace function public.seat_holds()
returns table (table_id uuid, status text)
language sql stable security definer set search_path = public as $fn$
  select s.table_id, coalesce(s.status, 'accepted')
  from signups s
  join tables t on t.id = s.table_id
  where t.cancelled_at is null
    and (
      coalesce(s.status, 'accepted') = 'accepted'
      or (
        coalesce(s.status, 'accepted') = 'pending'
        and now() < public.lapse_at(t.date, t.time)
      )
    )
$fn$;

-- == The one that actually loses seats ====================================
--
-- assert_seat_available() is the trigger that stops a table being
-- overbooked, and it counts like this:
--
--     select count(*) into taken from public.signups where table_id = ...
--
-- Every row. It does not look at status at all, so a DECLINED request holds
-- a seat for ever — a host who turns three people away from a four-seat
-- table has silently closed it, and nobody can ever join again. A lapsed
-- request does the same.
--
-- This is the half that genuinely loses seats. The seat count on the card
-- does not: the client re-applies stillHolding() to whatever seat_holds()
-- returns, so the number a person reads was right even while the SQL was
-- wrong. What was wrong is that the screen says two seats free and the
-- insert comes back `table_full`, which reads to a traveller as the app
-- being broken — and is, at the one moment they were trying to join.
--
-- Same rule as everywhere else, through the same two functions.
create or replace function public.assert_seat_available()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  capacity integer;
  taken    integer;
  meal_at  date;
  meal_on  time;
begin
  select seats, date, time into capacity, meal_at, meal_on
    from public.tables where id = new.table_id for update;

  if capacity is null then
    raise exception 'table_not_found';
  end if;

  -- Accepted seats, plus requests still inside their answering window.
  -- Declined ones never held a seat; lapsed ones gave theirs back.
  select count(*) into taken
    from public.signups s
   where s.table_id = new.table_id
     and (
       coalesce(s.status, 'accepted') = 'accepted'
       or (
         coalesce(s.status, 'accepted') = 'pending'
         and now() < public.lapse_at(meal_at, meal_on)
       )
     );

  if (taken + 1) >= capacity then
    raise exception 'table_full';
  end if;

  return new;
end;
$$;

-- The trigger is deliberately NOT dropped and recreated. It references the
-- function by identity, and `create or replace function` swaps the body
-- underneath it — checked in PGlite rather than assumed: replace the body
-- alone and the next insert runs the new rule.
--
-- Recreating it would take an ACCESS EXCLUSIVE lock on `signups`, which
-- blocks every insert for as long as the transaction is open, and would
-- leave a window with no guard at all if this ever ran outside one. Neither
-- is worth paying for a statement that changes nothing.

revoke all on function public.lapse_window() from public;
revoke all on function public.lapse_at(date, time) from public;
revoke all on function public.seat_holds() from public;
grant execute on function public.lapse_window() to authenticated;
grant execute on function public.lapse_at(date, time) to authenticated;
grant execute on function public.seat_holds() to authenticated;

-- == Verification, in the same transaction ================================
--
-- READ ONLY. Nothing here inserts, updates or deletes.
--
-- The first draft of this block built two fixture tables with four signups
-- to prove the rule either side of the deadline, and threw them away with
-- the closing `rollback;`. That is fine exactly once — and this file is
-- meant to be run a second time with `commit;` in place of it, which would
-- have committed two invented tables and four invented signups into the
-- pilot's data. Worse: an insert into `signups` fires notify_seat_requested,
-- so a real host with an email on file would have been sent a seat request
-- from somebody who does not exist.
--
-- So the rule is checked by arithmetic instead of by fixtures. Everything
-- below is deterministic: it needs no rows, leaves none, and gives the same
-- answers whenever it is run.
--
-- It passes when ALL FIVE are exactly this:
--
--     lapse_seconds        43200                        (twelve hours)
--     gejang_deadline      2026-09-03 07:00:00+09       (the live table)
--     tomorrow_still_open  t
--     this_morning_closed  t
--     lapsed_pending_now   0
--
-- Anything else, including an error, is a fail. The last line counts
-- requests that are already past their deadline and still being counted as
-- holding a seat — the bug this file exists to end — so a number other than
-- zero means it has not taken effect.

select
  extract(epoch from public.lapse_window())::int                     as lapse_seconds,
  public.lapse_at(date '2026-09-03', time '19:00')                   as gejang_deadline,
  public.lapse_at(current_date + 1, time '12:00') > now()            as tomorrow_still_open,
  public.lapse_at(current_date, time '00:01') < now()                as this_morning_closed,
  (select count(*)
     from public.signups s
     join public.tables t on t.id = s.table_id
    where t.cancelled_at is null
      and coalesce(s.status, 'accepted') = 'pending'
      and now() >= public.lapse_at(t.date, t.time))                  as lapsed_pending_now;

rollback;
