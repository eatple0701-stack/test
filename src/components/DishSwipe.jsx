import React, { useMemo, useRef, useState } from 'react';
import { menus, CATEGORY_LABEL } from '../domain/catalog/menus.js';
import {
  VERDICT, swipeVerdict, buildDeck, recordVerdict,
  deckProgress, nextCard, tasteMap, canDrawMap,
} from '../domain/policy/taste.js';
import FoodMbti from './FoodMbti';
import { getStoredTaste, storeTaste, clearTaste } from '../data/taste.js';
import { useText, useLocale } from './localeText.js';
import { getStoredMbti } from '../data/foodMbti.js';
import { mbtiType } from '../domain/policy/foodMbti.js';
import { mbtiTypeLabel } from '../domain/policy/dishLabels.js';
import { tasteRecordState, showsType, testIsNew } from '../domain/policy/tasteRecord.js';

// 입맛 지도 — one dish at a time, and a yes or a no.
//
// Explore measures 8.0 screens on a 375px phone and the complaint that began
// that rebuild was that there was too much to read. This is the other answer
// to it: a traveller who reads nothing still leaves this screen having told
// the app fourteen things about themselves, and the app leaves it able to
// name the tables they would actually sit at.
//
// The deck is dishes that start at two servings, which is the whole product —
// every yes here is a dish somebody has to bring a person to eat. That is why
// the map ends on tables and not on a restaurant: the answer to "I want 감자탕"
// is not an address, it is somebody to eat it with.
//
// The photograph slot is deliberately empty. It is sized and positioned so
// that dropping images in is a CSS change and nothing else, and an empty
// tinted box is honest in a way a stock photo of somebody else's dinner is
// not. Whatever fills it has to carry a source, like every other fact here.

/**
 * Where a dish's picture lives. The id is the filename, so adding a dish to
 * the catalogue and dropping `<id>.jpg` in is the whole job — there is no
 * second list to keep in step, which is what a second list never is.
 *
 * Vite serves `public/` from the root, so this path is what the browser asks
 * for in dev and in the built bundle alike.
 */
const photoFor = (id) => `/images/dishes/${id}.jpg`;

const DRAG_ROTATE = 0.05;   // degrees per pixel — a card tilts as it leaves
const FLY_MS = 240;

export default function DishSwipe({
  onClose, onOpenTables, onOpenAuth, onTasteChange, onOpenMbti, auth,
  inline = false, sharedOnly = true,
}) {
  const say = useText();
  const locale = useLocale();
  const deck = useMemo(() => buildDeck(menus, { sharedOnly }), [sharedOnly]);
  // Starts from what is stored, so leaving the deck and coming back is not
  // starting over — and so the Tables screen has something to read. Written
  // on every answer rather than at the end: nobody finishes fourteen cards
  // in one sitting, and a map that only exists after card fourteen is a map
  // almost nobody has.
  const [taste, setTaste] = useState(getStoredTaste);
  const [dx, setDx] = useState(0);
  const [flying, setFlying] = useState(null);   // the verdict a card is leaving on
  const [showMap, setShowMap] = useState(false);

  const dragFrom = useRef(null);
  const cardRef = useRef(null);

  const card = nextCard(deck, taste);
  const behind = useMemo(() => {
    if (!card) return null;
    const at = deck.findIndex(d => d.id === card.id);
    return at >= 0 ? deck[at + 1] ?? null : null;
  }, [deck, card]);

  const progress = deckProgress(taste, deck.length);
  const done = showMap || !card;
  const map = useMemo(() => tasteMap(taste, menus), [taste]);
  // The test is a door off this screen rather than a panel inside it: twelve
  // more questions under a result somebody has just been given is a second
  // form, and the point of showing the map first is that there is now
  // something worth adding to.
  const [mbtiOpen, setMbtiOpen] = useState(false);
  // The other record. Read on mount and again when the sheet closes, because
  // the test writes to its own key from a component this one renders — and
  // this screen has to look different afterwards, which is the whole of what
  // 2026-09-09 asked for: 입맛지도만 한 사람과 둘 다 한 사람.
  const [myType, setMyType] = useState(() => mbtiType(getStoredMbti()));
  const record = tasteRecordState({ mapCount: map.count, type: myType });

  // The verdict the current drag would land on, for the two hints over the
  // card. Reading it from the same function the release reads is the point:
  // a hint that says YES while the release records a pass is worse than no
  // hint, and two thresholds is how that happens.
  const width = cardRef.current?.offsetWidth ?? 320;
  const leaning = swipeVerdict(dx, width);

  const answer = (verdict) => {
    if (!card || flying) return;
    setFlying(verdict);
    setDx(verdict === VERDICT.WANT ? width * 1.4 : -width * 1.4);
    window.setTimeout(() => {
      setTaste(t => storeTaste(recordVerdict(t, card.id, verdict)));
      setDx(0);
      setFlying(null);
      onTasteChange?.();
    }, FLY_MS);
  };

  const onPointerDown = (e) => {
    if (flying) return;
    dragFrom.current = e.clientX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (dragFrom.current == null) return;
    setDx(e.clientX - dragFrom.current);
  };
  const onPointerUp = () => {
    if (dragFrom.current == null) return;
    const verdict = swipeVerdict(dx, width);
    dragFrom.current = null;
    if (verdict) answer(verdict);
    else setDx(0);
  };

  const dishText = (d, key) =>
    say(d[key], d[`${key}Ko`], d[`${key}Es`], d[`${key}Fr`], d[`${key}Ar`], d[`${key}Zh`], d[`${key}Ja`]);

  const categoryText = (categoryId) => {
    const L = CATEGORY_LABEL[categoryId];
    // Every language comes from the table or none does. Reading `.en` alone
    // is what printed "A whole spread" onto Korean cards once already.
    return L ? say(L.en, L.ko, L.es, L.fr, L.ar, L.zh, L.ja) : '';
  };

  const label = say('Build your taste map', '입맛 지도 만들기', 'Crea tu mapa de sabores', 'Composez votre carte des goûts', 'اصنع خريطة ذوقك', '做你的口味地图', '好みの地図をつくる');

  const body = (
    <div className={`dish-swipe${inline ? ' dish-swipe--inline' : ''}`} onClick={e => e.stopPropagation()}>

        <header className="dish-swipe__head">
          <div className="dish-swipe__titles">
            <span className="dish-swipe__kr" translate="no">입맛 지도</span>
            <span className="dish-swipe__en">
              {say('Which of these would you want?', '어느 쪽이 당겨요?', '¿Cuál te apetece?', 'Lequel vous tente ?', 'أيّها يشتهيك؟', '哪一道想吃？', 'どれが食べたいですか？')}
            </span>
          </div>
          {!inline && (
            <button
              type="button"
              className="dish-swipe__close"
              onClick={onClose}
              aria-label={say('Close', '닫기', 'Cerrar', 'Fermer', 'إغلاق', '关闭', '閉じる')}
            >×</button>
          )}
        </header>

        {!done && (
          <>
            {/* Progress. The count is the real one — no head start — and the
                line under it only appears near the end, where naming what is
                left is a pull rather than a wall. */}
            <div className="dish-swipe__progress" aria-hidden="true">
              <div className="dish-swipe__progress-fill" style={{ width: `${Math.round(progress.ratio * 100)}%` }} />
            </div>
            <p className="dish-swipe__count">
              <span className="visually-hidden">
                {say(`${progress.done} of ${progress.total} answered`, `${progress.total}장 중 ${progress.done}장 답함`,
                  `${progress.done} de ${progress.total} respondidas`, `${progress.done} sur ${progress.total} répondues`,
                  `${progress.done} من ${progress.total} تمّت`, `已答 ${progress.done} / ${progress.total}`,
                  `${progress.total}枚中${progress.done}枚`)}
              </span>
              <span aria-hidden="true">{progress.done} / {progress.total}</span>
              {progress.remaining > 0 && progress.remaining <= 3 && (
                <span className="dish-swipe__nearly">
                  {say(`${progress.remaining} to go`, `${progress.remaining}장 남았어요`,
                    `Quedan ${progress.remaining}`, `Plus que ${progress.remaining}`,
                    `بقي ${progress.remaining}`, `还剩 ${progress.remaining} 张`,
                    `あと${progress.remaining}枚`)}
                </span>
              )}

              {/* The way out, once there is a map worth drawing. It sits on
                  the progress line and not under the deck because under the
                  deck is where it was on 2026-09-07 and nobody could reach
                  it: the modal is taller than a 375x812 phone, the backdrop
                  is position:fixed with no scroll, and the last child of an
                  overflowing fixed box is simply gone. Reported as "그 링크가
                  확인이 안 돼". Anything the reader must be able to press
                  belongs above the card, not after it. */}
              {canDrawMap(taste) && (
                <button type="button" className="dish-swipe__early" onClick={() => setShowMap(true)}>
                  {say('See my map', '내 입맛 지도 보기', 'Ver mi mapa', 'Voir ma carte', 'شاهد خريطتي', '看我的地图', '地図を見る')}
                </button>
              )}
            </p>

            <div className="dish-swipe__stage">
              {/* The card behind, so the deck reads as a deck and finishing
                  one card visibly uncovers the next. */}
              {behind && (
                <article className="dish-card dish-card--behind" aria-hidden="true">
                  <div className="dish-card__photo">
                    <img className="dish-card__img" src={photoFor(behind.id)} alt="" loading="lazy"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  <div className="dish-card__body">
                    <h3 className="dish-card__name" translate="no">{behind.nameKo}</h3>
                  </div>
                </article>
              )}

              {card && (
                <article
                  ref={cardRef}
                  className={`dish-card${flying ? ' is-flying' : ''}`}
                  style={{ transform: `translateX(${dx}px) rotate(${dx * DRAG_ROTATE}deg)` }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  {/* The photograph goes here. Empty on purpose — see the note
                      at the top of this file. */}
                  <div className="dish-card__photo">
                    <img
                      className="dish-card__img"
                      src={photoFor(card.id)}
                      alt=""
                      draggable="false"
                      /* The first card is what somebody waits on; the rest can
                         load as they come round. */
                      loading={card.id === deck[0]?.id ? 'eager' : 'lazy'}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    {/* The letter stays under the photograph as the fallback
                        for a dish whose file is missing — onError hides the
                        image rather than leaving a broken-image glyph. */}
                    <span className="dish-card__photo-mark" translate="no" aria-hidden="true">{card.nameKo.slice(0, 1)}</span>
                    {/* Said on the card, not hidden in a corner of the app.
                        These are generated illustrations standing in until the
                        team's own photographs exist, and this project does not
                        put something on screen as a fact it cannot stand
                        behind — rules 1 and 2, in a smaller font. */}
                    <span className="dish-card__ai">
                      {say('AI illustration', 'AI 생성 이미지', 'Ilustración con IA', 'Illustration IA', 'رسم بالذكاء الاصطناعي', 'AI 生成图', 'AI生成画像')}
                    </span>
                  </div>

                  <div className="dish-card__body">
                    <span className="dish-card__kind">{categoryText(card.category)}</span>
                    <h3 className="dish-card__name" translate="no">{card.nameKo}</h3>
                    <p className="dish-card__roman" translate="no">{card.romanization}</p>
                    <p className="dish-card__gloss">{dishText(card, 'gloss')}</p>

                    {/* The reason it is shared. This is the public-diplomacy
                        payload of the whole screen: not "this is tasty" but
                        "this is why somebody has to be across the table". */}
                    <p className="dish-card__why">{dishText(card, 'whyShared')}</p>

                    <p className="dish-card__min">
                      {say(`Served from ${card.minPeople} people up`, `${card.minPeople}인분부터 나옵니다`,
                        `Se sirve a partir de ${card.minPeople} personas`, `Servi à partir de ${card.minPeople} personnes`,
                        `يُقدَّم ابتداءً من ${card.minPeople} أشخاص`, `${card.minPeople} 人份起`,
                        `${card.minPeople}人前から`)}
                    </p>
                  </div>

                  <span className={`dish-card__stamp dish-card__stamp--want${leaning === VERDICT.WANT ? ' is-on' : ''}`} aria-hidden="true">
                    {say('WANT', '먹고 싶다', 'ME APETECE', 'ENVIE', 'أريده', '想吃', '食べたい')}
                  </span>
                  <span className={`dish-card__stamp dish-card__stamp--pass${leaning === VERDICT.PASS ? ' is-on' : ''}`} aria-hidden="true">
                    {say('NOT NOW', '아니요', 'AHORA NO', 'PAS ÇA', 'ليس الآن', '不用', 'いまはいい')}
                  </span>
                </article>
              )}
            </div>

            {/* The buttons are not a fallback. A drag is undiscoverable on
                first open and impossible with a keyboard, and this screen is
                the app's front door for somebody who reads none of it. */}
            <div className="dish-swipe__actions">
              <button type="button" className="dish-swipe__btn dish-swipe__btn--pass" onClick={() => answer(VERDICT.PASS)}>
                {say('Not now', '아니요', 'Ahora no', 'Pas ça', 'ليس الآن', '不用', 'いまはいい')}
              </button>
              <button type="button" className="dish-swipe__btn dish-swipe__btn--want" onClick={() => answer(VERDICT.WANT)}>
                {say('Want this', '먹고 싶다', 'Me apetece', 'J’en ai envie', 'أريده', '想吃', '食べたい')}
              </button>
            </div>

            <p className="dish-swipe__hint">
              {say('Swipe right for yes, left for no.', '오른쪽으로 넘기면 먹고 싶다, 왼쪽은 아니요.',
                'Desliza a la derecha para sí, a la izquierda para no.', 'Glissez à droite pour oui, à gauche pour non.',
                'اسحب يمينًا للموافقة ويسارًا للرفض.', '向右滑是想吃，向左滑是不用。', '右にスワイプで「食べたい」、左で「いまはいい」。')}
            </p>
          </>
        )}

        {done && (
          <div className="taste-map">
            <p className="taste-map__lede">
              {map.count > 0
                ? say(`You picked ${map.count}. These are yours.`, `${map.count}가지를 고르셨어요. 이게 당신의 입맛입니다.`,
                  `Has elegido ${map.count}. Estos son tuyos.`, `Vous en avez choisi ${map.count}. Les voici.`,
                  `اخترت ${map.count}. هذه لك.`, `你选了 ${map.count} 道，这就是你的口味。`, `${map.count}品を選びました。これがあなたの好みです。`)
                : say('You passed on all of them — and that is an answer too.', '전부 넘기셨네요. 그것도 답입니다.',
                  'Los has pasado todos, y eso también es una respuesta.', 'Vous les avez tous passés — c’est une réponse aussi.',
                  'تجاوزتها كلّها — وهذا جواب أيضًا.', '你全都跳过了——这也是一种答案。', 'すべて見送りましたね。それもひとつの答えです。')}
            </p>

            {map.count > 0 && (
              <>
                {/* What the test said, when it has been taken. The map is
                    what somebody picked and the type is who they are at a
                    table; showing both is what makes this screen different
                    for the two people 2026-09-09 asked about, and it is the
                    honest difference — it shows what they did, rather than
                    rearranging the screen to look like a reward. */}
                {showsType(record) && (
                  <p className="taste-map__type">
                    <span className="taste-map__type-code" translate="no">{myType.code}</span>
                    <span className="taste-map__type-name">{mbtiTypeLabel(myType.code, locale)}</span>
                  </p>
                )}

                <ul className="taste-map__dishes">
                  {map.dishes.map(d => (
                    <li key={d.id} className="taste-map__dish">
                      <span className="taste-map__dish-photo" aria-hidden="true">
                        <img src={photoFor(d.id)} alt="" loading="lazy"
                          onError={e => { e.currentTarget.style.display = 'none'; }} />
                      </span>
                      <span className="taste-map__dish-kr" translate="no">{d.nameKo}</span>
                      <span className="taste-map__dish-rom" translate="no">{d.romanization}</span>
                    </li>
                  ))}
                </ul>

                <p className="taste-map__kinds">
                  {map.categories.map(c => categoryText(c.category)).filter(Boolean).join(' · ')}
                </p>

                {/* The whole point of the deck. Not "matched" — the tables
                    were already open, and saying so is the difference between
                    a dating app's result screen and this one. */}
                <button type="button" className="taste-map__cta" onClick={() => { onOpenTables?.(); onClose?.(); }}>
                  {say('See the tables open for these', '이 음식들로 열려 있는 밥상 보기',
                    'Ver las mesas abiertas para esto', 'Voir les tables ouvertes pour ces plats',
                    'شاهد الموائد المفتوحة لهذه الأطباق', '看看为这些菜开着的饭桌', 'これらで開いている食卓を見る')}
                </button>

                {/* Where the type lives in this build. The map says what
                    somebody picked; the test asks who they are at a table,
                    and the two are different questions with different
                    answers. Offered after the map and never before it. */}
                {/* Opened here on 밥상, handed up in the opening sequence:
                    the sequence has to know, because closing the test there
                    is what ends it. One sheet either way. */}
                <button type="button" className="taste-map__mbti" onClick={() => (onOpenMbti ? onOpenMbti() : setMbtiOpen(true))}>
                  {testIsNew(record)
                    ? say('Take the food MBTI', '음식 MBTI 검사하기', 'Haz el MBTI gastronómico',
                      'Faire le MBTI culinaire', 'أجرِ اختبار إم بي تي آي للطعام',
                      '做饮食 MBTI 测试', 'フード MBTI をやってみる')
                    : say('Take the food MBTI again', '음식 MBTI 다시 하기', 'Vuelve a hacer el MBTI gastronómico',
                      'Refaire le MBTI culinaire', 'أعد اختبار إم بي تي آي للطعام',
                      '再做一次饮食 MBTI', 'フード MBTI をもう一度')}
                </button>

                {/* The ask, and it is here rather than on the way in.
                    A wall at the front door is answered by leaving; the same
                    question after somebody has spent fourteen cards building
                    something is a question about keeping what they made. It
                    names what is lost, not what is gained, because that is
                    the true thing to say: the map lives in this browser and
                    a cleared tab takes it.

                    Shown only to somebody not signed in, and never before
                    the map exists — the map IS the reason to answer. */}
                {!auth?.user && onOpenAuth && (
                  <div className="taste-map__keep">
                    <p className="taste-map__keep-text">
                      {say('This map lives in this browser only.', '이 지도는 이 브라우저에만 저장돼요.',
                        'Este mapa solo vive en este navegador.', 'Cette carte n’existe que dans ce navigateur.',
                        'هذه الخريطة محفوظة في هذا المتصفّح وحده.', '这张地图只存在这个浏览器里。',
                        'この地図はこのブラウザーの中だけにあります。')}
                    </p>
                    <button type="button" className="taste-map__keep-cta" onClick={() => onOpenAuth('signup')}>
                      {say('Keep it', '저장해두기', 'Guardarlo', 'La garder', 'احتفظ بها', '保存下来', '保存しておく')}
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="taste-map__foot">
              <button type="button" className="taste-map__again" onClick={() => { setTaste(clearTaste()); setShowMap(false); onTasteChange?.(); }}>
                {say('Start over', '다시 하기', 'Empezar de nuevo', 'Recommencer', 'ابدأ من جديد', '重新开始', 'やり直す')}
              </button>
              {!card ? null : (
                <button type="button" className="taste-map__again" onClick={() => setShowMap(false)}>
                  {say('Keep going', '더 고르기', 'Seguir', 'Continuer', 'واصِل', '继续挑', 'もっと選ぶ')}
                </button>
              )}
            </div>
          </div>
        )}
    </div>
  );

  // Inline on Main, where it is the first thing on the page and there is
  // nothing to dismiss. The overlay is kept for Explore's entry, which opens
  // over a page somebody was already reading.
  const withSheet = (
    <>
      {body}
      {mbtiOpen && (
        <FoodMbti onClose={() => { setMbtiOpen(false); setMyType(mbtiType(getStoredMbti())); }} />
      )}
    </>
  );

  if (inline) return <section className="dish-swipe-inline-wrap" aria-label={label}>{withSheet}</section>;

  return (
    <div className="match-modal-backdrop dish-swipe-backdrop" role="dialog" aria-label={label} onClick={onClose}>
      {withSheet}
    </div>
  );
}
