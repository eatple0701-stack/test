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
];

const byId = new Map(themes.map(t => [t.id, t]));

export const themeById = (id) => byId.get(id);

export const experienceIdsOfTheme = (themeId) =>
  themeExperiences.filter(r => r.themeId === themeId).map(r => r.experienceId);

export const themeIdsOfExperience = (experienceId) =>
  themeExperiences.filter(r => r.experienceId === experienceId).map(r => r.themeId);
