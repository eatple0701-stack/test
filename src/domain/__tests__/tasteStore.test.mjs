import test from 'node:test';
import assert from 'node:assert/strict';

// The taste map and the 음식 MBTI in this browser's storage: the stamp each
// answer leaves, and the signal it sends, which is how the account sync hears
// about it — see domain/policy/tasteSync.js. And the one write that must stay
// quiet: taking the account's copy, which would otherwise be sent straight
// back up.
//
// node:test has no DOM. localStorage and window in memory, the same shape
// theme.test.mjs uses.
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
globalThis.window = new EventTarget();

const { stampOf, TASTE_STORED } = await import('../../data/tasteStamp.js');
const { storeTaste, clearTaste, adoptTaste, getStoredTaste } = await import('../../data/taste.js');
const { storeMbti, clearMbti, adoptMbti, getStoredMbti } = await import('../../data/foodMbti.js');
const { MBTI_QUESTIONS, MBTI_AXES } = await import('../../content/foodMbti.js');

const heard = [];
window.addEventListener(TASTE_STORED, (e) => heard.push(e.detail?.part));

test('an answer stamps the map and says so', () => {
  heard.length = 0;
  const before = Date.now();
  storeTaste({ want: ['galbi'], pass: [] });
  assert.ok(stampOf('taste').at >= before);
  assert.deepEqual(heard, ['taste']);
});

test('starting over is an answer too — stamped, and said', () => {
  heard.length = 0;
  clearTaste();
  assert.deepEqual(getStoredTaste(), { want: [], pass: [] });
  assert.ok(stampOf('taste').at != null, 'a cleared map with no stamp would lose to the account and come back');
  assert.deepEqual(heard, ['taste']);
});

test("taking the account's copy stamps it with the account's time and says nothing", () => {
  heard.length = 0;
  adoptTaste({ want: ['bossam', 'jokbal'], pass: ['jokbal'] }, 42, 'u1');
  // The rule getStoredTaste applies to a blob: an id on both lists is a pass.
  assert.deepEqual(getStoredTaste(), { want: ['bossam'], pass: ['jokbal'] });
  assert.deepEqual(stampOf('taste'), { at: 42, owner: 'u1' });
  assert.deepEqual(heard, [], 'announcing an adopted copy sends it straight back to the account');
});

test('an answer keeps the account the map was last reconciled with', () => {
  storeTaste({ want: ['galbi'], pass: [] });
  assert.equal(stampOf('taste').owner, 'u1');
});

test('adopting an empty map empties this browser', () => {
  adoptTaste({ want: [], pass: [] }, null, 'u1');
  assert.equal(localStorage.getItem('bapchingu-taste'), null);
  assert.deepEqual(stampOf('taste'), { at: null, owner: 'u1' });
});

test('the MBTI answers are stamped, said and adopted the same way', () => {
  const q = MBTI_QUESTIONS[0];
  const pole = Object.keys(MBTI_AXES.find(a => a.id === q.axis).poles)[0];
  heard.length = 0;
  storeMbti({ [q.id]: pole });
  assert.ok(stampOf('mbti').at != null);
  assert.deepEqual(heard, ['mbti']);

  heard.length = 0;
  clearMbti();
  assert.deepEqual(getStoredMbti(), {});
  assert.deepEqual(heard, ['mbti']);

  heard.length = 0;
  adoptMbti({ [q.id]: pole, 'not-a-question': 'x' }, 77, 'u1');
  assert.deepEqual(getStoredMbti(), { [q.id]: pole }, 'the account is user-writable; it is cleaned like storage');
  assert.deepEqual(stampOf('mbti'), { at: 77, owner: 'u1' });
  assert.deepEqual(heard, []);
});

test('a stamp that is not a stamp reads as none', () => {
  localStorage.setItem('bapchingu-taste-at', '{"taste":{"at":"soon","owner":7}}');
  assert.deepEqual(stampOf('taste'), { at: null, owner: null });
  localStorage.setItem('bapchingu-taste-at', 'not json');
  assert.deepEqual(stampOf('mbti'), { at: null, owner: null });
});
