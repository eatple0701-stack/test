-- Undo 2026-09-01c-seat-holds-lapse.sql.
--
-- Written before the forward migration was applied, and run in PGlite
-- against a database that had it applied — see the last two tests in
-- src/domain/__tests__/seatLapse.test.mjs. On 2026-09-01 a policy went in
-- with nothing prepared to take it out, and the minutes spent writing the
-- undo were minutes production spent returning 42P17 to everybody.
--
-- Paste and run. It restores exactly the two function bodies that were live
-- before, and drops the two that did not exist.
--
-- What it does NOT undo, because the forward file never did it: the trigger
-- signups_seat_guard is untouched by both. It points at
-- assert_seat_available() by identity, so restoring that function's body is
-- the whole of restoring the guard.
--
-- After this runs, the two known bugs are back and are the state that has
-- been live all along:
--
--   a declined request holds a seat for ever, so a host who turns three
--   people away from a four-seat table has closed it;
--   a request nobody answered holds its seat past its own deadline.
--
-- Which is to say: rolling back is safe, and it is not free.

begin;

-- The seat guard, exactly as schema.sql had it before today.
create or replace function public.assert_seat_available()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  capacity integer;
  taken    integer;
begin
  select seats into capacity from public.tables where id = new.table_id for update;

  if capacity is null then
    raise exception 'table_not_found';
  end if;

  select count(*) into taken from public.signups where table_id = new.table_id;

  if (taken + 1) >= capacity then
    raise exception 'table_full';
  end if;

  return new;
end;
$$;

-- seat_holds(), as applied earlier on 2026-09-01: no clock in it.
create or replace function public.seat_holds()
returns table (table_id uuid, status text)
language sql stable security definer set search_path = public as $fn$
  select s.table_id, coalesce(s.status, 'accepted')
  from signups s
  join tables t on t.id = s.table_id
  where t.cancelled_at is null
    and coalesce(s.status, 'accepted') in ('pending', 'accepted')
$fn$;

-- These two are new in 2026-09-01c and nothing else refers to them once the
-- bodies above are back. Dropped last, so that if either function above had
-- failed to replace, this transaction aborts with them still in place rather
-- than leaving a body that calls something gone.
drop function if exists public.lapse_at(date, time);
drop function if exists public.lapse_window();

-- ── Check, in the same transaction ──────────────────────────────────────
--
-- Passes when BOTH are exactly true:
--
--     helpers_left        is 0
--     seat_holds_has_clock is 0
--
-- Anything else, including an error, is a fail.

select
  (select count(*) from pg_proc
    where proname in ('lapse_window', 'lapse_at')) as helpers_left,
  (select count(*) from pg_proc
    where proname = 'seat_holds' and prosrc like '%lapse_at%') as seat_holds_has_clock;

commit;
