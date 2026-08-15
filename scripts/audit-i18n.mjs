// Which user-visible strings are not wired to the language setting.
//
// Written 2026-08-14, after reporting "the Spanish screens are clean" twice
// on the strength of a tab-level DOM scan. Both reports were true about the
// tabs and false about the app: the restaurant sheet, the theme page and
// every modal live behind a tap, and a scan that never taps them cannot see
// a word they contain. This reads source instead, so a screen nobody thought
// to open still gets counted.
//
// Rewritten 2026-08-15 onto a real parser, after it reported zero while the
// place page was printing thirteen English headings and the table page was
// printing fifty-one English sentences to every reader in the world. Both
// were invisible for the same reason: the old passes were regular
// expressions over lines.
//
//   `>([^<>{}\n]{3,})<` cannot match a sentence with a value in the middle,
//   and *that is the shape almost every sentence in this app has* — "Meet at
//   {table.place}", "You and this table both have {sharedLangs}". Every one
//   of them was English on every screen, and the audit said zero.
//
//   The say() argument counter tracked quotes by hand, so the apostrophes in
//   a French JSX fragment read as string delimiters and a four-language call
//   counted as seven.
//
//   Nothing looked at props at all. SectionHead accepts ar/zh/ja and not one
//   of its thirteen call sites passed them.
//
// oxc parses JSX, ships inside rolldown, which vite already installs. The
// four passes below are the same questions asked of a syntax tree.
//
// It is deliberately noisy in one direction: it would rather flag a proper
// noun the app should not translate than miss a paragraph it should. Known
// exemptions are listed by value, so each one is a decision somebody wrote
// down rather than a gap nobody noticed.

import fs from 'node:fs';
import path from 'node:path';
import { parseSync } from 'rolldown/experimental';

const SRC = 'src';
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== '__tests__') walk(p); }
    else if (/\.jsx?$/.test(e.name)) files.push(p);
  }
})(SRC);

/** The helpers that pick a language. A bare string inside one is a translation. */
const SPEAK = new Set(['say', 'crashText', 'chromeWord']);

/** How many arguments a complete say() call carries — one per language. */
const LANGUAGES = 7;

/** Props a person reads. className and href are not among them. */
// "hint" is on this list because it was not, and seven of them shipped in
// English under fields written in seven languages — including the one the
// 8/7 review called out as too long and awkward.
const VISIBLE_ATTR = new Set(['title', 'alt', 'placeholder', 'aria-label', 'label', 'hint']);

const LATIN = /[A-Za-z]/;
const HANGUL = /[가-힣]/;

// The two conventions the stylesheet already answers the setting with: an
// element named __kr / __en beside its twin, and the l-ko-only hooks. Text
// inside either is hidden by CSS keyed off the app root's data-locale.
const HALF_CLASS = /(?:^|\s)(?:[\w-]*(?:__|-)(?:kr|ko|en)|l-(?:ko|en)-only)(?:\s|$)/;

const EXEMPT_FILES = new Set([
  // Icon components: every string in here is an SVG path.
  'src/components/Icons.jsx',
]);

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
  // Typographic quotes written as entities, and the example name in a name
  // field: punctuation and a proper noun, neither a word to translate.
  '&ldquo;', '&rdquo;', 'Aya',
  // The wordmark, in both the forms it is written, and the Korean-only
  // copyright line beneath it.
  '밥친구', '밥친구 잇플 · Eatple',
  '© 2026 밥친구 잇플 · Eatple — 디지털 공공외교 파일럿',
]);

const attrOf = (el, name) => {
  for (const a of el?.attributes ?? []) {
    if (a.type === 'JSXAttribute' && a.name && a.name.name === name) {
      if (a.value && a.value.type === 'Literal') return String(a.value.value);
      return '';   // present, but an expression rather than a literal
    }
  }
  return null;
};

const findings = [];
const dataGaps = [];

for (const file of files) {
  const rel = file.split(path.sep).join('/');
  if (EXEMPT_FILES.has(rel)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const { program, errors } = parseSync(file, src, { lang: 'jsx' });
  if (errors.length) {
    console.error('could not parse ' + rel + ' — ' + errors[0].message);
    process.exitCode = 1;
    continue;
  }
  const lineAt = (i) => src.slice(0, i).split('\n').length;

  const report = (node, text, kind) => {
    const t = String(text).trim().replace(/\s+/g, ' ');
    if (!t || t.length < 2) return;
    if (!LATIN.test(t) && !HANGUL.test(t)) return;   // numbers, punctuation, CJK-only
    if (EXEMPT_VALUES.has(t)) return;
    findings.push({ file: rel, line: lineAt(node.start), kind, text: t });
  };

  const seenCalls = new Set();

  // `inSpeak`: inside say(…), where a bare string is the translation itself.
  // `exempt`: inside [data-no-locale] or a half element, which the stylesheet
  //   already reduces — the language picker has to stay readable in the
  //   language you cannot read.
  // `inAttr`: inside a prop, where `{active ? ' is-on' : ''}` is a class name
  //   rather than a sentence.
  const visit = (n, inSpeak, exempt, inAttr) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { for (const c of n) visit(c, inSpeak, exempt, inAttr); return; }

    // ---- Pass 2: a say() short of a language ------------------------------
    //
    // say(en, ko, es, fr) *falls back to English*, so a call written with
    // four arguments renders perfect English to a Japanese reader and looks
    // finished to anybody who reads English. Nothing about it shows on
    // screen, in the console, or to the lint rule. So the rule is arity, and
    // the parser counts arguments exactly — including the JSX fragments the
    // old scanner's quote tracking choked on.
    if (n.type === 'CallExpression' && n.callee?.type === 'Identifier' && SPEAK.has(n.callee.name)) {
      if (!seenCalls.has(n.start)) {
        seenCalls.add(n.start);
        if (n.arguments.length < LANGUAGES) {
          dataGaps.push('  ' + rel + ':' + lineAt(n.start)
            + '  ' + n.callee.name + '() has ' + n.arguments.length + ' of ' + LANGUAGES + ' languages');
        }
      }
      for (const a of n.arguments) visit(a, true, exempt, inAttr);
      return;
    }

    let nextExempt = exempt;
    if (n.type === 'JSXElement' && n.openingElement) {
      const cls = attrOf(n.openingElement, 'className') ?? '';
      if (attrOf(n.openingElement, 'data-no-locale') !== null || HALF_CLASS.test(cls)) nextExempt = true;

      // ---- Pass 4: a language family of props with members missing -------
      //
      // SectionHead takes title/ko/es/fr/ar/zh/ja and picks between them with
      // the same say(). Thirteen call sites passed the first four and stopped,
      // so the place page printed English headings to Arabic, Chinese and
      // Japanese readers — a whole screen of them, past two shipped language
      // releases, with every other check reading zero. Arity cannot see this:
      // there is no call to count.
      const family = attrOf(n.openingElement, 'ko') !== null || attrOf(n.openingElement, 'es') !== null;
      if (family) {
        const missing = ['ar', 'zh', 'ja'].filter(l => attrOf(n.openingElement, l) === null);
        if (missing.length) {
          dataGaps.push('  ' + rel + ':' + lineAt(n.start)
            + '  <' + (n.openingElement.name?.name ?? '?') + '> has no ' + missing.join(', '));
        }
        // The English title= is the family's own first member, not a bare
        // string; only the children are still worth looking at.
        for (const c of n.children ?? []) visit(c, inSpeak, nextExempt, inAttr);
        return;
      }
    }

    // ---- Pass 1: a string that reaches the screen without say() -----------
    if (!inSpeak && !nextExempt) {
      if (n.type === 'JSXText') report(n, n.value, 'jsx text');

      // A sentence inside a JSX expression — `{n === 1 ? '1 person' : …}`, a
      // template literal, an && guard. The line-based version only ever saw
      // text with no braces in it, which is why 169 of these were invisible.
      if (n.type === 'JSXExpressionContainer' && !inAttr) {
        const dig = (e) => {
          if (!e || typeof e !== 'object') return;
          if (Array.isArray(e)) { for (const c of e) dig(c); return; }
          // 'en-GB' and ', ' are arguments, not words on a screen.
          if (e.type === 'CallExpression' || e.type === 'NewExpression') { dig(e.callee); return; }
          if (e.type === 'JSXElement' || e.type === 'JSXFragment') return;   // visited on its own terms
          // A string being *compared* names a value in the model:
          // `role === 'host'` is not a word anybody reads.
          if (e.type === 'BinaryExpression') {
            if (e.operator !== '+') return;
            dig(e.left); dig(e.right); return;
          }
          if (e.type === 'ConditionalExpression') { dig(e.consequent); dig(e.alternate); return; }
          if (e.type === 'LogicalExpression') { dig(e.right); return; }
          if (e.type === 'Literal' && typeof e.value === 'string') report(e, e.value, 'jsx expr');
          if (e.type === 'TemplateLiteral') for (const q of e.quasis) report(q, q.value.cooked ?? '', 'template');
          for (const k of Object.keys(e)) { if (k !== 'type') dig(e[k]); }
        };
        dig(n.expression);
      }

      if (n.type === 'JSXAttribute' && VISIBLE_ATTR.has(n.name?.name)
        && n.value?.type === 'Literal' && typeof n.value.value === 'string') {
        report(n, n.value.value, 'prop:' + n.name.name);
      }
    }

    const attr = inAttr || n.type === 'JSXAttribute';
    for (const k of Object.keys(n)) { if (k !== 'type') visit(n[k], inSpeak, nextExempt, attr); }
  };
  visit(program, false, false, false);
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
  const rel = file.split(path.sep).join('/');
  if (EXEMPT_FILES.has(rel)) continue;
  const src = fs.readFileSync(file, 'utf8');
  PAIR_FIRST.lastIndex = 0;
  let m;
  while ((m = PAIR_FIRST.exec(src))) {
    if (!/[가-힣]/.test(m[3])) continue;
    dataGaps.push('  ' + rel + ':' + src.slice(0, m.index).split('\n').length
      + '  pair passed with null Korean: ' + m[3].slice(0, 48));
  }
}

const byFile = new Map();
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file).push(f);
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
  console.log('\nsay() calls and prop families short of a language:');
  console.log(dataGaps.join('\n'));
}
console.log(`\nTOTAL untranslated user-visible strings: ${total + dataGaps.length}`);
console.log(`  pass 1 — strings not wired to the setting:  ${total} (in ${order.length} files)`);
console.log(`  pass 2/3/4 — calls and props missing a language: ${dataGaps.length}`);
