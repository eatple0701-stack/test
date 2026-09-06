import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { matchesPlaceQuery, matchesRegistryRow, addressText } from '../policy/placeSearch.js';

// One rule, two callers.
//
// Reported 2026-09-04: a restaurant name typed into the map's search box did
// nothing. The list behind it had been answering all along — the map's dot
// layer simply took no query. Fixing that by hand wrote the rule twice, and
// the two copies disagreed within the hour: "종로" came back 22 in the list
// and 160 on the map, because one of them read the address and the other did
// not. This module is the single rule; these tests are what stop it being
// two again.

const src = (f) => fs.readFileSync(path.join(process.cwd(), f), 'utf8').replace(/\r\n/g, '\n');
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// A register place, as placeFromRegistry builds it: the address wrapped in a
// provenance record because nobody here has stood in front of the shopfront.
const registryPlace = {
  name: '토담토담',
  address: { value: '서울특별시 종로구 수표로 121', confidence: 'reported' },
};
// A curated place, as restaurants.js writes it: the same shape from fact().
const curatedPlace = {
  name: 'Balwoo Gongyang (발우공양)',
  address: { value: '56 Ujeongguk-ro, Jongno-gu, Seoul', confidence: 'confirmed' },
};
// And the compact row the district files hold, which the map draws straight.
const registryRow = { i: 1115, n: '토담토담', a: '서울특별시 종로구 수표로 121' };

test('a name matches, whichever of the three shapes it arrives in', () => {
  assert.equal(matchesPlaceQuery(registryPlace, '토담토담'), true);
  assert.equal(matchesPlaceQuery(curatedPlace, 'Balwoo'), true);
  assert.equal(matchesRegistryRow(registryRow, '토담토담'), true);
});

test('an address matches, which is the only place a neighbourhood is written', () => {
  // The register has no field for 홍대 or 이태원 — the answer to "somewhere
  // in 종로" is in the address string or it is nowhere.
  assert.equal(matchesPlaceQuery(registryPlace, '종로구'), true);
  assert.equal(matchesRegistryRow(registryRow, '종로구'), true);
  assert.equal(matchesPlaceQuery(curatedPlace, 'Jongno-gu'), true);
});

test('the wrapped record and the compact row answer identically', () => {
  // The two callers cannot share a record. They must not be able to disagree
  // about one anyway: this is the 22-versus-160 case, asserted directly.
  for (const q of ['토담토담', '종로', '수표로', '없는말', '', '  ', 'ㅌ']) {
    assert.equal(
      matchesPlaceQuery(registryPlace, q),
      matchesRegistryRow(registryRow, q),
      `the list and the map disagree about "${q}"`,
    );
  }
});

test('case and surrounding space do not decide the answer', () => {
  assert.equal(matchesPlaceQuery(curatedPlace, 'balwoo'), true);
  assert.equal(matchesPlaceQuery(curatedPlace, '  BALWOO  '), true);
});

test('an empty query matches everything rather than nothing', () => {
  // A search that has not started must not filter the list. The map layer
  // treats the same emptiness as "fall back to the viewport", which is its
  // own decision and made at its own call site.
  for (const q of ['', '   ', null, undefined]) {
    assert.equal(matchesPlaceQuery(registryPlace, q), true);
  }
});

test('a place with no address is searchable by name and does not throw', () => {
  assert.equal(matchesPlaceQuery({ name: '이름만' }, '이름만'), true);
  assert.equal(matchesPlaceQuery({ name: '이름만' }, '주소'), false);
  assert.equal(matchesPlaceQuery(null, '무엇'), false);
  assert.equal(addressText(null), '');
  assert.equal(addressText({ address: '문자열 주소' }), '문자열 주소');
});

test('zone is not read, because it is English for one kind of place only', () => {
  // zoneOf() derives "Jongno, Seoul" for a register place while the curated
  // twenty carry their own. Reading it would answer a Korean query for some
  // rows and not others — a filter that works for twenty places out of 8,138
  // is worse than one that does not claim to.
  const withZone = { name: '무관한이름', address: { value: '무관한주소' }, zone: 'Jongno, Seoul' };
  assert.equal(matchesPlaceQuery(withZone, 'Jongno'), false);
});

test('both callers reach the rule rather than keeping a copy', () => {
  // Source-text, and the only assertion here that is: the failure being
  // guarded is somebody writing `.includes(query)` inline again. Comments
  // stripped first — the notes explaining this rule name the fields it
  // reads, and matching those would pass while the code did anything.
  const app = noComments(src('src/App.jsx'));
  const nearby = noComments(src('src/data/nearbyPlaces.js'));
  assert.match(app, /matchesPlaceQuery\(/);
  assert.match(nearby, /matchesRegistryRow\(/);
  assert.doesNotMatch(app, /r\.name\.toLowerCase\(\)\.includes/);
});
