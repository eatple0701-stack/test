// RecommendationPolicy — which theme to put forward, and why.
//
// The "why" matters as much as the pick: a recommendation without a reason
// is just a card. But a reason is a claim, and this project does not make
// claims it cannot support. Every reason below is derived from something the
// app genuinely knows — the date, the clock, the traveller's own records, the
// catalogue. Nothing is inferred from data we do not have.
//
// Deliberately absent: weather. "Recommended because it is raining" reads
// well and would be fabrication — there is no weather source wired in. If one
// is added later it becomes another entry in REASONS and nothing else changes.

import { themes, experienceIdsOfTheme, experienceById } from '../catalog/index.js';
import { STATUS } from '../types.js';

/** Months a theme is at its best, where that is a real seasonal fact. */
const SEASON = {
  'spring-picnic': { months: [3, 4, 5], line: 'Blossom season is short — this is the fortnight it is worth planning around.' },
  'busan-seafood': { months: [6, 7, 8], line: 'Coastal weather is kindest now, and the market opens early.' },
  'street-food': { months: [10, 11, 12, 1, 2], line: 'Cold enough that a griddle is the warmest place in the market.' },
  'cafe-hopping': { months: [12, 1, 2], line: 'The season for staying indoors over one long coffee.' },
};

/** Themes that read differently after dark. */
const EVENING = {
  'seoul-after-dark': 'It is evening — this is the hour the theme is about.',
  'street-food': 'Market stalls are at their busiest around now.',
};

const inSeason = (themeId, month) => SEASON[themeId]?.months.includes(month);

/**
 * A one-line, honest justification for surfacing this theme now.
 *
 * @param {object} theme
 * @param {{ at: Date, visitedZones: string[], hasStarted: boolean }} context
 * @returns {string}
 */
export function reasonFor(theme, { at = new Date(), visitedZones = [], hasStarted = false } = {}) {
  const month = at.getMonth() + 1;
  const hour = at.getHours();

  if (inSeason(theme.id, month)) return SEASON[theme.id].line;

  if (hour >= 18 && EVENING[theme.id]) return EVENING[theme.id];

  // Proximity, from zones the traveller has actually been to.
  if (visitedZones.length > 0) {
    const themeZones = experienceIdsOfTheme(theme.id)
      .flatMap(id => experienceById(id)?.zones ?? []);
    const shared = themeZones.find(z => visitedZones.includes(z));
    if (shared) return `You have already eaten in ${shared.split(',')[0]} — this picks up where you were.`;
  }

  if (!hasStarted && theme.status === STATUS.PUBLISHED) {
    return 'Every stop on this one has a verified place to eat, so it is an easy first path.';
  }

  if (theme.status === STATUS.PREVIEW) {
    return 'The culture is written up in full; the places are still being verified.';
  }

  // Last resort still says something true and checkable rather than repeating
  // the tagline the card already shows.
  const venues = new Set(
    experienceIdsOfTheme(theme.id).flatMap(id => experienceById(id)?.restaurantIds ?? []),
  ).size;
  if (venues > 0) {
    return `${venues} verified ${venues === 1 ? 'place' : 'places'} to eat across this theme — you could walk it today.`;
  }
  return 'A short path you can finish in an afternoon.';
}

/**
 * Today's theme, stable for the day so it does not shuffle on every render.
 * Prefers a theme that is genuinely in season, then a published one.
 */
export function themeOfTheDay({ at = new Date(), exclude = [] } = {}) {
  const month = at.getMonth() + 1;
  // Excludes what the traveller is already on and anything they have
  // finished: recommending a completed theme is the fastest way to make a
  // suggestion feel like it is not paying attention.
  const skip = new Set(Array.isArray(exclude) ? exclude : [exclude].filter(Boolean));
  const pool = themes.filter(t => !skip.has(t.id) && t.status !== STATUS.PLANNED);
  if (pool.length === 0) return null;

  const seasonal = pool.filter(t => inSeason(t.id, month));
  if (seasonal.length > 0) {
    const day = Math.floor(at.getTime() / 86400000);
    return seasonal[day % seasonal.length];
  }

  const published = pool.filter(t => t.status === STATUS.PUBLISHED);
  const candidates = published.length > 0 ? published : pool;
  const day = Math.floor(at.getTime() / 86400000);
  return candidates[day % candidates.length];
}
