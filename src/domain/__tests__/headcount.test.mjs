import test from 'node:test';
import assert from 'node:assert/strict';
import { listedAtTable, headcountIfYouJoin, seatsRemaining, attendance } from '../policy/table.js';
import { mergeSeatHolds } from '../policy/seatHolds.js';

// The same table, counted twice, agreeing.
//
// ── Two failures, one shape ─────────────────────────────────────────────
//
// 2026-09-01, morning: the seat_holds() merge went onto listAllSignups() and
// not onto listSignups(), so the card said "2자리 남음" and the table page
// said "3자리 남음" about the same table, and the page told a stranger
// nobody had taken a seat when two people had.
//
// 2026-09-01, evening: a logged-out reader saw three rows under "누가 가나"
// and "앉으시면 3명이 됩니다" directly beneath them. Both numbers were right
// by their own rule — the sentence counts confirmed seats only, the list
// shows everybody who asked — and the pair read as broken arithmetic,
// because the pending row carried no badge to say why it did not count.
//
// Neither was a wrong number. Both were the same fact counted in two places
// with no test holding the two together. That is what this file is.

const table = (seats = 4) => ({ id: 't1', seats, date: '2030-01-01', time: '19:00', cancelledAt: null });
const at = (status) => ({ id: `s-${Math.random()}`, tableId: 't1', status });

// ── (a) the list and the sentence under it ──────────────────────────────

test('the sentence and the list are one seat apart when every row is confirmed', () => {
  // The reviewer's invariant, and it holds exactly when nothing is pending:
  // N rows, and joining makes N+1.
  for (let guests = 0; guests <= 3; guests += 1) {
    const signups = Array.from({ length: guests }, () => at('accepted'));
    assert.equal(headcountIfYouJoin(signups), listedAtTable(signups) + 1,
      `${guests} confirmed guests: the sentence and the list disagree`);
  }
});

test('a pending row is the whole of the difference', () => {
  // And when something IS pending the two are further apart, on purpose:
  // the sentence answers "would I be sitting down to a proper table", and
  // only a given seat answers that. The gap is exactly the unconfirmed rows,
  // never anything else — which is what makes the screen readable once those
  // rows are badged.
  for (const signups of [
    [at('pending')],
    [at('accepted'), at('pending')],
    [at('pending'), at('pending')],
    [at('accepted'), at('pending'), at('declined')],
  ]) {
    const unconfirmed = signups.filter(s => s.status !== 'accepted').length;
    assert.equal(listedAtTable(signups) + 1 - headcountIfYouJoin(signups), unconfirmed,
      'the gap between the list and the sentence is not the unconfirmed rows');
  }
});

test('the live table reads the way a person would count it', () => {
  // The exact shape that was on screen: a host, one accepted guest, one
  // pending request. Three rows, and the sentence says three — because you
  // would be the third confirmed person. The pending row is badged, so the
  // reader can see which one is not being counted.
  const signups = [at('accepted'), at('pending')];
  assert.equal(listedAtTable(signups), 3);
  assert.equal(headcountIfYouJoin(signups), 3);
  assert.equal(seatsRemaining(table(), signups), 1, 'a pending request still holds its seat');
});

test('nobody at all is the two of you', () => {
  assert.equal(headcountIfYouJoin([]), 2);
  assert.equal(listedAtTable([]), 1);
});

test('a refusal is not company and is not a held seat', () => {
  const signups = [at('declined'), at('declined')];
  assert.equal(headcountIfYouJoin(signups), 2, 'a refused request is being counted as somebody coming');
  assert.equal(seatsRemaining(table(), signups), 3, 'a refused request is still holding a seat');
});

// ── (c) the card and the table page ─────────────────────────────────────

test('the card and the table page count the same table the same way', () => {
  // The morning regression, in one assertion. Both screens start from the
  // same seat_holds() payload; the card merges it across every table, the
  // page merges the slice for one. If those two ever produce different rows
  // again, every number below moves apart.
  const holds = [
    { table_id: 't1', status: 'accepted' },
    { table_id: 't1', status: 'pending' },
    { table_id: 't2', status: 'accepted' },
  ];

  // TablesTab: merge everything, then group by table.
  const all = mergeSeatHolds([], holds);
  const cardRows = all.filter(s => s.tableId === 't1');

  // TableDetail: merge only this table's slice.
  const pageRows = mergeSeatHolds([], holds.filter(h => h.table_id === 't1'));

  assert.equal(cardRows.length, pageRows.length, 'the two screens are holding different rows');
  assert.deepEqual(cardRows.map(s => s.status), pageRows.map(s => s.status));

  const t = table();
  assert.equal(seatsRemaining(t, cardRows), seatsRemaining(t, pageRows), 'seats left disagree');
  assert.equal(attendance(t, cardRows).going, attendance(t, pageRows).going, '“going” disagrees');
  assert.equal(seatsRemaining(t, pageRows), 1);
  assert.equal(attendance(t, pageRows).going, 2, 'a pending request is not company');
});

test('a reader who can see the real rows gets the same numbers as one who cannot', () => {
  // A host reads their own table's signups; a stranger reads placeholders
  // standing in for them. The two must land on the same figures, or the same
  // table advertises differently depending on who is looking.
  const real = [
    { id: 'a', tableId: 't1', status: 'accepted', name: 'Mina' },
    { id: 'b', tableId: 't1', status: 'pending', name: 'Tom' },
  ];
  const asStranger = mergeSeatHolds([], [
    { table_id: 't1', status: 'accepted' },
    { table_id: 't1', status: 'pending' },
  ]);
  const t = table();
  assert.equal(seatsRemaining(t, real), seatsRemaining(t, asStranger));
  assert.equal(attendance(t, real).going, attendance(t, asStranger).going);
  assert.equal(headcountIfYouJoin(real), headcountIfYouJoin(asStranger));
  assert.equal(listedAtTable(real), listedAtTable(asStranger));
});
