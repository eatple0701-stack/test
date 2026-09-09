import React, { useMemo } from 'react';
import { menus } from '../domain/catalog/menus.js';
import { buildDeck, storiesForTaste } from '../domain/policy/taste.js';
import { getStoredTaste, preferredMenuIds } from '../data/taste.js';
import { sourcesFor } from '../content/sources.js';
import { useText } from './localeText.js';

// 요리에 담긴 이야기 — the index, and DishSheet is the reading.
//
// The tab exists to carry 문화 and 공공외교, and a dish's history is the most
// concrete form either takes: 부대찌개 is a war, 닭갈비 is what students could
// afford, 족발 is a street a displaced trade built. None of that is an
// opinion about Korea, which is what makes it worth putting in front of
// somebody who has just arrived.
//
// The same fourteen the deck asks about, and in the same order, so a reader
// who swiped through them meets them again in the order they answered — the
// catalogue holds twenty-four, and ten of those are dishes one person can
// order, which belong to a different screen than this one.
//
// What is on a row is what the app can stand behind. `culture` exists for all
// twenty-four; `story` exists where somebody on this team read a source, and
// where it does not, the row is quieter rather than invented — see
// src/content/sources.js and rule 5. The photograph slot is the deck's, by
// dish id, so a file dropped in serves both screens at once.

/** The one-line hook: the story's own first sentence, never a summary. */
function hookOf(menu, say) {
  const story = say(menu.story, menu.storyKo, menu.storyEs, menu.storyFr, menu.storyAr, menu.storyZh, menu.storyJa);
  if (!story) return null;
  // The first sentence as written, not a shortened one. A hook somebody
  // wrote by hand is a second string to translate seven ways and to keep in
  // step with a story that will be edited; the sentence already there cannot
  // fall out of step with itself. Cut at the first full stop that is
  // followed by a space, so "1970s." inside a clause does not end it early.
  const at = story.search(/[.。!?]\s|[.。!?]$/);
  return at > 0 ? story.slice(0, at + 1) : story;
}

export default function DishStories({ onOpenDish }) {
  const say = useText();
  const base = useMemo(() => buildDeck(menus), []);
  // Read on mount rather than held in App: this screen is the only one that
  // wants the reading order, and the deck writes straight to localStorage.
  const picked = useMemo(() => preferredMenuIds(getStoredTaste()), []);
  const { dishes: deck, pickedCount } = useMemo(
    () => storiesForTaste(base, picked), [base, picked],
  );

  const told = deck.filter(d => d.story && sourcesFor(d.storySources ?? []).length > 0).length;

  return (
    <section className="dish-stories" aria-label={say('The stories in the food', '요리에 담긴 이야기', 'Las historias de la comida', 'Les histoires dans les plats', 'الحكايات في الطعام', '菜里的故事', '料理にある物語')}>
      <div className="stack-head">
        <span className="stack-head__kr" translate="no">요리에 담긴 이야기</span>
        <h2 className="stack-head__title">
          {say('Fourteen dishes, and where each one came from', null,
            'Catorce platos, y de dónde viene cada uno', 'Quatorze plats, et d’où vient chacun',
            'أربعة عشر طبقًا، ومن أين جاء كلٌّ منها', '十四道菜，各有各的来历', '十四の料理と、その来歴')}
        </h2>
        {/* The count is the honest one. It goes up as sources are read and
            stories written, and saying "3 of 14" is a truer offer than a
            heading that implies fourteen histories are waiting. */}
        <p className="stack-head__sub">
          {pickedCount > 0
            ? say(`Yours first — the ${pickedCount} you picked, then the rest.`,
              `고르신 ${pickedCount}가지를 먼저, 그다음 나머지입니다.`,
              `Primero los tuyos — los ${pickedCount} que elegiste, y luego el resto.`,
              `Les vôtres d’abord — les ${pickedCount} que vous avez choisis, puis les autres.`,
              `اختياراتك أولًا — الـ${pickedCount} التي اخترتها، ثم البقية.`,
              `先是你选的 ${pickedCount} 道，然后是其余的。`,
              `あなたが選んだ${pickedCount}品が先、そのあとに残りです。`)
            : told > 0
            ? say(`${told} of ${deck.length} have their history written, each with the source it came from.`,
              `${deck.length}가지 중 ${told}가지에 역사가 적혀 있고, 각각 출처가 함께 있습니다.`,
              `${told} de ${deck.length} tienen su historia escrita, cada una con su fuente.`,
              `${told} sur ${deck.length} ont leur histoire écrite, chacune avec sa source.`,
              `${told} من ${deck.length} كُتب تاريخها، ولكلٍّ مصدره.`,
              `${deck.length} 道中有 ${told} 道写下了来历，每一条都附出处。`,
              `${deck.length}品のうち${told}品に来歴が書かれ、それぞれに出典があります。`)
              : say('Every one of them is eaten with somebody. Tap to read why.',
              '하나같이 누군가와 함께 먹는 음식들입니다. 눌러서 읽어보세요.',
              'Todos se comen acompañado. Toca para leer por qué.',
              'Tous se mangent à plusieurs. Touchez pour savoir pourquoi.',
              'كلّها تُؤكل بصحبة أحد. اضغط لتعرف لماذا.',
              '每一道都是和人一起吃的。点开看看为什么。',
              'どれも誰かと食べる料理です。理由を読んでみてください。')}
        </p>
      </div>

      {/* A rail, not a list. Fourteen rows is a scroll somebody leaves; a
          card at a time is a thing somebody turns — the same reason the
          swipe deck exists two screens away, applied to the reading. Native
          overflow with scroll-snap and no library: the browser already does
          momentum, the keyboard and the right-to-left layout correctly, and
          a hand-rolled carousel gets the last of those wrong.

          The order is the reader's own. See storiesForTaste. */}
      <ul className="dish-stories__rail">
        {deck.map((menu, i) => {
          const hook = hookOf(menu, say);
          return (
            <li key={menu.id} className="dish-stories__slide">
              <button type="button" className="dish-story" onClick={() => onOpenDish?.(menu)}>
                <span className="dish-story__photo" aria-hidden="true">
                  <img
                    src={`/images/dishes/${menu.id}.jpg`}
                    alt=""
                    loading={i < 2 ? 'eager' : 'lazy'}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  {/* Said on the card the reader is looking at, at a size
                      that can be read — the deck two screens away says the
                      same thing about the same files. */}
                  <span className="dish-story__ai">
                    {say('AI illustration', 'AI 생성 이미지', 'Ilustración con IA', 'Illustration IA', 'رسم بالذكاء الاصطناعي', 'AI 生成图', 'AI生成画像')}
                  </span>
                  {/* Why this one is first, said on the card rather than only
                      in the heading. An order nobody explains is an order
                      nobody trusts. */}
                  {i < pickedCount && (
                    <span className="dish-story__mine">
                      {say('You picked this', '내가 고른 음식', 'Lo elegiste', 'Vous l’avez choisi', 'اخترته', '你选过这道', 'あなたが選んだ料理')}
                    </span>
                  )}
                </span>

                {/* The name under the picture, and nothing else on the card.
                    The hook and the 골목 line were here until 2026-09-09 and
                    made a card three times taller than the thing it is a
                    picture of; asked for as 너무 크지 않은 카드, 상단에는
                    이미지 하단에는 한식 이름. The writing is one tap away and
                    reads better there than clamped to three lines here. */}
                <span className="dish-story__body">
                  <span className="dish-story__kr" translate="no">{menu.nameKo}</span>
                  <span className="dish-story__rom" translate="no">{menu.romanization}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="dish-stories__hint">
        {say('Swipe for the rest.', '옆으로 넘겨 보세요.', 'Desliza para ver el resto.', 'Glissez pour voir la suite.', 'اسحب لرؤية البقية.', '向旁边滑看其余的。', '横にスワイプすると続きがあります。')}
      </p>
    </section>
  );
}
