// The address bar.
//
// Worth testing on its own because both failures it fixes are invisible in
// code review and obvious in a hand: the phone's back button leaving the app,
// and there being no link to send anybody. A round trip that loses a field
// turns a shared table into somebody landing on Explore.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { pathFor, stateFromPath } from '../../routes.js';

const screen = (over = {}) => ({
  activeTab: 'home', tableView: { screen: 'list' }, openThemeId: null, restaurantId: null, ...over,
});

test('every screen has an address', () => {
  assert.equal(pathFor(screen()), '/');
  assert.equal(pathFor(screen({ activeTab: 'match' })), '/tables');
  assert.equal(pathFor(screen({ activeTab: 'places' })), '/places');
  assert.equal(pathFor(screen({ activeTab: 'journal' })), '/passport');
  assert.equal(pathFor(screen({ activeTab: 'profile' })), '/profile');
  assert.equal(
    pathFor(screen({ activeTab: 'match', tableView: { screen: 'create' } })),
    '/tables/new',
  );
  assert.equal(
    pathFor(screen({ activeTab: 'match', tableView: { screen: 'request' } })),
    '/tables/find',
  );
});

test('a table has a link somebody can send', () => {
  // 계획서 핵심기능 5 is SNS 확산, and the app had no shareable object at all.
  const path = pathFor(screen({
    activeTab: 'match', tableView: { screen: 'detail', tableId: 'abc123' },
  }));
  assert.equal(path, '/tables/abc123');

  const back = stateFromPath(path);
  assert.equal(back.activeTab, 'match');
  assert.equal(back.tableView.screen, 'detail');
  assert.equal(back.tableView.tableId, 'abc123');
});

test('the theme page wins, because it renders over whatever tab is beneath', () => {
  const path = pathFor(screen({ activeTab: 'places', openThemeId: 'seoul-after-dark' }));
  assert.equal(path, '/culture/seoul-after-dark');
  assert.equal(stateFromPath(path).openThemeId, 'seoul-after-dark');
});

test('every path round-trips back to the screen it came from', () => {
  const screens = [
    screen(),
    screen({ activeTab: 'match' }),
    screen({ activeTab: 'match', tableView: { screen: 'create' } }),
    screen({ activeTab: 'match', tableView: { screen: 'request' } }),
    screen({ activeTab: 'match', tableView: { screen: 'detail', tableId: 't-9' } }),
    screen({ activeTab: 'places' }),
    screen({ activeTab: 'places', restaurantId: 'r-4' }),
    screen({ activeTab: 'journal' }),
    screen({ activeTab: 'profile' }),
    screen({ openThemeId: 'street-food' }),
  ];
  for (const s of screens) {
    const path = pathFor(s);
    assert.equal(pathFor(stateFromPath(path)), path, `${path} did not survive the round trip`);
  }
});

test('a link that no longer means anything opens the app rather than breaking it', () => {
  // Somebody shares a table on Saturday and it is cancelled on Sunday. The
  // link should land them somewhere, not on a blank screen.
  for (const junk of ['/nonsense', '', '/culture', '/tables/', undefined]) {
    const s = stateFromPath(junk);
    assert.ok(['home', 'match'].includes(s.activeTab), `${junk} produced no usable screen`);
  }
  assert.equal(stateFromPath('/nonsense').activeTab, 'home');
  assert.equal(stateFromPath('/culture').openThemeId, null);
});
