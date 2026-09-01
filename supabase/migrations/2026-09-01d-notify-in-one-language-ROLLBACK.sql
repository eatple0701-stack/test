-- Undo 2026-09-01d-notify-in-one-language.sql.
--
-- Written before the forward file was applied and run against a database
-- that had it — see the last test in notifyLanguage.test.mjs. Restores the
-- three trigger functions exactly as schema.sql had them before, then drops
-- the two helpers, which nothing refers to once the bodies are back.
--
-- After this, every notification goes out bilingual again: a foreign host
-- gets a first line they cannot read, and a Korean host gets each sentence
-- twice. Safe, and not free.

begin;
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
drop function if exists public.notify_line(text, text);
drop function if exists public.notify_lang(uuid);

-- Passes when BOTH are exactly 0.
select
  (select count(*) from pg_proc
    where proname in ('notify_lang', 'notify_line'))                as helpers_left,
  (select count(*) from pg_proc
    where proname like 'notify_%' and prosrc like '%notify_line%') as still_translated;

commit;
