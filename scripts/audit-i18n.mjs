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
//   2. say() calls carrying fewer arguments than the app has languages, or
//      leaving a pair for the DOM to split — the silent cases, because both
//      look finished to anybody who reads English.
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

// A string carrying Korean and English on one line.
//
// This used to count as handled, and with two languages it was: LocaleFilter
// splits the pair and shows the half the setting asks for. With four it is
// not — the non-Korean half is English, so every one of these read English
// to a Spanish or French reader while the audit reported zero. A pair is now
// only handled when it is an argument to say(), which the inSay check
// covers; a bare one on the screen is a finding.
const isPair = () => false;

// JSX that is a fragment handed to say() as an argument — the provenance
// paragraph and the hero headline are written that way, because they contain
// <strong> and <br /> and cannot be a plain string. The text inside is
// already translated; only the say() call above it is.
const sayLines = (lines) => {
  // Every line that falls inside an open say(…) / crashText(…) call, by
  // counting that call's own parentheses rather than guessing a distance —
  // the Spanish argument of a three-language call starts a dozen lines in.
  const inside = new Set();
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/\b(?:say|crashText)\(/);
    if (!m) continue;
    let depth = 0;
    for (let k = i; k < lines.length; k += 1) {
      const text = k === i ? lines[k].slice(m.index) : lines[k];
      for (const ch of text) {
        if (ch === '(') depth += 1;
        else if (ch === ')') depth -= 1;
      }
      if (k > i) inside.add(k);
      if (depth <= 0) break;
    }
  }
  return inside;
};

// JavaScript, not text: the audit's > … < scan catches JSX control flow like
// ") : blocker ? (" because a ternary sits between two tags.
const isCode = (t) => /^[)(}{]|=>|\?\s*\(|&&|\breturn\b/.test(t.trim());

const EXEMPT_VALUES = new Set([
  // Brand and proper nouns.
  'Eatple', 'Google', 'Naver Map', 'Kakao Map', 'Instagram',
  'eatple0701@gmail.com',
  // Accessibility-only, never painted.
  'Close', 'Primary', 'Places', 'Home', 'Settings',
  // Map attribution. OpenStreetMap's licence requires the credit to appear
  // as it is written; translating it would be a licence problem, not a
  // localisation improvement.
  'OpenStreetMap', '© OpenStreetMap',
  // The wordmark, and the Korean-only copyright line beneath it. Both are
  // the brand written out; the copyright line also carries a -kr class, so
  // the stylesheet already hides it wherever Korean is not wanted.
  '밥친구 잇플 · Eatple',
  '© 2026 밥친구 잇플 · Eatple — 디지털 공공외교 파일럿',
]);

const EXEMPT_FILES = new Set([
  // Icon components: every string in here is an SVG path.
  'src/components/Icons.jsx',
]);

// Lines inside a `data-no-locale` element.
//
// That attribute is the app's own declaration that a block stays bilingual
// whatever the language is set to — LocaleFilter honours it, and the only
// place it is used is the language picker itself, which somebody reaches for
// *because* the app is in a language they cannot read. Text there is exempt
// for the same reason the filter leaves it alone, not because translating it
// would be inconvenient.
//
// The region runs from the attribute to the first closing tag at the same
// indentation, which is what the JSX in this repo actually looks like.
const noLocaleLines = (lines) => {
  const inside = new Set();
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes('data-no-locale')) continue;
    const indent = lines[i].length - lines[i].trimStart().length;
    for (let k = i; k < lines.length; k += 1) {
      inside.add(k);
      const t = lines[k];
      const kIndent = t.length - t.trimStart().length;
      if (k > i && t.trim().startsWith('</') && kIndent === indent) break;
    }
  }
  return inside;
};

const findings = [];

for (const file of files) {
  if (EXEMPT_FILES.has(file.replace(/\\/g, '/'))) continue;
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const inSay = sayLines(lines);
  const noLocale = noLocaleLines(lines);

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    if (/^import\b/.test(trimmed)) return;

    // JSX text: >Some words<
    for (const m of line.matchAll(/>([^<>{}\n]{3,})</g)) {
      const text = m[1].trim();
      if (!isProse(text) || isPair(text) || EXEMPT_VALUES.has(text)) continue;
      if (isCode(text) || inSay.has(i) || noLocale.has(i)) continue;
      findings.push({ file, line: i + 1, kind: 'jsx-text', text });
    }

    // String props a person reads: title=, placeholder=, aria-label=, alt=.
    for (const m of line.matchAll(/\b(title|placeholder|aria-label|alt|label)="([^"]{3,})"/g)) {
      const text = m[2].trim();
      if (!isProse(text) || isPair(text) || EXEMPT_VALUES.has(text)) continue;
      // SectionHead's own title= is translated through its ko/es props.
      if (/\bko="/.test(line) || /\bes="/.test(line)) continue;
      if (noLocale.has(i)) continue;
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
    if (isCode(text)) continue;
    const line = src.slice(0, b.index).split('\n').length;
    if (inSay.has(line - 1) || noLocale.has(line - 1)) continue;
    findings.push({ file, line, kind: 'jsx-block', text });
  }
}

// ---- Pass 2: a say() that is short an argument -----------------------------
//
// This was a stub that measured nothing, and the gap it left is exactly how
// Spanish shipped one screen at a time: say(en, ko, es, fr) *falls back to
// English*, so a call written with three arguments renders perfect English to
// a French reader and looks finished to anybody who reads English. Nothing
// about it shows on screen, in the console, or to the lint rule.
//
// So the rule is arity. Every say() / crashText() / chromeWord() call carries
// one argument per language the app offers; a call with fewer has a language
// missing, and the line number says where.
const LANGUAGES = 6;
const SPEAK = /\b(say|crashText|chromeWord)\(/g;

// The call's own arguments, split on top-level commas. Strings, template
// substitutions, JSX and nested calls all contain commas that are not
// separators, so this walks the text rather than splitting it.
const argsOfCall = (src, openParen) => {
  let depth = 0;
  let inStr = null;
  let tmpl = 0;
  const args = [];
  let start = openParen + 1;
  const BACKTICK = String.fromCharCode(96);
  for (let i = openParen; i < src.length; i += 1) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') { i += 1; continue; }
      if (inStr === BACKTICK && c === '$' && src[i + 1] === '{') { tmpl += 1; i += 1; continue; }
      if (inStr === BACKTICK && c === '}' && tmpl > 0) { tmpl -= 1; continue; }
      if (c === inStr && tmpl === 0) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === BACKTICK) { inStr = c; continue; }
    if (c === '(' || c === '[' || c === '{') { depth += 1; continue; }
    if (c === ')' || c === ']' || c === '}') {
      depth -= 1;
      if (depth === 0) { args.push(src.slice(start, i)); return { args, end: i }; }
      continue;
    }
    if (c === ',' && depth === 1) { args.push(src.slice(start, i)); start = i + 1; }
  }
  return { args, end: src.length };
};

const dataGaps = [];
for (const file of files) {
  if (EXEMPT_FILES.has(file.replace(/\\/g, '/'))) continue;
  const src = fs.readFileSync(file, 'utf8');
  SPEAK.lastIndex = 0;
  let m;
  while ((m = SPEAK.exec(src))) {
    const open = m.index + m[0].length - 1;
    const { args, end } = argsOfCall(src, open);
    SPEAK.lastIndex = end;
    // The definition of one of these helpers, not a call to it.
    if (/(const|function|=>)\s*$/.test(src.slice(Math.max(0, m.index - 12), m.index))) continue;
    // A trailing comma before the closing paren leaves an empty final slot,
    // and counting it made a three-language call look like a four-language
    // one — the exact false zero this pass exists to prevent.
    while (args.length && args[args.length - 1].trim() === '') args.pop();
    if (args.length >= LANGUAGES) continue;
    const line = src.slice(0, m.index).split('\n').length;
    dataGaps.push('  ' + file.replace(/\\/g, '/') + ':' + line
      + '  ' + m[1] + '() has ' + args.length + ' of ' + LANGUAGES + ' languages');
  }
}


// ---- Pass 3: a pair whose Korean is left to the DOM ------------------------
//
// say('상 차리기 · Open a table', null, …) asks LocaleFilter to split the pair
// at render time. That works when the element holds nothing but the label and
// fails when it holds anything else — the front page's two buttons each carry
// an icon beside the text, and both showed the whole pair to a Korean reader
// while every check in this file said zero.
//
// So: if the first argument is a Korean-and-English pair, the second argument
// has to be the Korean. Nothing is left to a DOM pass that may or may not
// reach the node.
const PAIR_FIRST = /\b(say|crashText)\(\s*(['"])([^'"]*·[^'"]*)\2\s*,\s*null\b/g;
for (const file of files) {
  if (EXEMPT_FILES.has(file.replace(/\\/g, '/'))) continue;
  const src = fs.readFileSync(file, 'utf8');
  PAIR_FIRST.lastIndex = 0;
  let m;
  while ((m = PAIR_FIRST.exec(src))) {
    const hangul = /[가-힣]/.test(m[3]);
    if (!hangul) continue;
    const line = src.slice(0, m.index).split('\n').length;
    dataGaps.push('  ' + file.replace(/\\/g, '/') + ':' + line
      + '  pair passed with null Korean: ' + m[3].slice(0, 48));
  }
}

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
if (dataGaps.length) {
  console.log('\nsay() calls short of a language:');
  console.log(dataGaps.join('\n'));
}
console.log(`\nTOTAL untranslated user-visible strings: ${total + dataGaps.length}`);
console.log(`  pass 1 — strings not wired to the setting: ${total} (in ${order.length} files)`);
console.log(`  pass 2 — say() calls missing a language:   ${dataGaps.length}`);
