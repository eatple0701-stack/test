import { test } from 'node:test';
import assert from 'node:assert/strict';

import { run, compare, fromDoc } from '../../../scripts/audit-consent-text.mjs';

// What shipped is what was approved.
//
// docs/rules-consent-text.md is the team's record of the consent text — the
// thing a terms-and-privacy owner will read and the thing the professor's
// 사용자 조항 review will be checked against. src/content/safety.js is what a
// traveller reads. Nothing but care kept them equal, and care is what failed:
// the same batch of translations was drafted twice on 2026-09-03 and came
// back different, with an approved Chinese fix present in one run and absent
// in the other. 56 strings across seven scripts is past what an eye holds.

const LANGS = ['en', 'ko', 'es', 'fr', 'ar', 'zh', 'ja'];

// compare() treats a language that is present on one side and absent on the
// other as a defect, which is the point — so a fixture has to carry all seven
// or it exercises the missing-language path instead of the one it means to.
const sevenOf = (text) => Object.fromEntries(LANGS.map(l => [l, text]));
const docOf = (field, text) => fromDoc(
  [`## ${field}`, '', '```text', ...LANGS.map(l => `${l}: ${text}`), '```', ''].join('\n'));

test('every string in the document is the string that ships, character for character', async () => {
  const { problems, compared } = await run();
  assert.deepEqual(problems, [], `the approved text and the shipping text differ:\n\n${problems.join('\n\n')}`);
  assert.equal(compared, 56, `expected 56 comparisons (8 strings × 7 languages), made ${compared}`);
});

test('the comparison can actually fail', () => {
  // The dangerous outcome for a checker like this is agreement about nothing:
  // a renamed heading, or a fence written as ``` rather than ```text, and the
  // document contributes zero fields while the run still prints "no
  // differences". Both halves are asserted here.
  const doc = docOf('RULES[0]', 'approved wording.');

  const same = compare(doc, new Map([['RULES[0]', sevenOf('approved wording.')]]));
  assert.deepEqual(same.problems, []);
  assert.equal(same.compared, 7);

  const drifted = compare(doc, new Map([['RULES[0]', sevenOf('approved wordings.')]]));
  assert.equal(drifted.problems.length, 7, 'a changed string should be reported in every language it changed in');
  assert.match(drifted.problems[0], /first difference at character 17/);

  // A heading that no longer matches must be loud, not quiet.
  const renamed = compare(doc, new Map([['RULES[zero]', sevenOf('approved wording.')]]));
  assert.equal(renamed.compared, 0, 'a renamed heading must not report agreement about nothing');
  assert.equal(renamed.problems.length, 2, 'a heading mismatch should be reported from both sides');
});

test('a difference invisible to the eye is still reported, and named', () => {
  // The reason nothing is normalised. Arabic harakat change meaning — مررتَ is
  // "you passed by" and مررتُ is "I passed by" — so a comparison that folded
  // them away would pass the one change that matters most.
  const doc = docOf('X', 'مررتَ بها');
  const stripped = compare(doc, new Map([['X', sevenOf('مررتُ بها')]]));
  assert.equal(stripped.problems.length, 7);
  assert.match(stripped.problems[0], /U\+064/, 'the differing mark is not named by code point');

  // And a trailing space, which no reader would see and every diff should.
  const spaced = compare(docOf('X', 'one.'), new Map([['X', sevenOf('one. ')]]));
  assert.equal(spaced.problems.length, 7);
  assert.match(spaced.problems[0], /approved \(end\) vs shipping " "/);
});
