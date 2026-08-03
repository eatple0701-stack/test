import React, { useEffect, useMemo, useState } from 'react';
import { restaurants } from '../data/restaurants';
import { isQuarantined } from '../data/verification';
import { traditionalMarkets } from '../data/experiences';
import { menuById } from '../domain/catalog/menus.js';
import { isPast, didHappen } from '../domain/policy/table.js';
import { isAccepted, isPending, hasLapsed } from '../domain/policy/seatRequest.js';
import { countsAsMet } from '../domain/policy/attendance.js';
import { isCancelled } from '../domain/policy/cancellation.js';
import { isMember, gateText } from '../domain/policy/access.js';
import { listTables, listAllSignups, listBlocks, deleteBlock } from '../data/tableRepository.js';
import { experienceById, themeIdsOfExperience, themeById, themes } from '../domain/catalog/index.js';
import { themeCompletionKind, COMPLETION_KIND } from '../domain/policy/completion.js';
import { ChevronRightIcon } from './Icons';
import ProfileFields from './ProfileFields';
import PhraseSheet from './PhraseSheet';
import SafetySheet from './SafetySheet';

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

export default function JournalPanel({
  // companions, mapCenter and onOpenTables were declared here and never read.
  // App.jsx still passes companions, and journeyFromLegacy still reads it, so
  // the value is not dead everywhere — it is just dead on this screen.
  bookmarks, onRestaurantClick, onNavigate, journey,
  attestations = [], visitedMarkets = [], profile, onProfileChange,
  onOpenSummary, onOpenTheme, domainJourney, auth, onSignOut, onRequireAuth,
}) {
  // Tables live behind the async repository rather than in React state, so
  // they are fetched here the same way the Tables tab fetches them. When that
  // repository becomes Supabase this call does not change.
  const [myTables, setMyTables] = useState([]);
  const isMemberAuth = isMember(auth);
  const [blocks, setBlocks] = useState([]);
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);

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
          // Everyone who actually shared the table, except the person reading
          // this page.
          //
          // This used to be every signup row, which meant the Passport filed
          // three kinds of people under "you met them": somebody still waiting
          // on the host, somebody the host turned down, and somebody who
          // confirmed and then never came. None of them were at the meal. The
          // record is the one part of this app that is supposed to be a memory
          // rather than a claim, and it was inventing all three.
          //
          // isAccepted reads a row written before approval existed as
          // accepted, so nobody's real dinner disappears from their Passport.
          people: [
            ...(t.hostId === profile?.userId
              ? []
              : [{ key: `host-${t.id}`, name: t.hostName, nationality: t.hostNationality || '' }]),
            ...signups
              .filter(s => s.tableId === t.id && s.userId !== profile?.userId)
              .filter(s => isAccepted(s) && countsAsMet(s))
              .map(s => ({ key: s.userId || s.id, name: s.name, nationality: s.nationality || '' })),
          ].filter(p => p.name),
          // My own seat at this table, or null if I am its host. Carried so
          // "Coming up" can tell a booking from a request — approval created
          // a waiting state, and a screen that lists both as the same thing
          // has a traveller keeping an evening free for a seat nobody gave
          // them yet.
          myRequest: t.hostId === profile?.userId
            ? null
            : signups.find(s => s.tableId === t.id && s.userId === profile?.userId) ?? null,
          // What this host still owes an answer to. A pending request holds a
          // seat, so a host who never looks freezes their own table; the
          // Passport is where they will look.
          waiting: t.hostId === profile?.userId
            ? signups.filter(s => s.tableId === t.id && isPending(s) && !hasLapsed(s, t)).length
            : 0,
        }));
      if (alive) setMyTables(mine);
    })();
    return () => { alive = false; };
  }, [profile]);

  useEffect(() => {
    let alive = true;
    // Caught rather than left to reject uncaught: a project whose schema
    // has not picked up the blocks table yet should show an empty "Blocked"
    // section (i.e. none, since it's only rendered when non-empty), not an
    // unhandled rejection in the console.
    (async () => { const b = await listBlocks().catch(() => []); if (alive) setBlocks(b); })();
    return () => { alive = false; };
  }, []);

  const unblock = async (blockedId) => {
    // Optimistic: the row disappearing is the confirmation, and there is
    // nothing more specific to say if the delete fails than what refetching
    // would already tell the next time this screen opens.
    setBlocks(prev => prev.filter(b => b.blockedId !== blockedId));
    await deleteBlock(blockedId);
  };

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
      if (!didHappen(t)) continue;              // a booking is not a meeting, and a cancelled one is not either
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
      .filter(t => didHappen(t))
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
  const eaten = useMemo(() => myTables.filter(t => didHappen(t)), [myTables]);
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

      {/* Profile first, passport under it — the 8/4 direction, reversing the
          8/2 ordering that buried it at the bottom as "settings". Who you are
          comes before what you did: the name, languages and diets here are
          what every table reads, and a guest looking at this screen should
          see that the Passport starts with a person, not with empty stats. */}
      <div className="journal-settings">
        <div className="journal-section-header">
          <h3>프로필 · Profile</h3>
        </div>
        <p className="journal-settings__hint">
          Set once here and no table asks you again.
        </p>
        <ProfileFields profile={profile} onProfileChange={onProfileChange} />

        {/* The account row, when there is an account. The email is the one
            the team can reach; showing it back is the only receipt the
            unverified signup ever issues, so a typo at least has somewhere
            to be seen. */}
        {auth?.kind === 'member' && (
          <div className="account-block">
            {profile?.avatarUrl ? (
              <img className="account-avatar" src={profile.avatarUrl} alt="Your profile photo" />
            ) : (
              <span className="account-avatar account-avatar--empty" aria-hidden="true">
                {(profile?.name ?? '?').trim().charAt(0) || '?'}
              </span>
            )}
            <div className="account-block__body">
              <span className="account-block__email">{auth.email || '(no email on file)'}</span>
              <button className="account-signout" onClick={onSignOut}>
                로그아웃 · Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* The recording gate, for a guest — under the profile, above the
          passport it is about. The whole structure below stays visible, on
          purpose: this screen used to be a wall for guests, and 우선 패스포트가
          어떻게 구성되어 있는지 보이기는 해야돼 is the correction. Looking is
          free; keeping the record is what needs somebody to belong to. */}
      {!isMemberAuth && (
        <div className="member-gate member-gate--inline">
          <h3 className="member-gate__title">{gateText('passport').title}</h3>
          <p className="member-gate__body">{gateText('passport').body}</p>
          <button className="auth-primary" onClick={() => onRequireAuth?.('passport')}>
            {gateText('passport').cta}
          </button>
        </div>
      )}

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

      {/* Getting help, from a screen that is always two taps away.
          Its only entry point used to be the bottom of a table page, which
          meant it could be reached solely by somebody browsing a specific
          dinner — not by somebody sitting at one, walking away from one, or
          opening the app afterwards. If the host had called the table off it
          was gone altogether. The emergency numbers, the leave-at-any-point
          line and the report channel are all no use behind a door you can
          only find while shopping. */}
      <button className="journal-tool journal-tool--help" onClick={() => setSafetyOpen(true)}>
        <span className="journal-tool__kr">도움이 필요하면</span>
        <span className="journal-tool__body">
          112, 119, the 24-hour travel helpline, and how to reach the 밥친구
          team. You can leave any meal at any point.
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
                      {/* A seat you asked for is not a seat you have. Said
                          on the row itself, because the date and place sit
                          right beneath it and read as a plan either way. */}
                      {t.myRequest && isPending(t.myRequest) && !hasLapsed(t.myRequest, t) && (
                        <span className="upcoming-row__pending">waiting on the host</span>
                      )}
                      {t.myRequest && hasLapsed(t.myRequest, t) && (
                        <span className="upcoming-row__lapsed">no answer — seat released</span>
                      )}
                      {t.waiting > 0 && !isCancelled(t) && (
                        <span className="upcoming-row__pending">
                          {t.waiting === 1 ? '1 waiting on you' : `${t.waiting} waiting on you`}
                        </span>
                      )}
                      {/* The row stays in "Coming up" rather than vanishing,
                          which is the entire reason cancelling stopped
                          deleting. A line that disappears tells nobody
                          anything; this one is the only warning there is. */}
                      {isCancelled(t) && (
                        <span className="upcoming-row__cancelled">called off — do not go</span>
                      )}
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
        <div className="journal-empty" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '16px', marginTop: '20px' }}>
          <img src="https://images.unsplash.com/photo-1580651315530-69c8e0026377?auto=format&fit=crop&q=80&w=200&h=200" alt="Empty Passport" style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', marginBottom: '20px' }} />
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Your Travel Memories are Waiting</h3>
          <p style={{ color: 'var(--muted)', marginBottom: '24px', lineHeight: '1.5' }}>
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

      {/* Only appears once there is something to undo — an empty "Blocked"
          section would be a screen explaining a feature nobody has used yet.
          Reversible on purpose: a block made in a bad moment, or the wrong
          row tapped by mistake, should not need the team to fix it. */}
      {blocks.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>Blocked</h3>
            <span className="journal-badge-count">{blocks.length}</span>
          </div>
          <ul className="blocked-list">
            {blocks.map(b => (
              <li key={b.blockedId} className="blocked-row">
                <span className="blocked-row__name">{b.blockedName || 'Someone'}</span>
                <button className="blocked-row__undo" onClick={() => unblock(b.blockedId)}>
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {phrasesOpen && <PhraseSheet avoids={profile?.avoids} onClose={() => setPhrasesOpen(false)} />}
      {safetyOpen && <SafetySheet onClose={() => setSafetyOpen(false)} />}
    </section>
  );
}
