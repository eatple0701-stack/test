import React, { useState, useMemo, useEffect } from 'react';
import { restaurants } from './data/restaurants';
import MapOverlay from './components/MapOverlay';
import RestaurantDetail from './components/RestaurantDetail';
import TabBar from './components/TabBar';
import TabPanel from './components/TabPanel';
import JournalPanel from './components/JournalPanel';
import HomeTab from './components/HomeTab';
import MatchTab from './components/MatchTab';
import Prologue from './components/Prologue';
import TravelSummary from './components/TravelSummary';
import { MAP_CENTER } from './utils';
import { matchesDietary, isQuarantined } from './data/verification';
import { computeJourney } from './data/journey';
import './index.css';
import './custom.css';

// Dietary chips are answered by the structured dietary record (never a tag
// string); the rest are descriptive traits.
const DIETARY_CHIPS = ['Vegan', 'Halal'];

// A group chip matches *any* trait in its set, which is the one place chips
// are not AND-ed. Sustainability exists because its two members are narrow
// enough that selecting both returns nothing — the group is the way to browse
// the axis, the members are still there to narrow within it.
const TRAIT_GROUPS = {
  Sustainability: ['Zero-waste', 'Local Sourcing'],
};

// Selecting anything on the sustainability axis — the group chip or either
// member — turns the list into a lens: each card states, in the restaurant's
// own recorded words, why it is here. Nothing new is written for this; the
// line is the esg_point already shown on the detail page.
const SUSTAINABILITY_AXIS = ['Sustainability', ...TRAIT_GROUPS.Sustainability];

// Quarantined records (existence itself unconfirmed) are excluded from every
// discovery surface — map, search, cards, Journal — at this single point.
const activeRestaurants = restaurants.filter(r => !isQuarantined(r));

const BOOKMARKS_KEY = 'kfm-bookmarks';

// Stored as [{ id, savedAt, visitedAt }]. Two earlier shapes migrate on read:
// { id, savedAt } (saved, never marked visited) and plain id strings (saved,
// no timestamp). savedAt is the wishlist; visitedAt is the visit record, and a
// visit only exists on a saved entry: visitedAt != null implies savedAt != null.
//
// Legacy string entries normalise to savedAt: 0, "saved at an unknown time",
// rather than null: that keeps "is it saved" a plain savedAt test with no
// legacy special case, and 0 is falsy so date rendering is unchanged.
function loadBookmarks() {
  try {
    const saved = JSON.parse(localStorage.getItem(BOOKMARKS_KEY));
    if (!Array.isArray(saved)) return [];
    return saved
      .map(entry => (typeof entry === 'string' ? { id: entry, savedAt: 0 } : entry))
      .filter(entry => entry && typeof entry.id === 'string')
      .map(entry => ({ ...entry, savedAt: entry.savedAt ?? 0, visitedAt: entry.visitedAt ?? null }));
  } catch {
    return [];
  }
}

const MARKETS_KEY = 'kfm-markets';

// Markets aren't restaurant records (no hours, menu or dietary facts to
// verify), so a market visit is tracked as its own list of ids rather than
// forced into the bookmark shape. Stored as [marketId].
function loadMarkets() {
  try {
    const saved = JSON.parse(localStorage.getItem(MARKETS_KEY));
    return Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

const COMPANIONS_KEY = 'kfm-companions';

// Stored as [{ travelerId, matchedAt }] — logged whenever "Eat together" is
// confirmed in Match. Journal reads this alongside bookmarks to show who was
// met, separate from where was visited.
function loadCompanions() {
  try {
    const saved = JSON.parse(localStorage.getItem(COMPANIONS_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter(entry => entry && typeof entry.travelerId === 'string');
  } catch {
    return [];
  }
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const [companions, setCompanions] = useState(loadCompanions);
  const [visitedMarkets, setVisitedMarkets] = useState(loadMarkets);
  const [activeTab, setActiveTab] = useState('home');
  const [mapCenter, setMapCenter] = useState(MAP_CENTER);
  const [focusStory, setFocusStory] = useState(false);
  const [prologueCompleted, setPrologueCompleted] = useState(
    () => localStorage.getItem('kfm-prologue') === 'true'
  );
  const [showSummary, setShowSummary] = useState(false);

  // The map is a tool now, not the backdrop. `mapScope` records what the user
  // was looking at when they opened it, so the overlay can say which question
  // it is answering rather than presenting itself as the destination.
  const [mapOpen, setMapOpen] = useState(false);
  const [mapScope, setMapScope] = useState({ title: 'Explore on the map', subtitle: null });

  const openMap = (scope = {}) => {
    setMapScope({
      title: scope.title ?? 'Explore on the map',
      subtitle: scope.subtitle ?? null,
    });
    setMapOpen(true);
  };

  // Single choke point for every path that opens detail (map pin, card,
  // Journal stamp/next-stop) — a quarantined restaurant is a no-op here
  // rather than rendering unverified detail.
  const openDetail = (r) => { if (isQuarantined(r)) return; setSelectedRestaurant(r); setFocusStory(false); };
  const openStory = (r) => { if (isQuarantined(r)) return; setSelectedRestaurant(r); setFocusStory(true); };

  useEffect(() => {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem(COMPANIONS_KEY, JSON.stringify(companions));
  }, [companions]);

  useEffect(() => {
    localStorage.setItem(MARKETS_KEY, JSON.stringify(visitedMarkets));
  }, [visitedMarkets]);

  const bookmarkedIds = useMemo(() => bookmarks.map(b => b.id), [bookmarks]);
  const visitedIds = useMemo(
    () => bookmarks.filter(b => b.visitedAt !== null).map(b => b.id),
    [bookmarks],
  );

  // The one place trip progress is derived. Home, Journal and the summary
  // card all read this, so they can never disagree about how far along the
  // trip is.
  const journey = useMemo(() => computeJourney({
    visitedPlaces: visitedIds.map(id => activeRestaurants.find(r => r.id === id)).filter(Boolean),
    markets: visitedMarkets,
    companions,
  }), [visitedIds, visitedMarkets, companions]);

  const handleToggleMarket = (marketId) => {
    setVisitedMarkets(prev =>
      prev.includes(marketId) ? prev.filter(id => id !== marketId) : [...prev, marketId]
    );
  };
  const sustainabilityLens = useMemo(
    () => selectedFilters.some(f => SUSTAINABILITY_AXIS.includes(f)),
    [selectedFilters],
  );

  // Logged from Match's "Eat together" — re-matching the same traveler moves
  // their entry to the top rather than duplicating it in Journal.
  const handleAddCompanion = (traveler) => {
    setCompanions(prev => [
      { travelerId: traveler.id, matchedAt: Date.now() },
      ...prev.filter(c => c.travelerId !== traveler.id),
    ]);
  };

  // "Explore nearby" used to switch to a map tab. There is no map tab now:
  // the same intent opens the map as a tool, pre-filtered to what was asked
  // for, and closing it returns to whatever the user was reading.
  const goExplore = (query) => {
    setSearchQuery(query);
    openMap({ title: query, subtitle: 'Places matching this search' });
  };

  const handleToggleFilter = (filter) => {
    setSelectedFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
    setSelectedRestaurant(null);
  };

  const handleToggleBookmark = (id) => {
    setBookmarks(prev =>
      prev.some(b => b.id === id)
        ? prev.filter(b => b.id !== id)   // drops visitedAt with the entry
        : [...prev, { id, savedAt: Date.now(), visitedAt: null }]
    );
  };

  // Marking a visit only ever edits an entry that is already saved, so the
  // invariant (visitedAt implies savedAt) holds by construction — this can
  // never create a record. Unsaving drops the entry, taking the visit with it.
  const handleToggleVisited = (id) => {
    setBookmarks(prev => prev.map(b =>
      b.id === id && b.savedAt !== null
        ? { ...b, visitedAt: b.visitedAt === null ? Date.now() : null }
        : b
    ));
  };

  const filteredRestaurants = useMemo(() => {
    return activeRestaurants.filter(r => {
      // 1. Filter chips (AND across chips). A dietary chip only matches on
      // evidence — an unknown dietary record never matches, so we never send
      // someone somewhere we can't vouch for. A group chip ORs within itself.
      const matchesChips = selectedFilters.length === 0 || selectedFilters.every(f => {
        if (DIETARY_CHIPS.includes(f)) return matchesDietary(r, f);
        const group = TRAIT_GROUPS[f];
        return group ? r.traits.some(t => group.includes(t)) : r.traits.includes(f);
      });

      // 2. Search Query Filtering (Match name, vibe or area)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === '' ||
                            r.name.toLowerCase().includes(query) ||
                            r.vibe.toLowerCase().includes(query) ||
                            r.zone.toLowerCase().includes(query);

      return matchesChips && matchesSearch;
    });
  }, [selectedFilters, searchQuery]);

  if (!prologueCompleted) {
    return (
      <Prologue 
        onComplete={() => {
          localStorage.setItem('kfm-prologue', 'true');
          setPrologueCompleted(true);
        }} 
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Content is the substrate now. The map used to sit behind every screen
          — at `inset: 0` on mobile, holding most of the viewport on desktop —
          which made a culture platform read as a maps product. It is summoned
          from here instead, by whichever surface wants it. */}
      <div className="content-region">
        {activeTab === 'home' && (
          <HomeTab
            onNavigate={setActiveTab}
            onOpenRestaurant={openDetail}
            onOpenStory={openStory}
            onExploreZone={goExplore}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            journey={journey}
            visitedMarkets={visitedMarkets}
            onToggleMarket={handleToggleMarket}
            onOpenSummary={() => setShowSummary(true)}
            onOpenMap={openMap}
          />
        )}
        {activeTab === 'match' && (
          <MatchTab onMatch={handleAddCompanion} onNavigate={setActiveTab} />
        )}
        {activeTab === 'journal' && (
          <JournalPanel
            bookmarks={bookmarks}
            companions={companions}
            mapCenter={mapCenter}
            onRestaurantClick={openDetail}
            onNavigate={setActiveTab}
            journey={journey}
            onOpenSummary={() => setShowSummary(true)}
          />
        )}
        {activeTab === 'profile' && (
          <TabPanel tab={activeTab} onNavigate={setActiveTab} />
        )}

      </div>

      <TabBar activeTab={activeTab} onSelect={setActiveTab} />

      <MapOverlay
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        title={mapScope.title}
        subtitle={mapScope.subtitle}
        restaurants={filteredRestaurants}
        mapCenter={mapCenter}
        onCenterChange={setMapCenter}
        selectedId={selectedRestaurant?.id}
        onRestaurantClick={openDetail}
        onReadStory={openStory}
        bookmarkedIds={bookmarkedIds}
        onToggleBookmark={handleToggleBookmark}
        sustainabilityLens={sustainabilityLens}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilters={selectedFilters}
        onToggleFilter={handleToggleFilter}
      />

      {/* Layer 2: Full-Screen Detail Modal */}
      <RestaurantDetail
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
        isBookmarked={selectedRestaurant ? bookmarkedIds.includes(selectedRestaurant.id) : false}
        onToggleBookmark={handleToggleBookmark}
        isVisited={selectedRestaurant ? visitedIds.includes(selectedRestaurant.id) : false}
        onToggleVisited={handleToggleVisited}
        mapCenter={mapCenter}
        focusStory={focusStory}
        onOpenRestaurant={openDetail}
        onExploreZone={goExplore}
        bookmarkedIds={bookmarkedIds}
        onNavigate={setActiveTab}
      />

      {showSummary && (
        <TravelSummary journey={journey} onClose={() => setShowSummary(false)} />
      )}

    </div>
  );
}
