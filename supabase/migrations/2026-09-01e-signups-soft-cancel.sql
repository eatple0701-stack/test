-- Cancelling a seat request stops deleting the evidence that it happened.
--
-- == What is being lost, right now =======================================
--
-- cancelSignup() runs `.from('signups').delete()`. The row goes; the
-- notifications it produced stay. Production this evening reads 3 tables,
-- 2 signups, 8 notifications — three seat_requested among them — so at
-- least one request was made and then erased, and the only trace left is an
-- email nobody can join back to it.
--
-- The final report is due 9/20 and the numbers in it are tables opened,
-- seats requested, meals held. A hard delete removes the second one, and it
-- keeps removing it for as long as 2차 운영 runs.
--
-- == What this changes ===================================================
--
-- `cancelled_at` on signups, the same shape `tables` already uses, and every
-- place that counts a seat learns to skip it. The row stays; the seat comes
-- back. `notifications.signup_id` so the outbox can finally be reconciled
-- row by row — today it records only table_id, so no query can tell which
-- request an email was about.
--
-- == The unique constraint is the trap ===================================
--
-- `unique (table_id, user_id)` is what stops one person taking two seats at
-- a table. With a hard delete, cancelling freed the pair and the same person
-- could ask again. With a soft one the row stays and the constraint would
-- refuse them for ever — a person who cancelled by accident could never come
-- back to that table.
--
-- So it becomes a partial unique index over the rows that are still live.
-- Same guarantee (one live seat per person per table), and a cancelled
-- request no longer occupies the pair. Tested: cancel, ask again, and the
-- second request is accepted.
--
-- == Deleting is still allowed, and is no longer what the app does ========
--
-- signups_delete_own_or_host stays. The policy is the floor — somebody may
-- still need a row genuinely gone — but the app stops using it, and the
-- column grant now lets an owner write cancelled_at instead.
--
-- =========================================================================
-- Paste as is. It ends in `rollback;` and changes nothing: it applies
-- everything, reads the result, prints five numbers, and throws it away.
--
-- It passes when ALL FIVE are exactly this:
--
--     signups_total_now      unchanged from before you ran it
--     cancelled_column       1
--     signup_id_column       1
--     live_unique_index      1
--     old_unique_constraint  0
--
-- Then change the last line to `commit;` and run it again.
-- Undo: 2026-09-01e-signups-soft-cancel-ROLLBACK.sql, written first.
--
-- Run this on its own. Do not apply it the same day as 2026-09-01d, or a
-- problem afterwards has two candidates.

begin;

-- ── the column ──────────────────────────────────────────────────────────

alter table public.signups add column if not exists cancelled_at timestamptz;

-- Reconciliation. Without this the outbox and the requests share no key, so
-- "which signups produced no email" is a question no query can answer.
-- Nullable and unenforced by a foreign key on purpose: a notification must
-- outlive the row it was about, which is the whole reason this file exists.
alter table public.notifications add column if not exists signup_id uuid;

-- One live seat per person per table — the same guarantee as before, over
-- the rows that are still live. Dropping the old constraint and adding the
-- index in one transaction means there is no moment where neither applies.
alter table public.signups drop constraint if exists signups_table_id_user_id_key;
create unique index if not exists signups_one_live_seat
  on public.signups (table_id, user_id) where cancelled_at is null;

-- ── who may cancel ──────────────────────────────────────────────────────
--
-- Writing cancelled_at is giving up your own seat, or a host removing
-- somebody from their own table — the same two people signups_delete_own_or_host
-- already allows to delete. The column grant is what stops it being used to
-- rewrite a guest's name or allergy note.

drop policy if exists signups_cancel_own_or_host on public.signups;
create policy signups_cancel_own_or_host on public.signups
  for update to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.tables t where t.id = table_id and t.host_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.tables t where t.id = table_id and t.host_id = auth.uid())
  );

grant update (status, attendance, cancelled_at) on public.signups to authenticated;

-- ── everything that counts a seat ───────────────────────────────────────

create or replace function public.seat_holds()
returns table (table_id uuid, status text)
language sql stable security definer set search_path = public as $fn$
  select s.table_id, coalesce(s.status, 'accepted')
  from signups s
  join tables t on t.id = s.table_id
  where t.cancelled_at is null
    and s.cancelled_at is null
    and (
      coalesce(s.status, 'accepted') = 'accepted'
      or (
        coalesce(s.status, 'accepted') = 'pending'
        and now() < public.lapse_at(t.date, t.time)
      )
    )
$fn$;

create or replace function public.tables_with_woman()
returns setof uuid
language sql stable security definer set search_path = public as $fn$
  select t.id from tables t
  where t.cancelled_at is null
    and t.host_gender = 'Woman'
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
     and s.cancelled_at is null
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

-- ── the outbox learns which request it was about ────────────────────────
--
-- Only the two that are about one signup. table_cancelled is about a table
-- and report_filed about a report, and inventing a signup_id for those would
-- make the column mean two things.

create or replace function public.notify_seat_requested() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t record;
  host_email text;
begin
  select * into t from tables where id = new.table_id;
  if t.id is null or t.cancelled_at is not null then return null; end if;
  select email into host_email from member_details
    where id = t.host_id and email <> '';
  if host_email is null then return null; end if;
  insert into notifications (kind, recipient, subject, body, table_id, signup_id) values (
    'seat_requested', host_email,
    '[밥친구] 자리 요청이 왔어요 · Somebody asked for a seat',
    coalesce(nullif(new.name, ''), 'A traveller') || ' asked to sit at your table — '
      || t.date || ' ' || to_char(t.time, 'HH24:MI') || ', ' || t.place || '.'
      || E'\n\n' || '요청에 답해 주세요. 답이 없으면 식사 12시간 전에 요청이 만료되고 좌석이 다시 풀립니다.'
      || E'\n' || 'Please answer — unanswered requests lapse 12 hours before the meal and the seat opens up again.'
      || E'\n\n' || 'https://eatple.vercel.app/tables/' || t.id
      || E'\n\n' || '— 밥친구 · Eatple',
    t.id, new.id);
  return null;
exception when others then return null;
end $$;

create or replace function public.notify_seat_decided() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t record;
  guest_email text;
begin
  if coalesce(old.status, '') <> 'pending' or new.status not in ('accepted', 'declined') then
    return null;
  end if;
  -- A request somebody has withdrawn is not one to answer.
  if new.cancelled_at is not null then return null; end if;
  select * into t from tables where id = new.table_id;
  if t.id is null then return null; end if;
  select email into guest_email from member_details
    where id = new.user_id and email <> '';
  if guest_email is null then return null; end if;
  if new.status = 'accepted' then
    insert into notifications (kind, recipient, subject, body, table_id, signup_id) values (
      'seat_decided', guest_email,
      '[밥친구] 자리 확정! · Your seat is confirmed',
      'The host said yes. Your table: ' || t.date || ' ' || to_char(t.time, 'HH24:MI')
        || ', meet at ' || t.place || '.'
        || E'\n\n' || '만나는 요령(호스트 인상착의 등)은 밥상 페이지에 있어요 — 확정된 사람에게만 보입니다.'
        || E'\n' || 'How to spot the host is on the table page — visible to confirmed guests only.'
        || E'\n\n' || 'https://eatple.vercel.app/tables/' || t.id
        || E'\n\n' || '— 밥친구 · Eatple',
      t.id, new.id);
  else
    insert into notifications (kind, recipient, subject, body, table_id, signup_id) values (
      'seat_decided', guest_email,
      '[밥친구] 이번 밥상은 아쉽게 됐어요 · About your seat request',
      'The host could not fit you in this time — usually the table filled up.'
        || E'\n\n' || '다른 밥상이 열려 있어요. 같은 메뉴를 직접 열면 그 상의 호스트는 당신입니다.'
        || E'\n' || 'Other tables are open — or open the same dish yourself and the seats are yours to give.'
        || E'\n\n' || 'https://eatple.vercel.app/'
        || E'\n\n' || '— 밥친구 · Eatple',
      t.id, new.id);
  end if;
  return null;
exception when others then return null;
end $$;

-- A cancelled table tells the people who still had a live seat on it.
create or replace function public.notify_table_cancelled() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  if old.cancelled_at is not null or new.cancelled_at is null then return null; end if;
  for r in
    select md.email from public.signups s
    join public.member_details md on md.id = s.user_id and md.email <> ''
    where s.table_id = new.id
      and s.cancelled_at is null
      and coalesce(s.status, 'accepted') in ('accepted', 'pending')
  loop
    insert into notifications (kind, recipient, subject, body, table_id) values (
      'table_cancelled', r.email,
      '[밥친구] 밥상이 취소됐어요 — 가지 마세요 · Table cancelled, do not go',
      'The host called off the table planned for ' || new.date || ' '
        || to_char(new.time, 'HH24:MI') || ' at ' || new.place || '.'
        || E'\n\n' || '만나기로 한 곳에 가지 마세요. 다른 밥상이 열려 있습니다.'
        || E'\n' || 'Do not go to the meeting point. Other tables are open.'
        || E'\n\n' || 'https://eatple.vercel.app/'
        || E'\n\n' || '— 밥친구 · Eatple',
      new.id);
  end loop;
  return null;
exception when others then return null;
end $$;

-- == Verification, in the same transaction ================================
--
-- READ ONLY. Nothing here inserts, updates or deletes a row — the lesson
-- from 2026-09-01c, whose first draft would have committed invented tables
-- and emailed a real host about a guest who does not exist.
--
-- signups_total_now is printed so you can compare it with what you had
-- before running this. It must not move: this file adds a column and an
-- index, and touches no row.

select
  (select count(*) from public.signups)                                as signups_total_now,
  (select count(*) from information_schema.columns
    where table_name = 'signups' and column_name = 'cancelled_at')     as cancelled_column,
  (select count(*) from information_schema.columns
    where table_name = 'notifications' and column_name = 'signup_id')  as signup_id_column,
  (select count(*) from pg_indexes
    where indexname = 'signups_one_live_seat')                         as live_unique_index,
  (select count(*) from pg_constraint
    where conname = 'signups_table_id_user_id_key')                    as old_unique_constraint;

rollback;
