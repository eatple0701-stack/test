-- Undo for 2026-09-02a-rules-consents-history.sql. Written before it was
-- applied, as every undo here is.
--
-- ── Read this before running it ────────────────────────────────────────
--
-- This DROPS the history. Everything the trigger recorded and everything the
-- backfill copied goes with the table; profiles keeps its two cache columns,
-- so nobody's CURRENT agreement is lost — only the record of previous ones.
-- If anybody has re-agreed to a newer version since the migration was
-- applied, their earlier row exists nowhere but here. Do not run this after
-- a version bump has gone out. Before it, the table holds only what profiles
-- still says, and nothing is lost.
--
-- Passes when ALL THREE are exactly this:
--     consents_table      0
--     trigger_gone        0
--     profiles_untouched  equal to what profiles_with_version printed when
--                         the forward file was applied

begin;

drop trigger if exists profiles_keep_rules_consent on public.profiles;
drop function if exists public.keep_rules_consent();
drop table if exists public.rules_consents;

select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'rules_consents')        as consents_table,
  (select count(*) from pg_trigger
    where tgname = 'profiles_keep_rules_consent' and not tgisinternal)       as trigger_gone,
  (select count(*) from public.profiles
    where rules_version is not null and rules_agreed_at is not null)         as profiles_untouched;

commit;
