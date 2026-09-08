import test from 'node:test';
import assert from 'node:assert/strict';
import { tasteType, TASTE_AXES, OPEN_SHARE, MAP_MINIMUM } from '../policy/taste.js';
import { sharedOnlyMenus } from '../catalog/menus.js';
import { TASTE_CODES } from '../../content/tasteTypes.js';
import { tasteTypeLabel, tastePoleLabel } from '../policy/dishLabels.js';
import { LOCALE } from '../policy/locale.js';

// A deck built here rather than read from the catalogue, so the rules below
// keep meaning what they say when a dish is added to the app. Reachability is
// checked against the real one further down, where the catalogue is the point.
const dish = (id, spice, category) => ({ id, spice, category });

// Deliberately lopsided, because a balanced one cannot tell the two rules
// apart. The first version of this file had four hot dishes in eight, where
// "more than the deck offered" and "more than half" are the same arithmetic —
// so swapping the rule for a plain majority left every test green. This deck
// is 5 hot in 8 and 5 cooked-at-the-table in 8, the shape the real one has.
const DECK = [
  dish("h1", 3, "stew"),    dish("h2", 3, "grill"),
  dish("h3", 1, "grill"),   dish("h4", 1, "stew"),
  dish("h5", 1, "platter"),
  dish("m1", 0, "grill"),   dish("m2", 0, "platter"), dish("m3", 0, "set"),
];
const taste = (want, pass = []) => ({ want, pass });

test('under three yeses there is no type, the same floor the map has', () => {
  assert.equal(MAP_MINIMUM, 3, 'the floor moved; this file assumes the map’s');
  assert.equal(tasteType(taste(['h1', 'h2']), DECK), null);
  assert.equal(tasteType(taste([]), DECK), null);
  assert.ok(tasteType(taste(['h1', 'h2', 'h3']), DECK), 'three is enough');
});

test('a lean is measured against the deck, not counted as a majority', () => {
  // Five of the eight carry heat, so the deck itself is 0.625 hot. Three of
  // five chosen is 0.6 — a majority, and less than what was going around.
  // A plain-majority rule calls this hot; this one does not, and that gap is
  // the whole reason the rule exists.
  assert.equal(tasteType(taste(["h1", "h2", "h3", "m1", "m2"]), DECK).heat, "mild");
  assert.equal(tasteType(taste(["h1", "h2", "h3", "h4"]), DECK).heat, "hot");
});

test('the same rule governs the table axis, and it is lopsided too', () => {
  // Five of eight finish cooking at the table. Three of five is again 0.6.
  assert.equal(tasteType(taste(["h1", "h2", "h3", "h5", "m2"]), DECK).made, "served");
  assert.equal(tasteType(taste(["h1", "h2", "h4", "m1"]), DECK).made, "table");
});

test('choosing exactly what the deck offered is not a lean either way', () => {
  // Saying yes to the whole deck matches its balance exactly on both axes, so
  // neither has anything to report and both take the quieter label. What that
  // reader actually did is carried by the third axis, which says open.
  const t = tasteType(taste(DECK.map(d => d.id)), DECK);
  assert.equal(t.heat, 'mild', 'the quieter label, because nothing stood out');
  assert.equal(t.made, 'served');
  assert.equal(t.breadth, 'open');
});

test('the two dish axes do not read each other', () => {
  // h3 and h4 carry the same heat and are cooked the same way; h5 shares the
  // heat and is served. Swapping one for the other must move made and leave
  // heat where it was, or the axes are one axis wearing two names.
  const a = tasteType(taste(["h3", "h4", "m2"]), DECK);
  const b = tasteType(taste(["h3", "h5", "m2"]), DECK);
  assert.equal(a.heat, b.heat, "heat moved when only the cooking changed");
  assert.equal(a.made, "table");
  assert.equal(b.made, "served");
});

test('breadth is how widely somebody said yes, not what they said yes to', () => {
  // Same three dishes; only the noes differ.
  assert.equal(tasteType(taste(['h1', 'h2', 'h3'], ['m1']), DECK).breadth, 'open');
  assert.equal(tasteType(taste(['h1', 'h2', 'h3'], ['m1', 'm2', 'm3']), DECK).breadth, 'picky');
  // Exactly half is not open: the line is above half, and it is documented.
  assert.equal(OPEN_SHARE, 0.5);
  assert.equal(tasteType(taste(['h1', 'h2', 'h3'], ['m1', 'm2', 'm3']), DECK).breadth, 'picky');
});

test('the code is the three axes in the order they are written', () => {
  const t = tasteType(taste(['h1', 'h2', 'h3'], ['m1']), DECK);
  assert.equal(t.code, TASTE_AXES.heat[t.heat] + TASTE_AXES.made[t.made] + TASTE_AXES.breadth[t.breadth]);
  assert.equal(t.code.length, 3);
});

test('an id the catalogue does not know is ignored, not counted', () => {
  const withGhost = tasteType(taste(['h1', 'h2', 'h3', 'nope']), DECK);
  const without = tasteType(taste(['h1', 'h2', 'h3']), DECK);
  assert.deepEqual(withGhost, without);
});

test('all eight types can be reached from the deck people actually swipe', () => {
  // The catalogue, not a fixture: eight names are worth writing only if the
  // fourteen dishes on the cards can produce all eight.
  const deck = sharedOnlyMenus();
  const ids = deck.map(d => d.id);
  const seen = new Set();
  // Every subset of a fourteen-card deck is 16k combinations — small enough to
  // walk, and the only honest way to answer "can somebody get this type".
  for (let mask = 0; mask < (1 << ids.length); mask++) {
    const want = ids.filter((_, i) => mask & (1 << i));
    if (want.length < MAP_MINIMUM) continue;
    const pass = ids.filter((_, i) => !(mask & (1 << i)));
    const t = tasteType({ want, pass }, deck);
    if (t) seen.add(t.code);
    if (seen.size === 8) break;
  }
  assert.equal(seen.size, 8, `only ${[...seen].sort().join(', ')} are reachable`);
});

// ── The names ───────────────────────────────────────────────────────────

test('every code the deck can produce has a name to show for it', () => {
  // The policy and the content are two files, and nothing but this stops one
  // from growing a type the other cannot name. A reader who lands on a code
  // with no entry sees an empty line where their result should be.
  const deck = sharedOnlyMenus();
  const ids = deck.map(d => d.id);
  const produced = new Set();
  for (let mask = 0; mask < (1 << ids.length); mask++) {
    const want = ids.filter((_, i) => mask & (1 << i));
    if (want.length < MAP_MINIMUM) continue;
    const t = tasteType({ want, pass: ids.filter((_, i) => !(mask & (1 << i))) }, deck);
    if (t) produced.add(t.code);
  }
  const named = new Set(TASTE_CODES);
  assert.deepEqual([...produced].filter(c => !named.has(c)), [], 'a type with no name');
  assert.deepEqual([...named].filter(c => !produced.has(c)), [], 'a name no deck can reach');
});

test('a type reads in every language the app offers, not just English', () => {
  // CLAUDE.md: audit-i18n cannot see a label that comes out of a table, so a
  // table with a hole in it passes the audit and prints English to a Korean
  // reader. This is the check that would have caught that.
  for (const code of TASTE_CODES) {
    for (const locale of [LOCALE.KO, LOCALE.EN, LOCALE.ES, LOCALE.FR, LOCALE.AR, LOCALE.ZH, LOCALE.JA]) {
      const label = tasteTypeLabel(code, locale);
      assert.ok(label, `${code} has nothing to say in ${locale}`);
    }
    assert.notEqual(tasteTypeLabel(code, LOCALE.KO), tasteTypeLabel(code, LOCALE.EN),
      `${code} shows a Korean reader the English name`);
  }
});

test('every pole has a chip, in every language', () => {
  for (const pole of ['hot', 'mild', 'table', 'served', 'open', 'picky']) {
    for (const locale of [LOCALE.KO, LOCALE.EN, LOCALE.ES, LOCALE.FR, LOCALE.AR, LOCALE.ZH, LOCALE.JA]) {
      assert.ok(tastePoleLabel(pole, locale), `${pole} has nothing to say in ${locale}`);
    }
  }
});
