// A sheet out of an .xlsx, without opening Excel.
//
// 인천관광공사 publishes its menus as one workbook of five sheets — Korean,
// English, Japanese, and Chinese in both scripts — and this repository has no
// spreadsheet dependency and does not want one. Excel's own COM automation
// exported the first sheet in about two minutes and then hung twice on the
// others, in a session with no desktop to show a dialog in. An .xlsx is a zip
// of XML, so this reads it instead: no dependency, no Excel, and it finishes
// in seconds.
//
// The unzipping is the one thing left outside. Node has zlib but no zip
// reader, and writing one to save a single PowerShell line would be the kind
// of cleverness this repo's comments keep warning about:
//
//   Copy-Item book.xlsx book.zip
//   Expand-Archive book.zip -DestinationPath ./unpacked
//
// Usage:
//   node scripts/xlsx-to-csv.mjs <unpacked-dir> <sheet name> <out.csv> [columns]
//
// `columns` is how many leading columns to keep, default all. Cells are read
// by their own column letter rather than by counting, because a row that
// skips an empty cell — which these sheets do — would otherwise shift every
// value after it into the wrong column.

import fs from 'node:fs';
import path from 'node:path';

const [dir, wanted, out, columnsArg] = process.argv.slice(2);
if (!dir || !wanted || !out) {
  console.log('usage: node scripts/xlsx-to-csv.mjs <unpacked-dir> <sheet name> <out.csv> [columns]');
  process.exit(1);
}
const maxColumns = columnsArg ? Number(columnsArg) : Infinity;

const read = (p) => fs.readFileSync(path.join(dir, p), 'utf8');

const unescapeXml = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&amp;/g, '&');

// ── which file is that sheet ─────────────────────────────────────────────

const workbook = read('xl/workbook.xml');
const rels = read('xl/_rels/workbook.xml.rels');

const sheet = [...workbook.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/>/g)]
  .map(([, name, rid]) => ({ name: unescapeXml(name), rid }))
  .find(s => s.name === wanted);
if (!sheet) {
  const names = [...workbook.matchAll(/<sheet[^>]*name="([^"]+)"/g)].map(m => unescapeXml(m[1]));
  console.log(`no sheet named "${wanted}". This workbook has: ${names.join(', ')}`);
  process.exit(1);
}
const target = new RegExp(`Id="${sheet.rid}"[^>]*Target="([^"]+)"`).exec(rels)?.[1];
if (!target) { console.log(`no target for ${sheet.rid}`); process.exit(1); }

// ── the strings the cells point at ───────────────────────────────────────

/**
 * Shared strings, in order. A cell with t="s" holds an index into this.
 * An <si> can be one <t> or a run of them (<r><t>…</t></r> per formatting
 * change), and the runs are one value split by styling — joined, not listed.
 */
const shared = [];
{
  const xml = fs.existsSync(path.join(dir, 'xl/sharedStrings.xml')) ? read('xl/sharedStrings.xml') : '';
  for (const [, si] of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    let value = '';
    for (const [, t] of si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) value += t;
    shared.push(unescapeXml(value));
  }
}

// ── the sheet ────────────────────────────────────────────────────────────

const letters = (ref) => /^([A-Z]+)/.exec(ref)?.[1] ?? '';
const columnIndex = (ref) => {
  let n = 0;
  for (const ch of letters(ref)) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

const csvCell = (v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const xml = read(`xl/${target.replace(/^\/?xl\//, '')}`);
const lines = [];
let widest = 0;

for (const [, rowXml] of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
  const cells = [];
  for (const m of rowXml.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const [, ref, attrs, body = ''] = m;
    const at = columnIndex(ref);
    if (at >= maxColumns) continue;
    const type = /t="([^"]+)"/.exec(attrs)?.[1];
    let value = '';
    if (type === 's') {
      const i = Number(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1]);
      value = shared[i] ?? '';
    } else if (type === 'inlineStr') {
      for (const [, t] of body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) value += t;
      value = unescapeXml(value);
    } else {
      value = unescapeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '');
    }
    cells[at] = value;
  }
  const width = cells.length;
  if (width > widest) widest = width;
  lines.push(Array.from({ length: width }, (_, i) => csvCell(cells[i] ?? '')).join(','));
}

fs.writeFileSync(out, `${lines.join('\n')}\n`);
console.log(`${wanted}: ${lines.length} rows, ${widest} columns → ${out}`);
