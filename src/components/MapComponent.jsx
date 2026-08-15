import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CENTER, coordsOf, naverMapUrl, kakaoMapUrl } from '../utils';
import { loadNearbyPlaces, placesInView, asPlace } from '../data/nearbyPlaces.js';
import { isRegistryPlace } from '../data/seoulRegistry.js';
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
const dotIcon = L.divIcon({
  className: 'k-dot',
  html: '<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">'
    + '<circle cx="7" cy="7" r="5" fill="#F97316" fill-opacity="0.85" stroke="#FFFFFF" stroke-width="2"/></svg>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/**
 * The registry layer.
 *
 * Loaded on first render of the map and then filtered to whatever is on
 * screen. Below MIN_ZOOM it draws nothing at all — seven thousand dots over
 * the whole city is a texture, not a map, and it would bury the pins that
 * took somebody a week to write.
 */
function NearbyLayer() {
  const say = useText();
  const [layer, setLayer] = useState(null);
  const [view, setView] = useState(null);

  const map = useMapEvents({
    moveend: () => setView({ bounds: map.getBounds(), zoom: map.getZoom() }),
    zoomend: () => setView({ bounds: map.getBounds(), zoom: map.getZoom() }),
  });

  // Districts are fetched around wherever the map is looking, so panning
  // across the city pulls in what it passes over rather than everything.
  useEffect(() => {
    let alive = true;
    const c = map.getCenter();
    loadNearbyPlaces([c.lat, c.lng]).then(l => { if (alive) setLayer(l); });
    setView({ bounds: map.getBounds(), zoom: map.getZoom() });
    return () => { alive = false; };
  }, [map, view?.bounds]);

  // The toggle promises places with a foreign-language menu, so that is what
  // this draws. The full register — every one of the 167,659 — is in the
  // Places list; a map showing all of them at once is a texture, not
  // information, and it would be a different promise than the label makes.
  const foreignOnly = useMemo(
    () => (layer?.rows ? { ...layer, rows: layer.rows.filter(r => r.f === 1) } : null),
    [layer],
  );

  const shown = useMemo(() => {
    if (!foreignOnly || !view) return [];
    const b = view.bounds;
    return placesInView(foreignOnly, {
      north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest(),
    }, view.zoom);
  }, [foreignOnly, view]);

  return shown.map((p) => (
    <Marker key={p.i} position={[p.y, p.x]} icon={dotIcon} zIndexOffset={-500}>
      <Popup>
        <strong className="nearby-pop__name" translate="no">{p.n}</strong>
        {p.c && <span className="nearby-pop__kind">{p.c}</span>}
        <span className="nearby-pop__addr">{p.a}</span>
        {p.h && <span className="nearby-pop__hours">{p.h}</span>}
        {/* The line that keeps this layer honest. These are registry rows;
            nobody here has eaten in one. Said on every one of them rather
            than once in a legend somebody scrolls past. */}
        <span className="nearby-pop__caveat">
          {say('Listed as offering a foreign-language menu. From the Seoul Tourism Foundation register — we have not been here, and hours change.',
            '외국어 메뉴를 제공한다고 등록된 곳입니다. 서울관광재단 등록 정보이고, 저희가 가본 곳은 아니며 영업시간은 바뀝니다.',
            'Registrado como que ofrece carta en otro idioma. Del registro de la Fundación de Turismo de Seúl: no hemos estado aquí, y los horarios cambian.',
            "Enregistré comme proposant une carte en langue étrangère. Registre de la Fondation du tourisme de Séoul — nous n'y sommes pas allés, et les horaires changent.",
            'مسجَّل على أنه يقدّم قائمة بلغة أجنبية. من سجلّ مؤسسة سول للسياحة — لم نزره، والمواعيد تتغيّر.',
            '登记为提供外语菜单。来自首尔观光财团的登记信息——我们没有去过，营业时间也会变。',
            '外国語のメニューがあると登録されている店です。ソウル観光財団の登録情報で、私たちが行った店ではなく、営業時間は変わります。')}
        </span>
        <span className="nearby-pop__links">
          <a href={naverMapUrl(asPlace(p))} target="_blank" rel="noreferrer">{say('Naver', '네이버', 'Naver', 'Naver', 'نيفر', 'Naver', 'Naver')}</a>
          <a href={kakaoMapUrl(asPlace(p))} target="_blank" rel="noreferrer">{say('Kakao', '카카오', 'Kakao', 'Kakao', 'كاكاو', 'Kakao', 'Kakao')}</a>
        </span>
      </Popup>
    </Marker>
  ));
}

export default function MapComponent({ restaurants, onMarkerClick, selectedId, onCenterChange, showNearby = false }) {
  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer center={MAP_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        {onCenterChange && <CenterReporter onCenterChange={onCenterChange} />}
        <ResizeSync />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showNearby && <NearbyLayer />}
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
    </div>
  );
}
