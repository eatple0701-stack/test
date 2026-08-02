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

test('no seeded theme can be degraded, and the reason is structural', () => {
  // street-food no longer fits this scenario: it now carries a second,
  // undegradable narrative (street-quick-bite, added below) specifically so
  // every()-vs-some() aggregation is testable, which means street-food is no
  // longer degraded under a gwangjang-only context (see 'a theme with a
  // clean playable narrative is not degraded, even when another is').
  //
  // Retargeting this scenario to a theme that genuinely has only one
  // narrative turns out to be impossible with the current catalog: temple-life
  // has one narrative (temple-half-day), but its only optional step
  // (temple-tea) is venue-less and self-attesting, so by design ("attestation
  // needs no venue", playable.js) it is always reachable and the narrative
  // can never be degraded. noodle-road has one narrative (noodle-origin), but
  // it has no optional step at all, so it too can never be degraded while
  // playable. Per the review finding's own instructions, that impossibility
  // is reported here rather than forced onto a theme that cannot actually
  // produce a playable-but-degraded verdict. This test is repurposed to
  // document exactly that: both remaining single-narrative themes are
  // structurally incapable of being playable-but-degraded.
  const templeLifeCtx = {
    at: new Date('2026-10-15'),
    admissiblePlaces: new Set(),
    availableEvents: new Set(),
  };
  const templeLife = assessTheme('temple-life', templeLifeCtx);
  assert.equal(templeLife.playable, false, 'temple-cuisine is unreachable, so the theme is unplayable, not merely degraded');

  const noodleRoadCtx = {
    at: new Date('2026-10-15'),
    admissiblePlaces: new Set(['osegyehyang']),
    availableEvents: new Set(),
  };
  const noodleRoad = assessTheme('noodle-road', noodleRoadCtx);
  assert.equal(noodleRoad.playable, true, 'jajangmyeon is reachable via an admissible restaurant');
  assert.equal(noodleRoad.degraded, false, 'noodle-origin has no optional step, so it can never be degraded');
});

test('a theme with a clean playable narrative is not degraded, even when another is', () => {
  // street-food has two narratives. With gwangjang offered but namdaemun
  // withheld: street-quick-bite is playable and clean (its one required step
  // is anchored to gwangjang and it has no optional steps), while
  // street-first-timer is playable but degraded (its optional market-alley
  // step needs namdaemun). A theme degrades only when NO clean path remains,
  // so this must report false. Aggregating with `some` would report true.
  const ctx = {
    at: new Date('2026-10-15'),
    admissiblePlaces: new Set(),
    availableEvents: new Set(['gwangjang']),
  };

  const quick = assessNarrative('street-quick-bite', ctx);
  assert.equal(quick.playable, true);
  assert.equal(quick.degraded, false, 'no optional steps means nothing to degrade');

  const full = assessNarrative('street-first-timer', ctx);
  assert.equal(full.playable, true);
  assert.equal(full.degraded, true, 'its optional market-alley step needs namdaemun');

  const theme = assessTheme('street-food', ctx);
  assert.equal(theme.playable, true);
  assert.equal(theme.degraded, false, 'a clean path exists, so the theme is not degraded');
});

test('a collection aggregates playability and degradation from its themes', () => {
  // autumn-in-seoul = street-food + temple-life.
  // With no restaurants admissible, temple-life is unplayable (its required
  // temple-cuisine step is restaurant-anchored) and street-food carries the
  // collection on its gwangjang-anchored narratives.
  const marketsOnly = {
    at: new Date('2026-10-15'),
    admissiblePlaces: new Set(),
    availableEvents: new Set(['gwangjang']),
  };
  const v = assessCollection('autumn-in-seoul', marketsOnly);
  assert.equal(v.playable, true, 'street-food alone keeps the collection playable');
  assert.equal(v.degraded, false, 'street-quick-bite is a clean path through street-food');
  assert.deepEqual(v.blockers, [], 'a playable collection reports no blockers');

  // Withhold the market too and nothing in the collection can run.
  const nothing = {
    at: new Date('2026-10-15'),
    admissiblePlaces: new Set(),
    availableEvents: new Set(),
  };
  const dead = assessCollection('autumn-in-seoul', nothing);
  assert.equal(dead.playable, false);
  assert.ok(dead.blockers.length > 0, 'an unplayable collection must explain why');
});

test('theme is not degraded when a clean playable narrative exists', () => {
  const v = assessTheme('temple-life', fullContext());
  assert.equal(v.playable, true);
  assert.equal(v.degraded, false);
});

test('a collection reports no degradation when its themes have clean paths', () => {
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
