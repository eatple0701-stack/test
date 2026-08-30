// Where the interface language is remembered.
//
// A sibling of src/data/theme.js and deliberately the same shape: a device
// preference, stored in localStorage, read once on boot and written on every
// change. It is not on the profile, because it describes a screen rather
// than a person — the same traveller on a borrowed laptop should not have
// their phone's setting follow them onto it, the way the appearance mode
// does not.

import { DEFAULT_LOCALE, isLocale, LOCALE, LOCALES } from '../domain/policy/locale.js';

const LOCALE_KEY = 'bapchingu-locale';

/**
 * The language to open in for somebody who has never chosen one.
 *
 * It used to be `both`, which prints every label twice. On a page built for
 * travellers who do not read Korean that is half the words on screen asking
 * to be skipped, and it pushed the hero's own CTA onto two lines. A UI audit
 * on 2026-08-30 measured 22 duplicated labels and three duplicated
 * paragraphs on the front page alone.
 *
 * So the first guess comes from the browser instead: whatever language the
 * device asks for, if this app speaks it, else English. `both` stays as a
 * choice in settings — it is genuinely useful for a Korean host reading
 * alongside a guest — it is just no longer what a stranger is handed.
 *
 * Deliberately only a *default*: the moment anybody picks a language it is
 * stored, and this function never runs again for them.
 */
export function guessLocale(nav = typeof navigator === 'undefined' ? null : navigator) {
  const tags = [nav?.language, ...(nav?.languages ?? [])].filter(Boolean);
  for (const tag of tags) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (LOCALES.includes(base) && base !== LOCALE.BOTH) return base;
  }
  return LOCALE.EN;
}

/** What they picked, or a language guessed from the device for a newcomer. */
export function getStoredLocale() {
  try {
    const l = localStorage.getItem(LOCALE_KEY);
    return isLocale(l) ? l : guessLocale();
  } catch {
    return guessLocale();
  }
}

/** Saves the choice and hands it back, so a caller can set state from it. */
export function setStoredLocale(locale) {
  const clean = isLocale(locale) ? locale : DEFAULT_LOCALE;
  try {
    localStorage.setItem(LOCALE_KEY, clean);
  } catch {
    // Private mode: not durable, but this session still works.
  }
  return clean;
}
