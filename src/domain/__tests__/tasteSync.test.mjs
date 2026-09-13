import test from 'node:test';
import assert from 'node:assert/strict';
import { decide, RECORDS, parseAccountRecord, toAccountRecord, syncOnce } from '../policy/tasteSync.js';

// The taste map and the 음식 MBTI on an account — see domain/policy/tasteSync.js.
// Asked for on 2026-09-11: "적어도 로그인이 되어 있는 계정에서는 어떤 다른 기기에서
// 접속하더라도 설정값을 저장해야지".

const T = RECORDS.taste;
const map = (want, pass = []) => ({ want, pass });

// ---- one record ------------------------------------------------------------

test('a map built as a guest goes up the first time its owner signs in', () => {
  assert.equal(decide({ value: map(['galbi']), at: 5, owner: null }, null, 'u1', T), 'push');
});

test('a map from before stamps existed still goes up to an empty account', () => {
  assert.equal(decide({ value: map(['galbi']), at: null, owner: null }, null, 'u1', T), 'push');
});

test('nothing answered and nothing on the account is nothing to do', () => {
  assert.equal(decide({ value: map([]), at: null, owner: null }, null, 'u1', T), 'none');
});

test("a new phone takes the account's map", () => {
  assert.equal(decide({ value: map([]), at: null, owner: null }, { value: map(['bossam']), at: 9 }, 'u1', T), 'pull');
});

test('the later answer wins, whichever side it is on', () => {
  const account = { value: map(['bossam']), at: 10 };
  assert.equal(decide({ value: map(['galbi']), at: 20, owner: 'u1' }, account, 'u1', T), 'push');
  assert.equal(decide({ value: map(['galbi']), at: 5, owner: 'u1' }, account, 'u1', T), 'pull');
  assert.equal(decide({ value: map(['galbi']), at: 10, owner: 'u1' }, account, 'u1', T), 'none');
});

test('a copy with no stamp loses to anything the account holds', () => {
  assert.equal(decide({ value: map(['galbi']), at: null, owner: null }, { value: map(['bossam']), at: 1 }, 'u1', T), 'pull');
});

test('the same answers are left alone however they were stamped', () => {
  assert.equal(decide({ value: map(['galbi']), at: 50, owner: 'u1' }, { value: map(['galbi']), at: 1 }, 'u1', T), 'none');
});

test('starting over on one device reaches the others', () => {
  // An empty map with a stamp is a decision, not an absence.
  assert.equal(decide({ value: map(['galbi']), at: 5, owner: 'u1' }, { value: map([]), at: 9 }, 'u1', T), 'pull');
  assert.equal(decide({ value: map([]), at: 9, owner: 'u1' }, null, 'u1', T), 'push');
});

test("another member's copy is never sent to the account signed in now", () => {
  const theirs = { value: map(['jokbal']), at: 30, owner: 'u2' };
  assert.equal(decide(theirs, { value: map(['bossam']), at: 1 }, 'u1', T), 'pull');
  assert.equal(decide(theirs, null, 'u1', T), 'clear');
});

test('MBTI answers compare by question, not by the order they were written', () => {
  const M = RECORDS.mbti;
  assert.ok(M.same({ q1: 'a', q2: 'b' }, { q2: 'b', q1: 'a' }));
  assert.ok(!M.same({ q1: 'a' }, { q1: 'b' }));
  assert.ok(!M.same({ q1: 'a' }, { q1: 'a', q2: 'b' }));
  assert.ok(M.empty({}));
  assert.ok(!T.same(map(['a', 'b']), map(['b', 'a'])), 'the map keeps its order — the newest yes is lifted first');
});

test("the account's value is read for its shape and nothing else", () => {
  assert.deepEqual(parseAccountRecord(null), { taste: null, mbti: null });
  assert.equal(parseAccountRecord({ taste: { want: ['a', 3] } }).taste, null);
  assert.deepEqual(parseAccountRecord({ taste: { want: ['a'], at: 'soon' } }).taste,
    { value: { want: ['a'], pass: [] }, at: null });
  assert.equal(parseAccountRecord({ mbti: { answers: ['a'] } }).mbti, null);
  const round = parseAccountRecord(toAccountRecord({
    taste: { value: map(['galbi'], ['jokbal']), at: 7 },
    mbti: { value: { q1: 'a' }, at: 8 },
  }));
  assert.deepEqual(round, {
    taste: { value: map(['galbi'], ['jokbal']), at: 7 },
    mbti: { value: { q1: 'a' }, at: 8 },
  });
});

// ---- a whole round ---------------------------------------------------------

/** A browser and an account in memory, and the functions syncOnce is handed. */
function harness({ local = {}, remote = null } = {}) {
  const state = {
    local: {
      taste: { value: map([]), at: null, owner: null, ...local.taste },
      mbti: { value: {}, at: null, owner: null, ...local.mbti },
    },
    remote,
    writes: [],
  };
  const io = {
    me: 'u1',
    now: () => 1000,
    readRemote: async () => parseAccountRecord(state.remote),
    writeRemote: async (next) => {
      const record = toAccountRecord(next);
      state.writes.push(record);
      state.remote = record;
    },
    local: {
      taste: () => ({ ...state.local.taste }),
      mbti: () => ({ ...state.local.mbti }),
    },
    adopt: {
      taste: (value, at, owner) => { state.local.taste = { value, at, owner }; },
      mbti: (value, at, owner) => { state.local.mbti = { value, at, owner }; },
    },
    mark: {
      taste: (at, owner) => { state.local.taste = { ...state.local.taste, at, owner }; },
      mbti: (at, owner) => { state.local.mbti = { ...state.local.mbti, at, owner }; },
    },
  };
  return { state, io };
}

test("signing in with a guest map sends it up and makes it that account's", async () => {
  const { state, io } = harness({ local: { taste: { value: map(['galbi']), at: 5 } } });
  assert.deepEqual(await syncOnce(io), { pulled: [], pushed: true });
  assert.deepEqual(state.remote.taste, { want: ['galbi'], pass: [], at: 5 });
  assert.equal(state.local.taste.owner, 'u1');
});

test('a map from before stamps goes up with the time it went, and is stamped here too', async () => {
  const { state, io } = harness({ local: { taste: { value: map(['galbi']), at: null } } });
  await syncOnce(io);
  assert.equal(state.remote.taste.at, 1000);
  assert.equal(state.local.taste.at, 1000);
});

test('a new device takes both records from the account and sends nothing back', async () => {
  const { state, io } = harness({
    remote: { v: 1, taste: { want: ['bossam'], pass: [], at: 9 }, mbti: { answers: { q1: 'a' }, at: 9 } },
  });
  assert.deepEqual(await syncOnce(io), { pulled: ['taste', 'mbti'], pushed: false });
  assert.deepEqual(state.local.taste, { value: map(['bossam']), at: 9, owner: 'u1' });
  assert.deepEqual(state.local.mbti, { value: { q1: 'a' }, at: 9, owner: 'u1' });
  assert.equal(state.writes.length, 0);
});

test('sending one record up keeps the other one the account already had', async () => {
  const { state, io } = harness({
    local: { taste: { value: map(['galbi']), at: 20, owner: 'u1' } },
    remote: { v: 1, taste: { want: ['bossam'], pass: [], at: 10 }, mbti: { answers: { q1: 'a' }, at: 12 } },
  });
  await syncOnce(io);
  assert.deepEqual(state.remote.taste.want, ['galbi']);
  assert.deepEqual(state.remote.mbti, { answers: { q1: 'a' }, at: 12 }, 'the type on the account was erased');
  assert.deepEqual(state.local.mbti.value, { q1: 'a' });
});

test('an answer given while the account is being read is not overwritten', async () => {
  const { state, io } = harness({
    local: { taste: { value: map(['galbi']), at: 5, owner: 'u1' } },
    remote: { v: 1, taste: { want: ['bossam'], pass: [], at: 9 }, mbti: null },
  });
  const read = io.readRemote;
  io.readRemote = async () => {
    const r = await read();
    // A swipe lands while the request is out.
    state.local.taste = { value: map(['galbi', 'jokbal']), at: 11, owner: 'u1' };
    return r;
  };
  const result = await syncOnce(io);
  assert.deepEqual(result.pulled, []);
  assert.deepEqual(state.local.taste, { value: map(['galbi', 'jokbal']), at: 11, owner: 'u1' });
});

test("another member's map on this browser is replaced, never sent", async () => {
  const { state, io } = harness({ local: { taste: { value: map(['jokbal']), at: 30, owner: 'u2' } } });
  assert.deepEqual((await syncOnce(io)).pulled, ['taste']);
  assert.deepEqual(state.local.taste, { value: map([]), at: null, owner: 'u1' });
  assert.equal(state.writes.length, 0);
});

test('two copies that agree send nothing', async () => {
  const { state, io } = harness({
    local: { taste: { value: map(['galbi']), at: 9, owner: 'u1' } },
    remote: { v: 1, taste: { want: ['galbi'], pass: [], at: 9 }, mbti: null },
  });
  assert.deepEqual(await syncOnce(io), { pulled: [], pushed: false });
  assert.equal(state.writes.length, 0);
});

test('when the account cannot be read, nothing here changes', async () => {
  const { state, io } = harness({ local: { taste: { value: map(['galbi']), at: 5 } } });
  io.readRemote = async () => { throw new Error('offline'); };
  await assert.rejects(syncOnce(io));
  assert.deepEqual(state.local.taste, { value: map(['galbi']), at: 5, owner: null });
});

test('when the account cannot be written, the copy here is not marked as sent', async () => {
  const { state, io } = harness({ local: { taste: { value: map(['galbi']), at: null } } });
  io.writeRemote = async () => { throw new Error('500'); };
  await assert.rejects(syncOnce(io));
  assert.equal(state.local.taste.at, null);
  assert.equal(state.local.taste.owner, null);
});
