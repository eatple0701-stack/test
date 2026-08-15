import test from 'node:test';
import assert from 'node:assert/strict';
import { menus } from '../catalog/menus.js';
import { themes } from '../catalog/themes.js';
import { EDITORIAL } from '../../content/exploreEditorial.js';
import { PROMISES, PROMISES_LEAD } from '../../content/promises.js';
import { CULTURE_CARDS } from '../../content/cultureCards.js';
import {
  cultureByCategory, CATEGORY_LABEL, CATEGORY_LABEL_JA, ZONE_KO, ZONE_JA, ZONE_ZH,
} from '../../data/culture.js';
import {
  traditionalMarkets, seasonalFoods, festivals, courses, featuredZones,
} from '../../data/experiences.js';
import { restaurants } from '../../data/restaurants.js';
import {
  VEGAN_LABEL, VEGAN_LABEL_JA, HALAL_LABEL, HALAL_LABEL_JA, TRUST_LABEL_JA,
} from '../../data/verification.js';
import { GATE_TEXT } from '../policy/access.js';
import { emptyText, EMPTY } from '../policy/emptiness.js';
import { reasonFor } from '../policy/recommendation.js';
import { experiences } from '../catalog/experiences.js';
import { narratives, narrativeSteps } from '../catalog/narratives.js';
import { LOCAL_TIPS, routeFor } from '../../data/journey.js';
import { getOpenStatus } from '../../utils.js';
import { tableCtaFor, transitLine, MAP_LINKS_NOTE } from '../policy/venue.js';
import { LOCALE, isRtl, isKorean, localeText, dateLocale } from '../policy/locale.js';

// The Japanese twin of the other language guards.
//
// Same limitation as its siblings: these assert that a translation exists, not
// that it is good. What they catch is the failure the fallback creates —
// say(…, ja) returns the English when the Japanese is missing, so an
// untranslated record is invisible to anybody who reads English.

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

// Kana — hiragana or katakana.
//
// Not "does it contain kanji", which is what the Chinese guard asks. Japanese
// and Chinese share those characters, so a Han test passes on either language
// and would let one be pasted into the other's field unseen. Kana is what only
// Japanese has, and every sentence of running Japanese contains some. A few
// short labels are pure kanji (文化, 設定) and are checked by value instead.
const KANA = /[ぁ-ゟ゠-ヿ]/;
const isJapanese = (s) => KANA.test(String(s ?? ''));
// For labels too short to be sure to contain kana, only that something is there
// and that it is not Latin prose.
const isCjk = (s) => /[一-鿿ぁ-ゟ゠-ヿ]/.test(String(s ?? ''));

test('every dish carries its four paragraphs in Japanese', () => {
  for (const m of menus) {
    for (const f of ['gloss', 'whyShared', 'howItWorks', 'culture']) {
      assert.ok(nonEmpty(m[`${f}Ja`]), `${m.id} has no ${f}Ja`);
      assert.ok(isCjk(m[`${f}Ja`]), `${m.id}'s ${f}Ja is not Japanese`);
    }
    // The long paragraphs are running prose, so they must contain kana. This
    // is what separates them from a Chinese string sitting in a Ja field.
    for (const f of ['whyShared', 'howItWorks', 'culture']) {
      assert.ok(isJapanese(m[`${f}Ja`]), `${m.id}'s ${f}Ja has no kana — is it Chinese?`);
    }
  }
});

test('every theme, its tagline and its cover question exist in Japanese', () => {
  for (const t of themes) {
    for (const f of ['title', 'tagline', 'narrative']) {
      assert.ok(isCjk(t[`${f}Ja`]), `${t.id} has no ${f}Ja`);
    }
    assert.ok(isJapanese(t.narrativeJa), `${t.id}'s narrativeJa has no kana`);
    const ed = EDITORIAL[t.id];
    if (ed) {
      assert.ok(isJapanese(ed.questionJa ?? ''), `${t.id} has no Japanese question`);
      assert.ok(/[?？]/.test(ed.questionJa), `${t.id}'s Japanese is not a question`);
    }
  }
});

test('the promises, the gates and the culture cards are written in Japanese', () => {
  for (const p of PROMISES) assert.ok(isJapanese(p.ja ?? ''), `${p.id} has no Japanese`);
  assert.ok(isJapanese(PROMISES_LEAD.ja ?? ''));
  assert.ok(isCjk(PROMISES_LEAD.titleJa ?? ''));
  for (const [door, gate] of Object.entries(GATE_TEXT)) {
    assert.ok(isCjk(gate.titleJa ?? ''), `gate ${door} has no titleJa`);
    assert.ok(isJapanese(gate.bodyJa ?? ''), `gate ${door} has no bodyJa`);
    assert.ok(isCjk(gate.ctaJa ?? ''), `gate ${door} has no ctaJa`);
  }
  for (const c of CULTURE_CARDS) {
    assert.ok(isCjk(c.titleJa ?? ''), `${c.title} has no Japanese title`);
    assert.ok(isJapanese(c.descJa ?? ''), `${c.title} has no Japanese description`);
  }
});

test('every place-tab card has a Japanese half', () => {
  for (const m of traditionalMarkets) assert.ok(isJapanese(m.blurbJa ?? ''), m.id);
  for (const f of seasonalFoods) {
    assert.ok(isJapanese(f.blurbJa ?? ''), f.id);
    assert.ok(isCjk(f.seasonJa ?? ''), `${f.id} has no Japanese season`);
  }
  for (const f of festivals) {
    assert.ok(isJapanese(f.blurbJa ?? ''), f.id);
    assert.ok(isCjk(f.whenJa ?? ''), `${f.id} has no Japanese month`);
  }
  for (const c of courses) {
    assert.ok(isCjk(c.titleJa ?? ''), c.id);
    assert.ok(isCjk(c.durationJa ?? ''), `${c.id} has no Japanese duration`);
  }
  for (const z of featuredZones) assert.ok(isCjk(z.blurbJa ?? ''), z.name);
  for (const r of restaurants) {
    assert.ok(isJapanese(r.vibeJa ?? ''), `${r.id} has no vibeJa`);
    assert.ok(isJapanese(r.storyJa ?? ''), `${r.id} has no storyJa`);
  }
});

test('every menu item on a place page is named in Japanese', () => {
  for (const r of restaurants) {
    for (const item of r.menus?.value ?? []) {
      assert.ok(nonEmpty(item.nameJa), `${r.id}: "${item.name}" has no nameJa`);
    }
  }
});

test('every culture category is written in Japanese too', () => {
  const fields = [
    'didYouKnow', 'diningTips', 'whyLocalsLoveIt', 'conversationTips',
    'passportMission', 'culturalMeaning', 'whenKoreansEatThis',
  ];
  for (const [key, c] of Object.entries(cultureByCategory)) {
    for (const f of fields) assert.ok(c[`${f}Ja`], `${key} has no ${f}Ja`);
    assert.ok(isJapanese(c.didYouKnowJa), `${key}'s didYouKnowJa has no kana`);
    assert.equal(c.diningTipsJa.length, c.diningTips.length, `${key} tip counts differ`);
    assert.equal(c.conversationTipsJa.length, c.conversationTips.length, `${key} conversation counts differ`);
    assert.ok(isCjk(c.passportMissionJa.title));
    assert.ok(isJapanese(c.passportMissionJa.detail));
    for (const phrase of c.usefulKorean ?? []) {
      assert.ok(isCjk(phrase.ja ?? ''), `${key}: "${phrase.ko}" has no Japanese gloss`);
    }
  }
});

test('the label maps keep the same keys in Japanese', () => {
  assert.deepEqual(Object.keys(CATEGORY_LABEL), Object.keys(CATEGORY_LABEL_JA));
  assert.deepEqual(Object.keys(VEGAN_LABEL), Object.keys(VEGAN_LABEL_JA));
  assert.deepEqual(Object.keys(HALAL_LABEL), Object.keys(HALAL_LABEL_JA));
  assert.deepEqual(Object.keys(ZONE_KO), Object.keys(ZONE_JA));
  assert.deepEqual(Object.keys(TRUST_LABEL_JA).sort(), ['Inferred', 'Official', 'Reported']);
});

test('the sentence-writing policies answer in Japanese', () => {
  for (const reason of [EMPTY.NONE, EMPTY.DAY, EMPTY.DISH, EMPTY.GENDER]) {
    const ja = emptyText(reason, { locale: 'ja' });
    assert.ok(isJapanese(ja.title), `${reason} title`);
    assert.ok(isJapanese(ja.body), `${reason} body`);
  }
  for (const t of themes) {
    assert.ok(isJapanese(reasonFor(t, { at: new Date('2026-07-15T12:00:00'), locale: 'ja' })), `${t.id}`);
  }
  assert.equal(emptyText(EMPTY.NONE).title, 'No tables open this week.');
});

test('the policies that assemble a sentence around a name speak Japanese', () => {
  const meal = restaurants.find(r => (r.menus?.value ?? []).length > 0);
  const cta = tableCtaFor(meal, 'ja');
  assert.ok(isCjk(cta.title));
  assert.ok(isJapanese(cta.sub));

  const withTransit = restaurants.find(r => r.transit?.value?.station);
  assert.ok(isCjk(transitLine(withTransit).ja), 'the station line has no Japanese');
  assert.ok(isJapanese(MAP_LINKS_NOTE.ja), 'the map-links note has no Japanese');

  const hours = { known: true, value: { weekly: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } } };
  const shut = getOpenStatus(hours, new Date('2026-08-17T12:00:00'), 'ja');
  assert.equal(shut.label, '営業終了');
  assert.ok(isCjk(shut.detail));
});

test('the journey tips and route steps are written in Japanese', () => {
  for (const [key, tips] of Object.entries(LOCAL_TIPS)) {
    for (const t of tips) {
      assert.ok(isCjk(t.tagJa ?? ''), `${key}: "${t.tag}" has no tagJa`);
      assert.ok(isJapanese(t.detailJa ?? ''), `${key}: "${t.tag}" has no detailJa`);
    }
  }
  for (const key of Object.keys(LOCAL_TIPS)) {
    for (const step of routeFor({ category: key })) {
      assert.ok(isCjk(step.labelJa ?? ''), `${key}: "${step.label}" has no labelJa`);
      assert.ok(isJapanese(step.noteJa ?? ''), `${key}: "${step.label}" has no noteJa`);
    }
  }
});

test('the theme screens carry Japanese too', () => {
  for (const e of experiences) {
    for (const f of ['title', 'whyItMatters', 'culturalMeaning', 'whenToExperience']) {
      assert.ok(isCjk(e[`${f}Ja`] ?? ''), `${e.id} has no ${f}Ja`);
    }
    assert.ok(isJapanese(e.whyItMattersJa), `${e.id}'s whyItMattersJa has no kana`);
    assert.ok(isCjk(e.missionJa?.title ?? ''), `${e.id} mission has no Japanese title`);
    assert.ok(isJapanese(e.missionJa?.detail ?? ''), `${e.id} mission has no Japanese detail`);
  }
  for (const n of narratives) {
    for (const f of ['title', 'intro', 'outro']) {
      assert.ok(isCjk(n[`${f}Ja`] ?? ''), `${n.id} has no ${f}Ja`);
    }
    assert.ok(isJapanese(n.introJa), `${n.id}'s introJa has no kana`);
  }
  for (const step of narrativeSteps.filter(x => x.transition)) {
    assert.ok(
      isJapanese(step.transitionJa ?? ''),
      `${step.narrativeId}/${step.experienceId} has no Japanese transition`,
    );
  }
});

// ── The part that is about telling two scripts apart ────────────────────────

test('Japanese and Chinese are not each other, and neither is Korean', () => {
  // Kanji are shared three ways here: with Chinese, and with Korean hanja.
  // The pair splitter reads Hangul, so it is unaffected by either — checked
  // when Chinese arrived, and it has to keep holding now that a second
  // kanji-using language exists.
  assert.equal(isKorean('日本語'), false);
  assert.equal(isKorean('食卓を開く'), false);
  assert.equal(localeText('상 차리기 · Open a table', LOCALE.JA), 'Open a table');

  // And the two kanji languages are distinguishable by kana, which is what
  // both guard suites now rely on. A Chinese sentence has none.
  const someChinese = cultureByCategory.temple.didYouKnowZh;
  const someJapanese = cultureByCategory.temple.didYouKnowJa;
  assert.equal(KANA.test(someChinese), false, 'the Chinese prose should contain no kana');
  assert.equal(KANA.test(someJapanese), true, 'the Japanese prose should contain kana');

  // The two zone maps are both written in kanji and are allowed to agree on a
  // place name — but not on all of them, which would mean one was copied.
  const zh = Object.values(ZONE_ZH);
  const ja = Object.values(ZONE_JA);
  const same = zh.filter((v, i) => v === ja[i]).length;
  assert.ok(same < zh.length, 'the Japanese zone map looks like a copy of the Chinese one');
});

test('Japanese reads left to right and keeps its own date format', () => {
  assert.equal(isRtl(LOCALE.JA), false);
  assert.equal(dateLocale(LOCALE.JA), 'ja-JP');
});
