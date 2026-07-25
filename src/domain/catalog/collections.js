// Collection catalog — the editorial lens.
//
// A Collection groups Themes under an angle. It is not a path (that is a
// Narrative) and it carries no completion of its own: progression stays on
// a single axis, the Theme, so two progress figures can never disagree.
//
// `editorialAngle` is what separates curation from foldering. The same Theme
// is framed differently per Collection — Temple Life is about stillness
// inside a first-timer collection and about foliage inside an autumn one.

import { STATUS } from '../types.js';

export const collections = [
  {
    id: 'first-timers-seoul',
    title: 'Seoul for First-Timers',
    tagline: 'Three days, three cultures, no wrong answers.',
    status: STATUS.PUBLISHED,
    activeWindow: null,
  },
  {
    id: 'autumn-in-seoul',
    title: 'Autumn in Seoul',
    tagline: 'The short weeks when the city eats outdoors.',
    status: STATUS.PREVIEW,
    activeWindow: { fromMonth: 9, toMonth: 11 },
  },
];

export const collectionThemes = [
  {
    collectionId: 'first-timers-seoul',
    themeId: 'temple-life',
    order: 1,
    editorialAngle: 'Start slow. Nothing else in Seoul will ask this little of you.',
  },
  {
    collectionId: 'first-timers-seoul',
    themeId: 'noodle-road',
    order: 2,
    editorialAngle: 'The one dish everyone here grew up on. Cheap, fast, and a whole history.',
  },

  {
    collectionId: 'autumn-in-seoul',
    themeId: 'street-food',
    order: 1,
    editorialAngle: 'Cold enough for a griddle to be the warmest place in the market.',
  },
  {
    // Same Theme as the first collection, deliberately framed differently.
    collectionId: 'autumn-in-seoul',
    themeId: 'temple-life',
    order: 2,
    editorialAngle: 'Mountain temples hold the last of the colour after the city has lost it.',
  },
];

const byId = new Map(collections.map(c => [c.id, c]));

export const collectionById = (id) => byId.get(id);

export const themeRefsOfCollection = (collectionId) =>
  collectionThemes
    .filter(r => r.collectionId === collectionId)
    .sort((a, b) => a.order - b.order)
    .map(({ themeId, order, editorialAngle }) => ({ themeId, order, editorialAngle }));

export const collectionIdsOfTheme = (themeId) =>
  collectionThemes.filter(r => r.themeId === themeId).map(r => r.collectionId);
