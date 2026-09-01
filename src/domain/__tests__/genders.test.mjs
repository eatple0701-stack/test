import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENDERS, isGender, cleanGender, tableIncludesGender , tableShowsWoman } from '../catalog/genders.js';

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

test('the women filter matches a woman hosting, and not a woman going', () => {
  // Narrower than tableIncludesGender on purpose, and the narrowing is a
  // privacy decision. The number of people at each table is public
  // (public.seat_holds()), so if this matched on a guest, a one-guest table in
  // the results would say that guest is a woman — the inference the has_woman
  // column was rejected for, returning through the side door.
  assert.equal(tableShowsWoman({ hostGender: 'Woman' }), true);
  assert.equal(tableShowsWoman({ hostGender: 'Man' }), false);
  assert.equal(tableShowsWoman({ hostGender: null }), false);
  assert.equal(tableShowsWoman({}), false);
  assert.equal(tableShowsWoman(null), false);
});

test('the women filter misses matches rather than inventing them', () => {
  // The cost of the decision above, pinned so it is a choice somebody makes
  // again rather than a regression: a table hosted by a man where a woman is
  // already going does not match. The general question still has an answer —
  // tableIncludesGender — it is simply not the one the filter asks.
  const table = { hostGender: 'Man' };
  const womanGoing = [{ gender: 'Woman' }];
  assert.equal(tableIncludesGender(table, womanGoing, 'Woman'), true, 'the general rule changed');
  assert.equal(tableShowsWoman(table), false,
    'the filter matched on a guest — crossing it with seat counts would name her');
});
