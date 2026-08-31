import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { tilesFor, INTL, TILE_PROVIDERS, OPEN_FREE_MAP } from '../policy/mapTiles.js';
import { LOCALES } from '../policy/locale.js';

// The base map, and the one thing this file is really guarding.
//
// A6 asked for English map labels. Four components drew the same hard-coded
// OpenStreetMap URL, so a provider swap was four edits in four files and
// three chances to leave one behind — which is how an app ends up with an
// English map on the Places tab and a Korean one on the screen where you
// choose where to meet. That is the failure these tests exist for, not the
// provider choice, which is a registration and a quota rather than code.

const root = process.cwd();
// Line endings normalised — see englishScreen.test.mjs for why.
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

const MAP_FILES = [
  'src/components/MapComponent.jsx',
  'src/components/PlacePicker.jsx',
  'src/components/TablesMap.jsx',
];

test('no component hard-codes a tile URL', () => {
  for (const f of MAP_FILES) {
    const text = read(f);
    assert.doesNotMatch(
      text, /url="https?:\/\//,
      `${f} still names a tile host itself — a provider change would leave this map behind`,
    );
    assert.match(text, /tilesFor\(/, `${f} does not ask mapTiles which provider to use`);
  }
});

test('every map in the app draws the same base map as every other one', () => {
  // Counted rather than eyeballed: TablesMap holds two TileLayers, one for
  // the preview strip and one for the full screen, and the preview is the
  // one that gets forgotten because it has no attribution control.
  let layers = 0;
  for (const f of MAP_FILES) {
    for (const m of read(f).matchAll(/<TileLayer/g)) { void m; layers += 1; }
  }
  assert.equal(layers, 4, `expected 4 TileLayers across the app, found ${layers}`);
  for (const f of MAP_FILES) {
    const text = read(f);
    const count = [...text.matchAll(/<TileLayer/g)].length;
    const wired = [...text.matchAll(/tiles\.url/g)].length;
    assert.equal(wired, count, `${f} has ${count} tile layers but wires ${wired}`);
  }
});

test('a provider always comes back, in every language the app offers', () => {
  for (const locale of [...LOCALES, 'both', undefined]) {
    const t = tilesFor(locale);
    assert.ok(t, `no tiles for locale ${locale}`);
    assert.match(t.url, /^https:\/\/\S+\{z\}\/\{x\}\/\{y\}/, `${locale}: ${t.url}`);
    // OpenStreetMap's licence requires the credit whether or not Leaflet
    // draws its control, so a provider with no attribution is not shippable.
    assert.ok(t.attribution && t.attribution.trim(), `${locale} has no attribution`);
    assert.ok(t.credit && t.credit.trim(), `${locale} has no short credit`);
  }
});

test('Korean and the default keep Korean labels on purpose', () => {
  assert.equal(tilesFor('ko').id, 'osm');
  assert.equal(tilesFor('both').id, 'osm');
});

test('the empty provider slot is a decision, with the evidence next to it', () => {
  // INTL is null because every keyless English-labelled provider was opened
  // and failed — CARTO stamps API KEY REQUIRED across the tile, Esri has no
  // Seoul street data, Wikimedia returns 403. If somebody fills it in, that
  // is fine; what must not happen is the slot quietly emptying again with
  // the reasons gone, so the reasons are pinned here.
  const src = read('src/domain/policy/mapTiles.js');
  for (const evidence of ['API KEY REQUIRED', 'Map data not yet available', '403']) {
    assert.ok(src.includes(evidence), `the note lost the ${evidence} finding`);
  }
  if (INTL === null) {
    // Falling back is what keeps the map working while the slot is empty.
    assert.equal(tilesFor('en').id, 'osm');
  } else {
    assert.ok(INTL.url && INTL.attribution && INTL.credit, 'a filled-in provider needs all three');
    assert.notEqual(INTL.url, TILE_PROVIDERS.OSM.url, 'INTL is just OSM again');
    assert.equal(tilesFor('en').id, INTL.id);
  }
});

test('the credit string the audit exempts is the one the app renders', () => {
  // TablesMap renders tiles.credit as JSX text, which scripts/audit-i18n.mjs
  // reads. A credit that is not on its exempt list makes the audit print a
  // number, and the temptation then is to translate a licence requirement.
  const audit = read('scripts/audit-i18n.mjs');
  for (const p of Object.values(TILE_PROVIDERS)) {
    assert.ok(
      audit.includes(`'${p.credit}'`),
      `${p.credit} is not exempt in audit-i18n.mjs — the audit will flag it`,
    );
  }
});

test('the OpenFreeMap entry is complete enough to switch on in one line', () => {
  // It was verified and then deliberately not enabled: it needs MapLibre GL,
  // which is +230KB gzipped on a 493KB bundle. Everything needed to flip it
  // is here so that decision is a decision and not a research project.
  assert.ok(OPEN_FREE_MAP.style.startsWith('https://tiles.openfreemap.org/'));
  assert.ok(OPEN_FREE_MAP.attribution.includes('OpenFreeMap'), 'the required attribution string is gone');
  assert.ok(OPEN_FREE_MAP.attribution.includes('OpenMapTiles'), 'the required attribution string is incomplete');
  assert.equal(OPEN_FREE_MAP.vector, true, 'a vector provider must say so — it needs a different layer type');
  assert.equal(OPEN_FREE_MAP.labelsInEnglish, true);

  const src = read('src/domain/policy/mapTiles.js');
  // The three findings that stop somebody re-deriving them, and the number
  // that is the actual reason it is off.
  assert.match(src, /name:latin/, 'the label expression finding is gone');
  assert.match(src, /never key off it|never key off/, 'the name_en trap is not recorded');
  assert.match(src, /493 KB gzipped/, 'the measured bundle cost is gone');
  assert.match(src, /jawg/i, 'the fallback provider is not recorded');
});

test('switching provider stays a one-line change', () => {
  // If INTL is ever filled in, everything downstream must already work: the
  // whole point of this module is that four components do not each need
  // editing. A vector provider is the one case that needs more than a URL,
  // so it has to be impossible to set quietly.
  if (INTL === null) return;
  assert.ok(INTL.attribution && INTL.credit, 'a filled-in provider needs attribution and a short credit');
  if (INTL.vector) {
    const files = ['src/components/MapComponent.jsx', 'src/components/PlacePicker.jsx', 'src/components/TablesMap.jsx'];
    for (const f of files) {
      assert.match(read(f), /maplibre|MaplibreGL/i,
        `${f} still renders a raster TileLayer, but INTL is a vector style — this map would go blank`);
    }
  }
});
