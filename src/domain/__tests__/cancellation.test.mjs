import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelledAt, isCancelled, bookable, isActionable, cancellationNotice,
} from '../policy/cancellation.js';

const table = (over = {}) => ({ id: 't1', hostId: 'h1', seats: 4, ...over });
const CANCELLED = '2026-08-03T10:00:00Z';

test('a table nobody cancelled is not cancelled', () => {
  assert.equal(isCancelled(table()), false);
  assert.equal(isCancelled(table({ cancelledAt: null })), false);
  assert.equal(cancelledAt(table()), null);
  assert.equal(isCancelled(null), false);
});

test('both a timestamp string and a number read as cancelled', () => {
  // Postgres hands back ISO; the localStorage backend writes Date.now().
  // Reading only one of the two would make cancellation work on one backend
  // and silently not on the other.
  assert.equal(isCancelled(table({ cancelledAt: CANCELLED })), true);
  assert.equal(isCancelled(table({ cancelledAt: 1754215200000 })), true);
  assert.equal(typeof cancelledAt(table({ cancelledAt: CANCELLED })), 'number');
});

test('garbage in the column does not cancel a real meal', () => {
  // Failing towards "still happening" is the safe direction: a table wrongly
  // shown as cancelled sends somebody home who should have gone to dinner.
  assert.equal(isCancelled(table({ cancelledAt: 'banana' })), false);
});

test('a cancelled table cannot be found by somebody looking for a meal', () => {
  const rows = [table({ id: 'live' }), table({ id: 'off', cancelledAt: CANCELLED })];
  assert.deepEqual(bookable(rows).map(t => t.id), ['live']);
});

test('nothing can be done to a cancelled table', () => {
  // Asking for a seat at a meal that is not happening, or a host accepting
  // into one, are both nonsense — and one question with one answer means a
  // screen cannot forget to check.
  assert.equal(isActionable(table()), true);
  assert.equal(isActionable(table({ cancelledAt: CANCELLED })), false);
  assert.equal(isActionable(null), false);
});

test('a guest is told not to go, and a host is told to reach people themselves', () => {
  const off = table({ cancelledAt: CANCELLED });
  const guest = cancellationNotice(off, { isHost: false });
  assert.match(guest.body, /do not go to the meeting point/);

  const host = cancellationNotice(off, { isHost: true });
  // The app has no notifications. Saying so is the whole point — a host who
  // assumes the guests were told is how somebody ends up at Exit 4 alone.
  assert.match(host.body, /no way to tell them/);
});

test('a table that is still happening has no notice to give', () => {
  assert.equal(cancellationNotice(table(), { isHost: false }), null);
  assert.equal(cancellationNotice(table(), { isHost: true }), null);
});
