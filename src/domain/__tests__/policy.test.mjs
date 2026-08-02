import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSurfaceableEntity, admissiblePlaceIds } from '../policy/visibility.js';
import {
  completionSources, experienceDone, narrativeDone, themeDone, themeExplored,
  themeCompletionKind, COMPLETION_KIND,
} from '../policy/completion.js';
import { canEnterDirectly, ancestryOfRestaurant } from '../policy/navigation.js';
import {
  experienceById, themes, experienceIdsOfTheme, narrativesOfTheme, hasAnchor,
} from '../catalog/index.js';
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

test('a market visit completes exactly the experiences anchored to that market', () => {
  const j = emptyJourney();
  j.visitedMarketIds.add('gwangjang');
  for (const id of ['gwangjang-market', 'bindaetteok']) {
    assert.equal(
      experienceDone(experienceById(id), j), true,
      `${id} is anchored to gwangjang and must complete on that visit`,
    );
  }
  assert.equal(
    experienceDone(experienceById('market-alley'), j), false,
    'market-alley is anchored to namdaemun, so a gwangjang visit must not complete it',
  );
  assert.equal(themeDone('street-food', j), true, 'both required steps are satisfied');

  j.visitedMarketIds.add('namdaemun');
  assert.equal(
    experienceDone(experienceById('market-alley'), j), true,
    'visiting its own market completes it',
  );
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
  // plant-cafe is a real, active restaurant that no experience anchors to.
  // camouflage used to serve this role until the late-night-table experience
  // claimed it.
  assert.equal(ancestryOfRestaurant('plant-cafe'), null);
});

// ---------------------------------------------------------------------------
// How a theme was finished — not the same question as whether it was.
// ---------------------------------------------------------------------------

test('a theme finished on somebody\'s own word says so', () => {
  // The tester's note — "I can just check through culture (skimming through)"
  // — is true of any theme still in preview, because nothing in it has a
  // verified venue and every experience therefore falls to attestation. The
  // answer is not to disbelieve them; it is to stop describing four taps in
  // the same words as four meals.
  const theme = themes.find(t => narrativesOfTheme(t.id).length > 0);
  const ids = experienceIdsOfTheme(theme.id).map(experienceById).filter(Boolean);
  const attestable = ids.filter(e => e.acceptsSelfAttest && !hasAnchor(e));

  if (attestable.length === 0) return; // nothing to assert on this catalog
  const journey = {
    visitedRestaurantIds: new Set(),
    visitedMarketIds: new Set(),
    attestedExperienceIds: new Set(attestable.map(e => e.id)),
  };
  if (!themeDone(theme.id, journey)) return;
  assert.equal(themeCompletionKind(theme.id, journey), COMPLETION_KIND.DECLARED);
});

test('a theme nobody finished has no kind at all', () => {
  const empty = {
    visitedRestaurantIds: new Set(), visitedMarketIds: new Set(),
    attestedExperienceIds: new Set(),
  };
  for (const t of themes) {
    assert.equal(themeCompletionKind(t.id, empty), null, `${t.id} claims a completion kind`);
  }
});

test('reaching a real place is never described as a declaration', () => {
  // The other direction, and the one that matters for anybody who actually
  // went: their evening must not be filed under "you said so".
  const withAnchor = themes
    .map(t => ({ t, anchored: experienceIdsOfTheme(t.id).map(experienceById)
      .filter(e => e && hasAnchor(e)) }))
    .find(x => x.anchored.length > 0);
  if (!withAnchor) return;

  const e = withAnchor.anchored[0];
  const journey = {
    visitedRestaurantIds: new Set(e.restaurantIds),
    visitedMarketIds: new Set(e.marketIds),
    attestedExperienceIds: new Set(),
  };
  if (!themeDone(withAnchor.t.id, journey)) return;
  assert.notEqual(themeCompletionKind(withAnchor.t.id, journey), COMPLETION_KIND.DECLARED);
});

test('the wrong journey shape reads as nothing done, not a crash', () => {
  // This app carries two things called "journey": the domain one with Sets,
  // and a legacy projection with counts. Handing the second to this policy
  // threw from inside .some() and took a whole tab down behind an error
  // boundary — which is how I broke the Passport while building the list of
  // finished cultures. Being wrong on one section beats being blank.
  const legacyShaped = { foodCount: 3, districtCount: 2, challenges: [], doneCount: 1 };
  for (const bad of [legacyShaped, {}, null, undefined, { visitedRestaurantIds: [] }]) {
    assert.doesNotThrow(() => experienceDone(experienceById('temple-tea'), bad));
    assert.equal(experienceDone(experienceById('temple-tea'), bad), false);
    for (const t of themes) {
      assert.doesNotThrow(() => themeCompletionKind(t.id, bad));
      assert.equal(themeCompletionKind(t.id, bad), null);
    }
  }
});
