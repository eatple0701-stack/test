// Mappable — anything that can yield coordinates is viewable on the map.
//
// The map is a general-purpose viewer, not a restaurant map. Every marker
// carries the ancestry it was reached through so that tapping a pin and
// pressing back ascends the hierarchy rather than stranding the traveller on
// a venue with no cultural context.
//
// This module must never import from ../policy/.

import {
  experienceById, experienceIdsOfTheme, themeIdsOfExperience, themeRefsOfCollection,
} from '../catalog/index.js';

const dedupe = (markers) => {
  const seen = new Set();
  return markers.filter(m => {
    const key = `${m.kind}:${m.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function markersOfExperience(experienceId, themeId = null) {
  const e = experienceById(experienceId);
  if (!e) return [];
  // Prefer the theme the caller reached this experience through; fall back to
  // its first membership only when called without a scope.
  const resolvedThemeId = themeId ?? themeIdsOfExperience(e.id)[0] ?? null;
  const parentContext = { experienceId: e.id, themeId: resolvedThemeId };
  return [
    ...e.restaurantIds.map(id => ({ kind: 'restaurant', id, parentContext })),
    ...e.marketIds.map(id => ({ kind: 'market', id, parentContext })),
  ];
}

export function markersOfTheme(themeId) {
  return dedupe(experienceIdsOfTheme(themeId).flatMap(id => markersOfExperience(id, themeId)));
}

export function markersOfCollection(collectionId) {
  return dedupe(themeRefsOfCollection(collectionId).flatMap(r => markersOfTheme(r.themeId)));
}
