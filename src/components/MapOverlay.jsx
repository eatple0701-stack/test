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
  // The map as the 장소 tab rather than as something summoned over a
  // screen. Same map, same filters, same list — no dialog chrome, no close
  // button, and it fills the content region instead of covering it.
  asTab = false,
  // The two desktop rails, owned by App because the controls that fold them
  // live in the app chrome — a component cannot hold state a button outside
  // it presses.
  railsOpen = { left: true, right: true },
  onToggleRail,
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
  // As a tab the map names itself, in every language. App.jsx has no say()
  // — the scope titles it passes for the overlay are English-only strings,
  // which is a hole this deliberately does not widen.
  const heading = asTab
    ? say('Every place, plotted', '지도에 찍힌 모든 곳', 'Todos los sitios, en el mapa', 'Toutes les adresses, sur la carte', 'كل الأماكن على الخريطة', '所有地点，都在图上', 'すべての場所を地図に')
    : title;
  // On, because the point of the map is the 8,118 places on it. Off by
  // default meant opening the map and seeing twenty pins and an empty city,
  // with the whole import hidden behind a button nobody had reason to press.
  const [nearby, setNearby] = useState(true);
  // The list can be folded away. The map is 40vh of a phone with the list
  // open, which is a keyhole; folded it takes the whole overlay.
  //
  // Folded to start when this is the 장소 tab, and open when the map was
  // summoned over a screen. Summoning it is always about a scope somebody
  // just named — a theme, a zone, a search — so the answer is the list. The
  // tab is the map itself; opening it onto a half-height strip would be the
  // keyhole above, chosen on purpose.
  const [listOpen, setListOpen] = useState(!asTab);
  const leftOpen = railsOpen?.left !== false;
  const rightOpen = railsOpen?.right !== false;
  useEffect(() => {
    if (!open || asTab) return undefined;   // a tab has nothing to escape from
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, asTab]);

  // Leaflet measures its container on mount. Mounting only while open keeps
  // it from sizing itself against a hidden element, which is the classic way
  // this ends up rendering a grey box.
  if (!open && !asTab) return null;

  return (
    <div
      className={[
        'map-overlay',
        asTab && 'map-overlay--tab',
        !listOpen && 'is-folded',
        asTab && !leftOpen && 'is-left-folded',
        asTab && !rightOpen && 'is-right-folded',
      ].filter(Boolean).join(' ')}
      role={asTab ? undefined : 'dialog'}
      aria-modal={asTab ? undefined : 'true'}
      aria-label={heading}
    >
      {/* The bar is the overlay's, not the tab's. As a tab this sat above
          the map printing a title for a screen the tab bar had already
          named, and carrying two buttons that belong in the app chrome with
          every other app-level control. Removed from the tab 2026-09-04; the
          overlay still has both. */}
      {!asTab && (
        <header className="map-overlay__bar">
          <div className="map-overlay__heading">
            <h2>{heading}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {!asTab && (
            <button className="map-overlay__close" aria-label={say('Close map', '지도 닫기', 'Cerrar el mapa', 'Fermer la carte', 'أغلق الخريطة', '关闭地图', '地図を閉じる')} onClick={onClose}>
              <XIcon size={18} />
            </button>
          )}
        </header>
      )}

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
            {/* The group on its own line and its four dishes under it. The name
                used to be a bare text node between the swatch and the dishes,
                which is why it could not be given a line of its own — one row
                of dot, emoji, name and four dish names wrapped wherever it ran
                out of room, and 전골·탕 broke across two lines with 골 alone on
                the second. */}
            <span className="map-legend__head">
              <span className="map-legend__dot" style={{ background: g.tint }} aria-hidden="true" />
              <span className="map-legend__name">{g.emoji} {say(g.en, g.ko, g.es, g.fr, g.ar, g.zh, g.ja)}</span>
            </span>
            <span className="map-legend__dishes" translate="no" data-no-locale>{g.ko_dishes}</span>
          </span>
        ))}
      </div>

      {/* One handle per rail, sitting on the seam between that rail and the
          map. The app chrome carries the same two switches; these are the
          ones you reach for while looking at the thing you want more of.
          The arrow points the way the rail will go, and turns round when it
          has gone — so the control that collapsed a rail is also the one
          that brings it back, in the same place. */}
      {asTab && (
        <>
          <button
            type="button"
            className={`map-overlay__edge map-overlay__edge--left${leftOpen ? '' : ' is-folded'}`}
            aria-expanded={leftOpen}
            aria-label={leftOpen
              ? say('Hide the filters', '필터 접기', 'Ocultar los filtros', 'Masquer les filtres', 'إخفاء عوامل التصفية', '收起筛选', '絞り込みをたたむ')
              : say('Show the filters', '필터 펼치기', 'Mostrar los filtros', 'Afficher les filtres', 'إظهار عوامل التصفية', '展开筛选', '絞り込みを開く')}
            onClick={() => onToggleRail?.('left')}
          >
            <span aria-hidden="true">{leftOpen ? '‹' : '›'}</span>
          </button>
          <button
            type="button"
            className={`map-overlay__edge map-overlay__edge--right${rightOpen ? '' : ' is-folded'}`}
            aria-expanded={rightOpen}
            aria-label={rightOpen
              ? say('Hide the list', '목록 접기', 'Ocultar la lista', 'Masquer la liste', 'إخفاء القائمة', '收起列表', 'リストをたたむ')
              : say('Show the list', '목록 펼치기', 'Mostrar la lista', 'Afficher la liste', 'إظهار القائمة', '展开列表', 'リストを開く')}
            onClick={() => onToggleRail?.('right')}
          >
            <span aria-hidden="true">{rightOpen ? '›' : '‹'}</span>
          </button>
        </>
      )}

      <div className="map-overlay__map">
        <MapComponent
          restaurants={restaurants}
          onMarkerClick={onRestaurantClick}
          selectedId={selectedId}
          onCenterChange={onCenterChange}
          showNearby={nearby}
          query={searchQuery}
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
          showChips={!asTab}
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
