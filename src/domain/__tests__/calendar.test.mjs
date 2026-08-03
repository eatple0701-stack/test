import test from 'node:test';
import assert from 'node:assert/strict';
import { icsForTable, icsFilenameFor, MEAL_HOURS } from '../calendar.js';

// The calendar file, held to the parts of RFC 5545 that actually bite:
// CRLF endings, escaped separators, and times that mean the dinner's own
// wall clock rather than a UTC translation of it.

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

test('the dinner is at 19:00 on the wall clock, not a UTC translation', () => {
  const ics = icsForTable(table(), menu, { now: NOW });
  assert.ok(ics.includes('DTSTART:20260816T190000'), 'start is not floating local 19:00');
  assert.ok(!ics.includes('DTSTART:20260816T190000Z'), 'start must not claim UTC');
  // DTSTAMP is the exception the spec wants in UTC, pinned via the injected now.
  assert.ok(ics.includes('DTSTAMP:20260803T050000Z'));
});

test(`the meal runs ${MEAL_HOURS} hours, surviving a date rollover`, () => {
  const late = icsForTable(table({ time: '23:00' }), menu, { now: NOW });
  assert.ok(late.includes('DTSTART:20260816T230000'));
  assert.ok(late.includes('DTEND:20260817T010000'), 'end did not cross midnight correctly');
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
