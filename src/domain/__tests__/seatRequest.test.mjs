import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEAT_STATUS, statusOf, isHolding, pendingSignups, acceptedSignups, affectedByCancellation,
  LAPSE_HOURS_BEFORE_MEAL, lapseAt, hasLapsed, isWaiting, stillHolding,
  DECIDE_BLOCK, acceptBlocker, canAccept, canDecline, requestState,
  askDeadline,
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

test('a table advertises the seats it gave, not the times it was asked', () => {
  // signups.length was the count on screen, so "take a seat and there would
  // be N of you" grew every time somebody asked — including the people the
  // host had turned down.
  const rows = [
    sign({ id: 'a', status: SEAT_STATUS.ACCEPTED }),
    sign({ id: 'b', status: SEAT_STATUS.DECLINED }),
    sign({ id: 'c', status: SEAT_STATUS.PENDING }),
    // Written before this policy existed: no status at all, which statusOf
    // reads as a confirmed seat. The helper defaults to pending, so this one
    // has to clear it explicitly or it is not testing the legacy case.
    sign({ id: 'old', status: undefined }),
  ];
  assert.deepEqual(acceptedSignups(rows).map(s => s.id), ['a', 'old']);
});

test('calling a table off affects the seated and the still-waiting, nobody else', () => {
  const t = table();
  const early = at('2026-08-05T10:00:00Z');
  const rows = [
    sign({ id: 'seated', status: SEAT_STATUS.ACCEPTED }),
    sign({ id: 'waiting', status: SEAT_STATUS.PENDING }),
    sign({ id: 'refused', status: SEAT_STATUS.DECLINED }),
  ];
  assert.deepEqual(affectedByCancellation(rows, t, early).map(s => s.id), ['seated', 'waiting']);
  // Once a request has lapsed its seat is already back and the person has
  // already been told to make other plans.
  const late = at('2026-08-10T12:00:00');
  assert.deepEqual(affectedByCancellation(rows, t, late).map(s => s.id), ['seated']);
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

test('a cancelled table overrules whatever the seat says', () => {
  // "Your seat is confirmed — the host is expecting you" stayed true of the
  // row and false of the evening, and rendered directly under a notice
  // saying the table had been called off.
  const off = table({ cancelledAt: '2026-08-03T10:00:00Z' });
  const now = at('2026-08-05T10:00:00Z');
  for (const status of [SEAT_STATUS.ACCEPTED, SEAT_STATUS.PENDING, SEAT_STATUS.DECLINED]) {
    const state = requestState(sign({ status }), off, now);
    assert.equal(state.kind, 'cancelled', `${status} should read as cancelled`);
    // Nothing left to hold a seat at, so no withdraw button either.
    assert.equal(state.seatHeld, false);
  }
});

test('a host cannot give away a seat at a meal that is not happening', () => {
  const off = table({ cancelledAt: '2026-08-03T10:00:00Z' });
  const req = sign();
  assert.equal(
    acceptBlocker({ signup: req, signups: [req], table: off, userId: HOST, now: at('2026-08-05T10:00:00Z') }),
    DECIDE_BLOCK.CANCELLED,
  );
});

test('the deadline to ask is printed only while it is worth acting on', () => {
  // 야놀자's countdown invents a deadline to hurry people. This one already
  // exists, is enforced in code, and gives the seat back when it passes —
  // printing it is telling somebody what they would ask if they knew to.
  const meal = (hoursFromNow) => {
    const at = new Date(Date.now() + hoursFromNow * 3600000);
    return {
      id: 't',
      date: `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`,
      time: `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`,
      cancelledAt: null,
    };
  };

  // A dinner 20 hours out: the 12-hour cutoff is 8 hours away, which is a
  // number somebody can act on tonight.
  const soon = askDeadline(meal(20));
  assert.ok(soon, 'a deadline inside the day should be stated');
  assert.equal(soon.hours, 7, 'floors to whole hours remaining');
  assert.equal(soon.urgent, false);
  assert.match(soon.en, /the seat reopens/);

  // Under three hours it earns emphasis.
  assert.equal(askDeadline(meal(14)).urgent, true);

  // Beyond a day the number stops being a decision aid, and a permanent
  // ticking clock on every card is the manufactured pressure this refuses.
  assert.equal(askDeadline(meal(72)), null, 'a deadline three days out says nothing useful');

  // Past the cutoff there is nothing left to ask for.
  assert.equal(askDeadline(meal(6)), null, 'inside the 12-hour window');
  assert.equal(askDeadline(meal(-2)), null, 'the meal already happened');
});

test('a cancelled table has no deadline to advertise', () => {
  const at = new Date(Date.now() + 20 * 3600000);
  const ymd = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
  assert.equal(askDeadline({ date: ymd, time: '19:00', cancelledAt: Date.now() }), null);
  assert.equal(askDeadline(null), null);
  assert.equal(askDeadline({ date: 'nonsense' }), null);
});
