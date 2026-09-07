import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Two ways the top rail has already gone wrong, held down.
//
// Both are about a scroll container the size of a screen, and both were
// invisible to every other kind of check: the suite was green, the DOM was
// right, and the page still misbehaved under a mouse. Neither can be
// exercised here — Node has no layout, and the behaviour only appears once
// something is scrolled — so these read the source, which CLAUDE.md allows
// only when there is no other option and only with the comments stripped
// first. The comments below name the very things being searched for, and an
// unstripped check would match its own explanation.

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'src/components/MainTab.jsx'), 'utf8');
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, () => ' ')      // block comments, JSX ones included
  .split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

test('turning the rail cannot scroll the page, because it never asks to be seen', () => {
  // scrollIntoView with block: 'nearest' does nothing while the rail is on
  // screen and hauls the page back to the top once it is not. Every four
  // seconds, under somebody reading further down. Reported 2026-09-07.
  assert.doesNotMatch(code, /scrollIntoView/,
    'the rail moves itself with scrollTo; scrollIntoView moves the page too');
  assert.match(code, /\.scrollTo\(\{/, 'the rail has to move somehow');
});

test('a vertical wheel over the rail is answered once, not twice', () => {
  // App.jsx keeps a document-level handler that turns a vertical wheel into
  // sideways scrolling for whichever row the cursor is over. Without
  // stopPropagation both ran on the same event, and scrolling the page down
  // twenty notches turned the top screen from 소개 to 한식 on its own.
  const from = code.indexOf('const onWheel');
  // Forward from there: onScroll calls measure() too, and searching the whole
  // file for it finds that one first and slices backwards into nothing.
  const wheel = code.slice(from, code.indexOf('};', from));
  assert.ok(wheel.length > 0, 'the rail no longer has a wheel handler at all');
  assert.match(wheel, /preventDefault\(\)/, 'the browser would scroll the rail sideways');
  assert.match(wheel, /stopPropagation\(\)/, "App.jsx's handler would scroll it sideways as well");
});
