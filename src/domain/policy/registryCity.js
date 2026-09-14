// Which register a row came from, read off its own address.
//
// Two cities arrived on 2026-09-14 — 서울관광재단's 8,118 and 인천관광공사's
// 2,854 — and almost everything the app does with a register row needs to
// know which: the id it is given, the zone it is filed under, the source line
// under its address, and which folder its menu file is in.
//
// The row could have carried a city field. It does not, because it already
// carries the answer: every one of the 10,972 addresses begins with its own
// city's name (checked, both files, 2026-09-14). A field would be a second
// place for the same fact to live, and the one that could disagree.
//
// The ids overlap — 22482 is 태화원 in Incheon and a different restaurant in
// Seoul's register — so the prefix is what keeps two real restaurants from
// being the same place to this app.

/** The register cities, in the order screens offer them. */
export const REGISTRY_CITIES = ['seoul', 'incheon'];

/** The city's name as zones write it: 'Jongno, Seoul', 'Jung-gu, Incheon'. */
export const CITY_ZONE_NAME = { seoul: 'Seoul', incheon: 'Incheon' };

/**
 * The city an address is in, or null.
 *
 * Null rather than a guess: a row whose address names neither city is a row
 * this app cannot file, and filing it under the bigger register would put a
 * restaurant in the wrong city on a filter chip.
 */
export function cityOfAddress(address) {
  const a = String(address ?? '');
  if (a.startsWith('인천')) return 'incheon';
  if (a.startsWith('서울')) return 'seoul';
  return null;
}

/** `incheon-22482`. Null for a row with no address to read a city from. */
export function registryIdOf(row) {
  const city = cityOfAddress(row?.a);
  return city ? `${city}-${row.i}` : null;
}

/** Is this id one of the register's? */
export const isRegistryId = (id) =>
  REGISTRY_CITIES.some(city => String(id ?? '').startsWith(`${city}-`));

/** The city in a register id, or null for an id from anywhere else. */
export function cityOfId(id) {
  const s = String(id ?? '');
  return REGISTRY_CITIES.find(city => s.startsWith(`${city}-`)) ?? null;
}

/** The number the register knows this place by, without the city in front. */
export function registryNumberOf(id) {
  const city = cityOfId(id);
  return city ? String(id).slice(city.length + 1) : null;
}
