import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TASTE_RECORD, tasteRecordState, showsDishes, showsType, showsPrompt, testIsNew,
} from '../policy/tasteRecord.js';

const TYPE = { code: 'TKBA', axes: {} };

test('the two answers are counted separately', () => {
  assert.equal(tasteRecordState({ mapCount: 8, type: TYPE }), TASTE_RECORD.both);
  assert.equal(tasteRecordState({ mapCount: 8, type: null }), TASTE_RECORD.map);
  assert.equal(tasteRecordState({ mapCount: 0, type: TYPE }), TASTE_RECORD.type);
  assert.equal(tasteRecordState({ mapCount: 0, type: null }), TASTE_RECORD.none);
  assert.equal(tasteRecordState(), TASTE_RECORD.none);
});

test('a map with no test still has something to show', () => {
  // The passport put the whole 내 입맛 section behind the type, so fourteen
  // cards and no test read as "you have answered nothing". This is that bug.
  const state = tasteRecordState({ mapCount: 8, type: null });
  assert.equal(showsDishes(state), true);
  assert.equal(showsType(state), false);
  assert.equal(showsPrompt(state), false);
});

test('a test with no map is not treated as nothing either', () => {
  // Reachable: the answers live in their own key, so clearing the deck
  // leaves the type behind.
  const state = tasteRecordState({ mapCount: 0, type: TYPE });
  assert.equal(showsType(state), true);
  assert.equal(showsDishes(state), false);
  assert.equal(showsPrompt(state), false);
});

test('the invitation shows only when there is nothing at all', () => {
  assert.equal(showsPrompt(tasteRecordState({ mapCount: 0, type: null })), true);
  for (const s of [TASTE_RECORD.map, TASTE_RECORD.type, TASTE_RECORD.both]) {
    assert.equal(showsPrompt(s), false, `${s} should not show the invitation`);
  }
});

test('a half-finished type is not a type', () => {
  // mbtiType returns null until every question is answered; anything else
  // arriving here — an object with no code, a string, a stray truthy value —
  // must not turn into a four-letter code on the screen.
  for (const type of [{}, { code: '' }, 'TKBA', true, 0]) {
    assert.equal(tasteRecordState({ mapCount: 3, type }), TASTE_RECORD.map,
      `${JSON.stringify(type)} should not count as a type`);
  }
});

test('the test is new until it has been finished', () => {
  assert.equal(testIsNew(TASTE_RECORD.none), true);
  assert.equal(testIsNew(TASTE_RECORD.map), true);
  assert.equal(testIsNew(TASTE_RECORD.type), false);
  assert.equal(testIsNew(TASTE_RECORD.both), false);
});
