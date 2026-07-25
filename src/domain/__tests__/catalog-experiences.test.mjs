import { test } from 'node:test';
import assert from 'node:assert/strict';
import { experiences, experienceById } from '../catalog/experiences.js';
import { STATUS, EXPERIENCE_KIND } from '../types.js';
import { restaurants } from '../../data/restaurants.js';
import { traditionalMarkets } from '../../data/experiences.js';

test('every experience id is unique', () => {
  const ids = experiences.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every restaurantId refers to a real restaurant', () => {
  const known = new Set(restaurants.map(r => r.id));
  for (const e of experiences) {
    for (const id of e.restaurantIds) {
      assert.ok(known.has(id), `${e.id} references unknown restaurant ${id}`);
    }
  }
});

test('every marketId refers to a real market', () => {
  const known = new Set(traditionalMarkets.map(m => m.id));
  for (const e of experiences) {
    for (const id of e.marketIds) {
      assert.ok(known.has(id), `${e.id} references unknown market ${id}`);
    }
  }
});

test('every experience carries a mission and cultural prose', () => {
  for (const e of experiences) {
    assert.ok(e.mission.title.length > 0, `${e.id} missing mission title`);
    assert.ok(e.mission.detail.length > 0, `${e.id} missing mission detail`);
    assert.ok(e.whyItMatters.length > 0, `${e.id} missing whyItMatters`);
    assert.ok(e.culturalMeaning.length > 0, `${e.id} missing culturalMeaning`);
    assert.ok(e.whenToExperience.length > 0, `${e.id} missing whenToExperience`);
  }
});

test('kind and status use the shared vocabulary', () => {
  const kinds = new Set(Object.values(EXPERIENCE_KIND));
  const statuses = new Set(Object.values(STATUS));
  for (const e of experiences) {
    assert.ok(kinds.has(e.kind), `${e.id} has invalid kind ${e.kind}`);
    assert.ok(statuses.has(e.status), `${e.id} has invalid status ${e.status}`);
  }
});

test('seed covers place-anchored, market-anchored and venue-less experiences', () => {
  assert.ok(experiences.some(e => e.restaurantIds.length > 0), 'need a place-anchored experience');
  assert.ok(experiences.some(e => e.marketIds.length > 0), 'need a market-anchored experience');
  assert.ok(
    experiences.some(e => e.restaurantIds.length === 0 && e.marketIds.length === 0 && e.acceptsSelfAttest),
    'need a venue-less experience completable by self-attestation',
  );
});

test('a venue-less experience must accept self-attestation or it can never complete', () => {
  for (const e of experiences) {
    if (e.restaurantIds.length === 0 && e.marketIds.length === 0) {
      assert.equal(e.acceptsSelfAttest, true, `${e.id} has no anchor and no self-attest route`);
    }
  }
});

test('experienceById finds a known record and returns undefined otherwise', () => {
  assert.equal(experienceById('temple-cuisine').id, 'temple-cuisine');
  assert.equal(experienceById('nope'), undefined);
});
