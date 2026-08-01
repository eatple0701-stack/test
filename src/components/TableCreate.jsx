import React, { useMemo, useState } from 'react';
import { menus, menuById, CATEGORY_LABEL } from '../domain/catalog/menus.js';
import { validateNewTable } from '../domain/policy/table.js';
import { GUIDES } from '../domain/catalog/hosts.js';
import { createTable } from '../data/tableRepository.js';
import { conflictsFor } from '../data/profile';
import HostBrief from './HostBrief';
import { ChevronLeftIcon } from './Icons';

// Opening a table.
//
// The dish is chosen first and everything else follows from it, because the
// dish is the thing being offered — a host is not booking a restaurant, they
// are saying "I am eating this, there is room". Choosing the dish first also
// lets the form tell you the minimum before you pick a number of seats
// instead of rejecting you afterwards.

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TableCreate({ profile, onProfileChange, onBack, onCreated, prefill }) {
  const [menuId, setMenuId] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  // Arriving from a restaurant fills in the two things that place already
  // knows. The dish is still asked, because a restaurant's category is not a
  // menu and guessing one would put the wrong word on somebody's table.
  const [place, setPlace] = useState(prefill?.place ?? '');
  const [restaurant, setRestaurant] = useState(prefill?.restaurant ?? '');
  const [seats, setSeats] = useState(4);
  const [note, setNote] = useState('');
  const [hostName, setHostName] = useState(profile?.name ?? '');
  const [guides, setGuides] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const menu = menuId ? menuById(menuId) : null;

  const problems = useMemo(() => {
    const list = validateNewTable({ menuId, date, time, place, seats }, menu);
    if (!hostName.trim()) list.push('Add the name people will look for.');
    return list;
  }, [menuId, date, time, place, seats, menu, hostName]);

  const submit = async () => {
    setSubmitted(true);
    if (problems.length > 0 || saving) return;
    setSaving(true);
    const row = await createTable({
      menuId, date, time, place: place.trim(), restaurant: restaurant.trim(), guides,
      seats: Number(seats), note: note.trim(),
      hostId: profile?.userId, hostName: hostName.trim(), hostNationality: profile?.nationality,
    });
    onProfileChange?.({ ...profile, name: hostName.trim() });
    onCreated(row.id);
  };

  return (
    <section className="sheet-page" aria-label="Open a table">
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon size={20} />
        </button>
        <h1>상 차리기 · Open a table</h1>
      </header>

      {/* Before the first field, because these are the terms of the evening
          and not a footnote to it. Removes itself once they have hosted. */}
      <HostBrief profile={profile} />

      <div className="form-block">
        <h2 className="form-label">What are you eating?</h2>
        <div className="dish-grid">
          {menus.map(m => (
            <button
              key={m.id}
              className={`dish-option${menuId === m.id ? ' is-on' : ''}`}
              onClick={() => {
                setMenuId(m.id);
                // Never leave a seat count below the dish's own minimum.
                setSeats(s => Math.max(Number(s) || 0, m.minPeople, 2));
              }}
            >
              <span className="dish-option__kr">{m.nameKo}</span>
              <span className="dish-option__name">{m.name}</span>
              <span className="dish-option__min">
                {m.minPeople > 1 ? `${m.minPeople}+ people` : 'Any size'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {menu && (
        <div className="form-block">
          <div className="dish-brief">
            <span className="dish-brief__cat">{CATEGORY_LABEL[menu.category]?.en}</span>
            <p className="dish-brief__how">{menu.howItWorks}</p>
            {menu.contains.length > 0 && (
              <p className="dish-brief__contains">Contains {menu.contains.join(', ')}</p>
            )}
            {conflictsFor(menu, profile).length > 0 && (
              <p className="detail-conflict">
                You said you do not eat {conflictsFor(menu, profile).join(' or ')} — you can still
                host this, you just will not be eating all of it.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="form-block">
        <h2 className="form-label">When and where?</h2>
        <div className="field-row">
          <label className="field">
            <span className="field__label">Date</span>
            <input type="date" value={date} min={todayISO()} onChange={e => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Time</span>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span className="field__label">Where you will meet</span>
          <input
            type="text"
            value={place}
            placeholder="Exit 4, Jongno 3-ga station"
            onChange={e => setPlace(e.target.value)}
          />
        </label>

        {/* The shop, which is not the same as the meeting point. A table that
            named a station exit and nothing else left a guest with no idea
            where they were actually eating. Optional on purpose — a host who
            has not decided says so, rather than inventing a name. */}
        <label className="field">
          <span className="field__label">Which restaurant? (optional)</span>
          <input
            type="text"
            value={restaurant}
            placeholder="Sae Ma Eul Sikdang, or leave blank to decide together"
            onChange={e => setRestaurant(e.target.value)}
          />
        </label>
      </div>

      <div className="form-block">
        <h2 className="form-label">How many at the table?</h2>
        <div className="seat-picker">
          {[2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              className={`seat-option${Number(seats) === n ? ' is-on' : ''}`}
              disabled={Boolean(menu && n < menu.minPeople)}
              onClick={() => setSeats(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="field__hint">
          Counting you. {menu && menu.minPeople > 1
            ? `${menu.name} needs ${menu.minPeople} or more.`
            : 'A table needs at least two.'}
        </p>
      </div>

      {/* The plan's 문화 큐레이터, asked as a question the host can answer.
          Everything above this point describes a booking; this is the part
          that makes the evening an exchange rather than four people eating.
          Optional on purpose — a host who ticks nothing still hosts, and a
          box nobody can honestly tick would be worse than no box. */}
      <div className="form-block">
        <h2 className="form-label">문화 가이드 · What will you walk the table through?</h2>
        <p className="form-label__hint">
          Optional. Whatever you tick is shown on your table, in your guests&rsquo; language,
          so they know what to expect before they ask for a seat.
        </p>
        <div className="guide-picks">
          {GUIDES.map(g => {
            const on = guides.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                className={`guide-pick${on ? ' is-on' : ''}`}
                aria-pressed={on}
                /* Functional, not `[...guides, g.id]`. Two taps close enough
                   together to land in one React batch both read the same
                   captured array, and the second silently drops the first. */
                onClick={() => setGuides(cur =>
                  cur.includes(g.id) ? cur.filter(x => x !== g.id) : [...cur, g.id])}
              >
                <span className="guide-pick__kr">{g.kr}</span>
                <span className="guide-pick__en">{g.en}</span>
                <span className="guide-pick__say">{g.hostAsk}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-block">
        <h2 className="form-label">Your name</h2>
        <label className="field">
          <input
            type="text"
            value={hostName}
            placeholder="What people should look for"
            onChange={e => setHostName(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Anything to say? (optional)</span>
          <textarea
            rows={3}
            value={note}
            placeholder="First time grilling is fine — I will do the scissors."
            onChange={e => setNote(e.target.value)}
          />
        </label>
      </div>

      {submitted && problems.length > 0 && (
        <ul className="form-problems">
          {problems.map(p => <li key={p}>{p}</li>)}
        </ul>
      )}

      <div className="form-actions">
        <button className="form-submit" onClick={submit} disabled={saving}>
          {saving ? 'Opening…' : '테이블 열기 · Open the table'}
        </button>
      </div>
    </section>
  );
}
