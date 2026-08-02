import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENDERS, isGender, cleanGender, tableIncludesGender } from '../catalog/genders.js';

test('the vocabulary is fixed and self-declared, not a scale', () => {
  assert.deepEqual(GENDERS, ['Woman', 'Man', 'Non-binary']);
});

test('isGender only recognises the catalog values', () => {
  assert.equal(isGender('Woman'), true);
  assert.equal(isGender('woman'), false, 'case must match exactly, like LANGUAGES');
  assert.equal(isGender('teach-me-taekwondo'), false);
  assert.equal(isGender(null), false);
});

test('cleanGender drops anything the catalog does not know, keeps unset as null', () => {
  assert.equal(cleanGender('Woman'), 'Woman');
  assert.equal(cleanGender('nonsense'), null);
  assert.equal(cleanGender(null), null);
  assert.equal(cleanGender(undefined), null);
});

test('tableIncludesGender checks the host and every signup', () => {
  const table = { hostGender: 'Man' };
  assert.equal(tableIncludesGender(table, [], 'Woman'), false, 'no woman at this table yet');
  assert.equal(
    tableIncludesGender(table, [{ gender: 'Woman' }], 'Woman'),
    true,
    'a guest declared it even though the host did not',
  );
  assert.equal(
    tableIncludesGender({ hostGender: 'Woman' }, [], 'Woman'),
    true,
    'the host counts as attending their own table',
  );
});

test('no preference means every table qualifies', () => {
  // Mirrors matchRequest's isEmptyRequest pattern: "I have no preference" must
  // not silently become "I only want tables with nobody on them".
  assert.equal(tableIncludesGender({ hostGender: 'Man' }, [], null), true);
  assert.equal(tableIncludesGender({ hostGender: 'Man' }, [], undefined), true);
});

test('unset gender on the host or a guest never matches a stated preference', () => {
  assert.equal(tableIncludesGender({ hostGender: null }, [{ gender: null }], 'Woman'), false);
});
