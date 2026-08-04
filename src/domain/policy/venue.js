// What a place is, in the words that fit it.
//
// Two things came out of a real-device review on 2026-08-04, and both are the
// same mistake: the app has one vocabulary — 밥상, 상 차리기 — and uses it for
// every venue in the Places catalogue whether or not it is a meal.
//
//   "카페의 경우, 상차리기 라는 단어는 어색하다"
//
// It is worse than awkward. 상 차리기 is *setting a table* — laying out dishes
// for people to sit down to. Said of a bakery or a tea house it is not a
// slightly-off word, it is the wrong event. Somebody reading it has to work out
// whether the app means something they have not understood.
//
// So the phrasing is derived from the venue's own category rather than fixed,
// exactly the way tableKind() derives 호스트 테이블 from the guides a host
// actually ticked. Deriving it means a category added next month gets a
// sentence rather than inheriting a wrong one silently — the test below walks
// every category in the catalogue and fails if one has no wording of its own.

/**
 * Categories where people sit down to a meal. Everything else is somewhere you
 * go *with* somebody rather than somewhere you eat a 밥상.
 *
 * Drawn from src/data/restaurants.js. If that file grows a category, this list
 * and MEET_COPY below are what has to grow with it.
 */
export const MEAL_CATEGORIES = [
  'temple',
  'halal-korean',
  'world-halal',
  'korean-chinese',
  'vegan-dining',
  'local-seasonal',
  'zero-waste',
];

/** Categories where "상 차리기" would be the wrong event entirely. */
export const OUTING_CATEGORIES = ['brunch-bakery'];

export const VENUE_KIND = { MEAL: 'meal', OUTING: 'outing' };

/** A meal, or an outing? Unknown categories are treated as outings. */
export function venueKind(category) {
  if (MEAL_CATEGORIES.includes(category)) return VENUE_KIND.MEAL;
  return VENUE_KIND.OUTING;
}

// 테이블 메이트 is already this app's word for "people eating together with no
// guide attached" (src/domain/catalog/hosts.js), so an outing borrows it rather
// than importing 메이트 as a bare loanword. The traveller has already met the
// phrase on every table card.
const MEET_COPY = {
  [VENUE_KIND.MEAL]: {
    title: '여기서 상 차리기',
    sub: (name) => `Open a table at ${name} and see who wants to come.`,
  },
  [VENUE_KIND.OUTING]: {
    title: '여기서 같이 갈 사람 찾기',
    sub: (name) => `Find someone to go to ${name} with — same idea as a table, no meal to share.`,
  },
};

/** The button that turns a place into a table, worded for that place. */
export function tableCtaFor(restaurant) {
  const kind = venueKind(restaurant?.category);
  const copy = MEET_COPY[kind];
  const name = String(restaurant?.name ?? '').split('(')[0].trim() || 'this place';
  return { kind, title: copy.title, sub: copy.sub(name) };
}

// ── Maps a traveller already has on their phone ───────────────────────────
//
// The same review asked for Google/Naver/Kakao reviews shown inline. Checked
// 2026-08-04: Naver's and Kakao's public APIs return no review text at all,
// and Google's terms forbid storing or re-rendering theirs. Scraping is a
// terms violation and not something a publicly funded project should do.
//
// So the app does not quote a single review. It hands over the place instead:
// one tap into Naver Map or Kakao Map, where the reviews, the photos and the
// walking directions already are, kept current by somebody else. Nothing is
// claimed here that we cannot stand behind, which is the same rule the quiz
// and the dish pages live under.

const enc = encodeURIComponent;

/** Is this a point a map can be sent to? Mirrors place.js's refusal rules. */
const usablePoint = (p) =>
  !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
  && !(p.lat === 0 && p.lng === 0);

/**
 * Deep links for one venue, or [] when there is nothing to point at.
 *
 * Naver takes a name with the coordinates, so its pin lands on the venue
 * rather than on a bare point. Kakao's `map_type=MAP` link is the plain map
 * view — the one that opens the app if it is installed and the website if it
 * is not, which is what a traveller who has neither needs.
 */
export function mapLinksFor(restaurant) {
  const point = restaurant?.coordinates?.value ?? restaurant?.coordinates;
  if (!usablePoint(point)) return [];
  const name = String(restaurant?.name ?? '').split('(')[0].trim() || '밥친구';
  const { lat, lng } = point;

  return [
    {
      id: 'naver',
      kr: '네이버 지도',
      en: 'Naver Map',
      // Reviews, photos and Korean opening hours — the richest of the three
      // for a Korean venue, which is why it goes first.
      url: `https://map.naver.com/p/search/${enc(name)}?c=${lng},${lat},17,0,0,0,dh`,
    },
    {
      id: 'kakao',
      kr: '카카오맵',
      en: 'Kakao Map',
      url: `https://map.kakao.com/link/map/${enc(name)},${lat},${lng}`,
    },
  ];
}

/** Said above the links, so nobody reads them as our own reviews. */
export const MAP_LINKS_NOTE = {
  kr: '후기와 사진은 지도 앱에서 보세요.',
  en: 'Reviews and photos live in the map apps, kept current by the people who run them. 밥친구 does not copy them here.',
};
