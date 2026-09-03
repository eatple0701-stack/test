import React, { useState, useMemo, useEffect, useRef } from 'react';
import { restaurants } from './data/restaurants';
import { menuById } from './domain/catalog/menus.js';
import { menuIdOfDish } from './domain/catalog/dishGroups.js';
import { loadRegistryPlaces, servesGroup } from './data/seoulRegistry.js';
import MapOverlay from './components/MapOverlay';
import RestaurantDetail from './components/RestaurantDetail';
import TabBar from './components/TabBar';
import { waitingCount } from './domain/policy/waiting.js';
import { listTables as loadTables, listAllSignups as loadSignups } from './data/tableRepository.js';
import MainTab from './components/MainTab';
import { GearIcon } from './components/Icons';
import JournalPanel from './components/JournalPanel';
import HomeTab from './components/HomeTab';
import TravelSummary from './components/TravelSummary';
import ThemeComplete from './components/ThemeComplete';
import TablesTab from './components/TablesTab';
import PlacesTab from './components/PlacesTab';
import TableCreate from './components/TableCreate';
import TableDetail from './components/TableDetail';
import TableRequest from './components/TableRequest';
import { getProfile, saveProfile } from './data/profile';
import { getStoredTheme, applyTheme, watchSystemTheme } from './data/theme.js';
import { getStoredLocale, setStoredLocale } from './data/locale.js';
import LocaleFilter from './components/LocaleFilter';
import { LocaleContext } from './components/localeText.js';
import AnimalAvatar from './components/AnimalAvatar.jsx';
import { LOCALE } from './domain/policy/locale.js';
// From the repository, not the profile module: it is the seam that knows
// whether there is a database to write to at all. On localStorage it is a
// no-op, so this code path is identical either way.
import {
  saveProfileFields, ensureProfile, getAuthState, signOutMember, onAuthChange,
} from './data/tableRepository.js';
import { isMember } from './domain/policy/access.js';
import AuthSheet from './components/AuthSheet';
import SettingsTab from './components/SettingsTab';
import OfflineBar from './components/OfflineBar';
import NoticeBar from './components/NoticeBar';
import { MAP_CENTER } from './utils';
import { pathFor, stateFromPath, hasAuthPayload } from './routes.js';
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
  // The interface language, held here so Settings can change it and every
  // screen feels it at once. A device preference like the theme, not a
  // profile field — see src/data/locale.js.
  const [locale, setLocaleState] = useState(getStoredLocale);
  // The top-right corner fits one word per button, so this picks rather than
  // pairs — the Korean is the bilingual default because that is what the team
  // has always seen there, and each single-language setting replaces it.
  // The same picker useText() hands every component, written out here
  // because App renders the provider and so sits outside it. Same order,
  // same English fallback — a second implementation that disagreed would be
  // worse than none.
  const say = (en, ko, es, fr, ar, zh, ja) => {
    if (locale === LOCALE.KO && ko) return ko;
    if (locale === LOCALE.ES && es) return es;
    if (locale === LOCALE.FR && fr) return fr;
    if (locale === LOCALE.AR && ar) return ar;
    if (locale === LOCALE.ZH && zh) return zh;
    if (locale === LOCALE.JA && ja) return ja;
    return en;
  };
  const chromeWord = (kr, en, es, fr, ar, zh, ja) => {
    if (locale === LOCALE.EN) return en;
    if (locale === LOCALE.ES) return es;
    if (locale === LOCALE.FR) return fr;
    if (locale === LOCALE.AR) return ar;
    if (locale === LOCALE.ZH) return zh;
    if (locale === LOCALE.JA) return ja;
    return kr;
  };
  const [mapCenter, setMapCenter] = useState(MAP_CENTER);
  const [focusStory, setFocusStory] = useState(false);
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
  // How many people are waiting for this person to answer a seat request.
  // Lives here rather than in TablesTab because the dot has to be visible
  // from every screen — a host on the Passport or Places tab is exactly the
  // host who does not know somebody is waiting. Read once per tab change:
  // there is no realtime channel, and the alternative to a cheap re-read is
  // a promise the app cannot keep. See src/domain/policy/waiting.js.
  const [waiting, setWaiting] = useState(0);

  // Recomputed whenever the tab changes or the signed-in person does. Both
  // reads are ones the Tables screen makes anyway, so a host who is already
  // there pays nothing new; from another tab this is the only thing that can
  // tell them somebody is waiting.
  useEffect(() => {
    let alive = true;
    if (!profile?.userId) { setWaiting(0); return undefined; }
    (async () => {
      // Silent on failure: a missing table or a schema a migration behind
      // must not take the navigation down with it, and the honest degraded
      // state is no dot rather than a wrong one.
      const [t, sg] = await Promise.all([loadTables().catch(() => []), loadSignups().catch(() => [])]);
      if (alive) setWaiting(waitingCount(t, sg, profile.userId));
    })();
    return () => { alive = false; };
  }, [activeTab, profile?.userId]);
  // Which gate opened the sheet (its words come from AccessPolicy), or which
  // mode to open straight into — 'details' catches a Google member who has
  // not left a phone number yet.
  const [authDoor, setAuthDoor] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  // 'idle' | 'saving' | 'saved' | 'device' — what the Passport's profile
  // section is allowed to claim about the last change somebody made.
  const [profileSave, setProfileSave] = useState('idle');

  const refreshAuth = async () => {
    const state = await getAuthState().catch(() => ({ kind: 'none' }));
    setAuth(state);
    return state;
  };

  useEffect(() => {
    let alive = true;

    const sync = async (event) => {
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
      // matching team can call. Asked once, at the moment they arrive — and
      // never again if they close it.
      //
      // It used to reopen on every load, because "details are missing" is
      // true on every load until they are filled, and that was the only
      // condition. A modal that returns after being dismissed is not asking,
      // it is nagging; the honest place for a required field is the moment
      // it becomes required, which is asking for a seat (see requireMember).
      if (state.kind === 'member' && state.detailsComplete === false
          && event !== 'TOKEN_REFRESHED'
          && getProfile().detailsDeferredFor !== state.userId) {
        setAuthMode('details');
      }
    };

    sync('MOUNT');

    // Reading the session once, at mount, was the bug behind "I signed in
    // with Google and the app still says 로그인" (2026-08-04). The session
    // arrives in the URL and is exchanged asynchronously, so the mount-time
    // read can and did finish first — and nothing ever asked again. The
    // subscription also covers what a one-shot read could never see: a token
    // refreshing, and another tab signing in or out.
    const unsubscribe = onAuthChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT'
          || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        sync(event);
      }
    });

    return () => { alive = false; unsubscribe?.(); };
  }, []);

  /** True if the door is open; otherwise opens the auth sheet and says why. */
  const requireMember = (door) => {
    if (!isMember(auth)) {
      setAuthDoor(door);
      return false;
    }
    // A member who deferred the contact details still has to leave them
    // before taking part — that is the whole reason the app asks. Here it is
    // not a nag: they just pressed the button that needs it, and the sheet
    // explains itself. Browsing and the Passport never reach this.
    if (auth.detailsComplete === false) {
      setAuthMode('details');
      return false;
    }
    return true;
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
    // Say so on screen. There is no Save button here — every tap writes —
    // and a form that saves silently is a form people fill in twice because
    // they cannot tell whether the first time counted. Asked on 8/4: "설정만
    // 하고 저장은 어떻게 해?", which is the interface failing, not the person.
    setProfileSave('saving');
    saveProfileFields({
      name: saved.name ?? '',
      nationality: saved.nationality ?? '',
      languages: saved.languages ?? [],
      gender: saved.gender ?? null,
      rulesVersion: saved.rulesVersion ?? null,
      rulesAgreedAt: saved.rulesAgreedAt ?? null,
    })
      .then(() => setProfileSave('saved'))
      // Kept, not lost: the device has it and the next change sends the whole
      // object again. Saying "저장됨" here would be the app claiming a write
      // that did not land.
      .catch(() => setProfileSave('device'));
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
  //
  // Except for one address the app does not own: the one an identity
  // provider hands back. `?code=` is the PKCE flow this project uses;
  // `#access_token=` is the implicit form, still worth matching because a
  // recovery or invite link arrives that way; `error_description` is what a
  // refusal looks like, and it has to survive too or the failure is silent.
  const path = pathFor({
    activeTab, tableView, openThemeId, restaurantId: selectedRestaurant?.id ?? null,
  });

  // Push only when the address actually changes, or every render would add a
  // history entry and Back would walk on the spot.
  const lastPath = useRef(null);
  useEffect(() => {
    if (lastPath.current === path) return;
    // Leave an OAuth return alone until the auth client has read it.
    //
    // This is the bug behind "I signed up with Google and the app still
    // showed 로그인" (2026-08-04). Google hands the session back in the
    // address — `?code=…` — and the Supabase client exchanges it when it
    // loads. This effect ran first and rewrote the address to a clean path,
    // deleting the code before anything could read it. The session was
    // created on Google's side and thrown away on ours, every single time.
    //
    // So the first tidy-up waits. The client cleans the address itself once
    // the exchange is done, and the next real navigation writes the path
    // normally — nothing else about the History wiring changes.
    if (lastPath.current === null && hasAuthPayload()) return;
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
      if (!next.restaurantId) { setSelectedRestaurant(null); setPendingPlaceId(null); }
      else {
        // Same two-kinds problem as the initial load: back-navigating to a
        // register place has to wait for the register too, so an id that is
        // not in the pool yet is held rather than resolved to null.
        const found = poolRef.current.find(r => r.id === next.restaurantId);
        if (found) { setSelectedRestaurant(isQuarantined(found) ? null : found); setPendingPlaceId(null); }
        else { setSelectedRestaurant(null); setPendingPlaceId(next.restaurantId); }
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
        locale,
      });
    },
    [suggestedTheme, visitedZones, continueTheme, themeProgress, justCompletedThemeId, journey, locale],
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

  // The 서울관광재단 register, added to the pool once its file arrives.
  // Until then every screen runs on the twenty, which is not a loading
  // state — it is the app.
  const [registryPlaces, setRegistryPlaces] = useState([]);
  // Fetched once, not per pan: the whole filtered register is a quarter of
  // a megabyte, so there is nothing left to ration by district.
  useEffect(() => {
    let alive = true;
    loadRegistryPlaces().then(list => { if (alive) setRegistryPlaces(list); });
    return () => { alive = false; };
  }, []);

  const pool = useMemo(
    () => (registryPlaces.length ? [...activeRestaurants, ...registryPlaces] : activeRestaurants),
    [registryPlaces],
  );

  // ── A shared /places/seoul-1115 link, finishing the job ─────────────────
  //
  // The address for a register place was already being written — pathFor puts
  // any open place in the bar — but it could not be read back. Both lookups
  // searched `activeRestaurants`, the twenty curated records, while the 8,118
  // register places arrive asynchronously into `registryPlaces` a moment
  // later. So opening a link somebody sent landed on the Places tab with no
  // sheet, no error and nothing to explain it: a link that goes to the right
  // app and the wrong place is worse than a link that fails.
  //
  // The id is held rather than the record, because at first render the record
  // does not exist yet. When the register lands, this resolves it once and
  // lets go. `pool` covers both kinds, so a curated link still opens on the
  // first render through the initialiser above and never reaches here.
  // The popstate handler is registered once, with an empty dependency list,
  // so it closes over the pool as it was on the first render — which is the
  // twenty, before the register lands. A ref is how it reads the current one
  // without re-subscribing on every fetch.
  const poolRef = useRef(pool);
  useEffect(() => { poolRef.current = pool; }, [pool]);

  const [pendingPlaceId, setPendingPlaceId] = useState(
    () => (opening.restaurantId && !activeRestaurants.some(r => r.id === opening.restaurantId)
      ? opening.restaurantId : null),
  );
  useEffect(() => {
    if (!pendingPlaceId) return;
    const found = pool.find(r => r.id === pendingPlaceId);
    if (!found) return;                 // the register has not arrived yet
    setPendingPlaceId(null);
    // Quarantine still applies to a link. openDetail is the choke point for
    // every other way in and it refuses these; a URL must not be the way
    // round it.
    if (!isQuarantined(found)) setSelectedRestaurant(found);
  }, [pendingPlaceId, pool]);

  const filteredRestaurants = useMemo(() => {
    return pool.filter(r => {
      // 1. Filter chips (AND across chips). A dietary chip only matches on
      // evidence — an unknown dietary record never matches, so we never send
      // someone somewhere we can't vouch for. A group chip ORs within itself.
      const matchesChips = selectedFilters.length === 0 || selectedFilters.every(f => {
        if (DIETARY_CHIPS.includes(f)) return matchesDietary(r, f);
        // A dish-group chip ("group:kbbq") answers from the register's menu
        // evidence — see servesGroup for why curated places sit this one out.
        if (f.startsWith('group:')) return servesGroup(r, f.slice('group:'.length));
        const traits = r.traits ?? [];
        const group = TRAIT_GROUPS[f];
        return group ? traits.some(t => group.includes(t)) : traits.includes(f);
      });

      // 2. Search Query Filtering (Match name, vibe or area)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === '' ||
                            r.name.toLowerCase().includes(query) ||
                            (r.vibe ?? '').toLowerCase().includes(query) ||
                            (r.zone ?? '').toLowerCase().includes(query);

      return matchesChips && matchesSearch;
    });
  }, [pool, selectedFilters, searchQuery]);

  {/* The Prologue splash used to gate everything here — one screen you had
      to answer before seeing a single table. Retired 2026-08-04 for the
      Meetup-shaped front door: a visitor lands directly on the list of real
      meals, the pitch sits above it as a hero, and 로그인/가입 wait in the
      corner of the header instead of blocking the way in. A splash makes a
      promise; a list of tables somebody actually opened keeps it. */}

  return (
    /* Two halves of one setting. LocaleFilter reduces labels that were
       already written in both languages; the provider lets content that was
       written once — the articles, the dish stories, the restaurant
       write-ups — pick its Korean version where one exists. */
    <LocaleContext.Provider value={locale}>
    <div className="app-shell">
      {/* App chrome: the name on the left, the tabs, and who you are on the
          right — one row, above the content, on every screen. The wordmark
          and the sign-in pair used to live inside the Tables tab, which made
          them page content pretending to be chrome: a member browsing Places
          could not tell whether they were signed in, and the app's own name
          appeared on one screen out of five.

          First in the DOM rather than last, so it is the top of the page on
          every width without an order trick. On a phone the tab bar inside
          it is position:fixed to the bottom, leaves this row's flow, and
          what remains up top is exactly the two things that belong there.
          Selecting a tab also leaves the theme screen, which otherwise
          guards every tab's content and makes the bar look dead. */}
      <header className="app-chrome">
        {/* The wordmark was 밥친구 in every language. A tester who reads no
            Korean wrote: "I cannot read it, say it, or search for it" — and
            the English name exists, it was just never on screen. Korean
            readers keep the Korean; everyone else gets the name they can
            type into a search box. */}
        <span className="app-chrome__mark l-ko-only" aria-hidden="true" translate="no">밥친구</span>
        <span className="app-chrome__mark l-en-only" aria-hidden="true" translate="no">Eatple</span>
        {/* The language control lived three taps deep, in Passport →
            Settings → Language, and nothing on the front page hinted at it.
            This is the one-tap version: it cycles Korean → English → both,
            which is the whole range most readers need, and the full picker
            with seven languages stays in Settings. */}
        <button
          className="app-chrome__locale"
          onClick={() => setLocaleState(setStoredLocale(
            locale === LOCALE.KO ? LOCALE.EN : locale === LOCALE.EN ? LOCALE.BOTH : LOCALE.KO,
          ))}
          aria-label={say('Change language', '언어 바꾸기', 'Cambiar idioma', 'Changer de langue', 'تغيير اللغة', '切换语言', '言語を変える')}
          title={say('Change language', '언어 바꾸기', 'Cambiar idioma', 'Changer de langue', 'تغيير اللغة', '切换语言', '言語を変える')}
        >
          {/* Language codes, not prose — the same two letters in every
              locale, which is why they carry data-no-locale. */}
          <span translate="no" data-no-locale>
            {locale === LOCALE.KO ? 'KO' : locale === LOCALE.BOTH ? 'KO·EN' : 'EN'}
          </span>
        </button>
        <TabBar
          activeTab={activeTab}
          onSelect={(tab) => { setOpenThemeId(null); goToTab(tab); }}
          waiting={waiting}
        />
        {/* Settings left the tab bar and lives here, to the left of 로그인.
            It is a device preference, not a destination, and as a fifth tab
            it was crowding four screens somebody actually goes to. Outside
            the signed-in branch so it is in the same corner either way — a
            control that moves when you sign in is a control you hunt for. */}
        <span className="app-chrome__end">
          <button
            className={`app-chrome__gear${activeTab === 'settings' ? ' is-on' : ''}`}
            aria-label={say('설정 · Settings', '설정', 'Ajustes', 'Réglages', 'الإعدادات', '设置', '設定')}
            aria-current={activeTab === 'settings' ? 'page' : undefined}
            title={say('설정 · Settings', '설정', 'Ajustes', 'Réglages', 'الإعدادات', '设置', '設定')}
            onClick={() => { setOpenThemeId(null); goToTab('settings'); }}
          >
            <GearIcon size={20} />
          </button>
          {isMember(auth) ? (
            <>
              <button
                className="app-chrome__me"
                onClick={() => { setOpenThemeId(null); goToTab('journal'); }}
              >
                {profile?.avatarUrl
                  ? <img className="app-chrome__avatar" src={profile.avatarUrl} alt="" />
                  : <AnimalAvatar className="app-chrome__avatar" seed={profile?.userId} animal={profile?.avatarAnimal} size={30} />}
                <span className="app-chrome__name">{profile?.name?.trim() || say('My passport', '내 여권', 'Mi pasaporte', 'Mon passeport', 'جوازي', '我的护照', 'わたしのパスポート')}</span>
              </button>
              {/* Beside the name it ends, which is where every site the team
                  studied puts it. Signing out lived only inside Settings —
                  two taps and a scroll from the chip that says who you are,
                  and on a shared or borrowed phone that distance is the whole
                  problem. Nothing is confirmed because nothing is lost:
                  signing back in restores the same account. */}
              <button
                className="app-chrome__signout"
                title={say('로그아웃 · Sign out', '로그아웃', 'Cerrar sesión', 'Se déconnecter', 'تسجيل الخروج', '退出登录', 'ログアウト')}
                onClick={async () => {
                  await signOutMember().catch(() => {});
                  await refreshAuth();
                }}
              >
                <span className="app-chrome__word">{chromeWord('로그아웃', 'Sign out', 'Cerrar sesión', 'Se déconnecter', 'تسجيل الخروج', '退出登录', 'ログアウト')}</span>
              </button>
            </>
          ) : (
            /* One word per button, not two: this corner has room for 로그인 or
               for Sign in, never both. So the Korean is what the bilingual
               default shows — it is what the team has always seen there — and
               English replaces it only for somebody who asked for English on
               its own. Measured 2026-08-11: these were Korean in all three
               settings, which on a page whose whole audience reads English
               made the two most important controls the least legible. */
            <span className="app-chrome__auth">
              <button className="app-chrome__signin" onClick={() => setAuthMode('signin')}>
                <span className="app-chrome__word">{chromeWord('로그인', 'Sign in', 'Entrar', 'Se connecter', 'تسجيل الدخول', '登录', 'ログイン')}</span>
              </button>
              <button className="app-chrome__join" onClick={() => setAuthMode('signup')}>
                <span className="app-chrome__word">{chromeWord('가입하기', 'Join', 'Únete', "S'inscrire", 'إنشاء حساب', '注册', '登録')}</span>
              </button>
            </span>
          )}
        </span>
      </header>

      {/* Renders nothing; applies the interface-language setting to whatever
          is on screen. A no-op on the bilingual default. */}
      <LocaleFilter locale={locale} />

      {/* What the team needs everybody to know today. 제주항공 leads its whole
          site with operational notices, above every fare — a service people
          plan a day around says the day-breaking thing first. This app had
          nowhere to put such a line at all. Renders nothing most days. */}
      <NoticeBar />

      {/* Under the chrome and above everything else, because it changes what
          the screen below it can promise. Renders nothing at all while the
          signal is fine, so it costs no space in the normal case. */}
      <OfflineBar />

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

        {/* 메인 — the front door (2026-08-06), styled on the Meetup landing
            the team studied. Every door out of it is a handler that already
            existed for another tab, so the page can promise nothing the app
            does not do. */}
        {!openThemeId && activeTab === 'main' && (
          <MainTab
            auth={auth}
            profile={profile}
            onNavigate={goToTab}
            /* The empty week's primary action. See TablesLead: asking a
               visitor who landed yesterday to host is the hardest possible
               request, and this screen already had a gentler one. */
            onRequestTable={() => {
              if (!requireMember('request-table')) return;
              setActiveTab('match');
              setTableView({ screen: 'request' });
            }}
            onOpenAuth={(mode) => setAuthMode(mode)}
            /* The matching flow: a category card on the front page opens the
               tables screen already filtered to that category. */
            onPickGroup={(gid) => {
              setActiveTab('match');
              setTableView({ screen: 'list', group: gid });
            }}
            onOpenTable={(id) => {
              setActiveTab('match');
              setTableView({ screen: 'detail', tableId: id });
            }}
            onCreateTable={() => {
              if (!requireMember('open-table')) return;
              setTablePrefill(null);
              setActiveTab('match');
              setTableView({ screen: 'create' });
            }}
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
        {/* 밥친구. The tab leads with tables now — a dish somebody would
            rather not eat alone is the product, and the swipe deck was a demo of
            people rather than a way to eat. The deck is still reachable from
            the table list, so nothing that existed has gone away. */}
        {!openThemeId && activeTab === 'match' && tableView.screen === 'list' && (
          <TablesTab
            key={tableView.group ?? 'all'}
            initialGroup={tableView.group ?? null}
            profile={profile}
            auth={auth}
            onOpenAuth={(mode) => setAuthMode(mode)}
            /* Gated at the handler rather than inside the screen: the list
               itself is browsing and stays open, the two doors out of it are
               participation. requireMember opens the auth sheet with the
               right words when the answer is no. */
            onCreateTable={(prefill = null) => {
              if (!requireMember('open-table')) return;
              // A dish the reader searched for and found no table for arrives
              // here as { menuId }, so the form opens on that dish rather
              // than asking them to find it again in a grid of twenty-four.
              setTablePrefill(prefill?.menuId ? prefill : null); setTableView({ screen: 'create' });
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
            onOpenTable={(id) => setTableView({ screen: 'detail', tableId: id })}
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
        {/* The Passport renders for everyone — 8/4's correction of 8/3's
            wall. A guest sees the whole structure, profile first, with the
            gate inside the panel where recording starts: looking is free,
            keeping the record is what needs an account. */}
        {!openThemeId && activeTab === 'journal' && (
          <JournalPanel
            onRequireAuth={(door) => setAuthDoor(door)}
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
            saveState={profileSave}
            onSignOut={async () => {
              await signOutMember().catch(() => {});
              await refreshAuth();
            }}
          />
        )}
        {/* The fifth tab: device settings. Not the old Profile tab returning
            — profile stays inside the Passport — but the appearance mode,
            which was hiding in the profile form where it never belonged. */}
        {!openThemeId && activeTab === 'settings' && (
          <SettingsTab
            auth={auth}
            locale={locale}
            onLocaleChange={(l) => setLocaleState(setStoredLocale(l))}
            /* Closing an account ends the session inside deleteAccount, so
               this only has to catch the app up — and send them somewhere
               that still exists, since the Passport they were near is gone. */
            onSignedOut={async () => {
              await refreshAuth();
              setActiveTab('match');
            }}
            /* Signing out is not signing off: they stay on Settings, which
               still has something on it for a guest, rather than being thrown
               to another tab as though they had done something drastic. */
            onSignOut={async () => {
              await signOutMember().catch(() => {});
              await refreshAuth();
            }}
          />
        )}

      </div>

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
          onClose={() => {
            // Closing the contact-details step is an answer: not now. It is
            // remembered against this account so the modal stops greeting
            // them on arrival — the next time it appears is when they press
            // something that genuinely needs a phone number.
            if (authMode === 'details' && auth.userId) {
              setProfile(saveProfile({ ...getProfile(), detailsDeferredFor: auth.userId }));
            }
            setAuthDoor(null);
            setAuthMode(null);
          }}
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
        /* The empty list's way out. It used to call window.location.reload()
           under a "Reset Filters" label — a full reload standing in for a
           state change the app can make here in one line. */
        onResetFilters={() => { setSelectedFilters([]); setSearchQuery(''); }}
      />

      {/* Layer 2: Full-Screen Detail Modal */}
      <RestaurantDetail
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
        isBookmarked={selectedRestaurant ? bookmarkedIds.includes(selectedRestaurant.id) : false}
        onToggleBookmark={handleToggleBookmark}
        isVisited={selectedRestaurant ? visitedIds.includes(selectedRestaurant.id) : false}
        onOpenTableHere={(r) => {
          // Everything this venue already knows about itself. It used to send
          // the name and the address only, so a host who pressed 여기서 상
          // 차리기 at Balwoo Gongyang was then asked to find Balwoo Gongyang
          // on a map the app had the coordinates for all along — reported from
          // a real phone on 2026-08-04, where the pin was dropped by hand.
          const point = r.coordinates?.value ?? r.coordinates;
          setTablePrefill({
            restaurant: r.name.split('(')[0].trim(),
            place: r.address?.value ?? r.zone,
            point: Number.isFinite(point?.lat) && Number.isFinite(point?.lng)
              ? { lat: point.lat, lng: point.lng }
              : null,
            // The venue's own menu names, carried as a hint rather than as the
            // dish. The dish is one of the twenty-four in the catalogue
            // (src/domain/catalog/menus.js) and this venue may serve none of
            // them — a temple kitchen does not do 삼겹살 — so the host still
            // chooses. Names only: prices are never shown in this app.
            venueMenus: (r.menus?.value ?? []).map(m => m.name).filter(Boolean),
            // A register place is in this app for exactly one reason: the
            // dishes its menu was matched on. When the catalog knows one of
            // them, the form opens with that dish already chosen — a hint
            // the host can change, not a decision made for them.
            menuId: (r.registry?.dishes ?? []).map(menuIdOfDish).find(id => menuById(id)) ?? null,
            venueName: r.name.split('(')[0].trim(),
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
        /* Closes the sheet on the way out. This used to be a bare goToTab, so
           anything that navigated from inside a place page changed the tab
           underneath a full-screen modal that stayed open — nothing appeared
           to happen. Found while wiring the 저장한 곳 receipt, which is the
           first control that actually uses it. */
        onNavigate={(tab) => {
          setSelectedRestaurant(null);
          goToTab(tab);
        }}
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
    </LocaleContext.Provider>
  );
}
