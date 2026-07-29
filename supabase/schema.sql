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
  place         text not null,
  seats         integer not null check (seats between 2 and 8),
  note          text default '',
  created_at    timestamptz not null default now()
);

create index if not exists tables_date_idx on public.tables (date, time);

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

create or replace function public.assert_seat_available()
returns trigger
language plpgsql
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

drop policy if exists tables_insert_own on public.tables;
create policy tables_insert_own on public.tables
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists tables_delete_own on public.tables;
create policy tables_delete_own on public.tables
  for delete to authenticated using (host_id = auth.uid());

drop policy if exists signups_read on public.signups;
create policy signups_read on public.signups
  for select to authenticated using (true);

drop policy if exists signups_insert_own on public.signups;
create policy signups_insert_own on public.signups
  for insert to authenticated with check (user_id = auth.uid());

-- Giving up your seat is yours to do; so is removing somebody from a table
-- you are hosting, because a host who cannot manage their own table has to
-- solve no-shows by text message instead.
drop policy if exists signups_delete_own_or_host on public.signups;
create policy signups_delete_own_or_host on public.signups
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.tables t where t.id = table_id and t.host_id = auth.uid())
  );

-- Verification is granted by an administrator in the Supabase dashboard:
--   update public.profiles set is_verified_host = true where id = '<uuid>';
-- There is deliberately no policy allowing a user to set this on themselves.
