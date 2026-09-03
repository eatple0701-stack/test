import { test } from 'node:test';
import assert from 'node:assert/strict';

import { agreedToRules, rulesAgreement } from '../policy/consent.js';
import { PURPOSE, RULES } from '../../content/safety.js';

test('a profile that never agreed reads as not agreed', () => {
  assert.equal(agreedToRules({}, 1), false);
  assert.equal(agreedToRules({ rulesVersion: null }, 1), false);
  assert.equal(agreedToRules(null, 1), false);
  assert.equal(agreedToRules(undefined, 1), false);
});

test('agreeing to the current version reads as agreed', () => {
  assert.equal(agreedToRules({ rulesVersion: 1 }, 1), true);
  assert.equal(agreedToRules({ rulesVersion: 7 }, 7), true);
});

test('an agreement to an older version does not carry forward', () => {
  // The whole reason this is versioned rather than a boolean: somebody who
  // agreed to v1 has not agreed to v2, and treating them as if they had
  // would record a yes to a question nobody asked them.
  assert.equal(agreedToRules({ rulesVersion: 1 }, 2), false);
});

test('an agreement to a version this bundle has not heard of is accepted', () => {
  // This test used to assert the opposite, on the stated grounds that a
  // version higher than the current one could "only ever" come from tampered
  // storage. That was wrong, and 2026-09-03 is how we found out: it also
  // comes from a tab that has not been reloaded since the last deploy, whose
  // PURPOSE.version is one behind the profile it is reading. There is
  // nothing exotic about it — every version bump creates a window where some
  // open tab is behind, and the app had been live for forty minutes.
  //
  // Treating that as "not agreed" showed the old gate to somebody already
  // past it and wrote their consent backwards when they passed it again.
  assert.equal(agreedToRules({ rulesVersion: 3 }, 2), true);
});

test('a non-integer version never counts as agreement', () => {
  // localStorage round-trips through JSON, and a corrupted or hand-edited
  // value must fail closed rather than passing a loose equality check.
  assert.equal(agreedToRules({ rulesVersion: '1' }, 1), false);
  assert.equal(agreedToRules({ rulesVersion: true }, 1), false);
  assert.equal(agreedToRules({ rulesVersion: 1.5 }, 1), false);
});

test('the agreement patch records both what and when', () => {
  const patch = rulesAgreement(2, 1700000000000);
  assert.equal(patch.rulesVersion, 2);
  assert.equal(patch.rulesAgreedAt, 1700000000000);
});

test('the patch it produces is one the check then accepts', () => {
  // The two halves have to agree on the field name, and nothing else in the
  // codebase would catch a rename of one without the other.
  assert.equal(agreedToRules(rulesAgreement(4), 4), true);
});

// The two below read the English arm only. That is the whole of what they
// can do from here, and on 2026-09-03 it stopped being the whole of the
// screen: RULES became seven-language objects, so the version of each of
// these that covers what a Korean or Arabic reader actually agrees to lives
// in consentLanguages.test.mjs. These stay because English is the say()
// fallback — it is what every reader gets when a translation goes missing,
// so it is worth a floor of its own.

test('the rules a traveller agrees to are real sentences, not placeholders', () => {
  assert.ok(RULES.length >= 3, 'a consent list this short is not worth agreeing to');
  for (const r of RULES) {
    assert.ok(r.en.length > 30, `a rule is too thin to mean anything: "${r.en}"`);
    assert.match(r.en, /\.$/, `a rule is not a full sentence: "${r.en}"`);
  }
});

test('the rules do not promise moderation this app does not have', () => {
  // NOT_YET_BUILT names what is missing; a consent screen is the worst place
  // to imply somebody is watching when nobody is.
  const overclaim = /we (will )?(review|monitor|moderate|verify)|reported users are|banned/i;
  for (const r of RULES) {
    assert.doesNotMatch(r.en, overclaim, `a rule overclaims enforcement: "${r.en}"`);
  }
});

test('the rules version is an integer that agreedToRules can match', () => {
  assert.ok(Number.isInteger(PURPOSE.version), 'PURPOSE.version must be an integer');
  assert.equal(agreedToRules({ rulesVersion: PURPOSE.version }, PURPOSE.version), true);
});

// ── An agreement to a NEWER version is still an agreement ────────────────
//
// 2026-09-03, six hours after PURPOSE.version went 1 -> 2 and forty minutes
// after it deployed. rules_consents held eleven v1 rows and one v2; profiles
// held ten v1 and no v2 at all. Read in order, the log said one profile went
// 1 -> 2 -> 1, and the reverting row's agreed_at was a fresh timestamp half a
// second before it was recorded — not an old value being replayed. A fresh
// agreed_at can only come from rulesAgreement(), and rulesAgreement() is
// called in exactly one place: the consent button's onClick.
//
// So the button was pressed on a client whose PURPOSE.version was still 1 —
// a tab opened before the deploy, running the old bundle. Its gate asked
// `agreed === 1`, the profile said 2, and 2 !== 1, so it showed the gate to
// somebody who had already agreed to something newer and wrote their consent
// backwards when they passed it.
//
// `>=` is the fix and it keeps the property the original was written for: an
// OLDER agreement is still not a yes. Only the other direction changes.

test('an agreement to a newer version than this bundle asks for still counts', () => {
  // The exact shape of the incident: a profile at v2 meeting a bundle that
  // has not been reloaded since v1.
  assert.equal(agreedToRules({ rulesVersion: 2 }, 1), true);
  assert.equal(agreedToRules({ rulesVersion: 7 }, 2), true);
});

test('an agreement to an older version still is not one', () => {
  // The property the === was there to protect, asserted separately so a
  // later simplification to `Number.isInteger(agreed)` fails here.
  assert.equal(agreedToRules({ rulesVersion: 1 }, 2), false);
  assert.equal(agreedToRules({ rulesVersion: 1 }, 3), false);
});

test('the gate a stale bundle shows cannot write consent backwards', () => {
  // Stated as the behaviour rather than the comparison: with the fix, the
  // old bundle never reaches the gate, so its button is never pressed and
  // rulesAgreement(1) is never called. This is the assertion that would have
  // failed on 2026-09-03.
  const alreadyAgreedToV2 = { rulesVersion: 2, rulesAgreedAt: 1_756_000_000_000 };
  const staleBundleAsksFor = 1;
  assert.equal(agreedToRules(alreadyAgreedToV2, staleBundleAsksFor), true,
    'a bundle from before the version bump would show its gate again');
});
