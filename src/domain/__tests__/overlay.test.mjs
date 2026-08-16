import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// A sheet that opens over the app has to be positioned, and this is what
// happens when it is not.
//
// DishSheet shipped 2026-08-15 with `.sheet-page`'s `position: static`, which
// meant React rendered it as the last child of MainTab and the browser drew
// it 3405px below the fold. Every automated check passed: the element was in
// the DOM, the tabs moved the deck, the right text was in the right card. A
// reviewer opened the app, tapped a dish, and nothing happened — which is
// indistinguishable from a dead button.
//
// The lesson is not "write more DOM assertions". It is that a full-screen
// overlay has exactly one property that decides whether it is a feature or
// nothing at all, and it is cheap to assert. So:

const css = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf8');

/** The declarations inside one selector's block. */
const ruleFor = (selector) => {
  const at = css.indexOf('\n' + selector + ' {');
  if (at < 0) return null;
  const open = css.indexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', open));
};

const zIndexIn = (rule) => {
  const m = /z-index:\s*(\d+)/.exec(rule ?? '');
  return m ? Number(m[1]) : null;
};

// Every element the app renders as a screen-covering sheet. Adding one here
// costs a line; forgetting to costs the feature.
const OVERLAYS = ['.dish-sheet', '.phrase-sheet'];

test('a sheet that covers the app is positioned over it', () => {
  for (const sel of OVERLAYS) {
    const rule = ruleFor(sel);
    assert.ok(rule, `${sel} has no rule of its own in src/index.css`);
    assert.match(rule, /position:\s*fixed/, `${sel} is not fixed, so it draws wherever it happens to sit in the document`);
    assert.match(rule, /inset:\s*0/, `${sel} is fixed but does not fill the screen`);
  }
});

test('a sheet sits above the tab bar it covers', () => {
  // Otherwise the navigation stays tappable through the sheet, which on a
  // phone means a thumb resting at the bottom of the screen leaves it.
  const bar = zIndexIn(ruleFor('.tab-bar'));
  assert.ok(bar, 'the tab bar has no z-index to compare against');
  for (const sel of OVERLAYS) {
    const z = zIndexIn(ruleFor(sel));
    assert.ok(z, `${sel} has no z-index`);
    assert.ok(z > bar, `${sel} (${z}) is not above the tab bar (${bar})`);
  }
});

test('the phrase sheet stays above the dish sheet that opens it', () => {
  // The dish's "what's in it" card opens the phrase sheet. If they were the
  // other way round, the button would appear to do nothing — the same
  // failure this file exists for, one layer in.
  assert.ok(
    zIndexIn(ruleFor('.phrase-sheet')) > zIndexIn(ruleFor('.dish-sheet')),
    'the phrase sheet would open underneath the dish sheet',
  );
});

test('the map draws the register without being asked to', () => {
  // The 8,118 places were behind a toggle that started off, so opening the
  // map showed twenty pins over an empty city and the whole import looked
  // like it had not shipped. Same failure as the rest of this file — the
  // thing is there and the screen does not show it — one state variable in.
  const src = fs.readFileSync(new URL('../../components/MapOverlay.jsx', import.meta.url), 'utf8');
  assert.match(src, /useState\(true\);\s*$/m, 'MapOverlay has no state defaulting to on');
  assert.doesNotMatch(
    src.replace(/\/\/.*$/gm, ''),
    /const \[nearby, setNearby\] = useState\(false\)/,
    'the register layer is off until somebody presses a button',
  );
});
