import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { restaurants } from '../../data/restaurants.js';
import { isQuarantined } from '../../data/verification.js';
import { hiddenGemIds, weekendPickIds, traditionalMarkets, festivals } from '../../data/experiences.js';
import { cityOf, citiesOf, cityName, CITY_LABEL } from '../../data/cities.js';
import { REGISTRY_TOTAL } from '../../data/nearbyPlaces.js';

// What a reviewer found on the Places tab on 2026-08-30, and what stops each
// of those things coming back.
//
// The common shape of all four is worth naming once: none of them was a
// missing feature. The addresses existed, the hours existed, the city was in
// every zone string, and both counts were real. They were unusable anyway —
// one screen away, or in the wrong typeface, or standing next to a number
// that made them look wrong. So these assertions are about what reaches the
// reader, not about what the data holds.

// Line endings normalised — see englishScreen.test.mjs for why.
const src = (f) => fs.readFileSync(path.join(process.cwd(), f), 'utf8').replace(/\r\n/g, '\n');
const placesTab = src('src/components/PlacesTab.jsx');
const placeCard = src('src/components/PlaceCard.jsx');
const css = src('src/index.css');

const active = restaurants.filter(r => !isQuarantined(r));

// ── A2 · one place, one appearance ───────────────────────────────────────

test('the hand-picked rails still overlap, which is why the dedupe exists', () => {
  // If this ever fails because the lists were pulled apart by hand, the
  // dedupe is no longer load-bearing and this file should say so rather than
  // quietly testing nothing. Nono Shop was in three rails at once.
  const picked = [...weekendPickIds, ...hiddenGemIds];
  const seen = new Set();
  const dupes = picked.filter(id => (seen.has(id) ? true : (seen.add(id), false)));
  assert.ok(dupes.length > 0, 'no overlap left in the source lists — see the comment above');
});

test('PlacesTab claims each place once, in render order', () => {
  assert.match(placesTab, /function oneAppearance\(\)/);
  // Every place-bearing rail must go through claim/claimAll. A rail that
  // reads its raw list again is the bug, re-introduced.
  for (const rail of ['spotlight:', 'stories:', 'weekend:', 'hiddenGems:']) {
    const line = placesTab.split('\n').find(l => l.trim().startsWith(rail));
    assert.ok(line, `rail ${rail} not found`);
    assert.match(line, /once\.claimAll\(/, `rail ${rail} does not claim its places`);
  }
  assert.match(placesTab, /todaysPick: todays/);
  assert.match(placesTab, /once\.claim\(pool\[dayOfYear/);
});

test('a rail that empties out does not render a heading over nothing', () => {
  // Festival Picks shipped as a heading with no content and read as broken.
  // Deduping and city-filtering can empty four more rails the same way, so
  // every one of them is guarded on having something to show.
  for (const guard of [
    'todaysPick &&',
    'markets.length > 0 &&',
    'spotlightRail.length > 0 &&',
    'storyRail.length > 0 &&',
    'courseRail.length > 0 &&',
    'weekendPicks.length > 0 &&',
    'hiddenGemPicks.length > 0 &&',
    'seasonalFoods.length > 0 &&',
    'festivals.length > 0 && !city &&',
    'zoneRail.length > 0 &&',
  ]) {
    assert.ok(placesTab.includes(guard), `rail not guarded: ${guard}`);
  }
});

// ── A3 · the city, made legible ──────────────────────────────────────────

test('cityOf reads the last segment, not the second', () => {
  assert.equal(cityOf('Jongno, Seoul'), 'Seoul');
  assert.equal(cityOf('Songdo, Incheon'), 'Incheon');
  // The one three-part zone in the data. Taking parts[1] would put Sinpo
  // market in a city called Jemulpo-gu.
  assert.equal(cityOf('Chinatown, Jemulpo-gu, Incheon'), 'Incheon');
  // A bare neighbourhood has no city we know. Guessing one would file a
  // place under the wrong chip, which is worse than showing no chip.
  assert.equal(cityOf('Insadong'), null);
  assert.equal(cityOf(undefined), null);
  assert.equal(cityOf(''), null);
});

test('every curated place and market resolves to a city', () => {
  for (const p of active) {
    assert.ok(cityOf(p.zone), `${p.id} has no city in its zone: ${p.zone}`);
  }
  for (const m of traditionalMarkets) {
    assert.ok(cityOf(m.zone), `market ${m.id} has no city in its zone: ${m.zone}`);
  }
});

test('the filter offers exactly the cities the places are in', () => {
  const offered = citiesOf(active);
  const actual = [...new Set(active.map(p => cityOf(p.zone)))];
  assert.deepEqual([...offered].sort(), actual.sort());
  assert.ok(offered.length > 1, 'a one-city catalogue needs no city filter');
});

test('every offered city has a name in all six other languages', () => {
  // cityName hands the seven strings straight to say(), so the way to see
  // them from a test is to be the say() it calls.
  const collect = (...args) => args;
  for (const c of citiesOf(active)) {
    const words = cityName(collect, c);
    assert.equal(words.length, 7, `${c} does not fill say()`);
    // English is the fallback, so an untranslated city is invisible to an
    // English reader — the exact hole the i18n audit exists for. Assert the
    // translation is present rather than that the fallback works.
    assert.ok(CITY_LABEL[c], `${c} is offered as a filter chip but has no translations`);
    for (const [i, w] of words.entries()) {
      assert.ok(w && String(w).trim(), `${c} has an empty name at index ${i}`);
    }
  }
});

test('every city that can be offered has a chip colour', () => {
  for (const c of citiesOf(active)) {
    // Anchored at the start of a line on purpose. A bare includes() also
    // matches `:root[data-theme="dark"] .city-chip--incheon {`, so deleting
    // the light-mode rule left this test green while the chip rendered grey
    // for every reader not in dark mode — the test passing on the dark half
    // of a bug whose light half was the shipped one.
    const rule = new RegExp(`^\\.city-chip--${c.toLowerCase()} \\{`, 'm');
    assert.match(css, rule, `no light-mode .city-chip--${c.toLowerCase()} rule — the chip falls back to grey`);
  }
});

test('the cards that carry a place render the city chip', () => {
  assert.match(placeCard, /city-chip city-chip--/);
  assert.match(placesTab, /city-chip city-chip--/);      // today's spotlight
  assert.match(placesTab, /className="city-filter"/);
});

test('no rail contradicts the city chip the reader just pressed', () => {
  // A festival record has a location in its title and no field to filter on,
  // so with Incheon selected the tab still offered the Seoul Lantern
  // Festival, Boryeong and Andong. A filter that leaves four cards about
  // other cities on screen has told the reader it does less than it does.
  assert.equal(festivals.every(f => !('city' in f) && !('zone' in f)), true,
    'festivals now carry a location — filter them properly instead of hiding the rail');
  assert.match(placesTab, /\{festivals\.length > 0 && !city && \(/);
  // Seasonal foods and the culture cards claim no location at all, so they
  // survive a city filter honestly and must not be hidden with it.
  assert.match(placesTab, /\{seasonalFoods\.length > 0 && \(/);
  assert.match(placesTab, /\{CULTURE_CARDS\.length > 0 && \(/);
});

// ── A1 · open state, from the record the card already had ────────────────

test('PlaceCard reads hours and coordinates off the place, and invents neither', () => {
  assert.match(placeCard, /getOpenStatus\(place\.hours, new Date\(\), locale\)/);
  assert.match(placeCard, /directionsUrl\(place\)/);
  // Rendered only when the record has them. `Hours unknown` and a directions
  // link to nowhere are both worse than an absent line.
  assert.match(placeCard, /\{status && \(/);
  assert.match(placeCard, /\{hasCoords && \(/);
});

test('the map row translates its own open/closed words', () => {
  // getOpenStatus takes a locale and defaults to English. The map row never
  // passed one, so every reader saw `Open · closes 10:00 PM` in English —
  // a miss the string-table audit cannot see, because the Korean was never
  // a string in a table to be missing.
  const list = src('src/components/BottomSheetList.jsx');
  assert.match(list, /getOpenStatus\(place\.hours, new Date\(\), locale\)/);
});

test('the browse card owns its layout instead of inheriting the map row\'s', () => {
  // `.place-card` is declared twice in index.css, ~2500 lines apart, for two
  // different components. The browse card was silently picking up the map
  // row's `display: grid; grid-template-columns: 112px 1fr`, which was
  // invisible while it had one child in flow and put the Directions link in
  // the second column the moment it had two.
  assert.match(placeCard, /className="place-card place-card--browse"/);
  assert.match(css, /^\.place-card--browse \{/m);
  const block = css.slice(css.indexOf('.place-card--browse {'));
  const decls = block.slice(0, block.indexOf('}'));
  assert.match(decls, /display: flex/, 'the browse card must state its own display');
});

test('no distance is printed where there is no reference point', () => {
  // The map's `600 m` is measured from the map's own centre, which the
  // reader dragged there. The Places tab has no map and no centre, so the
  // same number would be measured from a fixed point near Myeongdong that
  // nothing on screen mentions. That is the `98% Match` banner again.
  assert.doesNotMatch(placeCard, /formatDistance|haversineKm/);
});

// ── A7 · the two numbers, said together ──────────────────────────────────

test('REGISTRY_TOTAL matches what the map will actually load', () => {
  const index = JSON.parse(src('public/data/seoul/index.json'));
  const summed = index.districts.reduce((n, d) => n + d.count, 0);
  assert.equal(
    REGISTRY_TOTAL, summed,
    'REGISTRY_TOTAL has drifted from public/data/seoul/index.json — rebuild or correct it',
  );
});

test('the header says both numbers and what separates them', () => {
  assert.match(placesTab, /REGISTRY_TOTAL/);
  assert.match(placesTab, /activePlaces\.length/);
  assert.match(placesTab, /screen-head__note/);
  assert.ok(css.includes('.screen-head__note {'), 'the note has no style — it would inherit the sub');
  // The distinction is the whole point: one set was visited, the other was
  // not. A note that drops that clause is just a bigger number.
  assert.match(placesTab, /went to and wrote up/);
  assert.match(placesTab, /Nobody here has been to those/);
});

test('the counts in the header are computed, never typed', () => {
  // 18 and 8,118 both move — a curated place is added, the register is
  // rebuilt. A typed number is a claim that goes stale silently.
  const header = placesTab.slice(placesTab.indexOf('screen-head__sub'), placesTab.indexOf('city-filter"'));
  assert.doesNotMatch(header, /\b18\b/);
  assert.doesNotMatch(header, /8,?118/);
});
