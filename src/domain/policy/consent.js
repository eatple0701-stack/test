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
