// Every kept restaurant's menu, in the four languages the register wrote it.
//
// The 다국어메뉴 설명정보 download holds 873,117 menu rows per language —
// Korean, English, Japanese, Chinese — all keyed by the same 메뉴(ID). Until
// now the app read the Korean file once, used it to decide which restaurants
// serve the twenty-four dishes, and threw the rest away. This keeps the rest:
// for each of the kept restaurants, the menu as the register recorded it,
// which for a traveller is the difference between a name on a map and
// knowing what they can order there.
//
// ── The join, again, and why it is by name ────────────────────────────────
//
// The download's 식당(ID) and the API's RSTR_ID are unrelated id spaces —
// zero of the 6,025 shared ids name the same restaurant (see dish-match.mjs).
// So this joins the same way dish-match does: 식당명 + 지역명, normalised the
// same way, and dropped wherever the name is not unique on either side.
// The shipped district files are the source of truth for which restaurants
// exist and where, so the join runs against them, not against the raw API
// dump — what ships can never disagree with what ships.
//
// ── What is deliberately not taken ────────────────────────────────────────
//
// 메뉴설명 (ingredient tags of very mixed quality — "고기", "피자") and the
// category columns. Names only. The download has no prices, so for once
// there is nothing to refuse.
//
// ── Prices ────────────────────────────────────────────────────────────────
//
// The live API's /api/menu/korean carries MENU_PRICE as a clean integer of
// won, keyed by the same RSTR_ID as everything else — no name-join needed
// for the restaurant, only for the menu line. The app refused prices while
// none could be sourced; these can (the register is the source), and they
// ship with that provenance on the screen: 등록부 기준, which is 2021–22
// data. The owner asked for prices on 2026-08-17 and this is the honest
// version of yes.
//
// Output: public/data/seoul/menus/<district>.json, loaded lazily when a
// register place's page opens — the whole set is ~3MB compressed and nobody
// reads more than one district of it at a time.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';

const SRC = '서울관광재단 다국어메뉴 설명정보';
const FILES = {
  ko: 'DATAGO_SEOUL_2022.MENU_EXPLN_INFO_KOREAN.csv',
  en: 'DATAGO_SEOUL_2022.MENU_EXPLN_INFO_ENG.csv',
  ja: 'DATAGO_SEOUL_2022.MENU_EXPLN_INFO_JPNSE.csv',
  zh: 'DATAGO_SEOUL_2022.MENU_EXPLN_INFO_CHCHR.csv',
};
const DIR = 'public/data/seoul';
const OUT = path.join(DIR, 'menus');

/** More menu lines than this is a franchise database dump, not a menu. */
const MAX_ITEMS = 60;

const norm = (s) => String(s ?? '').replace(/\s+/g, '').replace(/[()（）·・.,'"“”‘’\-_/]/g, '');
const DISTRICT = /서울특별시\s+(\S+구)/;
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

// ── The shipped side: which restaurants exist, and where ─────────────────

const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const slugOfApi = new Map();     // api id -> district slug
const apiByKey = new Map();      // 식당명|구 -> [api ids]
for (const d of index.districts) {
  const { gu, rows } = JSON.parse(fs.readFileSync(path.join(DIR, `${d.slug}.json`), 'utf8'));
  for (const r of rows) {
    slugOfApi.set(r.i, d.slug);
    const k = keyOf(r.n, gu);
    if (apiByKey.has(k)) apiByKey.get(k).push(r.i);
    else apiByKey.set(k, [r.i]);
  }
}

// ── Pass 1: Korean — establish the join and the menu skeletons ───────────

/** csv 식당(ID) -> api id, where the name resolves both uniquely. */
const apiOfCsv = new Map();
const csvIdsByKey = new Map();
const rowsByCsv = new Map();     // csv 식당(ID) -> [{menuId, ko}]

await eachRow(FILES.ko, (f) => {
  const [menuId, name, , , , csvId, rstrNm, region] = f;
  if (!name || !rstrNm || !region) return;
  const k = keyOf(rstrNm, region);
  if (apiByKey.has(k)) {
    if (!csvIdsByKey.has(k)) csvIdsByKey.set(k, new Set());
    csvIdsByKey.get(k).add(csvId);
  }
  if (!rowsByCsv.has(csvId)) rowsByCsv.set(csvId, []);
  const list = rowsByCsv.get(csvId);
  if (list.length < MAX_ITEMS) list.push({ menuId, ko: name.trim() });
});

for (const [k, csvIds] of csvIdsByKey) {
  const apiIds = apiByKey.get(k);
  if (apiIds.length !== 1 || csvIds.size !== 1) continue;   // ambiguous either way
  apiOfCsv.set([...csvIds][0], apiIds[0]);
}

// ── Pass 1.5: the live API's menus, for prices and for the 43 gaps ───────

/** api id -> [{ n: normalised name, raw, price }] */
const apiMenus = new Map();
{
  const rows = JSON.parse(fs.readFileSync('scripts/.cache.local/menusKo.json', 'utf8'));
  const keptIds = new Set(slugOfApi.keys());
  for (const r of rows) {
    if (!keptIds.has(r.RSTR_ID)) continue;
    const price = Number(r.MENU_PRICE);
    if (!apiMenus.has(r.RSTR_ID)) apiMenus.set(r.RSTR_ID, []);
    apiMenus.get(r.RSTR_ID).push({
      n: norm(r.MENU_NM),
      raw: String(r.MENU_NM ?? '').trim(),
      // Sanity band: a 0 is "not recorded", and a menu line over two million
      // won in this register is a typo, not an omakase.
      price: Number.isFinite(price) && price > 0 && price < 2_000_000 ? price : 0,
    });
  }
}

// ── Pass 2: the other three languages, joined by 메뉴(ID) ────────────────

/** menuId -> { en, ja, zh } — only for menus we are going to ship. */
const wanted = new Map();
for (const [csvId] of apiOfCsv) {
  for (const item of rowsByCsv.get(csvId) ?? []) wanted.set(item.menuId, {});
}
for (const lang of ['en', 'ja', 'zh']) {
  await eachRow(FILES[lang], (f) => {
    const t = wanted.get(f[0]);
    if (t && f[1]) t[lang] = f[1].trim();
  });
}

// ── Emit, one file per district ──────────────────────────────────────────

const byDistrict = new Map();
let restaurantsOut = 0;
let itemsOut = 0;

let priced = 0;
const served = new Set();

/** The register's price for this line of this restaurant, or 0. */
const priceFor = (apiId, koName) => {
  const list = apiMenus.get(apiId);
  if (!list) return 0;
  const n = norm(koName);
  return list.find(m => m.n === n)?.price ?? 0;
};

for (const [csvId, apiId] of apiOfCsv) {
  const slug = slugOfApi.get(apiId);
  if (!slug) continue;
  const items = (rowsByCsv.get(csvId) ?? []).map(({ menuId, ko }) => {
    const t = wanted.get(menuId) ?? {};
    // [ko, en, ja, zh, price] — empty string where the register has no
    // translation, 0 where it recorded no price. The screen turns both
    // into a fallback rather than a blank.
    const price = priceFor(apiId, ko);
    if (price) priced += 1;
    return [ko, t.en ?? '', t.ja ?? '', t.zh ?? '', price];
  }).filter(m => m[0]);
  if (!items.length) continue;
  if (!byDistrict.has(slug)) byDistrict.set(slug, {});
  byDistrict.get(slug)[apiId] = items;
  served.add(apiId);
  restaurantsOut += 1;
  itemsOut += items.length;
}

// The restaurants the download names ambiguously get the API's own menu —
// Korean and a price, no translations. A shorter true menu over none.
for (const [apiId, list] of apiMenus) {
  if (served.has(apiId)) continue;
  const slug = slugOfApi.get(apiId);
  if (!slug) continue;
  const items = list.slice(0, MAX_ITEMS)
    .filter(m => m.raw)
    .map(m => { if (m.price) priced += 1; return [m.raw, '', '', '', m.price]; });
  if (!items.length) continue;
  if (!byDistrict.has(slug)) byDistrict.set(slug, {});
  byDistrict.get(slug)[apiId] = items;
  restaurantsOut += 1;
  itemsOut += items.length;
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));

let raw = 0;
let br = 0;
for (const [slug, m] of byDistrict) {
  const body = JSON.stringify({
    source: index.source,
    slug,
    count: Object.keys(m).length,
    m,
  });
  fs.writeFileSync(path.join(OUT, `${slug}.json`), body);
  raw += body.length;
  br += zlib.brotliCompressSync(Buffer.from(body)).length;
}

console.log(`${OUT}/: menus for ${restaurantsOut} of ${slugOfApi.size} kept restaurants (${(100 * restaurantsOut / slugOfApi.size).toFixed(1)}%)`);
console.log(`  ${itemsOut} menu lines, ${priced} with a register price (${(100 * priced / itemsOut).toFixed(1)}%), ${byDistrict.size} district files`);
console.log(`  ${(raw / 1e6).toFixed(1)}MB on disk, ${(br / 1e6).toFixed(2)}MB compressed`);
