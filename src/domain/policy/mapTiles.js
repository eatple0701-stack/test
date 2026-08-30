import { LOCALE } from './locale.js';

// Which base map the reader gets.
//
// ── The state of this today: one provider, Korean labels ─────────────────
//
// The map draws OpenStreetMap tiles, and OSM labels Seoul the way Seoul
// labels itself — 홍제천, 서울역, 용산구. An English reader gets our markers
// and our card in English on top of a base map they cannot read. A6 of
// docs/next-work-order.md asks for English tiles. This file is the place
// they would be switched in, and it holds one provider because on
// 2026-08-30 every keyless English-labelled candidate was opened and
// checked, and none of them survived:
//
//   CARTO Voyager      basemaps.cartocdn.com returns a tile with
//                      "API KEY REQUIRED" stamped diagonally across it, and
//                      the labels underneath it are Korean anyway.
//   Esri World_Street  arcgisonline.com returns a grey square reading
//                      "Map data not yet available" for Seoul at z14. Esri
//                      has no street-level data here.
//   Wikimedia osm-intl HTTP 403: "Map tiles are restricted to Wikimedia and
//                      affiliated sites only." This is the one whose labels
//                      would have been exactly right, and it is the one we
//                      are not allowed to use.
//   Mapbox, MapTiler,  all require an account and a key.
//   Thunderforest,
//   Stadia/Stamen
//
// So the honest position is: the base map stays Korean until the team
// decides to put a key on a team account, and the decision is a
// registration and a quota, not a code change. When that happens, fill in
// INTL below and every map in the app follows — which is the point of this
// file existing before the answer does. Four TileLayers were drawing the
// same hard-coded URL in four components; a provider swap used to be four
// edits and three chances to leave one behind, which is precisely how a map
// ends up half in English.
//
// Whoever fills INTL in: open one tile over Seoul and look at it before
// believing any documentation about label languages. That is how three of
// the five above were ruled out in about a minute each.

const OSM = {
  id: 'osm',
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  // The short form, for the preview map's own credit line, which has no room
  // for a link. OSM's licence requires the credit either way.
  credit: '© OpenStreetMap',
  // Whether this provider's labels are in the reader's language. False here,
  // and said out loud so a screen can decide to explain itself rather than
  // pretend. Nothing reads it yet; it exists so that filling INTL in is one
  // object and not an archaeology exercise.
  labelsInEnglish: false,
};

/**
 * The tiles for a reader in this language.
 *
 * `both` and `ko` would keep Korean labels deliberately even once a second
 * provider exists: `both` is the bilingual screen the team reviews and the
 * default, and a Korean reader wants the Korean names. The work order says
 * `locale !== 'ko'`; this is that, plus the default.
 */
export const tilesFor = (locale) => (
  locale === LOCALE.KO || locale === LOCALE.BOTH ? OSM : (INTL ?? OSM)
);

/**
 * The English-labelled provider, once there is one. Null is not a gap left
 * by accident — see the list above. `tilesFor` falls back to OSM, so the map
 * keeps working exactly as it does today until this is filled in.
 */
export const INTL = null;

export const TILE_PROVIDERS = { OSM };
