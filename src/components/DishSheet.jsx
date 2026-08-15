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
        <p className="dish-sheet__gloss">{say(menu.gloss, menu.glossKo, menu.glossEs, menu.glossFr, menu.glossAr, menu.glossZh, menu.glossJa)}</p>
        <p className="dish-sheet__roman" translate="no">{menu.romanization}</p>

        {/* The sentence the whole app rests on: why this one cannot be eaten
            alone. 백반's says the opposite in its own words, and that is the
            point — the catalogue is allowed to contradict the pitch. */}
        <section className="dish-sheet__block">
          <h2 className="dish-sheet__label">{say('Why it is shared', '왜 나눠 먹나', 'Por qué se comparte', 'Pourquoi cela se partage', 'لماذا يُشارَك', '为什么要分着吃', 'なぜ分け合うのか')}</h2>
          <p>{say(menu.whyShared, menu.whySharedKo, menu.whySharedEs, menu.whySharedFr, menu.whySharedAr, menu.whySharedZh, menu.whySharedJa)}</p>
        </section>

        <section className="dish-sheet__block">
          <h2 className="dish-sheet__label">{say('What happens at the table', '식탁에서 벌어지는 일', 'Qué pasa en la mesa', 'Ce qui se passe à table', 'ما الذي يحدث على المائدة', '桌上会发生什么', '食卓で何が起きるか')}</h2>
          <p>{say(menu.howItWorks, menu.howItWorksKo, menu.howItWorksEs, menu.howItWorksFr, menu.howItWorksAr, menu.howItWorksZh, menu.howItWorksJa)}</p>
          {menu.contains.length > 0 && (
            <p className="dish-sheet__contains">{say(
              `Contains ${menu.contains.join(', ')}`, `${menu.contains.join(', ')} 들어감`,
              `Contiene ${menu.contains.join(', ')}`, `Contient ${menu.contains.join(', ')}`,
              `يحتوي على ${menu.contains.join('، ')}`, `含有${menu.contains.join('、')}`,
              `${menu.contains.join('、')}が入っています`)}</p>
          )}
          {/* Not a warning about this reader — nobody has told us anything
              here — but about what the catalogue can and cannot check. */}
          {menu.varies && (
            <p className="dish-sheet__varies">
              {say('The side dishes change by the house and by the day, so this one cannot be checked in advance. Ask before you sit down.',
                '반찬은 집집마다, 날마다 달라져서 미리 확인할 수가 없습니다. 앉기 전에 물어보세요.',
                'Las guarniciones cambian según la casa y el día, así que esto no se puede comprobar de antemano. Pregunta antes de sentarte.', "Les accompagnements changent selon la maison et selon le jour : cela ne peut donc pas être vérifié à l'avance. Demandez avant de vous asseoir.", 'تتغيّر الأطباق الجانبية بحسب البيت وبحسب اليوم، فلا يمكن التحقّق من هذا مسبقًا. اسأل قبل أن تجلس.', '小菜按店、按日子变，所以这一项没法提前确认。坐下之前先问一句。', 'おかずは店ごと日ごとに変わるので、これは前もって確認できません。座る前に尋ねてください。')}
            </p>
          )}
        </section>

        {menu.culture && (
          <section className="dish-sheet__block">
            <h2 className="dish-sheet__label">{say('Why it is eaten together', '왜 함께 먹나', 'Por qué se come en compañía', 'Pourquoi on le mange ensemble', 'لماذا يُؤكل مع الناس', '为什么要一起吃', 'なぜ一緒に食べるのか')}</h2>
            <p>{say(menu.culture, menu.cultureKo, menu.cultureEs, menu.cultureFr, menu.cultureAr, menu.cultureZh, menu.cultureJa)}</p>
          </section>
        )}

        {menu.zones?.length > 0 && (
          <p className="dish-sheet__zones">
            {say(`Eaten around ${menu.zones.join(' · ')}`, `${menu.zones.join(' · ')} 근처에서 먹어요`,
              `Se come por ${menu.zones.join(' · ')}`, `On le mange du côté de ${menu.zones.join(' · ')}`,
              `يُؤكل في نواحي ${menu.zones.join(' · ')}`, `在${menu.zones.join('、')}一带吃`,
              `${menu.zones.join('・')}のあたりで食べます`)}
          </p>
        )}

        {/* The way out of reading and into doing. Reading was always free;
            this is the one thing on the screen that is not. */}
        <button className="dish-sheet__cta" translate="no" onClick={() => onOpenTable?.(menu.id)}>
          {say('이 요리로 상 차리기 · Open a table for this', '이 요리로 상 차리기', 'Abrir una mesa con este plato', 'Ouvrir une table pour ce plat', 'افتح مائدة لهذا الطبق', '用这道菜开一张饭桌', 'この料理で食卓を開く')}
        </button>
      </div>
    </div>
  );
}
