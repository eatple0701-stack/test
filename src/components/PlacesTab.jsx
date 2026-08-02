import React, { useMemo, useState } from 'react';
import { restaurants } from '../data/restaurants';
import { isQuarantined } from '../data/verification';
import {
  courses, featuredZones, hiddenGemIds, weekendPickIds,
  traditionalMarkets, seasonalFoods, festivals,
} from '../data/experiences';
import PlaceImage from './PlaceImage';
import PlaceCard from './PlaceCard';
import CultureCards, { CULTURE_CARDS } from './CultureCards';
import { ChevronRightIcon, MapPinIcon, SparkleIcon, CheckIcon } from './Icons';

// The index: places, markets and neighbourhoods.
//
// All of this used to sit underneath Explore, thirteen shelves of it, so the
// feed spent one and a half screens saying what 밥친구 is and another eight
// being a restaurant directory. Nothing here is bad — a traveller does want
// to know where the markets are — but it was answering a different question
// than the screen above it, and volume made the answer look like the point.
//
// It has its own tab now. Going somewhere to browse is a different intent
// from being shown what to do today, and separating them lets each one be
// what it is.

const spotlightIds = ['balwoo', 'osegyehyang', 'eid', 'ggot-epida'];
const spotlightPicks = spotlightIds.map(id => restaurants.find(r => r.id === id)).filter(Boolean);

const storyIds = ['camouflage', 'kampungku', 'gonghwachun'];
const storyPicks = storyIds.map(id => restaurants.find(r => r.id === id)).filter(Boolean);

const activePlaces = restaurants.filter(r => !isQuarantined(r));

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export default function PlacesTab({
  onOpenRestaurant, onOpenStory, onExploreZone, bookmarkedIds = [], onToggleBookmark,
  visitedMarkets = [], onToggleMarket, onOpenMap,
}) {
  const byId = useMemo(() => Object.fromEntries(restaurants.map(r => [r.id, r])), []);
  const [showCulture, setShowCulture] = useState(false);
  const [cultureStart, setCultureStart] = useState(0);

  const todaysPick = activePlaces[dayOfYear(new Date()) % activePlaces.length];
  const hiddenGemPicks = hiddenGemIds.map(id => byId[id]).filter(Boolean);
  const weekendPicks = weekendPickIds.map(id => byId[id]).filter(Boolean);
  const currentMonth = new Date().getMonth() + 1;
  const openStory = onOpenStory ?? onOpenRestaurant;
  const isSaved = (id) => bookmarkedIds.includes(id);

  return (
    <section className="places-tab" aria-label="Places">
      <header className="screen-head">
        <span className="screen-head__kr">둘러보기</span>
        <h1 className="screen-head__title">Places, markets and the city around them.</h1>
        <p className="screen-head__sub">
          {activePlaces.length} verified places, {traditionalMarkets.length} markets.
        </p>
      </header>

      <div className="home-section">
        <div className="home-section__header">
          <span className="panel-icon" aria-hidden="true"><SparkleIcon size={18} /></span>
          <h2>Today&rsquo;s Korean Experience</h2>
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

      <div className="home-section">
        <div className="home-section__header">
          <h2>Traditional Markets</h2>
          <span className="home-section__count">{visitedMarkets.length}/{traditionalMarkets.length}</span>
        </div>
        <div className="home-scroll-row">
          {traditionalMarkets.map(m => {
            const visited = visitedMarkets.some(e => e.id === m.id);
            return (
              <div key={m.id} className={`market-card${visited ? ' is-visited' : ''}`}>
                <button className="market-card__hit" data-kr={m.nameKo} onClick={() => onExploreZone(m.zone)}>
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
          <h2>Popular with Travelers</h2>
        </div>
        <div className="home-scroll-row">
          {spotlightPicks.map(place => (
            <PlaceCard key={place.id} place={place} onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)} onToggleSave={onToggleBookmark} />
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>Food Stories</h2></div>
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
        <div className="home-section__header"><h2>Recommended Courses</h2></div>
        <div className="home-scroll-row">
          {courses.map(c => {
            const stops = c.stopIds.map(id => byId[id]).filter(Boolean);
            const first = stops[0];
            return (
              <button key={c.id} className="course-card" onClick={() => first && onOpenRestaurant(first)}>
                <div className="course-card__stack">
                  {stops.slice(0, 3).map(st => (
                    <PlaceImage key={st.id} place={st} variant="thumb" className="course-card__thumb" />
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
        <div className="home-section__header"><h2>Weekend Picks</h2></div>
        <div className="home-scroll-row">
          {weekendPicks.map(place => (
            <PlaceCard key={place.id} place={place} onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)} onToggleSave={onToggleBookmark} />
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>Local Hidden Gems</h2></div>
        <div className="home-scroll-row">
          {hiddenGemPicks.map(place => (
            <PlaceCard key={place.id} place={place} onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)} onToggleSave={onToggleBookmark} />
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>Seasonal Foods</h2></div>
        <div className="home-scroll-row">
          {seasonalFoods.map(f => {
            const inSeason = f.months.includes(currentMonth);
            return (
              <div key={f.id} className={`gather-card gather-card--static gather-card--kr${inSeason ? ' is-highlighted' : ''}`} data-kr={f.nameKo}>
                <span className="gather-card__tag">{f.season}{inSeason ? ' · In season now' : ''}</span>
                <h3>{f.name} <span className="gather-card__kr">{f.nameKo}</span></h3>
                <p className="gather-card__desc">{f.blurb}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>Festival Picks</h2></div>
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
        <div className="home-section__header"><h2>Korean Dining Culture</h2></div>
        <div className="home-scroll-row">
          {CULTURE_CARDS.slice(0, 4).map((c, i) => (
            <button key={c.title} className="zone-card" style={{ flex: '0 0 180px' }}
              onClick={() => { setCultureStart(i); setShowCulture(true); }}>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>Recommended Neighborhoods</h2></div>
        <div className="zone-grid">
          {featuredZones.map(z => (
            <button key={z.name} className="zone-card" onClick={() => onExploreZone(z.name)}>
              <h3>{z.name}</h3>
              <p>{z.blurb}</p>
            </button>
          ))}
        </div>
      </div>

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

      {showCulture && <CultureCards onClose={() => setShowCulture(false)} startIndex={cultureStart} />}
    </section>
  );
}
