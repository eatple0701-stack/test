import React, { useEffect, useRef, useState } from 'react';

import { CULTURE_CARDS } from '../content/cultureCards.js';
import { useText } from './localeText.js';

// The eight culture cards, as a deck you turn.
//
// It was a modal with a Previous and a Next button and one card of text in
// the middle until 2026-09-09, and what it was missing is the thing this tab
// is for: something to look at. The dish rail on the same screen had already
// answered how that reads — a picture and a name — and this is the same shape
// with the order reversed, asked for that way: the name on top, because a
// card called 고깃집 예절 is a heading and not a caption, and the picture
// under it as the thing the heading is about.
//
// Swiped rather than paged. Native overflow with scroll-snap, like the dish
// rail: the browser does momentum, the keyboard and the mirrored layout, and
// the row of dots under it says how many there are without a library.
//
// The photographs are generated, and the card says so — the same disclosure
// the dish cards carry, for the same reason.

const photoFor = (id) => `/images/culture/${id}.jpg`;

export default function CultureCards({ onClose, startIndex = 0 }) {
  const say = useText();
  const rail = useRef(null);
  const [at, setAt] = useState(startIndex);

  // Open on the card that was asked for. Not animated: the deck has not been
  // laid out on the first frame, so an animated scroll starts from a width of
  // zero and lands short.
  useEffect(() => {
    const el = rail.current;
    const card = el?.children?.[startIndex];
    if (card?.scrollIntoView) card.scrollIntoView({ block: 'nearest', inline: 'start' });
  }, [startIndex]);

  const onScroll = () => {
    const el = rail.current;
    if (!el || !el.clientWidth) return;
    // Math.abs: a right-to-left layout reports the offset negative, and what
    // is wanted here is a distance.
    const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    if (i !== at) setAt(Math.min(i, CULTURE_CARDS.length - 1));
  };

  // Dragging, on top of the native scroll.
  //
  // Touch already swipes this — overflow-x does that on its own, which is why
  // the rail was built on it. A mouse does not: a pointer press on a scroll
  // container selects text and moves nothing, so on a laptop the deck looked
  // like it had no way forward at all. Asked for on 2026-09-09 as 스와이핑
  // 기능 추가.
  //
  // The scroll position is written directly rather than animated, because
  // that is what a drag is: the card follows the hand. Letting go hands back
  // to scroll-snap, which does the settling.
  const drag = useRef(null);

  const onPointerDown = (e) => {
    // Touch is already handled, and taking it over here would replace a good
    // native gesture with a worse hand-rolled one.
    if (e.pointerType === 'touch') return;
    const el = rail.current;
    if (!el) return;
    drag.current = { x: e.clientX, from: el.scrollLeft };
    el.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    const el = rail.current;
    if (!d || !el) return;
    el.scrollLeft = d.from - (e.clientX - d.x);
  };

  const endDrag = (e) => {
    const el = rail.current;
    if (!drag.current || !el) return;
    drag.current = null;
    el.releasePointerCapture?.(e.pointerId);
    // Snap to whichever card is now nearest. scroll-snap does this for a
    // flick but not for a slow drag that ends mid-card.
    const w = el.clientWidth || 1;
    const i = Math.min(CULTURE_CARDS.length - 1, Math.round(Math.abs(el.scrollLeft) / w));
    el.children?.[i]?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'smooth' });
  };

  // And the keyboard, which neither gesture reaches.
  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const i = Math.min(CULTURE_CARDS.length - 1, Math.max(0, at + step));
    rail.current?.children?.[i]?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'smooth' });
  };

  return (
    <div
      className="match-modal-backdrop culture-backdrop"
      role="dialog"
      aria-label={say('Culture cards', '문화 카드', 'Fichas de cultura', 'Fiches de culture', 'بطاقات ثقافية', '文化卡片', '文化カード')}
      onClick={onClose}
    >
      <div className="culture-deck" onClick={e => e.stopPropagation()}>
        <header className="culture-deck__head">
          <span className="culture-deck__kr" translate="no">문화 카드</span>
          <button
            type="button"
            className="culture-deck__close"
            onClick={onClose}
            aria-label={say('Close', '닫기', 'Cerrar', 'Fermer', 'إغلاق', '关闭', '閉じる')}
          >×</button>
        </header>

        <div
          className="culture-deck__rail"
          ref={rail}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="group"
          aria-label={say('Culture cards, swipe or use the arrow keys', '문화 카드 — 옆으로 넘기거나 화살표 키를 쓰세요', 'Fichas de cultura: desliza o usa las flechas', 'Fiches de culture : glissez ou utilisez les flèches', 'بطاقات ثقافية: اسحب أو استعمل مفاتيح الأسهم', '文化卡片：可以滑动，也可以用方向键', '文化カード — スワイプか矢印キーで')}
        >
          {CULTURE_CARDS.map((c, i) => (
            <article key={c.id} className="culture-card">
              {/* The name first. A card called 고깃집 예절 is a heading, not
                  a caption for the picture under it. */}
              <h2 className="culture-card__title">
                <span className="culture-card__title-kr" translate="no">{c.titleKo}</span>
                <span className="culture-card__title-en">
                  {say(c.title, null, c.titleEs, c.titleFr, c.titleAr, c.titleZh, c.titleJa)}
                </span>
              </h2>

              <div className="culture-card__photo">
                <img
                  src={photoFor(c.id)}
                  alt=""
                  loading={i <= startIndex + 1 ? 'eager' : 'lazy'}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="culture-card__ai">
                  {say('AI illustration', 'AI 생성 이미지', 'Ilustración con IA', 'Illustration IA', 'رسم بالذكاء الاصطناعي', 'AI 生成图', 'AI生成画像')}
                </span>
              </div>

              <p className="culture-card__desc">
                {say(c.desc, c.descKo, c.descEs, c.descFr, c.descAr, c.descZh, c.descJa)}
              </p>
            </article>
          ))}
        </div>

        {/* How many there are, and where you are in them. The old Previous
            and Next said neither. */}
        <div className="culture-deck__dots" aria-hidden="true">
          {CULTURE_CARDS.map((c, i) => (
            <span key={c.id} className={`culture-deck__dot${i === at ? ' is-on' : ''}`} />
          ))}
        </div>
        <p className="culture-deck__hint">
          {say('Swipe, or drag with the mouse.', '옆으로 넘기거나, 마우스로 끌어보세요.',
            'Desliza, o arrastra con el ratón.', 'Glissez, ou faites glisser à la souris.',
            'اسحب، أو اجرر بالفأرة.', '可以滑动，也可以用鼠标拖。', 'スワイプ、またはマウスでドラッグしてください。')}
        </p>
        <p className="culture-deck__count" aria-live="polite">
          {say(`${at + 1} of ${CULTURE_CARDS.length}`, `${CULTURE_CARDS.length}장 중 ${at + 1}`,
            `${at + 1} de ${CULTURE_CARDS.length}`, `${at + 1} sur ${CULTURE_CARDS.length}`,
            `${at + 1} من ${CULTURE_CARDS.length}`, `第 ${at + 1} / ${CULTURE_CARDS.length} 张`,
            `${CULTURE_CARDS.length}枚中 ${at + 1}枚目`)}
        </p>
      </div>
    </div>
  );
}
