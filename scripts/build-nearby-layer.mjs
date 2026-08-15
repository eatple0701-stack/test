// The second map layer: places whose kitchen offers a menu somebody can read.
//
// Built from dataset 15097605, written to public/data/ rather than imported,
// so it is fetched when the map opens and never enters the bundle.
//
// ── Why this filter and not "Korean food" ─────────────────────────────────
//
// The obvious cut is 한식, and it is the wrong one. 50,486 places serve
// Korean food; what stops a person eating alone in Seoul is not the cuisine
// on the sign, it is standing at a counter unable to read a word. The
// registry answers that directly — FGGG_MENU_OFR_YN, 외국어 메뉴 제공 여부 —
// and 25,561 places say yes. Narrowed to the five districts a visitor
// actually walks and to rows carrying coordinates, that is about 7,400.
//
// ── What each pin may and may not say ─────────────────────────────────────
//
// These are registry rows. Nobody on this team has stood in one of them,
// which is the whole difference between this layer and the twenty places
// with stories. So a pin carries what the registry actually holds — a name,
// an address, a phone number, opening hours as the registry recorded them —
// and nothing that would read as a recommendation.
//
// Deliberately dropped, and the list is the point:
//
//   RSTR_INTRCN_CONT   Auto-generated. Every one of the 167,659 is a
//                      mail-merge: "X는 서울특별시 Y구에 있습니다. 가장
//                      가까운 지하철역은 Z역입니다." It reads like a
//                      description and is not one.
//   NAVER_GRAD,        Other people's review scores. This app has never
//   RATING_IDEX,       printed one — see the note in venue.js on why it
//   TRPDVSR_GRAD       hands the traveller over to a map app instead.
//   MENU_PRICE         No prices anywhere. The rule predates this dataset.

import fs from 'node:fs';
import path from 'node:path';
import { fetchAll } from './seoul-food-api.mjs';

/** The districts a visitor on foot actually crosses. */
const DISTRICTS = /종로구|중구|용산구|마포구|강남구/;

const OUT = 'public/data/nearby-seoul.json';

const [places, hours] = await Promise.all([fetchAll('restaurants'), fetchAll('hours')]);

const hoursOf = new Map(hours.map(h => [h.RSTR_ID, h]));

const rows = [];
for (const r of places) {
  const lat = Number(r.RSTR_LA);
  const lng = Number(r.RSTR_LO);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  if (!DISTRICTS.test(r.RSTR_RDNMADR ?? '')) continue;

  const h = hoursOf.get(r.RSTR_ID);
  if (h?.FGGG_MENU_OFR_YN !== 'Y') continue;

  // Four decimal places is about eleven metres, which is finer than a
  // building. Six would double the file for precision nobody can walk to.
  rows.push({
    i: r.RSTR_ID,
    n: r.RSTR_NM,
    a: r.RSTR_RDNMADR ?? '',
    t: r.RSTR_TELNO || undefined,
    y: Math.round(lat * 1e4) / 1e4,
    x: Math.round(lng * 1e4) / 1e4,
    h: (h.BSNS_TM_CN ?? '').trim() || undefined,
    c: r.BSNS_STATM_BZCND_NM || undefined,
  });
}

rows.sort((a, b) => a.i - b.i);

const payload = {
  // Stated in the file, so the layer can say where it came from on screen
  // without a component having to remember.
  source: '서울관광재단 · 포스트코로나 음식관광 데이터베이스 (data.go.kr 15097605)',
  licence: 'no usage restriction',
  filter: 'FGGG_MENU_OFR_YN=Y · 종로·중·용산·마포·강남 · has coordinates',
  builtAt: new Date().toISOString().slice(0, 10),
  count: rows.length,
  rows,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload));
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`${OUT}: ${rows.length} places, ${kb}KB`);
console.log('sample:', JSON.stringify(rows[0]));
