// Keeping the two taste records — the map and the 음식 MBTI — on an account.
//
// Asked for on 2026-09-11, about the line under 내 입맛 that said they lived in
// this browser only: "적어도 로그인이 되어 있는 계정에서는 어떤 다른 기기에서
// 접속하더라도 설정값을 저장해야지". Both were localStorage and nothing else, on
// purpose — fourteen swipes before anybody has said who they are is the order
// the deck is built on — and a guest's answers still never leave the browser.
// What this adds is what happens once somebody is signed in: this browser's
// copy and the account's are reconciled, and every later answer is sent up.
//
// This file decides and does no I/O. Reading and writing are handed in —
// src/components/useTasteSync.js passes the real ones — so every branch below
// is tested without a browser or a server.
//
// Each record is decided on its own, by when it last changed: this browser
// stamps a record when it is answered here, the account keeps the stamp it
// was sent with, and the later one wins. Two things make that more than a
// comparison:
//
//  - A copy with no stamp predates this file. It loses to whatever the account
//    holds, and is sent up when the account holds nothing — which is how a map
//    somebody already has reaches their account the first time they sign in.
//  - A copy is marked with the account it was last reconciled with. A browser
//    holding another member's record — two people, one laptop — never sends it
//    to the account signed in now. It takes that account's copy, or empties if
//    there is none: the other person's is already on their own account.

/** The two records, in the order they are decided. */
export const PARTS = ['taste', 'mbti'];

const isStrings = (v) => Array.isArray(v) && v.every(x => typeof x === 'string');
const sameList = (a = [], b = []) => a.length === b.length && a.every((x, i) => x === b[i]);

/** What "nothing answered" is for each record, and when two copies agree. */
export const RECORDS = {
  taste: {
    blank: () => ({ want: [], pass: [] }),
    empty: (v) => (v?.want ?? []).length === 0 && (v?.pass ?? []).length === 0,
    // Order included: the newest yes is the one lifted first on 밥상.
    same: (a, b) => sameList(a?.want, b?.want) && sameList(a?.pass, b?.pass),
  },
  mbti: {
    blank: () => ({}),
    empty: (v) => Object.keys(v ?? {}).length === 0,
    same: (a, b) => {
      const keys = Object.keys(a ?? {});
      return keys.length === Object.keys(b ?? {}).length && keys.every(k => a[k] === b?.[k]);
    },
  },
};

/**
 * What to do with one record.
 *
 * @param {{ value: any, at: number|null, owner: string|null }} local
 * @param {{ value: any, at: number|null } | null} remote  null: the account has none
 * @param {string} me  the account signed in now
 * @param {{ empty: Function, same: Function }} kind
 * @returns {'pull'|'push'|'clear'|'none'}
 */
export function decide(local, remote, me, kind) {
  if (local.owner && local.owner !== me) return remote ? 'pull' : 'clear';
  if (!remote) return local.at != null || !kind.empty(local.value) ? 'push' : 'none';
  if (kind.same(local.value, remote.value)) return 'none';
  if (local.at == null) return 'pull';
  const theirs = remote.at ?? 0;
  if (local.at > theirs) return 'push';
  if (local.at < theirs) return 'pull';
  return 'none';
}

/**
 * The account's copy as stored, or null for a record that is missing or not
 * the shape this version writes. Shape only — dish ids and answers are cleaned
 * against the catalogue when they are written to this browser, by the same
 * functions that clean anything read from storage.
 */
export function parseAccountRecord(raw) {
  const stamp = (x) => (Number.isFinite(x) ? x : null);
  const t = raw?.taste;
  const taste = t && typeof t === 'object' && isStrings(t.want ?? []) && isStrings(t.pass ?? [])
    ? { value: { want: [...(t.want ?? [])], pass: [...(t.pass ?? [])] }, at: stamp(t.at) }
    : null;
  const a = raw?.mbti?.answers;
  const mbti = a && typeof a === 'object' && !Array.isArray(a)
    && Object.values(a).every(v => typeof v === 'string')
    ? { value: { ...a }, at: stamp(raw.mbti.at) }
    : null;
  return { taste, mbti };
}

/** What is sent up: both records, in the shape parseAccountRecord reads. */
export function toAccountRecord(next) {
  const taste = next.taste
    ? { want: [...(next.taste.value.want ?? [])], pass: [...(next.taste.value.pass ?? [])], at: next.taste.at }
    : null;
  const mbti = next.mbti ? { answers: { ...next.mbti.value }, at: next.mbti.at } : null;
  return { v: 1, taste, mbti };
}

/**
 * Reconcile this browser with the account, once.
 *
 * Reads the account, decides each record, takes the account's copy where it
 * won, and sends up one value holding both records — both, because the
 * account keeps them under a single key that is replaced whole, and sending
 * only the record that changed would erase the other.
 *
 * An answer given while the account is being read is never overwritten: each
 * record is looked at again before anything is written to it, and one that
 * moved is left alone. Its own change has already asked for the next round.
 *
 * @returns {Promise<{ pulled: string[], pushed: boolean }>}
 */
export async function syncOnce({ me, readRemote, writeRemote, local, adopt, mark, now = Date.now }) {
  const before = Object.fromEntries(PARTS.map(p => [p, local[p]()]));
  const remote = await readRemote();
  const moved = (part) => local[part]().at !== before[part].at;

  const next = {};
  const pulled = [];
  let push = false;
  for (const part of PARTS) {
    const kind = RECORDS[part];
    const mine = before[part];
    const theirs = remote?.[part] ?? null;
    const verdict = decide(mine, theirs, me, kind);
    if ((verdict === 'pull' || verdict === 'clear') && !moved(part)) {
      if (verdict === 'pull') adopt[part](theirs.value, theirs.at, me);
      else adopt[part](kind.blank(), null, me);
      pulled.push(part);
      next[part] = verdict === 'pull' ? theirs : null;
    } else if (verdict === 'push') {
      next[part] = { value: mine.value, at: mine.at ?? now() };
      push = true;
    } else {
      next[part] = theirs;
    }
  }

  if (push) await writeRemote(next);

  // The copy here becomes this account's only once the account holds it.
  for (const part of PARTS) {
    if (pulled.includes(part) || moved(part)) continue;
    mark[part](next[part]?.at ?? before[part].at, me);
  }
  return { pulled, pushed: push };
}
