import test from 'node:test';
import assert from 'node:assert/strict';
import { pointOf, hasPoint, mappable, unmappable, unplacedNotice, PICKER_PROMPT } from '../policy/place.js';

// Where a table is, when the app actually knows.
//
// The rule under every assertion here: a pin the app invented is worse than
// no pin, because it looks exactly as confident as a true one and the cost of
// being wrong is somebody alone at the wrong exit at 19:00.

const at = (lat, lng) => ({ id: 't', place: 'somewhere', lat, lng });

test('a real Seoul point is drawable', () => {
  assert.deepEqual(pointOf(at(37.5704, 126.9910)), { lat: 37.5704, lng: 126.9910 });
  assert.equal(hasPoint(at(37.5704, 126.9910)), true);
});

test('a table with no point is not placed anywhere', () => {
  // The ordinary case: hosts write "Jongno 3-ga, Exit 4" and never open a
  // map. Those tables belong in the list, not on it.
  assert.equal(pointOf({ place: 'Jongno 3-ga' }), null);
  assert.equal(pointOf(at(null, null)), null);
  assert.equal(pointOf(at(undefined, undefined)), null);
  assert.equal(pointOf({}), null);
});

test('Null Island is refused, because a broken picker writes zeros', () => {
  // (0, 0) is off the coast of Africa and renders as a perfectly plausible
  // pin at the edge of the map — the most convincing wrong answer available.
  assert.equal(pointOf(at(0, 0)), null);
});

test('a coordinate outside Korea is refused rather than drawn', () => {
  assert.equal(pointOf(at(48.8566, 2.3522)), null, 'Paris');
  assert.equal(pointOf(at(35.6762, 139.6503)), null, 'Tokyo');
  // Swapped lat/lng is the classic form of this bug and lands in the sea.
  assert.equal(pointOf(at(126.9910, 37.5704)), null, 'lat and lng swapped');
});

test('a coordinate that is not a number is refused', () => {
  // Numeric strings are what a form hands back, so those are read rather
  // than refused; words are not coordinates and never become one.
  assert.deepEqual(pointOf(at('37.5', '127.0')), { lat: 37.5, lng: 127 });
  assert.equal(pointOf(at('north', 'east')), null);
  assert.equal(pointOf(at(NaN, NaN)), null);
});

test('the map splits tables into shown and honestly withheld', () => {
  const tables = [at(37.57, 126.99), { id: 'b', place: 'words only' }, at(37.55, 127.0)];
  assert.equal(mappable(tables).length, 2);
  assert.equal(unmappable(tables).length, 1);
});

test('the map says how many tables it could not place', () => {
  // Silence here is the bug: four in the list and three on the map reads as
  // the app losing one, and the traveller has no way to know which.
  assert.equal(unplacedNotice([at(37.57, 126.99)]), null, 'nothing to say when all are placed');
  const notice = unplacedNotice([at(37.57, 126.99), { id: 'b' }, { id: 'c' }]);
  assert.equal(notice.count, 2);
  assert.match(notice.en, /still in the list/);
});

test('the picker asks for a real spot, not an approximate one', () => {
  const text = `${PICKER_PROMPT.kr} ${PICKER_PROMPT.en}`.toLowerCase();
  assert.match(text, /rough pin is worse/, 'the honest instruction is missing');
});
