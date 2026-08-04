// What the door says when it will not open.
//
// Every failure in AuthSheet used to be `setError(e.message)` — the string
// Supabase happens to return, in lowercase English, to an app whose every
// other label is written in two languages. Measured 2026-08-04: pressing
// 로그인 with both fields empty printed `missing email or phone`. That is a
// database talking, not a product, and it lands on the single screen where a
// confused person is most likely to close the tab for good.
//
// So the mapping lives here, next to the other policies, for the same reason
// they do: it is a judgement about what a person should be told, it is worth
// testing, and a component is the wrong place to keep one.
//
// Two rules hold this file honest:
//
//   1. Never claim more than the backend said. "Invalid login credentials"
//      does not tell us which of the two was wrong, and Supabase refuses to
//      say on purpose — so neither do we. Guessing "비밀번호가 틀렸어요" would
//      leak which emails have accounts.
//   2. Every message ends somewhere. A message that only names the problem
//      leaves a person stuck on the same screen, so each one carries the next
//      move, and the three that are really a different door say which door.

/** Where a failed attempt should send somebody, when it should send them anywhere. */
export const AUTH_ACTION = {
  SIGNIN: 'signin',   // the account exists — this is the wrong form
  SIGNUP: 'signup',   // no account — this is the wrong form, the other way
};

// Ordered: the first pattern that matches wins, so put the specific ones
// above the general ones. `already registered` must beat `email` for that
// reason.
const KNOWN = [
  {
    id: 'empty',
    match: /missing email or phone|missing credentials/i,
    kr: '이메일과 비밀번호를 입력해 주세요.',
    en: 'Enter your email and password.',
  },
  {
    id: 'registered',
    match: /already registered|already exists|user_repeated_signup/i,
    kr: '이미 가입된 이메일이에요. 로그인해 주세요.',
    en: 'That email already has an account — sign in instead.',
    action: AUTH_ACTION.SIGNIN,
  },
  {
    id: 'credentials',
    // Deliberately vague, because the backend is. Telling somebody the email
    // exists but the password is wrong is a way of listing your members.
    match: /invalid login credentials|invalid_credentials/i,
    kr: '이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요.',
    en: 'That email and password do not match an account. Check both and try again.',
    action: AUTH_ACTION.SIGNUP,
  },
  {
    id: 'weak-password',
    match: /password should be at least|weak_password/i,
    kr: '비밀번호는 8자 이상이어야 해요.',
    en: 'A password needs at least 8 characters.',
  },
  {
    id: 'email-shape',
    match: /invalid email|unable to validate email/i,
    kr: '이메일 주소 형식을 확인해 주세요.',
    en: 'That does not look like an email address.',
  },
  {
    id: 'unconfirmed',
    match: /email not confirmed|not_confirmed/i,
    kr: '이메일 확인이 필요한 계정이에요. 팀에 연락해 주세요.',
    en: 'This account is waiting on an email confirmation. Contact the team.',
  },
  {
    id: 'rate',
    match: /for security purposes|rate limit|too many requests|over_request_rate/i,
    kr: '잠시 후에 다시 시도해 주세요.',
    en: 'Too many attempts just now — wait a moment and try again.',
  },
  {
    id: 'provider',
    // A Google button on a project where the provider was never switched on.
    // The person pressing it did nothing wrong and can still use email.
    match: /provider is not enabled|unsupported provider|validation_failed/i,
    kr: 'Google 로그인이 아직 준비되지 않았어요. 이메일로 가입해 주세요.',
    en: 'Google sign-in is not available yet — use email instead.',
  },
  {
    id: 'device',
    // The device-only backend: no Supabase keys in the build at all.
    match: /device|no backend|not configured/i,
    kr: '이 기기에서는 계정 기능을 쓸 수 없어요.',
    en: 'Accounts are unavailable in this build — everything is saved on this device only.',
  },
  {
    id: 'network',
    match: /failed to fetch|networkerror|network request failed|load failed/i,
    kr: '연결이 끊겼어요. 인터넷을 확인하고 다시 시도해 주세요.',
    en: 'Could not reach the server. Check your connection and try again.',
  },
];

/** The last resort, when Supabase says something we have never seen. */
export const AUTH_FALLBACK = {
  id: 'unknown',
  kr: '문제가 생겼어요. 다시 시도해 주세요.',
  en: 'Something went wrong. Try again, or contact the team if it keeps happening.',
};

/**
 * A caught error, turned into something a person can read and act on.
 *
 * Takes anything: an Error, a Supabase error object, a bare string, null.
 * Returns null for null, so `{error && ...}` still works untouched.
 */
export function authError(err) {
  if (err === null || err === undefined) return null;
  const text = [
    typeof err === 'string' ? err : '',
    err?.message ?? '',
    err?.error_description ?? '',
    err?.code ?? '',
  ].join(' ').trim();
  if (!text) return { ...AUTH_FALLBACK };
  const hit = KNOWN.find(k => k.match.test(text));
  // The raw text rides along on `raw` and is never rendered — it is there so
  // a console or a bug report can still say what actually happened.
  return hit
    ? { id: hit.id, kr: hit.kr, en: hit.en, action: hit.action ?? null, raw: text }
    : { ...AUTH_FALLBACK, action: null, raw: text };
}

/** The one line the sheet prints. Korean first, everywhere in this app. */
export const authErrorText = (err) => {
  const e = authError(err);
  return e ? `${e.kr} · ${e.en}` : null;
};

/** Every id this module can produce — the test walks it so none rots. */
export const AUTH_ERROR_IDS = [...KNOWN.map(k => k.id), AUTH_FALLBACK.id];
