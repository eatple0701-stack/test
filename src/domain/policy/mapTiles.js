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

// ── OpenFreeMap: found, verified, and not switched on ───────────────────
//
// A research pass on 2026-08-31 turned up the one provider the list above
// missed, and it is genuinely free: no key, no account, no card, no request
// cap, commercial use allowed. Checked here rather than taken on trust:
//
//   https://tiles.openfreemap.org/styles/liberty   HTTP 200, 43KB, 111 layers
//
// Its 23 label layers all carry the same expression, and it is exactly the
// one wanted — no language parameter needed, because the style already
// stacks Latin above the local script:
//
//   ["case", ["has", "name:nonlatin"],
//     ["concat", ["get","name:latin"], "\n", ["get","name:nonlatin"]],
//     ["coalesce", ["get","name_en"], …]]
//
// Two things follow from reading that expression rather than the docs.
// `name_en` is only in the *else* branch, so branching on it silently gets
// the Hangul back — never key off it. And when `name:latin` is missing the
// concat still runs, so the label renders as an empty line above the
// Hangul; roughly a fifth to a quarter of central Seoul POIs have
// `name:latin`, which is an OpenStreetMap ceiling that no OSM-derived
// provider escapes. That last part matters less here than it would
// elsewhere, because this app draws restaurant labels from its own data —
// see displayName in data/seoulRegistry.js, and the 8,070 English names
// behind it.
//
// ── Why it is still null ─────────────────────────────────────────────────
//
// OpenFreeMap serves vector tiles, so it needs MapLibre GL and
// maplibre-gl-leaflet. Measured on this build:
//
//   app bundle today          493 KB gzipped
//   maplibre-gl adds        ~230 KB gzipped
//   after                   ~723 KB gzipped   (+47%)
//
// That is a 47% increase on a mobile-first PWA, plus a WebGL requirement
// where there is currently none, landing mid-pilot on testers' own phones,
// in exchange for Latin labels on the minority of base-map features that
// have them. It is a plausible trade and it is not one to make quietly, so
// the number is written down and the switch is left off.
//
// To turn it on: npm i maplibre-gl maplibre-gl-leaflet, replace the four
// TileLayers with the GL layer, and set INTL to the object below. Nothing
// else in the app needs to change, which is the whole reason this file
// exists.
export const OPEN_FREE_MAP = {
  id: 'openfreemap-liberty',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  // Required. OpenFreeMap asks for this string specifically.
  attribution: 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap',
  credit: '© OpenFreeMap',
  labelsInEnglish: true,
  vector: true,
};

// Jawg, if OpenFreeMap wobbles. It is donation-funded with no SLA, which is
// the one argument against it that money cannot answer. Jawg is raster, so
// it is a one-line URL swap with no new dependency — but it needs a key:
//   https://tile.jawg.io/jawg-streets/{z}/{x}/{y}.png?access-token=…&lang=en
// Unverified: nobody here has looked at a Jawg tile of Seoul.

/**
 * The English-labelled provider actually in use, or null. Null is not a gap
 * left by accident — see OPEN_FREE_MAP above for the one that is ready and
 * the number that is holding it. `tilesFor` falls back to OSM, so the map
 * keeps working exactly as it does today.
 */
export const INTL = null;

export const TILE_PROVIDERS = { OSM };
