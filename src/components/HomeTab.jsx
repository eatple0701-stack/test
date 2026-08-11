import React, { useMemo, useState } from 'react';
import { themes as domainThemes } from '../domain/catalog/index.js';
import { isSurfaceableEntity } from '../domain/policy/visibility.js';
import JourneyLead from './JourneyLead';
import ExploreCover from './ExploreCover';
import ThemeStoryCard from './ThemeStoryCard';
import TablesLead from './TablesLead';
import TodayTable from './TodayTable';
import FoodRoulette from './FoodRoulette';
import CultureCards from './CultureCards';
import { useText } from './localeText.js';

// Eight props were still declared here that this component stopped reading
// when Explore was rebuilt around themes: onOpenRestaurant, onOpenStory,
// onExploreZone, bookmarkedIds, onToggleBookmark, visitedMarkets,
// onToggleMarket, onOpenMap. App.jsx still passes them, which costs nothing,
// but a signature listing eight handlers it never calls describes a component
// that no longer exists. Removed from the signature, not from the call site —
// deleting them there would mean deciding whether the handlers themselves are
// dead, which is a bigger question than this cleanup.
export default function HomeTab({
  onNavigate,
  journey, onOpenSummary,
  onOpenTheme, continueTheme, nextExperience, suggestedTheme, suggestedReason,
  themeProgress, profile, onOpenTodayTable, onOpenTable,
}) {
  const say = useText();
  const [showRoulette, setShowRoulette] = useState(false);
  const [showCulture, setShowCulture] = useState(false);
  const [cultureStart, setCultureStart] = useState(0);

  // The Phase 0 catalog, filtered through the same visibility policy the
  // projections use — so a `planned` theme never leaks onto the feed.
  const surfacedThemes = useMemo(() => domainThemes.filter(isSurfaceableEntity), []);

  // Read straight off the existing projection — the cards show progress, they
  // do not compute it. A second tally here is how the Passport and the Theme
  // page ended up disagreeing once already.
  const progressById = useMemo(
    () => Object.fromEntries((themeProgress?.themes ?? []).map(t => [t.themeId, t])),
    [themeProgress],
  );
  const progressOf = (themeId) => (themeId ? progressById[themeId] ?? null : null);

  // Nobody yet: no name on file, no culture walked, nothing underway. The
  // prologue's button says 밥친구 찾기 — Find a table — and pressing it landed
  // on an editorial cover about a fish market in Busan. The app broke its own
  // promise on the first tap, and the one thing it exists to do was the second
  // thing on the page.
  //
  // For this traveller only, the order flips: what you can do tonight, then
  // what there is to read. Everybody else keeps the cover, because somebody
  // three cultures in does not need to be sold the product again.
  const newHere =
    !profile?.name?.trim() &&
    (journey?.experienceCount ?? 0) === 0 &&
    !continueTheme;

  const cover = (
    /* The cover. Today's pick at full size, with the reason it was picked set
       as a note rather than a caption. This is the app's recommendation —
       printing a hero that explains the product and then a chip that
       recommends something was two openings competing for one moment. */
    <ExploreCover
      theme={suggestedTheme}
      reason={suggestedReason}
      progress={progressOf(suggestedTheme?.id)}
      onOpen={onOpenTheme}
    />
  );

  const tables = (
    /* The tables. Explore described seven cultures without ever saying the app
       can seat you at one — the product's whole point lived behind a tab
       nobody had a reason to press. */
    <TablesLead
      onOpenTables={() => onNavigate('match')}
      onOpenTable={onOpenTable}
      profile={profile}
    />
  );

  return (
    <section className="home-tab" aria-label="Home">
      {/* Above the cover, and above everything, when a meal is today. There
          are no push notifications and will not be before the pilot, so the
          only reminder the app can give is being unmissable when opened. */}
      <TodayTable profile={profile} onOpenTable={onOpenTodayTable} />

      {/* FirstRun used to stand here, teaching three steps that were not the
          three steps the landing page taught — two answers to "what happens
          here?", depending on which tab somebody opened first. The steps are
          now in content/howItWorks.js, said once, on the landing where a
          first visit actually begins. Its best line came with them: 밥친구
          handles no money, which is the fact that removes the hesitation and
          was missing from the landing entirely. Explore keeps its own job,
          which is the culture, and still leads with tables. */}
      {newHere ? (
        <>
          {tables}
          {cover}
        </>
      ) : (
        <>
          {cover}
          {tables}
        </>
      )}

      {/* 3. Resume, for a traveller already mid-culture. Below the cover, not
             above it: someone who is partway through does not need to be sold
             the app, but they do need this within a thumb's reach. Suppressed
             when nothing is underway, because its start state would offer the
             same theme the cover just did. */}
      {continueTheme && (
        <div className="home-section home-section--tight">
          <JourneyLead
            continueTheme={continueTheme}
            nextExperience={nextExperience}
            suggestedTheme={suggestedTheme}
            onOpenTheme={onOpenTheme}
            onOpenSummary={onOpenSummary}
          />
        </div>
      )}

      {/* 3. The cultures. A stack, not a shelf — a horizontal row of seven
             small cards is a menu you skim past, and these are the content.
             One question at a time, at the width of the screen. */}
      <div className="home-section">
        <div className="stack-head">
          <span className="stack-head__kr" translate="no">문화</span>
          <h2 className="stack-head__title">
            {say('Seven questions about how Korea eats', '한국이 어떻게 먹는지에 대한 일곱 가지 질문')}
          </h2>
          <p className="stack-head__sub">
            {say('Each one is a culture you can walk into.', '하나하나가 걸어 들어가 볼 수 있는 문화입니다.')}
          </p>
        </div>
        <div className="story-stack">
          {surfacedThemes.map(theme => (
            <ThemeStoryCard
              key={theme.id}
              theme={theme}
              progress={progressOf(theme.id)}
              onOpen={onOpenTheme}
            />
          ))}
        </div>
      </div>

      {/* 4. The two ways to be surprised, kept — moved off the opening, where
             they were competing with the cover, to the end of the reading. */}
      <div className="home-section home-section--tight">
        <div className="surprise-row">
          <button className="surprise-btn" onClick={() => { setCultureStart(0); setShowCulture(true); }}>
            <span className="surprise-btn__kr">문화</span>
            <span className="surprise-btn__label">{say('Culture Cards', '문화 카드')}</span>
          </button>
          <button className="surprise-btn" onClick={() => setShowRoulette(true)}>
            <span className="surprise-btn__kr">오늘 뭐 먹지</span>
            <span className="surprise-btn__label">{say('Pick a dish for me', '골라주세요')}</span>
          </button>
        </div>
      </div>

      {/* The index used to continue here for another thirteen shelves —
          restaurants, courses, neighbourhoods, seasonal notes. It is a real
          directory and travellers want it, but it answers "where could I go"
          while everything above answers "what should I do today", and eight
          screens of it made the second question look like the smaller one.
          It has its own tab now.

          Two of those shelves are not in the new tab either: the journey
          dashboard and the challenge row were already on the Passport, in
          the same words, and printing progress twice does not double it. */}

      {showRoulette && (
        <FoodRoulette
          onClose={() => setShowRoulette(false)}
          /* A dish with nowhere to go is where this used to stop. */
          onOpenTables={() => { setShowRoulette(false); onNavigate('match'); }}
        />
      )}
      {showCulture && <CultureCards onClose={() => setShowCulture(false)} startIndex={cultureStart} />}
    </section>
  );
}
