import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { placesInView, asPlace, MIN_ZOOM, NEAR_DISTRICTS } from '../../data/nearbyPlaces.js';

// The whole register — 167,659 restaurants — split into 26 district files by
// scripts/build-seoul-places.mjs, because as one file it is 24.4MB and 3.4MB
// compressed. These tests run against the shipped files.
//
// The thing being protected is that "all of it" stays true while nothing
// downloads more than it needs: every row present, no filter applied at
// build time, and the app fetching only the districts somebody looked at.

const DIR = path.join(process.cwd(), 'public/data/seoul');
const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const districtFiles = fs.readdirSync(DIR).filter(f => f !== 'index.json');
const loadDistrict = (slug) => JSON.parse(fs.readFileSync(path.join(DIR, `${slug}.json`), 'utf8'));

test('the index accounts for every row in the dataset', () => {
  // 167,659 is the register's own totalCount. If a filter ever creeps into
  // the build script, this is where it shows up.
  assert.equal(index.total, 167659);
  const summed = index.districts.reduce((n, d) => n + d.count, 0);
  assert.equal(summed, index.total, 'the districts do not add up to the whole');
  assert.equal(districtFiles.length, index.districts.length);
});

test('rows the register gave no coordinates for are kept, not dropped', () => {
  // 2953 of them. They cannot be drawn or sorted by distance, but they are
  // real restaurants, and dropping them would make this a partial import
  // claiming to be a complete one.
  assert.ok(index.withGeo < index.total, 'some rows have no coordinates');
  // 2,925 the register never geocoded, plus 28 it placed outside Seoul —
  // the 새문안로 block that all carried a point near Sejong.
  assert.equal(index.total - index.withGeo, 2953);
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
  assert.deepEqual([...keys].sort(), ['a', 'c', 'f', 'h', 'i', 'n', 't', 'x', 'y']);
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
  // 종로구 alone holds 8,649. Handing them all to Leaflet locks the thread.
  const layer = { rows: loadDistrict('Jongno').rows };
  const wide = { north: 37.70, south: 37.45, east: 127.20, west: 126.80 };
  assert.equal(placesInView(layer, wide, 16).length, 160, 'the default cap');
  assert.equal(placesInView(layer, wide, 16, 12).length, 12, 'and it is a parameter');
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
