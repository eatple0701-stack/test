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
import PlacesTab from './PlacesTab';
import { useText } from './localeText.js';

// Eight props were declared here and unread after Explore was rebuilt around
// themes — onOpenRestaurant, onOpenStory, onExploreZone, bookmarkedIds,
// onToggleBookmark, visitedMarkets, onToggleMarket, onOpenMap — kept at the
// call site rather than deleted. They are read again as of 2026-09-04: the
// eleven curated shelves that had their own 장소 tab render here now, and
// they are exactly the eight handlers those shelves need. App.jsx was already
// passing every one of them.
//
// Why they moved: 장소 was a second track of curation, and one of its shelves
// (한국의 식문화) rendered the same CULTURE_CARDS deck this tab's 문화 카드
// button opens. Editorial reading belongs in one place; 장소 is the map now.
export default function HomeTab({
  onNavigate,
  journey, onOpenSummary,
  onOpenTheme, continueTheme, nextExperience, suggestedTheme, suggestedReason,
  themeProgress, profile, onOpenTodayTable, onOpenTable,
  onOpenRestaurant, onOpenStory, onExploreZone,
  bookmarkedIds, onToggleBookmark, visitedMarkets, onToggleMarket, onOpenMap,
}) {
  const say = useText();
  const [showRoulette, setShowRoulette] = useState(false);
  const [showCulture, setShowCulture] = useState(false);
  // The merged 장소 shelves, shut until asked for. See the note at the mount.
  const [placesOpen, setPlacesOpen] = useState(false);
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
            {say('Seven questions about how Korea eats', '한국이 어떻게 먹는지에 대한 일곱 가지 질문', 'Siete preguntas sobre cómo come Corea', 'Sept questions sur la façon dont la Corée mange', 'سبعة أسئلة عن طريقة كوريا في الأكل', '关于韩国怎么吃的七个问题', '韓国の食べ方についての七つの問い')}
          </h2>
          <p className="stack-head__sub">
            {say('Each one is a culture you can walk into.', '하나하나가 걸어 들어가 볼 수 있는 문화입니다.', 'Cada una es una cultura en la que puedes entrar.', 'Chacune est une culture dans laquelle entrer.', 'كل واحد منها ثقافة تستطيع أن تدخلها.', '每一个都是一个可以走进去的文化。', 'どれもが、歩いて入れるひとつの文化です。')}
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
            <span className="surprise-btn__label">{say('Culture Cards', '문화 카드', 'Fichas de cultura', 'Fiches de culture', 'بطاقات ثقافية', '文化卡片', '文化カード')}</span>
          </button>
          <button className="surprise-btn" onClick={() => setShowRoulette(true)}>
            <span className="surprise-btn__kr">오늘 뭐 먹지</span>
            <span className="surprise-btn__label">{say('Pick a dish for me', '골라주세요', 'Elige un plato por mí', 'Choisis un plat pour moi', 'اختر لي طبقًا', '替我挑一道菜', '料理を選んでもらう')}</span>
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

      {/* The places, markets and neighbourhoods that had their own tab until
          2026-09-04. Last, after the cultures and the two surprises, because
          this answers "where could I go" and everything above answers "what
          should I do today" — the order the split was originally made to
          protect, kept without needing two tabs to keep it. */}
      {/* Folded to start. Merging 장소 in here answered "two tracks of
          curation" and created "one very long tab" — measured at 8.0 screens
          on a 375px phone, when the complaint that started this was that
          there was too much to read. Nothing was cut to fix that: which of
          eleven shelves is worth less than the others is the team's call and
          not a thing to decide by deleting. So it is one press instead, and
          the reading above it — the cultures, the two surprises — reaches
          the end of the page again. */}
      <div className="home-section home-places">
        <button
          type="button"
          className={`home-places__toggle${placesOpen ? ' is-open' : ''}`}
          aria-expanded={placesOpen}
          aria-controls="home-places-panel"
          onClick={() => setPlacesOpen(v => !v)}
        >
          <span className="home-places__label">
            <span className="home-places__label-kr" translate="no">가볼 만한 곳</span>
            <span className="home-places__label-en">
              {say('Places, markets and neighbourhoods', null, 'Sitios, mercados y barrios', 'Adresses, marchés et quartiers', 'أماكن وأسواق وأحياء', '地点、市场和街区', '店と市場と街')}
            </span>
          </span>
          <span className="home-places__caret" aria-hidden="true">▾</span>
        </button>
        <div id="home-places-panel" hidden={!placesOpen}>
          <PlacesTab
            onOpenRestaurant={onOpenRestaurant}
            onOpenStory={onOpenStory}
            onExploreZone={onExploreZone}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={onToggleBookmark}
            visitedMarkets={visitedMarkets}
            onToggleMarket={onToggleMarket}
            onOpenMap={onOpenMap}
            onOpenMapTab={() => onNavigate('places')}
          />
        </div>
      </div>

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
