import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VERDICT, SWIPE_THRESHOLD, swipeVerdict, buildDeck, emptyTaste, recordVerdict,
  answeredIds, deckProgress, nextCard, tasteMap, canDrawMap, MAP_MINIMUM,
} from '../policy/taste.js';
import { menus } from '../catalog/menus.js';

// A stand-in catalogue with the real one's shape: uneven categories, and a
// solo dish among the shared ones. The real menus are exercised at the
// bottom, where the deck has to hold up against what actually ships.
const FAKE = [
  { id: 'g1', category: 'grill', minPeople: 2 },
  { id: 'g2', category: 'grill', minPeople: 2 },
  { id: 'g3', category: 'grill', minPeople: 2 },
  { id: 's1', category: 'stew', minPeople: 2 },
  { id: 's2', category: 'stew', minPeople: 2 },
  { id: 'p1', category: 'platter', minPeople: 2 },
  { id: 'solo', category: 'bowl', minPeople: 1 },
];

test('a release short of the threshold is not an answer', () => {
  // The card goes back. This is the state a reader is in for most of a drag,
  // and reading it as a verdict would answer cards nobody meant to answer.
  assert.equal(swipeVerdict(0, 300), null);
  assert.equal(swipeVerdict(40, 300), null);
  assert.equal(swipeVerdict(-40, 300), null);
});

test('right is want and left is pass, at the threshold itself', () => {
  const w = 300;
  const edge = SWIPE_THRESHOLD * w;
  assert.equal(swipeVerdict(edge, w), VERDICT.WANT);
  assert.equal(swipeVerdict(-edge, w), VERDICT.PASS);
});

test('the same gesture means the same thing on any width', () => {
  // A fixed pixel threshold is a flick on a 320px phone and a nudge on a
  // 430px one. Half the card is a yes on both or the constant is wrong.
  for (const w of [320, 375, 430]) {
    assert.equal(swipeVerdict(w * 0.5, w), VERDICT.WANT, `${w}px`);
    assert.equal(swipeVerdict(w * 0.1, w), null, `${w}px`);
  }
});

test('a zero width does not divide by zero', () => {
  assert.equal(swipeVerdict(100, 0), VERDICT.WANT);
  assert.doesNotThrow(() => swipeVerdict(NaN, NaN));
});

test('the deck drops the dishes one person can order alone', () => {
  const deck = buildDeck(FAKE);
  assert.ok(!deck.some(d => d.id === 'solo'), 'a solo dish is in the deck');
  assert.equal(deck.length, 6);
});

test('...unless the caller asks for all of it', () => {
  assert.equal(buildDeck(FAKE, { sharedOnly: false }).length, 7);
});

test('no two cards in a row are the same kind of meal, while that is possible', () => {
  const deck = buildDeck(FAKE);
  // Three grills against two stews and one platter: the tail has to repeat
  // grill eventually, and the head must not.
  assert.deepEqual(deck.slice(0, 3).map(d => d.category), ['grill', 'stew', 'platter']);
  assert.deepEqual(deck.map(d => d.id), ['g1', 's1', 'p1', 'g2', 's2', 'g3']);
});

test('the deck holds every eligible dish exactly once', () => {
  const deck = buildDeck(FAKE);
  const ids = deck.map(d => d.id);
  assert.equal(new Set(ids).size, ids.length, 'a dish is asked about twice');
});

test('an empty or broken catalogue makes an empty deck, not a hang', () => {
  assert.deepEqual(buildDeck([]), []);
  assert.deepEqual(buildDeck(), []);
  assert.deepEqual(buildDeck([null, {}, { minPeople: 2 }]), []);
});

test('an answer is recorded, and answering again moves it rather than doubling it', () => {
  let taste = emptyTaste();
  taste = recordVerdict(taste, 'g1', VERDICT.WANT);
  assert.deepEqual(taste.want, ['g1']);

  // Somebody changes their mind. The dish must not end up on both lists —
  // that is the state where the map and the progress line disagree.
  taste = recordVerdict(taste, 'g1', VERDICT.PASS);
  assert.deepEqual(taste.want, []);
  assert.deepEqual(taste.pass, ['g1']);
  assert.equal(answeredIds(taste).length, 1);
});

test('recording returns a new object, so React sees the change', () => {
  const before = emptyTaste();
  const after = recordVerdict(before, 'g1', VERDICT.WANT);
  assert.notEqual(after, before);
  assert.notEqual(after.want, before.want);
  assert.deepEqual(before.want, [], 'the original was mutated');
});

test('a verdict that is neither want nor pass changes nothing', () => {
  const taste = recordVerdict(emptyTaste(), 'g1', 'maybe');
  assert.deepEqual(taste, emptyTaste());
});

test('progress counts real answers and never overruns the deck', () => {
  let taste = emptyTaste();
  assert.deepEqual(deckProgress(taste, 6), { done: 0, total: 6, remaining: 6, ratio: 0 });

  taste = recordVerdict(taste, 'g1', VERDICT.WANT);
  taste = recordVerdict(taste, 's1', VERDICT.PASS);
  const p = deckProgress(taste, 6);
  assert.equal(p.done, 2);
  assert.equal(p.remaining, 4);

  // No head start. A bar that opens at 2/16 on a deck of fourteen is a
  // number the screen cannot honour.
  assert.equal(deckProgress(emptyTaste(), 14).done, 0);
});

test('progress does not report more done than the deck holds', () => {
  let taste = emptyTaste();
  for (const id of ['a', 'b', 'c']) taste = recordVerdict(taste, id, VERDICT.WANT);
  assert.equal(deckProgress(taste, 2).done, 2);
  assert.equal(deckProgress(taste, 2).remaining, 0);
});

test('the next card is the first unanswered one, and null at the end', () => {
  const deck = buildDeck(FAKE);
  let taste = emptyTaste();
  assert.equal(nextCard(deck, taste).id, deck[0].id);

  for (const dish of deck) taste = recordVerdict(taste, dish.id, VERDICT.PASS);
  assert.equal(nextCard(deck, taste), null);
});

test('the map holds the yeses in the order they were said', () => {
  let taste = emptyTaste();
  taste = recordVerdict(taste, 's1', VERDICT.WANT);
  taste = recordVerdict(taste, 'g1', VERDICT.PASS);
  taste = recordVerdict(taste, 'g2', VERDICT.WANT);

  const map = tasteMap(taste, FAKE);
  assert.deepEqual(map.dishes.map(d => d.id), ['s1', 'g2'], 'not the order answered');
  assert.equal(map.count, 2);
  assert.ok(!map.dishes.some(d => d.id === 'g1'), 'a passed dish is on the map');
});

test('the map ranks the kinds of meal, most-wanted first', () => {
  let taste = emptyTaste();
  for (const id of ['g1', 'g2', 's1']) taste = recordVerdict(taste, id, VERDICT.WANT);
  assert.deepEqual(tasteMap(taste, FAKE).categories, [
    { category: 'grill', count: 2 },
    { category: 'stew', count: 1 },
  ]);
});

test('a want for a dish the catalogue does not hold is dropped, not drawn empty', () => {
  const taste = recordVerdict(emptyTaste(), 'deleted-dish', VERDICT.WANT);
  const map = tasteMap(taste, FAKE);
  assert.equal(map.count, 0);
  assert.deepEqual(map.categories, []);
});

test('one tap is not a taste', () => {
  // The counts are written out rather than derived from MAP_MINIMUM. The
  // first version of this test looped to `MAP_MINIMUM - 1`, so lowering the
  // constant to 1 moved the test with it and the suite stayed green on a
  // change that would have named somebody by their first card. A test that
  // reads the number it is checking cannot check it.
  assert.equal(MAP_MINIMUM, 3, 'the floor moved; this test states what it should be');

  let taste = emptyTaste();
  assert.equal(canDrawMap(taste), false, 'no yeses drew a map');

  taste = recordVerdict(taste, 'd1', VERDICT.WANT);
  assert.equal(canDrawMap(taste), false, 'one yes drew a map');

  taste = recordVerdict(taste, 'd2', VERDICT.WANT);
  assert.equal(canDrawMap(taste), false, 'two yeses drew a map');

  taste = recordVerdict(taste, 'd3', VERDICT.WANT);
  assert.equal(canDrawMap(taste), true, 'three yeses did not draw a map');
});

test('passing every card never draws a map', () => {
  let taste = emptyTaste();
  for (const dish of buildDeck(FAKE)) taste = recordVerdict(taste, dish.id, VERDICT.PASS);
  assert.equal(canDrawMap(taste), false);
});

// ── The real catalogue ────────────────────────────────────────────────────

test('the shipping deck is every dish that starts at two servings', () => {
  const deck = buildDeck(menus);
  assert.equal(deck.length, menus.filter(m => m.minPeople > 1).length);
  assert.ok(deck.length >= 10, `only ${deck.length} cards to swipe`);
  assert.ok(deck.every(d => d.minPeople > 1));
});

test('every shipping card carries what the screen prints on it', () => {
  // The card shows the Korean name, the romanisation, the gloss and the
  // reason it is shared. A dish missing one of those renders a blank line
  // that no DOM query would see as wrong.
  for (const dish of buildDeck(menus)) {
    for (const field of ['nameKo', 'romanization', 'gloss', 'whyShared', 'category']) {
      assert.ok(dish[field], `${dish.id} has no ${field}`);
    }
  }
});

test('the first four shipping cards are four different kinds of meal', () => {
  // The catalogue is eleven platters, four grills, four stews, four sets and
  // one bowl. In catalogue order the deck opens with four grills and asks a
  // newcomer to tell 삼겹살 from 갈비 before it has shown them a stew exists.
  const head = buildDeck(menus).slice(0, 4).map(d => d.category);
  assert.equal(new Set(head).size, head.length, `deck opens ${head.join(', ')}`);
});

// ── Lifting the tables somebody asked for ─────────────────────────────────

import { rankByTaste } from '../policy/taste.js';

const T = (id, menuId, date) => ({ id, menuId, date });

test('the tables for wanted dishes come first, and the rest stay', () => {
  const list = [T('a', 'jokbal'), T('b', 'gamjatang'), T('c', 'galbi'), T('d', 'gamjatang')];
  const { tables, preferredCount } = rankByTaste(list, ['gamjatang']);
  assert.deepEqual(tables.map(t => t.id), ['b', 'd', 'a', 'c']);
  assert.equal(preferredCount, 2);
  // Not a filter. An empty screen is the dead end this app exists to remove.
  assert.equal(tables.length, list.length, 'a table was dropped');
});

test('both halves keep the order they arrived in', () => {
  // The incoming order is the schedule. Reordering inside a half by how
  // recently somebody swiped would scatter the dates for nothing.
  const list = [T('a', 'x', '01'), T('b', 'y', '02'), T('c', 'x', '03'), T('d', 'y', '04')];
  const { tables } = rankByTaste(list, ['y']);
  assert.deepEqual(tables.map(t => t.date), ['02', '04', '01', '03']);

  // And when everything is wanted, nothing moves at all — the first draft of
  // this test passed ['y','x'] and expected a reordering, which is the sort
  // this function deliberately is not.
  assert.deepEqual(rankByTaste(list, ['y', 'x']).tables.map(t => t.date), ['01', '02', '03', '04']);
});

test('no taste map leaves the list exactly as it was', () => {
  const list = [T('a', 'x'), T('b', 'y')];
  for (const empty of [[], null, undefined]) {
    const { tables, preferredCount } = rankByTaste(list, empty);
    assert.deepEqual(tables.map(t => t.id), ['a', 'b']);
    assert.equal(preferredCount, 0);
  }
});

test('it returns a new array rather than reordering the caller’s', () => {
  const list = [T('a', 'x'), T('b', 'y')];
  const { tables } = rankByTaste(list, ['y']);
  assert.notEqual(tables, list);
  assert.deepEqual(list.map(t => t.id), ['a', 'b'], 'the input was reordered');
});

test('a wanted dish with no table open counts nothing and breaks nothing', () => {
  const list = [T('a', 'x')];
  const { tables, preferredCount } = rankByTaste(list, ['nothing-open']);
  assert.deepEqual(tables.map(t => t.id), ['a']);
  assert.equal(preferredCount, 0);
});

test('an empty list, and a broken row, are survivable', () => {
  assert.deepEqual(rankByTaste([], ['x']).tables, []);
  assert.deepEqual(rankByTaste(undefined, ['x']).tables, []);
  assert.equal(rankByTaste([null, T('a', 'x')], ['x']).preferredCount, 1);
});

// ── The story index, in the reader's own order ────────────────────────────

import { storiesForTaste } from '../policy/taste.js';

const D = (id) => ({ id });

test('the dishes somebody picked are read first, and none are hidden', () => {
  const all = [D('a'), D('b'), D('c'), D('d')];
  const { dishes, pickedCount } = storiesForTaste(all, ['c', 'a']);
  assert.deepEqual(dishes.map(d => d.id), ['a', 'c', 'b', 'd']);
  assert.equal(pickedCount, 2);
  // A story index that dropped eleven dishes would be a filter applied to
  // culture, which is the opposite of what the tab is for.
  assert.equal(dishes.length, all.length, 'a dish was hidden from the reading');
});

test('no taste map leaves the reading in catalogue order', () => {
  const all = [D('a'), D('b')];
  for (const empty of [[], null, undefined]) {
    const { dishes, pickedCount } = storiesForTaste(all, empty);
    assert.deepEqual(dishes.map(d => d.id), ['a', 'b']);
    assert.equal(pickedCount, 0);
  }
});

test('picking everything changes nothing, and picking nothing open does too', () => {
  const all = [D('a'), D('b')];
  assert.deepEqual(storiesForTaste(all, ['a', 'b']).dishes.map(d => d.id), ['a', 'b']);
  assert.equal(storiesForTaste(all, ['gone']).pickedCount, 0);
});

test('it does not reorder the caller’s array', () => {
  const all = [D('a'), D('b')];
  storiesForTaste(all, ['b']);
  assert.deepEqual(all.map(d => d.id), ['a', 'b']);
});
