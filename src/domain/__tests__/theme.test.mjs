import { test } from 'node:test';
import assert from 'node:assert/strict';

// node:test has no DOM. A tiny in-memory stand-in for localStorage,
// document.documentElement and matchMedia is enough — the same shape
// profile.test.mjs already uses for localStorage.
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

let attrs = {};
let metaContent = null;
globalThis.document = {
  documentElement: {
    setAttribute: (k, v) => { attrs[k] = v; },
    getAttribute: (k) => attrs[k] ?? null,
  },
  querySelector: () => ({
    setAttribute: (k, v) => { if (k === 'content') metaContent = v; },
  }),
};

let mqlMatches = false;
let mqlListeners = [];
globalThis.window = {
  matchMedia: () => ({
    get matches() { return mqlMatches; },
    addEventListener: (event, fn) => { mqlListeners.push(fn); },
    removeEventListener: (event, fn) => { mqlListeners = mqlListeners.filter(f => f !== fn); },
  }),
};

const fireSystemChange = () => mqlListeners.forEach(fn => fn());

const {
  getStoredTheme, resolveTheme, applyTheme, setTheme, watchSystemTheme, systemPrefersDark,
} = await import('../../data/theme.js');

test('a traveller who never chose reads as system, not a missing key', () => {
  globalThis.localStorage.clear();
  assert.equal(getStoredTheme(), 'system');
});

test('a stored choice is read back exactly', () => {
  globalThis.localStorage.clear();
  globalThis.localStorage.setItem('bapchingu-theme', 'dark');
  assert.equal(getStoredTheme(), 'dark');
});

test('garbage in storage reads as system rather than crashing', () => {
  globalThis.localStorage.clear();
  globalThis.localStorage.setItem('bapchingu-theme', 'sepia');
  assert.equal(getStoredTheme(), 'system');
});

test('light and dark resolve to themselves', () => {
  assert.equal(resolveTheme('light'), 'light');
  assert.equal(resolveTheme('dark'), 'dark');
});

test('system resolves to whatever the OS says right now', () => {
  mqlMatches = true;
  assert.equal(systemPrefersDark(), true);
  assert.equal(resolveTheme('system'), 'dark');

  mqlMatches = false;
  assert.equal(systemPrefersDark(), false);
  assert.equal(resolveTheme('system'), 'light');
});

test('applyTheme writes the resolved value, never the literal "system"', () => {
  attrs = {};
  mqlMatches = true;
  applyTheme('system');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');

  applyTheme('light');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
});

test('applyTheme updates the theme-color meta tag to match, for the status bar', () => {
  metaContent = null;
  applyTheme('dark');
  assert.equal(metaContent, '#0F1115');

  applyTheme('light');
  assert.equal(metaContent, '#FFFFFF');
});

test('setTheme persists the raw choice and applies it in the same call', () => {
  globalThis.localStorage.clear();
  attrs = {};
  const saved = setTheme('dark');
  assert.equal(saved, 'dark');
  assert.equal(globalThis.localStorage.getItem('bapchingu-theme'), 'dark');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
});

test('setTheme falls back to system for anything it does not recognise', () => {
  globalThis.localStorage.clear();
  const saved = setTheme('sepia');
  assert.equal(saved, 'system');
  assert.equal(globalThis.localStorage.getItem('bapchingu-theme'), 'system');
});

test('watchSystemTheme is a no-op once an explicit choice is stored', () => {
  globalThis.localStorage.clear();
  setTheme('light');
  mqlListeners = [];
  const stop = watchSystemTheme(() => {
    throw new Error('should never fire for an explicit choice');
  });
  assert.equal(mqlListeners.length, 0, 'no listener should have been registered');
  stop(); // must not throw even though nothing was registered
});

test('watchSystemTheme keeps "system" live when the OS changes mid-session', () => {
  globalThis.localStorage.clear();
  setTheme('system');
  mqlListeners = [];
  const seen = [];
  const stop = watchSystemTheme((resolved) => seen.push(resolved));

  assert.equal(mqlListeners.length, 1);

  mqlMatches = true;
  fireSystemChange();
  assert.deepEqual(seen, ['dark']);
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');

  mqlMatches = false;
  fireSystemChange();
  assert.deepEqual(seen, ['dark', 'light']);

  stop();
  assert.equal(mqlListeners.length, 0, 'cleanup must remove the listener');
});

test('watchSystemTheme stops reacting once the traveller overrides system after subscribing', () => {
  globalThis.localStorage.clear();
  setTheme('system');
  mqlListeners = [];
  const seen = [];
  watchSystemTheme((resolved) => seen.push(resolved));

  setTheme('light'); // switched away from system without unsubscribing
  mqlMatches = true;
  fireSystemChange();

  assert.deepEqual(seen, [], 'a stale subscription must not override an explicit choice');
});
