// The next seven days, and how many tables are on each.
//
// Borrowed from 제주항공's 최저가 달력 (studied 2026-08-04), which lays thirty
// dates in a row with a price under each. That widget answers the question
// that airline's customers actually arrive with — not "how much" but "which
// day" — and a traveller with four nights in Seoul arrives here with exactly
// the same shape of question.
//
// The important half is the empty days. A filter chip that finds nothing
// looks like a broken filter; a calendar with a 0 under Thursday is a fact,
// and it is the fact that turns a browser into a host. So this returns every
// day in the window, including the ones with nothing on them.
//
// Local dates throughout, computed by walking the calendar rather than by
// adding milliseconds. Both matter: toISOString() is UTC, so a Seoul evening
// is already tomorrow there, and adding 86400000 lands an hour off across a
// daylight-saving boundary — Korea has none today, but this file should not
// be the reason a future traveller in Paris sees the wrong week.

import { isCancelled } from './cancellation.js';
import { isPast } from './table.js';

/** How many days the strip shows. A week is what a trip is planned in. */
export const WEEK_LENGTH = 7;

/** A Date → 'YYYY-MM-DD' on the wall clock the person is standing in. */
export const localYmd = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * The next seven days from `now`, each with the tables open on it.
 *
 * Counts only what somebody could actually sit down at: cancelled tables and
 * meals whose hour has passed are not choices. Today therefore drops its own
 * morning as the day goes on, which is correct — a lunch at noon is not an
 * option at three.
 */
export function weekAhead(tables = [], now = new Date()) {
  const days = [];
  for (let i = 0; i < WEEK_LENGTH; i += 1) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const ymd = localYmd(at);
    const count = tables.filter(t =>
      t?.date === ymd && !isCancelled(t) && !isPast(t, now)).length;
    days.push({
      ymd,
      date: at,
      count,
      isToday: i === 0,
      // Saturday and Sunday, marked because a traveller reads a week by its
      // weekend before reading it by its dates.
      isWeekend: at.getDay() === 6 || at.getDay() === 0,
    });
  }
  return days;
}

/**
 * What the strip says when every day in it is empty.
 *
 * Not an error and not an apology: an empty week is the app telling the
 * truth about a pilot that has just started, and the only useful next move
 * is the one this sentence offers.
 */
export const EMPTY_WEEK = {
  kr: '이번 주엔 아직 열린 밥상이 없어요',
  en: 'Nothing open this week yet — the first table on a day is usually the one somebody else was waiting for.',
};
