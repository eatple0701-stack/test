-- An agreement cannot be un-agreed by a client that is behind.
--
-- == What happened, in the log's own words ==================================
--
-- 2026-09-03, six hours after PURPOSE.version went 1 -> 2 and forty minutes
-- after it deployed:
--
--     rules_consents   v1 = 11   v2 = 1
--     profiles         v1 = 10   v2 = 0
--
-- The backfill had written ten v1 rows, so two rows were new — one v2, one
-- v1 — and profiles held no v2 at all. One profile had gone 1 -> 2 -> 1.
--
--     version  agreed_at                 recorded_at
--     2        10:11:30.25               10:11:30.729
--     1        10:18:24.808              10:18:25.352      ← 6m54s later
--
-- The reverting row's agreed_at is a FRESH timestamp, half a second before it
-- was recorded — not an old value being replayed. A fresh one can only come
-- from rulesAgreement(), which the client calls in exactly one place: the
-- consent button's onClick. So the button was pressed on a client whose
-- PURPOSE.version was still 1 — a tab opened before the deploy, running the
-- old bundle. Its gate asked `agreed === 1`, the profile said 2, and it
-- showed the gate to somebody already past it.
--
-- None of this was visible in profiles. profiles said v2 had never happened.
-- The history table was one day old.
--
-- == What this file adds, and what it does not ==============================
--
-- The client fix is `>=` in agreedToRules and a consent write that touches
-- only its own two columns. Both shipped. This is the floor under them: a
-- database that will not let an agreement move backwards whatever any client
-- sends, because the client that did this was a tab nobody could reach and
-- the next one will be too.
--
-- It does NOT raise. A trigger on the row every app launch upserts must never
-- throw — the same rule 2026-09-02a was written under — so a lowering update
-- is silently corrected to keep what was already there rather than rejected.
-- The rest of that UPDATE (name, nationality, languages, gender) applies
-- normally; only the two consent columns are held.
--
-- Both columns are held together. Keeping the version and letting the
-- timestamp through would record that somebody agreed to v2 at the moment
-- they were sent backwards, which is a time they did not agree to anything.
--
-- BEFORE, not AFTER: the value has to be corrected on its way into the row,
-- so that the 2026-09-02a AFTER trigger sees the corrected value and writes
-- no history row for a change that did not happen.
--
-- == The day you MEAN to lower a version ===================================
--
-- v2 published by mistake, or the wording withdrawn, and everybody has to go
-- back to v1. The guard blocks that from the SQL editor too, so here is the
-- door — in the file, because a guard with no documented way out gets
-- dropped in a hurry and never put back:
--
--     begin;
--     alter table public.profiles disable trigger profiles_keep_highest_rules_consent;
--     update public.profiles set rules_version = 1, rules_agreed_at = <their original v1 time>
--      where …;
--     alter table public.profiles enable trigger profiles_keep_highest_rules_consent;
--     commit;
--
-- Name the trigger. Do NOT reach for `set session_replication_role =
-- replica`, which silences EVERY trigger on the table including
-- 2026-09-02a's history writer — a deliberate lowering that leaves no record
-- of itself is the one kind that must be on the record.
--
-- Use each person's ORIGINAL v1 agreed_at, out of rules_consents, not now().
-- Restoring a pair the log already holds is absorbed by its `on conflict do
-- nothing` and adds no row, which is correct: nothing new was agreed to.
-- Their v2 row stays where it is, as the record that they did agree to it
-- before it was withdrawn. consentFloor.test.mjs runs this whole sequence.
--
-- == The one profile that was reverted =====================================
--
-- Restored from the log, not from the clock: rules_agreed_at is set to the
-- agreed_at rules_consents already holds for that v2 row. Inventing a fresh
-- timestamp would record an agreement at a moment nobody agreed. Because the
-- value is the one already in the log, 2026-09-02a's `on conflict do nothing`
-- absorbs it and the restore adds no history row — which is the ninth pass
-- value below.
--
-- =========================================================================
-- Paste as is. It ends in `rollback;` and changes nothing: it applies
-- everything, reads the result, prints nine numbers, and throws it away.
--
-- It passes when ALL NINE are exactly this:
--
--     guard_trigger_before_update    t
--     guard_function_path_pinned     t
--     lowering_blocked               2     (a row at 2 sent a 1 is still 2)
--     lowering_kept_timestamp        t     (and still has its own agreed_at)
--     nulling_blocked                2     (a row at 2 sent a null is still 2)
--     ordinary_update_still_works    t     (a name change on that row landed)
--     raising_still_works            3     (2 -> 3 is allowed through)
--     restored_profiles_at_v2        1
--     history_rows_added_by_restore  0
--
-- AND NONE OF THE NINE IS NULL. A null is not a false — it is a check that
-- measured nothing, and on the first run of this file three of them were
-- null for exactly that reason. Treat any null as a failure of the file, not
-- of the guard, and do not commit. migrationProbe.test.mjs runs this whole
-- verification in PGlite and asserts both halves.
--
-- Then change the last line to `commit;` and run it again.
-- Undo: 2026-09-03a-consent-cannot-go-backwards-ROLLBACK.sql, written first.

begin;

-- How many agreements the log holds before this file touches anything.
--
-- Captured rather than hard-coded. The first draft printed
-- `count(*) - 12`, 12 being what production happened to hold that hour —
-- which made the number meaningless on any other database and wrong on this
-- one the moment anybody agreed to anything in between. The restore below
-- must add none, and "none" is a difference, not a total.
create temporary table consent_log_before on commit drop as
  select count(*) as n from public.rules_consents;

-- ── the guard ───────────────────────────────────────────────────────────

create or replace function public.keep_highest_rules_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Nothing agreed yet: anything is an advance, including the first yes.
  if old.rules_version is null then
    return new;
  end if;

  -- A client that sends null for a row that has a version is a client that
  -- was not talking about consent at all — every profile save used to carry
  -- these two columns whether or not it meant to. Hold both.
  if new.rules_version is null then
    new.rules_version := old.rules_version;
    new.rules_agreed_at := old.rules_agreed_at;
    return new;
  end if;

  -- The 2026-09-03 case. Hold the version AND its timestamp: keeping the
  -- number while letting the clock through would record the older agreement
  -- as having happened at the moment somebody was sent backwards.
  if new.rules_version < old.rules_version then
    new.rules_version := old.rules_version;
    new.rules_agreed_at := old.rules_agreed_at;
  end if;

  return new;
end;
$$;

revoke execute on function public.keep_highest_rules_consent() from public, anon, authenticated;

drop trigger if exists profiles_keep_highest_rules_consent on public.profiles;
create trigger profiles_keep_highest_rules_consent
  before update of rules_version, rules_agreed_at on public.profiles
  for each row execute function public.keep_highest_rules_consent();

-- ── the one row that was reverted ───────────────────────────────────────
--
-- Every profile whose log holds a higher version than the profile does gets
-- that version back, with the agreed_at the log recorded. Written as a query
-- over rules_consents rather than as a hard-coded id: the log is the record,
-- and if a second profile turns out to have been reverted this repairs it
-- too. The guard above lets this through because it is a rise, not a fall.

with best as (
  select profile_id, version, agreed_at,
         row_number() over (partition by profile_id order by version desc, agreed_at desc) as rn
    from public.rules_consents
   where profile_id is not null
)
update public.profiles p
   set rules_version = b.version,
       rules_agreed_at = b.agreed_at
  from best b
 where b.rn = 1
   and b.profile_id = p.id
   and (p.rules_version is null or p.rules_version < b.version);

-- == Verification, in the same transaction ================================
--
-- The first six values are read off fixtures built and removed inside this
-- transaction. They are removed explicitly rather than left to the rollback,
-- because this file gets run a second time with `commit;` and a fixture that
-- survives that is an invented profile in production — the mistake the first
-- draft of 2026-09-01c nearly shipped.

-- Sequentially, in a DO block, and NOT as a chain of data-modifying CTEs.
--
-- The first version of this was that chain — four UPDATEs of one row, each
-- with a RETURNING read by a scalar subquery — and it produced
-- `2 · true · NULL · NULL · NULL` on production. Sub-statements of one
-- command share a snapshot and cannot see one another's effects, so of four
-- updates aimed at the same row exactly one applied and the other three
-- matched nothing and returned nothing. Reproduced in PGlite: the row's name
-- was never renamed, and three of five values were null. The two that did
-- come back were no more trustworthy than the three that did not, because
-- which sub-statement survives is not defined.
--
-- Each step below runs as its own statement and reads the row back before
-- the next one starts.

create temporary table guard_probe_result (
  lowering_blocked            integer,
  lowering_kept_timestamp     boolean,
  nulling_blocked             integer,
  ordinary_update_still_works boolean,
  raising_still_works         integer
) on commit drop;

do $$
declare
  probe    uuid := '00000000-0000-4000-8000-0000000c0de0';
  set_at   timestamptz := '2026-01-01 00:00:00+00';
  r        public.profiles%rowtype;
  v_low    integer;
  v_kept   boolean;
  v_null   integer;
  v_name   boolean;
  v_raise  integer;
begin
  insert into auth.users (id) values (probe) on conflict do nothing;
  insert into public.profiles (id, name, rules_version, rules_agreed_at)
  values (probe, 'guard probe', 2, set_at)
  on conflict (id) do update
    set name = 'guard probe', rules_version = 2, rules_agreed_at = set_at;

  -- 1. a lower version, the 2026-09-03 case
  update public.profiles set rules_version = 1, rules_agreed_at = now() where id = probe;
  select * into r from public.profiles where id = probe;
  v_low  := r.rules_version;
  v_kept := r.rules_agreed_at = set_at;

  -- 2. a null one, which is what an unrelated profile save used to send
  update public.profiles set rules_version = null, rules_agreed_at = null where id = probe;
  select * into r from public.profiles where id = probe;
  v_null := r.rules_version;

  -- 3. an ordinary edit on a row that has an agreement
  update public.profiles set name = 'guard probe renamed' where id = probe;
  select * into r from public.profiles where id = probe;
  v_name := r.name = 'guard probe renamed';

  -- 4. a rise, which must go through
  update public.profiles set rules_version = 3, rules_agreed_at = '2026-02-02 00:00:00+00' where id = probe;
  select * into r from public.profiles where id = probe;
  v_raise := r.rules_version;

  insert into guard_probe_result values (v_low, v_kept, v_null, v_name, v_raise);
end $$;

-- The probe leaves nothing behind, on this run or the committed one.
delete from public.rules_consents where profile_id = '00000000-0000-4000-8000-0000000c0de0';
delete from public.profiles where id = '00000000-0000-4000-8000-0000000c0de0';
delete from auth.users where id = '00000000-0000-4000-8000-0000000c0de0';

select
  (select (tgtype::int & 2) = 2 and (tgtype::int & 16) = 16 from pg_trigger
    where tgname = 'profiles_keep_highest_rules_consent' and not tgisinternal) as guard_trigger_before_update,
  (select coalesce(bool_or(c like 'search_path=%'), false)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace,
          unnest(coalesce(p.proconfig, array[]::text[])) as c
    where n.nspname = 'public' and p.proname = 'keep_highest_rules_consent')   as guard_function_path_pinned,
  g.lowering_blocked,
  g.lowering_kept_timestamp,
  g.nulling_blocked,
  g.ordinary_update_still_works,
  g.raising_still_works,
  (select count(*) from public.profiles where rules_version = 2)               as restored_profiles_at_v2,
  (select count(*) from public.rules_consents) - (select n from consent_log_before) as history_rows_added_by_restore
from guard_probe_result g;

rollback;
