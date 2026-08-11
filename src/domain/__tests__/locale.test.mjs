import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCALE, LOCALES, isLocale, DEFAULT_LOCALE, LOCALE_LABEL,
  isKorean, localeText, localePair,
} from '../policy/locale.js';

test('the default is what everybody has been reading, and it changes nothing', () => {
  // `both` must be the identity, not a re-render of the same words through a
  // splitter. Every screen the team has reviewed is the `both` path.
  assert.equal(DEFAULT_LOCALE, LOCALE.BOTH);
  for (const s of [
    '상 차리기 · Open a table',
    '밥상 · tables',
    '© 2026 밥친구 잇플 · Eatple — 디지털 공공외교 파일럿 · a digital public diplomacy pilot',
    'Samgyeopsal',
  ]) {
    assert.equal(localeText(s, LOCALE.BOTH), s);
    assert.equal(localeText(s), s, 'called with no locale it must also be the identity');
  }
});

test('a pair splits by script, not by position', () => {
  // The middot separates a pair here and a list two lines later, so position
  // decides nothing — "밥상 · tables" and "또는 · or" have the Korean first,
  // "Google · 길찾기" would not.
  assert.equal(localeText('상 차리기 · Open a table', LOCALE.KO), '상 차리기');
  assert.equal(localeText('상 차리기 · Open a table', LOCALE.EN), 'Open a table');
  assert.equal(localeText('밥상 · tables', LOCALE.EN), 'tables');
  assert.equal(localeText('또는 · or', LOCALE.KO), '또는');
});

test('a string carrying two pairs keeps every segment in the chosen language', () => {
  const footer = '© 2026 밥친구 잇플 · Eatple — 디지털 공공외교 파일럿 · a digital public diplomacy pilot';
  // Three segments: "© 2026 밥친구 잇플", "Eatple — 디지털 공공외교 파일럿",
  // "a digital public diplomacy pilot". The middle one carries Korean, so
  // Korean keeps it and English drops it — which is right by the rule and
  // still leaves the footer with the brand in it either way.
  assert.equal(
    localeText(footer, LOCALE.KO),
    '© 2026 밥친구 잇플 · Eatple — 디지털 공공외교 파일럿',
  );
  assert.equal(
    localeText(footer, LOCALE.EN),
    'a digital public diplomacy pilot',
  );
  // And the limit this exposes, recorded rather than hidden: a segment mixing
  // both languages around an em dash cannot be split by script, so a string
  // that needs to reduce cleanly has to be written as separate elements
  // rather than one line. MainTab's footer is written that way for exactly
  // this reason.
  assert.ok(isKorean('Eatple — 디지털 공공외교 파일럿'));
});

test('nothing is ever emptied', () => {
  // The rule that matters most in practice. A label with no Korean in it —
  // a dish name, a host, an address, the Google button — must survive a
  // Korean-only setting, or the screen loses a control.
  assert.equal(localeText('Google', LOCALE.KO), 'Google');
  assert.equal(localeText('Samgyeopsal · Grilled pork belly', LOCALE.KO), 'Samgyeopsal · Grilled pork belly');
  assert.equal(localeText('조강민', LOCALE.EN), '조강민');
  assert.equal(localeText('', LOCALE.EN), '');
  assert.equal(localeText(null, LOCALE.KO), '');
  assert.equal(localeText(undefined, LOCALE.EN), '');
});

test('a string with no middot is returned untouched', () => {
  // Most of the app is prose in one language. Running a splitter over it
  // should be a no-op, including when the prose happens to be bilingual
  // without the separator.
  const prose = 'Meet and share the food. 밥친구 handles no money.';
  for (const l of LOCALES) assert.equal(localeText(prose, l), prose);
});

test('a middot with no spaces is a character in somebody\'s words, not a separator', () => {
  // "가·나" appears inside real Korean copy. Splitting on a bare middot
  // would cut sentences in half.
  assert.equal(localeText('연락처·사진·위치', LOCALE.EN), '연락처·사진·위치');
});

test('a kr/en pair held as two fields reduces the same way', () => {
  const p = { kr: '밥상 찾기', en: 'Find a table' };
  assert.equal(localePair(p, LOCALE.BOTH), '밥상 찾기 · Find a table');
  assert.equal(localePair(p, LOCALE.KO), '밥상 찾기');
  assert.equal(localePair(p, LOCALE.EN), 'Find a table');
  // A half that does not exist falls back rather than rendering blank.
  assert.equal(localePair({ kr: '', en: 'Only English' }, LOCALE.KO), 'Only English');
  assert.equal(localePair({ kr: '한국어만', en: '' }, LOCALE.EN), '한국어만');
  assert.equal(localePair(undefined, LOCALE.EN), '');
});

test('only the three languages the app actually holds words for are offered', () => {
  // 22,342 Korean characters and 187 bilingual pairs exist; a Spanish
  // interface does not. Offering Español here and serving English would be
  // the app claiming a translation nobody wrote.
  assert.deepEqual(LOCALES, ['both', 'ko', 'en']);
  assert.equal(isLocale('es'), false);
  assert.equal(isLocale('ja'), false);
  assert.equal(isLocale(null), false);
});

test('the picker names every option in both languages, whatever is selected', () => {
  // It is the one control somebody reaches for when the current setting is
  // the language they cannot read.
  for (const l of LOCALES) {
    const label = LOCALE_LABEL[l];
    assert.ok(label, `${l} has no label`);
    assert.ok(isKorean(label.kr), `${l} has no Korean label`);
    assert.ok(!isKorean(label.en), `${l}'s English label is not English`);
  }
});
