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
    title: '여기서 상 차리기 · Open a table here',
    titleKo: '여기서 상 차리기',
    titleEn: 'Open a table here',
    titleEs: 'Abrir una mesa aquí',
    titleFr: 'Ouvrir une table ici',
    titleAr: 'افتح مائدة هنا',
    titleZh: '在这里开一张饭桌',
    titleJa: 'ここで食卓を開く',
    sub: (name) => `Open a table at ${name} and see who wants to come.`,
    subKo: (name) => `${name}에서 상을 차리고 누가 오고 싶어 하는지 보세요.`,
    subEs: (name) => `Abre una mesa en ${name} y mira quién quiere venir.`,
    subFr: (name) => `Ouvrez une table à ${name} et voyez qui veut venir.`,
    subAr: (name) => `افتح مائدة في ${name} وانظر من يريد أن يأتي.`,
    subZh: (name) => `在${name}开一张饭桌，看看谁想来。`,
    subJa: (name) => `${name}で食卓を開いて、誰が来たがるか見てみましょう。`,
  },
  [VENUE_KIND.OUTING]: {
    title: '여기서 같이 갈 사람 찾기 · Find someone to go with',
    titleKo: '여기서 같이 갈 사람 찾기',
    titleEn: 'Find someone to go with',
    titleEs: 'Busca con quién ir',
    titleFr: 'Trouver avec qui y aller',
    titleAr: 'ابحث عمّن تذهب معه',
    titleZh: '找个人一起去',
    titleJa: '一緒に行く人を見つける',
    sub: (name) => `Find someone to go to ${name} with — same idea as a table, no meal to share.`,
    subKo: (name) => `${name}에 같이 갈 사람을 찾아보세요 — 밥상과 같은 방식이고, 나눠 먹을 음식만 없습니다.`,
    subEs: (name) => `Encuentra con quién ir a ${name} — la misma idea que una mesa, sin comida que compartir.`,
    subFr: (name) => `Trouvez quelqu'un avec qui aller à ${name} — la même idée qu'une table, sans repas à partager.`,
    subAr: (name) => `ابحث عمّن تذهب معه إلى ${name} — الفكرة نفسها كالمائدة، بلا طعام يُشارَك.`,
    subZh: (name) => `找个人一起去${name}——和饭桌是同一个意思，只是没有要分着吃的饭。`,
    subJa: (name) => `${name}へ一緒に行く人を探しましょう——食卓と同じ考え方で、分け合う食事がないだけです。`,
  },
};

/**
 * The button that turns a place into a table, worded for that place.
 *
 * The locale is an argument because the venue's name is substituted into the
 * middle of the sentence — there is no finished string a component could
 * hand to a translator, only the shape and the name.
 */
export function tableCtaFor(restaurant, locale = 'both') {
  const kind = venueKind(restaurant?.category);
  const copy = MEET_COPY[kind];
  const name = String(restaurant?.name ?? '').split('(')[0].trim() || 'this place';
  const title = locale === 'ko' ? copy.titleKo
    : locale === 'en' ? copy.titleEn
      : locale === 'es' ? copy.titleEs
        : locale === 'fr' ? copy.titleFr
          : locale === 'ar' ? copy.titleAr
            : locale === 'zh' ? copy.titleZh
              : locale === 'ja' ? copy.titleJa
                : copy.title;
  const sub = locale === 'ko' ? copy.subKo(name)
    : locale === 'es' ? copy.subEs(name)
      : locale === 'fr' ? copy.subFr(name)
        : locale === 'ar' ? copy.subAr(name)
          : locale === 'zh' ? copy.subZh(name)
            : locale === 'ja' ? copy.subJa(name)
              : copy.sub(name);
  return { kind, title, sub };
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

/**
 * How to get here, in one line, in both languages.
 *
 * The station, the line and the walk have been in restaurants.js all along
 * (`transit`, from a routing API) and only ever appeared in English, in
 * fragments — "Anguk" and "Line 3" as two separate labels inside Quick Info.
 * For a traveller who cannot read a Korean map, that line is worth more than
 * the map: 8/4's review said the map showed so little that "같은 한국인이어도
 * … 구분하기 힘들 거 같은데 외국인이면 오죽하겠나".
 *
 * The exit number is deliberately absent. Every one of the sixteen venues has
 * `exit: null` — the routing API did not return it, and restaurants.js says so
 * in its own evidence note. Guessing an exit is exactly the failure this app
 * is built to avoid: somebody stands at the wrong one for twenty minutes.
 * When the data gets exits, this function will print them and not before.
 *
 * "Line 3" → "3호선" is a mechanical rename, not a claim. The station name
 * stays romanised because that is the form we hold; writing 안국 would be
 * inventing a spelling we never sourced.
 */
export function transitLine(restaurant) {
  const t = restaurant?.transit?.value ?? restaurant?.transit;
  const station = String(t?.station ?? '').trim();
  if (!station) return null;

  const lineNo = /(\d+)/.exec(String(t?.line ?? ''))?.[1] ?? null;
  const krLine = lineNo ? `지하철 ${lineNo}호선 ` : '';
  const enLine = t?.line ? `, ${t.line}` : '';
  const esLine = lineNo ? `, línea ${lineNo}` : enLine;
  const frLine = lineNo ? `, ligne ${lineNo}` : enLine;
  const arLine = lineNo ? `، الخط ${lineNo}` : enLine;
  const zhLine = lineNo ? `，${lineNo}号线` : enLine;
  const jaLine = lineNo ? `、${lineNo}号線` : enLine;
  const mins = Number.isFinite(t?.walkingMinutes) ? t.walkingMinutes : null;

  return {
    station,
    line: t?.line ?? null,
    walkingMinutes: mins,
    exit: t?.exit ?? null,
    kr: mins !== null
      ? `${krLine}${station}역에서 도보 ${mins}분`
      : `${krLine}${station}역 근처`,
    en: mins !== null
      ? `${mins} min walk from ${station} Station${enLine}`
      : `Near ${station} Station${enLine}`,
    // Spanish rather than a third field on every caller: the Korean half is
    // what a traveller shows a taxi driver, so it stays beside this one in
    // the bilingual default and Spanish only replaces the English.
    es: mins !== null
      ? `${mins} min a pie desde la estación ${station}${esLine}`
      : `Cerca de la estación ${station}${esLine}`,
    fr: mins !== null
      ? `${mins} min à pied depuis la station ${station}${frLine}`
      : `Près de la station ${station}${frLine}`,
    ar: mins !== null
      ? `${mins} دقائق سيرًا من محطة ${station}${arLine}`
      : `قرب محطة ${station}${arLine}`,
    zh: mins !== null
      ? `从${station}站步行 ${mins} 分钟${zhLine}`
      : `${station}站附近${zhLine}`,
    ja: mins !== null
      ? `${station}駅から徒歩${mins}分${jaLine}`
      : `${station}駅の近く${jaLine}`,
  };
}

/**
 * The catalogue name and a host's typed one, reduced to the same thing.
 *
 * A host who pressed 여기서 상 차리기 gets `restaurant` prefilled from
 * `r.name.split('(')[0].trim()` (App.jsx), so "Balwoo Gongyang (발우공양)"
 * arrives as "Balwoo Gongyang". Everything else — case, stray spacing, a
 * missing or extra parenthetical — is noise this strips so the two can meet.
 */
const venueKey = (name) => String(name ?? '')
  .split('(')[0]
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

/**
 * The station line for a table, from the venue it names.
 *
 * A table stores its venue as a free-typed string and its address as another,
 * so the card was printing "5F Templestay Information Center, 56 Ujeongguk-ro,
 * Jongno-gu, Seoul" — sixty-two characters of postal address in a list
 * somebody is scanning. 여기어때, doing the same job, prints "길동역 도보 3분".
 *
 * We already hold the better line: restaurants.js carries `transit` for the
 * venues, measured on a walking route rather than guessed, and transitLine()
 * has been rendering it on the place page since 8/4. This is the join that
 * lets the *table* use it too.
 *
 * Returns null rather than a guess whenever the venue is not one we hold —
 * a host may type any restaurant in Korea, and inventing a station for one we
 * have never measured is the failure this app exists to avoid. The address
 * still shows in that case; it is simply not improved.
 */
export function stationForTable(table, catalogue = []) {
  const key = venueKey(table?.restaurant);
  if (!key) return null;
  const found = catalogue.find(r => venueKey(r?.name) === key);
  return found ? transitLine(found) : null;
}

/**
 * The one city every open table is in, or null when they are not all in one.
 *
 * Meetup heads its list "Incheon, KR 근처의 이벤트" and 여기어때 makes the
 * region the first field you fill. Our list said nothing at all about where
 * it was — a traveller could scroll the whole screen without learning the
 * app was showing them Seoul.
 *
 * Derived from the catalogue's `zone` ("Jongno, Seoul" → "Seoul") rather than
 * from the table's typed address, because the address is free text and a city
 * parsed out of it would be a guess. Tables at venues we do not hold are
 * skipped, and if any table is skipped or the cities disagree this returns
 * null: a heading saying Seoul over a list containing Busan is worse than a
 * heading saying nothing.
 */
export function cityOfTables(tables = [], catalogue = []) {
  if (!Array.isArray(tables) || tables.length === 0) return null;

  const cities = new Set();
  for (const t of tables) {
    const key = venueKey(t?.restaurant);
    const found = key ? catalogue.find(r => venueKey(r?.name) === key) : null;
    const zone = String(found?.zone ?? '').trim();
    if (!zone) return null;                  // one unknown venue and we stop claiming
    const city = zone.split(',').pop().trim();
    if (!city) return null;
    cities.add(city);
    if (cities.size > 1) return null;         // spread across cities, so name none
  }
  return cities.size === 1 ? [...cities][0] : null;
}

/** Said above the links, so nobody reads them as our own reviews. */
export const MAP_LINKS_NOTE = {
  kr: '후기와 사진은 지도 앱에서 보세요.',
  en: 'Reviews and photos live in the map apps, kept current by the people who run them. Eatple does not copy them here.',
  es: 'Las reseñas y las fotos están en las apps de mapas, mantenidas al día por quienes las gestionan. Eatple no las copia aquí.',
  fr: "Les avis et les photos vivent dans les applications de cartes, tenus à jour par ceux qui les gèrent. Eatple ne les recopie pas ici.",
  ar: 'المراجعات والصور تعيش في تطبيقات الخرائط، ويحدّثها من يديرونها. ولا ينسخها Eatple هنا.',
  zh: '评价和照片在地图应用里，由经营它们的人保持更新。Eatple 不把它们抄到这儿。',
  ja: 'レビューと写真は地図アプリのなかにあり、運営している人たちが最新に保っています。Eatple はそれをここに写しません。',
};
