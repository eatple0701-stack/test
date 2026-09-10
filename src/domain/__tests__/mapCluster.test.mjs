import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cellSizeAt, cellKeyOf, clusterRows, clustersInView, clusterLabel, clusterSize,
  zoomIntoCluster, ZOOM_STEP,
  CLUSTER_CELL_PX, SEOUL_LAT,
} from '../policy/mapCluster.js';

// A real slice of Seoul's shape rather than a tidy lattice: dense downtown,
// a couple of outliers, and two rows on the same corner. 40 rows, spread
// across about 0.09° of latitude and 0.13° of longitude — roughly what the
// register looks like between 종로 and 강남.
function seoulish(n = 400) {
  const rows = [];
  let seed = 20260910;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < n; i += 1) {
    // Two-thirds clustered around the middle, one-third scattered wide.
    const tight = i % 3 !== 0;
    const y = 37.50 + (tight ? 0.045 + rnd() * 0.02 : rnd() * 0.11);
    const x = 126.94 + (tight ? 0.03 + rnd() * 0.03 : rnd() * 0.16);
    rows.push({ i, y, x, d: `dish${i % 6}` });
  }
  return rows;
}

const ROWS = seoulish();

test('a zoom step halves the cell, in both directions', () => {
  const a = cellSizeAt(12);
  const b = cellSizeAt(13);
  assert.ok(Math.abs(b.degLng - a.degLng / 2) < 1e-12, `${b.degLng} vs ${a.degLng / 2}`);
  assert.ok(Math.abs(b.degLat - a.degLat / 2) < 1e-12);
  // Latitude cells are shorter than longitude ones, by cos(φ) — that is what
  // makes the cell square on a Mercator screen rather than square in degrees.
  assert.ok(a.degLat < a.degLng);
  assert.ok(Math.abs(a.degLat / a.degLng - Math.cos((SEOUL_LAT * Math.PI) / 180)) < 1e-12);
});

test('a fractional zoom uses the same grid as the zoom below it', () => {
  // Leaflet reports fractional zooms mid-pinch. If the grid resized with them
  // every dot would crawl for the length of the gesture.
  assert.deepEqual(cellSizeAt(13.4), cellSizeAt(13));
  assert.deepEqual(cellSizeAt(13.99), cellSizeAt(13));
  assert.notDeepEqual(cellSizeAt(14), cellSizeAt(13));
});

test('a cell is about CLUSTER_CELL_PX across on screen', () => {
  // px per degree of longitude at zoom z is 256·2^z/360.
  const z = 13;
  const pxPerDeg = (256 * 2 ** z) / 360;
  const { degLng } = cellSizeAt(z);
  assert.ok(Math.abs(degLng * pxPerDeg - CLUSTER_CELL_PX) < 1e-9);
});

test('every restaurant is in exactly one cluster, at every zoom', () => {
  for (const z of [11, 12, 13, 14, 15, 16, 17]) {
    const clusters = clusterRows(ROWS, z);
    const total = clusters.reduce((a, c) => a + c.count, 0);
    assert.equal(total, ROWS.length, `zoom ${z} lost or duplicated rows`);
  }
});

test('zooming in splits a cluster and never reshuffles it', () => {
  // The property the reader actually notices, and the one the even-stride
  // thinning this replaces got wrong: a dot you were looking at is still
  // there, in the same place, after the zoom. It holds because the cell size
  // halves exactly, so each cell divides into four and nothing can cross.
  // cellKeyOf, not the same arithmetic written out again. The first version
  // of this test restated it, so it never touched the implementation at all:
  // mutating floor to round in clusterRows left this green.
  const membership = (z) => new Map(ROWS.map(r => [r.i, cellKeyOf(r, z)]));

  for (const z of [11, 12, 13, 14, 15, 16]) {
    const coarse = membership(z);
    const fine = membership(z + 1);
    // Two rows that share a fine cell must share the coarse one too. The
    // reverse is allowed — that is what "splits" means.
    const coarseOfFine = new Map();
    for (const r of ROWS) {
      const f = fine.get(r.i);
      const c = coarse.get(r.i);
      if (coarseOfFine.has(f)) {
        assert.equal(coarseOfFine.get(f), c, `zoom ${z}→${z + 1}: cell ${f} straddles two clusters`);
      } else {
        coarseOfFine.set(f, c);
      }
    }
    // And it really does split: more clusters after the step, or this test
    // would pass on a grid that never changed at all.
    assert.ok(
      new Set(fine.values()).size > new Set(coarse.values()).size,
      `zoom ${z}→${z + 1} produced no more clusters than before`,
    );
  }
});

test('panning changes nothing about a cluster', () => {
  // The 2026-09-09 report, in its other form: an even stride through what is
  // currently in view is a different set every time the view moves. Here the
  // clusters are computed from the rows and the zoom alone, so two viewports
  // that both contain a cluster have to agree about it exactly.
  const clusters = clusterRows(ROWS, 13);
  const west = { north: 37.62, south: 37.49, east: 127.02, west: 126.92 };
  const east = { north: 37.62, south: 37.49, east: 127.11, west: 127.00 };
  const inWest = new Map(clustersInView(clusters, west, 13).map(c => [c.key, c]));
  const inEast = new Map(clustersInView(clusters, east, 13).map(c => [c.key, c]));

  const shared = [...inWest.keys()].filter(k => inEast.has(k));
  assert.ok(shared.length > 0, 'the two viewports overlap, so they must share clusters');
  for (const k of shared) {
    assert.equal(inWest.get(k).count, inEast.get(k).count, `${k} counted differently`);
    assert.equal(inWest.get(k).lat, inEast.get(k).lat);
    assert.equal(inWest.get(k).lng, inEast.get(k).lng);
  }
});

test('a viewport draws far fewer bubbles than the map drew dots', () => {
  // The whole point. 400 rows is a stand-in for 8,118; what matters is the
  // order of magnitude between rows in view and bubbles in view.
  const bounds = { north: 37.60, south: 37.51, east: 127.06, west: 126.95 };
  const rowsInView = ROWS.filter(
    r => r.y >= bounds.south && r.y <= bounds.north && r.x >= bounds.west && r.x <= bounds.east,
  );
  const shown = clustersInView(clusterRows(ROWS, 12), bounds, 12);
  assert.ok(rowsInView.length > 100, `fixture too thin: ${rowsInView.length}`);
  assert.ok(shown.length * 4 < rowsInView.length, `${shown.length} bubbles for ${rowsInView.length} rows`);
});

test('the edge of the viewport keeps its bubble', () => {
  // A centroid can sit just outside the rectangle while its restaurants are
  // inside it. Unpadded, the map drops a bubble at each edge and puts it back
  // on the next pan.
  const clusters = [{ key: 'a', lat: 37.60, lng: 127.00, count: 9, groupId: null, row: null }];
  const bounds = { north: 37.5995, south: 37.50, east: 127.05, west: 126.95 };
  assert.equal(clustersInView(clusters, bounds, 13).length, 1);
  // Padding is one cell, not a free pass: a cluster a long way out stays out.
  const far = [{ key: 'b', lat: 37.80, lng: 127.00, count: 9, groupId: null, row: null }];
  assert.equal(clustersInView(far, bounds, 13).length, 0);
  assert.equal(clustersInView(clusters, null, 13).length, 0);
});

test('a cluster of one is the restaurant itself', () => {
  const lonely = [{ i: 1, y: 37.50, x: 126.90 }, { i: 2, y: 37.58, x: 127.05 }];
  const clusters = clusterRows(lonely, 16);
  assert.equal(clusters.length, 2);
  for (const c of clusters) {
    assert.equal(c.count, 1);
    assert.ok(c.row, 'a single-row cluster has to carry its row, or it cannot be opened');
    assert.equal(c.lat, c.row.y);
    assert.equal(c.lng, c.row.x);
  }
  // And a real cluster does not pretend to be one restaurant.
  const together = clusterRows([{ i: 1, y: 37.5, x: 126.9 }, { i: 2, y: 37.5001, x: 126.9001 }], 12);
  assert.equal(together.length, 1);
  assert.equal(together[0].count, 2);
  assert.equal(together[0].row, null);
});

test('a cluster takes a colour only when its restaurants agree on one', () => {
  const rows = [
    { i: 1, y: 37.5, x: 126.9, g: 'bbq' },
    { i: 2, y: 37.5001, x: 126.9001, g: 'bbq' },
    { i: 3, y: 37.5002, x: 126.9002, g: 'stew' },
  ];
  const groupIdOf = (r) => r.g;
  const mixed = clusterRows(rows, 12, { groupIdOf });
  assert.equal(mixed.length, 1);
  assert.equal(mixed[0].groupId, null, 'a bag of two kinds has no colour');

  const uniform = clusterRows(rows.slice(0, 2), 12, { groupIdOf });
  assert.equal(uniform[0].groupId, 'bbq');

  // With no groupIdOf at all, nothing is coloured and nothing throws.
  assert.equal(clusterRows(rows, 12)[0].groupId, null);
});

test('a row without coordinates is not drawn, and does not break the ones that are', () => {
  const rows = [
    { i: 1, y: 37.5, x: 126.9 },
    { i: 2, y: undefined, x: 126.9 },
    { i: 3, y: 37.5, x: null },
    { i: 4 },
  ];
  const clusters = clusterRows(rows, 16);
  assert.equal(clusters.reduce((a, c) => a + c.count, 0), 1);
  assert.deepEqual(clusterRows(null, 12), []);
  assert.deepEqual(clusterRows([], 12), []);
});

test('a nonsense cell size gives one cluster each, not one cluster total', () => {
  // Every row lands in cell 0:0 if the size is zero, which would draw eight
  // thousand restaurants as a single bubble off the coast of Africa.
  const rows = [{ i: 1, y: 37.5, x: 126.9 }, { i: 2, y: 37.6, x: 127.0 }];
  const out = clusterRows(rows, 12, { cellPx: 0 });
  assert.equal(out.length, 2);
  assert.equal(out[0].count, 1);
  assert.ok(out.every(c => c.row));
});

test('a bubble prints a number a circle can hold', () => {
  assert.equal(clusterLabel(7), '7');
  assert.equal(clusterLabel(842), '842');
  assert.equal(clusterLabel(1000), '1k+');
  assert.equal(clusterLabel(8118), '8k+');
  assert.equal(clusterLabel(undefined), '0');
});

test('bubbles come in three sizes, and bigger means more', () => {
  assert.ok(clusterSize(5) < clusterSize(50));
  assert.ok(clusterSize(50) < clusterSize(500));
  assert.equal(clusterSize(19), clusterSize(2), 'two counts in the same band draw the same');
  assert.ok(clusterSize(2) >= 32, 'the smallest bubble is still a target');
});

test('tapping a bubble goes in two levels, and stops at the map’s limit', () => {
  assert.equal(zoomIntoCluster(12, 19), 14);
  assert.equal(zoomIntoCluster(12.6, 19), 14.6);
  // One level is not enough: a cell halves per level, so one step splits a
  // bubble into four that often land close together and read as the same
  // bubble in a slightly different place. Two splits it into sixteen.
  assert.equal(ZOOM_STEP, 2);

  // Against the ceiling it goes as far as it can, and no further.
  assert.equal(zoomIntoCluster(18, 19), 19);
  // Already there: null, so the caller does not start an animation that ends
  // where it began.
  assert.equal(zoomIntoCluster(19, 19), null);
  assert.equal(zoomIntoCluster(21, 19), null);

  assert.equal(zoomIntoCluster(undefined, 19), null);
  assert.equal(zoomIntoCluster(NaN, 19), null);
  // A map that does not say what its maximum is still zooms.
  assert.equal(zoomIntoCluster(12, undefined), 14);
});

test('no two bubbles on the map sit on top of each other', () => {
  // 2026-09-10, on a 2000px desktop at zoom 11: two bubbles both reading 27,
  // one drawn 15px into the other. "지도 왜 저지랄 났지?" Two neighbouring
  // cells whose restaurants both crowd the edge they share put both centroids
  // on that edge, and nothing in a pure grid stops that.
  //
  // Measured in cell pixels, which is screen pixels: the grid is square on a
  // Mercator screen by construction (degLat = degLng · cos φ), so a position
  // divided by the cell size and multiplied by CLUSTER_CELL_PX is where it is
  // drawn, relative to any other.
  for (const z of [11, 12, 13, 14, 15, 16]) {
    const { degLat, degLng } = cellSizeAt(z);
    const bubbles = clusterRows(ROWS, z)
      .filter(c => c.count > 1)
      .map(c => ({
        x: (c.lng / degLng) * CLUSTER_CELL_PX,
        y: (c.lat / degLat) * CLUSTER_CELL_PX,
        r: clusterSize(c.count) / 2,
        n: c.count,
      }));
    for (let i = 0; i < bubbles.length; i += 1) {
      for (let j = i + 1; j < bubbles.length; j += 1) {
        const a = bubbles[i];
        const b = bubbles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        assert.ok(
          d >= a.r + b.r,
          `zoom ${z}: a ${a.n} and a ${b.n} overlap by ${(a.r + b.r - d).toFixed(1)}px`,
        );
      }
    }
  }
});

test('a bubble is drawn inside its own cell, and a single place where it is', () => {
  // Keeping bubbles apart is allowed to move one towards the middle of the
  // cell its restaurants are in, and nowhere further: outside it, the bubble
  // would be sitting on somebody else's restaurants.
  for (const z of [12, 14]) {
    const { degLat, degLng } = cellSizeAt(z);
    for (const c of clusterRows(ROWS, z)) {
      if (c.count === 1) {
        // A restaurant's position is a fact, not a layout choice.
        assert.equal(c.lat, c.row.y);
        assert.equal(c.lng, c.row.x);
        continue;
      }
      const [cy, cx] = c.key.split(':').map(Number);
      assert.ok(c.lat >= cy * degLat && c.lat < (cy + 1) * degLat, `${c.key} drawn outside its row of cells`);
      assert.ok(c.lng >= cx * degLng && c.lng < (cx + 1) * degLng, `${c.key} drawn outside its column of cells`);
    }
  }
});
