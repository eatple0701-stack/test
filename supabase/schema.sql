-- 밥친구 — shared storage for tables and signups.
--
-- Run this once in the Supabase SQL editor after creating the project.
-- It is written to be safe to run twice.
--
-- Why this file exists at all: localStorage keeps a table inside one browser
-- on one device. A host opening a table on a laptop writes to that laptop; a
-- traveller opening the same URL on a phone reads their own empty phone.
-- Deploying to Vercel does not change that — deployment ships the app, not
-- the data. Shared tables need shared storage, and this is it.

-- ---------------------------------------------------------------------------
-- Profiles — one row per signed-in person.
-- ---------------------------------------------------------------------------
-- The pilot signs people in anonymously, so a row here is created the first
-- time somebody opens a table or takes a seat. `is_verified_host` is the
-- business plan's 인증 호스트 flag and is written by an administrator, never
-- by the person themselves — a self-awarded verification badge would be worse
-- than no badge at all.

create table if not exists public.profiles (
  id                uuid primary key references auth.users on delete cascade,
  name              text,
  nationality       text,
  languages         text[] default '{}',
  is_verified_host  boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Self-declared, like nationality — never verified, never used by the app to
-- judge a dish. Powers only the "tables with another woman" filter on Tables
-- (src/domain/catalog/genders.js). See HANDOFF.md §4: praised by a reviewer
-- for existing before it did.
alter table public.profiles add column if not exists gender text;

-- The rules agreement 교수님's review asked for (src/domain/policy/consent.js).
-- Two columns rather than a boolean: the version says *what* was agreed to,
-- so bumping PURPOSE.version asks everyone again instead of letting an old
-- yes stand for a rule nobody saw, and the timestamp is the only part that
-- is answerable after the fact.
alter table public.profiles add column if not exists rules_version integer;
alter table public.profiles add column if not exists rules_agreed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Tables — a meal somebody is opening seats at.
-- ---------------------------------------------------------------------------
-- `seats` counts everyone including the host, matching how the app words it
-- ("counting you"). The check mirrors the client-side rule so a malformed
-- request cannot create a one-person table for a two-person dish.

create table if not exists public.tables (
  id            uuid primary key default gen_random_uuid(),
  menu_id       text not null,
  host_id       uuid not null references public.profiles(id) on delete cascade,
  host_name     text not null,
  host_nationality text,
  -- Copied from the host's profile when the table is opened rather than
  -- joined on every read. It can go stale between a verification and the next
  -- table, which is acceptable: verification is not revoked mid-week, and the
  -- alternative is a join on the hottest query in the app.
  host_verified boolean not null default false,
  date          date not null,
  time          time not null,
  -- Two different places, and a table needs both. `place` is where you meet
  -- (a station exit); `restaurant` is where you eat. A table naming only the
  -- exit leaves everybody standing outside the wrong shop. Nullable because a
  -- host may not have decided yet, in which case the card says so.
  place         text not null,
  restaurant    text default '',
  seats         integer not null check (seats between 2 and 8),
  note          text default '',
  created_at    timestamptz not null default now()
);

create index if not exists tables_date_idx on public.tables (date, time);

-- Safe to re-run against a project created before `restaurant` existed.
alter table public.tables add column if not exists restaurant text default '';

-- The host as 문화 큐레이터, which is the plan's actual definition of the role.
--
-- host_kind is the team's column. It records which vetted category a checked
-- host falls into — 미식 동아리, 국제교류 동아리, 한식 전공, 로컬 푸드 크리에이터
-- — and like host_verified it is set out of band, by whoever did the checking,
-- never by the app. There is deliberately no policy granting an update of
-- either column to anyone: verification is not a thing a user can perform on
-- themselves, and the way to guarantee that is to give the client no route.
alter table public.tables add column if not exists host_kind text;

-- Copied from the host's profile at table-open time, same treatment as
-- host_nationality — self-declared, not a credential, and unlike
-- host_verified/host_kind it IS the host's own to set.
alter table public.tables add column if not exists host_gender text;

-- guides is the host's own promise about what they will explain tonight, so
-- unlike the two above it is theirs to write. Constrained to the catalog's
-- four ids so a row cannot carry a label the app never wrote.
alter table public.tables add column if not exists guides text[] not null default '{}';

-- What the evening runs in. The Profile has collected this from every user
-- since it was built, and its own hint promises it is so a host knows what the
-- table will run in — while nothing anywhere showed it to anyone.
alter table public.tables add column if not exists languages text[] not null default '{}';

alter table public.tables drop constraint if exists tables_guides_known;
alter table public.tables add constraint tables_guides_known
  check (guides <@ array['order', 'eat', 'manners', 'origin']::text[]);

-- ---------------------------------------------------------------------------
-- Signups — one seat taken.
-- ---------------------------------------------------------------------------

create table if not exists public.signups (
  id          uuid primary key default gen_random_uuid(),
  table_id    uuid not null references public.tables(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  nationality text,
  note        text default '',
  created_at  timestamptz not null default now(),
  -- The database, not the browser, is what actually stops the same person
  -- taking two seats at one table.
  unique (table_id, user_id)
);

create index if not exists signups_table_idx on public.signups (table_id);

-- Added after the table exists, which is the whole reason these two live down
-- here and not up with the `tables` columns they were written beside. On a
-- fresh project the file runs top to bottom, so an ALTER above its own CREATE
-- fails on the first line it reaches — "relation public.signups does not
-- exist" — and takes the rest of the file with it.

-- What a guest speaks, so a table can be matched to somebody who can follow it.
alter table public.signups add column if not exists languages text[] not null default '{}';

-- How a guest describes their own eating, in their own word. Not a claim the
-- app makes about a dish — a message to the host, who can ask the kitchen.
alter table public.signups add column if not exists diets text[] not null default '{}';

-- What a guest told the table about their gender, same treatment as diets:
-- carried, not judged. Powers the "tables with another woman" filter, which
-- counts a table's host and every current signup.
alter table public.signups add column if not exists gender text;

-- Free text, unlike the five fixed booleans this repo also carries as
-- request-level flags — a guest hits the edge of a fixed list eventually
-- ("what if ur allergic to prawns" covered shellfish; a nut or sesame
-- allergy would not have had a box). Never matched against a menu's
-- ingredients — there is no vocabulary here to match against — so this
-- is carried exactly like diets and never rendered as a checked fact.
alter table public.signups add column if not exists allergy_note text default '';

-- ---------------------------------------------------------------------------
-- Blocks — one person deciding not to sit with another again.
-- ---------------------------------------------------------------------------
-- Named in NOT_YET_BUILT (src/content/safety.js) since the pilot's first
-- draft: "Blocking somebody so they cannot see your tables". Two independent
-- effects come out of the same row —
--
--   1. The blocker's own screens stop showing the blocked person's tables.
--      Pure client-side filtering (src/domain/policy/blocking.js), reading
--      only the blocker's own rows — nobody needs a database rule to decide
--      what they personally would rather not see.
--   2. The blocked person can no longer take a seat at a table the blocker
--      hosts. That one has to be a database rule (see signups_insert_own
--      below) — a client-side check is a check the blocked person's own
--      browser could simply not run.
--
-- Deliberately NOT retroactive: blocking does not remove an existing signup.
-- A host who wants a specific person gone from a table already happening has
-- signups_delete_own_or_host for that, which is a different decision with
-- different stakes than not sitting with them again.
create table if not exists public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  -- The name at the moment of blocking, so an "unblock" list can read like
  -- one without a join back through profiles — the same reason tables.host_name
  -- is copied rather than looked up.
  blocked_name text not null default '',
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocker_idx on public.blocks (blocker_id);

-- ---------------------------------------------------------------------------
-- Overbooking guard
-- ---------------------------------------------------------------------------
-- The client checks seats before offering the button, and that check cannot
-- be trusted the moment two phones are involved: both read "1 seat left" and
-- both submit. This runs inside the insert, takes a lock on the table row, and
-- serialises the race — so the second one fails instead of producing a fourth
-- person at a table for three.
--
-- The host occupies one of the seats they opened, so a signup is allowed only
-- while (1 host + existing signups) is still under capacity.

-- security definer, and it is not optional.
--
-- The lock above is `select … for update`, and a locking read needs a policy
-- that permits UPDATE on the row — a SELECT policy is not enough. There is
-- deliberately no update policy on public.tables, because nobody should be
-- editing somebody else's dinner. So under the caller's own permissions RLS
-- filtered the row out of the locking read, capacity came back null, and the
-- guard raised table_not_found on a table that was plainly there.
--
-- The app rendered that as "This table is no longer here." Every signup in
-- the pilot would have failed that way: not a rare race, the ordinary path,
-- for everybody. Found by taking a seat from a second browser rather than by
-- reading this file.
--
-- search_path is pinned because a security definer function that resolves
-- names through the caller's path is a privilege escalation waiting to be
-- found.
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

drop trigger if exists signups_seat_guard on public.signups;
create trigger signups_seat_guard
  before insert on public.signups
  for each row execute function public.assert_seat_available();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- The anon key ships inside the browser bundle and must be treated as public.
-- Without these policies anyone who opened the page could delete every table
-- in the pilot. Reading is open to signed-in users because a table nobody can
-- see is not a table; writing is restricted to your own rows.

alter table public.profiles enable row level security;
alter table public.tables   enable row level security;
alter table public.signups  enable row level security;
alter table public.blocks   enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_write_own on public.profiles;
create policy profiles_write_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists tables_read on public.tables;
create policy tables_read on public.tables
  for select to authenticated using (true);

-- A host may open a table as themselves, and may not arrive verified.
--
-- The host_id check alone was not enough: it left host_verified writable on
-- insert, so anyone able to craft a request could hand themselves the badge
-- the whole trust model rests on — and it is the one claim in this app a
-- traveller would actually act on when deciding to meet a stranger. The badge
-- is granted afterwards, by the team, out of band.
drop policy if exists tables_insert_own on public.tables;
create policy tables_insert_own on public.tables
  for insert to authenticated
  with check (
    host_id = auth.uid()
    and host_verified = false
    and host_kind is null
  );

drop policy if exists tables_delete_own on public.tables;
create policy tables_delete_own on public.tables
  for delete to authenticated using (host_id = auth.uid());

drop policy if exists signups_read on public.signups;
create policy signups_read on public.signups
  for select to authenticated using (true);

-- A blocked person cannot take a seat at a table the blocker hosts. This is
-- the half of blocking that has to live here rather than in the client: the
-- person being kept out is exactly the person whose browser cannot be
-- trusted to enforce it on itself.
--
-- Deliberately does not also check the reverse (blocker joining a table the
-- blocked person hosts) — the blocker already filters that host's tables out
-- of their own screens (src/domain/policy/blocking.js), so they would need a
-- direct link to even attempt it, and blocking someone was never a promise
-- that the app would police where the blocker chooses to go.
drop policy if exists signups_insert_own on public.signups;
create policy signups_insert_own on public.signups
  for insert to authenticated with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.blocks b
      join public.tables t on t.id = table_id
      where b.blocker_id = t.host_id and b.blocked_id = auth.uid()
    )
  );

-- Giving up your seat is yours to do; so is removing somebody from a table
-- you are hosting, because a host who cannot manage their own table has to
-- solve no-shows by text message instead.
drop policy if exists signups_delete_own_or_host on public.signups;
create policy signups_delete_own_or_host on public.signups
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.tables t where t.id = table_id and t.host_id = auth.uid())
  );

-- Select is deliberately narrower than every other table in this file: a
-- blocker can read their own outgoing blocks (to build an unblock list) and
-- nothing else. Nobody can query whether they themselves have been blocked —
-- most platforms keep this ambiguous on purpose, since telling a person they
-- were blocked is information that can escalate exactly the situation
-- blocking exists to defuse. The join-prevention in signups_insert_own above
-- enforces the effect without ever exposing the fact.
drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
  for select to authenticated using (blocker_id = auth.uid());

drop policy if exists blocks_insert_own on public.blocks;
create policy blocks_insert_own on public.blocks
  for insert to authenticated with check (blocker_id = auth.uid());

drop policy if exists blocks_delete_own on public.blocks;
create policy blocks_delete_own on public.blocks
  for delete to authenticated using (blocker_id = auth.uid());

-- Verification is granted by an administrator in the Supabase dashboard:
--   update public.profiles set is_verified_host = true where id = '<uuid>';
-- There is deliberately no policy allowing a user to set this on themselves.
