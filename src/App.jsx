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
import { journeyFromLegacy } from './domain/bridge/legacyJourney.js';
import { journeyProgress } from './domain/projection/journeyProgress.js';
import { themeById, experienceById, experienceIdsOfTheme } from './domain/catalog/index.js';
import { experienceDone } from './domain/policy/completion.js';
import { reasonFor, themeOfTheDay } from './domain/policy/recommendation.js';
import ThemePage from './components/ThemePage';
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

const EXPERIENCES_KEY = 'kfm-experiences';

// Experiences a traveller has declared done themselves. The domain has
// accepted this route since Phase 0 — it is the only way an experience with
// no verified venue can ever complete — but nothing wrote the key until now,
// which left every preview theme permanently stuck. Stored as [experienceId].
function loadAttestations() {
  try {
    const saved = JSON.parse(localStorage.getItem(EXPERIENCES_KEY));
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
  const [attestations, setAttestations] = useState(loadAttestations);
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

  // Theme is a screen, not a sheet: it replaces the tab's content and has a
  // back affordance, rather than stacking another overlay on the pile.
  const [openThemeId, setOpenThemeId] = useState(null);

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

  useEffect(() => {
    localStorage.setItem(EXPERIENCES_KEY, JSON.stringify(attestations));
  }, [attestations]);

  const handleToggleAttestation = (experienceId) => {
    setAttestations(prev =>
      prev.includes(experienceId)
        ? prev.filter(id => id !== experienceId)
        : [...prev, experienceId]
    );
  };

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

  // Progress on the Theme axis, from the Phase 0 model. It runs beside
  // computeJourney rather than replacing it — the parity harness asserts the
  // two agree on the facts they share — and it answers the one question the
  // legacy engine cannot: which theme is this traveller in the middle of.
  //
  // Built from React state rather than by re-reading localStorage, so it
  // recomputes when a place is marked visited instead of going stale.
  const themeProgress = useMemo(
    () => journeyProgress(journeyFromLegacy({
      bookmarks,
      markets: visitedMarkets,
      companions,
      attestations,
    })),
    [bookmarks, visitedMarkets, companions, attestations],
  );

  // The Journey the domain policies consume, kept beside the projection so
  // ThemePage can ask whether each step is done.
  const domainJourney = useMemo(
    () => journeyFromLegacy({ bookmarks, markets: visitedMarkets, companions, attestations }),
    [bookmarks, visitedMarkets, companions, attestations],
  );

  // "Continue" must mean a theme genuinely underway. journeyProgress's
  // currentTheme falls back to the least-progressed theme when nothing has
  // been started, which for a first-run traveller would point at whichever
  // theme sorts first — a preview one with no venues. Requiring `explored`
  // keeps the resume state honest and lets the start state take over.
  //
  // "More to do" is `done < total`, not `!complete`. A theme completes when
  // any one of its narratives does, so finishing a short path can mark the
  // theme complete while experiences in it remain untouched — and telling a
  // traveller who just visited somewhere to "start your journey" would be
  // plainly wrong.
  const continueTheme = useMemo(() => {
    const started = themeProgress.themes.filter(t => t.explored && t.done < t.total);
    return started.sort((a, b) => b.pct - a.pct || a.themeId.localeCompare(b.themeId))[0] ?? null;
  }, [themeProgress]);

  // Derived from the continue theme rather than themeProgress.currentTheme,
  // which skips complete themes — the same mismatch that would leave a
  // resumable theme without a next step to name.
  const nextExperience = useMemo(() => {
    if (!continueTheme) return null;
    const id = experienceIdsOfTheme(continueTheme.themeId)
      .find(x => !experienceDone(experienceById(x), domainJourney));
    return id ? { id, title: experienceById(id)?.title ?? id } : null;
  }, [continueTheme, domainJourney]);

  // The start state and today's pick both need a theme that actually has
  // verified places behind it, so a traveller's first tap is never a dead end.
  // Zones the traveller has actually eaten in — the only honest basis for a
  // proximity-flavoured recommendation reason.
  const visitedZones = useMemo(
    () => [...new Set(visitedIds
      .map(id => activeRestaurants.find(r => r.id === id)?.zone)
      .filter(Boolean))],
    [visitedIds],
  );

  const suggestedTheme = useMemo(
    () => themeOfTheDay({
      exclude: [
        continueTheme?.themeId,
        // A theme with nothing left in it is not a suggestion.
        ...themeProgress.themes.filter(t => t.done >= t.total).map(t => t.themeId),
      ].filter(Boolean),
    }),
    [continueTheme, themeProgress],
  );

  const suggestedReason = useMemo(
    () => (suggestedTheme
      ? reasonFor(suggestedTheme, {
          visitedZones,
          hasStarted: Boolean(continueTheme),
        })
      : null),
    [suggestedTheme, visitedZones, continueTheme],
  );

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
      <div className="content-region" key={openThemeId ?? activeTab}>
        {/* A theme takes over the content area rather than opening over it. */}
        {openThemeId && (
          <ThemePage
            theme={themeById(openThemeId)}
            journey={domainJourney}
            onBack={() => setOpenThemeId(null)}
            onOpenRestaurant={openDetail}
            onToggleAttestation={handleToggleAttestation}
          />
        )}

        {!openThemeId && activeTab === 'home' && (
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
            onOpenTheme={setOpenThemeId}
            continueTheme={continueTheme}
            nextExperience={nextExperience}
            suggestedTheme={suggestedTheme}
            suggestedReason={suggestedReason}
          />
        )}
        {!openThemeId && activeTab === 'match' && (
          <MatchTab onMatch={handleAddCompanion} onNavigate={setActiveTab} />
        )}
        {!openThemeId && activeTab === 'journal' && (
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
        {!openThemeId && activeTab === 'profile' && (
          <TabPanel tab={activeTab} onNavigate={setActiveTab} />
        )}

      </div>

      {/* Selecting a tab leaves the theme screen. Without this the tab bar
          looks dead while a theme is open, since the theme route guards
          every tab's content. */}
      <TabBar
        activeTab={activeTab}
        onSelect={(tab) => { setOpenThemeId(null); setActiveTab(tab); }}
      />

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
