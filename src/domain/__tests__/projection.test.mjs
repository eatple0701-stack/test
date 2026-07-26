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
