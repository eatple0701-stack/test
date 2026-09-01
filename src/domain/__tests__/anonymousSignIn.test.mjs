import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// One visitor, one account.
//
// ── What was measured, and where ────────────────────────────────────────
//
// On production on 2026-09-01 — the first day of 2차 운영 — a single first
// visit produced:
//
//   POST /auth/v1/signup            ×2
//   two distinct anonymous user ids  (31ed9497…, 2c9f9ade…)
//   two rows in `profiles`
//   one token in localStorage
//
// So every first-time visitor was becoming two people, one of whom was
// orphaned immediately: no token, no way back to it, and counted in every
// total the pilot reports. Reproduced three times by clearing storage and
// reloading, and it is not a race that sometimes loses — it happened on
// every attempt.
//
// The cause is plain once seen: several screens ask for the user while the
// app boots, each runs signedInUser(), and on a first visit they all reach
// getSession before any of them has finished signing in. All see no session.
// All call signInAnonymously, which does what it is told, twice.
//
// This is also where the 409 in the console came from, and the reason it
// mattered: currentUser() treats any error that is not 23503 as fatal and
// throws, so an unlucky interleaving does not just log — it fails the boot.
//
// ── Why this test is shaped like this ───────────────────────────────────
//
// There is no Supabase in the test environment and no DOM. What can be
// tested is the concurrency discipline itself, so the real function is
// re-implemented here against a fake client that counts calls, and the same
// harness is run against the old shape to show it fails. If the source ever
// loses the in-flight promise, the last test here notices.

/** A Supabase stand-in that counts sign-ins and answers slowly, like a network. */
function fakeClient({ latency = 5 } = {}) {
  let session = null;
  let signups = 0;
  const ids = [];
  return {
    signups: () => signups,
    ids: () => ids,
    auth: {
      async getSession() {
        await new Promise(r => setTimeout(r, latency));
        return { data: { session } };
      },
      async signInAnonymously() {
        await new Promise(r => setTimeout(r, latency));
        signups += 1;
        const user = { id: `anon-${signups}` };
        ids.push(user.id);
        session = { user };            // written only when this one returns
        return { data: { user }, error: null };
      },
    },
  };
}

/** The shape that shipped: no guard. */
function makeUnguarded(sb) {
  return async function signedInUser() {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) return session.user;
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) throw new Error('sign-in failed');
    return data.user;
  };
}

/** The shape in the file now: one in-flight promise. */
function makeGuarded(sb) {
  let signInPromise = null;
  return async function signedInUser() {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) return session.user;
    if (!signInPromise) {
      signInPromise = sb.auth.signInAnonymously()
        .then(({ data, error }) => {
          if (error) throw new Error('sign-in failed');
          return data.user;
        })
        .finally(() => { signInPromise = null; });
    }
    return signInPromise;
  };
}

const boot = (signedInUser, callers = 4) =>
  Promise.all(Array.from({ length: callers }, () => signedInUser()));

test('the shape that shipped really does create one account per caller', async () => {
  // The control. Without this, the test below could pass because the fake
  // client is too forgiving rather than because the guard works.
  const sb = fakeClient();
  const users = await boot(makeUnguarded(sb));
  assert.equal(sb.signups(), 4, 'the fake client did not reproduce the bug');
  assert.equal(new Set(users.map(u => u.id)).size, 4, 'four callers, four identities');
});

test('four screens asking at once produce one account', async () => {
  const sb = fakeClient();
  const users = await boot(makeGuarded(sb));
  assert.equal(sb.signups(), 1, `signed in ${sb.signups()} times for one visitor`);
  assert.equal(new Set(users.map(u => u.id)).size, 1, 'callers were handed different identities');
  assert.equal(users[0].id, 'anon-1');
});

test('a returning visitor signs in zero times', async () => {
  const sb = fakeClient();
  const signedInUser = makeGuarded(sb);
  await signedInUser();                       // the first visit
  assert.equal(sb.signups(), 1);
  await boot(signedInUser, 4);                // every load after it
  assert.equal(sb.signups(), 1, 'a session in storage was not reused');
});

test('a failed sign-in can be retried', async () => {
  // The promise is cleared when it settles, so a visitor who was offline for
  // the first attempt is not locked out of every later one.
  let fail = true;
  const sb = {
    auth: {
      async getSession() { return { data: { session: null } }; },
      async signInAnonymously() {
        if (fail) { fail = false; return { data: null, error: { message: 'offline' } }; }
        return { data: { user: { id: 'anon-later' } }, error: null };
      },
    },
  };
  const signedInUser = makeGuarded(sb);
  await assert.rejects(() => signedInUser());
  const user = await signedInUser();
  assert.equal(user.id, 'anon-later');
});

test('the source still holds the in-flight promise', () => {
  // The four tests above run a copy. This one checks the copy still matches
  // what ships — the failure mode being a guard that lives only in a test.
  const src = fs.readFileSync(path.join(process.cwd(), 'src/data/supabaseBackend.js'), 'utf8')
    .replace(/\r\n/g, '\n');
  const body = src.slice(src.indexOf('async function signedInUser()'));
  const fn = body.slice(0, body.indexOf('\n}\n') + 3);
  assert.match(fn, /if \(!signInPromise\)/, 'signedInUser no longer dedupes concurrent callers');
  assert.match(fn, /signInPromise = sb\.auth\.signInAnonymously\(\)/);
  assert.match(fn, /\.finally\(\(\) => \{ signInPromise = null; \}\)/, 'a failed sign-in would never be retried');
  // And the profile write is deduped the same way, one level up.
  assert.match(src, /if \(ensurePromise\) return ensurePromise;/);
});
