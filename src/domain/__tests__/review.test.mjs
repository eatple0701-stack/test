import test from 'node:test';
import assert from 'node:assert/strict';
import { canReview, cleanReview, REVIEW_MAX, REVIEW_PROMPT } from '../policy/review.js';

// ReviewPolicy — who may describe an evening.
//
// The whole worth of a review is the gate on its author. These tests pin the
// four refusals; the fixtures are built so each case flips exactly one fact,
// because a gate tested only with obviously-good and obviously-bad inputs
// hides which rule actually fired.

const yesterday = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const pastTable = (over = {}) => ({ id: 't1', date: yesterday(), time: '19:00', cancelledAt: null, ...over });
const seat = (over = {}) => ({ id: 's1', status: 'accepted', attendance: null, ...over });

test('an accepted seat at a past meal may leave a line', () => {
  assert.equal(canReview({ signup: seat(), table: pastTable() }), true);
});

test('a meal that has not happened cannot be remembered yet', () => {
  assert.equal(canReview({ signup: seat(), table: pastTable({ date: tomorrow() }) }), false);
});

test('a declined or pending request was never an evening', () => {
  assert.equal(canReview({ signup: seat({ status: 'declined' }), table: pastTable() }), false);
  assert.equal(canReview({ signup: seat({ status: 'pending' }), table: pastTable() }), false);
});

test('a legacy seat with no status column counts as accepted, same as everywhere else', () => {
  // statusOf() reads undefined as accepted so pre-approval rows keep working;
  // the review gate must agree with that reading rather than re-decide it.
  assert.equal(canReview({ signup: seat({ status: undefined }), table: pastTable() }), true);
});

test('a recorded no-show does not get to describe the food', () => {
  assert.equal(canReview({ signup: seat({ attendance: 'no_show' }), table: pastTable() }), false);
});

test('a cancelled table had no meal on it to review', () => {
  assert.equal(canReview({ signup: seat(), table: pastTable({ cancelledAt: Date.now() }) }), false);
});

test('a line is trimmed and capped, never refused for length', () => {
  assert.equal(cleanReview(`  great night  `), 'great night');
  assert.equal(cleanReview('x'.repeat(REVIEW_MAX + 99)).length, REVIEW_MAX);
  assert.equal(cleanReview(undefined), '');
});

test('the prompt asks for memory, not for a score', () => {
  // No star ratings is a design decision, and copy drifts toward asking for
  // one — "rate", "score", "점수" — unless something holds it.
  const text = `${REVIEW_PROMPT.title} ${REVIEW_PROMPT.hint}`.toLowerCase();
  for (const scoreWord of ['rate', 'score', 'stars', '점수', '별점']) {
    assert.ok(!text.includes(scoreWord), `the prompt asks people to "${scoreWord}"`);
  }
});
