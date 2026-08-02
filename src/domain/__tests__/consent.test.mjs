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

test('an agreement from the future is not accepted either', () => {
  // Only ever from tampered storage, but "not exactly this version" has to
  // mean the same thing in both directions or the check is a >= in disguise.
  assert.equal(agreedToRules({ rulesVersion: 3 }, 2), false);
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

test('the rules a traveller agrees to are real sentences, not placeholders', () => {
  assert.ok(RULES.length >= 3, 'a consent list this short is not worth agreeing to');
  for (const r of RULES) {
    assert.ok(r.length > 30, `a rule is too thin to mean anything: "${r}"`);
    assert.match(r, /\.$/, `a rule is not a full sentence: "${r}"`);
  }
});

test('the rules do not promise moderation this app does not have', () => {
  // NOT_YET_BUILT names what is missing; a consent screen is the worst place
  // to imply somebody is watching when nobody is.
  const overclaim = /we (will )?(review|monitor|moderate|verify)|reported users are|banned/i;
  for (const r of RULES) {
    assert.doesNotMatch(r, overclaim, `a rule overclaims enforcement: "${r}"`);
  }
});

test('the rules version is an integer that agreedToRules can match', () => {
  assert.ok(Number.isInteger(PURPOSE.version), 'PURPOSE.version must be an integer');
  assert.equal(agreedToRules({ rulesVersion: PURPOSE.version }, PURPOSE.version), true);
});
