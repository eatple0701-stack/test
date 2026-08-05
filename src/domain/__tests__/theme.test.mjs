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
// index.html ships *two* theme-color tags, scoped to prefers-color-scheme, so
// the browser chrome is right before React boots. The stub models a real head
// holding several of them — a stub that could only ever return one tag was
// what let applyTheme spend a while updating the first of two and leaving the
// other to contradict it.
let head = [];
const makeMeta = () => {
  const el = { tagName: 'META', _attrs: {} };
  el.setAttribute = (k, v) => { el._attrs[k] = v; };
  el.getAttribute = (k) => el._attrs[k] ?? null;
  el.remove = () => { head = head.filter(m => m !== el); };
  return el;
};
const seedTwoScopedTags = () => {
  head = [];
  for (const [media, content] of [
    ['(prefers-color-scheme: light)', '#FFFFFF'],
    ['(prefers-color-scheme: dark)', '#0F1115'],
  ]) {
    const m = makeMeta();
    m.setAttribute('name', 'theme-color');
    m.setAttribute('media', media);
    m.setAttribute('content', content);
    head.push(m);
  }
};
const themeColorTags = () => head.filter(m => m.getAttribute('name') === 'theme-color');

globalThis.document = {
  documentElement: {
    setAttribute: (k, v) => { attrs[k] = v; },
    getAttribute: (k) => attrs[k] ?? null,
  },
  head: { appendChild: (el) => { head.push(el); return el; } },
  createElement: () => makeMeta(),
  querySelectorAll: (sel) => (sel === 'meta[name="theme-color"]' ? themeColorTags() : []),
  querySelector: (sel) => (sel === 'meta[name="theme-color"]' ? themeColorTags()[0] ?? null : null),
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

test('a traveller who never chose gets light, not whatever their phone is set to', () => {
  // This was 'system', which sounds respectful and meant half of all first
  // visitors — anybody whose phone is in dark mode — saw a palette nobody on
  // the team chose to lead with, while SettingsTab's own 디폴트 button had
  // meant light for a day already.
  globalThis.localStorage.clear();
  assert.equal(getStoredTheme(), 'light');
  mqlMatches = true;
  assert.equal(getStoredTheme(), 'light', 'a dark OS must not decide for somebody who never chose');
  mqlMatches = false;
});

test('a stored choice is read back exactly', () => {
  globalThis.localStorage.clear();
  globalThis.localStorage.setItem('bapchingu-theme', 'dark');
  assert.equal(getStoredTheme(), 'dark');
  // Nothing offers 'system' any more, but devices still hold it from when
  // Settings had three buttons. Reading it back unchanged is the point: the
  // app must not quietly rewrite a choice somebody actually made.
  globalThis.localStorage.setItem('bapchingu-theme', 'system');
  assert.equal(getStoredTheme(), 'system');
});

test('garbage in storage reads as the default rather than crashing', () => {
  globalThis.localStorage.clear();
  globalThis.localStorage.setItem('bapchingu-theme', 'sepia');
  assert.equal(getStoredTheme(), 'light');
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
  seedTwoScopedTags();
  applyTheme('dark');
  assert.equal(themeColorTags().length, 1, 'exactly one tag should survive');
  assert.equal(themeColorTags()[0].getAttribute('content'), '#0F1115');

  applyTheme('light');
  assert.equal(themeColorTags().length, 1);
  assert.equal(themeColorTags()[0].getAttribute('content'), '#FFFFFF');
});

test('an explicit choice leaves no media-scoped tag behind to contradict it', () => {
  // The bug this test exists for: index.html's light-scoped tag was being
  // handed a dark colour while its dark-scoped sibling still said dark, so a
  // traveller on a light OS who picked 다크 got a white status bar over a
  // black app. An explicit choice must not carry a media query at all.
  seedTwoScopedTags();
  assert.equal(themeColorTags().length, 2, 'the fixture is two scoped tags');
  applyTheme('dark');
  for (const tag of themeColorTags()) {
    assert.equal(tag.getAttribute('media'), null, 'a surviving tag still has a media query');
  }
});

test('applying twice does not pile up tags', () => {
  seedTwoScopedTags();
  applyTheme('dark');
  applyTheme('light');
  applyTheme('dark');
  assert.equal(themeColorTags().length, 1);
});

test('setTheme persists the raw choice and applies it in the same call', () => {
  globalThis.localStorage.clear();
  attrs = {};
  const saved = setTheme('dark');
  assert.equal(saved, 'dark');
  assert.equal(globalThis.localStorage.getItem('bapchingu-theme'), 'dark');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
});

test('setTheme falls back to the default for anything it does not recognise', () => {
  globalThis.localStorage.clear();
  const saved = setTheme('sepia');
  assert.equal(saved, 'light');
  assert.equal(globalThis.localStorage.getItem('bapchingu-theme'), 'light');
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
