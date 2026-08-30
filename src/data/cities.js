// Which city a place is in, said loudly enough that somebody who has never
// been to Korea notices.
//
// ── The reason this file exists ──────────────────────────────────────────
//
// Every zone already carried its city: the records read 'Songdo, Incheon'
// and 'Jongno, Seoul', and the cards printed them. So on paper the
// information was never missing. A reviewer on 2026-08-30 read the Places
// tab anyway and wrote: a first-time visitor does not know Incheon is an
// hour from Seoul, and Weekend Picks leads with two Incheon entries, so
// somebody staying in Myeongdong will plan around them and be surprised.
//
// That is the difference between a string being present and a fact being
// legible. 'Songdo, Incheon' looks exactly like 'Insadong, Seoul' to a
// reader who does not yet know that one of those is a different city — same
// shape, same grey, same size, at the end of a line they are skimming. The
// fix is not more text. It is making the city a separate thing on the card,
// and letting a reader rule out the far one in a single tap.
//
// Seven of the eighteen curated places are in Incheon. That is not a rounding
// error a visitor can absorb by accident.

/**
 * The city, from a zone string.
 *
 * Zones are written 'neighbourhood, City' — and 'Chinatown, Jemulpo-gu,
 * Incheon' proves the middle can hold anything, so the city is the last
 * segment rather than the second. Returns null for a zone with no comma:
 * that is a zone we have no city for, and a guess here would put a place in
 * the wrong city on a filter chip, which is worse than showing no chip.
 */
export const cityOf = (zone) => {
  const parts = String(zone ?? '').split(',');
  if (parts.length < 2) return null;
  const city = parts[parts.length - 1].trim();
  return city || null;
};

/**
 * The cities the curated places actually sit in, in the order they should be
 * offered. Derived rather than typed, so adding an Incheon place — or the
 * first Busan one — puts it on the filter row without anybody remembering to.
 */
export const citiesOf = (places) => {
  const seen = [];
  for (const p of places) {
    const c = cityOf(p.zone);
    if (c && !seen.includes(c)) seen.push(c);
  }
  return seen;
};

// The name of the city in each language. A city missing from this table
// falls back to its English name, which is a readable answer in every locale
// this app ships — unlike a blank chip, which is not.
export const CITY_LABEL = {
  Seoul:   { ko: '서울', es: 'Seúl',   fr: 'Séoul',  ar: 'سول',     zh: '首尔', ja: 'ソウル' },
  Incheon: { ko: '인천', es: 'Incheon', fr: 'Incheon', ar: 'إنتشون', zh: '仁川', ja: '仁川' },
};

/**
 * The city's name, in the reader's language.
 *
 * Takes `say` rather than returning the seven strings for the caller to
 * spread, because `say(...cityWords(c))` is invisible to
 * scripts/audit-i18n.mjs: the audit reads the syntax tree and counts the
 * arguments at the call site, and a spread is one argument no matter what it
 * expands to. Three of these reported as "1 of 7 languages" while being
 * perfectly translated, and the fix that makes an audit quiet without
 * changing what it measures is the fix that eventually lets a real miss
 * through. So the seven arguments are written out here, once, where the
 * audit can see them.
 */
export const cityName = (say, city) => {
  const t = CITY_LABEL[city] ?? {};
  return say(city, t.ko ?? city, t.es ?? city, t.fr ?? city, t.ar ?? city, t.zh ?? city, t.ja ?? city);
};
