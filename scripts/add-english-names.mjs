// An English name for the 8,118 places on the map.
//
// ── Why this is a lookup and not a transliterator ────────────────────────
//
// In English mode the map list read 더플레이스다이닝 / 산채집 / 말모아왕족발
// / 명동뚱뚱이족발 — a Korean-only name, a distance and an emoji, for 8,118
// of the 8,136 places. The obvious fix is a Hangul romaniser, and it is the
// wrong one: it would render 더플레이스다이닝 as "Deopeulleiseudaining",
// which is not a word in any language and is not what the sign says.
//
// The register already knows. 서울관광재단's multilingual menu dataset —
// the same download this repo already parses for menus — carries the
// restaurant's name in English on every menu row, written by whoever
// compiled it: 더플레이스다이닝 is "THE PLACE Dining", 명동뚱뚱이족발 is
// "Myeongdongttungttungi Jokbal". scripts/build-seoul-menus.mjs opens that
// exact file and reads columns 0 and 1, so the name in column 6 has been
// read and thrown away on every build.
//
// ── The id-space trap, again ─────────────────────────────────────────────
//
// The CSV's 식당(ID) and the API's RSTR_ID are unrelated numbers: 6,025 ids
// appear in both files and not one of them is the same restaurant. So this
// joins the way everything else in this repo joins — normalised 식당명 plus
// 구 — and drops the pair when either side is ambiguous. That is the same
// map build-seoul-menus.mjs builds; the join is repeated here rather than
// shared because that script's job is to emit 199,574 menu lines, and
// re-running it to add one field per restaurant would put the menus at risk
// for no reason. If the two ever disagree, this one is wrong.
//
// Output: an `e` key on every district row that resolved. Rows that did not
// keep no `e` at all — an absent field is "we do not have this", which is
// what src/data/seoulRegistry.js already reads every other absent field as.
//
//   node scripts/add-english-names.mjs
//   node scripts/add-english-names.mjs --dry

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const SRC = '서울관광재단 다국어메뉴 설명정보';
const FILES = {
  ko: 'DATAGO_SEOUL_2022.MENU_EXPLN_INFO_KOREAN.csv',
  en: 'DATAGO_SEOUL_2022.MENU_EXPLN_INFO_ENG.csv',
};
const DIR = 'public/data/seoul';
const DRY = process.argv.includes('--dry');

const norm = (s) => String(s ?? '').replace(/\s+/g, '').replace(/[()（）·・.,'"“”‘’\-_/]/g, '');
const keyOf = (name, district) => `${norm(name)}|${norm(district)}`;

function splitCsv(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

async function eachRow(file, fn) {
  const rl = readline.createInterface({
    input: fs.createReadStream(path.join(SRC, file), 'utf8'),
    crlfDelay: Infinity,
  });
  let header = true;
  for await (const line of rl) {
    if (header) { header = false; continue; }
    if (line) fn(splitCsv(line));
  }
}

// ── What is shipped, and where ───────────────────────────────────────────

const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const apiByKey = new Map();      // 식당명|구 -> [api ids]
let shipped = 0;
for (const d of index.districts) {
  const { gu, rows } = JSON.parse(fs.readFileSync(path.join(DIR, `${d.slug}.json`), 'utf8'));
  for (const r of rows) {
    shipped += 1;
    const k = keyOf(r.n, gu);
    if (apiByKey.has(k)) apiByKey.get(k).push(r.i);
    else apiByKey.set(k, [r.i]);
  }
}

// ── The join, off the Korean file ────────────────────────────────────────

const csvIdsByKey = new Map();
await eachRow(FILES.ko, (f) => {
  const [, , , , , csvId, rstrNm, region] = f;
  if (!rstrNm || !region) return;
  const k = keyOf(rstrNm, region);
  if (!apiByKey.has(k)) return;
  if (!csvIdsByKey.has(k)) csvIdsByKey.set(k, new Set());
  csvIdsByKey.get(k).add(csvId);
});

const apiOfCsv = new Map();
let ambiguous = 0;
for (const [k, csvIds] of csvIdsByKey) {
  const apiIds = apiByKey.get(k);
  // Ambiguous either way is dropped, never guessed. Two restaurants with the
  // same name in the same 구 are two restaurants, and picking one would put
  // the wrong sign on the wrong door.
  if (apiIds.length !== 1 || csvIds.size !== 1) { ambiguous += 1; continue; }
  apiOfCsv.set([...csvIds][0], apiIds[0]);
}

// ── The English name, off the English file ───────────────────────────────

// ── The loanword slips, corrected ────────────────────────────────────────
//
// 셰프 is the English word "chef" written in Hangul. Transliterated back
// syllable by syllable it comes out "syepeu", so 한상훈 셰프 was shipping as
// "Hansang Hunsyepeu". A reviewer found that one by eye within seconds of
// opening the map.
//
// The instinct is that this must be everywhere — Korean restaurant names are
// full of 카페, 키친, 치킨, 하우스 — and a fifty-word dictionary is the fix.
// Measured, it is 18 names out of 8,070, 0.22%. The reason is that these
// names were written by a person at 서울관광재단, not by a machine: they wrote
// "Cafe" for 카페 20 times out of 20, "Kitchen" for 키친 23 out of 23,
// "Sushi" 21 out of 21. Where the loanword survived it is that one person
// slipping on a word, not a systematic transliteration bug — there is no
// transliterator here to fix.
//
// So this is a correction list of what was actually observed, not a
// dictionary written against an imagined problem. Applied only when the
// Korean name contains the matching Hangul, so it cannot mangle a name that
// happens to contain the letters.
//
// What it deliberately does not touch: 한상훈 is Han Sang-hoon and the
// register split it "Hansang Hun". Word boundaries in a Korean personal name
// are not recoverable by rule — 한상 is also a word — and guessing would
// rename somebody. That half stays wrong and visible.
// A fifth rule for 홀 → Hall was written and deleted before this shipped:
// it rewrote 민들레홀씨 to "Mindeulle Hol-ssi", and 홀씨 is not the English
// word "hall" at all — it is the Korean for a spore, 민들레 홀씨 being a
// dandelion seed. "Mindeulleholssi" was correct romanisation and the rule
// broke it. That is what a dictionary written against an imagined problem
// does, and it is the argument for keeping this list to slips somebody has
// actually seen on screen.
const LOANWORD_FIXES = [
  [/셰프/, /syepeu/gi, 'Chef'],
  [/비스트로/, /biseuteuro/gi, 'Bistro'],
];

const fixLoanwords = (korean, english) => {
  let out = english;
  for (const [koRe, badRe, word] of LOANWORD_FIXES) {
    if (!koRe.test(korean)) continue;
    // Spaced, not spliced. Substituting in place turned 변두리비스트로 into
    // "ByeonduriBistro" and 한상훈 셰프 into "Hansang HunChef" — a
    // correction that needs its own correction.
    out = out.replace(badRe, ` ${word} `);
  }
  return out.replace(/\s+/g, ' ').trim();
};

const LATIN = /[A-Za-z]/;
const nameOfApi = new Map();
await eachRow(FILES.en, (f) => {
  const csvId = f[5];
  const apiId = apiOfCsv.get(csvId);
  if (apiId === undefined || nameOfApi.has(apiId)) return;
  const name = String(f[6] ?? '').trim();
  const branch = String(f[8] ?? '').trim();
  // A name with no Latin letter in it is the Korean name repeated into the
  // English column, which happens. It is not an English name and pretending
  // otherwise would put the residue count at zero while changing nothing on
  // screen.
  if (!name || !LATIN.test(name)) return;
  nameOfApi.set(apiId, { name, branch });
});

// The Korean name is needed to decide whether a loanword fix applies, and it
// lives on the shipped row rather than in this file, so the correction runs
// at write time below.

// ── Write ────────────────────────────────────────────────────────────────

let named = 0;
let corrected = 0;
let bytesBefore = 0;
let bytesAfter = 0;
for (const d of index.districts) {
  const p = path.join(DIR, `${d.slug}.json`);
  const before = fs.readFileSync(p, 'utf8');
  bytesBefore += Buffer.byteLength(before);
  const data = JSON.parse(before);
  for (const r of data.rows) {
    const hit = nameOfApi.get(r.i);
    if (!hit) { delete r.e; continue; }
    const full = hit.branch && LATIN.test(hit.branch) ? `${hit.name} ${hit.branch}` : hit.name;
    const fixed = fixLoanwords(r.n, full);
    if (fixed !== full) corrected += 1;
    r.e = fixed;
    named += 1;
  }
  const after = JSON.stringify(data);
  bytesAfter += Buffer.byteLength(after);
  if (!DRY) fs.writeFileSync(p, after);
}

const pct = (n) => `${((n / shipped) * 100).toFixed(2)}%`;
console.log(`shipped places   ${shipped}`);
console.log(`csv↔api resolved ${apiOfCsv.size}  (dropped as ambiguous: ${ambiguous})`);
console.log(`english names    ${named}  ${pct(named)}`);
console.log(`without one      ${shipped - named}  ${pct(shipped - named)}`);
console.log(`loanwords fixed  ${corrected}`);
console.log(`district bytes   ${(bytesBefore / 1024).toFixed(0)}KB → ${(bytesAfter / 1024).toFixed(0)}KB`);
if (DRY) console.log('\n(--dry: nothing written)');

// Read back off the files that were just written, so what is printed is what
// shipped rather than what was in memory before the corrections ran.
const written = [];
const fixedRows = [];
for (const d of index.districts) {
  for (const r of JSON.parse(fs.readFileSync(path.join(DIR, `${d.slug}.json`), 'utf8')).rows) {
    if (!r.e) continue;
    if (written.length < 6) written.push(`${r.n} → ${r.e}`);
    for (const [koRe] of LOANWORD_FIXES) {
      if (koRe.test(r.n)) { fixedRows.push(`${r.n} → ${r.e}`); break; }
    }
  }
}
if (written.length) console.log(`\nsample:\n  ${written.join('\n  ')}`);
if (fixedRows.length) console.log(`\nnames a loanword rule touched:\n  ${fixedRows.slice(0, 12).join('\n  ')}`);
