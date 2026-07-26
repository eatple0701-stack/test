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
    id: 'cafe-slow-morning',
    themeId: 'cafe-hopping',
    title: 'A Slow Morning',
    intro:
      'Go before eleven and bring nothing you need to finish. The whole point is that the seat is yours for as long as you want it.',
    outro:
      'You spent a morning the way this city spends its weekends. Nobody once asked whether you were done.',
    pacing: 'half-day',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'after-dark-first-round',
    themeId: 'seoul-after-dark',
    title: 'First Round, Second Round',
    intro:
      'Start late and do not plan the end. A Korean night is measured in rounds, and the second one is where the conversation changes.',
    outro:
      'The table after ten is not the table at seven. You have now sat at both.',
    pacing: 'evening',
    status: STATUS.PREVIEW,
  },
  {
    id: 'busan-market-day',
    themeId: 'busan-seafood',
    title: 'Market First, Table After',
    intro:
      'A coastal day in the order Busan does it: see the fish argued over before you eat any of it.',
    outro:
      'Freshness stopped being a menu adjective and became something you watched happen.',
    pacing: 'full-day',
    status: STATUS.PREVIEW,
  },
  {
    id: 'blossom-afternoon',
    themeId: 'spring-picnic',
    title: 'An Afternoon Under the Trees',
    intro:
      'Two weeks a year this is the best thing to do in Korea, and it costs almost nothing.',
    outro:
      'It will be over within a fortnight. That is why everyone went.',
    pacing: 'half-day',
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
  {
    id: 'street-quick-bite',
    themeId: 'street-food',
    title: 'Thirty Minutes at the Market',
    intro:
      'The short version. One stall, one thing, eaten standing up, and back out — this is how the market is used on an ordinary weekday.',
    outro:
      'You did not see the whole market, and that is the point. It is a place to drop into, not an itinerary.',
    pacing: 'evening',
    status: STATUS.PREVIEW,
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
    narrativeId: 'street-first-timer',
    experienceId: 'market-alley',
    order: 4,
    required: false,
    transition:
      'Before you leave, walk the alley end to end. Seeing the whole trade in one line is the part people remember.',
  },

  {
    narrativeId: 'street-quick-bite',
    experienceId: 'gwangjang-market',
    order: 1,
    required: true,
    transition:
      'Go straight in and order at the first stall that looks busy. Busy means the turnover is fast and the food is fresh.',
  },

  {
    narrativeId: 'cafe-slow-morning',
    experienceId: 'weekend-brunch',
    order: 1,
    required: true,
    transition:
      'Start with whatever came out of the oven this morning. Ask rather than read — the best item is rarely on the board.',
  },
  {
    narrativeId: 'cafe-slow-morning',
    experienceId: 'zero-waste-counter',
    order: 2,
    required: false,
    transition:
      'If you are still carrying a cup, spend the second half of the morning somewhere that rewards it.',
  },

  {
    narrativeId: 'after-dark-first-round',
    experienceId: 'late-night-table',
    order: 1,
    required: true,
    transition:
      'Arrive after the dinner rush has cleared. The room you want is the quieter one that follows it.',
  },
  {
    narrativeId: 'after-dark-first-round',
    experienceId: 'makgeolli',
    order: 2,
    required: false,
    transition:
      'Second round. Order a bowl for the table and pour for someone else before yourself.',
  },

  {
    narrativeId: 'busan-market-day',
    experienceId: 'jagalchi-morning',
    order: 1,
    required: true,
    transition:
      'Go early, while the auction is still running. The market is a working floor before it is anything else.',
  },
  {
    narrativeId: 'busan-market-day',
    experienceId: 'hoe-sashimi',
    order: 2,
    required: false,
    transition:
      'Take what you chose upstairs to be prepared. That two-step is the whole ritual.',
  },

  {
    narrativeId: 'blossom-afternoon',
    experienceId: 'spring-picnic-set',
    order: 1,
    required: true,
    transition:
      'Claim a patch under the trees before noon. After that you are choosing between the leftovers.',
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
