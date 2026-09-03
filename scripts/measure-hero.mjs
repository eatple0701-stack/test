// The home hero headline fits on the phone it is written for.
//
//   node scripts/measure-hero.mjs           # check
//   node scripts/measure-hero.mjs --harness # write the page to re-measure in
//
// Exit code 1 on any failure. heroFits.test.mjs runs the same checks.
//
// ── Why this exists ─────────────────────────────────────────────────────
//
// On 2026-09-03 the shipping hero was measured for the first time and three
// of its seven languages did not fit: English wrapped to four lines, French
// to SIX, Japanese to four. Nothing had ever checked. Every test was green,
// every language was present, audit-i18n printed 0 — the sentence simply did
// not fit the box and nobody had looked at the box.
//
// It went wrong a second way. The first measurement used a 375px viewport,
// because 375×812 is the size at the top of CLAUDE.md, and there the new
// English passed with 7px to spare. 360px is the commoner Android width and
// gives a 320px box, and at 320px it wrapped too. A rig that measures the
// wrong width is worse than none, because it certifies the bug.
//
// ── Where 320px comes from, and why it is a ceiling ─────────────────────
//
//   360px viewport
//    └ .app-shell        no horizontal padding, no max-width
//      └ .content-region no horizontal padding (overflow-y: auto)
//      └ .main-tab       padding-bottom only; max-width 1100px does not bind
//        └ .main-hero    padding: 40px 20px 52px   ← 20 + 20 comes off here
//          └ .main-hero__copy  max-width 620px does not bind
//   * { box-sizing: border-box }, so 360 - 20 - 20 = 320.
//
// Every real deviation makes the box NARROWER: a classic scrollbar on
// .content-region takes ~15px, and phones narrower than 360px exist. A line
// that fits here fits the phone; one that does not, does not.
//
// ── What is checked without a browser, and what is not ──────────────────
//
// Text width is a font-shaping question and no arithmetic answers it, so the
// widths below were measured in a real browser against the shipping
// stylesheet. They are recorded PER LINE OF TEXT. Change a line and its
// recorded width no longer applies, and this fails and tells you to
// re-measure. That is the protection: you cannot edit the hero and stay
// green without opening a browser.
//
// Checked here: the lines in this file are the lines MainTab renders; the
// box is still 320px according to src/index.css; every line has a
// measurement; no measurement exceeds the box; every headline is 3 lines.
// Not checked here: that the recorded numbers are still true if the FONT or
// the font-size changes. --harness rewrites them.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const VIEWPORT = 360;
export const BOX = 320;

/**
 * The seven headlines with the width each line measured at, in px.
 *
 * Measured 2026-09-03 in Chrome against the deployed stylesheet — 44px / 800
 * / -0.88px tracking, Pretendard Variable from the CDN the app imports.
 *
 * ── Read this before re-measuring ───────────────────────────────────────
 *
 * Pretendard ships as a DYNAMIC SUBSET: 314 font faces, and a face only
 * starts loading when a glyph in it is rendered. So `await document.fonts
 * .ready` right after page load resolves against nothing and the first
 * measurement is of the fallback face. That is not theoretical — the first
 * pass at these numbers had 음식들. at 148.6px and a later one at 123.4px,
 * a 25px difference from the same page.
 *
 * The harness below therefore renders every line, then measures in a loop
 * until three consecutive rounds agree. Do not shorten that.
 *
 * Kept as text rather than imported from MainTab because the component holds
 * JSX fragments with <br> elements and there is no string to import; the
 * drift check below reads the component so the copy cannot go stale quietly.
 *
 * ── What the outgoing hero measured, for the record ─────────────────────
 *
 *   en  "cannot be ordered"     370.4px   WRAPS
 *   fr  "ne se commandent pas"  469.3px   WRAPS  (six lines on the phone)
 *   ja  "料理があります。"        328.5px   WRAPS
 *   es  "que no se piden"       318.0px   fit, by 2px
 *   ar  281.4  ko 240.9  zh 256.0         fit
 */
export const HERO = {
  ko: [['혼자라서', 148.6], ['지나쳤던', 148.6], ['음식들.', 123.4]],
  en: [['The dishes', 222.8], ['you walked by', 288.0], ['when alone.', 244.6]],
  es: [['Al ir solo,', 186.2], ['dejaste pasar', 273.3], ['esos platos.', 243.8]],
  fr: [['Les plats', 180.8], ['vus en passant', 305.7], ['tout seul.', 189.1]],
  ar: [['أطباق', 124.7], ['مررتَ بها', 175.1], ['وأنت وحدك.', 238.9]],
  zh: [['那些菜，', 169.7], ['一个人的时候', 260.5], ['你只是路过。', 257.7]],
  ja: [['ひとりだから', 242.2], ['素通りしてきた', 288.1], ['料理です。', 207.4]],
};

/**
 * The lines MainTab actually renders, pulled out of the JSX.
 *
 * A source-text reading, which this project distrusts for good reason — so
 * it decides nothing about whether anything fits. Its only job is to notice
 * that the strings above have stopped being the strings on screen.
 */
export function extractHero(jsx) {
  const out = {};
  const kr = /main-hero__title-kr" translate="no">\s*([\s\S]*?)<\/h1>/.exec(jsx);
  if (kr) out.ko = kr[1].split(/<br\s*\/>/).map(s => s.trim()).filter(Boolean);
  const say = /l-en-only">\s*\{say\(([\s\S]*?)\n\s*\)\}/.exec(jsx);
  if (say) {
    const langs = ['en', 'es', 'fr', 'ar', 'zh', 'ja'];
    [...say[1].matchAll(/<>([\s\S]*?)<\/>/g)].forEach((m, i) => {
      if (langs[i]) out[langs[i]] = m[1].split(/<br\s*\/>/).map(s => s.trim()).filter(Boolean);
    });
  }
  return out;
}

/** The content box .main-hero leaves, read out of the stylesheet. */
export function boxFromCss(css, viewport = VIEWPORT) {
  // The phone rule, not the >=768px one: take the FIRST .main-hero padding.
  const m = /\.main-hero\s*\{[^}]*?padding:\s*(\d+)px\s+(\d+)px/.exec(css);
  if (!m) return null;
  return viewport - Number(m[2]) * 2;
}

/** Everything wrong, as a list of sentences. Empty means it fits. */
export function check({ jsx, css }) {
  const problems = [];

  const rendered = extractHero(jsx);
  for (const lang of Object.keys(HERO)) {
    const mine = HERO[lang].map(([t]) => t).join(' / ');
    const theirs = (rendered[lang] || []).join(' / ');
    if (mine !== theirs) {
      problems.push(`${lang}: this script and MainTab.jsx disagree about the text, so the widths below measure nothing.\n     script:  ${mine}\n     MainTab: ${theirs}\n     Fix the script, re-measure with --harness, and only then trust the result.`);
    }
  }

  const box = boxFromCss(css);
  if (box === null) problems.push('could not find .main-hero padding in the stylesheet — the box is unknown');
  else if (box !== BOX) {
    problems.push(`the box is ${box}px now, not ${BOX}px — .main-hero padding changed, so every width below was measured against a different screen. Re-measure with --harness.`);
  }

  for (const [lang, lines] of Object.entries(HERO)) {
    if (lines.length !== 3) problems.push(`${lang}: ${lines.length} lines, and the hero is three`);
    for (const [text, width] of lines) {
      if (typeof width !== 'number') problems.push(`${lang}: "${text}" has no measurement`);
      else if (width > BOX) problems.push(`${lang}: "${text}" is ${width}px in a ${BOX}px box — it wraps on a ${VIEWPORT}px phone`);
    }
  }
  return problems;
}

/** The page to open when a line changed and the numbers have to be redone. */
export function harness(hero = HERO, viewport = VIEWPORT, box = BOX) {
  const lines = Object.fromEntries(Object.entries(hero).map(([l, ls]) => [l, ls.map(([t]) => t)]));
  return `<!doctype html><meta charset="utf-8"><title>hero measure ${viewport}</title>
<link rel="stylesheet" href="https://eatple.vercel.app/assets/index-CumaLT9b.css">
<style>html,body{margin:0}.phone{width:${viewport}px}</style>
<div class="phone"><header class="main-hero"><div class="main-hero__copy" id="box"></div></header></div>
<pre id="out">measuring…</pre>
<script>
const HERO = ${JSON.stringify(lines)};
(async () => {
  const host = document.getElementById('box');
  const probe = document.createElement('h1');
  probe.className = 'main-hero__title'; probe.textContent = 'x'; host.appendChild(probe);
  const cs = getComputedStyle(probe);
  // Snapshot every value while the element is still attached: a detached
  // element's computed style comes back as empty strings, which cost one
  // whole measuring pass the first time this was written.
  const style = { fontSize: cs.fontSize, weight: cs.fontWeight, tracking: cs.letterSpacing,
                  lineHeight: cs.lineHeight, family: cs.fontFamily };
  const lh = parseFloat(style.lineHeight);
  const measured = host.clientWidth;
  probe.remove();

  // Render everything BEFORE measuring anything. Pretendard is a dynamic
  // subset — a face only loads once a glyph in it is on screen — so
  // measuring a line the moment it is created measures the fallback.
  const spans = [];
  for (const [lang, ls] of Object.entries(HERO)) {
    for (const t of ls) {
      const s = document.createElement('span');
      s.className = 'main-hero__title';
      s.style.cssText = 'white-space:pre;display:inline-block';
      if (lang === 'ar') s.setAttribute('dir', 'rtl');
      s.textContent = t; host.appendChild(s); spans.push({ lang, t, s });
    }
  }
  // Then wait for the widths to stop moving. Three rounds agreeing, not one.
  let prev = null, stable = 0, rounds = 0;
  while (stable < 3 && rounds < 40) {
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 500));
    const now = spans.map(x => Math.round(x.s.getBoundingClientRect().width * 10) / 10);
    stable = (prev && now.join() === prev.join()) ? stable + 1 : 0;
    prev = now; rounds += 1;
  }
  host.innerHTML = '';

  const rows = {};
  spans.forEach((x, i) => { (rows[x.lang] = rows[x.lang] || []).push([x.t, prev[i]]); });
  for (const [lang, ls] of Object.entries(HERO)) {
    const h1 = document.createElement('h1');
    h1.className = 'main-hero__title';
    if (lang === 'ar') h1.setAttribute('dir', 'rtl');
    h1.innerHTML = ls.join('<br>');
    host.appendChild(h1);
    rows[lang] = { widths: rows[lang], lines: h1.getBoundingClientRect().height / lh };
    h1.remove();
  }
  window.__hero = { box: measured, expected: ${box}, style, rounds, stable, rows };
  document.getElementById('out').textContent = JSON.stringify(window.__hero, null, 1);
})();
</script>`;
}

const root = process.cwd();
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  if (process.argv.includes('--harness')) {
    const out = path.join(root, 'tmp-measure-hero.html');
    fs.writeFileSync(out, harness());
    console.log(`Wrote tmp-measure-hero.html. Serve the repo and open it, then read window.__hero
and paste the widths back into HERO in this file. The .phone box is fixed at
${VIEWPORT}px so the window size does not matter. Delete the file after —
.gitignore covers tmp-*.`);
    process.exit(0);
  }
  const problems = check({
    jsx: fs.readFileSync(path.join(root, 'src/components/MainTab.jsx'), 'utf8'),
    css: fs.readFileSync(path.join(root, 'src/index.css'), 'utf8'),
  });
  if (problems.length) {
    console.log(`${problems.length} problem(s) with the hero at ${VIEWPORT}px:\n`);
    for (const p of problems) console.log(`  ${p}\n`);
    process.exit(1);
  }
  const worst = Object.entries(HERO)
    .map(([lang, ls]) => [lang, Math.max(...ls.map(([, w]) => w))])
    .sort((a, b) => b[1] - a[1]);
  console.log(`Hero fits a ${VIEWPORT}px phone (${BOX}px box). Widest line per language:\n`);
  for (const [lang, w] of worst) console.log(`  ${lang}  ${w.toFixed(1)}px   ${(BOX - w).toFixed(0)}px spare`);
}
