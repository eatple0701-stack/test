// The menu an Incheon register place's page shows.
//
// The Seoul twin is scripts/build-seoul-menus.mjs, and the files land in the
// same shape — one per 구/군, `m` keyed by the register's own 식당(ID), each
// item [ko, en, ja, zh, price] — so src/data/registryMenus.js reads either
// city without knowing which it has.
//
// ── Where the lines come from ────────────────────────────────────────────
//
// 인천관광공사's 식당메뉴정보(다국어), data.go.kr 15109874: 122,508 lines with
// 메뉴가격 on them, published as one workbook of five sheets — Korean,
// English, Japanese, and Chinese in both scripts. Only the sheets that have
// been exported to CSV beside it are read; a language that is missing leaves
// an empty string, which is what the screen already falls back from (see
// menuName in src/data/registryMenus.js). Korean is required, because a menu
// line with no Korean name is not a menu line this app can point at.
//
// ── Why the prices are here at all ───────────────────────────────────────
//
// This app refuses prices it cannot stand behind, and these are the
// register's own, from its own export, shown under a heading that says so —
// 등록부에 기록된 메뉴. The same rule Seoul's prices ship under. A line with
// no price, or an implausible one, carries 0 and the screen shows none.

import fs from 'node:fs';

const DIR = '인천관광공사';
const OUT = 'public/data/incheon/menus';
const SOURCE = '인천관광공사 맛집 데이터 (data.go.kr 15109874)';

/** The sheets, in the order the app's item shape expects them. */
const LANGS = [
  ['ko', `${DIR}/MENU_INFO_KOREAN.csv`],
  ['en', `${DIR}/MENU_INFO_ENG.csv`],
  ['ja', `${DIR}/MENU_INFO_JPNSE.csv`],
  ['zh', `${DIR}/MENU_INFO_CHCHR.csv`],
];

/** Whole-file CSV, quotes and their newlines honoured. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 1; } else quoted = false;
      } else cur += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(cur); cur = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; continue; }
    cur += ch;
  }
  if (cur || row.length > 0) { row.push(cur); rows.push(row); }
  return rows;
}

const read = (p) => fs.readFileSync(p, 'utf8').replace(/^﻿/, '');
const said = (v) => {
  const s = String(v ?? '').trim();
  return s && s !== '데이터 미집계' ? s : '';
};

// ── which places are on the list, and where their file is ────────────────

const index = JSON.parse(read('public/data/incheon/index.json'));
const slugOf = new Map();
for (const d of index.districts) {
  for (const r of JSON.parse(read(`public/data/incheon/${d.slug}.json`)).rows) {
    slugOf.set(String(r.i), d.slug);
  }
}

// ── the menu lines, Korean first ─────────────────────────────────────────

// 메뉴(ID),메뉴명,메뉴가격,지역특산메뉴여부,지역특산메뉴명,출처(URL),지역명,식당(ID),식당명,지점명
const NAME = 1;
const PRICE = 2;
const MENU_ID = 0;
const RSTR_ID = 7;

/** 메뉴(ID) → name, per language after Korean. */
const translations = new Map(LANGS.slice(1).map(([lang]) => [lang, new Map()]));
const missing = [];
for (const [lang, file] of LANGS.slice(1)) {
  if (!fs.existsSync(file)) { missing.push(lang); continue; }
  for (const f of parseCsv(read(file)).slice(1)) {
    const id = said(f[MENU_ID]);
    const name = said(f[NAME]);
    if (id && name) translations.get(lang).set(id, name);
  }
}

/** More menu lines than this is a franchise database dump, not a menu. */
const MAX_ITEMS = 60;

/** 식당(ID) → [[ko, en, ja, zh, price], …] in the order the register lists them. */
const byPlace = new Map();
let lines = 0;
let kept = 0;
let priced = 0;
let trimmed = 0;

for (const f of parseCsv(read(LANGS[0][1])).slice(1)) {
  const rstr = said(f[RSTR_ID]);
  const ko = said(f[NAME]);
  if (!rstr || !ko) continue;
  lines += 1;
  if (!slugOf.has(rstr)) continue;      // not on the list; its menu is not shipped

  const menuId = said(f[MENU_ID]);
  const price = Number.parseInt(f[PRICE], 10);
  const won = Number.isFinite(price) && price > 0 && price < 2_000_000 ? price : 0;

  const item = [
    ko,
    translations.get('en')?.get(menuId) ?? '',
    translations.get('ja')?.get(menuId) ?? '',
    translations.get('zh')?.get(menuId) ?? '',
    won,
  ];
  if (!byPlace.has(rstr)) byPlace.set(rstr, []);
  const list = byPlace.get(rstr);
  if (list.length >= MAX_ITEMS) { trimmed += 1; continue; }
  list.push(item);
  kept += 1;
  if (won) priced += 1;
}

// ── one file per district ────────────────────────────────────────────────

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith('.json')) fs.unlinkSync(`${OUT}/${f}`);
}

const perSlug = new Map();
for (const [rstr, items] of byPlace) {
  const slug = slugOf.get(rstr);
  if (!perSlug.has(slug)) perSlug.set(slug, {});
  perSlug.get(slug)[rstr] = items;
}

for (const [slug, m] of perSlug) {
  fs.writeFileSync(`${OUT}/${slug}.json`, JSON.stringify({
    source: SOURCE, slug, count: Object.keys(m).length, m,
  }));
}

const withMenu = byPlace.size;
console.log(`menu lines read:     ${lines}`);
console.log(`lines kept:          ${kept}`);
console.log(`  with a price:      ${priced}`);
console.log(`  past the 60 cap:   ${trimmed}`);
console.log(`places with a menu:  ${withMenu} of ${slugOf.size}`);
if (missing.length > 0) {
  console.log(`languages missing:   ${missing.join(', ')} — those names ship empty, and the screen falls back to Korean`);
}
console.log('\n── by district ──');
for (const [slug, m] of [...perSlug].sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length)) {
  console.log(`  ${slug.padEnd(10)} ${String(Object.keys(m).length).padStart(5)} places`);
}
console.log(`\nwritten to ${OUT}/`);
