// Why the list is empty — which is a different question each time.
//
// An empty screen is the one a new product spends most of its life showing,
// and on 2026-08-04 this app became a live example: twelve seeded demo tables
// were deleted and exactly one real table was left. The day after it passes,
// the Tables tab is empty for everybody.
//
// The screen had three empty states and they were nearly right. Two things
// were wrong, both of the same kind — a sentence asserting something nobody
// had checked:
//
//   1. "No table for this one yet." — the fall-through case, shown whenever
//      nothing matched and no day or gender filter was on. "This one" means a
//      dish, and it read correctly while a dish filter was the only way to get
//      there. With no tables at all the dish filter does not even render
//      (TablesTab only offers chips for dishes somebody is eating), so a first
//      visitor to an empty app read a sentence about a dish they never chose.
//
//   2. "Other days have tables" — printed under a day with nothing on it.
//      True while the week held something. On an empty week it is the app
//      telling somebody to go look at days it knows are also empty.
//
// So the reason is derived rather than assumed, the same way tableKind is.
// The copy lives with it because the wording *is* the judgement here: what
// separates these cases is only what you are honestly allowed to say.

export const EMPTY = {
  GENDER: 'gender',   // the 여성 동석 filter emptied it
  DAY: 'day',         // a chosen day has nothing
  DISH: 'dish',       // a chosen dish has nothing
  NONE: 'none',       // the app itself has no upcoming table
};

/**
 * Why is `shown` empty, or null when it is not.
 *
 * `open` is every upcoming table this reader could see before the filters —
 * the difference between "your filter hid everything" and "there is nothing".
 * Ordered most specific first: a filter the reader set is a better
 * explanation than the state of the whole app, because it is the one they can
 * undo.
 */
export function emptyReason({ open = [], shown = [], menuFilter = null, womenFilter = false, dayFilter = null } = {}) {
  if (shown.length > 0) return null;
  if (womenFilter) return EMPTY.GENDER;
  if (dayFilter) return EMPTY.DAY;
  if (menuFilter) return EMPTY.DISH;
  // Nothing the reader chose is hiding anything: the week is genuinely bare.
  return open.length === 0 ? EMPTY.NONE : EMPTY.DISH;
}

/** Are there tables on days other than the one being looked at? */
export const hasOtherDays = (open = [], dayFilter = null) =>
  open.some(t => t.date !== dayFilter);

/**
 * What an empty screen may say.
 *
 * `otherDays` is passed in rather than assumed so the day case can stop
 * promising tables elsewhere when there are none. Every string here is
 * something the caller has actually established.
 */
export function emptyText(reason, { otherDays = false } = {}) {
  switch (reason) {
    case EMPTY.GENDER:
      return {
        title: 'Nobody has said yet.',
        body: 'Gender is new here — no host or guest has declared one yet. That is not the same as no table like this existing.',
      };
    case EMPTY.DAY:
      return {
        title: 'Nothing on that day yet.',
        body: otherDays
          ? 'Other days have tables — or open one and own the evening.'
          : 'No day this week has one yet. Open a table and this is the day it happens.',
      };
    case EMPTY.DISH:
      return {
        title: 'No table for this dish yet.',
        body: 'Open it yourself and the seats are yours to fill.',
      };
    case EMPTY.NONE:
      // The honest sentence for a week with nothing in it. It does not
      // apologise and it does not pretend a filter is in the way — and it
      // does not push an account, because everything named here is free to
      // read without one. See AccessPolicy: browsing was always open.
      return {
        title: 'No tables open this week.',
        body: 'Nobody has set one yet — so the first is yours to set. The dishes, the phrases for the table and the places are all here to read meanwhile.',
      };
    default:
      return null;
  }
}
