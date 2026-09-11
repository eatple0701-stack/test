import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Leaflet places every marker itself. leaflet.css gives .leaflet-marker-icon
// `position: absolute; left: 0; top: 0`, and the marker's own code writes an
// inline `transform: translate3d(x, y, 0)` and a negative margin for the
// anchor. That is the whole mechanism, and any stylesheet that touches one of
// those properties on a marker is moving it somewhere Leaflet did not put it.
//
// 2026-09-11, "직접 가본곳 얘네 점 표시가 부정확해 / 줌인 줌아웃 할때마다 위치가
// 다르게 떠". custom.css had `.k-dot--wide { position: relative; }` — copied on
// 2026-09-09 from the teardrop pin's rule, to give the 44px hit area a
// containing block, which the marker already was, being absolute. It loads
// after leaflet.css at the same specificity, so it won: the eighteen curated
// marks dropped out of absolute positioning into normal flow and stacked, each
// one 7px lower than the one before — 0, 7, 14 … 119px, measured, at zoom 12,
// 14 and 16 alike. A fixed pixel error is a different ground error at every
// zoom, which is exactly what "a different place every time I zoom" is.
//
// The teardrop had done the same thing since before that, 2px a pin instead
// of 7, which is why nobody saw it. And three `transition: transform` rules
// were making the bubbles and the pin slide after the map instead of moving
// with it, because transform is the property Leaflet positions them with.
//
// This reads the stylesheets, which the repository's own rule allows only
// where it is genuinely the only option. It is: the failure is a cascade
// outcome between three files, and there is no DOM here to lay one out in.

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

/** Every class a map marker is drawn with, Leaflet's own included. */
export const MARKER_CLASSES = [
  'leaflet-marker-icon',
  // MapComponent: the register dots and the eighteen. k-bubble was the
  // phone’s bubbles, 2026-09-10 to 09-11; it stays listed so that if it ever
  // comes back, it comes back without moving its markers.
  'k-dot', 'k-dot--active', 'k-dot--wide', 'k-bubble',
  // PlacePicker's drop pin and TablesMap's table pins.
  'k-pin', 'k-pin--active', 'table-pin', 'table-pin--sample',
];

// What Leaflet owns on the marker element itself.
const OWNED = /^(position|left|top|right|bottom|inset(-[a-z-]+)?|margin(-[a-z-]+)?|transform|translate|scale|rotate)$/;
// A transition on any of those moves the marker too — late, instead of wrong.
const MOVES = /\b(all|transform|translate|scale|rotate|left|top|right|bottom|inset|margin)\b/;

/**
 * The declarations that reach a marker element's own box: rules whose
 * subject — the last compound of the selector — carries a marker class and
 * is not a pseudo-element. `.k-dot svg` styles the drawing inside the
 * marker, and `.k-dot--wide::after` styles a box the marker contains; both
 * are fine, and both are exactly what a stylesheet should be doing instead.
 */
export function markerViolations(css, classes = MARKER_CLASSES) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  // Innermost rule blocks only; @media wrappers carry no declarations.
  //
  // The brace before a selector is looked behind at, not matched. The first
  // version matched it, and since a rule ends in the brace the next one needs,
  // every second rule in a run of them was skipped: against the tree it was
  // written for it reported .k-bubble:active and not the .k-bubble:hover
  // directly above it, and missed .k-pin's own position: relative entirely.
  for (const m of src.matchAll(/(?:^|(?<=[{}]))\s*([^{}@]+?)\s*\{([^{}]*)\}/g)) {
    const selectors = m[1].split(',').map(s => s.trim()).filter(Boolean);
    const body = m[2];
    for (const sel of selectors) {
      const subject = sel.split(/\s+|>|\+|~/).filter(Boolean).pop() ?? '';
      if (subject.includes('::')) continue;
      const names = [...subject.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(x => x[1]);
      if (!names.some(n => classes.includes(n))) continue;
      for (const decl of body.split(';')) {
        const i = decl.indexOf(':');
        if (i < 0) continue;
        const prop = decl.slice(0, i).trim().toLowerCase();
        const value = decl.slice(i + 1).trim().toLowerCase();
        const moved = OWNED.test(prop)
          || ((prop === 'transition' || prop === 'transition-property') && value !== 'none' && MOVES.test(value));
        if (moved) out.push(`${sel} { ${prop}: ${value} }`);
      }
    }
  }
  return out;
}

test('the checker finds what moves a marker, and nothing else', () => {
  // The incident itself.
  assert.deepEqual(markerViolations('.k-dot--wide { position: relative; }'), ['.k-dot--wide { position: relative }']);
  // Inside a media query, and qualified by a state.
  assert.equal(markerViolations('@media (max-width: 767px) { .k-bubble:hover { transform: scale(1.1); } }').length, 1);
  assert.equal(markerViolations('.k-bubble { transition: transform 150ms ease; }').length, 1);
  assert.equal(markerViolations('.table-pin { margin-top: -4px; }').length, 1);

  // What a stylesheet may do: paint it, or style what is inside it.
  assert.deepEqual(markerViolations('.k-dot { background: none; border: none; }'), []);
  assert.deepEqual(markerViolations('.k-dot svg { display: block; transform: scale(2); }'), []);
  assert.deepEqual(markerViolations('.k-dot--wide::after { position: absolute; translate: -50% -50%; }'), []);
  assert.deepEqual(markerViolations('.k-bubble:hover { filter: drop-shadow(0 1px 2px #000); }'), []);
  assert.deepEqual(markerViolations('.k-bubble { transition: filter 150ms ease; }'), []);
  assert.deepEqual(markerViolations('.k-bubble { transition: none; }'), []);
  // Somebody else's class that merely contains the word.
  assert.deepEqual(markerViolations('.k-dotted { position: relative; }'), []);
  // A commented-out rule is not a rule.
  assert.deepEqual(markerViolations('/* .k-dot--wide { position: relative; } */'), []);
});

test('rules that follow one another are each read', () => {
  // The shape the first draft skipped: it matched the brace that ends one
  // rule as the start of the next, so the rule after that had no brace left.
  const run = '.a { color: red; } .k-bubble:hover { transform: scale(2); } .k-bubble:active { transform: scale(1); }';
  assert.equal(markerViolations(run).length, 2);
  const three = '.k-pin { position: relative; } .k-pin:hover { transform: scale(1.1); } .k-pin--active { transform: scale(1.2); }';
  assert.equal(markerViolations(three).length, 3);
});

test('no stylesheet moves a map marker from where Leaflet put it', () => {
  const found = ['src/index.css', 'src/custom.css']
    .flatMap(p => markerViolations(read(p)).map(v => `${p}: ${v}`));
  assert.deepEqual(found, [], `these reach a marker Leaflet positions:\n  ${found.join('\n  ')}`);
});
