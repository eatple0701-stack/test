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
