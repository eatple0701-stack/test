import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// custom.css loads after index.css, so anything it names that index.css also
// names wins — silently, and everywhere, not only where the new thing is
// drawn.
//
// It has happened four times. The font token, the dark-mode branch and the
// section card treatment are written up at the top of custom.css itself. The
// fourth was 2026-09-09: the dish rail on 문화 was given `.story-card`, which
// ThemeStoryCard had been using since long before, so the seven culture cards
// on the same screen lost their padding and type scale to a rule meant for a
// 168px thumbnail. Reported as 글씨가 너무 커져서 글자가 깨져보인다.
//
// The rule that would have caught it, and does now: custom.css may override a
// selector from index.css only where that is the point. Everything else it
// declares has to be a name index.css has never heard of.

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

/** Every class name a stylesheet writes a rule for. */
function classesIn(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Set();
  // Selector lists only — the text before each `{` that is not an at-rule.
  for (const m of withoutComments.matchAll(/(^|})([^{}@]+)\{/g)) {
    for (const c of m[2].matchAll(/\.([A-Za-z_][\w-]*)/g)) out.add(c[1]);
  }
  return out;
}

// Selectors custom.css overrides on purpose. Each one is a deliberate
// override of a shared component, and adding to this list is a decision:
// it means "I know index.css styles this, and I mean to beat it".
// Overrides that were already here on 2026-09-09, when this test was
// written. Each is custom.css deliberately restyling something index.css
// draws — the section cards it undoes, the two buttons, and the match-*
// family from the community deck that predates all of it. The list is a
// baseline, not a blessing: it exists so a NEW collision fails, and the
// right way to add to it is to have decided the override is the point.
const DELIBERATE = new Set([
  'home-section', 'detail-section', 'journal-section',
  'btn-primary', 'btn-secondary',
  // State modifiers, never written alone: they appear only qualified by a
  // class this file owns (.map-places__toggle.is-open), so they change
  // nothing index.css draws. The check reads class names and cannot see
  // that qualification, which is the one thing it is blind to.
  'is-on', 'is-open',
  // Same case, added 2026-09-10 when the map list became a drag-to-open
  // sheet. custom.css writes .taste-map__dishes.is-dragging for the passport
  // rail; index.css writes .map-overlay__panel.is-dragging for the sheet.
  // Both are qualified by a class their own file owns, so neither reaches
  // the other — and the check, which reads class names, cannot see that.
  'is-dragging',
  'match-modal-backdrop', 'match-modal', 'match-tab', 'match-tab__header',
  'match-deck', 'match-card', 'match-card__photo', 'match-card__stamp',
  'match-card__stamp--like', 'match-card__stamp--pass', 'match-card__available',
  'match-card__body', 'match-card__headline', 'match-card__flag',
  'match-card__trip', 'match-card__bio', 'match-card__tags', 'match-card__row',
  'match-drag-surface', 'match-actions',
  // Referenced only to sit something next to it, not to restyle it.
  'table-card',
  // Added when the 2026-09-09 branches met. The first three are the same
  // case as is-on above — they are only ever written qualified by a class
  // custom.css owns (.table-pin--sample .table-pin__body,
  // .map-legend__item--filter.is-on .map-legend__dot) — and this check reads
  // class names, so it cannot see the qualification.
  'table-pin__body', 'map-legend__dot', 'map-legend__dishes',
  // dish-card is a real one, and the point. index.css sizes the deck's card
  // to its own prose, which made the box 465px for 감자탕 and 443px for
  // 부대찌개; custom.css pins it to the stage so all fourteen are one box.
  'dish-card',
]);

test('custom.css does not silently restyle a class index.css owns', () => {
  const owned = classesIn(read('src/index.css'));
  const added = classesIn(read('src/custom.css'));

  const collisions = [...added].filter(c => owned.has(c) && !DELIBERATE.has(c));

  assert.deepEqual(collisions, [],
    `custom.css loads last, so these beat index.css everywhere they appear — ` +
    `rename them, or add them to DELIBERATE if the override is the point: ` +
    collisions.join(', '));
});

test('the dish rail and the culture cards do not share a class', () => {
  // The specific pair that broke 문화 on 2026-09-09. ThemeStoryCard had
  // .story-card first; the rail took .dish-story instead.
  const rail = read('src/components/DishStories.jsx');
  const cards = read('src/components/ThemeStoryCard.jsx');
  assert.ok(cards.includes('story-card'), 'ThemeStoryCard no longer uses story-card — update this test');
  assert.ok(!/className="story-card/.test(rail),
    'the dish rail is using ThemeStoryCard’s class again');
  assert.ok(rail.includes('dish-story'), 'the dish rail lost its own class');
});
