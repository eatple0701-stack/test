import test from 'node:test';
import assert from 'node:assert/strict';
import { menus } from '../catalog/menus.js';
import { themes } from '../catalog/themes.js';
import { EDITORIAL } from '../../content/exploreEditorial.js';
import { PROMISES, PROMISES_LEAD } from '../../content/promises.js';
import { CULTURE_CARDS } from '../../content/cultureCards.js';
import {
  cultureByCategory, CATEGORY_LABEL, CATEGORY_LABEL_ES, ZONE_KO, ZONE_ES,
} from '../../data/culture.js';
import {
  traditionalMarkets, seasonalFoods, festivals, courses, featuredZones,
} from '../../data/experiences.js';
import { restaurants } from '../../data/restaurants.js';
import {
  VEGAN_LABEL, VEGAN_LABEL_ES, HALAL_LABEL, HALAL_LABEL_ES, TRUST_LABEL_ES,
} from '../../data/verification.js';
import { GATE_TEXT } from '../policy/access.js';
import { emptyText, EMPTY } from '../policy/emptiness.js';
import { reasonFor } from '../policy/recommendation.js';
import { experiences } from '../catalog/experiences.js';
import { narratives, narrativeSteps } from '../catalog/narratives.js';

// The Spanish twin of koreanContent.test.mjs, and the same limitation: these
// assert that a translation exists, not that it is good. What they catch is
// the failure mode the fallback creates — say(en, ko, es) returns the English
// when the Spanish is missing, so an untranslated record is invisible on
// screen and would otherwise only be found by somebody reading Spanish.
//
// Deliberately not asserted: that Spanish contains no English words. Half the
// nouns here are Korean loanwords that stay as they are in every language
// (jajangmyeon, banchan, hanok), and a rule against Latin script would fight
// the content rather than check it.

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

test('every dish carries its four paragraphs in Spanish', () => {
  for (const m of menus) {
    for (const f of ['gloss', 'whyShared', 'howItWorks', 'culture']) {
      assert.ok(nonEmpty(m[`${f}Es`]), `${m.id} has no ${f}Es`);
      assert.notEqual(m[`${f}Es`], m[f], `${m.id}'s ${f}Es is the English copied over`);
    }
  }
});

test('every theme, its tagline and its cover question exist in Spanish', () => {
  for (const t of themes) {
    for (const f of ['title', 'tagline', 'narrative']) {
      assert.ok(nonEmpty(t[`${f}Es`]), `${t.id} has no ${f}Es`);
    }
    const ed = EDITORIAL[t.id];
    if (ed) {
      assert.ok(nonEmpty(ed.questionEs), `${t.id} has no Spanish question`);
      // Still a question, which is the rule exploreEditorial.js sets for the
      // English: a translated headline would break it while looking tidy.
      assert.ok(ed.questionEs.includes('?'), `${t.id}'s Spanish is not a question`);
    }
  }
});

test('the promises, the gates and the culture cards are written in Spanish', () => {
  for (const p of PROMISES) assert.ok(nonEmpty(p.es), `${p.id} has no Spanish`);
  assert.ok(nonEmpty(PROMISES_LEAD.es));
  assert.ok(nonEmpty(PROMISES_LEAD.titleEs));
  for (const [door, gate] of Object.entries(GATE_TEXT)) {
    assert.ok(nonEmpty(gate.bodyEs), `gate ${door} has no bodyEs`);
  }
  for (const c of CULTURE_CARDS) {
    assert.ok(nonEmpty(c.titleEs), `${c.title} has no Spanish title`);
    assert.ok(nonEmpty(c.descEs), `${c.title} has no Spanish description`);
  }
});

test('every place-tab card has a Spanish half', () => {
  for (const m of traditionalMarkets) assert.ok(nonEmpty(m.blurbEs), m.id);
  for (const f of seasonalFoods) assert.ok(nonEmpty(f.blurbEs), f.id);
  for (const f of festivals) {
    assert.ok(nonEmpty(f.blurbEs), f.id);
    assert.ok(nonEmpty(f.whenEs), `${f.id} has no Spanish month`);
  }
  for (const c of courses) assert.ok(nonEmpty(c.titleEs), c.id);
  for (const z of featuredZones) assert.ok(nonEmpty(z.blurbEs), z.name);
  for (const r of restaurants) assert.ok(nonEmpty(r.vibeEs), `${r.id} has no vibeEs`);
});

test('every culture category is written in Spanish too', () => {
  const fields = [
    'didYouKnow', 'diningTips', 'whyLocalsLoveIt', 'conversationTips',
    'passportMission', 'culturalMeaning', 'whenKoreansEatThis',
  ];
  for (const [key, c] of Object.entries(cultureByCategory)) {
    for (const f of fields) {
      assert.ok(c[`${f}Es`], `${key} has no ${f}Es`);
    }
    // Same count in all three languages, or a tip vanishes in one setting.
    assert.equal(c.diningTipsEs.length, c.diningTips.length, `${key} tip counts differ`);
    assert.equal(c.conversationTipsEs.length, c.conversationTips.length, `${key} conversation counts differ`);
    assert.ok(nonEmpty(c.passportMissionEs.title));
    assert.ok(nonEmpty(c.passportMissionEs.detail));
  }
});

test('the label maps keep the same keys in all three languages', () => {
  assert.deepEqual(Object.keys(CATEGORY_LABEL), Object.keys(CATEGORY_LABEL_ES));
  assert.deepEqual(Object.keys(VEGAN_LABEL), Object.keys(VEGAN_LABEL_ES));
  assert.deepEqual(Object.keys(HALAL_LABEL), Object.keys(HALAL_LABEL_ES));
  assert.deepEqual(Object.keys(ZONE_KO), Object.keys(ZONE_ES));
  assert.deepEqual(Object.keys(TRUST_LABEL_ES).sort(), ['Inferred', 'Official', 'Reported']);
});

test('the two sentence-writing policies answer in Spanish', () => {
  for (const reason of [EMPTY.NONE, EMPTY.DAY, EMPTY.DISH, EMPTY.GROUP, EMPTY.GENDER]) {
    const es = emptyText(reason, { locale: 'es' });
    assert.ok(nonEmpty(es.title), `${reason} title`);
    assert.ok(nonEmpty(es.body), `${reason} body`);
    assert.notEqual(es.title, emptyText(reason).title, `${reason} fell through to English`);
  }
  for (const t of themes) {
    const es = reasonFor(t, { at: new Date('2026-07-15T12:00:00'), locale: 'es' });
    assert.ok(nonEmpty(es), `${t.id} has no Spanish reason`);
  }
  // Untouched default, as ever: the reviewed screens do not move.
  assert.equal(emptyText(EMPTY.NONE).title, 'No tables open this week.');
});

test('nothing claims Spanish by holding the English string', () => {
  // The cheapest way to make every assertion above pass is to copy the
  // English into the Es field. This is the check that costs something.
  const copied = [];
  for (const t of themes) {
    if (t.narrativeEs === t.narrative) copied.push(`theme ${t.id}`);
  }
  for (const r of restaurants) {
    if (r.vibeEs === r.vibe) copied.push(`restaurant ${r.id}`);
  }
  for (const [key, c] of Object.entries(cultureByCategory)) {
    if (c.didYouKnowEs === c.didYouKnow) copied.push(`culture ${key}`);
  }
  assert.deepEqual(copied, []);
});

test('the theme screens carry Spanish too', () => {
  for (const e of experiences) {
    for (const f of ['title', 'whyItMatters', 'culturalMeaning', 'whenToExperience']) {
      assert.ok(nonEmpty(e[`${f}Es`]), `${e.id} has no ${f}Es`);
    }
    assert.ok(nonEmpty(e.missionEs?.title), `${e.id} mission has no Spanish title`);
    assert.ok(nonEmpty(e.missionEs?.detail), `${e.id} mission has no Spanish detail`);
  }
  for (const n of narratives) {
    for (const f of ['title', 'intro', 'outro']) {
      assert.ok(nonEmpty(n[`${f}Es`]), `${n.id} has no ${f}Es`);
    }
    assert.notEqual(n.introEs, n.intro, `${n.id}'s Spanish intro is the English copied over`);
  }
  for (const step of narrativeSteps.filter(x => x.transition)) {
    assert.ok(
      nonEmpty(step.transitionEs),
      `${step.narrativeId}/${step.experienceId} has no Spanish transition`,
    );
  }
});
