import test from 'node:test';
import assert from 'node:assert/strict';

// The device-only backend gives up a seat the same way the database does.
//
// backendParity.test.mjs holds the two halves to the same *names*: every
// capability the repository offers has to exist on both sides. It has caught
// three real omissions. What it cannot catch is the two sides doing different
// things under the same name, which is exactly what soft cancel would have
// been if only the Supabase half had been changed — one backend keeping the
// record the 9/20 report counts, the other still dropping it.
//
// So this file runs the local backend for real, against a stub of the only
// browser API it touches, and asks it the questions the report asks.

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => { store.clear(); },
};

// Imported after the stub exists: the module reads localStorage while it is
// still choosing a backend, so a static import at the top of this file would
// throw before any test ran.
const repo = await import('../../data/tableRepository.js');

const SIGNUPS_KEY = 'bapchingu-signups';
const raw = () => JSON.parse(localStorage.getItem(SIGNUPS_KEY) ?? '[]');

const TABLE = 't-1';
async function ask(name, over = {}) {
  const row = await repo.createSignup({ tableId: TABLE, userId: `u-${name}`, name, ...over });
  return row.id;
}

test('the repository is running on the device backend, not a half-configured remote one', async () => {
  // Without this the file could pass by testing nothing. `useRemote` is
  // module-private, so the honest check is the one it is computed from —
  // asked of the same module the repository asked, not of a name this file
  // hopes exists. An optional-chained call to a function that is absent
  // returns undefined and would assert nothing at all.
  const remote = await import('../../data/supabaseBackend.js');
  assert.equal(typeof remote.isConfigured, 'function');
  assert.equal(remote.isConfigured(), false,
    'VITE_ keys are set under node, so these tests were driving a real project');
  assert.equal(typeof repo.cancelSignup, 'function');
});

test('giving up a seat keeps the request and hides it', async () => {
  store.clear();
  const kept = await ask('stays');
  const gone = await ask('changes their mind');

  await repo.cancelSignup(gone);

  const listed = await repo.listSignups(TABLE);
  assert.deepEqual(listed.map(s => s.name), ['stays'],
    'a withdrawn request is still showing on the table page');

  const all = await repo.listAllSignups();
  assert.equal(all.length, 1, 'the list screens still count a seat nobody is taking');

  // The half that matters for the report: the row is on disk.
  assert.equal(raw().length, 2, 'the record of the request was destroyed — this is the bug');
  const row = raw().find(s => s.id === gone);
  assert.ok(row.cancelledAt, 'the row survived but nothing says when it was given up');
  assert.equal(raw().find(s => s.id === kept).cancelledAt, undefined);
});

test('somebody who changes their mind can ask again', async () => {
  // The trap the partial unique index exists for on the other backend. Here
  // there is no constraint at all, so what is being checked is that nothing
  // in the read path treats the old row as still occupying the person's
  // place.
  store.clear();
  const first = await ask('returns');
  await repo.cancelSignup(first);
  const second = await ask('returns');

  assert.notEqual(second, first);
  const listed = await repo.listSignups(TABLE);
  assert.deepEqual(listed.map(s => s.id), [second]);
  assert.equal(raw().length, 2, 'both requests should be on the record');
});

test('cancelling a request that is not there changes nothing', async () => {
  store.clear();
  await ask('untouched');
  await repo.cancelSignup('no-such-id');
  assert.equal((await repo.listSignups(TABLE)).length, 1);
  assert.equal(raw().length, 1);
});

test('rows written before this existed are people still holding seats', async () => {
  // A device that used the app last week has rows with no cancelledAt at all.
  // Reading those as withdrawn would empty somebody's Passport on upgrade.
  store.clear();
  localStorage.setItem(SIGNUPS_KEY, JSON.stringify([
    { id: 'old-1', tableId: TABLE, userId: 'u-1', name: 'from last week', status: 'accepted', createdAt: 1 },
  ]));
  const listed = await repo.listSignups(TABLE);
  assert.deepEqual(listed.map(s => s.name), ['from last week']);
});
