// Theme catalog — the cultural territory.
//
// A Theme owns a narrative and declares which Experiences belong to its
// territory. It does not own ordering: that is a Narrative's job, because a
// territory can be crossed by more than one path.
//
// Membership is N:M on purpose. `makgeolli` belongs to both Street Food and
// Noodle Road; forcing 1:N would make authors duplicate the Experience and
// turn every later edit into a synchronisation problem.

import { STATUS } from '../types.js';

export const themes = [
  {
    id: 'temple-life',
    emoji: '\u{1FAB7}',
    title: 'Temple Life',
    tagline: 'Eat like a monk, at the pace of one.',
    narrative:
      'Korean Buddhist temples kept a cuisine alive through centuries of war and industrialisation by refusing to hurry it. Sitting at a temple table is the closest a visitor gets to the country\'s idea of restraint as a pleasure rather than a denial.',
    region: 'seoul',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'street-food',
    emoji: '\u{1F95F}',
    title: 'Street Food Adventure',
    tagline: 'The market is the restaurant.',
    narrative:
      'Before Seoul had dining rooms it had markets, and the markets never stopped being where the city actually eats. A stall is a kitchen with no walls: you watch the food being made, you eat it standing, and you talk to whoever is next to you because there is nowhere else to look.',
    region: 'seoul',
    status: STATUS.PREVIEW,
  },
  {
    id: 'noodle-road',
    emoji: '\u{1F35C}',
    title: 'The Noodle Road',
    tagline: 'A Chinese dish that became the most Korean meal there is.',
    narrative:
      'Follow one bowl from the docks of Incheon\'s Chinatown to every delivery scooter in the country. Jajangmyeon is the clearest case of Korea absorbing a foreign food so completely that its origin survives only in the name.',
    region: 'nationwide',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'cafe-hopping',
    emoji: '☕',
    title: 'Cafe Hopping',
    tagline: 'One drink buys the afternoon.',
    narrative:
      'Seoul has one of the highest cafe densities on earth, and the room is the product as much as the coffee. Nobody will rush you out after one cup, which is why the cafe became where this city works, meets and waits.',
    region: 'nationwide',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'seoul-after-dark',
    emoji: '\u{1F376}',
    title: 'Seoul After Dark',
    tagline: 'The city gets honest after ten.',
    narrative:
      'Korean nights move in rounds, and the conversation at the second one is not the conversation at the first. Late eating here is less about appetite than about the hours a working day leaves over.',
    region: 'seoul',
    status: STATUS.PREVIEW,
  },
  {
    id: 'busan-seafood',
    emoji: '\u{1F30A}',
    title: 'Busan Seafood',
    tagline: 'A port city argues about freshness for a living.',
    narrative:
      'Busan built its identity on the sea and on the people the Korean War pushed south into it. The market that fed those refugees is still the largest seafood market in the country, and its habits — choose the fish live, wrap it rather than dip it — travel with the food wherever it goes.',
    region: 'nationwide',
    status: STATUS.PREVIEW,
  },
  {
    id: 'spring-picnic',
    emoji: '\u{1F338}',
    title: 'Spring Picnic',
    tagline: 'Two weeks a year, the country eats outdoors.',
    narrative:
      'Blossom season is Korea\'s clearest seasonal ritual, and its shortness is the point. Parks fill with mats and shared bottles for a fortnight, and then it is over for a year.',
    region: 'nationwide',
    status: STATUS.PREVIEW,
  },
];

/**
 * Membership only — which Experiences fall inside this Theme's territory.
 * Order and necessity live on NarrativeStep, not here.
 */
export const themeExperiences = [
  { themeId: 'temple-life', experienceId: 'temple-cuisine' },
  { themeId: 'temple-life', experienceId: 'temple-tea' },

  { themeId: 'street-food', experienceId: 'gwangjang-market' },
  { themeId: 'street-food', experienceId: 'bindaetteok' },
  { themeId: 'street-food', experienceId: 'makgeolli' },
  { themeId: 'street-food', experienceId: 'market-alley' },

  { themeId: 'noodle-road', experienceId: 'jajangmyeon' },
  // Proves the N:M relationship: the same Experience, reached from two
  // different cultural angles.
  { themeId: 'noodle-road', experienceId: 'makgeolli' },

  { themeId: 'cafe-hopping', experienceId: 'weekend-brunch' },
  { themeId: 'cafe-hopping', experienceId: 'zero-waste-counter' },

  { themeId: 'seoul-after-dark', experienceId: 'late-night-table' },
  // Makgeolli again, from a third angle — a night drink rather than a
  // market one.
  { themeId: 'seoul-after-dark', experienceId: 'makgeolli' },

  { themeId: 'busan-seafood', experienceId: 'hoe-sashimi' },
  { themeId: 'busan-seafood', experienceId: 'jagalchi-morning' },

  { themeId: 'spring-picnic', experienceId: 'spring-picnic-set' },
];

const byId = new Map(themes.map(t => [t.id, t]));

export const themeById = (id) => byId.get(id);

export const experienceIdsOfTheme = (themeId) =>
  themeExperiences.filter(r => r.themeId === themeId).map(r => r.experienceId);

export const themeIdsOfExperience = (experienceId) =>
  themeExperiences.filter(r => r.experienceId === experienceId).map(r => r.themeId);
