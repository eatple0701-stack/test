import React, { useMemo } from 'react';
import { restaurants } from '../data/restaurants';
import { isQuarantined } from '../data/verification';
import { getTraveler } from '../data/travelers';
import { getCulture } from '../data/culture';
import ChallengeRow from './ChallengeRow';

function formatStampDate(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const activeCount = restaurants.filter(r => !isQuarantined(r)).length;

export default function JournalPanel({ bookmarks, companions = [], mapCenter, onRestaurantClick, onNavigate, journey, onOpenSummary }) {
  const byId = useMemo(() => Object.fromEntries(restaurants.map(r => [r.id, r])), []);

  const stamped = useMemo(() =>
    bookmarks
      .map(b => ({ ...b, place: byId[b.id] }))
      .filter(b => b.place && !isQuarantined(b.place))
      .sort((a, b) => (a.savedAt ?? 0) - (b.savedAt ?? 0)),
  [bookmarks, byId]);

  const visitedList = stamped.filter(s => s.visitedAt != null);
  const savedList = stamped.filter(s => s.visitedAt == null);

  const neighborhoods = useMemo(() => {
    const zones = new Set(visitedList.map(s => s.place.zone));
    return Array.from(zones);
  }, [visitedList]);

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

  const memories = useMemo(() => {
    const items = [
      ...visitedList.map(v => ({
        type: 'visit', ts: v.visitedAt, key: `visit-${v.place.id}`,
        title: `Visited ${v.place.name.split('(')[0].trim()}`, subtitle: v.place.zone,
        place: v.place,
      })),
      ...savedList.map(v => ({
        type: 'save', ts: v.savedAt, key: `save-${v.place.id}`,
        title: `Saved ${v.place.name.split('(')[0].trim()}`, subtitle: v.place.zone,
      })),
      ...metPeople.map(c => ({
        type: 'match', ts: c.matchedAt, key: `match-${c.travelerId}`,
        title: `Matched with ${c.traveler.flag} ${c.traveler.name}`, subtitle: c.traveler.nationality,
      })),
    ];
    return items.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0)).slice(0, 12);
  }, [visitedList, savedList, metPeople]);

  // Earned from real state, not a fixed list — a traveler's Passport should
  // reflect what they have actually done in the app so far.
  const distinctCategories = useMemo(() => new Set(visitedList.map(v => v.place.category)).size, [visitedList]);
  const distinctNationalities = useMemo(() => new Set(metPeople.map(c => c.traveler.nationality)).size, [metPeople]);
  const badges = useMemo(() => [
    { id: 'first-meetup', icon: '🤝', name: 'First Meetup', current: companions.length, target: 1 },
    { id: 'foods', icon: '🍜', name: 'Tried 5 Korean foods', current: visitedList.length, target: 5 },
    { id: 'districts', icon: '🗺️', name: 'Visited 3 districts', current: neighborhoods.length, target: 3 },
    { id: 'cuisines', icon: '🍱', name: 'Explored 3 cuisines', current: distinctCategories, target: 3 },
    { id: 'world-table', icon: '🌍', name: 'Met people from 3 countries', current: distinctNationalities, target: 3 },
  ].map(b => ({
    ...b,
    earned: b.current >= b.target,
    remaining: Math.max(b.target - b.current, 0),
    progress: `${Math.min(b.current, b.target)}/${b.target}`,
  })), [companions.length, visitedList.length, neighborhoods.length, distinctCategories, distinctNationalities]);
  const earnedBadgeCount = badges.filter(b => b.earned).length;
  const nextBadge = useMemo(() =>
    badges.filter(b => !b.earned).sort((a, b) => a.remaining - b.remaining)[0] ?? null,
  [badges]);

  const isEmpty = stamped.length === 0 && metPeople.length === 0;

  return (
    <section className="journal-panel" aria-label="Journal">
      <div className="passport-cover">
        <div className="passport-cover__head">
          <h2 className="passport-cover__title">Travel Memories</h2>
          {onOpenSummary && (
            <button className="passport-share-btn" onClick={onOpenSummary}>Share journey</button>
          )}
        </div>
        <div className="passport-stats">
          <div className="stat-box">
            <span className="stat-num">{visitedList.length}</span>
            <span className="stat-label">Visited</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{savedList.length}</span>
            <span className="stat-label">Saved</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{metPeople.length}</span>
            <span className="stat-label">Met</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{neighborhoods.length}</span>
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

      {memories.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>My Korea Journey</h3>
          </div>
          <div className="memory-timeline">
            {memories.map(m => (
              <div key={m.key} className={`memory-item memory-item--${m.type}`}>
                <span className="memory-item__dot" aria-hidden="true" />
                <div className="memory-item__body">
                  <span className="memory-item__title">{m.title}</span>
                  <span className="memory-item__subtitle">{m.subtitle} · {formatStampDate(m.ts)}</span>

                  {m.type === 'visit' && getCulture(m.place).passportMission && (
                    <p className="memory-item__mission">
                      ✓ {getCulture(m.place).passportMission.title}
                    </p>
                  )}
                </div>
              </div>
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
