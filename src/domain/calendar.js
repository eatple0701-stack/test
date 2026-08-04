// The table as a calendar entry.
//
// A traveller's day is their phone calendar, and the app's promise — be at
// this exit at this time — is exactly the shape of an event. Meetup hands
// its members this file; the absence here meant copying a time by hand into
// another app, which is where typos put people at the right exit an hour
// late.
//
// This is a formatter, not a policy: no judgement lives here, only RFC 5545.
// Times are written as floating local time on purpose — no TZID, no Z. The
// dinner is at 19:00 where the diner is standing, and every phone at that
// table is already on Korean time. Converting to UTC would be correct in a
// spec sense and wrong in every practical one the moment somebody's laptop
// is still on home time.
//
// Deliberately not folded at 75 octets. RFC 5545 asks for folding; every
// parser this file will actually meet (Google, Apple, Outlook) accepts long
// lines, and folding multi-byte Korean safely means counting octets rather
// than characters — real complexity for a rule nothing enforces. If a parser
// ever chokes, this comment is where to look.

/** Comma, semicolon, backslash and newline carry meaning in ICS text. */
const escapeText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/** '2026-08-16' + '19:00' → a Date in local time, or null if malformed. */
const mealDate = (date, time) => {
  const d = new Date(`${date}T${time ?? '00:00'}`);
  return Number.isFinite(d.getTime()) ? d : null;
};

const two = (n) => String(n).padStart(2, '0');

/** A Date → floating local ICS form, 20260816T190000. */
const icsLocal = (d) =>
  `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}T${two(d.getHours())}${two(d.getMinutes())}00`;

/** A Date → UTC ICS form for DTSTAMP, which the spec does want in UTC. */
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
  const start = mealDate(table?.date, table?.time);
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
    `DTSTART:${icsLocal(start)}`,
    `DTEND:${icsLocal(end)}`,
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
 * `ctz` is Asia/Seoul rather than the floating time the .ics uses. Google's
 * template has no floating form: without a zone it reads the times in the
 * *viewer's* zone, which would put a traveller whose laptop is still on home
 * time at the wrong hour. Naming the zone is how you say "19:00 in Seoul"
 * here, and it means the same thing the .ics means.
 */
export function googleCalendarUrl(table, menu, { url = '' } = {}) {
  const start = mealDate(table?.date, table?.time);
  if (!start || !menu) return null;
  const end = new Date(start.getTime() + MEAL_HOURS * 3600000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${menu.nameKo} ${menu.name} · 밥친구`,
    dates: `${icsLocal(start)}/${icsLocal(end)}`,
    location: [table.restaurant, table.place].filter(Boolean).join(' — '),
    details: [
      `Meet at ${table.place}.`,
      table.restaurant ? `Eating at ${table.restaurant}.` : 'Restaurant decided together at the table.',
      url,
    ].filter(Boolean).join('\n'),
    ctz: 'Asia/Seoul',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
