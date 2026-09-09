import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GROUP_FILTER, groupFilterId, groupIdOfFilter, isGroupOn, swatchColor, dotGroup, groupsBeingFiltered,
  VISITED, isVisitedOn,
} from '../policy/mapLegend.js';
import { DISH_GROUPS } from '../catalog/dishGroups.js';

test('a kind is written into the filters the way App reads them back', () => {
  // App answers `group:<id>` with servesGroup(). The two halves used to write
  // the prefix out by hand at both ends.
  for (const g of DISH_GROUPS) {
    assert.equal(groupFilterId(g.id), `${GROUP_FILTER}${g.id}`);
    assert.equal(groupIdOfFilter(groupFilterId(g.id)), g.id);
  }
});

test('a filter that is not a kind is not read as one', () => {
  // selectedFilters also holds Vegan, Halal, Zero-waste and the rest.
  for (const f of ['Vegan', 'Halal', '', 'groupie', null, undefined, 42, 'group:']) {
    assert.equal(groupIdOfFilter(f), null, `${JSON.stringify(f)} should not be a kind`);
  }
});

test('a kind is on only when its own id is in the list', () => {
  const on = [groupFilterId('kbbq'), 'Vegan'];
  assert.equal(isGroupOn(on, 'kbbq'), true);
  assert.equal(isGroupOn(on, 'hotpot'), false);
  assert.equal(isGroupOn([], 'kbbq'), false);
  assert.equal(isGroupOn(undefined, 'kbbq'), false);
});

test('the swatch keeps saying what the dots on the map mean', () => {
  // Filled, the chip is the category's own colour, and a swatch painted the
  // same colour is a swatch nobody can see.
  const g = DISH_GROUPS[0];
  assert.equal(swatchColor(g, false), g.tint);
  assert.equal(swatchColor(g, true), '#FFFFFF');
  assert.equal(swatchColor(undefined, false), null);
});

test('every kind on the map has a colour to be a swatch', () => {
  for (const g of DISH_GROUPS) {
    assert.match(swatchColor(g, false), /^#[0-9A-Fa-f]{6}$/, `${g.id} has no tint`);
  }
});

test('with no filter on, a dot keeps the colour it always had', () => {
  // groupsOf returns them in the place's own dish order, and primaryGroup —
  // the rule since the register layer was drawn — is the first of those.
  const groups = [{ id: 'table' }, { id: 'kbbq' }];
  assert.deepEqual(dotGroup(groups, []), { id: 'table' });
  assert.deepEqual(dotGroup(groups), { id: 'table' });
  assert.equal(dotGroup([], []), null);
});

test('with a filter on, a dot takes the colour of the kind that was asked for', () => {
  // A 고깃집 that also does 백반 was blue while K-BBQ was the question, because
  // 백반 happened to be first in its dish list. Reported as the filter doing
  // nothing to the map.
  const groups = [{ id: 'table' }, { id: 'kbbq' }];
  assert.deepEqual(dotGroup(groups, ['kbbq']), { id: 'kbbq' });
});

test('a place the filter rules out comes back null, for the caller to drop', () => {
  const groups = [{ id: 'table' }, { id: 'street' }];
  assert.equal(dotGroup(groups, ['kbbq']), null);
  assert.equal(dotGroup([], ['kbbq']), null);
});

test('with two kinds on, the dot takes the first of them the place has', () => {
  const groups = [{ id: 'street' }, { id: 'kbbq' }];
  assert.deepEqual(dotGroup(groups, ['kbbq', 'street']), { id: 'street' });
});

test('the kinds are read out of the filters the chips write', () => {
  assert.deepEqual(groupsBeingFiltered([groupFilterId('kbbq'), 'Vegan', groupFilterId('table')]),
    ['kbbq', 'table']);
  assert.deepEqual(groupsBeingFiltered(['Vegan', 'Halal']), []);
  assert.deepEqual(groupsBeingFiltered([]), []);
  assert.deepEqual(groupsBeingFiltered(), []);
});

test('직접 가본 곳 is a category of its own, not a dish kind', () => {
  // The six say what a place serves; this says who put it on the map. They
  // share a chip row and nothing else — reading VISITED.filter as a group
  // would ask servesGroup for evidence the curation does not have.
  assert.equal(groupIdOfFilter(VISITED.filter), null);
  assert.deepEqual(groupsBeingFiltered([VISITED.filter]), []);
  assert.match(VISITED.tint, /^#[0-9A-Fa-f]{6}$/);
});

test('the eighteen are on only when their own filter is', () => {
  assert.equal(isVisitedOn([VISITED.filter]), true);
  assert.equal(isVisitedOn([VISITED.filter, groupFilterId('kbbq')]), true);
  assert.equal(isVisitedOn([groupFilterId('kbbq')]), false);
  assert.equal(isVisitedOn([]), false);
  assert.equal(isVisitedOn(), false);
});

test('the dots do not read the visited filter as a kind', () => {
  // dotGroup is handed only the kinds; if VISITED leaked in as one, every
  // register dot would be ruled out and the map would go empty.
  const groups = [{ id: 'kbbq' }];
  assert.deepEqual(dotGroup(groups, groupsBeingFiltered([VISITED.filter])), { id: 'kbbq' });
});

test('no two categories on the map are the same colour', () => {
  // 직접 가본 곳 shipped in 나눠 먹는 상's green for one deploy. Colour is the
  // only thing that varies between marks now, so two categories sharing one
  // is two categories nobody can tell apart — on the map and in the legend
  // that explains it.
  const tints = [...DISH_GROUPS.map(g => g.tint), VISITED.tint].map(t => t.toUpperCase());
  assert.equal(new Set(tints).size, tints.length,
    `two categories share a colour: ${tints.join(', ')}`);
});
