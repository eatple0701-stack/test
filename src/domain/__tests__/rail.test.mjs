import test from 'node:test';
import assert from 'node:assert/strict';
import { railFraction, railIndex, railTallest, railAdvance } from '../policy/rail.js';

const KO = [758, 527, 510];    // the three top slides on a 375px phone, Korean
const EN = [758, 1021, 550];   // the same three in English, which carry more
const CM = 38;                 // the centimetre asked for, in CSS pixels

test('the rail is the first slide plus the margin asked for', () => {
  assert.equal(railTallest(KO, CM), 796);
  assert.equal(railTallest(KO, 0), 758);
});

test('it never cuts a slide that needs more, whatever the first one wants', () => {
  // English shows a romanisation and a gloss the Korean cards do not, so the
  // category slide is 1021 against the hero's 758. Sizing to the hero would
  // hide 263px of it from every reader who is not Korean.
  assert.equal(railTallest(EN, CM), 1021);
  assert.ok(railTallest(EN, CM) >= Math.max(...EN), 'a slide would be cut off');
});

test('every slide gets the same height, which is the point of it', () => {
  const h = railTallest(KO, CM);
  assert.equal(railTallest(KO, CM), h);
  assert.ok(KO.every(x => x <= h), 'a slide is taller than the rail holding it');
});

test('a slide that has not been laid out leaves the height alone', () => {
  // Returning 0 here is what put the rail at the wrong height on first
  // paint: a measurement taken while the ref was detached read nothing and
  // the rail kept 825px against a hero that had settled to 758.
  assert.equal(railTallest([0, 527, 510], CM), null);
  assert.equal(railTallest([], CM), null);
});

test('an overscroll past either end reads as the end, not as a fourth slide', () => {
  assert.equal(railFraction(-90, 375, 3), 0.24);
  assert.equal(railIndex(4000, 375, 3), 2);
});

test('a right-to-left layout scrolls the other way and means the same thing', () => {
  // Arabic reports the offset negative; distance is what the rail needs.
  assert.equal(railFraction(-375, 375, 3), 1);
  assert.equal(railIndex(-750, 375, 3), 2);
});

test('the index rounds to the slide a reader would say they are on', () => {
  assert.equal(railIndex(0, 375, 3), 0);
  assert.equal(railIndex(180, 375, 3), 0);
  assert.equal(railIndex(200, 375, 3), 1);
  assert.equal(railIndex(375, 375, 3), 1);
});

test('a rail with no width yet does not divide by zero', () => {
  assert.equal(Number.isFinite(railFraction(0, 0, 3)), true);
});

test('every step but the last one turns; the wrap is a cut', () => {
  assert.deepEqual(railAdvance(0, 3), { to: 1, jump: false });
  assert.deepEqual(railAdvance(1, 3), { to: 2, jump: false });
  // Nothing sits to the right of the last screen, so animating to the first
  // would travel back across the middle one.
  assert.deepEqual(railAdvance(2, 3), { to: 0, jump: true });
});

test('the advance survives a count of one and an index off the end', () => {
  assert.deepEqual(railAdvance(0, 1), { to: 0, jump: false });
  assert.deepEqual(railAdvance(9, 3), { to: 0, jump: true });
  assert.deepEqual(railAdvance(-4, 3), { to: 1, jump: false });
});
