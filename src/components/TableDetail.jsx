import React, { useEffect, useMemo, useState } from 'react';
import { menuById, CATEGORY_LABEL } from '../domain/catalog/menus.js';
import { seatsRemaining, joinBlocker, BLOCKER_TEXT, JOIN_BLOCK } from '../domain/policy/table.js';
import { getTable, listSignups, createSignup, cancelSignup, deleteTable } from '../data/tableRepository.js';
import PhraseSheet from './PhraseSheet';
import SafetySheet from './SafetySheet';
import { conflictsFor } from '../data/profile';
import { PURPOSE } from '../content/safety.js';
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

export default function TableDetail({ tableId, profile, onProfileChange, onBack, onOpenTheme }) {
  const [table, setTable] = useState(null);
  const [signups, setSignups] = useState([]);
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
  // Set once in Profile, so the seat form has nothing left to ask.
  const profileKnown = Boolean(profile?.name?.trim());

  const refresh = async () => {
    const [t, s] = await Promise.all([getTable(tableId), listSignups(tableId)]);
    setTable(t);
    setSignups(s);
  };

  useEffect(() => { refresh(); }, [tableId]);

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
  const blocker = useMemo(
    () => (table ? joinBlocker(table, signups, profile?.userId) : null),
    [table, signups, profile],
  );
  const mySignup = useMemo(
    () => signups.find(s => s.userId === profile?.userId) ?? null,
    [signups, profile],
  );

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

  return (
    <section className="sheet-page table-detail" aria-label={`${menu.name} table`}>
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon size={20} />
        </button>
        <h1>{menu.name}</h1>
      </header>

      <div className="detail-hero">
        <span className="detail-hero__word" aria-hidden="true">{menu.nameKo}</span>
        <span className="detail-hero__cat">{CATEGORY_LABEL[menu.category]?.en}</span>
        <h2 className="detail-hero__dish">
          {menu.name}
          <span className="detail-hero__rom">{menu.romanization}</span>
        </h2>
        {/* Under the name, above the reason. Somebody who arrived on a shared
            link may be meeting this word for the first time. */}
        <p className="detail-hero__gloss">{menu.gloss}</p>
        <p className="detail-hero__why">{menu.whyShared}</p>
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
        <button className="phrase-open" onClick={() => setPhrasesOpen(true)}>
          식탁에서 · What to say at the table
        </button>
      </div>

      {/* The curation the plan asks for, and the thing a table was missing:
          why this dish is eaten together at all. Without it a table is a
          booking; with it the meal is the point of the trip. */}
      {menu.culture && (
        <div className="detail-block">
          <h3 className="detail-block__label">Why it is eaten together</h3>
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
        </div>
      )}

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
        <button className="detail-share" onClick={share}>
          {shared ? <><CheckIcon size={15} /> Link copied</> : '링크 보내기 · Send this table to someone'}
        </button>
      </div>

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
      </div>

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

      <div className="detail-block">
        <h3 className="detail-block__label">Who is going</h3>
        <ul className="who-list">
          <li className="who-row">
            <span className="who-row__dot" aria-hidden="true" />
            <span className="who-row__name">{table.hostName}</span>
            <span className="who-row__role">host</span>
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
          </li>
          {signups.map(s => (
            <li key={s.id} className="who-row who-row--stacked">
              <span className="who-row__dot" aria-hidden="true" />
              <span className="who-row__line">
                <span className="who-row__name">{s.name}</span>
                {s.nationality && <span className="who-row__role">{s.nationality}</span>}
              </span>
              {/* The seat form asks "anything the table should know?" and
                  people answer it with the thing that matters most — no pork,
                  ten words of Korean, running late. It was being written to
                  storage and shown to nobody, which is worse than never
                  asking. */}
              {s.note && <span className="who-row__note">“{s.note}”</span>}
            </li>
          ))}
        </ul>
        {table.note && <p className="detail-note">“{table.note}”</p>}
      </div>

      {/* The host badge is deliberately not here. The plan promises verified
          Korean hosts and nothing in this build verifies anybody — printing a
          checkmark now would be the app vouching for a stranger it has never
          checked. It appears when verification does. */}

      {mySignup ? (
        <div className="join-block join-block--in">
          <p className="join-confirmed">
            <CheckIcon size={16} /> You have a seat at this table.
          </p>
          {joined && (
            <p className="join-next">
              Meet at {table.place}, {fullDate(table.date)} at {table.time}.
            </p>
          )}
          <button className="join-leave" onClick={leave} disabled={busy}>
            Give up my seat
          </button>
        </div>
      ) : isHost ? (
        /* The host's own table. Everything they can do about it is here,
           because there was previously nowhere at all — a host who could not
           make their own dinner had no way to say so, and the guests would
           have found out by standing outside a restaurant. */
        <div className="join-block">
          <p className="join-blocked">{BLOCKER_TEXT[JOIN_BLOCK.OWN_TABLE]}</p>

          {!confirmCancel ? (
            <button className="join-leave" onClick={() => setConfirmCancel(true)}>
              이 상 취소 · Call off this table
            </button>
          ) : (
            <div className="cancel-confirm">
              <p className="cancel-confirm__title">Call this table off?</p>
              {signups.length > 0 ? (
                <p className="cancel-confirm__body">
                  {signups.length === 1 ? '1 person has' : `${signups.length} people have`} a seat
                  {signups.length > 0 && `: ${signups.map(s => s.name).join(', ')}`}. The app cannot
                  message them yet — if you have another way to reach them, tell them before you
                  cancel. Their seats disappear when you do.
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
          <button className="form-submit" onClick={join} disabled={busy || !name.trim()}>
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

      {/* Quiet, at the bottom, and always there — not a scare on the way in,
          but not something to go hunting for either. */}
      <button className="safety-open" onClick={() => setSafetyOpen(true)}>
        도움이 필요하면 · Feeling unsafe or need help?
      </button>

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
