import React, { useState, useMemo, useEffect, useRef } from 'react';
import { restaurants } from './data/restaurants';
import MapOverlay from './components/MapOverlay';
import RestaurantDetail from './components/RestaurantDetail';
import TabBar from './components/TabBar';
import TabPanel from './components/TabPanel';
import JournalPanel from './components/JournalPanel';
import HomeTab from './components/HomeTab';
import Prologue from './components/Prologue';
import TravelSummary from './components/TravelSummary';
import ThemeComplete from './components/ThemeComplete';
import TablesTab from './components/TablesTab';
import PlacesTab from './components/PlacesTab';
import TableCreate from './components/TableCreate';
import TableDetail from './components/TableDetail';
import { getProfile, saveProfile } from './data/profile';
import { MAP_CENTER } from './utils';
import { matchesDietary, isQuarantined } from './data/verification';
import { journeyFromLegacy } from './domain/bridge/legacyJourney.js';
import { journeyProgress } from './domain/projection/journeyProgress.js';
import { passportRecord } from './domain/projection/passportRecord.js';
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
// verify), so a market visit is tracked separately. Stored as [{id, at}];
// entries written before the Passport needed dates are bare id strings and
// are read as `at: 0` — done, but with no date to place on the timeline.
function loadMarkets() {
  try {
    const saved = JSON.parse(localStorage.getItem(MARKETS_KEY));
    if (!Array.isArray(saved)) return [];
    return saved
      .map(e => (typeof e === 'string' ? { id: e, at: 0 } : e))
      .filter(e => e && typeof e.id === 'string')
      .map(e => ({ id: e.id, at: e.at ?? 0 }));
  } catch {
    return [];
  }
}

const EXPERIENCES_KEY = 'kfm-experiences';

// Experiences a traveller has declared done themselves — the only route open
// to a theme with no verified venue. Stored as [{id, at}]; bare id strings
// from before the Passport needed dates read as `at: 0`.
function loadAttestations() {
  try {
    const saved = JSON.parse(localStorage.getItem(EXPERIENCES_KEY));
    if (!Array.isArray(saved)) return [];
    return saved
      .map(e => (typeof e === 'string' ? { id: e, at: 0 } : e))
      .filter(e => e && typeof e.id === 'string')
      .map(e => ({ id: e.id, at: e.at ?? 0 }));
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

  // 밥친구 navigation, kept local to the Tables tab rather than in the global
  // tab state — opening a table is a step inside that tab, not a fifth
  // destination, and switching tabs should not strand you mid-form.
  const [tableView, setTableView] = useState({ screen: 'list' });
  // Stands in for a logged-in user until Supabase auth arrives. The id has to
  // stay stable for "this is your table" to mean anything, so it is read once
  // and only the name and nationality are ever written back.
  const [profile, setProfile] = useState(getProfile);
  const updateProfile = (next) => setProfile(saveProfile(next));

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
      prev.some(e => e.id === experienceId)
        ? prev.filter(e => e.id !== experienceId)
        : [...prev, { id: experienceId, at: Date.now() }]
    );
  };

  const bookmarkedIds = useMemo(() => bookmarks.map(b => b.id), [bookmarks]);
  const visitedIds = useMemo(
    () => bookmarks.filter(b => b.visitedAt !== null).map(b => b.id),
    [bookmarks],
  );

  // The single source of truth for what this traveller has done. Everything
  // below is derived from it, so no two surfaces can disagree.
  //
  // Built from React state rather than by re-reading localStorage, so it
  // recomputes the moment a place is marked visited or a step is checked off.
  const domainJourney = useMemo(
    () => journeyFromLegacy({ bookmarks, markets: visitedMarkets, companions, attestations }),
    [bookmarks, visitedMarkets, companions, attestations],
  );

  // Counts and challenges — what Passport, Explore's challenge row and the
  // shareable summary read. Formerly computeJourney, which could only see
  // restaurant visits; this sees the whole Journey, so a step completed by
  // attestation reaches the Passport too.
  const journey = useMemo(() => passportRecord(domainJourney), [domainJourney]);

  // Progress on the Theme axis: which theme is underway and what comes next.
  const themeProgress = useMemo(() => journeyProgress(domainJourney), [domainJourney]);

  // Finishing a culture used to change one line of text and nothing else.
  // This watches the set of finished themes for a new arrival, so the moment a
  // theme completes the app can mark it — and so "you have just finished X"
  // becomes a thing it can honestly say. It is deliberately session-scoped:
  // "just" means during this visit, not "at some point in your trip".
  // `complete` is the domain's answer — a theme is finished when one of its
  // narratives is, which is not the same as having ticked every experience in
  // it. Counting `done >= total` instead would withhold the moment from a
  // traveller who walked a path to its end but left the optional detours.
  const completedThemeIds = useMemo(
    () => themeProgress.themes.filter(t => t.complete).map(t => t.themeId).sort().join(','),
    [themeProgress],
  );
  const seenCompleteRef = useRef(null);
  const [justCompletedThemeId, setJustCompletedThemeId] = useState(null);
  // Separate from the above: the card is dismissed, the fact is not. Closing
  // the celebration should not make the app forget what was just finished.
  const [celebrateThemeId, setCelebrateThemeId] = useState(null);

  useEffect(() => {
    const now = new Set(completedThemeIds ? completedThemeIds.split(',') : []);
    // The first pass records what was already finished before this session, so
    // reopening the app does not congratulate a traveller for old work.
    if (seenCompleteRef.current === null) {
      seenCompleteRef.current = now;
      return;
    }
    const fresh = [...now].find(id => !seenCompleteRef.current.has(id));
    seenCompleteRef.current = now;
    if (fresh) {
      setJustCompletedThemeId(fresh);
      setCelebrateThemeId(fresh);
    }
  }, [completedThemeIds]);

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
    () => {
      if (!suggestedTheme) return null;
      const entry = themeProgress.themes.find(t => t.themeId === suggestedTheme.id);
      return reasonFor(suggestedTheme, {
        visitedZones,
        hasStarted: Boolean(continueTheme),
        justFinished: justCompletedThemeId ? themeById(justCompletedThemeId) : null,
        untouched: (entry?.done ?? 0) === 0,
        hasAnyProgress: journey.experienceCount > 0,
      });
    },
    [suggestedTheme, visitedZones, continueTheme, themeProgress, justCompletedThemeId, journey],
  );

  const handleToggleMarket = (marketId) => {
    setVisitedMarkets(prev =>
      prev.some(e => e.id === marketId)
        ? prev.filter(e => e.id !== marketId)
        : [...prev, { id: marketId, at: Date.now() }]
    );
  };
  const sustainabilityLens = useMemo(
    () => selectedFilters.some(f => SUSTAINABILITY_AXIS.includes(f)),
    [selectedFilters],
  );

  // Logged from Match's "Eat together" — re-matching the same traveler moves
  // their entry to the top rather than duplicating it in Journal.
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
            visitedMarkets={visitedMarkets}
            onToggleMarket={handleToggleMarket}
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
            themeProgress={themeProgress}
            profile={profile}
            onOpenTodayTable={(id) => {
              setActiveTab('match');
              setTableView({ screen: 'detail', tableId: id });
            }}
          />
        )}
        {/* 밥친구. The tab leads with tables now — a dish somebody cannot
            order alone is the product, and the swipe deck was a demo of
            people rather than a way to eat. The deck is still reachable from
            the table list, so nothing that existed has gone away. */}
        {!openThemeId && activeTab === 'match' && tableView.screen === 'list' && (
          <TablesTab
            profile={profile}
            onCreateTable={() => setTableView({ screen: 'create' })}
            onOpenTable={(id) => setTableView({ screen: 'detail', tableId: id })}
          />
        )}
        {!openThemeId && activeTab === 'match' && tableView.screen === 'create' && (
          <TableCreate
            profile={profile}
            onProfileChange={updateProfile}
            onBack={() => setTableView({ screen: 'list' })}
            onCreated={(id) => setTableView({ screen: 'detail', tableId: id })}
          />
        )}
        {!openThemeId && activeTab === 'match' && tableView.screen === 'detail' && (
          <TableDetail
            tableId={tableView.tableId}
            profile={profile}
            onProfileChange={updateProfile}
            onBack={() => setTableView({ screen: 'list' })}
            onOpenTheme={(id) => { setTableView({ screen: 'list' }); setActiveTab('home'); setOpenThemeId(id); }}
          />
        )}
        {!openThemeId && activeTab === 'places' && (
          <PlacesTab
            onOpenRestaurant={openDetail}
            onOpenStory={openStory}
            onExploreZone={goExplore}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            visitedMarkets={visitedMarkets}
            onToggleMarket={handleToggleMarket}
            onOpenMap={openMap}
          />
        )}
        {!openThemeId && activeTab === 'journal' && (
          <JournalPanel
            bookmarks={bookmarks}
            companions={companions}
            mapCenter={mapCenter}
            onRestaurantClick={openDetail}
            onNavigate={setActiveTab}
            journey={journey}
            profile={profile}
            attestations={attestations}
            visitedMarkets={visitedMarkets}
            onOpenSummary={() => setShowSummary(true)}
          />
        )}
        {!openThemeId && activeTab === 'profile' && (
          <TabPanel tab={activeTab} profile={profile} onProfileChange={updateProfile} onNavigate={setActiveTab} />
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

      {celebrateThemeId && (
        <ThemeComplete
          theme={themeById(celebrateThemeId)}
          remaining={(() => {
            const t = themeProgress.themes.find(x => x.themeId === celebrateThemeId);
            return t ? t.total - t.done : 0;
          })()}
          next={suggestedTheme}
          nextReason={suggestedReason}
          onClose={() => setCelebrateThemeId(null)}
          onOpenNext={(theme) => {
            setCelebrateThemeId(null);
            setActiveTab('home');
            setOpenThemeId(theme.id);
          }}
        />
      )}

    </div>
  );
}
