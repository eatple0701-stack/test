import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { localeText } from '../policy/locale.js';
import { displayName } from '../../data/seoulRegistry.js';

// A9 — what an English reader actually ends up looking at.
//
// ── Why this file is not a DOM test ──────────────────────────────────────
//
// There is no DOM in this repo: no jsdom, no testing-library, the runner is
// bare `node --test`, and not one of the other test files imports a .jsx
// component. Standing one up is not the answer either, because half of what
// this file guards is invisible to `textContent` by design. LocaleFilter
// hides Korean two different ways — it rewrites text-node values in place
// (LocaleFilter.jsx), which really does remove the text, and the stylesheet
// sets `display: none` on `[class$="__kr"]`, which leaves every character
// exactly where it was. A textContent probe would report a false alarm on
// everything the CSS hides and prove nothing about the half the JS handles.
//
// So this reads the source and the stylesheet, and — where it can — runs the
// real function.
//
// ── The three bugs it was written from ───────────────────────────────────
//
// 1. Every festival card was invisible in six of the eight locales. The
//    stylesheet hides `[class$="-kr"]`, which is a suffix match on the whole
//    class ATTRIBUTE rather than on one class token, and the card's attribute
//    ended `gather-card--kr` — a decorative BEM modifier that had never held
//    a word of Korean. `Festival Picks` was a heading over nothing. Seasonal
//    Foods had the same bug and looked fine, because appending
//    ` is-highlighted` for an in-season dish pushed `--kr` off the end.
//
// 2. `localeText` splits a bilingual label on its first ' · ' and keeps one
//    side, so two diets joined with ', ' — "비건 · Vegan, 할랄 · Halal" —
//    reduced to "Halal". A guest who said vegan *and* halal was shown to
//    their host as halal.
//
// 3. 8,118 of the 8,136 places on the map had a Korean-only name, so an
//    English reader got 말모아왕족발 and a distance.
//
// None of the three was visible to `npm test` or to scripts/audit-i18n.mjs.
// The audit reports string literals and template quasis; all three of these
// are data read through member expressions, or CSS, or both. That is the
// hole this file exists to cover, not a second copy of the audit.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const css = read('src/index.css');

const HANGUL = /[가-힣]/;
const LATIN = /[A-Za-z]/;

const componentFiles = fs.readdirSync(path.join(root, 'src/components'))
  .filter(f => /\.jsx$/.test(f))
  .map(f => ({ file: `src/components/${f}`, text: read(`src/components/${f}`) }));

// ── The stylesheet's own rule, read rather than restated ─────────────────

/**
 * Every class-attribute suffix the stylesheet hides on an English screen.
 * Derived from index.css so that this file cannot drift from it — a test
 * that hard-codes `['__kr', '-kr']` keeps passing after somebody changes the
 * convention, which is the failure mode that produced bug 1.
 */
const hiddenSuffixes = [...css.matchAll(/\[data-locale="en"\]\s*\[class\$="([^"]+)"\]/g)]
  .map(m => m[1]);

const hiddenInEn = (classAttr) => hiddenSuffixes.some(s => String(classAttr).endsWith(s));

test('the stylesheet convention is discoverable, so the rest of this file means something', () => {
  assert.ok(hiddenSuffixes.length >= 2, 'found no [data-locale="en"] [class$="…"] rules — every check below would pass vacuously');
  assert.ok(hiddenSuffixes.includes('__kr'), hiddenSuffixes.join(', '));
  assert.ok(hiddenSuffixes.includes('-kr'), hiddenSuffixes.join(', '));
});

// Every className, as the browser would see the attribute. A template
// literal is flattened with its expressions removed, which is how
// `gather-card--kr${inSeason ? ' is-highlighted' : ''}` was able to hide
// only some of the time.
const classAttrs = [];
for (const { file, text } of componentFiles) {
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      classAttrs.push({ file, line: i + 1, raw: m[1] ?? m[2], src: line.trim() });
    }
  });
}

test('no class token is a BEM modifier wearing the language suffix', () => {
  // `--kr` is a modifier. `__kr` and `-kr` name the Korean half of a pair.
  // The stylesheet cannot tell them apart, because a CSS suffix selector
  // reads the whole attribute string and has no notion of a class token, so
  // the convention has to be kept in the names themselves.
  const offenders = [];
  for (const { file, line, raw } of classAttrs) {
    for (const token of raw.split(/\s+/).filter(Boolean)) {
      if (/--(kr|en|ko)$/.test(token)) offenders.push(`${file}:${line} — ${token}`);
    }
  }
  assert.deepEqual(offenders, [], `a modifier ending in the language suffix hides its whole element:\n${offenders.join('\n')}`);
});

test('nothing that holds a card is hidden by the language selector', () => {
  // A card carries `data-kr` to paint its watermark, and a card is a
  // container: hiding it takes its heading, its description and its dates
  // with it. Only a leaf that IS the Korean half may be hidden.
  const offenders = [];
  for (const { file, text } of componentFiles) {
    text.split('\n').forEach((line, i) => {
      if (!/\bdata-kr=/.test(line)) return;
      const m = line.match(/className=(?:"([^"]*)"|\{`([^`]*)`\})/);
      const raw = m ? (m[1] ?? m[2]) : '';
      if (hiddenInEn(raw)) offenders.push(`${file}:${i + 1} — class="${raw}"`);
    });
  }
  assert.deepEqual(offenders, [], `these elements vanish for every non-Korean reader:\n${offenders.join('\n')}`);
});

test('the stylesheet has no modifier in the language namespace either', () => {
  // The mirror of the test above, and the half that was missing. Renaming
  // the class in the JSX and leaving `.gather-card--kr` in index.css passed
  // every test in the suite: the JSX check saw nothing wrong, the card had
  // no watermark any more, and the stylesheet still held a live rule that
  // would hide the next element to reuse that name.
  const offenders = [];
  for (const m of css.matchAll(/^\.([\w-]*--(?:kr|en|ko))\b/gm)) offenders.push(m[1]);
  assert.deepEqual([...new Set(offenders)], [], `stylesheet rules for language-suffixed modifiers:\n${offenders.join('\n')}`);
});

test('every class the JSX asks for is a class the stylesheet defines', () => {
  // Not all of them — that would flag every utility and state class. Just
  // the block--modifier pairs on the two card families this bug lived in,
  // where a rename in one file and not the other is silent in both.
  const wanted = new Set();
  for (const { raw } of classAttrs) {
    for (const token of raw.split(/\s+/).filter(Boolean)) {
      if (/^(gather-card|place-card|market-card)--[\w-]+$/.test(token)) wanted.add(token);
    }
  }
  assert.ok(wanted.size > 0, 'no card modifiers found — this test asserts nothing');
  for (const token of wanted) {
    assert.match(css, new RegExp(`^\\.${token.replace(/[-]/g, '\\-')}\\b`, 'm'), `.${token} is used in JSX and has no rule in index.css`);
  }
});

// ── A pair is one pair ───────────────────────────────────────────────────

test('localeText keeps only one side of a middot pair — which is why pairs are never joined', () => {
  // Run the real function. This is the executable heart of the file: the
  // behaviour is correct and the call site was wrong, so asserting the
  // behaviour is what makes the call-site rule below legible.
  assert.equal(localeText('비건 · Vegan', 'en'), 'Vegan');
  assert.equal(localeText('비건 · Vegan', 'ko'), '비건');
  // Two pairs in one string is not two pairs to this function.
  assert.equal(localeText('비건 · Vegan, 할랄 · Halal', 'en'), 'Halal');
});

test('no component joins bilingual pairs into one string', () => {
  const offenders = [];
  for (const { file, text } of componentFiles) {
    text.split('\n').forEach((line, i) => {
      if (!/·/.test(line)) return;
      // A ' · ' pair built inside a map/join lands in one text node with its
      // neighbours, and localeText then treats the lot as a single pair.
      if (/\.(map|join)\(/.test(line) && /\$\{[^}]*\.(kr|ko)\}\s*·/.test(line)) {
        offenders.push(`${file}:${i + 1} — ${line.trim().slice(0, 90)}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `each pair needs its own element:\n${offenders.join('\n')}`);
});

// ── The map, in a language its reader can read ───────────────────────────

test('a register place has a name an English reader can read', () => {
  // 8,118 rows, and the English screen showed 더플레이스다이닝 / 산채집 /
  // 말모아왕족발. The register's own multilingual menu file carries a
  // human-written English name for almost all of them; this asserts the app
  // reaches for it.
  const districts = JSON.parse(read('public/data/seoul/index.json')).districts;
  let checked = 0;
  let hangulOnly = 0;
  const examples = [];
  for (const d of districts) {
    for (const row of JSON.parse(read(`public/data/seoul/${d.slug}.json`)).rows) {
      const shown = displayName(row, 'en');
      assert.ok(shown && String(shown).trim(), `${d.slug}/${row.i} renders an empty name in English`);
      checked += 1;
      if (!LATIN.test(shown)) {
        hangulOnly += 1;
        if (examples.length < 5) examples.push(`${row.n} → ${shown}`);
      }
    }
  }
  assert.ok(checked > 8000, `only ${checked} rows checked — the register did not load`);
  // A ratchet, not a target. 48 is what the register's own English file
  // leaves uncovered today (김밥나라, 네네치킨, 나주곰탕 — mostly chains and
  // very short names). It may be lowered when somebody closes some of them —
  // a full /api/menu/eng refetch is thought to reach about seventeen, and
  // the rest want a hand-written table with a note saying who wrote it. It
  // must never be raised: a rising number means names are being lost, and
  // the only reason to raise it would be to stop this test saying so.
  const CEILING = 48;
  assert.ok(
    hangulOnly <= CEILING,
    `${hangulOnly} of ${checked} register places have no readable English name (ceiling ${CEILING}), e.g.\n  ${examples.join('\n  ')}`,
  );
});

test('a Korean reader still gets the Korean name', () => {
  // English is the say() fallback, so the dangerous direction is silent:
  // a romanisation shown to a Korean reader looks like a working screen.
  const rows = JSON.parse(read('public/data/seoul/Jongno.json')).rows.slice(0, 200);
  for (const row of rows) {
    assert.equal(displayName(row, 'ko'), row.n, `${row.i} shows a Korean reader something other than its sign`);
  }
});

test('every screen that names a register place asks displayName for it', () => {
  // The data can hold 8,070 English names and the map list can still print
  // Korean, because the row and the place object spell the field
  // differently and each screen reaches for it by hand. These are the three
  // places a register name reaches a reader.
  for (const [file, marker] of [
    ['src/components/BottomSheetList.jsx', 'the map list row'],
    ['src/components/MapComponent.jsx', 'the map popup card'],
    ['src/components/RegistryPlaceSheet.jsx', 'the register place sheet'],
  ]) {
    assert.match(read(file), /displayName\(/, `${marker} (${file}) still names places itself`);
  }
  // And the tile behind the name: a single Hangul syllable is not an
  // initial to a reader who cannot read Hangul, and 8,118 of them were the
  // same handful of shapes.
  const image = read('src/components/PlaceImage.jsx');
  assert.match(image, /primaryGroup\(/);
  assert.doesNotMatch(image, /\{getInitials\(place\.name\)\}/, 'the tile still prints a raw initial for every place');
});

test('the English name is treated as reported, never as checked', () => {
  // It arrives through the same name+구 join the menus use, from a public
  // dataset nobody here has verified against the shopfront. Rule 1.
  const registry = read('src/data/seoulRegistry.js');
  assert.match(registry, /export const displayName/);
  assert.match(registry, /reported/);
});
