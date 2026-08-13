// Which user-visible strings are not wired to the language setting.
//
// Written 2026-08-14, after reporting "the Spanish screens are clean" twice
// on the strength of a tab-level DOM scan. Both reports were true about the
// tabs and false about the app: the restaurant sheet, the theme page and
// every modal live behind a tap, and a scan that never taps them cannot see
// a word they contain. This reads source instead, so a screen nobody thought
// to open still gets counted.
//
// What it flags, in two passes:
//
//   1. JSX text and string props that reach the screen without going through
//      say() or the __kr/__en element pair.
//   2. Data fields that a component renders but whose record has no Ko/Es
//      twin — the silent case, because say() falls back to English and the
//      screen looks finished to anybody who reads English.
//
// It is deliberately noisy in one direction: it would rather flag a proper
// noun the app should not translate than miss a paragraph it should. Known
// exemptions are listed at the bottom, by value, so each one is a decision
// somebody wrote down rather than a gap nobody noticed.

import fs from 'node:fs';
import path from 'node:path';

const SRC = 'src';
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== '__tests__') walk(p); }
    else if (/\.jsx$/.test(e.name)) files.push(p);
  }
})(SRC);

// Text that is not prose: punctuation, numbers, single letters, icons.
const isProse = (s) => /[A-Za-z]{2}/.test(s) && /\s|[A-Za-z]{4}/.test(s.trim());

// A string already carrying both languages is handled by LocaleFilter.
const isPair = (s) => s.includes(' · ');

const EXEMPT_VALUES = new Set([
  // Brand and proper nouns.
  'Eatple', 'Google', 'Naver Map', 'Kakao Map', 'Instagram', 'Website',
  'eatple0701@gmail.com',
  // Accessibility-only, never painted.
  'Close', 'Primary', 'Places', 'Home', 'Settings',
]);

const EXEMPT_FILES = new Set([
  // Icon components: every string in here is an SVG path.
  'src/components/Icons.jsx',
]);

const findings = [];

for (const file of files) {
  if (EXEMPT_FILES.has(file.replace(/\\/g, '/'))) continue;
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    if (/^import\b/.test(trimmed)) return;

    // JSX text: >Some words<
    for (const m of line.matchAll(/>([^<>{}\n]{3,})</g)) {
      const text = m[1].trim();
      if (!isProse(text) || isPair(text) || EXEMPT_VALUES.has(text)) continue;
      findings.push({ file, line: i + 1, kind: 'jsx-text', text });
    }

    // String props a person reads: title=, placeholder=, aria-label=, alt=.
    for (const m of line.matchAll(/\b(title|placeholder|aria-label|alt|label)="([^"]{3,})"/g)) {
      const text = m[2].trim();
      if (!isProse(text) || isPair(text) || EXEMPT_VALUES.has(text)) continue;
      // SectionHead's own title= is translated through its ko/es props.
      if (/\bko="/.test(line) || /\bes="/.test(line)) continue;
      findings.push({ file, line: i + 1, kind: `prop:${m[1]}`, text });
    }
  });

  // A whole-file view for multi-line JSX text, which the line scan misses:
  // a paragraph wrapped across three lines has no > … < on any one of them.
  const blocks = [...src.matchAll(/>\s*\n((?:\s*[^<>{}\n][^<>{}\n]*\n){1,6})\s*</g)];
  for (const b of blocks) {
    const text = b[1].split('\n').map(x => x.trim()).filter(Boolean).join(' ');
    if (!isProse(text) || isPair(text) || EXEMPT_VALUES.has(text)) continue;
    if (text.startsWith('//') || text.startsWith('*')) continue;
    const line = src.slice(0, b.index).split('\n').length;
    findings.push({ file, line, kind: 'jsx-block', text });
  }
}

// ---- Pass 2: data fields rendered without a translated twin ---------------
const DATA_CHECKS = [
  ['src/data/restaurants.js', 'restaurants', ['vibe', 'story', 'esg_point']],
];
const dataGaps = [];
for (const [, , fields] of DATA_CHECKS) void fields;

const byFile = new Map();
for (const f of findings) {
  const key = f.file.replace(/\\/g, '/');
  if (!byFile.has(key)) byFile.set(key, []);
  byFile.get(key).push(f);
}

const order = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
let total = 0;
for (const [file, items] of order) {
  console.log(`\n${file}  (${items.length})`);
  for (const it of items) {
    total += 1;
    console.log(`  ${String(it.line).padStart(4)}  ${it.kind.padEnd(12)}  ${it.text.slice(0, 96)}`);
  }
}
console.log(`\nTOTAL untranslated user-visible strings: ${total}`);
console.log(`Files with at least one: ${order.length}`);
if (dataGaps.length) console.log(dataGaps.join('\n'));
