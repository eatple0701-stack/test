// Catalog barrel plus a mechanical integrity gate.
//
// The gate keeps referential rules enforceable rather than relying on a
// reviewer remembering them, in the same spirit as scripts/check-data.mjs.
// It runs in the test suite, so a broken reference fails CI rather than
// surfacing as an empty screen later.

import { STATUS } from '../types.js';
import { experiences, experienceById, hasAnchor } from './experiences.js';
import {
  themes, themeExperiences, themeById, experienceIdsOfTheme, themeIdsOfExperience,
} from './themes.js';
import {
  narratives, narrativeSteps, narrativeById, narrativesOfTheme, stepsOfNarrative,
} from './narratives.js';
import {
  collections, collectionThemes, collectionById, themeRefsOfCollection, collectionIdsOfTheme,
} from './collections.js';

export {
  experiences, experienceById, hasAnchor,
  themes, themeExperiences, themeById, experienceIdsOfTheme, themeIdsOfExperience,
  narratives, narrativeSteps, narrativeById, narrativesOfTheme, stepsOfNarrative,
  collections, collectionThemes, collectionById, themeRefsOfCollection, collectionIdsOfTheme,
};

/**
 * Every referential rule the catalog must satisfy, as a list of problems.
 * Empty means healthy.
 */
export function catalogIntegrity() {
  const problems = [];
  const note = (msg) => problems.push(msg);

  const themeIds = new Set(themes.map(t => t.id));
  const collectionIds = new Set(collections.map(c => c.id));
  const narrativeIds = new Set(narratives.map(n => n.id));

  for (const row of themeExperiences) {
    if (!themeIds.has(row.themeId)) note(`themeExperiences: unknown theme ${row.themeId}`);
    if (!experienceById(row.experienceId)) note(`themeExperiences: unknown experience ${row.experienceId}`);
  }

  for (const row of collectionThemes) {
    if (!collectionIds.has(row.collectionId)) note(`collectionThemes: unknown collection ${row.collectionId}`);
    if (!themeIds.has(row.themeId)) note(`collectionThemes: unknown theme ${row.themeId}`);
  }

  for (const s of narrativeSteps) {
    if (!narrativeIds.has(s.narrativeId)) {
      note(`narrativeSteps: unknown narrative ${s.narrativeId}`);
      continue;
    }
    if (!experienceById(s.experienceId)) {
      note(`narrativeSteps: unknown experience ${s.experienceId}`);
      continue;
    }
    const n = narrativeById(s.narrativeId);
    if (!experienceIdsOfTheme(n.themeId).includes(s.experienceId)) {
      note(`narrativeSteps: ${s.narrativeId} uses ${s.experienceId} outside theme ${n.themeId}`);
    }
  }

  // A narrative with no required step can never complete, so its theme can
  // never complete either.
  for (const n of narratives) {
    if (stepsOfNarrative(n.id).every(s => !s.required)) {
      note(`narratives: ${n.id} has no required step and can never complete`);
    }
  }

  // An experience with no anchor and no self-attestation route is
  // uncompletable by any registered source.
  for (const e of experiences) {
    if (!hasAnchor(e) && !e.acceptsSelfAttest) {
      note(`experiences: ${e.id} has no completion route`);
    }
  }

  // A theme with no narrative cannot be completed. That is legitimate only
  // while the theme is still being authored.
  for (const t of themes) {
    if (narrativesOfTheme(t.id).length === 0 && t.status === STATUS.PUBLISHED) {
      note(`themes: published theme ${t.id} has no narrative`);
    }
  }

  return problems;
}
