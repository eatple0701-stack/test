-- Undo 2026-09-01e-signups-soft-cancel.sql.
--
-- Written before the forward file was applied and run against a database
-- that had it — see the last test in softCancel.test.mjs.
--
-- ── Read this before running it ────────────────────────────────────────
--
-- The columns are NOT dropped. `signups.cancelled_at` and
-- `notifications.signup_id` stay, holding whatever was written into them
-- while the change was live. Dropping them would destroy the record this
-- migration exists to keep, which would be the original bug performed
-- deliberately.
--
-- What comes back is the behaviour: the seat counters stop looking at
-- cancelled_at, and the app is free to hard-delete again. Any request
-- cancelled while this was live becomes a row that occupies a seat and
-- cannot be re-requested, so if you roll back with cancellations already
-- recorded, clear them by hand first:
--
--     update public.signups set cancelled_at = null where cancelled_at is not null;
--
-- The unique constraint is restored, and it will fail if two live rows share
-- (table_id, user_id) — which can only happen if somebody cancelled and
-- asked again. That failure is the transaction protecting you: the data no
-- longer fits the old shape, and forcing it would mean deleting one of them.

begin;

-- The seat counters, as 2026-09-01c left them: no cancelled_at anywhere.
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

-- One live seat per person per table, the way it was before: a plain
-- constraint over every row.
drop index if exists public.signups_one_live_seat;
alter table public.signups
  add constraint signups_table_id_user_id_key unique (table_id, user_id);

-- Cancelling goes back to being a delete, so the update path for it goes.
drop policy if exists signups_cancel_own_or_host on public.signups;
revoke update on public.signups from authenticated;
grant update (status, attendance) on public.signups to authenticated;

-- The triggers keep writing signup_id — the column is still there and the
-- value is still true. Only the seat arithmetic is reverted.

-- Passes when ALL THREE are exactly this:
--     live_index_gone        0
--     old_constraint_back    1
--     columns_kept           2     (nothing was destroyed)
select
  (select count(*) from pg_indexes where indexname = 'signups_one_live_seat')  as live_index_gone,
  (select count(*) from pg_constraint where conname = 'signups_table_id_user_id_key') as old_constraint_back,
  (select count(*) from information_schema.columns
    where (table_name = 'signups' and column_name = 'cancelled_at')
       or (table_name = 'notifications' and column_name = 'signup_id'))        as columns_kept;

commit;
