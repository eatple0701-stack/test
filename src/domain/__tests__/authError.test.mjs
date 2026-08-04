import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authError, authErrorText, AUTH_ACTION, AUTH_ERROR_IDS, AUTH_FALLBACK,
} from '../policy/authError.js';

// The strings Supabase actually returned during the 2026-08-04 sweep, plus the
// ones its docs list for the same endpoints. Kept verbatim: the whole point of
// this module is that these exact bytes never reach a traveller's screen.
const REAL = {
  'missing email or phone': 'empty',
  'Invalid login credentials': 'credentials',
  'User already registered': 'registered',
  'Password should be at least 6 characters.': 'weak-password',
  'Unable to validate email address: invalid format': 'email-shape',
  'Email not confirmed': 'unconfirmed',
  'For security purposes, you can only request this after 45 seconds.': 'rate',
  'Unsupported provider: provider is not enabled': 'provider',
  'Failed to fetch': 'network',
};

test('every error Supabase actually returns is recognised', () => {
  for (const [raw, id] of Object.entries(REAL)) {
    assert.equal(authError(raw).id, id, `"${raw}" should map to ${id}`);
  }
});

test('nothing reaches the screen in English only', () => {
  for (const raw of Object.keys(REAL)) {
    const e = authError(raw);
    assert.ok(e.kr.trim().length > 0, `${e.id} has no Korean`);
    assert.ok(e.en.trim().length > 0, `${e.id} has no English`);
    // 한글이 실제로 들어 있어야 한다 — 라벨만 한국어인 척하는 것을 막는다.
    assert.match(e.kr, /[가-힣]/, `${e.id}'s Korean is not Korean`);
  }
});

test('the raw backend string is carried but never in the text', () => {
  const e = authError('missing email or phone');
  assert.equal(e.raw, 'missing email or phone');
  assert.ok(!authErrorText('missing email or phone').includes('missing email'));
});

test('a wrong password never reveals whether the email has an account', () => {
  const e = authError('Invalid login credentials');
  assert.ok(!/비밀번호가 틀|password is wrong|no account with/i.test(`${e.kr} ${e.en}`));
});

test('the two doors point at each other', () => {
  assert.equal(authError('User already registered').action, AUTH_ACTION.SIGNIN);
  assert.equal(authError('Invalid login credentials').action, AUTH_ACTION.SIGNUP);
  assert.equal(authError('Failed to fetch').action, null);
});

test('Errors, Supabase objects and bare strings all work', () => {
  assert.equal(authError(new Error('User already registered')).id, 'registered');
  assert.equal(authError({ message: 'Failed to fetch' }).id, 'network');
  assert.equal(authError({ error_description: 'Invalid login credentials' }).id, 'credentials');
  assert.equal(authError('Failed to fetch').id, 'network');
});

test('null stays null so `{error && …}` keeps working', () => {
  assert.equal(authError(null), null);
  assert.equal(authError(undefined), null);
  assert.equal(authErrorText(null), null);
});

test('an error nobody has seen before still says something useful', () => {
  const e = authError('boom 500 upstream');
  assert.equal(e.id, AUTH_FALLBACK.id);
  assert.match(e.kr, /[가-힣]/);
  assert.equal(e.raw, 'boom 500 upstream');
  // An empty error object is still an error, not nothing.
  assert.equal(authError({}).id, AUTH_FALLBACK.id);
});

test('the id list matches what the module can produce', () => {
  const produced = new Set(Object.keys(REAL).map(r => authError(r).id));
  produced.add(authError('device only build').id);
  for (const id of produced) assert.ok(AUTH_ERROR_IDS.includes(id), `${id} missing from AUTH_ERROR_IDS`);
  assert.ok(AUTH_ERROR_IDS.includes(AUTH_FALLBACK.id));
});
