import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { menuById, CATEGORY_LABEL } from '../domain/catalog/menus.js';
import { seatsRemaining, joinBlocker, isPast, BLOCKER_TEXT, JOIN_BLOCK } from '../domain/policy/table.js';
import {
  SEAT_STATUS, isPending, isAccepted, isDeclined, hasLapsed, pendingSignups,
  acceptedSignups, affectedByCancellation,
  canAccept, acceptBlocker, DECIDE_BLOCK_TEXT, requestState, askDeadline,
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
  canReview, cleanReview, REVIEW_MAX, REVIEW_PROMPT, REVIEWS_HEADING, PHOTO_PROMPT,
} from '../domain/policy/review.js';
import { saveError } from '../domain/policy/saveError.js';
import { downscale, MEAL_PHOTO } from '../data/image.js';
import { icsForTable, icsFilenameFor, googleCalendarUrl } from '../domain/calendar.js';
import { downloadNotice } from '../domain/policy/browser.js';
import {
  getTable, listSignups, createSignup, cancelSignup, decideSignup, recordAttendance,
  deleteTable, createBlock, createReport, listReviews, saveReview, hostRecord, listTables,
  saveTablePhoto,
} from '../data/tableRepository.js';
import PhraseSheet from './PhraseSheet';
import SafetySheet from './SafetySheet';
import RulesConsent from './RulesConsent';
import { conflictsFor, dietById } from '../data/profile';
import { PURPOSE } from '../content/safety.js';
import { agreedToRules } from '../domain/policy/consent.js';
import { shareUrlFor } from '../routes.js';
import { guideById, hostKindLabel, tableKind, tableKindLabel } from '../domain/catalog/hosts.js';
import { languageFit, cleanLanguages, languageLine, LANGUAGE_FIT } from '../domain/catalog/languages.js';
import { themeById } from '../domain/catalog/index.js';
import { timeText, clockWarning } from '../domain/policy/clock.js';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, ClockIcon, CheckIcon } from './Icons';
import { useText, useLocale } from './localeText.js';
import AnimalAvatar from './AnimalAvatar.jsx';
import { dateLocale, LOCALE } from '../domain/policy/locale.js';

// One table, and the decision to sit at it.
//
// The page has to do two jobs at once: convince a stranger that this meal is
// worth their evening, and tell somebody who has never eaten this dish what
// will physically happen when the food arrives. The second is what the plan
// calls the 진입장벽 — most people do not decline 곱창 because they dislike
// it, they decline because they do not know what to do with it.

const fullDate = (date, locale) => {
  const d = new Date(`${date}T00:00`);
  if (!Number.isFinite(d.getTime())) return date;
  return d.toLocaleDateString(dateLocale(locale), { weekday: 'long', day: 'numeric', month: 'long' });
};

// The sticky bar's version: short enough to share a line with a button.
const dayLabelShort = (date, locale) => {
  const d = new Date(`${date}T00:00`);
  if (!Number.isFinite(d.getTime())) return date;
  return d.toLocaleDateString(dateLocale(locale), { day: 'numeric', month: 'short' });
};

export default function TableDetail({ tableId, profile, onProfileChange, onBack, onOpenTheme, onOpenTable, auth, onRequireAuth }) {
  const say = useText();
  const locale = useLocale();
  const [table, setTable] = useState(null);
  const [signups, setSignups] = useState([]);
  const [reviews, setReviews] = useState([]);
  // The one line I am writing (or rewriting) about this meal.
  const [reviewDraft, setReviewDraft] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);
  // The uploaded photo's URL, held until the line is saved with it.
  const [photoDraft, setPhotoDraft] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoRef = useRef(null);
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
  const deadline = useMemo(() => askDeadline(table), [table]);
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
    if (myReview?.photoUrl && photoDraft === '') setPhotoDraft(myReview.photoUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview]);

  if (!table || !menu) {
    return (
      <section className="sheet-page">
        <header className="sheet-page__head">
          <button className="sheet-page__back" onClick={onBack} aria-label={say('Back', '뒤로', 'Atrás', 'Retour', 'رجوع', '返回', '戻る')}>
            <ChevronLeftIcon size={20} />
          </button>
          <h1>{say('Table', '밥상', 'Mesa', 'Table', 'مائدة', '饭桌', '食卓')}</h1>
        </header>
        <p className="tables-empty">
          {say('This table is no longer here.', '이 밥상은 사라졌어요.', 'Esta mesa ya no está aquí.', "Cette table n'est plus là.", 'لم تعد هذه المائدة هنا.', '这张饭桌已经不在了。', 'この食卓はもうありません。')}
        </p>
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
      setError(saveError(e));
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
      setError(saveError(e));
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
      setError(saveError(e));
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
      setError(saveError(e));
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
      setError(saveError(e));
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
      await saveReview({
        signupId: mySignup.id, tableId, name: mySignup.name, body,
        // Whatever photo is attached right now — including the one already
        // stored, so rewriting the line does not silently drop the picture.
        photoUrl: photoDraft,
      });
      await refresh();
      setReviewSaved(true);
      setTimeout(() => setReviewSaved(false), 2200);
    } catch (e) {
      setError(saveError(e));
    }
    setBusy(false);
  };

  /**
   * The photo, uploaded the moment it is chosen and held until the line is
   * saved. Uploading first means the slow part happens while somebody is
   * still typing, and the Save button stays instant.
   */
  const pickMealPhoto = async (file) => {
    if (!file || !mySignup) return;
    setError(null);
    setPhotoBusy(true);
    try {
      const dataUrl = await downscale(file, MEAL_PHOTO);
      setPhotoDraft(await saveTablePhoto(dataUrl, mySignup.id));
    } catch (e) {
      setError(saveError(e));
    }
    setPhotoBusy(false);
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

  // Computed here rather than inside the JSX so the button is simply absent
  // when the table has no parseable time, the same rule addToCalendar follows.
  const gcalUrl = googleCalendarUrl(table, menu, { url: shareUrlFor(tableId) });
  const dlNotice = downloadNotice(typeof navigator === 'undefined' ? '' : navigator.userAgent);

  return (
    <section className="sheet-page table-detail" aria-label={`${menu.name} table`}>
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onBack} aria-label={say('Back', '뒤로', 'Atrás', 'Retour', 'رجوع', '返回', '戻る')}>
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
        <p className="detail-hero__gloss">{say(menu.gloss, menu.glossKo, menu.glossEs, menu.glossFr, menu.glossAr, menu.glossZh, menu.glossJa)}</p>
        <p className="detail-hero__why">{say(menu.whyShared, menu.whySharedKo, menu.whySharedEs, menu.whySharedFr, menu.whySharedAr, menu.whySharedZh, menu.whySharedJa)}</p>
      </div>

      {/* When, where, how many — moved directly under the dish on 8/4.
          It used to sit below two blocks of prose, which is the wrong order
          for the person this page is mostly for: somebody who followed a
          shared link and is deciding, in about four seconds, whether this is
          a day they are even in the city. The prose earns their evening; the
          facts decide whether there is an evening to earn. */}
      <div className="detail-block detail-block--facts">
        <p className="detail-fact"><ClockIcon size={15} /> {say(
          `${fullDate(table.date, locale)} at ${timeText(table.time)}`,
          `${fullDate(table.date, locale)} ${timeText(table.time)}`,
          `${fullDate(table.date, locale)} a las ${timeText(table.time)}`,
          `${fullDate(table.date, locale)} à ${timeText(table.time)}`,
          `${fullDate(table.date, locale)} الساعة ${timeText(table.time)}`,
          `${fullDate(table.date, locale)} ${timeText(table.time)}`,
          `${fullDate(table.date, locale)} ${timeText(table.time)}`)}</p>
        {/* The page where somebody commits is the one place this must not be
            missed, so the timezone sentence sits with the hour it explains
            rather than at the top of the screen. Silent for a device already
            on Korean time — see ClockPolicy. */}
        {clockWarning(table.date, table.time) && (
          <p className="detail-fact detail-fact--muted">{clockWarning(table.date, table.time)}</p>
        )}
        <p className="detail-fact"><MapPinIcon size={15} /> {say(
          `Meet at ${table.place}`, `${table.place}에서 만나요`, `Quedamos en ${table.place}`,
          `Rendez-vous à ${table.place}`, `الموعد في ${table.place}`, `在${table.place}见`,
          `${table.place}で待ち合わせ`)}</p>
        {/* Named or honestly unnamed — a blank line here had guests assuming
            the meeting point was the restaurant. */}
        <p className="detail-fact detail-fact--muted">
          {table.restaurant
            ? say(`Eating at ${table.restaurant}`, `${table.restaurant}에서 먹어요`,
              `Comemos en ${table.restaurant}`, `On mange à ${table.restaurant}`,
              `نأكل في ${table.restaurant}`, `在${table.restaurant}吃`, `${table.restaurant}で食べます`)
            : (
              <>
                {say('Restaurant not decided yet — the table picks one together',
                  '식당은 아직 정하지 않았어요 — 밥상이 함께 고릅니다',
                  'Restaurante aún sin decidir: lo elige la mesa entre todos', 'Restaurant pas encore décidé — la table le choisit ensemble', 'المطعم لم يُحدَّد بعد — تختاره المائدة معًا', '餐厅还没定 — 由这桌一起选', 'お店はまだ決まっていません — 食卓で一緒に選びます')}
              </>
            )}
        </p>
        <p className="detail-fact">
          <span className={`detail-seats${left === 0 ? ' is-full' : ''}`}>
            {left === 0
              ? say('Full', '자리 참', 'Completa', 'Complet', 'مكتملة', '已满', '満席')
              : say(`${left} seat${left === 1 ? '' : 's'} left`, `${left}자리 남음`,
                `${left} sitio${left === 1 ? '' : 's'} libre${left === 1 ? '' : 's'}`,
                `${left} place${left === 1 ? '' : 's'} libre${left === 1 ? '' : 's'}`,
                `بقي ${left} مقعد`, `还剩 ${left} 个位子`, `残り${left}席`)}
          </span>
          {say(`of ${table.seats}`, `/ 총 ${table.seats}`, `de ${table.seats}`, `sur ${table.seats}`,
            `من ${table.seats}`, `共 ${table.seats}`, `${table.seats}席中`)}
        </p>

        {/* The rule that has governed this app since the approval batch and
            has never once been on a screen. Only to somebody who could still
            act on it — a host and a seated guest are past the decision. */}
        {!isHost && !mySignup && deadline && (
          <p className={`detail-deadline${deadline.urgent ? ' is-urgent' : ''}`}>
            <ClockIcon size={14} />
            <span>
              <span className="detail-deadline__kr" translate="no">{deadline.short.kr}</span>
              <span className="detail-deadline__full">{say(deadline.full.en, deadline.full.kr, deadline.full.es, deadline.full.fr, deadline.full.ar, deadline.full.zh, deadline.full.ja)}</span>
            </span>
          </p>
        )}

        {/* The URL existed and nothing offered it. A host with empty seats has
            no other way to fill them — there is no messaging, no notification
            and no feed — so the link is the only reach this app gives them.
            핵심기능 5 is SNS 확산, and this is the object that spreads. */}
        <button className="detail-share" translate="no" onClick={share}>
          {shared
            ? <><CheckIcon size={15} /> {say('Link copied', '링크 복사됨', 'Enlace copiado', 'Lien copié', 'نُسخ الرابط', '链接已复制', 'リンクをコピーしました')}</>
            : say('링크 보내기 · Send this table to someone', '링크 보내기', 'Enviar esta mesa a alguien', "Envoyer cette table à quelqu'un", 'أرسل هذه المائدة إلى أحد', '把这张饭桌发给谁', 'この食卓を誰かに送る')}
        </button>

        {/* A traveller's day is their phone calendar. The promise this page
            makes — this exit, this time — is exactly an event, and copying
            it over by hand is where typos put people an hour late. Gone once
            the meal is past or called off: there is nothing left to book. */}
        {!isCancelled(table) && !isPast(table) && (
          <>
            <button className="detail-share detail-calendar" translate="no" onClick={addToCalendar}>
              {say('캘린더에 추가 · Add to your calendar', '캘린더에 추가', 'Añadir a tu calendario', 'Ajouter à votre agenda', 'أضِفها إلى تقويمك', '加进你的日历', 'カレンダーに追加')}
            </button>
            {/* The same event as a link, because the file above does not always
                arrive. Reported from a real phone: opened inside KakaoTalk, the
                download became a preview with no Add button and the event was
                never saved. A URL is the one thing every in-app browser can
                still do. Second, not first — the file needs no account. */}
            {gcalUrl && (
              <a className="detail-share detail-calendar--google" href={gcalUrl} target="_blank" rel="noopener noreferrer">
                {say('구글 캘린더로 추가 · Add with Google Calendar', '구글 캘린더로 추가', 'Añadir con Google Calendar', 'Ajouter avec Google Agenda', 'أضِفها بتقويم Google', '用 Google 日历添加', 'Google カレンダーで追加')}
              </a>
            )}
            {/* Only ever an extra sentence, never a removed button — the
                detection is a user-agent guess (src/domain/policy/browser.js). */}
            {dlNotice && (
              <p className="detail-calendar__notice">
                {locale === LOCALE.BOTH && <strong>{dlNotice.kr} </strong>}
                {say(dlNotice.en, dlNotice.kr, dlNotice.es, dlNotice.fr, dlNotice.ar, dlNotice.zh, dlNotice.ja)}
              </p>
            )}
          </>
        )}
      </div>

      <div className="detail-block">
        <h3 className="detail-block__label">
          {say('What happens at the table', '식탁에서 벌어지는 일', 'Qué pasa en la mesa', 'Ce qui se passe à table', 'ما الذي يحدث على المائدة', '桌上会发生什么', '食卓で何が起きるか')}
        </h3>
        <p className="detail-block__body">{say(menu.howItWorks, menu.howItWorksKo, menu.howItWorksEs, menu.howItWorksFr, menu.howItWorksAr, menu.howItWorksZh, menu.howItWorksJa)}</p>
        {menu.contains.length > 0 && (
          <p className="detail-block__contains">{say(
            `Contains ${menu.contains.join(', ')}`, `${menu.contains.join(', ')} 들어감`,
            `Contiene ${menu.contains.join(', ')}`, `Contient ${menu.contains.join(', ')}`,
            `يحتوي على ${menu.contains.join('، ')}`, `含有${menu.contains.join('、')}`,
            `${menu.contains.join('、')}が入っています`)}</p>
        )}

        {/* Said where the decision is made, not buried in a settings screen.
            The table is not hidden — a traveller may still want it, and may
            be eating with somebody who does. */}
        {conflicts.length > 0 && (
          <p className="detail-conflict">
            {say(
              `This has ${conflicts.join(' and ')} in it, which you said you do not eat.`,
              `여기엔 ${conflicts.join(', ')}이(가) 들어 있어요. 안 드신다고 하신 것입니다.`,
              `Esto lleva ${conflicts.join(' y ')}, que dijiste que no comes.`,
              `Il y a ${conflicts.join(' et ')} dedans, que vous avez dit ne pas manger.`,
              `فيه ${conflicts.join(' و')}، وقد قلت إنك لا تأكله.`,
              `这里面有${conflicts.join('和')}，你说过你不吃。`,
              `これには${conflicts.join('と')}が入っています。食べないとおっしゃっていたものです。`)}
          </p>
        )}

        {/* Only where the app genuinely cannot answer, and only to somebody
            who asked the question. A 한상 is whatever the house made that
            morning, so silence here was not a clearance — it was the app
            having nothing to say and looking like it had checked. */}
        {menu.varies && (profile?.avoids?.length ?? 0) > 0 && (
          <p className="detail-varies">
            {say('The side dishes change by the house and by the day, so this one cannot be checked in advance. Ask before you sit down.',
              '반찬은 집집마다, 날마다 달라져서 미리 확인할 수가 없습니다. 앉기 전에 물어보세요.',
              'Las guarniciones cambian según la casa y el día, así que esto no se puede comprobar de antemano. Pregunta antes de sentarte.', "Les accompagnements changent selon la maison et selon le jour : cela ne peut donc pas être vérifié à l'avance. Demandez avant de vous asseoir.", 'تتغيّر الأطباق الجانبية بحسب البيت وبحسب اليوم، فلا يمكن التحقّق من هذا مسبقًا. اسأل قبل أن تجلس.', '小菜按店、按日子变，所以这一项没法提前确认。坐下之前先问一句。', 'おかずは店ごと日ごとに変わるので、これは前もって確認できません。座る前に尋ねてください。')}
          </p>
        )}

        {/* The app used to stop here — it delivered somebody to a restaurant
            and then had nothing to offer at the meal itself, which is the
            only part of this that matters. */}
        <button className="phrase-open" onClick={() => setPhrasesOpen(true)}>
          {say('식탁에서 · What to say at the table', '식탁에서',
            'Qué decir en la mesa', 'Quoi dire à table', 'ماذا تقول على المائدة', '在桌上该说什么', '食卓で何を言うか')}
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
            {say('Why it is eaten together', '왜 함께 먹나', 'Por qué se come en compañía', 'Pourquoi on le mange ensemble', 'لماذا يُؤكل مع الناس', '为什么要一起吃', 'なぜ一緒に食べるのか')}
            <ChevronRightIcon size={14} />
          </summary>
          <p className="detail-culture">{say(menu.culture, menu.cultureKo, menu.cultureEs, menu.cultureFr, menu.cultureAr, menu.cultureZh, menu.cultureJa)}</p>

          {/* Offered only where the catalog genuinely places the dish inside a
              theme. Six of the ten belong to no theme, and manufacturing
              membership to make this look fuller would be a cultural claim
              nobody could check. */}
          {theme && onOpenTheme && (
            <button className="detail-theme" onClick={() => onOpenTheme(theme.id)}>
              <span className="detail-theme__label">{say('Part of', '속한 이야기', 'Forma parte de', 'Fait partie de', 'جزء من', '属于', 'この一部です')}</span>
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
        <h3 className="detail-block__label">{say('언어 · What this table runs in', '언어', 'En qué idioma va esta mesa', 'La langue de cette table', 'لغة هذه المائدة', '这张饭桌用的语言', 'この食卓の言語')}</h3>
        {tableLanguages.length > 0 ? (
          <p className="lang-row">
            {tableLanguages.map(l => <span key={l} className="lang-chip">{l}</span>)}
          </p>
        ) : (
          <p className="lang-note">{say('The host did not say.', '호스트가 밝히지 않았어요.', 'El anfitrión no lo ha dicho.', "L'hôte ne l'a pas dit.", 'لم يذكر المضيف ذلك.', '主人没有说。', 'ホストは書いていません。')}</p>
        )}

        {fit === LANGUAGE_FIT.SHARED && (
          <p className="lang-note lang-note--good">
            {say(
              `You and this table both have ${sharedLangs.join(' and ')}.`,
              `이 밥상과 ${sharedLangs.join(', ')}이(가) 겹칩니다.`,
              `Tú y esta mesa compartís ${sharedLangs.join(' y ')}.`,
              `Vous et cette table avez ${sharedLangs.join(' et ')} en commun.`,
              `تشتركان أنت وهذه المائدة في ${sharedLangs.join(' و')}.`,
              `你和这张饭桌都会${sharedLangs.join('和')}。`,
              `あなたとこの食卓は${sharedLangs.join('と')}が共通です。`)}
          </p>
        )}
        {fit === LANGUAGE_FIT.NONE && (
          <p className="lang-note lang-note--warn">
            {say('Nothing here matches what you speak. People manage — but bring a translation app, and the phrases below.',
              '여기 쓰는 언어 중에 하실 줄 아는 게 없습니다. 그래도 다들 어떻게든 하지만, 번역 앱과 아래 표현들을 챙겨 가세요.',
              'Aquí no hay ningún idioma que hables. La gente se apaña, pero llévate una app de traducción y las frases de abajo.', "Aucune langue ici ne correspond à ce que vous parlez. On s'en sort — mais prenez une application de traduction, et les phrases ci-dessous.", 'لا لغة هنا تطابق ما تتحدّثه. يتدبّر الناس أمرهم — لكن خذ معك تطبيق ترجمة، والعبارات أدناه.', '这里没有你会说的语言。大家都能应付过来——不过带上一个翻译应用，还有下面这些句子。', 'あなたの話せる言語はここにありません。みなさん何とかしています——ただ、翻訳アプリと、下の言い回しは持っていってください。')}
          </p>
        )}
        {fit === LANGUAGE_FIT.MINE_UNSAID && (
          <p className="lang-note">
            {say('You have not said what you speak, so this cannot be compared. Profile.',
              '어떤 언어를 하시는지 적지 않으셔서 비교할 수가 없습니다. 프로필에서 알려주세요.',
              'No has dicho qué idiomas hablas, así que no se puede comparar. Perfil.', "Vous n'avez pas dit quelles langues vous parlez, la comparaison est donc impossible. Profil.", 'لم تذكر اللغات التي تتحدّثها، فالمقارنة متعذّرة. الملف الشخصي.', '你还没填自己会说什么语言，所以没法比对。去资料里填。', '話せる言語を書いていないので、比べられません。プロフィールへ。')}
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
              ? say('Nobody else has taken a seat yet, so if you sit down it is the two of you.',
                '아직 아무도 자리를 잡지 않아서, 앉으시면 둘이 됩니다.',
                'Nadie más ha ocupado un sitio, así que si te sientas seríais dos.',
                "Personne d'autre n'a pris de place : si vous vous asseyez, vous serez deux.",
                'لم يجلس أحد بعد، فإن جلست تكونان اثنين.',
                '还没有别人占位子，你坐下就是两个人。',
                'まだ誰も席についていないので、あなたが座れば二人です。')
              : say(`Take a seat and there would be ${confirmed.length + 2} of you.`,
                `앉으시면 ${confirmed.length + 2}명이 됩니다.`,
                `Si te sientas seríais ${confirmed.length + 2}.`,
                `Si vous vous asseyez, vous serez ${confirmed.length + 2}.`,
                `إن جلست تصيرون ${confirmed.length + 2}.`,
                `你坐下就是 ${confirmed.length + 2} 个人。`,
                `座れば${confirmed.length + 2}人になります。`)}
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
          <h3 className="detail-block__label">{say('호스트 · Who is cooking this evening', '호스트', 'Quién organiza esta noche', 'Qui reçoit ce soir', 'من يستضيف هذه الأمسية', '今晚谁做东', '今夜つくる人')}</h3>
          <div className="host-card__row">
            {host.avatarUrl
              ? <img className="host-card__avatar" src={host.avatarUrl} alt="" />
              : <AnimalAvatar className="host-card__avatar" seed={table.hostId} animal={host.avatarAnimal} size={44} />}
            <div className="host-card__facts">
              <span className="host-card__name">{table.hostName}</span>
              {/* Both names. A traveller reading a host card is meeting
                  somebody else's languages, not picking their own, so
                  "한국어" alone tells a Spanish speaker nothing about the
                  ninety minutes they are deciding on. */}
              {host.languages.length > 0 && (
                <span className="host-card__langs">{languageLine(host.languages)}</span>
              )}
              <span className="host-card__record">
                {host.tablesHosted === 0
                  ? say('Their first table. Every host in this app started as one.',
                    '첫 밥상. 이 앱의 모든 호스트가 여기서 시작했어요.',
                    'Su primera mesa. Todos los anfitriones de esta app empezaron así.',
                    "Sa première table. Tous les hôtes de cette app ont commencé là.",
                    'أوّل مائدة له. كلّ مضيف في هذا التطبيق بدأ من هنا.',
                    '他的第一张饭桌。这个应用里的每位主人都是这么开始的。',
                    '初めての食卓です。このアプリのホストはみなここから始まりました。')
                  : say(
                    `${host.tablesHosted} table${host.tablesHosted === 1 ? '' : 's'} held, ${host.guestsMet} guest${host.guestsMet === 1 ? '' : 's'} shared them`,
                    `밥상 ${host.tablesHosted}번 차림, 손님 ${host.guestsMet}명과 함께`,
                    `${host.tablesHosted} mesa${host.tablesHosted === 1 ? '' : 's'} puesta${host.tablesHosted === 1 ? '' : 's'}, ${host.guestsMet} invitado${host.guestsMet === 1 ? '' : 's'}`,
                    `${host.tablesHosted} table${host.tablesHosted === 1 ? '' : 's'} dressée${host.tablesHosted === 1 ? '' : 's'}, ${host.guestsMet} invité${host.guestsMet === 1 ? '' : 's'}`,
                    `${host.tablesHosted} مائدة، و${host.guestsMet} ضيفًا شاركوه إياها`,
                    `摆过 ${host.tablesHosted} 次饭桌，来过 ${host.guestsMet} 位客人`,
                    `食卓を${host.tablesHosted}回、お客さんは${host.guestsMet}人`)}
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
          <h3 className="detail-block__label">{say('문화 가이드 · What the host will show you', '문화 가이드', 'Lo que te enseñará el anfitrión', "Ce que l'hôte vous montrera", 'ما الذي سيعرّفك به المضيف', '主人会带你看什么', 'ホストが見せてくれること')}</h3>
          <ul className="guide-list">
            {guidesOffered.map(g => (
              <li key={g.id} className="guide-line">
                <span className="guide-line__kr">{g.kr}</span>
                <span className="guide-line__en">{g.en}</span>
              </li>
            ))}
          </ul>
          <p className="guide-list__note">
            {say('Said by the host when they opened this table, in their words.',
              '호스트가 이 밥상을 열면서 직접 쓴 말입니다.',
              'Lo dijo el anfitrión al abrir esta mesa, con sus palabras.', "Dit par l'hôte à l'ouverture de cette table, avec ses mots.", 'قاله المضيف عند فتح هذه المائدة، بكلماته.', '开这张饭桌时主人自己说的话。', 'この食卓を開いたとき、ホスト自身の言葉で書いたものです。')}
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
              {say('오픈채팅 참여 · Join this table’s open chat', '오픈채팅 참여', 'Entrar en el chat abierto de esta mesa', 'Rejoindre le chat ouvert de cette table', 'ادخل المحادثة المفتوحة لهذه المائدة', '加入这张饭桌的开放聊天', 'この食卓のオープンチャットに入る')}
            </a>
          )}
        </div>
      )}

      <div className="detail-block">
        <h3 className="detail-block__label">{say('Who is going', '누가 가나', 'Quién va', 'Qui vient', 'من سيأتي', '谁会来', '来る人')}</h3>
        <ul className="who-list">
          <li className="who-row">
            <span className="who-row__dot" aria-hidden="true" />
            <span className="who-row__name">{table.hostName}</span>
            <span className="who-row__role">{say('host', '호스트', 'anfitrión', 'hôte', 'المضيف', '主人', 'ホスト')}</span>
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
                {say('인증 · verified', '인증', 'verificado', 'vérifié', 'موثّق', '已核实', '確認済み')}
                {hostKindLabel(table.hostKind) && ` · ${hostKindLabel(table.hostKind).en}`}
              </span>
            )}
            {/* Only a guest sees this — a host cannot block themselves, and
                blocking is only ever about not sitting with somebody again,
                so it has no meaning on your own table. */}
            {!isHost && (
              justBlocked.has(table.hostId) ? (
                <span className="who-row__blocked">{say('Blocked', '차단됨', 'Bloqueado', 'Bloqué', 'محظور', '已拉黑', 'ブロック中')}</span>
              ) : (
                <button
                  className="who-row__block"
                  onClick={() => setConfirmBlock({ id: table.hostId, name: table.hostName, role: 'host' })}
                >
                  {say('Block', '차단', 'Bloquear', 'Bloquer', 'حظر', '拉黑', 'ブロック')}
                </button>
              )
            )}
          </li>
          {signups.map(s => (s.anonymous ? (
            /* A seat somebody is in, whose name is not this reader's to see.
               signups_read gives you a table's rows only if you are at it, so
               a stranger gets a count from seat_holds() instead — and the
               count has to appear as people rather than as nothing, or the
               page says the table is empty when it is not. Saying whose seat
               it is would undo the policy; saying nothing was the bug. */
            <li key={s.id} className="who-row who-row--taken">
              <span className="who-row__dot" aria-hidden="true" />
              <span className="who-row__name who-row__name--taken">
                {say('Seat taken', '자리 있음', 'Sitio ocupado', 'Place prise', 'مقعد محجوز', '已有人', '席あり')}
              </span>
              <span className="who-row__role">
                {say('names are visible to people at this table',
                  '이름은 이 밥상에 앉은 사람에게만 보여요',
                  'los nombres solo los ven quienes están en esta mesa',
                  'les noms ne sont visibles que par les personnes à cette table',
                  'الأسماء تظهر لمن هم على هذه المائدة فقط',
                  '名字只有这桌的人看得到',
                  '名前はこの食卓に着く人にだけ見えます')}
              </span>
            </li>
          ) : (
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
                    {hasLapsed(s, table)
                      ? say('no answer in time', '기한 내 답 없음', 'sin respuesta a tiempo', 'pas de réponse à temps', 'بلا ردّ في الوقت', '没有及时答复', '期限内に返事なし')
                      : say('asked to join', '참석 요청함', 'ha pedido sitio', 'a demandé une place', 'طلب مقعدًا', '申请加入', '参加を希望')}
                  </span>
                )}
                {isDeclined(s) && <span className="who-row__declined">{say('not this time', '이번엔 아니요', 'esta vez no', 'pas cette fois', 'ليس هذه المرة', '这次不了', '今回は見送る')}</span>}
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
                    <span className="who-row__blocked">{say('Blocked', '차단됨', 'Bloqueado', 'Bloqué', 'محظور', '已拉黑', 'ブロック中')}</span>
                  ) : (
                    <button
                      className="who-row__block"
                      onClick={() => setConfirmBlock({ id: s.userId, name: s.name, role: 'guest' })}
                    >
                      {say('Block', '차단', 'Bloquear', 'Bloquer', 'حظر', '拉黑', 'ブロック')}
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
                  {/* One element per diet, never one joined string.
                      `${kr} · ${en}` is the bilingual-pair form LocaleFilter
                      reduces, and it splits on the first ' · ' and keeps one
                      side. Joined with ', ', two diets became the single
                      string "비건 · Vegan, 할랄 · Halal" — which reduces to
                      "Halal" in English and to "비건 · Vegan, 할랄" in
                      Korean. A guest who told the host they were vegan *and*
                      halal was shown to that host as halal: the app losing
                      half of somebody's dietary needs, silently, on the
                      screen where the host picks the restaurant.
                      Each pair now gets its own text node and is reduced on
                      its own. The ', ' separators hold no middot, so the
                      filter leaves them alone. */}
                  {s.diets.map(d => dietById(d)).filter(Boolean)
                    .map((d, i) => (
                      <React.Fragment key={d.id ?? d.en}>
                        {i > 0 ? ', ' : ''}
                        <span>{`${d.kr} · ${d.en}`}</span>
                      </React.Fragment>
                    ))}
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
                    {say('자리 드리기 · Give the seat', '자리 드리기', 'Dar el sitio', 'Donner la place', 'امنح المقعد', '把位子给他', '席をゆずる')}
                  </button>
                  <button
                    className="decide-row__no"
                    disabled={deciding === s.id}
                    onClick={() => decide(s, SEAT_STATUS.DECLINED)}
                  >
                    {say('Not this time', '이번엔 아니요', 'Esta vez no', 'Pas cette fois', 'ليس هذه المرة', '这次不了', '今回は見送る')}
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
          )))}
        </ul>
        {table.note && <p className="detail-note">“{table.note}”</p>}

        {confirmBlock && (
          <div className="cancel-confirm">
            <p className="cancel-confirm__title">{say(
              `Block ${confirmBlock.name}?`, `${confirmBlock.name}님을 차단할까요?`,
              `¿Bloquear a ${confirmBlock.name}?`, `Bloquer ${confirmBlock.name} ?`,
              `أتحظر ${confirmBlock.name}؟`, `要拉黑${confirmBlock.name}吗？`,
              `${confirmBlock.name}さんをブロックしますか？`)}</p>
            <p className="cancel-confirm__body">
              {confirmBlock.role === 'host'
                ? say(
                  'Their tables stop showing up on your Tables list. This does not change your seat here if you already have one, and does not tell them.',
                  '이분의 밥상이 목록에 더는 뜨지 않습니다. 이미 잡은 자리는 그대로이고, 상대에게는 알리지 않습니다.',
                  'Sus mesas dejan de aparecer en tu lista. No cambia tu sitio aquí si ya lo tienes, y no se le avisa.',
                  "Ses tables n'apparaissent plus dans votre liste. Cela ne change pas votre place ici si vous en avez une, et il n'en est pas informé.",
                  'لن تظهر موائده في قائمتك بعد الآن. لا يغيّر هذا مقعدك هنا إن كان لك مقعد، ولا يُعلَم هو بذلك.',
                  '他的饭桌不会再出现在你的列表里。你已经有的位子不受影响，也不会通知他。',
                  'この人の食卓は一覧に出なくなります。すでに取ってある席はそのままで、相手には知らされません。')
                : say(
                  'They will no longer be able to take a seat at any table you host. This does not remove them from this table, and does not tell them.',
                  '이분은 앞으로 당신이 차린 밥상에 자리를 잡을 수 없습니다. 이 밥상에서 빼지는 않고, 상대에게도 알리지 않습니다.',
                  'Ya no podrá ocupar sitio en ninguna mesa tuya. No lo saca de esta mesa, y no se le avisa.',
                  "Il ne pourra plus prendre de place à vos tables. Cela ne le retire pas de cette table, et il n'en est pas informé.",
                  'لن يستطيع أخذ مقعد في أيّ مائدة تستضيفها. لا يُخرجه هذا من هذه المائدة، ولا يُعلَم بذلك.',
                  '他以后不能在你摆的任何饭桌上占位子。这不会把他从这张桌子上移走，也不会通知他。',
                  'この人は今後あなたの食卓に席を取れなくなります。この食卓から外れるわけではなく、相手にも知らされません。')}
            </p>
            <div className="cancel-confirm__row">
              <button className="cancel-confirm__no" onClick={() => setConfirmBlock(null)}>
                {say('Keep as is', '그대로 두기', 'Dejarlo como está', 'Laisser tel quel', 'اتركه كما هو', '保持原样', 'このままにする')}
              </button>
              <button className="cancel-confirm__yes" onClick={confirmedBlock} disabled={blocking}>
                {blocking
                  ? say('Blocking…', '차단하는 중…', 'Bloqueando…', 'Blocage…', 'جارٍ الحظر…', '正在拉黑…', 'ブロック中…')
                  : say('Block', '차단', 'Bloquear', 'Bloquer', 'احظر', '拉黑', 'ブロック')}
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
                {/* The evidence, above the words. A stranger deciding whether
                    감자탕 is worth an evening is helped more by one picture
                    of the pot than by any sentence available — and this one
                    was taken by somebody who was sitting there. */}
                {r.photoUrl && (
                  <img className="review-line__photo" src={r.photoUrl} alt="" loading="lazy" />
                )}
                <span className="review-line__body">“{r.body}”</span>
                <span className="review-line__name">— {r.name || say('a guest', '어떤 손님', 'un invitado', 'un invité', 'أحد الضيوف', '一位客人', 'あるお客さん')}</span>
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
                  {/* A label, not only a placeholder — the prompt is the whole
                      instruction here, and a placeholder vanishes the moment
                      the first character is typed. */}
                  <label className="review-write__field">
                    <h4 className="review-write__title">{REVIEW_PROMPT.title}</h4>
                    <textarea
                      rows={2}
                      maxLength={REVIEW_MAX}
                      value={reviewDraft}
                      onChange={e => setReviewDraft(e.target.value)}
                      placeholder={REVIEW_PROMPT.hint}
                    />
                  </label>
                  {/* The picture, beside the line and under the same gate.
                      Uploaded on choosing so the slow part happens while
                      somebody is still typing. */}
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => pickMealPhoto(e.target.files?.[0])}
                  />
                  {photoDraft && (
                    <div className="review-photo">
                      <img src={photoDraft} alt="" />
                      <button className="review-photo__remove" onClick={() => setPhotoDraft('')}>
                        {PHOTO_PROMPT.remove}
                      </button>
                    </div>
                  )}
                  <button
                    className="review-photo__add"
                    onClick={() => photoRef.current?.click()}
                    disabled={photoBusy}
                    translate="no"
                  >
                    {photoBusy
                      ? say('Uploading…', '올리는 중…', 'Subiendo…', 'Envoi…', 'جارٍ الرفع…', '上传中…', 'アップロード中…')
                      : (photoDraft ? PHOTO_PROMPT.replace : PHOTO_PROMPT.add)}
                  </button>
                  <span className="review-photo__hint">{PHOTO_PROMPT.hint}</span>
                  {/* The seat form has an error line; this block did not, so
                      a failed upload set an error that rendered nowhere and
                      the button simply went quiet. Silent failure is the one
                      thing this repository does not allow. */}
                  {error && (
                    <div className="auth-error" role="alert">
                      <p className="auth-error__kr">{error.kr}</p>
                      <p className="auth-error__en">{error.en}</p>
                    </div>
                  )}
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
                  {say(
                    `If it is yes: ${table.place}, ${fullDate(table.date, locale)} at ${table.time}.`,
                    `수락되면: ${table.place}, ${fullDate(table.date, locale)} ${table.time}.`,
                    `Si es que sí: ${table.place}, ${fullDate(table.date, locale)} a las ${table.time}.`,
                    `Si c'est oui : ${table.place}, ${fullDate(table.date, locale)} à ${table.time}.`,
                    `إن كان الجواب نعم: ${table.place}، ${fullDate(table.date, locale)} الساعة ${table.time}.`,
                    `如果答应了：${table.place}，${fullDate(table.date, locale)} ${table.time}。`,
                    `もし承諾されたら：${table.place}、${fullDate(table.date, locale)} ${table.time}。`)}
                </p>
              )}
              {joined && state.kind === SEAT_STATUS.ACCEPTED && (
                <p className="join-next">
                  {say(
                    `Meet at ${table.place}, ${fullDate(table.date, locale)} at ${table.time}.`,
                    `${table.place}에서 만나요, ${fullDate(table.date, locale)} ${table.time}.`,
                    `Quedamos en ${table.place}, ${fullDate(table.date, locale)} a las ${table.time}.`,
                    `Rendez-vous à ${table.place}, ${fullDate(table.date, locale)} à ${table.time}.`,
                    `الموعد في ${table.place}، ${fullDate(table.date, locale)} الساعة ${table.time}.`,
                    `在${table.place}见，${fullDate(table.date, locale)} ${table.time}。`,
                    `${table.place}で待ち合わせ、${fullDate(table.date, locale)} ${table.time}。`)}
                </p>
              )}
              {/* Withdrawing stays available while a seat is still being held
                  for you — including while you are waiting, because a request
                  you no longer want is a seat somebody else could have. */}
              {state.seatHeld && (
                <button className="join-leave" onClick={leave} disabled={busy}>
                  {state.kind === SEAT_STATUS.PENDING
                    ? say('Withdraw my request', '요청 취소', 'Retirar mi solicitud', 'Retirer ma demande', 'اسحب طلبي', '撤回我的申请', '申し込みを取り下げる')
                    : say('Give up my seat', '자리 내려놓기', 'Dejar mi sitio', 'Laisser ma place', 'أتنازل عن مقعدي', '放弃我的位子', '席を手放す')}
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
                {say(
                  `${waiting.length === 1 ? '1 person is' : `${waiting.length} people are`} waiting on your answer. Their seats are held until you decide. Scroll up to “Who is going”.`,
                  `${waiting.length}명이 답을 기다리고 있어요. 결정하실 때까지 자리는 지켜집니다. 위의 “오는 사람”을 봐 주세요.`,
                  `${waiting.length === 1 ? '1 persona espera' : `${waiting.length} personas esperan`} tu respuesta. Sus sitios quedan reservados hasta que decidas. Sube a “Quién viene”.`,
                  `${waiting.length === 1 ? '1 personne attend' : `${waiting.length} personnes attendent`} votre réponse. Leurs places sont gardées jusqu'à votre décision. Remontez à « Qui vient ».`,
                  `${waiting.length} ينتظرون ردّك. تُحفظ مقاعدهم حتى تقرّر. اصعد إلى ”من سيأتي“.`,
                  `有 ${waiting.length} 个人在等你的答复。你决定之前，位子给他们留着。往上看“谁会来”。`,
                  `${waiting.length}人があなたの返事を待っています。決めるまで席は取ってあります。上の「来る人」をご覧ください。`)}
              </p>
            );
          })()}

          {/* Nothing left to call off. The notice at the top of the page has
              already said what happened, and a second cancel button would
              only ever produce the backend's "already called off" error. */}
          {isCancelled(table) ? null : !confirmCancel ? (
            <button className="join-leave" onClick={() => setConfirmCancel(true)}>
              {say('이 상 취소 · Call off this table', '이 상 취소', 'Cancelar esta mesa', 'Annuler cette table', 'ألغِ هذه المائدة', '取消这张饭桌', 'この食卓を中止する')}
            </button>
          ) : (
            <div className="cancel-confirm">
              <p className="cancel-confirm__title">{say('Call this table off?', '이 밥상을 접을까요?', '¿Cancelar esta mesa?', 'Annuler cette table ?', 'أتلغي هذه المائدة؟', '要取消这张饭桌吗？', 'この食卓を中止しますか？')}</p>
              {/* Everybody this cancellation lands on: seats given, and
                  requests still waiting on an answer that will now never
                  come. Not the people already turned down — telling a host
                  they are about to inconvenience somebody they refused a week
                  ago is noise, and it used to pad this number. */}
              {affected.length > 0 ? (
                <p className="cancel-confirm__body">
                  {say(
                    `${affected.length === 1 ? '1 person is' : `${affected.length} people are`} counting on this table: ${affected.map(s => s.name).join(', ')}. The app cannot message them yet — if you have another way to reach them, tell them before you cancel. Their seats and any requests still open disappear when you do.`,
                    `${affected.length}명이 이 밥상을 기다리고 있어요: ${affected.map(s => s.name).join(', ')}. 앱에서는 아직 연락할 수 없으니, 다른 연락 방법이 있으면 취소 전에 알려 주세요. 취소하면 자리와 열려 있는 요청이 모두 사라집니다.`,
                    `${affected.length === 1 ? '1 persona cuenta' : `${affected.length} personas cuentan`} con esta mesa: ${affected.map(s => s.name).join(', ')}. La app todavía no puede escribirles; si tienes otra forma de avisarles, hazlo antes de cancelar. Sus sitios y las solicitudes abiertas desaparecen al cancelar.`,
                    `${affected.length === 1 ? '1 personne compte' : `${affected.length} personnes comptent`} sur cette table : ${affected.map(s => s.name).join(', ')}. L'app ne peut pas encore les prévenir ; si vous avez un autre moyen, faites-le avant d'annuler. Leurs places et les demandes ouvertes disparaissent alors.`,
                    `${affected.length} يعوّلون على هذه المائدة: ${affected.map(s => s.name).join('، ')}. لا يستطيع التطبيق مراسلتهم بعد — إن كان لديك سبيل آخر فأخبرهم قبل الإلغاء. تختفي مقاعدهم وكل طلب مفتوح حين تفعل.`,
                    `有 ${affected.length} 个人指望着这张饭桌：${affected.map(s => s.name).join('、')}。应用还不能给他们发消息——你要是有别的联系方式，取消前先说一声。取消后他们的位子和还开着的申请都会消失。`,
                    `${affected.length}人がこの食卓を当てにしています：${affected.map(s => s.name).join('、')}。アプリからはまだ連絡できません。ほかに連絡手段があれば、中止する前に伝えてください。中止すると席も、開いたままの申し込みも消えます。`)}
                </p>
              ) : (
                <p className="cancel-confirm__body">{say('Nobody has taken a seat, so nobody is affected.', '아직 아무도 자리를 잡지 않아서 영향받는 사람이 없습니다.', 'Nadie ha ocupado un sitio, así que no afecta a nadie.', "Personne n'a pris de place, donc personne n'est concerné.", 'لم يأخذ أحد مقعدًا، فلا أحد يتأثّر.', '还没有人占位子，所以不会影响到谁。', 'まだ誰も席についていないので、誰にも影響しません。')}</p>
              )}
              <div className="cancel-confirm__row">
                <button className="cancel-confirm__no" onClick={() => setConfirmCancel(false)}>
                  {say('Keep it', '그냥 두기', 'Mantenerla', 'La garder', 'أبقِها', '留着', '続ける')}
                </button>
                <button className="cancel-confirm__yes" onClick={cancelTable} disabled={busy}>
                  {busy
                    ? say('Cancelling…', '취소하는 중…', 'Cancelando…', 'Annulation…', 'جارٍ الإلغاء…', '正在取消…', '中止しています…')
                    : say('Call it off', '접기', 'Cancelarla', 'Annuler', 'ألغِها', '取消', '中止する')}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : blocker ? (
        <div className="join-block">
          <p className="join-blocked">{BLOCKER_TEXT[blocker]}</p>
          {blocker === JOIN_BLOCK.FULL && (
            <p className="join-next">{say('Open the same dish yourself and fill your own table.', '같은 요리로 직접 상을 열고 그 자리를 채우세요.', 'Abre tú el mismo plato y llena tu propia mesa.', 'Ouvrez vous-même le même plat et remplissez votre table.', 'افتح الطبق نفسه بنفسك واملأ مائدتك.', '自己开一张同样这道菜的饭桌，把它坐满。', '同じ料理で自分の食卓を開いて、席を埋めてください。')}</p>
          )}
        </div>
      ) : !isMember(auth) ? (
        /* The membership door, before the rules door. Browsing this whole
           page costs nothing — the dish, the guides, who is going — and the
           gate only stands where the commitment starts. AccessPolicy owns
           the words so every gate in the app says the same thing. */
        <div className="join-block">
          <h3 className="detail-block__label">
            {gateText('join-table').titleKr}
            <span className="detail-block__label-en">{gateText('join-table').titleEn}</span>
          </h3>
          <p className="join-next">{gateText('join-table').body}</p>
          <button className="form-submit" translate="no" onClick={() => onRequireAuth?.("join-table")}>
            {say(gateText('join-table').cta, null, gateText('join-table').ctaEs, gateText('join-table').ctaFr, gateText('join-table').ctaAr, gateText('join-table').ctaZh, gateText('join-table').ctaJa)}
          </button>
        </div>
      ) : !agreedToRules(profile, PURPOSE.version) ? (
        /* 교수님's ask, in the one place it is genuinely read: nobody has
           committed to anything yet, and the next tap is the commitment.
           Replaces the seat form rather than sitting above it, so there is
           no half-filled form to lose and no way to reach the button
           without having passed this. */
        <div className="join-block">
          <h3 className="detail-block__label">{say('Before your first seat', '첫 자리를 잡기 전에', 'Antes de tu primer sitio', 'Avant votre première place', 'قبل مقعدك الأول', '在你的第一个位子之前', 'はじめての席の前に')}</h3>
          <RulesConsent
            profile={profile}
            onProfileChange={onProfileChange}
            action="ask for a seat"
          />
        </div>
      ) : (
        <div className="join-block">
          <h3 className="detail-block__label">{say('Ask for a seat', '자리 요청하기', 'Pedir sitio', 'Demander une place', 'اطلب مقعدًا', '申请一个位子', '席をリクエストする')}</h3>

          {/* Three form fields for information the app already has is the
              wrong question to ask somebody who has decided. Where a profile
              exists, this collapses to one button and a line saying who is
              being sent — with a way in for the one thing that changes per
              table, which is what the table should know about you tonight. */}
          {profileKnown && !editingIdentity ? (
            <p className="join-as">
              {say('Going as ', '이렇게 갑니다: ', 'Vas como ', 'Vous y allez en tant que ', 'تذهب باسم ', '以这个身份参加：', 'この名前で参加します：')}
              <strong>{profile.name}</strong>
              {profile.nationality
                ? say(` from ${profile.nationality}`, ` (${profile.nationality})`, ` de ${profile.nationality}`,
                  ` de ${profile.nationality}`, ` من ${profile.nationality}`, `（来自${profile.nationality}）`,
                  `（${profile.nationality}出身）`)
                : ''}
              <button className="join-as__edit" onClick={() => setEditingIdentity(true)}>
                {say('Change', '수정', 'Cambiar', 'Changer', 'تغيير', '更改', '変更')}
              </button>
            </p>
          ) : (
            <>
              <label className="field">
                <span className="field__label">{say('Your name', '이름', 'Tu nombre', 'Votre nom', 'اسمك', '你的名字', 'あなたの名前')}</span>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={say('What to call you', '뭐라고 부를까요', 'Cómo llamarte', 'Comment vous appeler', 'بماذا نناديك', '怎么称呼你', 'どう呼べばいいですか')} />
              </label>
              <label className="field">
                <span className="field__label">{say('Where you are from (optional)', '어디서 오셨는지 (선택)', 'De dónde eres (opcional)', "D'où vous venez (facultatif)", 'من أين أنت (اختياري)', '你从哪儿来（可选）', '出身（任意）')}</span>
                <input type="text" value={nationality} onChange={e => setNationality(e.target.value)} placeholder={say('Japan', '일본', 'Japón', 'Japon', 'اليابان', '日本', '日本')} />
              </label>
            </>
          )}

          {!noteOpen ? (
            <button className="join-note-open" onClick={() => setNoteOpen(true)}>
              {say('+ Anything the table should know?', '+ 밥상에서 알아야 할 게 있나요?', '+ ¿Algo que la mesa deba saber?', '+ Quelque chose que la table devrait savoir ?', '+ أشيء ينبغي أن تعرفه المائدة؟', '+ 有什么要让这桌知道的吗？', '+ 食卓に伝えておくことはありますか？')}
            </button>
          ) : (
            <label className="field">
              <span className="field__label">{say('Anything the table should know?', '밥상에서 알아야 할 게 있나요?', '¿Algo que la mesa deba saber?', 'Quelque chose que la table devrait savoir ?', 'أشيء ينبغي أن تعرفه المائدة؟', '有什么要让这桌知道的吗？', '食卓に伝えておくことはありますか？')}</span>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder={say('No pork, and my Korean is about ten words.', '돼지고기는 못 먹고, 한국어는 열 단어쯤 합니다.', 'Sin cerdo, y mi coreano son unas diez palabras.', 'Pas de porc, et mon coréen tient en dix mots.', 'بلا لحم خنزير، وكوريّتي عشر كلمات تقريبًا.', '不吃猪肉，我的韩语大概就十个词。', '豚肉は食べません。韓国語は十語くらいです。')} autoFocus />
            </label>
          )}

          {/* role=alert so a screen reader hears the refusal. Somebody who
              cannot see the red line has no other way to learn the seat did
              not go through. */}
          {error && (
            <p className="join-error" role="alert">
              {locale === LOCALE.BOTH && <strong>{error.kr} </strong>}
              {say(error.en, error.kr, error.es, error.fr, error.ar, error.zh, error.ja)}
            </p>
          )}
          <button className="form-submit" translate="no" onClick={join} disabled={busy || !name.trim()}>
            {busy
              ? say('Asking…', '요청하는 중…', 'Pidiendo…', 'Demande en cours…', 'جارٍ الطلب…', '正在申请…', '申し込み中…')
              : say('Take a seat', '자리 요청', 'Pedir sitio', 'Prendre une place', 'اطلب مقعدًا', '申请位子', '席を申し込む')}
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
          <p className="report-receipt__title" role="status"><CheckIcon size={15} /> {REPORT_RECEIPT.title}</p>
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
          <div
            className={`report-panel__reasons${reportProblems.some(p => p.field === 'reason') ? ' is-bad' : ''}`}
            role="group"
            aria-label={say('Reason', '이유', 'Motivo', 'Motif', 'السبب', '原因', '理由')}
          >
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
          {reportProblems.filter(p => p.field === 'reason').map(p => (
            <span key={p.field} className="field__error">{p.kr} · {p.en}</span>
          ))}
          {/* Labelled, not just placeheld. A placeholder disappears the moment
              somebody starts typing, which on this panel means the question
              vanishes exactly when a distressed person looks up to check what
              they were being asked. */}
          <label className={`field${reportProblems.some(p => p.field === 'note') ? ' is-bad' : ''}`}>
            <span className="field__label">{say('무슨 일이 있었나요? · What happened, in your words', '무슨 일이 있었나요?', 'Qué pasó, con tus palabras', "Ce qui s'est passé, avec vos mots", 'ما الذي حدث، بكلماتك', '发生了什么，用你自己的话', '何があったか、あなたの言葉で')}</span>
            <textarea
              className="report-panel__note"
              rows={3}
              maxLength={REPORT_NOTE_MAX}
              value={reportNote}
              onChange={e => setReportNote(e.target.value)}
              placeholder={say('Passed to the team exactly as you write it.', '적어 주신 그대로 팀에 전달됩니다.', 'Se envía al equipo tal como lo escribas.', "Transmis à l'équipe tel que vous l'écrivez.", 'يصل إلى الفريق كما كتبته تمامًا.', '按你写的原样转给团队。', '書いてくださったまま、チームに届きます。')}
            />
            {reportProblems.filter(p => p.field === 'note').map(p => (
              <span key={p.field} className="field__error">{p.kr} · {p.en}</span>
            ))}
          </label>
          <div className="report-panel__row">
            <button className="cancel-confirm__no" onClick={() => setReportOpen(false)}>
              {say('Never mind', '취소', 'Déjalo', 'Laissez tomber', 'دع الأمر', '算了', 'やめておく')}
            </button>
            <button className="cancel-confirm__yes" onClick={submitReport} disabled={busy}>
              {busy
                ? say('Sending…', '보내는 중…', 'Enviando…', 'Envoi…', 'جارٍ الإرسال…', '正在发送…', '送信中…')
                : REPORT_DOOR.send}
            </button>
          </div>
        </div>
      )}

      {/* Quiet, at the bottom, and always there — not a scare on the way in,
          but not something to go hunting for either. */}
      <button className="safety-open" translate="no" onClick={() => setSafetyOpen(true)}>
        {say('도움이 필요하면 · Feeling unsafe or need help?', '도움이 필요하면', '¿No te sientes seguro o necesitas ayuda?', "Vous ne vous sentez pas en sécurité ou besoin d'aide ?", 'ألا تشعر بالأمان أو تحتاج مساعدة؟', '觉得不安全或需要帮助？', '安全でないと感じますか、助けが必要ですか？')}
      </button>

      {/* The page's last word looks forward. A full table, a wrong date, a
          dish that scared somebody off — none of those should end at a dead
          stop when other evenings are open. Same dish first, then soonest. */}
      {onOpenTable && similar.length > 0 && (
        <div className="detail-block similar-block">
          <h3 className="detail-block__label">{say('이런 밥상은 어때요 · Other tables open now', '이런 밥상은 어때요', 'Otras mesas abiertas ahora', "D'autres tables ouvertes en ce moment", 'موائد أخرى مفتوحة الآن', '现在开着的其他饭桌', 'いま開いているほかの食卓')}</h3>
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
            <ClockIcon size={14} /> {dayLabelShort(table.date, locale)} · {table.time}
          </span>
          <button
            className="detail-cta__btn" translate="no"
            /* No behavior:'smooth' — Chromium quietly refuses smooth
               scrollIntoView inside .content-region (verified in this app,
               2026-08-03: instant scrolls, smooth does not move at all), and
               a button that does nothing is worse than a jump cut. */
            onClick={() => joinRef.current?.scrollIntoView({ block: 'start' })}
          >
            {say('자리 요청 · Take a seat', '자리 요청', 'Pedir sitio', 'Demander une place', 'اطلب مقعدًا', '申请一个位子', '席をリクエストする')}
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
