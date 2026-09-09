import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GROUP_FILTER, groupFilterId, groupIdOfFilter, isGroupOn, swatchColor,
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
