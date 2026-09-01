-- Close the participant list. Verified before it is kept.
--
-- Supersedes 2026-09-01-scope-profile-reads.sql, which was applied and rolled
-- back the same hour because it recursed. Read that file's post-mortem before
-- this one: the mistake it records is why this file is shaped the way it is.
--
-- == What is being closed =================================================
--
--     create policy profiles_read on public.profiles
--       for select to authenticated using (true);   -- and the same on signups
--
-- `authenticated` reads as "a member". Here it is not: every visitor is
-- signed in anonymously on arrival so that browsing works before signup, so
-- the role means "anything that has loaded the page, or can send one
-- request". Behind it sit 237 rows carrying a display name, a nationality,
-- the languages somebody speaks, and their gender.
--
-- Measured on production, 2026-09-01, twice. Count only, no row opened:
--
--     GET /rest/v1/profiles?select=id  ->  content-range: 0-236/237
--     GET /rest/v1/signups?select=id   ->  0 rows
--     role: authenticated, is_anonymous: true
--
-- == Why signups is in this file after all ================================
--
-- The first draft left it out, on the grounds that scoping it is not a policy
-- change but a product one: listAllSignups() at supabaseBackend.js:387 reads
-- every row unfiltered and seven components live on it, so making the row
-- count small for a stranger and keeping "2/4 seats taken" on every card are
-- the same number pulled in opposite directions.
--
-- That reasoning was right and the conclusion was wrong, because `signups` is
-- still empty. Closing it today costs nothing: every seat count it feeds is
-- zero either way. The first person to ask for a seat puts a name, a
-- nationality and a free-text note under `using (true)`, and from that moment
-- closing it takes something away from a screen somebody is looking at. This
-- is the only window in which it is free.
--
-- What was blocking it is one aggregate, and it is small. public.seat_holds()
-- below returns one row per held seat carrying the table and the status and
-- nothing else -- no user id, no name, no nationality, no note, no gender. A
-- stranger learns that a seat is taken, not who is in it. The client merges
-- those anonymous rows in for tables it cannot see into, so every existing
-- seat calculation keeps working untouched.
--
-- == What the app itself reads, checked line by line ======================
--
-- Every `.from('profiles')` in src/ is either filtered to a single id or is
-- not a read at all. In @supabase/postgrest-js select is GET, upsert and
-- insert are POST, update is PATCH:
--
--     supabaseBackend.js:149,159   upsert({ id })                   POST
--     supabaseBackend.js:179       select('*').eq('id', user.id)    GET, filtered
--     supabaseBackend.js:195,251   update(...).eq('id', user.id)    PATCH
--     supabaseBackend.js:226       insert(row)                      POST
--     supabaseBackend.js:283       select('is_verified_host').eq()  GET, filtered
--     supabaseBackend.js:630       select('name, avatar_url, languages').eq('id', hostId)
--     supabaseBackend.js:741,874,908  update(...).eq('id', ...)     PATCH
--
-- So the three requests to `profiles` seen at boot are the upsert (POST, no
-- query string, one row), the own-row select (GET, filtered), and the
-- Google-name adoption (PATCH). No code path asks for the whole table -- the
-- 237 came from a deliberate probe. Nothing needs deleting here: the policy
-- is the hole, not a call site.
--
-- == Why this one cannot recurse ==========================================
--
-- The last attempt asked `signups_read` a question about `signups`, so
-- evaluating the policy required evaluating the policy. Here every lookup
-- goes through a `security definer` function. Inside one of those the query
-- runs as the function's owner, who owns these tables, and no table is
-- marked `force row level security` -- so RLS does not apply inside, and
-- re-entry is impossible by construction rather than by care.
--
-- Same shape as public.table_preview() and public.assert_seat_available(),
-- both already in schema.sql. src/domain/__tests__/rlsPolicies.test.mjs runs
-- this file against a real Postgres and, before anything else, runs the
-- version that failed and requires it to fail there too.
--
-- =========================================================================
-- HOW TO RUN THIS
-- =========================================================================
--
-- Paste everything below into the Supabase SQL editor and run it AS IS. It
-- ends in `rollback;`, so it changes nothing: it applies the policies, reads
-- the database through them as a stranger, as a plain member and as a real
-- host, prints the numbers, and throws the whole thing away.
--
-- It passes when all of these are true:
--
--     stranger_sees_profiles   is a single digit
--     member_sees_own_row      is 1   <- the one that matters
--     member_sees_profiles     is a single digit
--     host_sees_own_row        is 1
--     host_sees_profiles       is a single digit
--     stranger_sees_signups    is 0
--     seat_holds_visible       equals signups_total
--
-- If it recurses instead, the transaction aborts: you get 42P17 and no table
-- of numbers. Production keeps the policies it has either way.
--
-- Then, and only then, change the last line from `rollback;` to `commit;`
-- and run it again.
--
-- ORDER MATTERS. Run this only once the client that reads seat_holds() is
-- deployed. Before that, closing signups makes every seat counter read zero
-- for a stranger -- which today is also the true answer, and stops being one
-- the moment somebody asks for a seat.

begin;

-- -- helpers ---------------------------------------------------------------

-- Somebody hosting a table that has not been called off and did not happen
-- long ago. Their name and face are the public side of that table: it is how
-- a traveller decides whether to ask for a seat, and safetyPromise.js says so
-- out loud.
--
-- The date window is deliberate and was missing from the first draft. With
-- `cancelled_at is null` alone, anybody who has ever hosted is public for
-- good, so the exposure grows for the whole life of the pilot and never
-- shrinks. The reason a host's name is published is that they are holding an
-- open invitation, and that reason expires with the meal.
--
-- Thirty days rather than `>= current_date`, because a link shared into a
-- KakaoTalk room outlives the dinner by a while and should still say who was
-- hosting. Nothing is lost at the cutoff: a guest of a past or cancelled
-- table reads that host through shares_a_table below, which has no time limit
-- at all. Your own evening stays yours.
create or replace function public.is_open_host(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from tables t
    where t.host_id = p_user
      and t.cancelled_at is null
      and t.date >= current_date - interval '30 days'
  )
$fn$;

-- Two people who have actually met over this app: one hosts a table the
-- other asked to sit at, either way round, or both asked to sit at the same
-- one. Deliberately symmetric, and deliberately unbounded in time -- a guest
-- keeps their record of the evening after it happens, and so does the host.
create or replace function public.shares_a_table(p_viewer uuid, p_other uuid)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from tables t
    join signups s on s.table_id = t.id
    where (t.host_id = p_other  and s.user_id = p_viewer)
       or (t.host_id = p_viewer and s.user_id = p_other)
    union all
    select 1 from signups mine
    join signups theirs on theirs.table_id = mine.table_id
    where mine.user_id = p_viewer and theirs.user_id = p_other
  )
$fn$;

-- Are you sitting at this table? This is exactly the question that recursed
-- last time, when it was asked as a subquery from inside signups' own policy.
create or replace function public.at_same_table(p_viewer uuid, p_table uuid)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from signups s
    where s.table_id = p_table and s.user_id = p_viewer
  )
$fn$;

revoke all on function public.is_open_host(uuid) from public;
revoke all on function public.shares_a_table(uuid, uuid) from public;
revoke all on function public.at_same_table(uuid, uuid) from public;
grant execute on function public.is_open_host(uuid) to authenticated;
grant execute on function public.shares_a_table(uuid, uuid) to authenticated;
grant execute on function public.at_same_table(uuid, uuid) to authenticated;

-- -- the policies ----------------------------------------------------------

drop policy if exists profiles_read on public.profiles;

create policy profiles_read on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or public.is_open_host(id)
    or public.shares_a_table(auth.uid(), id)
  );

-- Same rule, same reason. `note` here is free text: it is where somebody
-- writes the thing they need the host to know, and there is no telling what
-- that is until they have written it.
drop policy if exists signups_read on public.signups;

create policy signups_read on public.signups
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tables t
      where t.id = signups.table_id and t.host_id = auth.uid()
    )
    or public.at_same_table(auth.uid(), table_id)
  );

-- -- what a stranger gets instead ------------------------------------------

-- One row per held seat: which table, and how far the request got. Nothing
-- else. There is no column here that identifies anybody.
--
-- Declined requests are left out on purpose. Being turned away is the most
-- private state in this table, the client discards them anyway, and a count
-- that included them would tell a stranger how many people a host refused.
--
-- Returning the status rather than a total is what makes this enough. A
-- pending request holds a seat while only an accepted one counts as company
-- (src/domain/policy/seatRequest.js), and those are two different numbers on
-- the same card. Handing back the status keeps that rule in the one place it
-- is written instead of copying it into SQL, where the copy would drift.
create or replace function public.seat_holds()
returns table (table_id uuid, status text)
language sql stable security definer set search_path = public as $fn$
  select s.table_id, coalesce(s.status, 'accepted')
  from signups s
  join tables t on t.id = s.table_id
  where t.cancelled_at is null
    and coalesce(s.status, 'accepted') in ('pending', 'accepted')
$fn$;

-- The women-only filter, answered rather than enabled.
--
-- The earlier proposal was a `has_woman` boolean on every public table row.
-- That is worse than the column it replaces: on a four-seat table showing two
-- guests, the boolean identifies the third person, and a false-to-true flip
-- the moment somebody joins points at them exactly. A derived value about a
-- small group leaks as much as what it was derived from, and a derived value
-- that changes leaks more.
--
-- So the client sends the question and gets back only the tables that answer
-- it. No gender and no derived boolean is ever in a response, and nothing is
-- returned at all unless somebody turns the filter on.
create or replace function public.tables_with_woman()
returns setof uuid
language sql stable security definer set search_path = public as $fn$
  select t.id from tables t
  where t.cancelled_at is null
    and (t.host_gender = 'Woman'
      or exists (
        select 1 from signups s
        where s.table_id = t.id
          and s.gender = 'Woman'
          and coalesce(s.status, 'accepted') in ('pending', 'accepted')
      ))
$fn$;

revoke all on function public.seat_holds() from public;
revoke all on function public.tables_with_woman() from public;
grant execute on function public.seat_holds() to authenticated;
grant execute on function public.tables_with_woman() to authenticated;

-- -- verification, inside the same transaction -----------------------------
--
-- The counts are gathered by blocks that switch role, count, switch back,
-- and write the result as the owner -- so the temp table never has to be
-- granted to anybody.

create temp table rls_check (step text primary key, number bigint) on commit drop;

insert into rls_check
  select 'profiles_total', count(*) from public.profiles
  union all
  select 'signups_total',  count(*) from public.signups
  union all
  select 'tables_total',   count(*) from public.tables;

-- A visitor who has signed up for nothing: a uuid belonging to no row.
do $check$
declare p bigint; s bigint; h bigint;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into p from public.profiles;
  select count(*) into s from public.signups;
  select count(*) into h from public.seat_holds();
  reset role;
  insert into rls_check values
    ('stranger_sees_profiles', p),
    ('stranger_sees_signups',  s),
    ('seat_holds_visible',     h);
end
$check$;

-- A real host, taken from the oldest table.
do $check$
declare n bigint; own bigint; uid uuid;
begin
  select host_id into uid from public.tables order by created_at limit 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n   from public.profiles;
  select count(*) into own from public.profiles where id = uid;
  reset role;
  insert into rls_check values ('host_sees_profiles', n), ('host_sees_own_row', own);
end
$check$;

-- A plain member: somebody with a profile who hosts nothing and has asked for
-- no seat -- which is almost everybody here, 235 of the 237.
--
-- This is the row that matters most, and it took a deliberate break to find
-- out why. Checking "can somebody read their own row" against a *host* proves
-- nothing: a host is readable through is_open_host anyway, so the answer stays
-- 1 even if `id = auth.uid()` is deleted from the policy outright. Locking a
-- person out of their own record is the failure the first attempt shipped, so
-- it is checked against somebody who has no other way in.
do $check$
declare n bigint; own bigint; uid uuid;
begin
  select p.id into uid from public.profiles p
   where not exists (select 1 from public.tables  t where t.host_id = p.id)
     and not exists (select 1 from public.signups s where s.user_id = p.id)
   limit 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n   from public.profiles;
  select count(*) into own from public.profiles where id = uid;
  reset role;
  insert into rls_check values ('member_sees_profiles', n), ('member_sees_own_row', own);
end
$check$;

select step, number from rls_check
order by array_position(array[
  'profiles_total', 'stranger_sees_profiles',
  'member_sees_profiles', 'member_sees_own_row',
  'host_sees_profiles', 'host_sees_own_row',
  'signups_total', 'stranger_sees_signups', 'seat_holds_visible',
  'tables_total'], step);

rollback;
