// The Supabase implementation of the table repository.
//
// Loaded only when a project is configured. The import is dynamic so that a
// build with no keys never pays for the client library at all — the pilot ran
// on localStorage for two weeks and should not have shipped 40KB of database
// driver to do it.

import {
  tableFromRow, tableToRow, signupFromRow, signupToRow, blockFromRow, blockToRow, friendlyError,
} from './tableMapping.js';
import { cleanGender } from '../domain/catalog/genders.js';

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
async function signedInUser() {
  const sb = await client();
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) return session.user;

  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw new Error(friendlyError(error));
  return data.user;
}

/**
 * Signed in, and holding the profile row every foreign key points at.
 *
 * Both `tables.host_id` and `signups.user_id` reference `profiles(id)`, so a
 * signed-in user with no profile row cannot open a table or take a seat —
 * the insert fails on the foreign key and the screen says "That did not
 * save". ensureProfile() existed to create that row and nothing ever called
 * it: it was exported from the repository, re-exported for both backends, and
 * invoked by no screen in the app.
 *
 * So the guarantee belongs here rather than in a screen somebody has to
 * remember. This is the single choke point every read and write already goes
 * through, which makes forgetting it impossible rather than unlikely.
 *
 * Once per user, not once per session — keyed by the id rather than a bare
 * boolean. A flag would go stale the moment the signed-in user changes, which
 * happens on sign-out and on any session the browser did not restore, and the
 * next person would skip the write and hit the same foreign key this exists
 * to satisfy.
 *
 * The row is written with no name on purpose: naming is ensureProfile's job,
 * and blanking a returning traveller's name on every visit would be worse
 * than the bug this fixes.
 */
let profileEnsuredFor = null;

async function currentUser() {
  const user = await signedInUser();
  if (profileEnsuredFor === user.id) return user;

  const sb = await client();
  const { error } = await sb
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(friendlyError(error));

  profileEnsuredFor = user.id;
  return user;
}

/** The signed-in user's profile row, created on first use. */
export async function ensureProfile(local = {}) {
  const sb = await client();
  // signedInUser, not currentUser: currentUser writes a nameless row, and
  // this function exists to carry a name the traveller already typed.
  const user = await signedInUser();

  const { data: existing } = await sb
    .from('profiles').select('*').eq('id', user.id).maybeSingle();

  if (existing) {
    return {
      userId: existing.id,
      name: existing.name ?? '',
      nationality: existing.nationality ?? '',
      languages: existing.languages ?? [],
      gender: existing.gender ?? null,
      // Postgres hands back an ISO string; the app compares numbers.
      rulesVersion: existing.rules_version ?? null,
      rulesAgreedAt: existing.rules_agreed_at
        ? new Date(existing.rules_agreed_at).getTime() : null,
      isVerifiedHost: existing.is_verified_host ?? false,
    };
  }

  // Carries across whatever the traveller already typed while the app was
  // running on localStorage, so signing in does not blank their own name —
  // or make somebody agree to the rules a second time.
  const row = {
    id: user.id,
    name: local.name ?? '',
    nationality: local.nationality ?? '',
    languages: local.languages ?? [],
    gender: cleanGender(local.gender),
    rules_version: local.rulesVersion ?? null,
    rules_agreed_at: local.rulesAgreedAt ? new Date(local.rulesAgreedAt).toISOString() : null,
  };
  const { error } = await sb.from('profiles').insert(row);
  if (error) throw new Error(friendlyError(error));

  return { userId: user.id, ...local, isVerifiedHost: false };
}

export async function saveProfileFields({
  name, nationality, languages, gender, rulesVersion, rulesAgreedAt,
}) {
  const sb = await client();
  const user = await currentUser();
  const { error } = await sb.from('profiles')
    .update({
      name, nationality, languages, gender: cleanGender(gender),
      rules_version: rulesVersion ?? null,
      rules_agreed_at: rulesAgreedAt ? new Date(rulesAgreedAt).toISOString() : null,
    })
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
/**
 * Call a table off without erasing it.
 *
 * Was a delete, which cascaded the signups and left a guest's Passport one
 * line shorter with nothing said. The row and its seats stay so that the
 * people who were going can still open it and read that it was cancelled —
 * which, with no notifications anywhere in this app, is the only way they
 * will ever find out.
 *
 * `.is('cancelled_at', null)` matches tables_cancel_own's own `using`: a
 * second press, or a second device, matches no row and is told so rather than
 * silently rewriting the timestamp on a cancellation somebody has already
 * seen.
 */
export async function deleteTable(tableId) {
  const sb = await client();
  await currentUser();
  const { data, error } = await sb
    .from('tables')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('id', tableId)
    .is('cancelled_at', null)
    .select()
    .maybeSingle();

  // A bundle can reach a project whose schema has not caught up, and this is
  // the one action where failing would be worse than doing the old thing: a
  // host trying to call off a meal they cannot attend, and being shown an
  // error, leaves guests expecting a dinner nobody is coming to. So when the
  // column is genuinely absent — 42703, Postgres's own undefined_column —
  // fall back to the delete this used to be.
  //
  // Narrow on purpose. Any other error still surfaces, because "cancelling
  // quietly deleted everything" must not become the answer to a network
  // blip or a policy refusal.
  if (error?.code === '42703') {
    const { error: delError } = await sb.from('tables').delete().eq('id', tableId);
    if (delError) throw new Error(friendlyError(delError));
    return null;
  }
  if (error) throw new Error(friendlyError(error));
  if (!data) throw new Error('That table was already called off.');
  return tableFromRow(data);
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

/**
 * A host's answer to one seat request.
 *
 * Deliberately thin. Whether this host may answer at all, and whether there
 * is still a seat to give, are SeatRequestPolicy's questions and are asked
 * before the button is offered — but the answer that counts is the one
 * signups_decide_by_host gives in the database, which is why the update is
 * scoped by id and status rather than trusting what the screen believed.
 *
 * `.eq('status', 'pending')` matters for two hosts on two devices: the second
 * update matches no row and returns nothing, so the caller learns the request
 * was already answered instead of silently overwriting the first answer.
 */
export async function decideSignup(signupId, status) {
  const sb = await client();
  await currentUser();
  const { data, error } = await sb
    .from('signups')
    .update({ status })
    .eq('id', signupId)
    .eq('status', 'pending')
    .select()
    .maybeSingle();
  if (error) throw new Error(friendlyError(error));
  if (!data) throw new Error('That request was already answered.');
  return signupFromRow(data);
}

/**
 * Who turned up, recorded by the host after the meal.
 *
 * Scoped to `status = 'accepted'` for the same reason the policy is: marking
 * somebody absent who was never given a seat says nothing about them, and
 * would put a no-show on a record that only ever held a refusal.
 *
 * Passing null clears the mark, which is how a host undoes a mis-tap. There
 * is no separate "unmark" path because a correction and a first answer are
 * the same act, and one of them being harder than the other is how records
 * stay wrong.
 */
export async function recordAttendance(signupId, attendance) {
  const sb = await client();
  await currentUser();
  const { data, error } = await sb
    .from('signups')
    .update({ attendance })
    .eq('id', signupId)
    .eq('status', 'accepted')
    .select()
    .maybeSingle();
  if (error) throw new Error(friendlyError(error));
  if (!data) throw new Error('That seat is not one you can record attendance for.');
  return signupFromRow(data);
}

/** My own outgoing blocks — blocks_select_own in schema.sql permits nothing else. */
export async function listBlocks() {
  const sb = await client();
  const user = await currentUser();
  const { data, error } = await sb
    .from('blocks').select('*').eq('blocker_id', user.id).order('created_at');
  if (error) throw new Error(friendlyError(error));
  return (data ?? []).map(blockFromRow);
}

/**
 * Idempotent: blocking somebody twice is not an error a person pressing a
 * button a second time should ever see. `23505` is Postgres's own code for
 * "unique_violation", which is exactly what blocks' `unique (blocker_id,
 * blocked_id)` raises here — checked by code rather than by sniffing the
 * message text friendlyError parses, because a constraint's error code does
 * not change if somebody later rewords the message.
 */
export async function createBlock(input) {
  const sb = await client();
  const user = await currentUser();
  const { data, error } = await sb
    .from('blocks').insert(blockToRow(input, { blockerId: user.id })).select().single();
  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await sb
        .from('blocks').select('*')
        .eq('blocker_id', user.id).eq('blocked_id', input.blockedId).maybeSingle();
      if (existing) return blockFromRow(existing);
    }
    throw new Error(friendlyError(error));
  }
  return blockFromRow(data);
}

export async function deleteBlock(blockedId) {
  const sb = await client();
  const user = await currentUser();
  const { error } = await sb
    .from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', blockedId);
  if (error) throw new Error(friendlyError(error));
}

/** Nothing to seed: a shared database already has everybody else's tables. */
export async function seedSampleTables() {}

// ---------------------------------------------------------------------------
// Membership — accounts, on top of the anonymous sessions browsing runs on.
//
// The split the product decided on 2026-08-03: reading needs a session
// (RLS is `to authenticated`, so signedInUser mints throwaway anonymous ones
// on demand), participating needs a *member* — somebody who signed up and
// left contact details the team can reach. Nothing here verifies anything:
// no confirmation mail, no SMS code. Email and phone are collected as
// information, which is the requirement the meeting actually stated, and
// pretending to verify them would be theatre.
//
// Contact details go to `member_details`, a table whose RLS lets a person
// read and write only their own row. Other travellers never see a phone
// number; the team reads the table from the dashboard, which bypasses RLS by
// design. That is what "관리 측면에서 필요한 정보" turns into concretely.

/** Auth errors, translated to sentences a person at a form can act on. */
function friendlyAuthError(error) {
  const text = (error?.message ?? '').toLowerCase();
  if (text.includes('invalid login credentials')) return 'Email or password is wrong.';
  if (text.includes('already registered')) return 'That email already has an account — try signing in.';
  if (text.includes('at least 8') || text.includes('password should')) return 'A password needs at least 8 characters.';
  if (text.includes('provider is not enabled') || text.includes('unsupported provider')) {
    return 'Google sign-in is not switched on for this project yet.';
  }
  if (text.includes('confirm') || text.includes('not confirmed')) {
    return 'This project still requires email confirmation — turn off "Confirm email" in Supabase Auth settings, or check your inbox.';
  }
  if (text.includes('rate limit')) return 'Too many tries from this network — wait a minute and try again.';
  return error?.message || 'That did not work. Check your connection and try again.';
}

/**
 * Who is holding the phone: none, anonymous, or member.
 *
 * Reads the session without creating one — this is the call the app makes on
 * mount, and mounting must not mint accounts. Every page view used to sign in
 * anonymously on arrival, which is how a busy venue's shared wifi walks into
 * Supabase's 30-per-hour anonymous sign-in limit; browsing now costs nothing
 * until somebody actually opens a table list.
 *
 * `detailsComplete` is how a Google member is caught: OAuth hands back a name
 * and an email but no phone and no birthdate, so the app has one more step to
 * ask — and this flag is what tells it to.
 */
export async function getAuthState() {
  const sb = await client();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user) return { kind: 'none' };
  if (session.user.is_anonymous) return { kind: 'anonymous', userId: session.user.id };
  const { data: details } = await sb
    .from('member_details').select('id').eq('id', session.user.id).maybeSingle();
  return {
    kind: 'member',
    userId: session.user.id,
    email: session.user.email ?? '',
    detailsComplete: Boolean(details),
  };
}

/**
 * Sign up with email and password, and file the contact details.
 *
 * The email doubles as the login ID. If the dashboard still has
 * "Confirm email" switched on, signUp hands back a user with no session and
 * this surfaces as its own sentence rather than a mystery — the setting is
 * the deploy step this feature depends on, the way schema.sql is for columns.
 */
export async function signUpMember({ email, password, name, phone, birthdate }) {
  const sb = await client();
  const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
  if (error) throw new Error(friendlyAuthError(error));
  if (!data.session) {
    throw new Error('This project still requires email confirmation — turn off "Confirm email" in Supabase Auth settings.');
  }
  await saveMemberDetails({ email, phone, birthdate });
  // The profiles row every foreign key points at, carrying the typed name.
  const { error: profErr } = await sb.from('profiles')
    .upsert({ id: data.user.id, name: name?.trim() ?? '' }, { onConflict: 'id' });
  if (profErr) throw new Error(friendlyError(profErr));
  profileEnsuredFor = data.user.id;
  return { userId: data.user.id, email: data.user.email ?? '' };
}

export async function signInMember({ email, password }) {
  const sb = await client();
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(friendlyAuthError(error));
  return { userId: data.user.id, email: data.user.email ?? '' };
}

/**
 * Google. Redirects the whole page away and back, so nothing after this call
 * runs on success — the session arrives in the URL when Google returns, the
 * client library picks it up, and the mount-time getAuthState sees a member.
 * The one thing that does come back here is the failure to even leave, which
 * is what an unconfigured provider looks like.
 */
export async function signInWithGoogle() {
  const sb = await client();
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new Error(friendlyAuthError(error));
}

export async function signOutMember() {
  const sb = await client();
  const { error } = await sb.auth.signOut();
  if (error) throw new Error(friendlyAuthError(error));
}

/**
 * The contact row, upserted so the Google completion step and the signup form
 * are the same write. Email is stored here as well as in auth so the team
 * reads one table in the dashboard, not a join.
 */
export async function saveMemberDetails({ email, phone, birthdate }) {
  const sb = await client();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user || session.user.is_anonymous) {
    throw new Error('Sign in before saving contact details.');
  }
  const row = {
    id: session.user.id,
    email: (email ?? session.user.email ?? '').trim(),
    phone: (phone ?? '').trim(),
    birthdate: birthdate || null,
  };
  const { error } = await sb.from('member_details').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(friendlyError(error));
}

/**
 * The profile photo. A data URL, already downscaled by the screen — the
 * storage bucket caps size as the real enforcement, this just keeps uploads
 * quick on venue wifi. Stored at <uid>/avatar.jpg so the storage policy can
 * check the folder name against auth.uid(), and upsert:true makes replacing
 * your photo the same act as setting it.
 */
export async function saveAvatar(dataUrl) {
  const sb = await client();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user || session.user.is_anonymous) {
    throw new Error('Sign in before adding a photo.');
  }
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${session.user.id}/avatar.jpg`;
  const { error } = await sb.storage.from('avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw new Error(friendlyAuthError(error));
  const { data: pub } = sb.storage.from('avatars').getPublicUrl(path);
  const url = pub?.publicUrl ?? '';
  const { error: profErr } = await sb.from('profiles')
    .update({ avatar_url: url }).eq('id', session.user.id);
  if (profErr) throw new Error(friendlyError(profErr));
  return url;
}
