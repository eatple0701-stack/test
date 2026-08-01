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

const TABLES_KEY = 'bapchingu-tables';
const SIGNUPS_KEY = 'bapchingu-signups';

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

/**
 * True while tables live in this browser only.
 *
 * The UI reads this to tell the truth on screen rather than letting a host
 * believe strangers can already see what they just opened.
 */
const local_isLocalOnly = () => true;

/** Every table, soonest meal first. */
async function local_listTables() {
  const rows = read(TABLES_KEY);
  return rows.slice().sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

async function local_getTable(id) {
  return read(TABLES_KEY).find(t => t.id === id) ?? null;
}

/**
 * @param {object} input { menuId, hostName, hostNationality, date, time, place, seats, note }
 */
async function local_createTable(input) {
  const row = {
    id: newId(),
    menuId: input.menuId,
    hostId: input.hostId ?? 'local-host',
    hostName: input.hostName,
    hostNationality: input.hostNationality ?? '',
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
    date: input.date,
    time: input.time,
    place: input.place,
    // The restaurant, separate from the meeting point. The plan has the host
    // choosing 특정 한식 메뉴와 식당, and a table that names a station exit but
    // not a shop leaves everybody standing outside the wrong one. Optional,
    // because a host may genuinely not have decided yet — but then the table
    // says so rather than leaving a blank.
    restaurant: input.restaurant ?? '',
    seats: Number(input.seats),
    note: input.note ?? '',
    createdAt: Date.now(),
  };
  write(TABLES_KEY, [...read(TABLES_KEY), row]);
  return row;
}

/**
 * Called off the table, and everybody's seats with it.
 *
 * There was no way to do this at all, which meant a host who could not make
 * their own dinner had no way to say so. The signups go too: a seat at a
 * table that no longer exists is worse than no seat, because it still shows
 * up in a Passport as something that is going to happen.
 */
async function local_deleteTable(tableId) {
  write(TABLES_KEY, read(TABLES_KEY).filter(t => t.id !== tableId));
  write(SIGNUPS_KEY, read(SIGNUPS_KEY).filter(s => s.tableId !== tableId));
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
 * @param {object} input { tableId, userId, name, nationality, languages, note }
 */
async function local_createSignup(input) {
  const row = {
    id: newId(),
    tableId: input.tableId,
    userId: input.userId,
    name: input.name,
    nationality: input.nationality ?? '',
    languages: input.languages ?? [],
    note: input.note ?? '',
    createdAt: Date.now(),
  };
  write(SIGNUPS_KEY, [...read(SIGNUPS_KEY), row]);
  return row;
}

async function local_cancelSignup(signupId) {
  write(SIGNUPS_KEY, read(SIGNUPS_KEY).filter(s => s.id !== signupId));
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

export const isLocalOnly = () => !useRemote;

/** True once tables are shared between devices. Read by the Tables screen. */
export const isShared = () => useRemote;

export const listTables = useRemote ? remote.listTables : local_listTables;
export const getTable = useRemote ? remote.getTable : local_getTable;
export const createTable = useRemote ? remote.createTable : local_createTable;
export const deleteTable = useRemote ? remote.deleteTable : local_deleteTable;
export const listSignups = useRemote ? remote.listSignups : local_listSignups;
export const listAllSignups = useRemote ? remote.listAllSignups : local_listAllSignups;
export const createSignup = useRemote ? remote.createSignup : local_createSignup;
export const cancelSignup = useRemote ? remote.cancelSignup : local_cancelSignup;

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
