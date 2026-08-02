// TablePolicy — who may join a table, and how many seats are actually left.
//
// Seat arithmetic looks trivial and is the one thing that must not be wrong:
// a traveller who books a seat that does not exist arrives at a restaurant to
// find no room, which is a worse failure than any screen bug. The host always
// occupies one of the seats they opened, so a four-seat table has three to
// give away — off-by-one here is somebody standing on a pavement in Jongno.

export const JOIN_BLOCK = {
  FULL: 'full',
  OWN_TABLE: 'own-table',
  ALREADY_IN: 'already-in',
  PAST: 'past',
};

/** Seats a host still has to give, never below zero. */
export function seatsRemaining(table, signups = []) {
  if (!table) return 0;
  const taken = 1 + signups.length; // the host is at their own table
  return Math.max(0, table.seats - taken);
}

/** Has the meal already happened? */
export function isPast(table, now = new Date()) {
  if (!table?.date) return false;
  // Local time on purpose — a meal at 19:00 in Seoul is 19:00 to everyone
  // sitting at it, and the app is used in the country the meal happens in.
  const at = new Date(`${table.date}T${table.time || '00:00'}`);
  return Number.isFinite(at.getTime()) && at.getTime() < now.getTime();
}

/**
 * Why this person cannot join, or null if they can.
 *
 * Returns the reason rather than a boolean so the button can say what is
 * wrong instead of being mysteriously disabled.
 */
export function joinBlocker(table, signups, userId, now = new Date()) {
  if (!table) return JOIN_BLOCK.FULL;
  if (isPast(table, now)) return JOIN_BLOCK.PAST;
  if (userId && table.hostId === userId) return JOIN_BLOCK.OWN_TABLE;
  if (userId && signups.some(s => s.userId === userId)) return JOIN_BLOCK.ALREADY_IN;
  if (seatsRemaining(table, signups) <= 0) return JOIN_BLOCK.FULL;
  return null;
}

export const canJoin = (table, signups, userId, now) =>
  joinBlocker(table, signups, userId, now) === null;

/** One line of English for each blocker, for the button and the card. */
export const BLOCKER_TEXT = {
  [JOIN_BLOCK.FULL]: 'This table is full',
  [JOIN_BLOCK.OWN_TABLE]: 'This is your table',
  [JOIN_BLOCK.ALREADY_IN]: 'You are already at this table',
  [JOIN_BLOCK.PAST]: 'This meal has already happened',
};

/**
 * A table needs at least the dish's minimum to be worth sitting down to.
 * Used when opening one, so a host cannot advertise a two-person dish alone.
 */
export function validateNewTable({ menuId, date, time, place, seats }, menu) {
  const problems = [];
  if (!menuId) problems.push('Choose what you want to eat.');
  if (!date) problems.push('Pick a date.');
  if (!time) problems.push('Pick a time.');
  if (!place || !place.trim()) problems.push('Say where you will meet.');

  const n = Number(seats);
  if (!Number.isInteger(n) || n < 2) {
    problems.push('A table needs at least 2 seats — that is the whole point.');
  } else if (menu && n < menu.minPeople) {
    problems.push(`${menu.name} needs ${menu.minPeople} people or more.`);
  } else if (n > 8) {
    problems.push('Keep it to 8 or fewer so everyone can talk.');
  }

  if (date && time) {
    const at = new Date(`${date}T${time}`);
    if (Number.isFinite(at.getTime()) && at.getTime() < Date.now()) {
      problems.push('That time has already passed.');
    }
  }
  return problems;
}
