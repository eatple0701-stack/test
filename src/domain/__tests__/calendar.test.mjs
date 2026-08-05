import test from 'node:test';
import assert from 'node:assert/strict';
import { icsForTable, icsFilenameFor, googleCalendarUrl, MEAL_HOURS } from '../calendar.js';

// The calendar file, held to the parts of RFC 5545 that actually bite: CRLF
// endings, escaped separators, and a time that means the instant the diner is
// sitting down rather than whatever those digits happen to mean on the phone
// reading them.

const table = (over = {}) => ({
  id: 'tbl-1', date: '2026-08-16', time: '19:00',
  place: 'Jongno 3-ga, Seoul', restaurant: 'Wangbijip; main branch', ...over,
});
const menu = { id: 'samgyeopsal', nameKo: '삼겹살', name: 'Samgyeopsal' };
const NOW = new Date('2026-08-03T05:00:00Z');

test('a table becomes a well-formed event', () => {
  const ics = icsForTable(table(), menu, { now: NOW });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
  assert.ok(ics.includes('UID:tbl-1@bapchingu'));
  assert.ok(ics.includes('SUMMARY:삼겹살 Samgyeopsal · 밥친구'));
});

test('lines end in CRLF, the one thing no parser forgives', () => {
  const ics = icsForTable(table(), menu, { now: NOW });
  // Every newline is preceded by \r — equivalently, no bare \n survives.
  assert.equal(ics.split('\n').length, ics.split('\r\n').length);
});

test('19:00 in Seoul goes out as the instant it actually is', () => {
  // This asserted the opposite until 2026-08-05: a floating DTSTART, on the
  // stated grounds that every phone at the table is already on Korean time.
  // It is not — the audience landed this week — and a floating time is read
  // by the calendar app in its own zone, so a phone still on New York saved
  // 19:00 EDT. Thirteen hours out, on a screen that looked normal.
  //
  // 19:00 KST is 10:00 UTC. Written that way, every calendar puts the event
  // on the right instant and renders it in whatever zone its owner is on.
  const ics = icsForTable(table(), menu, { now: NOW });
  assert.ok(ics.includes('DTSTART:20260816T100000Z'), 'start is not the 19:00 KST instant');
  assert.ok(!/DTSTART:\d{8}T\d{6}(?!Z)/.test(ics), 'a floating start survived');
  assert.ok(ics.includes('DTSTAMP:20260803T050000Z'));
});

test(`the meal runs ${MEAL_HOURS} hours, surviving a date rollover`, () => {
  // 23:00 KST is 14:00 UTC the same day; two hours later is 16:00 UTC, which
  // is 01:00 KST on the 17th. The rollover the diner experiences is real even
  // though the UTC date does not change — which is exactly why the instant,
  // not the digits, is the thing to store.
  const late = icsForTable(table({ time: '23:00' }), menu, { now: NOW });
  assert.ok(late.includes('DTSTART:20260816T140000Z'));
  assert.ok(late.includes('DTEND:20260816T160000Z'), 'end did not advance two hours');
});

test('the same table written twice means the same moment either way out', () => {
  // The .ics and the Google link are two paths out of one file and used to
  // disagree about this. Whichever a traveller takes, they must land on the
  // same instant.
  const ics = icsForTable(table(), menu, { now: NOW });
  const gcal = googleCalendarUrl(table(), menu);
  const fromIcs = /DTSTART:(\d{8}T\d{6}Z)/.exec(ics)[1];
  const fromGcal = decodeURIComponent(/dates=([^&]+)/.exec(gcal)[1]).split('/')[0];
  assert.equal(fromGcal, fromIcs);
});

test('commas and semicolons in real place names are escaped', () => {
  const ics = icsForTable(table(), menu, { now: NOW });
  assert.ok(ics.includes('LOCATION:Wangbijip\\; main branch — Jongno 3-ga\\, Seoul'));
});

test('a malformed time yields no file rather than a broken one', () => {
  assert.equal(icsForTable(table({ date: 'not-a-date' }), menu, { now: NOW }), null);
  assert.equal(icsForTable(table(), null, { now: NOW }), null);
});

test('the filename comes from the dish id, safe for a download tray', () => {
  assert.equal(icsFilenameFor(menu), 'bapchingu-samgyeopsal.ics');
  assert.equal(icsFilenameFor(null), 'bapchingu-table.ics');
});
