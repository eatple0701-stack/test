import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { wheelRoute } from '../policy/wheel.js';

// One notch of a mouse wheel over a row that scrolls sideways — see
// domain/policy/wheel.js. A rail 1,000px wide showing 400 of it, so the
// furthest it scrolls is 600.

const rail = { scrollWidth: 1000, clientWidth: 400 };
const notch = (over) => wheelRoute({ deltaX: 0, deltaY: 100, ...rail, ...over });

test('a notch in the middle of a row moves the row, not the page', () => {
  assert.deepEqual(notch({ scrollLeft: 200 }), { route: 'row', left: 300 });
  assert.deepEqual(notch({ scrollLeft: 200, deltaY: -100 }), { route: 'row', left: 100 });
});

test('at either end, an ordinary row hands the wheel back to the page', () => {
  assert.deepEqual(notch({ scrollLeft: 600 }), { route: 'page' });
  assert.deepEqual(notch({ scrollLeft: 0, deltaY: -100 }), { route: 'page' });
});

test('at either end, a row that holds keeps the wheel and moves nothing', () => {
  // 2026-09-11, the dish rails on 여권 and 문화: "그걸로 멈춰있어야 해".
  assert.deepEqual(notch({ scrollLeft: 600, hold: true }), { route: 'hold' });
  assert.deepEqual(notch({ scrollLeft: 0, deltaY: -100, hold: true }), { route: 'hold' });
  // And holding changes nothing anywhere else on the row.
  assert.deepEqual(notch({ scrollLeft: 200, hold: true }), { route: 'row', left: 300 });
});

test('a fraction short of the end is the end', () => {
  assert.deepEqual(notch({ scrollLeft: 599.5, hold: true }), { route: 'hold' });
  assert.deepEqual(notch({ scrollLeft: 599.5 }), { route: 'page' });
});

test('right to left, a notch down travels towards the end, which is the negative side', () => {
  // The first handler added deltaY here too. Measured on the 문화 rail in
  // Arabic: from the start a notch moved nothing, from the end it went 188px
  // back towards the start.
  assert.deepEqual(notch({ rtl: true, scrollLeft: 0 }), { route: 'row', left: -100 });
  assert.deepEqual(notch({ rtl: true, scrollLeft: -200 }), { route: 'row', left: -300 });
  assert.deepEqual(notch({ rtl: true, scrollLeft: -200, deltaY: -100 }), { route: 'row', left: -100 });
  assert.deepEqual(notch({ rtl: true, scrollLeft: -600 }), { route: 'page' });
  assert.deepEqual(notch({ rtl: true, scrollLeft: -600, hold: true }), { route: 'hold' });
  assert.deepEqual(notch({ rtl: true, scrollLeft: 0, deltaY: -100, hold: true }), { route: 'hold' });
});

test('a sideways gesture, and a row with nothing to scroll, are left to the browser', () => {
  assert.deepEqual(notch({ scrollLeft: 200, deltaX: 120, deltaY: 30 }), { route: 'page' });
  assert.deepEqual(notch({ scrollLeft: 200, deltaY: 0 }), { route: 'page' });
  assert.deepEqual(
    wheelRoute({ deltaX: 0, deltaY: 100, scrollLeft: 0, scrollWidth: 400, clientWidth: 400, hold: true }),
    { route: 'page' },
    'a row that fits holds nothing — there is no end to reach',
  );
});

// Which rails hold, and whether the handler asks. Read as source with the
// comments stripped: an attribute on a JSX element has no other witness in
// Node, and the comments here name the very strings being searched for.
const code = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

test('the dish rails on 여권 and 문화 hold the wheel, and App.jsx passes that on', () => {
  assert.match(code('src/components/JournalPanel.jsx'), /taste-recap-rail"[^>]*data-wheel="hold"/,
    'the passport rail lets the page run on again at its end');
  assert.match(code('src/components/DishStories.jsx'), /dish-stories__rail"[^>]*data-wheel="hold"/,
    'the story rail lets the page run on again at its end');
  const app = code('src/App.jsx');
  assert.match(app, /wheelRoute\(/, 'the document handler decides the notch itself again');
  assert.match(app, /dataset\.wheel === 'hold'/, 'the handler never tells wheelRoute that a row holds');
});
