import test from 'node:test';
import assert from 'node:assert/strict';
import { menus, menuById } from '../catalog/menus.js';
import { searchDishes, searchOutcome, SEARCH } from '../policy/dishSearch.js';

// "떡볶이가 먹고 싶다" — finding a dish by its name, on the tables tab.
//
// Browsing by category and looking for a thing you already want are two
// different acts, and until 2026-09-02 the app had a path for only the
// first. The one search box in the whole app sat on the map overlay and
// matched restaurant names, vibes and neighbourhoods — typing 떡볶이 into it
// found a shop that happened to have the word on its sign, not the dish.
//
// Two things have to be true, and both are the user's acceptance criteria
// verbatim: the Korean name, the English name and the romanisation all reach
// the same dish; and a dish with no open table is not an empty list but the
// dish itself, with a way to open a table for it.

const ids = (q) => searchDishes(q).map(m => m.id);

test('the Korean name, the English name and the romanisation reach the same dish', () => {
  // The user's example, all three spellings.
  assert.deepEqual(ids('떡볶이'), ['tteokbokki']);
  assert.deepEqual(ids('tteokbokki'), ['tteokbokki']);
  assert.deepEqual(ids('rice cakes'), ['tteokbokki']);
  // The hyphenated romanisation the card prints, and the display name.
  assert.deepEqual(ids('tteok-bok-ki'), ['tteokbokki']);
  assert.deepEqual(ids('Tteokbokki'), ['tteokbokki']);
});

test('spacing, hyphens and case do not matter in a romanised name', () => {
  // Nobody knows where the hyphens go in Dak-hanmari, and a phone keyboard
  // will add a space or drop one.
  for (const q of ['dakhanmari', 'dak-hanmari', 'Dak hanmari', 'DAK-HAN-MA-RI', 'dak han ma ri']) {
    assert.deepEqual(ids(q), ['dakhanmari'], q);
  }
});

test('a partial Korean name is enough', () => {
  assert.ok(ids('떡').includes('tteokbokki'));
  assert.ok(ids('찌개').includes('budae-jjigae'));
  // And a partial that is genuinely several dishes returns them all.
  const chicken = ids('닭');
  for (const id of ['dakgalbi', 'dakhanmari', 'dakbal', 'jjimdak']) assert.ok(chicken.includes(id), `닭 should find ${id}`);
});

test('the one-line English description counts as a name', () => {
  // The cards print "whole chicken in broth" under the romanisation, and it
  // is the only one of the three a traveller may actually remember.
  assert.deepEqual(ids('whole chicken'), ['dakhanmari']);
  assert.deepEqual(ids('blood sausage'), ['sundae']);
  assert.deepEqual(ids('live octopus'), ['sannakji']);
});

test('the two aliased dishes are reachable by either spelling', () => {
  // 부대찌개 is `budae-jjigae` in the catalogue and `budae` in the groups.
  // A search must not care which side of that bridge a word came from.
  assert.deepEqual(ids('budae'), ['budae-jjigae']);
  assert.deepEqual(ids('부대찌개'), ['budae-jjigae']);
  assert.deepEqual(ids('gejang'), ['ganjang-gejang']);
});

test('an empty or nonsense query finds nothing, and nothing does not throw', () => {
  assert.deepEqual(ids(''), []);
  assert.deepEqual(ids('   '), []);
  assert.deepEqual(ids(undefined), []);
  assert.deepEqual(ids('pizza'), []);
  assert.deepEqual(ids('🍕'), []);
});

test('results keep the catalogue order, so the list is stable while typing', () => {
  const found = ids('닭');
  const order = menus.map(m => m.id);
  const sorted = [...found].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  assert.deepEqual(found, sorted);
});

// ── What the screen does with the result ────────────────────────────────

const table = (menuId, id = menuId + '-t') => ({ id, menuId, hostId: 'h', seats: 4 });

test('a dish with an open table shows the tables', () => {
  const out = searchOutcome('떡볶이', [table('tteokbokki'), table('bossam')]);
  assert.equal(out.kind, SEARCH.TABLES);
  assert.deepEqual(out.tables.map(t => t.menuId), ['tteokbokki']);
  assert.deepEqual(out.dishes.map(m => m.id), ['tteokbokki']);
});

test('a dish with no open table is the dish, not an empty list', () => {
  // The acceptance criterion. What the reader gets is the dish — its name,
  // its gloss, a way to open a table for it — and never a blank.
  const out = searchOutcome('떡볶이', [table('bossam')]);
  assert.equal(out.kind, SEARCH.DISH_ONLY);
  assert.deepEqual(out.tables, []);
  assert.deepEqual(out.dishes.map(m => m.id), ['tteokbokki']);
  assert.equal(out.dishes[0], menuById('tteokbokki'), 'the full catalogue entry, so the screen can describe it');
});

test('a word that is no dish at all says so', () => {
  const out = searchOutcome('pizza', [table('bossam')]);
  assert.equal(out.kind, SEARCH.NOTHING);
  assert.deepEqual(out.dishes, []);
  assert.deepEqual(out.tables, []);
});

test('no query means no search — the ordinary list, untouched', () => {
  const open = [table('bossam'), table('jokbal')];
  const out = searchOutcome('', open);
  assert.equal(out.kind, SEARCH.OFF);
  assert.deepEqual(out.tables, open);
});

test('a query that matches several dishes shows every table for any of them', () => {
  const open = [table('dakgalbi'), table('jjimdak'), table('bossam')];
  const out = searchOutcome('닭', open);
  assert.equal(out.kind, SEARCH.TABLES);
  assert.deepEqual(out.tables.map(t => t.menuId).sort(), ['dakgalbi', 'jjimdak']);
  // And the dishes that matched but have no table are still listed, so the
  // reader can open one — 닭발 and 닭한마리 are found, not hidden.
  assert.ok(out.dishes.some(m => m.id === 'dakbal'));
  assert.ok(out.dishesWithoutTable.map(m => m.id).includes('dakbal'));
  assert.ok(!out.dishesWithoutTable.map(m => m.id).includes('dakgalbi'));
});
