-- Put one profile back to v1, on purpose, so the walkthrough has a v1 account.
--
-- == Why this is not the bug being re-applied ==============================
--
-- On 2026-09-03 a stale tab wrote somebody's consent backwards and
-- 2026-09-03a made that impossible. This lowers a version deliberately,
-- which is the case that migration's header was written for.
--
-- The value being removed was recorded under the OLD rule, where pressing the
-- consent button was itself the record. That person pressed it, saw the form
-- and left without opening a table. Under the rule that shipped the same day
-- — the agreement is recorded when the table is actually created — nothing
-- would have been written. So this is not undoing a decision; it is removing
-- a row the new rule would never have made.
--
-- And there is no other way to test it. The gate only stands in front of
-- somebody who has not agreed to the current version, and every account the
-- team can sign into is now at v2.
--
-- == How the trigger is opened, and how it must not be ====================
--
-- `alter table … disable trigger profiles_keep_highest_rules_consent`, by
-- name, inside this transaction, re-enabled before it ends. NOT
-- `set session_replication_role = replica`, which would silence every trigger
-- on the table including 2026-09-02a's history writer — and a deliberate
-- lowering that leaves no record of itself is the one kind that must be on
-- the record. consentFloor.test.mjs runs that sequence.
--
-- == Which profile, without anybody typing a uuid ==========================
--
-- The one at v2 whose v2 agreement was recorded LAST. There are two profiles
-- at v2 and they got there for different reasons:
--
--   the earlier one   the 2026-09-03 10:11 incident, restored from the log by
--                     2026-09-03a. Its agreement is genuine and stays.
--   the later one     pressed at the gate a few minutes ago, to reach the
--                     form. This is the one to put back.
--
-- The first draft of this file said "the OLDEST recorded", which is exactly
-- backwards and would have reverted the incident profile — somebody else's
-- valid agreement — while leaving the walkthrough with no v1 account. Caught
-- in review before it was pasted.
--
-- Its rules_agreed_at comes from that profile's own v1 row in
-- rules_consents, never from now(). Restoring a pair the log already holds is
-- absorbed by `on conflict do nothing`, so the history gains nothing.
--
-- The two v2 timestamps are printed side by side rather than compared against
-- a wall-clock literal. Whether the dashboard renders these in UTC or in KST
-- cannot be told from the file, and a threshold written in the wrong frame
-- would either pick the wrong row or refuse to match at all. The ordering is
-- asserted; the reading is yours.
--
-- =========================================================================
-- Paste as is. It ends in `rollback;` and changes nothing: it does the whole
-- thing, reads the result, prints eleven values, and throws it away.
--
-- It passes when ALL of these hold:
--
--     target_profiles              1   (exactly one profile matched)
--     target_v2_is_the_latest      t   (it is the most recent v2 in the log)
--     target_is_not_the_incident   t   (and it is NOT the earliest one)
--     reverted_to                  1   (it is at v1 now)
--     timestamp_is_the_logged_one  t   (carrying its own original v1 time)
--     history_rows_added           0   (the log gained nothing)
--     guard_enabled_again          t   (the trigger is back on)
--     profiles_at_v2_after         1   (the other v2 is untouched)
--     remaining_v2_is_the_incident t   (and the one left is the 10:11 row)
--
-- AND read the last two by eye:
--
--     target_v2_recorded_at            must be the minute you pressed the
--                                      gate. The incident row is 10:11 and
--                                      must NOT appear here.
--     incident_v2_recorded_at          printed beside it for comparison.
--
-- AND NONE OF THEM IS NULL. A null is not a false — it is a check that
-- measured nothing. If anything is off, stop and ask; nothing here is worth
-- guessing at.
--
-- Then change the last line to `commit;` and run it again.
-- Undo: agree again in the app. That is what the walkthrough does anyway, and
-- it writes a fresh v2 row rather than pretending the old one never went.

begin;

create temporary table before_state on commit drop as
  select (select count(*) from public.rules_consents) as consents;

-- Every profile currently at v2, with when its v2 was recorded.
create temporary table v2_profiles on commit drop as
select p.id,
       (select max(c.recorded_at) from public.rules_consents c
         where c.profile_id = p.id and c.version = 2)                    as v2_recorded_at,
       (select c.agreed_at from public.rules_consents c
         where c.profile_id = p.id and c.version = 1
         order by c.agreed_at
         limit 1)                                                        as original_v1_at
  from public.profiles p
 where p.rules_version = 2;

-- The one to revert: the LAST to agree. The incident profile agreed first and
-- is left exactly as it is.
create temporary table target on commit drop as
select * from v2_profiles
 where v2_recorded_at is not null
   and original_v1_at is not null
 order by v2_recorded_at desc
 limit 1;

alter table public.profiles disable trigger profiles_keep_highest_rules_consent;

update public.profiles p
   set rules_version = 1,
       rules_agreed_at = t.original_v1_at
  from target t
 where p.id = t.id;

alter table public.profiles enable trigger profiles_keep_highest_rules_consent;

-- == Verification, in the same transaction ================================
--
-- READ ONLY from here. No fixtures are built, so there is nothing to clean up
-- and nothing that could survive the committed run.

select
  (select count(*) from target)                                          as target_profiles,
  (select t.v2_recorded_at = (select max(recorded_at) from public.rules_consents where version = 2)
     from target t)                                                      as target_v2_is_the_latest,
  (select t.v2_recorded_at > (select min(recorded_at) from public.rules_consents where version = 2)
     from target t)                                                      as target_is_not_the_incident,
  (select t.v2_recorded_at from target t)                                as target_v2_recorded_at,
  (select min(recorded_at) from public.rules_consents where version = 2) as incident_v2_recorded_at,
  (select p.rules_version from public.profiles p join target t on t.id = p.id)
                                                                         as reverted_to,
  (select p.rules_agreed_at = t.original_v1_at
     from public.profiles p join target t on t.id = p.id)                as timestamp_is_the_logged_one,
  (select count(*) from public.rules_consents) - (select consents from before_state)
                                                                         as history_rows_added,
  (select tgenabled = 'O' from pg_trigger
    where tgname = 'profiles_keep_highest_rules_consent' and not tgisinternal)
                                                                         as guard_enabled_again,
  (select count(*) from public.profiles where rules_version = 2)         as profiles_at_v2_after,
  (select bool_and((select max(c.recorded_at) from public.rules_consents c
                     where c.profile_id = p.id and c.version = 2)
                   = (select min(recorded_at) from public.rules_consents where version = 2))
     from public.profiles p where p.rules_version = 2)                   as remaining_v2_is_the_incident;

rollback;
