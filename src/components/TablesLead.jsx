import React, { useEffect, useState } from 'react';
import { menuById } from '../domain/catalog/menus.js';
import { seatsRemaining, isPast, canJoin } from '../domain/policy/table.js';
import { listTables, listAllSignups, seedSampleTables } from '../data/tableRepository.js';
import { ChevronRightIcon } from './Icons';
import { bookable } from '../domain/policy/cancellation.js';

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

export default function TablesLead({ onOpenTables, onOpenTable, profile }) {
  const [tables, setTables] = useState(null);
  const [signups, setSignups] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await seedSampleTables();
      const [t, s] = await Promise.all([listTables(), listAllSignups()]);
      if (alive) { setTables(bookable(t)); setSignups(s); }
    })();
    return () => { alive = false; };
  }, []);

  if (tables === null) return null;

  // Only tables *this reader* could still join, which is a different question
  // from whether a seat exists. The heading promises tables you could join and
  // the card counts seats left, so listing one you already have a seat at
  // invites somebody to something they have already done — and the detail
  // screen then correctly tells them they are going. The policy has always
  // known the difference; this section was the one place not asking it.
  const joinable = tables.filter(t =>
    canJoin(t, signups.filter(s => s.tableId === t.id), profile?.userId));
  const open = joinable.slice(0, 3);

  // A table that exists but is closed to this reader is not "nobody has set a
  // table" — that would call the host's dinner nothing on the screen of the
  // guest who is going to it.
  const anyUpcoming = tables.some(t => !isPast(t));

  return (
    <section className="tables-lead" aria-label="Open tables">
      <div className="tables-lead__head">
        <div>
          {/* The 밥친구 label above this heading is gone: the wordmark is in
              the app chrome now, four lines up the screen, and printing the
              product's own name twice in one viewport is the section
              introducing an app the reader is already inside. */}
          {/* Every other tab opens with a Korean word over its English
              sentence — 밥친구, 여권 — and Explore was the one screen that
              did not. The Korean is a label rather than a translation, which
              is the same thing 밥친구 and 여권 are: it names the section, and
              the sentence under it does the explaining. */}
          <span className="tables-lead__kr" translate="no">이번 주 밥상</span>
          {/* Written twice rather than once. These sentences were English
              only, so a Korean-only interface kept the label above them and
              lost everything that said what was actually going on this week
              — which is the whole section. */}
          <h2 className="tables-lead__title l-ko-only" translate="no">
            {open.length > 0
              ? '이번 주에 앉을 수 있는 밥상'
              : anyUpcoming
                ? '열려 있는 밥상에는 이미 다 들어가 계세요'
                : '아직 아무도 밥상을 차리지 않았어요'}
          </h2>
          <h2 className="tables-lead__title tables-lead__title-en">
            {open.length > 0
              ? 'Tables you could join this week'
              : anyUpcoming
                ? 'You are in every table that is open'
                : 'Nobody has set a table yet'}
          </h2>
        </div>
        <button className="tables-lead__all" onClick={onOpenTables}>
          <span className="l-ko-only" translate="no">전체</span>
          <span className="tables-lead__all-en">All</span>
          <ChevronRightIcon size={13} />
        </button>
      </div>

      {open.length === 0 ? (
        <button className="tables-lead__empty" onClick={onOpenTables}>
          <span className="l-ko-only" translate="no">
            {anyUpcoming
              ? '이번 주에 더 청할 밥상은 없어요. 직접 상을 차리고 누가 오는지 보세요.'
              : '삼겹살은 2인분부터예요. 상을 차리고 누가 오는지 보세요.'}
          </span>
          <span className="tables-lead__empty-en">
            {anyUpcoming
              ? 'Nothing else to ask for this week. Open a table of your own and see who comes.'
              : 'Samgyeopsal starts at two servings. Open a table and see who comes.'}
          </span>
        </button>
      ) : (
        <div className="tables-lead__row">
          {open.map(t => {
            const menu = menuById(t.menuId);
            if (!menu) return null;
            const left = seatsRemaining(t, signups.filter(s => s.tableId === t.id));
            return (
              /* Opens this table, not the list. A card that names a dish, a
                 night and a seat count is a specific invitation, and sending
                 it to a directory instead was the app quietly refusing the
                 thing it had just offered. */
              <button
                key={t.id}
                className="lead-table"
                onClick={() => (onOpenTable ? onOpenTable(t.id) : onOpenTables())}
              >
                <span className="lead-table__kr" aria-hidden="true">{menu.nameKo}</span>
                <span className="lead-table__dish">{menu.name}</span>
                <span className="lead-table__when">{dayLabel(t.date)} · {t.time}</span>
                <span className="lead-table__seats">
                  {left} seat{left === 1 ? '' : 's'} left
                  {/* The table list has said `sample` since the day these were
                      seeded; this screen never did, which meant the first
                      three tables anybody ever saw were invented and unlabelled
                      on the highest-traffic screen in the app. */}
                  {t.isSample && <span className="lead-table__sample">sample</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
