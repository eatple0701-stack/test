import React, { useEffect, useMemo, useState } from 'react';
import { restaurants } from '../data/restaurants';
import { isQuarantined } from '../data/verification';
import { traditionalMarkets } from '../data/experiences';
import { menuById } from '../domain/catalog/menus.js';
import { isPast } from '../domain/policy/table.js';
import { listTables, listAllSignups } from '../data/tableRepository.js';
import { experienceById, themeIdsOfExperience, themeById, themes } from '../domain/catalog/index.js';
import { themeCompletionKind, COMPLETION_KIND } from '../domain/policy/completion.js';
import { ChevronRightIcon } from './Icons';
import ProfileFields from './ProfileFields';
import PhraseSheet from './PhraseSheet';

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

const activeCount = restaurants.filter(r => !isQuarantined(r)).length;

export default function JournalPanel({
  bookmarks, companions = [], mapCenter, onRestaurantClick, onNavigate, journey,
  attestations = [], visitedMarkets = [], profile, onProfileChange,
  onOpenSummary, onOpenTables, onOpenTheme, domainJourney,
}) {
  // Tables live behind the async repository rather than in React state, so
  // they are fetched here the same way the Tables tab fetches them. When that
  // repository becomes Supabase this call does not change.
  const [myTables, setMyTables] = useState([]);
  const [phrasesOpen, setPhrasesOpen] = useState(false);

  // Every culture this traveller finished, with what backed each one.
  // Computed from the same policy the stamp uses, so the two cannot drift.
  const walkedThemes = useMemo(() => (domainJourney ? themes
    .map(theme => ({ theme, kind: themeCompletionKind(theme.id, domainJourney) }))
    .filter(w => w.kind !== null) : []), [domainJourney]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [tables, signups] = await Promise.all([listTables(), listAllSignups()]);
      const mine = tables
        .filter(t =>
          t.hostId === profile?.userId ||
          signups.some(s => s.tableId === t.id && s.userId === profile?.userId))
        .map(t => ({
          ...t,
          hosted: t.hostId === profile?.userId,
          // Everyone at the table except the person reading this page.
          people: [
            ...(t.hostId === profile?.userId
              ? []
              : [{ key: `host-${t.id}`, name: t.hostName, nationality: t.hostNationality || '' }]),
            ...signups
              .filter(s => s.tableId === t.id && s.userId !== profile?.userId)
              .map(s => ({ key: s.userId || s.id, name: s.name, nationality: s.nationality || '' })),
          ].filter(p => p.name),
        }));
      if (alive) setMyTables(mine);
    })();
    return () => { alive = false; };
  }, [profile]);

  // A meal you have not eaten yet is a plan, not a memory. The record below
  // is what happened; a table on Sunday belongs above it as something still
  // to come. Filing it as history would have the Passport claiming a dinner
  // that has not been served.
  const upcomingTables = useMemo(
    () => myTables.filter(t => !isPast(t)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [myTables],
  );
  const byId = useMemo(() => Object.fromEntries(restaurants.map(r => [r.id, r])), []);

  const stamped = useMemo(() =>
    bookmarks
      .map(b => ({ ...b, place: byId[b.id] }))
      .filter(b => b.place && !isQuarantined(b.place))
      .sort((a, b) => (a.savedAt ?? 0) - (b.savedAt ?? 0)),
  [bookmarks, byId]);

  const visitedList = stamped.filter(s => s.visitedAt != null);
  const savedList = stamped.filter(s => s.visitedAt == null);

  // The people you actually shared a meal with.
  //
  // This used to read a list written by a swipe deck of eighty procedurally
  // generated travellers — names assembled from arrays, matched by tapping a
  // card. Nobody was ever met. It now comes from the tables you sat at, where
  // the other names are people who asked for a seat at a real meal.
  const metPeople = useMemo(() => {
    const seen = new Map();
    for (const t of myTables) {
      if (!isPast(t)) continue;                 // a booking is not a meeting
      const at = new Date(`${t.date}T${t.time || '00:00'}`).getTime();
      for (const person of t.people) {
        // First shared meal wins, so a regular does not appear twice.
        if (!seen.has(person.key)) seen.set(person.key, { ...person, metAt: at });
      }
    }
    return [...seen.values()].sort((a, b) => b.metAt - a.metAt);
  }, [myTables]);

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

    // A meal that has happened, timestamped by when it was eaten rather than
    // when it was booked — the record is a diary, and the day that matters is
    // the day you sat down.
    const tableItems = myTables
      .filter(t => isPast(t))
      .map(t => {
        const menu = menuById(t.menuId);
        if (!menu) return null;
        const at = new Date(`${t.date}T${t.time || '00:00'}`);
        return {
          type: 'table',
          ts: Number.isFinite(at.getTime()) ? at.getTime() : 0,
          key: `table-${t.id}`,
          title: menu.name,
          subtitle: t.people.length > 0
            ? `with ${t.people.map(p => p.name).join(', ')}`
            : (t.hosted ? 'your table' : t.place),
        };
      })
      .filter(Boolean);

    const items = [
      ...tableItems,
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
      ...metPeople.map(p => ({
        type: 'match', ts: p.metAt, key: `met-${p.key}`,
        title: `Met ${p.name}`, subtitle: p.nationality || null,
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
  }, [attestations, visitedMarkets, visitedList, savedList, metPeople, myTables]);

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
  const distinctNationalities = useMemo(
    () => new Set(metPeople.map(p => p.nationality).filter(Boolean)).size,
    [metPeople],
  );
  // Meals that have actually happened, and how many different dishes they
  // covered — the two numbers this product is about.
  const eaten = useMemo(() => myTables.filter(t => isPast(t)), [myTables]);
  const dishesShared = useMemo(
    () => new Set(eaten.map(t => t.menuId)).size,
    [eaten],
  );

  // One goal list, not two.
  //
  // The Passport carried five badges and six challenges — eleven goals, all
  // of them from the restaurant-finder this used to be. "Taste three kinds of
  // Korean kitchen", "Eat something fermented", "Explore three districts":
  // a tourist checklist that says nothing about sitting down with somebody.
  // Four remain, and each one is the product's own sentence.
  const goals = useMemo(() => [
    {
      id: 'first-table',
      name: 'Share one table',
      hint: 'The whole idea, once.',
      current: eaten.length, target: 1,
    },
    {
      id: 'three-dishes',
      name: 'Three dishes you could not have ordered alone',
      hint: 'Different dishes, not repeats.',
      current: dishesShared, target: 3,
    },
    {
      id: 'two-countries',
      name: 'Eat with people from two countries',
      hint: 'Counted from who was at your tables.',
      current: distinctNationalities, target: 2,
    },
    {
      id: 'one-culture',
      name: 'Walk one culture end to end',
      hint: 'Any theme on Explore, finished.',
      current: journey.experienceCount, target: 2,
    },
  ].map(g => ({
    ...g,
    done: g.current >= g.target,
    remaining: Math.max(g.target - g.current, 0),
  })), [eaten, dishesShared, distinctNationalities, journey]);

  const goalsDone = goals.filter(g => g.done).length;

  // A traveller with a table booked for Sunday has not done nothing — showing
  // them "your memories are waiting" underneath it would be the page arguing
  // with itself.
  const isEmpty = recordCount === 0 && upcomingTables.length === 0;

  return (
    <section className="journal-panel" aria-label="Journal">
      <header className="screen-head screen-head--dark">
        <div className="screen-head__row">
          <div>
            <span className="screen-head__kr">여권</span>
            <h1 className="screen-head__title">What this trip has been so far.</h1>
          </div>
          {onOpenSummary && (
            <button className="screen-head__link" onClick={onOpenSummary}>Share</button>
          )}
        </div>
        {/* The masthead counted the record and nothing else, so a traveller
            who had just taken a seat was told nothing had happened directly
            above a section listing what was happening on Sunday. The same
            argument the isEmpty check below avoids, one element higher. */}
        <p className="screen-head__sub">
          {recordCount > 0
            ? `${recordCount} moment${recordCount === 1 ? '' : 's'} recorded.`
            : upcomingTables.length > 0
              ? `Nothing recorded yet — ${upcomingTables.length === 1
                  ? 'one table booked. It lands here after.'
                  : `${upcomingTables.length} tables booked. They land here after.`}`
              : 'Nothing recorded yet — whatever you do lands here.'}
        </p>
      </header>

      {/* The phrasebook, reachable without a table. It lived only inside a
          table you had already joined, which is the wrong place for the thing
          a traveller wants at a counter, in a shop, at somebody else's dinner
          — a tester asked for exactly this: "have menu for translations/what
          to say". High on the screen because it is a tool, not a record. */}
      <button className="journal-tool" onClick={() => setPhrasesOpen(true)}>
        <span className="journal-tool__kr">식탁에서</span>
        <span className="journal-tool__body">
          What to say — ordering, what you cannot eat, and something to ask the
          table. Works with or without a meal booked.
        </span>
      </button>

      {/* Above the record, because it has not happened yet. This is also the
          only place a traveller can check what they agreed to — a seat taken
          three days ago is easy to forget and expensive to miss. */}
      {upcomingTables.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>Coming up</h3>
            <span className="journal-badge-count">{upcomingTables.length}</span>
          </div>
          <div className="upcoming-list">
            {upcomingTables.map(t => {
              const menu = menuById(t.menuId);
              if (!menu) return null;
              return (
                <div key={t.id} className="upcoming-row">
                  <span className="upcoming-row__kr" aria-hidden="true">{menu.nameKo}</span>
                  <div className="upcoming-row__body">
                    <span className="upcoming-row__dish">
                      {menu.name}
                      {t.hosted && <span className="upcoming-row__badge">you host</span>}
                    </span>
                    <span className="upcoming-row__when">
                      {new Date(`${t.date}T00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}{t.time} · {t.place}
                    </span>
                    {t.people.length > 0 && (
                      <span className="upcoming-row__who">with {t.people.map(p => p.name).join(', ')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Four counts, and each one is something this app helped cause.
          "Areas" and "Saved" were here before — a district total is a tourist
          statistic, and a wishlist is not an achievement. */}
      <div className="journal-section passport-summary">
        <div className="journal-section-header">
          <h3>This trip so far</h3>
        </div>
        <div className="passport-stats">
          <div className="stat-box">
            <span className="stat-num">{eaten.length}</span>
            <span className="stat-label">밥상 · tables</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{metPeople.length}</span>
            <span className="stat-label">사람 · met</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{journey.experienceCount}</span>
            <span className="stat-label">문화 · done</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{journey.foodCount}</span>
            <span className="stat-label">장소 · visited</span>
          </div>
        </div>
      </div>

      <div className="journal-section">
        <div className="journal-section-header">
          <h3>Worth doing</h3>
          <span className="journal-badge-count">{goalsDone}/{goals.length}</span>
        </div>
        <ul className="goal-list">
          {goals.map(g => (
            <li key={g.id} className={`goal${g.done ? ' is-done' : ''}`}>
              <span className="goal__mark" aria-hidden="true">{g.done ? '✓' : ''}</span>
              <span className="goal__body">
                <span className="goal__name">{g.name}</span>
                <span className="goal__hint">
                  {g.done ? 'Done.' : `${g.hint} ${g.current}/${g.target}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {metPeople.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>People Met</h3>
          </div>
          <div className="companion-list">
            {metPeople.map(p => (
              <div key={p.key} className="companion-card">
                <div className="companion-card__avatar" style={{ background: 'var(--ex-brass)' }}>
                  {p.name.slice(0, 1)}
                </div>
                <div className="companion-card__body">
                  <span className="companion-card__name">{p.name}</span>
                  <span className="companion-card__meta">
                    {p.nationality ? `${p.nationality} · ` : ''}shared a table {formatStampDate(p.metAt)}
                  </span>
                </div>
              </div>
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
            Ask for a seat at a table, or explore a culture — whatever you do lands here.
          </p>
          {onNavigate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn-primary" onClick={() => onNavigate('match')} style={{ width: '100%' }}>Find a table</button>
              <button className="btn-secondary" onClick={() => onNavigate('home')} style={{ width: '100%' }}>Explore cultures</button>
            </div>
          )}
        </div>
      )}

      {/* "cannot review cultures i read through in passport" — a tester's
          note, and they were right: a theme you finished disappeared from
          this screen entirely. Finishing something and then having no way
          back to it is the shape of a reward that is not one.

          Each row says what backed it, using the same three words the stamp
          uses, so the record and the moment agree. */}
      {walkedThemes.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>Cultures you walked</h3>
            <span className="journal-badge-count">{walkedThemes.length}</span>
          </div>
          <div className="walked-list">
            {walkedThemes.map(w => (
              <button
                key={w.theme.id}
                className="walked-row"
                onClick={() => onOpenTheme?.(w.theme.id)}
              >
                <span className="walked-row__body">
                  <span className="walked-row__title">{w.theme.title}</span>
                  {w.theme.titleKo && <span className="walked-row__ko">{w.theme.titleKo}</span>}
                  <span className="walked-row__basis">
                    {w.kind === COMPLETION_KIND.VISITED ? 'Visited'
                      : w.kind === COMPLETION_KIND.MIXED ? 'Part visited, part on your word'
                        : 'On your own word'}
                  </span>
                </span>
                <ChevronRightIcon size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Settings, at the bottom of the same screen rather than behind a fifth
          tab. The 8/2 meeting decided to merge Profile into the Passport, and
          a tester wrote the same thing on their own. Below the record because
          of what people come here for: checking Sunday's table many times,
          changing a language once. */}
      <div className="journal-settings">
        <div className="journal-section-header">
          <h3>설정 · Settings</h3>
        </div>
        <p className="journal-settings__hint">
          Set once here and no table asks you again.
        </p>
        <ProfileFields profile={profile} onProfileChange={onProfileChange} />
      </div>

      {phrasesOpen && <PhraseSheet avoids={profile?.avoids} onClose={() => setPhrasesOpen(false)} />}
    </section>
  );
}
