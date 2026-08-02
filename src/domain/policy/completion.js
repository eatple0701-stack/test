// CompletionPolicy — what counts as done.
//
// Completion is a registry of strategies rather than a hard-coded rule, so a
// future Workshop or Class becomes one more entry here and nothing else in
// the domain changes.
//
// Every source resolves against the traveller's own records. Nothing infers
// completion on the user's behalf.

import { COMPLETION_SOURCE } from '../types.js';
import {
  experienceById, experienceIdsOfTheme, narrativesOfTheme, stepsOfNarrative, hasAnchor,
} from '../catalog/index.js';
import { admissiblePlaceIds } from './visibility.js';

/**
 * @typedef {object} CompletionSource
 * @property {string} id
 * @property {string} label
 * @property {(e: object) => boolean} appliesTo
 * @property {(e: object, j: object) => boolean} isSatisfied
 * @property {(e: object, j: object) => object|null} evidenceOf
 */

/** @type {CompletionSource[]} */
export const completionSources = [
  {
    id: COMPLETION_SOURCE.PLACE_VISIT,
    label: 'Visited a place',
    appliesTo: (e) => e.restaurantIds.length > 0,
    isSatisfied: (e, j) => {
      const admissible = admissiblePlaceIds();
      return e.restaurantIds.some(id => admissible.has(id) && j.visitedRestaurantIds.has(id));
    },
    evidenceOf: (e, j) => {
      const admissible = admissiblePlaceIds();
      const id = e.restaurantIds.find(x => admissible.has(x) && j.visitedRestaurantIds.has(x));
      return id ? { kind: 'restaurant', id } : null;
    },
  },
  {
    id: COMPLETION_SOURCE.EVENT_ATTENDANCE,
    label: 'Attended a market or event',
    appliesTo: (e) => e.marketIds.length > 0,
    isSatisfied: (e, j) => e.marketIds.some(id => j.visitedMarketIds.has(id)),
    evidenceOf: (e, j) => {
      const id = e.marketIds.find(x => j.visitedMarketIds.has(x));
      return id ? { kind: 'market', id } : null;
    },
  },
  {
    id: COMPLETION_SOURCE.SELF_ATTEST,
    // Covers both 'I completed the mission' and 'I did this': both resolve to
    // the same attestation record, so they are one strategy rather than two
    // identical ones. A distinct mission source earns its place once missions
    // gain their own storage, and adding it then is a single registry entry.
    label: 'Marked as done',
    // Self-attestation is the completion route for experiences that have no
    // anchor to visit. Requiring the absence of anchors here — rather than
    // trusting the record's flag alone — keeps attestation from becoming a
    // universal skip button for anchored experiences.
    appliesTo: (e) => e.acceptsSelfAttest && !hasAnchor(e),
    isSatisfied: (e, j) => j.attestedExperienceIds.has(e.id),
    evidenceOf: (e, j) => (j.attestedExperienceIds.has(e.id) ? { kind: 'attestation', id: e.id } : null),
  },
];

/**
 * A journey this policy can actually read.
 *
 * Every source above reaches straight into a Set. The app carries two shapes
 * under the same word — the domain journey with those Sets, and a legacy
 * projection with counts on it — and handing the wrong one in threw a
 * TypeError from inside `.some()`, which React turned into a blank screen
 * with an error boundary on it. That happened here, to me, wiring the
 * Passport's list of finished cultures.
 *
 * Reading it as "nothing done" is the right failure. It is wrong quietly, on
 * one section, instead of wrong loudly across a whole tab — and a traveller
 * who lost their record to a crash has no way to tell those apart anyway.
 */
const readable = (j) =>
  Boolean(j)
  && j.visitedRestaurantIds instanceof Set
  && j.visitedMarketIds instanceof Set
  && j.attestedExperienceIds instanceof Set;

/** Done when any applicable source is satisfied. */
export function experienceDone(experience, journey) {
  if (!experience || !readable(journey)) return false;
  return completionSources
    .filter(s => s.appliesTo(experience))
    .some(s => s.isSatisfied(experience, journey));
}

/** Optional steps never block completion. */
export function narrativeDone(narrativeId, journey) {
  const required = stepsOfNarrative(narrativeId).filter(s => s.required);
  if (required.length === 0) return false;
  return required.every(s => experienceDone(experienceById(s.experienceId), journey));
}

/**
 * A theme completes through any one of its narratives. Requiring every
 * experience would make a large theme uncompletable, which is exactly the
 * failure this definition exists to avoid.
 */
export function themeDone(themeId, journey) {
  const ns = narrativesOfTheme(themeId);
  if (ns.length === 0) return false;
  return ns.some(n => narrativeDone(n.id, journey));
}

/** Partial progress: any one experience in the theme is done. */
export function themeExplored(themeId, journey) {
  return experienceIdsOfTheme(themeId).some(id => experienceDone(experienceById(id), journey));
}

/**
 * How a theme was finished, which is not the same question as whether it was.
 *
 * A tester wrote "I can just check through culture (skimming through)" and
 * they were right, though not for the reason it looks. The rule above is
 * sound: self-attestation applies only where there is nothing to visit. But a
 * theme still in `preview` has no verified venue anywhere in it, so *every*
 * experience falls to attestation and the whole theme is four taps — and the
 * app then congratulated that in the same words it used for somebody who had
 * eaten at four places.
 *
 * The fix is not to make attestation harder. A traveller who genuinely walked
 * a market has no way to prove it to us, and demanding proof we cannot check
 * is how an app starts calling honest people liars. The fix is to stop
 * flattening the two into one sentence.
 */
export const COMPLETION_KIND = {
  VISITED: 'visited',   // at least one anchor actually reached
  MIXED: 'mixed',
  DECLARED: 'declared', // finished entirely on the traveller's own word
};

export function themeCompletionKind(themeId, journey) {
  if (!themeDone(themeId, journey)) return null;

  const done = experienceIdsOfTheme(themeId)
    .map(experienceById)
    .filter(e => e && experienceDone(e, journey));

  // Which route actually satisfied each one. An experience with an anchor can
  // only have been completed by reaching it, because attestation does not
  // apply to anchored experiences at all.
  const anchored = done.filter(e => hasAnchor(e));
  if (anchored.length === 0) return COMPLETION_KIND.DECLARED;
  if (anchored.length === done.length) return COMPLETION_KIND.VISITED;
  return COMPLETION_KIND.MIXED;
}
