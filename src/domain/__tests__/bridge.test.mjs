import { test } from 'node:test';
import assert from 'node:assert/strict';
import { journeyFromLegacy, readLegacyJourney, LEGACY_KEYS } from '../bridge/legacyJourney.js';

/** Minimal stand-in for the Storage interface. */
const fakeStorage = (entries) => ({
  getItem: (k) => (k in entries ? entries[k] : null),
});

test('only visited bookmarks become visited restaurants', () => {
  const j = journeyFromLegacy({
    bookmarks: [
      { id: 'balwoo', savedAt: 1, visitedAt: 2 },
      { id: 'sanchon', savedAt: 1, visitedAt: null },
    ],
  });
  assert.equal(j.visitedRestaurantIds.has('balwoo'), true);
  assert.equal(j.visitedRestaurantIds.has('sanchon'), false, 'saved-but-not-visited is not a visit');
});

test('legacy string bookmarks are tolerated and count as not visited', () => {
  const j = journeyFromLegacy({ bookmarks: ['balwoo'] });
  assert.equal(j.visitedRestaurantIds.size, 0);
});

test('markets and companions map across', () => {
  const j = journeyFromLegacy({
    markets: ['gwangjang', 'sinpo'],
    companions: [{ travelerId: 't3', matchedAt: 9 }],
  });
  assert.equal(j.visitedMarketIds.has('gwangjang'), true);
  assert.equal(j.companionIds.has('t3'), true);
});

test('attestations map across when present', () => {
  const j = journeyFromLegacy({ attestations: ['makgeolli'] });
  assert.equal(j.attestedExperienceIds.has('makgeolli'), true);
});

// Markets and attestations grew a timestamp so the Passport could show a trip
// in the order it happened. Anyone who used the app before that has bare id
// strings in localStorage, and their completed themes must not un-complete
// themselves on the next visit.
test('timestamped and bare-id entries both count as done', () => {
  const j = journeyFromLegacy({
    markets: [{ id: 'gwangjang', at: 1000 }, 'sinpo'],
    attestations: [{ id: 'makgeolli', at: 2000 }, 'temple-stay'],
  });
  assert.equal(j.visitedMarketIds.has('gwangjang'), true);
  assert.equal(j.visitedMarketIds.has('sinpo'), true);
  assert.equal(j.attestedExperienceIds.has('makgeolli'), true);
  assert.equal(j.attestedExperienceIds.has('temple-stay'), true);
});

test('entries with no usable id are dropped rather than stored as undefined', () => {
  const j = journeyFromLegacy({ markets: [null, {}, { at: 5 }], attestations: [42, { id: 7 }] });
  assert.equal(j.visitedMarketIds.size, 0);
  assert.equal(j.attestedExperienceIds.size, 0);
});

test('missing or malformed inputs degrade to an empty journey', () => {
  const j = journeyFromLegacy({});
  assert.equal(j.visitedRestaurantIds.size, 0);
  assert.equal(j.visitedMarketIds.size, 0);
  assert.equal(j.companionIds.size, 0);
  assert.equal(j.attestedExperienceIds.size, 0);

  const junk = journeyFromLegacy({ bookmarks: 'not-an-array', markets: 42, companions: null });
  assert.equal(junk.visitedRestaurantIds.size, 0);
  assert.equal(junk.visitedMarketIds.size, 0);
});

test('readLegacyJourney parses the real storage keys', () => {
  const storage = fakeStorage({
    [LEGACY_KEYS.BOOKMARKS]: JSON.stringify([{ id: 'balwoo', savedAt: 1, visitedAt: 2 }]),
    [LEGACY_KEYS.MARKETS]: JSON.stringify(['gwangjang']),
    [LEGACY_KEYS.COMPANIONS]: JSON.stringify([{ travelerId: 't1', matchedAt: 5 }]),
  });
  const j = readLegacyJourney(storage);
  assert.equal(j.visitedRestaurantIds.has('balwoo'), true);
  assert.equal(j.visitedMarketIds.has('gwangjang'), true);
  assert.equal(j.companionIds.has('t1'), true);
  assert.equal(j.attestedExperienceIds.size, 0, 'the attestation key does not exist yet');
});

test('readLegacyJourney survives corrupt JSON', () => {
  const j = readLegacyJourney(fakeStorage({ [LEGACY_KEYS.BOOKMARKS]: '{not json' }));
  assert.equal(j.visitedRestaurantIds.size, 0);
});

test('readLegacyJourney returns an empty journey when there is no storage', () => {
  const j = readLegacyJourney(null);
  assert.equal(j.visitedRestaurantIds.size, 0);
});
