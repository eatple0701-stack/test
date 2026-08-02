// NavigationPolicy — what may be entered, and with what ancestry.
//
// Exactly one entity is constrained. Collection, Theme, Narrative and
// Experience may all be entered directly by search, recommendation or a
// resumed journey. Restaurant may not: every route reaching it carries an
// Experience ancestor, so "back" ascends the hierarchy instead of dead-ending
// on a venue with no cultural context.

import { experiences, themeIdsOfExperience } from '../catalog/index.js';

const DIRECTLY_ENTERABLE = new Set(['collection', 'theme', 'narrative', 'experience']);

export const canEnterDirectly = (entityType) => DIRECTLY_ENTERABLE.has(entityType);

/**
 * The ancestry a restaurant must be reached through. Returns the first
 * experience that lists it, with one of that experience's themes.
 * `null` means the restaurant is not yet part of any experience and is
 * therefore not reachable — which is the correct answer, not an error.
 */
export function ancestryOfRestaurant(restaurantId) {
  const experience = experiences.find(e => e.restaurantIds.includes(restaurantId));
  if (!experience) return null;
  const [themeId] = themeIdsOfExperience(experience.id);
  return { experienceId: experience.id, themeId: themeId ?? null };
}
