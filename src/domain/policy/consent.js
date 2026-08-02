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
 * Has this profile agreed to exactly the version of the rules now in force?
 *
 * An older agreement is not treated as a lesser yes — it is a yes to a
 * different question, so it reads as no and gets asked again.
 */
export function agreedToRules(profile, currentVersion) {
  const agreed = profile?.rulesVersion;
  return Number.isInteger(agreed) && agreed === currentVersion;
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
