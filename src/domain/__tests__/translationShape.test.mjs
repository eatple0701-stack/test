import test from 'node:test';
import assert from 'node:assert/strict';
import { seasonalFoods, festivals, courses } from '../../data/experiences.js';
import { menus } from '../catalog/menus.js';
import { themes } from '../catalog/themes.js';
import { restaurants } from '../../data/restaurants.js';
import { cultureByCategory } from '../../data/culture.js';

// Does each translation hold the *kind* of thing its field is for?
//
// Every per-language suite asks "is there a translation, and is it in the
// right script". Both passed while three languages had a paragraph sitting in
// a one-word field: the Arabic pass filled these files by walking them in
// document order and supplying a list, and the list was in a different order
// than the file. `seasonAr` held a whole sentence about mugwort soup; the
// festival months held the names of seasons. Chinese and Japanese copied the
// shape of that list and inherited the same shift. Arabic and Chinese shipped
// that way.
//
// A per-language check cannot see it, because every value was in the right
// script and none was empty. What separates a label from a paragraph is
// length, and that is the same in every language — so this file compares the
// shape of a field across all of them at once.

const LANGS = ['', 'Ko', 'Es', 'Fr', 'Ar', 'Zh', 'Ja'];
const values = (obj, field) => LANGS
  .map((l) => [l || 'En', obj[field + l]])
  .filter(([, v]) => typeof v === 'string' && v.trim() !== '');

// Length is the signal, but a character is not worth the same everywhere:
// Chinese and Japanese pack a whole sentence into seventeen characters, while
// "De finales de septiembre a principios de octubre" is a label at
// forty-eight. So the thresholds are per script, measured from what the eight
// languages here actually contain rather than from one number that fits none
// of them.
const CJK = /[一-鿿ぁ-ゟ゠-ヿ]/;
const isLabel = (v) => (CJK.test(v) ? v.length <= 16 : v.length <= 60);
const isSentence = (v) => (CJK.test(v) ? v.length >= 12 : v.length >= 25);

test('a label field holds a label in every language', () => {
  const wrong = [];
  const check = (what, obj, field) => {
    for (const [lang, v] of values(obj, field)) {
      if (!isLabel(v)) wrong.push(what + '.' + field + lang + ' (' + v.length + " chars): '" + v.slice(0, 50) + "…'");
    }
  };
  for (const f of seasonalFoods) check('seasonal:' + f.id, f, 'season');
  for (const f of festivals) check('festival:' + f.id, f, 'when');
  for (const c of courses) check('course:' + c.id, c, 'duration');
  assert.deepEqual(wrong, [], 'a one-word field is holding a sentence — the language lists are out of order');
});

test('a prose field holds prose in every language', () => {
  const wrong = [];
  const check = (what, obj, field) => {
    for (const [lang, v] of values(obj, field)) {
      if (!isSentence(v)) wrong.push(what + '.' + field + lang + ' (' + v.length + " chars): '" + v + "'");
    }
  };
  for (const f of seasonalFoods) check('seasonal:' + f.id, f, 'blurb');
  for (const f of festivals) check('festival:' + f.id, f, 'blurb');
  for (const m of menus) { check('menu:' + m.id, m, 'whyShared'); check('menu:' + m.id, m, 'culture'); }
  for (const t of themes) check('theme:' + t.id, t, 'narrative');
  for (const r of restaurants) check('rest:' + r.id, r, 'story');
  for (const [k, c] of Object.entries(cultureByCategory)) check('culture:' + k, c, 'didYouKnow');
  assert.deepEqual(wrong, [], 'a prose field is holding a label — the language lists are out of order');
});

test('a field is not the same string in two different languages', () => {
  // The other half of the same failure: a list one entry short leaves a value
  // duplicated rather than shifted. Proper nouns legitimately repeat, so this
  // only looks at fields that are always prose.
  const dupes = [];
  const check = (what, obj, field) => {
    const vs = values(obj, field).filter(([, v]) => v.length > 25);
    for (let i = 0; i < vs.length; i += 1) {
      for (let j = i + 1; j < vs.length; j += 1) {
        if (vs[i][1] === vs[j][1]) dupes.push(what + '.' + field + ': ' + vs[i][0] + ' === ' + vs[j][0]);
      }
    }
  };
  for (const m of menus) { check('menu:' + m.id, m, 'whyShared'); check('menu:' + m.id, m, 'howItWorks'); check('menu:' + m.id, m, 'culture'); }
  for (const t of themes) check('theme:' + t.id, t, 'narrative');
  for (const r of restaurants) { check('rest:' + r.id, r, 'vibe'); check('rest:' + r.id, r, 'story'); }
  for (const f of seasonalFoods) check('seasonal:' + f.id, f, 'blurb');
  for (const f of festivals) check('festival:' + f.id, f, 'blurb');
  for (const [k, c] of Object.entries(cultureByCategory)) check('culture:' + k, c, 'didYouKnow');
  assert.deepEqual(dupes, []);
});
