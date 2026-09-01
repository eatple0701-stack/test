-- Stop handing every visitor the whole participant list.
--
-- ── What was measured, on production, on 2026-09-01 ─────────────────────
--
-- An anonymous session — the one this app creates for everybody on their
-- first load, before they have signed up for anything — could read every
-- row of `profiles`. Two hundred and thirty-seven of them, on day one of
-- 2차 운영, each carrying a display name, a nationality, the languages
-- somebody speaks and their gender.
--
-- Only the count was read while confirming this. Nobody's row was opened.
--
--     GET /rest/v1/profiles?select=id   →  content-range: 0-236/237
--     role: authenticated, is_anonymous: true
--
-- The cause is one word:
--
--     create policy profiles_read on public.profiles
--       for select to authenticated using (true);
--
-- `authenticated` sounds like "a member". In this app it is not: everybody
-- is signed in anonymously on arrival so that browsing works before signup,
-- so `authenticated` means "anybody who has ever loaded the page", which
-- includes anything that can run a fetch.
--
-- `signups` has the identical policy and returned 0 rows only because no
-- pilot signup existed yet at the moment of the check. That table holds a
-- name, a nationality and a free-text `note` — where a person types the
-- thing they most want the host to know. It becomes the same exposure the
-- first time somebody takes a seat, which is expected today.
--
-- ── What this changes it to ────────────────────────────────────────────
--
-- A relationship test rather than a blanket true. You may read somebody's
-- profile if you are them, if either of you hosts a table the other has
-- asked to sit at, if you are sitting at the same table, or if they are
-- hosting a table that is open right now — because the host's name and face
-- are how a traveller decides whether to ask, and a host publishing a table
-- has published that much on purpose.
--
-- Deliberately chosen over the two alternatives:
--
--   Column grants (revoke select … / grant select (id, name, …)) are the
--   idiom this schema already uses on `tables.cancelled_at`, and they do
--   not work here. Column privileges are not row-aware, so revoking
--   `nationality` from `authenticated` also revokes it from the person it
--   belongs to, and the profile screen stops being able to read itself.
--
--   Own-row-only plus a security-definer function for the public face is
--   the cleaner long-term shape and matches `table_preview`. It also
--   requires changing two client call sites and redeploying before it is
--   safe, which is not what to do to a pilot's auth layer on its first day.
--   This policy needs no client change at all: every read the app performs
--   today is still permitted, and the ones nobody performs stop.
--
-- ── Applying it ────────────────────────────────────────────────────────
--
-- Paste into the Supabase SQL editor. It is idempotent and reversible —
-- the rollback at the bottom restores exactly what is there now.
--
-- Verify afterwards from a signed-out browser, in the console:
--
--   await fetch(SUPABASE_URL + '/rest/v1/profiles?select=id',
--     { method:'HEAD', headers:{ apikey: ANON, Authorization: 'Bearer ' + TOKEN,
--       Prefer:'count=exact', Range:'0-0' } })
--     .then(r => r.headers.get('content-range'))
--
-- Before: 0-236/237. After, for a visitor who has signed up for nothing:
-- their own row plus the hosts of any open tables.

begin;

-- ── profiles ────────────────────────────────────────────────────────────

drop policy if exists profiles_read on public.profiles;

create policy profiles_read on public.profiles
  for select to authenticated using (
    -- yourself
    id = auth.uid()

    -- somebody hosting a table that is open. Their name and face are the
    -- public side of that table, and this is what the tables list renders
    -- before anybody has asked for a seat.
    or exists (
      select 1 from public.tables t
      where t.host_id = public.profiles.id
        and t.cancelled_at is null
    )

    -- somebody hosting a table you asked to sit at, open or not — a guest
    -- keeps their record of the evening after it happens.
    or exists (
      select 1
      from public.tables t
      join public.signups s on s.table_id = t.id
      where t.host_id = public.profiles.id
        and s.user_id = auth.uid()
    )

    -- somebody who asked to sit at a table you host
    or exists (
      select 1
      from public.signups s
      join public.tables t on t.id = s.table_id
      where s.user_id = public.profiles.id
        and t.host_id = auth.uid()
    )

    -- somebody sitting at a table you are also sitting at. Without this the
    -- who-row on a table you joined renders the other guests faceless.
    or exists (
      select 1
      from public.signups mine
      join public.signups theirs on theirs.table_id = mine.table_id
      where mine.user_id = auth.uid()
        and theirs.user_id = public.profiles.id
    )
  );

-- ── signups ─────────────────────────────────────────────────────────────
--
-- Same rule, same reason. `note` is free text: it is where somebody writes
-- the thing they need the host to know, and there is no telling what that
-- is until they have written it.

drop policy if exists signups_read on public.signups;

create policy signups_read on public.signups
  for select to authenticated using (
    -- your own seat
    user_id = auth.uid()

    -- a seat at a table you host
    or exists (
      select 1 from public.tables t
      where t.id = public.signups.table_id
        and t.host_id = auth.uid()
    )

    -- a seat at a table you are also sitting at
    or exists (
      select 1 from public.signups mine
      where mine.table_id = public.signups.table_id
        and mine.user_id = auth.uid()
    )
  );

commit;

-- ── Rollback, if something the app needs turns out to be missing ────────
--
-- Restores the policies exactly as they were before this file. Use it and
-- say what broke, rather than adding a clause under time pressure.
--
--   begin;
--   drop policy if exists profiles_read on public.profiles;
--   create policy profiles_read on public.profiles
--     for select to authenticated using (true);
--   drop policy if exists signups_read on public.signups;
--   create policy signups_read on public.signups
--     for select to authenticated using (true);
--   commit;
--
-- ── Still open after this ──────────────────────────────────────────────
--
-- `gender` is readable by anybody who passes the test above, and it is not
-- in the list of fields docs/개인정보-수집-실태.md says other participants
-- see (표시명, 국적, 사용 언어, 밥상 수). Narrowing it needs the
-- security-definer shape described at the top, and a client change to go
-- with it. Worth doing after 시범운영, not during it.
