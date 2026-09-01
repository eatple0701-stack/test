import test from 'node:test';
import assert from 'node:assert/strict';
import { TABLE_VIEW, tableViewState, tableViewText, whoListText } from '../policy/loadState.js';

// Telling a failed lookup apart from an absence.
//
// On 2026-09-01, while the pilot was running, every read of `signups` came
// back 400 and the table page said:
//
//     이 밥상은 사라졌어요.
//
// about a table two people were sitting at. A traveller reading that would
// have concluded their dinner was cancelled and made other plans.
//
// The page had one branch — `if (!table)` — doing the work of three states:
// not loaded yet, could not load, and does not exist. It picked the worst of
// the three and asserted it.

test('a lookup that failed is not an absence', () => {
  assert.equal(tableViewState({ error: new Error('400'), table: null }), TABLE_VIEW.ERROR);
  // And it stays an error even if a stale table is still in hand — we do not
  // know whether it still exists, so we do not say.
  assert.equal(tableViewState({ error: new Error('400'), table: { id: 't' }, menu: { id: 'm' } }),
    TABLE_VIEW.ERROR);
});

test('an absence is only claimed when the database answered', () => {
  // `getTable` resolving to null is the database saying "there is nothing
  // here". That, and only that, earns the sentence.
  assert.equal(tableViewState({ error: null, table: null }), TABLE_VIEW.LOADING);
  assert.equal(tableViewState({ error: null, table: { id: 't' }, menu: null }), TABLE_VIEW.GONE);
  assert.equal(tableViewState({ error: null, table: { id: 't' }, menu: { id: 'm' } }), TABLE_VIEW.READY);
});

test('the two say different things — exactly two, and neither is the other', () => {
  // The reviewer's criterion. A failed read and a real absence must not be
  // able to render the same sentence.
  for (const locale of ['ko', 'both', 'en', 'ja']) {
    const err = tableViewText(TABLE_VIEW.ERROR, { locale });
    const gone = tableViewText(TABLE_VIEW.GONE, { locale });
    assert.notEqual(err.title, gone.title, `${locale}: the two states share a title`);
    assert.notEqual(err.body, gone.body, `${locale}: the two states share a body`);
    assert.equal(new Set([err.title, gone.title]).size, 2);
  }
});

test('the error sentence does not claim the table is gone', () => {
  // The specific words matter here: the reader's question is whether their
  // dinner is still happening, and the honest answer is "we do not know".
  const ko = tableViewText(TABLE_VIEW.ERROR, { locale: 'ko' });
  assert.doesNotMatch(ko.title, /사라졌|없어졌|취소/, 'the error sentence asserts an absence');
  assert.match(ko.body, /없어진 것이 아니라/, 'the error sentence does not say what is unknown');

  const en = tableViewText(TABLE_VIEW.ERROR, { locale: 'en' });
  assert.doesNotMatch(en.title, /no longer here|cancelled|gone/i);
  assert.match(en.body, /may well still be there/i);
});

test('only the recoverable one offers a retry', () => {
  assert.equal(tableViewText(TABLE_VIEW.ERROR).retry, true);
  assert.equal(tableViewText(TABLE_VIEW.GONE).retry, false, 'a table that is gone offers a pointless button');
  assert.equal(tableViewText(TABLE_VIEW.LOADING).retry, false);
});

test('every state has words in every language the app speaks', () => {
  // A missing translation falls back to English, which is invisible to an
  // English reader — the whole reason audit-i18n.mjs exists. This is the
  // same hazard in a file the audit cannot see, because these strings are
  // chosen by a policy rather than passed to say().
  for (const state of [TABLE_VIEW.ERROR, TABLE_VIEW.GONE, TABLE_VIEW.LOADING]) {
    const seen = new Set();
    for (const locale of ['ko', 'es', 'fr', 'ar', 'zh', 'ja', 'both']) {
      const said = tableViewText(state, { locale });
      assert.ok(said.title.length > 0, `${state}/${locale} has no title`);
      seen.add(said.title);
    }
    assert.ok(seen.size >= 6, `${state} says the same thing in ${8 - seen.size} languages`);
  }
});

test('an unreadable guest list says so rather than showing an empty one', () => {
  // The same mistake one place down. Rendering nothing would say "nobody has
  // taken a seat", which is a claim, and a failed read is not evidence for
  // it — that is exactly what the whole page did about the whole table.
  for (const locale of ['ko', 'en', 'ja']) {
    const line = whoListText({ locale });
    assert.ok(line.length > 0);
  }
  assert.match(whoListText({ locale: 'ko' }), /아무도 없다는 뜻은 아닙니다/);
  assert.match(whoListText({ locale: 'en' }), /does not mean nobody is/i);
});

test('a state nobody defined returns nothing rather than a wrong sentence', () => {
  // READY has no message: the page renders the table. Returning some default
  // sentence here would be a fifth way to tell somebody their dinner is off.
  assert.equal(tableViewText(TABLE_VIEW.READY), null);
  assert.equal(tableViewText('something else'), null);
});
