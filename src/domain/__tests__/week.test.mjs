import test from 'node:test';
import assert from 'node:assert/strict';
import { weekAhead, localYmd, WEEK_LENGTH, EMPTY_WEEK } from '../policy/week.js';

// The seven-day strip. Date arithmetic is where this app has already been
// bitten once — the day chips were written with toISOString() and filtered
// to yesterday after 9pm Seoul time — so the window is pinned here.

const T = (over = {}) => ({ id: 't', date: '2026-08-06', time: '19:00', cancelledAt: null, ...over });
// A Tuesday afternoon, chosen so the window crosses a weekend.
const NOW = new Date(2026, 7, 4, 15, 0);

test('the strip is seven days starting today', () => {
  const days = weekAhead([], NOW);
  assert.equal(days.length, WEEK_LENGTH);
  assert.equal(days[0].ymd, '2026-08-04');
  assert.equal(days[0].isToday, true);
  assert.equal(days[6].ymd, '2026-08-10');
});

test('empty days are days, not omissions', () => {
  // The whole point of a calendar over a filter chip: a 0 under Thursday is
  // a fact somebody can act on, and the action is opening a table.
  const days = weekAhead([T({ date: '2026-08-06' })], NOW);
  assert.deepEqual(days.map(d => d.count), [0, 0, 1, 0, 0, 0, 0]);
});

test('a cancelled table is not something you can sit at', () => {
  const days = weekAhead([T({ cancelledAt: Date.now() })], NOW);
  assert.equal(days.find(d => d.ymd === '2026-08-06').count, 0);
});

test("today loses its own morning as the day goes on", () => {
  const lunch = T({ date: '2026-08-04', time: '12:30' });
  const dinner = T({ date: '2026-08-04', time: '19:00' });
  const days = weekAhead([lunch, dinner], NOW); // 15:00
  assert.equal(days[0].count, 1, 'a meal at 12:30 is not an option at 15:00');
});

test('the weekend is marked, because a week is read by its weekend first', () => {
  const days = weekAhead([], NOW);
  const flagged = days.filter(d => d.isWeekend).map(d => d.ymd);
  assert.deepEqual(flagged, ['2026-08-08', '2026-08-09'], 'Saturday and Sunday');
});

test('the window is walked on the calendar, not added in milliseconds', () => {
  // 86400000 lands an hour off across a daylight-saving boundary. Korea has
  // none, but this is the file a future traveller in Paris would break on —
  // and the fix is cheap enough that there is no reason to carry the bug.
  const beforeDst = new Date(2026, 2, 27, 22, 0); // 27 Mar, Europe springs forward on the 29th
  const days = weekAhead([], beforeDst);
  assert.deepEqual(
    days.map(d => d.ymd),
    ['2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30', '2026-03-31', '2026-04-01', '2026-04-02'],
  );
});

test('a date is formatted on the wall clock, never in UTC', () => {
  // 23:30 in Seoul is already tomorrow in UTC. The day chips shipped with
  // exactly this bug in an earlier batch.
  assert.equal(localYmd(new Date(2026, 7, 4, 23, 30)), '2026-08-04');
  assert.equal(localYmd(new Date(2026, 7, 4, 0, 10)), '2026-08-04');
});

test('an empty week says what to do, not that something went wrong', () => {
  const text = `${EMPTY_WEEK.kr} ${EMPTY_WEEK.en}`.toLowerCase();
  for (const wrong of ['error', 'sorry', '오류', '실패']) {
    assert.ok(!text.includes(wrong), `the empty week reads as a failure ("${wrong}")`);
  }
});
