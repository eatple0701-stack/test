// The register, as places.
//
// 167,659 rows from 서울관광재단's food-tourism database (data.go.kr 15097605),
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
// 24.4MB of JSON in total, so it arrives one 구 at a time — see
// nearbyPlaces.js. Callers get whatever has loaded, which is the correct
// reading: the twenty curated places are the app, and these are an addition
// that turns up district by district as somebody looks around.

import { loadAllPlaces } from './nearbyPlaces.js';
import { groupsOf } from '../domain/catalog/dishGroups.js';

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
export const DISTRICT_EN = {
  종로구: 'Jongno', 중구: 'Jung-gu', 용산구: 'Yongsan', 성동구: 'Seongdong', 광진구: 'Gwangjin',
  동대문구: 'Dongdaemun', 중랑구: 'Jungnang', 성북구: 'Seongbuk', 강북구: 'Gangbuk', 도봉구: 'Dobong',
  노원구: 'Nowon', 은평구: 'Eunpyeong', 서대문구: 'Seodaemun', 마포구: 'Mapo', 양천구: 'Yangcheon',
  강서구: 'Gangseo', 구로구: 'Guro', 금천구: 'Geumcheon', 영등포구: 'Yeongdeungpo', 동작구: 'Dongjak',
  관악구: 'Gwanak', 서초구: 'Seocho', 강남구: 'Gangnam', 송파구: 'Songpa', 강동구: 'Gangdong',
};

const zoneOf = (address) => {
  const m = /(\S+?구)/.exec(String(address ?? '').replace('서울특별시', ''));
  const en = m ? DISTRICT_EN[m[1]] : null;
  return en ? `${en}, Seoul` : 'Seoul';
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
 * The sign, in the language of whoever is reading.
 *
 * ── Why this is a lookup and not a romaniser ─────────────────────────────
 *
 * In English the map list read 더플레이스다이닝 / 산채집 / 말모아왕족발 —
 * a Korean-only name, a distance and an emoji, on 8,118 of the 8,136 places.
 * The obvious fix is to transliterate the Hangul, and it is the wrong one:
 * it produces "Deopeulleiseudaining", which is not a word in any language
 * and is not what the sign says.
 *
 * 서울관광재단's multilingual menu dataset already holds the name somebody
 * wrote in English for almost every one of them — "THE PLACE Dining",
 * "Myeongdongttungttungi Jokbal", and for 박사네갈비 a real translation,
 * "Park's BBQ", which no transliterator would ever produce. That file was
 * already being parsed for menus, and column 6 was being read and discarded
 * on every build. scripts/add-english-names.mjs keeps it now; 8,070 of the
 * 8,118 have one.
 *
 * The 48 without keep their Korean name in every language, because a name
 * we do not have is not a name to invent. `e` is absent rather than empty
 * for those, the way every other unknown field in this file is absent.
 *
 * The Korean branch is the one worth checking in a test: English is the
 * say() fallback, so a romanisation leaking to a Korean reader would look
 * like a working screen to everybody who could tell.
 *
 * Takes either shape: a raw register row (`n`, `e`) or the place object
 * built from one (`name`, `nameEn`). The map draws from rows and the list
 * draws from places, and a name helper that only knew one of them would be
 * correct on one screen and silently wrong on the other.
 */
export const displayName = (place, locale = 'both') => {
  const korean = place?.n ?? place?.name;
  const english = place?.e ?? place?.nameEn;
  // `both` keeps the sign. It is the default and the screen the team
  // reviews, and a register row's identity is what is written on the door.
  if (locale === 'ko' || locale === 'both') return korean;
  return english || korean;
};

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
    /**
     * The register's own English name where it has one, carried alongside
     * the Korean rather than replacing it — a Korean reader must still see
     * 명동뚱뚱이족발. `reported`, like every other register field: it comes
     * from a public dataset joined on name and 구, and nobody here has
     * stood in front of the shopfront to check it.
     */
    nameEn: row.e ?? null,
    zone: zoneOf(address),
    category: CATEGORY[row.c] ?? 'local-seasonal',
    // Null rather than a record holding undefined. 2,953 rows have no
    // usable position — either the register never geocoded them, or it
    // geocoded them to a point outside Seoul, which the build script
    // rejects. They are still restaurants; they just cannot be drawn or
    // sorted by distance, and the list puts them after everything that can.
    coordinates: row.y === undefined || row.x === undefined
      ? null
      : reported({ lat: row.y, lng: row.x }, {
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
    // The register's own photograph where it took one (95 of 8,118).
    // PlaceImage renders `photo` when present, illustration otherwise.
    image: null, photo: row.p ?? null, coverImage: null, gallery: [],
    /**
     * What the register said, kept so a screen can say why this one is here.
     * `dishes` is the answer to that question: the ids from
     * src/domain/catalog/dishGroups.js that this place's own menu matched,
     * which is the only reason it survived the filter.
     */
    registry: { foreignMenu: row.f === 1, kind: row.c ?? null, dishes: row.d ?? [] },
  };
}

/**
 * Does this place serve a dish from this group, per the register's menu?
 *
 * Registry places only: the answer comes from `registry.dishes`, which is
 * the menu evidence the place was kept for. A curated place returns false —
 * not because 발우공양 serves nothing, but because nobody has matched the
 * twenty curated menus against the twenty-four dishes, and a filter that
 * guesses is worse than one that under-reports. The chips' own label says
 * what is being filtered: places from the register.
 */
export function servesGroup(place, groupId) {
  const dishes = place?.registry?.dishes;
  if (!dishes?.length) return false;
  return groupsOf(dishes).some(g => g.id === groupId);
}

let cache = null;
let cachedCount = 0;

/**
 * Every register row as a place, once the files have arrived.
 *
 * All 8,118, in one call — it used to take a map centre and fetch the four
 * districts around it, which was the right shape when this was 167,659 rows
 * and 3.4MB. Filtered to the twenty-four dishes it is a quarter of a
 * megabyte, and a list that silently held only the districts you had
 * happened to pan over was a worse thing than the download it saved.
 *
 * Returns [] rather than throwing or blocking: a screen with twenty places
 * is this app working, and a screen with 8,138 is this app working with more
 * on it. Neither is an error state.
 */
export async function loadRegistryPlaces() {
  const layer = await loadAllPlaces();
  if (!layer?.rows?.length) return cache ?? [];
  // Built once. The row count is what says whether anything changed.
  if (!cache || layer.rows.length !== cachedCount) {
    cache = layer.rows.map(r => placeFromRegistry(r, layer.builtAt ?? null));
    cachedCount = layer.rows.length;
  }
  return cache;
}
