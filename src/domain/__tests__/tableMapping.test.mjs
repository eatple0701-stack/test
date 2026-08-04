// Database ↔ app field mapping.
//
// Worth testing precisely because these bugs are silent. A mistyped column
// name does not throw; it yields `undefined`, and `undefined` renders as an
// empty card that looks like a data problem rather than a code one. Every
// field the screens read is asserted here.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  tableFromRow, tableToRow, signupFromRow, signupToRow, blockFromRow, blockToRow, friendlyError,
} from '../../data/tableMapping.js';
import { tableKind, TABLE_KIND, TABLE_KIND_LABEL } from '../catalog/hosts.js';
import { seatsRemaining, isPast } from '../policy/table.js';

const row = {
  id: 'uuid-1',
  menu_id: 'samgyeopsal',
  host_id: 'uuid-host',
  host_name: 'Minsu',
  host_nationality: 'Korea',
  host_gender: 'Woman',
  host_verified: false,
  date: '2026-08-17',
  time: '19:00:00',
  place: 'Jongno 3-ga, Seoul',
  seats: 4,
  note: 'I will do the scissors.',
  created_at: '2026-07-29T10:00:00Z',
};

test('a table row maps onto every field the screens read', () => {
  const t = tableFromRow(row);
  assert.equal(t.id, 'uuid-1');
  assert.equal(t.menuId, 'samgyeopsal');
  assert.equal(t.hostId, 'uuid-host');
  assert.equal(t.hostName, 'Minsu');
  assert.equal(t.hostNationality, 'Korea');
  assert.equal(t.hostVerified, false);
  assert.equal(t.date, '2026-08-17');
  assert.equal(t.place, 'Jongno 3-ga, Seoul');
  assert.equal(t.seats, 4);
  assert.equal(t.note, 'I will do the scissors.');
  assert.ok(t.createdAt > 0);
  // A row that does not carry the column reads as real — the dormant-schema
  // contract, and the old behaviour exactly.
  assert.equal(t.isSample, false);
  // No field the screens read may come back undefined.
  for (const [k, v] of Object.entries(t)) assert.notEqual(v, undefined, `${k} is undefined`);
});

test('gender maps both ways, like nationality', () => {
  const t = tableFromRow(row);
  assert.equal(t.hostGender, 'Woman');

  const out = tableToRow(
    { menuId: 'bossam', hostName: 'Kang', hostGender: 'Man',
      date: '2026-08-20', time: '18:00', place: 'Gongdeok', seats: '4', note: '' },
    { hostId: 'uuid-host' },
  );
  assert.equal(out.host_gender, 'Man');

  const s = signupFromRow({
    id: 'uuid-s', table_id: 'uuid-1', user_id: 'uuid-u',
    name: 'Aya', gender: 'Non-binary', created_at: '2026-07-29T11:00:00Z',
  });
  assert.equal(s.gender, 'Non-binary');

  const signupOut = signupToRow({ tableId: 'uuid-1', name: 'Aya', gender: 'Woman' }, { userId: 'uuid-u' });
  assert.equal(signupOut.gender, 'Woman');
});

test('a free-text allergy note maps both ways and defaults to an empty string, never null', () => {
  const s = signupFromRow({
    id: 'uuid-s', table_id: 'uuid-1', user_id: 'uuid-u', name: 'Aya',
    allergy_note: 'Severe shellfish allergy', created_at: '2026-07-29T11:00:00Z',
  });
  assert.equal(s.allergyNote, 'Severe shellfish allergy');

  const out = signupToRow(
    { tableId: 'uuid-1', name: 'Aya', allergyNote: 'No sesame please' },
    { userId: 'uuid-u' },
  );
  assert.equal(out.allergy_note, 'No sesame please');

  // A row from before this column existed reads as "nothing said", the same
  // way a missing note or diets list does — not null, which who-row__allergy
  // would render as the literal word "null".
  const missing = signupFromRow({
    id: 'uuid-s', table_id: 'uuid-1', user_id: 'uuid-u', name: 'Aya',
    created_at: '2026-07-29T11:00:00Z',
  });
  assert.equal(missing.allergyNote, '');

  const untyped = signupToRow({ tableId: 'uuid-1', name: 'Aya' }, { userId: 'uuid-u' });
  assert.equal(untyped.allergy_note, '');
});

test('an unknown or missing gender never reaches the row as a guess', () => {
  const out = tableToRow(
    { menuId: 'bossam', hostName: 'Kang', hostGender: 'nonsense',
      date: '2026-08-20', time: '18:00', place: 'Gongdeok', seats: '4' },
    { hostId: 'uuid-host' },
  );
  assert.equal(out.host_gender, null);

  const t = tableFromRow({ ...row, host_gender: null });
  assert.equal(t.hostGender, null);

  const signupOut = signupToRow({ tableId: 'uuid-1', name: 'Aya', gender: 'not-a-gender' }, { userId: 'u' });
  assert.equal(signupOut.gender, null);
});

test('Postgres time is trimmed to the HH:MM the app displays and compares', () => {
  assert.equal(tableFromRow(row).time, '19:00');
  // Already-trimmed values survive a second pass unchanged.
  assert.equal(tableFromRow({ ...row, time: '18:30' }).time, '18:30');
});

test('a mapped table works with the seat and date policies unchanged', () => {
  const t = tableFromRow(row);
  // The host holds one of the four seats.
  assert.equal(seatsRemaining(t, []), 3);
  assert.equal(seatsRemaining(t, [{ userId: 'a' }, { userId: 'b' }]), 1);
  assert.equal(isPast(t, new Date('2026-08-01T12:00:00')), false);
  assert.equal(isPast(t, new Date('2026-09-01T12:00:00')), true);
});

test('a new table maps back to insertable columns', () => {
  const out = tableToRow(
    {
      menuId: 'bossam', hostName: 'Kang', hostNationality: 'Korea',
      date: '2026-08-20', time: '18:00', place: 'Gongdeok', seats: '4', note: '',
    },
    { hostId: 'uuid-host', hostVerified: true },
  );
  assert.equal(out.menu_id, 'bossam');
  assert.equal(out.host_id, 'uuid-host');
  assert.equal(out.host_verified, true);
  // The seat picker hands over a string; the column is an integer.
  assert.equal(out.seats, 4);
  assert.equal(typeof out.seats, 'number');
  // The client never gets to name its own primary key or timestamp.
  assert.equal(out.id, undefined);
  assert.equal(out.created_at, undefined);
});

test('signups map both ways', () => {
  const s = signupFromRow({
    id: 'uuid-s', table_id: 'uuid-1', user_id: 'uuid-u',
    name: 'Aya', nationality: 'Japan', note: 'No pork.',
    created_at: '2026-07-29T11:00:00Z',
  });
  assert.equal(s.tableId, 'uuid-1');
  assert.equal(s.userId, 'uuid-u');
  assert.equal(s.name, 'Aya');
  assert.equal(s.note, 'No pork.');
  assert.ok(s.createdAt > 0);

  const out = signupToRow({ tableId: 'uuid-1', name: 'Aya', nationality: 'Japan' }, { userId: 'uuid-u' });
  assert.equal(out.table_id, 'uuid-1');
  assert.equal(out.user_id, 'uuid-u');
  // A client cannot claim a seat on somebody else's behalf by passing an id.
  assert.equal(out.id, undefined);
});

test('missing optional columns become empty values, never undefined', () => {
  const t = tableFromRow({ ...row, host_nationality: null, note: null, host_verified: null });
  assert.equal(t.hostNationality, '');
  assert.equal(t.note, '');
  assert.equal(t.hostVerified, false);

  const s = signupFromRow({ id: 'x', table_id: 'y', user_id: 'z', name: 'Aya', nationality: null, note: null });
  assert.equal(s.nationality, '');
  assert.equal(s.note, '');
  assert.deepEqual(s.languages, []);
});

test('a missing row maps to null rather than an object of undefineds', () => {
  assert.equal(tableFromRow(null), null);
  assert.equal(signupFromRow(undefined), null);
});

test('the two races that actually happen are named in plain English', () => {
  // Both fire when two phones went for the same chair, which is exactly when
  // the app most needs to say something true instead of "error".
  assert.match(friendlyError({ message: 'table_full' }), /last seat/i);
  assert.match(friendlyError({ message: 'duplicate key value violates unique constraint' }), /already have a seat/i);
  assert.match(friendlyError({ message: 'table_not_found' }), /no longer here/i);
  // Anything else still gets a sentence a person can act on.
  assert.match(friendlyError({ message: 'fetch failed' }), /connection/i);
  assert.match(friendlyError(null), /connection/i);
});

// ---------------------------------------------------------------------------
// The host as 문화 큐레이터 — a credential nobody can grant themselves, and a
// promise anybody may make.
// ---------------------------------------------------------------------------

test('a table cannot be created already verified', async () => {
  // The badge is the one claim in this app a traveller acts on when deciding
  // whether to meet a stranger. If a screen could set it, it would mean
  // nothing. The database refuses it too — see tables_insert_own in
  // schema.sql — this checks the client never even tries.
  const row = tableToRow(
    { menuId: 'samgyeopsal', hostName: 'Nobody', date: '2026-08-20', time: '19:00',
      place: 'Jongno', seats: 4, hostVerified: true, hostKind: 'creator' },
    { hostId: 'u-1' },
  );
  assert.equal(row.host_verified, false, 'a client-supplied hostVerified reached the row');
  assert.equal(row.host_kind, undefined, 'the client wrote host_kind, which is the team’s column');
});

test('guides survive the round trip and unknown ids do not', () => {
  const row = tableToRow(
    { menuId: 'bossam', hostName: 'Jiwon', date: '2026-08-20', time: '19:00',
      place: 'Euljiro', seats: 4, guides: ['order', 'manners', 'teach-me-taekwondo'] },
    { hostId: 'u-2' },
  );
  assert.deepEqual(row.guides, ['order', 'manners'], 'an unknown guide id was stored');

  const back = tableFromRow({ ...row, id: 't', date: '2026-08-20', seats: 4 });
  assert.deepEqual(back.guides, ['order', 'manners']);
});

test('a row from before guides existed reads as no promise, not a crash', () => {
  const back = tableFromRow({ id: 't', menu_id: 'jokbal', host_id: 'h', host_name: 'A',
    date: '2026-08-20', time: '19:00:00', place: 'Sinsa', seats: 3 });
  assert.deepEqual(back.guides, []);
  assert.equal(back.hostKind, null);
  assert.equal(back.hostVerified, false);
});

// ---------------------------------------------------------------------------
// 호스트 테이블 vs 테이블 메이트 — the two shapes the 8/2 meeting separated.
// ---------------------------------------------------------------------------

test('a table is hosted only when its host promised to guide it', () => {
  // Derived rather than declared, for the same reason the verification badge
  // is not client-writable: a label nobody has to earn gets claimed by
  // everybody and stops meaning anything.
  assert.equal(tableKind({ guides: ['order'] }), TABLE_KIND.HOSTED);
  assert.equal(tableKind({ guides: ['order', 'manners', 'origin'] }), TABLE_KIND.HOSTED);
  assert.equal(tableKind({ guides: [] }), TABLE_KIND.MATES);
  assert.equal(tableKind({}), TABLE_KIND.MATES);
  assert.equal(tableKind(null), TABLE_KIND.MATES);
});

test('a guide id the catalog does not know cannot buy the hosted label', () => {
  assert.equal(tableKind({ guides: ['teach-me-taekwondo'] }), TABLE_KIND.MATES);
  assert.equal(tableKind({ guides: ['nonsense', 'manners'] }), TABLE_KIND.HOSTED);
});

test('both kinds read as something a traveller would choose on purpose', () => {
  // 테이블 메이트 is not the failure state of 호스트 테이블. Somebody who does
  // not want to be taught anything tonight is a real traveller.
  for (const kind of Object.values(TABLE_KIND)) {
    const label = TABLE_KIND_LABEL[kind];
    assert.ok(label.kr && label.en && label.blurb, `${kind} is missing a label`);
    assert.doesNotMatch(label.blurb, /no |not |only |just |basic/i,
      `${kind} is worded as a lack rather than a choice`);
  }
});

test('the hosted label states the exchange, not just the mechanics', () => {
  // The professor's review named this gap precisely: the feature existed and
  // the screen never said what it was for. `blurb` already describes the
  // mechanics ("the host walks you through it"); `why` is the missing half —
  // this is where the app is supposed to answer "어떻게" rather than "무엇".
  const hosted = TABLE_KIND_LABEL[TABLE_KIND.HOSTED];
  assert.ok(hosted.why, 'HOSTED needs a stated reason, not just a mechanic');
  assert.match(hosted.why, /host|Korean/i);

  // Table mates is honestly just people splitting a dish — inventing an
  // exchange-framing for it would be the app claiming a curated moment that
  // did not happen.
  assert.equal(TABLE_KIND_LABEL[TABLE_KIND.MATES].why, undefined);
});

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

test('a block row maps both ways', () => {
  const b = blockFromRow({
    id: 'uuid-b', blocked_id: 'uuid-target', blocked_name: 'Someone',
    created_at: '2026-08-03T10:00:00Z',
  });
  assert.equal(b.blockedId, 'uuid-target');
  assert.equal(b.blockedName, 'Someone');
  assert.ok(b.createdAt > 0);

  const out = blockToRow({ blockedId: 'uuid-target', blockedName: 'Someone' }, { blockerId: 'uuid-me' });
  assert.equal(out.blocker_id, 'uuid-me');
  assert.equal(out.blocked_id, 'uuid-target');
  assert.equal(out.blocked_name, 'Someone');
});

test('a block row never surfaces undefined where the screen expects a string', () => {
  const b = blockFromRow({ id: 'uuid-b', blocked_id: 'uuid-target', created_at: '2026-08-03T10:00:00Z' });
  assert.equal(b.blockedName, '');

  const out = blockToRow({ blockedId: 'uuid-target' }, { blockerId: 'uuid-me' });
  assert.equal(out.blocked_name, '');
});

test('a missing block row maps to null, matching every other *FromRow', () => {
  assert.equal(blockFromRow(null), null);
  assert.equal(blockFromRow(undefined), null);
});

test('a seeded row keeps its label all the way to the screen', () => {
  // The bug this test exists for. tableFromRow used to write `isSample: false`
  // as a literal, with a comment asserting that nothing in the database is a
  // sample. On 2026-08-04 twelve of the thirteen live tables were demo rows —
  // 데모호스트 at 검증용 홍대입구 — and every one of them reached a visitor
  // labelled as somebody's real evening, because the badge the UI renders
  // (TablesTab.jsx, TablesLead.jsx) could never be true in production.
  const seeded = tableFromRow({ ...row, is_sample: true });
  assert.equal(seeded.isSample, true, 'a seeded row lost its label in the mapping');

  // And the inverse still holds, so a real table is never accused of being a
  // demo — the badge is a confession, not decoration.
  assert.equal(tableFromRow({ ...row, is_sample: false }).isSample, false);
});

test('the app itself never claims a table is a sample', () => {
  // is_sample is the team's column, like host_verified and host_kind: set in
  // the statement that seeds a demo row, never by somebody filling in the
  // create form. If tableToRow ever started sending it, a host could label
  // their own real table a demo — or, worse, unlabel a seeded one.
  const out = tableToRow(
    { menuId: 'bossam', hostName: 'Kang', date: '2026-08-20', time: '18:00',
      place: 'Gongdeok', seats: '4', note: '', isSample: true },
    { hostId: 'uuid-host' },
  );
  assert.equal(out.is_sample, undefined, 'the client tried to write is_sample');
});
