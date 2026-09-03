import React, { useEffect, useState } from 'react';
import MapComponent from './MapComponent';
import FilterBar from './FilterBar';
import BottomSheetList from './BottomSheetList';
import { XIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';
import { DISH_GROUPS } from '../domain/catalog/dishGroups.js';
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
  // On, because the point of the map is the 8,118 places on it. Off by
  // default meant opening the map and seeing twenty pins and an empty city,
  // with the whole import hidden behind a button nobody had reason to press.
  const [nearby, setNearby] = useState(true);
  // The list can be folded away. The map is 40vh of a phone with the list
  // open, which is a keyhole; folded it takes the whole overlay.
  const [listOpen, setListOpen] = useState(true);
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
    <div className={`map-overlay${listOpen ? '' : ' is-folded'}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="map-overlay__bar">
        <div className="map-overlay__heading">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="map-overlay__close" aria-label={say('Close map', '지도 닫기', 'Cerrar el mapa', 'Fermer la carte', 'أغلق الخريطة', '关闭地图', '地図を閉じる')} onClick={onClose}>
          <XIcon size={18} />
        </button>
      </header>

      {/* What the colours mean. Without this the map showed six colours of
          dot and no way to learn what any of them was — the information was
          on screen and unreadable, which is the same as not being there.
          Hidden when the layer is off, because then they mean nothing. */}
      <div className="map-legend" aria-label={say('What the colours mean', '색깔이 뜻하는 것', 'Qué significan los colores', 'Ce que signifient les couleurs', 'معنى الألوان', '颜色的含义', '色の意味')}>
        <button
          className={`map-overlay__nearby${nearby ? ' is-on' : ''}`}
          aria-pressed={nearby}
          onClick={() => setNearby(v => !v)}
        >
          {say("Dishes you'd rather not eat alone", '혼자보다 같이 먹고 싶은 음식', 'Platos que prefieres no comer solo', 'Les plats que vous préférez ne pas manger seul', 'أطباق تفضّل ألّا تأكلها وحدك', '你不太想一个人吃的菜', 'ひとりでは食べたくない料理')}
        </button>
        {nearby && DISH_GROUPS.map(g => (
          <span key={g.id} className="map-legend__item">
            <span className="map-legend__dot" style={{ background: g.tint }} aria-hidden="true" />
            {g.emoji} {say(g.en, g.ko, g.es, g.fr, g.ar, g.zh, g.ja)}
            <span className="map-legend__dishes" translate="no" data-no-locale>{g.ko_dishes}</span>
          </span>
        ))}
      </div>

      <div className="map-overlay__map">
        <MapComponent
          restaurants={restaurants}
          onMarkerClick={onRestaurantClick}
          selectedId={selectedId}
          onCenterChange={onCenterChange}
          showNearby={nearby}
        />
      </div>

      <div className="map-overlay__panel">
        {/* The fold. A full-width bar rather than a small chevron, because on
            a phone this is the control that decides whether the map is a
            keyhole or the screen. */}
        <button
          className="map-overlay__fold"
          aria-expanded={listOpen}
          onClick={() => setListOpen(v => !v)}
        >
          <span className="map-overlay__grip" aria-hidden="true" />
          <span className="map-overlay__fold-label">
            {listOpen
              ? say('Hide the list', '목록 접기', 'Ocultar la lista', 'Masquer la liste', 'إخفاء القائمة', '收起列表', 'リストをたたむ')
              : say('Show the list', '목록 펼치기', 'Mostrar la lista', 'Afficher la liste', 'إظهار القائمة', '展开列表', 'リストを開く')}
            <span className="map-overlay__fold-count">{restaurants.length.toLocaleString()}</span>
          </span>
          {listOpen ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16} />}
        </button>

        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedFilters={selectedFilters}
          onToggleFilter={onToggleFilter}
        />
        <section className="map-overlay__list" aria-label={say('Places on the map', '지도 위의 장소', 'Sitios en el mapa', 'Les adresses sur la carte', 'الأماكن على الخريطة', '地图上的地点', '地図上の場所')}>
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
