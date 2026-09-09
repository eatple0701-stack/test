// The dishes somebody picked, gathered under the six kinds of food.
//
// 2026-09-09: the rail of photographs moved to the passport, and what stands
// in its place on 밥상 is the same shape 소개 already uses for the catalogue —
// a card per kind, tinted, with an emoji and the names under it. The
// difference is that these cards hold what this reader chose rather than
// everything the app has.
//
// Here rather than in the component because it is the half that can be wrong
// quietly: a dish counted under the wrong kind, a kind drawn with nothing in
// it, or the order coming out of a Map's insertion order instead of the
// catalogue's — none of those throw and none are visible in a DOM query.

import { DISH_GROUPS, groupOfMenu } from '../catalog/dishGroups.js';

/**
 * One entry per kind that has at least one of the picked dishes in it.
 *
 * Ordered by the catalogue rather than by how many were picked or when: the
 * six cards are in the same order on 소개, and a reader who has seen them
 * there should not have to find them again in a new arrangement.
 *
 * A dish the group catalogue does not know is dropped, not filed under a
 * seventh heading — the two catalogues are bridged by hand (MENU_ALIAS) and
 * an unbridged dish is a gap to fix there, not a card to invent here.
 */
export function pickedGroups(dishes = [], groups = DISH_GROUPS) {
  const byGroup = new Map();
  for (const dish of dishes ?? []) {
    if (!dish?.id) continue;
    // groupOfMenu hands back the group, not its id.
    const groupId = groupOfMenu(dish.id)?.id;
    if (!groupId) continue;
    if (!byGroup.has(groupId)) byGroup.set(groupId, []);
    byGroup.get(groupId).push(dish);
  }
  return (groups ?? [])
    .filter(g => byGroup.has(g.id))
    .map(g => ({ group: g, dishes: byGroup.get(g.id) }));
}

/** How many of the picked dishes the cards actually account for. */
export const pickedShown = (rows = []) =>
  rows.reduce((n, r) => n + (r.dishes?.length ?? 0), 0);
