import React from 'react';
import { useText } from './localeText.js';

// Grouped so sustainability reads as an axis rather than two chips lost in a
// flat row. `Sustainability` matches either member (see TRAIT_GROUPS in
// App.jsx); the members stay, to narrow within the axis.
const CHIP_GROUPS = [
  { label: 'Dietary filters', chips: ['Vegan', 'Halal'] },
  { label: 'Sustainability filters', chips: ['Sustainability', 'Zero-waste', 'Local Sourcing'] },
  { label: 'Dining filters', chips: ['Mild Taste', 'Fermented'] },
];

export default function FilterBar({ selectedFilters, onToggleFilter, searchQuery, onSearchChange }) {
  const say = useText();
  return (
    <header className="home-header">
      <div className="search-field">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          placeholder={say('Search restaurants or neighborhoods', '식당이나 동네 검색', 'Busca restaurantes o barrios', 'Cherchez un restaurant ou un quartier', 'ابحث عن مطعم أو حيّ', '搜索餐厅或街区')}
          aria-label={say('Search restaurants or neighborhoods', '식당이나 동네 검색', 'Busca restaurantes o barrios', 'Cherchez un restaurant ou un quartier', 'ابحث عن مطعم أو حيّ', '搜索餐厅或街区')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="chip-row no-scrollbar">
        {CHIP_GROUPS.map(group => (
          <div key={group.label} className="chip-group" role="group" aria-label={group.label}>
            {group.chips.map(f => {
              const isActive = selectedFilters.includes(f);
              return (
                <button
                  key={f}
                  className={`chip${isActive ? ' active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => onToggleFilter(f)}
                >
                  {f}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </header>
  );
}
