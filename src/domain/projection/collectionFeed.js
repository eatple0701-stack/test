// CollectionFeed — the editorial surface.
//
// Driven by curation rather than personalisation, so it is fully coherent
// for a brand-new traveller with no records at all. Journey state only
// annotates the entries; it never decides which ones appear.

import { collections, themeById, themeRefsOfCollection } from '../catalog/index.js';
import { isSurfaceableEntity, admissiblePlaceIds } from '../policy/visibility.js';
import { assessCollection } from '../capability/playable.js';
import { journeyProgress } from './journeyProgress.js';

/** Inclusive month window, wrapping across the year end (e.g. 11 → 2). */
function withinWindow(window, at) {
  if (!window) return true;
  const month = at.getMonth() + 1;
  const { fromMonth, toMonth } = window;
  return fromMonth <= toMonth
    ? month >= fromMonth && month <= toMonth
    : month >= fromMonth || month <= toMonth;
}

export function collectionFeed(journey, { at = new Date(), availableEvents } = {}) {
  const progress = journeyProgress(journey);
  const byTheme = new Map(progress.themes.map(t => [t.themeId, t]));

  const context = {
    at,
    admissiblePlaces: admissiblePlaceIds(),
    // Markets have no closure model yet, so every seeded market counts as
    // available until an Event lifecycle exists to say otherwise.
    availableEvents: availableEvents ?? new Set(['gwangjang', 'namdaemun', 'insadong-ssamzie', 'sinpo']),
  };

  return collections
    .filter(isSurfaceableEntity)
    .filter(c => withinWindow(c.activeWindow, at))
    .map(c => ({
      collectionId: c.id,
      title: c.title,
      tagline: c.tagline,
      status: c.status,
      playable: assessCollection(c.id, context).playable,
      themes: themeRefsOfCollection(c.id)
        .filter(r => isSurfaceableEntity(themeById(r.themeId)))
        .map(r => {
          const p = byTheme.get(r.themeId);
          return {
            themeId: r.themeId,
            title: themeById(r.themeId)?.title ?? r.themeId,
            editorialAngle: r.editorialAngle,
            complete: p?.complete ?? false,
            pct: p?.pct ?? 0,
          };
        }),
    }));
}
