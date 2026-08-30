import React, { useEffect, useState, useRef } from 'react';
import { menus } from '../domain/catalog/menus.js';
import { DISH_GROUPS, romanDishes, glossDishes } from '../domain/catalog/dishGroups.js';
import { isMember } from '../domain/policy/access.js';
import { HOW_STEPS, HOW_WHY } from '../content/howItWorks.js';
import { MAIN_PHOTOS } from '../content/mainPhotos.js';
import { SAFETY_POINTS } from '../content/safetyPromise.js';
import TablesLead from './TablesLead';
import DishSheet from './DishSheet';
import { ChevronRightIcon, XIcon, PauseIcon, PlayIcon } from './Icons';
import { useText } from './localeText.js';

// 메인 — the front door, added 2026-08-06 and rebuilt the same day.
//
// The first build mapped Meetup's landing structurally — right sections,
// right order — and the owner looked at it next to the screenshots and asked
// the only question that mattered: do you actually think these look alike?
// They did not. What makes that page that page is none of the structure: it
// is a headline set enormous in the centre of a mostly empty screen, photo
// blobs floating either side of it with tilted little tags, hand-drawn
// squiggles, steps laid out in a zigzag joined by curly arrows, and a whole
// screen of air per section. This rebuild carries those.
//
// Still referenced, not copied — and still no photography until the team has
// its own (mainPhotos.js is the slot; the blobs take photos the moment the
// array is non-empty). Until then each blob sets a dish name large, which is
// at least true, in the organic shapes Meetup cuts its photos into.

// The four hero blobs: a dish, a tone, and a tilted tag. Every tag repeats a
// claim the app makes and keeps elsewhere — the hero may not say anything
// the product does not.
//
// Both halves of every word, added 2026-08-11. These were Korean-only, which
// meant the front page read identically whether you had asked for Korean or
// for English — four dish names at 40px and four Korean tags, unchanged by
// the setting. `roman` is the same romanization the catalogue already
// carries, so an English reader gets something they can say out loud rather
// than a shape they cannot.
const HERO_BLOBS = [
  { word: '삼겹살', roman: 'Samgyeopsal', tone: 'b-orange', tag: '2인분부터', tagEn: 'From two servings', tagEs: 'Desde dos raciones', tagFr: 'À partir de deux parts', tagAr: 'من حصتين فأكثر', tagZh: '两人份起', tagJa: '二人前から' },
  { word: '감자탕', roman: 'Gamjatang', tone: 'b-green', tag: '냄비째 나옴', tagEn: 'Comes by the pot', tagEs: 'Llega en olla', tagFr: 'Servi à la marmite', tagAr: 'يأتي بالقِدر', tagZh: '整锅上桌', tagJa: '鍋ごと出てきます' },
  { word: '보쌈', roman: 'Bossam', tone: 'b-brass', tag: '호스트가 안내', tagEn: 'Your host explains', tagEs: 'El anfitrión te guía', tagFr: "L'hôte vous explique", tagAr: 'المضيف يشرح لك', tagZh: '主人带你', tagJa: 'ホストが案内します' },
  { word: '족발', roman: 'Jokbal', tone: 'b-pine', tag: '앱 결제 없음', tagEn: 'No in-app payment', tagEs: 'Sin pagos en la app', tagFr: "Aucun paiement dans l'app", tagAr: 'لا دفع في التطبيق', tagZh: '应用内不收钱', tagJa: 'アプリ内での支払いなし' },
];

// Tile accents, cycled through the dish shelf.
const TILE_TONES = ['t-brass', 't-green', 't-orange', 't-field'];

// How long a hero dish holds the screen. Five seconds is slower than most
// carousels on purpose: each slide carries Korean somebody may be sounding
// out for the first time, and the usual four is enough time to read a photo,
// not a word you have never seen.
const SLIDE_MS = 5000;

/**
 * Does this person's device ask for less movement?
 *
 * A hero that changes itself is the exact thing `prefers-reduced-motion`
 * exists for — for some people an auto-advancing panel is not a preference
 * but nausea or a migraine. The stylesheet already honours the setting in
 * four places, but a setInterval is invisible to CSS, so the carousel has to
 * read it here. Listened to rather than sampled once: the setting can be
 * changed while the app is open.
 */
function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

// Meetup's connector doodle, redrawn by hand: a loose loop that curls off
// toward the next thing. Stroke only, so the themes colour it.
const Squiggle = ({ className }) => (
  <svg className={className} viewBox="0 0 120 60" fill="none" aria-hidden="true">
    <path
      d="M6 44 C 28 10, 52 8, 58 26 C 63 41, 44 48, 38 36 C 32 24, 58 12, 84 18 C 100 22, 108 32, 114 44"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    />
    <path d="M106 42 L 114 44 L 109 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function MainTab({
  auth, profile, onNavigate, onOpenTable, onCreateTable, onOpenAuth, onPickGroup,
  onRequestTable,
}) {
  const say = useText();
  const [openDish, setOpenDish] = useState(null);
  // Whether the sticky join bar has been waved away. Component state, so it
  // lasts as long as this visit and no longer — see the bar's own comment.
  const [stickyClosed, setStickyClosed] = useState(false);
  // Whether the hero — and with it the two CTAs the sticky bar was covering —
  // is still on screen. The bar waits until the reader has scrolled past it.
  //
  // ── Why this reads scrollTop instead of observing ───────────────────────
  //
  // The first version used an IntersectionObserver, and a reviewer caught
  // the hole: the fallback covered browsers with no IntersectionObserver,
  // but the failure actually seen was an observer that exists and never
  // calls back — not even the initial callback the spec promises on
  // observe(). That also happens on bfcache restore and when a background
  // tab is brought forward. With the bar starting hidden and the observer as
  // its only route to being shown, every one of those cases silently deletes
  // the join prompt.
  //
  // A scroll position is not an event that can fail to arrive. It is read
  // once at mount and on every scroll, and the answer is the same every
  // time, so there is no state to get stuck in.
  const heroRef = useRef(null);
  const [heroSeen, setHeroSeen] = useState(true);
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return undefined;
    // The app scrolls inside .content-region, not the document.
    const scroller = hero.closest('.content-region') ?? document.scrollingElement;
    if (!scroller) return undefined;

    // 120px of the hero may have left before the bar is allowed back: the
    // second CTA sits near its bottom edge, and a bar that returns the
    // instant the hero's last pixel moves would clip it again on the way.
    const PAST = 120;
    const update = () => setHeroSeen(scroller.scrollTop < Math.max(0, hero.offsetHeight - PAST));

    update();   // decided before the first scroll, and after any restore
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('pageshow', update);      // bfcache
    window.addEventListener('resize', update);        // the hero's height changes
    return () => {
      scroller.removeEventListener('scroll', update);
      window.removeEventListener('pageshow', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  const member = isMember(auth);

  // The hero carousel, asked for on 2026-08-07 after the 인하대 정치외교학과
  // front page: a slide that turns itself, dots to jump between, and a
  // pause. Autoplay starts on unless the device asked for less motion, in
  // which case it never starts — the dots still work, so nothing is lost,
  // it simply waits to be told.
  const reducedMotion = useReducedMotion();
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);

  // setTimeout keyed on `slide` rather than one long interval: it means a tap
  // resets the clock, so the dish you just chose gets its full turn instead
  // of being swept away by a tick that was already half spent.
  useEffect(() => {
    if (!playing || reducedMotion) return undefined;
    const id = setTimeout(() => setSlide(s => (s + 1) % HERO_BLOBS.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [playing, reducedMotion, slide]);

  // The extra bottom padding exists only to clear the sticky bar, so it
  // leaves with it — otherwise dismissing the bar leaves 190px of nothing
  // under the footer.
  // Not while the hero is on screen — see the observer above.
  const stickyShown = !member && !stickyClosed && !heroSeen;

  return (
    <section
      className={`main-tab${stickyShown ? ' main-tab--sticky' : ''}`}
      aria-label={say('Eatple home', '밥친구 메인', 'Inicio de Eatple', "Accueil d'Eatple", 'الصفحة الرئيسية لـ Eatple', 'Eatple 首页', 'Eatple のホーム')}
    >

      {/* ---- Hero. Meetup's phone and desktop heroes are different
              layouts, not one squeezed: the phone puts headline, then CTA,
              then one big collage blob under it; the desktop floats four
              blobs around a huge centred headline. The copy comes first in
              the DOM so the phone's natural flow is already Meetup's order,
              and the desktop lifts the blobs out with position:absolute
              where DOM order stops mattering. ---- */}
      <header className="main-hero" ref={heroRef}>
        <div className="main-hero__copy">
          {/* The brand, in halves. It was one string in a class ending -kr,
              which meant an English interface dropped the app's own name off
              its own front page. Split, so each setting keeps a name. */}
          <span className="main-hero__eyebrow l-pair" translate="no">
            <span className="main-hero__eyebrow-kr">밥친구 잇플</span>
            <span className="main-hero__eyebrow-en">Eatple</span>
          </span>
          {/* Two headlines, one shown at a time. The Korean one is the
              default and stays the default — it is the screen the team
              reviewed — and the English one exists only for the English
              setting, where a 64px Korean headline was the single loudest
              thing the language setting failed to touch. */}
          <h1 className="main-hero__title main-hero__title-kr" translate="no">
            혼자서는
            <br />주문할 수 없는
            <br />음식들.
          </h1>
          <h1 className="main-hero__title l-en-only">
            {say(
              <>Some dishes<br />cannot be ordered<br />for one.</>,
              null,
              <>Hay platos<br />que no se piden<br />para uno.</>,
              <>Certains plats<br />ne se commandent pas<br />pour une personne.</>,
              <>بعض الأطباق<br />لا تُطلَب<br />لشخص واحد.</>,
              <>有些菜<br />一个人<br />是点不了的。</>,
              <>ひとりでは<br />頼めない<br />料理があります。</>,
            )}
          </h1>
          {/* Prose gets a line per language rather than one line carrying
              both, which is how the notice bar has always done it. A
              sentence with 밥친구 sitting inside an English clause cannot be
              reduced by any splitter — it has to be written twice. */}
          <p className="main-hero__sub main-hero__sub-kr" translate="no">
            삼겹살은 2인분부터, 감자탕은 냄비째 나옵니다. 밥친구 잇플이 그 밥상과,
            이미 가고 있는 사람들을 찾아드려요.
          </p>
          <p className="main-hero__sub main-hero__sub-en">
            {say(
              'Samgyeopsal starts at two servings and gamjatang arrives by the pot. Eatple finds you the table — and the people already going.',
              null,
              'El samgyeopsal empieza en dos raciones y el gamjatang llega en olla. Eatple te encuentra la mesa — y a la gente que ya va.',
              "Le samgyeopsal commence à deux parts et le gamjatang arrive à la marmite. Eatple vous trouve la table — et les gens qui y vont déjà.",
              'السامغيوبسال يبدأ من حصتين، والغامجاتانغ يأتي بالقِدر. يجد لك Eatple المائدة — ومن هم ذاهبون إليها أصلًا.',
              '五花肉从两人份起，土豆汤是整锅上的。Eatple 替你找到那张饭桌——还有已经要去的人。',
              'サムギョプサルは二人前から、カムジャタンは鍋ごと出てきます。Eatple がその食卓と、すでに行く人たちを見つけます。',
            )}
          </p>
          {/* The middot pairs are Korean-and-English, so a Spanish screen
              would keep the English half. These three carry the whole
              journey — see the tables, open one, join — so they are worth
              the explicit third string rather than a fallback. */}
          <button className="main-hero__cta" translate="no" onClick={() => onNavigate('match')}>
            {say('이번 주 밥상 보기 · See this week\u2019s tables', '이번 주 밥상 보기', 'Ver las mesas de esta semana', 'Voir les tables de cette semaine', 'انظر موائد هذا الأسبوع', '看这周的饭桌', '今週の食卓を見る')}
          </button>
          <button className="main-hero__alt" translate="no" onClick={onCreateTable}>
            {say('상 차리기 · Open a table', '상 차리기', 'Abrir una mesa', 'Ouvrir une table', 'افتح مائدة', '开一张饭桌', '食卓を開く')} <ChevronRightIcon size={14} />
          </button>
        </div>

        {/* The collage. One big blob under the CTA on a phone, four floating
            around the headline on a desktop — Meetup's own split. Photos
            take these slots the moment mainPhotos.js has any. */}
        <div className="main-hero__blobs">
          {HERO_BLOBS.map((b, i) => {
            const photo = MAIN_PHOTOS[i];
            return (
              <button
                key={b.word}
                type="button"
                className={`main-blob main-blob--${i} ${b.tone}${i === slide ? ' is-on' : ''}`}
                aria-hidden={i === slide ? undefined : 'true'}
                tabIndex={i === slide ? 0 : -1}
                aria-label={`${b.word} — ${b.tag}. 다음 요리 보기`}
                onClick={() => setSlide((slide + 1) % HERO_BLOBS.length)}
              >
                {photo
                  ? <img className="main-blob__img" src={photo.src} alt="" loading="lazy" />
                  : (
                    <>
                      <span className="main-blob__word main-blob__word-kr" translate="no">{b.word}</span>
                      <span className="main-blob__word l-en-only">{b.roman}</span>
                    </>
                  )}
                <span className="main-blob__tag">
                  <span className="main-blob__tag-kr" translate="no">{photo?.label ?? b.tag}</span>
                  <span className="l-en-only">{say(b.tagEn, null, b.tagEs, b.tagFr, b.tagAr, b.tagZh, b.tagJa)}</span>
                </span>
              </button>
            );
          })}
          <Squiggle className="main-hero__squiggle main-hero__squiggle--l" />
          <Squiggle className="main-hero__squiggle main-hero__squiggle--r" />
        </div>

        {/* The 인하대 front page's own furniture: a dot per slide, then the
            pause. Phone only — the desktop shows all four dishes at once,
            and dots for a thing already fully visible are a control with
            nothing to control. */}
        <div className="main-hero__dots">
          {HERO_BLOBS.map((b, i) => (
            <button
              key={b.word}
              type="button"
              className={`main-dot${i === slide ? ' is-on' : ''}`}
              aria-label={`${b.word} 보기`}
              aria-current={i === slide ? 'true' : undefined}
              onClick={() => setSlide(i)}
            />
          ))}
          <button
            type="button"
            className="main-dots__toggle"
            aria-label={playing && !reducedMotion
              ? '자동 넘김 멈추기 · Pause'
              : '자동 넘김 시작 · Play'}
            onClick={() => setPlaying(p => !p)}
          >
            {playing && !reducedMotion ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
          </button>
        </div>
      </header>

      {/* ---- The six groups: matching starts by naming what you came
              to eat. Each card is a door into the tables screen with that
              category already chosen — the same taxonomy the map's dots and
              the register filter run on, from the same file. ---- */}
      <div className="main-band main-band--groups">
        <h2 className="main-band__title">
          <span className="main-band__title-kr" translate="no">한국에서 혼자 먹기 어려웠던 음식을 함께 먹어보세요</span>
          <span className="main-band__title-en">
            {say('The food that was hard to eat alone in Korea — eat it together', null,
              'La comida difícil de comer solo en Corea — para comerla juntos',
              'Ces plats difficiles à manger seul en Corée — à partager ensemble',
              'الطعام الذي يصعب أكله وحيدًا في كوريا — كُلْه مع آخرين',
              '在韩国一个人很难吃到的东西——一起去吃吧',
              '韓国でひとりでは食べにくかったものを、一緒に食べてみませんか')}
          </span>
        </h2>
        <div className="main-groups" role="group" aria-label={say('Pick a kind of food', '음식 종류 고르기', 'Elige un tipo de comida', 'Choisissez un type de plat', 'اختر نوع الطعام', '选一种吃的', '食べたいものを選ぶ')}>
          {DISH_GROUPS.map(g => (
            <button key={g.id} className="main-group" style={{ '--tint': g.tint }} onClick={() => onPickGroup?.(g.id)}>
              <span className="main-group__emoji" aria-hidden="true">{g.emoji}</span>
              <span className="main-group__name">{say(g.en, g.ko, g.es, g.fr, g.ar, g.zh, g.ja)}</span>
              {/* Korean always — it is what the sign says and what a
                  traveller points at. The romanisation and the plain
                  description appear for everyone not reading in Korean. */}
              <span className="main-group__dishes" translate="no" data-no-locale>{g.ko_dishes}</span>
              <span className="main-group__rom l-en-only" translate="no">{romanDishes(g)}</span>
              <span className="main-group__gloss l-en-only">
                {say(glossDishes(g), null, glossDishes(g), glossDishes(g), glossDishes(g), glossDishes(g), glossDishes(g))}
              </span>
              <span className="main-group__go">{say('Find this table', '이 밥상 찾기', 'Buscar esta mesa', 'Trouver cette table', 'ابحث عن هذه المائدة', '找这桌', 'この食卓を探す')} →</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- This week ---- */}
      <div className="main-band">
        <TablesLead
          onOpenTables={() => onNavigate('match')}
          onOpenTable={onOpenTable}
          onCreateTable={onCreateTable}
          onRequestTable={onRequestTable}
          profile={profile}
        />
      </div>

      {/* ---- The dishes, as Meetup's category tiles ---- */}
      <div className="main-band main-band--dishes">
        {/* The Korean half was a bare text node with no element of its own,
            so nothing could hide it and an English interface kept every
            section heading in Korean. Both halves are spans now. */}
        <h2 className="main-band__title">
          <span className="main-band__title-kr" translate="no">요리 살펴보기</span>
          <span className="main-band__title-en">
            {say('The dishes this app is about', null, 'Los platos de los que trata esta app', 'Les plats dont parle cette application', 'الأطباق التي يتحدّث عنها هذا التطبيق', '这个应用讲的那些菜', 'このアプリが扱っている料理')}
          </span>
        </h2>
        <div className="main-dishes__row" role="group" aria-label={say('Read about a dish', '요리 읽어보기', 'Leer sobre un plato', 'Lire sur un plat', 'اقرأ عن طبق', '读一道菜', '料理について読む')}>
          {menus.map((m, i) => (
            <button key={m.id} className={`main-dish ${TILE_TONES[i % TILE_TONES.length]}`} onClick={() => setOpenDish(m)}>
              <span className="main-dish__arrow" aria-hidden="true">↗</span>
              <span className="main-dish__kr" translate="no">{m.nameKo}</span>
              <span className="main-dish__en">{m.name}</span>
              {/* The one thing a traveller needs before they can say it out
                  loud, and it was already in the catalogue — reachable only
                  by opening the dish. Now it is on the tile you tap. */}
              <span className="main-dish__rom" translate="no" data-no-locale>{m.romanization}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- How it happens: the zigzag with curly arrows ---- */}
      <div className="main-band main-band--how">
        <h2 className="main-band__title">
          <span className="main-band__title-kr" translate="no">밥친구가 이루어지는 방식</span>
          <span className="main-band__title-en">
            {say('How a table happens', null, 'Cómo nace una mesa', 'Comment naît une table', 'كيف تنشأ مائدة', '一张饭桌是怎么成的', '食卓はどう生まれるか')}
          </span>
        </h2>
        <div className="main-zig">
          {HOW_STEPS.map((s, i) => (
            <div key={s.id} className={`main-zig__step main-zig__step--${i}`}>
              <span className="main-zig__num" aria-hidden="true">{i + 1}</span>
              <span className="main-zig__kr" translate="no">{s.kr}</span>
              <span className="main-zig__en">{say(s.en, null, s.es, s.fr, s.ar, s.zh, s.ja)}</span>
            </div>
          ))}
          <svg className="main-zig__arrow main-zig__arrow--0" viewBox="0 0 160 80" fill="none" aria-hidden="true">
            <path d="M10 20 C 60 -6, 96 10, 96 34 C 96 52, 72 56, 68 42 C 64 28, 92 22, 120 34 C 136 41, 146 52, 150 62"
              stroke="currentColor" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
            <path d="M142 58 L 150 62 L 146 53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg className="main-zig__arrow main-zig__arrow--1" viewBox="0 0 160 80" fill="none" aria-hidden="true">
            <path d="M150 18 C 110 46, 70 40, 48 44 C 30 47, 16 56, 10 64"
              stroke="currentColor" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
            <path d="M18 60 L 10 64 L 15 55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* One sentence, two elements rather than "<strong>한국어</strong> —
            English" in a single node: the em dash joining them belongs to
            neither language, so a splitter cannot cut this cleanly and the
            markup has to do it. */}
        <p className="main-how__why">
          <strong className="main-how__why-kr" translate="no">{HOW_WHY.kr}</strong>
          <span className="main-how__why-en">{say(HOW_WHY.en, null, HOW_WHY.es, HOW_WHY.fr, HOW_WHY.ar, HOW_WHY.zh, HOW_WHY.ja)}</span>
        </p>
      </div>

      {/* ---- What keeps a table safe ----
              Everything named here already exists in the app: hostRecord on
              the cards, RulesConsent before a first table, report.js and
              blocking.js behind the table and profile views. None of it was
              visible to somebody deciding whether to join, which is the one
              moment it is for. A tester searched the whole site for
              "verified / report / block / cancel" on 2026-08-30 and found
              nothing, and said so in exactly those terms. ---- */}
      <div className="main-band main-band--safety">
        <h2 className="main-band__title">
          <span className="main-band__title-kr" translate="no">모르는 사람과 먹는 일이니까</span>
          <span className="main-band__title-en">
            {say('Eating with strangers, safely', null,
              'Comer con desconocidos, con seguridad',
              'Manger avec des inconnus, en sécurité',
              'أن تأكل مع غرباء، بأمان',
              '和陌生人吃饭，也要安心',
              '知らない人と食べるからこそ')}
          </span>
        </h2>
        <ul className="main-safety">
          {SAFETY_POINTS.map(pt => (
            <li key={pt.id} className="main-safety__item">
              <h3 className="main-safety__head">
                {say(pt.en, pt.ko, pt.es, pt.fr, pt.ar, pt.zh, pt.ja)}
              </h3>
              <p className="main-safety__body">
                {say(pt.bodyEn, pt.bodyKo, pt.bodyEs, pt.bodyFr, pt.bodyAr, pt.bodyZh, pt.bodyJa)}
              </p>
            </li>
          ))}
        </ul>
        {/* The women-only filter was described by the same tester as "the
            right instinct and the only safety-adjacent thing on the site",
            sitting unexplained among the cuisine chips where it reads as a
            preference. Named here, where it belongs. */}
        <p className="main-safety__note">
          {say('The tables list also has a filter for tables another woman has already joined.',
            '밥상 목록에는 다른 여성이 이미 참여한 밥상만 보는 필터도 있습니다.',
            'La lista de mesas también tiene un filtro para mesas a las que ya se ha apuntado otra mujer.',
            "La liste des tables a aussi un filtre pour celles où une autre femme s'est déjà inscrite.",
            'في قائمة الموائد أيضًا مصفٍّ يُظهر الموائد التي انضمّت إليها امرأة أخرى بالفعل.',
            '饭桌列表里还有一个筛选，只看已经有其他女性参加的饭桌。',
            '食卓の一覧には、ほかの女性がすでに参加している食卓だけを見る絞り込みもあります。')}
        </p>
      </div>

      {/* ---- The giant join panel ---- */}
      {!member && (
        <div className="main-band">
          <div className="main-join">
            <span className="main-join__dot main-join__dot--a" aria-hidden="true" translate="no">밥</span>
            <span className="main-join__dot main-join__dot--b" aria-hidden="true" translate="no">상</span>
            <h2 className="main-join__title main-join__title-kr" translate="no">밥친구 가입하기</h2>
            <h2 className="main-join__title l-en-only">{say('Join Eatple', null, 'Únete a Eatple', 'Rejoindre Eatple', 'انضمّ إلى Eatple', '加入 Eatple', 'Eatple に参加')}</h2>
            <p className="main-join__body main-join__body-kr" translate="no">
              둘러보기는 계정 없이도 됩니다 — 요리, 문화, 장소 전부요.
              계정은 자리를 잡을 때 필요하고, 가입도 무료입니다.
            </p>
            <p className="main-join__body main-join__body-en">
              {say(
                'Browsing is free — the dishes, the culture, the places, all of it. The seat is what an account is for, and joining is free too.',
                null,
                'Mirar es gratis — los platos, la cultura, los sitios, todo. La cuenta es para el sitio en la mesa, y registrarse también es gratis.',
                "Parcourir est gratuit — les plats, la culture, les adresses, tout. Le compte sert à avoir la place, et s'inscrire est gratuit aussi.",
                'التصفّح مجاني — الأطباق والثقافة والأماكن، كلّها. والحساب إنما هو للمقعد، والتسجيل مجاني أيضًا.',
                '看是免费的——菜、文化、地点，全都是。账号是为了那个位子，而注册也免费。',
                '見るのは無料です——料理も、文化も、場所も、すべて。アカウントは席のためにあり、登録もまた無料です。',
              )}
            </p>
            <button className="main-join__cta" translate="no" onClick={() => onOpenAuth?.('signup')}>
              {say('무료로 가입하기 · Join free', '무료로 가입하기', 'Únete gratis', 'Rejoindre gratuitement', 'انضمّ مجانًا', '免费加入', '無料で参加')}
            </button>
          </div>
        </div>
      )}

      {/* ---- One door into the culture ---- */}
      <div className="main-band">
        <button className="main-culture" onClick={() => onNavigate('home')}>
          <span className="main-culture__kr" translate="no">문화</span>
          <span className="main-culture__label l-en-only">{say('Culture', null, 'Cultura', 'Culture', 'ثقافة', '文化', '文化')}</span>
          <span className="main-culture__body main-culture__body-kr" translate="no">
            한국이 어떻게 먹는지에 대한 일곱 가지 질문 — 계정 없이 전부 들어가
            볼 수 있어요.
          </span>
          <span className="main-culture__body main-culture__body-en">
            {say(
              'Seven questions about how Korea eats — each one free to walk into, no account.',
              null,
              'Siete preguntas sobre cómo come Corea — se entra gratis en todas, sin cuenta.',
              "Sept questions sur la façon dont la Corée mange — on entre gratuitement dans chacune, sans compte.",
              'سبعة أسئلة عن طريقة كوريا في الأكل — تدخل كلًّا منها مجانًا وبلا حساب.',
              '关于韩国怎么吃的七个问题——每一个都免费进，也不用账号。',
              '韓国の食べ方についての七つの問い——どれも無料で、アカウントなしで入れます。',
            )}
          </span>
          <ChevronRightIcon size={16} />
        </button>
      </div>

      {/* ---- The dark footer, Meetup's rounded slab — and the reserved
              seats for the legal pages HANDOFF requires before the pilot,
              named rather than linked because a link to a page that does
              not exist is a lie with an underline. ---- */}
      <footer className="main-footer">
        <div className="main-footer__mast">
          <span className="main-footer__brand main-footer__brand-kr" translate="no">밥친구<span className="main-footer__brand-dot">.</span> 같이 먹는 플랫폼</span>
          <span className="main-footer__brand l-en-only">
            Eatple<span className="main-footer__brand-dot">.</span>{' '}
            {say('a table you share', null, 'una mesa que se comparte', 'une table qui se partage', 'مائدة تُشارَك', '一张分着吃的饭桌', '分け合う食卓')}
          </span>
          <button className="main-footer__mastlink" translate="no" onClick={onCreateTable}>
            {say('상 차리기 · Open a table', '상 차리기', 'Abrir una mesa', 'Ouvrir une table', 'افتح مائدة', '开一张饭桌', '食卓を開く')} →
          </button>
        </div>
        <div className="main-footer__cols">
          <div className="main-footer__col">
            <h3 className="main-footer__head">{say('내 계정 · Account', '내 계정', 'Mi cuenta', 'Mon compte', 'حسابي', '我的账号', 'アカウント')}</h3>
            {member ? (
              <button className="main-footer__link" onClick={() => onNavigate('journal')}>{say('여권 · Passport', '여권', 'Pasaporte', 'Passeport', 'جواز السفر', '护照', 'パスポート')}</button>
            ) : (
              <>
                <button className="main-footer__link" onClick={() => onOpenAuth?.('signup')}>{say('회원 가입 · Join', '회원 가입', 'Únete', 'Rejoindre', 'انضمّ', '注册', '登録')}</button>
                <button className="main-footer__link" onClick={() => onOpenAuth?.('signin')}>{say('로그인 · Sign in', '로그인', 'Entrar', 'Se connecter', 'تسجيل الدخول', '登录', 'ログイン')}</button>
              </>
            )}
            <button className="main-footer__link" onClick={() => onNavigate('settings')}>{say('설정 · Settings', '설정', 'Ajustes', 'Réglages', 'الإعدادات', '设置', '設定')}</button>
          </div>
          <div className="main-footer__col">
            <h3 className="main-footer__head">{say('살펴보기 · Browse', '살펴보기', 'Explorar', 'Parcourir', 'تصفّح', '逛一逛', '見て回る')}</h3>
            <button className="main-footer__link" onClick={() => onNavigate('match')}>{say('밥상 · Tables', '밥상', 'Mesas', 'Tables', 'موائد', '饭桌', '食卓')}</button>
            <button className="main-footer__link" onClick={() => onNavigate('places')}>{say('장소 · Places', '장소', 'Sitios', 'Lieux', 'أماكن', '地点', '場所')}</button>
            <button className="main-footer__link" onClick={() => onNavigate('home')}>{say('문화 · Explore', '문화', 'Cultura', 'Culture', 'ثقافة', '文化', '文化')}</button>
          </div>
          <div className="main-footer__col">
            <h3 className="main-footer__head">{say('밥친구 · Team', '밥친구', 'Equipo', 'Équipe', 'الفريق', '团队', 'チーム')}</h3>
            <a className="main-footer__link" href="mailto:eatple0701@gmail.com">eatple0701@gmail.com</a>
            {/* The middot here separates a page from its status, not two
                languages — "개인정보 처리방침 · 준비 중" is Korean on both
                sides of it. Written as halves so each setting gets a whole
                sentence instead of a splitter guessing wrong. */}
            <span className="main-footer__soon main-footer__soon-kr" translate="no">개인정보 처리방침 · 준비 중</span>
            <span className="main-footer__soon l-en-only">
              {say('Privacy policy · in progress', '개인정보 처리방침 · 준비 중', 'Política de privacidad · en preparación', 'Politique de confidentialité · en préparation', 'سياسة الخصوصية · قيد الإعداد', '隐私政策 · 准备中', 'プライバシーポリシー · 準備中')}
            </span>
            <span className="main-footer__soon main-footer__soon-kr" translate="no">이용약관 · 준비 중</span>
            <span className="main-footer__soon l-en-only">
              {say('Terms of use · in progress', '이용약관 · 준비 중', 'Términos de uso · en preparación', "Conditions d'utilisation · en préparation", 'شروط الاستخدام · قيد الإعداد', '使用条款 · 准备中', '利用規約 · 準備中')}
            </span>
          </div>
        </div>
        <p className="main-footer__base main-footer__base-kr" translate="no">
          © 2026 밥친구 잇플 · Eatple — 디지털 공공외교 파일럿
        </p>
        <p className="main-footer__base main-footer__base-en">
          {say('© 2026 Eatple — a digital public diplomacy pilot', null,
            '© 2026 Eatple — un piloto de diplomacia pública digital', '© 2026 Eatple — un pilote de diplomatie publique numérique', '© 2026 Eatple — تجربة في الدبلوماسية العامة الرقمية', '© 2026 Eatple — 一个数字公共外交试点', '© 2026 Eatple — デジタル公共外交のパイロット')}
        </p>
      </footer>

      {/* Meetup's phone-only sticky join bar, riding just above our tab
          bar. Guests only, this tab only, and hidden the moment a sheet or
          the desktop layout takes over — a bar that follows every scroll
          has to earn each pixel it occupies, so it is one line and one
          button. .main-tab--sticky pads the page bottom so the footer's
          last row is never parked underneath it. */}
      {stickyShown && !openDish && (
        <div className="main-sticky">
          {/* Closable, asked for on 2026-08-07. A bar that follows every
              scroll and cannot be dismissed is not an invitation, it is
              furniture in the way — and this one sits over the bottom of
              the footer, which is where the team's own contact line is.
              Dismissal lasts the session: closing something that comes
              back on the next scroll is not closing it. It returns on a
              fresh visit, because the reason for it has not gone away. */}
          <button
            className="main-sticky__close"
            aria-label={say('닫기 · Dismiss', '닫기', 'Descartar', 'Fermer', 'إغلاق', '关闭', '閉じる')}
            onClick={() => setStickyClosed(true)}
          >
            <XIcon size={16} />
          </button>
          <p className="main-sticky__text" translate="no">
            {say('가입하고 이번 주 밥상에 앉아보세요 · Join and take a seat', '가입하고 이번 주 밥상에 앉아보세요',
              'Únete y siéntate a una mesa esta semana', 'Rejoignez et prenez place à une table cette semaine', 'انضمّ وخذ مقعدًا على مائدة هذا الأسبوع', '加入，这周就坐上一张饭桌', '参加して、今週の食卓に座ってみてください')}
          </p>
          <button className="main-sticky__cta" translate="no" onClick={() => onOpenAuth?.('signup')}>
            {say('회원 가입 · Join free', '회원 가입', 'Únete gratis', 'Rejoindre gratuitement', 'انضمّ مجانًا', '免费加入', '無料で参加')}
          </button>
        </div>
      )}

      {openDish && (
        <DishSheet
          menu={openDish}
          onClose={() => setOpenDish(null)}
          onOpenTable={() => { setOpenDish(null); onCreateTable?.(); }}
        />
      )}
    </section>
  );
}
