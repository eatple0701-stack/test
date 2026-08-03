import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { menuById, CATEGORY_LABEL } from '../domain/catalog/menus.js';
import { seatsRemaining, joinBlocker, isPast, BLOCKER_TEXT, JOIN_BLOCK } from '../domain/policy/table.js';
import {
  SEAT_STATUS, isPending, isAccepted, isDeclined, hasLapsed, pendingSignups,
  acceptedSignups, affectedByCancellation,
  canAccept, acceptBlocker, DECIDE_BLOCK_TEXT, requestState,
} from '../domain/policy/seatRequest.js';
import {
  ATTENDANCE, ATTENDANCE_PROMPT, attendanceOf, isNoShow, attendanceNote,
} from '../domain/policy/attendance.js';
import { canSeeMeetingNote, meetingGuidance } from '../domain/policy/meeting.js';
import { isCancelled, cancellationNotice, bookable } from '../domain/policy/cancellation.js';
import { isMember, gateText } from '../domain/policy/access.js';
import {
  REPORT_REASONS, REPORT_NOTE_MAX, cleanReportNote, validateReport,
  REPORT_RECEIPT, REPORT_DOOR,
} from '../domain/policy/report.js';
import {
  canReview, cleanReview, REVIEW_MAX, REVIEW_PROMPT, REVIEWS_HEADING,
} from '../domain/policy/review.js';
import { icsForTable, icsFilenameFor } from '../domain/calendar.js';
import {
  getTable, listSignups, createSignup, cancelSignup, decideSignup, recordAttendance,
  deleteTable, createBlock, createReport, listReviews, saveReview, hostRecord, listTables,
} from '../data/tableRepository.js';
import PhraseSheet from './PhraseSheet';
import SafetySheet from './SafetySheet';
import RulesConsent from './RulesConsent';
import { conflictsFor, dietById } from '../data/profile';
import { PURPOSE } from '../content/safety.js';
import { agreedToRules } from '../domain/policy/consent.js';
import { shareUrlFor } from '../routes.js';
import { guideById, hostKindLabel, tableKind, tableKindLabel } from '../domain/catalog/hosts.js';
import { languageFit, cleanLanguages, LANGUAGE_FIT } from '../domain/catalog/languages.js';
import { themeById } from '../domain/catalog/index.js';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, ClockIcon, CheckIcon } from './Icons';

// One table, and the decision to sit at it.
//
// The page has to do two jobs at once: convince a stranger that this meal is
// worth their evening, and tell somebody who has never eaten this dish what
// will physically happen when the food arrives. The second is what the plan
// calls the 진입장벽 — most people do not decline 곱창 because they dislike
// it, they decline because they do not know what to do with it.

const fullDate = (date) => {
  const d = new Date(`${date}T00:00`);
  if (!Number.isFinite(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
};

// The sticky bar's version: short enough to share a line with a button.
const dayLabelShort = (date) => {
  const d = new Date(`${date}T00:00`);
  if (!Number.isFinite(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function TableDetail({ tableId, profile, onProfileChange, onBack, onOpenTheme, onOpenTable, auth, onRequireAuth }) {
  const [table, setTable] = useState(null);
  const [signups, setSignups] = useState([]);
  const [reviews, setReviews] = useState([]);
  // The one line I am writing (or rewriting) about this meal.
  const [reviewDraft, setReviewDraft] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);
  // The host's track record, or null while unknown — null renders nothing,
  // so a backend that cannot answer degrades to the page as it was.
  const [host, setHost] = useState(null);
  const [similar, setSimilar] = useState([]);
  // The report door: closed → open → sent. Sent is terminal for this visit.
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(null);
  const [reportNote, setReportNote] = useState('');
  const [reportProblems, setReportProblems] = useState([]);
  const [reportSent, setReportSent] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [nationality, setNationality] = useState(profile?.nationality ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  const [error, setError] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [shared, setShared] = useState(false);
  // { id, name } of whoever a Block click is asking to confirm, or null.
  // One piece of state serving both directions (host blocking a guest, a
  // guest blocking the host) rather than two, because only one confirm can
  // ever be open at a time regardless of which row it came from.
  const [confirmBlock, setConfirmBlock] = useState(null);
  const [blocking, setBlocking] = useState(false);
  // The id of the request whose buttons are mid-flight, so only that row
  // disables rather than every pending row on the table at once.
  const [deciding, setDeciding] = useState(null);
  // Blocked this session, so the row can say so immediately rather than
  // waiting on a refetch of a list this screen has no other reason to hold —
  // createBlock is idempotent, so there is nothing to reconcile later.
  const [justBlocked, setJustBlocked] = useState(() => new Set());
  // Where the sticky bar sends people: the decision area at the foot of the
  // page, whichever of its forms (seat form, gate, rules) is standing there.
  const joinRef = useRef(null);
  // Set once in Profile, so the seat form has nothing left to ask.
  const profileKnown = Boolean(profile?.name?.trim());

  // useCallback keyed on tableId, so the effect below can depend on refresh
  // itself rather than on the id it happens to close over. The behaviour is
  // the same either way — refresh's identity changes exactly when tableId
  // does — but the dependency is now the thing the effect actually uses, so
  // it cannot go stale if this function later closes over something else.
  const refresh = useCallback(async () => {
    const [t, s, r] = await Promise.all([
      getTable(tableId),
      listSignups(tableId),
      // Reviews must never take the page down with them — a missing reviews
      // table reads as "no lines yet", which is also what it means.
      listReviews(tableId).catch(() => []),
    ]);
    setTable(t);
    setSignups(s);
    setReviews(r);
  }, [tableId]);

  useEffect(() => { refresh(); }, [refresh]);

  // The host's record and the tables to offer next, fetched once the table
  // itself is known. Failures degrade to absence: both blocks render nothing
  // rather than an error, because neither is what this page is for.
  useEffect(() => {
    let alive = true;
    if (!table?.hostId) return undefined;
    hostRecord(table.hostId)
      .then(h => { if (alive) setHost(h); })
      .catch(() => {});
    listTables()
      .then(all => {
        if (!alive) return;
        const open = bookable(all).filter(t => t.id !== table.id && !isPast(t));
        // Same dish first — the person reading this page has already chosen
        // the dish — then anything else, soonest meal first either way.
        const rank = (t) => (t.menuId === table.menuId ? 0 : 1);
        open.sort((a, b) => rank(a) - rank(b) || `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
        setSimilar(open.slice(0, 3));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [table?.hostId, table?.id, table?.menuId]);


  const menu = table ? menuById(table.menuId) : null;
  const theme = menu?.themeId ? themeById(menu.themeId) : null;
  const conflicts = conflictsFor(menu, profile);
  // Resolved through the catalog, so an id the app does not know renders
  // nothing rather than a blank row.
  const guidesOffered = (table?.guides ?? []).map(guideById).filter(Boolean);
  const tableLanguages = cleanLanguages(table?.languages);
  const { fit, shared: sharedLangs } = languageFit(tableLanguages, profile?.languages);
  const isHost = Boolean(profile?.userId) && table?.hostId === profile.userId;
  const left = useMemo(() => seatsRemaining(table, signups), [table, signups]);
  // Both of these are judgements about who counts, so they live in the policy
  // where a test can hold them, not in this file where only my eye could.
  const confirmed = useMemo(() => acceptedSignups(signups), [signups]);
  const affected = useMemo(() => affectedByCancellation(signups, table), [signups, table]);
  const meeting = useMemo(() => meetingGuidance(table, { isHost }), [table, isHost]);
  const cancelNotice = useMemo(() => cancellationNotice(table, { isHost }), [table, isHost]);
  const blocker = useMemo(
    () => (table ? joinBlocker(table, signups, profile?.userId) : null),
    [table, signups, profile],
  );
  const mySignup = useMemo(
    () => signups.find(s => s.userId === profile?.userId) ?? null,
    [signups, profile],
  );
  const myReview = useMemo(
    () => (mySignup ? reviews.find(r => r.signupId === mySignup.id) ?? null : null),
    [reviews, mySignup],
  );

  // Rewriting starts from what you already wrote, not from a blank box that
  // implies the first line was lost. Only fills an untouched draft — never
  // overwrites what somebody is mid-typing.
  useEffect(() => {
    if (myReview && reviewDraft === '') setReviewDraft(myReview.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview]);

  if (!table || !menu) {
    return (
      <section className="sheet-page">
        <header className="sheet-page__head">
          <button className="sheet-page__back" onClick={onBack} aria-label="Back">
            <ChevronLeftIcon size={20} />
          </button>
          <h1>Table</h1>
        </header>
        <p className="tables-empty">This table is no longer here.</p>
      </section>
    );
  }

  const join = async () => {
    if (busy || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createSignup({
        tableId, userId: profile?.userId, name: name.trim(),
        nationality: nationality.trim(), note: note.trim(),
        languages: profile?.languages ?? [],
        // Halal, vegan, whatever they call it — carried to the host rather
        // than used by the app to rule on a dish it cannot check.
        diets: profile?.diets ?? [],
        gender: profile?.gender ?? null,
        allergyNote: profile?.allergyNote ?? '',
      });
    } catch (e) {
      // Once tables are shared, two phones can reach for the same chair at
      // once. The database refuses the second one, and the person holding it
      // needs to be told which of them lost rather than left staring at a
      // button that did nothing.
      setError(e.message);
      await refresh();
      setBusy(false);
      return;
    }
    // Asked once, not at every table. Typing your own name into the same two
    // boxes for the third time is the point where an app stops feeling like
    // it is on your side.
    onProfileChange?.({ ...profile, name: name.trim(), nationality: nationality.trim() });
    await refresh();
    setBusy(false);
    setJoined(true);
  };

  /**
   * The host's answer to one request.
   *
   * Refetches instead of patching the row in place, because accepting changes
   * more than the row: it moves a seat, which changes what every other pending
   * request on this table is allowed to become. A local edit would leave the
   * other rows' buttons reasoning from a seat count that is one out of date.
   */
  const decide = async (signup, status) => {
    if (deciding) return;
    setDeciding(signup.id);
    setError(null);
    try {
      await decideSignup(signup.id, status);
    } catch (e) {
      // Two hosts on two devices, or the same host on two tabs. The backends
      // refuse the second answer rather than overwrite the first, and the
      // person holding the losing tab is told so.
      setError(e.message);
    }
    await refresh();
    setDeciding(null);
  };

  /**
   * Who turned up. Same shape as decide, and the same reason for refetching:
   * the Passport reads attendance to decide who a traveller met, so the
   * source of truth has to be the stored row rather than this screen's guess.
   *
   * Passing null clears a mark, which is how a mis-tap is undone — the
   * buttons toggle rather than latch, because a correction that is harder
   * than the original answer is how records stay wrong.
   */
  const mark = async (signup, attendance) => {
    if (deciding) return;
    setDeciding(signup.id);
    setError(null);
    try {
      await recordAttendance(signup.id, attendance);
    } catch (e) {
      setError(e.message);
    }
    await refresh();
    setDeciding(null);
  };

  // Native share where the phone has it — that is the sheet with KakaoTalk in
  // it, which is how this link will actually travel in Korea. Clipboard is the
  // fallback, and the URL is visible in the bar either way.
  const share = async () => {
    const url = shareUrlFor(tableId);
    const text = `${menu.name} · ${fullDate(table.date)} at ${table.time}, ${table.place}`;
    if (navigator.share) {
      try { await navigator.share({ title: '밥친구', text, url }); return; } catch { /* dismissed */ }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2200);
    } catch { /* clipboard blocked; the address bar still holds the link */ }
  };

  const cancelTable = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteTable(tableId);
    } catch (e) {
      setError(e.message);
      setBusy(false);
      return;
    }
    setBusy(false);
    onBack();
  };

  const leave = async () => {
    if (busy || !mySignup) return;
    setBusy(true);
    await cancelSignup(mySignup.id);
    await refresh();
    setBusy(false);
    setJoined(false);
  };

  // Not retroactive on purpose — see the comment on the blocks table in
  // schema.sql. This only ever changes whether the two of them can end up at
  // a table together again; it does not touch this one.
  const confirmedBlock = async () => {
    if (blocking || !confirmBlock) return;
    setBlocking(true);
    try {
      await createBlock({ blockedId: confirmBlock.id, blockedName: confirmBlock.name });
      setJustBlocked(prev => new Set(prev).add(confirmBlock.id));
    } catch (e) {
      setError(e.message);
    }
    setBlocking(false);
    setConfirmBlock(null);
  };

  const saveMyReview = async () => {
    const body = cleanReview(reviewDraft);
    if (busy || !mySignup || !body) return;
    setBusy(true);
    setError(null);
    try {
      await saveReview({ signupId: mySignup.id, tableId, name: mySignup.name, body });
      await refresh();
      setReviewSaved(true);
      setTimeout(() => setReviewSaved(false), 2200);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const submitReport = async () => {
    if (busy) return;
    const problems = validateReport({ reasonId: reportReason, note: reportNote });
    setReportProblems(problems);
    if (problems.length > 0) return;
    setBusy(true);
    try {
      await createReport({ tableId, reasonId: reportReason, note: cleanReportNote(reportNote) });
      setReportSent(true);
    } catch (e) {
      setReportProblems([e.message]);
    }
    setBusy(false);
  };

  // The .ics download. Generated on the phone from rows the page already
  // holds — no fetch, no service, nothing that can be down at dinnertime.
  const addToCalendar = () => {
    const ics = icsForTable(table, menu, { url: shareUrlFor(tableId) });
    if (!ics) return;
    const href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = href;
    a.download = icsFilenameFor(menu);
    a.click();
    URL.revokeObjectURL(href);
  };

  return (
    <section className="sheet-page table-detail" aria-label={`${menu.name} table`}>
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon size={20} />
        </button>
        <h1>{menu.name}</h1>
      </header>

      <div className="detail-hero">
        {/* The dish's own name, in the script it is written in on the shop
            sign. A browser translating 감자탕 to "potato soup" takes away the
            one string a traveller can point at. */}
        <span className="detail-hero__word" aria-hidden="true" translate="no">{menu.nameKo}</span>
        <span className="detail-hero__cat">{CATEGORY_LABEL[menu.category]?.en}</span>
        <h2 className="detail-hero__dish">
          {menu.name}
          <span className="detail-hero__rom" translate="no">{menu.romanization}</span>
        </h2>
        {/* Under the name, above the reason. Somebody who arrived on a shared
            link may be meeting this word for the first time. */}
        <p className="detail-hero__gloss">{menu.gloss}</p>
        <p className="detail-hero__why">{menu.whyShared}</p>
      </div>

      {/* When, where, how many — moved directly under the dish on 8/4.
          It used to sit below two blocks of prose, which is the wrong order
          for the person this page is mostly for: somebody who followed a
          shared link and is deciding, in about four seconds, whether this is
          a day they are even in the city. The prose earns their evening; the
          facts decide whether there is an evening to earn. */}
      <div className="detail-block detail-block--facts">
        <p className="detail-fact"><ClockIcon size={15} /> {fullDate(table.date)} at {table.time}</p>
        <p className="detail-fact"><MapPinIcon size={15} /> Meet at {table.place}</p>
        {/* Named or honestly unnamed — a blank line here had guests assuming
            the meeting point was the restaurant. */}
        <p className="detail-fact detail-fact--muted">
          {table.restaurant
            ? <>Eating at {table.restaurant}</>
            : <>Restaurant not decided yet — the table picks one together</>}
        </p>
        <p className="detail-fact">
          <span className={`detail-seats${left === 0 ? ' is-full' : ''}`}>
            {left === 0 ? 'Full' : `${left} seat${left === 1 ? '' : 's'} left`}
          </span>
          of {table.seats}
        </p>

        {/* The URL existed and nothing offered it. A host with empty seats has
            no other way to fill them — there is no messaging, no notification
            and no feed — so the link is the only reach this app gives them.
            핵심기능 5 is SNS 확산, and this is the object that spreads. */}
        <button className="detail-share" translate="no" onClick={share}>
          {shared ? <><CheckIcon size={15} /> Link copied</> : '링크 보내기 · Send this table to someone'}
        </button>

        {/* A traveller's day is their phone calendar. The promise this page
            makes — this exit, this time — is exactly an event, and copying
            it over by hand is where typos put people an hour late. Gone once
            the meal is past or called off: there is nothing left to book. */}
        {!isCancelled(table) && !isPast(table) && (
          <button className="detail-share detail-calendar" translate="no" onClick={addToCalendar}>
            캘린더에 추가 · Add to your calendar
          </button>
        )}
      </div>

      <div className="detail-block">
        <h3 className="detail-block__label">What happens at the table</h3>
        <p className="detail-block__body">{menu.howItWorks}</p>
        {menu.contains.length > 0 && (
          <p className="detail-block__contains">Contains {menu.contains.join(', ')}</p>
        )}

        {/* Said where the decision is made, not buried in a settings screen.
            The table is not hidden — a traveller may still want it, and may
            be eating with somebody who does. */}
        {conflicts.length > 0 && (
          <p className="detail-conflict">
            This has {conflicts.join(' and ')} in it, which you said you do not eat.
          </p>
        )}

        {/* Only where the app genuinely cannot answer, and only to somebody
            who asked the question. A 한상 is whatever the house made that
            morning, so silence here was not a clearance — it was the app
            having nothing to say and looking like it had checked. */}
        {menu.varies && (profile?.avoids?.length ?? 0) > 0 && (
          <p className="detail-varies">
            The side dishes change by the house and by the day, so this one
            cannot be checked in advance. Ask before you sit down.
          </p>
        )}

        {/* The app used to stop here — it delivered somebody to a restaurant
            and then had nothing to offer at the meal itself, which is the
            only part of this that matters. */}
        <button className="phrase-open" translate="no" onClick={() => setPhrasesOpen(true)}>
          식탁에서 · What to say at the table
        </button>
      </div>

      {/* The curation the plan asks for, and the thing a table was missing:
          why this dish is eaten together at all. Without it a table is a
          booking; with it the meal is the point of the trip.
          Folded since 8/4: the page grew a host card, reviews and similar
          tables in one day, and somebody arriving on a shared link now
          scrolls a long way to the decision. The culture prose is the one
          block that is an *invitation* rather than a fact they need — so it
          keeps its place but opens on a tap instead of costing a screenful. */}
      {menu.culture && (
        <details className="detail-block culture-fold">
          <summary className="detail-block__label culture-fold__summary">
            Why it is eaten together
            <ChevronRightIcon size={14} />
          </summary>
          <p className="detail-culture">{menu.culture}</p>

          {/* Offered only where the catalog genuinely places the dish inside a
              theme. Six of the ten belong to no theme, and manufacturing
              membership to make this look fuller would be a cultural claim
              nobody could check. */}
          {theme && onOpenTheme && (
            <button className="detail-theme" onClick={() => onOpenTheme(theme.id)}>
              <span className="detail-theme__label">Part of</span>
              <span className="detail-theme__name">{theme.title}</span>
              <ChevronRightIcon size={14} />
            </button>
          )}
        </details>
      )}

      {/* Language, said plainly, in all four of its states. Somebody weighing
          an evening with four strangers is mostly weighing whether they will
          understand anything, and the app held both halves of the answer and
          printed neither. Never hides the table: a traveller may still want a
          meal with no shared language, and that is their call to make with
          the fact in front of them rather than ours to make by omission. */}
      <div className="detail-block">
        <h3 className="detail-block__label">언어 · What this table runs in</h3>
        {tableLanguages.length > 0 ? (
          <p className="lang-row">
            {tableLanguages.map(l => <span key={l} className="lang-chip">{l}</span>)}
          </p>
        ) : (
          <p className="lang-note">The host did not say.</p>
        )}

        {fit === LANGUAGE_FIT.SHARED && (
          <p className="lang-note lang-note--good">
            You and this table both have {sharedLangs.join(' and ')}.
          </p>
        )}
        {fit === LANGUAGE_FIT.NONE && (
          <p className="lang-note lang-note--warn">
            Nothing here matches what you speak. People manage — but bring a
            translation app, and the phrases below.
          </p>
        )}
        {fit === LANGUAGE_FIT.MINE_UNSAID && (
          <p className="lang-note">
            You have not said what you speak, so this cannot be compared. Profile.
          </p>
        )}
      </div>

      {/* Which of the two this evening is, said before the seat is asked for.
          A 테이블 메이트 table is not a lesser 호스트 테이블 — somebody who
          does not want to be taught anything tonight is a real traveller —
          so both are stated as a choice rather than one as a shortfall. */}
      <div className="detail-block detail-kind">
        <span className={`detail-kind__tag is-${tableKind(table)}`}>
          {tableKindLabel(table).kr} · {tableKindLabel(table).en}
        </span>
        <p className="detail-kind__blurb">{tableKindLabel(table).blurb}</p>
        {/* Only on a Hosted table — Task 1 in the feedback-response plan.
            This is the professor's "어떻게, 무엇이 아니라" note, answered where
            a guest is actually choosing this table over a 테이블 메이트 one. */}
        {tableKindLabel(table).why && (
          <p className="detail-kind__why">{tableKindLabel(table).why}</p>
        )}

        {/* The shape of the evening, said as a fact rather than as a rule.
            The professor's review suggested a hard floor — 3인 이상만 매칭
            확정 — and the concern under it is right: a stranger's dinner that
            turns out to be two people is a different evening from the one the
            app advertised. A seat minimum does not actually prevent that,
            though. A table for four with one guest is still two people at
            dinner, so the rule would reassure without doing anything.

            What does work is telling somebody the number before they commit,
            and being specific when that number is two. Nothing is blocked:
            two people sharing 삼겹살 is the product working, and it is not
            our decision to make on somebody else's behalf. */}
        {/* Only to somebody deciding. A host counting their own guests, and a
            guest who already said yes, are both reading their table rather
            than choosing it — for them the count is on the "Who is going"
            list a screen below, with names on it. */}
        {/* Counted from confirmed seats, not from rows. signups.length treated
            a request the host had turned down as somebody at the meal, and a
            request nobody had answered yet as a certainty — so the number
            climbed every time anyone asked, whatever the answer was. Pending
            people are deliberately left out rather than added as a maybe: the
            question this line answers is whether you would be sitting down to
            a proper table, and only a given seat answers it. */}
        {!isHost && !mySignup && (
          <p className={`detail-headcount${confirmed.length === 0 ? ' is-pair' : ''}`}>
            {confirmed.length === 0
              ? 'Nobody else has taken a seat yet, so if you sit down it is the two of you.'
              : `Take a seat and there would be ${confirmed.length + 2} of you.`}
          </p>
        )}
      </div>

      {/* The host as a person with a record, not a name on a line. Meetup
          leads every event with its organiser for the same reason: the
          decision being made on this page is about a stranger, and this is
          what the app honestly knows about them. Renders only when the
          backend could answer; a first-time host is said to be one rather
          than dressed in zeros. */}
      {host && (
        <div className="detail-block host-card">
          <h3 className="detail-block__label">호스트 · Who is cooking this evening</h3>
          <div className="host-card__row">
            {host.avatarUrl
              ? <img className="host-card__avatar" src={host.avatarUrl} alt="" />
              : <span className="host-card__initial" aria-hidden="true">{(table.hostName || '?').trim().charAt(0) || '?'}</span>}
            <div className="host-card__facts">
              <span className="host-card__name">{table.hostName}</span>
              {host.languages.length > 0 && (
                <span className="host-card__langs">{host.languages.join(' · ')}</span>
              )}
              <span className="host-card__record">
                {host.tablesHosted === 0
                  ? '첫 밥상 · Their first table. Every host in this app started as one.'
                  : `밥상 ${host.tablesHosted}번 차림 · ${host.tablesHosted} table${host.tablesHosted === 1 ? '' : 's'} held, ${host.guestsMet} guest${host.guestsMet === 1 ? '' : 's'} shared them`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* What the host said they would explain. Above "Who is going" because
          it is the reason to choose this table over another one serving the
          same dish — and because a traveller weighing whether to sit with
          strangers is weighing exactly this. */}
      {guidesOffered.length > 0 && (
        <div className="detail-block">
          <h3 className="detail-block__label">문화 가이드 · What the host will show you</h3>
          <ul className="guide-list">
            {guidesOffered.map(g => (
              <li key={g.id} className="guide-line">
                <span className="guide-line__kr">{g.kr}</span>
                <span className="guide-line__en">{g.en}</span>
              </li>
            ))}
          </ul>
          <p className="guide-list__note">
            Said by the host when they opened this table, in their words.
          </p>
        </div>
      )}

      {/* Above everything, because it changes what every line below it means.
          There are no notifications in this app, so opening the table is the
          only way anybody learns — which is why cancelling keeps the row
          rather than deleting it. */}
      {cancelNotice && (
        <div className="detail-block cancelled-block">
          <h3 className="detail-block__label">{cancelNotice.title}</h3>
          <p className="cancelled-note">{cancelNotice.body}</p>
        </div>
      )}

      {/* The last hundred metres. Only for people who are actually going —
          "green jacket by the CU" is where a specific person will physically
          be at a specific time, and on a public page that is available to
          anybody browsing, including somebody this host turned down. */}
      {canSeeMeetingNote({ isHost, mySignupAccepted: Boolean(mySignup) && isAccepted(mySignup), table }) && (
        <div className="detail-block meeting-block">
          <h3 className="detail-block__label">{meeting.title}</h3>
          <p className={meeting.kind === 'written' ? 'meeting-note' : 'meeting-note meeting-note--none'}>
            {meeting.body}
          </p>
          {/* The day-of channel, borrowed rather than built: the host's own
              open chat, behind the same gate as the note because it reaches
              the same people. cleanChatUrl already refused anything that is
              not an https link, on both write and read. */}
          {table.chatUrl && (
            <a className="meeting-chat" translate="no" href={table.chatUrl} target="_blank" rel="noopener noreferrer">
              오픈채팅 참여 · Join this table’s open chat
            </a>
          )}
        </div>
      )}

      <div className="detail-block">
        <h3 className="detail-block__label">Who is going</h3>
        <ul className="who-list">
          <li className="who-row">
            <span className="who-row__dot" aria-hidden="true" />
            <span className="who-row__name">{table.hostName}</span>
            <span className="who-row__role">host</span>
            {/* The single most common case the gender filter produces is a
                solo woman host with no guests yet — without this, that table
                would show no declared gender anywhere on the screen despite
                being exactly what the filter matched. Same tag weight as a
                guest's declared gender, only shown when set. */}
            {table.hostGender && <span className="who-row__role">{table.hostGender}</span>}
            {/* Only ever on a table the team checked. An unverified host gets
                no mark at all rather than a lesser one — a scale of trust
                invites reading its bottom rung as "checked, and found
                wanting", which is a claim nobody made. */}
            {table.hostVerified && (
              <span className="who-row__verified">
                인증 · verified
                {hostKindLabel(table.hostKind) && ` · ${hostKindLabel(table.hostKind).en}`}
              </span>
            )}
            {/* Only a guest sees this — a host cannot block themselves, and
                blocking is only ever about not sitting with somebody again,
                so it has no meaning on your own table. */}
            {!isHost && (
              justBlocked.has(table.hostId) ? (
                <span className="who-row__blocked">Blocked</span>
              ) : (
                <button
                  className="who-row__block"
                  onClick={() => setConfirmBlock({ id: table.hostId, name: table.hostName, role: 'host' })}
                >
                  Block
                </button>
              )
            )}
          </li>
          {signups.map(s => (
            <li key={s.id} className="who-row who-row--stacked">
              <span className="who-row__dot" aria-hidden="true" />
              <span className="who-row__line">
                <span className="who-row__name">{s.name}</span>
                {/* Whether this person is actually coming. Only shown once
                    there is something to say — a confirmed seat is the normal
                    case and does not need a badge announcing it, and every row
                    written before approval existed reads as confirmed. */}
                {isPending(s) && (
                  <span className="who-row__pending">
                    {hasLapsed(s, table) ? 'no answer in time' : 'asked to join'}
                  </span>
                )}
                {isDeclined(s) && <span className="who-row__declined">not this time</span>}
                {/* Self-declared, shown as one line with nationality rather
                    than as a separate row — neither is verified, and
                    stacking two unverified facts under two different visual
                    weights would read as if one carried more certainty than
                    the other. */}
                {[s.nationality, s.gender].filter(Boolean).length > 0 && (
                  <span className="who-row__role">
                    {[s.nationality, s.gender].filter(Boolean).join(' · ')}
                  </span>
                )}
                {/* Only the host sees this — signups_insert_own in
                    schema.sql is what actually keeps a blocked guest out of
                    this host's future tables, but only the host can decide
                    who that should be. */}
                {isHost && (
                  justBlocked.has(s.userId) ? (
                    <span className="who-row__blocked">Blocked</span>
                  ) : (
                    <button
                      className="who-row__block"
                      onClick={() => setConfirmBlock({ id: s.userId, name: s.name, role: 'guest' })}
                    >
                      Block
                    </button>
                  )
                )}
              </span>
              {/* The seat form asks "anything the table should know?" and
                  people answer it with the thing that matters most — no pork,
                  ten words of Korean, running late. It was being written to
                  storage and shown to nobody, which is worse than never
                  asking. */}
              {/* The thing a host most needs to know before they pick the
                  shop, in the guest's own word for it. The app makes no claim
                  about the dish — this is one person telling another. */}
              {(s.diets ?? []).length > 0 && (
                <span className="who-row__diet">
                  {s.diets.map(d => dietById(d)).filter(Boolean)
                    .map(d => `${d.kr} · ${d.en}`).join(', ')}
                </span>
              )}
              {/* Free text, so unlike diets above it the app cannot cross-check
                  it against menu.contains — orange marks "read this" without
                  claiming a check that never happened. */}
              {s.allergyNote && <span className="who-row__allergy">{s.allergyNote}</span>}
              {s.note && <span className="who-row__note">“{s.note}”</span>}
              {/* The host's answer, under everything they need to answer it —
                  the name, the diets, the allergy note and whatever the guest
                  wrote. Deciding above that would mean deciding before
                  reading it. */}
              {/* After the meal, the same row asks the other question. Only
                  for seats the host actually gave — marking somebody they
                  turned away absent would be a statement about nothing. */}
              {isHost && !isCancelled(table) && isPast(table) && isAccepted(s) && (
                <span className="decide-row">
                  <button
                    className={attendanceOf(s) === ATTENDANCE.CAME ? 'decide-row__yes' : 'decide-row__no'}
                    disabled={deciding === s.id}
                    onClick={() => mark(s, attendanceOf(s) === ATTENDANCE.CAME ? null : ATTENDANCE.CAME)}
                  >
                    {ATTENDANCE_PROMPT.came}
                  </button>
                  <button
                    className={isNoShow(s) ? 'decide-row__yes' : 'decide-row__no'}
                    disabled={deciding === s.id}
                    onClick={() => mark(s, isNoShow(s) ? null : ATTENDANCE.NO_SHOW)}
                  >
                    {ATTENDANCE_PROMPT.noShow}
                  </button>
                </span>
              )}
              {isHost && !isCancelled(table) && isPending(s) && !hasLapsed(s, table) && (
                <span className="decide-row">
                  <button
                    className="decide-row__yes"
                    disabled={deciding === s.id || !canAccept({ signup: s, signups, table, userId: profile?.userId })}
                    onClick={() => decide(s, SEAT_STATUS.ACCEPTED)}
                  >
                    자리 드리기 · Give the seat
                  </button>
                  <button
                    className="decide-row__no"
                    disabled={deciding === s.id}
                    onClick={() => decide(s, SEAT_STATUS.DECLINED)}
                  >
                    Not this time
                  </button>
                  {/* Says why the accept is unavailable rather than leaving a
                      dead button — almost always "no seat left", which a host
                      reaches by accepting others first. */}
                  {!canAccept({ signup: s, signups, table, userId: profile?.userId }) && (
                    <span className="decide-row__why">
                      {DECIDE_BLOCK_TEXT[acceptBlocker({ signup: s, signups, table, userId: profile?.userId })]}
                    </span>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
        {table.note && <p className="detail-note">“{table.note}”</p>}

        {confirmBlock && (
          <div className="cancel-confirm">
            <p className="cancel-confirm__title">Block {confirmBlock.name}?</p>
            <p className="cancel-confirm__body">
              {confirmBlock.role === 'host'
                ? "Their tables stop showing up on your Tables list. This does not change your seat here if you already have one, and does not tell them."
                : "They will no longer be able to take a seat at any table you host. This does not remove them from this table, and does not tell them."}
            </p>
            <div className="cancel-confirm__row">
              <button className="cancel-confirm__no" onClick={() => setConfirmBlock(null)}>
                Keep as is
              </button>
              <button className="cancel-confirm__yes" onClick={confirmedBlock} disabled={blocking}>
                {blocking ? 'Blocking…' : 'Block'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* The host badge is deliberately not here. The plan promises verified
          Korean hosts and nothing in this build verifies anybody — printing a
          checkmark now would be the app vouching for a stranger it has never
          checked. It appears when verification does. */}

      {/* Lines left by people whose seats were real — ReviewPolicy holds the
          gate. The next stranger's actual question, "do evenings like this
          happen", answered in the words of somebody whose evening it was. */}
      {reviews.length > 0 && (
        <div className="detail-block">
          <h3 className="detail-block__label">{REVIEWS_HEADING}</h3>
          <ul className="review-list">
            {reviews.map(r => (
              <li key={r.signupId} className="review-line">
                <span className="review-line__body">“{r.body}”</span>
                <span className="review-line__name">— {r.name || 'a guest'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div ref={joinRef} aria-hidden="true" />

      {mySignup ? (
        /* Asking is no longer the same as being in, so this cannot say "you
           have a seat" any more — it said that to everyone, including people
           the host had not answered and people the host had turned down.
           requestState decides what is true; this only lays it out. */
        (() => {
          const state = requestState(mySignup, table);
          return (
            <div className={`join-block join-block--${state.kind === SEAT_STATUS.ACCEPTED ? 'in' : state.kind}`}>
              <p className={state.kind === SEAT_STATUS.ACCEPTED ? 'join-confirmed' : 'join-waiting'}>
                {state.kind === SEAT_STATUS.ACCEPTED && <CheckIcon size={16} />} {state.title}
              </p>
              <p className="join-next">{state.body}</p>
              {/* Said to the one person who can explain it. A record its own
                  subject cannot see is not a record, it is a rumour. */}
              {attendanceNote(mySignup) && (
                <p className="join-next join-noshow">{attendanceNote(mySignup)}</p>
              )}
              {/* After the meal, the seat turns into a pen. One line, shown
                  on this table with your name — ReviewPolicy decides whether
                  this person may hold the pen at all. */}
              {canReview({ signup: mySignup, table }) && (
                <div className="review-write">
                  <h4 className="review-write__title">{REVIEW_PROMPT.title}</h4>
                  <textarea
                    rows={2}
                    maxLength={REVIEW_MAX}
                    value={reviewDraft}
                    onChange={e => setReviewDraft(e.target.value)}
                    placeholder={REVIEW_PROMPT.hint}
                  />
                  <button
                    className="review-write__save"
                    onClick={saveMyReview}
                    disabled={busy || !cleanReview(reviewDraft)}
                  >
                    {reviewSaved ? <><CheckIcon size={14} /> {REVIEW_PROMPT.saved}</> : REVIEW_PROMPT.save}
                  </button>
                </div>
              )}
              {joined && state.kind === SEAT_STATUS.PENDING && (
                <p className="join-next">
                  If it is yes: {table.place}, {fullDate(table.date)} at {table.time}.
                </p>
              )}
              {joined && state.kind === SEAT_STATUS.ACCEPTED && (
                <p className="join-next">
                  Meet at {table.place}, {fullDate(table.date)} at {table.time}.
                </p>
              )}
              {/* Withdrawing stays available while a seat is still being held
                  for you — including while you are waiting, because a request
                  you no longer want is a seat somebody else could have. */}
              {state.seatHeld && (
                <button className="join-leave" onClick={leave} disabled={busy}>
                  {state.kind === SEAT_STATUS.PENDING ? 'Withdraw my request' : 'Give up my seat'}
                </button>
              )}
            </div>
          );
        })()
      ) : isHost ? (
        /* The host's own table. Everything they can do about it is here,
           because there was previously nowhere at all — a host who could not
           make their own dinner had no way to say so, and the guests would
           have found out by standing outside a restaurant. */
        <div className="join-block">
          <p className="join-blocked">{BLOCKER_TEXT[JOIN_BLOCK.OWN_TABLE]}</p>

          {/* A host who does not answer freezes the table — a pending request
              holds its seat. So the count is stated here, at the bottom where
              a host manages their table, and the answering itself is up in
              "Who is going" where the names and the allergy notes are. */}
          {(() => {
            const waiting = pendingSignups(signups).filter(s => !hasLapsed(s, table));
            if (waiting.length === 0) return null;
            return (
              <p className="join-waiting">
                {waiting.length === 1
                  ? '1 person is waiting on your answer.'
                  : `${waiting.length} people are waiting on your answer.`}
                {' '}Their seats are held until you decide. Scroll up to “Who is going”.
              </p>
            );
          })()}

          {/* Nothing left to call off. The notice at the top of the page has
              already said what happened, and a second cancel button would
              only ever produce the backend's "already called off" error. */}
          {isCancelled(table) ? null : !confirmCancel ? (
            <button className="join-leave" onClick={() => setConfirmCancel(true)}>
              이 상 취소 · Call off this table
            </button>
          ) : (
            <div className="cancel-confirm">
              <p className="cancel-confirm__title">Call this table off?</p>
              {/* Everybody this cancellation lands on: seats given, and
                  requests still waiting on an answer that will now never
                  come. Not the people already turned down — telling a host
                  they are about to inconvenience somebody they refused a week
                  ago is noise, and it used to pad this number. */}
              {affected.length > 0 ? (
                <p className="cancel-confirm__body">
                  {affected.length === 1 ? '1 person is' : `${affected.length} people are`} counting on
                  this table: {affected.map(s => s.name).join(', ')}. The app cannot message them yet —
                  if you have another way to reach them, tell them before you cancel. Their seats and
                  any requests still open disappear when you do.
                </p>
              ) : (
                <p className="cancel-confirm__body">Nobody has taken a seat, so nobody is affected.</p>
              )}
              <div className="cancel-confirm__row">
                <button className="cancel-confirm__no" onClick={() => setConfirmCancel(false)}>
                  Keep it
                </button>
                <button className="cancel-confirm__yes" onClick={cancelTable} disabled={busy}>
                  {busy ? 'Cancelling…' : 'Call it off'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : blocker ? (
        <div className="join-block">
          <p className="join-blocked">{BLOCKER_TEXT[blocker]}</p>
          {blocker === JOIN_BLOCK.FULL && (
            <p className="join-next">Open the same dish yourself and fill your own table.</p>
          )}
        </div>
      ) : !isMember(auth) ? (
        /* The membership door, before the rules door. Browsing this whole
           page costs nothing — the dish, the guides, who is going — and the
           gate only stands where the commitment starts. AccessPolicy owns
           the words so every gate in the app says the same thing. */
        <div className="join-block">
          <h3 className="detail-block__label">{gateText('join-table').title}</h3>
          <p className="join-next">{gateText('join-table').body}</p>
          <button className="form-submit" translate="no" onClick={() => onRequireAuth?.("join-table")}>
            {gateText('join-table').cta}
          </button>
        </div>
      ) : !agreedToRules(profile, PURPOSE.version) ? (
        /* 교수님's ask, in the one place it is genuinely read: nobody has
           committed to anything yet, and the next tap is the commitment.
           Replaces the seat form rather than sitting above it, so there is
           no half-filled form to lose and no way to reach the button
           without having passed this. */
        <div className="join-block">
          <h3 className="detail-block__label">Before your first seat</h3>
          <RulesConsent
            profile={profile}
            onProfileChange={onProfileChange}
            action="ask for a seat"
          />
        </div>
      ) : (
        <div className="join-block">
          <h3 className="detail-block__label">Ask for a seat</h3>

          {/* Three form fields for information the app already has is the
              wrong question to ask somebody who has decided. Where a profile
              exists, this collapses to one button and a line saying who is
              being sent — with a way in for the one thing that changes per
              table, which is what the table should know about you tonight. */}
          {profileKnown && !editingIdentity ? (
            <p className="join-as">
              Going as <strong>{profile.name}</strong>
              {profile.nationality ? ` from ${profile.nationality}` : ''}
              <button className="join-as__edit" onClick={() => setEditingIdentity(true)}>
                Change
              </button>
            </p>
          ) : (
            <>
              <label className="field">
                <span className="field__label">Your name</span>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="What to call you" />
              </label>
              <label className="field">
                <span className="field__label">Where you are from (optional)</span>
                <input type="text" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="Japan" />
              </label>
            </>
          )}

          {!noteOpen ? (
            <button className="join-note-open" onClick={() => setNoteOpen(true)}>
              + Anything the table should know?
            </button>
          ) : (
            <label className="field">
              <span className="field__label">Anything the table should know?</span>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="No pork, and my Korean is about ten words." autoFocus />
            </label>
          )}

          {error && <p className="join-error">{error}</p>}
          <button className="form-submit" translate="no" onClick={join} disabled={busy || !name.trim()}>
            {busy ? 'Asking…' : '자리 요청 · Take a seat'}
          </button>

          {/* Under the button that commits an evening with strangers, because
              this is the moment the question gets asked and the app had no
              answer anywhere in it. */}
          <p className="join-purpose">
            <span className="join-purpose__kr">{PURPOSE.kr}</span>
            {PURPOSE.rule}
          </p>
        </div>
      )}

      {/* The door to the team, next to the door to help — related concerns,
          different directions. Blocking is beside the person it concerns up
          in "Who is going"; this is for what a block cannot carry. Open to
          anyone with the page, member or not, by ReportPolicy's reasoning:
          the person most likely to need it followed somebody's shared link. */}
      {reportSent ? (
        <div className="report-receipt">
          <p className="report-receipt__title"><CheckIcon size={15} /> {REPORT_RECEIPT.title}</p>
          <p className="report-receipt__body">{REPORT_RECEIPT.body}</p>
        </div>
      ) : !reportOpen ? (
        <button className="report-open" translate="no" onClick={() => setReportOpen(true)}>
          {REPORT_DOOR.open}
        </button>
      ) : (
        <div className="report-panel">
          <h3 className="report-panel__title">{REPORT_DOOR.title}</h3>
          <p className="report-panel__hint">{REPORT_DOOR.hint}</p>
          <div className="report-panel__reasons" role="group" aria-label="Reason">
            {REPORT_REASONS.map(r => (
              <button
                key={r.id}
                className={`report-reason${reportReason === r.id ? ' is-on' : ''}`}
                aria-pressed={reportReason === r.id}
                onClick={() => { setReportReason(r.id); setReportProblems([]); }}
              >
                {r.kr} · {r.en}
              </button>
            ))}
          </div>
          <textarea
            className="report-panel__note"
            rows={3}
            maxLength={REPORT_NOTE_MAX}
            value={reportNote}
            onChange={e => setReportNote(e.target.value)}
            placeholder="무슨 일이 있었나요? · What happened, in your words."
          />
          {reportProblems.length > 0 && (
            <ul className="auth-problems">{reportProblems.map(p => <li key={p}>{p}</li>)}</ul>
          )}
          <div className="report-panel__row">
            <button className="cancel-confirm__no" onClick={() => setReportOpen(false)}>
              Never mind
            </button>
            <button className="cancel-confirm__yes" onClick={submitReport} disabled={busy}>
              {busy ? 'Sending…' : REPORT_DOOR.send}
            </button>
          </div>
        </div>
      )}

      {/* Quiet, at the bottom, and always there — not a scare on the way in,
          but not something to go hunting for either. */}
      <button className="safety-open" translate="no" onClick={() => setSafetyOpen(true)}>
        도움이 필요하면 · Feeling unsafe or need help?
      </button>

      {/* The page's last word looks forward. A full table, a wrong date, a
          dish that scared somebody off — none of those should end at a dead
          stop when other evenings are open. Same dish first, then soonest. */}
      {onOpenTable && similar.length > 0 && (
        <div className="detail-block similar-block">
          <h3 className="detail-block__label">이런 밥상은 어때요 · Other tables open now</h3>
          <ul className="similar-list">
            {similar.map(t => {
              const m = menuById(t.menuId);
              if (!m) return null;
              return (
                <li key={t.id}>
                  <button className="similar-row" onClick={() => onOpenTable(t.id)}>
                    <span className="similar-row__word" aria-hidden="true">{m.nameKo}</span>
                    <span className="similar-row__facts">
                      <span className="similar-row__dish">{m.name}</span>
                      <span className="similar-row__when">{fullDate(t.date)} · {t.time} · {t.place}</span>
                    </span>
                    <ChevronRightIcon size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* The decision, kept within a thumb's reach while the evidence for it
          scrolls by — Meetup's sticky bar, doing here what it does there.
          Only for somebody who still has a decision: not the host, not
          anyone already seated, not a full or finished table. Where the
          membership gate is what is standing at the foot of the page, the
          bar sends them to exactly that, which is the funnel working. */}
      {!isHost && !mySignup && !blocker && !isCancelled(table) && !isPast(table) && (
        <div className="detail-cta">
          <span className="detail-cta__when">
            <ClockIcon size={14} /> {dayLabelShort(table.date)} · {table.time}
          </span>
          <button
            className="detail-cta__btn" translate="no"
            /* No behavior:'smooth' — Chromium quietly refuses smooth
               scrollIntoView inside .content-region (verified in this app,
               2026-08-03: instant scrolls, smooth does not move at all), and
               a button that does nothing is worse than a jump cut. */
            onClick={() => joinRef.current?.scrollIntoView({ block: 'start' })}
          >
            자리 요청 · Take a seat
          </button>
        </div>
      )}

      {phrasesOpen && (
        <PhraseSheet
          dish={menu.name}
          menuId={menu.id}
          avoids={profile?.avoids}
          onClose={() => setPhrasesOpen(false)}
        />
      )}
      {safetyOpen && <SafetySheet onClose={() => setSafetyOpen(false)} />}
    </section>
  );
}
