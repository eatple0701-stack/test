// ReviewPolicy — one line, written after the meal, by somebody who was there.
//
// 김훈 부장님's review asked for 후기 alongside 신고 and 차단, and Meetup's
// pages show why it matters: a stranger deciding whether to sit down is
// reading for proof that evenings like this one actually happened. The app
// already holds the honest half of that proof — attendance — and this file
// adds the human half: what the evening was like, in the words of somebody
// who ate it.
//
// The rules are about who may speak, because a review system's worth is
// exactly the worth of that gate:
//
//   - only an accepted seat. A request the host declined is not an evening.
//   - only after the meal. A review of a dinner that has not happened is a
//     prediction wearing a memory's clothes.
//   - not on a cancelled table. There was no meal to review.
//   - not from a recorded no-show. Somebody the host says never came does
//     not get to describe the food. If the mark is wrong, the note under
//     attendanceNote already says who corrects it.
//
// One line per seat, editable — your memory of an evening is yours to
// rephrase. There are no star ratings anywhere in this on purpose. A number
// out of five is a judgement the reader cannot interrogate; a sentence shows
// its own evidence.

import { isAccepted } from './seatRequest.js';
import { isNoShow } from './attendance.js';
import { isCancelled } from './cancellation.js';
import { isPast } from './table.js';

/** Enough for a real sentence or three, too short for a blog post. */
export const REVIEW_MAX = 200;

export const cleanReview = (text) =>
  typeof text === 'string' ? text.trim().slice(0, REVIEW_MAX) : '';

/**
 * May this person write (or rewrite) a line about this table?
 * The database floor checks the accepted seat; the rest is judged here.
 */
export function canReview({ signup, table } = {}) {
  if (!signup || !table) return false;
  if (!isAccepted(signup)) return false;
  if (isNoShow(signup)) return false;
  if (isCancelled(table)) return false;
  return isPast(table);
}

/**
 * What the input asks for. Worded as memory, not as judgement — the point is
 * the next traveller reading proof that the table was real people eating,
 * not a merchant being scored.
 */
export const REVIEW_PROMPT = {
  title: '한 줄 남기기 · How was it?',
  hint: 'One line, shown on this table with your name. What you ate, what surprised you, what you would tell the next person.',
  save: '남기기 · Leave it',
  saved: 'On the record.',
};

/** The heading over other people's lines on a table page. */
export const REVIEWS_HEADING = '다녀간 사람들 · From people who went';
