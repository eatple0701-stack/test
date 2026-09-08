import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyAnswers, recordAnswer, mbtiProgress, nextQuestion, isComplete, mbtiType,
} from '../policy/foodMbti.js';
import { MBTI_AXES, MBTI_QUESTIONS } from '../../content/foodMbti.js';
import { MBTI_TYPES, MBTI_CODES } from '../../content/foodMbtiTypes.js';
import { mbtiTypeLabel, mbtiPoleLabel } from '../policy/dishLabels.js';
import { LOCALE } from '../policy/locale.js';

const LOCALES = [LOCALE.KO, LOCALE.EN, LOCALE.ES, LOCALE.FR, LOCALE.AR, LOCALE.ZH, LOCALE.JA];

/** Answer every question with the given pole per axis. */
const answerAll = (byAxis) => MBTI_QUESTIONS.reduce(
  (acc, q) => recordAnswer(acc, q.id, byAxis[q.axis]), emptyAnswers());

test('three questions to an axis, so a majority always exists', () => {
  // Two can tie 1–1 and a tie needs a rule that is a coin toss wearing a
  // name. The scorer has no tie-break because it must never need one.
  const perAxis = {};
  for (const q of MBTI_QUESTIONS) perAxis[q.axis] = (perAxis[q.axis] ?? 0) + 1;
  for (const axis of MBTI_AXES) {
    assert.equal(perAxis[axis.id], 3, `${axis.id} has ${perAxis[axis.id]} questions, not 3`);
    assert.ok(perAxis[axis.id] % 2 === 1, `${axis.id} can tie`);
  }
});

test('every question names an axis that exists, and two poles that do', () => {
  const axisIds = new Set(MBTI_AXES.map(a => a.id));
  for (const q of MBTI_QUESTIONS) {
    assert.ok(axisIds.has(q.axis), `${q.id} is scored onto ${q.axis}, which is not an axis`);
    const axis = MBTI_AXES.find(a => a.id === q.axis);
    assert.equal(q.options.length, 2, `${q.id} is not a choice between two`);
    const poles = q.options.map(o => o.pole);
    assert.deepEqual([...poles].sort(), Object.keys(axis.poles).sort(),
      `${q.id} does not offer both of ${q.axis}'s poles`);
  }
});

test('there is no type until the last question is answered', () => {
  let answers = emptyAnswers();
  for (const q of MBTI_QUESTIONS.slice(0, MBTI_QUESTIONS.length - 1)) {
    answers = recordAnswer(answers, q.id, q.options[0].pole);
    assert.equal(mbtiType(answers), null, 'a partial answer produced a type');
  }
  const last = MBTI_QUESTIONS[MBTI_QUESTIONS.length - 1];
  answers = recordAnswer(answers, last.id, last.options[0].pole);
  assert.ok(mbtiType(answers), 'the last answer did not finish the test');
});

test('the code is written in axis order, one letter each', () => {
  const answers = answerAll({ table: 'quiet', known: 'new', flavour: 'mild', risk: 'safe' });
  const type = mbtiType(answers);
  assert.equal(type.code, 'QNMS');
  assert.equal(type.code.length, MBTI_AXES.length);
  assert.deepEqual(type.axes, { table: 'quiet', known: 'new', flavour: 'mild', risk: 'safe' });
});

test('a 2–1 majority decides an axis, not the last answer given', () => {
  const answers = MBTI_QUESTIONS.reduce((acc, q, i) => {
    if (q.axis !== 'flavour') return recordAnswer(acc, q.id, q.options[0].pole);
    // Two mild then one bold: the bold is answered last and must not win.
    return recordAnswer(acc, q.id, i % 3 === 2 ? 'bold' : 'mild');
  }, emptyAnswers());
  assert.equal(mbtiType(answers).axes.flavour, 'mild');
});

test('changing an answer replaces it rather than counting twice', () => {
  const first = recordAnswer(emptyAnswers(), 'm1', 'quiet');
  const second = recordAnswer(first, 'm1', 'talk');
  assert.equal(second.m1, 'talk');
  assert.equal(mbtiProgress(second).done, 1, 'one question answered twice counted as two');
});

test('progress and the next card agree about where the reader is', () => {
  let answers = emptyAnswers();
  assert.equal(mbtiProgress(answers).done, 0);
  assert.equal(nextQuestion(answers).id, MBTI_QUESTIONS[0].id);
  answers = recordAnswer(answers, MBTI_QUESTIONS[0].id, MBTI_QUESTIONS[0].options[0].pole);
  assert.equal(mbtiProgress(answers).done, 1);
  assert.equal(nextQuestion(answers).id, MBTI_QUESTIONS[1].id);
  const full = answerAll({ table: 'quiet', known: 'new', flavour: 'mild', risk: 'safe' });
  assert.equal(nextQuestion(full), null, 'a finished test still has a next question');
  assert.equal(isComplete(full), true);
});

test('all sixteen codes can be produced, and each one has a name', () => {
  const produced = new Set();
  for (const table of ['quiet', 'talk']) {
    for (const known of ['new', 'known']) {
      for (const flavour of ['mild', 'bold']) {
        for (const risk of ['safe', 'adventurous']) {
          produced.add(mbtiType(answerAll({ table, known, flavour, risk })).code);
        }
      }
    }
  }
  assert.equal(produced.size, 16, 'two answer sets collapsed onto one code');
  const named = new Set(MBTI_CODES);
  assert.deepEqual([...produced].filter(c => !named.has(c)), [], 'a code with no name');
  assert.deepEqual([...named].filter(c => !produced.has(c)), [], 'a name nothing can reach');
});

test('every question, option and axis reads in all seven languages', () => {
  // audit-i18n cannot see a string that comes out of a table, so a hole here
  // passes it and prints English to a Korean reader. This is the check that
  // would catch that.
  for (const q of MBTI_QUESTIONS) {
    for (const l of LOCALES) {
      assert.ok(q.stem[l], `${q.id} has no stem in ${l}`);
      q.options.forEach((o, i) => assert.ok(o.text[l], `${q.id} option ${i} has nothing in ${l}`));
    }
    assert.notEqual(q.stem.ko, q.stem.en, `${q.id} shows a Korean reader the English stem`);
  }
  for (const a of MBTI_AXES) {
    for (const l of LOCALES) {
      assert.ok(a.label[l], `${a.id} has no label in ${l}`);
      for (const p of Object.keys(a.poleLabel)) {
        assert.ok(a.poleLabel[p][l], `${a.id}.${p} has nothing in ${l}`);
      }
    }
  }
});

test('a type reads in every language, and no two share a name', () => {
  for (const code of MBTI_CODES) {
    for (const l of LOCALES) {
      assert.ok(mbtiTypeLabel(code, l), `${code} has nothing to say in ${l}`);
    }
    assert.notEqual(mbtiTypeLabel(code, LOCALE.KO), mbtiTypeLabel(code, LOCALE.EN),
      `${code} shows a Korean reader the English name`);
  }
  // Sixteen names is enough that the danger is two of them being the same
  // sentence, not one of them being wrong.
  const korean = MBTI_CODES.map(c => MBTI_TYPES[c].ko);
  assert.equal(new Set(korean).size, korean.length, 'two types share a Korean name');
  const english = MBTI_CODES.map(c => MBTI_TYPES[c].en);
  assert.equal(new Set(english).size, english.length, 'two types share an English name');
});

test('every pole has a chip in every language', () => {
  for (const axis of MBTI_AXES) {
    for (const pole of Object.keys(axis.poles)) {
      for (const l of LOCALES) {
        assert.ok(mbtiPoleLabel(axis.id, pole, l), `${axis.id}.${pole} has no chip in ${l}`);
      }
    }
  }
});
