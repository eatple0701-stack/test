// Which restaurants actually serve the dishes this app is about.
//
// The register's 업태 field says 한식 for 51,282 places, which tells a
// traveller nothing — it is the same word for a 김밥천국 and for a place that
// only sells 족발 by the platter. What separates them is the menu.
//
// ── Why the menus come from the CSV and not the API ───────────────────────
//
// /api/menu/korean has the menus and shares RSTR_ID with /api/rstr, which
// would make this a one-line join. It is 574 pages, and the service answers
// 429 — on the last attempt, six retries deep on page *one*, after a day of
// reading 168 pages of restaurants and 574 of opening hours. It is a free API
// somebody else pays for and it has said no. So the menus come from the same
// body's bulk download instead: 다국어메뉴 설명정보, 873,117 rows, already on
// disk.
//
// ── The id trap, and the join that replaces it ────────────────────────────
//
// The download's 식당(ID) is a *different id space* from the API's RSTR_ID.
// Of the 6,025 ids present in both, zero name the same restaurant — id 10985
// is 보돌미역 in the download and 대도식당 in the API. Joining on it produced
// 3,075 restaurants each tagged with dishes from somebody else's menu, which
// is worse than no filter at all. It was caught only by comparing names.
//
// So the join is on what both sides say in words: 식당명 + 지역명 against
// RSTR_NM + the 구 in RSTR_RDNMADR. A name that is not unique inside its
// district — 김밥천국 in 강남구 — is dropped from both sides rather than
// guessed at, because a wrong tag here is a person standing outside a
// restaurant that does not serve what we said it does.
//
// ── On the patterns ──────────────────────────────────────────────────────
//
// Written narrowly and tested by counting, because a loose one is worse than
// a missing one here. Two traps in particular:
//
//   `전` matches half the language — 전주비빔밥, 전복죽, 전기구이. Only the
//   named pancakes are matched.
//   `갈비` matches 갈비탕, which arrives in a bowl for one person and is the
//   opposite of what this list is for. Soups are excluded explicitly.
//
// The output is a set of API restaurant ids plus, for each, which dishes it
// was matched on — so a screen can say *why* a place is on the list rather
// than asking anybody to trust the filter.

import fs from 'node:fs';
import readline from 'node:readline';

const CSV = '서울관광재단 다국어메뉴 설명정보/DATAGO_SEOUL_2022.MENU_EXPLN_INFO_KOREAN.csv';
const API = 'scripts/.cache.local/restaurants.json';
const OUT = 'scripts/.cache.local/dish-match.json';

/**
 * The six groups, the matcher and the CSV reader moved to scripts/lib/dishes.mjs
 * on 2026-09-14, when Incheon's register began to be built from the same rules.
 * Re-exported here because this is the file people look in for them.
 */
import { DISH_GROUPS, ALL_DISHES, matchDish, norm, splitCsv } from './lib/dishes.mjs';

export { DISH_GROUPS };

const DISTRICT = /서울특별시\s+(\S+구)/;

/** 식당명 + 지역명, which is what both sides are able to say. */
const keyOf = (name, district) => `${norm(name)}|${norm(district)}`;

// ── The API side ─────────────────────────────────────────────────────────

const api = JSON.parse(fs.readFileSync(API, 'utf8'));
const apiByKey = new Map();
for (const r of api) {
  const d = DISTRICT.exec(r.RSTR_RDNMADR ?? r.RSTR_LNNO_ADRES ?? '');
  if (!d) continue;
  const k = keyOf(r.RSTR_NM, d[1]);
  if (apiByKey.has(k)) apiByKey.get(k).push(r.RSTR_ID);
  else apiByKey.set(k, [r.RSTR_ID]);
}

// ── The menu side ────────────────────────────────────────────────────────

/** key → Set of dish ids, accumulated across every menu line of that place. */
const csvDishes = new Map();
/** key → Set of 식당(ID), so a name shared by two rows in the download is seen. */
const csvIds = new Map();

let lines = 0;
let menuHits = 0;
const dishCounts = new Map();

const rl = readline.createInterface({
  input: fs.createReadStream(CSV, 'utf8'),
  crlfDelay: Infinity,
});

let header = true;
for await (const line of rl) {
  if (header) { header = false; continue; }
  if (!line) continue;
  lines += 1;
  const f = splitCsv(line);
  // 메뉴(ID),메뉴명,메뉴설명,대분류,소분류,식당(ID),식당명,지역명,지점명
  const menu = norm(f[1]);
  const rstrId = f[5];
  const rstrNm = f[6];
  const region = f[7];
  if (!menu || !rstrNm || !region) continue;

  let hit = false;
  for (const dish of ALL_DISHES) {
    if (!matchDish(menu, dish)) continue;
    hit = true;
    const k = keyOf(rstrNm, region);
    if (!csvDishes.has(k)) { csvDishes.set(k, new Set()); csvIds.set(k, new Set()); }
    csvDishes.get(k).add(dish.id);
    csvIds.get(k).add(rstrId);
    dishCounts.set(dish.id, (dishCounts.get(dish.id) ?? 0) + 1);
  }
  if (hit) menuHits += 1;
}

// ── The join ─────────────────────────────────────────────────────────────
//
// Kept only where the name identifies exactly one restaurant on each side.
// Everything else is a guess, and the cost of a wrong guess is a person
// standing outside a restaurant looking for a dish it does not serve.

const byRestaurant = new Map();
let ambiguousApi = 0;
let ambiguousCsv = 0;
let unmatched = 0;

for (const [k, dishes] of csvDishes) {
  const ids = apiByKey.get(k);
  if (!ids) { unmatched += 1; continue; }
  if (ids.length > 1) { ambiguousApi += 1; continue; }
  if (csvIds.get(k).size > 1) { ambiguousCsv += 1; continue; }
  byRestaurant.set(ids[0], [...dishes]);
}

if (process.argv[1]?.endsWith('dish-match.mjs')) {
  console.log(`menu lines read:        ${lines}`);
  console.log(`lines naming a dish:    ${menuHits}`);
  console.log(`places in the download: ${csvDishes.size}`);
  console.log(`  no name match in API: ${unmatched}`);
  console.log(`  name shared in API:   ${ambiguousApi}`);
  console.log(`  name shared in CSV:   ${ambiguousCsv}`);
  console.log(`RESTAURANTS KEPT:       ${byRestaurant.size}`);
  console.log('\n── menu lines matched per dish ──');
  for (const group of DISH_GROUPS) {
    console.log(`  ${group.emoji} ${group.en}`);
    for (const d of group.dishes) {
      console.log(`     ${d.ko.padEnd(6)} ${String(dishCounts.get(d.id) ?? 0).padStart(7)}`);
    }
  }
  fs.writeFileSync(OUT, JSON.stringify([...byRestaurant]));
  console.log(`\nwritten to ${OUT}`);
}

export const restaurantDishes = byRestaurant;
