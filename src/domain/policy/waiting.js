import { isWaiting, pendingSignups, lapseAt } from './seatRequest.js';
import { isCancelled } from './cancellation.js';
import { isPast } from './table.js';

// Requests a host has not answered yet.
//
// ── Why this exists ─────────────────────────────────────────────────────
//
// A guest who asks for a seat is shown this, on the table page:
//
//   "The host has until 12 hours before the meal to answer. If they do not,
//    this lapses and the seat goes back — you will not be left guessing on
//    the night."
//
// The first sentence was true and the promise around it was not. There are
// no push notifications and no in-app inbox, so a host learned that somebody
// had asked only by opening that particular table's page on their own
// initiative. Found on 2026-09-01 by playing the flow through for real: a
// request came in, the host had no way to know, and the twelve hours would
// simply have run out.
//
// safetyPromise.js has a rule that the app may only describe what it
// actually does. That rule is not about one file — it is about not making a
// promise the code cannot keep, and this was one, live, during the pilot.
//
// Nothing here needs infrastructure. The Tables screen already reads every
// table and every signup it is allowed to see, and a host may read the
// signups at their own tables, so the answer is in memory already. It was
// simply never asked for.
//
// ── What counts ─────────────────────────────────────────────────────────
//
// Only tables you host, that are still going to happen, and only requests
// still worth answering. A lapsed request is not waiting for you — the seat
// is already back — and telling a host to answer something that no longer
// needs answering is the same kind of false urgency as not telling them at
// all.

/**
 * Every table of yours with somebody still waiting on an answer.
 *
 * Sorted by how soon the answer is needed, because that is the order a host
 * should work through them in and the only ordering that survives having
 * more than two.
 *
 * @returns {{ table: object, waiting: object[], deadline: Date|null }[]}
 */
export function waitingForYou(tables = [], signups = [], userId = null, now = new Date()) {
  if (!userId) return [];
  const byTable = new Map();
  for (const s of signups) {
    if (!byTable.has(s?.tableId)) byTable.set(s?.tableId, []);
    byTable.get(s?.tableId).push(s);
  }

  return (tables ?? [])
    .filter(t => t?.hostId === userId && !isCancelled(t) && !isPast(t, now))
    .map(table => ({
      table,
      // `anonymous` drops the placeholder seats seat_holds() stands in with
      // for rows a reader may not see (src/domain/policy/seatHolds.js). They
      // carry a status and no person, so without this they would arrive here
      // looking exactly like somebody to answer. A host can read their own
      // table's rows, so a placeholder should never reach this list at all —
      // which is the reason to filter rather than to rely on it.
      waiting: pendingSignups((byTable.get(table.id) ?? []).filter(s => !s?.anonymous))
        .filter(s => isWaiting(s, table, now)),
      deadline: lapseAt(table),
    }))
    .filter(row => row.waiting.length > 0)
    .sort((a, b) => (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity));
}

/** How many people are waiting on you, across every table. */
export const waitingCount = (tables, signups, userId, now = new Date()) =>
  waitingForYou(tables, signups, userId, now).reduce((n, row) => n + row.waiting.length, 0);
