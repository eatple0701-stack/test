import test from 'node:test';
import assert from 'node:assert/strict';
import { pickedGroups, pickedShown } from '../policy/tasteGroups.js';
import { DISH_GROUPS, groupOfMenu } from '../../domain/catalog/dishGroups.js';
import { menus } from '../../domain/catalog/menus.js';

const dish = (id) => ({ id, nameKo: id });

test('a picked dish lands under the kind the catalogue files it under', () => {
  const rows = pickedGroups([dish('samgyeopsal'), dish('ganjang-gejang')]);
  const ids = rows.map(r => r.group.id);
  assert.deepEqual(ids, ['kbbq', 'adventure']);
  assert.deepEqual(rows[0].dishes.map(d => d.id), ['samgyeopsal']);
});

test('the cards come out in the catalogue order, not the picking order', () => {
  // The same six are in this order on 소개. A reader who has seen them there
  // should not have to find them again in a new arrangement — and a Map keeps
  // insertion order, which is what makes this easy to get wrong.
  const late = pickedGroups([dish('ganjang-gejang'), dish('samgyeopsal')]);
  const early = pickedGroups([dish('samgyeopsal'), dish('ganjang-gejang')]);
  assert.deepEqual(late.map(r => r.group.id), early.map(r => r.group.id));
  const order = DISH_GROUPS.map(g => g.id);
  const at = late.map(r => order.indexOf(r.group.id));
  assert.deepEqual(at, [...at].sort((a, b) => a - b));
});

test('a kind with nothing picked in it gets no card', () => {
  const rows = pickedGroups([dish('samgyeopsal')]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].group.id, 'kbbq');
});

test('nothing picked draws nothing', () => {
  assert.deepEqual(pickedGroups([]), []);
  assert.deepEqual(pickedGroups(), []);
  assert.equal(pickedShown(pickedGroups([])), 0);
});

test('a dish the group catalogue does not know is dropped, not invented', () => {
  // The two catalogues are bridged by hand. An unbridged dish is a gap to
  // fix there; a seventh card headed "그 외" would hide it.
  const rows = pickedGroups([dish('samgyeopsal'), dish('not-a-dish')]);
  assert.equal(pickedShown(rows), 1);
  assert.equal(rows.every(r => r.group.id !== undefined), true);
});

test('every dish the deck can offer has a card to land on', () => {
  // The drop above is a safety net, not a plan: if a dish in the deck had no
  // group, somebody would pick it and it would silently vanish from their
  // own result.
  const missing = menus.filter(m => !groupOfMenu(m.id)).map(m => m.id);
  assert.deepEqual(missing, [], `dishes with no group: ${missing.join(', ')}`);
});
