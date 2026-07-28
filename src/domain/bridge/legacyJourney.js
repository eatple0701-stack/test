// Legacy bridge — the seam of the strangler fig.
//
// Reads the state the running app already persists and presents it to the
// new domain model as a Journey. Nothing about the existing storage shape
// changes, and this module deliberately imports nothing from
// src/data/journey.js: the old engine and the new model must be able to run
// side by side without either depending on the other.
//
// `kfm-experiences` is written by no current code path. Reading it has to
// degrade to an empty set rather than throw, so this bridge works against
// today's storage and tomorrow's alike.

import { emptyJourney } from '../types.js';

export const LEGACY_KEYS = {
  BOOKMARKS: 'kfm-bookmarks',
  MARKETS: 'kfm-markets',
  COMPANIONS: 'kfm-companions',
  ATTESTATIONS: 'kfm-experiences',
};

const asArray = (value) => (Array.isArray(value) ? value : []);

/** Accepts both the original bare-id shape and the timestamped `{id, at}`. */
const idOf = (entry) => {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry.id === 'string') return entry.id;
  return null;
};

/**
 * Map already-parsed legacy state onto a Journey.
 *
 * Only a bookmark with a non-null `visitedAt` counts as a visit; a saved
 * wishlist entry is not a completion. Legacy plain-string bookmark entries
 * predate visit tracking, so they can only ever mean "saved".
 */
export function journeyFromLegacy({ bookmarks, markets, companions, attestations } = {}) {
  const journey = emptyJourney();

  for (const entry of asArray(bookmarks)) {
    if (typeof entry !== 'object' || entry === null) continue;
    if (typeof entry.id !== 'string') continue;
    if (entry.visitedAt === null || entry.visitedAt === undefined) continue;
    journey.visitedRestaurantIds.add(entry.id);
  }

  // Markets and attestations were first stored as bare id strings. They now
  // carry a timestamp so the Passport can lay the trip out in the order it
  // happened, and both shapes are accepted: an entry recorded before that
  // change still counts as done, it just has no date to show.
  for (const id of asArray(markets).map(idOf)) {
    if (id) journey.visitedMarketIds.add(id);
  }

  for (const entry of asArray(companions)) {
    if (entry && typeof entry.travelerId === 'string') journey.companionIds.add(entry.travelerId);
  }

  for (const id of asArray(attestations).map(idOf)) {
    if (id) journey.attestedExperienceIds.add(id);
  }

  return journey;
}

const readJson = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Read a Journey straight from a Storage-like object. Pass `localStorage` in
 * the browser; pass a stub in tests.
 */
export function readLegacyJourney(storage) {
  if (!storage || typeof storage.getItem !== 'function') return emptyJourney();
  return journeyFromLegacy({
    bookmarks: readJson(storage, LEGACY_KEYS.BOOKMARKS),
    markets: readJson(storage, LEGACY_KEYS.MARKETS),
    companions: readJson(storage, LEGACY_KEYS.COMPANIONS),
    attestations: readJson(storage, LEGACY_KEYS.ATTESTATIONS),
  });
}
