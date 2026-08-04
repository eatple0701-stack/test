import test from 'node:test';
import assert from 'node:assert/strict';
import {
  venueKind, tableCtaFor, mapLinksFor, transitLine, MAP_LINKS_NOTE,
  VENUE_KIND, MEAL_CATEGORIES, OUTING_CATEGORIES,
} from '../policy/venue.js';
import { restaurants } from '../../data/restaurants.js';

test('every category in the catalogue has wording of its own', () => {
  // The point of deriving rather than hard-coding: a category added to
  // restaurants.js must be classified deliberately, not inherit 상 차리기 by
  // accident. This is the test that makes that true.
  const known = new Set([...MEAL_CATEGORIES, ...OUTING_CATEGORIES]);
  const inCatalogue = new Set(restaurants.map(r => r.category));
  for (const c of inCatalogue) {
    assert.ok(known.has(c), `category "${c}" is in restaurants.js but not classified in venue.js`);
  }
});

test('a cafe is never told to set a table', () => {
  // The review that prompted this file: "카페의 경우, 상차리기 라는 단어는 어색하다".
  const cafe = { name: 'Iryonghal Yangsik (일용할양식)', category: 'brunch-bakery' };
  const cta = tableCtaFor(cafe);
  assert.equal(cta.kind, VENUE_KIND.OUTING);
  assert.ok(!cta.title.includes('상 차리기'), 'a bakery was offered 상 차리기');
  assert.match(cta.title, /[가-힣]/);
});

test('a restaurant still sets a table', () => {
  const cta = tableCtaFor({ name: 'Balwoo Gongyang (발우공양)', category: 'temple' });
  assert.equal(cta.kind, VENUE_KIND.MEAL);
  assert.equal(cta.title, '여기서 상 차리기');
  assert.match(cta.sub, /Balwoo Gongyang/);
});

test('the venue name is cleaned of its bracketed Korean, once', () => {
  assert.match(tableCtaFor({ name: 'Sanchon (산촌)', category: 'temple' }).sub, /Sanchon and see|at Sanchon/);
  assert.ok(!tableCtaFor({ name: 'Sanchon (산촌)', category: 'temple' }).sub.includes('('));
});

test('an unknown category falls to the wording that cannot be wrong', () => {
  // 같이 갈 사람 찾기 is true of any venue; 상 차리기 is not. An unclassified
  // category must land on the safe one.
  assert.equal(venueKind('something-new'), VENUE_KIND.OUTING);
  assert.equal(venueKind(undefined), VENUE_KIND.OUTING);
  assert.ok(!tableCtaFor({ name: 'X', category: null }).title.includes('상 차리기'));
});

test('a venue with no name still produces a sentence', () => {
  const cta = tableCtaFor({ category: 'temple' });
  assert.ok(cta.sub.length > 0);
  assert.ok(!cta.sub.includes('undefined'));
});

test('map links carry the real coordinates of a real venue', () => {
  const balwoo = restaurants.find(r => r.id === 'balwoo');
  const links = mapLinksFor(balwoo);
  assert.equal(links.length, 2);
  const point = balwoo.coordinates.value;
  for (const link of links) {
    assert.ok(link.url.startsWith('https://'), `${link.id} is not https`);
    assert.ok(link.url.includes(String(point.lat)), `${link.id} is missing the latitude`);
    assert.ok(link.url.includes(String(point.lng)), `${link.id} is missing the longitude`);
    assert.match(link.kr, /[가-힣]/);
  }
});

test('every mappable venue in the catalogue produces working links', () => {
  const mappable = restaurants.filter(r => r.coordinates?.value?.lat);
  assert.ok(mappable.length > 0, 'the fixture found no venues with coordinates');
  for (const r of mappable) {
    assert.equal(mapLinksFor(r).length, 2, `${r.id} produced no links`);
  }
});

test('a venue without a usable point gets no links rather than a broken one', () => {
  assert.deepEqual(mapLinksFor({ name: 'X' }), []);
  assert.deepEqual(mapLinksFor({ name: 'X', coordinates: { value: { lat: 0, lng: 0 } } }), []);
  assert.deepEqual(mapLinksFor({ name: 'X', coordinates: { value: { lat: 'a', lng: 'b' } } }), []);
  assert.deepEqual(mapLinksFor(null), []);
});

test('the note refuses to claim the reviews as ours', () => {
  const text = `${MAP_LINKS_NOTE.kr} ${MAP_LINKS_NOTE.en}`;
  assert.match(MAP_LINKS_NOTE.kr, /[가-힣]/);
  // It must not imply a rating, a score, or that 밥친구 vouches for the place.
  for (const overclaim of ['our review', 'we rate', 'verified by', '평점', '별점']) {
    assert.ok(!text.toLowerCase().includes(overclaim.toLowerCase()), `note claims "${overclaim}"`);
  }
});

test('the way here is one line, in both languages', () => {
  const balwoo = restaurants.find(r => r.id === 'balwoo');
  const line = transitLine(balwoo);
  assert.equal(line.station, 'Anguk');
  assert.equal(line.walkingMinutes, 7);
  assert.match(line.kr, /지하철 3호선/);
  assert.match(line.kr, /도보 7분/);
  assert.match(line.en, /7 min walk from Anguk Station/);
});

test('an exit is never invented', () => {
  // All sixteen venues carry exit: null — the routing API did not return one,
  // and restaurants.js records that in its evidence. Printing a guessed exit
  // is how somebody waits at the wrong corner of a six-exit station.
  for (const r of restaurants.filter(x => x.transit?.value?.station)) {
    const line = transitLine(r);
    if (r.transit.value.exit == null) {
      assert.equal(line.exit, null, `${r.id} produced an exit from nothing`);
      assert.ok(!/출구|Exit \d/.test(`${line.kr} ${line.en}`), `${r.id} printed an exit`);
    }
  }
});

test('every venue with transit data produces a readable line', () => {
  const withTransit = restaurants.filter(r => r.transit?.value?.station);
  assert.ok(withTransit.length > 0, 'the fixture found no transit data');
  for (const r of withTransit) {
    const line = transitLine(r);
    assert.match(line.kr, /[가-힣]/, `${r.id} has no Korean`);
    assert.ok(line.en.trim().length > 0, `${r.id} has no English`);
    assert.ok(!/undefined|null|NaN/.test(`${line.kr} ${line.en}`), `${r.id} leaked a placeholder`);
  }
});

test('a venue with no transit data gets no line rather than an empty one', () => {
  assert.equal(transitLine({}), null);
  assert.equal(transitLine(null), null);
  assert.equal(transitLine({ transit: { value: { station: '  ' } } }), null);
});
