import React, { useEffect, useState } from 'react';
import {
  PICK, PICKER, ALL_COLLAPSED,
  groupRows, toggleGroup, withGroupOpen, groupIdOfMenu, pickerView,
} from '../domain/policy/dishGroupPicker.js';
import { dishGloss } from '../domain/policy/dishLabels.js';
import { ChevronRightIcon } from './Icons';
import { useText, useLocale } from './localeText.js';

// The twenty-four dishes, six rows at a time.
//
// One component on both screens — the host's form and the guest's list —
// because they were the same twenty-four dishes drawn two different ways,
// and a dish moving group would have moved on one of them. What the two
// screens differ on is a single prop: a guest may choose a whole category,
// a host may not, because "K-BBQ" is not a thing anybody cooks.
//
// Everything the rows are made of — which groups, their order, their names
// in seven languages, which dishes are under them — comes from
// dishGroupPicker.js. This file decides only what it looks like.

/** Every row shut, until somebody opens one or arrives with a choice made. */
export default function DishGroupAccordion({
  mode = PICK.DISH,
  query = '',
  onQueryChange,
  selectedMenuId = null,
  onPickDish,
  selectedGroupId = null,
  onPickGroup,
  countFor = null,
}) {
  const say = useText();
  const locale = useLocale();
  const rows = groupRows(mode);
  const [openIds, setOpenIds] = useState(ALL_COLLAPSED);

  // A dish already chosen — a host who came from a restaurant page, or
  // anybody who picked one and scrolled away — must be visible, or the form
  // looks empty and they choose a second one.
  useEffect(() => {
    const gid = groupIdOfMenu(selectedMenuId);
    if (gid) setOpenIds(s => withGroupOpen(s, gid));
  }, [selectedMenuId]);

  // A category already chosen: the guest who pressed a card on the front
  // page. Its row is the answer to what they asked for, so it is open.
  useEffect(() => {
    if (selectedGroupId) setOpenIds(s => withGroupOpen(s, selectedGroupId));
  }, [selectedGroupId]);

  const view = pickerView(query);

  const dishTile = (m) => (
    <button
      key={m.id}
      type="button"
      className={`dish-option${selectedMenuId === m.id ? ' is-on' : ''}`}
      aria-pressed={selectedMenuId === m.id}
      onClick={() => onPickDish?.(m)}
    >
      <span className="dish-option__kr">{m.nameKo}</span>
      <span className="dish-option__name" translate="no">{m.name}</span>
      {/* The gloss comes from the catalogue's own seven languages rather than
          from an English-only table. See dishGloss. */}
      <span className="dish-option__gloss">{dishGloss(m, locale)}</span>
      <span className="dish-option__min">
        {m.minPeople > 1
          ? say(`${m.minPeople}+ people`, `${m.minPeople}명 이상`, `${m.minPeople}+ personas`, `${m.minPeople}+ personnes`, `${m.minPeople} فأكثر`, `${m.minPeople} 人以上`, `${m.minPeople}人以上`)
          : say('Any size', '인원 제한 없음', 'Cualquier número', 'Sans minimum', 'أيّ عدد', '几个人都行', '人数は自由')}
      </span>
    </button>
  );

  return (
    <div className="dish-picker">
      {/* Above the accordion, always. Somebody who knows the word types it;
          somebody who does not reads the six rows. */}
      <div className="dish-search">
        <label className="search-field">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder={say('Find a dish — 떡볶이, tteokbokki, rice cakes', '요리 이름으로 찾기 — 떡볶이, tteokbokki', 'Busca un plato: 떡볶이, tteokbokki', 'Cherchez un plat : 떡볶이, tteokbokki', 'ابحث عن طبق: 떡볶이، tteokbokki', '找一道菜：떡볶이、tteokbokki', '料理を探す：떡볶이、tteokbokki')}
            aria-label={say('Find a dish by name', '요리 이름으로 찾기', 'Buscar un plato por su nombre', 'Chercher un plat par son nom', 'ابحث عن طبق باسمه', '按名字找菜', '料理を名前で探す')}
          />
        </label>
      </div>

      {view.mode === PICKER.RESULTS ? (
        <div className="dish-picker__results">
          {view.dishes.length > 0 ? (
            <div className="dish-grid">{view.dishes.map(dishTile)}</div>
          ) : (
            <p className="dish-picker__none">
              {say('No dish here goes by that name.', '그런 이름의 요리는 여기 없어요.',
                'Aquí no hay ningún plato con ese nombre.', "Aucun plat ne porte ce nom ici.",
                'لا يوجد طبق بهذا الاسم هنا.', '这里没有叫这个名字的菜。', 'その名前の料理はここにはありません。')}
            </p>
          )}
        </div>
      ) : (
        <div className="dish-picker__groups">
          {rows.map(({ group: g, dishes, groupSelectable }) => {
            const open = openIds.includes(g.id);
            const name = say(g.en, g.ko, g.es, g.fr, g.ar, g.zh, g.ja);
            const chosen = groupSelectable && selectedGroupId === g.id;
            const n = countFor ? countFor(g) : null;
            // `is-expanded`, not `is-open`: index.css:652 already carries a
            // bare `.is-open { color: var(--green-ink) }` belonging to
            // something else, and it turned every opened category heading
            // green. Caught on screen — every DOM assertion passed.
            return (
              <div key={g.id} className={`dish-row${open ? ' is-expanded' : ''}${chosen ? ' is-chosen' : ''}`} style={{ '--tint': g.tint }}>
                <h3 className="dish-row__head">
                  <button
                    type="button"
                    className="dish-row__toggle"
                    aria-expanded={open}
                    aria-controls={`dish-row-${g.id}`}
                    onClick={() => setOpenIds(s => toggleGroup(s, g.id))}
                  >
                    <span className="dish-row__emoji" aria-hidden="true">{g.emoji}</span>
                    <span className="dish-row__name">{name}</span>
                    {/* Kept at zero rather than hidden: a menu that changes
                        shape between screens is how somebody loses their
                        place. Counts tables you could still sit at, not
                        tables that exist — see joinableCount. */}
                    {n !== null && (
                      <span className="dish-row__count">
                        {say(`${n} ${n === 1 ? 'table' : 'tables'}`, `밥상 ${n}`,
                          `${n} ${n === 1 ? 'mesa' : 'mesas'}`, `${n} table${n === 1 ? '' : 's'}`,
                          `${n} مائدة`, `${n} 桌`, `${n} 卓`)}
                      </span>
                    )}
                    <span className="dish-row__chevron" aria-hidden="true"><ChevronRightIcon /></span>
                  </button>
                </h3>
                <div className="dish-row__panel" id={`dish-row-${g.id}`} hidden={!open}>
                  {/* A guest may take the whole category — "every K-BBQ
                      table". A host may not: the category is four dishes and
                      a host is cooking one of them. Its own control rather
                      than a second press on the header, because a button
                      inside a button is not a thing a screen reader can
                      offer. */}
                  {groupSelectable && (
                    <button
                      type="button"
                      className={`dish-row__all${chosen ? ' is-on' : ''}`}
                      aria-pressed={chosen}
                      onClick={() => onPickGroup?.(chosen ? null : g.id)}
                    >
                      {say(`All of ${name}`, `${name} 전부`, `Todo: ${name}`, `Tout : ${name}`,
                        `${name} كلّها`, `${name} 全部`, `${name} すべて`)}
                    </button>
                  )}
                  <div className="dish-grid">{dishes.map(dishTile)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
