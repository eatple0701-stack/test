import React, { useMemo } from 'react';
import { restaurants } from '../data/restaurants';
import { isQuarantined } from '../data/verification';
import { getTraveler } from '../data/travelers';
import { traditionalMarkets } from '../data/experiences';
import { experienceById, themeIdsOfExperience, themeById } from '../domain/catalog/index.js';
import ChallengeRow from './ChallengeRow';

function formatStampDate(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// The heading of a day in the record. Full and unambiguous, because this is
// the line a traveller reads back later to remember when something happened.
function formatDayHeading(ts) {
  return new Date(ts).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

const dayKey = (ts) => new Date(ts).toDateString();

function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const activeCount = restaurants.filter(r => !isQuarantined(r)).length;

export default function JournalPanel({
  bookmarks, companions = [], mapCenter, onRestaurantClick, onNavigate, journey,
  attestations = [], visitedMarkets = [], onOpenSummary,
}) {
  const byId = useMemo(() => Object.fromEntries(restaurants.map(r => [r.id, r])), []);

  const stamped = useMemo(() =>
    bookmarks
      .map(b => ({ ...b, place: byId[b.id] }))
      .filter(b => b.place && !isQuarantined(b.place))
      .sort((a, b) => (a.savedAt ?? 0) - (b.savedAt ?? 0)),
  [bookmarks, byId]);

  const visitedList = stamped.filter(s => s.visitedAt != null);
  const savedList = stamped.filter(s => s.visitedAt == null);

  // Logged whenever "Eat together" is confirmed in Match (see App.jsx).
  const metPeople = useMemo(() =>
    companions
      .map(c => ({ ...c, traveler: getTraveler(c.travelerId) }))
      .filter(c => c.traveler)
      .sort((a, b) => b.matchedAt - a.matchedAt),
  [companions]);

  // A visit and a match logged on the same day reads as "shared" — the
  // closest signal available without a real booking/check-in link tying a
  // specific meal to a specific companion.
  const sharedVisits = useMemo(() =>
    visitedList
      .map(v => ({ ...v, companion: metPeople.find(c => sameDay(c.matchedAt, v.visitedAt)) }))
      .filter(v => v.companion),
  [visitedList, metPeople]);

  // The record: what happened, in the order it happened, grouped by day.
  //
  // This used to be a twelve-item tail of places and matches at the bottom of
  // the panel, under four counters. A trip is not a set of counters — the
  // thing worth keeping is that on one particular Tuesday you ate temple food
  // at Balwoo, had the tea afterwards, and met someone. So every kind of
  // completion the app knows about lands here: cultures finished, places
  // visited and saved, markets walked, people met.
  //
  // Nothing is capped. A traveller who did twenty things should see twenty.
  const days = useMemo(() => {
    const marketById = Object.fromEntries(traditionalMarkets.map(m => [m.id, m]));

    // An experience is remembered as the culture it belongs to, because that
    // is what was chosen on Explore — "Temple Life", not "temple-tea".
    const themeOf = (experienceId) => {
      const themeId = themeIdsOfExperience(experienceId)[0];
      return themeId ? themeById(themeId) : null;
    };

    const items = [
      ...attestations
        .map(a => ({ entry: a, exp: experienceById(a.id) }))
        .filter(({ exp }) => exp)
        .map(({ entry, exp }) => ({
          type: 'experience', ts: entry.at, key: `exp-${exp.id}`,
          title: exp.title, subtitle: themeOf(exp.id)?.title ?? exp.zones[0] ?? null,
        })),
      ...visitedMarkets
        .map(m => ({ entry: m, market: marketById[m.id] }))
        .filter(({ market }) => market)
        .map(({ entry, market }) => ({
          type: 'market', ts: entry.at, key: `market-${market.id}`,
          title: market.name, subtitle: market.zone,
        })),
      ...visitedList.map(v => ({
        type: 'visit', ts: v.visitedAt, key: `visit-${v.place.id}`,
        title: v.place.name.split('(')[0].trim(), subtitle: v.place.zone,
        place: v.place,
      })),
      ...savedList.map(v => ({
        type: 'save', ts: v.savedAt, key: `save-${v.place.id}`,
        title: v.place.name.split('(')[0].trim(), subtitle: v.place.zone,
      })),
      ...metPeople.map(c => ({
        type: 'match', ts: c.matchedAt, key: `match-${c.travelerId}`,
        title: `${c.traveler.flag} ${c.traveler.name}`, subtitle: c.traveler.nationality,
      })),
    ];

    // Entries saved before completions carried a timestamp have ts 0. They are
    // real and still count; they just cannot be placed on a specific day, so
    // they collect at the end rather than claiming 1 January 1970.
    const dated = items.filter(i => i.ts > 0).sort((a, b) => b.ts - a.ts);
    const undated = items.filter(i => !(i.ts > 0));

    const grouped = [];
    for (const item of dated) {
      const key = dayKey(item.ts);
      const last = grouped[grouped.length - 1];
      if (last && last.key === key) last.items.push(item);
      else grouped.push({ key, heading: formatDayHeading(item.ts), items: [item] });
    }
    if (undated.length > 0) grouped.push({ key: 'undated', heading: 'Earlier', items: undated });
    return grouped;
  }, [attestations, visitedMarkets, visitedList, savedList, metPeople]);

  const recordCount = useMemo(
    () => days.reduce((n, d) => n + d.items.length, 0),
    [days],
  );

  // Badge counts come from the journey engine, not from a second tally kept
  // here. They used to be measured off this panel's own visited list, which
  // is why a theme finished by attestation left the Passport reading zero:
  // the engine knew, and the Passport was counting something else.
  //
  // Nationalities stay local — the engine models companions but not where
  // they are from, and inventing a count it does not hold would put the two
  // back out of step for the sake of one badge.
  const distinctNationalities = useMemo(() => new Set(metPeople.map(c => c.traveler.nationality)).size, [metPeople]);
  const badges = useMemo(() => [
    { id: 'first-meetup', icon: '🤝', name: 'First Meetup', current: journey.companionCount, target: 1 },
    { id: 'foods', icon: '🍜', name: 'Tried 5 Korean foods', current: journey.experienceCount, target: 5 },
    { id: 'districts', icon: '🗺️', name: 'Visited 3 districts', current: journey.districtCount, target: 3 },
    { id: 'cuisines', icon: '🍱', name: 'Explored 3 cuisines', current: journey.cuisineCount, target: 3 },
    { id: 'world-table', icon: '🌍', name: 'Met people from 3 countries', current: distinctNationalities, target: 3 },
  ].map(b => ({
    ...b,
    earned: b.current >= b.target,
    remaining: Math.max(b.target - b.current, 0),
    progress: `${Math.min(b.current, b.target)}/${b.target}`,
  })), [journey, distinctNationalities]);
  const earnedBadgeCount = badges.filter(b => b.earned).length;
  const nextBadge = useMemo(() =>
    badges.filter(b => !b.earned).sort((a, b) => a.remaining - b.remaining)[0] ?? null,
  [badges]);

  const isEmpty = recordCount === 0;

  return (
    <section className="journal-panel" aria-label="Journal">
      <div className="passport-cover">
        <div className="passport-cover__head">
          <h2 className="passport-cover__title">Travel Memories</h2>
          {onOpenSummary && (
            <button className="passport-share-btn" onClick={onOpenSummary}>Share journey</button>
          )}
        </div>
      </div>

      {days.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>Your record</h3>
            <span className="journal-badge-count">{recordCount} moments</span>
          </div>
          <div className="record">
            {days.map(day => (
              <div key={day.key} className="record-day">
                <h4 className="record-day__date">{day.heading}</h4>
                <ul className="record-day__items">
                  {day.items.map(item => (
                    <li key={item.key} className={`record-item record-item--${item.type}`}>
                      <span className="record-item__mark" aria-hidden="true">
                        {item.type === 'save' ? '☆' : '✓'}
                      </span>
                      <span className="record-item__title">{item.title}</span>
                      {item.subtitle && (
                        <span className="record-item__sub">{item.subtitle}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="journal-section passport-summary">
          <div className="journal-section-header">
            <h3>Progress</h3>
          </div>
          {/* Counts come from the engine; the lists below still come from the
              bookmark records, because a list needs the records themselves.
              They sit under the record now rather than above it — the trip is
              the point, and the numbers are a way of reading it. */}
          <div className="passport-stats">
            <div className="stat-box">
              <span className="stat-num">{journey.experienceCount}</span>
              <span className="stat-label">Done</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{savedList.length}</span>
              <span className="stat-label">Saved</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{journey.companionCount}</span>
              <span className="stat-label">Met</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{journey.districtCount}</span>
              <span className="stat-label">Areas</span>
            </div>
          </div>

          <div className="passport-progress">
            <div className="passport-progress__row">
              <span>{earnedBadgeCount} of {badges.length} badges</span>
              <span>{Math.round((earnedBadgeCount / badges.length) * 100)}%</span>
            </div>
            <div className="passport-progress__bar">
              <div className="passport-progress__fill" style={{ width: `${(earnedBadgeCount / badges.length) * 100}%` }} />
            </div>
            {nextBadge && (
              <p className="passport-progress__next">
                {nextBadge.remaining} more to unlock {nextBadge.icon} {nextBadge.name}
              </p>
            )}
          </div>
      </div>

      <div className="journal-section">
        <div className="journal-section-header">
          <h3>Achievements</h3>
          <span className="journal-badge-count">{earnedBadgeCount} Earned</span>
        </div>
        <div className="badges-grid">
          {badges.map(b => (
            <div key={b.id} className={`badge-item${b.earned ? ' earned' : ' locked'}`} title={b.earned ? 'Earned' : b.progress}>
              <div className="badge-icon">{b.icon}</div>
              <span className="badge-name">{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      {journey && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>Explore Challenge</h3>
            <span className="journal-badge-count">{journey.doneCount}/{journey.challenges.length} Complete</span>
          </div>
          <ChallengeRow challenges={journey.challenges} />
        </div>
      )}

      {metPeople.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>People Met</h3>
          </div>
          <div className="companion-list">
            {metPeople.map(({ travelerId, matchedAt, traveler }) => (
              <div key={travelerId} className="companion-card">
                <div className="companion-card__avatar" style={{ background: traveler.color }}>
                  {traveler.name.slice(0, 1)}
                </div>
                <div className="companion-card__body">
                  <span className="companion-card__name">{traveler.flag} {traveler.name}</span>
                  <span className="companion-card__meta">{traveler.nationality} · met {formatStampDate(matchedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sharedVisits.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>Visited Together</h3>
          </div>
          <div className="journal-grid">
            {sharedVisits.map(({ place, visitedAt, companion }) => (
              <button key={place.id} className="stamp" onClick={() => onRestaurantClick(place)}>
                <span className="stamp-ring">
                  <img src={place.image} alt="" />
                </span>
                <span className="stamp-name">{place.name.split('(')[0].trim()}</span>
                <span className="stamp-zone">with {companion.traveler.flag} {companion.traveler.name}</span>
                {visitedAt && <span className="stamp-date">{formatStampDate(visitedAt)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {visitedList.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>Visited Places</h3>
          </div>
          <div className="journal-grid">
            {visitedList.map(({ place, visitedAt }) => (
              <button
                key={place.id}
                className="stamp"
                onClick={() => onRestaurantClick(place)}
              >
                <span className="stamp-ring">
                  <img src={place.image} alt="" />
                </span>
                <span className="stamp-name">{place.name.split('(')[0].trim()}</span>
                <span className="stamp-zone">{place.zone}</span>
                {visitedAt && <span className="stamp-date">{formatStampDate(visitedAt)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {savedList.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>Saved for Later</h3>
          </div>
          <div className="journal-grid">
            {savedList.map(({ place, savedAt }) => (
              <button
                key={place.id}
                className="stamp stamp--saved"
                onClick={() => onRestaurantClick(place)}
              >
                <span className="stamp-ring">
                  <img src={place.image} alt="" />
                </span>
                <span className="stamp-name">{place.name.split('(')[0].trim()}</span>
                <span className="stamp-zone">{place.zone}</span>
                {savedAt && <span className="stamp-date">{formatStampDate(savedAt)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="journal-empty" style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '16px', marginTop: '20px' }}>
          <img src="https://images.unsplash.com/photo-1580651315530-69c8e0026377?auto=format&fit=crop&q=80&w=200&h=200" alt="Empty Passport" style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', marginBottom: '20px' }} />
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Your Travel Memories are Waiting</h3>
          <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.5' }}>
            Start your Korean adventure by exploring places, or meet fellow travelers to create unforgettable memories together.
          </p>
          {onNavigate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn-primary" onClick={() => onNavigate('match')} style={{ width: '100%' }}>Find Travel Mates</button>
              <button className="btn-secondary" onClick={() => onNavigate('home')} style={{ width: '100%' }}>Explore Places</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
