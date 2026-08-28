-- 2026-08-22 — the app moved to https://eatple.vercel.app
--
-- The five notification-email bodies had the old Vercel URL baked into them.
-- These functions are compiled and stored inside Postgres, so editing
-- schema.sql changes nothing that is already running: this file has to be
-- pasted into the Supabase SQL editor once, against the live project.
--
-- It is the same text as supabase/schema.sql lines 820-964, only with the
-- URL already updated. Safe and repeatable, but be precise about why: the
-- four functions are "create or replace", and each of the four triggers is
-- dropped and immediately recreated on the next line — the ordinary
-- idempotent pattern. No table is touched and no row is deleted. The only
-- window is the instant between a "drop trigger" and its "create trigger";
-- if a seat were requested in that microsecond its notification would not
-- be queued, which is why this is worth pasting in one go rather than
-- statement by statement.
--
-- Verify afterwards:
--   select proname from pg_proc where prosrc like '%eatple.vercel.app%';
--   -- expect the four notify_* functions that carry a link

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
  insert into notifications (kind, recipient, subject, body, table_id) values (
    'seat_requested', host_email,
    '[밥친구] 자리 요청이 왔어요 · Somebody asked for a seat',
    coalesce(nullif(new.name, ''), 'A traveller') || ' asked to sit at your table — '
      || t.date || ' ' || to_char(t.time, 'HH24:MI') || ', ' || t.place || '.'
      || E'\n\n' || '요청에 답해 주세요. 답이 없으면 식사 12시간 전에 요청이 만료되고 좌석이 다시 풀립니다.'
      || E'\n' || 'Please answer — unanswered requests lapse 12 hours before the meal and the seat opens up again.'
      || E'\n\n' || 'https://eatple.vercel.app/tables/' || t.id
      || E'\n\n' || '— 밥친구 · Eatple',
    t.id);
  return null;
exception when others then return null;
end $$;

drop trigger if exists trg_notify_seat_requested on public.signups;
create trigger trg_notify_seat_requested
  after insert on public.signups
  for each row execute function public.notify_seat_requested();

-- 승인/거절 → 게스트에게. The answer a person is planning an evening around.
create or replace function public.notify_seat_decided() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t record;
  guest_email text;
begin
  if coalesce(old.status, '') <> 'pending' or new.status not in ('accepted', 'declined') then
    return null;
  end if;
  select * into t from tables where id = new.table_id;
  if t.id is null then return null; end if;
  select email into guest_email from member_details
    where id = new.user_id and email <> '';
  if guest_email is null then return null; end if;
  if new.status = 'accepted' then
    insert into notifications (kind, recipient, subject, body, table_id) values (
      'seat_decided', guest_email,
      '[밥친구] 자리 확정! · Your seat is confirmed',
      'The host said yes. Your table: ' || t.date || ' ' || to_char(t.time, 'HH24:MI')
        || ', meet at ' || t.place || '.'
        || E'\n\n' || '만나는 요령(호스트 인상착의 등)은 밥상 페이지에 있어요 — 확정된 사람에게만 보입니다.'
        || E'\n' || 'How to spot the host is on the table page — visible to confirmed guests only.'
        || E'\n\n' || 'https://eatple.vercel.app/tables/' || t.id
        || E'\n\n' || '— 밥친구 · Eatple',
      t.id);
  else
    insert into notifications (kind, recipient, subject, body, table_id) values (
      'seat_decided', guest_email,
      '[밥친구] 이번 밥상은 아쉽게 됐어요 · About your seat request',
      'The host could not fit you in this time — usually the table filled up.'
        || E'\n\n' || '다른 밥상이 열려 있어요. 같은 메뉴를 직접 열면 그 상의 호스트는 당신입니다.'
        || E'\n' || 'Other tables are open — or open the same dish yourself and the seats are yours to give.'
        || E'\n\n' || 'https://eatple.vercel.app/'
        || E'\n\n' || '— 밥친구 · Eatple',
      t.id);
  end if;
  return null;
exception when others then return null;
end $$;

drop trigger if exists trg_notify_seat_decided on public.signups;
create trigger trg_notify_seat_decided
  after update on public.signups
  for each row execute function public.notify_seat_decided();

-- 취소 → 좌석이 걸려 있던 모두에게. The one email that keeps somebody from
-- standing at an exit at 19:00 for a dinner nobody is coming to.
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

drop trigger if exists trg_notify_table_cancelled on public.tables;
create trigger trg_notify_table_cancelled
  after update on public.tables
  for each row execute function public.notify_table_cancelled();

-- 신고 접수 → 팀에게. The report table nobody has to remember to check.
create or replace function public.notify_report_filed() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  team text;
begin
  select email into team from pilot_team limit 1;
  if team is null then return null; end if;
  insert into notifications (kind, recipient, subject, body, table_id) values (
    'report_filed', team,
    '[밥친구] 신고 접수 · A report was filed (' || new.reason || ')',
    'Reason: ' || new.reason
      || case when new.note <> '' then E'\n\n' || new.note else '' end
      || case when new.table_id is not null
           then E'\n\n' || 'Table: https://eatple.vercel.app/tables/' || new.table_id
           else '' end
      || E'\n\n' || '자세한 내용은 대시보드 reports 테이블에서 — reporter id 포함.'
      || E'\n' || '— 밥친구 · Eatple',
    new.table_id);
  return null;
exception when others then return null;
end $$;

drop trigger if exists trg_notify_report_filed on public.reports;
create trigger trg_notify_report_filed
  after insert on public.reports
  for each row execute function public.notify_report_filed();

-- The nudge that makes delivery immediate rather than whenever-somebody-runs
-- -the-function: every outbox insert pokes the Edge Function over pg_net.
-- Fire and forget — if pg_net or the function is missing, the row waits in
-- the outbox, which is the designed degraded state, not an error.
do $$ begin
  create extension if not exists pg_net;
exception when others then null; end $$;
