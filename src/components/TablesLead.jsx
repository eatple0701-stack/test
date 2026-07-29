import React, { useEffect, useState } from 'react';
import { menuById } from '../domain/catalog/menus.js';
import { seatsRemaining, isPast } from '../domain/policy/table.js';
import { listTables, listAllSignups, seedSampleTables } from '../data/tableRepository.js';
import { ChevronRightIcon } from './Icons';

// Open tables, on the Explore screen.
//
// Explore could describe seven cultures without ever mentioning that the app
// can seat you at a table — the one thing it exists to do lived behind a tab
// nobody had a reason to press. A discovery screen that never names the core
// action is not discovery, it is a brochure.
//
// It sits directly under the cover because of what each answers: the cover
// says what is interesting today, this says what you can actually do this
// week, and the cultures below say what else there is. A concrete invitation
// outranks browsing.

const dayLabel = (date) => {
  const d = new Date(`${date}T00:00`);
  if (!Number.isFinite(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

export default function TablesLead({ onOpenTables }) {
  const [tables, setTables] = useState(null);
  const [signups, setSignups] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await seedSampleTables();
      const [t, s] = await Promise.all([listTables(), listAllSignups()]);
      if (alive) { setTables(t); setSignups(s); }
    })();
    return () => { alive = false; };
  }, []);

  if (tables === null) return null;

  // Only tables somebody could still join. A full table or one that already
  // happened is not an invitation, and showing it here would make the section
  // look busier at the cost of being useful.
  const open = tables
    .filter(t => !isPast(t))
    .filter(t => seatsRemaining(t, signups.filter(s => s.tableId === t.id)) > 0)
    .slice(0, 3);

  return (
    <section className="tables-lead" aria-label="Open tables">
      <div className="tables-lead__head">
        <div>
          <span className="tables-lead__kr">밥친구</span>
          <h2 className="tables-lead__title">
            {open.length > 0 ? 'Tables you could join this week' : 'Nobody has set a table yet'}
          </h2>
        </div>
        <button className="tables-lead__all" onClick={onOpenTables}>
          All <ChevronRightIcon size={13} />
        </button>
      </div>

      {open.length === 0 ? (
        <button className="tables-lead__empty" onClick={onOpenTables}>
          Samgyeopsal starts at two servings. Open a table and see who comes.
        </button>
      ) : (
        <div className="tables-lead__row">
          {open.map(t => {
            const menu = menuById(t.menuId);
            if (!menu) return null;
            const left = seatsRemaining(t, signups.filter(s => s.tableId === t.id));
            return (
              <button key={t.id} className="lead-table" onClick={onOpenTables}>
                <span className="lead-table__kr" aria-hidden="true">{menu.nameKo}</span>
                <span className="lead-table__dish">{menu.name}</span>
                <span className="lead-table__when">{dayLabel(t.date)} · {t.time}</span>
                <span className="lead-table__seats">
                  {left} seat{left === 1 ? '' : 's'} left
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
