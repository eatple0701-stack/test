// The map's six kinds, as a control rather than a key.
//
// They were a legend — a span per kind, saying what the coloured dots meant —
// and on 2026-09-09 two testers tapped them expecting the map to narrow, one
// asking whether it was broken on mobile. It was neither broken nor mobile:
// it had never been a button. The filter behind it already existed and was
// already wired; what was missing was any way to turn it on from 장소, since
// FilterBar's chip row is off on that tab.
//
// This file is the small amount of that decision that can be wrong quietly —
// the shape of the filter id, and what colour the swatch takes when the chip
// is filled with the category's own colour. A component cannot be imported by
// the node test runner, so a rule left in the JSX can only be checked by
// matching the source, which is how four bugs got past tests in two days.

/** How a kind is written in `selectedFilters`. App answers it with servesGroup(). */
export const GROUP_FILTER = 'group:';

export const groupFilterId = (groupId) => `${GROUP_FILTER}${groupId}`;

/** The group id inside a filter string, or null if that is not what it is. */
export const groupIdOfFilter = (filter) =>
  (typeof filter === 'string' && filter.startsWith(GROUP_FILTER)
    ? filter.slice(GROUP_FILTER.length) || null
    : null);

/** Is this kind currently filtering the map? */
export const isGroupOn = (selectedFilters, groupId) =>
  (selectedFilters ?? []).includes(groupFilterId(groupId));

/**
 * The swatch beside the name.
 *
 * The kind's own tint normally. White once the chip is filled with that same
 * tint, or the swatch disappears into its own colour and the row stops saying
 * what the dots on the map mean — which is the job it had before it also
 * became a button.
 */
export const swatchColor = (group, on = false) => (on ? '#FFFFFF' : group?.tint ?? null);

/**
 * The group a register dot takes its colour from, or null if the filter has
 * ruled the place out.
 *
 * Reported 2026-09-09, twice, as "카테고리가 작동 안 한다": pressing K-BBQ took
 * the list from 8,136 to 3,916 and left the map exactly as it was — every
 * colour of dot still on it — so the filter looked dead on the surface that
 * fills most of the screen.
 *
 * The dots never saw the filter. NearbyLayer loads the register itself and
 * draws whatever is in view, cut only by the search box. The comment in that
 * file records the same bug being fixed for search on 2026-09-04, in the same
 * words the team used this time: a list that can be folded away narrowed while
 * the map stayed identical.
 *
 * One function does both halves. With a filter on, the dot takes the colour of
 * the kind that was asked for — so a 고깃집 that also does 백반 is orange while
 * K-BBQ is the question, rather than keeping whichever colour its first dish
 * happened to give it — and a place that matches nothing comes back null for
 * the caller to drop. With no filter on it is the old rule, the first group the
 * place has, unchanged.
 */
export function dotGroup(groups = [], activeGroupIds = []) {
  const active = (activeGroupIds ?? []).filter(Boolean);
  if (!active.length) return (groups ?? [])[0] ?? null;
  return (groups ?? []).find(g => active.includes(g?.id)) ?? null;
}

/** The kinds currently filtering the map, read out of selectedFilters. */
export const groupsBeingFiltered = (selectedFilters = []) =>
  (selectedFilters ?? []).map(groupIdOfFilter).filter(Boolean);
