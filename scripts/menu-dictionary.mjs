// A Korean dish name, in four languages, from an official source.
//
// This is the part of dataset 15097605 worth having. MENU_ID joins across
// /api/menu/korean, /eng, /jpnse and /chchr exactly:
//
//   155  닭한마리(2인분)  Whole Chicken Soup(For 2)  タッカンマリ(2人前)  一只鸡(2人份)
//
// 573,965 rows of that, translated by the Seoul Tourism Foundation rather
// than by us. The 8/7 review praised exactly this shape — "음식명 아래에 짧은
// 영어 설명" — and this app hand-writes it for ten dishes.
//
// What it becomes: a lookup from a Korean dish name to what it is called in
// English, Japanese and Chinese. A traveller holding a menu they cannot read
// is the person this whole product is for.
//
// Run with a page count while deciding, without one to build the real thing:
//   node scripts/menu-dictionary.mjs 20     # sample, ~80 requests
//   node scripts/menu-dictionary.mjs        # all of it, ~2,300 requests
//
// Prices are in these rows and are not read. See the note at the top of
// seoul-food-api.mjs.

import { fetchAll } from './seoul-food-api.mjs';

const pages = Number(process.argv[2]) || Infinity;
const opts = { maxPages: pages };

const [ko, en, ja, zh] = await Promise.all([
  fetchAll('menusKo', opts),
  fetchAll('menusEn', opts),
  fetchAll('menusJa', opts),
  fetchAll('menusZh', opts),
]);

const byId = (rows) => new Map(rows.map(r => [r.MENU_ID, r.MENU_NM]));
const E = byId(en);
const J = byId(ja);
const Z = byId(zh);

/**
 * The dish, without the portion note.
 *
 * "닭한마리(2인분)" and "닭한마리" are the same dish and must not be two
 * entries; the bracket is about how much of it arrives, which is a fact
 * about one restaurant's menu rather than about the food.
 */
const dish = (nm) => String(nm ?? '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

// A name is only useful if all four agree it exists. Counting the ones that
// do is the honest measure of what this dataset gives — a Korean name with
// no Japanese is not a dictionary entry.
const entries = new Map();
let complete = 0;
for (const row of ko) {
  const k = dish(row.MENU_NM);
  if (!k || !/[가-힣]/.test(k)) continue;
  const e = dish(E.get(row.MENU_ID));
  const j = dish(J.get(row.MENU_ID));
  const z = dish(Z.get(row.MENU_ID));
  if (!e || !j || !z) continue;
  complete += 1;
  if (!entries.has(k)) entries.set(k, { ko: k, en: e, ja: j, zh: z, seen: 0 });
  entries.get(k).seen += 1;
}

const sorted = [...entries.values()].sort((a, b) => b.seen - a.seen);

console.log(`menu rows read:        ${ko.length}`);
console.log(`with all four languages: ${complete}`);
console.log(`distinct Korean dishes:  ${sorted.length}`);
console.log('\n── the twenty most common ──');
for (const d of sorted.slice(0, 20)) {
  console.log(`  ${String(d.seen).padStart(4)}×  ${d.ko.padEnd(14)} ${d.en}`);
  console.log(`        ${' '.repeat(14)} ${d.ja}  ·  ${d.zh}`);
}

// How far it reaches into what this app already talks about.
const OURS = ['삼겹살', '닭갈비', '감자탕', '부대찌개', '보쌈', '족발', '간장게장', '한정식', '백반', '곱창'];
console.log('\n── the ten dishes this app curates ──');
for (const name of OURS) {
  const found = sorted.find(d => d.ko === name) ?? sorted.find(d => d.ko.includes(name));
  console.log(found
    ? `  ${name.padEnd(8)} ✓ ${found.en} / ${found.ja} / ${found.zh}`
    : `  ${name.padEnd(8)} — not in this sample`);
}
