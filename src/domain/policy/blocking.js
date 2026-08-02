// BlockingPolicy — what a traveller's own block list hides from their own
// screens.
//
// Only one direction lives here. The other half of blocking — a blocked
// person losing the ability to take a seat at the blocker's tables — is
// enforced by signups_insert_own in supabase/schema.sql, because that half
// has to survive a blocked person's own browser choosing not to run it.
// This half is the opposite: it only ever changes what the person who did
// the blocking sees, so there is nothing here a client-side filter can get
// wrong in a way that matters to anyone but that one traveller.

/** Is this person on my own block list? */
export const isBlockedId = (userId, blockedIds = []) => blockedIds.includes(userId);

/**
 * Tables hosted by somebody I've blocked, filtered out.
 *
 * Not retroactive and not aware of signups — a table I already joined before
 * blocking its host stays reachable through "Coming up" on the Passport
 * (src/components/JournalPanel.jsx), because losing track of a meal you are
 * still going to is a worse surprise than seeing the host's name once more.
 * This only ever governs discovery surfaces: Tables, 찾는 밥상, Explore.
 */
export function visibleTables(tables = [], blockedIds = []) {
  if (blockedIds.length === 0) return tables;
  return tables.filter(t => !isBlockedId(t.hostId, blockedIds));
}
