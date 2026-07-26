// VisibilityPolicy — may this entity surface in this context?
//
// Two independent gates are combined here. Editorial status (planned /
// preview / published) governs content entities; the existing Place
// lifecycle governs venues and is reused untouched from src/data.

import { isSurfaceable } from '../types.js';
import { restaurants } from '../../data/restaurants.js';
import { isQuarantined } from '../../data/verification.js';

/** Content entities carry `status`. Anything without one is treated as visible. */
export const isSurfaceableEntity = (entity) =>
  entity?.status === undefined ? true : isSurfaceable(entity.status);

/**
 * Places a narrative is allowed to count on. Quarantined records are excluded
 * from every discovery surface and from direct navigation alike — the
 * existing rule, reused rather than restated.
 */
export function admissiblePlaceIds() {
  return new Set(restaurants.filter(r => !isQuarantined(r)).map(r => r.id));
}
