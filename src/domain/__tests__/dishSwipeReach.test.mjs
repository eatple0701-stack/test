import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// A control the reader cannot reach is a control that is not there.
//
// DishSwipe shipped 2026-09-07 with "내 입맛 지도 보기" as the last child of
// the deck. Every check passed — the button was in the JSX, its handler was
// wired, the test suite was green, the i18n audit was 0 — and the reader
// reported that the link "확인이 안 돼". It was drawn, and it was drawn off
// the bottom of the screen: `.match-modal-backdrop` is position:fixed with
// no scroll of its own, the deck measured about 824px, and a 375×812 phone
// has 812. The last child of an overflowing fixed box is unreachable.
//
// This is the same failure overlay.test.mjs was written for after DishSheet
// rendered 3,405px below the fold, and it is cheap to assert the same way:
// a fixed-position dialog has one property deciding whether it is a feature
// or nothing at all.

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
const css = read('src/custom.css');
const jsx = read('src/components/DishSwipe.jsx');

/** The declarations inside one selector's block. */
function ruleFor(selector) {
  const at = css.indexOf('\n' + selector + ' {');
  if (at < 0) return null;
  const open = css.indexOf('{', at);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

test('the deck is capped to the screen it is drawn on', () => {
  const rule = ruleFor('.dish-swipe');
  assert.ok(rule, '.dish-swipe has no rule at all');
  assert.match(rule, /max-height:\s*100%/,
    'the deck can grow past the viewport again, and its bottom becomes unreachable');
});

test('the part that scrolls is the card area, not the controls', () => {
  // Capping the height alone would only move the problem: the overflow has
  // to land somewhere that is allowed to lose pixels. The stage is; the
  // buttons under it are not.
  const stage = ruleFor('.dish-swipe__stage');
  assert.ok(stage, '.dish-swipe__stage has no rule');
  assert.match(stage, /flex:\s*1/, 'the stage no longer takes the leftover height');
  assert.match(stage, /min-height:\s*0/,
    'without min-height:0 a flex child refuses to shrink and the cap does nothing');
});

test('inline on Main is not capped, because there is no dialog to overflow', () => {
  const rule = ruleFor('.dish-swipe--inline');
  assert.ok(rule, '.dish-swipe--inline has no rule');
  assert.match(rule, /max-height:\s*none/,
    'the inline deck inherits a cap meant for a dialog and clips itself on the page');
});

test('the map link is rendered above the card, not after it', () => {
  // Source order, deliberately: this is a claim about which of two elements
  // the browser lays out first, and there is no browser here. The behaviour
  // it protects — a pressable control that survives an overflow — has no
  // cheaper witness, and the bug it protects against shipped green.
  const early = jsx.indexOf('dish-swipe__early');
  const stage = jsx.indexOf('dish-swipe__stage');
  const actions = jsx.indexOf('dish-swipe__actions');
  assert.ok(early > 0, 'the map link is gone');
  assert.ok(stage > 0 && actions > 0, 'the deck no longer has a stage and actions');
  assert.ok(early < stage,
    'the map link is below the card again — that is where it was unreachable');
});

test('the two answers stay reachable whatever the card does', () => {
  const actions = jsx.indexOf('dish-swipe__actions');
  const stage = jsx.indexOf('dish-swipe__stage');
  assert.ok(actions > stage, 'the buttons moved above the card');
  const rule = ruleFor('.dish-swipe__actions');
  assert.ok(rule, '.dish-swipe__actions has no rule');
  assert.ok(!/flex:\s*1/.test(rule), 'the action row now shrinks with the card');
});
