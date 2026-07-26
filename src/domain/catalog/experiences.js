// Experience catalog — the atom of progression.
//
// An Experience is a unit of culture, not a unit of venue. `bindaetteok` is a
// complete Experience with no restaurant attached: it has an origin, a place
// it is found, phrases to order it and a mission. Restaurants attach where
// they exist and are anchors, not prerequisites.
//
// This is a representative seed, not the full catalogue. It deliberately
// covers every structural case the model must support so the policies and
// projections built on top are exercised against real shapes.

import { STATUS, EXPERIENCE_KIND } from '../types.js';

export const experiences = [
  {
    id: 'temple-cuisine',
    kind: EXPERIENCE_KIND.DISH,
    title: 'Temple Cuisine',
    titleKo: '사찰음식',
    status: STATUS.PUBLISHED,
    whyItMatters:
      "A cuisine built entirely without garlic, onion or haste — the only Korean table where what is left out matters more than what is put in.",
    culturalMeaning:
      "Temple food expresses a Buddhist philosophy of eating with awareness: nothing wasted, nothing indulgent, everything intentional.",
    whenToExperience:
      "During a templestay, on a Buddhist holiday, or whenever the city has worn you down and you want a quiet reset.",
    mission: {
      title: 'The Empty Bowl',
      detail: 'Finish every grain of rice, the way 발우공양 intends. Leaving nothing behind is the practice, not merely good manners.',
    },
    restaurantIds: ['balwoo', 'sanchon', 'maji'],
    marketIds: [],
    zones: ['Jongno, Seoul', 'Insadong, Seoul', 'Seochon, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'temple-tea',
    kind: EXPERIENCE_KIND.RITUAL,
    title: 'Tea After the Meal',
    titleKo: '차 한 잔',
    status: STATUS.PREVIEW,
    whyItMatters:
      "The meal does not end when the bowl empties. The pot that follows is where the conversation actually happens.",
    culturalMeaning:
      "Korean tea culture treats the pour as part of the hospitality, not an afterthought — the host keeps your cup filled without being asked.",
    whenToExperience:
      "Straight after a temple meal, while the quiet still holds.",
    mission: {
      title: 'Let Them Pour',
      detail: "Do not refill your own cup. Let your host do it, and return the favour — that exchange is the whole ritual.",
    },
    restaurantIds: [],
    marketIds: [],
    zones: ['Insadong, Seoul'],
    acceptsSelfAttest: true,
  },
  {
    id: 'gwangjang-market',
    kind: EXPERIENCE_KIND.PLACE,
    title: 'Gwangjang Market',
    titleKo: '광장시장',
    status: STATUS.PUBLISHED,
    whyItMatters:
      "One of Korea's oldest markets, feeding Seoul for over a century from stalls barely wider than their griddles.",
    culturalMeaning:
      "The market is where Korean food is still transacted face to face — you order by pointing, and you eat at the counter beside whoever came before you.",
    whenToExperience:
      "Late afternoon, when the dinner crowd arrives and every griddle is running at once.",
    mission: {
      title: 'Sit at the Counter',
      detail: 'Skip the tables. Take a stool at a stall and eat shoulder to shoulder with the regulars.',
    },
    restaurantIds: [],
    marketIds: ['gwangjang'],
    zones: ['Jongno, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'bindaetteok',
    kind: EXPERIENCE_KIND.DISH,
    title: 'Bindaetteok',
    titleKo: '빈대떡',
    status: STATUS.PREVIEW,
    whyItMatters:
      "A mung bean pancake ground on a stone mill in front of you and fried in enough oil to hear it from across the aisle.",
    culturalMeaning:
      "Once a food of scarcity made from what was left after the beans were pressed, now the dish people queue for. Korean cooking does that often.",
    whenToExperience:
      "On a cold day, with makgeolli, standing up.",
    mission: {
      title: 'Order It Hot',
      detail: 'Ask for one straight off the griddle rather than from the stack. Say 방금 나온 거 주세요.',
    },
    restaurantIds: ['balwoo'],
    marketIds: [],
    zones: ['Jongno, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'makgeolli',
    kind: EXPERIENCE_KIND.DISH,
    title: 'Makgeolli',
    titleKo: '막걸리',
    status: STATUS.PREVIEW,
    whyItMatters:
      "Korea's oldest alcohol, cloudy and barely sweet, drunk from a bowl rather than a glass.",
    culturalMeaning:
      "Makgeolli is a farmer's drink that survived into the cities. Pouring for others before yourself is the etiquette that carries the culture.",
    whenToExperience:
      "With fried food, on a rainy evening — the pairing is close to a national reflex.",
    mission: {
      title: 'Pour for Someone Else First',
      detail: "Never fill your own bowl first. Fill your companion's, and let them fill yours.",
    },
    restaurantIds: [],
    marketIds: [],
    zones: ['Jongno, Seoul'],
    acceptsSelfAttest: true,
  },
  {
    id: 'market-alley',
    kind: EXPERIENCE_KIND.SETTING,
    title: 'The Market Alley',
    titleKo: '시장 골목',
    status: STATUS.PREVIEW,
    whyItMatters:
      "Not a dish but a place to stand: the narrow run between stalls where the whole market happens at once.",
    culturalMeaning:
      "Korean markets are organised by trade, so an alley is a category — walk one and you have seen an entire supply chain.",
    whenToExperience:
      "Any time the market is open. Walk it once end to end before ordering anything.",
    mission: {
      title: 'Walk It First',
      detail: 'Walk the full alley before you buy. Deciding after seeing everything is how locals shop.',
    },
    restaurantIds: [],
    marketIds: ['gwangjang', 'namdaemun'],
    zones: ['Jongno, Seoul', 'Hoehyeon, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'jajangmyeon',
    kind: EXPERIENCE_KIND.DISH,
    title: 'Jajangmyeon',
    titleKo: '짜장면',
    status: STATUS.PUBLISHED,
    whyItMatters:
      "Invented in Incheon's Chinatown by Chinese dockworkers far from home, and now the most Korean thing on any menu.",
    culturalMeaning:
      "The dish carries the memory of Korea's Chinese immigrant community — fully naturalised while keeping its foreign name.",
    whenToExperience:
      "Moving day, the day report cards come out, or any weeknight nobody wants to cook.",
    mission: {
      title: 'Order Like a Local',
      detail: "Get one jjajangmyeon and one jjamppong for the table and swap halfway — the standard Korean answer to an unwinnable choice.",
    },
    restaurantIds: ['osegyehyang', 'gonghwachun'],
    marketIds: [],
    zones: ['Insadong, Seoul', 'Chinatown, Jemulpo-gu, Incheon'],
    acceptsSelfAttest: false,
  },
];

const byId = new Map(experiences.map(e => [e.id, e]));

export const experienceById = (id) => byId.get(id);
