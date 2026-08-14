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
// data and a component that picks one, which is what this is — and a third
// once Español arrived, which needed no new mechanism, only a third argument.
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

/** The current setting: 'both', 'ko', 'en', 'es' or 'fr'. */
export const useLocale = () => useContext(LocaleContext);

/**
 * say(en, ko, es, fr, ar, zh) — the text in whichever language was asked for.
 *
 * English is both the first argument and the fallback, which is deliberate on
 * two counts. `both` is the screen the team has reviewed, and this app's
 * content was written for English readers: showing a Korean paragraph above
 * every English one would double the length of every article on the argument
 * that the setting is called "both". And a missing translation returns the
 * English rather than a blank — an untranslated paragraph is worth reading,
 * an empty one is a bug on screen.
 *
 * That fallback is also what let Korean land one screen at a time rather than
 * in one commit that had to translate everything before anything worked, and
 * it is what lets Spanish do the same now. The cost is that a missing
 * translation is invisible to the reader, so the suite asserts the twins
 * exist instead — see src/domain/__tests__/koreanContent.test.mjs and its
 * Spanish sibling.
 */
export function useText() {
  const locale = useLocale();
  // Positional rather than an object, because it started as two arguments and
  // every one of the 423 call sites already reads left to right in the order
  // the languages arrived. An object would be tidier and would mean editing
  // all of them to gain nothing a reader of one line can see.
  return useMemo(() => (en, ko, es, fr, ar, zh) => {
    if (locale === LOCALE.KO && ko) return ko;
    if (locale === LOCALE.ES && es) return es;
    if (locale === LOCALE.FR && fr) return fr;
    if (locale === LOCALE.AR && ar) return ar;
    if (locale === LOCALE.ZH && zh) return zh;
    return en;
  }, [locale]);
}
