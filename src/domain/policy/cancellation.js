// CancellationPolicy — a table that was called off is not a table that never
// existed.
//
// Calling a table off deleted the row and every signup on it. On the host's
// screen that reads as tidy. On a guest's it is the meal disappearing from
// their Passport with no trace and no sentence: "Coming up" simply has one
// fewer line than it did yesterday.
//
// There are no notifications and no chat — HostBrief says so to every host
// before they open anything — so the only way a guest learns is by opening
// the app. Which means the app has to have something to say when they do.
// A row that is gone cannot say anything, and the traveller's next move is
// standing at a station exit at 19:00 for a meal nobody is coming to.
//
// So cancelling is a state now. The row stays, the seats stay attached to it,
// and every screen that lists tables to *find* filters it out while every
// screen that lists tables you are *in* keeps it and says what happened.
//
// The signups stay too. A cancelled table with its guest list intact is what
// lets the host see who they need to tell — and the app cannot tell them.

/** Called off, and when. Null on every table that is still happening. */
export const cancelledAt = (table) => {
  const at = table?.cancelledAt;
  if (!at) return null;
  const ms = typeof at === 'number' ? at : new Date(at).getTime();
  return Number.isFinite(ms) ? ms : null;
};

export const isCancelled = (table) => cancelledAt(table) !== null;

/**
 * Tables that can still be discovered.
 *
 * Used by Tables, Explore and 찾는 밥상 — anywhere somebody is looking for a
 * meal to join. A cancelled table must never appear in a search result; it is
 * only ever reachable by the people already attached to it.
 */
export const bookable = (tables = []) => tables.filter(t => !isCancelled(t));

/**
 * Can this table still be joined, answered, or recorded against?
 *
 * One question with one answer, so a cancelled table cannot quietly stay
 * interactive on a screen that forgot to check. Requesting a seat at a meal
 * that is not happening, or a host accepting into one, are both nonsense.
 */
export const isActionable = (table) => Boolean(table) && !isCancelled(table);

/**
 * What a guest is told, on a table they had a seat at.
 *
 * Deliberately never softened into an apology from the app. The app did not
 * cancel anything; a person did, and the guest's actual problem is the empty
 * evening, so the sentence is about the evening rather than about the app's
 * feelings.
 */
export function cancellationNotice(table, { isHost } = {}) {
  if (!isCancelled(table)) return null;
  if (isHost) {
    return {
      title: 'You called this table off',
      body: 'It no longer shows up for anybody looking for a meal. The people who had seats can still see it, and still see that it was cancelled — the app has no way to tell them, so anybody you can reach another way is worth reaching.',
    };
  }
  return {
    title: 'This table was called off',
    body: 'The host cancelled it, so there is no meal here. Nothing you need to do — but do not go to the meeting point. There are other tables, and the dish is still worth eating.',
  };
}
