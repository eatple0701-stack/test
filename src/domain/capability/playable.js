// Playable — can this path actually be walked right now?
//
// Deciding which places are admissible is VisibilityPolicy's job, and a
// capability reaching up to a policy would invert the dependency direction.
// So the facts are injected downward instead: the caller supplies the
// admissible sets, and a narrative judges only itself against them.
//
// This module must never import from ../policy/.

import { BLOCKER } from '../types.js';
import {
  experienceById, narrativesOfTheme, stepsOfNarrative, themeRefsOfCollection,
} from '../catalog/index.js';

const verdict = (playable, degraded, blockers) => ({ playable, degraded, blockers });

/** Can this single experience be realised under the given context? */
function stepReachable(experience, context) {
  if (!experience) return false;
  if (experience.restaurantIds.some(id => context.admissiblePlaces.has(id))) return true;
  if (experience.marketIds.some(id => context.availableEvents.has(id))) return true;
  // A venue-less experience is always reachable: attestation needs no venue.
  if (experience.restaurantIds.length === 0 && experience.marketIds.length === 0) {
    return experience.acceptsSelfAttest;
  }
  return false;
}

export function assessNarrative(narrativeId, context) {
  const steps = stepsOfNarrative(narrativeId);
  if (steps.length === 0) return verdict(false, false, [{ kind: BLOCKER.MISSING_VENUE, ref: narrativeId }]);

  const blockers = [];
  let degraded = false;

  for (const step of steps) {
    const reachable = stepReachable(experienceById(step.experienceId), context);
    if (reachable) continue;
    if (step.required) blockers.push({ kind: BLOCKER.MISSING_VENUE, ref: step.experienceId });
    else degraded = true;
  }

  return verdict(blockers.length === 0, degraded, blockers);
}

/** Transitive: a theme is playable when any of its narratives is. */
export function assessTheme(themeId, context) {
  const verdicts = narrativesOfTheme(themeId).map(n => assessNarrative(n.id, context));
  if (verdicts.length === 0) return verdict(false, false, [{ kind: BLOCKER.MISSING_VENUE, ref: themeId }]);
  const playable = verdicts.some(v => v.playable);
  return verdict(
    playable,
    !playable ? false : verdicts.some(v => v.playable && v.degraded),
    playable ? [] : verdicts.flatMap(v => v.blockers),
  );
}

/** Transitive: a collection is playable when any of its themes is. */
export function assessCollection(collectionId, context) {
  const verdicts = themeRefsOfCollection(collectionId).map(r => assessTheme(r.themeId, context));
  if (verdicts.length === 0) return verdict(false, false, [{ kind: BLOCKER.MISSING_VENUE, ref: collectionId }]);
  const playable = verdicts.some(v => v.playable);
  return verdict(playable, false, playable ? [] : verdicts.flatMap(v => v.blockers));
}
