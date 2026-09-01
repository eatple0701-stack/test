-- Close the participant list. Second attempt, verified before it is kept.
--
-- Supersedes 2026-09-01-scope-profile-reads.sql, which was applied and rolled
-- back the same hour because it recursed. Read that file's post-mortem before
-- this one: the mistake it records is why this file is shaped the way it is.
--
-- == What is being closed =================================================
--
--     create policy profiles_read on public.profiles
--       for select to authenticated using (true);
--
-- `authenticated` reads as "a member". Here it is not: every visitor is
-- signed in anonymously on arrival so that browsing works before signup, so
-- the role means "anything that has loaded the page, or can send one
-- request". Behind it sit 237 rows carrying a display name, a nationality,
-- the languages somebody speaks, and their gender.
--
-- Measured on production, 2026-09-01. Count only, no row opened:
--
--     GET /rest/v1/profiles?select=id  ->  content-range: 0-236/237
--     role: authenticated, is_anonymous: true
--
-- == What the app itself reads, checked line by line ======================
--
-- Every `.from('profiles')` in src/ is either filtered to a single id or is
-- not a read at all. In @supabase/postgrest-js, select is GET, upsert and
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
-- Two reads do cross users, and both are covered below. hostRecord() reads
-- the host of a table being shown, and signups are selected as
-- `*, profiles (avatar_url)` for the avatar stack.
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
-- both already in schema.sql.
--
-- == signups is NOT in this file, and that is deliberate ==================
--
-- `signups_read` stays `using (true)` today. Scoping it is not a policy
-- change but a product change, because it is the same read as the seat
-- counter:
--
--   listAllSignups() at supabaseBackend.js:387 selects every signup with no
--   filter, and seven components live on it -- TablesTab (seats taken, the
--   women-only filter, the avatar stack), TablesMap (seatsRemaining),
--   TableRequest, TablesLead, TodayTable, TravelSummary, JournalPanel.
--
-- Making `signups_visible` small for a stranger and keeping "2/4 seats
-- taken" on every card are the same number pulled in opposite directions.
-- Closing it needs a security-definer aggregate that returns counts without
-- rows, plus the client moved onto it -- a deploy, not a paste. Tracked as
-- track 1b in docs/public-table-columns.md.
--
-- Doing profiles today anyway rather than waiting to do both: the 237 rows
-- of name, nationality and gender are the measured exposure, and a partial
-- fix now beats a complete one on Thursday.
--
-- =========================================================================
-- HOW TO RUN THIS
-- =========================================================================
--
-- Paste everything below into the Supabase SQL editor and run it AS IS. It
-- ends in `rollback;`, so it changes nothing: it applies the policy, reads
-- the database through it as a stranger, as a plain member and as a real
-- host, prints the numbers, and throws the whole thing away.
--
-- It passes when all five of these are true:
--
--     stranger_sees_profiles   is a single digit
--     member_sees_own_row      is 1   <- the one that matters
--     member_sees_profiles     is a single digit
--     host_sees_own_row        is 1
--     host_sees_profiles       is a single digit
--
-- If it recurses instead, the transaction aborts: you get 42P17 and no table
-- of numbers. Production keeps the policy it has either way.
--
-- Then, and only then, change the last line from `rollback;` to `commit;`
-- and run it again.

begin;

-- -- helpers ---------------------------------------------------------------

-- Somebody hosting a table that has not been called off. Their name and face
-- are the public side of that table: it is how a traveller decides whether
-- to ask for a seat, and safetyPromise.js says so out loud.
--
-- Cancelled tables are excluded, and that costs nothing -- a guest reading a
-- cancellation is somebody who asked for a seat, so the next function
-- already covers them.
create or replace function public.is_open_host(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from tables t
    where t.host_id = p_user and t.cancelled_at is null
  )
$fn$;

-- Two people who have actually met over this app: one hosts a table the
-- other asked to sit at, either way round, or both asked to sit at the same
-- one. Deliberately symmetric -- a guest keeps their record of the evening
-- after it happens, and so does the host.
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

revoke all on function public.is_open_host(uuid) from public;
revoke all on function public.shares_a_table(uuid, uuid) from public;
grant execute on function public.is_open_host(uuid) to authenticated;
grant execute on function public.shares_a_table(uuid, uuid) to authenticated;

-- -- the policy ------------------------------------------------------------

drop policy if exists profiles_read on public.profiles;

create policy profiles_read on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or public.is_open_host(id)
    or public.shares_a_table(auth.uid(), id)
  );

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
declare n bigint;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.profiles;
  reset role;
  insert into rls_check values ('stranger_sees_profiles', n);
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
  'signups_total', 'tables_total'], step);

rollback;
