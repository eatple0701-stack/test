// A recommendation reason is a claim made to a traveller, so these tests are
// about honesty as much as behaviour: the app may only say things it can
// actually support from the catalogue, the clock and the traveller's own
// records. The forbidden-vocabulary test at the bottom is the guard rail —
// weather, crowding and popularity have no source wired in, and a reason that
// mentions them is fabrication however well it reads.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { reasonFor, themeOfTheDay } from '../policy/recommendation.js';
import { themeById, themes } from '../catalog/index.js';

const noodleRoad = themeById('noodle-road');
const templeLife = themeById('temple-life');
const busan = themeById('busan-seafood');

test('a theme finished this session leads the reason', () => {
  const reason = reasonFor(noodleRoad, { justFinished: templeLife });
  assert.match(reason, /just finished Temple Life/);
});

test('"carries on" is only claimed where a collection actually holds both', () => {
  // Both sit in Seoul for First-Timers, so continuity is a catalogue fact.
  const linked = reasonFor(noodleRoad, { justFinished: templeLife });
  assert.match(linked, /Seoul for First-Timers/);

  // Busan Seafood is in no collection with Temple Life. The reason must not
  // invent a connection to make the handoff sound smoother.
  const unlinked = reasonFor(busan, { justFinished: templeLife });
  assert.doesNotMatch(unlinked, /carries on/);
  assert.match(unlinked, /somewhere different/);
});

test('a theme does not recommend itself on the strength of its own completion', () => {
  const reason = reasonFor(templeLife, { justFinished: templeLife });
  assert.doesNotMatch(reason, /just finished/);
});

test('"not opened yet" is only said to a traveller who has opened something', () => {
  const toBeginner = reasonFor(noodleRoad, { untouched: true, hasAnyProgress: false });
  assert.doesNotMatch(toBeginner, /not opened/);

  const toReturner = reasonFor(noodleRoad, { untouched: true, hasAnyProgress: true });
  assert.match(toReturner, /not opened this one yet/);
});

test('a seasonal reason only appears in its own season', () => {
  const inSeason = reasonFor(busan, { at: new Date('2026-07-15T12:00:00') });
  assert.match(inSeason, /market opens at dawn/);

  const outOfSeason = reasonFor(busan, { at: new Date('2026-01-15T12:00:00') });
  assert.doesNotMatch(outOfSeason, /market opens at dawn/);
});

test('proximity is claimed only from zones the traveller has eaten in', () => {
  const reason = reasonFor(templeLife, {
    at: new Date('2026-01-15T12:00:00'),
    visitedZones: ['Jongno, Seoul'],
  });
  assert.match(reason, /Jongno/);
});

test('every theme yields a reason in every month, at any hour', () => {
  for (const theme of themes) {
    for (let month = 1; month <= 12; month += 1) {
      for (const hour of [9, 20]) {
        const at = new Date(2026, month - 1, 15, hour);
        const reason = reasonFor(theme, { at });
        assert.equal(typeof reason, 'string');
        assert.ok(reason.length > 0, `${theme.id} produced an empty reason`);
      }
    }
  }
});

test('no reason claims data the app does not hold', () => {
  // Every branch reachable from a plausible context, checked against the
  // vocabulary of things we cannot know.
  const forbidden =
    /weather|rain|sunny|cold enough|warm(est)? |crowd|busiest|busy|queue|popular|trending|everyone|best.rated/i;
  const contexts = [
    {},
    { justFinished: templeLife },
    { untouched: true, hasAnyProgress: true },
    { visitedZones: ['Jongno, Seoul'] },
    { hasStarted: true },
  ];
  for (const theme of themes) {
    for (let month = 1; month <= 12; month += 1) {
      for (const context of contexts) {
        const reason = reasonFor(theme, { ...context, at: new Date(2026, month - 1, 15, 20) });
        assert.doesNotMatch(reason, forbidden, `${theme.id}: ${reason}`);
      }
    }
  }
});

test('themeOfTheDay is stable within a day and skips what is excluded', () => {
  const morning = themeOfTheDay({ at: new Date('2026-07-15T08:00:00') });
  const evening = themeOfTheDay({ at: new Date('2026-07-15T22:00:00') });
  assert.equal(morning.id, evening.id);

  const without = themeOfTheDay({ at: new Date('2026-07-15T08:00:00'), exclude: [morning.id] });
  assert.notEqual(without.id, morning.id);
});
