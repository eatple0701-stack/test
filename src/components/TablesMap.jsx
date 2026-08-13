import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CENTER } from '../utils';
import { menuById } from '../domain/catalog/menus.js';
import { seatsRemaining } from '../domain/policy/table.js';
import { mappable, pointOf, unplacedNotice } from '../domain/policy/place.js';
import { XIcon } from './Icons';
import { useText } from './localeText.js';

// The tables, on the map. 김훈 부장님's 모임 장소 표시.
//
// The map in this app has shown restaurants since before the app was 밥친구,
// and never the tables — the one thing the product is actually about. A
// traveller choosing between two dinners is asking whether either is near
// where they are sleeping, and until now the answer was a place name they
// had to paste into another app.
//
// The pin carries the dish rather than a generic marker, because on a map of
// a city the question is not "is something here" but "is 삼겹살 here on
// Thursday". Tapping opens the table.
//
// Tables the host never placed are counted and named under the map instead
// of being guessed onto it — see src/domain/policy/place.js for why a
// geocoded pin would be worse than none.

const tablePin = (menu, left) => L.divIcon({
  className: 'table-pin',
  html: `<span class="table-pin__body${left === 0 ? ' is-full' : ''}">
    <span class="table-pin__word">${menu?.nameKo ?? '밥상'}</span>
    <span class="table-pin__seats">${left === 0 ? 'full' : left}</span>
  </span>`,
  // Measured rather than guessed so the tip sits on the point, not near it.
  // Moved with the pill when it grew from 32px to 44px (index.css,
  // .table-pin__body) — the anchor is half the height plus the shadow, and
  // leaving it at 34 would have floated every pin six pixels off its place.
  iconSize: [null, null],
  iconAnchor: [30, 46],
});

export default function TablesMap({
  tables = [], signupsFor = {}, onOpenTable, onClose,
  // 'overlay' is the full-screen map. 'preview' is the small one that sits in
  // the Tables tab where a button used to: a map you have to ask for is a map
  // most people never see, and "지도로 보기" told somebody a map existed
  // without showing them the one fact they wanted — whether tonight's dinner
  // is anywhere near where they are sleeping.
  //
  // The preview is deliberately dead to touch. A live Leaflet inside a
  // scrolling page swallows the drag that was meant to scroll it, which on a
  // phone means the page stops moving and nobody knows why. So it draws, and
  // the whole thing is one button into the real map.
  variant = 'overlay',
  onOpen,
}) {
  const say = useText();
  const placed = useMemo(() => mappable(tables), [tables]);
  const notice = useMemo(() => unplacedNotice(tables), [tables]);

  // Centre on the tables when there are any, so the map opens where the food
  // is rather than on a fixed downtown point that may hold nothing.
  const center = useMemo(() => {
    if (placed.length === 0) return MAP_CENTER;
    const pts = placed.map(pointOf);
    return [
      pts.reduce((s, p) => s + p.lat, 0) / pts.length,
      pts.reduce((s, p) => s + p.lng, 0) / pts.length,
    ];
  }, [placed]);

  const pins = placed.map(t => {
    const menu = menuById(t.menuId);
    const p = pointOf(t);
    const left = seatsRemaining(t, signupsFor[t.id] ?? []);
    return { t, menu, p, left };
  });

  if (variant === 'preview') {
    return (
      <button
        className="tables-map-preview"
        onClick={onOpen}
        aria-label={placed.length > 0
          ? `Open the map, ${placed.length} table${placed.length === 1 ? '' : 's'} on it`
          : 'Open the map'}
      >
        <span className="tables-map-preview__canvas" aria-hidden="true">
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            touchZoom={false}
            doubleClickZoom={false}
            boxZoom={false}
            keyboard={false}
            attributionControl={false}
          >
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {pins.map(({ t, menu, p, left }) => (
              <Marker key={t.id} position={[p.lat, p.lng]} icon={tablePin(menu, left)} interactive={false} />
            ))}
          </MapContainer>
        </span>
        {/* Attribution still has to be here — the tiles are OpenStreetMap's
            whether or not the control is drawn, and hiding the control does
            not make the licence go away. */}
        <span className="tables-map-preview__credit">© OpenStreetMap</span>
        <span className="tables-map-preview__cta" translate="no">
          지도로 보기 · See these on a map
        </span>
      </button>
    );
  }

  return (
    <div className="map-overlay tables-map" role="dialog" aria-modal="true" aria-label={say('Tables on the map', '지도 위의 밥상', 'Mesas en el mapa', 'Les tables sur la carte')}>
      <header className="map-overlay__bar">
        <div className="map-overlay__heading">
          <h2>밥상 지도 · Tables near you</h2>
          <p>
            {placed.length > 0
              ? `${placed.length} table${placed.length === 1 ? '' : 's'} placed by their host`
              : 'No host has dropped a pin yet'}
          </p>
        </div>
        <button className="map-overlay__close" aria-label={say('Close map', '지도 닫기', 'Cerrar el mapa', 'Fermer la carte')} onClick={onClose}>
          <XIcon size={18} />
        </button>
      </header>

      <div className="map-overlay__map">
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {placed.map(t => {
            const menu = menuById(t.menuId);
            const p = pointOf(t);
            const left = seatsRemaining(t, signupsFor[t.id] ?? []);
            return (
              <Marker
                key={t.id}
                position={[p.lat, p.lng]}
                icon={tablePin(menu, left)}
                eventHandlers={{ click: () => onOpenTable?.(t.id) }}
              >
                {/* A popup as well as the click, because on a phone a tap
                    that navigates immediately gives no chance to check the
                    date first. */}
                <Popup>
                  <strong>{menu?.name ?? 'Table'}</strong><br />
                  {t.date} {t.time}<br />
                  {t.place}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Never silent about what is missing: four in the list and three on
          the map reads as the app losing one. */}
      {notice && (
        <div className="map-overlay__panel tables-map__notice">
          <p className="tables-map__notice-kr">{notice.kr}</p>
          <p className="tables-map__notice-en">{notice.en}</p>
        </div>
      )}
    </div>
  );
}
