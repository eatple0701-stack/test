import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEAT_STATUS, statusOf, isHolding, pendingSignups,
  LAPSE_HOURS_BEFORE_MEAL, lapseAt, hasLapsed, isWaiting, stillHolding,
  DECIDE_BLOCK, acceptBlocker, canAccept, canDecline, requestState,
} from '../policy/seatRequest.js';

const HOST = 'host-1';
const table = (over = {}) => ({
  id: 't1', hostId: HOST, seats: 4, date: '2026-08-10', time: '19:00', ...over,
});
const at = (iso) => new Date(iso);
const sign = (over = {}) => ({ id: 's1', userId: 'g1', status: SEAT_STATUS.PENDING, createdAt: '2026-08-01T10:00:00Z', ...over });

test('a row written before this policy existed reads as a confirmed seat', () => {
  // Not pending. Those people were already going under the rules of the day
  // they joined, and re-opening the question would un-invite them.
  assert.equal(statusOf({ id: 'old' }), SEAT_STATUS.ACCEPTED);
  assert.equal(statusOf({ id: 'old', status: undefined }), SEAT_STATUS.ACCEPTED);
  assert.equal(statusOf({ id: 'junk', status: 'banana' }), SEAT_STATUS.ACCEPTED);
  assert.equal(statusOf(null), SEAT_STATUS.ACCEPTED);
});

test('a pending request holds its seat, a declined one gives it back', () => {
  assert.equal(isHolding(sign({ status: SEAT_STATUS.PENDING })), true);
  assert.equal(isHolding(sign({ status: SEAT_STATUS.ACCEPTED })), true);
  assert.equal(isHolding(sign({ status: SEAT_STATUS.DECLINED })), false);
});

test('a host cannot promise more seats than the table has', () => {
  // Three seats to give at a four-seat table, because the host sits at it.
  const t = table({ seats: 4 });
  const held = [
    sign({ id: 'a', status: SEAT_STATUS.ACCEPTED }),
    sign({ id: 'b', status: SEAT_STATUS.ACCEPTED }),
    sign({ id: 'c', status: SEAT_STATUS.ACCEPTED }),
  ];
  const fourth = sign({ id: 'd', status: SEAT_STATUS.PENDING });
  assert.equal(
    acceptBlocker({ signup: fourth, signups: [...held, fourth], table: t, userId: HOST, now: at('2026-08-05T10:00:00Z') }),
    DECIDE_BLOCK.NO_SEATS,
  );
});

test('declining is never blocked by a full table', () => {
  // The one answer that cannot make a table more crowded than it already is,
  // so a host must always be able to give it.
  const t = table({ seats: 2 });
  const req = sign({ status: SEAT_STATUS.PENDING });
  assert.equal(canDecline({ signup: req, table: t, userId: HOST }), true);
  assert.notEqual(
    acceptBlocker({ signup: req, signups: [req, sign({ id: 'x', status: SEAT_STATUS.ACCEPTED })], table: t, userId: HOST, now: at('2026-08-05T10:00:00Z') }),
    null,
  );
});

test('only the host answers, and only once', () => {
  const t = table();
  const req = sign();
  const now = at('2026-08-05T10:00:00Z');
  assert.equal(acceptBlocker({ signup: req, signups: [req], table: t, userId: 'somebody-else', now }), DECIDE_BLOCK.NOT_HOST);
  assert.equal(canDecline({ signup: req, table: t, userId: 'somebody-else' }), false);
  const done = sign({ status: SEAT_STATUS.ACCEPTED });
  assert.equal(acceptBlocker({ signup: done, signups: [done], table: t, userId: HOST, now }), DECIDE_BLOCK.ALREADY_DECIDED);
  assert.equal(canDecline({ signup: done, table: t, userId: HOST }), false);
});

test('a meal that already happened cannot be answered', () => {
  const t = table();
  const req = sign();
  assert.equal(
    acceptBlocker({ signup: req, signups: [req], table: t, userId: HOST, now: at('2026-08-11T09:00:00Z') }),
    DECIDE_BLOCK.PAST,
  );
});

test('a request lapses twelve hours before the meal, not at it', () => {
  const t = table({ date: '2026-08-10', time: '19:00' });
  const req = sign();
  const cut = lapseAt(t);
  assert.equal(LAPSE_HOURS_BEFORE_MEAL, 12);
  // 19:00 local minus twelve hours is 07:00 the same morning.
  assert.equal(cut.getHours(), 7);
  const justBefore = new Date(cut.getTime() - 60_000);
  const justAfter = new Date(cut.getTime() + 60_000);
  assert.equal(hasLapsed(req, t, justBefore), false);
  assert.equal(isWaiting(req, t, justBefore), true);
  assert.equal(hasLapsed(req, t, justAfter), true);
  assert.equal(isWaiting(req, t, justAfter), false);
});

test('an answered request never lapses', () => {
  const t = table();
  const after = at('2026-08-10T18:00:00');
  assert.equal(hasLapsed(sign({ status: SEAT_STATUS.ACCEPTED }), t, after), false);
  assert.equal(hasLapsed(sign({ status: SEAT_STATUS.DECLINED }), t, after), false);
});

test('a lapsed request gives its seat back so the table cannot freeze', () => {
  // The cost of letting pending hold a seat is a silent host. This is the
  // release valve, and capacity has to agree with hasLapsed or the table
  // stays blocked by a request nobody will ever answer.
  const t = table({ seats: 4 });
  const stale = sign({ id: 'stale', status: SEAT_STATUS.PENDING });
  const live = sign({ id: 'live', status: SEAT_STATUS.ACCEPTED });
  const afterCut = at('2026-08-10T12:00:00');
  assert.equal(stillHolding([stale, live], t, afterCut).length, 1);
  assert.equal(stillHolding([stale, live], t, at('2026-08-05T12:00:00')).length, 2);
});

test('the host answers requests in the order they arrived', () => {
  const later = sign({ id: 'later', createdAt: '2026-08-02T09:00:00Z' });
  const earlier = sign({ id: 'earlier', createdAt: '2026-08-01T09:00:00Z' });
  const decided = sign({ id: 'decided', status: SEAT_STATUS.ACCEPTED, createdAt: '2026-08-01T08:00:00Z' });
  assert.deepEqual(pendingSignups([later, earlier, decided]).map(s => s.id), ['earlier', 'later']);
});

test('a waiting traveller is told the deadline, not the word soon', () => {
  // 교수님's question — 매칭 확정은 얼마나 걸리며 — is about whether to keep the
  // evening free, and "soon" does not let anybody plan.
  const t = table();
  const state = requestState(sign(), t, at('2026-08-05T10:00:00Z'));
  assert.equal(state.kind, SEAT_STATUS.PENDING);
  assert.equal(state.seatHeld, true);
  assert.match(state.body, /12 hours/);
});

test('every request state says whether a seat is being held', () => {
  const t = table();
  const early = at('2026-08-05T10:00:00Z');
  assert.equal(requestState(sign({ status: SEAT_STATUS.ACCEPTED }), t, early).seatHeld, true);
  assert.equal(requestState(sign({ status: SEAT_STATUS.DECLINED }), t, early).seatHeld, false);
  assert.equal(requestState(sign(), t, at('2026-08-10T12:00:00')).kind, 'lapsed');
  assert.equal(requestState(sign(), t, at('2026-08-10T12:00:00')).seatHeld, false);
});

test('every decide blocker has a sentence a button can show', async () => {
  const { DECIDE_BLOCK_TEXT } = await import('../policy/seatRequest.js');
  for (const reason of Object.values(DECIDE_BLOCK)) {
    assert.equal(typeof DECIDE_BLOCK_TEXT[reason], 'string', `${reason} has no text`);
    assert.ok(DECIDE_BLOCK_TEXT[reason].length > 0);
  }
});

test('canAccept agrees with acceptBlocker', () => {
  const t = table();
  const req = sign();
  const now = at('2026-08-05T10:00:00Z');
  assert.equal(canAccept({ signup: req, signups: [req], table: t, userId: HOST, now }), true);
  assert.equal(canAccept({ signup: req, signups: [req], table: t, userId: 'x', now }), false);
});
