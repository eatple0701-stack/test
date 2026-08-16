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

test('a filter the reader set explains it better than the app being bare', () => {
  // All three filters, each against a genuinely empty app: the reader can undo
  // a filter, so that is the more useful answer even when both are true.
  assert.equal(emptyReason({ open: [], shown: [], womenFilter: true }), EMPTY.GENDER);
  assert.equal(emptyReason({ open: [], shown: [], dayFilter: '2026-08-06' }), EMPTY.DAY);
  assert.equal(emptyReason({ open: [], shown: [], menuFilter: 'bossam' }), EMPTY.DISH);
});

test('a group explains an empty list, and a dish explains it better', () => {
  // The front page's category cards set groupFilter; the dish chips inside a
  // group set menuFilter on top. When both are on, the dish is the narrower
  // choice and the one the reset button undoes first.
  assert.equal(emptyReason({ open: [], shown: [], groupFilter: 'kbbq' }), EMPTY.GROUP);
  assert.equal(
    emptyReason({ open: [], shown: [], groupFilter: 'kbbq', menuFilter: 'samgyeopsal' }),
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
