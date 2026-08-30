import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CENTER } from '../utils';
import { pointOf, PICKER_PROMPT } from '../domain/policy/place.js';
import { tilesFor } from '../domain/policy/mapTiles.js';
import { useLocale } from './localeText.js';

// Where the host will actually be standing, pointed at rather than described.
//
// The alternative was geocoding the `place` text, and PlacePolicy explains at
// length why that is refused: "홍대입구 3번 출구" becomes a coordinate that
// looks exactly as sure as a true one and is a block away. This asks the one
// person who knows.
//
// Optional on purpose. A host who cannot be bothered writes their meeting
// point in words as before, and their table stays in the list without a pin
// — which is honest, and better than a pin they did not mean.

const dropPin = L.divIcon({
  className: 'k-pin k-pin--active',
  html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 42.5C17 42.5 31.5 26.4 31.5 15.6C31.5 7.6 25 1.5 17 1.5C9 1.5 2.5 7.6 2.5 15.6C2.5 26.4 17 42.5 17 42.5Z"
      fill="#C2410C" stroke="#9A3412" stroke-width="2.5"/>
    <circle cx="17" cy="15.8" r="5" fill="#FFFFFF"/>
  </svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 42],
});

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function PlacePicker({ value, onChange }) {
  const point = pointOf(value ?? {});
  const tiles = tilesFor(useLocale());

  return (
    <div className="place-picker">
      <span className="field__label">{PICKER_PROMPT.kr}</span>
      <div className="place-picker__map">
        <MapContainer center={point ? [point.lat, point.lng] : MAP_CENTER} zoom={point ? 15 : 12} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution={tiles.attribution} url={tiles.url} />
          <ClickToPlace onPick={onChange} />
          {point && <Marker position={[point.lat, point.lng]} icon={dropPin} />}
        </MapContainer>
      </div>
      <span className="field__note">{PICKER_PROMPT.en}</span>
      {point && (
        <button type="button" className="place-picker__clear" onClick={() => onChange({ lat: null, lng: null })}>
          {PICKER_PROMPT.clear}
        </button>
      )}
    </div>
  );
}
