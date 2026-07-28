// Seat arithmetic and join rules.
//
// These are worth testing above almost anything else in the app: an error
// here does not show up as a broken screen, it shows up as somebody standing
// outside a restaurant in Jongno with no seat.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  seatsRemaining, isPast, joinBlocker, canJoin, validateNewTable, JOIN_BLOCK,
} from '../policy/table.js';
import { menuById, menus, sharedOnlyMenus } from '../catalog/menus.js';

const table = (over = {}) => ({
  id: 't1', menuId: 'samgyeopsal', hostId: 'host', seats: 4,
  date: '2026-12-01', time: '19:00', place: 'Jongno', ...over,
});
const signup = (userId) => ({ id: `s-${userId}`, tableId: 't1', userId });
const before = new Date('2026-11-01T12:00:00');

test('the host occupies one of the seats they opened', () => {
  assert.equal(seatsRemaining(table({ seats: 4 }), []), 3);
  assert.equal(seatsRemaining(table({ seats: 2 }), []), 1);
});

test('each signup takes one more seat, and it never goes negative', () => {
  const t = table({ seats: 3 });
  assert.equal(seatsRemaining(t, [signup('a')]), 1);
  assert.equal(seatsRemaining(t, [signup('a'), signup('b')]), 0);
  // Over-subscription must read as full, not as minus one.
  assert.equal(seatsRemaining(t, [signup('a'), signup('b'), signup('c')]), 0);
});

test('a full table cannot be joined', () => {
  const t = table({ seats: 2 });
  assert.equal(joinBlocker(t, [signup('a')], 'b', before), JOIN_BLOCK.FULL);
});

test('a host cannot join their own table, and nobody joins twice', () => {
  const t = table();
  assert.equal(joinBlocker(t, [], 'host', before), JOIN_BLOCK.OWN_TABLE);
  assert.equal(joinBlocker(t, [signup('a')], 'a', before), JOIN_BLOCK.ALREADY_IN);
});

test('a meal in the past is closed even with seats left', () => {
  const t = table({ date: '2026-01-01', seats: 6 });
  assert.equal(joinBlocker(t, [], 'a', before), JOIN_BLOCK.PAST);
  assert.equal(isPast(t, before), true);
  assert.equal(isPast(table(), before), false);
});

test('an open table with room admits a stranger', () => {
  assert.equal(canJoin(table(), [signup('a')], 'b', before), true);
});

test('a new table must seat at least the dish minimum', () => {
  const menu = menuById('samgyeopsal');
  const base = { menuId: 'samgyeopsal', date: '2026-12-01', time: '19:00', place: 'Jongno' };

  assert.deepEqual(validateNewTable({ ...base, seats: 4 }, menu), []);
  assert.ok(validateNewTable({ ...base, seats: 1 }, menu).length > 0);
  assert.ok(validateNewTable({ ...base, seats: 20 }, menu).length > 0);
  assert.ok(validateNewTable({ ...base, place: '  ' }, menu).length > 0);
});

test('a table cannot be opened in the past', () => {
  const problems = validateNewTable(
    { menuId: 'samgyeopsal', date: '2020-01-01', time: '19:00', place: 'Jongno', seats: 4 },
    menuById('samgyeopsal'),
  );
  assert.ok(problems.some(p => /already passed/.test(p)));
});

test('every menu carries the fields the cards read', () => {
  for (const m of menus) {
    assert.ok(m.id && m.name && m.nameKo, `${m.id} is missing a name`);
    assert.ok(m.whyShared.length > 0, `${m.id} has no reason to be shared`);
    assert.ok(m.howItWorks.length > 0, `${m.id} does not say how to eat it`);
    assert.ok(Number.isInteger(m.minPeople) && m.minPeople >= 1, `${m.id} has a bad minimum`);
    assert.ok(Array.isArray(m.contains), `${m.id} has no allergen list`);
  }
});

test('the catalog is mostly dishes you genuinely cannot order alone', () => {
  // The product only has a reason to exist because of these.
  assert.ok(sharedOnlyMenus().length >= 8);
});

test('no menu quotes a price', () => {
  // Prices move and differ by district; asserting one would mislead a
  // traveller about a shop we have never checked.
  // A price is a number attached to a currency — matching the bare word
  // "won" flags Itaewon, which is a place this food is actually eaten.
  const price = /\d[\d,.]*\s*(won|krw|₩)|₩\s*\d/i;
  for (const m of menus) {
    assert.doesNotMatch(JSON.stringify(m), price, `${m.id} mentions a price`);
  }
});
