// Every read and write of tables and signups goes through this file.
//
// Today it is localStorage. In the second week of August it becomes Supabase,
// and *this is the only file that should change* — which is why every
// function here is async even though localStorage is not. Returning a promise
// from `listTables()` costs nothing now and saves rewriting every screen
// later, because the screens are already written to await it.
//
// The thing localStorage cannot do, and the reason the swap is not optional:
// it stores data inside one browser on one device. A host opening a table on
// their laptop writes to their laptop. A traveller opening the same URL on a
// phone reads their own empty phone. Deploying to Vercel does not change this
// — deployment ships the app, not the data. Shared tables need shared storage.

import { cleanGuides } from '../domain/catalog/hosts.js';
import { cleanLanguages } from '../domain/catalog/languages.js';
import { cleanDiets } from './profile.js';
import { cleanMeetingNote, cleanChatUrl } from '../domain/policy/meeting.js';
import { pointOf } from '../domain/policy/place.js';
import { acceptedSignups } from '../domain/policy/seatRequest.js';
import { tableShowsWoman } from '../domain/catalog/genders.js';
import { countsAsMet } from '../domain/policy/attendance.js';
import { isCancelled } from '../domain/policy/cancellation.js';
import { isPast } from '../domain/policy/table.js';

const TABLES_KEY = 'bapchingu-tables';
const SIGNUPS_KEY = 'bapchingu-signups';
const BLOCKS_KEY = 'bapchingu-blocks';
const REPORTS_KEY = 'bapchingu-reports';
const REVIEWS_KEY = 'bapchingu-reviews';

const read = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // A corrupt key must not take the screen down with it.
    return [];
  }
};

const write = (key, rows) => {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    // Quota or private-mode failures are survivable: the session keeps
    // working, the write is simply not durable.
  }
};

// Sortable and unique enough for one device. Supabase will issue real ids.
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// No local_isLocalOnly here, unlike every other name in this file. The
// question it answers is about which backend is wired, not about what a
// backend can do, so it is answered once at the export below rather than
// twice and picked between.

/** Every table, soonest meal first. */
async function local_listTables() {
  const rows = read(TABLES_KEY);
  return rows.slice().sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

async function local_getTable(id) {
  return read(TABLES_KEY).find(t => t.id === id) ?? null;
}

/**
 * @param {object} input { menuId, hostName, hostNationality, hostGender, date, time, place, seats, note }
 */
async function local_createTable(input) {
  const row = {
    id: newId(),
    menuId: input.menuId,
    hostId: input.hostId ?? 'local-host',
    hostName: input.hostName,
    hostNationality: input.hostNationality ?? '',
    hostGender: input.hostGender ?? null,
    // A host is a verified Korean in the plan. Nothing here can verify
    // anyone yet, so the field exists and stays false — the badge must never
    // appear until something real backs it.
    hostVerified: false,
    // Which vetted category the team placed them in. Set by the same process
    // that sets hostVerified — never here, never by a screen.
    hostKind: null,
    // What this host says they will walk the table through. A promise, not a
    // credential, so unlike the two fields above anybody may make it — and it
    // is filtered against the catalog so a hand-written id cannot invent a
    // label on somebody else's screen.
    guides: cleanGuides(input.guides),
    // What the evening will actually run in. The single fact a traveller
    // needs most and the app had never once printed.
    languages: cleanLanguages(input.languages),
    date: input.date,
    time: input.time,
    place: input.place,
    // The restaurant, separate from the meeting point. The plan has the host
    // choosing 특정 한식 메뉴와 식당, and a table that names a station exit but
    // not a shop leaves everybody standing outside the wrong one. Optional,
    // because a host may genuinely not have decided yet — but then the table
    // says so rather than leaving a blank.
    restaurant: input.restaurant ?? '',
    // What to look for at the meeting point. The app puts strangers at a
    // station exit and then had nothing more to say; this is the last
    // hundred metres.
    meetingNote: cleanMeetingNote(input.meetingNote),
    // The host's open-chat room — same audience as the note, same cleaner
    // as the remote path, so neither backend can carry an unsafe link.
    chatUrl: cleanChatUrl(input.chatUrl),
    // Same validation as the remote path: a point that could never be drawn
    // is never stored, on either backend.
    lat: pointOf(input)?.lat ?? null,
    lng: pointOf(input)?.lng ?? null,
    cancelledAt: null,
    seats: Number(input.seats),
    note: input.note ?? '',
    createdAt: Date.now(),
  };
  write(TABLES_KEY, [...read(TABLES_KEY), row]);
  return row;
}

/**
 * Called off the table — and nothing else.
 *
 * This used to delete the row and every seat on it, on the reasoning that a
 * seat at a table which no longer exists is worse than no seat. Half right:
 * what is worse still is the evening vanishing from a Passport with no
 * sentence attached, in an app that has no way to notify anybody. The guest
 * finds out by opening the table, so the table has to still be there to be
 * opened. See src/domain/policy/cancellation.js.
 */
async function local_deleteTable(tableId) {
  const rows = read(TABLES_KEY);
  const found = rows.find(t => t.id === tableId);
  if (!found || found.cancelledAt) throw new Error('That table was already called off.');
  // The signups are deliberately left alone. They are what lets the host see
  // who still needs telling, and the app cannot tell them.
  write(TABLES_KEY, rows.map(t => (t.id === tableId ? { ...t, cancelledAt: Date.now() } : t)));
}

async function local_listSignups(tableId) {
  return read(SIGNUPS_KEY)
    .filter(s => s.tableId === tableId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** Signups for every table at once, so a list screen makes one call. */
async function local_listAllSignups() {
  return read(SIGNUPS_KEY);
}

/**
 * The tables with a woman hosting.
 *
 * The host and not the guests, deliberately, and the same rule as
 * public.tables_with_woman() in the migration — the two backends have to agree
 * or a filter means different things depending on whether a project is wired
 * up. The reasoning is written out in full there; in short, the number of
 * people at a table is public, so a table with one guest appearing in this
 * list would say that guest is a woman.
 *
 * The narrowing lives in tableShowsWoman() so that it has one name, one place
 * to read the reasoning, and a test that calls it.
 */
async function local_tablesWithWoman() {
  return read(TABLES_KEY)
    .filter(t => !t.cancelledAt)
    .filter(tableShowsWoman)
    .map(t => t.id);
}

/**
 * @param {object} input { tableId, userId, name, nationality, gender, languages, diets, allergyNote, note }
 */
async function local_createSignup(input) {
  const row = {
    id: newId(),
    tableId: input.tableId,
    userId: input.userId,
    name: input.name,
    nationality: input.nationality ?? '',
    gender: input.gender ?? null,
    languages: input.languages ?? [],
    // How they eat, in their own word, on its way to the host.
    diets: cleanDiets(input.diets),
    // The escape valve for RESTRICTIONS's fixed five, carried the same way.
    allergyNote: input.allergyNote ?? '',
    note: input.note ?? '',
    // Matches the database's default rather than the column's original one:
    // asking for a seat is asking, on both backends.
    status: 'pending',
    createdAt: Date.now(),
  };
  write(SIGNUPS_KEY, [...read(SIGNUPS_KEY), row]);
  return row;
}

async function local_cancelSignup(signupId) {
  write(SIGNUPS_KEY, read(SIGNUPS_KEY).filter(s => s.id !== signupId));
}

/**
 * A host's answer, on the device-only backend.
 *
 * The `pending` check mirrors `.eq('status', 'pending')` in the Supabase
 * version, and for the same reason rather than out of symmetry: two open tabs
 * on one device are two callers, and the second must be told the request was
 * already answered instead of quietly replacing the first answer. The parity
 * that matters between these two backends is the errors they raise, not just
 * the rows they return.
 */
async function local_decideSignup(signupId, status) {
  const rows = read(SIGNUPS_KEY);
  const found = rows.find(s => s.id === signupId);
  if (!found || (found.status ?? 'accepted') !== 'pending') {
    throw new Error('That request was already answered.');
  }
  const next = rows.map(s => (s.id === signupId ? { ...s, status } : s));
  write(SIGNUPS_KEY, next);
  return next.find(s => s.id === signupId);
}

/**
 * Who turned up, on the device-only backend.
 *
 * The accepted-only check mirrors the remote's `.eq('status', 'accepted')`
 * and the RLS behind it: attendance on a seat that was never given is a
 * statement about nothing.
 */
async function local_recordAttendance(signupId, attendance) {
  const rows = read(SIGNUPS_KEY);
  const found = rows.find(s => s.id === signupId);
  if (!found || (found.status ?? 'accepted') !== 'accepted') {
    throw new Error('That seat is not one you can record attendance for.');
  }
  const next = rows.map(s => (s.id === signupId ? { ...s, attendance } : s));
  write(SIGNUPS_KEY, next);
  return next.find(s => s.id === signupId);
}

/** My own outgoing blocks — never anyone else's, same rule as the remote RLS. */
async function local_listBlocks() {
  return read(BLOCKS_KEY);
}

/**
 * @param {object} input { blockedId, blockedName }
 *
 * Idempotent rather than throwing on a repeat block: the button that calls
 * this has no reason to know it was already pressed once, and "you already
 * blocked them" is not information worth surfacing as an error.
 */
async function local_createBlock(input) {
  const existing = read(BLOCKS_KEY);
  const already = existing.find(b => b.blockedId === input.blockedId);
  if (already) return already;

  const row = {
    id: newId(),
    blockedId: input.blockedId,
    blockedName: input.blockedName ?? '',
    createdAt: Date.now(),
  };
  write(BLOCKS_KEY, [...existing, row]);
  return row;
}

async function local_deleteBlock(blockedId) {
  write(BLOCKS_KEY, read(BLOCKS_KEY).filter(b => b.blockedId !== blockedId));
}

/**
 * A report, on the backend with nobody at the other end of it.
 *
 * Stored locally because that is all this backend can do, and the limits of
 * that are the caller's to know: isLocalOnly() is already how screens learn
 * they are on device-only storage. The row shape mirrors the remote so the
 * dashboard and a localStorage inspection read the same fields.
 */
async function local_createReport(input) {
  const row = {
    id: newId(),
    tableId: input.tableId ?? null,
    reason: input.reasonId,
    note: input.note ?? '',
    createdAt: Date.now(),
  };
  write(REPORTS_KEY, [...read(REPORTS_KEY), row]);
}

async function local_listReviews(tableId) {
  return read(REVIEWS_KEY)
    .filter(r => r.tableId === tableId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * The meal photo, on the backend with no storage service behind it.
 *
 * The data URL *is* the storage here, which is honest rather than clever:
 * localStorage has a few megabytes and a downscaled meal photo is ~150KB, so
 * a handful of evenings fit and the quota error, if it ever comes, arrives as
 * the failure it is instead of as a silent truncation.
 */
async function local_saveTablePhoto(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    throw new Error('That file could not be read as an image.');
  }
  return dataUrl;
}

/** Upsert by seat, same one-line-per-seat rule the remote's primary key holds. */
async function local_saveReview(input) {
  const rows = read(REVIEWS_KEY).filter(r => r.signupId !== input.signupId);
  const row = {
    signupId: input.signupId,
    tableId: input.tableId,
    name: input.name ?? '',
    body: input.body,
    photoUrl: input.photoUrl ?? '',
    createdAt: Date.now(),
  };
  write(REVIEWS_KEY, [...rows, row]);
  return row;
}

/**
 * A host's track record, from the rows this device holds. The judgements are
 * the same policies the remote applies; only the storage differs. Null when
 * this device knows nothing about the host at all, so the screen can tell
 * "new host" apart from "no data here".
 */
async function local_hostRecord(hostId) {
  if (!hostId) return null;
  const mine = read(TABLES_KEY).filter(t => t.hostId === hostId);
  if (mine.length === 0) return null;

  const held = mine.filter(t => !isCancelled(t) && isPast(t));
  const heldIds = new Set(held.map(t => t.id));
  const guestsMet = acceptedSignups(
    read(SIGNUPS_KEY).filter(s => heldIds.has(s.tableId)),
  ).filter(countsAsMet).length;

  const latest = mine.slice().sort((a, b) => b.createdAt - a.createdAt)[0];
  return {
    name: latest.hostName ?? '',
    avatarUrl: '',
    languages: latest.languages ?? [],
    tablesHosted: held.length,
    guestsMet,
  };
}

/**
 * Example tables, written once so the first run is not an empty screen.
 *
 * These are seeded rather than faked at render time: they are ordinary rows a
 * host can cancel, not decoration the app pretends is real. Each is marked
 * `isSample` so the UI can say so — a demo that quietly passes invented
 * strangers off as real users is the one thing this screen must not do.
 */
async function local_seedSampleTables() {
  if (read(TABLES_KEY).length > 0) return;

  const day = 86400000;
  const dateIn = (n) => new Date(Date.now() + n * day).toISOString().slice(0, 10);

  const samples = [
    {
      menuId: 'samgyeopsal', hostName: 'Minsu', hostNationality: 'Korea',
      date: dateIn(2), time: '19:00', place: 'Jongno 3-ga, Seoul', seats: 4,
      note: 'First time grilling is fine — I will do the scissors.',
    },
    {
      menuId: 'gamjatang', hostName: 'Jiwon', hostNationality: 'Korea',
      date: dateIn(3), time: '18:30', place: 'Dongdaemun, Seoul', seats: 3,
      note: 'Slow dinner, plenty of time to talk.',
    },
    {
      menuId: 'ganjang-gejang', hostName: 'Haeun', hostNationality: 'Korea',
      date: dateIn(5), time: '12:30', place: 'Sinsa, Seoul', seats: 2,
      note: 'Lunch set. Bring an appetite for rice.',
    },
  ];

  const rows = samples.map(s => ({
    id: newId(), hostId: `sample-${s.hostName.toLowerCase()}`, hostVerified: false,
    isSample: true, createdAt: Date.now(), ...s,
  }));
  write(TABLES_KEY, rows);
}

// ---------------------------------------------------------------------------
// Which backend
// ---------------------------------------------------------------------------
// Everything above is the localStorage implementation the pilot was built on.
// Everything below chooses between it and Supabase and re-exports one set of
// names, so no screen has ever had to know which one it is talking to.
//
// The switch is the presence of keys, not a flag somebody has to remember to
// flip: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and the app is on
// shared storage; leave them unset and it keeps working on one device. That
// also means a developer without keys can still run the whole app.

import * as remote from './supabaseBackend.js';

const useRemote = remote.isConfigured();

/**
 * True while tables live in this browser only.
 *
 * The UI reads this to tell the truth on screen rather than letting a host
 * believe strangers can already see what they just opened.
 */
export const isLocalOnly = () => !useRemote;

// No isShared here. It existed as the negation of the line above, documented
// as "read by the Tables screen", and no screen ever read it — the Tables
// screen asks isLocalOnly() because the only thing it has to say is the
// warning, and there is nothing to announce about the ordinary case.

export const listTables = useRemote ? remote.listTables : local_listTables;
export const getTable = useRemote ? remote.getTable : local_getTable;
export const createTable = useRemote ? remote.createTable : local_createTable;
export const deleteTable = useRemote ? remote.deleteTable : local_deleteTable;
export const listSignups = useRemote ? remote.listSignups : local_listSignups;
export const listAllSignups = useRemote ? remote.listAllSignups : local_listAllSignups;
export const tablesWithWoman = useRemote ? remote.tablesWithWoman : local_tablesWithWoman;
export const createSignup = useRemote ? remote.createSignup : local_createSignup;
export const cancelSignup = useRemote ? remote.cancelSignup : local_cancelSignup;
export const decideSignup = useRemote ? remote.decideSignup : local_decideSignup;
export const recordAttendance = useRemote ? remote.recordAttendance : local_recordAttendance;

export const listBlocks = useRemote ? remote.listBlocks : local_listBlocks;
export const createBlock = useRemote ? remote.createBlock : local_createBlock;
export const deleteBlock = useRemote ? remote.deleteBlock : local_deleteBlock;

// 신고 · 후기 · 호스트 이력 — the trust surfaces 김훈 부장님's review asked
// for, wired through the same seam so the parity test holds both backends to
// them from the day they exist.
export const createReport = useRemote ? remote.createReport : local_createReport;
export const listReviews = useRemote ? remote.listReviews : local_listReviews;
export const saveReview = useRemote ? remote.saveReview : local_saveReview;
export const hostRecord = useRemote ? remote.hostRecord : local_hostRecord;
// The picture of the meal, which travels with the line — every comparable
// product sells with photographs and this one had none.
export const saveTablePhoto = useRemote ? remote.saveTablePhoto : local_saveTablePhoto;

// Seeded example rows exist to keep the first run from being an empty screen.
// A shared database has other people's real tables in it, so seeding there
// would be inventing strangers rather than filling a gap.
export const seedSampleTables = useRemote ? remote.seedSampleTables : local_seedSampleTables;

/**
 * The signed-in identity, once there is a server to have one.
 *
 * On localStorage this is a no-op and the app keeps using the random local id
 * from data/profile.js; on Supabase it signs in and returns the real user, so
 * row level security has something to key off.
 */
export const ensureProfile = useRemote ? remote.ensureProfile : async (local) => local;
export const saveProfileFields = useRemote ? remote.saveProfileFields : async () => {};

// --- Membership, on the device-only backend ------------------------------
//
// A real account system needs a server; this is the shape of one, so the
// screens behave identically on both backends and the parity test holds the
// two lists of capabilities together. The password is hashed before storage
// because even a demo must not keep plaintext next to the email it belongs
// to — but be honest about the ceiling: localStorage on a shared machine is
// readable by anybody at the keyboard, hash or no hash. The pilot's real
// accounts live in Supabase; this exists so a keyless build still walks.

const ACCOUNT_KEY = 'bapchingu-account';

const readAccount = () => {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const writeAccount = (row) => {
  try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(row)); } catch { /* quota */ }
};

async function hashPassword(password) {
  if (!globalThis.crypto?.subtle) return `plain:${password}`; // ancient browser; stated, not hidden
  const bytes = new TextEncoder().encode(`bapchingu:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function local_getAuthState() {
  const acc = readAccount();
  if (!acc || !acc.signedIn) return { kind: 'none' };
  return {
    kind: 'member',
    userId: acc.userId,
    email: acc.email ?? '',
    detailsComplete: Boolean(acc.phone && acc.birthdate),
  };
}

async function local_signUpMember({ email, password, name, phone, birthdate }) {
  const existing = readAccount();
  if (existing && existing.email === email.trim()) {
    throw new Error('That email already has an account — try signing in.');
  }
  const acc = {
    // The device's one identity — membership is a hat the same id puts on,
    // so tables opened before signing up stay recognisable as yours.
    userId: readAccount()?.userId ?? `u-${Math.random().toString(36).slice(2, 10)}`,
    email: email.trim(),
    passwordHash: await hashPassword(password),
    name: name?.trim() ?? '',
    phone: (phone ?? '').trim(),
    birthdate: birthdate || null,
    signedIn: true,
    createdAt: Date.now(),
  };
  writeAccount(acc);
  return { userId: acc.userId, email: acc.email };
}

async function local_signInMember({ email, password }) {
  const acc = readAccount();
  if (!acc || acc.email !== email.trim()) throw new Error('Email or password is wrong.');
  if (acc.passwordHash !== await hashPassword(password)) throw new Error('Email or password is wrong.');
  writeAccount({ ...acc, signedIn: true });
  return { userId: acc.userId, email: acc.email };
}

/**
 * Nothing to subscribe to on this backend, honestly.
 *
 * The remote version exists because a session can change without the app
 * asking — Google returning, a token refreshing, another tab signing out.
 * Here the account only ever changes through a call this app just made, and
 * every one of those already refreshes the screen. So this is a no-op that
 * returns a working unsubscribe, which keeps the screens identical on both
 * backends rather than making them ask which one they are on.
 */
function local_onAuthChange() {
  return () => {};
}

async function local_signInWithGoogle() {
  // The truthful version, not a fake success: OAuth needs the shared server.
  throw new Error('Google sign-in needs the shared server — this device-only build uses email sign-up instead.');
}

async function local_signOutMember() {
  const acc = readAccount();
  if (acc) writeAccount({ ...acc, signedIn: false });
}

async function local_saveMemberDetails({ email, phone, birthdate }) {
  const acc = readAccount();
  if (!acc || !acc.signedIn) throw new Error('Sign in before saving contact details.');
  writeAccount({
    ...acc,
    email: (email ?? acc.email ?? '').trim(),
    phone: (phone ?? '').trim(),
    birthdate: birthdate || acc.birthdate || null,
  });
}

/**
 * Closing the account, on the device-only backend: forget everything this
 * browser knows about the person. There is no server to tell, which is the
 * whole difference — but the effect a person asked for (my data is gone) is
 * the same one they get, so the two backends do not diverge in meaning.
 */
async function local_deleteAccount() {
  const acc = readAccount();
  if (!acc || !acc.signedIn) throw new Error('Sign in before closing your account.');
  try {
    localStorage.removeItem(ACCOUNT_KEY);
    // Their tables, seats, reviews and blocks go with them, same cascade the
    // database performs through profiles.
    write(TABLES_KEY, read(TABLES_KEY).filter(t => t.hostId !== acc.userId));
    write(SIGNUPS_KEY, read(SIGNUPS_KEY).filter(s => s.userId !== acc.userId));
    write(REVIEWS_KEY, []);
    write(BLOCKS_KEY, []);
  } catch { /* private mode; the account key is already gone */ }
}

async function local_saveAvatar(dataUrl) {
  const acc = readAccount();
  if (!acc || !acc.signedIn) throw new Error('Sign in before adding a photo.');
  // The data URL is the storage. Fine at avatar sizes — the screen downscales
  // to ~256px before this is ever called — and it round-trips the same shape
  // the remote returns: a string the profile can carry.
  writeAccount({ ...acc, avatarUrl: dataUrl });
  return dataUrl;
}

// Membership travels through the same seam as everything else, so the parity
// test holds both backends to the same list of capabilities.
export const getAuthState = useRemote ? remote.getAuthState : local_getAuthState;
// Reading the session once was never enough — see the comment on the remote
// implementation, written the day Google sign-in shipped and did not appear
// to work.
export const onAuthChange = useRemote ? remote.onAuthChange : local_onAuthChange;
export const signUpMember = useRemote ? remote.signUpMember : local_signUpMember;
export const signInMember = useRemote ? remote.signInMember : local_signInMember;
export const signInWithGoogle = useRemote ? remote.signInWithGoogle : local_signInWithGoogle;
export const signOutMember = useRemote ? remote.signOutMember : local_signOutMember;
export const saveMemberDetails = useRemote ? remote.saveMemberDetails : local_saveMemberDetails;
export const saveAvatar = useRemote ? remote.saveAvatar : local_saveAvatar;
// The door out, as available as the door in — required of anything holding
// a phone number, and the thing a privacy policy has to be able to point at.
export const deleteAccount = useRemote ? remote.deleteAccount : local_deleteAccount;
