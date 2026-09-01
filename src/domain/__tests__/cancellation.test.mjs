import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelledAt, isCancelled, bookable, isActionable, cancellationNotice,
  withdrawnAt, isWithdrawn, liveSignups,
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

// ── Giving up a seat, one level down ────────────────────────────────────

const seat = (over = {}) => ({ id: 's1', tableId: 't1', userId: 'u1', status: 'pending', ...over });

test('a withdrawn request stops counting, and the row it came from is not the test', () => {
  assert.equal(isWithdrawn(seat()), false);
  assert.equal(isWithdrawn(seat({ cancelledAt: CANCELLED })), true);
  assert.equal(withdrawnAt(seat({ cancelledAt: CANCELLED })), Date.parse(CANCELLED));
  assert.equal(withdrawnAt(seat()), null);
});

test('every list drops the requests somebody took back', () => {
  const rows = [
    seat({ id: 'a' }),
    seat({ id: 'b', cancelledAt: CANCELLED }),
    seat({ id: 'c', status: 'accepted' }),
  ];
  assert.deepEqual(liveSignups(rows).map(s => s.id), ['a', 'c']);
  assert.deepEqual(liveSignups([]), []);
  assert.deepEqual(liveSignups(), []);
});

test('a row from a database without the column is still somebody holding a seat', () => {
  // The reason this filter is in JavaScript and not in the query. On
  // 2026-09-01 a bundle that named a column its database did not have turned
  // every read of signups into a 400 for twenty minutes, mid-pilot, and the
  // table page told two people their dinner had been called off.
  //
  // A row that has never heard of cancelled_at has to read as live. Anything
  // else and an old bundle against a new database — or the reverse — empties
  // a table that is full.
  const old = { id: 'x', tableId: 't1', userId: 'u1', status: 'accepted' };
  assert.equal('cancelledAt' in old, false, 'the fixture stopped being the case it is about');
  assert.equal(isWithdrawn(old), false);
  assert.deepEqual(liveSignups([old]).map(s => s.id), ['x']);

  // And explicitly undefined, which is what signupFromRow writes.
  assert.equal(isWithdrawn(seat({ cancelledAt: undefined })), false);
  assert.equal(isWithdrawn(seat({ cancelledAt: null })), false);
});

test('an unreadable timestamp leaves the seat taken', () => {
  // The safe direction is the opposite of the one for tables. A table wrongly
  // shown as cancelled sends somebody home; a seat wrongly shown as given up
  // gets handed to a second person, and two travellers turn up for one chair.
  assert.equal(isWithdrawn(seat({ cancelledAt: 'banana' })), false);
  assert.deepEqual(liveSignups([seat({ cancelledAt: 'banana' })]).length, 1);
});

test('a number works as well as a string, because one backend writes each', () => {
  assert.equal(isWithdrawn(seat({ cancelledAt: 1754215200000 })), true);
});
