import React, { useEffect, useMemo, useState } from 'react';
import { menus, menuById, CATEGORY_LABEL } from '../domain/catalog/menus.js';
import { seatsRemaining, isPast } from '../domain/policy/table.js';
import { listTables, listAllSignups, seedSampleTables, isLocalOnly } from '../data/tableRepository.js';
import { conflictsFor } from '../data/profile';
import { ChevronRightIcon, MapPinIcon, ClockIcon } from './Icons';

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

export default function TablesTab({ onOpenTable, onCreateTable, onRequestTable, profile }) {
  const [tables, setTables] = useState(null);
  const [signups, setSignups] = useState([]);
  const [menuFilter, setMenuFilter] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      await seedSampleTables();
      const [t, s] = await Promise.all([listTables(), listAllSignups()]);
      if (alive) { setTables(t); setSignups(s); }
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
  // answer to it.
  const open = useMemo(
    () => (tables ?? []).filter(t => !isPast(t)),
    [tables],
  );

  const shown = useMemo(
    () => (menuFilter ? open.filter(t => t.menuId === menuFilter) : open),
    [open, menuFilter],
  );

  // Only offer a filter for dishes somebody is actually eating — a chip that
  // always returns nothing is a dead end dressed as a choice.
  const liveMenuIds = useMemo(
    () => menus.filter(m => open.some(t => t.menuId === m.id)).map(m => m.id),
    [open],
  );

  return (
    <section className="tables-tab" aria-label="밥친구 tables">
      <header className="screen-head screen-head--dark">
        <span className="screen-head__kr">밥친구</span>
        <h1 className="screen-head__title">Dishes you cannot order alone.</h1>
        <p className="screen-head__sub">
          Ask to sit at a table, or open one and see who comes.
        </p>
        <button className="screen-head__cta" onClick={onCreateTable}>
          상 차리기 · Open a table
        </button>
      </header>

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
                <span className="menu-chip__kr">{m.nameKo}</span> {m.name}
              </button>
            );
          })}
        </div>
      )}

      {tables === null && <p className="tables-empty">Loading tables…</p>}

      {tables !== null && shown.length === 0 && (
        <div className="tables-empty">
          <p className="tables-empty__title">No table for this one yet.</p>
          <p>Open it yourself and the seats are yours to fill.</p>
          <button className="tables-empty__cta" onClick={onCreateTable}>
            상 차리기 · Open a table
          </button>
          {/* The other half of an empty screen: say what you wanted, and let
              the app either find it or hand it back as a table. */}
          <button className="tables-empty__ask" onClick={onRequestTable}>
            찾는 밥상 · Tell us what you are after
          </button>
        </div>
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
              <span className="table-card__word" aria-hidden="true">{menu.nameKo}</span>

              <span className="table-card__top">
                <span className="table-card__cat">
                  {CATEGORY_LABEL[menu.category]?.en ?? ''}
                </span>
                {isMine && <span className="table-card__mine">Your table</span>}
                {iAmGoing && <span className="table-card__mine">You are going</span>}
                {conflicts.length > 0 && (
                  <span className="table-card__warn">contains {conflicts.join(', ')}</span>
                )}
              </span>

              <h2 className="table-card__dish">{menu.name}</h2>
              <p className="table-card__gloss">{menu.gloss}</p>

              {/* The reason this table exists at all. */}
              <p className="table-card__why">{menu.whyShared}</p>

              <span className="table-card__meta">
                <ClockIcon size={13} /> {dayLabel(t.date)} · {t.time}
                <span className="table-card__dot" aria-hidden="true">·</span>
                <MapPinIcon size={13} /> {t.place}
              </span>

              <span className="table-card__foot">
                <span className="table-card__host">
                  Hosted by {t.hostName}
                  {t.hostVerified && <span className="table-card__verified">인증 · verified</span>}
                  {/* Scanning a list, the language is the fastest filter a
                      traveller applies. */}
                  {(t.languages ?? []).length > 0 && (
                    <span className="table-card__langs">{t.languages.join(' · ')}</span>
                  )}
                  {t.isSample && <span className="table-card__sample">sample</span>}
                </span>
                <span className={`table-card__seats${left === 0 ? ' is-full' : ''}`}>
                  {left === 0 ? 'Full' : `${left} seat${left === 1 ? '' : 's'} left`}
                  <ChevronRightIcon size={14} />
                </span>
              </span>
            </button>
          );
        })}
      </div>

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
    </section>
  );
}
