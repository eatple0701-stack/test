import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CENTER, coordsOf, kakaoMapUrl } from '../utils';
import { loadAllPlaces, placesInView, placesMatching, asPlace } from '../data/nearbyPlaces.js';
import { isRegistryPlace, placeFromRegistry, displayName } from '../data/seoulRegistry.js';
import { DISH_KO, groupsOf, primaryGroup } from '../domain/catalog/dishGroups.js';
import { dotGroup, VISITED } from '../domain/policy/mapLegend.js';
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

/**
 * The registry layer.
 *
 * All 8,118 of them, fetched once on the map's first render and then cut to
 * whatever is on screen. It is a quarter of a megabyte compressed, which is
 * what filtering the register down to the twenty-four dishes bought: the
 * layer no longer has to ration itself by district or wait for zoom 15.
 *
 * The viewport is still capped — Leaflet keeps a DOM node per marker — but
 * the cap samples across the visible rows rather than taking the first ones,
 * so a city-wide view is a spread over Seoul and not a clump in 강남구.
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
  const shown = useMemo(() => {
    if (!layer) return [];
    const q = String(query ?? '').trim();
    if (q) return placesMatching(layer, q);
    if (!view) return [];
    const b = view.bounds;
    return placesInView(layer, {
      north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest(),
    }, view.zoom);
  }, [layer, view, query]);

  // The kinds, if any are on. A dot the filter rules out is not drawn, and
  // one it keeps takes that kind's colour — see dotGroup for the report this
  // answers. With nothing on, primaryGroup is still what paints it.
  return shown.map((p) => {
    const g = dotGroup(groupsOf(p.d), activeGroups);
    if (activeGroups.length > 0 && !g) return null;
    return (
      <Marker
        key={p.i}
        position={[p.y, p.x]}
        icon={dotIcon(g?.tint ?? primaryGroup(p.d)?.tint ?? '#F97316')}
        zIndexOffset={-500}
        eventHandlers={{ click: () => onSelect({ row: p, builtAt: layer?.builtAt ?? null }) }}
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
