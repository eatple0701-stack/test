import { test } from 'node:test';
import assert from 'node:assert/strict';

import { agreedToRules, rulesAgreement, showsRulesGate, consentToRecord } from '../policy/consent.js';
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

// ── Agreement is recorded when the action completes, not when the button
//    is pressed ─────────────────────────────────────────────────────────
//
// Reported 2026-09-03: press 상 차리기, agree, see the form, leave without
// opening a table — and the gate never comes back. The consent had been
// written by the button.
//
// It was defended here as a design choice: agreeing to the rules is not a
// promise to finish the action, so the yes stands. The team rejected that,
// and it was not ours to settle. The rule is now the plainer one — you are
// asked until you actually open a table or take a seat, and a form you walk
// away from records nothing.
//
// Two functions carry it. showsRulesGate answers what a screen renders;
// consentToRecord answers what a completed action writes. Both are pure, so
// the sequence can be tested without a browser: press, leave, come back,
// press, finish.

test('the gate stands in front of somebody who has not agreed in this visit', () => {
  assert.equal(showsRulesGate(false), true);
});

test('passing the gate opens the form for this visit only', () => {
  // The argument is the visit, not the record: it is component state that
  // dies with the screen, which is what makes leaving undo it.
  assert.equal(showsRulesGate(true), false);
});

/**
 * One visit to a gated screen, as a state machine.
 *
 * The two functions above are each half of the rule; what actually broke was
 * the WIRING between them — the button wrote the record. So the sequence is
 * modelled rather than the pieces: agreeing sets a pending value that lives
 * with the screen, leaving destroys the screen, and only finishing asks what
 * to write. A version of this that recorded on `agree()` would pass every
 * assertion above and fail every one below.
 */
const visit = (version) => {
  let pending = null;
  return {
    gate: () => showsRulesGate(pending !== null),
    agree: (at) => { pending = rulesAgreement(version, at); },
    leave: () => { pending = null; },
    finish: () => consentToRecord(pending),
  };
};

test('leaving without finishing brings the gate back', () => {
  // The reported bug, as the sequence a person actually performed.
  const first = visit(2);
  assert.equal(first.gate(), true, 'first visit: the gate should stand');
  first.agree(1_756_000_000_000);
  assert.equal(first.gate(), false, 'after agreeing: the form should open');
  first.leave();                       // back, without opening a table

  const second = visit(2);
  assert.equal(second.gate(), true, 'second visit: the gate should stand again');
});

test('a table that never gets created records nothing', () => {
  // The same sequence from the writing side: finish() is the only thing that
  // produces a record, and it is never called on a screen somebody left.
  const v = visit(2);
  v.agree(1_756_000_000_000);
  v.leave();
  assert.equal(v.finish(), null, 'a screen that was left behind still had something to write');
});

test('the same visit, carried through to a created table, does record', () => {
  const v = visit(2);
  v.agree(1_756_000_000_000);
  assert.deepEqual(v.finish(), { rulesVersion: 2, rulesAgreedAt: 1_756_000_000_000 });
});

test('finishing the action is what records the agreement', () => {
  const pending = { rulesVersion: 2, rulesAgreedAt: 1_756_000_000_000 };
  assert.deepEqual(consentToRecord(pending), pending);
});

test('the recorded timestamp is when they agreed, not when they finished', () => {
  // The press is the agreement; completing is what makes it a record. Writing
  // the completion time instead would put a moment on it at which nobody read
  // anything.
  const pressedAt = 1_756_000_000_000;
  const recorded = consentToRecord({ rulesVersion: 2, rulesAgreedAt: pressedAt });
  assert.equal(recorded.rulesAgreedAt, pressedAt);
});

test('nothing pending writes nothing', () => {
  // Nobody passed a gate on this screen, so there is nothing to record.
  assert.equal(consentToRecord(null), null);
});

// ── Every table asks again, both doors ────────────────────────────────────
//
// 2026-09-03, later the same day: showsRulesGate and consentToRecord used to
// also read `agreedToRules(profile, currentVersion)`, so a first table meant
// every later one — and the other door — skipped straight past the wall. The
// footnote said "then not again" for a few hours before the team settled the
// plainer rule the module comment states now: an agreement is to tonight's
// table, not a standing yes carried into the next one. `agreedToRules` is
// kept (tested above) for `rules_version`'s other reader, but neither gate
// function calls it any more — both take the visit, and nothing else.

test('having agreed moments ago does not skip the gate for a new table', () => {
  // The old signature would have read a profile carrying a fresh agreement
  // and opened straight past the wall. A brand new visit simply has no
  // agreedInThisForm to pass, whatever the profile remembers.
  assert.equal(showsRulesGate(false), true);
});

test('finishing again writes again the second time', () => {
  // Opening a second table after agreeing to the first is still a gate the
  // person passed, so it is still something to record — rules_consents is a
  // log, not a single cell, and is built to hold both rows
  // (…-02a-rules-consents-history.sql).
  const second = { rulesVersion: 2, rulesAgreedAt: 2_000_000_000_000 };
  assert.deepEqual(consentToRecord(second), second);
});
