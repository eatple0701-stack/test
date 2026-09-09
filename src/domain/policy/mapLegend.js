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
