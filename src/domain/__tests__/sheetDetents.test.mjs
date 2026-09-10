import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DETENT, DETENT_ORDER, DETENT_FRACTION, PEEK_MIN_PX, FLICK_VELOCITY,
  detentPx, nearestDetent, stepDetent, detentAfterTap, detentAfterDrag,
} from '../policy/sheetDetents.js';

// The map area on a 375x812 phone: 812 less the app chrome, the chip row and
// the tab bar. The number the 2026-09-10 measurements were taken against.
const HOST = 598;

test('the three rest positions are in order and none of them is the whole screen', () => {
  assert.deepEqual(DETENT_ORDER, [DETENT.peek, DETENT.half, DETENT.full]);
  let last = 0;
  for (const d of DETENT_ORDER) {
    const px = detentPx(d, HOST);
    assert.ok(px > last, `${d} is not taller than the one below it`);
    last = px;
  }
  // full stops short, so the sheet still reads as a sheet over a map.
  assert.ok(detentPx(DETENT.full, HOST) < HOST);
  assert.ok(DETENT_FRACTION[DETENT.full] < 1);
});

test('every position beats the fixed split it replaces, on both sides', () => {
  // The state being replaced, measured on this phone: a 244px map with 224px
  // of list under it, and no way to have more of either.
  const OLD_LIST = 224;
  const OLD_MAP = 244;

  const half = detentPx(DETENT.half, HOST);
  const full = detentPx(DETENT.full, HOST);

  assert.ok(half > OLD_LIST, 'half gives the list less room than the old split did');
  assert.ok(full > 2 * OLD_LIST, 'full is barely better than the split');
  // And the map is not the price. At half there is more map than the old
  // split left, which is the part that makes this a choice rather than a
  // different fixed ratio.
  assert.ok(HOST - half > OLD_MAP, 'half leaves less map than the old split did');
  // And at peek the map is more than twice the strip it used to be. (Not
  // 0.87 of the screen, which is what 0.13 suggests and what the first draft
  // of this line asserted: peek has a 92px floor, and on this phone the floor
  // is what wins.)
  assert.ok(HOST - detentPx(DETENT.peek, HOST) > 2 * OLD_MAP);
});

test('half is a split, not a disguised full or a disguised peek', () => {
  // The number that decides whether this is worth building: a place card in
  // this list is about 120px once the phone rule in index.css compacts it,
  // and two of them plus the handle is what makes a list read as a list.
  // Verified against the rendered card, not asserted here — this file cannot
  // see a stylesheet. What it can hold is that half stays a middle.
  assert.ok(DETENT_FRACTION[DETENT.half] >= 0.5);
  assert.ok(DETENT_FRACTION[DETENT.half] <= 0.65);
  const HANDLE = 52;
  const CARD = 120;
  assert.ok(detentPx(DETENT.half, HOST) - HANDLE >= 2 * CARD, 'half must hold two cards');
  assert.ok(detentPx(DETENT.full, HOST) - HANDLE >= 4 * CARD, 'full must hold four');
});

test('peek is a handle and a line, and does not shrink with the screen', () => {
  // 0.13 of a short viewport is smaller than the handle it has to hold.
  assert.equal(detentPx(DETENT.peek, 300), PEEK_MIN_PX);
  assert.ok(detentPx(DETENT.peek, HOST) >= PEEK_MIN_PX);
  // The floor never grows past the space there is.
  assert.equal(detentPx(DETENT.peek, 40), 40);
  assert.equal(detentPx(DETENT.peek, 0), 0);
});

test('a slow drag settles on whichever position it ended nearest', () => {
  const peek = detentPx(DETENT.peek, HOST);
  const half = detentPx(DETENT.half, HOST);
  const full = detentPx(DETENT.full, HOST);
  assert.equal(nearestDetent(peek + 4, HOST), DETENT.peek);
  assert.equal(nearestDetent(half - 20, HOST), DETENT.half);
  assert.equal(nearestDetent(half + 20, HOST), DETENT.half);
  assert.equal(nearestDetent(full, HOST), DETENT.full);
  assert.equal(nearestDetent(10_000, HOST), DETENT.full);
  assert.equal(nearestDetent(-50, HOST), DETENT.peek);
  // Halfway between two, and it goes to one of them rather than throwing.
  assert.ok(DETENT_ORDER.includes(nearestDetent((peek + half) / 2, HOST)));
});

test('a flick beats where the sheet happens to be', () => {
  const peek = detentPx(DETENT.peek, HOST);
  // The case a nearest-position rule gets wrong: flick up from peek, and the
  // sheet has barely moved, so "nearest" is still peek and it snaps back down
  // under a thumb that plainly asked for more.
  assert.equal(nearestDetent(peek + 6, HOST), DETENT.peek);
  assert.equal(detentAfterDrag(DETENT.peek, peek + 6, HOST, FLICK_VELOCITY), DETENT.half);

  // And the same downward, from the top.
  const full = detentPx(DETENT.full, HOST);
  assert.equal(detentAfterDrag(DETENT.full, full - 6, HOST, -FLICK_VELOCITY), DETENT.half);

  // Under the threshold it is a drag, and position decides.
  assert.equal(detentAfterDrag(DETENT.peek, peek + 6, HOST, FLICK_VELOCITY - 0.01), DETENT.peek);
  assert.equal(detentAfterDrag(DETENT.peek, peek + 6, HOST, 0), DETENT.peek);
  // A flick moves one step, not to the end.
  assert.equal(detentAfterDrag(DETENT.peek, peek, HOST, 9), DETENT.half);
});

test('a flick at the top of the ladder has nowhere to go, and stays', () => {
  const full = detentPx(DETENT.full, HOST);
  assert.equal(detentAfterDrag(DETENT.full, full, HOST, 9), DETENT.full);
  const peek = detentPx(DETENT.peek, HOST);
  assert.equal(detentAfterDrag(DETENT.peek, peek, HOST, -9), DETENT.peek);
  assert.equal(stepDetent(DETENT.full, +1), DETENT.full);
  assert.equal(stepDetent(DETENT.peek, -1), DETENT.peek);
});

test('tapping the handle keeps working the third time', () => {
  // Up, up, and then back to the bottom. A toggle that stops at the top is a
  // button that does nothing when you press it again.
  assert.equal(detentAfterTap(DETENT.peek), DETENT.half);
  assert.equal(detentAfterTap(DETENT.half), DETENT.full);
  assert.equal(detentAfterTap(DETENT.full), DETENT.peek);
  // Three taps return where they started, so the control is a cycle.
  let d = DETENT.peek;
  for (let i = 0; i < 3; i += 1) d = detentAfterTap(d);
  assert.equal(d, DETENT.peek);
});

test('nonsense in, a rest position out', () => {
  assert.equal(stepDetent('nowhere', +1), DETENT.peek);
  assert.equal(stepDetent(undefined, -1), DETENT.peek);
  assert.equal(detentPx('nowhere', HOST), detentPx(DETENT.peek, HOST));
  assert.equal(detentPx(DETENT.half, undefined), 0);
  assert.equal(detentPx(DETENT.half, -100), 0);
  assert.ok(DETENT_ORDER.includes(detentAfterDrag(DETENT.half, 200, HOST, NaN)));
});
