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

import {
  themes, experienceIdsOfTheme, experienceById, collectionIdsOfTheme, collectionById,
} from '../catalog/index.js';
import { STATUS } from '../types.js';

/**
 * Months a theme is at its best, where that is a real seasonal fact.
 *
 * These lines are keyed off the calendar, which the app has, and they must not
 * drift into describing conditions, which it does not. "Coastal weather is
 * kindest now" and "cold enough that a griddle is the warmest place" both read
 * beautifully and both assert today's weather from a month number — the same
 * fabrication as reading out a forecast we never fetched. What is left says
 * what the season is for.
 */
const SEASON = {
  'spring-picnic': { months: [3, 4, 5], line: 'Blossom season is short — this is the fortnight it is worth planning around.' },
  'busan-seafood': { months: [6, 7, 8], line: 'Summer is the season this one is written for, and the market opens at dawn.' },
  'street-food': { months: [10, 11, 12, 1, 2], line: 'Winter is when the griddles come out — the season the stalls are built for.' },
  'cafe-hopping': { months: [12, 1, 2], line: 'The season for staying indoors over one long coffee.' },
};

/** Themes that read differently after dark. */
const EVENING = {
  'seoul-after-dark': 'It is evening — this is the hour the theme is about.',
  // Not "busiest now": how full a market is at this moment is not something
  // the app can see. When the stalls are open is a fact about the theme.
  'street-food': 'The stalls are open — most of this one does not exist before dark.',
};

const inSeason = (themeId, month) => SEASON[themeId]?.months.includes(month);

/** The collection, if any, that holds both of these themes. */
const sharedCollection = (a, b) => {
  const held = new Set(collectionIdsOfTheme(b));
  const id = collectionIdsOfTheme(a).find(c => held.has(c));
  return id ? collectionById(id) : null;
};

/**
 * A one-line, honest justification for surfacing this theme now.
 *
 * @param {object} theme
 * @param {{
 *   at: Date,
 *   visitedZones: string[],
 *   hasStarted: boolean,        is any theme underway
 *   justFinished: object|null,  a theme completed during this session
 *   untouched: boolean,         has nothing in THIS theme been done
 *   hasAnyProgress: boolean,    has the traveller done anything at all
 * }} context
 * @returns {string}
 */
export function reasonFor(theme, {
  at = new Date(), visitedZones = [], hasStarted = false,
  justFinished = null, untouched = false, hasAnyProgress = false,
} = {}) {
  const month = at.getMonth() + 1;
  const hour = at.getHours();

  // What just happened outranks everything else. A traveller who has this
  // second finished a culture is asking "so what now" — answering with the
  // season would be answering a question they did not ask.
  if (justFinished && justFinished.id !== theme.id) {
    const collection = sharedCollection(theme.id, justFinished.id);
    // "It follows on" is only said where the catalogue actually places the two
    // together. Otherwise it is a change of direction, and says so.
    return collection
      ? `You have just finished ${justFinished.title}. This carries on through ${collection.title}.`
      : `You have just finished ${justFinished.title} — this goes somewhere different.`;
  }

  if (inSeason(theme.id, month)) return SEASON[theme.id].line;

  if (hour >= 18 && EVENING[theme.id]) return EVENING[theme.id];

  // Proximity, from zones the traveller has actually been to.
  if (visitedZones.length > 0) {
    const themeZones = experienceIdsOfTheme(theme.id)
      .flatMap(id => experienceById(id)?.zones ?? []);
    const shared = themeZones.find(z => visitedZones.includes(z));
    if (shared) return `You have already eaten in ${shared.split(',')[0]} — this picks up where you were.`;
  }

  // Untouched, but only worth saying to someone who has touched something —
  // to a traveller on their first day every theme is unvisited, and pointing
  // it out says nothing.
  if (untouched && hasAnyProgress) {
    return 'You have not opened this one yet.';
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
