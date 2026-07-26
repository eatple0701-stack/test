// The journey layer: what turns a list of restaurants into a trip.
//
// Everything here is computed from state the app actually holds — visited
// bookmarks, matched companions, checked-off markets. Nothing invents a
// number. A challenge is "complete" only because the user's own records say
// so, which is what makes the Passport worth anything.

// Extensions are explicit so this module can be imported under plain Node,
// matching the convention restaurants.js sets for the same reason. Vite
// resolves extensionless specifiers; Node's native ESM loader does not.
import { restaurants } from './restaurants.js';
import { traditionalMarkets } from './experiences.js';

// Story-first entry points. A traveler picks "what Korean culture do I want
// to experience today?" before "what do I eat?" — each theme resolves to
// real records already in the dataset, never to a wish list.
export const CULTURAL_THEMES = [
  {
    id: 'temple-table',
    emoji: '🪷',
    title: 'Eat like a monk',
    blurb: 'Temple cuisine — no garlic, no onion, no hurry.',
    categories: ['temple'],
  },
  {
    id: 'noodle-road',
    emoji: '🍜',
    title: 'Follow the noodle road',
    blurb: "Jajangmyeon's journey from Incheon's docks to every Korean kitchen.",
    categories: ['korean-chinese'],
  },
  {
    id: 'open-table',
    emoji: '🌙',
    title: 'Seoul’s open table',
    blurb: 'Halal kitchens that made room for everyone at a Korean meal.',
    categories: ['halal-korean', 'world-halal'],
  },
  {
    id: 'nothing-wasted',
    emoji: '♻️',
    title: 'Nothing wasted',
    blurb: 'Zero-waste counters and plant-forward kitchens.',
    categories: ['zero-waste', 'vegan-dining'],
  },
  {
    id: 'seasons-turn',
    emoji: '🌾',
    title: 'The season’s turn',
    blurb: '제철 — menus that change before the printed version catches up.',
    categories: ['local-seasonal', 'brunch-bakery'],
  },
];

export function placesForTheme(theme) {
  return restaurants.filter(r => theme.categories.includes(r.category));
}

// "Continue Your Journey" — where a meal leads next. Steps point at real
// records where one exists (`placeCategory`, `marketId`); where the next
// step is an experience the dataset does not cover, it is phrased as a
// suggestion with the zone attached, never as a venue we vouch for.
const ROUTE_BY_CATEGORY = {
  temple: [
    { label: 'Tea house in Insadong', note: 'Sit with a pot of jujube tea after the meal.', zone: 'Insadong, Seoul' },
    { label: 'Insadong Ssamziegil', note: 'A spiral of craft shops above the main street.', marketId: 'insadong-ssamzie' },
    { label: 'Another temple table', note: 'Compare two kitchens working from the same doctrine.', placeCategory: 'temple' },
  ],
  'korean-chinese': [
    { label: 'Sinpo International Market', note: "Where Incheon's street food grew up beside Chinatown.", marketId: 'sinpo' },
    { label: 'Jajangmyeon Museum', note: "Next door to Gonghwachun — the dish's own birthplace.", zone: 'Chinatown, Jemulpo-gu, Incheon' },
    { label: 'A plant-based version', note: 'The same comfort classics, rebuilt without meat.', placeCategory: 'vegan-dining' },
  ],
  'halal-korean': [
    { label: 'Seoul Central Mosque', note: 'The hillside the whole neighborhood grew around.', zone: 'Itaewon, Seoul' },
    { label: 'Namdaemun Market', note: 'Street food alleys and the old south gate.', marketId: 'namdaemun' },
    { label: 'World halal in Incheon', note: 'Follow the same thread to a port-city kitchen.', placeCategory: 'world-halal' },
  ],
  'world-halal': [
    { label: 'Sinpo International Market', note: "Incheon's oldest market, minutes from Chinatown.", marketId: 'sinpo' },
    { label: 'Halal Korean in Seoul', note: 'See how Korean home cooking adapts to the same rules.', placeCategory: 'halal-korean' },
    { label: 'Songdo waterfront', note: 'A built-from-nothing skyline worth an evening walk.', zone: 'Songdo, Incheon' },
  ],
  'vegan-dining': [
    { label: 'A zero-waste counter', note: 'Take the idea one step further — nothing disposable.', placeCategory: 'zero-waste' },
    { label: 'Gwangjang Market', note: 'Watch bindaetteok batter hit the pan.', marketId: 'gwangjang' },
    { label: 'Temple cuisine', note: 'The centuries-old root of Korean plant-based cooking.', placeCategory: 'temple' },
  ],
  'zero-waste': [
    { label: 'Namdaemun Market', note: 'Bring your own bag and shop the old way.', marketId: 'namdaemun' },
    { label: 'Bukchon hanok alleys', note: 'Tiled roofs and quiet lanes on foot.', zone: 'Bukchon, Seoul' },
    { label: 'A plant-based kitchen', note: 'Same instinct, applied to the plate.', placeCategory: 'vegan-dining' },
  ],
  'brunch-bakery': [
    { label: 'A seasonal kitchen', note: 'Ask what the season turned up this week.', placeCategory: 'local-seasonal' },
    { label: 'Gwangjang Market', note: 'Trade the quiet cafe for a loud market counter.', marketId: 'gwangjang' },
    { label: 'Han River walk', note: 'The city\'s default afternoon, and it costs nothing.', zone: 'Seoul' },
  ],
  'local-seasonal': [
    { label: 'Gwangjang Market', note: 'See the same seasonal produce at its source.', marketId: 'gwangjang' },
    { label: 'A temple table', note: 'Seasonality taken to its most disciplined form.', placeCategory: 'temple' },
    { label: 'Weekend brunch', note: 'Slow baking, seasonal vegetables, no rush.', placeCategory: 'brunch-bakery' },
  ],
};

/**
 * Resolve the route for a place into concrete steps. A step that names a
 * category resolves to a real restaurant (never the one you're already on);
 * a step that names a market resolves to the market record. Steps that
 * resolve to nothing are dropped rather than rendered as dead ends.
 */
export function routeFor(place) {
  const steps = ROUTE_BY_CATEGORY[place.category] ?? ROUTE_BY_CATEGORY['local-seasonal'];
  return steps
    .map(step => {
      if (step.placeCategory) {
        const target = restaurants.find(
          r => r.category === step.placeCategory && r.id !== place.id && !r.lifecycle,
        );
        return target ? { ...step, place: target } : null;
      }
      if (step.marketId) {
        const market = traditionalMarkets.find(m => m.id === step.marketId);
        return market ? { ...step, market } : null;
      }
      return step;
    })
    .filter(Boolean);
}

// Short, practical guidance a local would actually give — kept at category
// level, like the rest of the culture content, because we have not sat in
// any individual dining room to say more than that.
export const LOCAL_TIPS = {
  temple: [
    { tag: 'Book ahead', detail: 'Dinner seatings are small and often reserved days out.' },
    { tag: 'Go at lunch', detail: 'The midday course costs noticeably less than dinner.' },
    { tag: 'Leave time', detail: 'A full course runs 90 minutes. It is not a quick stop.' },
  ],
  'korean-chinese': [
    { tag: 'Avoid 12–1pm', detail: 'Office lunch rush fills every table at once.' },
    { tag: 'Order tangsuyuk to share', detail: 'Locals rarely order noodles alone for two.' },
    { tag: 'Eat it fast', detail: 'The noodles swell within minutes. That is the whole trick.' },
  ],
  'vegan-dining': [
    { tag: 'Weekday lunch is calm', detail: 'Weekends fill up with the plant-based crowd.' },
    { tag: 'Ask about the sauce', detail: 'Anchovy stock hides in places you would not expect.' },
    { tag: 'Refills are free', detail: 'Banchan comes back if you ask. Asking is a compliment.' },
  ],
  'halal-korean': [
    { tag: 'Friday afternoons are busy', detail: 'Prayer at the Central Mosque empties into the street.' },
    { tag: 'Start with bulgogi', detail: 'The gentlest way into Korean flavor — savory, not spicy.' },
    { tag: 'Cash still helps', detail: 'Smaller family kitchens sometimes prefer it.' },
  ],
  'world-halal': [
    { tag: 'Order for the table', detail: 'Portions are built for sharing, Korean style.' },
    { tag: 'Ask for the pickles', detail: 'Korean-style banchan beside a curry is a local habit.' },
    { tag: 'Evenings are livelier', detail: 'The international crowd arrives after work.' },
  ],
  'zero-waste': [
    { tag: 'Bring a tumbler', detail: 'Most shops take a little off the price for it.' },
    { tag: 'Come before closing', detail: 'Baked goods are made in small batches and run out.' },
    { tag: 'Trust the vegetable', detail: 'Root-to-leaf means unfamiliar parts land on the plate.' },
  ],
  'brunch-bakery': [
    { tag: 'Before 11am on weekends', detail: 'The best items sell out before noon.' },
    { tag: 'One drink buys the seat', detail: 'Nobody will rush you out of a Korean cafe.' },
    { tag: 'Ask what was baked today', detail: 'The lineup changes daily and is not always listed.' },
  ],
  'local-seasonal': [
    { tag: 'Ask, don’t read', detail: 'The best dish is often not on the printed menu.' },
    { tag: 'Lunch sets are better value', detail: 'Same kitchen, smaller bill.' },
    { tag: 'Try it with makgeolli', detail: 'Rice wine is the traditional partner for seasonal food.' },
  ],
};

export const tipsFor = (place) => place.localTips ?? LOCAL_TIPS[place.category] ?? LOCAL_TIPS['local-seasonal'];

/**
 * Challenges are defined by a predicate over journey state, so a challenge
 * completes the moment the underlying records support it — there is no
 * separate "completed" flag to drift out of sync with reality.
 */
export const CHALLENGES = [
  {
    id: 'three-kitchens',
    emoji: '🍽',
    title: 'Taste three kinds of Korean kitchen',
    hint: 'Temple, halal, plant-based, zero-waste — they count as different.',
    target: 3,
    measure: j => j.cuisineCount,
  },
  {
    id: 'market',
    emoji: '🏮',
    title: 'Visit a traditional market',
    hint: 'Where Korean food actually comes from.',
    target: 1,
    measure: j => j.marketCount,
  },
  {
    id: 'fermented',
    emoji: '🫙',
    title: 'Eat something fermented',
    hint: 'Kimchi, doenjang, makgeolli — the backbone of Korean flavor.',
    target: 1,
    measure: j => j.fermentedCount,
  },
  {
    id: 'districts',
    emoji: '🗺️',
    title: 'Explore three districts',
    hint: 'Each neighborhood eats differently.',
    target: 3,
    measure: j => j.districtCount,
  },
  {
    id: 'beyond-seoul',
    emoji: '⚓',
    title: 'Eat beyond Seoul',
    hint: "Incheon's port has fed Korea's food history for a century.",
    target: 1,
    measure: j => j.incheonCount,
  },
  {
    id: 'share-a-meal',
    emoji: '🤝',
    title: 'Share a meal with someone',
    hint: 'The whole point — food is how the conversation starts.',
    target: 1,
    measure: j => j.companionCount,
  },
];

/**
 * The single source of truth for "how far along is this trip".
 *
 * @param {{visitedPlaces: object[], markets: string[], companions: object[]}} state
 */
export function computeJourney({ visitedPlaces = [], markets = [], companions = [] }) {
  const districts = new Set(visitedPlaces.map(p => p.zone));
  const cuisines = new Set(visitedPlaces.map(p => p.category));
  const base = {
    foodCount: visitedPlaces.length,
    districtCount: districts.size,
    cuisineCount: cuisines.size,
    marketCount: markets.length,
    companionCount: companions.length,
    fermentedCount: visitedPlaces.filter(p => p.traits?.includes('Fermented')).length,
    incheonCount: visitedPlaces.filter(p => p.zone.includes('Incheon')).length,
    districts: Array.from(districts),
  };

  const challenges = CHALLENGES.map(c => {
    const current = Math.min(c.measure(base), c.target);
    return { ...c, current, done: current >= c.target, remaining: c.target - current };
  });

  return {
    ...base,
    challenges,
    doneCount: challenges.filter(c => c.done).length,
    // The next goal is the challenge closest to completion — it keeps the
    // suggestion reachable instead of always pointing at the hardest one.
    nextGoal: challenges.filter(c => !c.done).sort((a, b) => a.remaining - b.remaining)[0] ?? null,
  };
}
