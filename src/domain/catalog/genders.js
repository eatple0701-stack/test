// Self-declared gender — a message like nationality, never a verdict.
//
// The foreign tester's 8/1 review praised a "gender preference filter" that
// did not exist anywhere in this repo or its git history — see HANDOFF.md §4.
// Decision, made outside this file: build it. Scope, decided once here rather
// than re-argued at every call site — self-declared and optional, exactly
// like `nationality` (src/data/profile.js); never verified; and the filter it
// powers changes what a traveller sees on their own Tables list, the same way
// the existing menu-dish chips do. It does not gate who may host or join a
// table — this app does not police seating, and has been careful never to
// claim safety machinery it does not have (see NOT_YET_BUILT in
// content/safety.js).

export const GENDERS = ['Woman', 'Man', 'Non-binary'];

export const isGender = (g) => GENDERS.includes(g);

/** Only a value this catalog knows; unset stays null rather than becoming a guess. */
export const cleanGender = (g) => (isGender(g) ? g : null);

/**
 * Does this table currently include somebody who declared `wanted`?
 *
 * The host counts — they are seated at their own table — so a solo host who
 * said "Woman" already satisfies a "Woman" preference with no guests yet.
 * `wanted` of null/undefined means no preference was stated, and every table
 * qualifies — mirroring how an empty menu filter in TablesTab shows
 * everything rather than nothing.
 */
export function tableIncludesGender(table, signups = [], wanted = null) {
  if (!wanted) return true;
  if (table?.hostGender === wanted) return true;
  return signups.some(s => s?.gender === wanted);
}

/**
 * The rule the women-only filter applies: is a woman HOSTING this table?
 *
 * Named separately from tableIncludesGender because it is a narrower question
 * deliberately, and the narrowing is a privacy decision rather than a
 * shortcut. Counting guests as well would be the more useful filter and was
 * the first version; it had to go because the number of people at each table
 * is public (public.seat_holds()), so a one-guest table appearing in the
 * results would say that guest is a woman — the same inference the has_woman
 * column was rejected for, arriving through the side door.
 *
 * Restricting to two-or-more-guest tables would blunt that without removing
 * the worse half: the answer would still change the moment somebody joined,
 * pointing at whoever had just arrived. On the host it is fixed when the
 * table is created and never moves.
 *
 * The cost, written down rather than hidden: a table hosted by a man where a
 * woman is already going does not match. The filter misses matches; it never
 * claims company that is not there.
 *
 * public.tables_with_woman() applies exactly this rule on the Supabase side.
 * The two have to agree, or the filter means different things depending on
 * whether a project is wired up.
 */
export const tableShowsWoman = (table) => tableIncludesGender(table, [], 'Woman');
