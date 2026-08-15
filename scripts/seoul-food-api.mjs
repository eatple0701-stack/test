// The Seoul Tourism Foundation's food-tourism database, read at build time.
//
// data.go.kr dataset 15097605, served from seoul.openapi.redtable.global.
// 167,659 restaurants, 573,965 menus in four languages, 8,087 restaurant
// photographs and 1,198 dish photographs, free, no usage restriction.
//
// ── Why this is a script and not a fetch() in the app ─────────────────────
//
// The API takes `pageNo` and nothing else. There is no id filter, no search,
// and `numOfRows` is ignored — every response is 1,000 rows. Reaching one
// restaurant means paging 168 times; reaching one menu means paging 574
// times. That is not something a phone on a subway platform does.
//
// It also decides where the key lives. This is a Vite app: anything the
// browser needs is in the bundle and therefore public. Read at build time,
// the key stays on the machine that ran the script and never ships.
//
// And the app has a service worker and is meant to work offline. Data that
// arrives at build time is data that is still there on a dead connection.
//
// ── What this deliberately does not take ──────────────────────────────────
//
// MENU_PRICE, NAVER_GRAD, TRPDVSR_GRAD, RATING_IDEX. The prices and the
// ratings are right there and they are exactly what this app has refused to
// print since it was written — see README's honesty rules. A price nobody
// on this team can verify today is not made verifiable by arriving over
// HTTPS from a public body, and this app does not quote other people's
// review scores. Fields are listed as taken or skipped below so that the
// omission is a decision on the record rather than something nobody noticed.

import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://seoul.openapi.redtable.global';

/** Kept out of the repository. `.gitignore` already excludes `*.local`. */
const CACHE = 'scripts/.cache.local';

export const ENDPOINTS = {
  restaurants: '/api/rstr',
  hours: '/api/rstr/oprt',
  restaurantImages: '/api/rstr/img',
  foodImages: '/api/food/img',
  menusKo: '/api/menu/korean',
  menusEn: '/api/menu/eng',
  menusJa: '/api/menu/jpnse',
  menusZh: '/api/menu/chchr',
  menuDescrEn: '/api/menu-dscrn/eng',
};

const key = () => {
  const k = process.env.SEOUL_FOOD_API_KEY;
  if (!k) {
    throw new Error(
      'SEOUL_FOOD_API_KEY is not set.\n'
      + 'It is the data.go.kr service key for dataset 15097605. Put it in\n'
      + '.env.local (git-ignored) or pass it for one run:\n'
      + '  SEOUL_FOOD_API_KEY=… node scripts/seoul-food-api.mjs restaurants',
    );
  }
  return k;
};

/** One page. The service answers `pageNo` and ignores everything else. */
async function page(endpoint, pageNo) {
  const url = `${BASE}${endpoint}?serviceKey=${encodeURIComponent(key())}&pageNo=${pageNo}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${endpoint} page ${pageNo}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.header?.resultCode !== '00') {
    throw new Error(`${endpoint} page ${pageNo}: ${json.header?.resultMsg ?? 'unknown error'}`);
  }
  return json;
}

/**
 * Every row of one endpoint, cached on disk.
 *
 * The cache is the point: 168 pages is three minutes of somebody's morning,
 * and nothing in this dataset changes between two runs of a build.
 */
export async function fetchAll(name, { refresh = false, maxPages = Infinity } = {}) {
  const endpoint = ENDPOINTS[name];
  if (!endpoint) throw new Error(`unknown endpoint ${name}`);
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, maxPages === Infinity ? `${name}.json` : `${name}.p${maxPages}.json`);

  if (!refresh && fs.existsSync(file)) {
    const cached = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.error(`${name}: ${cached.length} rows from cache`);
    return cached;
  }

  const first = await page(endpoint, 1);
  const total = first.header.totalCount;
  const per = first.body.length;
  const pages = Math.min(Math.ceil(total / per), maxPages);
  const rows = [...first.body];
  process.stderr.write(`${name}: ${total} rows over ${pages} pages `);

  for (let p = 2; p <= pages; p += 1) {
    const next = await page(endpoint, p);
    rows.push(...next.body);
    if (p % 20 === 0) process.stderr.write('.');
  }
  process.stderr.write(' done\n');

  fs.writeFileSync(file, JSON.stringify(rows));
  return rows;
}

if (import.meta.url === `file://${process.argv[1].split(path.sep).join('/')}`
  || process.argv[1]?.endsWith('seoul-food-api.mjs')) {
  const which = process.argv[2];
  if (!which) {
    console.error('usage: node scripts/seoul-food-api.mjs <' + Object.keys(ENDPOINTS).join('|') + '> [--refresh]');
    process.exit(1);
  }
  const rows = await fetchAll(which, { refresh: process.argv.includes('--refresh') });
  console.log(JSON.stringify(rows[0], null, 1));
  console.log(`… ${rows.length} rows cached in ${CACHE}/${which}.json`);
}
