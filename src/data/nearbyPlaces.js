// The registry layer, fetched when somebody opens the map and not before.
//
// 7,450 places in central Seoul whose kitchen tells the registry it offers a
// menu in a foreign language — 서울관광재단's food-tourism database, built
// into public/data/nearby-seoul.json by scripts/build-nearby-layer.mjs.
//
// Why a fetch and not an import: bundling it would put 1.2MB into the
// download every visitor makes, to answer a question most of them never
// ask. Fetched, it costs 179KB over the wire (brotli) the first time the map
// is opened, and nothing after that — the service worker's runtime cache
// keeps it, so the second open works with the phone in aeroplane mode.
//
// Why these are not `restaurants`: every place in src/data/restaurants.js
// has a story somebody wrote and an address somebody checked, and carries a
// provenance record saying who checked it and when. These have none of that.
// They are a different *kind* of thing on the same map, and the code keeps
// them in a different shape so that they cannot quietly be treated alike.

/** One in-flight or finished load. The file never changes between builds. */
let pending = null;

/**
 * The layer, or null if it cannot be had.
 *
 * A failure is not an error anybody needs to see: the map still has the
 * twenty places that matter, and a missing second layer is a quieter map
 * rather than a broken screen.
 */
export function loadNearbyPlaces() {
  if (!pending) {
    pending = fetch('/data/nearby-seoul.json')
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return pending;
}

/**
 * The places inside a bounding box, capped.
 *
 * Leaflet draws every marker it is given, and seven thousand of them locks
 * the main thread on a phone. Two rules keep it honest: nothing below the
 * zoom where individual restaurants are a sensible thing to look at, and
 * never more than `limit` at once — past that the map is a smear of pins
 * rather than information, and thinning it changes nothing a person could
 * have read anyway.
 */
export const MIN_ZOOM = 15;

export function placesInView(layer, bounds, zoom, limit = 160) {
  if (!layer?.rows || !bounds || zoom < MIN_ZOOM) return [];
  const { north, south, east, west } = bounds;
  const out = [];
  for (const p of layer.rows) {
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
