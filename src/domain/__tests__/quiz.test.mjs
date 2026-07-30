// The 문화 퀴즈 content.
//
// A quiz asserts, and this one asserts to foreigners about Korea inside a
// foundation-funded cultural project. A wrong question here does more damage
// than a missing one, so the structural rules that keep it honest are pinned
// rather than left to whoever edits the file next.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { quiz, quizFor, unsourcedQuestions } from '../../content/quiz.js';
import { SOURCES, sourceById } from '../../content/sources.js';
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

// ---------------------------------------------------------------------------
// Sourcing
// ---------------------------------------------------------------------------
// The plan schedules 신뢰할 수 있는 한식 정보 출처 선정 for 8/10–16 and the note
// from 감부장님 asks for 할루시네이션 방지. These are that requirement made
// enforceable: an unsourced claim about Korea cannot reach a traveller.

test('nothing unsourced ever reaches a table', () => {
  for (const q of quizFor(null)) {
    assert.ok(q.sources?.length > 0, `${q.id} is being asked with no source`);
  }
  for (const m of menus) {
    for (const q of quizFor(m.id)) {
      assert.ok(q.sources?.length > 0, `${q.id} reaches the ${m.id} deck unsourced`);
    }
  }
});

test('every question declares a sources field, even when it is empty', () => {
  // An empty array is a statement — nobody has checked this yet. A missing
  // field is an oversight, and the two must not look alike.
  for (const q of quiz) {
    assert.ok(Array.isArray(q.sources), `${q.id} has no sources field at all`);
  }
});

test('every cited id resolves to a real registry entry', () => {
  for (const q of quiz) {
    for (const id of q.sources) {
      assert.ok(sourceById(id), `${q.id} cites "${id}", which is not in the source registry`);
    }
  }
});

test('every registry entry says what it supports and where it is', () => {
  for (const [id, src] of Object.entries(SOURCES)) {
    assert.ok(src.title && src.publisher, `${id} is missing a title or publisher`);
    assert.match(src.url, /^https:\/\//, `${id} has no https url`);
    // Without this the registry becomes a bibliography nobody can audit.
    assert.ok(src.supports?.length > 30, `${id} does not say which claim it backs`);
  }
});

test('the sourced deck still works as a quiz', () => {
  const asked = quizFor(null);
  assert.ok(asked.length >= 4, `only ${asked.length} questions survive sourcing`);
  const trues = asked.filter(q => q.answer).length;
  assert.ok(trues >= 1 && trues < asked.length, 'the sourced deck is all one answer');
});

test('what still needs a source is countable, not invisible', () => {
  // The worklist for the team. If this ever hits zero the file can go.
  const waiting = unsourcedQuestions();
  for (const q of waiting) assert.equal(q.sources.length, 0);
  assert.ok(waiting.length + quiz.filter(q => q.sources.length > 0).length === quiz.length);
});
