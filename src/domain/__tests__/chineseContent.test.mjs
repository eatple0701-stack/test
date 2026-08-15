import test from 'node:test';
import assert from 'node:assert/strict';
import { menus } from '../catalog/menus.js';
import { themes } from '../catalog/themes.js';
import { EDITORIAL } from '../../content/exploreEditorial.js';
import { PROMISES, PROMISES_LEAD } from '../../content/promises.js';
import { CULTURE_CARDS } from '../../content/cultureCards.js';
import {
  cultureByCategory, CATEGORY_LABEL, CATEGORY_LABEL_ZH, ZONE_KO, ZONE_ZH,
} from '../../data/culture.js';
import {
  traditionalMarkets, seasonalFoods, festivals, courses, featuredZones,
} from '../../data/experiences.js';
import { restaurants } from '../../data/restaurants.js';
import {
  VEGAN_LABEL, VEGAN_LABEL_ZH, HALAL_LABEL, HALAL_LABEL_ZH, TRUST_LABEL_ZH,
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

// The Chinese twin of the other language guards, plus one check none of them
// needed: Han characters are not Hangul, and the pair splitter has to agree.
//
// Same limitation as its siblings: these assert that a translation exists, not
// that it is good. What they catch is the failure the fallback creates —
// say(en, ko, es, fr, ar, zh) returns the English when the Chinese is missing,
// so an untranslated record is invisible to anybody who reads English.

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
// CJK ideographs, and no kana.
//
// Requiring Han was enough while Chinese was the only language here written
// with it. Japanese uses the same characters, so "does this contain Han" now
// passes on Japanese too, and a Japanese string pasted into a Zh field would
// have gone unseen. Chinese never uses hiragana or katakana, so rejecting
// them is what separates the two.
const KANA = /[ぁ-ゟ゠-ヿ]/;
const isHan = (s) => /[一-鿿]/.test(s) && !KANA.test(s);

test('every dish carries its four paragraphs in Chinese', () => {
  for (const m of menus) {
    for (const f of ['gloss', 'whyShared', 'howItWorks', 'culture']) {
      assert.ok(nonEmpty(m[`${f}Zh`]), `${m.id} has no ${f}Zh`);
      assert.ok(isHan(m[`${f}Zh`]), `${m.id}'s ${f}Zh is not in Han script`);
    }
  }
});

test('every theme, its tagline and its cover question exist in Chinese', () => {
  for (const t of themes) {
    for (const f of ['title', 'tagline', 'narrative']) {
      assert.ok(isHan(t[`${f}Zh`] ?? ''), `${t.id} has no ${f}Zh`);
    }
    const ed = EDITORIAL[t.id];
    if (ed) {
      assert.ok(isHan(ed.questionZh ?? ''), `${t.id} has no Chinese question`);
      // Chinese writes its question mark full-width. Either is a question.
      assert.ok(/[?？]/.test(ed.questionZh), `${t.id}'s Chinese is not a question`);
    }
  }
});

test('the promises, the gates and the culture cards are written in Chinese', () => {
  for (const p of PROMISES) assert.ok(isHan(p.zh ?? ''), `${p.id} has no Chinese`);
  assert.ok(isHan(PROMISES_LEAD.zh ?? ''));
  assert.ok(isHan(PROMISES_LEAD.titleZh ?? ''));
  for (const [door, gate] of Object.entries(GATE_TEXT)) {
    assert.ok(isHan(gate.titleZh ?? ''), `gate ${door} has no titleZh`);
    assert.ok(isHan(gate.bodyZh ?? ''), `gate ${door} has no bodyZh`);
    assert.ok(isHan(gate.ctaZh ?? ''), `gate ${door} has no ctaZh`);
  }
  for (const c of CULTURE_CARDS) {
    assert.ok(isHan(c.titleZh ?? ''), `${c.title} has no Chinese title`);
    assert.ok(isHan(c.descZh ?? ''), `${c.title} has no Chinese description`);
  }
});

test('every place-tab card has a Chinese half', () => {
  for (const m of traditionalMarkets) assert.ok(isHan(m.blurbZh ?? ''), m.id);
  for (const f of seasonalFoods) {
    assert.ok(isHan(f.blurbZh ?? ''), f.id);
    assert.ok(isHan(f.seasonZh ?? ''), `${f.id} has no Chinese season`);
  }
  for (const f of festivals) {
    assert.ok(isHan(f.blurbZh ?? ''), f.id);
    assert.ok(isHan(f.whenZh ?? ''), `${f.id} has no Chinese month`);
  }
  for (const c of courses) {
    assert.ok(isHan(c.titleZh ?? ''), c.id);
    assert.ok(isHan(c.durationZh ?? ''), `${c.id} has no Chinese duration`);
  }
  for (const z of featuredZones) assert.ok(isHan(z.blurbZh ?? ''), z.name);
  for (const r of restaurants) {
    assert.ok(isHan(r.vibeZh ?? ''), `${r.id} has no vibeZh`);
    assert.ok(isHan(r.storyZh ?? ''), `${r.id} has no storyZh`);
  }
});

test('every menu item on a place page is named in Chinese', () => {
  for (const r of restaurants) {
    for (const item of r.menus?.value ?? []) {
      assert.ok(nonEmpty(item.nameZh), `${r.id}: "${item.name}" has no nameZh`);
    }
  }
});

test('every culture category is written in Chinese too', () => {
  const fields = [
    'didYouKnow', 'diningTips', 'whyLocalsLoveIt', 'conversationTips',
    'passportMission', 'culturalMeaning', 'whenKoreansEatThis',
  ];
  for (const [key, c] of Object.entries(cultureByCategory)) {
    for (const f of fields) assert.ok(c[`${f}Zh`], `${key} has no ${f}Zh`);
    assert.equal(c.diningTipsZh.length, c.diningTips.length, `${key} tip counts differ`);
    assert.equal(c.conversationTipsZh.length, c.conversationTips.length, `${key} conversation counts differ`);
    assert.ok(isHan(c.passportMissionZh.title));
    assert.ok(isHan(c.passportMissionZh.detail));
    for (const phrase of c.usefulKorean ?? []) {
      assert.ok(isHan(phrase.zh ?? ''), `${key}: "${phrase.ko}" has no Chinese gloss`);
    }
  }
});

test('the label maps keep the same keys in Chinese', () => {
  assert.deepEqual(Object.keys(CATEGORY_LABEL), Object.keys(CATEGORY_LABEL_ZH));
  assert.deepEqual(Object.keys(VEGAN_LABEL), Object.keys(VEGAN_LABEL_ZH));
  assert.deepEqual(Object.keys(HALAL_LABEL), Object.keys(HALAL_LABEL_ZH));
  assert.deepEqual(Object.keys(ZONE_KO), Object.keys(ZONE_ZH));
  assert.deepEqual(Object.keys(TRUST_LABEL_ZH).sort(), ['Inferred', 'Official', 'Reported']);
});

test('the sentence-writing policies answer in Chinese', () => {
  for (const reason of [EMPTY.NONE, EMPTY.DAY, EMPTY.DISH, EMPTY.GENDER]) {
    const zh = emptyText(reason, { locale: 'zh' });
    assert.ok(isHan(zh.title), `${reason} title`);
    assert.ok(isHan(zh.body), `${reason} body`);
  }
  for (const t of themes) {
    assert.ok(isHan(reasonFor(t, { at: new Date('2026-07-15T12:00:00'), locale: 'zh' })), `${t.id}`);
  }
  assert.equal(emptyText(EMPTY.NONE).title, 'No tables open this week.');
});

test('the policies that assemble a sentence around a name speak Chinese', () => {
  const meal = restaurants.find(r => (r.menus?.value ?? []).length > 0);
  const cta = tableCtaFor(meal, 'zh');
  assert.ok(isHan(cta.title));
  assert.ok(isHan(cta.sub));

  const withTransit = restaurants.find(r => r.transit?.value?.station);
  assert.ok(isHan(transitLine(withTransit).zh), 'the station line has no Chinese');
  assert.ok(isHan(MAP_LINKS_NOTE.zh), 'the map-links note has no Chinese');

  const hours = { known: true, value: { weekly: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } } };
  const shut = getOpenStatus(hours, new Date('2026-08-17T12:00:00'), 'zh');
  assert.equal(shut.label, '已打烊');
  assert.ok(isHan(shut.detail));
});

test('the journey tips and route steps are written in Chinese', () => {
  for (const [key, tips] of Object.entries(LOCAL_TIPS)) {
    for (const t of tips) {
      assert.ok(isHan(t.tagZh ?? ''), `${key}: "${t.tag}" has no tagZh`);
      assert.ok(isHan(t.detailZh ?? ''), `${key}: "${t.tag}" has no detailZh`);
    }
  }
  for (const key of Object.keys(LOCAL_TIPS)) {
    for (const step of routeFor({ category: key })) {
      assert.ok(isHan(step.labelZh ?? ''), `${key}: "${step.label}" has no labelZh`);
      assert.ok(isHan(step.noteZh ?? ''), `${key}: "${step.label}" has no noteZh`);
    }
  }
});

test('the theme screens carry Chinese too', () => {
  for (const e of experiences) {
    for (const f of ['title', 'whyItMatters', 'culturalMeaning', 'whenToExperience']) {
      assert.ok(isHan(e[`${f}Zh`] ?? ''), `${e.id} has no ${f}Zh`);
    }
    assert.ok(isHan(e.missionZh?.title ?? ''), `${e.id} mission has no Chinese title`);
    assert.ok(isHan(e.missionZh?.detail ?? ''), `${e.id} mission has no Chinese detail`);
  }
  for (const n of narratives) {
    for (const f of ['title', 'intro', 'outro']) {
      assert.ok(isHan(n[`${f}Zh`] ?? ''), `${n.id} has no ${f}Zh`);
    }
  }
  for (const step of narrativeSteps.filter(x => x.transition)) {
    assert.ok(
      isHan(step.transitionZh ?? ''),
      `${step.narrativeId}/${step.experienceId} has no Chinese transition`,
    );
  }
});

// ── The part that is about scripts rather than words ────────────────────────

test('Han characters are not read as Hangul, so the pair splitter is safe', () => {
  // Every language before this one was written in a script the splitter could
  // never confuse with Korean. Chinese shares its characters with Korean
  // Hanja, so the assumption under localeText() has to be checked rather than
  // assumed: isKorean() tests for Hangul syllables, not for CJK.
  assert.equal(isKorean('한국어'), true);
  assert.equal(isKorean('中文'), false);
  assert.equal(isKorean('开一桌'), false);
  assert.equal(isKorean('饭桌 · tables'), false);

  // So a Chinese screen takes the readable half of a Korean-English pair,
  // exactly as Spanish, French and Arabic do — it has no half of its own in
  // those 187 strings, and the Chinese words come from the data instead.
  assert.equal(localeText('상 차리기 · Open a table', LOCALE.ZH), 'Open a table');
  assert.equal(localeText('조강민', LOCALE.ZH), '조강민');
});

test('Chinese reads left to right and keeps the Gregorian calendar', () => {
  assert.equal(isRtl(LOCALE.ZH), false);
  // zh-CN rather than zh-Hans-CN: the app needs the calendar and the digits,
  // and the script follows from the strings themselves.
  assert.equal(dateLocale(LOCALE.ZH), 'zh-CN');
});
