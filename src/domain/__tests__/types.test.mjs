import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATUS, EXPERIENCE_KIND, COMPLETION_SOURCE, BLOCKER, isSurfaceable, emptyJourney } from '../types.js';

test('status vocabulary is complete', () => {
  assert.deepEqual(Object.values(STATUS).sort(), ['planned', 'preview', 'published', 'retired']);
});

test('preview and published surface; planned and retired do not', () => {
  assert.equal(isSurfaceable(STATUS.PUBLISHED), true);
  assert.equal(isSurfaceable(STATUS.PREVIEW), true);
  assert.equal(isSurfaceable(STATUS.PLANNED), false);
  assert.equal(isSurfaceable(STATUS.RETIRED), false);
});

test('experience kinds cover the four authoring shapes', () => {
  assert.deepEqual(Object.values(EXPERIENCE_KIND).sort(), ['dish', 'place', 'ritual', 'setting']);
});

test('completion sources are the three seeded strategies', () => {
  assert.deepEqual(
    Object.values(COMPLETION_SOURCE).sort(),
    ['event-attendance', 'place-visit', 'self-attest'],
  );
});

test('blocker kinds are named', () => {
  assert.equal(BLOCKER.MISSING_VENUE, 'missing-venue');
  assert.equal(BLOCKER.OUT_OF_SEASON, 'out-of-season');
});

test('emptyJourney returns four independent empty sets', () => {
  const a = emptyJourney();
  const b = emptyJourney();
  a.visitedRestaurantIds.add('balwoo');
  assert.equal(b.visitedRestaurantIds.size, 0, 'journeys must not share set instances');
  assert.equal(a.visitedMarketIds.size, 0);
  assert.equal(a.attestedExperienceIds.size, 0);
  assert.equal(a.companionIds.size, 0);
});
