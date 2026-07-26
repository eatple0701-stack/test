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

test('an unreachable optional step degrades a narrative without blocking it', () => {
  // Both required steps are anchored to gwangjang; market-alley is optional
  // and anchored only to namdaemun. Offering gwangjang alone therefore keeps
  // the narrative playable while leaving its optional step out of reach.
  const ctx = {
    at: new Date('2026-10-15'),
    admissiblePlaces: new Set(),
    availableEvents: new Set(['gwangjang']),
  };
  const v = assessNarrative('street-first-timer', ctx);
  assert.equal(v.playable, true, 'both required steps are reachable via gwangjang');
  assert.equal(v.degraded, true, 'market-alley needs namdaemun, which was withheld');
  assert.deepEqual(v.blockers, [], 'an optional step must never produce a blocker');
});

test('offering the optional step its own market clears the degradation', () => {
  const ctx = {
    at: new Date('2026-10-15'),
    admissiblePlaces: new Set(),
    availableEvents: new Set(['gwangjang', 'namdaemun']),
  };
  const v = assessNarrative('street-first-timer', ctx);
  assert.equal(v.playable, true);
  assert.equal(v.degraded, false, 'every step is reachable now');
});

test('a theme degrades when its only playable narrative is degraded', () => {
  const ctx = {
    at: new Date('2026-10-15'),
    admissiblePlaces: new Set(),
    availableEvents: new Set(['gwangjang']),
  };
  const v = assessTheme('street-food', ctx);
  assert.equal(v.playable, true);
  assert.equal(v.degraded, true);
});

test('a collection degrades only when no clean playable theme remains', () => {
  // street-food is playable-but-degraded; temple-life is unplayable because
  // no restaurants are admissible. The only playable theme is degraded, so
  // the collection is too -- this is the case a hardcoded false would miss.
  const degradedCtx = {
    at: new Date('2026-10-15'),
    admissiblePlaces: new Set(),
    availableEvents: new Set(['gwangjang']),
  };
  const degraded = assessCollection('autumn-in-seoul', degradedCtx);
  assert.equal(degraded.playable, true);
  assert.equal(degraded.degraded, true, 'collection must propagate, not hardcode false');

  // Readmitting the temple restaurants gives the collection a clean theme
  // again, so it is no longer degraded even though street-food still is.
  const cleanCtx = {
    at: new Date('2026-10-15'),
    admissiblePlaces: new Set(['balwoo', 'sanchon', 'maji']),
    availableEvents: new Set(['gwangjang']),
  };
  const clean = assessCollection('autumn-in-seoul', cleanCtx);
  assert.equal(clean.playable, true);
  assert.equal(clean.degraded, false, 'one clean playable theme is enough');
});

test('theme is not degraded when a clean playable narrative exists', () => {
  const v = assessTheme('temple-life', fullContext());
  assert.equal(v.playable, true);
  assert.equal(v.degraded, false);
});

test('collection propagates degradation rather than hardcoding false', () => {
  const v = assessCollection('first-timers-seoul', fullContext());
  assert.equal(v.playable, true);
  assert.equal(v.degraded, false, 'both themes have clean playable narratives');
});

test('theme markers de-duplicate a market shared by several experiences', () => {
  // gwangjang-market and bindaetteok both anchor to gwangjang.
  const markers = markersOfTheme('street-food');
  const gwangjang = markers.filter(m => m.kind === 'market' && m.id === 'gwangjang');
  assert.equal(gwangjang.length, 1, 'the shared market must appear exactly once');
  const keys = markers.map(m => `${m.kind}:${m.id}`);
  assert.equal(new Set(keys).size, keys.length);
});

test('markers carry the theme they were reached through, not an arbitrary one', () => {
  for (const m of markersOfTheme('street-food')) {
    assert.equal(
      m.parentContext.themeId, 'street-food',
      'a marker produced under street-food must ascend to street-food',
    );
  }
});
