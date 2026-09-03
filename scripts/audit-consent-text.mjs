// The consent text that shipped is the consent text that was approved.
//
// docs/rules-consent-text.md is what the team said yes to, transcribed by
// hand at the moment of approval. src/content/safety.js is what a traveller
// reads. This compares them character by character and fails on any
// difference. 8 strings × 7 languages = 56 comparisons.
//
// ── Why a script and not a test ─────────────────────────────────────────
//
// It is both: consentText.test.mjs calls compare() so the suite fails on
// drift, and this runs alone so a person can see the 56 lines. The reason it
// exists at all is that the same batch was drafted twice and came back
// different — a Chinese fix the team had approved (dropping 再 from ifBroken,
// which drifts the promise toward "never again") was present in one run and
// absent in the next, and nothing but a person's eye stood between the two.
// 56 strings in seven scripts is past what an eye can hold.
//
// ── Why nothing is normalised ───────────────────────────────────────────
//
// No trimming, no NFC, no stripping of Arabic harakat. The fatha on مررتَ in
// the hero is the difference between "you passed by" and "I passed by", and a
// comparison that normalises diacritics away is exactly the comparison that
// would let one go missing. Whitespace is not collapsed either: a double
// space between sentences is a real difference in a string somebody reads.
//
//   node scripts/audit-consent-text.mjs
//
// Exit code 1 on any mismatch, so it can gate a push.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DOC = 'docs/rules-consent-text.md';
const LANGS = ['en', 'ko', 'es', 'fr', 'ar', 'zh', 'ja'];

/**
 * The approved text, read out of the document's fenced blocks.
 *
 * A block is claimed by the heading above it, so the heading text is the
 * field name — which means renaming a heading breaks the parse loudly rather
 * than silently comparing nothing.
 */
export function fromDoc(markdown) {
  const out = new Map();
  let heading = null;
  let inBlock = false;
  let current = null;
  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) { heading = h[1]; continue; }
    if (line.trim() === '```text') { inBlock = true; current = new Map(); continue; }
    if (inBlock && line.trim() === '```') {
      inBlock = false;
      if (current.size) out.set(heading, current);
      current = null;
      continue;
    }
    if (!inBlock) continue;
    const m = /^(en|ko|es|fr|ar|zh|ja): (.*)$/.exec(line);
    if (m) current.set(m[1], m[2]);
  }
  return out;
}

/** Field name in the doc → the object in safety.js that should match it. */
export function fromCode(safety) {
  const { RULES, PURPOSE, AGREE_ACTION, agreeLabel } = safety;
  return new Map([
    ['RULES[0]', RULES[0]],
    ['RULES[1]', RULES[1]],
    ['RULES[2]', RULES[2]],
    ['RULES[3]', RULES[3]],
    ['PURPOSE.rule', PURPOSE.rule],
    ['PURPOSE.ifBroken', PURPOSE.ifBroken],
    ['버튼 — 상 차리기 (`open-table`)', agreeLabel(AGREE_ACTION.OPEN_TABLE)],
    ['버튼 — 자리 요청 (`ask-seat`)', agreeLabel(AGREE_ACTION.ASK_SEAT)],
  ]);
}

/**
 * Every difference between the two, and how many pairs were looked at.
 *
 * The count is returned rather than assumed because the dangerous failure of
 * a comparison like this is comparing nothing and reporting agreement — a
 * renamed heading, a fence written as ``` instead of ```text, and the doc
 * silently contributes zero fields.
 */
export function compare(doc, code) {
  const problems = [];
  let compared = 0;
  for (const [field, expected] of code) {
    const approved = doc.get(field);
    if (!approved) { problems.push(`${field}: the document has no block for this — check the heading`); continue; }
    for (const lang of LANGS) {
      const a = approved.get(lang);
      const b = expected[lang];
      if (a === undefined) { problems.push(`${field}.${lang}: missing from the document`); continue; }
      if (b === undefined) { problems.push(`${field}.${lang}: missing from safety.js`); continue; }
      compared += 1;
      if (a !== b) {
        problems.push(`${field}.${lang}\n     approved: ${a}\n     shipping: ${b}\n     ${firstDifference(a, b)}`);
      }
    }
  }
  for (const field of doc.keys()) {
    if (!code.has(field)) problems.push(`${field}: the document has a block nothing in safety.js claims`);
  }
  return { problems, compared };
}

/** Where they part, in code points, so an invisible character is nameable. */
function firstDifference(a, b) {
  const A = [...a];
  const B = [...b];
  for (let i = 0; i < Math.max(A.length, B.length); i += 1) {
    if (A[i] !== B[i]) {
      const show = (c) => (c === undefined ? '(end)' : `${JSON.stringify(c)} U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
      return `first difference at character ${i + 1}: approved ${show(A[i])} vs shipping ${show(B[i])}`;
    }
  }
  return 'identical by code point — the difference is in length';
}

const root = process.cwd();
export async function run() {
  const safety = await import(pathToFileURL(path.join(root, 'src/content/safety.js')).href);
  const doc = fromDoc(fs.readFileSync(path.join(root, DOC), 'utf8'));
  return compare(doc, fromCode(safety));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const { problems, compared } = await run();
  if (problems.length) {
    console.log(`${problems.length} mismatch(es) between ${DOC} and src/content/safety.js:\n`);
    for (const p of problems) console.log(`  ${p}\n`);
    console.log(`compared ${compared} strings`);
    process.exit(1);
  }
  console.log(`${compared} strings compared, character by character. No differences.`);
}
