import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeJourney } from '../../data/journey.js';
import { restaurants } from '../../data/restaurants.js';
import { journeyFromLegacy } from '../bridge/legacyJourney.js';
import { journeyProgress } from '../projection/journeyProgress.js';
import { experienceById, experienceIdsOfTheme, themes } from '../catalog/index.js';
import { experienceDone } from '../policy/completion.js';

/** The same legacy state, expressed for both engines. */
const scenario = {
  bookmarks: [
    { id: 'balwoo', savedAt: 1, visitedAt: 2 },
    { id: 'osegyehyang', savedAt: 1, visitedAt: 3 },
    { id: 'sanchon', savedAt: 1, visitedAt: null },
  ],
  markets: ['gwangjang'],
  companions: [{ travelerId: 't1', matchedAt: 4 }],
};

const legacyInput = () => ({
  visitedPlaces: scenario.bookmarks
    .filter(b => b.visitedAt !== null)
    .map(b => restaurants.find(r => r.id === b.id))
    .filter(Boolean),
  markets: scenario.markets,
  companions: scenario.companions,
});

test('both engines agree on how many restaurants were visited', () => {
  const legacy = computeJourney(legacyInput());
  const journey = journeyFromLegacy(scenario);
  assert.equal(
    legacy.foodCount, journey.visitedRestaurantIds.size,
    'the bridge must not drop or invent a visit',
  );
});

test('both engines agree that a market was visited', () => {
  const legacy = computeJourney(legacyInput());
  const journey = journeyFromLegacy(scenario);
  assert.equal(legacy.marketCount, journey.visitedMarketIds.size);
});

test('both engines agree on companions met', () => {
  const legacy = computeJourney(legacyInput());
  const journey = journeyFromLegacy(scenario);
  assert.equal(legacy.companionCount, journey.companionIds.size);
});

test('a visit recorded by the legacy engine completes the matching experience', () => {
  const journey = journeyFromLegacy(scenario);
  assert.equal(
    experienceDone(experienceById('temple-cuisine'), journey), true,
    'balwoo was visited, so temple-cuisine must read as done in the new model',
  );
  assert.equal(experienceDone(experienceById('jajangmyeon'), journey), true);
});

test('the new projection never reports more done than the theme contains', () => {
  const p = journeyProgress(journeyFromLegacy(scenario));
  for (const t of p.themes) {
    assert.ok(t.done <= t.total, `${t.themeId} reports ${t.done}/${t.total}`);
    assert.ok(t.pct >= 0 && t.pct <= 100, `${t.themeId} pct out of range`);
  }
});

test('every catalogued theme appears in the projection', () => {
  const p = journeyProgress(journeyFromLegacy(scenario));
  assert.equal(p.themes.length, themes.length);
});

test('experiencesCompleted equals the sum of per-theme done counts', () => {
  const journey = journeyFromLegacy(scenario);
  const p = journeyProgress(journey);
  const summed = p.themes.reduce((n, t) => n + t.done, 0);
  assert.equal(p.experiencesCompleted, summed);
});

test('an experience shared by two themes is counted in both', () => {
  const journey = journeyFromLegacy(scenario);
  journey.attestedExperienceIds.add('makgeolli');
  const p = journeyProgress(journey);
  const street = p.themes.find(t => t.themeId === 'street-food');
  const noodle = p.themes.find(t => t.themeId === 'noodle-road');
  assert.ok(experienceIdsOfTheme('street-food').includes('makgeolli'));
  assert.ok(experienceIdsOfTheme('noodle-road').includes('makgeolli'));
  assert.ok(street.done >= 1 && noodle.done >= 1, 'shared experience must count in both themes');
});
