// The register, filtered to the dishes this app exists for.
//
// 서울관광재단's food-tourism database (data.go.kr 15097605) holds 167,659
// restaurants. 8,118 of them serve one of the twenty-four dishes a person
// would rather not eat alone — see src/domain/catalog/dishGroups.js — and those are
// the ones built into public/data/seoul/ by scripts/build-seoul-places.mjs:
// one file per 구, plus a small index naming each district's box and count.
//
// ── Why the whole city now loads at once ─────────────────────────────────
//
// Unfiltered this was 24.4MB, 3.4MB compressed, which is why it used to
// arrive four districts at a time. Filtered it is 1.1MB, 0.25MB compressed —
// smaller than one photograph — so the map fetches all of Seoul and draws it.
// The district split survives because it is how the files are organised and
// how the service worker caches them, not because anybody is being rationed.
//
// Rows the register gave no usable coordinates for (24 of them) are kept —
// they cannot be drawn or sorted by distance, but they serve the dish, and
// hiding a restaurant for a reason unrelated to its food is not a filter
// anybody asked for.
//
// ── Why these are not `restaurants` ──────────────────────────────────────
//
// Every place in src/data/restaurants.js has a story somebody wrote and an
// address somebody checked against two map services on a named date. These
// have neither, and src/data/seoulRegistry.js is where that difference is
// made structural rather than remembered.

/**
 * How many register places the map holds, across all 25 districts.
 *
 * Written here rather than counted at render time because the screen that
 * needs it — the Places header, saying what the eighteen curated places are
 * eighteen *of* — draws before any district has been fetched, and a heading
 * that starts at 0 and jumps to 8,118 is worse than one that is simply
 * right. It is the sum of `count` over public/data/seoul/index.json, and
 * registryTotal.test.mjs fails if the two ever drift, so this is a cache of
 * the data rather than a second claim about it.
 */
export const REGISTRY_TOTAL = 8118;

/** The index: districts, their boxes, their counts. Tiny, fetched once. */
let indexPromise = null;

/** slug -> Promise of that district's rows. One fetch per district, ever. */
const districts = new Map();

/** Everything loaded so far, flat. Rebuilt when a district arrives. */
let merged = [];
let mergedFrom = new Set();

export function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch('/data/seoul/index.json')
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return indexPromise;
}

function loadDistrict(slug) {
  if (!districts.has(slug)) {
    districts.set(slug, fetch(`/data/seoul/${slug}.json`)
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null));
  }
  return districts.get(slug);
}

/** Kilometres between two points, good enough for choosing which file to fetch. */
const roughKm = (aLat, aLng, bLat, bLng) => {
  const dy = (aLat - bLat) * 111;
  const dx = (aLng - bLng) * 88;   // cos(37.5°) × 111
  return Math.hypot(dx, dy);
};

/** The point of a district's box nearest to a given position. */
const boxDistanceKm = (box, lat, lng) => {
  if (!box) return Infinity;
  const y = Math.min(Math.max(lat, box.s), box.n);
  const x = Math.min(Math.max(lng, box.w), box.e);
  return roughKm(lat, lng, y, x);
};

/**
 * The districts worth having for somebody looking at this point.
 *
 * Four is deliberate: it covers the district you are in and its neighbours,
 * which is as far as anybody walks to eat, and caps a pan across the city at
 * about 1MB compressed rather than 3.4.
 */
export const NEAR_DISTRICTS = 4;

/**
 * Load whatever covers this position, and return everything loaded so far.
 *
 * Cumulative on purpose — panning from Jongno to Mapo should not throw away
 * Jongno, because the list is sorted by distance and a place just behind you
 * is still one of the nearest.
 */
export async function loadNearbyPlaces(center = null) {
  const index = await loadIndex();
  if (!index?.districts?.length) return { rows: merged, builtAt: null, source: null };

  const wanted = center
    ? index.districts
      .map(d => ({ d, km: boxDistanceKm(d.box, center[0], center[1]) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, NEAR_DISTRICTS)
      .map(x => x.d.slug)
    // With no position to work from, the districts a visitor is most likely
    // to be standing in. Not the biggest ones — the central ones.
    : ['Jongno', 'Jung-gu', 'Yongsan', 'Mapo'];

  const loaded = await Promise.all(wanted.map(loadDistrict));

  let changed = false;
  for (let i = 0; i < wanted.length; i += 1) {
    if (loaded[i]?.rows && !mergedFrom.has(wanted[i])) {
      mergedFrom.add(wanted[i]);
      merged = merged.concat(loaded[i].rows);
      changed = true;
    }
  }
  if (changed) merged = merged.slice();

  return { rows: merged, builtAt: index.builtAt, source: index.source, index };
}

/** All of Seoul: twenty-five files, a quarter of a megabyte compressed. */
export async function loadAllPlaces() {
  const index = await loadIndex();
  if (!index?.districts) return { rows: [], builtAt: null };
  const all = await Promise.all(index.districts.map(d => loadDistrict(d.slug)));
  for (let i = 0; i < index.districts.length; i += 1) {
    const slug = index.districts[i].slug;
    if (all[i]?.rows && !mergedFrom.has(slug)) {
      mergedFrom.add(slug);
      merged = merged.concat(all[i].rows);
    }
  }
  merged = merged.slice();
  return { rows: merged, builtAt: index.builtAt, source: index.source, index };
}

/**
 * The zoom the map opens at, so the dots are there on arrival.
 *
 * This was 15 — four zoom levels in from the opening view — because the layer
 * then held every restaurant in Seoul and a city-wide box meant handing
 * Leaflet a hundred thousand markers. With the filter applied it is 8,118 in
 * the whole city, and somebody who opens the map should see that it has
 * something on it.
 */
export const MIN_ZOOM = 12;

/**
 * What to draw for this viewport.
 *
 * Leaflet draws every marker it is handed and keeps a DOM node per marker, so
 * a viewport is capped. Over the cap the survivors are taken at an even
 * stride through the list rather than as the first N: the rows are ordered by
 * district and then by id, so "the first 160" at city zoom is 160 dots in
 * 강남구 and an empty map everywhere else — which reads as a claim about
 * where the food is, and it is not one this data supports.
 */
export const VIEW_LIMIT = 160;

export function placesInView(layer, bounds, zoom, limit = VIEW_LIMIT) {
  if (!layer?.rows || !bounds || zoom < MIN_ZOOM) return [];
  const { north, south, east, west } = bounds;
  const inside = [];
  for (const p of layer.rows) {
    // A row with no coordinates is a real restaurant that cannot be drawn.
    if (p.y === undefined || p.x === undefined) continue;
    if (p.y < south || p.y > north || p.x < west || p.x > east) continue;
    inside.push(p);
  }
  if (inside.length <= limit) return inside;
  const stride = inside.length / limit;
  const out = [];
  for (let i = 0; i < limit; i += 1) out.push(inside[Math.floor(i * stride)]);
  return out;
}

/**
 * The shape the map helpers expect: `coordsOf` reads `.coordinates`, and the
 * Naver and Kakao link builders read `.name`.
 */
export const asPlace = (p) => ({
  id: `seoul-${p.i}`,
  name: p.n,
  coordinates: { lat: p.y, lng: p.x },
});
