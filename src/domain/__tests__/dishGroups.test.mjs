import test from 'node:test';
import assert from 'node:assert/strict';
import { menus } from '../catalog/menus.js';
import {
  DISH_GROUPS, DISH_IDS, DISH_KO, groupOfDish, groupOfMenu, groupsOf, primaryGroup, menuIdOfDish,
} from '../catalog/dishGroups.js';

// The six groups are the app's taxonomy: the front page offers them, the
// tables screen filters by them, the map colours by them, and the register
// build keeps only restaurants serving one of their dishes. Everything here
// reads the same file, so this is where the file's own promises are pinned.

test('six groups, four dishes each, twenty-four in all', () => {
  assert.equal(DISH_GROUPS.length, 6);
  for (const g of DISH_GROUPS) {
    assert.equal(g.dishes.length, 4, `${g.id} does not hold four dishes`);
    assert.ok(g.tint.startsWith('#'), `${g.id} has no tint for the map`);
    assert.ok(g.emoji, `${g.id} has no emoji`);
  }
  assert.equal(new Set(DISH_IDS).size, 24, 'a dish id appears twice');
});

test('every group speaks all seven languages', () => {
  for (const g of DISH_GROUPS) {
    for (const lang of ['en', 'ko', 'es', 'fr', 'ar', 'zh', 'ja']) {
      assert.ok(g[lang]?.length > 0, `${g.id} has no ${lang} name`);
    }
    assert.ok(g.ko_dishes.includes(' · '), `${g.id} does not list its dishes`);
  }
});

test('every dish has a Korean name and finds its way home', () => {
  for (const id of DISH_IDS) {
    assert.ok(DISH_KO[id], `${id} has no Korean name`);
    assert.ok(groupOfDish(id), `${id} belongs to no group`);
  }
  assert.equal(groupOfDish('pizza'), null);
});

test('every dish in the menu catalog belongs to one of the six groups', () => {
  // The catalog predates the groups and spells two ids differently
  // (budae-jjigae, ganjang-gejang). If this fails for a dish, the front
  // page's category cards can offer a table that no category ever shows —
  // filtered out of all six, findable only with every filter off.
  for (const m of menus) {
    const g = groupOfMenu(m.id);
    assert.ok(g, `${m.id} maps to no group — its tables vanish under every category filter`);
    assert.ok(DISH_GROUPS.includes(g));
  }
});

test('a place can be in several groups, and the first is the pin colour', () => {
  const gs = groupsOf(['samgyeopsal', 'jeon', 'nonsense']);
  assert.deepEqual(gs.map(g => g.id), ['kbbq', 'street']);
  assert.equal(primaryGroup(['samgyeopsal', 'jeon']).id, 'kbbq');
  assert.equal(primaryGroup([]), null);
});

test('a dish id files back into the catalog under the catalog spelling', () => {
  // The prefill path: a register place's dish, handed to the open-a-table
  // form, whose picker speaks catalog ids. Round-tripping through both
  // bridges must land in the same group, or the form would open on a dish
  // from a different category than the place was kept for.
  for (const id of DISH_IDS) {
    assert.equal(groupOfMenu(menuIdOfDish(id))?.id, groupOfDish(id).id, id);
  }
  assert.equal(menuIdOfDish('budae'), 'budae-jjigae');
  assert.equal(menuIdOfDish('gejang'), 'ganjang-gejang');
  // Every catalog dish is reachable from some register dish id.
  for (const m of menus) {
    assert.ok(DISH_IDS.some(d => menuIdOfDish(d) === m.id), m.id + ' is unreachable from the register');
  }
});
