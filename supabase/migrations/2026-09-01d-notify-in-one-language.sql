-- Send the mail in the reader's language, not in both.
--
-- == What went out ========================================================
--
-- The first notification the fixed sender actually delivered, 2026-09-01
-- 19:55, read like this:
--
--     조강민 asked to sit at your table — 2026-09-03 19:00, sd.
--
--     요청에 답해 주세요. 답이 없으면 식사 12시간 전에 요청이 만료되고
--     좌석이 다시 풀립니다.
--     Please answer — unanswered requests lapse 12 hours before the meal
--     and the seat opens up again.
--
-- The first line is English, the rest is both languages one after the other,
-- and nothing anywhere looked at who was reading. A Korean host reads half
-- of it and skims past the rest; a foreign host cannot read the first half
-- at all and has to work out that the English line below repeats it.
--
-- The app has known each person's languages since the Profile screen was
-- built. The outbox never asked.
--
-- == The rule ============================================================
--
--   speaks 한국어 and not English   ->  Korean only
--   speaks English and not 한국어   ->  English only
--   both, or neither, or nothing    ->  both, as now
--
-- Somebody who listed only 日本語 falls to both. That is a real gap and it
-- is the honest one: the outbox has two languages written and inventing a
-- third would be worse than showing them the two that exist. Recorded rather
-- than hidden.
--
-- == What "one language" can and cannot mean ==============================
--
-- The app's own words are in one language. The DATA in the mail is whatever
-- the people wrote: a guest called 조강민, a meeting place typed as "sd" or
-- as 종로3가역 4번 출구. So a Korean name appears in an English mail, and an
-- English place name appears in a Korean one, and neither is a defect.
--
-- The tests assert exactly that distinction — that no phrase belonging to
-- the other language appears — rather than "no Hangul", which would fail on
-- a guest's name and would be the wrong thing to want.
--
-- == How this is checked ==================================================
--
-- Every sentence lives in public.notify_line(key, lang) instead of inside
-- the trigger bodies, so a test can enumerate them and require that a Korean
-- body contains none of the English lines and the reverse.
-- src/domain/__tests__/notifyLanguage.test.mjs runs this file in PGlite and
-- checks the bodies the triggers actually produce.
--
-- == Not changed =========================================================
--
-- notify_report_filed goes to the team's own inbox (pilot_team), not to a
-- participant, and the team reads Korean. It is left alone.
--
-- =========================================================================
-- Paste as is. It ends in `rollback;` and changes nothing: it applies the
-- functions, prints one body per language, and throws it all away.
--
-- It passes when all four are exactly this:
--
--     ko_has_english      0
--     en_has_korean       0
--     both_has_english    1
--     both_has_korean     1
--
-- Then change the last line to `commit;` and run it again.
-- The undo is 2026-09-01d-notify-in-one-language-ROLLBACK.sql, written
-- first.

begin;

-- Which language to write to somebody in. Reads the profile the app has had
-- all along; never fails, because a notification must not be lost over a
-- missing preference.
create or replace function public.notify_lang(p_user uuid)
returns text
language sql stable security definer set search_path = public as $fn$
  select case
    when p.languages @> array['한국어'] and not (p.languages @> array['English']) then 'ko'
    when p.languages @> array['English'] and not (p.languages @> array['한국어']) then 'en'
    else 'both'
  end
  from profiles p where p.id = p_user
$fn$;

-- One sentence, in one language. Every word the outbox says is here, so a
-- test can enumerate them — and so that changing what the app says is one
-- edit rather than four.
create or replace function public.notify_line(p_key text, p_lang text)
returns text
language sql immutable set search_path = public as $fn$
  select case p_key || '|' || coalesce(p_lang, 'both')

    -- seat_requested
    when 'req_subject|ko'   then '[밥친구] 자리 요청이 왔어요'
    when 'req_subject|en'   then '[Eatple] Somebody asked for a seat'
    when 'req_subject|both' then '[밥친구] 자리 요청이 왔어요 · Somebody asked for a seat'
    when 'req_asked|ko'     then '님이 당신의 밥상에 자리를 청했어요 — '
    when 'req_asked|en'     then ' asked to sit at your table — '
    when 'req_asked|both'   then ' asked to sit at your table — '
    when 'req_answer|ko'    then '요청에 답해 주세요. 답이 없으면 식사 12시간 전에 요청이 만료되고 좌석이 다시 풀립니다.'
    when 'req_answer|en'    then 'Please answer — unanswered requests lapse 12 hours before the meal and the seat opens up again.'
    when 'req_answer|both'  then '요청에 답해 주세요. 답이 없으면 식사 12시간 전에 요청이 만료되고 좌석이 다시 풀립니다.'
                                 || chr(10) || 'Please answer — unanswered requests lapse 12 hours before the meal and the seat opens up again.'

    -- seat_decided, accepted
    when 'yes_subject|ko'   then '[밥친구] 자리 확정!'
    when 'yes_subject|en'   then '[Eatple] Your seat is confirmed'
    when 'yes_subject|both' then '[밥친구] 자리 확정! · Your seat is confirmed'
    when 'yes_lead|ko'      then '호스트가 자리를 드렸어요. 밥상: '
    when 'yes_lead|en'      then 'The host said yes. Your table: '
    when 'yes_lead|both'    then 'The host said yes. Your table: '
    when 'yes_meet|ko'      then '만나는 요령(호스트 인상착의 등)은 밥상 페이지에 있어요 — 확정된 사람에게만 보입니다.'
    when 'yes_meet|en'      then 'How to spot the host is on the table page — visible to confirmed guests only.'
    when 'yes_meet|both'    then '만나는 요령(호스트 인상착의 등)은 밥상 페이지에 있어요 — 확정된 사람에게만 보입니다.'
                                 || chr(10) || 'How to spot the host is on the table page — visible to confirmed guests only.'

    -- seat_decided, declined
    when 'no_subject|ko'    then '[밥친구] 이번 밥상은 아쉽게 됐어요'
    when 'no_subject|en'    then '[Eatple] About your seat request'
    when 'no_subject|both'  then '[밥친구] 이번 밥상은 아쉽게 됐어요 · About your seat request'
    when 'no_lead|ko'       then '이번에는 자리를 드리지 못했어요 — 보통은 밥상이 다 찬 경우입니다.'
    when 'no_lead|en'       then 'The host could not fit you in this time — usually the table filled up.'
    when 'no_lead|both'     then 'The host could not fit you in this time — usually the table filled up.'
    when 'no_other|ko'      then '다른 밥상이 열려 있어요. 같은 메뉴를 직접 열면 그 상의 호스트는 당신입니다.'
    when 'no_other|en'      then 'Other tables are open — or open the same dish yourself and the seats are yours to give.'
    when 'no_other|both'    then '다른 밥상이 열려 있어요. 같은 메뉴를 직접 열면 그 상의 호스트는 당신입니다.'
                                 || chr(10) || 'Other tables are open — or open the same dish yourself and the seats are yours to give.'

    -- table_cancelled
    when 'off_subject|ko'   then '[밥친구] 밥상이 취소됐어요 — 가지 마세요'
    when 'off_subject|en'   then '[Eatple] Table cancelled, do not go'
    when 'off_subject|both' then '[밥친구] 밥상이 취소됐어요 — 가지 마세요 · Table cancelled, do not go'
    when 'off_lead|ko'      then '호스트가 밥상을 취소했어요. 예정이었던 시간: '
    when 'off_lead|en'      then 'The host called off the table planned for '
    when 'off_lead|both'    then 'The host called off the table planned for '
    when 'off_dont|ko'      then '만나기로 한 곳에 가지 마세요. 다른 밥상이 열려 있습니다.'
    when 'off_dont|en'      then 'Do not go to the meeting point. Other tables are open.'
    when 'off_dont|both'    then '만나기로 한 곳에 가지 마세요. 다른 밥상이 열려 있습니다.'
                                 || chr(10) || 'Do not go to the meeting point. Other tables are open.'

    -- The signature stays as it is in every language: it is the product's
    -- name in both scripts, not a sentence, and a Korean reader looking for
    -- "밥친구" in their inbox should find it whatever language the body is.
    else '— 밥친구 · Eatple'
  end
$fn$;

revoke all on function public.notify_lang(uuid) from public;
revoke all on function public.notify_line(text, text) from public;

-- ── the three that go to a participant ──────────────────────────────────

create or replace function public.notify_seat_requested() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t record;
  host_email text;
  lang text;
  who text;
begin
  select * into t from tables where id = new.table_id;
  if t.id is null or t.cancelled_at is not null then return null; end if;
  select email into host_email from member_details
    where id = t.host_id and email <> '';
  if host_email is null then return null; end if;

  lang := coalesce(public.notify_lang(t.host_id), 'both');
  who := coalesce(nullif(new.name, ''), case lang when 'ko' then '어떤 여행자' else 'A traveller' end);

  insert into notifications (kind, recipient, subject, body, table_id) values (
    'seat_requested', host_email,
    public.notify_line('req_subject', lang),
    -- Korean puts the postposition on the end of the name, so the line is
    -- built name-first in every language and the phrase carries the join.
    who || public.notify_line('req_asked', lang)
      || t.date || ' ' || to_char(t.time, 'HH24:MI') || ', ' || t.place || '.'
      || E'\n\n' || public.notify_line('req_answer', lang)
      || E'\n\n' || 'https://eatple.vercel.app/tables/' || t.id
      || E'\n\n' || public.notify_line('sig', lang),
    t.id);
  return null;
exception when others then return null;
end $$;

create or replace function public.notify_seat_decided() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t record;
  guest_email text;
  lang text;
begin
  if coalesce(old.status, '') <> 'pending' or new.status not in ('accepted', 'declined') then
    return null;
  end if;
  select * into t from tables where id = new.table_id;
  if t.id is null then return null; end if;
  select email into guest_email from member_details
    where id = new.user_id and email <> '';
  if guest_email is null then return null; end if;

  lang := coalesce(public.notify_lang(new.user_id), 'both');

  if new.status = 'accepted' then
    insert into notifications (kind, recipient, subject, body, table_id) values (
      'seat_decided', guest_email,
      public.notify_line('yes_subject', lang),
      public.notify_line('yes_lead', lang)
        || t.date || ' ' || to_char(t.time, 'HH24:MI') || ', ' || t.place || '.'
        || E'\n\n' || public.notify_line('yes_meet', lang)
        || E'\n\n' || 'https://eatple.vercel.app/tables/' || t.id
        || E'\n\n' || public.notify_line('sig', lang),
      t.id);
  else
    insert into notifications (kind, recipient, subject, body, table_id) values (
      'seat_decided', guest_email,
      public.notify_line('no_subject', lang),
      public.notify_line('no_lead', lang)
        || E'\n\n' || public.notify_line('no_other', lang)
        || E'\n\n' || 'https://eatple.vercel.app/'
        || E'\n\n' || public.notify_line('sig', lang),
      t.id);
  end if;
  return null;
exception when others then return null;
end $$;

create or replace function public.notify_table_cancelled() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r record;
  lang text;
begin
  if old.cancelled_at is not null or new.cancelled_at is null then return null; end if;
  for r in
    select md.email, s.user_id from public.signups s
    join public.member_details md on md.id = s.user_id and md.email <> ''
    where s.table_id = new.id
      and coalesce(s.status, 'accepted') in ('accepted', 'pending')
  loop
    lang := coalesce(public.notify_lang(r.user_id), 'both');
    insert into notifications (kind, recipient, subject, body, table_id) values (
      'table_cancelled', r.email,
      public.notify_line('off_subject', lang),
      public.notify_line('off_lead', lang)
        || new.date || ' ' || to_char(new.time, 'HH24:MI') || ', ' || new.place || '.'
        || E'\n\n' || public.notify_line('off_dont', lang)
        || E'\n\n' || 'https://eatple.vercel.app/'
        || E'\n\n' || public.notify_line('sig', lang),
      new.id);
  end loop;
  return null;
exception when others then return null;
end $$;

-- The triggers are not recreated: they point at these functions by identity,
-- and `create or replace function` swaps the body underneath them. Doing it
-- would take an ACCESS EXCLUSIVE lock on `signups` and `tables` for nothing.

-- == Verification, in the same transaction ================================
--
-- READ ONLY. Counts how many of the other language's sentences appear in a
-- body built for each language. The phrases are compared, not the script:
-- a guest called 조강민 belongs in an English mail and a place typed "sd"
-- belongs in a Korean one.

select
  (select count(*) from (values
      (public.notify_line('req_answer', 'en')),
      (public.notify_line('yes_meet', 'en')),
      (public.notify_line('off_dont', 'en'))) as e(line)
    where strpos(
      public.notify_line('req_answer', 'ko') || public.notify_line('yes_meet', 'ko')
        || public.notify_line('off_dont', 'ko'), e.line) > 0)      as ko_has_english,

  (select count(*) from (values
      (public.notify_line('req_answer', 'ko')),
      (public.notify_line('yes_meet', 'ko')),
      (public.notify_line('off_dont', 'ko'))) as k(line)
    where strpos(
      public.notify_line('req_answer', 'en') || public.notify_line('yes_meet', 'en')
        || public.notify_line('off_dont', 'en'), k.line) > 0)      as en_has_korean,

  (case when strpos(public.notify_line('req_answer', 'both'),
                    public.notify_line('req_answer', 'en')) > 0
        then 1 else 0 end)                                          as both_has_english,
  (case when strpos(public.notify_line('req_answer', 'both'),
                    public.notify_line('req_answer', 'ko')) > 0
        then 1 else 0 end)                                          as both_has_korean;

rollback;
