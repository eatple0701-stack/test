import React from 'react';

const icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 10.5 8-6.5 8 6.5" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  match: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11h13a0 0 0 0 1 0 0 6.5 6.5 0 0 1-6.5 6.5h0A6.5 6.5 0 0 1 3 11z" />
      <path d="M20.5 4.5 18 12" />
      <path d="M5.5 20.5h12" />
    </svg>
  ),
  places: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.1 5-5 2.1 2.1-5z" />
    </svg>
  ),
  journal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
      <path d="M5 4v14" />
      <path d="M9 8h5M9 12h5" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  ),
};

// The map is no longer a destination. It was a top-level tab while it was
// also the app's backdrop; now it is a tool opened from wherever the user
// already is, so it has no place in primary navigation.
// "Community" was a swipe deck of generated strangers. The product is the
// table: a dish you cannot order alone, and the people already going to eat
// it. Naming the tab after the thing being offered rather than after the
// social feature is the difference between a listings app and this one.
const tabs = [
  { id: 'home', label: 'Explore' },
  { id: 'match', label: 'Tables' },
  { id: 'places', label: 'Places' },
  // Profile was a fifth tab and is now a section at the bottom of the
  // Passport. Both the 8/2 meeting and a foreign tester asked for the merge,
  // independently — and four labels fit a 375px bar without crowding.
  { id: 'journal', label: 'Passport' },
];

export default function TabBar({ activeTab, onSelect, isCollapsed }) {
  return (
    <nav className="tab-bar" aria-label="Primary">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-item${activeTab === t.id ? ' active' : ''}`}
          aria-current={activeTab === t.id ? 'page' : undefined}
          onClick={() => onSelect(t.id)}
          title={isCollapsed ? t.label : undefined}
        >
          {icons[t.id]}
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
