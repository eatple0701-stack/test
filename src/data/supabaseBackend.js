// The Supabase implementation of the table repository.
//
// Loaded only when a project is configured. The import is dynamic so that a
// build with no keys never pays for the client library at all — the pilot ran
// on localStorage for two weeks and should not have shipped 40KB of database
// driver to do it.

import {
  tableFromRow, tableToRow, signupFromRow, signupToRow, blockFromRow, blockToRow,
  reportToRow, reviewFromRow, reviewToRow, friendlyError,
} from './tableMapping.js';
import { cleanGender } from '../domain/catalog/genders.js';
import { acceptedSignups } from '../domain/policy/seatRequest.js';
import { mergeSeatHolds } from '../domain/policy/seatHolds.js';
import { countsAsMet } from '../domain/policy/attendance.js';
import { isCancelled, liveSignups } from '../domain/policy/cancellation.js';
import { isPast } from '../domain/policy/table.js';

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
// ── One sign-in per visitor, not one per caller ──────────────────────────
//
// Measured on production on 2026-09-01, the first day of 2차 운영: one first
// visit produced two POSTs to /auth/v1/signup, two anonymous user ids, and
// two rows in `profiles`. Only one token is written to storage; the other
// identity is orphaned in auth.users and counted in every total the pilot
// reports.
//
// The cause is that several screens ask for the user as the app boots, and
// each one runs this function. On a first visit they all reach getSession
// before any of them has finished signing in, all see no session, and all
// call signInAnonymously — which does exactly what it is asked to, twice.
//
// It is also where the 409 in the console came from. The two racing
// identities produce two concurrent inserts into `profiles`, and
// `ON CONFLICT DO NOTHING` does not protect against a duplicate key that is
// still uncommitted in another transaction. Worse, currentUser() below
// treats any error that is not 23503 as fatal and throws, so on an unlucky
// interleaving a first visit could fail outright.
//
// The fix is the pattern this file already uses for `clientPromise` one
// screen up: hold the in-flight promise so concurrent callers await the same
// sign-in instead of starting their own. Cleared when it settles — by then
// getSession has the session, and a failed attempt must be retryable.
let signInPromise = null;

async function signedInUser() {
  const sb = await client();
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) return session.user;

  if (!signInPromise) {
    signInPromise = sb.auth.signInAnonymously()
      .then(({ data, error }) => {
        if (error) throw new Error(friendlyError(error));
        return data.user;
      })
      .finally(() => { signInPromise = null; });
  }
  return signInPromise;
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

/**
 * A session whose account no longer exists, detected by the one write every
 * path makes: profiles.id references auth.users, so upserting the profile of
 * a deleted user fails with 23503 (foreign_key_violation).
 *
 * How this happens in practice: the pre-pilot cleanup deleted every
 * anonymous user and the test accounts, but a token is a bearer document —
 * every device that had a session still holds a cryptographically valid one
 * for a person who no longer exists. Found live on 2026-08-04: the landing
 * page hung on "Loading tables…" forever, because the dead session passed
 * getSession and then every query behind it failed.
 */
const isDeadSession = (error) => error?.code === '23503';

// The same race one level up. `profileEnsuredFor` is set *after* the write
// returns, so concurrent callers all pass the check above it and all write.
// With the sign-in deduped they now write the same row rather than two
// different ones, which Postgres serialises correctly — but it is still a
// redundant round trip on every boot, and the guard reads as though it
// prevents one.
let ensurePromise = null;

async function currentUser() {
  const user = await signedInUser();
  if (profileEnsuredFor === user.id) return user;
  if (ensurePromise) return ensurePromise;
  ensurePromise = ensureProfileRow(user).finally(() => { ensurePromise = null; });
  return ensurePromise;
}

async function ensureProfileRow(user) {
  const sb = await client();
  let { error } = await sb
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });

  if (isDeadSession(error)) {
    // Discard the ghost and start as somebody new — anonymous, like any
    // first visit. Browsing loses nothing; a member whose account was
    // deleted signs in again and is told the truth by the auth error.
    await sb.auth.signOut();
    const fresh = await signedInUser();
    ({ error } = await sb
      .from('profiles')
      .upsert({ id: fresh.id }, { onConflict: 'id', ignoreDuplicates: true }));
    if (error) throw new Error(friendlyError(error));
    profileEnsuredFor = fresh.id;
    return fresh;
  }

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

  // Google hands back a name and a photo in the token, and this function used
  // to drop both on the floor — a one-tap signup that produced a member
  // called "?" with no face, which is most of what one-tap was for. Adopted
  // only into empty fields, so nothing anybody typed is ever overwritten.
  const fromGoogle = {
    name: (user.user_metadata?.full_name || user.user_metadata?.name || '').trim(),
    avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
  };

  if (existing) {
    const adopt = {};
    if (!existing.name && fromGoogle.name) adopt.name = fromGoogle.name;
    if (!existing.avatar_url && fromGoogle.avatarUrl) adopt.avatar_url = fromGoogle.avatarUrl;
    if (Object.keys(adopt).length > 0) {
      await sb.from('profiles').update(adopt).eq('id', user.id);
      Object.assign(existing, adopt);
    }
    return {
      userId: existing.id,
      name: existing.name ?? '',
      avatarUrl: existing.avatar_url ?? '',
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
    name: local.name?.trim() || fromGoogle.name,
    avatar_url: fromGoogle.avatarUrl,
    nationality: local.nationality ?? '',
    languages: local.languages ?? [],
    gender: cleanGender(local.gender),
    rules_version: local.rulesVersion ?? null,
    rules_agreed_at: local.rulesAgreedAt ? new Date(local.rulesAgreedAt).toISOString() : null,
  };
  const { error } = await sb.from('profiles').insert(row);
  // Mount-path twin of the dead-session recovery in currentUser(): this runs
  // on app load with whatever token the browser kept, and a token can outlive
  // its account. Behave as "not signed in yet" rather than crashing the app's
  // first render — the next participating tap mints a fresh session normally.
  if (isDeadSession(error)) {
    await sb.auth.signOut();
    return { ...local };
  }
  if (error) throw new Error(friendlyError(error));

  return {
    userId: user.id,
    ...local,
    name: row.name,
    avatarUrl: row.avatar_url,
    isVerifiedHost: false,
  };
}

/**
 * The editable profile. NOT the consent — see saveRulesConsent below.
 *
 * It used to carry rules_version and rules_agreed_at, which meant every save
 * of a name or a nationality also rewrote the agreement from whatever the
 * caller's copy of the profile happened to hold. Seven call sites send this,
 * six of them have nothing to do with consent, and one of them
 * (ProfileSheet) sends a snapshot taken when the sheet was opened.
 *
 * That was not what reverted a consent on 2026-09-03 — an old bundle's gate
 * was — but it is a second way to the same place, and it also cost the
 * timestamp precision: reading gave `new Date(ts).getTime()`, milliseconds,
 * and writing gave that back as an ISO string, so a round trip through an
 * unrelated save truncated the microseconds Postgres had stored.
 */
export async function saveProfileFields({ name, nationality, languages, gender }) {
  const sb = await client();
  const user = await currentUser();
  const { error } = await sb.from('profiles')
    .update({ name, nationality, languages, gender: cleanGender(gender) })
    .eq('id', user.id);
  if (error) throw new Error(friendlyError(error));
}

/**
 * The agreement, and nothing else, written the moment somebody agrees.
 *
 * Two columns and no others, so a consent write cannot clobber a name and a
 * name write cannot clobber a consent. The timestamp goes out exactly once,
 * from the click that made it, and is never read back and rewritten.
 */
export async function saveRulesConsent({ rulesVersion, rulesAgreedAt }) {
  const sb = await client();
  const user = await currentUser();
  const { error } = await sb.from('profiles')
    .update({
      rules_version: rulesVersion,
      rules_agreed_at: new Date(rulesAgreedAt).toISOString(),
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

  const row = tableToRow(input, { hostId: user.id, hostVerified: profile?.is_verified_host ?? false });
  let attempt = { ...row };
  let { data, error } = await sb.from('tables').insert(attempt).select().single();

  // The deploy can reach a project whose schema has not caught up — the same
  // situation deleteTable already survives. PostgREST refuses an insert
  // naming a column it does not know, and helpfully says which one:
  //
  //   PGRST204: Could not find the 'lat' column of 'tables' in the schema cache
  //
  // So the retry reads the name out of the error and drops that column,
  // rather than dropping a hard-coded list. The hard-coded version was
  // written for chat_url and silently stopped working the day lat/lng were
  // added — the second column was never in the list, so the retry failed
  // identically to the first attempt. This version cannot go stale.
  //
  // Bounded, because a loop driven by a server's error text must terminate
  // even if the text stops matching, and columns are dropped one at a time
  // so a project missing only one keeps the rest.
  for (let i = 0; error && i < 6; i += 1) {
    if (error.code !== 'PGRST204' && error.code !== '42703') break;
    const missing = /'([a-z_]+)' column/.exec(error.message ?? '')?.[1];
    if (!missing || !(missing in attempt)) break;
    delete attempt[missing];
    ({ data, error } = await sb.from('tables').insert(attempt).select().single());
  }

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

// The embed rides the signups.user_id → profiles foreign key, and exists for
// one column: the face on the avatar stack. Falls back to a plain select when
// the join is refused — a schema mid-migration must degrade to "no faces",
// never to "no signups", because seat counts and approval flow both read this.
const SIGNUP_COLUMNS = '*, profiles (avatar_url)';

/**
 * The signups at one table, with the same anonymous placeholders the list
 * screen gets.
 *
 * The merge was on listAllSignups() alone for a few hours on 2026-09-01, and
 * the table page — the screen somebody actually decides on — was left reading
 * the raw rows. Once signups_read closed, a stranger read none of them, so
 * the page said "아직 아무도 자리를 잡지 않아서, 앉으시면 둘이 됩니다" about
 * a table with two people already on it, and printed 3 seats free beside a
 * card printing 2. A wrong number is bad; a sentence telling somebody they
 * would be the first when they would be the third is worse, and it was live.
 */
export async function listSignups(tableId) {
  const sb = await client();
  await currentUser();
  let { data, error } = await sb
    .from('signups').select(SIGNUP_COLUMNS).eq('table_id', tableId).order('created_at');
  if (error) {
    ({ data, error } = await sb
      .from('signups').select('*').eq('table_id', tableId).order('created_at'));
  }
  if (error) throw new Error(friendlyError(error));
  const mine = liveSignups((data ?? []).map(signupFromRow));

  const { data: holds, error: holdError } = await sb.rpc('seat_holds');
  if (holdError || !Array.isArray(holds)) return mine;
  return mergeSeatHolds(mine, holds.filter(h => h?.table_id === tableId));
}

/**
 * Every signup this person is entitled to read, plus an anonymous placeholder
 * for each seat held at a table they are not part of.
 *
 * signups_read gives you all of a table's rows or none of them — your own
 * seat, a table you host, a table you are sitting at — so "we saw nothing
 * here" and "there is nothing here" are the only two cases, and the second is
 * the one the placeholders fill. Merging per table rather than globally is
 * what keeps a host's own view exact while a stranger still sees 2/4.
 */
export async function listAllSignups() {
  const sb = await client();
  await currentUser();
  let { data, error } = await sb.from('signups').select(SIGNUP_COLUMNS);
  if (error) {
    ({ data, error } = await sb.from('signups').select('*'));
  }
  if (error) throw new Error(friendlyError(error));
  const mine = liveSignups((data ?? []).map(signupFromRow));

  // A project a migration behind has no seat_holds() yet. Degrade to what the
  // rows themselves say rather than to an error: before the policy lands they
  // are the whole truth anyway.
  const { data: holds, error: holdError } = await sb.rpc('seat_holds');
  if (holdError || !Array.isArray(holds)) return mine;
  return mergeSeatHolds(mine, holds);
}

/**
 * The tables with a woman at them, asked as a question rather than published
 * as a column.
 *
 * A `has_woman` boolean on every row would identify the third guest at a
 * four-seat table showing two, and flipping it the moment somebody joins
 * would point at that person exactly. This returns ids only, and only when
 * somebody has actually turned the filter on.
 */
export async function tablesWithWoman() {
  const sb = await client();
  await currentUser();
  const { data, error } = await sb.rpc('tables_with_woman');
  if (error) throw new Error(friendlyError(error));
  return (data ?? []).map(row => (typeof row === 'string' ? row : row?.id)).filter(Boolean);
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

/**
 * Somebody giving up a seat they asked for.
 *
 * This deleted the row until 2026-09-01e, and the row is the only record that
 * the request was ever made. The report due 9/20 counts seats requested, so
 * every change of mind was quietly subtracting from a number nobody could
 * reconstruct afterwards.
 *
 * `signups_cancel_own_or_host` allows this to the guest and to the table's
 * host; `signups_decision_guard` is what stops the same UPDATE being used to
 * accept your own seat. Neither is checked here — the database refuses, and a
 * check on this side would only decide what error to show.
 *
 * Written unconditionally rather than `.is('cancelled_at', null)`-guarded: a
 * second cancel writes a later timestamp over an earlier one, which is a
 * no-op in every screen that reads it, and the alternative is a round trip to
 * refuse something harmless.
 */
export async function cancelSignup(signupId) {
  const sb = await client();
  await currentUser();
  const { error } = await sb
    .from('signups')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('id', signupId);
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

/**
 * A table that is not there yet, in either of the dialects that mean it.
 * Postgres itself says 42P01 (undefined_table); PostgREST answers for a
 * missing relation from its schema cache with PGRST205 before Postgres is
 * ever asked — verified against this project on 2026-08-03, where the
 * pre-schema reports insert came back PGRST205, not 42P01.
 */
const isMissingTable = (error) =>
  error?.code === '42P01' || error?.code === 'PGRST205';

/**
 * A report on its way to the team's dashboard. Insert-only: reports_insert_own
 * is the table's whole policy surface, and there is deliberately no read.
 *
 * The missing-table case gets its own sentence because this feature can
 * reach a project before its schema does, and a safety door that fails with
 * "did not save" reads as the app shrugging at the person least able to
 * shrug back.
 */
export async function createReport(input) {
  const sb = await client();
  const user = await currentUser();
  const { error } = await sb.from('reports').insert(reportToRow(input, { reporterId: user.id }));
  if (isMissingTable(error)) {
    throw new Error('Reporting is not switched on for this project yet — run the latest schema.sql, then try again.');
  }
  if (error) throw new Error(friendlyError(error));
}

/**
 * The lines people left on one table. Tolerant of a missing reviews table —
 * a page must render without its reviews long before it may fail because of
 * them, same dormant-schema rule as signups.status.
 */
export async function listReviews(tableId) {
  const sb = await client();
  await currentUser();
  const { data, error } = await sb
    .from('reviews').select('*').eq('table_id', tableId).order('created_at');
  if (error) return [];
  return (data ?? []).map(reviewFromRow);
}

/**
 * Write — or rewrite — your one line about a meal. The upsert on the signup
 * primary key is what makes those the same act, and reviews_insert_own holds
 * the floor: only the accepted seat's own holder passes.
 */
export async function saveReview(input) {
  const sb = await client();
  const user = await currentUser();
  const { data, error } = await sb
    .from('reviews')
    .upsert(reviewToRow(input, { userId: user.id }), { onConflict: 'signup_id' })
    .select()
    .single();
  if (isMissingTable(error)) {
    throw new Error('Reviews are not switched on for this project yet — run the latest schema.sql.');
  }
  if (error) throw new Error(friendlyError(error));
  return reviewFromRow(data);
}

/**
 * The photo of a meal, on its way to the line it travels with.
 *
 * Stored at <uid>/<signupId>.jpg so the storage policy can check the folder
 * against auth.uid() — the same shape the avatars bucket uses — and keyed by
 * the seat so replacing your photo is the same act as posting it, exactly
 * like the review it belongs to.
 *
 * Returns the public URL for saveReview to carry. Nothing is written to the
 * reviews row here: a photo without a line is not a review, and two writes
 * that can half-succeed is how a table ends up with a picture nobody signed.
 */
export async function saveTablePhoto(dataUrl, signupId) {
  const sb = await client();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user || session.user.is_anonymous) {
    throw new Error('Sign in before adding a photo.');
  }
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${session.user.id}/${signupId}.jpg`;
  const { error } = await sb.storage.from('table-photos')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) {
    // The bucket can be a schema run behind, same as every other column
    // added this week. Say which door is shut rather than "did not save".
    if (/bucket/i.test(error.message ?? '')) {
      throw new Error('Photos are not switched on for this project yet — run the latest schema.sql.');
    }
    throw authFailure(error);
  }
  const { data: pub } = sb.storage.from('table-photos').getPublicUrl(path);
  return pub?.publicUrl ?? '';
}

/**
 * A host's track record, computed from rows anybody at the table could read
 * one by one — this only aggregates what tables_read and signups_read already
 * expose, so it grants nothing new.
 *
 * The judgements are the policies': a meal counts once it is past and was not
 * called off, a guest counts on an accepted seat unless recorded a no-show.
 * Returns null rather than zeros when the profile itself cannot be read, so
 * the screen can tell "new host" apart from "could not look".
 */
export async function hostRecord(hostId) {
  if (!hostId) return null;
  const sb = await client();
  await currentUser();

  const [{ data: prof, error: profErr }, { data: tableRows }] = await Promise.all([
    sb.from('profiles').select('name, avatar_url, languages').eq('id', hostId).maybeSingle(),
    sb.from('tables').select('*').eq('host_id', hostId),
  ]);
  if (profErr || !prof) return null;

  const held = (tableRows ?? []).map(tableFromRow).filter(t => !isCancelled(t) && isPast(t));
  let guestsMet = 0;
  if (held.length > 0) {
    const { data: signupRows } = await sb
      .from('signups').select('*').in('table_id', held.map(t => t.id));
    // A withdrawn request is not somebody this host met.
    guestsMet = acceptedSignups(liveSignups((signupRows ?? []).map(signupFromRow))).filter(countsAsMet).length;
  }

  return {
    name: prof.name ?? '',
    avatarUrl: prof.avatar_url ?? '',
    languages: Array.isArray(prof.languages) ? prof.languages : [],
    tablesHosted: held.length,
    guestsMet,
  };
}

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

/**
 * An auth failure, passed on without being reworded.
 *
 * This used to translate — `invalid login credentials` became "Email or
 * password is wrong." right here, in the data layer. Two problems, both found
 * on 2026-08-04. It was English-only in a bilingual app, and worse, it fired
 * *before* AuthErrorPolicy could read the original, so the policy always saw
 * a sentence it had never heard of and fell through to its generic line. Two
 * translators, and the wrong one won.
 *
 * So the rule this file follows everywhere else applies here too: the data
 * layer reports what happened, and src/domain/policy/authError.js decides
 * what a person is told. The code and status ride along, because Supabase
 * puts `invalid_credentials` in `code` and only sometimes in the message.
 */
function authFailure(error) {
  const e = new Error(error?.message || 'auth request failed');
  e.code = error?.code ?? error?.error_code ?? null;
  e.status = error?.status ?? null;
  return e;
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
  if (error) throw authFailure(error);
  if (!data.session) {
    throw new Error('This project still requires email confirmation — turn off "Confirm email" in Supabase Auth settings.');
  }
  // Profiles row first, contact details second — the order is load-bearing.
  // member_details.id is a foreign key to profiles(id), so writing the
  // details before the profile violates the key. The first deploy had these
  // two lines the other way round, and the live test failed exactly there:
  // auth user created, then a 'did not save' with a half-made account behind
  // it. The recovery path for anyone caught by that is signing in — the
  // details-completion step runs saveMemberDetails, which now guarantees the
  // profile row itself.
  const { error: profErr } = await sb.from('profiles')
    .upsert({ id: data.user.id, name: name?.trim() ?? '' }, { onConflict: 'id' });
  if (profErr) throw new Error(friendlyError(profErr));
  profileEnsuredFor = data.user.id;
  await saveMemberDetails({ email, phone, birthdate });
  return { userId: data.user.id, email: data.user.email ?? '' };
}

export async function signInMember({ email, password }) {
  const sb = await client();
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw authFailure(error);
  return { userId: data.user.id, email: data.user.email ?? '' };
}

/**
 * Tell me when the session changes, because reading it once is not enough.
 *
 * Found live on 2026-08-04, minutes after Google sign-in was switched on: a
 * member signed in with Google, landed back on the app, and the top bar
 * still offered 로그인/가입하기. The app read the session exactly once, at
 * mount, and Google's return puts the session in the URL for the client to
 * exchange *asynchronously* — the read finished first, decided "not signed
 * in", and nothing ever asked again.
 *
 * A one-shot read is wrong for more than OAuth, which is why the fix is a
 * subscription rather than a delay: tokens refresh on their own schedule,
 * another tab can sign out, and a restored session arrives after boot.
 *
 * Returns an unsubscribe function. Subscribing needs the client, which is
 * loaded lazily, so this hands back a canceller that works whether or not
 * the import has landed yet.
 */
export function onAuthChange(handler) {
  let subscription = null;
  let cancelled = false;
  client()
    .then((sb) => {
      if (cancelled) return;
      const { data } = sb.auth.onAuthStateChange((event) => handler(event));
      subscription = data?.subscription ?? null;
    })
    .catch(() => {});
  return () => {
    cancelled = true;
    subscription?.unsubscribe();
  };
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
  if (error) throw authFailure(error);
}

export async function signOutMember() {
  const sb = await client();
  const { error } = await sb.auth.signOut();
  if (error) throw authFailure(error);
}

/**
 * Close the account and take the data with it.
 *
 * Calls the delete-account Edge Function, which holds the service role key —
 * a browser cannot delete an auth user, and should not be able to. The
 * session token travels as proof of identity; the function decides nothing
 * from what the client says about itself.
 *
 * Signs out locally afterwards whatever the server said, because a token for
 * a deleted account is exactly the ghost session currentUser() now has to
 * recover from. Better to end it here than to leave it in the browser.
 */
export async function deleteAccount() {
  const sb = await client();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user || session.user.is_anonymous) {
    throw new Error('Sign in before closing your account.');
  }
  // The undeployed case does not arrive as a 404 you can read: the edge
  // runtime answers an unknown function without CORS headers, so the browser
  // blocks the response and fetch rejects with a bare "Failed to fetch".
  // Verified on 2026-08-04, which is why this is a catch and not a status
  // check — somebody asking to be deleted must never meet a stack-trace
  // sentence with no way forward in it.
  const OUT_OF_BAND = 'Account deletion is not switched on for this project yet. Mail eatple0701@gmail.com and the team will close your account and delete your details.';
  let res;
  try {
    res = await fetch(`${URL}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: KEY,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new Error(OUT_OF_BAND);
  }
  if (!res.ok) {
    if (res.status === 404) throw new Error(OUT_OF_BAND);
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'That did not work. Try again, or mail eatple0701@gmail.com.');
  }
  await sb.auth.signOut();
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
  // member_details.id references profiles(id), so the profile row has to
  // exist before this write no matter which door somebody came through —
  // fresh signup, Google completion, or recovery from the half-made accounts
  // the first deploy left behind. Guaranteed here rather than trusted to the
  // caller, because the caller already forgot once.
  const { error: profErr } = await sb.from('profiles')
    .upsert({ id: session.user.id }, { onConflict: 'id', ignoreDuplicates: true });
  if (profErr) throw new Error(friendlyError(profErr));

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
  if (error) throw authFailure(error);
  const { data: pub } = sb.storage.from('avatars').getPublicUrl(path);
  const url = pub?.publicUrl ?? '';
  const { error: profErr } = await sb.from('profiles')
    .update({ avatar_url: url }).eq('id', session.user.id);
  if (profErr) throw new Error(friendlyError(profErr));
  return url;
}
