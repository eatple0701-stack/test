-- Who agreed to which rules, and when — kept, not overwritten.
--
-- == What is being lost =====================================================
--
-- `profiles.rules_version` and `profiles.rules_agreed_at` are two scalar
-- columns. rulesAgreement() writes the current version and the current time
-- into them, and that is the whole record. The consent text is about to be
-- revised (the first sentence made a claim about restaurants that the
-- catalogue's own data contradicts) and PURPOSE.version goes 1 -> 2, which
-- means everybody who agreed to v1 will be asked again — and the moment they
-- agree, their v1 row is gone. "Who agreed to what, when" is evidence, and a
-- revision must not erase it. Same reason cancelling a seat stopped deleting
-- the signup row on 2026-09-01e.
--
-- == What this changes ======================================================
--
-- A history table, written by a trigger on `profiles`, so the client keeps
-- writing the two columns it writes today and changes nothing. A change that
-- has to land in two places in the right order is what took production down
-- on 2026-09-01; this lands in one.
--
-- The invariant, in one sentence:
--
--     rules_consents is the complete log of (profile, version, agreed_at);
--     profiles.rules_version / rules_agreed_at are a cache of the latest.
--
-- So the rows already at v1 are backfilled ONCE, and from then on the trigger
-- records every NEW value. After a re-consent to v2 a person has exactly one
-- v1 row and exactly one v2 row — rulesConsents.test.mjs performs that
-- re-consent in PGlite and counts. The unique constraint makes a double
-- record impossible at the database rather than by care.
--
-- == RLS, in the same transaction ===========================================
--
-- This table holds who agreed and when. It gets row level security enabled
-- and NO policy, and neither anon nor authenticated is granted select: no
-- client ever reads it, the trigger writes as definer, and the team reads it
-- in the dashboard. The verification below checks privilege rather than
-- counting rows, because a role with no select privilege cannot count — it
-- gets "permission denied" — and that is the stronger of the two states.
-- On 2026-09-01 the fix was for a table anonymous sessions could read; this
-- one must not stand open for a single transaction.
--
-- == The foreign key, and deletion ==========================================
--
-- profile_id references profiles WITHOUT cascade: `on delete set null`.
-- Deleting a person severs the link and keeps the fact — "somebody agreed to
-- v1 at 19:02" survives, "who" does not. That is what the 9/20 report needs
-- (a count) and what a deletion request needs (no identity left). The
-- dashboard's delete-user path cascades auth.users -> profiles, and this
-- turns that into anonymisation rather than destruction. notifications kept
-- no foreign key at all for a similar reason; here one is kept because a
-- consent row with a profile_id that never existed would be meaningless, and
-- set-null expresses "existed, now forgotten" exactly.
--
-- Deletion request: delete the profile (or the auth user). The consent rows
-- stay with profile_id null. Nothing else to do.
--
-- =========================================================================
-- Paste as is. It ends in `rollback;` and changes nothing: it applies
-- everything, reads the result, prints ten numbers, and throws it away.
--
-- It passes when ALL TEN are exactly this:
--
--     consents_table           1
--     profile_id_nullable      YES      (a deleted person leaves the row, not an error)
--     rls_enabled              t
--     policies_on_table        0
--     anon_can_select          f
--     authenticated_can_select f
--     trigger_on_insert_and_update  t   (the client upserts; a first consent is an INSERT)
--     function_path_pinned     t
--     backfilled_rows          equal to profiles_with_version (printed beside it)
--     profiles_with_version    unchanged from before you ran it
--
-- Then change the last line to `commit;` and run it again.
-- Undo: 2026-09-02a-rules-consents-history-ROLLBACK.sql, written first.
-- The undo drops the history. Roll back only before anybody has re-agreed.
--
-- Run this on its own. 2026-09-01d (mail language) waits for tomorrow.

begin;

-- ── the log ─────────────────────────────────────────────────────────────

create table if not exists public.rules_consents (
  id          bigint generated always as identity primary key,
  -- Nullable, and set null on delete: the person can be forgotten, the fact
  -- that an agreement happened cannot.
  profile_id  uuid references public.profiles(id) on delete set null,
  version     integer not null,
  agreed_at   timestamptz not null,
  recorded_at timestamptz not null default now(),
  -- A person agrees to a version at a moment once. Backfill and trigger
  -- cannot together produce two rows for the same event.
  unique (profile_id, version, agreed_at)
);

create index if not exists rules_consents_version_idx on public.rules_consents (version);

-- Locked before anything is written into it.
alter table public.rules_consents enable row level security;
revoke all on table public.rules_consents from public, anon, authenticated;

-- ── the trigger ─────────────────────────────────────────────────────────
--
-- Fires on INSERT and on UPDATE of the two columns, and records the NEW
-- value whenever either changed and a version is present. A profile saved
-- again with the same two values records nothing.
--
-- INSERT is not optional. The client writes the profile with upsert
-- (supabaseBackend.js saveProfile), which is an INSERT when the row does not
-- exist yet and `on conflict do update` when it does. A first agreement from
-- a brand-new profile arrives as the INSERT half; an update-only trigger
-- would log every backfilled veteran and none of the people the pilot is
-- actually for. rulesConsents.test.mjs drives both halves of the upsert.
--
-- search_path is pinned to '' and every object in the body is
-- schema-qualified, so a caller cannot make a definer function resolve a
-- name through a path of their choosing (Supabase's linter calls this
-- function_search_path_mutable). Execute is revoked from public: nothing
-- calls this but the trigger.

create or replace function public.keep_rules_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Nothing to record without both halves of an agreement.
  if new.rules_version is null or new.rules_agreed_at is null then
    return new;
  end if;

  -- OLD is only ever read inside the UPDATE branch. A single expression
  -- `tg_op = 'UPDATE' and old.x = …` would rely on the executor not
  -- evaluating the right-hand side on INSERT, and SQL does not promise that.
  -- On INSERT there is no old row, so the agreement is new by definition.
  if tg_op = 'UPDATE' then
    if new.rules_version is not distinct from old.rules_version
       and new.rules_agreed_at is not distinct from old.rules_agreed_at then
      return new;   -- the client re-sent the same agreement: nothing happened
    end if;
  end if;

  -- The one statement that writes. `on conflict do nothing` is what makes
  -- this trigger unable to fail a profile save: a stale device re-sending an
  -- agreement the log already holds (say the v1 row the backfill wrote) hits
  -- the unique constraint and is absorbed, not raised. A trigger on the row
  -- every app launch upserts must never throw.
  insert into public.rules_consents (profile_id, version, agreed_at)
  values (new.id, new.rules_version, new.rules_agreed_at)
  on conflict (profile_id, version, agreed_at) do nothing;
  return new;
end;
$$;

revoke execute on function public.keep_rules_consent() from public, anon, authenticated;

drop trigger if exists profiles_keep_rules_consent on public.profiles;
create trigger profiles_keep_rules_consent
  after insert or update of rules_version, rules_agreed_at on public.profiles
  for each row execute function public.keep_rules_consent();

-- ── the backfill, once ──────────────────────────────────────────────────
--
-- Everybody currently at a version becomes the first row of their log. This
-- is the only statement in the file that writes rows, and it writes only what
-- profiles already says; `on conflict do nothing` makes a second run a no-op.

insert into public.rules_consents (profile_id, version, agreed_at)
select id, rules_version, rules_agreed_at
  from public.profiles
 where rules_version is not null and rules_agreed_at is not null
on conflict (profile_id, version, agreed_at) do nothing;

-- == Verification, in the same transaction ================================
--
-- READ ONLY from here. profiles_with_version is printed so you can compare it
-- with what you had before; this file adds a table and touches no profile.

select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'rules_consents')        as consents_table,
  (select is_nullable from information_schema.columns
    where table_schema = 'public' and table_name = 'rules_consents'
      and column_name = 'profile_id')                                        as profile_id_nullable,
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'rules_consents')             as rls_enabled,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'rules_consents')            as policies_on_table,
  has_table_privilege('anon', 'public.rules_consents', 'select')              as anon_can_select,
  has_table_privilege('authenticated', 'public.rules_consents', 'select')     as authenticated_can_select,
  -- pg_trigger.tgtype: 4 = INSERT, 16 = UPDATE. Both, or a first consent is lost.
  (select (tgtype::int & 4) = 4 and (tgtype::int & 16) = 16 from pg_trigger
    where tgname = 'profiles_keep_rules_consent' and not tgisinternal)       as trigger_on_insert_and_update,
  (select coalesce(bool_or(c like 'search_path=%'), false)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace,
          unnest(coalesce(p.proconfig, array[]::text[])) as c
    where n.nspname = 'public' and p.proname = 'keep_rules_consent')         as function_path_pinned,
  (select count(*) from public.rules_consents)                               as backfilled_rows,
  (select count(*) from public.profiles
    where rules_version is not null and rules_agreed_at is not null)         as profiles_with_version;

rollback;
