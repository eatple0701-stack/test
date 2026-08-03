// PlacePolicy — where a table is, when the app actually knows.
//
// 김훈 부장님 asked for 구글 지도 API를 연계하여 모임 장소 표시. The map has
// existed since before this app was 밥친구 and has only ever shown
// restaurants; the tables — the thing the product is about — were never on
// it. A traveller deciding between two dinners is asking "is that near where
// I am sleeping", and the app could not answer.
//
// The decision this file encodes: a pin is only ever drawn where somebody
// pointed at the map. `place` is free text — "Jongno 3-ga", "홍대입구 3번
// 출구", "the CU by the station" — and geocoding a string like that produces
// a coordinate that looks exactly as confident as a true one while being a
// block away, or in a different city. Standing at the wrong exit at 19:00 is
// the failure this whole app exists to prevent, so a guessed point is worse
// than no point.
//
// Hence: hosts may drop a pin, tables without one are listed rather than
// invented, and the map says how many it could not place. Same rule the menu
// catalog follows about ingredients — the app does not assert what it has not
// checked.

/** Seoul is not the world, but it is where the pilot runs. */
export const KOREA_BOUNDS = { minLat: 33.0, maxLat: 38.7, minLng: 124.5, maxLng: 132.0 };

/**
 * A coordinate the app is willing to draw, or null.
 *
 * Rejects the shapes that arrive from a half-filled form or a column that
 * does not exist yet: nulls, strings, NaN, and the (0, 0) that a broken
 * picker writes — Null Island is off the coast of Africa and would render as
 * a perfectly plausible pin at the edge of the map.
 */
export function pointOf(table) {
  const lat = Number(table?.lat);
  const lng = Number(table?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  if (lat < KOREA_BOUNDS.minLat || lat > KOREA_BOUNDS.maxLat) return null;
  if (lng < KOREA_BOUNDS.minLng || lng > KOREA_BOUNDS.maxLng) return null;
  return { lat, lng };
}

export const hasPoint = (table) => pointOf(table) !== null;

/** The tables a map may show, and the ones it must not pretend to. */
export const mappable = (tables = []) => tables.filter(hasPoint);
export const unmappable = (tables = []) => tables.filter(t => !hasPoint(t));

/**
 * What the map says about the tables it left off.
 *
 * Never silence. A traveller who counts four tables in the list and three
 * pins on the map has found a bug in their trust, not in the software, and
 * the fix is one sentence rather than a fourth pin somewhere plausible.
 */
export function unplacedNotice(tables = []) {
  const n = unmappable(tables).length;
  if (n === 0) return null;
  return {
    count: n,
    kr: `${n}개 밥상은 호스트가 지도에 위치를 찍지 않았어요`,
    en: `${n} table${n === 1 ? '' : 's'} ${n === 1 ? 'is' : 'are'} not on the map — the host wrote a meeting point in words instead. They are still in the list.`,
  };
}

/** What a host is asked, when they are asked to point at the map. */
export const PICKER_PROMPT = {
  kr: '지도에서 만나는 곳 찍기 (선택)',
  en: 'Optional. Tap the map where you will actually stand — the exit, the corner, the shop. Guests use it to judge whether they can get there, so a rough pin is worse than none.',
  clear: '지우기 · Remove pin',
};
