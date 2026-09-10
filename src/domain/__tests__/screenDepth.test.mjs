import test from 'node:test';
import assert from 'node:assert/strict';
import { NAV, laneOf, depthOf, viewKey, directionBetween } from '../policy/screenDepth.js';

const tab = (activeTab, tableView = { screen: 'list' }) => ({ activeTab, tableView, openThemeId: null });
const theme = (id) => ({ activeTab: 'home', tableView: { screen: 'list' }, openThemeId: id });

test('a table you opened is deeper than the list you opened it from', () => {
  const list = tab('match');
  const detail = tab('match', { screen: 'detail', tableId: 't1' });
  assert.equal(depthOf(list), 0);
  assert.equal(depthOf(detail), 1);
  assert.equal(directionBetween(list, detail), NAV.forward);
  // And the way back out is the same move played backwards, which is the
  // whole point of asking.
  assert.equal(directionBetween(detail, list), NAV.back);
});

test('opening a table and creating one are both a step in', () => {
  const list = tab('match');
  for (const screen of ['detail', 'create', 'request']) {
    assert.equal(directionBetween(list, tab('match', { screen })), NAV.forward, screen);
    assert.equal(directionBetween(tab('match', { screen }), list), NAV.back, screen);
  }
});

test('another tab is sideways, however deep either screen is', () => {
  assert.equal(directionBetween(tab('match'), tab('places')), NAV.lateral);
  assert.equal(directionBetween(tab('journal'), tab('main')), NAV.lateral);
  // Deep on one side and shallow on the other still is not a step: the two
  // screens are not on the same ladder.
  assert.equal(directionBetween(tab('match', { screen: 'detail' }), tab('home')), NAV.lateral);
  assert.equal(directionBetween(tab('home'), tab('match', { screen: 'detail' })), NAV.lateral);
});

test('two screens at the same depth cross-fade rather than slide', () => {
  const a = tab('match', { screen: 'detail', tableId: 't1' });
  const b = tab('match', { screen: 'detail', tableId: 't2' });
  assert.equal(directionBetween(a, b), NAV.lateral);
  // Different screens, though — the key has to notice, or the second one
  // arrives with no entrance at all.
  assert.notEqual(viewKey(a), viewKey(b));
});

test('a theme page sits under 문화', () => {
  // The lane comes from activeTab alone — see laneOf's note. What makes a
  // theme a step in rather than a tab change is its depth.
  assert.equal(laneOf(theme('seoul')), 'home');
  assert.equal(depthOf(theme('seoul')), 1);
  assert.equal(directionBetween(tab('home'), theme('seoul')), NAV.forward);
  assert.equal(directionBetween(theme('seoul'), tab('home')), NAV.back);

  // Opening a theme from a table detail is one move across the app, not a
  // step out of the table and a step into the theme.
  const fromTableDetail = tab('match', { screen: 'detail', tableId: 't1' });
  assert.equal(directionBetween(fromTableDetail, theme('seoul')), NAV.lateral);
});

test('the first render has nowhere to have come from', () => {
  assert.equal(directionBetween(null, tab('match')), NAV.lateral);
  assert.equal(directionBetween(undefined, tab('match')), NAV.lateral);
  assert.equal(directionBetween(tab('match'), null), NAV.lateral);
});

test('the key changes when the screen does, and not when it does not', () => {
  // Two renders of the same screen: setTableView hands back a new object
  // every time, so identity says "changed" when nothing has.
  assert.equal(viewKey(tab('match')), viewKey(tab('match')));
  assert.equal(
    viewKey(tab('match', { screen: 'detail', tableId: 't1' })),
    viewKey(tab('match', { screen: 'detail', tableId: 't1' })),
  );
  assert.notEqual(viewKey(tab('match')), viewKey(tab('places')));
  assert.notEqual(viewKey(tab('home')), viewKey(theme('seoul')));
});

test('nothing throws on a half-built view', () => {
  assert.equal(depthOf(undefined), 0);
  assert.equal(depthOf({}), 0);
  assert.equal(laneOf({}), null);
  assert.equal(viewKey(undefined), '///');
});
