import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyReason, emptyText, hasOtherDays, EMPTY } from '../policy/emptiness.js';

const table = (date) => ({ id: date, date, menuId: 'samgyeopsal' });

test('a list with something in it has no empty reason', () => {
  assert.equal(emptyReason({ open: [table('2026-08-06')], shown: [table('2026-08-06')] }), null);
});

test('an empty app is not blamed on a filter nobody set', () => {
  // The bug this file exists for. With no tables at all the dish chips do not
  // render, so there is no dish filter to be the reason — and the screen said
  // "No table for this one yet" to somebody who had chosen nothing.
  assert.equal(emptyReason({ open: [], shown: [] }), EMPTY.NONE);
  const text = emptyText(EMPTY.NONE);
  assert.ok(!/this one|this dish/i.test(text.title + text.body),
    'the empty-app copy still points at a dish nobody chose');
});

test('a bare week is not blamed on a filter', () => {
  // This test used to assert the opposite, and the opposite was wrong. The
  // old rule led with the filters because a filter is what the reader can
  // undo — true, but only when undoing it would show them something. With no
  // upcoming tables at all there is nothing behind the chip, and "nobody has
  // said their gender yet" is a false explanation for an empty week.
  //
  // It went live: on 2026-09-01 the pilot week had no tables, and turning on
  // 여성 동석 swapped a true sentence for a false one. A test had pinned the
  // false one, which is the part worth remembering — a test can preserve a
  // wrong answer as easily as a right one, and being pinned is not evidence.
  for (const filter of [
    { womenFilter: true },
    { dayFilter: '2026-08-06' },
    { menuFilter: 'bossam' },
    { groupFilter: 'kbbq' },
  ]) {
    assert.equal(emptyReason({ open: [], shown: [], ...filter }), EMPTY.NONE,
      `${JSON.stringify(filter)} was blamed for a week that had nothing in it`);
  }
});

test('a filter that really is hiding something is named', () => {
  // The other half, and the reason the filters are still checked at all: when
  // the week has tables and the reader cannot see them, the chip they set is
  // the true and actionable answer.
  const week = [{ id: 't1', date: '2026-08-06' }];
  assert.equal(emptyReason({ open: week, shown: [], womenFilter: true }), EMPTY.GENDER);
  assert.equal(emptyReason({ open: week, shown: [], dayFilter: '2026-08-07' }), EMPTY.DAY);
  assert.equal(emptyReason({ open: week, shown: [], menuFilter: 'bossam' }), EMPTY.DISH);
  assert.equal(emptyReason({ open: week, shown: [], groupFilter: 'kbbq' }), EMPTY.GROUP);
});

test('a group explains an empty list, and a dish explains it better', () => {
  // The front page's category cards set groupFilter; the dish chips inside a
  // group set menuFilter on top. When both are on, the dish is the narrower
  // choice and the one the reset button undoes first.
  //
  // `open` has a table in it now. It used to be empty here, which stopped
  // being a fair test of precedence the moment a bare week began outranking
  // every filter — the question is which of two true explanations is better,
  // and neither is true when there is nothing to explain.
  const week = [{ id: 't1', date: '2026-08-06' }];
  assert.equal(emptyReason({ open: week, shown: [], groupFilter: 'kbbq' }), EMPTY.GROUP);
  assert.equal(
    emptyReason({ open: week, shown: [], groupFilter: 'kbbq', menuFilter: 'samgyeopsal' }),
    EMPTY.DISH,
  );
  assert.match(emptyText(EMPTY.GROUP).title, /category/);
});

test('the day case never promises tables it has not seen', () => {
  const week = [table('2026-08-06'), table('2026-08-07')];
  assert.equal(hasOtherDays(week, '2026-08-06'), true);
  assert.match(emptyText(EMPTY.DAY, { otherDays: true }).body, /Other days have tables/);

  // The whole week is bare, or the only table there is happens to be on the
  // day being looked at — either way, "other days have tables" is a lie.
  assert.equal(hasOtherDays([], '2026-08-06'), false);
  assert.equal(hasOtherDays([table('2026-08-06')], '2026-08-06'), false);
  const bare = emptyText(EMPTY.DAY, { otherDays: false });
  assert.ok(!/Other days have tables/.test(bare.body));
  assert.match(bare.body, /Open a table/);
});

test('every reason produces something to read', () => {
  for (const reason of Object.values(EMPTY)) {
    const text = emptyText(reason);
    assert.ok(text, `${reason} has no copy`);
    assert.ok(text.title.trim().length > 0, `${reason} has no title`);
    assert.ok(text.body.trim().length > 0, `${reason} has no body`);
  }
  assert.equal(emptyText(null), null);
  assert.equal(emptyText('made-up'), null);
});

test('an empty app points at what is free rather than at signing up', () => {
  // AccessPolicy: browsing every dish, phrase and place was always open, and
  // an empty week is the worst moment to meet a wall. The one thing this
  // screen must not do is make an account the only way out of a blank page.
  const { title, body } = emptyText(EMPTY.NONE);
  const text = `${title} ${body}`.toLowerCase();
  assert.ok(!/sign up|join|account|가입/.test(text), 'the empty app asks for an account');
  assert.match(text, /dish|phrase|place/);
});

test('a reason survives missing input rather than throwing', () => {
  // This runs while `tables` is still null on first paint.
  assert.equal(emptyReason(), EMPTY.NONE);
  assert.equal(emptyReason({}), EMPTY.NONE);
  assert.equal(hasOtherDays(), false);
});
