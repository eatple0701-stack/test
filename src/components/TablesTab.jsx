import React, { useEffect, useMemo, useState } from 'react';
import { menus, menuById, CATEGORY_LABEL } from '../domain/catalog/menus.js';
import { seatsRemaining, isPast } from '../domain/policy/table.js';
import {
  listTables, listAllSignups, listBlocks, seedSampleTables, isLocalOnly,
} from '../data/tableRepository.js';
import { conflictsFor } from '../data/profile';
import { tableKind, tableKindLabel, guideSummary } from '../domain/catalog/hosts.js';
import { tableIncludesGender } from '../domain/catalog/genders.js';
import { visibleTables } from '../domain/policy/blocking.js';
import { emptyReason, emptyText, hasOtherDays, EMPTY } from '../domain/policy/emptiness.js';
import { stationForTable, cityOfTables } from '../domain/policy/venue.js';
import { timeText, clockWarning } from '../domain/policy/clock.js';
import { restaurants } from '../data/restaurants';
import { acceptedSignups, askDeadline } from '../domain/policy/seatRequest.js';
import { weekAhead } from '../domain/policy/week.js';
import { PROMISES, PROMISES_LEAD } from '../content/promises.js';
import { HOW_STEPS, HOW_WHY } from '../content/howItWorks.js';
import TablesMap from './TablesMap';
import PhraseSheet from './PhraseSheet';
import { hostRecord } from '../data/tableRepository.js';
import { ChevronRightIcon, MapPinIcon, ClockIcon, CheckIcon } from './Icons';
import { bookable } from '../domain/policy/cancellation.js';
import { isMember } from '../domain/policy/access.js';

// 밥친구 — the tables you can ask to sit at.
//
// This is the screen the business plan is actually about. A solo traveller
// cannot order 삼겹살, so the app does not try to sell them a restaurant; it
// shows them a dish and the people already going.
//
// The menu comes first, not the date and not the neighbourhood, because the
// dish is what the traveller wants and cannot have. Filtering by anything
// else would turn this back into a listings site.

const dayLabel = (date) => {
  const d = new Date(`${date}T00:00`);
  if (!Number.isFinite(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

// The day chips that used to live here are gone — see the week strip in the
// render, and src/domain/policy/week.js, which owns the date arithmetic they
// used to duplicate.

// onOpenPassport is gone with the top bar it served: the way to your own
// Passport is the chip in the app chrome now, on every screen rather than
// this one.
export default function TablesTab({ onOpenTable, onCreateTable, onRequestTable, profile, auth, onOpenAuth }) {
  const [tables, setTables] = useState(null);
  const [signups, setSignups] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [menuFilter, setMenuFilter] = useState(null);
  // A personal view preference, not a rule the app enforces on who may sit
  // where — like menuFilter, it changes what this one screen shows and
  // nothing else. See HANDOFF.md §4: praised by a reviewer for existing
  // before it did.
  const [womenFilter, setWomenFilter] = useState(false);
  // A date from the week strip, or null for the whole week.
  const [dayFilter, setDayFilter] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  // Opened only from the bare-week empty state. Local, the way TableDetail and
  // the Passport each hold their own — the sheet takes no state worth lifting.
  const [phrasesOpen, setPhrasesOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      await seedSampleTables();
      // listBlocks() caught on its own: a deploy that reaches a project
      // before supabase/schema.sql's blocks table exists must not turn into
      // the whole tab stuck on "Loading tables…" forever — Promise.all
      // rejects as one unit, and this effect has nothing downstream to catch
      // it. Blocking silently doing nothing is the correct degraded state
      // until the schema catches up; a blank Tables tab is not.
      const [t, s] = await Promise.all([listTables(), listAllSignups()]);
      const b = await listBlocks().catch(() => []);
      if (alive) { setTables(bookable(t)); setSignups(s); setBlockedIds(b.map(x => x.blockedId)); }
    })();
    return () => { alive = false; };
  }, []);

  const signupsFor = useMemo(() => {
    const map = {};
    for (const s of signups) (map[s.tableId] ??= []).push(s);
    return map;
  }, [signups]);

  // Past meals drop off the list rather than being greyed out: this screen
  // answers "where can I eat", and a dinner that already happened is not an
  // answer to it. Blocked hosts drop off the same way and at the same step —
  // before the menu/gender filters derive from this list, so a dish whose
  // only table is from somebody blocked does not show up as choosable either.
  const open = useMemo(
    () => visibleTables((tables ?? []).filter(t => !isPast(t)), blockedIds),
    [tables, blockedIds],
  );

  const shown = useMemo(() => {
    let list = menuFilter ? open.filter(t => t.menuId === menuFilter) : open;
    if (womenFilter) {
      list = list.filter(t => tableIncludesGender(t, signupsFor[t.id] ?? [], 'Woman'));
    }
    // dayFilter is a date now, not a named window — the strip made the
    // named windows redundant and this comparison exact.
    if (dayFilter) list = list.filter(t => t.date === dayFilter);
    return list;
  }, [open, menuFilter, womenFilter, dayFilter, signupsFor]);

  // Counted from every open table rather than from what the filters left, so
  // the strip keeps telling the truth about the week while a filter is on.
  const week = useMemo(() => weekAhead(open), [open]);

  // How many tables each host has actually held, by host id.
  //
  // 여기어때 puts "11,480명 평가" on every card, and the number doing the
  // work there is the count, not the score — a 9.2 from three people is not
  // a 9.2. Ours is tables held, which is the only count we have that nobody
  // can inflate. It belongs on the card because the card is where people
  // filter; the detail page already had it, one scroll too late.
  //
  // One lookup per host rather than per table, and failures are dropped
  // rather than surfaced: a missing record renders no badge, which is the
  // same thing it means.
  const [hostRecords, setHostRecords] = useState({});
  useEffect(() => {
    let alive = true;
    const ids = [...new Set(open.map(t => t.hostId).filter(Boolean))];
    const missing = ids.filter(id => !(id in hostRecords));
    if (missing.length === 0) return undefined;
    (async () => {
      const found = {};
      await Promise.all(missing.map(async (id) => {
        found[id] = await hostRecord(id).catch(() => null);
      }));
      if (alive) setHostRecords(prev => ({ ...prev, ...found }));
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Only offer a filter for dishes somebody is actually eating — a chip that
  // always returns nothing is a dead end dressed as a choice.
  const liveMenuIds = useMemo(
    () => menus.filter(m => open.some(t => t.menuId === m.id)).map(m => m.id),
    [open],
  );

  return (
    <section className="tables-tab" aria-label="밥친구 tables">
      {/* The wordmark and the sign-in pair used to sit here, at the top of
          this one tab. They are app chrome, not landing-page content — see
          .app-chrome in App.jsx, where they now live on every screen. */}

      <header className="screen-head screen-head--dark">
        <span className="screen-head__kr">밥친구</span>
        <h1 className="screen-head__title">Dishes you cannot order alone.</h1>
        <p className="screen-head__sub">
          Ask to sit at a table, or open one and see who comes.
        </p>
        {/* One CTA, chosen by who is looking — Meetup's front page asks a
            stranger to join, not to host. A member gets the real verb. The
            tables below make the pitch either way; that is the whole reason
            they are the landing page. */}
        {isMember(auth) ? (
          <button className="screen-head__cta" translate="no" onClick={onCreateTable}>
            상 차리기 · Open a table
          </button>
        ) : (
          <>
            <button className="screen-head__cta" translate="no" onClick={() => onOpenAuth?.('signup')}>
              무료로 가입하기 · Join 밥친구
            </button>
            {/* What joining buys, as a number. 야놀자 does not say "join for
                benefits", it says you get the member price — the reward is
                stated in the unit the customer came for. Ours is seats, and
                the count is the real one, so an empty week says so rather
                than promising a full one. */}
            <p className="screen-head__reward">
              {open.length > 0
                ? `가입하면 지금 열려 있는 밥상 ${open.length}곳에 자리를 요청할 수 있어요 · ${open.length} table${open.length === 1 ? '' : 's'} open right now`
                : '가입하면 첫 밥상을 직접 열 수 있어요 · Join and open the first table yourself'}
            </p>
          </>
        )}
      </header>

      {/* The explaining used to stand here, between the hero and the tables,
          and it cost a guest 1.7 screens of scrolling before they saw a
          single meal (measured 2026-08-04: first card at 1391px on a 812px
          phone). Meetup puts its events second and its "how it works" below
          them, and that order is right for the same reason the 8/1 tester
          was confused by neither: what a stranger needs first is evidence
          that real tables exist, not a promise about what would happen if
          they did. Both blocks now live under the list — see below. */}

      {/* 제주항공's 최저가 달력, in the unit this app trades in. That widget
          answers "which day", which is the question a traveller with four
          nights in Seoul actually arrives with — and the empty days are the
          load-bearing half: a 0 under Thursday is a fact somebody can act
          on, and the action is opening a table. */}
      {/* 부장님's 모임 장소 표시. Beside the week rather than in the tab bar,
          because "which day" and "where" are the same decision made twice. */}
      {tables !== null && open.length > 0 && (
        <button className="tables-map-open" translate="no" onClick={() => setMapOpen(true)}>
          <MapPinIcon size={15} /> 지도로 보기 · See these on a map
        </button>
      )}

      {/* The strip had no label, so the list never said what window it was
          showing or where. Meetup heads its own list "Incheon, KR 근처의
          이벤트" and 여기어때 makes the region the first thing you fill in;
          ours could be scrolled end to end without a traveller learning the
          app was showing them Seoul, this week.

          The city is derived and goes quiet the moment the tables are not
          all in one — see cityOfTables. The week is always true. */}
      {tables !== null && (
        <p className="week-strip__label">
          {(() => {
            const city = cityOfTables(open, restaurants);
            return city
              ? `이번 주 ${city}의 밥상 · Tables in ${city}, this week`
              : '이번 주의 밥상 · Tables this week';
          })()}
        </p>
      )}

      {tables !== null && (
        <div className="week-strip" role="group" aria-label="Tables by day">
          {week.map(d => (
            <button
              key={d.ymd}
              className={`week-day${dayFilter === d.ymd ? ' is-on' : ''}${d.count === 0 ? ' is-empty' : ''}${d.isWeekend ? ' is-weekend' : ''}`}
              aria-pressed={dayFilter === d.ymd}
              onClick={() => setDayFilter(dayFilter === d.ymd ? null : d.ymd)}
            >
              {/* Every other day in this strip says Wed, Thu, Fri. Today said
                  오늘 and only 오늘, so the one day a hungry traveller cares
                  about most was the single day they could not read. */}
              <span className="week-day__name">
                {d.isToday ? 'Today' : d.date.toLocaleDateString('en-GB', { weekday: 'short' })}
              </span>
              <span className="week-day__date">{d.date.getDate()}</span>
              <span className="week-day__count">{d.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Said plainly rather than discovered later. A host who believes
          strangers can already see this would be misled by silence — and once
          they genuinely can, the notice has to stop appearing rather than
          keep warning about a limitation that no longer exists. */}
      {isLocalOnly() && (
        <p className="tables-notice">
          Tables are saved on this device only for now — shared tables go live
          when the server lands.
        </p>
      )}

      {liveMenuIds.length > 1 && (
        <div className="menu-chips" role="group" aria-label="Filter by dish">
          <button
            className={`menu-chip${menuFilter === null ? ' is-on' : ''}`}
            onClick={() => setMenuFilter(null)}
          >
            All
          </button>
          {liveMenuIds.map(id => {
            const m = menuById(id);
            return (
              <button
                key={id}
                className={`menu-chip${menuFilter === id ? ' is-on' : ''}`}
                onClick={() => setMenuFilter(menuFilter === id ? null : id)}
              >
                {/* 삼겹살 Samgyeopsal is a name and a spelling of that name —
                    neither tells somebody who landed yesterday what the food
                    is. The cards below have carried the gloss since the 8/1
                    review asked for it ("로마자만 쓰지 않기"); the control you
                    filter with had not, so the choice was between words with
                    no meaning attached. */}
                <span className="menu-chip__kr" translate="no">{m.nameKo}</span>
                <span className="menu-chip__en">{m.name}</span>
                <span className="menu-chip__gloss">{m.gloss}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* The 오늘/내일/주말 chips are gone: the strip above says the same
          thing with more in it — the days with nothing on them — and two
          date filters stacked on one screen is a choice nobody asked for. */}

      <div className="menu-chips" role="group" aria-label="Filter by who is going">
        <button
          className={`menu-chip${womenFilter ? ' is-on' : ''}`}
          aria-pressed={womenFilter}
          onClick={() => setWomenFilter(w => !w)}
        >
          여성 동석 · Tables with another woman going
        </button>
      </div>

      {/* Cards in outline while the real ones arrive. The line of text this
          replaces was the whole loading state, which on venue wifi is a
          blank screen holding one sentence — and the layout then jumped when
          the cards landed. Three placeholders of the right height keep the
          page still and say "there is a list here" before the list exists.
          aria-busy carries the same fact to a screen reader, which cannot
          see the shimmer. */}
      {tables === null && (
        <div className="table-list" aria-busy="true" aria-label="Loading tables">
          {[0, 1, 2].map(i => (
            <div key={i} className="table-card table-card--skeleton" aria-hidden="true">
              <span className="skeleton-line skeleton-line--sm" />
              <span className="skeleton-line skeleton-line--lg" />
              <span className="skeleton-line" />
              <span className="skeleton-line skeleton-line--sm" />
            </div>
          ))}
        </div>
      )}

      {/* Why it is empty is a judgement, so EmptinessPolicy makes it and this
          only lays it out. Two sentences were being asserted rather than
          checked before it did: "No table for this one yet" named a dish
          nobody had chosen once the app had no tables to offer chips for, and
          "Other days have tables" was printed under a bare week. */}
      {tables !== null && emptyReason({ open, shown, menuFilter, womenFilter, dayFilter }) && (() => {
        const reason = emptyReason({ open, shown, menuFilter, womenFilter, dayFilter });
        const text = emptyText(reason, { otherDays: hasOtherDays(open, dayFilter) });
        return (
          <div className="tables-empty">
            <p className="tables-empty__title">{text.title}</p>
            <p>{text.body}</p>

            {/* The way out is whatever the reader can actually undo. */}
            {reason === EMPTY.GENDER && (
              <button className="tables-empty__cta" translate="no" onClick={() => setWomenFilter(false)}>
                필터 끄기 · Turn this filter off
              </button>
            )}
            {reason === EMPTY.DAY && (
              <button className="tables-empty__cta" translate="no" onClick={() => setDayFilter(null)}>
                이번 주 전체 보기 · Show the whole week
              </button>
            )}
            {reason === EMPTY.DISH && (
              <button className="tables-empty__cta" translate="no" onClick={() => setMenuFilter(null)}>
                요리 전체 보기 · Show every dish
              </button>
            )}

            {/* Opening one is the answer to every case, and the only answer
                to a bare week. */}
            <button
              className={reason === EMPTY.NONE ? 'tables-empty__cta' : 'tables-empty__ask'}
              translate="no"
              onClick={onCreateTable}
            >
              상 차리기 · Open a table
            </button>
            {/* Say what you wanted and let the app either find it or hand it
                back as a table — the other half of an empty screen. */}
            <button className="tables-empty__ask" translate="no" onClick={onRequestTable}>
              찾는 밥상 · Tell us what you are after
            </button>

            {/* The bare-week copy says the phrases are here to read meanwhile,
                and both buttons above it open the signup sheet for a guest —
                a screen promising free things while offering only doors. The
                dishes and the places are one tap away in the tab bar; the
                phrase sheet is two taps down inside the Passport, which is
                the one nobody would guess. So it gets a door of its own, on
                the one screen with nothing else to do. It also happens to be
                the part that works with no signal. */}
            {reason === EMPTY.NONE && (
              <button className="tables-empty__ask" translate="no" onClick={() => setPhrasesOpen(true)}>
                식탁에서 · What to say at the table
              </button>
            )}
          </div>
        );
      })()}

      {phrasesOpen && (
        <PhraseSheet
          onClose={() => setPhrasesOpen(false)}
          avoids={profile?.avoids}
        />
      )}

      {/* Said once above the list rather than on every card, and only to the
          people it is true for. Somebody who landed yesterday and has not
          changed their phone reads 19:00 as their own 19:00; on a device
          still set to New York that is thirteen hours from the meal. The
          times themselves already say KST — this is the sentence that
          explains why they need to. See ClockPolicy: it names the device
          rather than telling anybody off, because keeping home time to call
          your family is a reason, not a mistake. */}
      {shown.length > 0 && clockWarning(shown[0].date, shown[0].time) && (
        <p className="clock-note">
          <ClockIcon size={14} />
          {clockWarning(shown[0].date, shown[0].time)}
        </p>
      )}

      <div className="table-list">
        {shown.map(t => {
          const menu = menuById(t.menuId);
          if (!menu) return null;
          const rows = signupsFor[t.id] ?? [];
          const left = seatsRemaining(t, rows);
          const isMine = profile && t.hostId === profile.userId;
          // A seat you already hold. The host got a badge and a guest got
          // nothing, so somebody scrolling this list could not tell which
          // table they were already going to without opening each one.
          const iAmGoing = Boolean(profile?.userId) && rows.some(s => s.userId === profile.userId);
          const conflicts = conflictsFor(menu, profile);

          return (
            <button key={t.id} className="table-card" onClick={() => onOpenTable(t.id)}>
              <span className="table-card__word" aria-hidden="true" translate="no">{menu.nameKo}</span>

              <span className="table-card__top">
                <span className="table-card__cat">
                  {CATEGORY_LABEL[menu.category]?.en ?? ''}
                </span>
                {/* The distinction the 8/2 meeting drew, and the one a
                    nervous first-timer is actually scanning for: will
                    somebody explain this to me, or are we all guessing? */}
                {/* Both languages. This badge carried only the Korean until
                    2026-08-04, which made 호스트 테이블 — the Korean host
                    teaching their own food, the thing the professor's review
                    called the actual public diplomacy here — unreadable to
                    the exact person it exists for. The detail page has always
                    glossed it; the list is where somebody decides which table
                    to open, so the list is where the word has to work. */}
                <span className={`table-card__kind is-${tableKind(t)}`}>
                  <span className="table-card__kind-kr">{tableKindLabel(t).kr}</span>
                  <span className="table-card__kind-en">{tableKindLabel(t).en}</span>
                </span>
                {isMine && <span className="table-card__mine">Your table</span>}
                {iAmGoing && <span className="table-card__mine">You are going</span>}
                {conflicts.length > 0 && (
                  <span className="table-card__warn">contains {conflicts.join(', ')}</span>
                )}
              </span>

              <h2 className="table-card__dish">{menu.name}</h2>
              <p className="table-card__gloss">{menu.gloss}</p>

              {/* 신보람 교수님's note, answered where it is actually asked.
                  The badge above says 호스트 테이블 — a category. This says
                  what this host will do, which is the 어떻게 the review asked
                  for, and it has been in the data since 8/2 while rendering
                  only on the detail page. Somebody scanning the list to pick
                  an evening could not tell a host who will walk them through
                  ordering from a table that splits a bill.

                  Only on hosted tables: guideSummary returns null when there
                  is nothing ticked, so a 테이블 메이트 card gains no line and
                  no apology. */}
              {/* The first one, then a count. Spelling out all four — "How to
                  order · How it is eaten · Table manners · Where the dish
                  comes from" — was the longest line on the card and pushed it
                  to 292px, against 4–5 short lines on every card Meetup, 당근
                  and 여기어때 put in a list.

                  First-plus-count rather than a bare number, and rather than a
                  written summary: the number is countable and the first is
                  quoted from the catalogue, so neither can describe guides
                  this host did not tick. All four are named on the page they
                  open. Catalogue order, so "the first" is the first thing that
                  happens at a table, not the first one they tapped. */}
              {guideSummary(t) && (
                <p className="table-card__guides">
                  <span className="table-card__guides-label">Host shows you</span>
                  {guideSummary(t).guides[0].en}
                  {guideSummary(t).guides.length > 1 && (
                    <span className="table-card__guides-more">
                      +{guideSummary(t).guides.length - 1}
                    </span>
                  )}
                </p>
              )}

              {/* whyShared — three lines explaining why this dish is eaten
                  together — moved off the card on 2026-08-04. It is the best
                  paragraph in the catalog and it was making every card 289px
                  tall, which is the wrong trade in a list: somebody scanning
                  is asking when, where and how many, and reads the reason on
                  the page they open. The dish's own name, set large behind
                  the card, does the work the missing photograph would.

                  The photograph is genuinely missing, and not faked here:
                  public/images holds eight category illustrations built for
                  restaurants (된장, 국수, 사찰음식), none of which is 삼겹살.
                  Mapping one on would be the app showing a picture of a dish
                  nobody is serving. Real dish artwork is a team task. */}

              {/* A deadline that already exists, said out loud. Only inside
                  the last day, so it informs rather than nags — see
                  askDeadline in SeatRequestPolicy. */}
              {(() => {
                const d = askDeadline(t);
                if (!d) return null;
                return (
                  <span className={`table-card__deadline${d.urgent ? ' is-urgent' : ''}`} translate="no">
                    {d.kr}
                  </span>
                );
              })()}

              {/* When and where, in the shape a list is scanned.
                  The time carries KST because the reader may have landed
                  yesterday and never changed their phone — Meetup prints
                  GMT+9 on every card for the same reason.
                  Where says the station when we hold one, measured on a
                  walking route rather than guessed. It used to print the
                  whole postal address: sixty-two characters of "5F Templestay
                  Information Center, 56 Ujeongguk-ro, Jongno-gu, Seoul" in a
                  row somebody is skimming. 여기어때 prints "길동역 도보 3분"
                  in the same slot. The address is still on the page they
                  open, and is still what shows for a venue nobody measured. */}
              <span className="table-card__meta">
                <ClockIcon size={13} /> {dayLabel(t.date)} · {timeText(t.time)}
                <span className="table-card__dot" aria-hidden="true">·</span>
                <MapPinIcon size={13} /> {stationForTable(t, restaurants)?.en ?? t.place}
              </span>

              <span className="table-card__foot">
                <span className="table-card__host">
                  Hosted by {t.hostName}
                  {/* Only once there is something to say. A first-time host
                      gets no badge rather than a "0 tables" one — the detail
                      page says "첫 밥상" in words, where there is room to say
                      it kindly. */}
                  {hostRecords[t.hostId]?.tablesHosted > 0 && (
                    <span className="table-card__record">
                      밥상 {hostRecords[t.hostId].tablesHosted}번
                    </span>
                  )}
                  {t.hostVerified && <span className="table-card__verified">인증 · verified</span>}
                  {/* Scanning a list, the language is the fastest filter a
                      traveller applies. */}
                  {(t.languages ?? []).length > 0 && (
                    <span className="table-card__langs">{t.languages.join(' · ')}</span>
                  )}
                  {t.isSample && <span className="table-card__sample">sample</span>}
                </span>
                <span className="table-card__right">
                  {/* Confirmed faces, Meetup's oldest trick told honestly:
                      only seats the host actually gave, never pending ones.
                      An empty stack renders nothing — zero avatars is not a
                      fact worth a badge. */}
                  {(() => {
                    const going = acceptedSignups(rows);
                    if (going.length === 0) return null;
                    return (
                      <span className="avatar-stack" aria-label={`${going.length} going`}>
                        {going.slice(0, 3).map(s => (
                          s.avatarUrl
                            ? <img key={s.id} className="avatar-stack__face" src={s.avatarUrl} alt="" />
                            : (
                              <span key={s.id} className="avatar-stack__face avatar-stack__face--initial" aria-hidden="true">
                                {(s.name || '?').trim().charAt(0) || '?'}
                              </span>
                            )
                        ))}
                        {going.length > 3 && <span className="avatar-stack__more">+{going.length - 3}</span>}
                      </span>
                    );
                  })()}
                  <span className={`table-card__seats${left === 0 ? ' is-full' : ''}`}>
                    {left === 0 ? 'Full' : `${left} seat${left === 1 ? '' : 's'} left`}
                    <ChevronRightIcon size={14} />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* The explaining, now that the tables have made their case.
          Meetup's order: events, then "how it works", then why any of it is
          worth doing. Both blocks are guests-only — a member has done all
          three steps and does not need the rules recited back. */}
      {!isMember(auth) && (
        <div className="how-strip" aria-label="How 밥친구 works">
          <ol className="how-strip__steps">
            {HOW_STEPS.map((s, i) => (
              <li key={s.id} className="how-strip__step">
                <span className="how-strip__num" aria-hidden="true">{i + 1}</span>
                <span className="how-strip__kr" translate="no">{s.kr}</span>
                <span className="how-strip__en">{s.en}</span>
              </li>
            ))}
          </ol>
          <p className="how-strip__why">
            <span translate="no">{HOW_WHY.kr}</span> — {HOW_WHY.en}
          </p>
        </div>
      )}

      {/* Every 당근 모임 description is a hand-typed list of rules the
          platform does not enforce — 1/n, 벙 참여 의무, 미활동 강퇴 — because
          prose is all the organiser is given. Here each of those is a policy
          with a test on it, and content/promises.js names the file that keeps
          each promise so this block cannot outlive its own code. This is also
          the 교수님's "어떻게 하느냐": the mechanism is the public-diplomacy
          content, not decoration around it.

          It reads better here than above the list, where it was asking for
          trust before showing anything to trust. */}
      {!isMember(auth) && (
        <div className="promises" aria-label={PROMISES_LEAD.kr}>
          <h2 className="promises__lead" translate="no">{PROMISES_LEAD.kr}</h2>
          <p className="promises__sub">{PROMISES_LEAD.en}</p>
          <ul className="promises__list">
            {PROMISES.map(p => (
              <li key={p.id} className="promise">
                <CheckIcon size={15} />
                <span className="promise__body">
                  <span className="promise__kr" translate="no">{p.kr}</span>
                  <span className="promise__en">{p.en}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Under the list, not only on the empty screen. A list with three
          tables in it is empty in the way that matters if none of them is the
          dish, the day or the district you wanted. */}
      {tables !== null && shown.length > 0 && (
        <button className="tables-ask" onClick={onRequestTable}>
          <span className="tables-ask__kr">찾는 밥상</span>
          <span className="tables-ask__body">
            None of these? Say what you are after — we will look, and open it
            for you if nobody has.
          </span>
        </button>
      )}

      {/* Shows every open table, not the filtered list: a map is for finding
          what you did not know to filter for. */}
      {mapOpen && (
        <TablesMap
          tables={open}
          signupsFor={signupsFor}
          onOpenTable={(id) => { setMapOpen(false); onOpenTable(id); }}
          onClose={() => setMapOpen(false)}
        />
      )}
    </section>
  );
}
