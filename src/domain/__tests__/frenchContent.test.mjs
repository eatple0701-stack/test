import test from 'node:test';
import assert from 'node:assert/strict';
import { menus } from '../catalog/menus.js';
import { themes } from '../catalog/themes.js';
import { EDITORIAL } from '../../content/exploreEditorial.js';
import { PROMISES, PROMISES_LEAD } from '../../content/promises.js';
import { CULTURE_CARDS } from '../../content/cultureCards.js';
import {
  cultureByCategory, CATEGORY_LABEL, CATEGORY_LABEL_FR, ZONE_KO, ZONE_FR,
} from '../../data/culture.js';
import {
  traditionalMarkets, seasonalFoods, festivals, courses, featuredZones,
} from '../../data/experiences.js';
import { restaurants } from '../../data/restaurants.js';
import {
  VEGAN_LABEL, VEGAN_LABEL_FR, HALAL_LABEL, HALAL_LABEL_FR, TRUST_LABEL_FR,
} from '../../data/verification.js';
import { GATE_TEXT } from '../policy/access.js';
import { emptyText, EMPTY } from '../policy/emptiness.js';
import { reasonFor } from '../policy/recommendation.js';
import { experiences } from '../catalog/experiences.js';
import { narratives, narrativeSteps } from '../catalog/narratives.js';
import { LOCAL_TIPS, routeFor } from '../../data/journey.js';
import { getOpenStatus } from '../../utils.js';
import { tableCtaFor, transitLine, MAP_LINKS_NOTE } from '../policy/venue.js';

// The French twin of spanishContent.test.mjs, and the same limitation: these
// assert that a translation exists, not that it is good. What they catch is
// the failure mode the fallback creates — say(en, ko, es, fr) returns the
// English when the French is missing, so an untranslated record is invisible
// on screen and would otherwise only be found by somebody reading French.
//
// Deliberately not asserted: that the French contains no English words. Half
// the nouns here are Korean loanwords that stay as they are in every language
// (jajangmyeon, banchan, hanok), and a rule against them would fight the
// content rather than check it.

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

test('every dish carries its four paragraphs in French', () => {
  for (const m of menus) {
    for (const f of ['gloss', 'whyShared', 'howItWorks', 'culture']) {
      assert.ok(nonEmpty(m[`${f}Fr`]), `${m.id} has no ${f}Fr`);
      assert.notEqual(m[`${f}Fr`], m[f], `${m.id}'s ${f}Fr is the English copied over`);
    }
  }
});

test('every theme, its tagline and its cover question exist in French', () => {
  for (const t of themes) {
    for (const f of ['title', 'tagline', 'narrative']) {
      assert.ok(nonEmpty(t[`${f}Fr`]), `${t.id} has no ${f}Fr`);
    }
    const ed = EDITORIAL[t.id];
    if (ed) {
      assert.ok(nonEmpty(ed.questionFr), `${t.id} has no French question`);
      // Still a question, which is the rule exploreEditorial.js sets for the
      // English: a translated headline would break it while looking tidy.
      assert.ok(ed.questionFr.includes('?'), `${t.id}'s French is not a question`);
    }
  }
});

test('the promises, the gates and the culture cards are written in French', () => {
  for (const p of PROMISES) assert.ok(nonEmpty(p.fr), `${p.id} has no French`);
  assert.ok(nonEmpty(PROMISES_LEAD.fr));
  assert.ok(nonEmpty(PROMISES_LEAD.titleFr));
  for (const [door, gate] of Object.entries(GATE_TEXT)) {
    assert.ok(nonEmpty(gate.titleFr), `gate ${door} has no titleFr`);
    assert.ok(nonEmpty(gate.bodyFr), `gate ${door} has no bodyFr`);
    assert.ok(nonEmpty(gate.ctaFr), `gate ${door} has no ctaFr`);
  }
  for (const c of CULTURE_CARDS) {
    assert.ok(nonEmpty(c.titleFr), `${c.title} has no French title`);
    assert.ok(nonEmpty(c.descFr), `${c.title} has no French description`);
  }
});

test('every place-tab card has a French half', () => {
  for (const m of traditionalMarkets) assert.ok(nonEmpty(m.blurbFr), m.id);
  for (const f of seasonalFoods) assert.ok(nonEmpty(f.blurbFr), f.id);
  for (const f of festivals) {
    assert.ok(nonEmpty(f.blurbFr), f.id);
    assert.ok(nonEmpty(f.whenFr), `${f.id} has no French month`);
  }
  for (const c of courses) {
    assert.ok(nonEmpty(c.titleFr), c.id);
    assert.ok(nonEmpty(c.durationFr), `${c.id} has no French duration`);
  }
  for (const z of featuredZones) assert.ok(nonEmpty(z.blurbFr), z.name);
  for (const r of restaurants) {
    assert.ok(nonEmpty(r.vibeFr), `${r.id} has no vibeFr`);
    assert.ok(nonEmpty(r.storyFr), `${r.id} has no storyFr`);
  }
});

test('every menu item on a place page is named in French', () => {
  // 56 dish names across 19 kitchens. These are the lines a reader sees after
  // deciding to go, which is exactly where a fallback to English is least
  // forgivable and least visible.
  for (const r of restaurants) {
    for (const item of r.menus?.value ?? []) {
      assert.ok(nonEmpty(item.nameFr), `${r.id}: "${item.name}" has no nameFr`);
    }
  }
});

test('every culture category is written in French too', () => {
  const fields = [
    'didYouKnow', 'diningTips', 'whyLocalsLoveIt', 'conversationTips',
    'passportMission', 'culturalMeaning', 'whenKoreansEatThis',
  ];
  for (const [key, c] of Object.entries(cultureByCategory)) {
    for (const f of fields) {
      assert.ok(c[`${f}Fr`], `${key} has no ${f}Fr`);
    }
    // Same count in every language, or a tip vanishes in one setting.
    assert.equal(c.diningTipsFr.length, c.diningTips.length, `${key} tip counts differ`);
    assert.equal(c.conversationTipsFr.length, c.conversationTips.length, `${key} conversation counts differ`);
    assert.ok(nonEmpty(c.passportMissionFr.title));
    assert.ok(nonEmpty(c.passportMissionFr.detail));
    // The phrasebook glosses: what the Korean means, said in French.
    for (const phrase of c.usefulKorean ?? []) {
      assert.ok(nonEmpty(phrase.fr), `${key}: "${phrase.ko}" has no French gloss`);
    }
  }
});

test('the label maps keep the same keys in French', () => {
  assert.deepEqual(Object.keys(CATEGORY_LABEL), Object.keys(CATEGORY_LABEL_FR));
  assert.deepEqual(Object.keys(VEGAN_LABEL), Object.keys(VEGAN_LABEL_FR));
  assert.deepEqual(Object.keys(HALAL_LABEL), Object.keys(HALAL_LABEL_FR));
  assert.deepEqual(Object.keys(ZONE_KO), Object.keys(ZONE_FR));
  assert.deepEqual(Object.keys(TRUST_LABEL_FR).sort(), ['Inferred', 'Official', 'Reported']);
});

test('the sentence-writing policies answer in French', () => {
  for (const reason of [EMPTY.NONE, EMPTY.DAY, EMPTY.DISH, EMPTY.GENDER]) {
    const fr = emptyText(reason, { locale: 'fr' });
    assert.ok(nonEmpty(fr.title), `${reason} title`);
    assert.ok(nonEmpty(fr.body), `${reason} body`);
    assert.notEqual(fr.title, emptyText(reason).title, `${reason} fell through to English`);
  }
  for (const t of themes) {
    const fr = reasonFor(t, { at: new Date('2026-07-15T12:00:00'), locale: 'fr' });
    assert.ok(nonEmpty(fr), `${t.id} has no French reason`);
  }
  // Untouched default, as ever: the reviewed screens do not move.
  assert.equal(emptyText(EMPTY.NONE).title, 'No tables open this week.');
});

test('the policies that assemble a sentence around a name speak French', () => {
  // These take a locale rather than returning a string to translate, because
  // the sentence is built from a venue name — there is nothing for a caller
  // to hand a translator afterwards.
  const meal = restaurants.find(r => (r.menus?.value ?? []).length > 0);
  const cta = tableCtaFor(meal, 'fr');
  assert.ok(nonEmpty(cta.title));
  assert.ok(nonEmpty(cta.sub));
  assert.notEqual(cta.sub, tableCtaFor(meal, 'both').sub, 'the CTA fell through to English');

  const withTransit = restaurants.find(r => r.transit?.value?.station);
  assert.ok(nonEmpty(transitLine(withTransit).fr), 'the station line has no French');
  assert.ok(nonEmpty(MAP_LINKS_NOTE.fr), 'the map-links note has no French');

  // Opening hours are four words and four phrases, and a missing one shows up
  // as an English word inside a French line rather than as a blank.
  const hours = { known: true, value: { weekly: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } } };
  const shut = getOpenStatus(hours, new Date('2026-08-17T12:00:00'), 'fr');
  assert.equal(shut.label, 'Fermé');
  assert.notEqual(shut.detail, getOpenStatus(hours, new Date('2026-08-17T12:00:00')).detail);
});

test('the journey tips and route steps are written in French', () => {
  for (const [key, tips] of Object.entries(LOCAL_TIPS)) {
    for (const t of tips) {
      assert.ok(nonEmpty(t.tagFr), `${key}: "${t.tag}" has no tagFr`);
      assert.ok(nonEmpty(t.detailFr), `${key}: "${t.tag}" has no detailFr`);
    }
  }
  for (const key of Object.keys(LOCAL_TIPS)) {
    for (const step of routeFor({ category: key })) {
      assert.ok(nonEmpty(step.labelFr), `${key}: "${step.label}" has no labelFr`);
      assert.ok(nonEmpty(step.noteFr), `${key}: "${step.label}" has no noteFr`);
    }
  }
});

test('nothing claims French by holding the English string', () => {
  // The cheapest way to make every assertion above pass is to copy the
  // English into the Fr field. This is the check that costs something.
  const copied = [];
  for (const t of themes) {
    if (t.narrativeFr === t.narrative) copied.push(`theme ${t.id}`);
  }
  for (const r of restaurants) {
    if (r.vibeFr === r.vibe) copied.push(`restaurant ${r.id} vibe`);
    if (r.storyFr === r.story) copied.push(`restaurant ${r.id} story`);
  }
  for (const [key, c] of Object.entries(cultureByCategory)) {
    if (c.didYouKnowFr === c.didYouKnow) copied.push(`culture ${key}`);
  }
  for (const e of experiences) {
    if (e.whyItMattersFr === e.whyItMatters) copied.push(`experience ${e.id}`);
  }
  assert.deepEqual(copied, []);
});

test('the theme screens carry French too', () => {
  for (const e of experiences) {
    for (const f of ['title', 'whyItMatters', 'culturalMeaning', 'whenToExperience']) {
      assert.ok(nonEmpty(e[`${f}Fr`]), `${e.id} has no ${f}Fr`);
    }
    assert.ok(nonEmpty(e.missionFr?.title), `${e.id} mission has no French title`);
    assert.ok(nonEmpty(e.missionFr?.detail), `${e.id} mission has no French detail`);
  }
  for (const n of narratives) {
    for (const f of ['title', 'intro', 'outro']) {
      assert.ok(nonEmpty(n[`${f}Fr`]), `${n.id} has no ${f}Fr`);
    }
    assert.notEqual(n.introFr, n.intro, `${n.id}'s French intro is the English copied over`);
  }
  for (const step of narrativeSteps.filter(x => x.transition)) {
    assert.ok(
      nonEmpty(step.transitionFr),
      `${step.narrativeId}/${step.experienceId} has no French transition`,
    );
  }
});
