import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { menus, MENU_CATEGORY, menuById } from '../catalog/menus.js';
import { LOCALES, LOCALE } from '../policy/locale.js';
import {
  categoryLabel, ingredientLabels, containsLine, variesLine,
} from '../policy/dishLabels.js';

// What a card says about a dish's category and ingredients, in the reader's
// language.
//
// Three screens printed the English category chip to every reader
// (TableDetail, TablesTab: `CATEGORY_LABEL[c]?.en`), and four printed the raw
// ingredient id inside a translated frame (`${contains.join(', ')} 들어감`).
// The i18n audit reads string literals and say() calls; a member access and
// an interpolated value are neither, so both passed with 0 while a Korean
// screen read "A whole spread" and "pork, shellfish 들어감". Found 2026-09-02
// while widening the catalogue, when adding a sixth ingredient value would
// have meant one Korean chip beside five English ones.
//
// So the words come from one function each, and the function is what is
// tested — the components only call it.

const LATIN = /[A-Za-z]/;
const NON_EN = LOCALES.filter(l => l !== LOCALE.EN && l !== LOCALE.BOTH);

test('a category has a label in every locale, and the Korean one has no English in it', () => {
  for (const c of Object.values(MENU_CATEGORY)) {
    for (const l of LOCALES) {
      const s = categoryLabel(c, l);
      assert.ok(typeof s === 'string' && s.length > 0, `${c} has no label for ${l}`);
    }
    assert.doesNotMatch(categoryLabel(c, LOCALE.KO), LATIN, `${c} in Korean still contains English`);
  }
  assert.equal(categoryLabel('bowl', 'ko'), '한 그릇');
  assert.equal(categoryLabel('bowl', 'en'), 'One bowl');
  assert.equal(categoryLabel('set', 'ja'), 'ひと膳');
  // The two-language default the app has always shown falls to English.
  assert.equal(categoryLabel('set', 'both'), 'A whole spread');
});

test('an unknown category renders nothing rather than "undefined"', () => {
  assert.equal(categoryLabel('nonsense', 'ko'), '');
  assert.equal(categoryLabel(undefined, 'en'), '');
});

test('every ingredient a dish declares has a label in every locale', () => {
  const used = [...new Set(menus.flatMap(m => m.contains))].sort();
  assert.deepEqual(used, ['beef', 'chicken', 'fish', 'mollusc', 'pork', 'shellfish']);
  for (const l of LOCALES) {
    const labels = ingredientLabels(used, l);
    assert.equal(labels.length, used.length, `${l} dropped an ingredient`);
    for (const s of labels) assert.ok(s.length > 0, `${l} has an empty ingredient label`);
  }
  for (const s of ingredientLabels(used, LOCALE.KO)) {
    assert.doesNotMatch(s, LATIN, `Korean ingredient label contains English: ${s}`);
  }
  assert.deepEqual(ingredientLabels(['pork', 'mollusc'], 'ko'), ['돼지고기', '오징어·낙지류']);
  assert.deepEqual(ingredientLabels(['shellfish', 'mollusc'], 'en'), ['shrimp & crab', 'squid & octopus']);
});

test('an ingredient nobody labelled is shown as its id, never dropped', () => {
  // Dropping it would be the silence-reads-as-safety failure one level down:
  // a dish declaring a seventh value would render a shorter list than it
  // carries. Showing the raw id is ugly and honest, and catalogComplete
  // fails the build before it ships.
  assert.deepEqual(ingredientLabels(['pork', 'sesame'], 'ko'), ['돼지고기', 'sesame']);
});

test('the contains line says one of three things, and which one is decided by the data', () => {
  // 1. A list: what it is normally made of.
  const listed = containsLine(menuById('bossam'), 'ko');
  assert.equal(listed.kind, 'list');
  assert.match(listed.text, /돼지고기/);
  assert.match(listed.text, /새우·게류/);
  assert.doesNotMatch(listed.text, LATIN, 'the Korean contains line still holds English');

  // 2. Empty and varies: the house decides — a fact about the dish.
  const house = containsLine(menuById('jeongol'), 'ko');
  assert.equal(house.kind, 'house');
  assert.match(house.text, /집/);
  assert.doesNotMatch(house.text, /카탈로그/, 'the house sentence is talking about the catalogue, not the dish');

  // 3. Empty and NOT varies: a dish nobody has filled in. The sentence is
  // about the catalogue, and catalogComplete keeps this combination at zero
  // dishes so it never actually renders.
  const unlisted = containsLine({ contains: [], varies: false }, 'ko');
  assert.equal(unlisted.kind, 'unlisted');
  assert.match(unlisted.text, /카탈로그/);
});

test('the house sentence and the unlisted sentence are different strings in every language', () => {
  // The user's criterion, verbatim. If they were ever the same, a dish the
  // house decides and a dish nobody wrote up would read alike.
  for (const l of LOCALES) {
    const house = containsLine({ contains: [], varies: true }, l).text;
    const unlisted = containsLine({ contains: [], varies: false }, l).text;
    assert.ok(house.length > 0 && unlisted.length > 0, `${l}: an empty sentence`);
    assert.notEqual(house, unlisted, `${l}: the two empty-list sentences are identical`);
  }
});

test('the varies caveat covers what a dish IS, not only what comes beside it', () => {
  // The definition settled on 2026-09-02: the house decides what comes with
  // the dish OR what the dish is. The old sentence said "side dishes", which
  // was right for 백반 and wrong for 전골, where the pot itself is the thing
  // that differs.
  for (const l of LOCALES) {
    assert.ok(variesLine(l).length > 20, `${l}: no varies caveat`);
  }
  assert.doesNotMatch(variesLine('ko'), /^반찬은/, 'still the side-dish-only sentence');
  assert.match(variesLine('ko'), /집/);
  assert.match(variesLine('en'), /house/i);
});

test('the components read the labels through these functions, not the tables', () => {
  // Source-level, and the only place in this file that is: the render path
  // is React, the suite has no React render harness, and what has to be true
  // is that no component reaches into CATEGORY_LABEL or `contains.join`
  // itself. Comments stripped first, per CLAUDE.md — the rule was learned
  // from checks that matched the comment explaining the rule.
  const strip = (s) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const read = (f) => strip(fs.readFileSync(path.join(process.cwd(), f), 'utf8'));
  for (const f of ['src/components/TableDetail.jsx', 'src/components/TablesTab.jsx',
    'src/components/TableCreate.jsx', 'src/components/DishSheet.jsx']) {
    const src = read(f);
    assert.doesNotMatch(src, /CATEGORY_LABEL\[[^\]]+\]\?\.en\b/, `${f} still prints the English category`);
    assert.doesNotMatch(src, /contains\.join\(/, `${f} still interpolates raw ingredient ids`);
    assert.doesNotMatch(src, /conflictsFor\([^)]*\)\.join\(/, `${f} still interpolates raw conflict ids`);
  }
});
