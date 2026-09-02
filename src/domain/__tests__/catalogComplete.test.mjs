import test from 'node:test';
import assert from 'node:assert/strict';
import {
  menus, MENU_CATEGORY, CATEGORY_LABEL, CONTAINS_LABEL, menuById,
} from '../catalog/menus.js';
import { DISH_GROUPS, DISH_IDS, groupOfMenu } from '../catalog/dishGroups.js';

// The catalogue is the twenty-four dishes the front page advertises.
//
// Until 2026-09-02 it held ten. The other fourteen existed as a name, a
// romanisation and a one-line gloss in dishGroups.js and nowhere else, so the
// home page offered six categories of food and the open-a-table form could
// serve five of them — 분식·전 had no dish anybody could open a table for, and
// its card led to a filter that was empty for ever. Measured before anything
// was written: docs/restaurant-picker-plan.md and the 24-dish table of
// 2026-09-02.
//
// Every check here is a positive count. "Exactly 24" rather than "at least
// 10", because the bug was the catalogue being quietly smaller than the
// product said it was, and a floor would have let it shrink again unnoticed.

const LANGS = ['', 'Ko', 'Es', 'Fr', 'Ar', 'Zh', 'Ja'];
const PROSE = ['gloss', 'whyShared', 'howItWorks', 'culture'];

test('the catalogue holds exactly the twenty-four dishes the front page advertises', () => {
  assert.equal(menus.length, 24);
  assert.equal(DISH_IDS.length, 24, 'the groups changed size — update this test on purpose');
});

test('every one of the six groups can have a table opened in it', () => {
  // The state that shipped: 분식·전 advertised four dishes and could open zero
  // tables. groupOfMenu is the exact path the tables tab filters through.
  const openable = {};
  for (const m of menus) {
    const g = groupOfMenu(m.id);
    assert.ok(g, `${m.id} belongs to no group`);
    openable[g.id] = (openable[g.id] ?? 0) + 1;
  }
  for (const g of DISH_GROUPS) {
    assert.ok(openable[g.id] >= 1, `no table can be opened in ${g.ko} (${g.id})`);
  }
  // And the specific one that was empty.
  assert.equal(openable.street, 4, '분식·전 should hold all four of its dishes');
});

test('every dish says all four things in all seven languages — 672 strings, none empty', () => {
  // A 25th dish added with six languages would pass every per-language file
  // that checks "for each menu, this language exists" only if somebody ran
  // all seven of them and read the output. This counts once, and the number
  // is the product of three things that are each pinned elsewhere.
  let filled = 0;
  const missing = [];
  for (const m of menus) {
    for (const f of PROSE) {
      for (const l of LANGS) {
        const v = m[f + l];
        if (typeof v === 'string' && v.trim().length > 0) filled += 1;
        else missing.push(`${m.id}.${f}${l || 'En'}`);
      }
    }
  }
  assert.deepEqual(missing, []);
  assert.equal(filled, 24 * 4 * 7);
});

test('the ten dishes that were already in the catalogue did not change', () => {
  // The acceptance criterion for the expansion, pinned as data rather than
  // left to a git diff somebody has to remember to read. These are the
  // values as they stood on 2026-09-02 before the fourteen were added.
  const before = {
    samgyeopsal:      { category: 'grill',   minPeople: 2, spice: 0, contains: ['pork'] },
    dakgalbi:         { category: 'grill',   minPeople: 2, spice: 3, contains: ['chicken'] },
    gamjatang:        { category: 'stew',    minPeople: 2, spice: 3, contains: ['pork'] },
    'budae-jjigae':   { category: 'stew',    minPeople: 2, spice: 3, contains: ['pork', 'beef'] },
    bossam:           { category: 'platter', minPeople: 2, spice: 1, contains: ['pork', 'shellfish'] },
    jokbal:           { category: 'platter', minPeople: 2, spice: 0, contains: ['pork'] },
    'ganjang-gejang': { category: 'set',     minPeople: 2, spice: 0, contains: ['shellfish'] },
    hanjeongsik:      { category: 'set',     minPeople: 2, spice: 1, contains: ['fish'], varies: true },
    baekban:          { category: 'set',     minPeople: 1, spice: 1, contains: [], varies: true },
    gopchang:         { category: 'grill',   minPeople: 2, spice: 1, contains: ['beef', 'pork'] },
  };
  for (const [id, want] of Object.entries(before)) {
    const m = menuById(id);
    assert.ok(m, `${id} is gone from the catalogue`);
    for (const [k, v] of Object.entries(want)) {
      assert.deepEqual(m[k], v, `${id}.${k} changed`);
    }
  }
  // 백반's spice of 1 predates the rule "does the intended mouthful contain
  // chilli" and does not follow it. It is kept, and this line is where the
  // inconsistency is admitted so nobody "fixes" it by changing a dish that
  // was not part of the expansion.
  assert.equal(menuById('baekban').spice, 1);
});

test('every category a dish uses has a label in every language', () => {
  const used = new Set(menus.map(m => m.category));
  assert.equal(used.size, 5, 'the catalogue should use exactly five categories');
  for (const c of used) {
    assert.ok(Object.values(MENU_CATEGORY).includes(c), `${c} is not a declared category`);
    for (const l of ['en', 'ko', 'kr', 'es', 'fr', 'ar', 'zh', 'ja']) {
      assert.ok(CATEGORY_LABEL[c]?.[l]?.length > 0, `category ${c} has no ${l} label`);
    }
  }
  // The one added for the expansion, and the one dish it exists for.
  assert.equal(MENU_CATEGORY.BOWL, 'bowl');
  assert.deepEqual(menus.filter(m => m.category === 'bowl').map(m => m.id), ['bibimbap']);
});

test('every ingredient a dish declares has a label in every language', () => {
  // The chip used to print the raw value — "pork, shellfish 들어감" on a
  // Korean screen — and the audit could not see it because the value was
  // interpolated, not written. A seventh value added without a label fails
  // here, which is the failure mode this catalogue's other i18n gaps taught.
  const used = new Set(menus.flatMap(m => m.contains));
  assert.ok(used.has('mollusc'), 'the value added for 산낙지 is not in use');
  for (const c of used) {
    for (const l of ['en', 'ko', 'es', 'fr', 'ar', 'zh', 'ja']) {
      assert.ok(CONTAINS_LABEL[c]?.[l]?.length > 0, `ingredient ${c} has no ${l} label`);
    }
  }
  assert.equal(Object.keys(CONTAINS_LABEL).length, 6);
  // The two English labels are concrete pairs, not the classification words:
  // English "shellfish" covers molluscs, so beside "squid & octopus" it would
  // have made both ambiguous. Decided 2026-09-02.
  assert.equal(CONTAINS_LABEL.shellfish.en, 'shrimp & crab');
  assert.equal(CONTAINS_LABEL.mollusc.en, 'squid & octopus');
  assert.equal(CONTAINS_LABEL.mollusc.ko, '오징어·낙지류');
});

test('the id bridge between catalogue and groups never grows past its two historical cases', () => {
  // menus.js predates dishGroups.js and spelled two ids differently; the
  // MENU_ALIAS bridge exists for those two. Removing it means migrating
  // production tables.menu_id or regenerating 962 register rows, neither of
  // which is worth a tidier name mid-pilot. So it stays — and every dish
  // added from now on has to use the group id directly, so the bridge is
  // frozen at two rather than deleted.
  const ALIASED = new Set(['budae-jjigae', 'ganjang-gejang']);
  const strangers = menus.map(m => m.id).filter(id => !DISH_IDS.includes(id) && !ALIASED.has(id));
  assert.deepEqual(strangers, [], 'a catalogue id that is not a group id and not one of the two aliases');
});

test('a dish that lists nothing says the house decides — and never the reverse', () => {
  // Two different reasons for an empty list, and the comment on each entry
  // has to say which: 해물찜 is empty because the NAME already says seafood
  // and which seafood is the house's; 전골 is empty because the gloss says
  // nothing about ingredients at all. Both carry varies:true, so both render
  // the "집이 정한다" sentence rather than silence.
  const empty = menus.filter(m => m.contains.length === 0).map(m => m.id).sort();
  assert.deepEqual(empty, ['baekban', 'bibimbap', 'haemuljjim', 'jeon', 'jeongol', 'ssambap', 'twigim']);
  for (const id of empty) assert.equal(menuById(id).varies, true, `${id} is empty and does not say the house decides`);
  // The combination that must not ship: an empty list with no varies flag,
  // which the sheet would render as "the catalogue does not enumerate this".
  assert.equal(menus.filter(m => m.contains.length === 0 && !m.varies).length, 0);
});

test('the umbrella dishes say in their gloss that the house decides', () => {
  // 전골·전·튀김 name a form, not a dish. Splitting them would break the six
  // groups the front page is built on, so they stay as umbrellas and the
  // gloss — the line under the name on every card — is where the variation
  // is said, so a reader knows before tapping.
  for (const id of ['jeongol', 'jeon', 'twigim', 'haemuljjim', 'ssambap']) {
    const m = menuById(id);
    assert.match(m.glossKo, /집|가게|그날/, `${id}'s Korean gloss does not say the house decides`);
    assert.match(m.gloss, /house|shop|that day|varies/i, `${id}'s gloss does not say the house decides`);
  }
});
