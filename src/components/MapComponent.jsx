import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CENTER, coordsOf, kakaoMapUrl } from '../utils';
import { loadAllPlaces, placesMatching, asPlace } from '../data/nearbyPlaces.js';
import { isRegistryPlace, placeFromRegistry, displayName } from '../data/seoulRegistry.js';
import { DISH_GROUPS, DISH_KO, groupsOf, primaryGroup } from '../domain/catalog/dishGroups.js';
import { dotGroup, VISITED } from '../domain/policy/mapLegend.js';
import {
  clusterRows, clustersInView, clusterLabel, clusterSize, zoomIntoCluster,
} from '../domain/policy/mapCluster.js';
import { useText, useLocale } from './localeText.js';
import { tilesFor } from '../domain/policy/mapTiles.js';

// Reports the map center upward after each pan/zoom so the list can re-sort by distance
function CenterReporter({ onCenterChange }) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      onCenterChange([c.lat, c.lng]);
    },
  });
  return null;
}

// The map-region's own size changes at each responsive breakpoint (46vh
// stacked on mobile vs. full-height split column on tablet/desktop).
// Leaflet doesn't know its container resized unless told, so it would
// otherwise render stale/cropped tiles right after a breakpoint change.
function ResizeSync() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

// One mark for every place on this map, and colour is the only thing that
// varies. The eighteen curated places were teardrops until 2026-09-09 — this
// file's own note said "A teardrop says 'we chose this'; a dot says 'this is
// here'" — and that difference did not go away, it moved: 직접 가본 곳 is a
// category with a colour and a chip beside the other six, which is where a
// difference somebody has to be told about belongs.
//
// Selection is a thicker ring rather than a bigger mark, because the ask was
// for one shape at one size.
const dotCache = new Map();
const dotIcon = (tint, selected = false, wide = false) => {
  const key = `${tint}|${selected ? 'on' : 'off'}|${wide ? 'wide' : 'thin'}`;
  if (!dotCache.has(key)) {
    dotCache.set(key, L.divIcon({
      className: `k-dot${selected ? ' k-dot--active' : ''}${wide ? ' k-dot--wide' : ''}`,
      html: '<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">'
        + `<circle cx="7" cy="7" r="5" fill="${tint}" fill-opacity="${selected ? 1 : 0.9}"`
        + ` stroke="${selected ? '#191F28' : '#FFFFFF'}" stroke-width="2"/></svg>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    }));
  }
  return dotCache.get(key);
};

// A group id to the colour it is drawn in, so a cluster can be told what its
// restaurants agree on without mapCluster.js having to know that a catalogue
// of dishes exists.
const GROUP_TINT = new Map(DISH_GROUPS.map(g => [g.id, g.tint]));

// A bubble for a cluster: how many restaurants are under here, and — when
// they all serve the same kind of thing — which kind.
//
// Drawn as an SVG circle and a number rather than a styled div, for the same
// reason dotIcon is: Leaflet hands the html straight to the marker, and a
// divIcon whose size the stylesheet decides is a marker Leaflet cannot
// anchor. The white ring is what stops a bubble disappearing into the park
// it is standing in.
const bubbleCache = new Map();
const bubbleIcon = (count, tint) => {
  const label = clusterLabel(count);
  const size = clusterSize(count);
  const key = `${label}|${size}|${tint ?? 'mixed'}`;
  if (!bubbleCache.has(key)) {
    const r = size / 2;
    // A bag of several kinds has no colour of its own; picking one of them
    // would be a claim about the others — a 30/25/25/20 split painted
    // K-BBQ orange says something false about three quarters of it. So a
    // mixed bubble takes the app’s own ink and lets the number carry it,
    // and the map answers "where is everything" in one colour and "where is
    // K-BBQ" in orange, which is the chips’ whole job.
    const fill = tint ?? '#26303F';
    const fontSize = label.length > 3 ? 11 : (label.length > 2 ? 12 : 13);
    bubbleCache.set(key, L.divIcon({
      className: 'k-bubble',
      html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`
        + `<circle cx="${r}" cy="${r}" r="${r - 2}" fill="${fill}" fill-opacity="0.94" stroke="#FFFFFF" stroke-width="2"/>`
        + `<text x="${r}" y="${r}" text-anchor="middle" dominant-baseline="central"`
        + ` font-size="${fontSize}" font-weight="700" fill="#FFFFFF">${label}</text></svg>`,
      iconSize: [size, size],
      iconAnchor: [r, r],
    }));
  }
  return bubbleCache.get(key);
};

/**
 * The registry layer.
 *
 * All 8,118 of them, fetched once on the map's first render. It is a quarter
 * of a megabyte compressed, which is what filtering the register down to the
 * twenty-four dishes bought: the layer no longer has to ration itself by
 * district or wait for zoom 15.
 *
 * ── Bubbles, since 2026-09-10 ────────────────────────────────────────────
 *
 * It used to draw one dot per row in view, capped at 160. On a 375px phone at
 * the zoom this tab opens on, that was 178 identical circles in seven colours
 * over central Seoul, and it read as a texture. "지도같은 거는 보기가 너무
 * 힘들던데."
 *
 * Now the rows are grouped into cells of about 76px and each cell draws one
 * bubble with a count. Zoom in and the cell halves, so a bubble splits into
 * the four under it, down to single restaurants — which draw as the dots they
 * always did and open the same sheet. The grid is geographic, not a division
 * of the viewport, so panning changes nothing at all: see
 * domain/policy/mapCluster.js, and placesInView's note for the report that
 * makes that the important part.
 *
 * A search is exempt. Search results are a set somebody named, they are
 * already capped, and rolling 40 answers into 6 bubbles would hide the thing
 * that was asked for.
 */
function NearbyLayer({ onSelect, query, activeGroups = [] }) {
  const [layer, setLayer] = useState(null);
  const [view, setView] = useState(null);

  const map = useMapEvents({
    moveend: () => setView({ bounds: map.getBounds(), zoom: map.getZoom() }),
    zoomend: () => setView({ bounds: map.getBounds(), zoom: map.getZoom() }),
  });

  // Once, on mount. Panning no longer needs to fetch anything, because the
  // whole city already arrived.
  useEffect(() => {
    let alive = true;
    loadAllPlaces().then(l => { if (alive) setLayer(l); });
    setView({ bounds: map.getBounds(), zoom: map.getZoom() });
    return () => { alive = false; };
  }, [map]);

  // With nothing typed: every row in view. Every row in the file already
  // serves one of the twenty-four dishes — that is what the build script
  // keeps — so the layer draws them all, coloured by group.
  //
  // With something typed: the rows that match it, anywhere in Seoul. Until
  // 2026-09-04 the search reached the list and not these dots, so typing a
  // restaurant name narrowed a list that could be folded away and left the
  // map identical — which is what "검색이 안 된다" looked like from a
  // screen showing only the map.
  const searching = String(query ?? '').trim();

  // What the chips have on, applied once over the whole city rather than per
  // marker. A count has to mean the same thing wherever you look at it from,
  // so the filtering has to happen before the grouping — see dotGroup for the
  // report about which colour a dot takes when two kinds claim it.
  const rows = useMemo(() => {
    if (!layer?.rows) return [];
    if (!activeGroups.length) return layer.rows;
    return layer.rows.filter(p => dotGroup(groupsOf(p.d), activeGroups));
  }, [layer, activeGroups]);

  const tintOf = useMemo(() => (p) => (
    dotGroup(groupsOf(p.d), activeGroups)?.tint ?? primaryGroup(p.d)?.tint ?? '#F97316'
  ), [activeGroups]);

  // Keyed on the zoom and not the bounds, which is what makes panning free:
  // the clusters are the same objects until the reader zooms.
  const zoom = view ? Math.floor(view.zoom) : null;
  const clusters = useMemo(() => {
    if (searching || zoom === null) return [];
    return clusterRows(rows, zoom, {
      groupIdOf: (p) => dotGroup(groupsOf(p.d), activeGroups)?.id ?? primaryGroup(p.d)?.id ?? null,
    });
  }, [rows, zoom, searching, activeGroups]);

  const hits = useMemo(() => {
    if (!layer || !searching) return [];
    const found = placesMatching(layer, searching);
    if (!activeGroups.length) return found;
    return found.filter(p => dotGroup(groupsOf(p.d), activeGroups));
  }, [layer, searching, activeGroups]);

  const shown = useMemo(() => {
    if (!view || zoom === null) return [];
    const b = view.bounds;
    return clustersInView(clusters, {
      north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest(),
    }, zoom);
  }, [clusters, view, zoom]);

  const open = (p) => onSelect({ row: p, builtAt: layer?.builtAt ?? null });

  // Tapping a bubble goes in. How far is zoomIntoCluster’s call; whether it
  // flies or jumps is the reader’s, and their setting is the one place this
  // app has motion it cannot turn off from CSS.
  const openCluster = (c) => {
    const next = zoomIntoCluster(map.getZoom(), map.getMaxZoom());
    if (next === null) return;
    const still = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (still) map.setView([c.lat, c.lng], next, { animate: false });
    else map.flyTo([c.lat, c.lng], next, { duration: 0.45 });
  };

  // Typed: the answers, as themselves. Until 2026-09-04 the search reached the
  // list and not these dots, so typing a restaurant name narrowed a list that
  // could be folded away and left the map identical — which is what
  // "검색이 안 된다" looked like from a screen showing only the map.
  if (searching) {
    return hits.map(p => (
      <Marker
        key={p.i}
        position={[p.y, p.x]}
        icon={dotIcon(tintOf(p))}
        zIndexOffset={-500}
        eventHandlers={{ click: () => open(p) }}
      />
    ));
  }

  return shown.map((c) => {
    if (c.row) {
      return (
        <Marker
          key={c.key}
          position={[c.lat, c.lng]}
          icon={dotIcon(tintOf(c.row))}
          zIndexOffset={-500}
          eventHandlers={{ click: () => open(c.row) }}
        />
      );
    }
    const tint = c.groupId ? GROUP_TINT.get(c.groupId) ?? null : null;
    return (
      <Marker
        key={c.key}
        position={[c.lat, c.lng]}
        icon={bubbleIcon(c.count, tint)}
        zIndexOffset={-400}
        eventHandlers={{ click: () => openCluster(c) }}
      />
    );
  });
}

/**
 * What a dot says when you tap it.
 *
 * This was a Leaflet popup, and it did not work. Measured on a 375×812 phone:
 * the popup opened 149px above the top edge of a map that is 325px tall, and
 * `overflow: hidden` on the container ate the restaurant's name and its dish
 * chips — everything that identifies the place. Leaflet's autoPan is supposed
 * to prevent exactly that and could not: there is no pan that fits a 233px
 * popup, its tail and its padding into 325px of map.
 *
 * So it is a card fixed to the bottom of the map instead. It cannot be
 * clipped by the map, it does not move when the map moves, its close button
 * is a real 44px target, and it has room for the caveat that has to be on
 * every one of these.
 */
function NearbyCard({ place, onClose, onDetails }) {
  const say = useText();
  const locale = useLocale();
  if (!place) return null;
  // The register row carries its own English name; a Korean reader still
  // gets the sign. Before this the card said 말모아왕족발 to everybody.
  const name = displayName(place, locale);
  const groups = groupsOf(place.d);
  const dishes = (place.d ?? []).map(d => DISH_KO[d]).filter(Boolean).join(' · ');

  return (
    <div className="nearby-card" role="dialog" aria-label={name}>
      <button className="nearby-card__close" onClick={onClose} aria-label={say('Close', '닫기', 'Cerrar', 'Fermer', 'إغلاق', '关闭', '閉じる')}>×</button>
      <strong className="nearby-card__name" translate="no" data-no-locale>{name}</strong>

      {/* Why this place is on the map at all: the dishes its own menu carries.
          Said on the card rather than left to the colour of the dot. */}
      <div className="nearby-card__groups">
        {groups.map(g => (
          <span key={g.id} className="nearby-card__group" style={{ background: g.tint }}>
            {g.emoji} {say(g.en, g.ko, g.es, g.fr, g.ar, g.zh, g.ja)}
          </span>
        ))}
      </div>
      {dishes && <p className="nearby-card__menu" translate="no" data-no-locale>{dishes}</p>}

      <p className="nearby-card__addr">{place.a}</p>
      {place.h && <p className="nearby-card__hours">{place.h}</p>}

      {/* One line, not a paragraph. Where it came from, which is the only
          part a reader cannot work out for themselves. */}
      <p className="nearby-card__source">
        {say('Seoul Tourism Foundation register', '서울관광재단 등록 정보',
          'Registro de la Fundación de Turismo de Seúl', 'Registre de la Fondation du tourisme de Séoul',
          'سجلّ مؤسسة سول للسياحة', '首尔观光财团登记信息', 'ソウル観光財団の登録情報')}
      </p>

      <div className="nearby-card__links">
        {/* The app's own page for this place — hours, phone, and 상 차리기.
            Without it the map was a dead end: a dot could only hand the
            reader to Naver, and the one thing this app can do that a map
            app cannot (open a table here) was unreachable from the map. */}
        {onDetails && (
          <button className="nearby-card__details" onClick={onDetails}>
            {say('Details', '자세히', 'Detalles', 'Détails', 'التفاصيل', '详情', '詳しく')}
          </button>
        )}
        {/* Naver was here and is not any more: its web link redirects into a
            Korean app-install promo, and the parameter meant to prevent that
            is overwritten server-side. See naverMapUrl in utils.js. */}
        <a href={kakaoMapUrl(asPlace(place))} target="_blank" rel="noreferrer">{say('Kakao', '카카오', 'Kakao', 'Kakao', 'كاكاو', 'Kakao', 'Kakao')}</a>
      </div>
    </div>
  );
}

export default function MapComponent({ restaurants, onMarkerClick, selectedId, onCenterChange, showNearby = false, query = '', activeGroups = [], visitedOnly = false }) {
  // Which register dot is open, if any. Held here rather than in the layer
  // because the card is drawn outside the map, over it.
  const [nearbySelected, setNearbySelected] = useState(null);
  // One place decides the base map for every map in the app; see
  // domain/policy/mapTiles.js for why it is still one provider.
  const tiles = tilesFor(useLocale());
  useEffect(() => { if (!showNearby) setNearbySelected(null); }, [showNearby]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer center={MAP_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        {onCenterChange && <CenterReporter onCenterChange={onCenterChange} />}
        <ResizeSync />
        <TileLayer attribution={tiles.attribution} url={tiles.url} />
        {/* 직접 가본 곳 means the eighteen and nothing else, so the register
            layer is not part of that answer. Without this the chip took the
            list to 18 and left 8,118 dots on the map — the same shape of bug
            the dish kinds had this morning, one filter later. */}
        {showNearby && !visitedOnly && (
          <NearbyLayer onSelect={setNearbySelected} query={query} activeGroups={activeGroups} />
        )}
        {/* The teardrop layer is the twenty curated places and nothing else.
            Since the register joined the same pool, this list arrives holding
            every one of its 167,659 rows too — and drawing them as teardrops
            would both bury the curation and hand Leaflet a hundred thousand
            markers. The register has its own layer above, drawn as dots and
            capped to the viewport.

            The coordinate check is the other half: 2,953 register rows have
            no usable position, and Leaflet's "Invalid LatLng object:
            (undefined, undefined)" throws hard enough to take the whole app
            to the error boundary. */}
        {restaurants.filter(r => !isRegistryPlace(r) && Number.isFinite(coordsOf(r).lat)).map(r => (
          <Marker
            key={r.id}
            position={[coordsOf(r).lat, coordsOf(r).lng]}
            icon={dotIcon(VISITED.tint, selectedId === r.id, true)}
            zIndexOffset={500}
            eventHandlers={{
              click: () => onMarkerClick(r),
            }}
          />
        ))}
      </MapContainer>
      <NearbyCard
        place={nearbySelected?.row}
        onClose={() => setNearbySelected(null)}
        onDetails={onMarkerClick && nearbySelected ? () => {
          onMarkerClick(placeFromRegistry(nearbySelected.row, nearbySelected.builtAt));
          setNearbySelected(null);
        } : null}
      />
    </div>
  );
}
