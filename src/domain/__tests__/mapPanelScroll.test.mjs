import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// On a phone the 장소 tab is a map with a panel under it: the fold, the
// search, the list of places, and 가볼 만한 곳 at the foot. The panel was a
// fixed-height flex column with `overflow: hidden`, and only the list inside
// it scrolled.
//
// 2026-09-11, "음식점 리스트 내릴때 음식점이 너무 먼저 터치돼서 스크롤을 못해
// 위아래로". Measured on a 375px phone with 가볼 만한 곳 opened: the panel 394px
// tall holding 3,583px of content, the list squeezed to 0px, and 207 places in
// an accordion that was clipped rather than scrollable — so a swipe moved
// nothing and the lift landed on whichever restaurant was under the thumb.
// With only the list open it scrolled, inside 224px, where one 174px card is
// 78% of the window.
//
// Below the desktop grid the panel itself is the one scroller now, the list
// and the accordion flow inside it, and the fold stays pinned at its top.
// This reads the stylesheet because the failure is a layout outcome and there
// is no DOM here to lay one out in.

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

/**
 * The declarations a selector gets inside max-width media blocks narrower
 * than the desktop grid, in document order — so a later block overrides an
 * earlier one, as the cascade would for rules of the same specificity.
 */
export function narrowDecls(css, selector) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = {};
  const re = /@media\s*\(\s*max-width:\s*(\d+)px\s*\)\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    if (Number(m[1]) >= 1024) continue;
    let depth = 1;
    let i = re.lastIndex;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth += 1;
      else if (src[i] === '}') depth -= 1;
      i += 1;
    }
    const block = src.slice(re.lastIndex, i - 1);
    for (const r of block.matchAll(/(?:^|(?<=[{}]))\s*([^{}@]+?)\s*\{([^{}]*)\}/g)) {
      if (!r[1].split(',').map(s => s.trim()).includes(selector)) continue;
      for (const d of r[2].split(';')) {
        const k = d.indexOf(':');
        if (k < 0) continue;
        out[d.slice(0, k).trim()] = d.slice(k + 1).trim();
      }
    }
  }
  return out;
}

const PANEL = '.map-overlay--tab .map-overlay__panel';
const LIST = '.map-overlay--tab .map-overlay__list';
const FOLD = '.map-overlay--tab .map-overlay__fold';

test('the helper reads narrow blocks, in order, and nothing else', () => {
  const css = [
    '.a { overflow: hidden; }',
    '@media (max-width: 767px) { .a { overflow-y: auto; } }',
    '@media (min-width: 1024px) { .a { overflow-y: clip; } }',
    '@media (max-width: 1023px) { .b, .a { position: sticky; } .a { overflow-y: scroll; } }',
    '/* @media (max-width: 500px) { .a { overflow-y: visible; } } */',
  ].join('\n');
  assert.deepEqual(narrowDecls(css, '.a'), { 'overflow-y': 'scroll', position: 'sticky' });
  assert.deepEqual(narrowDecls(css, '.nope'), {});
});

test('on a phone the place panel is the one thing that scrolls', () => {
  const css = read('src/index.css');
  const panel = narrowDecls(css, PANEL);
  assert.match(panel['overflow-y'] ?? panel.overflow ?? '', /^(auto|scroll)$/,
    'the panel clips its content instead of scrolling it, so 가볼 만한 곳 cannot be reached');

  // And the list is not a second scroller inside it. Two nested scrollers on
  // a phone is a keyhole: a 224px window where every swipe starts on a card.
  const list = narrowDecls(css, LIST);
  assert.equal(list.overflow ?? list['overflow-y'], 'visible', 'the list still scrolls on its own inside the panel');
});

test('the fold stays in reach while the panel scrolls', () => {
  const fold = narrowDecls(read('src/index.css'), FOLD);
  assert.equal(fold.position, 'sticky', 'the fold scrolls away with the list, and with it the way to close it');
});
