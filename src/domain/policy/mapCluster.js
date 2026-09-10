/**
 * Turning eight thousand restaurants into something a person can look at.
 *
 * The 장소 map draws one dot per register row inside the viewport, capped at
 * 160. On a 375px phone at the zoom the tab opens on, that is 178 identical
 * 8px circles in seven colours over central Seoul — measured 2026-09-10 —
 * and it reads as a texture rather than as information. "지도같은 거는 보기가
 * 너무 힘들던데."
 *
 * ── The grid is geographic, not a viewport division ──────────────────────
 *
 * The obvious way to cluster is to divide the visible rectangle into an n×n
 * grid. Do that and every cluster moves when you pan, because the rectangle
 * moved — which is the bug that was fixed here on 2026-09-09, wearing a
 * different hat. See placesInView's note.
 *
 * So a cell is a fixed square of the world at a given zoom, and a row's cell
 * is `floor(lat / size)`, `floor(lng / size)`. Nothing about it depends on
 * where you are looking, so panning changes nothing at all: the same cluster,
 * in the same place, holding the same number.
 *
 * ── And the grid at z+1 refines the grid at z ────────────────────────────
 *
 * Cell size halves for every zoom step, exactly, which makes each cell split
 * into four. So zooming in can only ever break a cluster apart into pieces
 * that stay inside its footprint — dots separate, they never rearrange. That
 * is the property `zooming in splits a cluster and never reshuffles it`
 * pins, and it is the thing the reader actually notices.
 *
 * ── What is deliberately not here ───────────────────────────────────────
 *
 * No catalogue import, no Leaflet, no bounds. The caller passes rows and a
 * zoom and gets objects with a lat, a lng and a count; it passes `groupIdOf`
 * if it wants the clusters coloured. That is what makes the two properties
 * above testable without a map.
 */

/**
 * Roughly how far apart clusters should sit on screen, in CSS pixels.
 *
 * 76 first, which put 64 bubbles on a 375px phone — a wall of numbered discs
 * nearly touching each other, which is the confetti it replaced wearing a
 * different coat. 112 gives about 3 across and 5 down, so roughly 16, which
 * is the order of magnitude a person reads at a glance.
 */
export const CLUSTER_CELL_PX = 112;

/**
 * The latitude the grid is squared against.
 *
 * A Mercator degree of latitude covers 1/cos(φ) as much screen as a degree of
 * longitude, so square-on-screen cells need the two sizes to differ. Taking φ
 * from each row would make the cell size vary down the map and the cell key
 * ambiguous at the seams; this app draws one city, 0.25° of latitude tall,
 * across which cos(φ) moves by under half a per cent. A constant is both
 * simpler and, here, honest.
 */
export const SEOUL_LAT = 37.5665;

/** Leaflet's tile size, and the reason a zoom step is exactly a doubling. */
const TILE_PX = 256;

/**
 * The size of one cell at a zoom level, in degrees.
 *
 * Zoom is floored: Leaflet reports fractional zooms while a pinch is in
 * flight, and a grid that resized continuously would have every dot crawling
 * for the length of the gesture.
 */
export function cellSizeAt(zoom, options = {}) {
  const { cellPx = CLUSTER_CELL_PX, tileSize = TILE_PX, lat = SEOUL_LAT } = options;
  const z = Math.max(0, Math.floor(Number(zoom) || 0));
  const degLng = (cellPx * 360) / (tileSize * 2 ** z);
  const degLat = degLng * Math.cos((lat * Math.PI) / 180);
  return { degLat, degLng };
}

/**
 * The cell a row falls in, as a string.
 *
 * Exported because it *is* the clustering rule — which restaurants end up
 * together, and therefore whether zooming in splits a bubble or reshuffles
 * it. The first version of the test for that restated this arithmetic
 * instead of calling it, so mutating floor to round left it green: round
 * partitions space just as evenly, offset by half a cell, and the offset is
 * exactly what breaks the refinement.
 *
 * Returns null for a row with no coordinates, and a key of its own for every
 * row when the cell size is degenerate — see clusterRows.
 */
export function cellKeyOf(row, zoom, options = {}) {
  if (row?.y === undefined || row?.x === undefined || row?.y === null || row?.x === null) return null;
  const { degLat, degLng } = cellSizeAt(zoom, options);
  if (!(degLat > 0) || !(degLng > 0) || !Number.isFinite(degLat) || !Number.isFinite(degLng)) {
    return `row:${row.i}`;
  }
  // floor, not round. Halving the cell size splits each cell into four only
  // if the cell boundaries are at multiples of the size; round puts them at
  // half-multiples, and then a coarse boundary cuts through a fine cell.
  return `${Math.floor(row.y / degLat)}:${Math.floor(row.x / degLng)}`;
}

/**
 * Group rows into clusters for a zoom level.
 *
 * `rows` is every row that should be on the map — the whole city, already
 * filtered by whatever the chips have on, and *not* cut down to the viewport.
 * A count computed from what is on screen would change as you panned, and a
 * number that moves while you read it is worse than no number.
 *
 * A cluster of one carries its row, so the caller can draw it as the place it
 * is and open it on a tap. A cluster whose rows do not agree on a group
 * carries `groupId: null` — a bag of six kinds has no colour, and picking one
 * of them would be a claim about the other five.
 */
export function clusterRows(rows, zoom, options = {}) {
  const groupIdOf = options.groupIdOf ?? (() => null);
  const list = rows ?? [];

  const cells = new Map();
  for (const r of list) {
    // cellKeyOf returns null for a row that cannot be drawn, and — when the
    // cell size is zero or nonsense — a key of its own for every row. One
    // cluster each is the truthful degenerate answer; a shared key would draw
    // eight thousand restaurants as one bubble in the Gulf of Guinea.
    const key = cellKeyOf(r, zoom, options);
    if (key === null) continue;
    let cell = cells.get(key);
    if (!cell) {
      cell = { key, count: 0, sumLat: 0, sumLng: 0, groupId: undefined, row: r };
      cells.set(key, cell);
    }
    cell.count += 1;
    cell.sumLat += r.y;
    cell.sumLng += r.x;
    const g = groupIdOf(r) ?? null;
    if (cell.groupId === undefined) cell.groupId = g;
    else if (cell.groupId !== g) cell.groupId = null;
  }

  const out = [];
  for (const c of cells.values()) {
    out.push({
      key: c.key,
      // The centroid, not the cell's middle: a cluster sitting on its
      // restaurants reads as those restaurants, and a cluster sitting on a
      // grid intersection reads as a grid.
      lat: c.sumLat / c.count,
      lng: c.sumLng / c.count,
      count: c.count,
      groupId: c.groupId ?? null,
      row: c.count === 1 ? c.row : null,
    });
  }
  return out;
}

/**
 * The clusters a viewport should draw.
 *
 * Padded by a cell, because a cluster's centroid can fall just outside the
 * rectangle while most of its restaurants are inside it — unpadded, the map
 * would drop a bubble at each edge and put it back on the next pan.
 */
export function clustersInView(clusters, bounds, zoom, options = {}) {
  if (!bounds) return [];
  const { degLat, degLng } = cellSizeAt(zoom, options);
  const north = bounds.north + degLat;
  const south = bounds.south - degLat;
  const east = bounds.east + degLng;
  const west = bounds.west - degLng;
  return (clusters ?? []).filter(
    c => c.lat >= south && c.lat <= north && c.lng >= west && c.lng <= east,
  );
}

/** How many zoom levels a tap on a bubble travels. */
export const ZOOM_STEP = 2;

/**
 * The zoom a tap on a bubble should land on.
 *
 * Two levels and not one. A cell halves per level, so one step splits a
 * bubble into four — and often enough all four land close together and the
 * reader is looking at what appears to be the same bubble in a slightly
 * different place, which reads as nothing having happened. Two steps split
 * it into sixteen, and something visibly opens up.
 *
 * Capped, because a map has a maximum zoom and asking for more than it has
 * is asking for the same view again.
 */
export function zoomIntoCluster(current, maxZoom = 19, step = ZOOM_STEP) {
  const now = Number(current);
  const cap = Number.isFinite(Number(maxZoom)) ? Number(maxZoom) : Infinity;
  const next = Math.min(now + step, cap);
  // Already as close as the map goes: nothing to do, and the caller should not
  // start an animation that ends where it began.
  //
  // This is also where a zoom that is not a number lands. NaN fails every
  // comparison, so it returns null here without a guard of its own — the first
  // draft had `if (!Number.isFinite(now)) return null` above, mutating it away
  // broke no test, and a branch that changes nothing is a branch that cannot
  // be tested.
  return next > now ? next : null;
}

/**
 * What to print inside a bubble.
 *
 * Four digits do not fit in a circle a thumb can hit, and the difference
 * between 1,204 and 1,207 is not one anybody is reading off a map.
 */
export const clusterLabel = (count) => {
  const n = Number(count) || 0;
  if (n >= 1000) return `${Math.floor(n / 1000)}k+`;
  return String(n);
};

/**
 * How big a bubble is, in pixels.
 *
 * Three steps rather than a continuous scale: a size that means "more" has to
 * be read at a glance against its neighbours, and a smooth function of the
 * count makes every bubble a slightly different size and none of them
 * comparable.
 */
export function clusterSize(count) {
  const n = Number(count) || 0;
  if (n >= 150) return 44;
  if (n >= 25) return 38;
  // 32 and not less. A bubble is a control — tapping it is how you get in —
  // and its own test caught this being cut to 30 on 2026-09-10, the same
  // afternoon eight controls elsewhere were grown to 44 for the same reason.
  return 32;
}
