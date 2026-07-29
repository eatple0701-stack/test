import React, { useEffect, useMemo, useState } from 'react';
import { menuById, CATEGORY_LABEL } from '../domain/catalog/menus.js';
import { seatsRemaining, joinBlocker, BLOCKER_TEXT, JOIN_BLOCK } from '../domain/policy/table.js';
import { getTable, listSignups, createSignup, cancelSignup } from '../data/tableRepository.js';
import PhraseSheet from './PhraseSheet';
import { ChevronLeftIcon, MapPinIcon, ClockIcon, CheckIcon } from './Icons';

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

export default function TableDetail({ tableId, profile, onProfileChange, onBack }) {
  const [table, setTable] = useState(null);
  const [signups, setSignups] = useState([]);
  const [name, setName] = useState(profile?.name ?? '');
  const [nationality, setNationality] = useState(profile?.nationality ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  const [error, setError] = useState(null);

  const refresh = async () => {
    const [t, s] = await Promise.all([getTable(tableId), listSignups(tableId)]);
    setTable(t);
    setSignups(s);
  };

  useEffect(() => { refresh(); }, [tableId]);

  const menu = table ? menuById(table.menuId) : null;
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
        <p className="detail-hero__why">{menu.whyShared}</p>
      </div>

      <div className="detail-block">
        <h3 className="detail-block__label">What happens at the table</h3>
        <p className="detail-block__body">{menu.howItWorks}</p>
        {menu.contains.length > 0 && (
          <p className="detail-block__contains">Contains {menu.contains.join(', ')}</p>
        )}

        {/* The app used to stop here — it delivered somebody to a restaurant
            and then had nothing to offer at the meal itself, which is the
            only part of this that matters. */}
        <button className="phrase-open" onClick={() => setPhrasesOpen(true)}>
          식탁에서 · What to say at the table
        </button>
      </div>

      <div className="detail-block detail-block--facts">
        <p className="detail-fact"><ClockIcon size={15} /> {fullDate(table.date)} at {table.time}</p>
        <p className="detail-fact"><MapPinIcon size={15} /> {table.place}</p>
        <p className="detail-fact">
          <span className={`detail-seats${left === 0 ? ' is-full' : ''}`}>
            {left === 0 ? 'Full' : `${left} seat${left === 1 ? '' : 's'} left`}
          </span>
          of {table.seats}
        </p>
      </div>

      <div className="detail-block">
        <h3 className="detail-block__label">Who is going</h3>
        <ul className="who-list">
          <li className="who-row">
            <span className="who-row__dot" aria-hidden="true" />
            <span className="who-row__name">{table.hostName}</span>
            <span className="who-row__role">host</span>
          </li>
          {signups.map(s => (
            <li key={s.id} className="who-row">
              <span className="who-row__dot" aria-hidden="true" />
              <span className="who-row__name">{s.name}</span>
              {s.nationality && <span className="who-row__role">{s.nationality}</span>}
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
          <label className="field">
            <span className="field__label">Your name</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="What to call you" />
          </label>
          <label className="field">
            <span className="field__label">Where you are from (optional)</span>
            <input type="text" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="Japan" />
          </label>
          <label className="field">
            <span className="field__label">Anything the table should know? (optional)</span>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="No pork, and my Korean is about ten words." />
          </label>
          {error && <p className="join-error">{error}</p>}
          <button className="form-submit" onClick={join} disabled={busy || !name.trim()}>
            {busy ? 'Asking…' : '자리 요청 · Take a seat'}
          </button>
        </div>
      )}

      {phrasesOpen && (
        <PhraseSheet dish={menu.name} onClose={() => setPhrasesOpen(false)} />
      )}
    </section>
  );
}
