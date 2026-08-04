import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTH_KIND, isMember, MEMBER_ONLY, canPass, gateText,
  SIGNUP_FIELDS, validateSignup,
} from '../policy/access.js';

const member = { kind: AUTH_KIND.MEMBER };
const anon = { kind: AUTH_KIND.ANONYMOUS };
const nobody = { kind: AUTH_KIND.NONE };

const good = {
  email: 'aya@example.com', password: 'longenough1', name: 'Aya',
  phone: '+81 90-1234-5678', birthdate: '1999-04-12',
};

test('browsing is free and participating is not', () => {
  // The product decision itself, held as a test: the four doors that need an
  // account, and only those four. A fifth door added here without a
  // conversation should fail loudly somewhere, and this is the somewhere.
  assert.deepEqual(MEMBER_ONLY, ['join-table', 'open-table', 'request-table', 'passport']);
  for (const door of MEMBER_ONLY) {
    assert.equal(canPass(door, member), true);
    assert.equal(canPass(door, anon), false, `${door} let an anonymous session through`);
    assert.equal(canPass(door, nobody), false, `${door} let a signed-out browser through`);
  }
});

test('a door not on the list is open to everyone, including nobody', () => {
  // Absence from MEMBER_ONLY is what "open" means. Browsing surfaces never
  // appear in the list, so an unknown door must default open — the failure
  // mode to avoid is a typo quietly locking the quiz.
  for (const auth of [member, anon, nobody, null, undefined]) {
    assert.equal(canPass('explore', auth), true);
    assert.equal(canPass('quiz', auth), true);
    assert.equal(canPass('map', auth), true);
  }
});

test('an anonymous session is not a membership', () => {
  // The backend mints throwaway sessions so table lists can be read at all.
  // If one of those ever counted as a member, the gate would be decorative.
  assert.equal(isMember(anon), false);
  assert.equal(isMember(nobody), false);
  assert.equal(isMember(null), false);
  assert.equal(isMember(member), true);
});

test('every gated door has words for its closed state', () => {
  for (const door of MEMBER_ONLY) {
    const t = gateText(door);
    assert.ok(t.titleKr && t.titleEn && t.body && t.cta, `${door} has no gate text`);
    // The reassurance is the point: nobody should read a gate and conclude
    // the whole app is locked.
    assert.match(t.body, /without an account|does not need an account/);
  }
});

test('a gate reads in both languages, because its reader may read neither well', () => {
  // The bug: the signup sheet rendered the Korean title and nothing else, so
  // the audience this app exists for — somebody who does not read Korean —
  // met one Korean sentence at the moment it asked for their phone number.
  const hangul = /[가-힣]/;
  for (const door of MEMBER_ONLY) {
    const t = gateText(door);
    assert.match(t.titleKr, hangul, `${door} has no Korean heading`);
    assert.ok(!hangul.test(t.titleEn), `${door}'s English heading is not English`);
    assert.ok(!hangul.test(t.body), `${door}'s body is not English`);
    // The CTA is one line in both, the way every other button in the app is.
    assert.match(t.cta, /·/, `${door}'s button is not bilingual`);
  }
});

test('the signup form and the storage agree on what is collected', () => {
  // email, phone, name, birthdate — the meeting's list, exactly.
  assert.deepEqual(SIGNUP_FIELDS.map(f => f.id), ['email', 'phone', 'name', 'birthdate']);
  // Contact details are the ones that must never reach another traveller's
  // screen. Name is the exception on purpose — it is what a table calls you.
  assert.deepEqual(
    SIGNUP_FIELDS.filter(f => f.contact).map(f => f.id),
    ['email', 'phone', 'birthdate'],
  );
});

test('a complete signup passes and each missing field is named', () => {
  assert.deepEqual(validateSignup(good), []);
  assert.ok(validateSignup({ ...good, email: 'not-an-email' }).length === 1);
  assert.ok(validateSignup({ ...good, password: 'short' }).length === 1);
  assert.ok(validateSignup({ ...good, name: '  ' }).length === 1);
  assert.ok(validateSignup({ ...good, phone: 'abc' }).length === 1);
  assert.ok(validateSignup({ ...good, birthdate: '12-04-1999' }).length === 1);
  assert.equal(validateSignup({}).length, 5);
});

test('a birthdate in the future is refused', () => {
  const next = new Date(Date.now() + 366 * 86400000).toISOString().slice(0, 10);
  assert.equal(validateSignup({ ...good, birthdate: next }).length, 1);
});
