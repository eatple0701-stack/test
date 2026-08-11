import React from 'react';
import { ChevronLeftIcon } from './Icons';
import { useText } from './localeText.js';

// A dish, read on its own.
//
// The catalogue carries real writing for all ten dishes — why it is shared,
// what happens at the table, what the dish means at home — and until now every
// word of it was reachable only through a table's detail page. That is fine
// while tables exist. On a week with none it means ten dishes' worth of the
// only cultural content this app has is unreachable, on exactly the screen
// with nothing else on it.
//
// 당근 opens with seventeen 인기 검색어 chips and 여기어때 with twenty 인기
// 여행지; both exist because a blank screen asks "what do I even look for"
// and a chip answers it. Ours answer it with the thing we actually have.
//
// Nothing here is new prose. Every field is the same one TableDetail renders,
// in the same order and with the same restraint — `contains` only when the
// catalogue enumerated it, `varies` said out loud rather than left as silence
// that looks like a clearance.

export default function DishSheet({ menu, onClose, onOpenTable }) {
  const say = useText();
  if (!menu) return null;

  return (
    <div className="dish-sheet sheet-page" role="dialog" aria-label={`${menu.name}`}>
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onClose} aria-label="Close">
          <ChevronLeftIcon size={20} />
        </button>
        {/* Both names, in every language setting. Cards and tiles follow the
            setting; this is the screen you open to learn the dish, so it is
            where the Korean name is kept for somebody who will point at it on
            a menu — data-no-locale is that exemption, stated in one place
            rather than scattered across seven card classes. */}
        <h1 className="dish-sheet__title" translate="no" data-no-locale>{menu.nameKo} · {menu.name}</h1>
      </header>

      <div className="dish-sheet__body">
        <p className="dish-sheet__gloss">{say(menu.gloss, menu.glossKo)}</p>
        <p className="dish-sheet__roman" translate="no">{menu.romanization}</p>

        {/* The sentence the whole app rests on: why this one cannot be eaten
            alone. 백반's says the opposite in its own words, and that is the
            point — the catalogue is allowed to contradict the pitch. */}
        <section className="dish-sheet__block">
          <h2 className="dish-sheet__label">Why it is shared</h2>
          <p>{say(menu.whyShared, menu.whySharedKo)}</p>
        </section>

        <section className="dish-sheet__block">
          <h2 className="dish-sheet__label">What happens at the table</h2>
          <p>{say(menu.howItWorks, menu.howItWorksKo)}</p>
          {menu.contains.length > 0 && (
            <p className="dish-sheet__contains">Contains {menu.contains.join(', ')}</p>
          )}
          {/* Not a warning about this reader — nobody has told us anything
              here — but about what the catalogue can and cannot check. */}
          {menu.varies && (
            <p className="dish-sheet__varies">
              The side dishes change by the house and by the day, so this one
              cannot be checked in advance. Ask before you sit down.
            </p>
          )}
        </section>

        {menu.culture && (
          <section className="dish-sheet__block">
            <h2 className="dish-sheet__label">Why it is eaten together</h2>
            <p>{say(menu.culture, menu.cultureKo)}</p>
          </section>
        )}

        {menu.zones?.length > 0 && (
          <p className="dish-sheet__zones">
            Eaten around {menu.zones.join(' · ')}
          </p>
        )}

        {/* The way out of reading and into doing. Reading was always free;
            this is the one thing on the screen that is not. */}
        <button className="dish-sheet__cta" translate="no" onClick={() => onOpenTable?.(menu.id)}>
          이 요리로 상 차리기 · Open a table for this
        </button>
      </div>
    </div>
  );
}
