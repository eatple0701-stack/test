// Narrative catalog — a path through a Theme's territory.
//
// Narrative is what makes a Theme executable. Ordering, necessity and the
// connective prose between steps all live here rather than on the Theme,
// because one territory can be crossed several ways: a half-day version, a
// rainy-evening version, a vegetarian version.
//
// `required` sits on the step rather than on Theme membership: being
// essential is a property of the path, not of the culture.

import { STATUS } from '../types.js';

export const narratives = [
  {
    id: 'temple-half-day',
    themeId: 'temple-life',
    title: 'A Half Day at the Temple Table',
    intro:
      'Give this half a day and no appointments afterwards. The point of a temple meal is that it cannot be rushed, and a schedule waiting on the other side will spoil it.',
    outro:
      'You have eaten the way a tradition intends rather than the way a menu suggests. Whatever you do next, do it slowly.',
    pacing: 'half-day',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'street-first-timer',
    themeId: 'street-food',
    title: "First Timer's Market Crawl",
    intro:
      'Arrive hungry and with cash. This is a standing, pointing, shoulder-to-shoulder kind of meal, and it works best if you do not plan the order in advance.',
    outro:
      'You have eaten the way the city has eaten for a century. The stall you liked will be there next week.',
    pacing: 'evening',
    status: STATUS.PREVIEW,
  },
  {
    id: 'noodle-origin',
    themeId: 'noodle-road',
    title: 'Where the Bowl Came From',
    intro:
      'One dish, traced back to the port that invented it. Short, and better done at lunch.',
    outro:
      'A Chinese dish, invented in Korea, eaten by everyone. That is the whole story of the noodle road.',
    pacing: 'half-day',
    status: STATUS.PUBLISHED,
  },
];

export const narrativeSteps = [
  {
    narrativeId: 'temple-half-day',
    experienceId: 'temple-cuisine',
    order: 1,
    required: true,
    transition:
      'Start at the table. Everything else in this path is a way of extending the quiet it leaves behind.',
  },
  {
    narrativeId: 'temple-half-day',
    experienceId: 'temple-tea',
    order: 2,
    required: false,
    transition:
      'When the bowl is empty, do not leave. The pot that follows is where the conversation starts.',
  },

  {
    narrativeId: 'street-first-timer',
    experienceId: 'gwangjang-market',
    order: 1,
    required: true,
    transition:
      'Get inside the market first. Nothing else here makes sense until you have seen the scale of it.',
  },
  {
    narrativeId: 'street-first-timer',
    experienceId: 'bindaetteok',
    order: 2,
    required: true,
    transition:
      'Follow the loudest griddle. The pancake being poured in front of you is the one to order.',
  },
  {
    narrativeId: 'street-first-timer',
    experienceId: 'makgeolli',
    order: 3,
    required: false,
    transition:
      'Fried food asks for makgeolli. Order a bowl for the table rather than a glass for yourself.',
  },

  {
    narrativeId: 'noodle-origin',
    experienceId: 'jajangmyeon',
    order: 1,
    required: true,
    transition:
      'Begin with the bowl itself. The history reads differently once you have tasted what it produced.',
  },
];

const byId = new Map(narratives.map(n => [n.id, n]));

export const narrativeById = (id) => byId.get(id);

export const narrativesOfTheme = (themeId) => narratives.filter(n => n.themeId === themeId);

export const stepsOfNarrative = (narrativeId) =>
  narrativeSteps.filter(s => s.narrativeId === narrativeId).sort((a, b) => a.order - b.order);
