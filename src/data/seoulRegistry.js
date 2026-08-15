// The register, as places.
//
// 7,450 rows from 서울관광재단's food-tourism database (data.go.kr 15097605),
// turned into the same record shape as the twenty in restaurants.js so that
// every screen — the list, the map, the detail sheet, the filters, saving,
// opening a table at one — works on them without a special case.
//
// ── The one thing that must not blur ──────────────────────────────────────
//
// A place in restaurants.js has a story somebody wrote and an address
// somebody checked against two map services on a named date. A place in here
// has neither. The app already has the vocabulary for that difference —
// every fact carries `confidence`, and `trustBadge` in data/verification.js
// renders 공식 확인 / 출처 있음 / 추정 from it. So these arrive as
// `reported`: a source states it, nobody here confirmed it.
//
// That is not a disclaimer bolted on. It is why `story` is null rather than
// filled with the register's own 소개문, which for all 167,659 rows is a
// mail-merge — "X는 서울특별시 Y구에 있습니다. 가장 가까운 지하철역은 Z역
// 입니다." Printing that as a story would be the app telling its first lie.
//
// ── Loaded, not bundled ──────────────────────────────────────────────────
//
// 1.2MB of JSON, 179KB over the wire. It is fetched once, on demand, and the
// service worker keeps it. Callers get an empty list until it arrives, which
// is the correct reading: the twenty curated places are the app, and these
// are an addition that has not turned up yet.

import { loadNearbyPlaces } from './nearbyPlaces.js';

/** Every fact from the register shares one provenance record. */
const reported = (value, extra = {}) => ({
  value,
  confidence: 'reported',
  source: '서울관광재단 음식관광 데이터베이스 (data.go.kr 15097605)',
  url: 'https://www.data.go.kr/data/15097605/openapi.do',
  method: 'Public dataset import',
  lastCheckedAt: null,
  ...extra,
});

/**
 * The district, in the shape `zone` already uses.
 *
 * The register writes "서울특별시 종로구 인사동길 30-21"; the app's zones read
 * "Insadong, Seoul". A district is as fine as this can honestly go — the
 * register does not record a neighbourhood, and inventing one from a road
 * name would be a guess dressed as a fact.
 */
const DISTRICT_EN = {
  종로구: 'Jongno', 중구: 'Jung-gu', 용산구: 'Yongsan', 마포구: 'Mapo', 강남구: 'Gangnam',
};

const zoneOf = (address) => {
  const m = /(종로구|중구|용산구|마포구|강남구)/.exec(address ?? '');
  return m ? `${DISTRICT_EN[m[1]]}, Seoul` : 'Seoul';
};

/**
 * The register's 업태 mapped onto the app's own categories where they mean
 * the same thing, and to `local-seasonal` where they do not.
 *
 * Deliberately conservative. `한식` is not `temple`, and a category this app
 * uses to promise something specific — halal-korean, vegan-dining — is never
 * assigned from a register field that cannot support the promise.
 */
const CATEGORY = {
  한식: 'local-seasonal',
  중국식: 'korean-chinese',
  일식: 'local-seasonal',
  경양식: 'brunch-bakery',
  커피숍: 'brunch-bakery',
  제과점영업: 'brunch-bakery',
  분식: 'local-seasonal',
};

/** The prefix is what keeps a register row from ever being taken for one of the twenty. */
export const REGISTRY_PREFIX = 'seoul-';
export const isRegistryPlace = (place) => String(place?.id ?? '').startsWith(REGISTRY_PREFIX);

/**
 * One register row as a place.
 *
 * Everything the app reads unconditionally is present — `traits` and
 * `dietary` as empty rather than absent, so a `.filter` or a `.some`
 * upstream does not have to know where the record came from.
 */
export function placeFromRegistry(row, builtAt = null) {
  const address = row.a ?? '';
  return {
    id: `${REGISTRY_PREFIX}${row.i}`,
    name: row.n,
    zone: zoneOf(address),
    category: CATEGORY[row.c] ?? 'local-seasonal',
    coordinates: reported({ lat: row.y, lng: row.x }, {
      lastCheckedAt: builtAt,
      evidence: 'Coordinates as recorded in the dataset',
    }),
    address: reported(address, {
      precision: 'street',
      lastCheckedAt: builtAt,
      evidence: 'Road-name address as recorded in the dataset',
    }),
    // The register's opening hours are one free-text line and often stale;
    // `raw` with no weekly breakdown is exactly what the hours policy
    // already handles for a place whose schedule nobody parsed.
    hours: row.h
      ? reported({ raw: row.h, weekly: null }, { lastCheckedAt: builtAt, evidence: 'Opening hours as recorded in the dataset' })
      : null,
    phone: row.t ? reported(row.t, { lastCheckedAt: builtAt }) : null,
    officialUrl: null,
    transit: null,
    menus: null,
    // Empty, not absent. Nothing in the register supports a dietary claim,
    // and an empty record is what "we do not know" looks like here.
    dietary: {},
    traits: [],
    // No story, and no substitute for one. See the note at the top.
    vibe: '', vibeKo: '', vibeEs: '', vibeFr: '', vibeAr: '', vibeZh: '', vibeJa: '',
    story: null, storyKo: null, storyEs: null, storyFr: null, storyAr: null, storyZh: null, storyJa: null,
    esg_point: null,
    image: null, photo: null, coverImage: null, gallery: [],
    /** What the register said, kept so a screen can say why this one is here. */
    registry: { foreignMenu: true, kind: row.c ?? null },
  };
}

let cache = null;

/**
 * Every register row as a place, once the file has arrived.
 *
 * Returns [] rather than throwing or blocking: a screen with twenty places
 * is this app working, and a screen with 7,470 is this app working with more
 * on it. Neither is an error state.
 */
export async function loadRegistryPlaces() {
  if (cache) return cache;
  const layer = await loadNearbyPlaces();
  if (!layer?.rows) return [];
  cache = layer.rows.map(r => placeFromRegistry(r, layer.builtAt ?? null));
  return cache;
}
