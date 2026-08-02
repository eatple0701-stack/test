import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as remote from '../../data/supabaseBackend.js';

// Backend parity, locked by a test instead of by remembering.
//
// This repository has shipped the same bug three times: a function written in
// the Supabase backend, exported, and called by nothing — ensureProfile,
// then saveProfileFields, and both were only found because a person noticed a
// symptom. The shape is always the same. One side of the seam gets the new
// capability, the other does not, and nothing fails until somebody runs the
// half that was missed.
//
// tableRepository.js picks between the two backends with a line per function:
//
//     export const createSignup = useRemote ? remote.createSignup : local_createSignup;
//
// Which makes the invariant checkable. Every name on the left has to exist on
// both sides, and the source of truth for "what should exist" is that file's
// own list of choices — so adding a capability to one backend and forgetting
// the other cannot pass this file.
//
// The local half is read as source rather than imported: tableRepository.js
// touches localStorage at module scope through its backend picker, and node
// has no localStorage. Reading the text is enough for the question being
// asked, which is about names, not behaviour.

const source = readFileSync(new URL('../../data/tableRepository.js', import.meta.url), 'utf8');

/** Every `export const NAME = useRemote ? remote.X : local_Y;` in the seam. */
const picks = [...source.matchAll(
  /export const (\w+)\s*=\s*useRemote\s*\?\s*remote\.(\w+)\s*:\s*(local_\w+)\s*;/g,
)].map(([, exported, remoteName, localName]) => ({ exported, remoteName, localName }));

test('the repository actually picks between two backends', () => {
  // If this drops to zero the regex stopped matching and every assertion
  // below would pass vacuously, which is the failure mode a parity test is
  // most likely to die of.
  assert.ok(picks.length >= 10, `expected the seam to have many picks, found ${picks.length}`);
});

test('every capability the repository offers exists in the Supabase backend', () => {
  const missing = picks
    .filter(p => typeof remote[p.remoteName] !== 'function')
    .map(p => `${p.exported} -> remote.${p.remoteName}`);
  assert.deepEqual(missing, [], 'exported by the repository, absent from supabaseBackend.js');
});

test('every capability the repository offers exists in the localStorage backend', () => {
  const missing = picks
    .filter(p => !new RegExp(`(async function|const)\\s+${p.localName}\\b`).test(source))
    .map(p => `${p.exported} -> ${p.localName}`);
  assert.deepEqual(missing, [], 'exported by the repository, absent from tableRepository.js');
});

test('nothing is written in the Supabase backend and then left unreachable', () => {
  // The other direction, and the one that actually bit: a function can exist,
  // be exported, and have no route to a screen. Anything callable from remote
  // must either be picked between in the seam or be a helper the seam itself
  // uses by name.
  const helpers = new Set([
    // Read straight from App.jsx and the screens rather than picked between,
    // because there is no localStorage equivalent to pick.
    'isConfigured',
  ]);
  const wired = new Set(picks.map(p => p.remoteName));
  const orphans = Object.keys(remote)
    .filter(name => typeof remote[name] === 'function')
    .filter(name => !wired.has(name) && !helpers.has(name))
    // A name the repository mentions at all is wired, even if not through the
    // ternary — saveProfileFields and ensureProfile are re-exported directly.
    .filter(name => !new RegExp(`\\b${name}\\b`).test(source));
  assert.deepEqual(orphans, [], 'exported from supabaseBackend.js and reachable from nowhere');
});

test('the seam covers seat requests, which is where this batch added a capability', () => {
  // Named rather than left to the generic checks, so deleting decideSignup
  // from one backend fails with the reason rather than with a diff.
  const names = picks.map(p => p.exported);
  for (const required of ['createSignup', 'cancelSignup', 'decideSignup']) {
    assert.ok(names.includes(required), `${required} is not wired through the repository`);
  }
});
