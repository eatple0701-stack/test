import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeSeatHolds, anonymousHold } from '../policy/seatHolds.js';
import { seatsRemaining, attendance } from '../policy/table.js';

// The seat counter, once the guest list stops being public.
//
// These call the real functions rather than checking that the source mentions
// them. Four bugs in two days got past tests that matched a file for a token,
// and this is the module where that would be easiest to repeat: every
// assertion below is about a number a stranger reads off a card.

const TABLE = { id: 't1', seats: 4, date: '2030-01-01', time: '19:00' };
const hold = (table_id, status = 'accepted') => ({ table_id, status });

test('a table you can read into is left exactly as it was', () => {
  // signups_read gives you all of a table's rows or none, so a table with any
  // visible row is a table whose real rows are complete. Adding placeholders
  // on top would count the same seats twice.
  const mine = [{ id: 's1', tableId: 't1', name: 'Mina', status: 'accepted' }];
  const merged = mergeSeatHolds(mine, [hold('t1'), hold('t1')]);
  assert.deepEqual(merged, mine);
  assert.equal(seatsRemaining(TABLE, merged.filter(s => s.tableId === 't1')), 2);
});

test('a table you cannot read into still counts its seats', () => {
  const merged = mergeSeatHolds([], [hold('t1'), hold('t1')]);
  assert.equal(merged.length, 2);
  assert.equal(seatsRemaining(TABLE, merged), 1, 'host plus two guests of four');
  assert.equal(attendance(TABLE, merged).going, 3);
});

test('a pending request holds a seat but is not company', () => {
  // The reason seat_holds() returns the status rather than a total: these are
  // two different numbers on the same card, and the rule for them lives in
  // seatRequest.js. A SQL COUNT would have had to pick one.
  const merged = mergeSeatHolds([], [hold('t1', 'accepted'), hold('t1', 'pending')]);
  assert.equal(seatsRemaining(TABLE, merged), 1, 'a pending request must hold its seat');
  assert.equal(attendance(TABLE, merged).going, 2, 'a pending request is not somebody going');
});

test('placeholders carry nobody', () => {
  const [seat] = mergeSeatHolds([], [hold('t1')]);
  assert.equal(seat.userId, null, 'a placeholder can be traced to a person');
  assert.equal(seat.name, '');
  assert.equal(seat.gender, null, 'the women filter could read a gender off a placeholder');
  assert.equal(seat.nationality, null);
  assert.equal(seat.note, '');
  assert.equal(seat.avatarUrl, '', 'the avatar stack would render a face for somebody unreadable');
  assert.equal(seat.anonymous, true);
  // Every field a screen might reach for is present and empty rather than
  // missing, so nothing renders `undefined` mid-sentence.
  for (const key of ['languages', 'diets']) assert.deepEqual(seat[key], []);
});

test('placeholders at one table do not collide with another', () => {
  const merged = mergeSeatHolds([], [hold('t1'), hold('t2'), hold('t1')]);
  const ids = merged.map(s => s.id);
  assert.equal(new Set(ids).size, 3, 'two placeholders share a React key');
  assert.equal(merged.filter(s => s.tableId === 't1').length, 2);
  assert.equal(merged.filter(s => s.tableId === 't2').length, 1);
});

test('the mix: your own table exact, the rest counted', () => {
  const mine = [{ id: 's1', tableId: 't1', name: 'Mina', status: 'accepted' }];
  const merged = mergeSeatHolds(mine, [hold('t1'), hold('t2'), hold('t2')]);
  const at = (id) => merged.filter(s => s.tableId === id);
  assert.deepEqual(at('t1'), mine, 'a table you are part of gained a phantom guest');
  assert.equal(at('t2').length, 2);
  assert.equal(at('t2').every(s => s.anonymous), true);
});

test('no holds means no change, whatever arrives', () => {
  // The degraded path: a project a migration behind has no seat_holds(), and
  // the rows themselves are then the whole truth.
  const mine = [{ id: 's1', tableId: 't1', status: 'accepted' }];
  for (const empty of [[], null, undefined, 'nonsense', {}]) {
    assert.deepEqual(mergeSeatHolds(mine, empty), mine, `${JSON.stringify(empty)} changed the list`);
  }
});

test('a hold with no table is dropped rather than counted somewhere', () => {
  const merged = mergeSeatHolds([], [hold('t1'), { status: 'accepted' }, hold(null)]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].tableId, 't1');
});

test('a hold naming a table twice under either key is understood', () => {
  // seat_holds() returns snake_case over PostgREST; the local backend and any
  // future caller would reach for camelCase. Both are accepted so a working
  // seat counter never depends on which one arrived.
  assert.equal(mergeSeatHolds([], [{ tableId: 't9', status: 'accepted' }])[0].tableId, 't9');
  assert.equal(mergeSeatHolds([], [{ table_id: 't9', status: 'accepted' }])[0].tableId, 't9');
});

test('a status that did not arrive is read as a taken seat', () => {
  // Erring towards full. A seat wrongly counted free sends somebody to a
  // restaurant that has no room for them; the other way round they see one
  // fewer table. seatRequest.js makes the same choice for rows written before
  // statuses existed.
  const [seat] = mergeSeatHolds([], [{ table_id: 't1' }]);
  assert.equal(seat.status, 'accepted');
  assert.equal(seatsRemaining(TABLE, [seat]), 2);
});

test('anonymousHold is what the merge actually produces', () => {
  // Guards against the two drifting apart if one is edited alone.
  assert.deepEqual(mergeSeatHolds([], [hold('t7', 'pending')]), [anonymousHold('t7', 'pending', 0)]);
});
