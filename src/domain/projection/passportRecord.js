// PassportRecord — the traveller's trip, counted by the domain engine.
//
// This is the migration target for computeJourney. The counts and the six
// challenges are carried over unchanged, deliberately: the point of this
// projection is that the app stops running two engines, not that the rules
// change on the way across. Same ids, same titles, same targets.
//
// What does change is the input. computeJourney was handed a list of visited
// restaurant records and could only ever see places. This reads the domain
// Journey, so an experience completed by attestation — the only route open to
// a theme with no verified venue — reaches the Passport too. Completing Busan
// Seafood and then seeing a Passport that says nothing happened was the app
// contradicting itself.

import { experiences } from '../catalog/index.js';
import { experienceDone } from '../policy/completion.js';
import { restaurants } from '../../data/restaurants.js';

const byId = new Map(restaurants.map(r => [r.id, r]));

/**
 * The six challenges, unchanged from the legacy engine. Each measures against
 * the counts below rather than owning its own traversal, so adding a count is
 * the only thing needed to add a challenge.
 */
export const CHALLENGES = [
  {
    id: 'three-kitchens',
    emoji: '🍽',
    title: 'Taste three kinds of Korean kitchen',
    hint: 'Temple, halal, plant-based, zero-waste — they count as different.',
    target: 3,
    measure: r => r.cuisineCount,
  },
  {
    id: 'market',
    emoji: '🏮',
    title: 'Visit a traditional market',
    hint: 'Where Korean food actually comes from.',
    target: 1,
    measure: r => r.marketCount,
  },
  {
    id: 'fermented',
    emoji: '🫙',
    title: 'Eat something fermented',
    hint: 'Kimchi, doenjang, makgeolli — the backbone of Korean flavor.',
    target: 1,
    measure: r => r.fermentedCount,
  },
  {
    id: 'districts',
    emoji: '🗺️',
    title: 'Explore three districts',
    hint: 'Each neighborhood eats differently.',
    target: 3,
    measure: r => r.districtCount,
  },
  {
    id: 'beyond-seoul',
    emoji: '⚓',
    title: 'Eat beyond Seoul',
    hint: "Incheon's port has fed Korea's food history for a century.",
    target: 1,
    measure: r => r.beyondSeoulCount,
  },
  {
    id: 'share-a-meal',
    emoji: '🤝',
    title: 'Share a meal with someone',
    hint: 'The whole point — food is how the conversation starts.',
    target: 1,
    measure: r => r.companionCount,
  },
];

/**
 * @param {object} journey the canonical domain Journey (four Sets)
 */
export function passportRecord(journey) {
  const visitedPlaces = [...journey.visitedRestaurantIds]
    .map(id => byId.get(id))
    .filter(Boolean);

  const doneExperiences = experiences.filter(e => experienceDone(e, journey));

  // Districts come from both sides of the model, but only where the evidence
  // actually places the traveller.
  //
  // A visited restaurant pins an exact zone. An experience's `zones` list
  // says where it CAN be had, not where it WAS — so crediting all of them
  // would claim a traveller who ate at one temple in Jongno had also been to
  // Insadong and Seochon. Only venue-less experiences contribute their zones,
  // because there attestation is the sole record and no place can sharpen it.
  const districts = new Set([
    ...visitedPlaces.map(p => p.zone),
    ...doneExperiences
      .filter(e => e.restaurantIds.length === 0 && e.marketIds.length === 0)
      .flatMap(e => e.zones),
  ]);

  const cuisines = new Set(visitedPlaces.map(p => p.category));

  const record = {
    foodCount: visitedPlaces.length,
    experienceCount: doneExperiences.length,
    districtCount: districts.size,
    cuisineCount: cuisines.size,
    marketCount: journey.visitedMarketIds.size,
    companionCount: journey.companionIds.size,
    fermentedCount: visitedPlaces.filter(p => p.traits?.includes('Fermented')).length,
    // Anything outside Seoul counts. The legacy engine tested for Incheon
    // because Incheon was the only non-Seoul region in the dataset; the rule
    // it was expressing is "you left the capital".
    beyondSeoulCount:
      visitedPlaces.filter(p => !p.zone.includes('Seoul')).length +
      doneExperiences.filter(e => e.zones.some(z => !z.includes('Seoul'))).length,
    districts: [...districts],
  };

  const challenges = CHALLENGES.map(c => {
    const current = Math.min(c.measure(record), c.target);
    return { ...c, current, done: current >= c.target, remaining: c.target - current };
  });

  return {
    ...record,
    challenges,
    doneCount: challenges.filter(c => c.done).length,
    // Closest to completion, so the suggestion stays reachable rather than
    // always pointing at the hardest one.
    nextGoal: challenges.filter(c => !c.done).sort((a, b) => a.remaining - b.remaining)[0] ?? null,
  };
}
