// Seat arithmetic and join rules.
//
// These are worth testing above almost anything else in the app: an error
// here does not show up as a broken screen, it shows up as somebody standing
// outside a restaurant in Jongno with no seat.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  seatsRemaining, isPast, joinBlocker, canJoin, validateNewTable, JOIN_BLOCK,
} from '../policy/table.js';
import { menuById, menus, sharedOnlyMenus, defaultHourFor } from '../catalog/menus.js';
import { RESTRICTIONS } from '../../data/profile.js';
import { themeById } from '../catalog/index.js';

const table = (over = {}) => ({
  id: 't1', menuId: 'samgyeopsal', hostId: 'host', seats: 4,
  date: '2026-12-01', time: '19:00', place: 'Jongno', ...over,
});
const signup = (userId) => ({ id: `s-${userId}`, tableId: 't1', userId });
const before = new Date('2026-11-01T12:00:00');

test('the host occupies one of the seats they opened', () => {
  assert.equal(seatsRemaining(table({ seats: 4 }), []), 3);
  assert.equal(seatsRemaining(table({ seats: 2 }), []), 1);
});

test('each signup takes one more seat, and it never goes negative', () => {
  const t = table({ seats: 3 });
  assert.equal(seatsRemaining(t, [signup('a')]), 1);
  assert.equal(seatsRemaining(t, [signup('a'), signup('b')]), 0);
  // Over-subscription must read as full, not as minus one.
  assert.equal(seatsRemaining(t, [signup('a'), signup('b'), signup('c')]), 0);
});

test('a full table cannot be joined', () => {
  const t = table({ seats: 2 });
  assert.equal(joinBlocker(t, [signup('a')], 'b', before), JOIN_BLOCK.FULL);
});

test('a host cannot join their own table, and nobody joins twice', () => {
  const t = table();
  assert.equal(joinBlocker(t, [], 'host', before), JOIN_BLOCK.OWN_TABLE);
  assert.equal(joinBlocker(t, [signup('a')], 'a', before), JOIN_BLOCK.ALREADY_IN);
});

test('a meal in the past is closed even with seats left', () => {
  const t = table({ date: '2026-01-01', seats: 6 });
  assert.equal(joinBlocker(t, [], 'a', before), JOIN_BLOCK.PAST);
  assert.equal(isPast(t, before), true);
  assert.equal(isPast(table(), before), false);
});

test('an open table with room admits a stranger', () => {
  assert.equal(canJoin(table(), [signup('a')], 'b', before), true);
});

test('a new table must seat at least the dish minimum', () => {
  const menu = menuById('samgyeopsal');
  const base = { menuId: 'samgyeopsal', date: '2026-12-01', time: '19:00', place: 'Jongno' };

  assert.deepEqual(validateNewTable({ ...base, seats: 4 }, menu), []);
  assert.ok(validateNewTable({ ...base, seats: 1 }, menu).length > 0);
  assert.ok(validateNewTable({ ...base, seats: 20 }, menu).length > 0);
  assert.ok(validateNewTable({ ...base, place: '  ' }, menu).length > 0);
});

test('a table cannot be opened in the past', () => {
  const problems = validateNewTable(
    { menuId: 'samgyeopsal', date: '2020-01-01', time: '19:00', place: 'Jongno', seats: 4 },
    menuById('samgyeopsal'),
  );
  assert.ok(problems.some(p => /already passed/.test(p)));
});

test('every menu carries the fields the cards read', () => {
  for (const m of menus) {
    assert.ok(m.id && m.name && m.nameKo, `${m.id} is missing a name`);
    assert.ok(m.whyShared.length > 0, `${m.id} has no reason to be shared`);
    assert.ok(m.howItWorks.length > 0, `${m.id} does not say how to eat it`);
    assert.ok(Number.isInteger(m.minPeople) && m.minPeople >= 1, `${m.id} has a bad minimum`);
    assert.ok(Array.isArray(m.contains), `${m.id} has no allergen list`);
  }
});

test('the catalog is mostly dishes you genuinely cannot order alone', () => {
  // The product only has a reason to exist because of these.
  assert.ok(sharedOnlyMenus().length >= 8);
});

test('no menu quotes a price', () => {
  // Prices move and differ by district; asserting one would mislead a
  // traveller about a shop we have never checked.
  // A price is a number attached to a currency — matching the bare word
  // "won" flags Itaewon, which is a place this food is actually eaten.
  const price = /\d[\d,.]*\s*(won|krw|₩)|₩\s*\d/i;
  for (const m of menus) {
    assert.doesNotMatch(JSON.stringify(m), price, `${m.id} mentions a price`);
  }
});

test('a dish that lists no ingredients has said why', () => {
  // The bug this locks out: an empty `contains` renders no warning at all, so
  // "checked, there is none of it" and "nobody enumerated a spread of twelve
  // banchan" looked the same on screen — silence, read as safety by the one
  // traveller who most needed the answer.
  for (const m of menus) {
    if (m.contains.length === 0) {
      assert.equal(m.varies, true,
        `${m.id} lists no ingredients and does not say the spread varies`);
    }
  }
});

test('an ingredient a dish describes is an ingredient it declares', () => {
  // 한정식 described grilled fish in howItWorks while declaring nothing, which
  // is how the contradiction got found. Prose and record have to agree.
  for (const m of menus) {
    const prose = `${m.howItWorks} ${m.whyShared}`.toLowerCase();
    for (const [word, ingredient] of [['fish', 'fish'], ['pork', 'pork'], ['beef', 'beef']]) {
      if (new RegExp(`\\b${word}\\b`).test(prose) && !m.varies) {
        assert.ok(m.contains.includes(ingredient),
          `${m.id} describes ${word} but does not declare it`);
      }
    }
  }
});

test('every restriction a traveller can tick is one a dish can carry', () => {
  // A tick box that no dish can ever match is a promise the catalog cannot
  // keep — the traveller sets it and is never warned about anything.
  const declared = new Set(menus.flatMap(m => m.contains));
  for (const r of RESTRICTIONS) {
    assert.ok(declared.has(r), `nothing in the catalog contains ${r}`);
  }
});

test('every menu carries the culture note the table page reads', () => {
  for (const m of menus) {
    assert.ok(m.culture && m.culture.length > 40, `${m.id} has no culture note`);
    // whyShared explains the portion; culture explains the meaning. If they
    // are the same sentence one of them is not doing its job.
    assert.notEqual(m.culture, m.whyShared, `${m.id} repeats whyShared as culture`);
  }
});

test('a menu is linked to a theme only where that theme exists', () => {
  for (const m of menus) {
    if (m.themeId === null) continue;
    assert.ok(themeById(m.themeId), `${m.id} points at a theme that is not in the catalog: ${m.themeId}`);
  }
});

test('most dishes are deliberately linked to no theme at all', () => {
  // The catalog has one theme these dishes genuinely belong to — the night
  // food of Seoul After Dark. Filling in the rest to make the feature look
  // complete would be inventing cultural membership nobody could check, so a
  // majority being null is the correct state, not a gap to close.
  const linked = menus.filter(m => m.themeId);
  assert.ok(linked.length >= 1, 'no menu is linked to any theme');
  assert.ok(linked.length < menus.length / 2, 'suspiciously many dishes claim a theme');
});

test('a dish may only claim a time its own words support', () => {
  // The rule this catalog lives under, applied to the clock. Inventing when a
  // country eats is exactly the kind of casual wrongness a public-diplomacy
  // app cannot afford, so the field is allowed only where the prose already
  // says it — and 백반's "made that morning" is the kitchen's morning, not the
  // eater's, which is why 백반 carries no time.
  const cue = {
    morning: /morning|아침|해장/i,
    lunch: /lunch|noon|점심/i,
    evening: /evening|dinner|after-work|회식|저녁/i,
    late: /late|night|밤/i,
  };
  for (const m of menus) {
    for (const when of m.eatenAt ?? []) {
      const prose = `${m.whyShared} ${m.howItWorks} ${m.culture}`;
      assert.match(prose, cue[when],
        `${m.id} claims to be eaten at ${when} and never says so`);
    }
  }
});

test('an untimed dish keeps the form default rather than getting a guess', () => {
  assert.equal(defaultHourFor('samgyeopsal'), '19:00');
  assert.equal(defaultHourFor('gamjatang'), '21:30', 'the first slot is the primary one');
  assert.equal(defaultHourFor('baekban'), null);
  assert.equal(defaultHourFor('nonsense'), null);
  // Most of the catalog is deliberately untimed; if that ever flips, somebody
  // has started guessing.
  assert.ok(menus.filter(m => m.eatenAt).length <= 5, 'suspiciously many dishes claim a time');
});
