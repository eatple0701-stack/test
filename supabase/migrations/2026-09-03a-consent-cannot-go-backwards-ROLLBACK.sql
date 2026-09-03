-- Undo for 2026-09-03a-consent-cannot-go-backwards.sql. Written before it was
-- applied, as every undo here is.
--
-- ── Read this before running it ────────────────────────────────────────
--
-- This drops the guard. It does NOT put the restored profile back to the
-- version it was wrongly reverted to — that would be re-applying the bug, and
-- rules_consents holds the evidence that the v2 agreement happened. If the
-- guard has to come off, the restored row stays restored.
--
-- What comes back with the guard gone: any client that sends a lower
-- rules_version, or a null one, overwrites the agreement again. The two
-- client-side fixes that shipped alongside — `>=` in agreedToRules, and a
-- consent write that touches only its own two columns — still stand, so a
-- current bundle will not do it. A tab left open across a version bump was
-- what did it the first time, and this is the only thing that stops one.
--
-- Passes when BOTH are exactly this:
--     guard_gone            0
--     profiles_still_at_v2  equal to restored_profiles_at_v2 from the
--                           forward file (1 when it was applied)

begin;

drop trigger if exists profiles_keep_highest_rules_consent on public.profiles;
drop function if exists public.keep_highest_rules_consent();

select
  (select count(*) from pg_trigger
    where tgname = 'profiles_keep_highest_rules_consent' and not tgisinternal) as guard_gone,
  (select count(*) from public.profiles where rules_version = 2)               as profiles_still_at_v2;

commit;
