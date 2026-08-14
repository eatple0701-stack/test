import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { menus } from '../catalog/menus.js';
import { themes } from '../catalog/themes.js';
import { EDITORIAL } from '../../content/exploreEditorial.js';
import { PROMISES, PROMISES_LEAD } from '../../content/promises.js';
import { CULTURE_CARDS } from '../../content/cultureCards.js';
import {
  cultureByCategory, CATEGORY_LABEL, CATEGORY_LABEL_AR, ZONE_KO, ZONE_AR,
} from '../../data/culture.js';
import {
  traditionalMarkets, seasonalFoods, festivals, courses, featuredZones,
} from '../../data/experiences.js';
import { restaurants } from '../../data/restaurants.js';
import {
  VEGAN_LABEL, VEGAN_LABEL_AR, HALAL_LABEL, HALAL_LABEL_AR, TRUST_LABEL_AR,
} from '../../data/verification.js';
import { GATE_TEXT } from '../policy/access.js';
import { emptyText, EMPTY } from '../policy/emptiness.js';
import { reasonFor } from '../policy/recommendation.js';
import { experiences } from '../catalog/experiences.js';
import { narratives, narrativeSteps } from '../catalog/narratives.js';
import { LOCAL_TIPS, routeFor } from '../../data/journey.js';
import { getOpenStatus } from '../../utils.js';
import { tableCtaFor, transitLine, MAP_LINKS_NOTE } from '../policy/venue.js';
import { LOCALE, isRtl, directionOf, dateLocale } from '../policy/locale.js';

// The Arabic twin of frenchContent.test.mjs, and one thing the other four did
// not need: direction. An interface can hold every Arabic word and still not
// be an Arabic interface if it is laid out left to right, so the last two
// tests here are about the layout rather than the words.
//
// Same limitation as its siblings: these assert that a translation exists, not
// that it is good. What they catch is the failure the fallback creates —
// say(en, ko, es, fr, ar) returns the English when the Arabic is missing, so
// an untranslated record is invisible to anybody who reads English.

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
// Arabic script, so a Latin string sitting in an Ar field is caught rather
// than counted. Proper nouns are exempted where they legitimately appear.
const isArabic = (s) => /[؀-ۿ]/.test(s);

test('every dish carries its four paragraphs in Arabic', () => {
  for (const m of menus) {
    for (const f of ['gloss', 'whyShared', 'howItWorks', 'culture']) {
      assert.ok(nonEmpty(m[`${f}Ar`]), `${m.id} has no ${f}Ar`);
      assert.ok(isArabic(m[`${f}Ar`]), `${m.id}'s ${f}Ar is not in Arabic script`);
    }
  }
});

test('every theme, its tagline and its cover question exist in Arabic', () => {
  for (const t of themes) {
    for (const f of ['title', 'tagline', 'narrative']) {
      assert.ok(nonEmpty(t[`${f}Ar`]), `${t.id} has no ${f}Ar`);
      assert.ok(isArabic(t[`${f}Ar`]), `${t.id}'s ${f}Ar is not in Arabic script`);
    }
    const ed = EDITORIAL[t.id];
    if (ed) {
      assert.ok(nonEmpty(ed.questionAr), `${t.id} has no Arabic question`);
      // Arabic writes its question mark mirrored. Accepting either keeps the
      // rule about being a question without dictating the glyph.
      assert.ok(/[?؟]/.test(ed.questionAr), `${t.id}'s Arabic is not a question`);
    }
  }
});

test('the promises, the gates and the culture cards are written in Arabic', () => {
  for (const p of PROMISES) assert.ok(isArabic(p.ar ?? ''), `${p.id} has no Arabic`);
  assert.ok(isArabic(PROMISES_LEAD.ar ?? ''));
  assert.ok(isArabic(PROMISES_LEAD.titleAr ?? ''));
  for (const [door, gate] of Object.entries(GATE_TEXT)) {
    assert.ok(isArabic(gate.titleAr ?? ''), `gate ${door} has no titleAr`);
    assert.ok(isArabic(gate.bodyAr ?? ''), `gate ${door} has no bodyAr`);
    assert.ok(isArabic(gate.ctaAr ?? ''), `gate ${door} has no ctaAr`);
  }
  for (const c of CULTURE_CARDS) {
    assert.ok(isArabic(c.titleAr ?? ''), `${c.title} has no Arabic title`);
    assert.ok(isArabic(c.descAr ?? ''), `${c.title} has no Arabic description`);
  }
});

test('every place-tab card has an Arabic half', () => {
  for (const m of traditionalMarkets) assert.ok(isArabic(m.blurbAr ?? ''), m.id);
  for (const f of seasonalFoods) {
    assert.ok(isArabic(f.blurbAr ?? ''), f.id);
    assert.ok(isArabic(f.seasonAr ?? ''), `${f.id} has no Arabic season`);
  }
  for (const f of festivals) {
    assert.ok(isArabic(f.blurbAr ?? ''), f.id);
    assert.ok(isArabic(f.whenAr ?? ''), `${f.id} has no Arabic month`);
  }
  for (const c of courses) {
    assert.ok(isArabic(c.titleAr ?? ''), c.id);
    assert.ok(isArabic(c.durationAr ?? ''), `${c.id} has no Arabic duration`);
  }
  for (const z of featuredZones) assert.ok(isArabic(z.blurbAr ?? ''), z.name);
  for (const r of restaurants) {
    assert.ok(isArabic(r.vibeAr ?? ''), `${r.id} has no vibeAr`);
    assert.ok(isArabic(r.storyAr ?? ''), `${r.id} has no storyAr`);
  }
});

test('every menu item on a place page is named in Arabic', () => {
  for (const r of restaurants) {
    for (const item of r.menus?.value ?? []) {
      assert.ok(nonEmpty(item.nameAr), `${r.id}: "${item.name}" has no nameAr`);
    }
  }
});

test('every culture category is written in Arabic too', () => {
  const fields = [
    'didYouKnow', 'diningTips', 'whyLocalsLoveIt', 'conversationTips',
    'passportMission', 'culturalMeaning', 'whenKoreansEatThis',
  ];
  for (const [key, c] of Object.entries(cultureByCategory)) {
    for (const f of fields) assert.ok(c[`${f}Ar`], `${key} has no ${f}Ar`);
    assert.equal(c.diningTipsAr.length, c.diningTips.length, `${key} tip counts differ`);
    assert.equal(c.conversationTipsAr.length, c.conversationTips.length, `${key} conversation counts differ`);
    assert.ok(isArabic(c.passportMissionAr.title));
    assert.ok(isArabic(c.passportMissionAr.detail));
    for (const phrase of c.usefulKorean ?? []) {
      assert.ok(isArabic(phrase.ar ?? ''), `${key}: "${phrase.ko}" has no Arabic gloss`);
    }
  }
});

test('the label maps keep the same keys in Arabic', () => {
  assert.deepEqual(Object.keys(CATEGORY_LABEL), Object.keys(CATEGORY_LABEL_AR));
  assert.deepEqual(Object.keys(VEGAN_LABEL), Object.keys(VEGAN_LABEL_AR));
  assert.deepEqual(Object.keys(HALAL_LABEL), Object.keys(HALAL_LABEL_AR));
  assert.deepEqual(Object.keys(ZONE_KO), Object.keys(ZONE_AR));
  assert.deepEqual(Object.keys(TRUST_LABEL_AR).sort(), ['Inferred', 'Official', 'Reported']);
});

test('the sentence-writing policies answer in Arabic', () => {
  for (const reason of [EMPTY.NONE, EMPTY.DAY, EMPTY.DISH, EMPTY.GENDER]) {
    const ar = emptyText(reason, { locale: 'ar' });
    assert.ok(isArabic(ar.title), `${reason} title`);
    assert.ok(isArabic(ar.body), `${reason} body`);
  }
  for (const t of themes) {
    assert.ok(isArabic(reasonFor(t, { at: new Date('2026-07-15T12:00:00'), locale: 'ar' })), `${t.id}`);
  }
  assert.equal(emptyText(EMPTY.NONE).title, 'No tables open this week.');
});

test('the policies that assemble a sentence around a name speak Arabic', () => {
  const meal = restaurants.find(r => (r.menus?.value ?? []).length > 0);
  const cta = tableCtaFor(meal, 'ar');
  assert.ok(isArabic(cta.title));
  assert.ok(isArabic(cta.sub));

  const withTransit = restaurants.find(r => r.transit?.value?.station);
  assert.ok(isArabic(transitLine(withTransit).ar), 'the station line has no Arabic');
  assert.ok(isArabic(MAP_LINKS_NOTE.ar), 'the map-links note has no Arabic');

  const hours = { known: true, value: { weekly: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } } };
  const shut = getOpenStatus(hours, new Date('2026-08-17T12:00:00'), 'ar');
  assert.equal(shut.label, 'مغلق');
  assert.ok(isArabic(shut.detail));
});

test('the journey tips and route steps are written in Arabic', () => {
  for (const [key, tips] of Object.entries(LOCAL_TIPS)) {
    for (const t of tips) {
      assert.ok(isArabic(t.tagAr ?? ''), `${key}: "${t.tag}" has no tagAr`);
      assert.ok(isArabic(t.detailAr ?? ''), `${key}: "${t.tag}" has no detailAr`);
    }
  }
  for (const key of Object.keys(LOCAL_TIPS)) {
    for (const step of routeFor({ category: key })) {
      assert.ok(nonEmpty(step.labelAr), `${key}: "${step.label}" has no labelAr`);
      assert.ok(isArabic(step.noteAr ?? ''), `${key}: "${step.label}" has no noteAr`);
    }
  }
});

test('the theme screens carry Arabic too', () => {
  for (const e of experiences) {
    for (const f of ['title', 'whyItMatters', 'culturalMeaning', 'whenToExperience']) {
      assert.ok(isArabic(e[`${f}Ar`] ?? ''), `${e.id} has no ${f}Ar`);
    }
    assert.ok(isArabic(e.missionAr?.title ?? ''), `${e.id} mission has no Arabic title`);
    assert.ok(isArabic(e.missionAr?.detail ?? ''), `${e.id} mission has no Arabic detail`);
  }
  for (const n of narratives) {
    for (const f of ['title', 'intro', 'outro']) {
      assert.ok(isArabic(n[`${f}Ar`] ?? ''), `${n.id} has no ${f}Ar`);
    }
  }
  for (const step of narrativeSteps.filter(x => x.transition)) {
    assert.ok(
      isArabic(step.transitionAr ?? ''),
      `${step.narrativeId}/${step.experienceId} has no Arabic transition`,
    );
  }
});

// ── The part that is not about words ────────────────────────────────────────

test('Arabic is the one locale that reads right to left', () => {
  assert.equal(isRtl(LOCALE.AR), true);
  for (const l of [LOCALE.BOTH, LOCALE.KO, LOCALE.EN, LOCALE.ES, LOCALE.FR]) {
    assert.equal(isRtl(l), false, `${l} should not be right-to-left`);
  }
  assert.equal(directionOf(LOCALE.AR), 'rtl');
  assert.equal(directionOf(LOCALE.EN), 'ltr');
  // An unknown value must not silently flip the whole layout.
  assert.equal(directionOf('zz'), 'ltr');
  // ar-EG keeps the Gregorian calendar and Western digits, so a printed date
  // matches the one on the restaurant's door. ar-SA would switch to Hijri.
  assert.equal(dateLocale(LOCALE.AR), 'ar-EG');
});

test('the stylesheet is written in logical properties, so the layout can mirror', () => {
  // A right-to-left interface mirrors only if the stylesheet says "the side
  // the text starts on" rather than "the left". These are the physical
  // properties that would pin an element to one side whatever the language.
  const css = fs.readFileSync('src/index.css', 'utf8');
  const lines = css.split('\n');
  const physical = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (/^(margin|padding|border)-(left|right)\s*:/.test(t)) physical.push([i + 1, t]);
    if (/^text-align:\s*(left|right)\s*;/.test(t)) physical.push([i + 1, t]);
  });
  assert.deepEqual(physical, [], 'physical direction properties are back in the stylesheet');

  // And the document has to carry the direction, which is what makes the
  // browser mirror the layout rather than the stylesheet guessing.
  const filter = fs.readFileSync('src/components/LocaleFilter.jsx', 'utf8');
  assert.ok(filter.includes("setAttribute('dir', directionOf(locale))"),
    'LocaleFilter should put the direction on the document');
});
