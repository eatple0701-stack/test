// Matching a want against the tables that exist.
//
// These matter for one specific day: 17 August, when there are three tables
// and the traveller wants a fourth thing. Every assertion here is about not
// showing somebody an empty screen, or worse, a match they cannot actually
// take.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  matchRequest, requestAsTable, isEmptyRequest, shouldOfferToHost, MATCH,
} from '../policy/matching.js';

const day = 86400000;
const iso = (n) => new Date(Date.now() + n * day).toISOString().slice(0, 10);

const table = (over = {}) => ({
  id: 't', menuId: 'samgyeopsal', hostId: 'h', hostName: 'Minsu',
  date: iso(2), time: '19:00', place: 'Jongno', seats: 4, languages: [], ...over,
});

test('the dish they asked for on the day they asked for it comes first', () => {
  const tables = [
    table({ id: 'other-dish', menuId: 'jokbal' }),
    table({ id: 'other-day', date: iso(9) }),
    table({ id: 'both' }),
  ];
  const out = matchRequest({ menuId: 'samgyeopsal', from: iso(1), to: iso(4) }, tables, []);
  assert.equal(out[0].table.id, 'both');
  assert.equal(out[0].kind, MATCH.EXACT);
});

test('a near miss is offered rather than hidden', () => {
  // Somebody who wanted 곱창 on Saturday and cannot have it would still often
  // take 곱창 on Sunday. Dropping it would leave a blank screen next to a
  // table they would have said yes to.
  const tables = [table({ id: 'sunday', menuId: 'gopchang', date: iso(9) })];
  const out = matchRequest({ menuId: 'gopchang', from: iso(1), to: iso(3) }, tables, []);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, MATCH.DISH);
});

test('a table matching neither the dish nor the days is not a match at all', () => {
  const tables = [table({ id: 'no', menuId: 'jokbal', date: iso(20) })];
  assert.deepEqual(matchRequest({ menuId: 'gopchang', from: iso(1), to: iso(3) }, tables, []), []);
});

test('no dish named means anything, which is a real thing to want', () => {
  const tables = [table({ id: 'a', menuId: 'jokbal' }), table({ id: 'b', menuId: 'bossam' })];
  const out = matchRequest({ from: iso(1), to: iso(4) }, tables, []);
  assert.equal(out.length, 2);
  assert.ok(out.every(m => m.kind === MATCH.EXACT));
});

test('a table they cannot sit at is not an answer', () => {
  // A perfect match that is full, already theirs, or already taken is a
  // second disappointment rather than a result.
  const full = table({ id: 'full', seats: 2 });
  const mine = table({ id: 'mine', hostId: 'me' });
  const joined = table({ id: 'joined' });
  const signups = [
    { id: 's1', tableId: 'full', userId: 'x' },
    { id: 's2', tableId: 'joined', userId: 'me' },
  ];
  const out = matchRequest({ menuId: 'samgyeopsal' }, [full, mine, joined], signups, 'me');
  assert.deepEqual(out.map(m => m.table.id), []);
});

test('a meal that already happened never matches', () => {
  const gone = table({ id: 'gone', date: iso(-3) });
  assert.deepEqual(matchRequest({ menuId: 'samgyeopsal' }, [gone], []), []);
});

test('among equal matches, a shared language outranks a sooner meal', () => {
  // A dinner you cannot follow is not sooner in any sense that matters.
  const tables = [
    table({ id: 'soon-mute', date: iso(1), languages: ['한국어'] }),
    table({ id: 'later-shared', date: iso(3), languages: ['English'] }),
  ];
  const out = matchRequest({ menuId: 'samgyeopsal', languages: ['English'] }, tables, []);
  assert.equal(out[0].table.id, 'later-shared');
  assert.deepEqual(out[0].shared, ['English']);
});

test('the request hands itself back as a table they could open', () => {
  // The whole answer to an empty result: in this product the person who wants
  // the meal is the person who can offer it.
  const asTable = requestAsTable({ menuId: 'gopchang', from: iso(3), place: 'Hongdae', languages: ['English'] });
  assert.equal(asTable.menuId, 'gopchang');
  assert.equal(asTable.date, iso(3));
  assert.equal(asTable.place, 'Hongdae');
  assert.deepEqual(asTable.languages, ['English']);
  // Seats are the dish's rule, not the requester's, and the form already
  // knows the minimum.
  assert.equal(asTable.seats, undefined);
});

test('an untouched form is not a request', () => {
  assert.ok(isEmptyRequest({}));
  assert.ok(isEmptyRequest({ place: '   ' }));
  assert.ok(isEmptyRequest(null));
  assert.ok(!isEmptyRequest({ menuId: 'bossam' }));
  assert.ok(!isEmptyRequest({ from: iso(2) }));
});

test('the offer to host appears whenever nothing exactly fits', () => {
  // The bug this locks out: any table inside the chosen days counts as a near
  // miss, so somebody asking for 족발 on a night a stranger happened to be
  // eating 삼겹살 saw a suggestion instead of the offer — and the offer is the
  // entire reason this screen exists.
  const wrongDish = table({ id: 'sam', menuId: 'samgyeopsal', date: iso(2) });
  const matches = matchRequest({ menuId: 'jokbal', from: iso(0), to: iso(3) }, [wrongDish], []);
  assert.equal(matches.length, 1, 'the near miss should still be offered');
  assert.equal(matches[0].kind, MATCH.WHEN);
  assert.ok(shouldOfferToHost(matches), 'a near miss buried the offer');

  // And it steps aside the moment something genuinely fits.
  const right = matchRequest({ menuId: 'samgyeopsal', from: iso(0), to: iso(3) }, [wrongDish], []);
  assert.ok(!shouldOfferToHost(right));
  assert.ok(shouldOfferToHost([]));
});
