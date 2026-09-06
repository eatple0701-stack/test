// What "searching for a place" means, in one place.
//
// Written 2026-09-04 after the second time two surfaces answered one query
// with different numbers. The map's dot layer took no query at all, so typing
// a restaurant name narrowed a list that could be folded away and left eight
// thousand dots untouched; fixing that by hand put the address into the map's
// rule and not the list's, and "종로" came back 160 on the map beside 22 in
// the list — every address in 종로구 contains it.
//
// The two callers cannot share a record: the map draws compact register rows
// (`n`, `a`) straight out of the district files, and the list works on mapped
// place objects whose address is wrapped in a provenance record. They can
// share a rule, which is this. If the fields ever diverge again, they diverge
// here, once, where a test is looking.

/** The address as a string, whether it arrived wrapped or bare. */
export const addressText = (place) => {
  const a = place?.address;
  if (typeof a === 'string') return a;
  // Curated places use fact(), register places use reported(); both put the
  // string on `.value` and the rest of the object is provenance.
  return typeof a?.value === 'string' ? a.value : '';
};

/**
 * Does this place answer to what somebody typed?
 *
 * Name and address, and deliberately nothing else. The address is what
 * carries the neighbourhood — 홍대, 이태원, 종로 are how people say where
 * they want to eat, and none of them is a field in the register. `zone` is
 * not read: it is derived English ("Jongno, Seoul") for register places, so
 * including it would answer a Korean query for some rows and not others.
 *
 * An empty query matches everything, because a search that has not started
 * must not filter a list.
 */
export function matchesPlaceQuery(place, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return true;
  if (String(place?.name ?? '').toLowerCase().includes(q)) return true;
  return addressText(place).toLowerCase().includes(q);
}

/**
 * The same question asked of a compact register row.
 *
 * `n` and `a` are the district files' own keys — see data/nearbyPlaces.js.
 * Kept beside the rule it shares rather than in the map layer, so the two
 * spellings of one idea sit next to each other.
 */
export const matchesRegistryRow = (row, query) =>
  matchesPlaceQuery({ name: row?.n, address: row?.a }, query);
