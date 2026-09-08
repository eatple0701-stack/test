// Scoring for 음식 MBTI.
//
// Pulled out of the component for the same reason rail.js and taste.js were:
// this is the half that can be wrong quietly. A question counted onto the
// wrong axis, a code assembled out of order, a result that appears before the
// last question is answered — none of those throw, and none of them are
// visible in a DOM query.
//
// The deck's tasteType() reads a lean off dishes somebody picked. This reads
// answers to questions somebody was asked. They are different measurements of
// different things and they are allowed to disagree; nothing here tries to
// reconcile them, and the passport shows them as two records rather than two
// versions of one.

import { MBTI_AXES, MBTI_QUESTIONS } from '../../content/foodMbti.js';

/** Nothing answered yet. */
export const emptyAnswers = () => ({});

/**
 * The answers with one question's pole written in.
 *
 * Returns a new object rather than mutating, and overwrites rather than
 * appending: a reader who goes back and changes their mind has changed their
 * mind, not answered twice.
 */
export function recordAnswer(answers, questionId, pole) {
  if (!questionId || !pole) return { ...(answers ?? {}) };
  return { ...(answers ?? {}), [questionId]: pole };
}

/** How far through, for the line above the card. */
export function mbtiProgress(answers, questions = MBTI_QUESTIONS) {
  const asked = questions ?? [];
  const done = asked.filter(q => (answers ?? {})[q.id]).length;
  return { done, total: asked.length };
}

/** The next unanswered question, or null when there are none left. */
export function nextQuestion(answers, questions = MBTI_QUESTIONS) {
  return (questions ?? []).find(q => !(answers ?? {})[q.id]) ?? null;
}

/** Is every question answered? */
export const isComplete = (answers, questions = MBTI_QUESTIONS) => {
  const { done, total } = mbtiProgress(answers, questions);
  return total > 0 && done === total;
};

/**
 * The winning pole of one axis, or null if its questions are not all in.
 *
 * Three questions to an axis means a majority always exists — 2–1 or 3–0 —
 * so there is no tie-break here and there should never need to be one. If a
 * fourth question is ever added to an axis, this returns the first pole on a
 * 2–2, which is a coin toss wearing a rule; add a fifth instead.
 */
function poleOf(axis, answers, questions) {
  const mine = (questions ?? []).filter(q => q.axis === axis.id);
  if (!mine.length) return null;
  const counts = new Map();
  for (const q of mine) {
    const pole = (answers ?? {})[q.id];
    if (!pole) return null;
    counts.set(pole, (counts.get(pole) ?? 0) + 1);
  }
  let best = null;
  let bestCount = -1;
  for (const pole of Object.keys(axis.poles)) {
    const n = counts.get(pole) ?? 0;
    if (n > bestCount) { best = pole; bestCount = n; }
  }
  return best;
}

/**
 * The type, or null until every question is answered.
 *
 * Null rather than a partial code, because this is a test and a test has an
 * end. A four-letter code assembled from eight answers would be three letters
 * of reading and one of guesswork, and the reader could not tell which.
 */
export function mbtiType(answers, { axes = MBTI_AXES, questions = MBTI_QUESTIONS } = {}) {
  if (!isComplete(answers, questions)) return null;
  const chosen = {};
  let code = '';
  for (const axis of axes) {
    const pole = poleOf(axis, answers, questions);
    if (!pole) return null;
    chosen[axis.id] = pole;
    code += axis.poles[pole];
  }
  return { code, axes: chosen };
}
