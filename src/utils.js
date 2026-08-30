// Shared helpers for distance and opening hours.

// Extension is explicit so data QA scripts can import this under plain Node.
import { isKnown } from './data/verification.js';

// Initial map view: frames the Seoul cluster (Jongno down to Itaewon)
export const MAP_CENTER = [37.5540, 126.9880];

/** Coordinates are stored as a fact(); every consumer reads them through here. */
// Null-safe since the 서울관광재단 register arrived. 2,953 of its 167,659 rows
// have no usable position — never geocoded, or geocoded outside Seoul, which
// the build script rejects rather than pinning a restaurant a hundred
// kilometres from its own address. They are still real places on the list;
// they simply cannot be drawn or measured. `formatDistance` already returns
// '' for a non-finite number, so the card degrades to no distance rather
// than to NaN.
// Two shapes reach this, because two different things are being modelled.
// A curated place stores coordinates as a fact() — a value with a source, a
// method and a date somebody checked it on. A register row has no
// per-field provenance (the whole import carries one `reported` note), so
// nearbyPlaces.asPlace hands over a bare `{ lat, lng }`.
//
// This read `.value` only, and asPlace's own doc comment still says
// "coordsOf reads .coordinates" — true when it was written, and quietly
// false ever since. The result: every one of the 8,118 register places
// produced map links reading `,undefined,undefined`. Nothing failed, no test
// noticed, and the links opened a map app pointed at nowhere.
//
// domain/policy/venue.js:mapLinksFor has always accepted both. This now
// matches it rather than inventing a third convention.
export const coordsOf = (place) => (
  place?.coordinates?.value ?? place?.coordinates ?? { lat: undefined, lng: undefined }
);

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistance(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(Math.round(km * 20) * 50, 50)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// "11:30 AM" or "11:30" → minutes since midnight, null if unparseable
function toMinutes(str) {
  const ampm = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10) % 12;
    if (/pm/i.test(ampm[3])) h += 12;
    return h * 60 + parseInt(ampm[2], 10);
  }
  const h24 = str.match(/^(\d{1,2}):(\d{2})$/);
  return h24 ? parseInt(h24[1], 10) * 60 + parseInt(h24[2], 10) : null;
}

// A clock time, written the way the reader's language writes one.
//
// This used to return `11:30 AM` to everybody. The map row never passed a
// locale to getOpenStatus, so the whole hours line came out in English and
// the `AM` was invisible among the rest of it. The moment the row started
// translating, the Korean read `월 11:30 AM 영업 시작` — Korean sentence,
// English clock. Fixing the outer sentence is what exposed the inner one.
//
// Spanish, French and Arabic get a 24-hour clock, which is what those
// languages use for opening times and which sidesteps translating a
// meridiem. Korean, Chinese and Japanese put theirs in front, as they do.
const MERIDIEM = {
  ko: ['오전', '오후'],
  zh: ['上午', '下午'],
  ja: ['午前', '午後'],
};
const fromMinutes = (mins, locale = 'both') => {
  const h = Math.floor(mins / 60);
  const m = String(mins % 60).padStart(2, '0');
  if (locale === 'es' || locale === 'fr' || locale === 'ar') {
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  const twelve = ((h + 11) % 12) + 1;
  const words = MERIDIEM[locale];
  if (words) return `${words[h < 12 ? 0 : 1]} ${twelve}:${m}`;
  return `${twelve}:${m} ${h < 12 ? 'AM' : 'PM'}`;
};

// Fall back to reading a free-text range like "11:30 AM – 9:30 PM". Only used
// for places whose hours haven't been structured yet.
function statusFromRaw(raw, cur, locale = 'both') {
  const parts = String(raw).split('–').map(s => s.trim());
  if (parts.length !== 2) return null;
  const opens = toMinutes(parts[0]);
  const closes = toMinutes(parts[1]);
  if (opens == null || closes == null) return null;
  return cur >= opens && cur < closes
    ? { open: true, label: pickWord(HOURS_WORD.Open, locale), detail: pickWord(hoursPhrase.until(parts[1]), locale) }
    : { open: false, label: pickWord(HOURS_WORD.Closed, locale), detail: pickWord(hoursPhrase.opens(parts[0]), locale) };
}

/**
 * hoursFact → { open, label, detail } | null when we can't say.
 *
 * Never guesses. A day absent from `weekly` means we don't know that day's
 * hours, and returns null rather than assuming the venue is shut.
 */
// The four words this function can say, in every language the app offers.
// Kept together rather than inline so a fifth state cannot be added in one
// language and forgotten in the others.
const HOURS_WORD = {
  Open: ['Open', '영업 중', 'Abierto', 'Ouvert', 'مفتوح', '营业中', '営業中'],
  Closed: ['Closed', '영업 종료', 'Cerrado', 'Fermé', 'مغلق', '已打烊', '営業終了'],
};
// Weekday names, short, indexed the way Date#getDay() counts — Sunday first,
// matching DAY_KEYS above so the two can never drift out of step.
const DAY_WORD = [
  ['Sun', '일', 'dom', 'dim', 'الأحد', '周日', '日'],
  ['Mon', '월', 'lun', 'lun', 'الاثنين', '周一', '月'],
  ['Tue', '화', 'mar', 'mar', 'الثلاثاء', '周二', '火'],
  ['Wed', '수', 'mié', 'mer', 'الأربعاء', '周三', '水'],
  ['Thu', '목', 'jue', 'jeu', 'الخميس', '周四', '木'],
  ['Fri', '금', 'vie', 'ven', 'الجمعة', '周五', '金'],
  ['Sat', '토', 'sáb', 'sam', 'السبت', '周六', '土'],
];

const hoursPhrase = {
  closedToday: ['closed today', '오늘 휴무', 'cerrado hoy', "fermé aujourd'hui", 'مغلق اليوم', '今天休息', '本日休み'],
  closedForToday: ['closed for today', '오늘 영업 종료', 'cerrado por hoy', "fermé pour aujourd'hui", 'انتهى دوام اليوم', '今天已打烊', '本日は終了'],
  // The two above are what this function used to end on, and the reason it
  // now rarely does. `Closed · closed for today` says closed twice and leaves
  // a reader who opened the app at 11pm — which is exactly when somebody
  // plans tomorrow's lunch — with nothing to act on. Where the record holds a
  // week, the next actual opening is known, so say that instead.
  opensOn: (day, t) => [
    `opens ${day} ${t}`,
    `${day} ${t} 영업 시작`,
    `abre el ${day} a las ${t}`,
    `ouvre ${day} à ${t}`,
    `يفتح ${day} ${t}`,
    `${day} ${t} 开门`,
    `${day} ${t} 開店`,
  ],
  until: (t) => [`until ${t}`, `${t}까지`, `hasta las ${t}`, `jusqu'à ${t}`, `حتى ${t}`, `到 ${t}`, `${t}まで`],
  untilLastOrder: (t, lo) => [
    `until ${t} · last order ${lo}`,
    `${t}까지 · 라스트오더 ${lo}`,
    `hasta las ${t} · último pedido ${lo}`,
    `jusqu'à ${t} · dernière commande ${lo}`,
    `حتى ${t} · آخر طلب ${lo}`,
    `到 ${t} · 最后点单 ${lo}`,
    `${t}まで · ラストオーダー ${lo}`,
  ],
  lastOrderPassed: (t) => [
    `last order passed, closes ${t}`,
    `라스트오더 마감, ${t}에 닫습니다`,
    `último pedido pasado, cierra a las ${t}`,
    `dernière commande passée, ferme à ${t}`,
    `انتهى وقت آخر طلب، يغلق ${t}`,
    `已过最后点单时间，${t} 打烊`,
    `ラストオーダー終了、${t}に閉店`,
  ],
  opens: (t) => [`opens ${t}`, `${t}에 엽니다`, `abre a las ${t}`, `ouvre à ${t}`, `يفتح ${t}`, `${t} 开门`, `${t}に開店`],
};
const pickWord = (words, locale) => (
  locale === 'ko' ? words[1]
    : locale === 'es' ? words[2]
      : locale === 'fr' ? words[3]
        : locale === 'ar' ? words[4]
          : locale === 'zh' ? words[5]
            : locale === 'ja' ? words[6]
              : words[0]);

export function getOpenStatus(hoursFact, now = new Date(), locale = 'both') {
  if (!isKnown(hoursFact)) return null;
  const { raw, weekly } = hoursFact.value;
  const cur = now.getHours() * 60 + now.getMinutes();

  if (!weekly) return raw ? statusFromRaw(raw, cur, locale) : null;

  const today = weekly[DAY_KEYS[now.getDay()]];
  if (!today) return null; // day not recorded — say nothing

  // The next time this place actually opens, looking forward from tomorrow.
  // Returns null when the record holds no open slot in the coming week, which
  // is either a place that never opens or a week that was only half filled
  // in — both cases where the old "closed for today" is the honest answer.
  const nextOpenDay = () => {
    // Six, not seven: the seventh step lands back on today, and a place that
    // opens only today would be reported as opening again today.
    for (let ahead = 1; ahead <= 6; ahead += 1) {
      const key = DAY_KEYS[(now.getDay() + ahead) % 7];
      // A day absent from `weekly` is a day nobody recorded, and this
      // function has refused to speak for those since it was written — three
      // lines up it returns null rather than call today shut. Skipping an
      // absent day here would have said the opposite out loud: ggot-epida
      // leaves Wednesday out on purpose ("the one Wednesday on file opened
      // at 17:00. A weekly rule from a single observation would be a
      // guess"), and on a Tuesday evening the first draft of this loop
      // announced `opens Thu 11:30 AM` — asserting a closure the record had
      // deliberately declined to assert. Stop at the edge of what is known.
      if (!(key in weekly)) return null;
      const day = weekly[key];
      if (!day || day.length === 0) continue;   // recorded as shut — keep looking
      const first = day
        .map(s => toMinutes(s.from))
        .filter(m => m != null)
        .sort((a, b) => a - b)[0];
      if (first == null) continue;
      return { dayIndex: (now.getDay() + ahead) % 7, at: fromMinutes(first, locale) };
    }
    return null;
  };
  const closedUntilNextOpening = (fallback) => {
    const next = nextOpenDay();
    return {
      open: false,
      label: pickWord(HOURS_WORD.Closed, locale),
      detail: next
        ? pickWord(hoursPhrase.opensOn(pickWord(DAY_WORD[next.dayIndex], locale), next.at), locale)
        : pickWord(fallback, locale),
    };
  };

  if (today.length === 0) return closedUntilNextOpening(hoursPhrase.closedToday);

  for (const slot of today) {
    const from = toMinutes(slot.from);
    const to = toMinutes(slot.to);
    if (from == null || to == null) continue;
    if (cur >= from && cur < to) {
      const lo = slot.lastOrder ? toMinutes(slot.lastOrder) : null;
      // Once last order has passed, "open until close" would mislead someone
      // deciding whether it's worth the trip.
      if (lo != null && cur >= lo) {
        return { open: true, label: pickWord(HOURS_WORD.Open, locale), detail: pickWord(hoursPhrase.lastOrderPassed(fromMinutes(to, locale)), locale) };
      }
      return {
        open: true,
        label: pickWord(HOURS_WORD.Open, locale),
        detail: slot.lastOrder
          ? pickWord(hoursPhrase.untilLastOrder(fromMinutes(to, locale), fromMinutes(lo, locale)), locale)
          : pickWord(hoursPhrase.until(fromMinutes(to, locale)), locale),
      };
    }
  }

  const next = today
    .map(s => toMinutes(s.from))
    .filter(m => m != null && m > cur)
    .sort((a, b) => a - b)[0];
  return next != null
    ? { open: false, label: pickWord(HOURS_WORD.Closed, locale), detail: pickWord(hoursPhrase.opens(fromMinutes(next, locale)), locale) }
    : closedUntilNextOpening(hoursPhrase.closedForToday);
}

/** Today's printed hours, e.g. "11:30 AM – 3:00 PM, 6:00 PM – 8:20 PM". */
export function todaysHours(hoursFact, now = new Date(), locale = 'both') {
  if (!isKnown(hoursFact)) return null;
  const { weekly } = hoursFact.value;
  if (!weekly) return hoursFact.value.raw ?? null;
  const today = weekly[DAY_KEYS[now.getDay()]];
  if (!today) return null;
  // This returned a bare English 'Closed today' with a lint suppression
  // pointing at the translated pair in getOpenStatus — which is where the
  // words already lived, so the comment named the fix and declined it. The
  // detail sheets print the result straight under a Korean heading.
  //
  // Null rather than the translated phrase, because of where it lands. Both
  // callers wrap it in the word "today" — RestaurantDetail.jsx:483 renders
  // `(today {this})` — so a closed day read `(today closed today)`, and the
  // status line beside it already said `Closed · opens Mon 11:30 AM`. This
  // line exists to print the day's ranges; on a day with none, the honest
  // number of words is zero.
  if (today.length === 0) return null;
  return today.map(s => `${fromMinutes(toMinutes(s.from), locale)} – ${fromMinutes(toMinutes(s.to), locale)}`).join(', ');
}

// A directions deep link into Google Maps. With an origin (the current map
// centre — the area the user is looking at) it opens a routed trip rather than
// just dropping a pin they then have to route from themselves. Without one it
// falls back to the previous pin behaviour, so a missing origin never breaks
// the link. No runtime routing call is made here — the map app does the
// routing — so this stays inside the no-backend constraint (§2.1).
export function directionsUrl(place, origin = null) {
  const { lat, lng } = coordsOf(place);
  const destination = `${lat},${lng}`;
  if (origin && Number.isFinite(origin[0]) && Number.isFinite(origin[1])) {
    const params = new URLSearchParams({
      api: '1',
      origin: `${origin[0]},${origin[1]}`,
      destination,
    });
    return `https://www.google.com/maps/dir/?${params}`;
  }
  // Without an origin this used to return a *search* URL. Opened on
  // 2026-08-30 it produced a page titled 37°34'25.8"N 126°58'59.6"E with a
  // plus code and nothing else — the right patch of ground, no restaurant,
  // no route. The directions form with the same coordinate returns three
  // live transit options instead, which is what a button labelled Directions
  // was promising. Google fills the origin in from the device.
  //
  // The destination stays a coordinate in both branches, deliberately. The
  // obvious alternative is to search Google for the restaurant's name, and
  // that resolves beautifully for 발우공양 and lands somewhere else entirely
  // for a name like 말모아왕족발. Our coordinates were checked against Naver
  // and Kakao on a recorded date; a name search is checked against nothing.
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export function naverMapUrl(place, origin = null) {
  const { lat, lng } = coordsOf(place);
  const name = encodeURIComponent(place.name);
  if (origin && Number.isFinite(origin[0]) && Number.isFinite(origin[1])) {
    return `https://map.naver.com/p/directions/${origin[1]},${origin[0]},Origin/${lng},${lat},${name}/-/transit?c=15,0,0,0,dh`;
  }
  // Same destination, origin left for Naver to fill in. The previous
  // fallback searched Naver for `place.name` — which is written
  // "Balwoo Gongyang (발우공양)", brackets and all, so the query Naver
  // actually received was `Balwoo%20Gongyang%20(발우공양)`. A search string
  // decides which restaurant you get; a coordinate does not.
  return `https://map.naver.com/p/directions/-/${lng},${lat},${name}/-/transit?c=15,0,0,0,dh`;
}

// `_origin` is accepted and ignored, unlike the two above, so all three can be
// called the same way. Kakao's link/to/ format has no origin parameter — the
// app works the starting point out itself — so there is nothing to pass on.
//
// ── Known not to work in a desktop browser ───────────────────────────────
//
// Opened on 2026-08-30 in a desktop browser, map.kakao.com/link/to/… landed
// on Kakao's directions page with the destination field *empty*, for both a
// Korean name and a plain ASCII one; link/map/… landed on a plain map
// centred on the viewer's own location. The coordinate never arrives.
//
// This is the documented format and it is the mobile-app URL scheme, so the
// likely reading is that it works on a phone — where this app's users are —
// and degrades to nothing on a laptop. Likely is not verified, and it has
// not been tested on a phone. Left exactly as it is rather than replaced
// with a second unverified format: a guess that also fails is not progress,
// and the Google button next to it does work. See docs/next-work-order.md.
export function kakaoMapUrl(place, _origin = null) {
  const { lat, lng } = coordsOf(place);
  const name = encodeURIComponent(place.name);
  return `https://map.kakao.com/link/to/${name},${lat},${lng}`;
}
