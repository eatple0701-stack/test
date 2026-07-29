// The 문화 퀴즈 content.
//
// A quiz asserts, and this one asserts to foreigners about Korea inside a
// foundation-funded cultural project. A wrong question here does more damage
// than a missing one, so the structural rules that keep it honest are pinned
// rather than left to whoever edits the file next.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { quiz, quizFor } from '../../content/quiz.js';
import { menus, menuById } from '../catalog/menus.js';

test('every question is answerable and carries its explanation', () => {
  for (const q of quiz) {
    assert.ok(q.id, 'a question has no id');
    assert.equal(typeof q.answer, 'boolean', `${q.id}: answer must be true or false`);
    assert.ok(q.prompt?.length > 10, `${q.id}: prompt too short to be a question`);
    // The reveal is the whole point — a bare right/wrong teaches nothing.
    assert.ok(q.reveal?.length > 60, `${q.id}: reveal is too thin to be worth reading out`);
  }
});

test('question ids are unique', () => {
  const ids = quiz.map(q => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('a dish-tied question points at a dish that exists', () => {
  for (const q of quiz) {
    if (q.menuId === null) continue;
    assert.ok(menuById(q.menuId), `${q.id} points at an unknown dish: ${q.menuId}`);
  }
});

test('the deck is not all True — an OX quiz where O always wins is not a quiz', () => {
  const trues = quiz.filter(q => q.answer).length;
  const falses = quiz.length - trues;
  assert.ok(falses >= 3, `only ${falses} false answers out of ${quiz.length}`);
  assert.ok(trues >= 3, `only ${trues} true answers out of ${quiz.length}`);
});

test('no question hedges — a quiz cannot answer "it depends"', () => {
  // Contested claims are excluded at authoring time; this catches one that
  // slips in wearing hedging language in the prompt.
  const hedge = /probably|maybe|some say|arguably|it depends|may have/i;
  for (const q of quiz) {
    assert.doesNotMatch(q.prompt, hedge, `${q.id}: the prompt hedges`);
  }
});

test('the general pool is big enough to carry a table on its own', () => {
  // A table eating a dish with no question of its own still needs a deck.
  const general = quiz.filter(q => q.menuId === null);
  assert.ok(general.length >= 4, `only ${general.length} general questions`);
});

test('the dish on the table is asked about first', () => {
  const forBossam = quizFor('bossam');
  assert.equal(forBossam[0].menuId, 'bossam');
  // And the general pool still follows, so the deck never runs dry.
  assert.ok(forBossam.some(q => q.menuId === null));
});

test('every dish either has its own question or falls back cleanly', () => {
  for (const m of menus) {
    const deck = quizFor(m.id);
    assert.ok(deck.length >= 4, `${m.id} has too small a deck (${deck.length})`);
  }
  // An unknown dish must not throw or return nothing.
  assert.ok(quizFor('not-a-dish').length >= 4);
  assert.ok(quizFor(null).length >= 4);
});

test("the plan's own example question is answered honestly", () => {
  // The business plan offers "비빔밥은 원래 전주에서 시작되었다 (O/X)" as a
  // sample. Jeonju is the famous regional version, not a settled origin —
  // repeating the tidy claim would be the app teaching something it cannot
  // support, so the answer is False and the reveal says why.
  const q = quiz.find(x => x.id === 'bibimbap-jeonju');
  assert.ok(q, 'the bibimbap question is gone');
  assert.equal(q.answer, false);
  assert.match(q.reveal, /Jeonju/);
  assert.match(q.reveal, /argued|debated|older/i);
});
