import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CENTER, coordsOf, naverMapUrl, kakaoMapUrl } from '../utils';
import { loadAllPlaces, placesInView, asPlace } from '../data/nearbyPlaces.js';
import { isRegistryPlace, placeFromRegistry } from '../data/seoulRegistry.js';
import { DISH_KO, groupsOf, primaryGroup } from '../domain/catalog/dishGroups.js';
import { useText } from './localeText.js';

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

// Teardrop pin: white body with green outline, solid green when selected
const pinIcon = (selected) => L.divIcon({
  className: `k-pin${selected ? ' k-pin--active' : ''}`,
  html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 42.5C17 42.5 31.5 26.4 31.5 15.6C31.5 7.6 25 1.5 17 1.5C9 1.5 2.5 7.6 2.5 15.6C2.5 26.4 17 42.5 17 42.5Z"
      fill="${selected ? '#0E9F6E' : '#FFFFFF'}" stroke="${selected ? '#087F5B' : '#0E9F6E'}" stroke-width="2.5"/>
    <circle cx="17" cy="15.8" r="5" fill="${selected ? '#FFFFFF' : '#0E9F6E'}"/>
  </svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 42],
});

// Places from the 서울관광재단 registry: a smaller, quieter mark, because
// the difference between these and the twenty curated pins is the whole
// point. A teardrop says "we chose this"; a dot says "this is here".
const dotCache = new Map();
const dotIcon = (tint) => {
  if (!dotCache.has(tint)) {
    dotCache.set(tint, L.divIcon({
      className: 'k-dot',
      html: '<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">'
        + `<circle cx="7" cy="7" r="5" fill="${tint}" fill-opacity="0.9" stroke="#FFFFFF" stroke-width="2"/></svg>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    }));
  }
  return dotCache.get(tint);
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
function NearbyLayer({ onSelect }) {
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

  // No filter here. Every row in the file already serves one of the
  // twenty-four dishes — that is what the build script keeps and everything
  // else is deleted — so the layer draws all of them, coloured by group.
  const shown = useMemo(() => {
    if (!layer || !view) return [];
    const b = view.bounds;
    return placesInView(layer, {
      north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest(),
    }, view.zoom);
  }, [layer, view]);

  return shown.map((p) => (
    <Marker
      key={p.i}
      position={[p.y, p.x]}
      icon={dotIcon(primaryGroup(p.d)?.tint ?? '#F97316')}
      zIndexOffset={-500}
      eventHandlers={{ click: () => onSelect({ row: p, builtAt: layer?.builtAt ?? null }) }}
    />
  ));
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
  if (!place) return null;
  const groups = groupsOf(place.d);
  const dishes = (place.d ?? []).map(d => DISH_KO[d]).filter(Boolean).join(' · ');

  return (
    <div className="nearby-card" role="dialog" aria-label={place.n}>
      <button className="nearby-card__close" onClick={onClose} aria-label={say('Close', '닫기', 'Cerrar', 'Fermer', 'إغلاق', '关闭', '閉じる')}>×</button>
      <strong className="nearby-card__name" translate="no" data-no-locale>{place.n}</strong>

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
        <a href={naverMapUrl(asPlace(place))} target="_blank" rel="noreferrer">{say('Naver', '네이버', 'Naver', 'Naver', 'نيفر', 'Naver', 'Naver')}</a>
        <a href={kakaoMapUrl(asPlace(place))} target="_blank" rel="noreferrer">{say('Kakao', '카카오', 'Kakao', 'Kakao', 'كاكاو', 'Kakao', 'Kakao')}</a>
      </div>
    </div>
  );
}

export default function MapComponent({ restaurants, onMarkerClick, selectedId, onCenterChange, showNearby = false }) {
  // Which register dot is open, if any. Held here rather than in the layer
  // because the card is drawn outside the map, over it.
  const [nearbySelected, setNearbySelected] = useState(null);
  useEffect(() => { if (!showNearby) setNearbySelected(null); }, [showNearby]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer center={MAP_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        {onCenterChange && <CenterReporter onCenterChange={onCenterChange} />}
        <ResizeSync />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showNearby && <NearbyLayer onSelect={setNearbySelected} />}
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
            icon={pinIcon(selectedId === r.id)}
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
