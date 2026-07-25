import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collections, collectionThemes, collectionById, themeRefsOfCollection, collectionIdsOfTheme,
} from '../catalog/collections.js';
import { themeById } from '../catalog/themes.js';
import { catalogIntegrity } from '../catalog/index.js';
import { STATUS } from '../types.js';

test('every collection id is unique and status is valid', () => {
  const ids = collections.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
  const statuses = new Set(Object.values(STATUS));
  for (const c of collections) assert.ok(statuses.has(c.status), `${c.id} invalid status`);
});

test('every membership row points at a real collection and theme', () => {
  const cIds = new Set(collections.map(c => c.id));
  for (const row of collectionThemes) {
    assert.ok(cIds.has(row.collectionId), `unknown collection ${row.collectionId}`);
    assert.ok(themeById(row.themeId), `unknown theme ${row.themeId}`);
  }
});

test('every membership row carries an editorial angle', () => {
  for (const row of collectionThemes) {
    assert.ok(
      row.editorialAngle.length > 0,
      `${row.collectionId}/${row.themeId} missing editorialAngle`,
    );
  }
});

test('a theme may belong to more than one collection with different angles', () => {
  const ids = collectionIdsOfTheme('temple-life');
  assert.ok(ids.length >= 2, 'temple-life must prove the N:M relationship');
  const angles = collectionThemes
    .filter(r => r.themeId === 'temple-life')
    .map(r => r.editorialAngle);
  assert.equal(new Set(angles).size, angles.length, 'the same theme must be framed differently per collection');
});

test('theme refs are ordered contiguously from 1 within each collection', () => {
  for (const c of collections) {
    const orders = themeRefsOfCollection(c.id).map(r => r.order);
    assert.deepEqual(orders, orders.map((_, i) => i + 1), `${c.id} has non-contiguous order`);
  }
});

test('activeWindow is either null or a valid month range', () => {
  for (const c of collections) {
    if (c.activeWindow === null) continue;
    const { fromMonth, toMonth } = c.activeWindow;
    assert.ok(fromMonth >= 1 && fromMonth <= 12, `${c.id} bad fromMonth`);
    assert.ok(toMonth >= 1 && toMonth <= 12, `${c.id} bad toMonth`);
  }
});

test('collectionById finds a known record', () => {
  assert.equal(collectionById('first-timers-seoul').id, 'first-timers-seoul');
  assert.equal(collectionById('nope'), undefined);
});

test('the whole catalog passes its integrity gate', () => {
  assert.deepEqual(catalogIntegrity(), []);
});
