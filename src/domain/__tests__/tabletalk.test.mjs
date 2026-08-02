// 문화교류 질문 카드 — the cards meant to be handed across a table.
//
// These assertions exist because the first version of this list failed both
// of them silently. It was English-only, in a sheet whose entire design is
// "turn the phone around", so the one card you most want to hand over was the
// one the other person could not read. And its own comment claimed every
// question worked both ways while three of six only pointed at the visitor.
//
// Neither failure looked like a bug. Both were just content, and content is
// what this app is.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  tableQuestions, dishQuestions, questionsFor, ASK_WHO, ASK_WHO_LABEL,
  phrases, phrasesFor, PHRASE_GROUP,
} from '../../content/phrases.js';
import { menus } from '../catalog/menus.js';
import { RESTRICTIONS } from '../../data/profile.js';
import { languageFit, cleanLanguages, LANGUAGE_FIT } from '../catalog/languages.js';
import { tableToRow, tableFromRow, signupToRow, signupFromRow } from '../../data/tableMapping.js';

const everyCard = [...tableQuestions, ...Object.values(dishQuestions).flat()];

test('every question is written in both languages', () => {
  for (const q of everyCard) {
    assert.ok(q.en && q.en.trim().length > 10, `${q.id} has no English`);
    assert.ok(q.ko && q.ko.trim().length > 5, `${q.id} has no Korean`);
    // Korean, not romanisation — the card is for reading, not pronouncing.
    assert.match(q.ko, /[가-힣]/, `${q.id}'s Korean has no Hangul in it`);
  }
});

test('the deck asks in both directions', () => {
  // A deck that only points at the visitor is an interview. The plan asked for
  // 문화교류, which needs the question to come back the other way.
  const who = tableQuestions.map(q => q.who);
  for (const side of [ASK_WHO.VISITOR, ASK_WHO.LOCAL]) {
    assert.ok(who.includes(side), `nothing in the deck is ${side}-facing`);
  }
  assert.equal(
    who.filter(w => w === ASK_WHO.VISITOR).length,
    who.filter(w => w === ASK_WHO.LOCAL).length,
    'the one-sided questions are not paired, so the deck leans one way',
  );
});

test('every card names an audience the app can label', () => {
  for (const q of everyCard) {
    assert.ok(ASK_WHO_LABEL[q.who], `${q.id} has an unlabelled audience: ${q.who}`);
  }
});

test('card ids are unique, so walking the deck cannot repeat', () => {
  const ids = everyCard.map(q => q.id);
  assert.equal(new Set(ids).size, ids.length, 'two cards share an id');
});

test('dish openers point at dishes that exist', () => {
  for (const menuId of Object.keys(dishQuestions)) {
    assert.ok(menus.some(m => m.id === menuId), `${menuId} is not in the menu catalog`);
  }
});

test('questionsFor leads with the dish in front of you', () => {
  const withDish = questionsFor('gopchang');
  assert.equal(withDish[0].id, 'gop-first', 'the dish opener is not first');
  assert.ok(withDish.length > tableQuestions.length, 'the general deck was dropped');

  // A dish with no opener of its own still gets the full deck rather than
  // an empty sheet.
  assert.deepEqual(questionsFor('dakgalbi').map(q => q.id), tableQuestions.map(q => q.id));
  assert.deepEqual(questionsFor(undefined).map(q => q.id), tableQuestions.map(q => q.id));
});

test('no question asks something a dating rule would forbid', () => {
  // The app now states it is not a dating app. A deck that asks strangers
  // about romance would contradict that on the same evening.
  const banned = /\b(single|dating|boyfriend|girlfriend|attractive|type|married|romantic)\b/i;
  for (const q of everyCard) {
    assert.doesNotMatch(q.en, banned, `${q.id} asks something the no-dating rule rules out`);
  }
});

// ---------------------------------------------------------------------------
// 언어 — the fact the Profile promised and the app never delivered.
// ---------------------------------------------------------------------------

test('a table and a traveller who share nothing are told so, not hidden', () => {
  const { fit, shared } = languageFit(['한국어'], ['English']);
  assert.equal(fit, LANGUAGE_FIT.NONE);
  assert.deepEqual(shared, []);
});

test('a shared language is named, because the useful sentence names it', () => {
  const { fit, shared } = languageFit(['한국어', 'English'], ['English', '日本語']);
  assert.equal(fit, LANGUAGE_FIT.SHARED);
  assert.deepEqual(shared, ['English']);
});

test('silence on either side is its own state, not a mismatch', () => {
  // Flattening these into NONE would invent a warning about a table that
  // simply has not answered yet; flattening into SHARED would hide a real one.
  assert.equal(languageFit([], ['English']).fit, LANGUAGE_FIT.TABLE_UNSAID);
  assert.equal(languageFit(['English'], []).fit, LANGUAGE_FIT.MINE_UNSAID);
  assert.equal(languageFit([], []).fit, LANGUAGE_FIT.TABLE_UNSAID);
  assert.equal(languageFit(undefined, undefined).fit, LANGUAGE_FIT.TABLE_UNSAID);
});

test('languages are cleaned to the catalog and read in one order', () => {
  // Two lists written in different orders must render the same, or two
  // identical tables look different.
  assert.deepEqual(cleanLanguages(['日本語', 'English', 'Klingon']), ['English', '日本語']);
  assert.deepEqual(cleanLanguages(['English', '日本語']), ['English', '日本語']);
  assert.deepEqual(cleanLanguages('English'), []);
});

test('a table row carries its languages through the database and back', () => {
  const row = tableToRow(
    { menuId: 'bossam', hostName: 'Jiwon', date: '2026-08-20', time: '19:00',
      place: 'Euljiro', seats: 4, languages: ['한국어', 'English', 'Dothraki'] },
    { hostId: 'u-9' },
  );
  assert.deepEqual(row.languages, ['English', '한국어']);
  assert.deepEqual(tableFromRow({ ...row, id: 't', seats: 4 }).languages, ['English', '한국어']);
  // A row written before the column existed reads as "did not say".
  assert.deepEqual(tableFromRow({ id: 't', menu_id: 'bossam', seats: 4 }).languages, []);
});

// ---------------------------------------------------------------------------
// 상황별 표현 — the sentences the plan names, and the ones the Profile implies.
// ---------------------------------------------------------------------------

test('the sentences the business plan writes out can all be said', () => {
  // Quoted from 핵심기능 4. Checked as exact strings rather than trusted to a
  // comment, because a comment two lists away claimed the conversation cards
  // were two-way while half of them were not.
  const fromPlan = [
    '덜 맵게 해주세요.',
    '육수에 고기가 들어가나요?',
    '알레르기가 있는 재료가 들어가나요?',
  ];
  const spoken = phrases.map(p => p.ko);
  for (const line of fromPlan) {
    assert.ok(spoken.includes(line), `the plan writes "${line}" and the app cannot say it`);
  }
});

test('the one sentence a native ear rejected is the corrected one', () => {
  // The plan's fourth line is 이 음식은 몇 명이 먹을 수 있나요, and the Korean
  // speakers who tested the app marked exactly that one as sounding wrong. The
  // app says 이거 몇 인분이에요 instead.
  //
  // This test exists so the divergence is a decision on the record rather than
  // something that looks like drift — and so nobody quietly restores the
  // plan's wording later on the strength of the document.
  const line = phrases.find(p => p.id === 'how-many-people');
  assert.equal(line.ko, '이거 몇 인분이에요?');
  assert.ok(
    !phrases.some(p => p.ko === '이 음식은 몇 명이 먹을 수 있나요?'),
    'the wording the testers rejected is back in the phrasebook',
  );
  // 인분 is the unit shops answer in, and the unit this product turns on.
  assert.match(line.ko, /인분/);
});

test('every rule a traveller can declare is one they can say out loud', () => {
  // The hole this closes: the Profile offered five restrictions and the
  // phrasebook covered two. Somebody who ticked "no beef" was warned which
  // tables conflicted and handed no way to tell a waiter — the app answering
  // the question it invented instead of the one they actually had.
  for (const r of RESTRICTIONS) {
    const said = phrases.find(p => p.restriction === r);
    assert.ok(said, `a traveller can declare ${r} and has no sentence for it`);
    assert.match(said.ko, /[가-힣]/, `the ${r} sentence has no Korean`);
    assert.ok(said.read?.length > 5, `the ${r} sentence has no way to read it aloud`);
  }
});

test('a traveller sees their own rules first, and loses nothing', () => {
  const all = phrasesFor(PHRASE_GROUP.DIETARY, []);
  const mine = phrasesFor(PHRASE_GROUP.DIETARY, ['fish']);
  assert.equal(mine[0].restriction, 'fish', 'the declared rule is not at the top');
  // Reordered, never filtered: somebody may still need a sentence they never
  // declared, and a phrasebook that quietly shortened itself would be worse
  // than one that is merely long.
  assert.deepEqual(
    all.map(p => p.id).slice().sort(),
    mine.map(p => p.id).slice().sort(),
    'personalising the list dropped a phrase',
  );
});

// ---------------------------------------------------------------------------
// 비건·할랄 — a message to the host, never a verdict from the app.
// ---------------------------------------------------------------------------

test('a diet is carried to the host and never used to judge a dish', () => {
  // Three sources asked for this — the plan names 비건 and 할랄, the reviewing
  // 부장 asked for 맞춤형, and a tester looking at the shipped ingredient boxes
  // wrote "add vegan, vegetarian". The principle that kept them out was about
  // the *app* asserting halal, which this does not do.
  const row = signupToRow(
    { tableId: 't', name: 'Amina', diets: ['halal', 'vegan', 'paleo'] },
    { userId: 'u-1' },
  );
  assert.deepEqual(row.diets, ['vegan', 'halal'], 'unknown ids or ordering leaked through');
  assert.deepEqual(signupFromRow({ ...row, id: 's' }).diets, ['vegan', 'halal']);

  // A signup written before the column existed is not a crash and not a claim.
  assert.deepEqual(signupFromRow({ id: 's', table_id: 't', name: 'A' }).diets, []);
});

test('nothing in the catalog answers a diet, because nothing can', () => {
  // The guard on the whole design: if a dish ever grew a `halal` or `vegan`
  // field, the app would be ruling on somebody else's rules with a plate of
  // pork on the line. Ingredients are what it may state; diets are what a
  // person states.
  for (const m of menus) {
    for (const banned of ['halal', 'vegan', 'vegetarian', 'kosher']) {
      assert.ok(!(banned in m), `${m.id} claims to answer ${banned}`);
    }
  }
});
