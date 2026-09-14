// Every Incheon restaurant that serves a dish this app exists for.
//
// The Seoul twin of this file is scripts/build-seoul-places.mjs, and the two
// keep the same shape on purpose: one JSON file per 구/군, a small index
// naming each district's box and count, and rows short enough that a phone
// can hold a city. src/data/nearbyPlaces.js reads both the same way.
//
// ── Where this comes from ────────────────────────────────────────────────
//
// 인천관광공사's 맛집 datasets on data.go.kr — 식당기본정보(다국어) 15109871,
// 식당메뉴정보(다국어) 15109874 and 식당운영정보 15109889 — downloaded as
// files rather than read from their OPEN API. The API (incheon.openapi.
// redtable.global, the same vendor that serves Seoul) answers DB_ERROR on
// every endpoint for a registered key as of 2026-09-14; the files are the
// same data and they are already on disk.
//
// ── The join, which is the part that went wrong in Seoul ─────────────────
//
// In Seoul the menu download and the API are two different id spaces, and
// joining on the id produced 3,075 restaurants tagged with somebody else's
// menu (see dish-match.mjs). Here all three files are the same publisher's
// export of one database: 식당(ID) 22482 is 태화원 in every one of them. So
// the join is on the id, and there is nothing to guess.
//
// ── What is kept ─────────────────────────────────────────────────────────
//
// One filter, the app's whole premise: a restaurant is kept only if its own
// menu names one of the twenty-four dishes a person cannot order alone — the
// six groups in scripts/lib/dishes.mjs, the same rules Seoul is built with.
//
// Rows whose coordinates are missing or land outside Incheon keep everything
// except a position: they are real restaurants, and a pin in the wrong place
// is a wrong fact where a missing one is only a missing one. The box is
// generous westward on purpose — 옹진군 reaches 백령도 at 124.7°E, which is
// further from 중구 than 중구 is from Seoul.
//
// ── Two things the register says that this does not fix ──────────────────
//
// "데이터 미집계" is how these files write "we did not collect this". It is a
// sentence, not a value, and it is dropped rather than shown.
//
// The addresses say 서구, and 인천 renamed that district 서해구 and split off
// 검단구 on 2026-07-01. The register is a 2022 export and its own word is what
// it holds, so 서구 is what is written here — the same reason a register
// place never borrows a curated place's prose.

import fs from 'node:fs';
import { ALL_DISHES, matchDish, norm } from './lib/dishes.mjs';

const DIR = '인천관광공사';
const BASE = `${DIR}/인천관광공사_맛집_식당기본정보(다국어)_20221212`;
const FILES = {
  ko: `${BASE}/DATAGO_INCHEON_2025.RSTR_INFO_KOREAN.csv`,
  en: `${BASE}/DATAGO_INCHEON_2025.RSTR_INFO_ENG.csv`,
  menus: `${DIR}/MENU_INFO_KOREAN.csv`,
  oper: `${DIR}/인천관광공사_맛집_식당운영정보_20221212.csv`,
};
const OUT = 'public/data/incheon';

const SOURCE = '인천관광공사 맛집 데이터 (data.go.kr 15109871 · 15109874 · 15109889)';
const LICENCE = '공공저작물 자유이용허락 제1유형: 출처표시';
const BUILT_AT = new Date().toISOString().slice(0, 10);

/** 인천, generously: the mainland, 강화, and the 옹진 islands out to 백령도. */
const INCHEON = { s: 36.9, n: 38.05, w: 124.5, e: 126.95 };
const inIncheon = (lat, lng) => lat >= INCHEON.s && lat <= INCHEON.n && lng >= INCHEON.w && lng <= INCHEON.e;

const DISTRICT_EN = {
  중구: 'Jung-gu', 동구: 'Dong-gu', 미추홀구: 'Michuhol', 연수구: 'Yeonsu', 남동구: 'Namdong',
  부평구: 'Bupyeong', 계양구: 'Gyeyang', 서구: 'Seo-gu', 강화군: 'Ganghwa', 옹진군: 'Ongjin',
};

/** The file's way of saying it has nothing. */
const NOT_COLLECTED = '데이터 미집계';
const said = (v) => {
  const s = String(v ?? '').trim();
  return s && s !== NOT_COLLECTED ? s : null;
};

/**
 * A whole CSV into rows.
 *
 * Line by line is not enough here: 식당소개내용 runs to eight thousand
 * characters and carries its own newlines inside quotes, which is what makes
 * two of the 34,177 rows look like they are in no district at all when the
 * file is read a line at a time.
 */
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

const readUtf8 = (p) => fs.readFileSync(p, 'utf8').replace(/^﻿/, '');
/** 식당운영정보 is the one file the publisher exported in CP949. */
const readCp949 = (p) => new TextDecoder('euc-kr').decode(fs.readFileSync(p)).replace(/^﻿/, '');

// ── 1. the menus, which decide who is on this list ────────────────────────

const dishesOf = new Map();      // 식당(ID) → Set of dish ids
const dishCounts = new Map();    // dish id → menu lines that named it
let menuLines = 0;
let menuHits = 0;

{
  const rows = parseCsv(readUtf8(FILES.menus));
  // 메뉴(ID),메뉴명,메뉴가격,지역특산메뉴여부,지역특산메뉴명,지역특산메뉴출처(URL),지역명,식당(ID),식당명,지점명
  for (const f of rows.slice(1)) {
    if (f.length < 8) continue;
    const name = norm(f[1]);
    const id = String(f[7] ?? '').trim();
    if (!name || !id) continue;
    menuLines += 1;
    let hit = false;
    for (const dish of ALL_DISHES) {
      if (!matchDish(name, dish)) continue;
      hit = true;
      if (!dishesOf.has(id)) dishesOf.set(id, new Set());
      dishesOf.get(id).add(dish.id);
      dishCounts.set(dish.id, (dishCounts.get(dish.id) ?? 0) + 1);
    }
    if (hit) menuHits += 1;
  }
}

// ── 2. the names somebody wrote in English, for the list in every other language ──

const englishName = new Map();
{
  const rows = parseCsv(readUtf8(FILES.en));
  for (const f of rows.slice(1)) {
    const id = String(f[0] ?? '').trim();
    const name = said(f[1]);
    if (id && name) englishName.set(id, name);
  }
}

// ── 3. hours, and whether the place says it has a menu somebody can read ──

const operOf = new Map();
{
  const rows = parseCsv(readCp949(FILES.oper));
  // 식당(ID),식당명,지점명,지역명,주차,와이파이,놀이방,다국어메뉴판제공여부,화장실,휴무일정보내용,영업시간내용,…
  for (const f of rows.slice(1)) {
    const id = String(f[0] ?? '').trim();
    if (!id) continue;
    const hours = said(f[10]);
    const closed = said(f[9]);
    const line = [hours, closed && closed !== '연중무휴' ? `휴무 ${closed}` : null].filter(Boolean).join(' · ');
    operOf.set(id, { h: line || null, foreign: said(f[7]) === 'Y' });
  }
}

// ── 4. the restaurants themselves ─────────────────────────────────────────

const buckets = new Map();
let kept = 0;
let withGeo = 0;
let outOfRange = 0;
let noDistrict = 0;
let foreignMenu = 0;

{
  const rows = parseCsv(readUtf8(FILES.ko));
  // 식당(ID),식당명,지점명,도로명주소,지번주소,식당위도,식당경도,식당대표전화번호,영업신고증업태명,영업인허가명,식당소개내용
  for (const f of rows.slice(1)) {
    const id = String(f[0] ?? '').trim();
    const dishes = dishesOf.get(id);
    if (!id || !dishes) continue;

    const address = said(f[3]) ?? said(f[4]);
    const gu = /인천광역시\s+(\S+?[구군])/.exec(address ?? '')?.[1] ?? null;
    if (!gu || !DISTRICT_EN[gu]) { noDistrict += 1; continue; }

    const lat = Number.parseFloat(f[5]);
    const lng = Number.parseFloat(f[6]);
    const geo = Number.isFinite(lat) && Number.isFinite(lng) && inIncheon(lat, lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && !geo) outOfRange += 1;

    const oper = operOf.get(id) ?? {};
    const row = {
      i: Number(id),
      n: said(f[1]) ?? '',
      a: address,
      ...(said(f[7]) ? { t: said(f[7]) } : {}),
      ...(geo ? { y: Math.round(lat * 1e7) / 1e7, x: Math.round(lng * 1e7) / 1e7 } : {}),
      ...(oper.h ? { h: oper.h } : {}),
      ...(said(f[8]) ? { c: said(f[8]) } : {}),
      ...(oper.foreign ? { f: 1 } : {}),
      d: [...dishes],
      ...(englishName.has(id) ? { e: englishName.get(id) } : {}),
    };
    if (!row.n) continue;

    if (!buckets.has(gu)) buckets.set(gu, []);
    buckets.get(gu).push(row);
    kept += 1;
    if (geo) withGeo += 1;
    if (oper.foreign) foreignMenu += 1;
  }
}

// ── 5. one file per district, and an index ───────────────────────────────

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith('.json')) fs.unlinkSync(`${OUT}/${f}`);
}

const districts = [...buckets.entries()]
  .map(([gu, rows]) => {
    const placed = rows.filter(r => r.y !== undefined);
    const box = placed.length > 0 ? {
      s: Math.min(...placed.map(r => r.y)),
      n: Math.max(...placed.map(r => r.y)),
      w: Math.min(...placed.map(r => r.x)),
      e: Math.max(...placed.map(r => r.x)),
    } : null;
    return {
      slug: DISTRICT_EN[gu],
      gu,
      en: DISTRICT_EN[gu],
      count: rows.length,
      withGeo: placed.length,
      foreign: rows.filter(r => r.f === 1).length,
      box: box && {
        s: Math.round(box.s * 1e4) / 1e4,
        n: Math.round(box.n * 1e4) / 1e4,
        w: Math.round(box.w * 1e4) / 1e4,
        e: Math.round(box.e * 1e4) / 1e4,
      },
      rows,
    };
  })
  .sort((a, b) => b.count - a.count);

for (const d of districts) {
  fs.writeFileSync(`${OUT}/${d.slug}.json`, JSON.stringify({
    gu: d.gu, en: d.en, count: d.count, rows: d.rows,
  }));
}

fs.writeFileSync(`${OUT}/index.json`, JSON.stringify({
  source: SOURCE,
  licence: LICENCE,
  builtAt: BUILT_AT,
  total: kept,
  withGeo,
  foreignMenu,
  districts: districts.map(({ rows, ...rest }) => rest),
}));

// ── what happened ────────────────────────────────────────────────────────

console.log(`menu lines read:        ${menuLines}`);
console.log(`lines naming a dish:    ${menuHits}`);
console.log(`restaurants with one:   ${dishesOf.size}`);
console.log(`  no district in 인천:   ${noDistrict}`);
console.log(`  coordinates dropped:  ${outOfRange}`);
console.log(`RESTAURANTS KEPT:       ${kept}  (${withGeo} placed, ${foreignMenu} with a multilingual menu)`);
console.log('\n── by district ──');
for (const d of districts) console.log(`  ${d.gu.padEnd(6)} ${String(d.count).padStart(5)}  → ${d.slug}.json`);
console.log('\n── menu lines matched per dish ──');
for (const dish of ALL_DISHES) {
  console.log(`  ${dish.ko.padEnd(6)} ${String(dishCounts.get(dish.id) ?? 0).padStart(6)}`);
}
console.log(`\nwritten to ${OUT}/`);
