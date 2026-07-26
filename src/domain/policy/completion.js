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
  experienceById, experienceIdsOfTheme, narrativesOfTheme, stepsOfNarrative,
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
    appliesTo: (e) =>
      e.acceptsSelfAttest && e.restaurantIds.length === 0 && e.marketIds.length === 0,
    isSatisfied: (e, j) => j.attestedExperienceIds.has(e.id),
    evidenceOf: (e, j) => (j.attestedExperienceIds.has(e.id) ? { kind: 'attestation', id: e.id } : null),
  },
];

/** Done when any applicable source is satisfied. */
export function experienceDone(experience, journey) {
  if (!experience) return false;
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
