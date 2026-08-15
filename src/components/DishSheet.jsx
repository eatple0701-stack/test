import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeftIcon } from './Icons';
import { useText } from './localeText.js';
import { sourcesFor } from '../content/sources.js';
import PhraseSheet from './PhraseSheet';

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
// ── Why this is a deck of cards rather than one long page ──────────────────
//
// The review asked for a window that opens on the dish and reads sideways.
// One card per screen, snapped, is that — but a raw sideways river of text is
// the version that fails on a phone, because nothing tells you there is more
// to the right and text you have to swipe through is text people stop
// reading. So the deck carries a row of labels above it. The labels are the
// table of contents *and* the controls: you can see there are five parts, see
// which one you are on, and jump. Swiping still works; discovering it is no
// longer required.
//
// Nothing here invents prose. Every card is a field the catalogue already
// held, except `story`, which exists only where somebody on this team read a
// source — see src/content/sources.js. A dish with no source gets no story
// card rather than a borrowed one.

/**
 * What the dish contains, and the one honest thing to do about it.
 *
 * This is the closest this screen comes to the allergy panel the review
 * asked for, and it deliberately stops short of one. The app does not rule
 * on whether a dish is safe for a reader — the catalogue lists what a dish
 * is normally made of, nobody here has stood in that kitchen, and a
 * traveller with a real allergy who trusts a line we never verified is the
 * one person this product must not hurt.
 *
 * So: what it is normally made of, said plainly, and a way to go and ask.
 * The phrase sheet already knows how to say "저는 ~를 못 먹어요" out loud.
 */
function ContainsCard({ menu, onAsk }) {
  const say = useText();
  const list = menu.contains ?? [];
  return (
    <>
      {list.length > 0 ? (
        <ul className="dish-card__chips">
          {list.map(c => <li key={c} className="dish-card__chip">{c}</li>)}
        </ul>
      ) : (
        <p>{say('The catalogue does not enumerate what goes into this one.', '이 요리에 무엇이 들어가는지는 카탈로그에 적혀 있지 않습니다.', 'El catálogo no detalla qué lleva este plato.', "Le catalogue ne détaille pas ce qu'il y a dedans.", 'لا يعدّد الفهرس ما يدخل في هذا الطبق.', '这道菜里有什么，目录里没有列。', 'この料理に何が入るかは、カタログに書かれていません。')}</p>
      )}

      <p className="dish-card__caveat">
        {say(
          'This is what the dish is normally made of, not a check of the kitchen you will sit in. Recipes differ by house, and we have not stood in any of them. If something here matters to your health, ask before you order.',
          '이건 이 요리가 보통 무엇으로 만들어지는지이지, 앉으실 그 주방을 확인한 결과가 아닙니다. 조리법은 집집마다 다르고, 저희는 그 어느 곳에도 서 본 적이 없습니다. 건강과 관련된 것이라면 주문 전에 물어보세요.',
          'Esto es de qué suele estar hecho el plato, no una comprobación de la cocina en la que te vas a sentar. Las recetas cambian de una casa a otra y no hemos estado en ninguna. Si algo de esto afecta a tu salud, pregunta antes de pedir.',
          "C'est ce dont le plat est normalement fait, pas une vérification de la cuisine où vous allez vous asseoir. Les recettes changent d'une maison à l'autre, et nous n'avons mis les pieds dans aucune. Si cela touche à votre santé, demandez avant de commander.",
          'هذا ما يُصنع منه الطبق عادةً، لا نتيجة تحقّق من المطبخ الذي ستجلس فيه. الوصفات تختلف من بيت إلى بيت، ولم نقف في أيٍّ منها. وإن كان الأمر يمسّ صحتك، فاسأل قبل أن تطلب.',
          '这是这道菜通常用什么做的，不是对你要坐的那间厨房的核实。做法一家一个样，我们哪一家都没进去过。要是这件事关系到你的健康，点单之前先问一句。',
          'これはこの料理がふつう何で作られるかであって、あなたが座る厨房を確かめた結果ではありません。作り方は店ごとに違い、私たちはそのどこにも立っていません。健康にかかわることなら、注文の前に尋ねてください。')}
      </p>

      {/* The point of the card. Not a verdict — a sentence to say out loud. */}
      <button className="dish-card__ask" onClick={onAsk}>
        {say('How to say it in Korean', '한국어로 물어보기', 'Cómo decirlo en coreano', 'Comment le dire en coréen', 'كيف تقولها بالكورية', '用韩语怎么问', '韓国語での言い方')}
      </button>
    </>
  );
}

export default function DishSheet({ menu, onClose, onOpenTable }) {
  const say = useText();
  const deck = useRef(null);
  const [at, setAt] = useState(0);
  const [asking, setAsking] = useState(false);

  // Built before the early return so the hook order never changes.
  const cards = useMemo(() => {
    if (!menu) return [];
    const out = [
      {
        id: 'what',
        tab: say('What it is', '어떤 요리', 'Qué es', "Ce que c'est", 'ما هو', '这是什么', 'どんな料理'),
        body: (
          <>
            <p className="dish-card__lead">{say(menu.gloss, menu.glossKo, menu.glossEs, menu.glossFr, menu.glossAr, menu.glossZh, menu.glossJa)}</p>
            {menu.zones?.length > 0 && (
              <p className="dish-card__aside">
                {say(`Eaten around ${menu.zones.join(' · ')}`, `${menu.zones.join(' · ')} 근처에서 먹어요`,
                  `Se come por ${menu.zones.join(' · ')}`, `On le mange du côté de ${menu.zones.join(' · ')}`,
                  `يُؤكل في نواحي ${menu.zones.join(' · ')}`, `在${menu.zones.join('、')}一带吃`,
                  `${menu.zones.join('・')}のあたりで食べます`)}
              </p>
            )}
          </>
        ),
      },
      {
        id: 'why',
        tab: say('Why shared', '왜 나눠 먹나', 'Por qué se comparte', 'Pourquoi partagé', 'لماذا يُشارَك', '为什么分着吃', 'なぜ分け合う'),
        body: <p>{say(menu.whyShared, menu.whySharedKo, menu.whySharedEs, menu.whySharedFr, menu.whySharedAr, menu.whySharedZh, menu.whySharedJa)}</p>,
      },
      {
        id: 'table',
        tab: say('At the table', '식탁에서', 'En la mesa', 'À table', 'على المائدة', '在桌上', '食卓で'),
        body: (
          <>
            <p>{say(menu.howItWorks, menu.howItWorksKo, menu.howItWorksEs, menu.howItWorksFr, menu.howItWorksAr, menu.howItWorksZh, menu.howItWorksJa)}</p>
            {/* Not a warning about this reader — nobody has told us anything
                here — but about what the catalogue can and cannot check. */}
            {menu.varies && (
              <p className="dish-card__caveat">
                {say('The side dishes change by the house and by the day, so this one cannot be checked in advance. Ask before you sit down.',
                  '반찬은 집집마다, 날마다 달라져서 미리 확인할 수가 없습니다. 앉기 전에 물어보세요.',
                  'Las guarniciones cambian según la casa y el día, así que esto no se puede comprobar de antemano. Pregunta antes de sentarte.', "Les accompagnements changent selon la maison et selon le jour : cela ne peut donc pas être vérifié à l'avance. Demandez avant de vous asseoir.", 'تتغيّر الأطباق الجانبية بحسب البيت وبحسب اليوم، فلا يمكن التحقّق من هذا مسبقًا. اسأل قبل أن تجلس.', '小菜按店、按日子变，所以这一项没法提前确认。坐下之前先问一句。', 'おかずは店ごと日ごとに変わるので、これは前もって確認できません。座る前に尋ねてください。')}
              </p>
            )}
          </>
        ),
      },
      {
        id: 'contains',
        tab: say("What's in it", '들어가는 것', 'Qué lleva', 'Ce qu’il contient', 'ما فيه', '里面有什么', '入っているもの'),
        body: <ContainsCard menu={menu} onAsk={() => setAsking(true)} />,
      },
    ];

    if (menu.culture) {
      out.push({
        id: 'culture',
        tab: say('Together', '왜 같이 먹나', 'En compañía', 'Ensemble', 'مع الناس', '为什么一起吃', 'なぜ一緒に'),
        body: <p>{say(menu.culture, menu.cultureKo, menu.cultureEs, menu.cultureFr, menu.cultureAr, menu.cultureZh, menu.cultureJa)}</p>,
      });
    }

    // Only where somebody read a source. No source, no card — the absence is
    // the honest state, not a hole to fill with something that sounds right.
    const srcs = sourcesFor(menu.storySources ?? []);
    if (menu.story && srcs.length > 0) {
      out.push({
        id: 'story',
        tab: say('Its story', '이야기', 'Su historia', 'Son histoire', 'حكايته', '它的来历', 'その物語'),
        body: (
          <>
            <p>{say(menu.story, menu.storyKo, menu.storyEs, menu.storyFr, menu.storyAr, menu.storyZh, menu.storyJa)}</p>
            {/* Shown, not filed away — the same rule the quiz follows. */}
            {srcs.map(src => (
              <a key={src.url} className="dish-card__source" href={src.url} target="_blank" rel="noreferrer">
                {src.publisher}
              </a>
            ))}
          </>
        ),
      });
    }
    return out;
  }, [menu, say]);

  if (!menu) return null;

  // Which card is under the reader. `scrollLeft` runs negative in a mirrored
  // layout, so the distance is what counts, not the sign.
  const onScroll = () => {
    const el = deck.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    if (i !== at) setAt(Math.min(i, cards.length - 1));
  };

  // Ask the browser to bring the card into view rather than computing an
  // offset for it. `inline: 'start'` means the start of the reading
  // direction, so the mirrored layout needs no special case here; `block:
  // 'nearest'` keeps it from scrolling the page vertically on the way.
  //
  // Deliberately not animated. Both ways of asking for easing — the behavior
  // option and the CSS property — turned out to be a *no-op* in the browser
  // this was verified in, not a jump: the tab lit up, the count changed, and
  // the deck stayed where it was. A control that silently does nothing on
  // some engines is worse than one that always arrives instantly, and the
  // tab row already says which card you are on. The swipe is still animated,
  // because that one is the user's own gesture and scroll-snap handles it.
  const goTo = (i) => {
    const el = deck.current;
    const card = el?.children?.[i];
    if (!card) return;
    setAt(i);
    if (typeof card.scrollIntoView === 'function') {
      card.scrollIntoView({ block: 'nearest', inline: 'start' });
    } else {
      el.scrollLeft = i * el.clientWidth;
    }
  };

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

      {/* Said once, above the deck, because it is the answer to "how do I even
          pronounce this" and that question does not belong to any one card. */}
      <p className="dish-sheet__roman" translate="no" data-no-locale>{menu.romanization}</p>

      <div className="dish-tabs" role="tablist">
        {cards.map((c, i) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={i === at}
            className={`dish-tab${i === at ? ' is-on' : ''}`}
            onClick={() => goTo(i)}
          >
            {c.tab}
          </button>
        ))}
      </div>

      <div className="dish-deck" ref={deck} onScroll={onScroll}>
        {cards.map(c => (
          <article key={c.id} className="dish-card">
            <h2 className="dish-card__label">{c.tab}</h2>
            {c.body}
          </article>
        ))}
      </div>

      <p className="dish-deck__count" aria-live="polite">
        {say(`${at + 1} of ${cards.length}`, `${cards.length}장 중 ${at + 1}`, `${at + 1} de ${cards.length}`,
          `${at + 1} sur ${cards.length}`, `${at + 1} من ${cards.length}`, `第 ${at + 1} / ${cards.length} 张`,
          `${cards.length}枚中 ${at + 1}枚目`)}
      </p>

      {/* The way out of reading and into doing. Reading was always free;
          this is the one thing on the screen that is not. */}
      <button className="dish-sheet__cta" translate="no" onClick={() => onOpenTable?.(menu.id)}>
        {say('이 요리로 상 차리기 · Open a table for this', '이 요리로 상 차리기', 'Abrir una mesa con este plato', 'Ouvrir une table pour ce plat', 'افتح مائدة لهذا الطبق', '用这道菜开一张饭桌', 'この料理で食卓を開く')}
      </button>

      {asking && <PhraseSheet menuId={menu.id} dish={menu.name} onClose={() => setAsking(false)} />}
    </div>
  );
}
