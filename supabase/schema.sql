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

-- How to recognise the host at the meeting point.
--
-- Readable by anyone who can read the table, because tables_read is one broad
-- policy and narrowing it for a single column would mean a view and a second
-- read path. The gate is in the app instead — canSeeMeetingNote in
-- src/domain/policy/meeting.js shows it only to the host and to guests with a
-- confirmed seat.
--
-- Worth being straight about what that means: this is a UI-level gate, not an
-- RLS one, so anybody who reads the API directly can see it. That is an
-- acceptable trade for a sentence like "green jacket, by the CU" and would not
-- be for anything more identifying — which is the reason the field is capped
-- at 140 characters and described to hosts as a jacket and a landmark rather
-- than as free space.
alter table public.tables add column if not exists meeting_note text default '';

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

-- Where a seat request is between asking and eating.
--
-- The two-step add is the whole point and the order matters. Rows that
-- already existed were confirmed seats under the rules of the day they were
-- written, so they backfill to 'accepted'; only then does the default flip,
-- so everything asked for from now on arrives 'pending' and waits for the
-- host. Doing it the other way round would retroactively un-invite everyone
-- currently going to a table.
--
-- Both statements are safe to re-run: `add column if not exists` skips, and
-- setting a default that is already set is a no-op.
alter table public.signups add column if not exists status text not null default 'accepted';
alter table public.signups alter column status set default 'pending';

-- 'lapsed' is deliberately absent. A request that ran out of time is computed
-- from the meal's own clock (src/domain/policy/seatRequest.js), not written
-- here, because a pilot has nowhere to run the scheduled job that would set
-- it — and a status nothing updates would go stale and lie.
do $$ begin
  alter table public.signups
    add constraint signups_status_known check (status in ('pending', 'accepted', 'declined'));
exception when duplicate_object then null;
end $$;

create index if not exists signups_status_idx on public.signups (table_id, status);

-- Who actually turned up, recorded by the host after the meal.
--
-- Nullable with no default on purpose, and the null is the whole design: it
-- means nobody said anything, which is what will be true of almost every
-- meal. src/domain/policy/attendance.js reads that as "they came", because
-- the alternative — nothing counts until confirmed — would empty most
-- Passports to be technically careful and be wrong more often than the
-- version it replaced.
alter table public.signups add column if not exists attendance text;

do $$ begin
  alter table public.signups
    add constraint signups_attendance_known check (attendance is null or attendance in ('came', 'no_show'));
exception when duplicate_object then null;
end $$;

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

-- Delete stays permitted, and is no longer what the app does.
--
-- Calling a table off used to delete the row, which cascaded the signups with
-- it. The host's screen looked tidy; the guest's Passport lost the evening
-- with no sentence attached, and there are no notifications, so the next thing
-- that happened was somebody standing at a station exit for a meal nobody was
-- coming to. Cancelling now writes cancelled_at and keeps everything — see
-- src/domain/policy/cancellation.js.
--
-- The policy is left in place because a row somebody genuinely needs removed
-- (a mistake, a request from a person in it) should still be removable by its
-- host without a migration.
drop policy if exists tables_delete_own on public.tables;
create policy tables_delete_own on public.tables
  for delete to authenticated using (host_id = auth.uid());

-- Called off, and when. Null on every table that is still happening.
alter table public.tables add column if not exists cancelled_at timestamptz;

-- The host, and only the host, may call their own table off.
--
-- `using` refuses a table that is already cancelled, so this cannot be used to
-- un-cancel one: a guest who has been told the meal is off must not have that
-- reversed under them by the same button that told them. Reopening is opening
-- a new table, which is honest about what it is.
--
-- Column privileges do the rest, exactly as they do on signups: without them
-- an update policy on tables would also let a host rewrite the date, the place
-- or the seat count of a table people had already committed an evening to.
drop policy if exists tables_cancel_own on public.tables;
create policy tables_cancel_own on public.tables
  for update to authenticated
  using (host_id = auth.uid() and cancelled_at is null)
  with check (host_id = auth.uid() and cancelled_at is not null);

revoke update on public.tables from authenticated;
grant update (cancelled_at) on public.tables to authenticated;

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
    -- Asking is not the same as being let in. Without this a guest could
    -- insert themselves already accepted and walk straight past the host,
    -- which would make the whole approval step decorative.
    and status = 'pending'
    and not exists (
      select 1 from public.blocks b
      join public.tables t on t.id = table_id
      where b.blocker_id = t.host_id and b.blocked_id = auth.uid()
    )
  );

-- Answering a request belongs to the host of the table it is for, and to
-- nobody else — not even to the person who asked.
--
-- `using` picks the rows a host may touch; `with check` governs the row they
-- leave behind, so a host cannot answer and then answer differently, and
-- cannot park a request back in 'pending' after deciding.
-- One policy for both writes a host makes to a signup, because they are the
-- same permission: the host of this table, and nobody else, may change these
-- two fields. Which of the two is being written is settled by the column
-- grant below and by the check constraints, not by having two policies that
-- would drift apart.
--
-- `using` no longer says status = 'pending' on its own, because attendance is
-- written long after a seat was accepted. What it can still refuse is a
-- declined row: once a host has said no, that row is finished, and nothing —
-- not a second answer, not an attendance mark — may touch it again.
--
-- What this does NOT stop, stated plainly rather than implied away: a host
-- can flip an already-accepted seat to declined. RLS compares the row it is
-- handed, not the row against its previous self, so refusing that would need
-- a trigger. It is left alone because the same host can already delete the
-- signup outright under signups_delete_own_or_host, which is strictly more
-- destructive — and because the app never offers it: SeatRequestPolicy gates
-- the buttons on isPending and decideSignup narrows its update to
-- status = 'pending' on both backends. This is the floor, not the design.
drop policy if exists signups_decide_by_host on public.signups;
create policy signups_decide_by_host on public.signups
  for update to authenticated
  using (
    status <> 'declined'
    and exists (select 1 from public.tables t where t.id = table_id and t.host_id = auth.uid())
  )
  with check (
    status in ('accepted', 'declined')
    and (attendance is null or status = 'accepted')
    and exists (select 1 from public.tables t where t.id = table_id and t.host_id = auth.uid())
  );

-- RLS decides which rows may be updated, not which columns, so on its own the
-- policy above would also let a host rewrite a guest's name, nationality or
-- allergy note. Column privileges are the part of Postgres that does answer
-- that question, so update is granted on exactly one column and taken away
-- everywhere else. Without this a host could quietly edit what a guest told
-- the table they cannot eat.
revoke update on public.signups from authenticated;
grant update (status, attendance) on public.signups to authenticated;

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

-- ---------------------------------------------------------------------------
-- Membership (2026-08-03). Browsing stays anonymous; participating needs an
-- account with contact details the team can reach. Nothing is verified — no
-- confirmation mail, no SMS — by decision: the requirement was information
-- for running the pilot, and pretending to verify would be theatre.
--
-- Two dashboard switches this depends on, neither expressible in SQL:
--   Authentication → Sign In / Providers → Email → "Confirm email" OFF
--     (password sign-up without a verification round-trip)
--   Authentication → Providers → Google → configure client ID + secret
--     (the Google button errors politely until this is done)

-- The face a member chooses to show. Public by the same reasoning as name:
-- it exists to be recognised by, at a table and at a station exit.
alter table public.profiles add column if not exists avatar_url text default '';

-- Contact details, in their own table rather than on profiles, because RLS is
-- row-level and profiles is broadly readable on purpose (names and languages
-- are for other travellers). A phone number is not. This table's rows are
-- readable only by their owner; the team reads it from the dashboard, which
-- bypasses RLS by design — that is the 관리 측면 the meeting asked for.
create table if not exists public.member_details (
  id          uuid primary key references public.profiles(id) on delete cascade,
  email       text not null default '',
  phone       text not null default '',
  birthdate   date,
  created_at  timestamptz not null default now()
);

alter table public.member_details enable row level security;

drop policy if exists member_details_select_own on public.member_details;
create policy member_details_select_own on public.member_details
  for select to authenticated using (id = auth.uid());

drop policy if exists member_details_insert_own on public.member_details;
create policy member_details_insert_own on public.member_details
  for insert to authenticated with check (id = auth.uid());

drop policy if exists member_details_update_own on public.member_details;
create policy member_details_update_own on public.member_details
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- The avatars bucket. Public read — a photo chosen to be recognised by is
-- public in the same sense a name is — with writes fenced to your own folder
-- and a size cap doing the real enforcement of "small".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_write_own on storage.objects;
create policy avatars_write_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Reports (2026-08-03) — 김훈 부장님's 신고, the third leg after 차단 and 후기.
-- ---------------------------------------------------------------------------
-- A report is a row the team reads in the dashboard. That is the whole
-- mechanism: no moderation queue, no automatic action, and the app's receipt
-- text promises exactly that much (src/domain/policy/report.js).
--
-- Write-only by design. There is deliberately NO select policy — not even
-- for the reporter. Reading your own past reports back is a feature nobody
-- asked for, and the absence of any select path means a leaked anon key
-- cannot enumerate who reported whom, which is the most damaging read this
-- table could serve. The team reads it from the dashboard, which bypasses
-- RLS by design.
--
-- table_id keeps `on delete set null` rather than cascade: a report about a
-- table must survive the table's own deletion, because deleting the evidence
-- is exactly the move a bad actor would reach for.

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  table_id     uuid references public.tables(id) on delete set null,
  reason       text not null check (reason in ('safety', 'person', 'fake', 'other')),
  note         text not null default '' check (char_length(note) <= 300),
  created_at   timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Any session may report, member or not — the person most likely to need
-- this is a guest who followed a shared link and saw something wrong on it.
drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Reviews (2026-08-03) — one line per seat, written after the meal.
-- ---------------------------------------------------------------------------
-- The human half of the trust record; attendance is the honest half. Keyed by
-- the signup itself, so "one review per person per table" is the primary key
-- rather than a rule somebody has to remember, and an upsert makes rewriting
-- your line the same act as writing it.
--
-- Its own table rather than columns on signups, for an RLS reason worth
-- recording: signups' update policies are OR'd permissive policies, and the
-- host already holds one of them (signups_decide_by_host). Adding a review
-- column grant there would let a host pass their own policy's WITH CHECK
-- while writing a guest's review text — the same crosstalk the column grant
-- on signups exists to prevent. A separate table gets its own policies with
-- no host in them at all.
--
-- The gate on WHO may write is the accepted seat, checked against the
-- signups table itself. The gate on WHEN — after the meal, not on a
-- cancelled table, not from a recorded no-show — lives in
-- src/domain/policy/review.js. This is the floor, not the whole rule.

create table if not exists public.reviews (
  signup_id   uuid primary key references public.signups(id) on delete cascade,
  table_id    uuid not null references public.tables(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null default '',
  body        text not null check (char_length(body) between 1 and 200),
  created_at  timestamptz not null default now()
);

create index if not exists reviews_table_idx on public.reviews (table_id);

alter table public.reviews enable row level security;

-- Readable by anyone who can read the table: a review exists to be read by
-- the next stranger deciding whether to sit down.
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
  for select to authenticated using (true);

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.signups s
      where s.id = signup_id and s.user_id = auth.uid()
        and coalesce(s.status, 'accepted') = 'accepted'
    )
  );

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own on public.reviews
  for delete to authenticated using (user_id = auth.uid());

-- One photo of the meal that happened, travelling with the line (2026-08-04).
--
-- Every comparable product sells with pictures — 여기어때 with rooms, Meetup
-- with the last event, 당근 with the item — and this one had none, which for
-- a food app is a gap in the argument rather than in the polish.
--
-- On reviews rather than on tables, so the gate is already right: only
-- somebody who held an accepted seat at a meal that happened can attach one.
-- A photo of a dinner is evidence, and evidence has to come from a witness.
alter table public.reviews add column if not exists photo_url text default '';

-- The bucket. Public read, because a photo posted to persuade the next
-- traveller is public in the same sense the line beside it is. Writes fenced
-- to your own folder by the same storage.foldername check the avatars bucket
-- uses, and a 5MB cap doing the real enforcement of "one photo" — the client
-- downscales to ~1280px long edge before uploading, which lands far under it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('table-photos', 'table-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists table_photos_read on storage.objects;
create policy table_photos_read on storage.objects
  for select using (bucket_id = 'table-photos');

drop policy if exists table_photos_write_own on storage.objects;
create policy table_photos_write_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'table-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists table_photos_update_own on storage.objects;
create policy table_photos_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'table-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists table_photos_delete_own on storage.objects;
create policy table_photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'table-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- The last hundred metres, socially (2026-08-04): a host may attach an open
-- chat link (카카오 오픈채팅) to their table. The app deliberately builds no
-- chat of its own — a pilot cannot moderate one — so this borrows the tool
-- everybody in Korea already has. Shown to the host and confirmed guests
-- only, same UI gate as meeting_note, and the same honesty about what that
-- means: an API reader can see it, which is acceptable for a link the host
-- chose to share with strangers they invited.
alter table public.tables add column if not exists chat_url text default '';

-- Where the table is, when the host pointed at a map (2026-08-04).
--
-- 김훈 부장님 asked for 구글 지도 API를 연계하여 모임 장소 표시. Nullable and
-- unconstrained here on purpose: the app refuses an implausible coordinate in
-- src/domain/policy/place.js, where the reasoning can be read and tested,
-- rather than in a check constraint that would only produce "그것이 저장되지
-- 않았습니다" at the moment a host is trying to open a table.
--
-- Deliberately NOT geocoded from `place`. That column holds "홍대입구 3번
-- 출구" and "the CU by the station"; a geocoder turns those into a
-- coordinate that looks exactly as confident as a true one while being a
-- block away. Standing at the wrong exit at 19:00 is the failure this app
-- exists to prevent, so the only points stored are the ones a person put
-- there.
alter table public.tables add column if not exists lat double precision;
alter table public.tables add column if not exists lng double precision;

-- ---------------------------------------------------------------------------
-- Link previews (2026-08-04). A shared table link unfurls in KakaoTalk with
-- the dish and the evening on it, which is what 핵심기능 5 (SNS 확산) needs
-- the link to do. The unfurler is a bot with no session, and tables_read is
-- `to authenticated`, so this RPC exposes exactly the card's worth of fields
-- to `anon` — nothing personal: no host name, no guest list, no notes.
create or replace function public.table_preview(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  t record;
  n integer;
begin
  select * into t from tables where id = p_id;
  if t.id is null then return null; end if;
  select count(*) into n from signups s
    where s.table_id = t.id and coalesce(s.status, 'accepted') = 'accepted';
  return jsonb_build_object(
    'menuId', t.menu_id,
    'date', t.date,
    'time', to_char(t.time, 'HH24:MI'),
    'place', t.place,
    'seats', t.seats,
    'cancelled', t.cancelled_at is not null,
    'accepted', n
  );
end $$;

revoke all on function public.table_preview(uuid) from public;
grant execute on function public.table_preview(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Notifications (2026-08-04) — the outbox that closes the app's oldest hole.
-- ---------------------------------------------------------------------------
-- There are no push notifications and no in-app inbox, so until now the only
-- way anybody learned anything was opening the app. With member emails on
-- file that is no longer a law of nature. The shape is an outbox: triggers
-- write rows here, and a separate sender (the send-notifications Edge
-- Function) delivers them and stamps sent_at.
--
-- The decoupling is the point. If the Edge Function is not deployed yet,
-- rows simply accumulate, readable in the dashboard — the schema can land
-- today and the sender whenever the team sets it up. Nothing user-facing
-- breaks in between.
--
-- No RLS policies on purpose: no client ever reads or writes this table.
-- Triggers write as definer; the sender reads with the service role key.

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('seat_requested', 'seat_decided', 'table_cancelled', 'report_filed')),
  recipient   text not null,
  subject     text not null,
  body        text not null,
  table_id    uuid,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);

alter table public.notifications enable row level security;

-- Where 신고 alerts go. One row, entered by the team in the dashboard
-- (Table Editor → pilot_team → Insert row). Empty table = no report emails,
-- which is a choice the team can see rather than a silent default.
create table if not exists public.pilot_team (
  email text primary key
);

alter table public.pilot_team enable row level security;

-- Every trigger below swallows its own errors. A notification is never worth
-- failing the action it describes: a seat request that cannot be emailed
-- about must still be a seat request.

-- 요청 도착 → 호스트에게. The email that fixes "the approval rate equals
-- the chance the host happens to open the app".
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
      || E'\n\n' || 'https://test-umber-phi-78.vercel.app/tables/' || t.id
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
        || E'\n\n' || 'https://test-umber-phi-78.vercel.app/tables/' || t.id
        || E'\n\n' || '— 밥친구 · Eatple',
      t.id);
  else
    insert into notifications (kind, recipient, subject, body, table_id) values (
      'seat_decided', guest_email,
      '[밥친구] 이번 밥상은 아쉽게 됐어요 · About your seat request',
      'The host could not fit you in this time — usually the table filled up.'
        || E'\n\n' || '다른 밥상이 열려 있어요. 같은 메뉴를 직접 열면 그 상의 호스트는 당신입니다.'
        || E'\n' || 'Other tables are open — or open the same dish yourself and the seats are yours to give.'
        || E'\n\n' || 'https://test-umber-phi-78.vercel.app/'
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
        || E'\n\n' || 'https://test-umber-phi-78.vercel.app/'
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
           then E'\n\n' || 'Table: https://test-umber-phi-78.vercel.app/tables/' || new.table_id
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

create or replace function public.notify_dispatch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://zqpxyhygvenlcjaoxcns.supabase.co/functions/v1/send-notifications',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return null;
exception when others then return null;
end $$;

drop trigger if exists trg_notify_dispatch on public.notifications;
create trigger trg_notify_dispatch
  after insert on public.notifications
  for each row execute function public.notify_dispatch();
