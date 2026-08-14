import React, { useEffect } from 'react';
import MapComponent from './MapComponent';
import FilterBar from './FilterBar';
import BottomSheetList from './BottomSheetList';
import { XIcon } from './Icons';
import { useText } from './localeText.js';

// The map as a tool rather than a substrate.
//
// Until now the map WAS the app shell: on mobile it sat at `inset: 0` behind
// every screen, and on desktop it held most of the viewport while content was
// squeezed into a sidebar. That layout made a culture platform read as a maps
// product before a single word was seen.
//
// Here the map is summoned. It opens over the content, carries the search,
// filters and list that used to live in the shell, and closes again. Callers
// pass a `title` describing the scope they opened it from — a theme, an
// experience, a zone — so the map always answers a question the user asked
// rather than being the question itself.
export default function MapOverlay({
  open,
  onClose,
  title = 'Explore on the map',
  subtitle,
  restaurants,
  mapCenter,
  onCenterChange,
  selectedId,
  onRestaurantClick,
  onReadStory,
  bookmarkedIds,
  onToggleBookmark,
  sustainabilityLens,
  searchQuery,
  onSearchChange,
  selectedFilters,
  onToggleFilter,
  onResetFilters,
}) {
  const say = useText();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Leaflet measures its container on mount. Mounting only while open keeps
  // it from sizing itself against a hidden element, which is the classic way
  // this ends up rendering a grey box.
  if (!open) return null;

  return (
    <div className="map-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <header className="map-overlay__bar">
        <div className="map-overlay__heading">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="map-overlay__close" aria-label={say('Close map', '지도 닫기', 'Cerrar el mapa', 'Fermer la carte', 'أغلق الخريطة')} onClick={onClose}>
          <XIcon size={18} />
        </button>
      </header>

      <div className="map-overlay__map">
        <MapComponent
          restaurants={restaurants}
          onMarkerClick={onRestaurantClick}
          selectedId={selectedId}
          onCenterChange={onCenterChange}
        />
      </div>

      <div className="map-overlay__panel">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedFilters={selectedFilters}
          onToggleFilter={onToggleFilter}
        />
        <section className="map-overlay__list" aria-label={say('Places on the map', '지도 위의 장소', 'Sitios en el mapa', 'Les adresses sur la carte', 'الأماكن على الخريطة')}>
          <BottomSheetList
            restaurants={restaurants}
            mapCenter={mapCenter}
            bookmarkedIds={bookmarkedIds}
            onRestaurantClick={onRestaurantClick}
            onReadStory={onReadStory}
            onToggleBookmark={onToggleBookmark}
            sustainabilityLens={sustainabilityLens}
            onResetFilters={onResetFilters}
          />
        </section>
      </div>
    </div>
  );
}
