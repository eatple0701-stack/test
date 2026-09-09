import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeftIcon } from './Icons';
import { useText, useLocale } from './localeText.js';
import { ingredientLabels, containsLine, variesLine } from '../domain/policy/dishLabels.js';
import { sourcesFor } from '../content/sources.js';
import PhraseSheet from './PhraseSheet';
import { listTables } from '../data/tableRepository.js';
import { bookable } from '../domain/policy/cancellation.js';
import { isPast } from '../domain/policy/table.js';

// A dish, read on its own — one page, top to bottom.
//
// It was a deck of five to seven snapped cards behind a row of tabs until
// 2026-09-09: 어떤 요리 / 왜 나눠 먹나 / 식탁에서 / 들어가는 것 / 왜 같이 먹나
// / 이야기. The tab row was added so nobody had to discover the swipe, and it
// worked — but a table of contents on top of six labels is the screen telling
// a first-time reader that there are six things to read here before they have
// read one, and the team's word for what that produced was 복잡하다.
//
// So it reads the way Airbnb's listing page reads: the picture, the name, and
// then one run of prose that does not ask which part you want. Nothing was
// cut to get there — every card's text is in the run, in the order somebody
// would want it: what it is, where it came from, what happens at the table,
// why anybody brings a person to it, and what is in it. The parts that are
// not prose keep their own blocks under it, because they are not reading:
// the sentence to say out loud, and the two ways to end up at a table.
//
// Nothing here invents prose. Every paragraph is a field the catalogue
// already held, except `story`, which exists only where somebody on this
// team read a source — see src/content/sources.js. A dish with no source
// gets no history rather than a borrowed one.

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
  const locale = useLocale();
  const list = menu.contains ?? [];
  const labels = ingredientLabels(list, locale);
  return (
    <>
      {list.length > 0 ? (
        <ul className="dish-card__chips">
          {list.map((c, i) => <li key={c} className="dish-card__chip">{labels[i]}</li>)}
        </ul>
      ) : (
        // Two sentences live behind this, chosen by the data: "the house
        // decides" when the dish says so, and the old "the catalogue does not
        // enumerate" only for a dish nobody wrote up — which the catalogue
        // tests keep at zero.
        <p>{containsLine(menu, locale).text}</p>
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

export default function DishSheet({ menu, onClose, onOpenTable, onJoinTable }) {
  const say = useText();
  const locale = useLocale();
  const [asking, setAsking] = useState(false);
  // How many tables are open for this dish right now. Read here rather than
  // passed in: every screen that opens this sheet would otherwise have to
  // fetch and thread a number none of them use for anything else.
  const [openHere, setOpenHere] = useState(null);

  useEffect(() => {
    if (!menu) return undefined;
    let alive = true;
    (async () => {
      try {
        const tables = await listTables();
        const n = bookable(tables).filter(t => t.menuId === menu.id && !isPast(t)).length;
        if (alive) setOpenHere(n);
      } catch { if (alive) setOpenHere(0); }
    })();
    return () => { alive = false; };
  }, [menu]);

  const srcs = useMemo(() => sourcesFor(menu?.storySources ?? []), [menu]);
  const story = menu && say(menu.story, menu.storyKo, menu.storyEs, menu.storyFr, menu.storyAr, menu.storyZh, menu.storyJa);
  const hasStory = Boolean(menu?.story && srcs.length > 0);

  if (!menu) return null;

  return (
    <div className="dish-sheet sheet-page" role="dialog" aria-label={`${menu.name}`}>
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onClose} aria-label="Close">
          <ChevronLeftIcon size={20} />
        </button>
        {/* Both names, in every language setting. This is the screen you open
            to learn the dish, so it is where the Korean name is kept for
            somebody who will point at it on a menu. */}
        <h1 className="dish-sheet__title" translate="no" data-no-locale>{menu.nameKo} · {menu.name}</h1>
      </header>

      {/* The picture, where a picture is what a reader wants first. Hidden
          rather than broken for a dish with no file yet — ten of the
          twenty-four have none, and an empty grey box above a title reads as
          a failure where nothing reads as nothing. */}
      <div className="dish-sheet__photo">
        <img
          src={`/images/dishes/${menu.id}.jpg`}
          alt=""
          onError={e => { e.currentTarget.closest('.dish-sheet__photo')?.remove(); }}
        />
        <span className="dish-sheet__ai">
          {say('AI illustration', 'AI 생성 이미지', 'Ilustración con IA', 'Illustration IA', 'رسم بالذكاء الاصطناعي', 'AI 生成图', 'AI生成画像')}
        </span>
      </div>

      <p className="dish-sheet__roman" translate="no" data-no-locale>{menu.romanization}</p>

      {/* ── the one run of prose ─────────────────────────────────────── */}
      <div className="dish-read">
        <p className="dish-read__lead">
          {say(menu.gloss, menu.glossKo, menu.glossEs, menu.glossFr, menu.glossAr, menu.glossZh, menu.glossJa)}
        </p>

        {/* 특화골목, named. Before the history because it is the line that
            turns the history into somewhere a reader can walk to.

            The names are given as Koreans give them — 왕십리 곱창골목, not
            "around Wangsimni" — asked for on 2026-09-09 in those words. A
            street's name is something a traveller says out loud to a driver
            or shows on a screen, so it stays in Korean under the rule in
            CLAUDE.md: 입 밖에 낼 말은 로마자, 설명하는 말은 풀어쓴다. The
            sentence around it is what gets translated. */}
        {menu.zones?.length > 0 && (
          <p className="dish-read__zones">
            <span translate="no" data-no-locale>{menu.zones.join(' · ')}</span>
            {' '}
            {say('are the streets known for it.', '등이 유명해요.',
              'son las calles conocidas por este plato.', 'sont les rues connues pour ce plat.',
              'هي الشوارع المعروفة به.', '等地最有名。',
              'あたりが、この料理で知られています。')}
          </p>
        )}

        {hasStory && <p>{story}</p>}

        <p>{say(menu.howItWorks, menu.howItWorksKo, menu.howItWorksEs, menu.howItWorksFr, menu.howItWorksAr, menu.howItWorksZh, menu.howItWorksJa)}</p>
        {menu.varies && <p className="dish-read__caveat">{variesLine(locale)}</p>}

        <p>{say(menu.whyShared, menu.whySharedKo, menu.whySharedEs, menu.whySharedFr, menu.whySharedAr, menu.whySharedZh, menu.whySharedJa)}</p>

        {menu.culture && (
          <p>{say(menu.culture, menu.cultureKo, menu.cultureEs, menu.cultureFr, menu.cultureAr, menu.cultureZh, menu.cultureJa)}</p>
        )}

        {/* Kept, and kept last of the reading. It is the one part that is not
            a story — rule 4 lives here, and a list of six coarse values is
            not an allergen tool however plainly it is written. */}
        <div className="dish-read__contains">
          <h2 className="dish-read__label">
            {say("What's in it", '들어가는 것', 'Qué lleva', 'Ce qu’il contient', 'ما فيه', '里面有什么', '入っているもの')}
          </h2>
          <ContainsCard menu={menu} onAsk={() => setAsking(true)} />
        </div>

        {/* Shown, not filed away — the same rule the quiz follows. */}
        {hasStory && (
          <p className="dish-read__sources">
            <span className="dish-read__sources-label">
              {say('Sources', '출처', 'Fuentes', 'Sources', 'المصادر', '出处', '出典')}
            </span>
            {srcs.map(src => (
              <a key={src.url} className="dish-card__source" href={src.url} target="_blank" rel="noreferrer">
                {src.publisher}
              </a>
            ))}
          </p>
        )}
      </div>

      {/* ── the two ways to end up at a table ─────────────────────────
          Joining first and hosting second, and only in that order when there
          is something to join. Asking a traveller who landed yesterday to
          host is the hardest request this app makes; it is the right one only
          when the easy one does not exist. */}
      <div className="dish-do">
        {openHere > 0 && (
          <button className="dish-do__join" onClick={() => onJoinTable?.(menu.id)}>
            <span className="dish-do__join-kr" translate="no">이미 차려진 상에 합류하기</span>
            <span className="dish-do__join-en">
              {say(`${openHere} table${openHere === 1 ? '' : 's'} open for this`, null,
                `${openHere} mesa${openHere === 1 ? '' : 's'} abierta${openHere === 1 ? '' : 's'}`,
                `${openHere} table${openHere === 1 ? '' : 's'} ouverte${openHere === 1 ? '' : 's'}`,
                `${openHere} ${openHere === 1 ? 'مائدة مفتوحة' : 'موائد مفتوحة'}`,
                `有 ${openHere} 张开着的饭桌`, `開いている食卓が${openHere}つ`)}
            </span>
          </button>
        )}
        <button
          className={`dish-do__host${openHere > 0 ? ' is-second' : ''}`}
          translate="no"
          onClick={() => onOpenTable?.(menu.id)}
        >
          {say('이 요리로 상 차리기 · Open a table for this', '이 요리로 상 차리기', 'Abrir una mesa con este plato', 'Ouvrir une table pour ce plat', 'افتح مائدة لهذا الطبق', '用这道菜开一张饭桌', 'この料理で食卓を開く')}
        </button>
      </div>

      {asking && <PhraseSheet menuId={menu.id} dish={menu.name} onClose={() => setAsking(false)} />}
    </div>
  );
}
