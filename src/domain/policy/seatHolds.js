// A seat you can see is taken, at a table whose guests are not yours to read.
//
// Until 2026-09-01 `signups` was readable by anybody with a session, which on
// this app means anybody at all — every visitor is signed in anonymously on
// arrival so browsing works before signup. The rows carry a name, a
// nationality and a free-text note written to the host.
//
// Closing that had one thing standing in its way, and it was not a privacy
// question: the seat counter is the same read. `listAllSignups()` fed
// seatsRemaining() and attendance() on every card, so scoping the policy and
// keeping "2 of 4 taken" pulled the same number in opposite directions.
//
// The database now answers the count separately — public.seat_holds() returns
// one row per held seat carrying the table and the status and nothing else.
// This module turns those into signup-shaped objects so that every existing
// calculation keeps working on the shapes it already knows, and the seat rules
// stay in seatRequest.js where they are written rather than being copied into
// SQL where the copy would drift.

/**
 * A seat with nobody in it.
 *
 * Every identifying field is present and empty rather than absent, so a screen
 * that renders one gets a blank rather than `undefined` in the middle of a
 * sentence. `userId` is null on purpose: it is what "this is not a person you
 * can look up" looks like, and anything keyed on it will skip these.
 *
 * The id is synthetic and not derived from the row, because there is nothing
 * in the row to derive it from — which is the point.
 */
export const anonymousHold = (tableId, status, i) => ({
  id: `held-${tableId}-${i}`,
  tableId,
  status,
  name: '',
  nationality: null,
  gender: null,
  languages: [],
  diets: [],
  note: '',
  avatarUrl: '',
  userId: null,
  anonymous: true,
});

/**
 * The signups a person may read, plus a placeholder for every seat held at a
 * table they are not part of.
 *
 * The merge is per table, and that is what makes it exact. `signups_read`
 * gives you all of a table's rows or none of them — your own seat, a table you
 * host, a table you are sitting at — so "we read nothing here" and "there is
 * nothing here" are the only two cases. Merging globally instead would
 * double-count every table the reader can already see into.
 *
 * @param {Array} mine    rows RLS allowed through, already mapped
 * @param {Array} holds   `{ table_id, status }` from public.seat_holds()
 */
export function mergeSeatHolds(mine = [], holds = []) {
  if (!Array.isArray(holds) || holds.length === 0) return mine;
  const readable = new Set(mine.map(s => s?.tableId));
  const filled = [];
  let i = 0;
  for (const h of holds) {
    const tableId = h?.table_id ?? h?.tableId;
    if (!tableId || readable.has(tableId)) continue;
    filled.push(anonymousHold(tableId, h.status ?? 'accepted', i));
    i += 1;
  }
  return filled.length > 0 ? mine.concat(filled) : mine;
}
