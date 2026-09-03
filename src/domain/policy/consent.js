// ConsentPolicy — has this traveller agreed to the current rules?
//
// 교수님's review asked for the no-dating rule to sit in 사용자 조항 with an
// actual 동의, rather than only being displayed. The app already displayed it
// (see PURPOSE in src/content/safety.js, printed under the seat button), and
// HANDOFF §4 recorded the gap honestly: 표시와 동의는 다릅니다.
//
// The display stays where it is — showing the rule at the moment somebody
// commits an evening is genuinely better than burying it in a document
// nobody opens, which is why it was put there. What changes is that passing
// that moment now requires saying yes.
//
// Versioned rather than a boolean. A stored `true` would keep standing for
// rules that have since changed, which would make the record a claim nobody
// actually made — the same failure the evidence layer in this project's
// ancestor was built to prevent, at a much smaller scale.

/**
 * Has this profile agreed to the rules now in force, or to something later?
 *
 * An older agreement is not treated as a lesser yes — it is a yes to a
 * different question, so it reads as no and gets asked again.
 *
 * A NEWER one is. This was `=== currentVersion` and that cost a real
 * agreement on 2026-09-03, six hours after PURPOSE.version went 1 -> 2.
 * rules_consents held eleven v1 rows and one v2 while profiles held ten v1
 * and no v2 at all: one profile had gone 1 -> 2 -> 1. The reverting row's
 * agreed_at was a fresh timestamp half a second before it was recorded, not
 * an old value replayed — and a fresh one can only come from
 * rulesAgreement(), which is called in exactly one place, the consent
 * button's onClick.
 *
 * So the button was pressed on a client still running the pre-deploy bundle,
 * where PURPOSE.version was 1. Its gate asked `agreed === 1`, the profile
 * said 2, and it showed the gate to somebody who had already agreed to
 * something newer — then wrote their consent backwards when they passed it.
 * Any tab left open across a version bump does this.
 *
 * `>=` closes it from the other side, which is the side a deploy cannot
 * reach: an old bundle stops asking people who are ahead of it.
 *
 * 2026-09-03, later the same day: no longer what stands between anybody and
 * a gate — see showsRulesGate below, which stopped calling this. Kept for
 * `rules_version`'s other reader, the KF report's `agreed_for_kf` count
 * (docs/pilot-participant-count.md), and because a version comparison this
 * well-tested is worth more alive than deleted.
 */
export function agreedToRules(profile, currentVersion) {
  const agreed = profile?.rulesVersion;
  return Number.isInteger(agreed) && agreed >= currentVersion;
}

/**
 * The profile patch that records an agreement.
 *
 * Carries the timestamp as well as the version, because "did they agree" and
 * "when did they agree" are different questions and only the second one is
 * answerable after the fact.
 */
export const rulesAgreement = (currentVersion, now = Date.now()) => ({
  rulesVersion: currentVersion,
  rulesAgreedAt: now,
});

/**
 * Does the gate stand in front of this person right now?
 *
 * `agreedInThisForm` is the visit, not the record: component state that dies
 * when the screen does. That is what makes walking away undo it.
 *
 * Reported 2026-09-03 — press 상 차리기, agree, see the form, leave without
 * opening a table, and the gate never came back, because pressing the button
 * had written the consent. It was defended here as a design choice (agreeing
 * to the rules is not a promise to finish the action) and the team rejected
 * that; it was not ours to settle. You are asked until you actually open a
 * table or take a seat.
 *
 * Later the same day: also used to skip straight past this for anybody
 * `agreedToRules` already held, so a first table meant every later one
 * opened straight to the form. That is not the rule stated on screen —
 * 상을 차리시거나 자리를 요청하실 때마다 여쭙습니다 — it is the rule the
 * footnote used to state, until "then not again" turned out to be the wrong
 * half of the fix: an agreement is to tonight's table, not a standing yes
 * carried into every table after it. The gate stands every time now; only
 * `agreedInThisForm` — this visit, this table — takes it down.
 */
export function showsRulesGate(agreedInThisForm) {
  return !agreedInThisForm;
}

/**
 * What a completed action should write, or null when there is nothing to.
 *
 * Called after the table is created or the seat request lands — never before.
 * `pending` is the agreement made at the button press, carried until the
 * action finishes: the press is when they agreed, and finishing is what makes
 * it a record. Writing the completion time instead would stamp the agreement
 * with a moment at which nobody read anything.
 *
 * Null when nobody passed a gate on this screen — there is nothing pending
 * to write. Used to also go null when the profile already recorded this
 * version or later, so a second table did not rewrite the first agreement.
 * That stopped being right the moment showsRulesGate started asking every
 * time: the gate stands again for the second table, so finishing it is a
 * genuine second agreement, and `rules_consents` is a log built to hold
 * exactly that (…-02a-rules-consents-history.sql — its unique constraint is
 * `(profile_id, version, agreed_at)`, not `(profile_id, version)`).
 */
export function consentToRecord(pending) {
  return pending ?? null;
}
