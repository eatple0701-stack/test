// Every say() call that interpolates a value into a translated frame.
//
// audit-i18n.mjs reads string literals and say() calls, and it prints 0 for
// `${menu.contains.join(', ')} 들어감` — the frame is translated, the value is
// not, and a Korean screen reads "pork, shellfish 들어감". On 2026-09-02 that
// exact shape was found five times by eye: the ingredient line, the category
// chip, the restriction label, a host-brief body, and the consent button's
// `${action}` ("동의하고 계속 — open a table"). This is the mechanical sweep
// for the sixth.
//
// It lists every say( … ) whose arguments contain `${`, with the expressions
// being interpolated. It does NOT decide whether a value is translated — a
// per-language map like `labels.map(l => l.kr)` is fine and `${action}` is
// not, and telling them apart is a reading. What it guarantees is that the
// reading covers every site, not the ones somebody happened to open.
//
//   node scripts/audit-interpolation.mjs           # the table
//   node scripts/audit-interpolation.mjs --json    # same, as JSON

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '__tests__') yield* walk(p); }
    else if (/\.(jsx?|mjs)$/.test(e.name)) yield p;
  }
}

/** The text of one say( … ) call starting at `at`, balancing parentheses and skipping strings. */
function callAt(src, at) {
  let depth = 0, i = at, quote = null;
  for (; i < src.length; i += 1) {
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
for (const file of walk(SRC)) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /\bsay\(/g;
  let m;
  while ((m = re.exec(src))) {
    const call = callAt(src, m.index);
    if (!call.includes('${')) continue;
    const line = src.slice(0, m.index).split('\n').length;
    const exprs = [...new Set([...call.matchAll(/\$\{([^}]+)\}/g)].map(x => x[1].trim()))];
    rows.push({ file: path.relative(ROOT, file).replace(/\\/g, '/'), line, exprs });
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log(`${rows.length} say() calls interpolate a value\n`);
  for (const r of rows) console.log(`${r.file}:${r.line}\n    ${r.exprs.join('\n    ')}`);
}
