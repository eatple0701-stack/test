// Translation between the database and the app.
//
// Postgres columns are snake_case; the screens read camelCase and have done
// since before there was a database. Keeping the app's shape unchanged is the
// whole point of the swap — no component should be able to tell which backend
// it is talking to.
//
// This is a separate file from the Supabase adapter on purpose: it is pure
// data shuffling, so it can be tested without a network, a project or a key.
// Field-mapping bugs are silent — a mistyped column name yields `undefined`
// rather than an error, and `undefined` renders as an empty card.

import { cleanGuides } from '../domain/catalog/hosts.js';
import { cleanLanguages } from '../domain/catalog/languages.js';
import { cleanGender } from '../domain/catalog/genders.js';
import { cleanDiets } from './profile.js';
import { cleanMeetingNote, cleanChatUrl } from '../domain/policy/meeting.js';
import { pointOf } from '../domain/policy/place.js';
import { cleanPhotoUrl } from '../domain/policy/review.js';

/** A `tables` row as it comes out of Postgres → the shape the screens read. */
export function tableFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    menuId: row.menu_id,
    hostId: row.host_id,
    hostName: row.host_name,
    hostNationality: row.host_nationality ?? '',
    hostGender: row.host_gender ?? null,
    hostVerified: row.host_verified ?? false,
    hostKind: row.host_kind ?? null,
    guides: Array.isArray(row.guides) ? row.guides : [],
    languages: Array.isArray(row.languages) ? row.languages : [],
    date: row.date,
    // Postgres returns `time` as HH:MM:SS; the app formats and compares HH:MM
    // everywhere, and `new Date('2026-08-17T19:00:00')` and the HH:MM form
    // agree, but the displayed string would gain a stray ":00".
    time: typeof row.time === 'string' ? row.time.slice(0, 5) : row.time,
    place: row.place,
    restaurant: row.restaurant ?? '',
    // How to recognise the host on the night. Gated in the UI rather than by
    // RLS — see canSeeMeetingNote in src/domain/policy/meeting.js.
    meetingNote: row.meeting_note ?? '',
    // The host's open-chat room, same audience and same gate as the note.
    // Cleaned on read as well as write, because a row predating the rule —
    // or written past the API — must still never render as a live link.
    chatUrl: cleanChatUrl(row.chat_url),
    // Where the host pointed at the map, if they did. Carried raw; whether
    // it is drawable is PlacePolicy's judgement, not this file's.
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    // Called off, kept rather than deleted — see policy/cancellation.js.
    cancelledAt: row.cancelled_at ?? null,
    seats: row.seats,
    note: row.note ?? '',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    // Sample rows only exist in the localStorage seed; nothing in the database
    // is a sample, so the badge never shows once the backend is real.
    isSample: false,
  };
}

/** The app's new-table input → an insertable `tables` row. */
export function tableToRow(input, { hostId, hostVerified = false } = {}) {
  return {
    menu_id: input.menuId,
    host_id: hostId,
    host_name: input.hostName,
    host_nationality: input.hostNationality ?? '',
    host_gender: cleanGender(input.hostGender),
    // Sent for completeness and refused by the database: the insert policy in
    // schema.sql rejects a row where host_verified is true, so a crafted
    // request cannot buy a badge. host_kind is not written here at all — it is
    // the team's column, set out of band once somebody has been checked.
    host_verified: hostVerified,
    guides: cleanGuides(input.guides),
    languages: cleanLanguages(input.languages),
    date: input.date,
    time: input.time,
    place: input.place,
    restaurant: input.restaurant ?? '',
    meeting_note: cleanMeetingNote(input.meetingNote),
    chat_url: cleanChatUrl(input.chatUrl),
    // Validated through the policy on the way in as well as out, so a point
    // that could never be drawn is never stored either.
    lat: pointOf(input)?.lat ?? null,
    lng: pointOf(input)?.lng ?? null,
    seats: Number(input.seats),
    note: input.note ?? '',
  };
}

export function signupFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    tableId: row.table_id,
    userId: row.user_id,
    name: row.name,
    nationality: row.nationality ?? '',
    gender: row.gender ?? null,
    languages: row.languages ?? [],
    diets: Array.isArray(row.diets) ? row.diets : [],
    allergyNote: row.allergy_note ?? '',
    note: row.note ?? '',
    // Left undefined rather than defaulted when the column is missing, so
    // statusOf() in seatRequest.js is the single place that decides what an
    // old row means. Two defaults would eventually disagree.
    //
    // This is also what makes the approval step survive arriving before its
    // own schema. A bundle deployed against a project where signups.status
    // does not exist yet reads undefined here, statusOf calls that accepted,
    // and every seat behaves exactly as it did before approval existed — no
    // pending badges, no decide buttons, nothing to break. signupToRow does
    // not write the column either, so the insert is equally happy. Run
    // schema.sql and the feature switches itself on, in that order or the
    // other one.
    status: row.status ?? undefined,
    // Same treatment, same reason — and here the null is not just tolerated
    // but is the ordinary case: nobody recorded anything, which attendance.js
    // reads as "they came".
    attendance: row.attendance ?? null,
    // Present only when the query embedded the profiles row (the avatar
    // stack on cards reads it); empty otherwise. Never written back —
    // signupToRow does not know the field exists.
    avatarUrl: row.profiles?.avatar_url ?? '',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

export function signupToRow(input, { userId } = {}) {
  return {
    table_id: input.tableId,
    user_id: userId,
    name: input.name,
    nationality: input.nationality ?? '',
    gender: cleanGender(input.gender),
    languages: cleanLanguages(input.languages),
    diets: cleanDiets(input.diets),
    allergy_note: input.allergyNote ?? '',
    note: input.note ?? '',
  };
}

/**
 * A `blocks` row → the shape the screens read.
 *
 * Only ever the blocker's own rows reach this — see blocks_select_own in
 * schema.sql — so `blockedId`/`blockedName` here always mean "somebody I
 * blocked", never the reverse.
 */
export function blockFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    blockedId: row.blocked_id,
    blockedName: row.blocked_name ?? '',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

export function blockToRow(input, { blockerId } = {}) {
  return {
    blocker_id: blockerId,
    blocked_id: input.blockedId,
    blocked_name: input.blockedName ?? '',
  };
}

/**
 * A report on its way to the team. One direction only — reports have no
 * FromRow because the app never reads them back; they are written here and
 * read in the dashboard, which is the entire design.
 */
export function reportToRow(input, { reporterId } = {}) {
  return {
    reporter_id: reporterId,
    table_id: input.tableId ?? null,
    reason: input.reasonId,
    note: input.note ?? '',
  };
}

/**
 * A review row → the shape the table page reads. The name is denormalised
 * onto the row at write time, same trade as tables.host_name: reviews render
 * on the hottest page in the app, and a join for a first name is not worth it.
 */
export function reviewFromRow(row) {
  if (!row) return null;
  return {
    signupId: row.signup_id,
    tableId: row.table_id,
    userId: row.user_id,
    name: row.name ?? '',
    body: row.body ?? '',
    // Cleaned on read as well as write: this becomes a src on other
    // people's screens, and a row written before the rule — or past the
    // API — must still never render as one.
    photoUrl: cleanPhotoUrl(row.photo_url),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

export function reviewToRow(input, { userId } = {}) {
  return {
    signup_id: input.signupId,
    table_id: input.tableId,
    user_id: userId,
    name: input.name ?? '',
    body: input.body,
    photo_url: cleanPhotoUrl(input.photoUrl),
  };
}

/**
 * Turn a Postgres error into something a person at a table can act on.
 *
 * The two that matter both come from the seat guard and the unique index —
 * they fire exactly when two phones raced for the same chair, which is the
 * moment the app most needs to say something true rather than "error".
 */
export function friendlyError(error) {
  const text = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
  if (text.includes('table_full')) return 'Somebody just took the last seat.';
  if (text.includes('duplicate key') || text.includes('unique')) return 'You already have a seat at this table.';
  if (text.includes('table_not_found')) return 'This table is no longer here.';
  return 'That did not save. Check your connection and try again.';
}
