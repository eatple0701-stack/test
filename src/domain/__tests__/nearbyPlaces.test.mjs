import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { placesInView, asPlace, MIN_ZOOM } from '../../data/nearbyPlaces.js';

// The registry layer, and the three rules that keep it from becoming the app.
//
// 7,450 places from 서울관광재단's food-tourism register sit under twenty
// places somebody on this team wrote about. That ratio is the whole risk: a
// layer drawn without limits buries the curation, and a layer that promises
// more than a registry knows makes this app a worse version of a map app.
//
// The file is built by scripts/build-nearby-layer.mjs and committed, so
// these run against the real thing rather than a fixture.

const FILE = path.join(process.cwd(), 'public/data/nearby-seoul.json');
const layer = JSON.parse(fs.readFileSync(FILE, 'utf8'));

test('the layer says where it came from and what was filtered', () => {
  // Not decoration. A screen that shows somebody else's data owes them the
  // attribution, and owes the reader the filter — "nearby restaurants" and
  // "restaurants that told a register they have a foreign-language menu"
  // are different claims.
  assert.match(layer.source, /서울관광재단/);
  assert.match(layer.filter, /FGGG_MENU_OFR_YN=Y/);
  assert.ok(layer.builtAt, 'the build date is what tells somebody it is stale');
  assert.equal(layer.count, layer.rows.length);
  assert.ok(layer.rows.length > 1000, 'a layer this small would not be worth its own fetch');
});

test('nothing this app refuses to print came along for the ride', () => {
  // The registry carries prices and Naver review scores in neighbouring
  // endpoints. The rule against both predates this dataset, and an import
  // is exactly how a rule like that gets quietly dropped.
  const keys = new Set(layer.rows.flatMap(Object.keys));
  for (const banned of ['price', 'p', 'grade', 'g', 'rating', 'r', 'score', 's']) {
    assert.equal(keys.has(banned), false, `the layer carries a "${banned}" field`);
  }
  assert.deepEqual([...keys].sort(), ['a', 'c', 'h', 'i', 'n', 't', 'x', 'y']);
});

test('the layer draws nothing until the map is close enough to read', () => {
  const box = { north: 37.576, south: 37.570, east: 126.990, west: 126.982 };
  for (let z = 0; z < MIN_ZOOM; z += 1) {
    assert.equal(placesInView(layer, box, z).length, 0, `zoom ${z} should draw nothing`);
  }
  assert.ok(placesInView(layer, box, MIN_ZOOM).length > 0, 'and something at the threshold');
});

test('a viewport is capped, because Leaflet draws everything it is given', () => {
  const wholeCity = { north: 37.70, south: 37.45, east: 127.20, west: 126.80 };
  const all = placesInView(layer, wholeCity, 16);
  assert.equal(all.length, 160, 'the default cap');
  assert.equal(placesInView(layer, wholeCity, 16, 12).length, 12, 'and it is a parameter');
});

test('only what is inside the box comes back', () => {
  const box = { north: 37.576, south: 37.570, east: 126.990, west: 126.982 };
  const shown = placesInView(layer, box, 16);
  for (const p of shown) {
    assert.ok(p.y >= box.south && p.y <= box.north, `${p.n} is outside the latitude range`);
    assert.ok(p.x >= box.west && p.x <= box.east, `${p.n} is outside the longitude range`);
  }
});

test('a row can be handed to the map-link builders', () => {
  // naverMapUrl and kakaoMapUrl read `.name` and `.coordinates`; the compact
  // row uses one-letter keys to keep the file small, and something has to
  // bridge the two.
  const p = asPlace(layer.rows[0]);
  assert.match(p.id, /^seoul-\d+$/);
  assert.ok(p.name.length > 0);
  assert.ok(Number.isFinite(p.coordinates.lat) && Number.isFinite(p.coordinates.lng));
  // Seoul, and not the Gulf of Guinea, which is where a swapped pair lands.
  assert.ok(p.coordinates.lat > 37.4 && p.coordinates.lat < 37.7);
  assert.ok(p.coordinates.lng > 126.7 && p.coordinates.lng < 127.3);
});

test('an id cannot collide with a curated place', () => {
  const ids = new Set(layer.rows.map(r => asPlace(r).id));
  assert.equal(ids.size, layer.rows.length, 'registry ids are unique');
  assert.equal([...ids].every(id => id.startsWith('seoul-')), true,
    'the prefix is what stops a registry row being mistaken for one of the twenty');
});
