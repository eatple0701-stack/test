// The menu a register place's page shows.
//
// Built by scripts/build-seoul-menus.mjs from the register's own 다국어메뉴
// download: for 8,075 of the 8,118 kept restaurants, every menu line in the
// four languages the register wrote it in — Korean, English, Japanese,
// Chinese. ~3MB compressed in total, split by district and fetched only when
// somebody opens a place in that district, which is why this is not part of
// the district files the map loads eagerly.
//
// An item is [ko, en, ja, zh], empty string where the register has no
// translation. The screen falls back rather than showing a blank.

import { DISTRICT_EN } from './seoulRegistry.js';

const DISTRICT = /서울특별시\s+(\S+구)/;

/** slug -> Promise of that district's menu file. One fetch each, ever. */
const cache = new Map();

function districtFile(slug) {
  if (!cache.has(slug)) {
    cache.set(slug, fetch(`/data/seoul/menus/${slug}.json`)
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null));
  }
  return cache.get(slug);
}

/**
 * The register's menu for this place, or null when it has none on file.
 *
 * Null is a real answer, not an error: 43 of the kept restaurants joined the
 * dish filter through a name the menu download spells ambiguously, and a
 * page with no menu section is more honest than one filled from the wrong
 * restaurant.
 */
export async function menusFor(place) {
  const gu = DISTRICT.exec(place?.address?.value ?? '')?.[1];
  const slug = gu ? DISTRICT_EN[gu] : null;
  const id = String(place?.id ?? '').startsWith('seoul-')
    ? String(place.id).slice('seoul-'.length)
    : null;
  if (!slug || !id) return null;
  const file = await districtFile(slug);
  return file?.m?.[id] ?? null;
}

/** The name to lead with for this reader, falling back toward Korean. */
export function menuName(item, locale) {
  const [ko, en, ja, zh] = item;
  if (locale === 'ko') return ko;
  if (locale === 'ja') return ja || en || ko;
  if (locale === 'zh') return zh || en || ko;
  return en || ko;
}
