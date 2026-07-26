import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessNarrative, assessTheme, assessCollection } from '../capability/playable.js';
import { markersOfExperience, markersOfTheme, markersOfCollection } from '../capability/mappable.js';
import { BLOCKER } from '../types.js';

const fullContext = () => ({
  at: new Date('2026-10-15'),
  admissiblePlaces: new Set(['balwoo', 'sanchon', 'maji', 'osegyehyang', 'gonghwachun']),
  availableEvents: new Set(['gwangjang', 'namdaemun', 'sinpo']),
});

test('a narrative whose required anchors are available is playable', () => {
  const v = assessNarrative('temple-half-day', fullContext());
  assert.equal(v.playable, true);
  assert.deepEqual(v.blockers, []);
});

test('a narrative becomes unplayable when a required venue is inadmissible', () => {
  const ctx = fullContext();
  ctx.admissiblePlaces = new Set();
  const v = assessNarrative('temple-half-day', ctx);
  assert.equal(v.playable, false);
  assert.equal(v.blockers[0].kind, BLOCKER.MISSING_VENUE);
  assert.equal(v.blockers[0].ref, 'temple-cuisine');
});

test('required market-anchored steps block when no events are available', () => {
  const ctx = fullContext();
  ctx.availableEvents = new Set();
  const v = assessNarrative('street-first-timer', ctx);
  assert.equal(v.playable, false);
  const refs = v.blockers.map(b => b.ref).sort();
  assert.deepEqual(refs, ['bindaetteok', 'gwangjang-market'], 'both required market steps block');
  for (const b of v.blockers) assert.equal(b.kind, BLOCKER.MISSING_VENUE);
});

test('an optional venue-less step never blocks, because attestation needs no venue', () => {
  const ctx = fullContext();
  ctx.availableEvents = new Set();
  const v = assessNarrative('street-first-timer', ctx);
  assert.equal(
    v.blockers.some(b => b.ref === 'makgeolli'), false,
    'makgeolli is optional and venue-less, so it can never be a blocker',
  );
});

test('a restaurant-anchored step is unplayable when its venues are inadmissible', () => {
  const ctx = fullContext();
  ctx.admissiblePlaces = new Set();
  const v = assessNarrative('noodle-origin', ctx);
  assert.equal(v.playable, false, 'jajangmyeon is anchored to restaurants only');
  assert.equal(v.blockers[0].ref, 'jajangmyeon');
});

test('a theme is playable when any of its narratives is', () => {
  assert.equal(assessTheme('temple-life', fullContext()).playable, true);
});

test('a collection is playable when any of its themes is', () => {
  assert.equal(assessCollection('first-timers-seoul', fullContext()).playable, true);
});

test('an empty context makes everything unplayable rather than throwing', () => {
  const ctx = { at: new Date(), admissiblePlaces: new Set(), availableEvents: new Set() };
  assert.equal(assessTheme('temple-life', ctx).playable, false);
  assert.equal(assessCollection('autumn-in-seoul', ctx).playable, false);
});

test('markers carry parent context so back-navigation ascends', () => {
  const markers = markersOfExperience('temple-cuisine');
  assert.equal(markers.length, 3);
  for (const m of markers) {
    assert.equal(m.kind, 'restaurant');
    assert.equal(m.parentContext.experienceId, 'temple-cuisine');
    assert.equal(m.parentContext.themeId, 'temple-life');
  }
});

test('market-anchored experiences produce market markers', () => {
  const markers = markersOfExperience('gwangjang-market');
  assert.equal(markers.length, 1);
  assert.equal(markers[0].kind, 'market');
  assert.equal(markers[0].id, 'gwangjang');
});

test('a venue-less experience produces no markers', () => {
  assert.deepEqual(markersOfExperience('makgeolli'), []);
});

test('theme and collection markers aggregate their children without duplicates', () => {
  const themeMarkers = markersOfTheme('temple-life');
  assert.equal(themeMarkers.length, 3);
  const collectionMarkers = markersOfCollection('autumn-in-seoul');
  const keys = collectionMarkers.map(m => `${m.kind}:${m.id}`);
  assert.equal(new Set(keys).size, keys.length, 'markers must be de-duplicated');
});
