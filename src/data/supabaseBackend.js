// The Supabase implementation of the table repository.
//
// Loaded only when a project is configured. The import is dynamic so that a
// build with no keys never pays for the client library at all — the pilot ran
// on localStorage for two weeks and should not have shipped 40KB of database
// driver to do it.

import {
  tableFromRow, tableToRow, signupFromRow, signupToRow, friendlyError,
} from './tableMapping.js';

const URL = import.meta.env?.VITE_SUPABASE_URL;
const KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;

/** Is a project wired up? Read by the repository to choose a backend. */
export const isConfigured = () => Boolean(URL && KEY);

let clientPromise = null;

async function client() {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL, KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
      }));
  }
  return clientPromise;
}

/**
 * The signed-in user, signing in anonymously if nobody is.
 *
 * Anonymous auth is the right trade for this pilot: row level security needs
 * a real `auth.uid()` to key off, and asking a traveller to invent a password
 * before they can ask to share a plate of pork would lose most of them at the
 * first screen. The session persists, so the same phone stays the same person
 * across visits, and the account can be upgraded to email later without the
 * rows moving.
 *
 * Enable it once in the dashboard: Authentication → Providers → Anonymous.
 */
async function currentUser() {
  const sb = await client();
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) return session.user;

  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw new Error(friendlyError(error));
  return data.user;
}

/** The signed-in user's profile row, created on first use. */
export async function ensureProfile(local = {}) {
  const sb = await client();
  const user = await currentUser();

  const { data: existing } = await sb
    .from('profiles').select('*').eq('id', user.id).maybeSingle();

  if (existing) {
    return {
      userId: existing.id,
      name: existing.name ?? '',
      nationality: existing.nationality ?? '',
      languages: existing.languages ?? [],
      isVerifiedHost: existing.is_verified_host ?? false,
    };
  }

  // Carries across whatever the traveller already typed while the app was
  // running on localStorage, so signing in does not blank their own name.
  const row = {
    id: user.id,
    name: local.name ?? '',
    nationality: local.nationality ?? '',
    languages: local.languages ?? [],
  };
  const { error } = await sb.from('profiles').insert(row);
  if (error) throw new Error(friendlyError(error));

  return { userId: user.id, ...local, isVerifiedHost: false };
}

export async function saveProfileFields({ name, nationality, languages }) {
  const sb = await client();
  const user = await currentUser();
  const { error } = await sb.from('profiles')
    .update({ name, nationality, languages })
    .eq('id', user.id);
  if (error) throw new Error(friendlyError(error));
}

export async function listTables() {
  const sb = await client();
  await currentUser();
  const { data, error } = await sb
    .from('tables').select('*').order('date').order('time');
  if (error) throw new Error(friendlyError(error));
  return (data ?? []).map(tableFromRow);
}

export async function getTable(id) {
  const sb = await client();
  await currentUser();
  const { data, error } = await sb.from('tables').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(friendlyError(error));
  return tableFromRow(data);
}

export async function createTable(input) {
  const sb = await client();
  const user = await currentUser();

  const { data: profile } = await sb
    .from('profiles').select('is_verified_host').eq('id', user.id).maybeSingle();

  const { data, error } = await sb
    .from('tables')
    .insert(tableToRow(input, { hostId: user.id, hostVerified: profile?.is_verified_host ?? false }))
    .select()
    .single();
  if (error) throw new Error(friendlyError(error));
  return tableFromRow(data);
}

/**
 * Calling off a table. The signups go with it through the foreign key's
 * `on delete cascade`, so there is no second call to get half-right.
 *
 * Row level security already restricts this to the host: `tables_delete_own`
 * checks `host_id = auth.uid()`, so a guest cannot cancel somebody's dinner.
 */
export async function deleteTable(tableId) {
  const sb = await client();
  await currentUser();
  const { error } = await sb.from('tables').delete().eq('id', tableId);
  if (error) throw new Error(friendlyError(error));
}

export async function listSignups(tableId) {
  const sb = await client();
  await currentUser();
  const { data, error } = await sb
    .from('signups').select('*').eq('table_id', tableId).order('created_at');
  if (error) throw new Error(friendlyError(error));
  return (data ?? []).map(signupFromRow);
}

export async function listAllSignups() {
  const sb = await client();
  await currentUser();
  const { data, error } = await sb.from('signups').select('*');
  if (error) throw new Error(friendlyError(error));
  return (data ?? []).map(signupFromRow);
}

export async function createSignup(input) {
  const sb = await client();
  const user = await currentUser();
  const { data, error } = await sb
    .from('signups').insert(signupToRow(input, { userId: user.id })).select().single();
  // The seat guard and the unique index both fire here, and both mean
  // something specific enough to say out loud.
  if (error) throw new Error(friendlyError(error));
  return signupFromRow(data);
}

export async function cancelSignup(signupId) {
  const sb = await client();
  await currentUser();
  const { error } = await sb.from('signups').delete().eq('id', signupId);
  if (error) throw new Error(friendlyError(error));
}

/** Nothing to seed: a shared database already has everybody else's tables. */
export async function seedSampleTables() {}
