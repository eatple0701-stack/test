// JourneyProgress — how far along the whole trip is, on the Theme axis.
//
// This runs beside the existing computeJourney throughout Phase 0 rather
// than replacing it. Divergence between the two is a defect in this model
// and is caught by the parity harness.

import { themes, experienceById, experienceIdsOfTheme } from '../catalog/index.js';
import { experienceDone, themeDone, themeExplored } from '../policy/completion.js';
import { isSurfaceableEntity } from '../policy/visibility.js';

export function journeyProgress(journey) {
  const visible = themes.filter(isSurfaceableEntity);

  const themeProgress = visible.map(t => {
    const ids = experienceIdsOfTheme(t.id);
    const done = ids.filter(id => experienceDone(experienceById(id), journey)).length;
    return {
      themeId: t.id,
      title: t.title,
      total: ids.length,
      done,
      pct: ids.length === 0 ? 0 : Math.round((done / ids.length) * 100),
      complete: themeDone(t.id, journey),
      explored: themeExplored(t.id, journey),
    };
  });

  // The most-progressed incomplete theme keeps the suggestion reachable,
  // rather than always pointing at the hardest one.
  const current = themeProgress
    .filter(t => !t.complete)
    .sort((a, b) => b.pct - a.pct || a.themeId.localeCompare(b.themeId))[0] ?? null;

  const nextExperienceId = current
    ? experienceIdsOfTheme(current.themeId)
        .find(id => !experienceDone(experienceById(id), journey)) ?? null
    : null;

  return {
    themes: themeProgress,
    themesCompleted: themeProgress.filter(t => t.complete).length,
    experiencesCompleted: themeProgress.reduce((n, t) => n + t.done, 0),
    currentTheme: current ? current.themeId : null,
    nextExperienceId,
  };
}
