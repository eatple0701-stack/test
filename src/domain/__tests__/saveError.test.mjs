import test from 'node:test';
import assert from 'node:assert/strict';
import { saveError, saveErrorText, SAVE_ERROR_IDS, SAVE_FALLBACK } from '../policy/saveError.js';
import { friendlyError } from '../../data/tableMapping.js';

// The four sentences friendlyError can produce, generated from friendlyError
// itself rather than copied — so if somebody edits one of its strings, this
// test fails instead of the app quietly falling back to "that did not save".
const FROM_MAPPING = [
  { error: { message: 'table_full' }, id: 'full' },
  { error: { message: 'duplicate key value violates unique constraint' }, id: 'duplicate' },
  { error: { message: 'table_not_found' }, id: 'gone' },
  { error: { message: 'some unknown postgres thing' }, id: 'network' },
];

test('every sentence the data layer produces is recognised', () => {
  for (const { error, id } of FROM_MAPPING) {
    const english = friendlyError(error);
    assert.equal(saveError(english).id, id, `"${english}" should map to ${id}`);
  }
});

test('raw database signals work too, in case a caller stops translating', () => {
  assert.equal(saveError({ code: '42501' }).id, 'denied');
  assert.equal(saveError({ message: 'new row violates row-level security policy' }).id, 'denied');
  assert.equal(saveError('Failed to fetch').id, 'network');
  assert.equal(saveError(new Error('Photos are not switched on for this project yet.')).id, 'photos-off');
});

test('nothing reaches the screen in English only', () => {
  for (const id of SAVE_ERROR_IDS) {
    const sample = { full: 'table_full', duplicate: 'duplicate key', gone: 'table_not_found',
      denied: '42501', 'photos-off': 'bucket', network: 'Failed to fetch', unknown: 'zzz' }[id];
    const e = saveError(sample);
    assert.match(e.kr, /[가-힣]/, `${id} has no Korean`);
    assert.ok(e.en.trim().length > 0, `${id} has no English`);
  }
});

test('the fallback admits it does not know, rather than inventing a cause', () => {
  const e = saveError('something nobody has seen');
  assert.equal(e.id, SAVE_FALLBACK.id);
  // It must not claim the connection was the problem when it has no idea.
  assert.ok(!/connection|인터넷/i.test(`${e.kr} ${e.en}`));
  assert.equal(e.raw, 'something nobody has seen');
});

test('null stays null so `{error && …}` keeps working', () => {
  assert.equal(saveError(null), null);
  assert.equal(saveError(undefined), null);
  assert.equal(saveErrorText(null), null);
});

test('the raw text is carried but never shown', () => {
  assert.ok(!saveErrorText({ code: '42501' }).includes('42501'));
  assert.equal(saveError({ code: '42501' }).raw, '42501');
});
