import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSurfaceableEntity, admissiblePlaceIds } from '../policy/visibility.js';
import {
  completionSources, experienceDone, narrativeDone, themeDone, themeExplored,
} from '../policy/completion.js';
import { canEnterDirectly, ancestryOfRestaurant } from '../policy/navigation.js';
import { experienceById } from '../catalog/index.js';
import { emptyJourney, STATUS } from '../types.js';

test('quarantined restaurants are never admissible', () => {
  const ids = admissiblePlaceIds();
  assert.ok(ids.has('balwoo'), 'active restaurant must be admissible');
  assert.equal(ids.has('makan'), false, 'quarantined restaurant must be excluded');
  assert.equal(ids.has('akiya'), false, 'quarantined restaurant must be excluded');
});

test('preview and published entities surface; planned does not', () => {
  assert.equal(isSurfaceableEntity({ status: STATUS.PUBLISHED }), true);
  assert.equal(isSurfaceableEntity({ status: STATUS.PREVIEW }), true);
  assert.equal(isSurfaceableEntity({ status: STATUS.PLANNED }), false);
});

test('the registry seeds three sources', () => {
  assert.deepEqual(
    completionSources.map(s => s.id).sort(),
    ['event-attendance', 'place-visit', 'self-attest'],
  );
});

test('an experience is not done on an empty journey', () => {
  assert.equal(experienceDone(experienceById('temple-cuisine'), emptyJourney()), false);
});

test('visiting any one linked restaurant completes a place-anchored experience', () => {
  const j = emptyJourney();
  j.visitedRestaurantIds.add('sanchon');
  assert.equal(experienceDone(experienceById('temple-cuisine'), j), true);
});

test('visiting a linked market completes a market-anchored experience', () => {
  const j = emptyJourney();
  j.visitedMarketIds.add('gwangjang');
  assert.equal(experienceDone(experienceById('gwangjang-market'), j), true);
});

test('self-attestation completes a venue-less experience', () => {
  const j = emptyJourney();
  j.attestedExperienceIds.add('makgeolli');
  assert.equal(experienceDone(experienceById('makgeolli'), j), true);
});

test('self-attestation does not complete an experience that has anchors', () => {
  const j = emptyJourney();
  j.attestedExperienceIds.add('temple-cuisine');
  assert.equal(
    experienceDone(experienceById('temple-cuisine'), j), false,
    'an anchored experience must be completed through its anchor',
  );
});

test('attestation is refused for an anchored experience even if it opts in', () => {
  // The guarantee must come from the policy, not from catalog-authoring
  // convention: a record that both carries an anchor and sets the flag must
  // still refuse attestation.
  const contrived = {
    id: 'contrived-anchored',
    restaurantIds: ['balwoo'],
    marketIds: [],
    acceptsSelfAttest: true,
  };
  const j = emptyJourney();
  j.attestedExperienceIds.add('contrived-anchored');
  assert.equal(
    experienceDone(contrived, j), false,
    'having an anchor must veto the attestation route',
  );

  j.visitedRestaurantIds.add('balwoo');
  assert.equal(
    experienceDone(contrived, j), true,
    'the same record completes normally through its anchor',
  );
});

test('a narrative completes when its required steps are done, ignoring optional ones', () => {
  const j = emptyJourney();
  j.visitedRestaurantIds.add('balwoo');
  assert.equal(narrativeDone('temple-half-day', j), true, 'optional temple-tea must not block');
});

test('a theme completes when any one of its narratives completes', () => {
  const j = emptyJourney();
  j.visitedRestaurantIds.add('balwoo');
  assert.equal(themeDone('temple-life', j), true);
  assert.equal(themeDone('street-food', j), false);
});

test('a theme is explored as soon as any of its experiences is done', () => {
  const j = emptyJourney();
  // makgeolli belongs to street-food but is only an optional step of its
  // narrative, so attesting it explores the theme without completing it.
  j.attestedExperienceIds.add('makgeolli');
  assert.equal(themeExplored('street-food', j), true);
  assert.equal(themeDone('street-food', j), false, 'exploring is not completing');
});

test('one market visit completes every experience anchored to that market', () => {
  const j = emptyJourney();
  j.visitedMarketIds.add('gwangjang');
  for (const id of ['gwangjang-market', 'bindaetteok', 'market-alley']) {
    assert.equal(
      experienceDone(experienceById(id), j), true,
      `${id} is anchored to gwangjang and must complete on that visit`,
    );
  }
  assert.equal(themeDone('street-food', j), true, 'both required steps are satisfied');
});

test('restaurant is the single entity that cannot be entered directly', () => {
  assert.equal(canEnterDirectly('collection'), true);
  assert.equal(canEnterDirectly('theme'), true);
  assert.equal(canEnterDirectly('narrative'), true);
  assert.equal(canEnterDirectly('experience'), true);
  assert.equal(canEnterDirectly('restaurant'), false);
});

test('every reachable restaurant resolves to an experience and theme ancestor', () => {
  const a = ancestryOfRestaurant('balwoo');
  assert.equal(a.experienceId, 'temple-cuisine');
  assert.equal(a.themeId, 'temple-life');
});

test('a restaurant in no experience has no ancestry', () => {
  assert.equal(ancestryOfRestaurant('camouflage'), null);
});
