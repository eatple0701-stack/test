import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { check, extractHero, boxFromCss, HERO, BOX, VIEWPORT } from '../../../scripts/measure-hero.mjs';

// The hero headline fits the phone it is written for.
//
// It did not, for as long as anybody had been looking. On 2026-09-03 the
// shipping hero was measured for the first time and three of its seven
// languages wrapped at a 360px viewport: English to four lines, Japanese to
// four, French to six. Every test was green, every language was present and
// audit-i18n printed 0 — the sentence just did not fit, and nothing in the
// suite had an opinion about the width of anything.
//
// Text width is font shaping, so the numbers in measure-hero.mjs come from a
// browser. What this file does is make them impossible to ignore: they are
// recorded PER LINE OF TEXT, so changing a line invalidates its measurement
// and turns the suite red until somebody re-measures. That is the whole
// trick — the check that cannot run in Node is replaced by a check that the
// numbers still describe the strings on screen.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

test('every hero line fits the box, and the numbers describe the lines on screen', () => {
  const problems = check({ jsx: read('src/components/MainTab.jsx'), css: read('src/index.css') });
  assert.deepEqual(problems, [], `the hero does not fit a ${VIEWPORT}px phone:\n\n${problems.join('\n\n')}`);
});

test('editing a hero line without re-measuring fails', () => {
  // The mutation kept rather than performed once by hand. Change the text in
  // MainTab and the recorded width stops applying to it; the drift check has
  // to notice, or the recorded numbers are decoration.
  // The whole fragment, not just the words: "you walked by" also appears in
  // the comment above the markup, and replacing the first occurrence edited
  // the comment and left the headline alone — a mutation that changes
  // nothing, which is the shape of every test that cannot fail.
  const jsx = read('src/components/MainTab.jsx')
    .replace('<>The dishes<br />you walked by<br />when alone.</>',
      '<>The dishes<br />you walked past<br />when alone.</>');
  const problems = check({ jsx, css: read('src/index.css') });
  assert.equal(problems.length, 1, 'an edited line was not reported');
  assert.match(problems[0], /^en: this script and MainTab\.jsx disagree/);
});

test('widening the box without re-measuring fails', () => {
  // The other half. 320px is derived from .main-hero's padding, so a padding
  // change means every recorded width was measured against a screen that no
  // longer exists — including the ones that only just fit.
  const css = read('src/index.css').replace('padding: 40px 20px 52px', 'padding: 40px 8px 52px');
  const problems = check({ jsx: read('src/components/MainTab.jsx'), css });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /the box is 344px now, not 320px/);
});

test('a line over the box is reported even when nothing else changed', () => {
  // Asserted through check() rather than by eye, because the failure this
  // guards against is a line that fits at 375px and not at 360 — which is
  // exactly the one that shipped.
  const wide = { ...HERO, en: [['The dishes', 222.8], ['you walked past', 327.7], ['when alone.', 244.6]] };
  const overs = Object.entries(wide).flatMap(([lang, lines]) =>
    lines.filter(([, w]) => w > BOX).map(([t, w]) => `${lang}: "${t}" is ${w}px`));
  assert.deepEqual(overs, ['en: "you walked past" is 327.7px'],
    'the outgoing English line is not recognised as too wide');
});

test('the box is read from the stylesheet, not from the phone rule of thumb', () => {
  // 375×812 is written at the top of CLAUDE.md and is what the first
  // measurement used. The number that matters is what the CSS leaves.
  assert.equal(boxFromCss(read('src/index.css'), 360), 320);
  assert.equal(boxFromCss(read('src/index.css'), 375), 335);
  assert.equal(boxFromCss('.main-hero{text-align:center}'), null, 'a missing rule must be unknown, not zero');
});

test('the hero is read out of the component, all seven languages', () => {
  // extractHero decides nothing about fit; it exists so the strings in the
  // script cannot quietly stop being the strings on screen. If it silently
  // returned nothing, every drift check above would pass by comparing air.
  const found = extractHero(read('src/components/MainTab.jsx'));
  assert.deepEqual(Object.keys(found).sort(), ['ar', 'en', 'es', 'fr', 'ja', 'ko', 'zh']);
  for (const [lang, lines] of Object.entries(found)) {
    assert.equal(lines.length, 3, `${lang} did not come out as three lines`);
  }
  assert.deepEqual(found.ko, HERO.ko.map(([t]) => t));
});
