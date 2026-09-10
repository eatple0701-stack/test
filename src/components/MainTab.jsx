import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { menuById } from '../domain/catalog/menus.js';
import { DISH_GROUPS, romanDishes, menuIdOfDish } from '../domain/catalog/dishGroups.js';
import { glossDishesIn } from '../domain/policy/dishGroupPicker.js';
import { railTallest, railIndex, railLoopStep } from '../domain/policy/rail.js';
import { dishGloss } from '../domain/policy/dishLabels.js';
import { isMember } from '../domain/policy/access.js';
import { HOW_STEPS, HOW_WHY } from '../content/howItWorks.js';
import { MAIN_PHOTOS } from '../content/mainPhotos.js';
import { SAFETY_POINTS } from '../content/safetyPromise.js';
import TablesLead from './TablesLead';
import DishSheet from './DishSheet';
import { ChevronRightIcon, XIcon, PauseIcon, PlayIcon } from './Icons';
import { useText, useLocale } from './localeText.js';

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

// How long a hero dish holds the screen. Five seconds is slower than most
// carousels on purpose: each slide carries Korean somebody may be sounding
// out for the first time, and the usual four is enough time to read a photo,
// not a word you have never seen.
const SLIDE_MS = 5000;

// Three screens at the top: the hero, the six categories, and what keeps a
// table safe. Named in deckLabels, which is also the rail’s controls.
const DECK_COUNT = 4;

// Four children, not three. The last is a second copy of the hero, so that
// coming back to the first screen is a step forward onto something identical
// rather than a slide back across the middle one. railLoopStep in rail.js is
// what knows to put the rail quietly back on the real one afterwards.
const DECK_SLIDES = 5;

// The centimetre asked for on 2026-09-07, added under the first slide so the
// hero has room to breathe — 1cm is 37.8 CSS pixels at the 96dpi the unit is
// defined against, and a rail is not the place for a fraction of one.
const DECK_EXTRA = 38;

// Four seconds, asked for on 2026-09-07 after eight was tried and read as
// slow. Shorter than the hero's own 5s even though a slide here is a
// paragraph where that one is a single dish name, which leaves the pause
// beside the labels as the only way to read the safety screen through
// rather than one way among several.
const DECK_MS = 4000;

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
  auth, profile, onNavigate, onOpenTable, onCreateTable, onOpenAuth, onPickGroup, onPickDish,
  onRequestTable,
}) {
  const say = useText();
  const locale = useLocale();
  const [openDish, setOpenDish] = useState(null);
  // Which category card is open, and which of its four dishes is picked.
  // Component state on purpose: this is where somebody is looking, not
  // anything the app should remember about them.
  const [openGroup, setOpenGroup] = useState(null);
  const [openGroupDish, setOpenGroupDish] = useState(null);
  // How many cards the grid is drawing per row, so the open panel can be
  // placed after the last card of that row rather than after the card
  // itself. Read from the grid rather than assumed: index.css draws two
  // columns and three from 768px up, and a hard-coded guess would put the
  // panel mid-row on whichever width it guessed wrong.
  const groupsRef = useRef(null);
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const el = groupsRef.current;
    if (!el || typeof ResizeObserver !== 'function') return undefined;
    const read = () => {
      const n = getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;
      if (n > 0) setCols(n);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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
  const [heroSeen, setHeroSeen] = useState(true);
  useEffect(() => {
    // The rail, not the hero: the hero is drawn twice now — once for real and
    // once as the copy at the end — so it cannot carry a ref that means "the
    // one at the top", and the rail is what stands there anyway.
    const rail = deckRef.current;
    if (!rail) return undefined;
    // The app scrolls inside .content-region, not the document.
    const scroller = rail.closest('.content-region') ?? document.scrollingElement;
    if (!scroller) return undefined;

    // 120px of the hero may have left before the bar is allowed back: the
    // second CTA sits near its bottom edge, and a bar that returns the
    // instant the hero's last pixel moves would clip it again on the way.
    const PAST = 120;
    const update = () => setHeroSeen(scroller.scrollTop < Math.max(0, rail.offsetHeight - PAST));

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

  // ── The top of the page, read sideways ─────────────────────────────────
  //
  // Asked for on 2026-09-07: swipe the top screen and have the sections
  // under it come round in turn. So the hero, 한식 살펴보기 and the safety
  // band are three slides of one rail rather than three stops on a scroll.
  //
  // Same recipe as every other rail here — overflow-x + scroll-snap, no
  // library (index.css, .dish-deck). The height is what is different. The
  // three measure 758, 1057 and 586 on a 375px phone, so a rail as tall as
  // the tallest would leave 471px of nothing under the shortest. It follows
  // the slide instead, interpolated across the swipe so the page moves with
  // the finger rather than jumping when the snap lands, and re-measured
  // whenever a slide changes size — which the 한식 one does every time a
  // category opens.
  const deckRef = useRef(null);
  // Read by the timer below, which must not restart every time this changes:
  // a reader swiping the rail themselves is not a reason to reset the clock.
  const deckPos = useRef(0);
  const [deckAt, setDeckAt] = useState(0);
  const [deckH, setDeckH] = useState(null);
  useLayoutEffect(() => {
    const el = deckRef.current;
    if (!el) return undefined;
    let frame = 0;
    const measure = () => {
      const sl = el.children;
      if (sl.length < DECK_SLIDES) return;
      // The slides are read off the rail rather than collected into a ref
      // array. An inline ref callback is a new function every render, so
      // React detaches and re-attaches it each time, and a measurement that
      // landed in that window read null, skipped the write, and left the rail
      // at whatever height it had on first paint — 825px against a hero that
      // had settled to 758. The children are always there.
      // The content, not the slide. A slide is stretched to the rail's own
      // height so it has room to centre in, so measuring one would be reading
      // back the number this function just wrote — and adding a centimetre to
      // it every frame.
      const heights = Array.from(sl, c => c.firstElementChild?.offsetHeight ?? 0);
      const h = railTallest(heights, DECK_EXTRA);
      if (h !== null) setDeckH(h);
      const i = railIndex(el.scrollLeft, el.clientWidth, DECK_SLIDES);
      deckPos.current = i;
      setDeckAt(i);
    };
    // One measurement per frame at most: a swipe fires scroll far faster than
    // the page can be laid out, and every one of these reads offsetHeight.
    // Only the label row moves with a swipe now — the height is one number
    // for all three slides and changes only when a slide resizes.
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; measure(); });
    };
    // A vertical wheel over the rail scrolls the page, not the rail.
    //
    // Chrome turns a vertical wheel into horizontal scrolling whenever it
    // lands on something that scrolls sideways and not up and down, which is
    // exactly this. Measured on 2026-09-07 at 1280px: four notches down over
    // the middle of the page moved the page 0px and the rail 1100 — the whole
    // way to the last screen. The rail is most of what is on screen at the
    // top, so for a reader that is the page refusing to scroll unless the
    // cursor is out in the margin, which is how it was reported.
    //
    // Only when the gesture is more vertical than horizontal, so a trackpad
    // swiped sideways still turns the rail. passive: false because this has
    // to be able to say no.
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const scroller = el.closest('.content-region') ?? document.scrollingElement;
      if (!scroller) return;
      // deltaMode is pixels almost everywhere, lines on some Windows mice and
      // pages on a few. Left unconverted, a line becomes a pixel and the page
      // barely moves.
      const step = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      e.preventDefault();
      // App.jsx keeps a wheel handler on the document that does the opposite
      // on purpose — it walks up from the target and turns a vertical wheel
      // into sideways scrolling for whichever row the cursor is over, which
      // is what makes the small dish rails usable. This rail is not a small
      // row, and without stopping here that handler runs on the same event
      // and nudges it sideways underneath a page that is already scrolling;
      // scroll-snap then drags it back, or past, depending on how much was
      // asked for. One event, one answer.
      e.stopPropagation();
      scroller.scrollTop += e.deltaY * step;
    };

    measure();
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    // The rail itself is not observed: its height is set from this callback,
    // so watching it would be watching its own output. A slide is 100% of the
    // rail, so a width change still arrives through them.
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    // The content again, for the same reason: a slide's own height is fixed
    // now, so a category opening inside one would never reach the observer.
    for (const child of el.children) if (child.firstElementChild) ro?.observe(child.firstElementChild);
    // A webfont landing rewraps the headline and changes the first slide's
    // height. The observer catches that; this is the belt to its braces,
    // because first paint is the one height nobody scrolls away from.
    document.fonts?.ready?.then(measure).catch(() => {});
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
      ro?.disconnect();
    };
  }, []);
  // scrollTo on the rail, never scrollIntoView.
  //
  // scrollIntoView with block: 'nearest' leaves the page alone only while the
  // rail is still on screen. Once a reader has scrolled down past it,
  // "nearest" means bringing it back — so every four seconds the page hauled
  // itself to the top while somebody was reading further down. Reported on
  // 2026-09-07 as the window forcing its way back up, and it is the rail's
  // business to turn, not the page's to move.
  //
  // The direction has to be worked out here instead, which is the one thing
  // scrollIntoView was doing for free: an Arabic layout starts at scrollLeft
  // 0 on the right and counts down into negatives going left. railFraction
  // reads the same offset back through Math.abs.
  //
  // `jump` skips the animation. It is for the silent half of the loop —
  // stepping off the copy of the first screen and onto the real one, which
  // must not be seen — see railLoopStep.
  const goDeck = (i, jump = false) => {
    // Said here rather than waited for, so the label answers the press at once.
    deckPos.current = i;
    setDeckAt(i);
    const el = deckRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    el.scrollTo({
      left: rtl * i * el.clientWidth,
      behavior: (jump || reducedMotion) ? 'auto' : 'smooth',
    });
  };

  // The rail turns itself, and keeps turning. Asked for on 2026-09-07: the
  // pause is the only thing that stops it. Somebody who swipes back to a
  // screen they wanted is not interrupting anything and is not answered —
  // the next turn simply comes from wherever they left it.
  //
  // Which is why this is a steady interval and not the timeout-per-step it
  // was at first: that one restarted the clock every time the position
  // changed, and therefore every time anybody touched the rail. The position
  // is read from a ref for the same reason — as a dependency it would tear
  // the interval down and build it again on every turn.
  //
  // Never under prefers-reduced-motion.
  //
  // `playing` is the hero carousel's, shared rather than copied. Both are the
  // page moving on its own, and giving each its own switch put two pause
  // buttons thirty pixels apart with nothing to say which stopped what. One
  // idea, one state: press either and the page holds still.
  const deckTurning = playing && !reducedMotion;
  useEffect(() => {
    if (!deckTurning) return undefined;
    const id = setInterval(() => {
      const { reset, to } = railLoopStep(deckPos.current, DECK_SLIDES);
      if (!reset) { goDeck(to); return; }
      // Standing on the copy. Put the rail back on the real first screen with
      // no animation — the two are the same picture, so there is nothing to
      // see — and carry on forward from there a frame later, so the browser
      // paints the jump instead of folding both moves into one long scroll
      // back the way it came.
      goDeck(0, true);
      requestAnimationFrame(() => goDeck(to));
    }, DECK_MS);
    return () => clearInterval(id);
  }, [deckTurning]);   // eslint-disable-line react-hooks/exhaustive-deps
  const deckLabels = [
    // Was 소개 until the tab took that name on 2026-09-07. This screen is
    // the brand and the promise, so it carries the name.
    say('Eatple', '밥친구', 'Eatple', 'Eatple', 'Eatple', 'Eatple', 'Eatple'),
    say('Korean food', '한식', 'Comida coreana', 'Cuisine coréenne', 'الطعام الكوري', '韩餐', '韓国料理'),
    say('Safety', '안전', 'Seguridad', 'Sécurité', 'الأمان', '安全', '安全'),
    say('Instagram', '인스타그램', 'Instagram', 'Instagram', 'إنستغرام', 'Instagram', 'Instagram'),
  ];

  // Drawn twice: once at the top for real, and once as the last child of the
  // rail so that coming back round to it is a step forward. Held here rather
  // than written out twice, so the two can never drift apart — the copy has
  // to be the same picture down to which dish the blobs are showing, or the
  // silent jump back would be a visible one.
  const heroScreen = (
    <header className="main-hero">
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
            setting, where a 44px Korean headline was the single loudest
            thing the language setting failed to touch.

            It used to make a claim about what a shop will serve one person.
            That claim is false for 10 of the 24 dishes in
            src/domain/catalog/menus.js, so the sentence stopped being
            about the shop and became about the reader's own past: the
            dishes they walked by, because they were on their own. Nothing
            here says a dish was unavailable, which is what keeps it true of
            bibimbap as well as of samgyeopsal.

            Every line is measured, not guessed — scripts/measure-hero.mjs
            renders these seven in the shipping stylesheet at 44px in a
            320px box and fails if any line is wider. Three of the outgoing
            seven were over: English wrapped to four lines, French to six,
            Japanese to four. Do not edit a line here without re-running it.

            French is the one language with no second person in it. Spanish
            gets `dejaste`, Korean 지나쳤던, English "you walked by" — but
            every French finite-verb construction that names the dishes runs
            325-413px on its own line, so the reader is carried by the
            singular `tout seul`, which cannot agree with the plural
            `plats`. Measured, not preferred. */}
        <h1 className="main-hero__title main-hero__title-kr" translate="no">
          혼자라서
          <br />지나쳤던
          <br />음식들.
        </h1>
        <h1 className="main-hero__title l-en-only">
          {say(
            <>The dishes<br />you walked by<br />when alone.</>,
            null,
            <>Al ir solo,<br />dejaste pasar<br />esos platos.</>,
            <>Les plats<br />vus en passant<br />tout seul.</>,
            <>أطباق<br />مررتَ بها<br />وأنت وحدك.</>,
            <>那些菜，<br />一个人的时候<br />你只是路过。</>,
            <>ひとりだから<br />素通りしてきた<br />料理です。</>,
          )}
        </h1>
        {/* Prose gets a line per language rather than one line carrying
            both, which is how the notice bar has always done it. A
            sentence with 밥친구 sitting inside an English clause cannot be
            reduced by any splitter — it has to be written twice.

            2026-09-03: used to open with "삼겹살은 2인분부터, 감자탕은 냄비째
            나옵니다" — the same two facts the hero blobs already carry as
            tags, three lines above, on the dishes named 삼겹살 and 감자탕
            themselves. Said once there is enough; here it can go straight
            to the thing the blobs cannot say, which is what the app does
            about it. */}
        <p className="main-hero__sub main-hero__sub-kr" translate="no">
          밥친구 잇플이 그 밥상과, 이미 가고 있는 사람들을 찾아드려요.
        </p>
        <p className="main-hero__sub main-hero__sub-en">
          {say(
            'Eatple finds you the table — and the people already going.',
            null,
            'Eatple te encuentra la mesa — y a la gente que ya va.',
            'Eatple vous trouve la table — et les gens qui y vont déjà.',
            'يجد لك Eatple المائدة — ومن هم ذاهبون إليها أصلًا.',
            'Eatple 替你找到那张饭桌——还有已经要去的人。',
            'Eatple がその食卓と、すでに行く人たちを見つけます。',
          )}
        </p>
        {/* The middot pairs are Korean-and-English, so a Spanish screen
            would keep the English half. These three carry the whole
            journey — see the tables, open one, join — so they are worth
            the explicit third string rather than a fallback. */}
        {/* 이번 주 밥상 보기 stood here and was taken out on 2026-09-07 at
            the team's word. The deck above the rail now asks the question
            this button answered, and answers it with the reader's own
            picks rather than with the whole week: the tables it opens are
            the tables for what they just chose. 밥상 is still one tap away
            on the bar, and 상 차리기 below is untouched. */}
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
  );

  return (
    <section
      className={`main-tab${stickyShown ? ' main-tab--sticky' : ''}`}
      aria-label={say('Eatple home', '밥친구 메인', 'Inicio de Eatple', "Accueil d'Eatple", 'الصفحة الرئيسية لـ Eatple', 'Eatple 首页', 'Eatple のホーム')}
    >


      {/* ---- The three screens at the top, on one rail ----

              Asked for on 2026-09-07 in those words: swipe the top screen,
              and have the sections under it come round in turn. The hero,
              the six categories and what keeps a table safe are one
              horizontal rail now instead of three stops on the way down.

              Nothing was rewritten to get here — the three blocks are the
              blocks that were already on the page, moved. Everything else
              keeps its order below, including "밥친구가 이루어지는 방식",
              which its own note requires to sit directly after the hero and
              outside it: the blobs are pinned to the hero's bottom edge, and
              anything that moves that edge lands 족발 on whatever is next.
              It still does — the rail is outside the hero too.

              What this costs, said plainly: two of the three are now behind
              a swipe rather than a scroll, and the safety one is the half
              somebody most needs and least looks for. That is what the label
              row under the rail is for — the same answer the dish sheet
              reached (index.css, .dish-tabs), where a sideways deck with no
              labels is content nobody knows is there. Below the rail rather
              than above it, so the headline is still the first thing on the
              page. Measured cost of that choice on a 375px phone: the row
              sits 93px under the fold — the content area is 751px and the
              rail is 796 — so it takes a nudge of scroll to appear, and the
              swipe on the hero itself is the other way in. ---- */}
      <div
        className="main-deck"
        ref={deckRef}
        style={deckH ? { height: `${deckH}px` } : undefined}
        role="group"
        aria-label={say(
          'The top of the page, in three screens',
          '맨 위 세 화면',
          'La parte de arriba, en tres pantallas',
          'Le haut de la page, en trois écrans',
          'أعلى الصفحة في ثلاث شاشات',
          '页面顶部的三个画面',
          'ページ上部の三つの画面',
        )}
      >
        <div
          className="main-deck__slide"
          role="group"
          aria-label={deckLabels[0]}
        >
          {/* ---- Hero. Meetup's phone and desktop heroes are different
                  layouts, not one squeezed: the phone puts headline, then CTA,
                  then one big collage blob under it; the desktop floats four
                  blobs around a huge centred headline. The copy comes first in
                  the DOM so the phone's natural flow is already Meetup's order,
                  and the desktop lifts the blobs out with position:absolute
                  where DOM order stops mattering. ---- */}
          {heroScreen}
        </div>
        <div
          className="main-deck__slide"
          role="group"
          aria-label={deckLabels[1]}
        >
          {/* ---- The six groups: matching starts by naming what you came
                  to eat. Each card opens, in place, onto the four dishes under
                  it — the same taxonomy the map's dots and the register filter
                  run on, from the same file.

                  Merged 2026-09-04 with the dish shelf that used to be its own
                  band below "이번 주". Two sections were offering the same
                  twenty-four dishes under two different organisations, and the
                  one further down offered them as a flat wall of twenty-four
                  with no way to see which four belonged together.

                  Pressing a card no longer jumps to the tables screen. It opens
                  a panel that takes a whole grid row of its own, directly under
                  the row the card is in — so the cards below move down rather
                  than being covered, and the reader keeps their place. The jump
                  is a button inside that panel, and there is a second one for a
                  single dish: the category, then the dish, then the tables. ---- */}
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
            {/* The old dish band's heading, kept as this one's subtitle: the
                headline above says why, this says what the six cards are for. */}
            <p className="main-groups__sub">
              <span className="main-groups__sub-kr" translate="no">한식 살펴보기</span>
              <span className="main-groups__sub-en">
                {say('Browse Korean food', null, 'Explora la comida coreana', 'Parcourir la cuisine coréenne', 'تصفّح الطعام الكوري', '看看韩国菜', '韓国の料理を見てみる')}
              </span>
            </p>
            <div className="main-groups" ref={groupsRef} role="group" aria-label={say('Pick a kind of food', '음식 종류 고르기', 'Elige un tipo de comida', 'Choisissez un type de plat', 'اختر نوع الطعام', '选一种吃的', '食べたいものを選ぶ')}>
              {DISH_GROUPS.map((g, i) => {
                const isOpen = openGroup === g.id;
                const name = say(g.en, g.ko, g.es, g.fr, g.ar, g.zh, g.ja);
                // The panel belongs after the last card of the row the open card
                // is in, not after the card itself — a full-width item placed
                // mid-row would push the rest of that row down with it. The
                // column count is read off the grid rather than assumed, because
                // it is two on a phone and three from 768px up.
                const openIdx = DISH_GROUPS.findIndex(x => x.id === openGroup);
                const endsRow = (i + 1) % cols === 0 || i === DISH_GROUPS.length - 1;
                const panelHere = openIdx >= 0 && endsRow
                  && Math.floor(openIdx / cols) === Math.floor(i / cols);
                const og = panelHere ? DISH_GROUPS[openIdx] : null;
                const picked = openGroupDish ? menuById(openGroupDish) : null;
                return (
                  <React.Fragment key={g.id}>
                    <button
                      type="button"
                      className={`main-group${isOpen ? ' is-open' : ''}`}
                      style={{ '--tint': g.tint }}
                      aria-expanded={isOpen}
                      aria-controls={`main-group-panel-${g.id}`}
                      onClick={() => { setOpenGroup(isOpen ? null : g.id); setOpenGroupDish(null); }}
                    >
                      <span className="main-group__emoji" aria-hidden="true">{g.emoji}</span>
                      <span className="main-group__name">{name}</span>
                      {/* Korean always — it is what the sign says and what a
                          traveller points at. The romanisation and the plain
                          description appear for everyone not reading in Korean. */}
                      <span className="main-group__dishes" translate="no" data-no-locale>{g.ko_dishes}</span>
                      <span className="main-group__rom l-en-only" translate="no">{romanDishes(g)}</span>
                      {/* This line said "grilled pork belly · grilled beef short rib"
                          to a Spanish, French, Arabic, Chinese or Japanese reader —
                          English, on a card with no other English on it, because it
                          was built from DISH_NAME[].en and that table has one
                          language. The catalogue has had all seven for every one of
                          the twenty-four dishes since 2026-09-02; the card was simply
                          reading the wrong table. Fixed 2026-09-03. */}
                      <span className="main-group__gloss l-en-only">{glossDishesIn(g, locale)}</span>
                      {/* Was "이 밥상 찾기 →", which is the button inside the panel
                          this opens now. A card that says "find" and then opens a
                          list instead is a card that lied. */}
                      <span className="main-group__go">
                        {say('See the four dishes', '요리 네 가지 보기', 'Ver los cuatro platos', 'Voir les quatre plats', 'انظر الأطباق الأربعة', '看这四道菜', '四つの料理を見る')}
                        <span className="main-group__caret" aria-hidden="true">▾</span>
                      </span>
                    </button>
                    {panelHere && og && (
                      <div className="main-group-panel" id={`main-group-panel-${og.id}`} style={{ '--tint': og.tint }}>
                        {/* Between the category and its dishes, which is where
                            somebody who wants K-BBQ rather than one particular
                            dish will look for it. */}
                        <button className="main-group-panel__go" type="button" onClick={() => onPickGroup?.(og.id)}>
                          {say('Find this table', '이 밥상 찾기', 'Buscar esta mesa', 'Trouver cette table', 'ابحث عن هذه المائدة', '找这桌', 'この食卓を探す')} →
                        </button>
                        <div className="main-group-panel__dishes" role="group" aria-label={say('Pick a dish', '요리 고르기', 'Elige un plato', 'Choisissez un plat', 'اختر طبقًا', '选一道菜', '料理を選ぶ')}>
                          {og.dishes.map(d => menuById(menuIdOfDish(d))).filter(Boolean).map(m => (
                            <button
                              key={m.id}
                              type="button"
                              className={`main-group-dish${openGroupDish === m.id ? ' is-on' : ''}`}
                              aria-pressed={openGroupDish === m.id}
                              onClick={() => setOpenGroupDish(openGroupDish === m.id ? null : m.id)}
                            >
                              <span className="main-group-dish__kr" translate="no" data-no-locale>{m.nameKo}</span>
                              <span className="main-group-dish__rom" translate="no">{m.romanization}</span>
                              <span className="main-group-dish__gloss">{dishGloss(m, locale)}</span>
                            </button>
                          ))}
                        </div>
                        {/* The same door one level narrower, once a dish is named.
                            Reading about it stays reachable here — the band this
                            merged into was the only way in. */}
                        {picked && (
                          <div className="main-group-panel__pick">
                            {/* The same pair the tile above uses, and for the
                                same reason: this line names the dish the button
                                beside it is about to go looking for, so it has to
                                be a name the reader can actually read. Korean on
                                a Korean screen, the romanisation everywhere else. */}
                            <span className="main-group-panel__pick-name">
                              <span className="main-group-panel__pick-kr" translate="no">{picked.nameKo}</span>
                              <span className="main-group-panel__pick-rom l-en-only" translate="no">{picked.romanization}</span>
                            </span>
                            <button className="main-group-panel__pick-go" type="button" onClick={() => onPickDish?.(picked.id)}>
                              {say('Find this table', '이 밥상 찾기', 'Buscar esta mesa', 'Trouver cette table', 'ابحث عن هذه المائدة', '找这桌', 'この食卓を探す')} →
                            </button>
                            <button className="main-group-panel__pick-read" type="button" onClick={() => setOpenDish(picked)}>
                              {say('Read about this dish', '이 요리 알아보기', 'Leer sobre este plato', 'En savoir plus sur ce plat', 'اقرأ عن هذا الطبق', '了解这道菜', 'この料理について読む')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
        <div
          className="main-deck__slide"
          role="group"
          aria-label={deckLabels[2]}
        >
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
        </div>
        <div
          className="main-deck__slide"
          role="group"
          aria-label={deckLabels[3]}
        >
          {/* ---- Where the rest of it is ----

                  Asked for on 2026-09-07: bring people to the curation. The
                  same ask ends Explore's reading, as a row-shaped card, and
                  that one stays — it is offered to somebody who has just
                  finished a story and wants another, which is a different
                  moment from this one. This is for the reader who never got
                  that far, which on a page measured at eight screens is most
                  of them.

                  Redrawn on 2026-09-09 ("디자인이 별로인 수준이 아니고 그냥
                  디자인이 없던데"), and the note is worth keeping: it was the
                  Explore card dropped into a slide the rail gives 714px to,
                  so it was a 158px white box with 500px of nothing under it —
                  the same white as every other card in the app, on a screen
                  whose only job is to make somebody want to leave for a
                  better one.

                  The direction comes from the mark. logo_eatple_project.jpg
                  is a seal: terracotta pressed into cream, a spoon curling
                  into a city gate. So this slide is the one place in the app
                  that is not white, and the code is presented as a stamp
                  rather than a thumbnail — which is also what the app's own
                  passport metaphor is made of.

                  Link first and code second, for the reason the Explore card
                  gives: nobody scans a code on the phone they are holding.
                  The code is for a laptop, and for holding the phone out to
                  somebody else, which is the point of a project about eating
                  together. The handle is printed inside Instagram's own code
                  image, so it is not set a second time in text. ---- */}
          <div className="main-band main-band--insta">
            <a
              className="insta-panel"
              href="https://instagram.com/eat.ple_project"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="insta-panel__eyebrow" translate="no">Instagram</span>
              <h2 className="insta-panel__title">
                <span className="insta-panel__kr" translate="no">더 있습니다,<br />인스타그램에</span>
                <span className="insta-panel__en">
                  {say('There is more of it on Instagram', null,
                    'Hay más en Instagram', 'Il y en a plus sur Instagram',
                    'هناك المزيد على إنستغرام', '更多在 Instagram 上', 'つづきは Instagram に')}
                </span>
              </h2>

              <span className="insta-panel__lede">
                {say('The dishes, the places, and what we found out about them',
                  '요리와 장소, 그리고 그것들에 대해 알아낸 것들',
                  'Los platos, los sitios y lo que averiguamos sobre ellos',
                  'Les plats, les adresses, et ce que nous avons appris sur eux',
                  'الأطباق والأماكن وما عرفناه عنها',
                  '菜、地方，以及我们打听到的事',
                  '料理と場所、そしてそれについて分かったこと')}
              </span>

              {/* The one flourish, and it is the mark's own idea: pressed
                  into the page rather than laid on it. */}
              <span className="insta-panel__stamp">
                <img
                  className="insta-panel__qr"
                  src="/images/eatple-instagram-qr.jpg"
                  /* The handle alone was the alt until 2026-09-10, and a
                     handle does not tell a screen reader that this is a code
                     to point a camera at. audit-i18n had been printing 1 for
                     it since the panel was built. */
                  alt={say(
                    'Instagram QR code for @eat.ple_project',
                    '인스타그램 @eat.ple_project QR 코드',
                    'Código QR de Instagram de @eat.ple_project',
                    'QR code Instagram de @eat.ple_project',
                    'رمز QR لحساب @eat.ple_project على إنستغرام',
                    'Instagram @eat.ple_project 的二维码',
                    'Instagram @eat.ple_project のQRコード',
                  )}
                  width="406"
                  height="420"
                  loading="lazy"
                  draggable={false}
                />
              </span>
              <span className="insta-panel__scan">
                {say('Point another phone at it and it opens.',
                  '다른 폰으로 찍으면 바로 열려요.',
                  'Apunta con otro móvil y se abre.',
                  'Visez-le avec un autre téléphone et ça s’ouvre.',
                  'وجّه هاتفًا آخر نحوه فيفتح.',
                  '用另一部手机扫一下就打开。',
                  '別のスマホで読み取ると開きます。')}
              </span>

              <span className="insta-panel__go">
                {say('Open Instagram', '인스타그램 열기', 'Abrir Instagram',
                  'Ouvrir Instagram', 'افتح إنستغرام', '打开 Instagram', 'Instagram を開く')}
                <span className="insta-panel__arrow" aria-hidden="true">→</span>
              </span>
            </a>
          </div>
        </div>
        {/* The copy. aria-hidden and inert together, so the whole of it —
            the headline, both buttons, the dish dots and their pause — is
            out of reach of a screen reader, the tab key and the mouse
            alike. It exists to be scrolled onto and then quietly left. */}
        <div className="main-deck__slide" aria-hidden="true" inert>
          {heroScreen}
        </div>
      </div>

      {/* The rail's table of contents, its position indicator and its
          controls, in one row — a phone gets no hover and no scrollbar, so
          without this the second and third screens are a rumour. */}
      <div className="main-deck__tabs">
        {deckLabels.map((label, i) => (
          <button
            key={i}
            type="button"
            className="main-deck__tab"
            aria-current={i === deckAt % DECK_COUNT ? 'true' : undefined}
            onClick={() => goDeck(i)}
          >
            {label}
          </button>
        ))}
        {/* WCAG 2.2.2: content that starts moving on its own and runs longer
            than five seconds needs a way to stop it. The hero's carousel
            carries the same control for the same reason. */}
        <button
          type="button"
          className="main-deck__play"
          aria-label={deckTurning
            ? say('Stop the screens turning', '자동 넘김 멈추기', 'Detener el paso automático',
              'Arrêter le défilement automatique', 'إيقاف التنقّل التلقائي', '停止自动切换',
              '自動切り替えを止める')
            : say('Turn the screens automatically', '자동 넘김 시작', 'Pasar automáticamente',
              'Faire défiler automatiquement', 'التنقّل تلقائيًا', '自动切换', '自動で切り替える')}
          onClick={() => setPlaying(v => !v)}
        >
          {deckTurning ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
        </button>
      </div>

      {/* ---- How it happens, moved up here 2026-09-03 from a band far down
              the page. Pilot feedback: too many things to read before
              landing on one to do, and a request to surface more of the page
              as something swiped through rather than scrolled past. Measured
              before and after on a 375px phone: the first step used to begin
              3,552px down the document and now begins at 777px.

              Directly after the hero and not inside it, which was the first
              attempt and does not work: on desktop `.main-hero__blobs` is
              `position: absolute; inset: 0` over the hero, and 보쌈 and 족발
              are pinned to its *bottom* (`.main-blob--2/--3 { bottom: 64px
              /84px }`). Growing the hero moves that bottom, so the two blobs
              landed on the new cards — 7,171px² of 족발 across the third one,
              its word over the money line. Sitting outside the hero, the
              blobs keep the coordinates they were drawn for and this keeps
              its place near the top: measured 0 overlapping pixels.

              The zigzag-and-curly-arrow layout this replaced was built for a
              fixed three-card spread, which a swipeable row cannot be (a card
              mid-swipe is not "at 42% from the left" the way an arrow needed
              it to be) — dropped rather than carried over. Same swipe-rail
              recipe as an open dish category's cards (index.css,
              .dish-row__panel .dish-grid): overflow-x + scroll-snap, no
              library. One row at every width; at 768px and up all three fit
              with nothing left to swipe. ---- */}
      <div className="main-how">
        <h2 className="main-how__label">
          <span className="main-how__label-kr" translate="no">밥친구가 이루어지는 방식</span>
          <span className="main-how__label-en">
            {say('How a table happens', null, 'Cómo nace una mesa', 'Comment naît une table', 'كيف تنشأ مائدة', '一张饭桌是怎么成的', '食卓はどう生まれるか')}
          </span>
        </h2>
        <div className="main-zig" role="group" aria-label={say('How a table happens, in three steps', '밥친구가 이루어지는 세 단계', 'Cómo nace una mesa, en tres pasos', 'Comment naît une table, en trois étapes', 'كيف تنشأ مائدة، في ثلاث خطوات', '一张饭桌是怎么成的，分三步', '食卓が生まれる三つの段階')}>
          {HOW_STEPS.map((s, i) => (
            <div key={s.id} className="main-zig__step">
              <span className="main-zig__num" aria-hidden="true">{i + 1}</span>
              <span className="main-zig__kr" translate="no">{s.kr}</span>
              {/* The Korean half was the step name and nothing else, so a Korean
                  reader got three labels and none of the sentences — see
                  content/howItWorks.js. The other six carry name and meaning
                  in one line already. */}
              <span className="main-zig__long-kr" translate="no">{s.krLong}</span>
              <span className="main-zig__en">{say(s.en, null, s.es, s.fr, s.ar, s.zh, s.ja)}</span>
            </div>
          ))}
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
