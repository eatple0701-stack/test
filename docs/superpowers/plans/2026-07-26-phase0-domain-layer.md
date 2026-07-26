# Phase 0 — Additive Domain Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the Experience-first domain model alongside the existing app so both run at once, without editing a single existing implementation file.

**Architecture:** Strangler fig. Everything lands under a new `src/domain/` tree. The existing `computeJourney` stays the live progress engine and is never touched; a legacy bridge reads the existing persisted state and presents it to the new model as a `Journey`. A parity harness compares the two engines so any divergence is caught as a defect in the new model before any future cutover.

**Tech Stack:** Plain ES modules (`.js`), Node 24 built-in test runner (`node:test` + `node:assert/strict`). Zero new dependencies.

## Global Constraints

- **No existing file may be modified**, with exactly one deliberate exception: adding a `"test"` script key to `package.json` (Task 1). No edits to `src/data/journey.js`, `src/App.jsx`, any component, or any existing data file.
- `computeJourney` remains the live progress engine for all of Phase 0. New projections run *beside* it, never instead of it.
- Existing persisted state keeps its exact shape: `kfm-bookmarks` = `[{id, savedAt, visitedAt}]`, `kfm-markets` = `[marketId]`, `kfm-companions` = `[{travelerId, matchedAt}]`.
- Phase 0 ships a **representative seed catalog**, not the full content set. The seed must exercise every structural case: N:M collection↔theme, N:M theme↔experience, required vs optional steps, place-anchored / market-anchored / venue-less experiences, published vs preview status, and exclusion of quarantined places. Catalogue expansion is content work for a later phase.
- Dependency direction is one-way and enforced by review: `policy/` may import `projection/`, `capability/`, `catalog/`, `types.js`. `capability/` and `catalog/` must **never** import from `policy/`.
- Editorial prose carries no confidence badge. `Fact<T>` stays confined to the existing Place tier in `src/data/`. Nothing in `src/domain/` wraps prose in `fact()`.
- The canonical `Journey` shape consumed by every policy and projection:
  ```js
  Journey = {
    visitedRestaurantIds : Set<string>,
    visitedMarketIds     : Set<string>,
    attestedExperienceIds: Set<string>,
    companionIds         : Set<string>,
  }
  ```

**Run all tests:** `npm test` → `node --test "src/**/*.test.mjs"`

---

### Task 1: Test harness and domain vocabulary

**Files:**
- Modify: `package.json` (add `"test"` script key only)
- Create: `src/domain/types.js`
- Test: `src/domain/__tests__/types.test.mjs`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `STATUS` = `{ PLANNED:'planned', PREVIEW:'preview', PUBLISHED:'published', RETIRED:'retired' }`
  - `EXPERIENCE_KIND` = `{ DISH:'dish', PLACE:'place', RITUAL:'ritual', SETTING:'setting' }`
  - `COMPLETION_SOURCE` = `{ PLACE_VISIT:'place-visit', EVENT_ATTENDANCE:'event-attendance', SELF_ATTEST:'self-attest' }`
  - `BLOCKER` = `{ MISSING_VENUE:'missing-venue', OUT_OF_SEASON:'out-of-season', NO_EVENT_OCCURRENCE:'no-event-occurrence', REGION_UNAVAILABLE:'region-unavailable' }`
  - `isSurfaceable(status) -> boolean`
  - `emptyJourney() -> Journey`

- [ ] **Step 1: Add the test script to package.json**

Open `package.json` and add one key inside the existing `"scripts"` object, leaving every other line untouched:

```json
    "test": "node --test \"src/**/*.test.mjs\"",
```

The `"scripts"` block must end up as:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "check-data": "node scripts/check-data.mjs",
    "test": "node --test \"src/**/*.test.mjs\"",
    "preview": "vite preview"
  },
```

- [ ] **Step 2: Write the failing test**

Create `src/domain/__tests__/types.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATUS, EXPERIENCE_KIND, COMPLETION_SOURCE, BLOCKER, isSurfaceable, emptyJourney } from '../types.js';

test('status vocabulary is complete', () => {
  assert.deepEqual(Object.values(STATUS).sort(), ['planned', 'preview', 'published', 'retired']);
});

test('preview and published surface; planned and retired do not', () => {
  assert.equal(isSurfaceable(STATUS.PUBLISHED), true);
  assert.equal(isSurfaceable(STATUS.PREVIEW), true);
  assert.equal(isSurfaceable(STATUS.PLANNED), false);
  assert.equal(isSurfaceable(STATUS.RETIRED), false);
});

test('experience kinds cover the four authoring shapes', () => {
  assert.deepEqual(Object.values(EXPERIENCE_KIND).sort(), ['dish', 'place', 'ritual', 'setting']);
});

test('completion sources are the three seeded strategies', () => {
  assert.deepEqual(
    Object.values(COMPLETION_SOURCE).sort(),
    ['event-attendance', 'place-visit', 'self-attest'],
  );
});

test('blocker kinds are named', () => {
  assert.equal(BLOCKER.MISSING_VENUE, 'missing-venue');
  assert.equal(BLOCKER.OUT_OF_SEASON, 'out-of-season');
});

test('emptyJourney returns four independent empty sets', () => {
  const a = emptyJourney();
  const b = emptyJourney();
  a.visitedRestaurantIds.add('balwoo');
  assert.equal(b.visitedRestaurantIds.size, 0, 'journeys must not share set instances');
  assert.equal(a.visitedMarketIds.size, 0);
  assert.equal(a.attestedExperienceIds.size, 0);
  assert.equal(a.companionIds.size, 0);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../types.js`

- [ ] **Step 4: Write the implementation**

Create `src/domain/types.js`:

```js
// Domain vocabulary — the value objects every other domain module shares.
//
// This module imports nothing. It is the base of the one-way dependency
// chain (policy → projection → capability → catalog → types), so anything
// added here must stay free of behaviour that belongs further up.

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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 6 tests

- [ ] **Step 6: Verify nothing existing broke**

Run: `npm run lint && npm run check-data`
Expected: lint shows only pre-existing warnings (no errors); check-data exits 0

- [ ] **Step 7: Commit**

```bash
git add package.json src/domain/types.js src/domain/__tests__/types.test.mjs
git commit -m "Add domain vocabulary and node:test harness

Starts the additive domain layer. types.js imports nothing and sits at the
base of the one-way dependency chain. The only change to existing files is
a new test script key in package.json."
```

---

### Task 2: Experience catalog

**Files:**
- Create: `src/domain/catalog/experiences.js`
- Test: `src/domain/__tests__/catalog-experiences.test.mjs`

**Interfaces:**
- Consumes: `STATUS`, `EXPERIENCE_KIND` from `../types.js`
- Produces:
  - `experiences: Experience[]` where
    `Experience = { id, kind, title, titleKo, status, whyItMatters, culturalMeaning, whenToExperience, mission: {title, detail}, restaurantIds: string[], marketIds: string[], zones: string[], acceptsSelfAttest: boolean }`
  - `experienceById(id) -> Experience | undefined`

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/catalog-experiences.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { experiences, experienceById } from '../catalog/experiences.js';
import { STATUS, EXPERIENCE_KIND } from '../types.js';
import { restaurants } from '../../data/restaurants.js';
import { traditionalMarkets } from '../../data/experiences.js';

test('every experience id is unique', () => {
  const ids = experiences.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every restaurantId refers to a real restaurant', () => {
  const known = new Set(restaurants.map(r => r.id));
  for (const e of experiences) {
    for (const id of e.restaurantIds) {
      assert.ok(known.has(id), `${e.id} references unknown restaurant ${id}`);
    }
  }
});

test('every marketId refers to a real market', () => {
  const known = new Set(traditionalMarkets.map(m => m.id));
  for (const e of experiences) {
    for (const id of e.marketIds) {
      assert.ok(known.has(id), `${e.id} references unknown market ${id}`);
    }
  }
});

test('every experience carries a mission and cultural prose', () => {
  for (const e of experiences) {
    assert.ok(e.mission.title.length > 0, `${e.id} missing mission title`);
    assert.ok(e.mission.detail.length > 0, `${e.id} missing mission detail`);
    assert.ok(e.whyItMatters.length > 0, `${e.id} missing whyItMatters`);
    assert.ok(e.culturalMeaning.length > 0, `${e.id} missing culturalMeaning`);
    assert.ok(e.whenToExperience.length > 0, `${e.id} missing whenToExperience`);
  }
});

test('kind and status use the shared vocabulary', () => {
  const kinds = new Set(Object.values(EXPERIENCE_KIND));
  const statuses = new Set(Object.values(STATUS));
  for (const e of experiences) {
    assert.ok(kinds.has(e.kind), `${e.id} has invalid kind ${e.kind}`);
    assert.ok(statuses.has(e.status), `${e.id} has invalid status ${e.status}`);
  }
});

test('seed covers place-anchored, market-anchored and venue-less experiences', () => {
  assert.ok(experiences.some(e => e.restaurantIds.length > 0), 'need a place-anchored experience');
  assert.ok(experiences.some(e => e.marketIds.length > 0), 'need a market-anchored experience');
  assert.ok(
    experiences.some(e => e.restaurantIds.length === 0 && e.marketIds.length === 0 && e.acceptsSelfAttest),
    'need a venue-less experience completable by self-attestation',
  );
});

test('a venue-less experience must accept self-attestation or it can never complete', () => {
  for (const e of experiences) {
    if (e.restaurantIds.length === 0 && e.marketIds.length === 0) {
      assert.equal(e.acceptsSelfAttest, true, `${e.id} has no anchor and no self-attest route`);
    }
  }
});

test('experienceById finds a known record and returns undefined otherwise', () => {
  assert.equal(experienceById('temple-cuisine').id, 'temple-cuisine');
  assert.equal(experienceById('nope'), undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../catalog/experiences.js`

- [ ] **Step 3: Write the implementation**

Create `src/domain/catalog/experiences.js`:

```js
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
      'A cuisine built entirely without garlic, onion or haste — the only Korean table where what is left out matters more than what is put in.',
    culturalMeaning:
      'Temple food expresses a Buddhist philosophy of eating with awareness: nothing wasted, nothing indulgent, everything intentional.',
    whenToExperience:
      'During a templestay, on a Buddhist holiday, or whenever the city has worn you down and you want a quiet reset.',
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
      'The meal does not end when the bowl empties. The pot that follows is where the conversation actually happens.',
    culturalMeaning:
      'Korean tea culture treats the pour as part of the hospitality, not an afterthought — the host keeps your cup filled without being asked.',
    whenToExperience:
      'Straight after a temple meal, while the quiet still holds.',
    mission: {
      title: 'Let Them Pour',
      detail: 'Do not refill your own cup. Let your host do it, and return the favour — that exchange is the whole ritual.',
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
      'One of Korea’s oldest markets, feeding Seoul for over a century from stalls barely wider than their griddles.',
    culturalMeaning:
      'The market is where Korean food is still transacted face to face — you order by pointing, and you eat at the counter beside whoever came before you.',
    whenToExperience:
      'Late afternoon, when the dinner crowd arrives and every griddle is running at once.',
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
      'A mung bean pancake ground on a stone mill in front of you and fried in enough oil to hear it from across the aisle.',
    culturalMeaning:
      'Once a food of scarcity made from what was left after the beans were pressed, now the dish people queue for. Korean cooking does that often.',
    whenToExperience:
      'On a cold day, with makgeolli, standing up.',
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
      'Korea’s oldest alcohol, cloudy and barely sweet, drunk from a bowl rather than a glass.',
    culturalMeaning:
      'Makgeolli is a farmer’s drink that survived into the cities. Pouring for others before yourself is the etiquette that carries the culture.',
    whenToExperience:
      'With fried food, on a rainy evening — the pairing is close to a national reflex.',
    mission: {
      title: 'Pour for Someone Else First',
      detail: 'Never fill your own bowl first. Fill your companion’s, and let them fill yours.',
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
      'Not a dish but a place to stand: the narrow run between stalls where the whole market happens at once.',
    culturalMeaning:
      'Korean markets are organised by trade, so an alley is a category — walk one and you have seen an entire supply chain.',
    whenToExperience:
      'Any time the market is open. Walk it once end to end before ordering anything.',
    mission: {
      title: 'Walk It First',
      detail: 'Walk the full alley before you buy. Deciding after seeing everything is how locals shop.',
    },
    // Anchored to namdaemun alone, deliberately disjoint from the gwangjang
    // anchors of street-first-timer's required steps. That disjointness is
    // what lets an optional step be unreachable while the narrative stays
    // playable — the only way the `degraded` verdict can ever be exercised.
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
      'Invented in Incheon’s Chinatown by Chinese dockworkers far from home, and now the most Korean thing on any menu.',
    culturalMeaning:
      'The dish carries the memory of Korea’s Chinese immigrant community — fully naturalised while keeping its foreign name.',
    whenToExperience:
      'Moving day, the day report cards come out, or any weeknight nobody wants to cook.',
    mission: {
      title: 'Order Like a Local',
      detail: 'Get one jjajangmyeon and one jjamppong for the table and swap halfway — the standard Korean answer to an unwinnable choice.',
    },
    restaurantIds: ['osegyehyang', 'gonghwachun'],
    marketIds: [],
    zones: ['Insadong, Seoul', 'Chinatown, Jemulpo-gu, Incheon'],
    acceptsSelfAttest: false,
  },
];

const byId = new Map(experiences.map(e => [e.id, e]));

export const experienceById = (id) => byId.get(id);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 14 tests total (6 from Task 1, 8 here)

- [ ] **Step 5: Commit**

```bash
git add src/domain/catalog/experiences.js src/domain/__tests__/catalog-experiences.test.mjs
git commit -m "Add Experience catalog seed

Experience is a unit of culture, not of venue: the seed includes
place-anchored, market-anchored and venue-less records. Tests assert every
venue-less experience accepts self-attestation, so no experience can be
authored into a state where it can never complete."
```

---

### Task 3: Theme catalog and membership

**Files:**
- Create: `src/domain/catalog/themes.js`
- Test: `src/domain/__tests__/catalog-themes.test.mjs`

**Interfaces:**
- Consumes: `STATUS` from `../types.js`; `experienceById` from `./experiences.js`
- Produces:
  - `themes: Theme[]` where `Theme = { id, emoji, title, tagline, narrative, region, status }`
  - `themeExperiences: { themeId, experienceId }[]`
  - `themeById(id) -> Theme | undefined`
  - `experienceIdsOfTheme(themeId) -> string[]`
  - `themeIdsOfExperience(experienceId) -> string[]`

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/catalog-themes.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { themes, themeExperiences, themeById, experienceIdsOfTheme, themeIdsOfExperience } from '../catalog/themes.js';
import { experienceById } from '../catalog/experiences.js';
import { STATUS } from '../types.js';

test('every theme id is unique', () => {
  const ids = themes.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every membership row points at a real theme and a real experience', () => {
  const themeIds = new Set(themes.map(t => t.id));
  for (const row of themeExperiences) {
    assert.ok(themeIds.has(row.themeId), `unknown theme ${row.themeId}`);
    assert.ok(experienceById(row.experienceId), `unknown experience ${row.experienceId}`);
  }
});

test('membership rows are not duplicated', () => {
  const keys = themeExperiences.map(r => `${r.themeId}::${r.experienceId}`);
  assert.equal(new Set(keys).size, keys.length);
});

test('every theme has at least one experience', () => {
  for (const t of themes) {
    assert.ok(experienceIdsOfTheme(t.id).length > 0, `${t.id} has no experiences`);
  }
});

test('theme status uses the shared vocabulary', () => {
  const statuses = new Set(Object.values(STATUS));
  for (const t of themes) assert.ok(statuses.has(t.status), `${t.id} invalid status`);
});

test('an experience can belong to more than one theme', () => {
  const shared = themeIdsOfExperience('makgeolli');
  assert.ok(shared.length >= 2, 'makgeolli must prove the N:M relationship');
});

test('themeIdsOfExperience returns empty for an unaffiliated id', () => {
  assert.deepEqual(themeIdsOfExperience('not-a-thing'), []);
});

test('themeById finds a known record', () => {
  assert.equal(themeById('temple-life').id, 'temple-life');
  assert.equal(themeById('nope'), undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../catalog/themes.js`

- [ ] **Step 3: Write the implementation**

Create `src/domain/catalog/themes.js`:

```js
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
      'Korean Buddhist temples kept a cuisine alive through centuries of war and industrialisation by refusing to hurry it. Sitting at a temple table is the closest a visitor gets to the country’s idea of restraint as a pleasure rather than a denial.',
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
      'Follow one bowl from the docks of Incheon’s Chinatown to every delivery scooter in the country. Jajangmyeon is the clearest case of Korea absorbing a foreign food so completely that its origin survives only in the name.',
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 22 tests total

- [ ] **Step 5: Commit**

```bash
git add src/domain/catalog/themes.js src/domain/__tests__/catalog-themes.test.mjs
git commit -m "Add Theme catalog with N:M experience membership

Theme owns territory and narrative prose but not ordering. Membership is
N:M and the seed proves it: makgeolli belongs to both Street Food and
Noodle Road, reached from different cultural angles."
```

---

### Task 4: Narrative catalog and steps

**Files:**
- Create: `src/domain/catalog/narratives.js`
- Test: `src/domain/__tests__/catalog-narratives.test.mjs`

**Interfaces:**
- Consumes: `STATUS` from `../types.js`; `themeById`, `experienceIdsOfTheme` from `./themes.js`; `experienceById` from `./experiences.js`
- Produces:
  - `narratives: Narrative[]` where `Narrative = { id, themeId, title, intro, outro, pacing, status }`
  - `narrativeSteps: { narrativeId, experienceId, order, required, transition }[]`
  - `narrativeById(id) -> Narrative | undefined`
  - `narrativesOfTheme(themeId) -> Narrative[]`
  - `stepsOfNarrative(narrativeId) -> Step[]` (ascending `order`)

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/catalog-narratives.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { narratives, narrativeSteps, narrativeById, narrativesOfTheme, stepsOfNarrative } from '../catalog/narratives.js';
import { themeById, experienceIdsOfTheme } from '../catalog/themes.js';
import { experienceById } from '../catalog/experiences.js';
import { STATUS } from '../types.js';

test('every narrative id is unique and points at a real theme', () => {
  const ids = narratives.map(n => n.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const n of narratives) assert.ok(themeById(n.themeId), `${n.id} unknown theme ${n.themeId}`);
});

test('every step points at a real narrative and a real experience', () => {
  const nIds = new Set(narratives.map(n => n.id));
  for (const s of narrativeSteps) {
    assert.ok(nIds.has(s.narrativeId), `unknown narrative ${s.narrativeId}`);
    assert.ok(experienceById(s.experienceId), `unknown experience ${s.experienceId}`);
  }
});

test('a step may only use an experience that belongs to its narrative theme', () => {
  for (const s of narrativeSteps) {
    const n = narrativeById(s.narrativeId);
    const allowed = experienceIdsOfTheme(n.themeId);
    assert.ok(
      allowed.includes(s.experienceId),
      `${s.narrativeId} step ${s.experienceId} is outside theme ${n.themeId}`,
    );
  }
});

test('step order is unique and contiguous from 1 within each narrative', () => {
  for (const n of narratives) {
    const orders = stepsOfNarrative(n.id).map(s => s.order);
    assert.deepEqual(orders, orders.map((_, i) => i + 1), `${n.id} has non-contiguous order`);
  }
});

test('every narrative has at least one required step or it can never complete', () => {
  for (const n of narratives) {
    const required = stepsOfNarrative(n.id).filter(s => s.required);
    assert.ok(required.length > 0, `${n.id} has no required step`);
  }
});

test('every step carries connective prose', () => {
  for (const s of narrativeSteps) {
    assert.ok(s.transition.length > 0, `${s.narrativeId}/${s.experienceId} missing transition`);
  }
});

test('narratives carry intro, outro and a valid status', () => {
  const statuses = new Set(Object.values(STATUS));
  for (const n of narratives) {
    assert.ok(n.intro.length > 0, `${n.id} missing intro`);
    assert.ok(n.outro.length > 0, `${n.id} missing outro`);
    assert.ok(statuses.has(n.status), `${n.id} invalid status`);
  }
});

test('the seed includes both a required and an optional step', () => {
  assert.ok(narrativeSteps.some(s => s.required), 'need a required step');
  assert.ok(narrativeSteps.some(s => !s.required), 'need an optional step');
});

test('narrativesOfTheme returns only that theme’s narratives', () => {
  for (const n of narrativesOfTheme('temple-life')) assert.equal(n.themeId, 'temple-life');
  assert.deepEqual(narrativesOfTheme('nope'), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../catalog/narratives.js`

- [ ] **Step 3: Write the implementation**

Create `src/domain/catalog/narratives.js`:

```js
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
    title: 'First Timer’s Market Crawl',
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
    narrativeId: 'street-first-timer',
    experienceId: 'market-alley',
    order: 4,
    required: false,
    transition:
      'Before you leave, walk the alley end to end. Seeing the whole trade in one line is the part people remember.',
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 31 tests total

- [ ] **Step 5: Commit**

```bash
git add src/domain/catalog/narratives.js src/domain/__tests__/catalog-narratives.test.mjs
git commit -m "Add Narrative catalog with ordered steps

Narrative makes a Theme executable. Ordering, necessity and connective
prose live on the step rather than on theme membership, because being
required is a property of the path and not of the culture.

Tests enforce two invariants that would otherwise rot silently: a step may
only reference an experience inside its narrative's theme, and every
narrative must have at least one required step or it can never complete."
```

---

### Task 5: Collection catalog and integrity gate

**Files:**
- Create: `src/domain/catalog/collections.js`
- Create: `src/domain/catalog/index.js`
- Test: `src/domain/__tests__/catalog-collections.test.mjs`

**Interfaces:**
- Consumes: `STATUS` from `../types.js`; `themeById` from `./themes.js`
- Produces:
  - `collections: Collection[]` where `Collection = { id, title, tagline, status, activeWindow: {fromMonth, toMonth} | null }`
  - `collectionThemes: { collectionId, themeId, order, editorialAngle }[]`
  - `collectionById(id) -> Collection | undefined`
  - `themeRefsOfCollection(id) -> { themeId, order, editorialAngle }[]` (ascending `order`)
  - `collectionIdsOfTheme(themeId) -> string[]`
  - From `catalog/index.js`: re-exports of every catalog symbol, plus `catalogIntegrity() -> string[]`

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/catalog-collections.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collections, collectionThemes, collectionById, themeRefsOfCollection, collectionIdsOfTheme,
} from '../catalog/collections.js';
import { themeById } from '../catalog/themes.js';
import { catalogIntegrity } from '../catalog/index.js';
import { STATUS } from '../types.js';

test('every collection id is unique and status is valid', () => {
  const ids = collections.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
  const statuses = new Set(Object.values(STATUS));
  for (const c of collections) assert.ok(statuses.has(c.status), `${c.id} invalid status`);
});

test('every membership row points at a real collection and theme', () => {
  const cIds = new Set(collections.map(c => c.id));
  for (const row of collectionThemes) {
    assert.ok(cIds.has(row.collectionId), `unknown collection ${row.collectionId}`);
    assert.ok(themeById(row.themeId), `unknown theme ${row.themeId}`);
  }
});

test('every membership row carries an editorial angle', () => {
  for (const row of collectionThemes) {
    assert.ok(
      row.editorialAngle.length > 0,
      `${row.collectionId}/${row.themeId} missing editorialAngle`,
    );
  }
});

test('a theme may belong to more than one collection with different angles', () => {
  const ids = collectionIdsOfTheme('temple-life');
  assert.ok(ids.length >= 2, 'temple-life must prove the N:M relationship');
  const angles = collectionThemes
    .filter(r => r.themeId === 'temple-life')
    .map(r => r.editorialAngle);
  assert.equal(new Set(angles).size, angles.length, 'the same theme must be framed differently per collection');
});

test('theme refs are ordered contiguously from 1 within each collection', () => {
  for (const c of collections) {
    const orders = themeRefsOfCollection(c.id).map(r => r.order);
    assert.deepEqual(orders, orders.map((_, i) => i + 1), `${c.id} has non-contiguous order`);
  }
});

test('activeWindow is either null or a valid month range', () => {
  for (const c of collections) {
    if (c.activeWindow === null) continue;
    const { fromMonth, toMonth } = c.activeWindow;
    assert.ok(fromMonth >= 1 && fromMonth <= 12, `${c.id} bad fromMonth`);
    assert.ok(toMonth >= 1 && toMonth <= 12, `${c.id} bad toMonth`);
  }
});

test('collectionById finds a known record', () => {
  assert.equal(collectionById('first-timers-seoul').id, 'first-timers-seoul');
  assert.equal(collectionById('nope'), undefined);
});

test('the whole catalog passes its integrity gate', () => {
  assert.deepEqual(catalogIntegrity(), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../catalog/collections.js`

- [ ] **Step 3: Write the collection catalog**

Create `src/domain/catalog/collections.js`:

```js
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
```

- [ ] **Step 4: Write the catalog barrel and integrity gate**

Create `src/domain/catalog/index.js`:

```js
// Catalog barrel plus a mechanical integrity gate.
//
// The gate keeps referential rules enforceable rather than relying on a
// reviewer remembering them, in the same spirit as scripts/check-data.mjs.
// It runs in the test suite, so a broken reference fails CI rather than
// surfacing as an empty screen later.

import { experiences, experienceById } from './experiences.js';
import {
  themes, themeExperiences, themeById, experienceIdsOfTheme, themeIdsOfExperience,
} from './themes.js';
import {
  narratives, narrativeSteps, narrativeById, narrativesOfTheme, stepsOfNarrative,
} from './narratives.js';
import {
  collections, collectionThemes, collectionById, themeRefsOfCollection, collectionIdsOfTheme,
} from './collections.js';

export {
  experiences, experienceById,
  themes, themeExperiences, themeById, experienceIdsOfTheme, themeIdsOfExperience,
  narratives, narrativeSteps, narrativeById, narrativesOfTheme, stepsOfNarrative,
  collections, collectionThemes, collectionById, themeRefsOfCollection, collectionIdsOfTheme,
};

/**
 * Every referential rule the catalog must satisfy, as a list of problems.
 * Empty means healthy.
 */
export function catalogIntegrity() {
  const problems = [];
  const note = (msg) => problems.push(msg);

  const themeIds = new Set(themes.map(t => t.id));
  const collectionIds = new Set(collections.map(c => c.id));
  const narrativeIds = new Set(narratives.map(n => n.id));

  for (const row of themeExperiences) {
    if (!themeIds.has(row.themeId)) note(`themeExperiences: unknown theme ${row.themeId}`);
    if (!experienceById(row.experienceId)) note(`themeExperiences: unknown experience ${row.experienceId}`);
  }

  for (const row of collectionThemes) {
    if (!collectionIds.has(row.collectionId)) note(`collectionThemes: unknown collection ${row.collectionId}`);
    if (!themeIds.has(row.themeId)) note(`collectionThemes: unknown theme ${row.themeId}`);
  }

  for (const s of narrativeSteps) {
    if (!narrativeIds.has(s.narrativeId)) {
      note(`narrativeSteps: unknown narrative ${s.narrativeId}`);
      continue;
    }
    if (!experienceById(s.experienceId)) {
      note(`narrativeSteps: unknown experience ${s.experienceId}`);
      continue;
    }
    const n = narrativeById(s.narrativeId);
    if (!experienceIdsOfTheme(n.themeId).includes(s.experienceId)) {
      note(`narrativeSteps: ${s.narrativeId} uses ${s.experienceId} outside theme ${n.themeId}`);
    }
  }

  // A narrative with no required step can never complete, so its theme can
  // never complete either.
  for (const n of narratives) {
    if (stepsOfNarrative(n.id).every(s => !s.required)) {
      note(`narratives: ${n.id} has no required step and can never complete`);
    }
  }

  // An experience with no anchor and no self-attestation route is
  // uncompletable by any registered source.
  for (const e of experiences) {
    if (e.restaurantIds.length === 0 && e.marketIds.length === 0 && !e.acceptsSelfAttest) {
      note(`experiences: ${e.id} has no completion route`);
    }
  }

  // A theme with no narrative cannot be completed. That is legitimate only
  // while the theme is still being authored.
  for (const t of themes) {
    if (narrativesOfTheme(t.id).length === 0 && t.status === 'published') {
      note(`themes: published theme ${t.id} has no narrative`);
    }
  }

  return problems;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 39 tests total

- [ ] **Step 6: Commit**

```bash
git add src/domain/catalog/collections.js src/domain/catalog/index.js src/domain/__tests__/catalog-collections.test.mjs
git commit -m "Add Collection catalog and mechanical integrity gate

Collection is an editorial lens with no completion of its own, keeping
progression on the single Theme axis. editorialAngle carries the per-
collection framing that separates curation from foldering.

catalogIntegrity() enforces the referential rules in the test suite rather
than in a reviewer's memory: dangling references, narratives with no
required step, experiences with no completion route, and published themes
with no narrative all fail the build."
```

---

### Task 6: Policy stubs

**Files:**
- Create: `src/domain/policy/visibility.js`
- Create: `src/domain/policy/completion.js`
- Create: `src/domain/policy/navigation.js`
- Test: `src/domain/__tests__/policy.test.mjs`

**Interfaces:**
- Consumes: catalog barrel, `../types.js`, `restaurants` and `isQuarantined` from `src/data/`
- Produces:
  - `isSurfaceableEntity(entity) -> boolean`
  - `admissiblePlaceIds() -> Set<string>`
  - `completionSources: CompletionSource[]`
  - `experienceDone(experience, journey) -> boolean`
  - `narrativeDone(narrativeId, journey) -> boolean`
  - `themeDone(themeId, journey) -> boolean`
  - `themeExplored(themeId, journey) -> boolean`
  - `canEnterDirectly(entityType) -> boolean`
  - `ancestryOfRestaurant(restaurantId) -> { experienceId, themeId } | null`

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/policy.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSurfaceableEntity, admissiblePlaceIds } from '../policy/visibility.js';
import {
  completionSources, experienceDone, narrativeDone, themeDone, themeExplored,
} from '../policy/completion.js';
import { canEnterDirectly, ancestryOfRestaurant } from '../policy/navigation.js';
import { experienceById } from '../catalog/index.js';
import { emptyJourney, STATUS } from '../types.js';

test('quarantined restaurants are never admissible', () => {
  const ids = admissiblePlaceIds();
  assert.ok(ids.has('balwoo'), 'active restaurant must be admissible');
  assert.equal(ids.has('makan'), false, 'quarantined restaurant must be excluded');
  assert.equal(ids.has('akiya'), false, 'quarantined restaurant must be excluded');
});

test('preview and published entities surface; planned does not', () => {
  assert.equal(isSurfaceableEntity({ status: STATUS.PUBLISHED }), true);
  assert.equal(isSurfaceableEntity({ status: STATUS.PREVIEW }), true);
  assert.equal(isSurfaceableEntity({ status: STATUS.PLANNED }), false);
});

test('the registry seeds three sources', () => {
  assert.deepEqual(
    completionSources.map(s => s.id).sort(),
    ['event-attendance', 'place-visit', 'self-attest'],
  );
});

test('an experience is not done on an empty journey', () => {
  assert.equal(experienceDone(experienceById('temple-cuisine'), emptyJourney()), false);
});

test('visiting any one linked restaurant completes a place-anchored experience', () => {
  const j = emptyJourney();
  j.visitedRestaurantIds.add('sanchon');
  assert.equal(experienceDone(experienceById('temple-cuisine'), j), true);
});

test('visiting a linked market completes a market-anchored experience', () => {
  const j = emptyJourney();
  j.visitedMarketIds.add('gwangjang');
  assert.equal(experienceDone(experienceById('gwangjang-market'), j), true);
});

test('self-attestation completes a venue-less experience', () => {
  const j = emptyJourney();
  j.attestedExperienceIds.add('makgeolli');
  assert.equal(experienceDone(experienceById('makgeolli'), j), true);
});

test('self-attestation does not complete an experience that has anchors', () => {
  const j = emptyJourney();
  j.attestedExperienceIds.add('temple-cuisine');
  assert.equal(
    experienceDone(experienceById('temple-cuisine'), j), false,
    'an anchored experience must be completed through its anchor',
  );
});

test('attestation is refused for an anchored experience even if it opts in', () => {
  // The guarantee must come from the policy, not from catalog-authoring
  // convention: a record that both carries an anchor and sets the flag must
  // still refuse attestation. The seed has no such record, so the test
  // contrives one rather than passing for the wrong reason.
  const contrived = {
    id: 'contrived-anchored',
    restaurantIds: ['balwoo'],
    marketIds: [],
    acceptsSelfAttest: true,
  };
  const j = emptyJourney();
  j.attestedExperienceIds.add('contrived-anchored');
  assert.equal(
    experienceDone(contrived, j), false,
    'having an anchor must veto the attestation route',
  );

  j.visitedRestaurantIds.add('balwoo');
  assert.equal(
    experienceDone(contrived, j), true,
    'the same record completes normally through its anchor',
  );
});

test('a narrative completes when its required steps are done, ignoring optional ones', () => {
  const j = emptyJourney();
  j.visitedRestaurantIds.add('balwoo');
  assert.equal(narrativeDone('temple-half-day', j), true, 'optional temple-tea must not block');
});

test('a theme completes when any one of its narratives completes', () => {
  const j = emptyJourney();
  j.visitedRestaurantIds.add('balwoo');
  assert.equal(themeDone('temple-life', j), true);
  assert.equal(themeDone('street-food', j), false);
});

test('a theme is explored as soon as any of its experiences is done', () => {
  const j = emptyJourney();
  // makgeolli belongs to street-food but is only an optional step of its
  // narrative, so attesting it explores the theme without completing it.
  // A gwangjang visit would NOT work here: both required steps of
  // street-first-timer are anchored to that market, so it completes the theme.
  j.attestedExperienceIds.add('makgeolli');
  assert.equal(themeExplored('street-food', j), true);
  assert.equal(themeDone('street-food', j), false, 'exploring is not completing');
});

test('a market visit completes exactly the experiences anchored to that market', () => {
  const j = emptyJourney();
  j.visitedMarketIds.add('gwangjang');
  for (const id of ['gwangjang-market', 'bindaetteok']) {
    assert.equal(
      experienceDone(experienceById(id), j), true,
      `${id} is anchored to gwangjang and must complete on that visit`,
    );
  }
  assert.equal(
    experienceDone(experienceById('market-alley'), j), false,
    'market-alley is anchored to namdaemun, so a gwangjang visit must not complete it',
  );
  assert.equal(themeDone('street-food', j), true, 'both required steps are satisfied');

  j.visitedMarketIds.add('namdaemun');
  assert.equal(
    experienceDone(experienceById('market-alley'), j), true,
    'visiting its own market completes it',
  );
});

test('restaurant is the single entity that cannot be entered directly', () => {
  assert.equal(canEnterDirectly('collection'), true);
  assert.equal(canEnterDirectly('theme'), true);
  assert.equal(canEnterDirectly('narrative'), true);
  assert.equal(canEnterDirectly('experience'), true);
  assert.equal(canEnterDirectly('restaurant'), false);
});

test('every reachable restaurant resolves to an experience and theme ancestor', () => {
  const a = ancestryOfRestaurant('balwoo');
  assert.equal(a.experienceId, 'temple-cuisine');
  assert.equal(a.themeId, 'temple-life');
});

test('a restaurant in no experience has no ancestry', () => {
  assert.equal(ancestryOfRestaurant('camouflage'), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../policy/visibility.js`

- [ ] **Step 3: Write the visibility policy**

Create `src/domain/policy/visibility.js`:

```js
// VisibilityPolicy — may this entity surface in this context?
//
// Two independent gates are combined here. Editorial status (planned /
// preview / published) governs content entities; the existing Place
// lifecycle governs venues and is reused untouched from src/data.

import { isSurfaceable } from '../types.js';
import { restaurants } from '../../data/restaurants.js';
import { isQuarantined } from '../../data/verification.js';

/** Content entities carry `status`. Anything without one is treated as visible. */
export const isSurfaceableEntity = (entity) =>
  entity?.status === undefined ? true : isSurfaceable(entity.status);

/**
 * Places a narrative is allowed to count on. Quarantined records are excluded
 * from every discovery surface and from direct navigation alike — the
 * existing rule, reused rather than restated.
 */
export function admissiblePlaceIds() {
  return new Set(restaurants.filter(r => !isQuarantined(r)).map(r => r.id));
}
```

- [ ] **Step 4: Write the completion policy**

Create `src/domain/policy/completion.js`:

```js
// CompletionPolicy — what counts as done.
//
// Completion is a registry of strategies rather than a hard-coded rule, so a
// future Workshop or Class becomes one more entry here and nothing else in
// the domain changes.
//
// Every source resolves against the traveller's own records. Nothing infers
// completion on the user's behalf.

import { COMPLETION_SOURCE } from '../types.js';
import {
  experienceById, experienceIdsOfTheme, narrativesOfTheme, stepsOfNarrative,
} from '../catalog/index.js';
import { admissiblePlaceIds } from './visibility.js';

/**
 * @typedef {object} CompletionSource
 * @property {string} id
 * @property {string} label
 * @property {(e: object) => boolean} appliesTo
 * @property {(e: object, j: object) => boolean} isSatisfied
 * @property {(e: object, j: object) => object|null} evidenceOf
 */

/** @type {CompletionSource[]} */
export const completionSources = [
  {
    id: COMPLETION_SOURCE.PLACE_VISIT,
    label: 'Visited a place',
    appliesTo: (e) => e.restaurantIds.length > 0,
    isSatisfied: (e, j) => {
      const admissible = admissiblePlaceIds();
      return e.restaurantIds.some(id => admissible.has(id) && j.visitedRestaurantIds.has(id));
    },
    evidenceOf: (e, j) => {
      const admissible = admissiblePlaceIds();
      const id = e.restaurantIds.find(x => admissible.has(x) && j.visitedRestaurantIds.has(x));
      return id ? { kind: 'restaurant', id } : null;
    },
  },
  {
    id: COMPLETION_SOURCE.EVENT_ATTENDANCE,
    label: 'Attended a market or event',
    appliesTo: (e) => e.marketIds.length > 0,
    isSatisfied: (e, j) => e.marketIds.some(id => j.visitedMarketIds.has(id)),
    evidenceOf: (e, j) => {
      const id = e.marketIds.find(x => j.visitedMarketIds.has(x));
      return id ? { kind: 'market', id } : null;
    },
  },
  {
    id: COMPLETION_SOURCE.SELF_ATTEST,
    // Covers both 'I completed the mission' and 'I did this': both resolve to
    // the same attestation record, so they are one strategy rather than two
    // identical ones. A distinct mission source earns its place once missions
    // gain their own storage, and adding it then is a single registry entry.
    label: 'Marked as done',
    // Requiring the absence of anchors here — rather than trusting the
    // record's flag alone — keeps attestation from becoming a universal skip
    // button for anchored experiences. The guarantee must come from the
    // policy, not from catalog-authoring convention.
    appliesTo: (e) =>
      e.acceptsSelfAttest && e.restaurantIds.length === 0 && e.marketIds.length === 0,
    isSatisfied: (e, j) => j.attestedExperienceIds.has(e.id),
    evidenceOf: (e, j) => (j.attestedExperienceIds.has(e.id) ? { kind: 'attestation', id: e.id } : null),
  },
];

/** Done when any applicable source is satisfied. */
export function experienceDone(experience, journey) {
  if (!experience) return false;
  return completionSources
    .filter(s => s.appliesTo(experience))
    .some(s => s.isSatisfied(experience, journey));
}

/** Optional steps never block completion. */
export function narrativeDone(narrativeId, journey) {
  const required = stepsOfNarrative(narrativeId).filter(s => s.required);
  if (required.length === 0) return false;
  return required.every(s => experienceDone(experienceById(s.experienceId), journey));
}

/**
 * A theme completes through any one of its narratives. Requiring every
 * experience would make a large theme uncompletable, which is exactly the
 * failure this definition exists to avoid.
 */
export function themeDone(themeId, journey) {
  const ns = narrativesOfTheme(themeId);
  if (ns.length === 0) return false;
  return ns.some(n => narrativeDone(n.id, journey));
}

/** Partial progress: any one experience in the theme is done. */
export function themeExplored(themeId, journey) {
  return experienceIdsOfTheme(themeId).some(id => experienceDone(experienceById(id), journey));
}
```

- [ ] **Step 5: Write the navigation policy**

Create `src/domain/policy/navigation.js`:

```js
// NavigationPolicy — what may be entered, and with what ancestry.
//
// Exactly one entity is constrained. Collection, Theme, Narrative and
// Experience may all be entered directly by search, recommendation or a
// resumed journey. Restaurant may not: every route reaching it carries an
// Experience ancestor, so "back" ascends the hierarchy instead of dead-ending
// on a venue with no cultural context.

import { experiences, themeIdsOfExperience } from '../catalog/index.js';

const DIRECTLY_ENTERABLE = new Set(['collection', 'theme', 'narrative', 'experience']);

export const canEnterDirectly = (entityType) => DIRECTLY_ENTERABLE.has(entityType);

/**
 * The ancestry a restaurant must be reached through. Returns the first
 * experience that lists it, with one of that experience's themes.
 * `null` means the restaurant is not yet part of any experience and is
 * therefore not reachable — which is the correct answer, not an error.
 */
export function ancestryOfRestaurant(restaurantId) {
  const experience = experiences.find(e => e.restaurantIds.includes(restaurantId));
  if (!experience) return null;
  const [themeId] = themeIdsOfExperience(experience.id);
  return { experienceId: experience.id, themeId: themeId ?? null };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 55 tests total

- [ ] **Step 7: Verify the dependency direction was not violated**

Run: `grep -rn "policy/" src/domain/catalog/ src/domain/types.js`
Expected: no output. Catalog and types must never import from policy.

- [ ] **Step 8: Commit**

```bash
git add src/domain/policy/ src/domain/__tests__/policy.test.mjs
git commit -m "Add visibility, completion and navigation policy stubs

Completion is a strategy registry rather than a hard-coded rule, so adding
a future Workshop or Class source touches nothing else in the domain.
Anchored experiences must be completed through their anchor; only
venue-less ones accept attestation, which stops self-attestation becoming a
universal skip button.

Theme completion requires any one narrative rather than every experience,
keeping large themes completable. Quarantine exclusion reuses the existing
rule from src/data rather than restating it."
```

---

### Task 7: Playable and Mappable capabilities

**Files:**
- Create: `src/domain/capability/playable.js`
- Create: `src/domain/capability/mappable.js`
- Test: `src/domain/__tests__/capability.test.mjs`

**Interfaces:**
- Consumes: catalog barrel, `../types.js`. **Must not import from `../policy/`.**
- Produces:
  - `assessNarrative(narrativeId, context) -> Verdict`
  - `assessTheme(themeId, context) -> Verdict`
  - `assessCollection(collectionId, context) -> Verdict`
  - where `Verdict = { playable: boolean, degraded: boolean, blockers: {kind, ref}[] }`
  - `PlayabilityContext = { at: Date, admissiblePlaces: Set<string>, availableEvents: Set<string> }`
  - `markersOfExperience(id) -> Marker[]`, `markersOfTheme(id) -> Marker[]`, `markersOfCollection(id) -> Marker[]`
  - where `Marker = { kind: 'restaurant'|'market', id, parentContext: {experienceId, themeId|null} }`

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/capability.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessNarrative, assessTheme, assessCollection } from '../capability/playable.js';
import { markersOfExperience, markersOfTheme, markersOfCollection } from '../capability/mappable.js';
import { BLOCKER } from '../types.js';

const fullContext = () => ({
  at: new Date('2026-10-15'),
  admissiblePlaces: new Set(['balwoo', 'sanchon', 'maji', 'osegyehyang', 'gonghwachun']),
  availableEvents: new Set(['gwangjang', 'namdaemun', 'sinpo']),
});

test('a narrative whose required anchors are available is playable', () => {
  const v = assessNarrative('temple-half-day', fullContext());
  assert.equal(v.playable, true);
  assert.deepEqual(v.blockers, []);
});

test('a narrative becomes unplayable when a required venue is inadmissible', () => {
  const ctx = fullContext();
  ctx.admissiblePlaces = new Set();
  const v = assessNarrative('temple-half-day', ctx);
  assert.equal(v.playable, false);
  assert.equal(v.blockers[0].kind, BLOCKER.MISSING_VENUE);
  assert.equal(v.blockers[0].ref, 'temple-cuisine');
});

test('required market-anchored steps block when no events are available', () => {
  const ctx = fullContext();
  ctx.availableEvents = new Set();
  const v = assessNarrative('street-first-timer', ctx);
  assert.equal(v.playable, false);
  const refs = v.blockers.map(b => b.ref).sort();
  assert.deepEqual(refs, ['bindaetteok', 'gwangjang-market'], 'both required market steps block');
  for (const b of v.blockers) assert.equal(b.kind, BLOCKER.MISSING_VENUE);
});

test('an optional venue-less step never blocks, because attestation needs no venue', () => {
  const ctx = fullContext();
  ctx.availableEvents = new Set();
  const v = assessNarrative('street-first-timer', ctx);
  assert.equal(
    v.blockers.some(b => b.ref === 'makgeolli'), false,
    'makgeolli is optional and venue-less, so it can never be a blocker',
  );
});

test('a restaurant-anchored step is unplayable when its venues are inadmissible', () => {
  const ctx = fullContext();
  ctx.admissiblePlaces = new Set();
  const v = assessNarrative('noodle-origin', ctx);
  assert.equal(v.playable, false, 'jajangmyeon is anchored to restaurants only');
  assert.equal(v.blockers[0].ref, 'jajangmyeon');
});

test('a theme is playable when any of its narratives is', () => {
  assert.equal(assessTheme('temple-life', fullContext()).playable, true);
});

test('a collection is playable when any of its themes is', () => {
  assert.equal(assessCollection('first-timers-seoul', fullContext()).playable, true);
});

test('an empty context makes everything unplayable rather than throwing', () => {
  const ctx = { at: new Date(), admissiblePlaces: new Set(), availableEvents: new Set() };
  assert.equal(assessTheme('temple-life', ctx).playable, false);
  assert.equal(assessCollection('autumn-in-seoul', ctx).playable, false);
});

test('markers carry parent context so back-navigation ascends', () => {
  const markers = markersOfExperience('temple-cuisine');
  assert.equal(markers.length, 3);
  for (const m of markers) {
    assert.equal(m.kind, 'restaurant');
    assert.equal(m.parentContext.experienceId, 'temple-cuisine');
    assert.equal(m.parentContext.themeId, 'temple-life');
  }
});

test('market-anchored experiences produce market markers', () => {
  const markers = markersOfExperience('gwangjang-market');
  assert.equal(markers.length, 1);
  assert.equal(markers[0].kind, 'market');
  assert.equal(markers[0].id, 'gwangjang');
});

test('a venue-less experience produces no markers', () => {
  assert.deepEqual(markersOfExperience('makgeolli'), []);
});

test('theme and collection markers aggregate their children without duplicates', () => {
  const themeMarkers = markersOfTheme('temple-life');
  assert.equal(themeMarkers.length, 3);
  const collectionMarkers = markersOfCollection('autumn-in-seoul');
  const keys = collectionMarkers.map(m => `${m.kind}:${m.id}`);
  assert.equal(new Set(keys).size, keys.length, 'markers must be de-duplicated');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../capability/playable.js`

- [ ] **Step 3: Write the playable capability**

Create `src/domain/capability/playable.js`:

```js
// Playable — can this path actually be walked right now?
//
// Deciding which places are admissible is VisibilityPolicy's job, and a
// capability reaching up to a policy would invert the dependency direction.
// So the facts are injected downward instead: the caller supplies the
// admissible sets, and a narrative judges only itself against them.
//
// This module must never import from ../policy/.

import { BLOCKER } from '../types.js';
import {
  experienceById, narrativesOfTheme, stepsOfNarrative, themeRefsOfCollection,
} from '../catalog/index.js';

const verdict = (playable, degraded, blockers) => ({ playable, degraded, blockers });

/** Can this single experience be realised under the given context? */
function stepReachable(experience, context) {
  if (!experience) return false;
  if (experience.restaurantIds.some(id => context.admissiblePlaces.has(id))) return true;
  if (experience.marketIds.some(id => context.availableEvents.has(id))) return true;
  // A venue-less experience is always reachable: attestation needs no venue.
  if (experience.restaurantIds.length === 0 && experience.marketIds.length === 0) {
    return experience.acceptsSelfAttest;
  }
  return false;
}

export function assessNarrative(narrativeId, context) {
  const steps = stepsOfNarrative(narrativeId);
  if (steps.length === 0) return verdict(false, false, [{ kind: BLOCKER.MISSING_VENUE, ref: narrativeId }]);

  const blockers = [];
  let degraded = false;

  for (const step of steps) {
    const reachable = stepReachable(experienceById(step.experienceId), context);
    if (reachable) continue;
    if (step.required) blockers.push({ kind: BLOCKER.MISSING_VENUE, ref: step.experienceId });
    else degraded = true;
  }

  return verdict(blockers.length === 0, degraded, blockers);
}

/** Transitive: a theme is playable when any of its narratives is. */
export function assessTheme(themeId, context) {
  const verdicts = narrativesOfTheme(themeId).map(n => assessNarrative(n.id, context));
  if (verdicts.length === 0) return verdict(false, false, [{ kind: BLOCKER.MISSING_VENUE, ref: themeId }]);
  const playableVerdicts = verdicts.filter(v => v.playable);
  const playable = playableVerdicts.length > 0;
  return verdict(
    playable,
    // Degraded only when there is no clean path: if any playable narrative
    // runs without gaps, the theme is not degraded.
    playable && playableVerdicts.every(v => v.degraded),
    playable ? [] : verdicts.flatMap(v => v.blockers),
  );
}

/** Transitive: a collection is playable when any of its themes is. */
export function assessCollection(collectionId, context) {
  const verdicts = themeRefsOfCollection(collectionId).map(r => assessTheme(r.themeId, context));
  if (verdicts.length === 0) return verdict(false, false, [{ kind: BLOCKER.MISSING_VENUE, ref: collectionId }]);
  const playableVerdicts = verdicts.filter(v => v.playable);
  const playable = playableVerdicts.length > 0;
  return verdict(
    playable,
    playable && playableVerdicts.every(v => v.degraded),
    playable ? [] : verdicts.flatMap(v => v.blockers),
  );
}
```

- [ ] **Step 4: Write the mappable capability**

Create `src/domain/capability/mappable.js`:

```js
// Mappable — anything that can yield coordinates is viewable on the map.
//
// The map is a general-purpose viewer, not a restaurant map. Every marker
// carries the ancestry it was reached through so that tapping a pin and
// pressing back ascends the hierarchy rather than stranding the traveller on
// a venue with no cultural context.
//
// This module must never import from ../policy/.

import {
  experienceById, experienceIdsOfTheme, themeIdsOfExperience, themeRefsOfCollection,
} from '../catalog/index.js';

const dedupe = (markers) => {
  const seen = new Set();
  return markers.filter(m => {
    const key = `${m.kind}:${m.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function markersOfExperience(experienceId, themeId = null) {
  const e = experienceById(experienceId);
  if (!e) return [];
  // Prefer the theme the caller reached this experience through; fall back to
  // its first membership only when called without a scope. An experience can
  // belong to several themes, and a marker must ascend to the one it was
  // actually reached from.
  const resolvedThemeId = themeId ?? themeIdsOfExperience(e.id)[0] ?? null;
  const parentContext = { experienceId: e.id, themeId: resolvedThemeId };
  return [
    ...e.restaurantIds.map(id => ({ kind: 'restaurant', id, parentContext })),
    ...e.marketIds.map(id => ({ kind: 'market', id, parentContext })),
  ];
}

export function markersOfTheme(themeId) {
  return dedupe(experienceIdsOfTheme(themeId).flatMap(id => markersOfExperience(id, themeId)));
}

export function markersOfCollection(collectionId) {
  return dedupe(themeRefsOfCollection(collectionId).flatMap(r => markersOfTheme(r.themeId)));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 76 tests total

> **Also amended:** `street-food` gained a second narrative, `street-quick-bite`
> (one required step, no optional steps). The seed previously had no theme with
> more than one narrative, so it never exercised the relationship Narrative
> exists for — and `assessTheme`'s `every` could not be told apart from the
> `some` bug it replaced. A test now fails if that operator is reverted.
> Side effect, accepted: `street-food` is now undegradable (both narratives
> share the `gwangjang` anchor and one is always clean), so collection-level
> degradation has no discriminating test. Recorded on `assessCollection`
> itself; closing it needs real content with a third anchor, not a bigger
> fixture. See commits `1656e9b`, `4ef78e7`.

> **Amended during execution.** Review found `degraded` structurally unreachable:
> the seed's only optional steps were venue-less and self-attestable, so no
> context could make them unreachable. `market-alley` — anchored, in the
> `street-food` theme, but in no narrative — became `street-first-timer`'s
> optional fourth step, giving the seed its missing optional-anchored case.
> `assessTheme`/`assessCollection` were also corrected to degrade only when no
> clean path remains, and `markersOfExperience` now takes the calling scope.
> Six further tests cover the degradation path and the real `gwangjang`
> collision across three `street-food` experiences; see commit `4719e8f`.

- [ ] **Step 6: Verify the capability layer stayed pure**

Run: `grep -rn "policy/" src/domain/capability/`
Expected: only comment lines, no import statements.

- [ ] **Step 7: Commit**

```bash
git add src/domain/capability/ src/domain/__tests__/capability.test.mjs
git commit -m "Add Playable and Mappable capabilities

Playable takes an injected context rather than consulting VisibilityPolicy,
so the capability layer never reaches upward and the one-way dependency
holds. Required steps block; optional steps only degrade.

Mappable makes the map a general-purpose viewer over any scope, and every
marker carries the ancestry it was reached through so back-navigation
ascends rather than dead-ending on a venue."
```

---

### Task 8: Projections

**Files:**
- Create: `src/domain/projection/narrativePath.js`
- Create: `src/domain/projection/journeyProgress.js`
- Create: `src/domain/projection/collectionFeed.js`
- Test: `src/domain/__tests__/projection.test.mjs`

**Interfaces:**
- Consumes: catalog barrel, `../policy/completion.js`, `../policy/visibility.js`, `../capability/playable.js`
- Produces:
  - `narrativePath(narrativeId, journey) -> { narrativeId, steps: Step[], requiredCount, doneCount, complete }`
    where each `Step = { experienceId, order, required, transition, done, title }`
  - `journeyProgress(journey) -> { themes: ThemeProgress[], themesCompleted, experiencesCompleted, currentTheme, nextExperienceId }`
    where `ThemeProgress = { themeId, title, total, done, pct, complete, explored }`
  - `collectionFeed(journey, { at }) -> FeedEntry[]`
    where `FeedEntry = { collectionId, title, tagline, status, playable, themes: { themeId, title, editorialAngle, complete, pct }[] }`

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/projection.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { narrativePath } from '../projection/narrativePath.js';
import { journeyProgress } from '../projection/journeyProgress.js';
import { collectionFeed } from '../projection/collectionFeed.js';
import { emptyJourney } from '../types.js';

test('narrativePath reports required count and completion', () => {
  const j = emptyJourney();
  const before = narrativePath('temple-half-day', j);
  assert.equal(before.requiredCount, 1);
  assert.equal(before.doneCount, 0);
  assert.equal(before.complete, false);

  j.visitedRestaurantIds.add('balwoo');
  const after = narrativePath('temple-half-day', j);
  assert.equal(after.doneCount, 1);
  assert.equal(after.complete, true);
});

test('narrativePath preserves step order and carries transitions', () => {
  const path = narrativePath('street-first-timer', emptyJourney());
  assert.deepEqual(path.steps.map(s => s.order), [1, 2, 3, 4]);
  for (const s of path.steps) assert.ok(s.transition.length > 0);
  assert.ok(path.steps[0].title.length > 0, 'steps must carry the experience title');
});

test('journeyProgress on an empty journey reports zeros without throwing', () => {
  const p = journeyProgress(emptyJourney());
  assert.equal(p.themesCompleted, 0);
  assert.equal(p.experiencesCompleted, 0);
  assert.ok(p.themes.length >= 3);
  for (const t of p.themes) assert.equal(t.pct, 0);
});

test('journeyProgress counts a completed theme and its experiences', () => {
  const j = emptyJourney();
  j.visitedRestaurantIds.add('balwoo');
  const p = journeyProgress(j);
  const temple = p.themes.find(t => t.themeId === 'temple-life');
  assert.equal(temple.complete, true);
  assert.equal(temple.explored, true);
  assert.equal(temple.done, 1);
  assert.equal(temple.total, 2);
  assert.equal(temple.pct, 50, 'pct tracks experiences done, not narrative completion');
  assert.equal(p.themesCompleted, 1);
  assert.equal(p.experiencesCompleted, 1);
});

test('journeyProgress suggests the most-progressed incomplete theme as current', () => {
  // Attesting makgeolli progresses two themes without completing either,
  // because neither theme's required narrative steps involve it. Visiting a
  // market instead would complete street-food outright, since three of its
  // four experiences are anchored to gwangjang.
  const j = emptyJourney();
  j.attestedExperienceIds.add('makgeolli');
  const p = journeyProgress(j);

  const street = p.themes.find(t => t.themeId === 'street-food');
  const noodle = p.themes.find(t => t.themeId === 'noodle-road');
  assert.equal(street.complete, false);
  assert.equal(noodle.complete, false);
  assert.equal(street.pct, 25, 'one of four experiences done');
  assert.equal(noodle.pct, 50, 'one of two experiences done');

  assert.equal(p.currentTheme, 'noodle-road', 'the furthest-along incomplete theme wins');
  assert.equal(p.nextExperienceId, 'jajangmyeon', 'the next undone experience in that theme');
});

test('journeyProgress returns a null current theme once every theme is complete', () => {
  const j = emptyJourney();
  j.visitedRestaurantIds.add('balwoo');       // completes temple-half-day
  j.visitedMarketIds.add('gwangjang');        // completes street-first-timer
  j.visitedRestaurantIds.add('osegyehyang');  // completes noodle-origin
  const p = journeyProgress(j);
  assert.equal(p.themesCompleted, p.themes.length, 'all seeded themes must be complete');
  assert.equal(p.currentTheme, null);
  assert.equal(p.nextExperienceId, null);
});

test('collectionFeed returns entries carrying editorial angles', () => {
  const feed = collectionFeed(emptyJourney(), { at: new Date('2026-10-15') });
  assert.ok(feed.length >= 1);
  const first = feed[0];
  assert.ok(first.themes.length > 0);
  for (const t of first.themes) assert.ok(t.editorialAngle.length > 0);
});

test('collectionFeed hides collections outside their active window', () => {
  const inSeason = collectionFeed(emptyJourney(), { at: new Date('2026-10-15') });
  const outSeason = collectionFeed(emptyJourney(), { at: new Date('2026-03-15') });
  assert.ok(inSeason.some(c => c.collectionId === 'autumn-in-seoul'), 'autumn shows in October');
  assert.equal(
    outSeason.some(c => c.collectionId === 'autumn-in-seoul'), false,
    'autumn must not show in March',
  );
  assert.ok(
    outSeason.some(c => c.collectionId === 'first-timers-seoul'),
    'a windowless collection shows year round',
  );
});

test('collectionFeed reflects theme progress inside each entry', () => {
  const j = emptyJourney();
  j.visitedRestaurantIds.add('balwoo');
  const feed = collectionFeed(j, { at: new Date('2026-10-15') });
  const entry = feed.find(c => c.collectionId === 'first-timers-seoul');
  const temple = entry.themes.find(t => t.themeId === 'temple-life');
  assert.equal(temple.complete, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../projection/narrativePath.js`

- [ ] **Step 3: Write narrativePath**

Create `src/domain/projection/narrativePath.js`:

```js
// NarrativePath — a narrative rendered against one traveller's journey.
//
// Read-only and recomputed on every call. Nothing here is persisted: adding
// a step to a narrative must change the answer immediately rather than
// leaving a stale figure behind.

import { experienceById, narrativeById, stepsOfNarrative } from '../catalog/index.js';
import { experienceDone, narrativeDone } from '../policy/completion.js';

export function narrativePath(narrativeId, journey) {
  const narrative = narrativeById(narrativeId);
  const steps = stepsOfNarrative(narrativeId).map(s => {
    const experience = experienceById(s.experienceId);
    return {
      experienceId: s.experienceId,
      order: s.order,
      required: s.required,
      transition: s.transition,
      title: experience?.title ?? s.experienceId,
      done: experienceDone(experience, journey),
    };
  });

  const required = steps.filter(s => s.required);

  return {
    narrativeId,
    title: narrative?.title ?? narrativeId,
    steps,
    // requiredCount and doneCount are presentation counts. `complete` is a
    // policy decision and is delegated: a second copy of the rule here would
    // let this view disagree with journeyProgress about the same narrative.
    requiredCount: required.length,
    doneCount: required.filter(s => s.done).length,
    complete: narrativeDone(narrativeId, journey),
  };
}
```

- [ ] **Step 4: Write journeyProgress**

Create `src/domain/projection/journeyProgress.js`:

```js
// JourneyProgress — how far along the whole trip is, on the Theme axis.
//
// This runs beside the existing computeJourney throughout Phase 0 rather
// than replacing it. Divergence between the two is a defect in this model
// and is caught by the parity harness.

import { themes, experienceById, experienceIdsOfTheme } from '../catalog/index.js';
import { experienceDone, themeDone, themeExplored } from '../policy/completion.js';
import { isSurfaceableEntity } from '../policy/visibility.js';

export function journeyProgress(journey) {
  const visible = themes.filter(isSurfaceableEntity);

  const themeProgress = visible.map(t => {
    const ids = experienceIdsOfTheme(t.id);
    const done = ids.filter(id => experienceDone(experienceById(id), journey)).length;
    return {
      themeId: t.id,
      title: t.title,
      total: ids.length,
      done,
      pct: ids.length === 0 ? 0 : Math.round((done / ids.length) * 100),
      complete: themeDone(t.id, journey),
      explored: themeExplored(t.id, journey),
    };
  });

  // The most-progressed incomplete theme keeps the suggestion reachable,
  // rather than always pointing at the hardest one.
  const current = themeProgress
    .filter(t => !t.complete)
    .sort((a, b) => b.pct - a.pct || a.themeId.localeCompare(b.themeId))[0] ?? null;

  const nextExperienceId = current
    ? experienceIdsOfTheme(current.themeId)
        .find(id => !experienceDone(experienceById(id), journey)) ?? null
    : null;

  return {
    themes: themeProgress,
    themesCompleted: themeProgress.filter(t => t.complete).length,
    experiencesCompleted: themeProgress.reduce((n, t) => n + t.done, 0),
    currentTheme: current ? current.themeId : null,
    nextExperienceId,
  };
}
```

- [ ] **Step 5: Write collectionFeed**

Create `src/domain/projection/collectionFeed.js`:

```js
// CollectionFeed — the editorial surface.
//
// Driven by curation rather than personalisation, so it is fully coherent
// for a brand-new traveller with no records at all. Journey state only
// annotates the entries; it never decides which ones appear.

import { collections, themeById, themeRefsOfCollection } from '../catalog/index.js';
import { isSurfaceableEntity, admissiblePlaceIds } from '../policy/visibility.js';
import { assessCollection } from '../capability/playable.js';
import { journeyProgress } from './journeyProgress.js';

/** Inclusive month window, wrapping across the year end (e.g. 11 → 2). */
function withinWindow(window, at) {
  if (!window) return true;
  const month = at.getMonth() + 1;
  const { fromMonth, toMonth } = window;
  return fromMonth <= toMonth
    ? month >= fromMonth && month <= toMonth
    : month >= fromMonth || month <= toMonth;
}

export function collectionFeed(journey, { at = new Date(), availableEvents } = {}) {
  const progress = journeyProgress(journey);
  const byTheme = new Map(progress.themes.map(t => [t.themeId, t]));

  const context = {
    at,
    admissiblePlaces: admissiblePlaceIds(),
    // Markets have no closure model yet, so every seeded market counts as
    // available until an Event lifecycle exists to say otherwise.
    availableEvents: availableEvents ?? new Set(['gwangjang', 'namdaemun', 'insadong-ssamzie', 'sinpo']),
  };

  return collections
    .filter(isSurfaceableEntity)
    .filter(c => withinWindow(c.activeWindow, at))
    .map(c => ({
      collectionId: c.id,
      title: c.title,
      tagline: c.tagline,
      status: c.status,
      playable: assessCollection(c.id, context).playable,
      themes: themeRefsOfCollection(c.id)
        .filter(r => isSurfaceableEntity(themeById(r.themeId)))
        .map(r => {
          const p = byTheme.get(r.themeId);
          return {
            themeId: r.themeId,
            title: themeById(r.themeId)?.title ?? r.themeId,
            editorialAngle: r.editorialAngle,
            complete: p?.complete ?? false,
            pct: p?.pct ?? 0,
          };
        }),
    }));
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 85 tests total

- [ ] **Step 7: Commit**

```bash
git add src/domain/projection/ src/domain/__tests__/projection.test.mjs
git commit -m "Add journey, narrative and collection feed projections

All three are read-only and recomputed on every call, so adding content
changes the answer immediately instead of leaving a stale figure behind.

collectionFeed is driven by curation rather than personalisation and stays
coherent for a traveller with no records; journey state only annotates
entries and never decides which appear. Its month window wraps across the
year end so a Nov-to-Feb collection behaves correctly."
```

---

### Task 9: Legacy bridge

**Files:**
- Create: `src/domain/bridge/legacyJourney.js`
- Test: `src/domain/__tests__/bridge.test.mjs`

**Interfaces:**
- Consumes: `emptyJourney` from `../types.js`
- Produces:
  - `journeyFromLegacy({ bookmarks, markets, companions, attestations }) -> Journey`
  - `readLegacyJourney(storage) -> Journey`
  - `LEGACY_KEYS = { BOOKMARKS:'kfm-bookmarks', MARKETS:'kfm-markets', COMPANIONS:'kfm-companions', ATTESTATIONS:'kfm-experiences' }`

**Note:** this is the seam of the strangler fig. It reads the existing persisted shapes without changing them and without importing anything from `src/data/journey.js`. The `kfm-experiences` key does not exist yet in the running app; reading it must degrade to an empty set rather than throwing.

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/bridge.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { journeyFromLegacy, readLegacyJourney, LEGACY_KEYS } from '../bridge/legacyJourney.js';

/** Minimal stand-in for the Storage interface. */
const fakeStorage = (entries) => ({
  getItem: (k) => (k in entries ? entries[k] : null),
});

test('only visited bookmarks become visited restaurants', () => {
  const j = journeyFromLegacy({
    bookmarks: [
      { id: 'balwoo', savedAt: 1, visitedAt: 2 },
      { id: 'sanchon', savedAt: 1, visitedAt: null },
    ],
  });
  assert.equal(j.visitedRestaurantIds.has('balwoo'), true);
  assert.equal(j.visitedRestaurantIds.has('sanchon'), false, 'saved-but-not-visited is not a visit');
});

test('legacy string bookmarks are tolerated and count as not visited', () => {
  const j = journeyFromLegacy({ bookmarks: ['balwoo'] });
  assert.equal(j.visitedRestaurantIds.size, 0);
});

test('markets and companions map across', () => {
  const j = journeyFromLegacy({
    markets: ['gwangjang', 'sinpo'],
    companions: [{ travelerId: 't3', matchedAt: 9 }],
  });
  assert.equal(j.visitedMarketIds.has('gwangjang'), true);
  assert.equal(j.companionIds.has('t3'), true);
});

test('attestations map across when present', () => {
  const j = journeyFromLegacy({ attestations: ['makgeolli'] });
  assert.equal(j.attestedExperienceIds.has('makgeolli'), true);
});

test('missing or malformed inputs degrade to an empty journey', () => {
  const j = journeyFromLegacy({});
  assert.equal(j.visitedRestaurantIds.size, 0);
  assert.equal(j.visitedMarketIds.size, 0);
  assert.equal(j.companionIds.size, 0);
  assert.equal(j.attestedExperienceIds.size, 0);

  const junk = journeyFromLegacy({ bookmarks: 'not-an-array', markets: 42, companions: null });
  assert.equal(junk.visitedRestaurantIds.size, 0);
  assert.equal(junk.visitedMarketIds.size, 0);
});

test('readLegacyJourney parses the real storage keys', () => {
  const storage = fakeStorage({
    [LEGACY_KEYS.BOOKMARKS]: JSON.stringify([{ id: 'balwoo', savedAt: 1, visitedAt: 2 }]),
    [LEGACY_KEYS.MARKETS]: JSON.stringify(['gwangjang']),
    [LEGACY_KEYS.COMPANIONS]: JSON.stringify([{ travelerId: 't1', matchedAt: 5 }]),
  });
  const j = readLegacyJourney(storage);
  assert.equal(j.visitedRestaurantIds.has('balwoo'), true);
  assert.equal(j.visitedMarketIds.has('gwangjang'), true);
  assert.equal(j.companionIds.has('t1'), true);
  assert.equal(j.attestedExperienceIds.size, 0, 'the attestation key does not exist yet');
});

test('readLegacyJourney survives corrupt JSON', () => {
  const j = readLegacyJourney(fakeStorage({ [LEGACY_KEYS.BOOKMARKS]: '{not json' }));
  assert.equal(j.visitedRestaurantIds.size, 0);
});

test('readLegacyJourney returns an empty journey when there is no storage', () => {
  const j = readLegacyJourney(null);
  assert.equal(j.visitedRestaurantIds.size, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../bridge/legacyJourney.js`

- [ ] **Step 3: Write the implementation**

Create `src/domain/bridge/legacyJourney.js`:

```js
// Legacy bridge — the seam of the strangler fig.
//
// Reads the state the running app already persists and presents it to the
// new domain model as a Journey. Nothing about the existing storage shape
// changes, and this module deliberately imports nothing from
// src/data/journey.js: the old engine and the new model must be able to run
// side by side without either depending on the other.
//
// `kfm-experiences` is written by no current code path. Reading it has to
// degrade to an empty set rather than throw, so this bridge works against
// today's storage and tomorrow's alike.

import { emptyJourney } from '../types.js';

export const LEGACY_KEYS = {
  BOOKMARKS: 'kfm-bookmarks',
  MARKETS: 'kfm-markets',
  COMPANIONS: 'kfm-companions',
  ATTESTATIONS: 'kfm-experiences',
};

const asArray = (value) => (Array.isArray(value) ? value : []);

/**
 * Map already-parsed legacy state onto a Journey.
 *
 * Only a bookmark with a non-null `visitedAt` counts as a visit; a saved
 * wishlist entry is not a completion. Legacy plain-string bookmark entries
 * predate visit tracking, so they can only ever mean "saved".
 */
export function journeyFromLegacy({ bookmarks, markets, companions, attestations } = {}) {
  const journey = emptyJourney();

  for (const entry of asArray(bookmarks)) {
    if (typeof entry !== 'object' || entry === null) continue;
    if (typeof entry.id !== 'string') continue;
    if (entry.visitedAt === null || entry.visitedAt === undefined) continue;
    journey.visitedRestaurantIds.add(entry.id);
  }

  for (const id of asArray(markets)) {
    if (typeof id === 'string') journey.visitedMarketIds.add(id);
  }

  for (const entry of asArray(companions)) {
    if (entry && typeof entry.travelerId === 'string') journey.companionIds.add(entry.travelerId);
  }

  for (const id of asArray(attestations)) {
    if (typeof id === 'string') journey.attestedExperienceIds.add(id);
  }

  return journey;
}

const readJson = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Read a Journey straight from a Storage-like object. Pass `localStorage` in
 * the browser; pass a stub in tests.
 */
export function readLegacyJourney(storage) {
  if (!storage || typeof storage.getItem !== 'function') return emptyJourney();
  return journeyFromLegacy({
    bookmarks: readJson(storage, LEGACY_KEYS.BOOKMARKS),
    markets: readJson(storage, LEGACY_KEYS.MARKETS),
    companions: readJson(storage, LEGACY_KEYS.COMPANIONS),
    attestations: readJson(storage, LEGACY_KEYS.ATTESTATIONS),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 93 tests total

- [ ] **Step 5: Verify the bridge did not couple to the old engine**

Run: `grep -rn "data/journey" src/domain/`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/domain/bridge/ src/domain/__tests__/bridge.test.mjs
git commit -m "Add legacy bridge from persisted state to Journey

The seam of the strangler fig. Reads kfm-bookmarks, kfm-markets and
kfm-companions in their existing shapes without changing them, and imports
nothing from src/data/journey.js so the two engines stay independent.

Only a bookmark with a non-null visitedAt counts as a visit; saved-but-not-
visited is a wishlist entry, not a completion. The not-yet-written
kfm-experiences key degrades to an empty set rather than throwing."
```

---

### Task 10: Parity harness

**Files:**
- Create: `src/domain/__tests__/parity.test.mjs`

**Interfaces:**
- Consumes: `computeJourney` from `../../data/journey.js` (**read-only — that file is never edited**), `journeyProgress`, `journeyFromLegacy`
- Produces: nothing. This task adds only a test.

**Why this exists:** the spec states that while both engines coexist, any disagreement between them is a defect in the new model to be fixed before cutover. This test makes that statement executable rather than aspirational.

The two engines count different things by design — `computeJourney` counts restaurants and zones, `journeyProgress` counts Experiences and Themes. So parity is asserted on the facts they genuinely share: which restaurants were visited, and whether a market was visited.

- [ ] **Step 1: Write the parity test**

Create `src/domain/__tests__/parity.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeJourney } from '../../data/journey.js';
import { restaurants } from '../../data/restaurants.js';
import { journeyFromLegacy } from '../bridge/legacyJourney.js';
import { journeyProgress } from '../projection/journeyProgress.js';
import { experienceById, experienceIdsOfTheme, themes } from '../catalog/index.js';
import { experienceDone } from '../policy/completion.js';

/** The same legacy state, expressed for both engines. */
const scenario = {
  bookmarks: [
    { id: 'balwoo', savedAt: 1, visitedAt: 2 },
    { id: 'osegyehyang', savedAt: 1, visitedAt: 3 },
    { id: 'sanchon', savedAt: 1, visitedAt: null },
  ],
  markets: ['gwangjang'],
  companions: [{ travelerId: 't1', matchedAt: 4 }],
};

const legacyInput = () => ({
  visitedPlaces: scenario.bookmarks
    .filter(b => b.visitedAt !== null)
    .map(b => restaurants.find(r => r.id === b.id))
    .filter(Boolean),
  markets: scenario.markets,
  companions: scenario.companions,
});

test('both engines agree on how many restaurants were visited', () => {
  const legacy = computeJourney(legacyInput());
  const journey = journeyFromLegacy(scenario);
  assert.equal(
    legacy.foodCount, journey.visitedRestaurantIds.size,
    'the bridge must not drop or invent a visit',
  );
});

test('both engines agree that a market was visited', () => {
  const legacy = computeJourney(legacyInput());
  const journey = journeyFromLegacy(scenario);
  assert.equal(legacy.marketCount, journey.visitedMarketIds.size);
});

test('both engines agree on companions met', () => {
  const legacy = computeJourney(legacyInput());
  const journey = journeyFromLegacy(scenario);
  assert.equal(legacy.companionCount, journey.companionIds.size);
});

test('a visit recorded by the legacy engine completes the matching experience', () => {
  const journey = journeyFromLegacy(scenario);
  assert.equal(
    experienceDone(experienceById('temple-cuisine'), journey), true,
    'balwoo was visited, so temple-cuisine must read as done in the new model',
  );
  assert.equal(experienceDone(experienceById('jajangmyeon'), journey), true);
});

test('the new projection never reports more done than the theme contains', () => {
  const p = journeyProgress(journeyFromLegacy(scenario));
  for (const t of p.themes) {
    assert.ok(t.done <= t.total, `${t.themeId} reports ${t.done}/${t.total}`);
    assert.ok(t.pct >= 0 && t.pct <= 100, `${t.themeId} pct out of range`);
  }
});

test('every catalogued theme appears in the projection', () => {
  const p = journeyProgress(journeyFromLegacy(scenario));
  assert.equal(p.themes.length, themes.length);
});

test('experiencesCompleted equals the sum of per-theme done counts', () => {
  const journey = journeyFromLegacy(scenario);
  const p = journeyProgress(journey);
  const summed = p.themes.reduce((n, t) => n + t.done, 0);
  assert.equal(p.experiencesCompleted, summed);
});

test('an experience shared by two themes is counted in both', () => {
  const journey = journeyFromLegacy(scenario);
  journey.attestedExperienceIds.add('makgeolli');
  const p = journeyProgress(journey);
  const street = p.themes.find(t => t.themeId === 'street-food');
  const noodle = p.themes.find(t => t.themeId === 'noodle-road');
  assert.ok(experienceIdsOfTheme('street-food').includes('makgeolli'));
  assert.ok(experienceIdsOfTheme('noodle-road').includes('makgeolli'));
  assert.ok(street.done >= 1 && noodle.done >= 1, 'shared experience must count in both themes');
});
```

- [ ] **Step 2: Run the test**

Run: `npm test`
Expected: PASS, 101 tests total

If any parity assertion fails, the defect is in the new model or the bridge — **never** in `src/data/journey.js`, which must not be edited.

- [ ] **Step 3: Confirm no existing file was modified**

Run: `git status --short src/ package.json`
Expected: only untracked `src/domain/` plus the `package.json` change from Task 1. No `M` on any file under `src/data/` or `src/components/`, and no `M` on `src/App.jsx`.

Run: `git diff --stat HEAD -- src/data src/components src/App.jsx`
Expected: no output.

- [ ] **Step 4: Full verification sweep**

Run: `npm test && npm run lint && npm run check-data`
Expected: tests pass; lint shows only pre-existing warnings; check-data exits 0.

- [ ] **Step 5: Confirm the app still runs**

Start the dev server and load the app. The UI must be byte-for-byte unchanged — Phase 0 adds no UI.
Expected: Home renders, Journey card shows the same figures as before, no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/domain/__tests__/parity.test.mjs
git commit -m "Add parity harness between the two progress engines

Makes the spec's coexistence rule executable: while computeJourney and
journeyProgress both run, any disagreement is a defect in the new model.

The engines count different things by design, so parity is asserted on the
facts they genuinely share — visited restaurants, markets and companions —
plus invariants the new model must never break, including that an
experience shared by two themes is counted in both."
```

---

## Definition of Done for Phase 0

- [ ] `npm test` passes with 101 tests
- [ ] `npm run lint` shows no new warnings
- [ ] `npm run check-data` exits 0
- [ ] `git diff --stat HEAD -- src/data src/components src/App.jsx` is empty
- [ ] The only modified pre-existing file in the whole phase is `package.json` (one added script key)
- [ ] `grep -rn "policy/" src/domain/catalog/ src/domain/capability/ src/domain/types.js` returns nothing
- [ ] `grep -rn "data/journey" src/domain/` returns nothing
- [ ] The running app is visually and behaviourally unchanged

## What Phase 0 deliberately does not do

- No UI is wired to the new model. Screens still read `computeJourney`.
- `computeJourney` is not deleted, deprecated or edited. Removal happens after Phase 2.
- The catalog is a representative seed, not the full content set. Expanding it is content work, and the integrity gate will hold new entries to the same rules.
- No `Event` lifecycle exists yet, so `collectionFeed` treats every seeded market as available. When festivals gain occurrence data, that default is replaced by real availability.
