// Every English-arm say() string that still names the app in Hangul.
//
// Decided 2026-09-02: inside an English sentence the app is "Eatple"; inside
// a Korean sentence it is 밥친구. Hangul in the middle of a Latin sentence is
// unreadable to most travellers. Only the consent line moved in that batch —
// landing many sites at once is what took production down on 2026-09-01 —
// so this writes the list of the rest into docs/ for a batch of its own.
//
//   node scripts/list-app-name-in-english.mjs

import fs from 'node:fs';
import path from 'node:path';

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '__tests__') yield* walk(p); }
    else if (/\.(jsx?|mjs)$/.test(e.name)) yield p;
  }
}

/** The text of one say( … ) call, balancing parentheses and skipping strings. */
function callAt(src, at) {
  let depth = 0, quote = null;
  for (let i = at; i < src.length; i += 1) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { i += 1; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '(') depth += 1;
    else if (c === ')') { depth -= 1; if (depth === 0) return src.slice(at, i + 1); }
  }
  return src.slice(at);
}

const rows = [];
for (const file of walk('src')) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /\bsay\(/g;
  let m;
  while ((m = re.exec(src))) {
    const call = callAt(src, m.index);
    // The first argument is the English arm. Only a plain string literal is
    // read; a template or an expression is skipped rather than guessed at.
    const first = call.slice(4).match(/^\s*(['"])((?:\\.|(?!\1).)*)\1/);
    if (!first) continue;
    const en = first[2];
    // "한국어 · English" pairs carry Hangul on purpose — LocaleFilter splits them.
    if (!/밥친구|잇플/.test(en) || / · /.test(en)) continue;
    rows.push({ file: path.relative('.', file).replace(/\\/g, '/'), line: src.slice(0, m.index).split('\n').length, en });
  }
}

const md = [
  "# The app's own name inside English strings",
  '',
  'Decided 2026-09-02: inside an English sentence the app is **Eatple**; inside a Korean sentence it is **밥친구**. Hangul in the middle of a Latin sentence is unreadable to most travellers.',
  '',
  'Every English-arm `say()` string that still says 밥친구 or 잇플, found mechanically by `scripts/list-app-name-in-english.mjs`. **Nothing here was changed**: the consent text was the only line in scope, and landing many sites at once is what took production down on 2026-09-01. Fix these in a batch of their own, and re-run the script to confirm the list is empty afterwards.',
  '',
  'Strings written as a "한국어 · English" pair are excluded — there the Hangul is the Korean half and LocaleFilter splits it.',
  '',
  '| file:line | English string |',
  '|---|---|',
  ...rows.map(r => `| ${r.file}:${r.line} | ${r.en.slice(0, 110).replace(/\|/g, '\\|')} |`),
  '',
  `Total: ${rows.length}`,
  '',
];
fs.writeFileSync('docs/app-name-in-english-strings.md', md.join('\n'));
console.log(`docs/app-name-in-english-strings.md: ${rows.length} sites`);
