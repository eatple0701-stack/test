// Every restaurant in the register, split so a phone can reach any of them.
//
// 167,659 rows. As one file that is 24.4MB, 3.4MB compressed — a download
// nobody on mobile data should be asked for, and one the service worker
// would then hold forever. Split by 구 it is 26 files, the largest of them
// 강남구 at 332KB compressed, and the app fetches the districts near wherever
// the person is looking.
//
// So "all of it" is true in the sense that matters: every row is reachable,
// none is filtered out, and nothing is downloaded that nobody looked at.
//
// Rows with no usable coordinates are kept. They cannot be drawn on a map or
// sorted by distance, but they are real restaurants and dropping them would
// make this a partial import claiming to be a complete one.
//
// Prices and Naver/TripAdvisor scores are in neighbouring fields of the same
// API and are not read here. See the note at the top of seoul-food-api.mjs.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fetchAll } from './seoul-food-api.mjs';

const OUT = 'public/data/seoul';

// Seoul, generously. The register geocodes some rows wrong: 28 restaurants
// on 새문안로 in 종로구 all carry 36.6302, 127.3321 — a point near Sejong,
// a hundred kilometres south. Their addresses are fine; the coordinate is
// not, and a pin a hundred kilometres from its own address is a wrong fact
// rather than a missing one. Such rows keep everything except a position.
const SEOUL = { s: 37.41, n: 37.72, w: 126.76, e: 127.20 };
const inSeoul = (lat, lng) => lat >= SEOUL.s && lat <= SEOUL.n && lng >= SEOUL.w && lng <= SEOUL.e;

const [places, hours] = await Promise.all([fetchAll('restaurants'), fetchAll('hours')]);
const hoursOf = new Map(hours.map(h => [h.RSTR_ID, h]));

/** The district, which is both the file name and the only geography the register records. */
const districtOf = (address) => {
  const m = /서울특별시\s+(\S+?구)/.exec(address ?? '');
  return m ? m[1] : '기타';
};

const DISTRICT_EN = {
  종로구: 'Jongno', 중구: 'Jung-gu', 용산구: 'Yongsan', 성동구: 'Seongdong', 광진구: 'Gwangjin',
  동대문구: 'Dongdaemun', 중랑구: 'Jungnang', 성북구: 'Seongbuk', 강북구: 'Gangbuk', 도봉구: 'Dobong',
  노원구: 'Nowon', 은평구: 'Eunpyeong', 서대문구: 'Seodaemun', 마포구: 'Mapo', 양천구: 'Yangcheon',
  강서구: 'Gangseo', 구로구: 'Guro', 금천구: 'Geumcheon', 영등포구: 'Yeongdeungpo', 동작구: 'Dongjak',
  관악구: 'Gwanak', 서초구: 'Seocho', 강남구: 'Gangnam', 송파구: 'Songpa', 강동구: 'Gangdong',
};

const buckets = new Map();
let withGeo = 0;
let outOfRange = 0;
let foreignMenu = 0;

for (const r of places) {
  const lat = Number(r.RSTR_LA);
  const lng = Number(r.RSTR_LO);
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 && inSeoul(lat, lng);
  const h = hoursOf.get(r.RSTR_ID);
  const row = {
    i: r.RSTR_ID,
    n: r.RSTR_NM,
    a: r.RSTR_RDNMADR ?? '',
    t: r.RSTR_TELNO || undefined,
    // Four decimals is about eleven metres — finer than a building, and half
    // the bytes of six.
    y: hasGeo ? Math.round(lat * 1e4) / 1e4 : undefined,
    x: hasGeo ? Math.round(lng * 1e4) / 1e4 : undefined,
    h: (h?.BSNS_TM_CN ?? '').trim() || undefined,
    c: r.BSNS_STATM_BZCND_NM || undefined,
    // The one flag worth carrying for this app's reader: 외국어 메뉴 제공 여부.
    f: h?.FGGG_MENU_OFR_YN === 'Y' ? 1 : undefined,
  };
  if (hasGeo) withGeo += 1;
  else if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0) outOfRange += 1;
  if (row.f) foreignMenu += 1;
  const gu = districtOf(row.a);
  if (!buckets.has(gu)) buckets.set(gu, []);
  buckets.get(gu).push(row);
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));

const index = [];
let totalRaw = 0;
let totalBr = 0;

for (const [gu, rows] of [...buckets].sort((a, b) => b[1].length - a[1].length)) {
  rows.sort((a, b) => a.i - b.i);
  const geo = rows.filter(r => r.y !== undefined);
  // The bounding box is what the loader uses to decide whether a district is
  // anywhere near the map, so it is computed here rather than guessed there.
  const box = geo.length
    ? {
      s: Math.min(...geo.map(r => r.y)), n: Math.max(...geo.map(r => r.y)),
      w: Math.min(...geo.map(r => r.x)), e: Math.max(...geo.map(r => r.x)),
    }
    : null;

  const slug = DISTRICT_EN[gu] ?? 'other';
  const file = path.join(OUT, `${slug}.json`);
  const body = JSON.stringify({ gu, en: DISTRICT_EN[gu] ?? null, count: rows.length, rows });
  fs.writeFileSync(file, body);
  totalRaw += body.length;
  totalBr += zlib.brotliCompressSync(Buffer.from(body)).length;

  index.push({
    slug,
    gu,
    en: DISTRICT_EN[gu] ?? null,
    count: rows.length,
    withGeo: geo.length,
    foreign: rows.filter(r => r.f).length,
    box,
  });
}

index.sort((a, b) => b.count - a.count);
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({
  source: '서울관광재단 · 포스트코로나 음식관광 데이터베이스 (data.go.kr 15097605)',
  licence: 'no usage restriction',
  builtAt: new Date().toISOString().slice(0, 10),
  total: places.length,
  withGeo,
  foreignMenu,
  districts: index,
}));

console.log(`${OUT}/: ${index.length} districts, ${places.length} places`);
console.log(`  with coordinates: ${withGeo} (${(100 * withGeo / places.length).toFixed(1)}%)`);
console.log(`  foreign-language menu: ${foreignMenu}`);
console.log(`  ${(totalRaw / 1024 / 1024).toFixed(1)}MB on disk, ${(totalBr / 1024 / 1024).toFixed(2)}MB compressed across all districts`);
console.log(`  largest: ${index[0].gu} ${index[0].count} places`);
