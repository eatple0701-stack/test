import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRST_RUN, FIRST_RUN_STEPS, FIRST_RUN_EXIT, stepAfter, shouldRun,
} from '../policy/firstRun.js';

test('the logo comes before the deck, and nothing comes after it', () => {
  // The order is the whole request: 로고 → 입맛지도 → 선택. A sequence that
  // opened on fourteen cards would be a form, and one that ended on the logo
  // would have taken a stranger's time and given nothing back.
  assert.deepEqual(FIRST_RUN_STEPS, [FIRST_RUN.logo, FIRST_RUN.taste]);
  assert.equal(stepAfter(FIRST_RUN.logo), FIRST_RUN.taste);
  assert.equal(stepAfter(FIRST_RUN.taste), null);
});

test('the test is a branch off the deck, not a third step', () => {
  // It is entered by choosing it on the map and it takes the deck's place in
  // the same screen; nothing follows it, because closing it ends the opening.
  // Walking to it would put it in front of somebody who never asked for it.
  assert.equal(FIRST_RUN_STEPS.includes(FIRST_RUN.mbti), false);
  assert.equal(stepAfter(FIRST_RUN.mbti), null);
});

test('a step nobody knows leads nowhere rather than to the first one', () => {
  // A stale value in state must not restart the sequence somebody is already
  // halfway through.
  assert.equal(stepAfter('welcome'), null);
  assert.equal(stepAfter(undefined), null);
  assert.equal(stepAfter(FIRST_RUN.logo, []), null);
});

test('only a browser that has never been here gets it', () => {
  assert.equal(shouldRun(null), true);
  assert.equal(shouldRun(undefined), true);
});

test('anything storage returns other than nothing counts as seen', () => {
  // The value is user-writable and arrives from older versions of the app.
  // Showing the sequence twice is the failure that matters; skipping it once
  // is not, so every unrecognised shape means seen.
  for (const seen of ['2026-09-09T00:00:00.000Z', '', 'unavailable', 0, 1, {}, []]) {
    assert.equal(shouldRun(seen), false, `${JSON.stringify(seen)} should count as seen`);
  }
});

test('there are two ways out and both of them close the sequence', () => {
  // Neither is a dead end and neither is the recommended one: 'app' lands on
  // 밥상, 'mbti' opens the test over it, and both mark the sequence seen.
  assert.deepEqual(Object.keys(FIRST_RUN_EXIT).sort(), ['app', 'mbti']);
  assert.equal(FIRST_RUN_EXIT.app, 'app');
  assert.equal(FIRST_RUN_EXIT.mbti, 'mbti');
});
