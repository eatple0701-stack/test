// What time it is, said to somebody who may not be on Korean time yet.
//
// Every time in this app was printed bare — "19:00", "Thu 6 Aug · 19:00" —
// with no timezone anywhere in the source (2026-08-05: `GMT`, `KST` and
// `timeZone` each returned nothing across every component and policy). For an
// app whose entire audience landed in Korea within the last few days, that is
// not a formatting detail. A phone that still thinks it is in Osaka renders a
// calendar entry an hour early; one still on New York time is thirteen hours
// out. The failure mode is somebody sitting alone in a restaurant.
//
// Meetup, which sells the same thing we do — turning up somewhere at a stated
// hour — prints "2026년 8월 08일 10:00 GMT+9" on every card. That is the
// reference this file follows.
//
// Two rules, and the second is the one that matters:
//
//   1. A time this app prints always carries KST. Four characters, and it
//      removes the assumption entirely.
//
//   2. If the reader's own device is not on Korean time, say what the same
//      moment reads as there. This is derived from the device, not asked —
//      somebody who has not changed their phone yet is exactly the person who
//      will not think to check.
//
// Korea has no daylight saving and has not since 1988, so the offset is a
// constant rather than a lookup. That is a fact about Korea, not a shortcut:
// KST is UTC+9 all year.

export const KST_OFFSET_MINUTES = 540;
export const KST_LABEL = 'KST';

/**
 * The device's own offset from UTC, in minutes ahead of it.
 *
 * `getTimezoneOffset` counts minutes *behind* UTC, so Seoul reports -540. It
 * is negated here so that everything downstream can compare against
 * KST_OFFSET_MINUTES without anybody having to remember the inversion.
 */
export function deviceOffsetMinutes(now = new Date()) {
  return -now.getTimezoneOffset();
}

/** Is this device already on Korean time? */
export const onKoreanTime = (offset = deviceOffsetMinutes()) =>
  offset === KST_OFFSET_MINUTES;

/** "19:00" → "19:00 KST". Anything unparseable is handed back untouched. */
export function timeText(time) {
  if (typeof time !== 'string' || !/^\d{1,2}:\d{2}$/.test(time.trim())) return time ?? '';
  return `${time.trim()} ${KST_LABEL}`;
}

/**
 * The same moment as the reader's own device would show it, or null when
 * their device is already on Korean time and the echo would be noise.
 *
 * Returns the pieces rather than a sentence so a caller can lay it out — the
 * card has room for one line, the detail page for more.
 */
export function localEcho(date, time, offset = deviceOffsetMinutes()) {
  if (onKoreanTime(offset)) return null;
  if (typeof date !== 'string' || typeof time !== 'string') return null;

  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  if (![y, mo, d, h, mi].every(Number.isFinite)) return null;

  // The meal is at this wall-clock time in Seoul; step back to the instant,
  // then forward into wherever the reader is.
  const instant = Date.UTC(y, mo - 1, d, h, mi) - KST_OFFSET_MINUTES * 60000;
  const there = new Date(instant + offset * 60000);

  const pad = (n) => String(n).padStart(2, '0');
  const sameDay = there.getUTCFullYear() === y
    && there.getUTCMonth() === mo - 1
    && there.getUTCDate() === d;

  return {
    time: `${pad(there.getUTCHours())}:${pad(there.getUTCMinutes())}`,
    date: `${there.getUTCFullYear()}-${pad(there.getUTCMonth() + 1)}-${pad(there.getUTCDate())}`,
    sameDay,
  };
}

/**
 * The whole warning, as one English line, or null when there is nothing to
 * warn about.
 *
 * Worded as a fact about their phone rather than an instruction. "Set your
 * phone to Korean time" is advice we cannot know is right — they may have
 * kept it on home time deliberately, to call somebody. What they need is the
 * translation, not a lecture.
 */
export function clockWarning(date, time, offset = deviceOffsetMinutes()) {
  const echo = localEcho(date, time, offset);
  if (!echo) return null;
  return echo.sameDay
    ? `Your device is not on Korean time — this reads as ${echo.time} on it.`
    : `Your device is not on Korean time — this reads as ${echo.time} on ${echo.date} there.`;
}
