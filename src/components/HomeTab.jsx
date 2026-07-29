import React, { useMemo, useState } from 'react';
import { restaurants } from '../data/restaurants';
import { isQuarantined } from '../data/verification';
import { gatherings, courses, featuredZones, hiddenGemIds, weekendPickIds, traditionalMarkets, seasonalFoods, festivals } from '../data/experiences';
import { themes as domainThemes } from '../domain/catalog/index.js';
import { isSurfaceableEntity } from '../domain/policy/visibility.js';
import PlaceImage from './PlaceImage';
import PlaceCard from './PlaceCard';
import JourneyCard from './JourneyCard';
import ChallengeRow from './ChallengeRow';
import JourneyLead from './JourneyLead';
import ExploreCover from './ExploreCover';
import ThemeStoryCard from './ThemeStoryCard';
import TablesLead from './TablesLead';
import { ChevronRightIcon, ClockIcon, MapPinIcon, SparkleIcon, CheckIcon } from './Icons';
import { travelers } from '../data/travelers';
import FoodRoulette from './FoodRoulette';
import CultureCards, { CULTURE_CARDS } from './CultureCards';

// A cross-category spotlight, in the same spirit as the old Discover/Culture
// Hub tab's picks — folded into Home now that Discover is no longer a
// top-level destination.
const spotlightIds = ['balwoo', 'osegyehyang', 'eid', 'ggot-epida'];
const spotlightPicks = spotlightIds
  .map(id => restaurants.find(r => r.id === id))
  .filter(Boolean);

// A second, non-overlapping set for the "Food Stories" row — restaurants
// whose `story` field carries a strong narrative hook.
const storyIds = ['camouflage', 'kampungku', 'gonghwachun'];
const storyPicks = storyIds.map(id => restaurants.find(r => r.id === id)).filter(Boolean);

const activePlaces = restaurants.filter(r => !isQuarantined(r));

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export default function HomeTab({
  onNavigate, onOpenRestaurant, onOpenStory, onExploreZone, bookmarkedIds = [], onToggleBookmark,
  journey, visitedMarkets = [], onToggleMarket, onOpenSummary, onOpenMap,
  onOpenTheme, continueTheme, nextExperience, suggestedTheme, suggestedReason,
  themeProgress,
}) {
  const byId = useMemo(() => Object.fromEntries(restaurants.map(r => [r.id, r])), []);
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

  const todaysPick = activePlaces[dayOfYear(new Date()) % activePlaces.length];
  const hiddenGemPicks = hiddenGemIds.map(id => byId[id]).filter(Boolean);
  const weekendPicks = weekendPickIds.map(id => byId[id]).filter(Boolean);
  const currentMonth = new Date().getMonth() + 1;
  const openStory = onOpenStory ?? onOpenRestaurant;
  const isSaved = (id) => bookmarkedIds.includes(id);


  return (
    <section className="home-tab" aria-label="Home">
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

      {/* 5. Everything below is reference: places, markets, courses, people.
             It was interleaved with the cultures before, which made the whole
             page read as one long undifferentiated shelf. Behind a break it
             becomes something you go to, rather than something you wade
             through on the way to the content. */}
      <div className="index-break">
        <span className="index-break__title">The index</span>
        <span className="index-break__sub">Places, markets and people behind the cultures</span>
      </div>

      {/* Progress detail — the dashboard, below the call to action */}
      {journey && (
        <div className="home-section home-section--tight">
          <JourneyCard journey={journey} onOpenSummary={onOpenSummary} />
        </div>
      )}

      {/* 6. Big card — today's single pick */}
      <div className="home-section">
        <div className="home-section__header">
          <span className="panel-icon" aria-hidden="true"><SparkleIcon size={18} /></span>
          <h2>Today's Korean Experience</h2>
        </div>
        <button className="spotlight-card" onClick={() => openStory(todaysPick)}>
          <PlaceImage place={todaysPick} variant="hero" className="spotlight-card__img" />
          <div className="spotlight-card__body">
            <span className="gather-card__tag">{todaysPick.zone}</span>
            <h3>{todaysPick.name.split('(')[0].trim()}</h3>
            <p className="spotlight-card__quote">&ldquo;{todaysPick.vibe}&rdquo;</p>
            <span className="spotlight-card__cta">Read the story <ChevronRightIcon size={14} /></span>
          </div>
        </button>
      </div>

      {/* 5. Challenges — the reason to keep going */}
      {journey && (
        <div className="home-section">
          <div className="home-section__header">
            <h2>Explore Challenge</h2>
            <span className="home-section__count">{journey.doneCount}/{journey.challenges.length}</span>
          </div>
          <ChallengeRow challenges={journey.challenges} />
        </div>
      )}

      {/* 6. Small cards */}
      <div className="home-section">
        <div className="home-section__header">
          <span className="panel-icon" aria-hidden="true"><SparkleIcon size={18} /></span>
          <h2>Popular with Travelers</h2>
        </div>
        <div className="home-scroll-row">
          {spotlightPicks.map(place => (
            <PlaceCard
              key={place.id}
              place={place}
              onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)}
              onToggleSave={onToggleBookmark}
            />
          ))}
        </div>
      </div>

      {/* 7. Markets — checkable, because they feed a challenge */}
      <div className="home-section">
        <div className="home-section__header">
          <h2>Traditional Markets</h2>
          <span className="home-section__count">{visitedMarkets.length}/{traditionalMarkets.length}</span>
        </div>
        <div className="home-scroll-row">
          {traditionalMarkets.map(m => {
            // Entries are { id, at } — the date is what lets the Passport
            // place this visit on the timeline.
            const visited = visitedMarkets.some(e => e.id === m.id);
            return (
              <div key={m.id} className={`market-card${visited ? ' is-visited' : ''}`}>
                <button
                  className="market-card__hit"
                  data-kr={m.nameKo}
                  onClick={() => onExploreZone(m.zone)}
                >
                  <span className="gather-card__tag">{m.nameKo}</span>
                  <h3>{m.name}</h3>
                  <p className="gather-card__meta"><MapPinIcon size={14} /> {m.zone}</p>
                  <p className="gather-card__desc">{m.blurb}</p>
                </button>
                {onToggleMarket && (
                  <button
                    className={`market-card__check${visited ? ' is-visited' : ''}`}
                    aria-pressed={visited}
                    aria-label={visited ? `Mark ${m.name} as not visited` : `Mark ${m.name} as visited`}
                    onClick={() => onToggleMarket(m.id)}
                  >
                    {visited ? <><CheckIcon size={14} /> Visited</> : 'Mark visited'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>Food Stories</h2>
        </div>
        <div className="home-scroll-row">
          {storyPicks.map(place => (
            <button key={place.id} className="gather-card" onClick={() => openStory(place)}>
              <span className="gather-card__tag">{place.zone}</span>
              <h3>{place.name.split('(')[0].trim()}</h3>
              <p className="gather-card__desc">&ldquo;{place.vibe}&rdquo;</p>
            </button>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>Recommended Courses</h2>
        </div>
        <div className="home-scroll-row">
          {courses.map(c => {
            const stops = c.stopIds.map(id => byId[id]).filter(Boolean);
            const first = stops[0];
            return (
              <button
                key={c.id}
                className="course-card"
                onClick={() => first && onOpenRestaurant(first)}
              >
                <div className="course-card__stack">
                  {stops.slice(0, 3).map(s => (
                    <PlaceImage key={s.id} place={s} variant="thumb" className="course-card__thumb" />
                  ))}
                </div>
                <h3>{c.title}</h3>
                <p className="course-card__meta">{c.duration}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>Weekend Picks</h2>
        </div>
        <div className="home-scroll-row">
          {weekendPicks.map(place => (
            <PlaceCard
              key={place.id}
              place={place}
              onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)}
              onToggleSave={onToggleBookmark}
            />
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>Seasonal Foods</h2>
        </div>
        <div className="home-scroll-row">
          {seasonalFoods.map(f => {
            const inSeason = f.months.includes(currentMonth);
            return (
              <div
                key={f.id}
                className={`gather-card gather-card--static gather-card--kr${inSeason ? ' is-highlighted' : ''}`}
                data-kr={f.nameKo}
              >
                <span className="gather-card__tag">{f.season}{inSeason ? ' · In season now' : ''}</span>
                <h3>{f.name} <span className="gather-card__kr">{f.nameKo}</span></h3>
                <p className="gather-card__desc">{f.blurb}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>Festival Picks</h2>
        </div>
        <div className="home-scroll-row">
          {festivals.map(f => (
            <div key={f.id} className="gather-card gather-card--static gather-card--kr" data-kr={f.nameKo}>
              <span className="gather-card__tag">{f.when}</span>
              <h3>{f.name} <span className="gather-card__kr">{f.nameKo}</span></h3>
              <p className="gather-card__desc">{f.blurb}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>Korean Dining Culture</h2>
        </div>
        <div className="home-scroll-row">
          {CULTURE_CARDS.slice(0, 4).map((c, i) => (
            <button key={c.title} className="zone-card" style={{ flex: '0 0 180px' }} onClick={() => { setCultureStart(i); setShowCulture(true); }}>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>Local Hidden Gems</h2>
        </div>
        <div className="home-scroll-row">
          {hiddenGemPicks.map(place => (
            <PlaceCard
              key={place.id}
              place={place}
              onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)}
              onToggleSave={onToggleBookmark}
            />
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>Recommended Neighborhoods</h2>
        </div>
        <div className="zone-grid">
          {featuredZones.map(z => (
            <button key={z.name} className="zone-card" onClick={() => onExploreZone(z.name)}>
              <h3>{z.name}</h3>
              <p>{z.blurb}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Culture first, company second — the meetup layer sits behind a
          deliberate transition rather than competing with the feed. */}
      <div className="home-divider">
        <span className="home-divider__title">Want company?</span>
        <span className="home-divider__subtitle">Meet fellow travelers and eat together</span>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>Upcoming Meetup</h2>
        </div>
        <div className="home-scroll-row">
          {gatherings.map(g => (
            <button key={g.id} className="gather-card" onClick={() => onNavigate('match')}>
              <span className="gather-card__tag">{g.tag}</span>
              <h3>{g.title}</h3>
              <p className="gather-card__meta">
                <ClockIcon size={14} /> {g.time}
              </p>
              <p className="gather-card__meta">
                <MapPinIcon size={14} /> {g.zone}
              </p>
              <div className="gather-card__footer">
                <span className="gather-card__host">{g.hostFlag} Hosted by {g.hostName}</span>
                <span className="gather-card__spots">{g.spotsLeft} spots left</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>Recommended People</h2>
        </div>
        <div className="home-scroll-row">
          {travelers.slice(0, 3).map(t => (
            <button key={t.id} className="gather-card" onClick={() => onNavigate('match')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{t.name.slice(0,1)}</div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>{t.name}, {t.age}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{t.flag} {t.nationality}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="home-footer-cta">
        <button className="btn-secondary" onClick={() => onNavigate('match')}>
          Find someone to eat with <ChevronRightIcon size={16} />
        </button>
      </div>

      {/* The map comes last, deliberately. It is a way to act on everything
          above, not the thing the feed is about. */}
      <div className="home-section home-section--tight">
        <button
          className="map-cta"
          onClick={() => onOpenMap?.({ title: 'Every place, plotted', subtitle: 'Filter by zone, diet or vibe' })}
        >
          <span className="map-cta__title">See it all on the map</span>
          <span className="map-cta__body">Every place above, plotted — filter by zone, diet or vibe.</span>
          <span className="map-cta__link">Open the map <ChevronRightIcon size={16} /></span>
        </button>
      </div>

      {showRoulette && <FoodRoulette onClose={() => setShowRoulette(false)} />}
      {showCulture && <CultureCards onClose={() => setShowCulture(false)} startIndex={cultureStart} />}
    </section>
  );
}
