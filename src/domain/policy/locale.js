// Which language the interface speaks.
//
// Asked for on 2026-08-07: a setting that starts on Korean + English and can
// be turned down to one of them.
//
// The honest scope, measured before writing a line of this: the app holds
// 22,342 Korean characters across 106 files, of which 187 are bilingual pairs
// written as "상 차리기 · Open a table". Korean and English are the only two
// languages every one of those pairs already contains — so those two can be
// separated today, with no translation and nothing invented. A Spanish or
// Japanese interface is a translation project, not a switch, and a picker
// offering Español that silently served English would be the app lying about
// what it is. Those options are not here until the words are.
//
// The mechanism is a split rather than a lookup table, and that is a
// deliberate trade. A lookup table of 187 keys would be tidier and would
// need every one of those call sites edited before a single label changed;
// splitting the strings the app already writes means the setting works
// everywhere the convention was followed, on the day it ships. What it costs
// is that the convention now matters — hence `splitPair`'s rules below and
// the tests that hold them.

export const LOCALE = {
  BOTH: 'both',   // 한국어 · English — what the app has always shown
  KO: 'ko',       // 한국어만
  EN: 'en',       // English only
};

export const LOCALES = [LOCALE.BOTH, LOCALE.KO, LOCALE.EN];

export const isLocale = (l) => LOCALES.includes(l);

/** The default, and the one the reviewers have been reading all along. */
export const DEFAULT_LOCALE = LOCALE.BOTH;

/** What the picker calls each one — in both, always, since it is the control
 *  somebody uses when the current setting is the thing they cannot read. */
export const LOCALE_LABEL = {
  [LOCALE.BOTH]: { kr: '한국어 + 영어', en: 'Korean + English' },
  [LOCALE.KO]: { kr: '한국어', en: 'Korean only' },
  [LOCALE.EN]: { kr: '영어', en: 'English only' },
};

const HANGUL = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;

/** Does this fragment carry Korean? */
export const isKorean = (s) => HANGUL.test(String(s ?? ''));

/**
 * One string, reduced to one language.
 *
 * The app writes pairs as "상 차리기 · Open a table", and the same middot
 * also separates list items — "밥상 · tables", "또는 · or", and a footer
 * carrying two pairs at once. So this classifies each segment by script
 * rather than assuming position: Korean segments are the Korean half,
 * segments with no Hangul are the English half.
 *
 * Three rules that exist because breaking them breaks a real screen:
 *
 *   Nothing is ever emptied. A string with no segment in the chosen
 *   language comes back whole — a dish name, a host's name, an address, a
 *   Google button. Better the other language than a blank label.
 *
 *   A string with no middot at all is returned untouched. Most of the app
 *   is prose in one language already.
 *
 *   `both` is the identity. The default path does no work and cannot
 *   introduce a bug into the screens everybody has been reviewing.
 */
export function localeText(text, locale = DEFAULT_LOCALE) {
  const s = String(text ?? '');
  if (locale === LOCALE.BOTH || !s.includes(' · ')) return s;

  const parts = s.split(' · ');
  const wanted = locale === LOCALE.KO
    ? parts.filter(p => isKorean(p))
    : parts.filter(p => !isKorean(p));

  // Every segment was the other language — keep the string rather than
  // render nothing.
  if (wanted.length === 0) return s;
  return wanted.join(' · ');
}

/**
 * A `{ kr, en }` pair, reduced the same way — for the places that hold the
 * two halves as separate fields rather than one string.
 *
 * Returns the joined form for `both`, so a caller can print one value
 * regardless of the setting.
 */
export function localePair({ kr, en } = {}, locale = DEFAULT_LOCALE) {
  const k = String(kr ?? '').trim();
  const e = String(en ?? '').trim();
  if (locale === LOCALE.KO) return k || e;
  if (locale === LOCALE.EN) return e || k;
  return [k, e].filter(Boolean).join(' · ');
}
