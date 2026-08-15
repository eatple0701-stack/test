// The register, fetched a district at a time.
//
// 167,659 restaurants from 서울관광재단's food-tourism database (data.go.kr
// 15097605), built into public/data/seoul/ by scripts/build-seoul-places.mjs
// — one file per 구, plus a small index naming each district's bounding box
// and count.
//
// ── Why split, and why not one file ──────────────────────────────────────
//
// All of it is 24.4MB, 3.4MB compressed. That is a download nobody on mobile
// data should be asked for to look at one street, and one the service worker
// would then hold on the device forever. By district the largest single file
// is 강남구 at 332KB compressed, and a person looking at Insadong fetches
// 종로구 and nothing else.
//
// Nothing is filtered out. Every row is reachable; the app just does not
// download districts nobody looked at. Rows the register gave no usable
// coordinates for (2,925 of them) are kept too — they cannot be drawn or
// sorted by distance, but they are real restaurants, and dropping them would
// make this a partial import claiming to be a complete one.
//
// ── Why these are not `restaurants` ──────────────────────────────────────
//
// Every place in src/data/restaurants.js has a story somebody wrote and an
// address somebody checked against two map services on a named date. These
// have neither, and src/data/seoulRegistry.js is where that difference is
// made structural rather than remembered.

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

/** Every district file, for the rare caller that genuinely wants all of Seoul. */
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
 * Nothing below the zoom where individual restaurants are worth looking at.
 *
 * Leaflet draws every marker it is handed, and a district holds sixteen
 * thousand of them.
 */
export const MIN_ZOOM = 15;

export function placesInView(layer, bounds, zoom, limit = 160) {
  if (!layer?.rows || !bounds || zoom < MIN_ZOOM) return [];
  const { north, south, east, west } = bounds;
  const out = [];
  for (const p of layer.rows) {
    // A row with no coordinates is a real restaurant that cannot be drawn.
    if (p.y === undefined || p.x === undefined) continue;
    if (p.y < south || p.y > north || p.x < west || p.x > east) continue;
    out.push(p);
    if (out.length >= limit) break;
  }
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
