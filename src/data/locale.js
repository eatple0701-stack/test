// Where the interface language is remembered.
//
// A sibling of src/data/theme.js and deliberately the same shape: a device
// preference, stored in localStorage, read once on boot and written on every
// change. It is not on the profile, because it describes a screen rather
// than a person — the same traveller on a borrowed laptop should not have
// their phone's setting follow them onto it, the way the appearance mode
// does not.

import { DEFAULT_LOCALE, isLocale } from '../domain/policy/locale.js';

const LOCALE_KEY = 'bapchingu-locale';

/** What they picked, or the bilingual default for anyone who never chose. */
export function getStoredLocale() {
  try {
    const l = localStorage.getItem(LOCALE_KEY);
    return isLocale(l) ? l : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
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
