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
    restaurantIds: [],
    marketIds: ['gwangjang'],
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
    marketIds: ['namdaemun'],
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
  {
    id: 'weekend-brunch',
    kind: EXPERIENCE_KIND.DISH,
    title: 'The Weekend Brunch',
    titleKo: '주말 브런치',
    status: STATUS.PUBLISHED,
    whyItMatters:
      'Seoul treats the weekend late morning as a destination rather than a meal, and will cross the city for a bakery that sold out by noon last week.',
    culturalMeaning:
      'The Korean cafe is a social institution in its own right — a place to be seen, to work, to linger — built on baking traditions borrowed and then remade.',
    whenToExperience:
      'Saturday or Sunday before eleven, if you want the thing that sells out.',
    mission: {
      title: 'Baked This Morning',
      detail: 'Ask what came out of the oven today and order that instead of what you planned. The lineup changes daily and rarely makes the menu.',
    },
    restaurantIds: ['iryonghal', 'meat-morning'],
    marketIds: [],
    zones: ['Guwol-dong, Incheon'],
    acceptsSelfAttest: false,
  },
  {
    id: 'zero-waste-counter',
    kind: EXPERIENCE_KIND.PLACE,
    title: 'The Zero-Waste Counter',
    titleKo: '제로웨이스트',
    status: STATUS.PUBLISHED,
    whyItMatters:
      'Nothing disposable crosses the counter. Regulars bring their own containers without being asked, which makes it a habit rather than a marketing angle.',
    culturalMeaning:
      'Korea recycles most of its food waste by law, and every household separates it. These counters take the next step and refuse to create the waste at all.',
    whenToExperience:
      'Any afternoon you can carry a cup. Bring one and most shops take a little off the price.',
    mission: {
      title: 'Leave Nothing Behind',
      detail: 'Refuse one disposable item — cup, bag, straw. Ask what happens to the food scraps while you are at it.',
    },
    restaurantIds: ['nono-shop', 'ggot-epida'],
    marketIds: [],
    zones: ['Hoehyeon, Seoul', 'Bukchon, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'late-night-table',
    kind: EXPERIENCE_KIND.SETTING,
    title: 'The Late Table',
    titleKo: '심야식당',
    status: STATUS.PREVIEW,
    whyItMatters:
      'Seoul does not really close. The table you sit at near midnight has a different crowd and a slower conversation than the same table at seven.',
    culturalMeaning:
      'Late eating is tied to Korea\'s long working hours: dinner is often the second half of the workday, and the meal after it is the first honest one.',
    whenToExperience:
      'After ten, when the dinner rush has cleared and nobody is waiting for your seat.',
    mission: {
      title: 'Stay for the Second Round',
      detail: 'Korean nights move in rounds — 1차, 2차. Do not leave after the first one.',
    },
    restaurantIds: ['camouflage'],
    marketIds: [],
    zones: ['Itaewon, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'hoe-sashimi',
    kind: EXPERIENCE_KIND.DISH,
    title: 'Hoe',
    titleKo: '회',
    status: STATUS.PREVIEW,
    whyItMatters:
      'Korean raw fish is served firm rather than melting, cut thick, and eaten wrapped in leaves with ssamjang instead of dipped in soy.',
    culturalMeaning:
      'Busan built its identity on the sea, and hoe is where that shows most plainly: the fish is chosen live, and freshness is the entire argument.',
    whenToExperience:
      'On the coast, in the evening, with company — it is ordered by the plate for a table, not by the portion.',
    mission: {
      title: 'Wrap It, Do Not Dip It',
      detail: 'Take a perilla leaf, add the fish and a little ssamjang, and eat it in one bite. Dipping it in soy sauce is the foreign habit.',
    },
    restaurantIds: [],
    marketIds: [],
    zones: ['Busan'],
    acceptsSelfAttest: true,
  },
  {
    id: 'jagalchi-morning',
    kind: EXPERIENCE_KIND.PLACE,
    title: 'A Morning at Jagalchi',
    titleKo: '자갈치시장',
    status: STATUS.PREVIEW,
    whyItMatters:
      "Korea's largest seafood market, run largely by women whose trade passed mother to daughter — the jagalchi ajumma are the market's actual institution.",
    culturalMeaning:
      'Busan absorbed waves of refugees during the Korean War, and the market fed them. Its scale is a direct inheritance of that history.',
    whenToExperience:
      'Early, while the auction is still running and the day\'s catch is being argued over.',
    mission: {
      title: 'Buy Upstairs',
      detail: 'Choose your fish at a stall downstairs and take it up to be prepared. That two-step is how the market is meant to be used.',
    },
    restaurantIds: [],
    marketIds: [],
    zones: ['Busan'],
    acceptsSelfAttest: true,
  },
  {
    id: 'spring-picnic-set',
    kind: EXPERIENCE_KIND.SETTING,
    title: 'Cherry Blossom Picnic',
    titleKo: '봄 소풍',
    status: STATUS.PREVIEW,
    whyItMatters:
      'For two weeks a year the whole country eats outdoors. Parks fill with mats, convenience-store chicken and shared bottles, and nobody treats it as remarkable.',
    culturalMeaning:
      'Blossom season is Korea\'s clearest seasonal ritual — brief on purpose, and valued because it cannot be extended.',
    whenToExperience:
      'Early April, whichever week the blossom actually opens. It moves by a fortnight year to year.',
    mission: {
      title: 'Bring the Mat',
      detail: 'A picnic mat is the one non-negotiable item. Get one from any convenience store and claim a patch under the trees.',
    },
    restaurantIds: [],
    marketIds: [],
    zones: [],
    acceptsSelfAttest: true,
  },
];

const byId = new Map(experiences.map(e => [e.id, e]));

export const experienceById = (id) => byId.get(id);

/**
 * Does this experience have a real-world anchor to visit?
 *
 * The single definition of "anchored". Completion, playability and the
 * integrity gate all ask this rather than each spelling out the field
 * checks, so adding an anchor kind later is one edit here instead of three
 * that must stay in lockstep.
 */
export const hasAnchor = (e) => e.restaurantIds.length > 0 || e.marketIds.length > 0;
