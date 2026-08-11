import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANGUAGES, LANGUAGE_EN, languageLabel, languageLine, cleanLanguages,
} from '../catalog/languages.js';

test('every language the app offers can be read by somebody who does not speak it', () => {
  // The reviewer's note on 2026-08-07: own-script is how you find your own
  // language, and how a Spanish speaker reads "한국어" and learns nothing —
  // on the one line that decides whether they sit down with strangers.
  const hangulOrCjkOrArabic = /[가-힣぀-ヿ一-鿿؀-ۿ]/;
  for (const l of LANGUAGES) {
    const { native, en } = languageLabel(l);
    assert.equal(native, l, `${l} lost its own name`);
    if (hangulOrCjkOrArabic.test(l)) {
      assert.ok(en, `${l} has no English name, so it is unreadable to most of the audience`);
      assert.ok(!hangulOrCjkOrArabic.test(en), `${l}'s English name is not in the Latin alphabet`);
    }
  }
});

test('English is not labelled "English · English"', () => {
  assert.equal(languageLabel('English').en, null);
  assert.equal(languageLine(['English']), 'English');
});

test('a line of languages carries both names, in catalogue order', () => {
  // Catalogue order rather than the order somebody ticked them, so two
  // tables offering the same languages read identically.
  assert.equal(languageLine(['한국어', 'English']), 'English · 한국어 Korean');
  assert.equal(
    languageLine(['العربية', 'Español']),
    'Español Spanish · العربية Arabic',
  );
});

test('the stored value stays the native string', () => {
  // Profiles already in the database hold '한국어'. A catalogue that renamed
  // its own keys would silently un-set everybody's languages on next read,
  // and cleanLanguages is what would drop them.
  assert.deepEqual(cleanLanguages(['한국어', '日本語']), ['한국어', '日本語']);
  assert.deepEqual(cleanLanguages(['Korean']), [], 'the English name is a label, never a key');
});

test('a language nobody in the catalogue speaks is dropped rather than printed', () => {
  assert.equal(languageLine(['Klingon', '한국어']), '한국어 Korean');
  assert.equal(languageLine([]), '');
  assert.equal(languageLine(null), '');
  assert.equal(languageLine(undefined), '');
});

test('every entry in LANGUAGES has a decision recorded in LANGUAGE_EN', () => {
  // Adding a language without an English name would ship the exact gap this
  // file was written to close, and it would ship silently.
  for (const l of LANGUAGES) {
    assert.ok(l in LANGUAGE_EN, `${l} was added to LANGUAGES with no LANGUAGE_EN entry`);
  }
  for (const key of Object.keys(LANGUAGE_EN)) {
    assert.ok(LANGUAGES.includes(key), `${key} has an English name but is not offered`);
  }
});

test('Spanish is one of the languages a traveller can choose', () => {
  // Asked for by name on 2026-08-07. It was already here — this keeps it so.
  assert.ok(LANGUAGES.includes('Español'));
  assert.equal(LANGUAGE_EN['Español'], 'Spanish');
});
