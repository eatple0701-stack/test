import React, { useState, useMemo, useEffect, useRef } from 'react';
import { restaurants } from './data/restaurants';
import MapOverlay from './components/MapOverlay';
import RestaurantDetail from './components/RestaurantDetail';
import TabBar from './components/TabBar';
import JournalPanel from './components/JournalPanel';
import HomeTab from './components/HomeTab';
import Prologue from './components/Prologue';
import TravelSummary from './components/TravelSummary';
import ThemeComplete from './components/ThemeComplete';
import TablesTab from './components/TablesTab';
import PlacesTab from './components/PlacesTab';
import TableCreate from './components/TableCreate';
import TableDetail from './components/TableDetail';
import TableRequest from './components/TableRequest';
import { getProfile, saveProfile } from './data/profile';
import { getStoredTheme, applyTheme, watchSystemTheme } from './data/theme.js';
// From the repository, not the profile module: it is the seam that knows
// whether there is a database to write to at all. On localStorage it is a
// no-op, so this code path is identical either way.
import { saveProfileFields, ensureProfile, getAuthState, signOutMember } from './data/tableRepository.js';
import { isMember, gateText } from './domain/policy/access.js';
import AuthSheet from './components/AuthSheet';
import { MAP_CENTER } from './utils';
import { pathFor, stateFromPath } from './routes.js';
import { matchesDietary, isQuarantined } from './data/verification';
import { journeyFromLegacy } from './domain/bridge/legacyJourney.js';
import { journeyProgress } from './domain/projection/journeyProgress.js';
import { passportRecord } from './domain/projection/passportRecord.js';
import { themeById, experienceById, experienceIdsOfTheme } from './domain/catalog/index.js';
import { experienceDone, themeCompletionKind } from './domain/policy/completion.js';
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

// Read once, before any state exists: a link somebody was sent names a screen,
// and the app has to start on it rather than on Explore and jump afterwards.
const opening = stateFromPath(typeof window === 'undefined' ? '/' : window.location.pathname);

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(
    () => activeRestaurants.find(r => r.id === opening.restaurantId) ?? null);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  // No setter: nothing in the app has written companions since the pivot, so
  // this is read-once from storage. Left in place rather than deleted because
  // journeyFromLegacy still reads it and old devices still have the key.
  const [companions] = useState(loadCompanions);
  const [visitedMarkets, setVisitedMarkets] = useState(loadMarkets);
  const [attestations, setAttestations] = useState(loadAttestations);
  const [activeTab, setActiveTab] = useState(opening.activeTab);
  const [mapCenter, setMapCenter] = useState(MAP_CENTER);
  const [focusStory, setFocusStory] = useState(false);
  const [prologueCompleted, setPrologueCompleted] = useState(
    () => localStorage.getItem('kfm-prologue') === 'true'
  );
  const [showSummary, setShowSummary] = useState(false);

  // 밥친구 navigation, kept local to the Tables tab rather than in the global
  // tab state — opening a table is a step inside that tab, not a fifth
  // destination, and switching tabs should not strand you mid-form.
  const [tableView, setTableView] = useState(opening.tableView);
  // Carried from a restaurant into the open-a-table form.
  const [tablePrefill, setTablePrefill] = useState(null);

  // Pressing a tab means "take me to that tab", and for 밥친구 that is the list
  // of tables. The state above was left where it stood, so a traveller who had
  // read one table, gone to Explore and pressed Tables again arrived back at
  // that same table instead of the tables — the nav pointing at a screen they
  // had already finished with, and no way to reach the list except Back.
  //
  // Only for the nav. Arriving at a specific table from Explore or from a
  // restaurant sets the view straight after and is meant to land there.
  const goToTab = (tab) => {
    if (tab === 'match') setTableView({ screen: 'list' });
    setActiveTab(tab);
  };
  // Stands in for a logged-in user until Supabase auth arrives. The id has to
  // stay stable for "this is your table" to mean anything, so it is read once
  // and only the name and nationality are ever written back.
  const [profile, setProfile] = useState(getProfile);

  // Adopt the signed-in identity, once, on the way in.
  //
  // getProfile() invents `u-<random>` for a browser that has never had one.
  // That was right while everything lived in localStorage and wrong the moment
  // it did not: every row the Supabase backend writes carries auth.uid(), so
  // the device kept comparing its own invented id against the real one and
  // never matched. Nothing crashed, which is why it survived — it just made
  // the app quietly unable to recognise anybody as themselves.
  //
  // What that actually looked like: a traveller could not see, cancel or
  // withdraw their own seat after a reload, because mySignup is found by
  // userId. joinBlocker never reached ALREADY_IN, so the seat form came back
  // and the second attempt died on the database's own unique constraint. And
  // a host was never the host of their own table — no cancel, no guest list
  // controls, and as of today no way to answer a seat request at all.
  //
  // ensureProfile was written for exactly this, exported through the
  // repository, and called from nowhere. Third time in this codebase: the
  // same shape as saveProfileFields above, and as ensureProfile's own note in
  // supabaseBackend.js. The parity test added with the seat requests counted
  // it as wired because tableRepository re-exports it — mentioned is not
  // called, and that test now knows the difference.
  // Who is holding the phone. 'none' until proven otherwise — and proving
  // otherwise no longer costs an account. Mounting used to sign every
  // visitor in anonymously, which is how a venue's shared wifi walks into
  // Supabase's 30-per-hour anonymous sign-in limit; getAuthState only reads.
  const [auth, setAuth] = useState({ kind: 'none' });
  // Which gate opened the sheet (its words come from AccessPolicy), or which
  // mode to open straight into — 'details' catches a Google member who has
  // not left a phone number yet.
  const [authDoor, setAuthDoor] = useState(null);
  const [authMode, setAuthMode] = useState(null);

  const refreshAuth = async () => {
    const state = await getAuthState().catch(() => ({ kind: 'none' }));
    setAuth(state);
    return state;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const state = await getAuthState().catch(() => ({ kind: 'none' }));
      if (!alive) return;
      setAuth(state);
      // Identity sync only where a session already exists — a returning
      // member, a restored anonymous browser, or Google landing back with
      // the session in the URL. A first-time browser stays costless.
      if (state.kind !== 'none') {
        try {
          const merged = await ensureProfile(getProfile());
          // Keep whatever this device knows and let the server settle
          // identity. A name typed before signing in must survive; the id
          // must not.
          if (alive && merged?.userId) setProfile(saveProfile({ ...getProfile(), ...merged }));
        } catch {
          // Offline; the app stays on its local id.
        }
      }
      // A Google member arrives with a name and an email and nothing the
      // matching team can call. One completion step, once.
      if (state.kind === 'member' && state.detailsComplete === false) {
        setAuthMode('details');
      }
    })();
    return () => { alive = false; };
  }, []);

  /** True if the door is open; otherwise opens the auth sheet and says why. */
  const requireMember = (door) => {
    if (isMember(auth)) return true;
    setAuthDoor(door);
    return false;
  };

  // Written to this device first, then to the database.
  //
  // Only the first half existed. saveProfileFields was implemented in the
  // Supabase backend, re-exported through the repository for both backends,
  // and called by nothing — the same shape of gap as ensureProfile. So the
  // Passport's settings looked like they saved, and did save, into a browser.
  // The profiles row stayed blank.
  //
  // Local first because the screen must not wait on a network round trip to
  // echo a keystroke back. The remote write is fire-and-forget for the same
  // reason: a failed sync should not throw away what somebody just typed, and
  // the next successful save carries the whole object anyway.
  const updateProfile = (next) => {
    const saved = saveProfile(next);
    setProfile(saved);
    saveProfileFields({
      name: saved.name ?? '',
      nationality: saved.nationality ?? '',
      languages: saved.languages ?? [],
      gender: saved.gender ?? null,
      rulesVersion: saved.rulesVersion ?? null,
      rulesAgreedAt: saved.rulesAgreedAt ?? null,
    }).catch(() => { /* stays on the device; the next save tries again */ });
    return saved;
  };

  // index.html already resolved and wrote the theme once, synchronously,
  // before this ever ran — the app boots on the right theme without needing
  // this effect. What this effect is for is keeping 'system' *live*: if the
  // OS switches at sunset while the tab stays open, nothing else re-runs
  // that resolution. A no-op for an explicit Light/Dark choice, see
  // watchSystemTheme's own guard.
  useEffect(() => {
    applyTheme(getStoredTheme());
    return watchSystemTheme();
  }, []);

  // The horizontal rows (dish grid, market cards, culture cards — every
  // `overflow-x: auto` in index.css) work fine on a touch screen: a swipe is
  // already the right gesture. On a laptop it was not — a foreign tester's
  // review named it directly: "터치패드를 이용하거나 마우스 휠을 누른 상태로
  // 움직여야 해서 조금 불편함". Nothing here is component-specific, and
  // nothing has to be: the fix is one place, applied to whichever row the
  // cursor happens to be over, rather than seven near-identical handlers
  // wired into seven components.
  //
  // Falls through to ordinary vertical scrolling once a row is already
  // scrolled to the edge in the direction asked for, rather than trapping
  // the wheel inside a short row a reader is just scrolling past — the same
  // reason this checks scrollLeft's position, not just whether the element
  // can scroll at all.
  useEffect(() => {
    const onWheel = (e) => {
      if (e.deltaY === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      let el = e.target;
      while (el && el !== document.body) {
        if (el.scrollWidth > el.clientWidth + 1) {
          const overflowX = getComputedStyle(el).overflowX;
          if (overflowX === 'auto' || overflowX === 'scroll') {
            const atStart = el.scrollLeft <= 0;
            const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
            if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) break;
            el.scrollLeft += e.deltaY;
            e.preventDefault();
            return;
          }
        }
        el = el.parentElement;
      }
    };
    // Not passive: redirecting the scroll requires being able to cancel it.
    document.addEventListener('wheel', onWheel, { passive: false });
    return () => document.removeEventListener('wheel', onWheel);
  }, []);

  // The map is a tool now, not the backdrop. `mapScope` records what the user
  // was looking at when they opened it, so the overlay can say which question
  // it is answering rather than presenting itself as the destination.
  const [mapOpen, setMapOpen] = useState(false);
  const [mapScope, setMapScope] = useState({ title: 'Explore on the map', subtitle: null });

  // Theme is a screen, not a sheet: it replaces the tab's content and has a
  // back affordance, rather than stacking another overlay on the pile.
  const [openThemeId, setOpenThemeId] = useState(opening.openThemeId);

  // ---------------------------------------------------------------------
  // The address bar
  // ---------------------------------------------------------------------
  // Everything above is screen state, and none of it used to reach the URL.
  // Two things broke for the people testing this: the phone's back button
  // left the app entirely, because every screen in a session shared one
  // address and the browser had nowhere to go back to; and a table could not
  // be sent to anybody, because there was no link to send. The second is not
  // a convenience — 핵심기능 5 is SNS 확산, and the product had no shareable
  // object in it at all.
  //
  // Written against the History API rather than a router, because the mapping
  // is nine paths over four pieces of state that already exist.
  const path = pathFor({
    activeTab, tableView, openThemeId, restaurantId: selectedRestaurant?.id ?? null,
  });

  // Push only when the address actually changes, or every render would add a
  // history entry and Back would walk on the spot.
  const lastPath = useRef(null);
  useEffect(() => {
    if (lastPath.current === path) return;
    // The first run adopts whatever is already in the bar — a shared link —
    // instead of pushing a duplicate on top of it.
    if (lastPath.current === null) window.history.replaceState({ path }, '', path);
    else window.history.pushState({ path }, '', path);
    lastPath.current = path;
  }, [path]);

  // Back and forward. Applied to state rather than reloading, so the trip is
  // instant and nothing already fetched is thrown away.
  useEffect(() => {
    const onPop = () => {
      const next = stateFromPath(window.location.pathname);
      lastPath.current = window.location.pathname;
      setOpenThemeId(next.openThemeId);
      setActiveTab(next.activeTab);
      setTableView(next.tableView);
      if (!next.restaurantId) setSelectedRestaurant(null);
      else {
        const found = activeRestaurants.find(r => r.id === next.restaurantId);
        setSelectedRestaurant(found ?? null);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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
  // Marking a place visited saves it too, if it was not saved already.
  //
  // A visit used to be a field on a bookmark record, so the control was
  // disabled until you had hearted the place first — with nothing on screen
  // saying so. The theme page tells you "mark a place visited to complete
  // this step", you go to the place, and the button is grey. That was the
  // only route through the culture half of the app, and it was a dead end
  // for anybody who did not guess the prerequisite.
  //
  // Having been somewhere implies having been interested in it, so the save
  // is created rather than demanded.
  const handleToggleVisited = (id) => {
    setBookmarks(prev => {
      const existing = prev.find(b => b.id === id);
      if (!existing) {
        return [...prev, { id, savedAt: Date.now(), visitedAt: Date.now() }];
      }
      return prev.map(b => (b.id === id
        ? {
            ...b,
            savedAt: b.savedAt ?? Date.now(),
            visitedAt: b.visitedAt == null ? Date.now() : null,
          }
        : b));
    });
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
        onComplete={(choice) => {
          localStorage.setItem('kfm-prologue', 'true');
          setPrologueCompleted(true);
          // The front door offers joining but never demands it — 비로그인으로
          // 둘러보기 is a real choice, not a hidden link. Somebody here for
          // the map and the tips owes the app nothing.
          if (choice === 'join' && !isMember(auth)) setAuthMode('choose');
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
            onFindTable={() => { setOpenThemeId(null); setActiveTab('match'); setTableView({ screen: 'list' }); }}
          />
        )}

        {!openThemeId && activeTab === 'home' && (
          <HomeTab
            onNavigate={goToTab}
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
            onOpenTable={(id) => {
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
            /* Gated at the handler rather than inside the screen: the list
               itself is browsing and stays open, the two doors out of it are
               participation. requireMember opens the auth sheet with the
               right words when the answer is no. */
            onCreateTable={() => {
              if (!requireMember('open-table')) return;
              setTablePrefill(null); setTableView({ screen: 'create' });
            }}
            onRequestTable={() => {
              if (!requireMember('request-table')) return;
              setTableView({ screen: 'request' });
            }}
            onOpenTable={(id) => setTableView({ screen: 'detail', tableId: id })}
          />
        )}
        {!openThemeId && activeTab === 'match' && tableView.screen === 'request' && (
          <TableRequest
            profile={profile}
            onBack={() => setTableView({ screen: 'list' })}
            onOpenTable={(id) => setTableView({ screen: 'detail', tableId: id })}
            /* A want nobody answered, carried into the form as a table. */
            onOpenAsHost={(prefill) => { setTablePrefill(prefill); setTableView({ screen: 'create' }); }}
          />
        )}
        {!openThemeId && activeTab === 'match' && tableView.screen === 'create' && (
          <TableCreate
            prefill={tablePrefill}
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
            auth={auth}
            onRequireAuth={(door) => setAuthDoor(door)}
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
        {/* The Passport belongs to somebody — 8/3's decision. The gate shows
            the same open-browsing reassurance every gate does, because the
            professor's point about the front door applies here too: locked
            out of one tab must never read as locked out of the app. */}
        {!openThemeId && activeTab === 'journal' && !isMember(auth) && (
          <div className="member-gate">
            <h3 className="member-gate__title">{gateText('passport').title}</h3>
            <p className="member-gate__body">{gateText('passport').body}</p>
            <button className="auth-primary" onClick={() => setAuthDoor('passport')}>
              {gateText('passport').cta}
            </button>
          </div>
        )}
        {!openThemeId && activeTab === 'journal' && isMember(auth) && (
          <JournalPanel
            bookmarks={bookmarks}
            companions={companions}
            mapCenter={mapCenter}
            onRestaurantClick={openDetail}
            onNavigate={goToTab}
            journey={journey}
            profile={profile}
            onProfileChange={updateProfile}
            attestations={attestations}
            visitedMarkets={visitedMarkets}
            onOpenSummary={() => setShowSummary(true)}
            onOpenTheme={setOpenThemeId}
            /* The Set-shaped journey the completion policy reads. The other
               `journey` prop above is the legacy projection the stats use. */
            domainJourney={domainJourney}
            auth={auth}
            onSignOut={async () => {
              await signOutMember().catch(() => {});
              await refreshAuth();
            }}
          />
        )}
        {/* The Profile tab used to render here. It is a section at the bottom
            of the Passport now — the 8/2 meeting's decision, and the same
            thing a foreign tester asked for independently. */}

      </div>

      {/* Selecting a tab leaves the theme screen. Without this the tab bar
          looks dead while a theme is open, since the theme route guards
          every tab's content. */}
      <TabBar
        activeTab={activeTab}
        onSelect={(tab) => { setOpenThemeId(null); goToTab(tab); }}
      />

      {/* The membership door, wherever it was knocked on from. onAuthed runs
          the same identity sync the mount effect does, because a fresh member
          needs their server id in the local profile before the next screen
          reads it. */}
      {(authDoor || authMode) && (
        <AuthSheet
          door={authDoor}
          initialMode={authMode ?? undefined}
          profile={profile}
          onProfileChange={updateProfile}
          onClose={() => { setAuthDoor(null); setAuthMode(null); }}
          onAuthed={async () => {
            const state = await refreshAuth();
            if (state.kind === 'member') {
              try {
                const merged = await ensureProfile(getProfile());
                if (merged?.userId) setProfile(saveProfile({ ...getProfile(), ...merged }));
              } catch { /* offline; next load syncs */ }
            }
          }}
        />
      )}

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
        onOpenTableHere={(r) => {
          setTablePrefill({
            restaurant: r.name.split('(')[0].trim(),
            place: r.address?.value ?? r.zone,
          });
          setSelectedRestaurant(null);
          setActiveTab('match');
          setTableView({ screen: 'create' });
        }}
        onOpenTable={(id) => {
          setSelectedRestaurant(null);
          setActiveTab('match');
          setTableView({ screen: 'detail', tableId: id });
        }}
        onToggleVisited={handleToggleVisited}
        mapCenter={mapCenter}
        focusStory={focusStory}
        onOpenRestaurant={openDetail}
        onExploreZone={goExplore}
        bookmarkedIds={bookmarkedIds}
        onNavigate={goToTab}
      />

      {showSummary && (
        <TravelSummary journey={journey} profile={profile} onClose={() => setShowSummary(false)} />
      )}

      {celebrateThemeId && (
        <ThemeComplete
          theme={themeById(celebrateThemeId)}
          remaining={(() => {
            const t = themeProgress.themes.find(x => x.themeId === celebrateThemeId);
            return t ? t.total - t.done : 0;
          })()}
          /* What actually backed the completion, so the stamp does not
             describe four taps and four meals with one sentence. */
          kind={themeCompletionKind(celebrateThemeId, domainJourney)}
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
