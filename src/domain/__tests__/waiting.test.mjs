import test from 'node:test';
import assert from 'node:assert/strict';
import { waitingForYou, waitingCount } from '../policy/waiting.js';

// The requests a host has not answered.
//
// Found on 2026-09-01 by playing the real flow through: a guest asked for a
// seat, and the host had no way to learn it short of opening that one
// table's page by chance. Meanwhile the guest was being shown "the host has
// until 12 hours before the meal to answer — you will not be left guessing
// on the night", which the app had no means of keeping.

const HOST = 'host-1';
const OTHER = 'host-2';

// Dates relative to a fixed "now" so this file does not quietly stop testing
// anything once these days pass — the mistake the RLS fixtures had to be
// rescued from a week ago.
const NOW = new Date('2026-09-01T12:00:00');
const day = (offset) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const table = (over = {}) => ({
  id: 't1', hostId: HOST, date: day(3), time: '19:00', seats: 4, cancelledAt: null, ...over,
});
const asked = (over = {}) => ({ id: 's1', tableId: 't1', status: 'pending', ...over });

test('a request nobody has answered is what a host is shown', () => {
  const rows = waitingForYou([table()], [asked()], HOST, NOW);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].waiting.length, 1);
  assert.equal(rows[0].table.id, 't1');
  assert.equal(waitingCount([table()], [asked()], HOST, NOW), 1);
});

test('an answered request stops asking for attention', () => {
  for (const status of ['accepted', 'declined']) {
    assert.equal(waitingCount([table()], [asked({ status })], HOST, NOW), 0,
      `a ${status} request is still being counted as waiting`);
  }
});

test('somebody else’s table is not your problem', () => {
  assert.equal(waitingCount([table({ hostId: OTHER })], [asked()], HOST, NOW), 0);
  // And the guest at your table does not see their own request as a task.
  assert.equal(waitingCount([table()], [asked()], 'guest-9', NOW), 0);
});

test('a cancelled or finished table asks for nothing', () => {
  assert.equal(waitingCount([table({ cancelledAt: Date.now() })], [asked()], HOST, NOW), 0,
    'a called-off table still wants an answer');
  assert.equal(waitingCount([table({ date: day(-1) })], [asked()], HOST, NOW), 0,
    'a meal that already happened still wants an answer');
});

test('a request that has run out of time is not still waiting', () => {
  // Twelve hours before the meal it lapses and the seat goes back. Telling a
  // host to answer it after that is the same false urgency as not telling
  // them at all — worse, because it looks actionable.
  // Six hours away, so the twelve-hour deadline passed this morning.
  const soon = table({ date: day(0), time: '18:00' });
  assert.equal(waitingCount([soon], [asked()], HOST, NOW), 0,
    'a lapsed request is being shown as if it still needs an answer');

  // Eighteen hours away: the deadline is this evening, still ahead.
  const later = table({ date: day(1), time: '06:00' });
  assert.equal(waitingCount([later], [asked()], HOST, NOW), 1,
    'a request with time left is being hidden');
});

test('the soonest deadline comes first', () => {
  const rows = waitingForYou(
    [table({ id: 'far', date: day(6) }), table({ id: 'near', date: day(2) })],
    [asked({ id: 'a', tableId: 'far' }), asked({ id: 'b', tableId: 'near' })],
    HOST, NOW,
  );
  assert.deepEqual(rows.map(r => r.table.id), ['near', 'far']);
  assert.ok(rows[0].deadline instanceof Date);
  // Twelve hours before the meal, which is what the guest was promised.
  assert.equal(rows[0].deadline.getTime(),
    new Date(`${day(2)}T19:00`).getTime() - 12 * 60 * 60 * 1000);
});

test('two people at one table are two people, not one row', () => {
  const rows = waitingForYou([table()],
    [asked({ id: 'a' }), asked({ id: 'b' }), asked({ id: 'c', status: 'accepted' })], HOST, NOW);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].waiting.length, 2);
  assert.equal(waitingCount([table()],
    [asked({ id: 'a' }), asked({ id: 'b' })], HOST, NOW), 2);
});

test('a row with nothing waiting is not returned at all', () => {
  // So a caller can render on length alone, without a second emptiness rule
  // to keep in step.
  assert.deepEqual(waitingForYou([table()], [], HOST, NOW), []);
  assert.deepEqual(waitingForYou([table()], [asked({ status: 'accepted' })], HOST, NOW), []);
});

test('no signed-in user means nothing to answer', () => {
  // Anonymous browsing is the default state of this app, so this is the
  // common case rather than an edge one.
  for (const nobody of [null, undefined, '']) {
    assert.deepEqual(waitingForYou([table()], [asked()], nobody, NOW), []);
  }
});

test('the anonymous seat placeholders are never counted', () => {
  // seat_holds() stands in for signups a reader may not see, with no user
  // and no real id. They must not appear as somebody to answer — the host
  // can read their own table's rows, so a placeholder there would be a
  // double count of a person who is already listed.
  const placeholder = { id: 'held-t1-0', tableId: 't1', status: 'pending', userId: null, anonymous: true };
  const rows = waitingForYou([table()], [asked(), placeholder], HOST, NOW);
  assert.equal(rows[0].waiting.filter(s => s.anonymous).length, 0,
    'a placeholder seat is being shown to the host as a request to answer');
  assert.equal(rows[0].waiting.length, 1);
});
