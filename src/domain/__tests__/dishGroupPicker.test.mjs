import test from 'node:test';
import assert from 'node:assert/strict';
import { menus } from '../catalog/menus.js';
import { DISH_GROUPS, menuIdOfDish } from '../catalog/dishGroups.js';
import { LOCALE } from '../policy/locale.js';
import { dishGloss } from '../policy/dishLabels.js';
import {
  PICK, PICKER, ALL_COLLAPSED,
  groupRows, canPickGroup, toggleGroup, withGroupOpen, pickerView,
  joinableCount, glossDishesIn,
} from '../policy/dishGroupPicker.js';

// The two-level picker: six categories, four dishes under each, on the two
// screens that choose a dish.
//
// Both screens call groupRows(). That is the whole point of this file
// existing — the front page, the host's form and the guest's list had been
// three places that each knew what the categories were, and the next dish to
// move between groups would have moved on one screen and not the others.
//
// Every check is a positive count. "Exactly six", "exactly four", "exactly
// twenty-four" rather than "at least" — a floor cannot tell a catalogue that
// shrank from one that was always that size, which is the bug
// catalogComplete.test.mjs was written for one screen earlier.

const LANGS = ['en', 'ko', 'es', 'fr', 'ar', 'zh', 'ja'];
const TRANSLATED = [LOCALE.KO, LOCALE.ES, LOCALE.FR, LOCALE.AR, LOCALE.ZH, LOCALE.JA];

test('the picker offers exactly six groups of four — twenty-four dishes in all', () => {
  const rows = groupRows(PICK.DISH);
  assert.equal(rows.length, 6);
  for (const r of rows) {
    assert.equal(r.dishes.length, 4, `${r.group.id} does not hold four dishes`);
  }
  const ids = rows.flatMap(r => r.dishes.map(d => d.id));
  assert.equal(ids.length, 24);
  assert.equal(new Set(ids).size, 24, 'a dish is listed twice');
});

test('every dish in the catalogue sits under exactly one group', () => {
  const rows = groupRows(PICK.DISH);
  for (const m of menus) {
    const homes = rows.filter(r => r.dishes.some(d => d.id === m.id));
    assert.equal(homes.length, 1, `${m.id} is under ${homes.length} groups, not one`);
  }
  // And the accordion holds the whole catalogue, not a subset of it.
  assert.equal(menus.length, 24);
});

test('every group names itself in all seven languages', () => {
  for (const { group } of groupRows(PICK.DISH)) {
    for (const l of LANGS) {
      assert.ok(group[l]?.length > 0, `${group.id} has no ${l} name`);
    }
  }
});

test('the host screen and the guest screen are handed the same six groups', () => {
  // The requirement in one assertion: one component, one data source. If a
  // dish moves group, it moves on both screens or this fails.
  const host = groupRows(PICK.DISH);
  const guest = groupRows(PICK.GROUP_OR_DISH);
  assert.deepEqual(host.map(r => r.group.id), guest.map(r => r.group.id));
  assert.deepEqual(
    host.map(r => r.dishes.map(d => d.id)),
    guest.map(r => r.dishes.map(d => d.id)),
  );
  assert.deepEqual(host.map(r => r.group.id), DISH_GROUPS.map(g => g.id));
});

test('only the guest browsing tables may choose a whole category', () => {
  // A host opens a table for one dish — "K-BBQ" is not a thing anybody can
  // cook. A guest may look at every K-BBQ table at once.
  assert.equal(canPickGroup(PICK.GROUP_OR_DISH), true);
  assert.equal(canPickGroup(PICK.DISH), false);
  assert.ok(groupRows(PICK.DISH).every(r => r.groupSelectable === false));
  assert.ok(groupRows(PICK.GROUP_OR_DISH).every(r => r.groupSelectable === true));
});

test('the picker opens with every group collapsed', () => {
  assert.deepEqual(ALL_COLLAPSED, []);
});

test('opening a second group leaves the first one open', () => {
  // The instruction this was built to: "하나 열 때 다른 걸 닫지 마라".
  const one = toggleGroup(ALL_COLLAPSED, 'kbbq');
  const two = toggleGroup(one, 'hotpot');
  assert.deepEqual(two, ['kbbq', 'hotpot']);
  const three = toggleGroup(two, 'street');
  assert.deepEqual(three, ['kbbq', 'hotpot', 'street']);
});

test('a group closes only when it is the one pressed', () => {
  assert.deepEqual(toggleGroup(['kbbq', 'hotpot'], 'kbbq'), ['hotpot']);
  assert.deepEqual(toggleGroup(['kbbq', 'hotpot'], 'hotpot'), ['kbbq']);
});

test('a group can be opened for somebody without closing what they opened', () => {
  // Arriving from a front page card, or with a dish already chosen: that
  // group has to be visible or the screen looks like nothing is selected.
  assert.deepEqual(withGroupOpen(['street'], 'kbbq'), ['street', 'kbbq']);
  assert.deepEqual(withGroupOpen(['kbbq'], 'kbbq'), ['kbbq'], 'opening twice must not duplicate');
  assert.deepEqual(withGroupOpen(['kbbq'], null), ['kbbq']);
});

test('typing a dish name replaces the accordion with the dishes it names', () => {
  for (const q of ['떡볶이', 'tteokbokki', 'Tteokbokki', 'rice cakes']) {
    const view = pickerView(q);
    assert.equal(view.mode, PICKER.RESULTS, `"${q}" did not search`);
    assert.ok(view.dishes.some(d => d.id === 'tteokbokki'), `"${q}" did not find 떡볶이`);
  }
});

test('clearing the box brings the accordion back', () => {
  for (const q of ['', '   ', null, undefined]) {
    assert.equal(pickerView(q).mode, PICKER.ACCORDION);
    assert.deepEqual(pickerView(q).dishes, []);
  }
});

test('a word that names no dish says so rather than silently showing everything', () => {
  const view = pickerView('pizza');
  assert.equal(view.mode, PICKER.RESULTS);
  assert.deepEqual(view.dishes, []);
});

// ── The count beside a category ────────────────────────────────────────────
//
// One rule for a held seat, and it is seatsRemaining()'s: accepted, plus
// pending that has not run out of time. The list and the detail page
// disagreed about this until 2026-09-03; a third count written by hand here
// would be the same bug with a new place to hide.

const pad = (n) => String(n).padStart(2, '0');
const meal = (now, hours) => {
  const d = new Date(now.getTime() + hours * 3600 * 1000);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

test('a category counts the tables somebody could still sit at', () => {
  const now = new Date('2026-09-10T12:00:00');
  const tables = [
    // 4 seats, host + 1 accepted = 2 taken, 2 left. Joinable.
    { id: 'a', menuId: 'samgyeopsal', seats: 4, ...meal(now, 72) },
    // 2 seats, host + 1 accepted = full. Not joinable.
    { id: 'b', menuId: 'galbi', seats: 2, ...meal(now, 72) },
    // 3 seats, 2 pending — but the meal is in 6 hours, so both lapsed and
    // gave their seats back. Joinable. This is the rule fixed on 09-03.
    { id: 'c', menuId: 'gamjatang', seats: 3, ...meal(now, 6) },
    // 2 seats, 1 pending that is still waiting and still holding. Full.
    { id: 'd', menuId: 'gamjatang', seats: 2, ...meal(now, 72) },
  ];
  const signups = {
    a: [{ tableId: 'a', status: 'accepted' }],
    b: [{ tableId: 'b', status: 'accepted' }],
    c: [{ tableId: 'c', status: 'pending' }, { tableId: 'c', status: 'pending' }],
    d: [{ tableId: 'd', status: 'pending' }],
  };
  const count = (id) => joinableCount(DISH_GROUPS.find(g => g.id === id), tables, signups, now);

  assert.equal(count('kbbq'), 1, 'the full K-BBQ table should not be offered');
  assert.equal(count('hotpot'), 1, 'a lapsed request gives its seat back');
  assert.equal(count('sharing'), 0);
});

test('a declined request never holds a seat', () => {
  const now = new Date('2026-09-10T12:00:00');
  const tables = [{ id: 'a', menuId: 'samgyeopsal', seats: 2, ...meal(now, 72) }];
  const declined = { a: [{ tableId: 'a', status: 'declined' }] };
  const accepted = { a: [{ tableId: 'a', status: 'accepted' }] };
  const kbbq = DISH_GROUPS.find(g => g.id === 'kbbq');
  assert.equal(joinableCount(kbbq, tables, declined, now), 1);
  assert.equal(joinableCount(kbbq, tables, accepted, now), 0);
});

test('an empty category counts zero and keeps its row', () => {
  // "빈 카테고리는 사라지게 하지 말고 남겨둬라" — a menu that changes shape
  // between screens is how somebody loses their place.
  const rows = groupRows(PICK.GROUP_OR_DISH);
  assert.equal(rows.length, 6);
  for (const r of rows) {
    assert.equal(joinableCount(r.group, [], {}, new Date()), 0);
  }
});

// ── The dishes under the row, in the reader's language ─────────────────────

test('every dish says what it is in all seven languages', () => {
  for (const m of menus) {
    for (const l of [LOCALE.EN, LOCALE.BOTH, ...TRANSLATED]) {
      const g = dishGloss(m, l);
      assert.ok(typeof g === 'string' && g.trim().length > 0, `${m.id} has no gloss in ${l}`);
    }
  }
});

test('a group lists its four dishes in the reader language, not in English', () => {
  // MainTab printed glossDishes(g) — DISH_NAME[].en — to Spanish, French,
  // Arabic, Chinese and Japanese readers alike: "grilled pork belly · …" on
  // a screen with no English on it. The catalogue had all seven all along.
  for (const g of DISH_GROUPS) {
    const en = glossDishesIn(g, LOCALE.EN);
    assert.ok(en.length > 0, `${g.id} says nothing in English`);
    for (const l of TRANSLATED) {
      const line = glossDishesIn(g, l);
      assert.ok(line.length > 0, `${g.id} says nothing in ${l}`);
      assert.notEqual(line, en, `${g.id} serves English to a ${l} reader`);
      assert.equal(line.split(' · ').length, 4, `${g.id} lost a dish in ${l}`);
    }
  }
});

test('the line under a card names the same four dishes the row opens to', () => {
  // The card and the accordion must not describe different food.
  for (const { group, dishes } of groupRows(PICK.GROUP_OR_DISH)) {
    const expected = dishes.map(d => dishGloss(d, LOCALE.KO)).join(' · ');
    assert.equal(glossDishesIn(group, LOCALE.KO), expected);
    // Through the id bridge: the group spells 부대찌개 `budae`, the catalogue
    // spells it `budae-jjigae`, and the row has to hold the catalogue entry.
    assert.deepEqual(dishes.map(d => d.id), group.dishes.map(menuIdOfDish));
  }
});
