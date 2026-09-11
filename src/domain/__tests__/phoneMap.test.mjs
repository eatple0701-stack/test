import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { BUBBLE_MEDIA } from '../policy/mapCluster.js';

// The phone's map is one idea in two files. MapComponent draws bubbles where
// BUBBLE_MEDIA matches; index.css turns the list into a drag-to-open sheet
// inside a max-width media query. Rolled apart on 2026-09-11 — the web went
// back to dots, the phone kept both — and from then on the only thing keeping
// the two widths the same is this file. Bubbles without the sheet, or the
// sheet over the dots, is a layout nobody designed.

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

/** The max-width of every @media block whose body contains `needle`. */
function breakpointsContaining(css, needle) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Set();
  const re = /@media\s*\(\s*max-width:\s*(\d+)px\s*\)\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth += 1;
      else if (src[i] === '}') depth -= 1;
      i += 1;
    }
    if (src.slice(re.lastIndex, i).includes(needle)) out.add(Number(m[1]));
  }
  return out;
}

test('the helper finds the breakpoint around a rule, and only that one', () => {
  const css = '@media (max-width: 500px) { .a { x: 1 } } @media (max-width: 900px) { .b { y: 2 } }';
  assert.deepEqual([...breakpointsContaining(css, '.a {')], [500]);
  assert.deepEqual([...breakpointsContaining(css, '.b {')], [900]);
  // Nested blocks count toward the outer one.
  assert.deepEqual([...breakpointsContaining('@media (max-width: 700px) { @media (hover: none) { .c { } } }', '.c')], [700]);
  // A commented-out block is not a block.
  assert.deepEqual([...breakpointsContaining('/* @media (max-width: 1px) { .a { } } */', '.a')], []);
});

test('bubbles are drawn at exactly the widths where the list is a sheet', () => {
  const m = /^\(max-width: (\d+)px\)$/.exec(BUBBLE_MEDIA);
  assert.ok(m, `BUBBLE_MEDIA is not a single max-width query: ${BUBBLE_MEDIA}`);

  // The sheet's own transform — the rule that makes the list slide.
  const sheet = breakpointsContaining(read('src/index.css'), 'translateY(calc(var(--sheet-max');
  assert.equal(sheet.size, 1, `the sheet lives under ${sheet.size} breakpoints: ${[...sheet].join(', ')}`);
  assert.equal(
    Number(m[1]),
    [...sheet][0],
    'the bubbles and the sheet switch at different widths',
  );
});
