import React, { useMemo, useState } from 'react';
import { themes as domainThemes } from '../domain/catalog/index.js';
import { isSurfaceableEntity } from '../domain/policy/visibility.js';
import JourneyLead from './JourneyLead';
import ExploreCover from './ExploreCover';
import ThemeStoryCard from './ThemeStoryCard';
import TablesLead from './TablesLead';
import TodayTable from './TodayTable';
import { ChevronRightIcon } from './Icons';
import FoodRoulette from './FoodRoulette';
import CultureCards, { CULTURE_CARDS } from './CultureCards';

export default function HomeTab({
  onNavigate, onOpenRestaurant, onOpenStory, onExploreZone, bookmarkedIds = [], onToggleBookmark,
  journey, visitedMarkets = [], onToggleMarket, onOpenSummary, onOpenMap,
  onOpenTheme, continueTheme, nextExperience, suggestedTheme, suggestedReason,
  themeProgress, profile, onOpenTodayTable,
}) {
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


  return (
    <section className="home-tab" aria-label="Home">
      {/* Above the cover, and above everything, when a meal is today. There
          are no push notifications and will not be before the pilot, so the
          only reminder the app can give is being unmissable when opened. */}
      <TodayTable profile={profile} onOpenTable={onOpenTodayTable} />
      {/* 1. The cover. Today's pick at full size, with the reason it was
             picked set as a note rather than a caption. This is both the
             app's first impression and its recommendation — printing a hero
             that explains the product and then a chip that recommends
             something was two openings competing for the same moment. */}
      <ExploreCover
        theme={suggestedTheme}
        reason={suggestedReason}
        progress={progressOf(suggestedTheme?.id)}
        onOpen={onOpenTheme}
      />

      {/* 2. The tables. Explore described seven cultures without ever saying
             the app can seat you at one — the product's whole point lived
             behind a tab nobody had a reason to press. */}
      <TablesLead onOpenTables={() => onNavigate('match')} />

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
          <h2 className="stack-head__title">Seven questions about how Korea eats</h2>
          <p className="stack-head__sub">Each one is a culture you can walk into.</p>
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
            <span className="surprise-btn__label">Culture Cards</span>
          </button>
          <button className="surprise-btn" onClick={() => setShowRoulette(true)}>
            <span className="surprise-btn__kr">추첨</span>
            <span className="surprise-btn__label">Food Roulette</span>
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

      {showRoulette && <FoodRoulette onClose={() => setShowRoulette(false)} />}
      {showCulture && <CultureCards onClose={() => setShowCulture(false)} startIndex={cultureStart} />}
    </section>
  );
}
