// AccessPolicy — what needs an account, and what never should.
//
// The decision, made 2026-08-03: browsing is free, participating is not.
// The map, the dishes, the culture prose, the quiz, the phrases — a traveller
// standing in a station reading about 감자탕 owes this app nothing, and asking
// them to register before showing them a tip would lose exactly the people
// the pilot most wants to reach. But a seat at a table with strangers, and a
// Passport that remembers evenings, belong to somebody the team can reach —
// 매칭 시스템 관리 측면에서, in the words of the meeting that asked for this.
//
// Deliberately NOT verification. Email and phone are collected as contact
// information for running the pilot, not confirmed with codes — an SMS
// verification pipeline needs a paid provider and a business registration,
// and an email round-trip adds a step that filters out tired travellers.
// The team can see who signed up; that is the requirement, and this is the
// smallest thing that meets it.
//
// Three kinds of person can be holding the phone:
//
//   NONE       no session at all. Can browse everything client-side.
//   ANONYMOUS  a throwaway session the backend mints so table lists can be
//              read (RLS is `to authenticated`). Same powers as NONE from
//              the product's point of view — browsing.
//   MEMBER     signed up, with contact details on file. Can participate.

export const AUTH_KIND = {
  NONE: 'none',
  ANONYMOUS: 'anonymous',
  MEMBER: 'member',
};

export const isMember = (auth) => auth?.kind === AUTH_KIND.MEMBER;

/**
 * The doors that need a membership card.
 *
 * One list, so a new surface added next month can look up whether it gates
 * rather than each screen deciding for itself and drifting. Browsing surfaces
 * are deliberately absent — absence from this list is what "open to everyone"
 * means, and a test holds the list so it cannot grow silently.
 */
export const MEMBER_ONLY = [
  'join-table',      // asking for a seat
  'open-table',      // hosting one
  'request-table',   // 찾는 밥상 — asking the app to find one
  'passport',        // the record of evenings and people
];

export const requiresMember = (door) => MEMBER_ONLY.includes(door);

/** May this person walk through this door? */
export const canPass = (door, auth) =>
  !requiresMember(door) || isMember(auth);

/**
 * What the closed door says.
 *
 * Written once here rather than per-screen, and written as an invitation
 * rather than a refusal — the person reading it just tried to do the most
 * valuable thing in the app, and "log in required" is how products talk when
 * they have stopped imagining the person. The browsing reassurance is in
 * every variant on purpose: the professor's whole point about the front door
 * was that nobody should feel locked out of looking.
 */
export const GATE_TEXT = {
  'join-table': {
    title: '자리를 요청하려면 가입이 필요해요',
    body: 'A seat at a table is a promise to real people, so the team needs a way to reach you if plans change. Browsing every table, dish and tip stays open without an account.',
    cta: '가입하고 계속 · Join and continue',
  },
  'open-table': {
    title: '상을 차리려면 가입이 필요해요',
    body: 'Hosting means strangers plan their evening around you, so hosts sign up first. Looking around does not need an account.',
    cta: '가입하고 계속 · Join and continue',
  },
  'request-table': {
    title: '찾는 밥상은 가입 후에 쓸 수 있어요',
    body: 'When the app opens a table for you, somebody has to be reachable when a match lands. Browsing stays open without an account.',
    cta: '가입하고 계속 · Join and continue',
  },
  passport: {
    title: '패스포트는 가입하면 생겨요',
    body: 'The Passport keeps your evenings and the people you met — it needs to belong to somebody. Every dish, place and tip in the app stays open without an account.',
    cta: '가입하고 시작 · Join and start',
  },
};

export const gateText = (door) => GATE_TEXT[door] ?? GATE_TEXT['join-table'];

/**
 * What signing up asks for, and why each field is there.
 *
 * The list the meeting settled on — email, phone, name, birthdate — carried
 * here so the form and the storage cannot disagree about what exists.
 * `contact: true` marks the fields that are personal contact information:
 * they go to the members-only details table the RLS lets nobody else read,
 * never onto anything another traveller can see.
 */
export const SIGNUP_FIELDS = [
  { id: 'email', contact: true, label: '이메일 · Email' },
  { id: 'phone', contact: true, label: '전화번호 · Phone' },
  { id: 'name', contact: false, label: '이름 · Name' },
  { id: 'birthdate', contact: true, label: '생년월일 · Date of birth' },
];

/**
 * Problems with a signup, in the order the form shows its fields.
 *
 * Validation is shallow on purpose. The email is not verified and the phone
 * is not either — that is the product decision, not an oversight — so
 * checking anything beyond "looks like one" would be pretending to a rigour
 * the system does not have.
 */
export function validateSignup({ email, phone, name, birthdate, password } = {}) {
  const problems = [];
  if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    problems.push('Enter an email address — it doubles as your login ID.');
  }
  if (!password || password.length < 8) {
    problems.push('A password needs at least 8 characters.');
  }
  if (!name || !name.trim()) {
    problems.push('Add the name people at a table should call you.');
  }
  if (!phone || !/^[+\d][\d\s-]{7,}$/.test(phone.trim())) {
    problems.push('Enter a phone number the team could reach you on.');
  }
  if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    problems.push('Pick your date of birth.');
  } else {
    const at = new Date(`${birthdate}T00:00`);
    const now = new Date();
    if (!Number.isFinite(at.getTime()) || at.getTime() > now.getTime()) {
      problems.push('That date of birth has not happened yet.');
    }
  }
  return problems;
}
