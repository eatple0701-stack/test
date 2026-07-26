// Domain vocabulary — the value objects every other domain module shares.
//
// This module imports nothing, and is the base of a one-way dependency
// chain: projection/ composes policy/, capability/ and catalog/; policy/ may
// import capability/, catalog/, types.js and other policies; catalog/,
// capability/ and types.js never import from policy/ or projection/.

/** Editorial readiness of a content entity. Distinct from playability. */
export const STATUS = {
  PLANNED: 'planned',
  PREVIEW: 'preview',
  PUBLISHED: 'published',
  RETIRED: 'retired',
};

/**
 * A rendering hint only. Users are never shown this distinction — every
 * record reads as one uniform concept, an Experience.
 */
export const EXPERIENCE_KIND = {
  DISH: 'dish',
  PLACE: 'place',
  RITUAL: 'ritual',
  SETTING: 'setting',
};

/** Ids of the seeded completion strategies. The registry lives in policy/. */
export const COMPLETION_SOURCE = {
  PLACE_VISIT: 'place-visit',
  EVENT_ATTENDANCE: 'event-attendance',
  SELF_ATTEST: 'self-attest',
};

/** Why a narrative cannot be run right now. */
export const BLOCKER = {
  MISSING_VENUE: 'missing-venue',
  OUT_OF_SEASON: 'out-of-season',
  NO_EVENT_OCCURRENCE: 'no-event-occurrence',
  REGION_UNAVAILABLE: 'region-unavailable',
};

/**
 * `preview` surfaces deliberately: cultural content is complete and only the
 * verified venues are missing, which is a roadmap statement rather than a
 * defect. `planned` is roadmap-only and `retired` is gone.
 */
export const isSurfaceable = (status) =>
  status === STATUS.PREVIEW || status === STATUS.PUBLISHED;

/**
 * A journey with no records. Returns fresh Sets each call — sharing them
 * between journeys would let one traveller's progress leak into another's.
 */
export const emptyJourney = () => ({
  visitedRestaurantIds: new Set(),
  visitedMarketIds: new Set(),
  attestedExperienceIds: new Set(),
  companionIds: new Set(),
});
