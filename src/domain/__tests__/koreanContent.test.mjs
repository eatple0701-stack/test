import test from 'node:test';
import assert from 'node:assert/strict';
import { menus } from '../catalog/menus.js';
import { themes } from '../catalog/themes.js';
import { EDITORIAL } from '../../content/exploreEditorial.js';
import { PROMISES, PROMISES_LEAD } from '../../content/promises.js';
import { CULTURE_CARDS } from '../../content/cultureCards.js';
import { cultureByCategory, CATEGORY_LABEL, CATEGORY_LABEL_KO } from '../../data/culture.js';
import {
  traditionalMarkets, seasonalFoods, festivals, courses, featuredZones,
} from '../../data/experiences.js';
import { restaurants } from '../../data/restaurants.js';
import { VEGAN_LABEL, VEGAN_LABEL_KO, HALAL_LABEL, HALAL_LABEL_KO } from '../../data/verification.js';
import { emptyText, EMPTY } from '../policy/emptiness.js';
import { reasonFor } from '../policy/recommendation.js';

// The Korean interface is only as complete as the data behind it. The setting
// itself has worked since 2026-08-11; what made it look broken was 960 English
// words with no Korean twin, on four tabs whose headings were already Korean.
//
// These assert the twins exist. They cannot judge the translation — nobody
// can, from a test — but they catch the failure that actually happened, which
// is a record added later with only its English half, quietly falling back
// and leaving one English paragraph in the middle of a Korean screen.

const hasKorean = (s) => /[가-힣]/.test(String(s ?? ''));

test('every dish carries its four paragraphs in Korean', () => {
  for (const m of menus) {
    for (const f of ['gloss', 'whyShared', 'howItWorks', 'culture']) {
      assert.ok(m[`${f}Ko`], `${m.id} has no ${f}Ko`);
      assert.ok(hasKorean(m[`${f}Ko`]), `${m.id}'s ${f}Ko is not Korean`);
    }
  }
});

test('every theme and its cover question exist in Korean', () => {
  for (const t of themes) {
    for (const f of ['title', 'tagline', 'narrative']) {
      assert.ok(hasKorean(t[`${f}Ko`]), `${t.id} has no ${f}Ko`);
    }
    const ed = EDITORIAL[t.id];
    if (ed) assert.ok(hasKorean(ed.questionKo), `${t.id} has no Korean question`);
  }
});

test('the promises and the culture cards are written twice', () => {
  for (const p of PROMISES) assert.ok(hasKorean(p.ko), `${p.id} has no Korean`);
  assert.ok(hasKorean(PROMISES_LEAD.ko));
  for (const c of CULTURE_CARDS) {
    assert.ok(hasKorean(c.titleKo), `${c.title} has no Korean title`);
    assert.ok(hasKorean(c.descKo), `${c.title} has no Korean description`);
  }
});

test('every place-tab card has a Korean half', () => {
  for (const m of traditionalMarkets) assert.ok(hasKorean(m.blurbKo), `${m.id}`);
  for (const f of seasonalFoods) assert.ok(hasKorean(f.blurbKo), `${f.id}`);
  for (const f of festivals) assert.ok(hasKorean(f.blurbKo), `${f.id}`);
  for (const c of courses) assert.ok(hasKorean(c.titleKo), `${c.id}`);
  for (const z of featuredZones) assert.ok(hasKorean(z.blurbKo), `${z.name}`);
  // The one editorial line on a restaurant record. The facts around it —
  // address, hours, dietary — are deliberately not translated: an address in
  // Korean is a different string, not a different language.
  for (const r of restaurants) assert.ok(hasKorean(r.vibeKo), `${r.id} has no vibeKo`);
});

test('every culture category is written in both languages', () => {
  const fields = [
    'didYouKnow', 'diningTips', 'whyLocalsLoveIt', 'conversationTips',
    'passportMission', 'culturalMeaning', 'whenKoreansEatThis',
  ];
  for (const [key, c] of Object.entries(cultureByCategory)) {
    for (const f of fields) {
      const ko = c[`${f}Ko`];
      assert.ok(ko, `${key} has no ${f}Ko`);
      const text = Array.isArray(ko) ? ko.join(' ') : (ko.title ? `${ko.title} ${ko.detail}` : ko);
      assert.ok(hasKorean(text), `${key}'s ${f}Ko is not Korean`);
    }
    // Lists must be the same length in both languages, or a tip disappears in
    // one setting and nobody notices until somebody reads that screen.
    assert.equal(c.diningTipsKo.length, c.diningTips.length, `${key} tip counts differ`);
    assert.equal(c.conversationTipsKo.length, c.conversationTips.length, `${key} conversation counts differ`);
  }
  // Category labels are keyed identically so a new category cannot fall
  // through to nothing.
  for (const k of Object.keys(CATEGORY_LABEL)) {
    assert.ok(hasKorean(CATEGORY_LABEL_KO[k]), `${k} has no Korean label`);
  }
});

test('the dietary badges keep the same keys in both languages', () => {
  assert.deepEqual(Object.keys(VEGAN_LABEL), Object.keys(VEGAN_LABEL_KO));
  assert.deepEqual(Object.keys(HALAL_LABEL), Object.keys(HALAL_LABEL_KO));
});

test('the two policies that write their own sentences answer in Korean', () => {
  // These are not translated by a component: the policy assembles them from a
  // theme name, a count and a date, so it has to know the language itself.
  for (const reason of [EMPTY.NONE, EMPTY.DAY, EMPTY.DISH, EMPTY.GENDER]) {
    const ko = emptyText(reason, { locale: 'ko' });
    assert.ok(hasKorean(ko.title), `${reason} title`);
    assert.ok(hasKorean(ko.body), `${reason} body`);
    // …and the default is untouched, so the reviewed screens are unchanged.
    assert.equal(hasKorean(emptyText(reason).title), false);
  }
  for (const t of themes) {
    const ko = reasonFor(t, { at: new Date('2026-07-15T12:00:00'), locale: 'ko' });
    assert.ok(hasKorean(ko), `${t.id} has an English reason in Korean mode`);
  }
});
