import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { placeFromRegistry, isRegistryPlace, REGISTRY_PREFIX } from '../../data/seoulRegistry.js';
import { restaurants } from '../../data/restaurants.js';

// 167,659 places from a public register, sitting in the same list as twenty
// places somebody wrote about. These tests are about the seam.
//
// The bug they exist for was real and shipped for about twenty minutes:
// RestaurantDetail builds most of its page from `getCulture(restaurant)`,
// and a register row's category is derived mechanically from its 업태 field.
// So 치보치마 — an address nobody here has visited — rendered "The best items
// sell out before noon", "One drink buys the seat", a Passport mission about
// what came out of the oven this morning, and a walking route to Gwangjang
// Market. All of it generated for that address by a category lookup, and all
// of it reading as though somebody had checked.

const DIR = path.join(process.cwd(), 'public/data/seoul');
const rows = JSON.parse(fs.readFileSync(path.join(DIR, 'Jongno.json'), 'utf8')).rows;
const sample = rows.slice(0, 400).map(r => placeFromRegistry(r, '2026-08-15'));

test('a register row is never mistaken for a curated place', () => {
  for (const p of sample) assert.equal(isRegistryPlace(p), true);
  for (const r of restaurants) {
    assert.equal(isRegistryPlace(r), false, `${r.id} is one of the twenty and must not read as registry`);
    assert.equal(r.id.startsWith(REGISTRY_PREFIX), false);
  }
});

test('every fact says a source states it, and none says we confirmed it', () => {
  // `confirmed` is what the twenty carry after somebody checked two map
  // services on a named date. Nothing imported may claim it.
  for (const p of sample) {
    for (const key of ['coordinates', 'address', 'hours', 'phone']) {
      const fact = p[key];
      if (!fact) continue;
      assert.equal(fact.confidence, 'reported', `${p.id}.${key} claims ${fact.confidence}`);
      assert.match(fact.source, /서울관광재단/);
    }
  }
});

test('a register row carries no story, and no substitute for one', () => {
  // The register's own 소개문 is a mail-merge — "X는 서울특별시 Y구에
  // 있습니다. 가장 가까운 지하철역은 Z역입니다." — for all 167,659 rows.
  // Putting that in `story` would be this app's first invented sentence.
  for (const p of sample) {
    for (const k of ['story', 'storyKo', 'storyEs', 'storyFr', 'storyAr', 'storyZh', 'storyJa']) {
      assert.equal(p[k], null, `${p.id} has a ${k}`);
    }
    for (const k of ['vibe', 'vibeKo', 'vibeJa']) assert.equal(p[k], '');
    assert.equal(p.esg_point, null);
  }
});

test('a register row claims nothing about diet', () => {
  // Every dietary chip in this app matches on evidence only, so an empty
  // record is the difference between "we do not know" and a promise.
  for (const p of sample) {
    assert.deepEqual(p.dietary, {});
    assert.deepEqual(p.traits, []);
  }
});

test('the fields every screen reads unconditionally are present', () => {
  // App.jsx filters on `traits` and searches `vibe` and `zone`; the list
  // sorts on coordinates. A missing one of these is a white screen, not a
  // gap on a card.
  for (const p of sample) {
    assert.equal(typeof p.name, 'string');
    assert.equal(typeof p.zone, 'string');
    assert.ok(Array.isArray(p.traits));
    assert.equal(typeof p.vibe, 'string');
    // A row with no usable position keeps everything but the coordinate.
    // coordsOf() is null-safe and formatDistance() renders '' for it, so the
    // card shows no distance rather than NaN.
    if (p.coordinates) {
      assert.ok(Number.isFinite(p.coordinates.value.lat));
      assert.ok(Number.isFinite(p.coordinates.value.lng));
    }
  }
});

test('the detail sheet cannot fall through to the curated one', () => {
  // The guard is a single early return, and it is the whole fix. If this
  // line moves below anything that reads getCulture(), the invented page
  // comes back.
  const src = fs.readFileSync(path.join(process.cwd(), 'src/components/RestaurantDetail.jsx'), 'utf8');
  const guard = src.indexOf('if (isRegistryPlace(restaurant))');
  const culture = src.indexOf('getCulture(restaurant)');
  assert.ok(guard > 0, 'RestaurantDetail no longer branches on isRegistryPlace');
  assert.ok(guard < culture, 'the registry branch must come before getCulture is read');
});

test('a district maps to a zone, and an unknown one does not invent a neighbourhood', () => {
  const zones = new Set(sample.map(p => p.zone));
  // All 25 districts now, because the whole register is loaded and a place
  // in 노원구 must not be filed as an unnamed 'Seoul'.
  for (const z of zones) assert.match(z, /^[A-Za-z-]+, Seoul$|^Seoul$/);
  assert.ok(zones.has('Jongno, Seoul'));
  const nowhere = placeFromRegistry({ i: 1, n: 'X', a: '경기도 어딘가', y: 37.5, x: 127 });
  assert.equal(nowhere.zone, 'Seoul', 'an address outside the five districts stays vague rather than guessing');
});
