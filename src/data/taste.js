import { emptyTaste, VERDICT } from '../domain/policy/taste.js';

// Where the taste map is kept.
//
// This browser, and nowhere else. The deck said so on screen from the day it
// shipped — "이 지도는 이 브라우저에만 저장돼요" over the button that offers to
// keep it — and until this file existed that sentence was not true in the
// direction that mattered: the map was component state, so it did not survive
// leaving the deck, let alone closing the tab. A promise about where
// something is stored is a lie in both directions if it is not stored at all.
//
// Not on the server, and not yet under an account. Fourteen swipes before
// anybody has said who they are is the entire point of the ordering — the ask
// comes after the map, because the map is what makes the ask worth answering.
// Nothing here names a person, and a signed-in traveller keeps the same rows.
//
// Every read and write is wrapped: Safari's private mode throws on setItem
// rather than returning, and a quota error while saving a preference must
// never be what stops somebody swiping.

const TASTE_KEY = 'bapchingu-taste';

/** Ids only, and only strings — whatever else a stored blob holds is dropped. */
const cleanIds = (value) =>
  Array.isArray(value) ? value.filter(id => typeof id === 'string' && id) : [];

/**
 * The stored map, or an empty one.
 *
 * A dish id that has since left the catalogue is kept here and dropped where
 * it is drawn (`tasteMap` looks every id up and skips what it cannot find).
 * Rewriting somebody's stored answers because a catalogue changed under them
 * is the kind of silent edit `getStoredTheme` refuses to make either.
 */
export function getStoredTaste() {
  try {
    const raw = localStorage.getItem(TASTE_KEY);
    if (!raw) return emptyTaste();
    const parsed = JSON.parse(raw);
    const want = cleanIds(parsed?.want);
    const pass = cleanIds(parsed?.pass);
    // An id on both lists is a corrupt blob, not a decision. The verdict that
    // wins is `pass`, because the cost of showing somebody a dish they said
    // no to is smaller than the cost of hiding one they said yes to... and
    // the reverse of that sentence is why `want` is filtered, not `pass`.
    const passSet = new Set(pass);
    return { want: want.filter(id => !passSet.has(id)), pass };
  } catch {
    return emptyTaste();
  }
}

/** Keep it. Returns what was written, so a caller can hold the same object. */
export function storeTaste(taste) {
  const clean = {
    want: cleanIds(taste?.want),
    pass: cleanIds(taste?.pass),
  };
  try {
    localStorage.setItem(TASTE_KEY, JSON.stringify(clean));
  } catch { /* private mode, or quota — the deck carries on either way */ }
  return clean;
}

/** Forget it, for the deck's own 다시 하기 and for anybody clearing up. */
export function clearTaste() {
  try { localStorage.removeItem(TASTE_KEY); } catch { /* nothing to do */ }
  return emptyTaste();
}

/**
 * The dishes to lift to the top of a list, newest answer first.
 *
 * Reversed because the last yes is the one somebody is still thinking about.
 * The deck asks fourteen questions and a list has room for a few, so which
 * end gets truncated is a real decision and this is the end to keep.
 */
export const preferredMenuIds = (taste) => [...cleanIds(taste?.want)].reverse();

/** Did anybody answer anything at all? */
export const hasTaste = (taste) =>
  cleanIds(taste?.want).length > 0 || cleanIds(taste?.pass).length > 0;

export { VERDICT };
