import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { placesInView, asPlace, MIN_ZOOM, NEAR_DISTRICTS } from '../../data/nearbyPlaces.js';
import { DISH_IDS } from '../catalog/dishGroups.js';

// The register, filtered to the app's premise and split into 25 district
// files by scripts/build-seoul-places.mjs. Of 167,659 restaurants, 8,118
// serve one of the twenty-four dishes a person cannot order alone; the rest
// are cafes, burger counters and 김밥천국, and they are not here.
//
// The thing being protected is that the filter is real and legible: every
// row carries the dishes it was kept for, no row is here without one, and
// the app still fetches only the districts somebody looked at.

const DIR = path.join(process.cwd(), 'public/data/seoul');
const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const districtFiles = fs.readdirSync(DIR).filter(f => f !== 'index.json');
const loadDistrict = (slug) => JSON.parse(fs.readFileSync(path.join(DIR, `${slug}.json`), 'utf8'));

test('the index accounts for every row it ships', () => {
  assert.equal(index.total, 8118);
  const summed = index.districts.reduce((n, d) => n + d.count, 0);
  assert.equal(summed, index.total, 'the districts do not add up to the whole');
  assert.equal(districtFiles.length, index.districts.length);
});

test('every place is here because of a dish, and says which', () => {
  // This is the filter, asserted rather than trusted. A row without `d` is a
  // restaurant nobody can explain the presence of — which is how 159,541
  // cafes and burger counters would come back in through a build-script edit.
  const known = new Set(DISH_IDS);
  let checked = 0;
  for (const d of index.districts) {
    for (const r of loadDistrict(d.slug).rows) {
      assert.ok(Array.isArray(r.d) && r.d.length > 0, `${r.n} is here for no stated reason`);
      for (const dish of r.d) assert.ok(known.has(dish), `${r.n} carries unknown dish "${dish}"`);
      checked += 1;
    }
  }
  assert.equal(checked, index.total);
});

test('rows the register gave no coordinates for are kept, not dropped', () => {
  // 24 of them. They cannot be drawn or sorted by distance, but they serve
  // the dish and they are real restaurants; dropping them would hide a place
  // for a reason that has nothing to do with the food.
  assert.ok(index.withGeo < index.total, 'some rows have no coordinates');
  assert.equal(index.total - index.withGeo, 24);
  const jongno = loadDistrict('Jongno');
  const summedGeo = index.districts.reduce((n, d) => n + d.withGeo, 0);
  assert.ok(summedGeo === index.withGeo);
  assert.ok(jongno.rows.length === index.districts.find(d => d.slug === 'Jongno').count);
});

test('the index says where it came from, and no district file is huge', () => {
  assert.match(index.source, /서울관광재단/);
  assert.ok(index.builtAt, 'the build date is what tells somebody it is stale');
  for (const f of districtFiles) {
    const bytes = fs.statSync(path.join(DIR, f)).size;
    assert.ok(bytes < 3_000_000, `${f} is ${(bytes / 1e6).toFixed(1)}MB — too big for one fetch`);
  }
});

test('nothing this app refuses to print came along for the ride', () => {
  // The register carries prices and Naver review scores in neighbouring
  // endpoints. The rule against both predates this dataset, and an import
  // is exactly how a rule like that gets quietly dropped.
  const keys = new Set(loadDistrict('Jongno').rows.flatMap(Object.keys));
  for (const banned of ['price', 'p', 'grade', 'g', 'rating', 'r', 'score', 's']) {
    assert.equal(keys.has(banned), false, `the layer carries a "${banned}" field`);
  }
  assert.deepEqual([...keys].sort(), ['a', 'c', 'd', 'f', 'h', 'i', 'n', 't', 'x', 'y']);
});

test('the layer draws nothing until the map is close enough to read', () => {
  const layer = { rows: loadDistrict('Jongno').rows };
  const box = { north: 37.576, south: 37.570, east: 126.990, west: 126.982 };
  for (let z = 0; z < MIN_ZOOM; z += 1) {
    assert.equal(placesInView(layer, box, z).length, 0, `zoom ${z} should draw nothing`);
  }
  assert.ok(placesInView(layer, box, MIN_ZOOM).length > 0, 'and something at the threshold');
});

test('a viewport is capped, because Leaflet draws everything it is given', () => {
  // 종로구 alone holds 487, and a city-wide box reaches all of them. Handing
  // that many to Leaflet at once locks the thread on a phone.
  const layer = { rows: loadDistrict('Jongno').rows };
  const wide = { north: 37.70, south: 37.45, east: 127.20, west: 126.80 };
  assert.equal(placesInView(layer, wide, 16).length, 160, 'the default cap');
  assert.equal(placesInView(layer, wide, 16, 12).length, 12, 'and it is a parameter');
});

test('the cap samples across the viewport instead of taking the first rows', () => {
  // The rows are ordered by district and then by id, so "the first 160" at
  // city zoom was 160 dots inside one district and an empty map everywhere
  // else — a picture that reads as a claim about where the food in Seoul is.
  // Nobody would have seen it as a bug; it just looked like a map.
  const layer = { rows: loadDistrict('Gangnam').rows.filter(r => r.y !== undefined) };
  const wide = { north: 37.70, south: 37.45, east: 127.20, west: 126.80 };
  const shown = placesInView(layer, wide, 16, 40);
  assert.equal(shown.length, 40);
  // The last one drawn comes from the end of the district, not from row 40.
  const ids = layer.rows.map(r => r.i);
  assert.ok(ids.indexOf(shown[39].i) > 40, 'the cap is still truncating');
  // And every one of them is a real distinct row.
  assert.equal(new Set(shown.map(r => r.i)).size, 40);
});

test('a row with no coordinates is never placed on the map', () => {
  const layer = { rows: [{ i: 1, n: 'no geo', a: '' }, { i: 2, n: 'geo', y: 37.57, x: 126.98 }] };
  const box = { north: 90, south: -90, east: 180, west: -180 };
  const shown = placesInView(layer, box, 16);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].n, 'geo');
});

test('only what is inside the box comes back', () => {
  const layer = { rows: loadDistrict('Jongno').rows };
  const box = { north: 37.576, south: 37.570, east: 126.990, west: 126.982 };
  for (const p of placesInView(layer, box, 16)) {
    assert.ok(p.y >= box.south && p.y <= box.north, `${p.n} is outside the latitude range`);
    assert.ok(p.x >= box.west && p.x <= box.east, `${p.n} is outside the longitude range`);
  }
});

test('every district has a box the loader can measure distance to', () => {
  // The box is how the app decides which four files to fetch. A district
  // without one would either never load or always load.
  for (const d of index.districts) {
    if (d.withGeo === 0) continue;
    assert.ok(d.box, `${d.gu} has no bounding box`);
    assert.ok(d.box.s < d.box.n && d.box.w < d.box.e, `${d.gu}'s box is inside out`);
    assert.ok(d.box.s > 37.3 && d.box.n < 37.8, `${d.gu}'s box is not in Seoul`);
  }
  assert.ok(NEAR_DISTRICTS >= 1 && NEAR_DISTRICTS <= 8);
});

test('a row can be handed to the map-link builders', () => {
  const p = asPlace(loadDistrict('Jongno').rows.find(r => r.y !== undefined));
  assert.match(p.id, /^seoul-\d+$/);
  assert.ok(p.name.length > 0);
  // Seoul, and not the Gulf of Guinea, which is where a swapped pair lands.
  assert.ok(p.coordinates.lat > 37.4 && p.coordinates.lat < 37.7);
  assert.ok(p.coordinates.lng > 126.7 && p.coordinates.lng < 127.3);
});

test('ids are unique across the whole register, not just within a district', () => {
  const seen = new Set();
  for (const d of index.districts) {
    for (const r of loadDistrict(d.slug).rows) {
      assert.equal(seen.has(r.i), false, `duplicate id ${r.i}`);
      seen.add(r.i);
    }
  }
  assert.equal(seen.size, index.total);
});
