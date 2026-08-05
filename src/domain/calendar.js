// The table as a calendar entry.
//
// A traveller's day is their phone calendar, and the app's promise — be at
// this exit at this time — is exactly the shape of an event. Meetup hands
// its members this file; the absence here meant copying a time by hand into
// another app, which is where typos put people at the right exit an hour
// late.
//
// This is a formatter, not a policy: no judgement lives here, only RFC 5545.
//
// Times go out in UTC, with the Z. They were floating — no TZID, no Z — on the
// stated grounds that "every phone at that table is already on Korean time",
// and that premise is false for the only audience this app has. A floating
// time means the calendar app reads the digits in *its own* zone, so a phone
// still set to New York saved 19:00 EDT: thirteen hours from the meal, on a
// screen that looked completely normal.
//
// The Google link twenty lines below had this right the whole time, and said
// so — "without a zone it reads the times in the viewer's zone, which would
// put a traveller whose laptop is still on home time at the wrong hour". Two
// paths out of one file disagreeing about the same fact. UTC is how they now
// agree: the event lands on the right instant everywhere and each calendar
// renders it in whatever zone its owner is on.
//
// Deliberately not folded at 75 octets. RFC 5545 asks for folding; every
// parser this file will actually meet (Google, Apple, Outlook) accepts long
// lines, and folding multi-byte Korean safely means counting octets rather
// than characters — real complexity for a rule nothing enforces. If a parser
// ever chokes, this comment is where to look.

import { KST_OFFSET_MINUTES } from './policy/clock.js';

/** Comma, semicolon, backslash and newline carry meaning in ICS text. */
const escapeText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/**
 * '2026-08-16' + '19:00' → the instant that is *in Korea*, or null if
 * malformed.
 *
 * Built from the parts rather than `new Date('2026-08-16T19:00')`, which
 * parses as the device's own local time — the same wrong assumption in a
 * different place. The table's hour is Korean, always.
 */
const mealInstant = (date, time) => {
  const [y, mo, d] = String(date ?? '').split('-').map(Number);
  const [h, mi] = String(time ?? '00:00').split(':').map(Number);
  if (![y, mo, d, h, mi].every(Number.isFinite)) return null;
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - KST_OFFSET_MINUTES * 60000);
};

const two = (n) => String(n).padStart(2, '0');

/** A Date → UTC ICS form. Used for DTSTAMP and, now, for the event itself. */
const icsUtc = (d) =>
  `${d.getUTCFullYear()}${two(d.getUTCMonth() + 1)}${two(d.getUTCDate())}T${two(d.getUTCHours())}${two(d.getUTCMinutes())}00Z`;

/** Korean dinners run long by design; two hours is the honest default guess. */
export const MEAL_HOURS = 2;

/**
 * One table → the text of an .ics file, or null when the table has no
 * parseable time (a malformed row must not download a broken file).
 *
 * `now` is injectable so a test can pin DTSTAMP; callers pass nothing.
 */
export function icsForTable(table, menu, { url = '', now = new Date() } = {}) {
  const start = mealInstant(table?.date, table?.time);
  if (!start || !menu) return null;
  const end = new Date(start.getTime() + MEAL_HOURS * 3600000);

  const summary = `${menu.nameKo} ${menu.name} · 밥친구`;
  const location = [table.restaurant, table.place].filter(Boolean).join(' — ');
  const description = [
    `Meet at ${table.place}.`,
    table.restaurant ? `Eating at ${table.restaurant}.` : 'Restaurant decided together at the table.',
    url,
  ].filter(Boolean).join('\n');

  // CRLF is the one part of the spec nothing forgives.
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//bapchingu//eatple//EN',
    'BEGIN:VEVENT',
    `UID:${table.id}@bapchingu`,
    `DTSTAMP:${icsUtc(now)}`,
    `DTSTART:${icsUtc(start)}`,
    `DTEND:${icsUtc(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    `LOCATION:${escapeText(location)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/** The filename a phone shows in the download tray. */
export const icsFilenameFor = (menu) => `bapchingu-${menu?.id ?? 'table'}.ics`;

/**
 * The same event as a Google Calendar link, because the .ics does not always
 * arrive.
 *
 * Found on a real phone, 2026-08-04: a host opened the app inside KakaoTalk's
 * in-app browser, pressed 캘린더에 추가, got iOS's file preview — and no Add
 * button, because an in-app browser previews the download instead of handing
 * it to the Calendar app. The event was never saved and nothing said so.
 *
 * A plain https link has no such problem. It survives every in-app browser
 * there is, because opening a URL is the one thing they all do.
 *
 * This does not replace the .ics. The file is the better answer wherever it
 * works — it needs no account and no third party — so both are offered and
 * the file stays first.
 *
 * Both paths now write the same UTC instant. This link used to pair local
 * digits with `ctz=Asia/Seoul`, which Google documents and which was correct;
 * it is gone because the digits it formatted came out of the *device's* clock,
 * and once mealInstant started returning a true instant that pairing would
 * have been wrong twice over. Google documents the Z form too, and one
 * representation shared with the .ics is one thing to get right rather than
 * two.
 */
export function googleCalendarUrl(table, menu, { url = '' } = {}) {
  const start = mealInstant(table?.date, table?.time);
  if (!start || !menu) return null;
  const end = new Date(start.getTime() + MEAL_HOURS * 3600000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${menu.nameKo} ${menu.name} · 밥친구`,
    dates: `${icsUtc(start)}/${icsUtc(end)}`,
    location: [table.restaurant, table.place].filter(Boolean).join(' — '),
    details: [
      `Meet at ${table.place}.`,
      table.restaurant ? `Eating at ${table.restaurant}.` : 'Restaurant decided together at the table.',
      url,
    ].filter(Boolean).join('\n'),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
