import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isBlockedId, visibleTables } from '../policy/blocking.js';

const table = (over = {}) => ({
  id: 't1', menuId: 'samgyeopsal', hostId: 'host-a', seats: 4,
  date: '2026-12-01', time: '19:00', place: 'Jongno', ...over,
});

test('isBlockedId is a plain membership check', () => {
  assert.equal(isBlockedId('u1', ['u1', 'u2']), true);
  assert.equal(isBlockedId('u3', ['u1', 'u2']), false);
  assert.equal(isBlockedId('u1', []), false);
});

test('no blocks means nothing is filtered', () => {
  const tables = [table({ id: 't1' }), table({ id: 't2', hostId: 'host-b' })];
  assert.deepEqual(visibleTables(tables, []), tables);
});

test('a blocked host\'s tables disappear, other hosts stay', () => {
  const tables = [
    table({ id: 't1', hostId: 'host-a' }),
    table({ id: 't2', hostId: 'host-b' }),
    table({ id: 't3', hostId: 'host-a' }),
  ];
  const shown = visibleTables(tables, ['host-a']);
  assert.deepEqual(shown.map(t => t.id), ['t2']);
});

test('blocking everyone leaves an empty list, not a crash', () => {
  const tables = [table({ hostId: 'host-a' }), table({ id: 't2', hostId: 'host-b' })];
  assert.deepEqual(visibleTables(tables, ['host-a', 'host-b']), []);
});

test('an empty table list stays empty regardless of the block list', () => {
  assert.deepEqual(visibleTables([], ['host-a']), []);
  assert.deepEqual(visibleTables([], []), []);
});
