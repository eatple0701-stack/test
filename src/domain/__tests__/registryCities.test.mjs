import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  REGISTRY_CITIES, cityOfAddress, cityOfId, isRegistryId, registryIdOf, registryNumberOf,
} from '../policy/registryCity.js';
import { placeFromRegistry, isRegistryPlace, DISTRICT_EN } from '../../data/registry.js';
import { DISH_IDS } from '../catalog/dishGroups.js';

// Two registers in one app, since 2026-09-14: 서울관광재단's 8,118 and
// 인천관광공사's 2,854. Everything here is about what stops the two from being
// taken for each other.
//
// The one that would have bitten first is the ids. They overlap — 22482 is
// 태화원 in 인천 차이나타운 and a different restaurant in Seoul's register — so
// a place id has to carry its city or one of them quietly becomes the other:
// on the map, in a saved bookmark, in a shared link, in a table opened at
// "that" restaurant.

const read = (p) => JSON.parse(fs.readFileSync(path.join(process.cwd(), p), 'utf8'));
const cityIndex = (city) => read(`public/data/${city}/index.json`);
const cityRows = (city) => cityIndex(city).districts
  .flatMap(d => read(`public/data/${city}/${d.slug}.json`).rows);

const rowsOf = Object.fromEntries(REGISTRY_CITIES.map(city => [city, cityRows(city)]));

/**
 * Where each city's dots are allowed to be. The same boxes the two builds
 * filter on — 인천's is generous westward because 옹진군 reaches 백령도 at
 * 124.7°E, which is further from 중구 than 중구 is from Seoul.
 */
const BOX = {
  seoul: { s: 37.41, n: 37.72, w: 126.76, e: 127.20 },
  incheon: { s: 36.9, n: 38.05, w: 124.5, e: 126.95 },
};

test('both registers are built, and each index counts what its files hold', () => {
  for (const city of REGISTRY_CITIES) {
    const index = cityIndex(city);
    assert.ok(index.districts.length > 0, `${city} has no districts`);
    assert.ok(index.source, `${city} does not say where it came from`);
    for (const d of index.districts) {
      const file = read(`public/data/${city}/${d.slug}.json`);
      assert.equal(file.rows.length, d.count,
        `${city}/${d.slug} holds ${file.rows.length} rows and the index claims ${d.count}`);
      assert.equal(file.gu, d.gu);
    }
    assert.equal(rowsOf[city].length, index.total,
      `${city}: the total is not the sum of its districts`);
  }
});

test('a city is read off an address, and nothing else is filed as one', () => {
  assert.equal(cityOfAddress('서울특별시 종로구 인사동길 30-21'), 'seoul');
  assert.equal(cityOfAddress('인천광역시 중구 차이나타운로59번길 10'), 'incheon');
  assert.equal(cityOfAddress('부산광역시 중구 광복로 1'), null);
  assert.equal(cityOfAddress(''), null);
  assert.equal(cityOfAddress(null), null);
});

test('every row in both registers names its own city', () => {
  for (const city of REGISTRY_CITIES) {
    for (const r of rowsOf[city]) {
      assert.equal(cityOfAddress(r.a), city,
        `${city}: ${r.n} (${r.i}) has an address that does not name it — ${r.a}`);
    }
  }
});

test('the same number in the two registers is two different places', () => {
  const seoul = new Set(rowsOf.seoul.map(r => r.i));
  const shared = rowsOf.incheon.filter(r => seoul.has(r.i));
  assert.ok(shared.length > 0,
    'the two registers no longer share a number, so this is no longer the guard it was written as');
  for (const r of shared) assert.equal(registryIdOf(r), `incheon-${r.i}`);
});

test('an id carries its city and can be read back', () => {
  assert.equal(registryIdOf({ i: 22482, a: '인천광역시 중구 차이나타운로59번길 10' }), 'incheon-22482');
  assert.equal(registryIdOf({ i: 22482, a: '서울특별시 중구 명동길 1' }), 'seoul-22482');
  assert.equal(registryIdOf({ i: 1, a: '' }), null, 'an address that names no city is not filed under one');
  assert.equal(cityOfId('incheon-22482'), 'incheon');
  assert.equal(registryNumberOf('incheon-22482'), '22482');
  assert.equal(cityOfId('balwoo'), null);
  assert.equal(registryNumberOf('balwoo'), null);
  assert.equal(isRegistryId('balwoo'), false);
  assert.equal(isRegistryId('seoul-1'), true);
  assert.equal(isRegistryId('incheon-1'), true);
});

test('a place keeps its own register: the id, the zone and the source line', () => {
  const incheon = placeFromRegistry(rowsOf.incheon[0], '2026-09-14');
  assert.ok(incheon.id.startsWith('incheon-'), `${incheon.id} is not an Incheon id`);
  assert.equal(isRegistryPlace(incheon), true);
  assert.match(incheon.zone, /, Incheon$/);
  assert.match(incheon.address.source, /인천관광공사/);

  const seoul = placeFromRegistry(rowsOf.seoul[0], '2026-09-14');
  assert.ok(seoul.id.startsWith('seoul-'), `${seoul.id} is not a Seoul id`);
  assert.match(seoul.zone, /, Seoul$/);
  assert.match(seoul.address.source, /서울관광재단/);
});

test('the 중구 in each city reads as a different zone', () => {
  const seoul = placeFromRegistry({ i: 1, n: 'x', a: '서울특별시 중구 명동길 1' });
  const incheon = placeFromRegistry({ i: 1, n: 'x', a: '인천광역시 중구 차이나타운로 1' });
  assert.equal(seoul.zone, 'Jung-gu, Seoul');
  assert.equal(incheon.zone, 'Jung-gu, Incheon');
  assert.notEqual(seoul.id, incheon.id);
});

test('a 군 is a district too', () => {
  // 강화군 and 옹진군 are Incheon's, and the Seoul-shaped `(\S+?구)` that read
  // districts before them would have filed both under the city alone.
  assert.equal(placeFromRegistry({ i: 1, n: 'x', a: '인천광역시 강화군 강화읍 1' }).zone, 'Ganghwa, Incheon');
  assert.equal(placeFromRegistry({ i: 1, n: 'x', a: '인천광역시 옹진군 백령면 1' }).zone, 'Ongjin, Incheon');
});

test('업태 means the same thing from either register', () => {
  const kind = (a, c) => placeFromRegistry({ i: 1, n: 'x', a, c }).category;
  assert.equal(kind('서울특별시 중구 1', '중국식'), 'korean-chinese');
  assert.equal(kind('인천광역시 중구 1', '중식'), 'korean-chinese',
    'Incheon writes 중식 for what Seoul writes 중국식, and a 차이나타운 place should not lose that');
  assert.equal(kind('인천광역시 중구 1', '중식,한식'), 'korean-chinese', 'the licence leads with the first');
  assert.equal(kind('인천광역시 중구 1', '베이커리,카페'), 'brunch-bakery');
  // Nothing a register says supports what the other categories promise.
  assert.equal(kind('인천광역시 중구 1', '한식'), 'local-seasonal');
  assert.equal(kind('인천광역시 중구 1', ''), 'local-seasonal');
});

test('every district in both registers has an English name, and none collides inside its city', () => {
  for (const city of REGISTRY_CITIES) {
    const seen = new Set();
    for (const d of cityIndex(city).districts) {
      assert.equal(DISTRICT_EN[d.gu], d.en, `${city}: ${d.gu} is not in DISTRICT_EN as ${d.en}`);
      assert.equal(seen.has(d.slug), false, `${city} files two districts as ${d.slug}`);
      seen.add(d.slug);
    }
  }
});

test('every row was kept for a dish the app can draw', () => {
  const known = new Set(DISH_IDS);
  for (const city of REGISTRY_CITIES) {
    for (const r of rowsOf[city]) {
      assert.ok(r.d?.length > 0, `${city}: ${r.n} (${r.i}) is on the list with no dish to show for it`);
      for (const id of r.d) {
        assert.ok(known.has(id), `${city}: ${r.n} is tagged ${id}, which no group in the app holds`);
      }
    }
  }
});

test('no dot is in the other city', () => {
  for (const city of REGISTRY_CITIES) {
    const box = BOX[city];
    for (const r of rowsOf[city]) {
      if (r.y === undefined || r.x === undefined) continue;
      assert.ok(r.y >= box.s && r.y <= box.n && r.x >= box.w && r.x <= box.e,
        `${city}: ${r.n} (${r.i}) is drawn at ${r.y}, ${r.x}`);
    }
  }
});

test('both builds match on one copy of the rules', async () => {
  // A second copy would drift, and the same restaurant would be on one city's
  // list and not the other's for a reason nobody could see.
  const seoulScript = fs.readFileSync(path.join(process.cwd(), 'scripts/dish-match.mjs'), 'utf8');
  const incheonScript = fs.readFileSync(path.join(process.cwd(), 'scripts/build-incheon-places.mjs'), 'utf8');
  assert.match(seoulScript, /from '\.\/lib\/dishes\.mjs'/);
  assert.match(incheonScript, /from '\.\/lib\/dishes\.mjs'/);

  const { DISH_GROUPS } = await import('../../../scripts/lib/dishes.mjs');
  const built = DISH_GROUPS.flatMap(g => g.dishes.map(d => d.id)).sort();
  assert.deepEqual(built, [...DISH_IDS].sort(),
    'the ids the builds tag rows with are not the ids the app knows how to group');
});
