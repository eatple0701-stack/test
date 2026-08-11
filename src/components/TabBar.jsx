import React from 'react';

const icons = {
  // The house went to Main when Main became the front door (2026-08-06);
  // Explore keeps the compass it always deserved — it is the tab you wander.
  main: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 10.5 8-6.5 8 6.5" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.1 5-5 2.1 2.1-5z" />
    </svg>
  ),
  match: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11h13a0 0 0 0 1 0 0 6.5 6.5 0 0 1-6.5 6.5h0A6.5 6.5 0 0 1 3 11z" />
      <path d="M20.5 4.5 18 12" />
      <path d="M5.5 20.5h12" />
    </svg>
  ),
  // A pin now, because the compass moved to Explore and two tabs wearing the
  // same icon is a bar that cannot be told apart at a glance.
  places: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-6.5-5.4-6.5-10.2A6.5 6.5 0 0 1 12 4.5a6.5 6.5 0 0 1 6.5 6.3C18.5 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.8" r="2.2" />
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
// The Korean label is not a second line. A five-item bar on a 375px screen
// has about 62px per item, which is one word — so 한국어 replaces the English
// rather than joining it, and only when somebody has asked for Korean on its
// own. In the bilingual default the bar reads exactly as it always has.
// Added 2026-08-11: the bar was English-only, so the one piece of navigation
// on every single screen was the one thing the language setting could not
// touch.
const tabs = [
  // 메인 — the front door, asked for by name on 2026-08-06 and styled on the
  // Meetup landing the team studied. English by default, like its four
  // siblings: the audience reads English, and the calendar already taught us
  // what one Korean-only label does to the person it matters most to.
  { id: 'main', label: 'Main', kr: '메인' },
  { id: 'home', label: 'Explore', kr: '문화' },
  { id: 'match', label: 'Tables', kr: '밥상' },
  { id: 'places', label: 'Places', kr: '장소' },
  // Profile was a fifth tab and is now a section at the bottom of the
  // Passport. Both the 8/2 meeting and a foreign tester asked for the merge,
  // independently — and four labels fit a 375px bar without crowding.
  { id: 'journal', label: 'Passport', kr: '여권' },
  // Settings was a fifth tab here for a day (2026-08-04) and moved out on
  // 2026-08-05, to the gear in the top-right of the app chrome beside 로그인.
  // Nothing was removed — the screen is the same screen. But primary
  // navigation is for places you go to do something, and a device preference
  // is not one of those; it was the fifth label squeezing four real ones on a
  // 375px bar down to 10.5px type. Its route, /settings, is unchanged.
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
          <span className="tab-label tab-label--en">{t.label}</span>
          <span className="tab-label l-ko-only" translate="no">{t.kr}</span>
        </button>
      ))}
    </nav>
  );
}
