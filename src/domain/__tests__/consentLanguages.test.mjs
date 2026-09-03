import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RULES, PURPOSE, LANGS, AGREE_ACTION, agreeLabel } from '../../content/safety.js';

// The consent gate, in every language the app speaks.
//
// ── What this file is for ───────────────────────────────────────────────
//
// Until 2026-09-03 the four rules a traveller agrees to, the paragraph
// stating what the app is for, and the paragraph stating what to do if
// somebody breaks it were ENGLISH STRINGS. Not "English first with a Korean
// twin missing" — there was no second string at all, in any language, so a
// Korean host and a Japanese traveller both agreed to English text on the
// one screen in the product where understanding what you are agreeing to is
// the whole point. audit-i18n could not see it: RULES is content data and
// the component renders `{r}`, a variable, so neither the say() pass nor the
// string-literal pass had anything to look at.
//
// ── Why the assertions are shaped the way they are ──────────────────────
//
// Every check below runs per language rather than over "the text". A guard
// that reads the English arm and stops is how the four rules stayed English
// for the whole first pilot while every test was green. The overclaim guard
// in consent.test.mjs is the specific example: its regex is English-only, so
// the moment a Korean string lands beside it half the readers of this screen
// lose their protection. That guard moves here and gains six languages.
//
// The identical-clause check is here for a different reason. RULES[0] and
// PURPOSE.rule end on the same sentence, and they ended on it because two
// people typed it twice: a grep for "opening to ask" on 2026-09-03 returned
// exactly two lines, in two different exports, with nothing holding them
// together. Seven languages would have made that four times worse. The
// sentence is one constant now and this asserts that both users of it
// really are that constant.

const NOT_KO = LANGS.filter(l => l !== 'ko');
const ALL_TEXT = () => [
  ...RULES.flatMap(r => LANGS.map(l => ({ where: `RULES[${RULES.indexOf(r)}]`, lang: l, text: r[l] }))),
  ...LANGS.map(l => ({ where: 'PURPOSE.rule', lang: l, text: PURPOSE.rule[l] })),
  ...LANGS.map(l => ({ where: 'PURPOSE.ifBroken', lang: l, text: PURPOSE.ifBroken[l] })),
];

// ── Every language is actually there ────────────────────────────────────

test('every rule carries all seven languages, and none of them is a stub', () => {
  assert.equal(RULES.length >= 4, true, 'a consent list this short is not worth agreeing to');
  for (const [i, r] of RULES.entries()) {
    for (const lang of LANGS) {
      assert.equal(typeof r[lang], 'string', `RULES[${i}] has no ${lang}`);
      // Length rather than emptiness: a one-word arm is a placeholder that
      // passes a truthiness check, and the English original runs 71-83.
      assert.ok(r[lang].length > 12, `RULES[${i}].${lang} is too thin to mean anything: "${r[lang]}"`);
    }
  }
});

test('the two paragraphs carry all seven languages too', () => {
  for (const field of ['rule', 'ifBroken']) {
    for (const lang of LANGS) {
      assert.equal(typeof PURPOSE[field][lang], 'string', `PURPOSE.${field} has no ${lang}`);
      assert.ok(PURPOSE[field][lang].length > 30, `PURPOSE.${field}.${lang} is too thin`);
    }
  }
});

test('every string ends as a sentence in its own script', () => {
  // Full-width stops for zh and ja, ordinary ones elsewhere. A missing stop
  // is the tell of a truncated paste, which is the realistic way one of
  // these gets damaged.
  for (const { where, lang, text } of ALL_TEXT()) {
    const stop = lang === 'zh' || lang === 'ja' ? /。$/ : /\.$/;
    assert.match(text, stop, `${where}.${lang} does not end as a sentence: "${text}"`);
  }
});

// ── The shared clause is shared, not copied ─────────────────────────────

test('the clause RULES[0] and PURPOSE.rule share is the same string in all seven', () => {
  // The last sentence of RULES[0] appears verbatim at the end of
  // PURPOSE.rule, which is only true because both read one constant.
  for (const lang of LANGS) {
    const sep = lang === 'zh' || lang === 'ja' ? '。' : '. ';
    const first = RULES[0][lang];
    const at = first.indexOf(sep);
    assert.ok(at > 0, `${lang}: RULES[0] has no sentence break`);
    const clause = first.slice(at + sep.length).trim();
    // A floor, not a length check: it fails when the separator splits at the
    // wrong place and hands back a fragment. Chinese and Japanese say the
    // whole clause in 18 characters, so the floor has to sit under that.
    assert.ok(clause.length > 12, `${lang}: the shared clause came out too short — check the separator`);
    assert.ok(PURPOSE.rule[lang].endsWith(clause),
      `${lang}: PURPOSE.rule does not end on the clause RULES[0] ends on\n  clause: ${clause}\n  rule:   ${PURPOSE.rule[lang]}`);
  }
});

// ── No language is quietly showing another language's text ──────────────

test('no non-Korean string carries Hangul, and the Korean ones do', () => {
  // The failure this catches is a paste that put the Korean arm in the
  // Spanish slot, which reads as an empty screen to the only person it was
  // written for. Also the app-name rule: Eatple inside a Latin sentence,
  // 밥친구 inside a Korean one.
  const HANGUL = /[가-힣]/;
  for (const { where, lang, text } of ALL_TEXT()) {
    if (lang === 'ko') assert.match(text, HANGUL, `${where}.ko has no Hangul in it`);
    else assert.doesNotMatch(text, HANGUL, `${where}.${lang} contains Hangul: "${text}"`);
  }
});

test('the app names itself Eatple outside Korean and 밥친구 inside it', () => {
  assert.match(PURPOSE.rule.ko, /밥친구/, 'the Korean paragraph does not name the app in Korean');
  for (const lang of NOT_KO) {
    assert.match(PURPOSE.rule[lang], /Eatple/, `PURPOSE.rule.${lang} does not name the app in Latin letters`);
  }
});

// ── The promise is not bigger in one language than in another ───────────

// Enforcement words, per language. The English regex is the one that lived
// in consent.test.mjs; the other six were derived by reading what each
// language reaches for when it wants to promise moderation, and every one
// was run against the shipping strings to make sure it does not fire on
// them. Two deliberate narrowings: Arabic bare حظر and Chinese 拉黑 are NOT
// on the list, because RULES[3] legitimately tells the reader they can block
// somebody — the guard is about what the TEAM promises to do, not about the
// reader's own controls.
const OVERCLAIM = {
  en: /we (will )?(review|monitor|moderate|verify)|reported users are|will be banned|permanently removed/i,
  ko: /조치하|제재|퇴출|감시|검토하겠|처벌|영구 정지|계정을 정지|저희가 막/,
  es: /expuls|prohibimos|vetar|suspendemos|sancion|moderamos|vigil|supervis|investigar|garantiz|tomaremos medidas/i,
  fr: /bannir|banni|exclur|interdis|modérons|surveill|sanction|suspendr|garantis|nous interviendrons/i,
  ar: /حظر الحساب|إيقاف الحساب|نراقب|سنتخذ|عقوبة|نضمن|الطرد/,
  zh: /封号|封禁|黑名单|审核|审查|处罚|监控|监督|监管|我们会|我们将|团队会|保证|确保|承诺|永久/,
  ja: /利用停止|強制退会|処分|監視|審査|対応します|保証|禁止します|排除/,
};

test('no language promises moderation this app does not have', () => {
  // NOT_YET_BUILT names what is missing and REPORT_CHANNEL is one open chat
  // room somebody watches by hand. A consent screen is the worst place in
  // the product to imply a system is running.
  for (const { where, lang, text } of ALL_TEXT()) {
    assert.doesNotMatch(text, OVERCLAIM[lang], `${where}.${lang} overclaims enforcement: "${text}"`);
  }
});

test('the overclaim guard covers every language, not just the one it was written in', () => {
  // The hole this closes, asserted positively: a guard is only a guard if it
  // exists for the language it is meant to guard.
  for (const lang of LANGS) {
    assert.ok(OVERCLAIM[lang] instanceof RegExp, `no overclaim guard for ${lang}`);
    // And it must be able to fire, or it is a comment shaped like a regex.
    const bait = {
      en: 'We will review reported users.', ko: '신고된 사람은 저희가 검토하겠습니다.',
      es: 'Moderamos cada mesa.', fr: 'Nous surveillons chaque table.',
      ar: 'نراقب كل مائدة.', zh: '我们会审核每一张饭桌。', ja: '通報は審査します。',
    }[lang];
    assert.match(bait, OVERCLAIM[lang], `the ${lang} guard does not fire on an obvious overclaim`);
  }
});

// ── The button says what it gates, in the reader's language ─────────────

test('the agree button is built in all seven languages for both doors', () => {
  // It used to interpolate the English `action` prop into a translated
  // frame, so a Korean host read "동의하고 계속 — open a table". The action
  // is a key now and the label is assembled from data.
  for (const action of Object.values(AGREE_ACTION)) {
    const label = agreeLabel(action);
    for (const lang of LANGS) {
      assert.equal(typeof label[lang], 'string', `agreeLabel(${action}) has no ${lang}`);
      assert.ok(label[lang].length > 4, `agreeLabel(${action}).${lang} is empty`);
    }
    assert.doesNotMatch(label.ko, /[A-Za-z]/,
      `the Korean button still carries Latin text: "${label.ko}"`);
    assert.doesNotMatch(label.ja, /[A-Za-z]/,
      `the Japanese button still carries Latin text: "${label.ja}"`);
  }
});

test('the two doors say different things', () => {
  // Opening a table and asking for a seat are different acts, and the button
  // is the last thing read before either. A single label for both would pass
  // every check above.
  const open = agreeLabel(AGREE_ACTION.OPEN_TABLE);
  const seat = agreeLabel(AGREE_ACTION.ASK_SEAT);
  for (const lang of LANGS) {
    assert.notEqual(open[lang], seat[lang], `${lang} uses one label for both doors`);
  }
});

test('an unknown action does not render a broken button', () => {
  // TableCreate and TableDetail pass this prop by hand. A typo used to show
  // up as English on screen; it must now be caught here instead.
  assert.throws(() => agreeLabel('open a table'),
    /unknown consent action/i, 'a bad action key passes silently');
});

// ── The helper the components use ───────────────────────────────────────

test('LANGS is in the order say() reads its arguments', () => {
  // Every render site spells out say(x.en, x.ko, x.es, x.fr, x.ar, x.zh, x.ja)
  // by hand so audit-i18n can count them, and this file walks LANGS to decide
  // what to check. The two orders have to be the same one.
  assert.deepEqual(LANGS, ['en', 'ko', 'es', 'fr', 'ar', 'zh', 'ja']);
});
