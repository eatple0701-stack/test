import { createContext, useContext, useMemo } from 'react';
import { LOCALE, DEFAULT_LOCALE } from '../domain/policy/locale.js';

// The interface language, available to any component that renders content
// rather than labels.
//
// LocaleFilter handles labels — the 187 strings written "한국어 · English" and
// the 55 pairs written as two elements — by reducing what the app already
// rendered. That works because both halves were already on the screen.
//
// It cannot help with content, because content was written once, in English:
// the seven culture questions, the theme narratives, the restaurant write-ups,
// the quiz. There is no Korean half to keep. Those need a second string in the
// data and a component that picks one, which is what this is.
//
// Why a context rather than a prop threaded down: the render sites are deep
// (PlacesTab → PlaceCard → RestaurantDetail → the culture block inside it),
// and a prop passed through four components that do not otherwise care about
// language is four chances to forget it in the fifth.
//
// No component is exported from this file on purpose — App.jsx renders
// LocaleContext.Provider directly. A module that exports both a component and
// a hook breaks fast refresh, and this one is imported by most of the app.

export const LocaleContext = createContext(DEFAULT_LOCALE);

/** The current setting: 'both', 'ko' or 'en'. */
export const useLocale = () => useContext(LocaleContext);

/**
 * Picks the Korean text when Korean is what was asked for and Korean exists.
 *
 * Falls back to English in every other case, including the bilingual default
 * — which is deliberate. `both` is the screen the team has reviewed, and this
 * app's content was written for English readers; showing a Korean paragraph
 * above every English one would double the length of every article on the
 * argument that the setting is called "both". Korean-only is the setting that
 * asks for Korean, and it is the setting that gets it.
 *
 * A missing Korean string returns the English rather than a blank: an
 * untranslated paragraph is worth reading, an empty one is a bug on screen.
 * That fallback is also what lets this land one screen at a time instead of
 * in one commit that has to translate everything before anything works.
 */
export function useText() {
  const locale = useLocale();
  return useMemo(() => (en, ko) => (locale === LOCALE.KO && ko ? ko : en), [locale]);
}
