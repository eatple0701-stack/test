import { test } from 'node:test';
import assert from 'node:assert/strict';

// getProfile/saveProfile touch localStorage, which node:test does not
// provide. A tiny in-memory stand-in is enough — the same shape jsdom-less
// unit tests in this repo already assume (see tableRepository, which is
// exercised only through the domain layer, never directly, for the same
// reason).
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

const { getProfile } = await import('../../data/profile.js');

test('a fresh profile has an unset gender, not a missing key', () => {
  globalThis.localStorage.clear();
  const p = getProfile();
  assert.equal(p.gender, null);
  assert.ok('gender' in p, 'the key must exist so ?? defaults are never needed downstream');
});

test('a fresh profile has an empty allergy note, not a missing key', () => {
  globalThis.localStorage.clear();
  const p = getProfile();
  assert.equal(p.allergyNote, '');
  assert.ok('allergyNote' in p, 'the key must exist so ?? defaults are never needed downstream');
});
