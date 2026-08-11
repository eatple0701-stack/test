import React, { useEffect, useState } from 'react';
import { menus } from '../domain/catalog/menus.js';
import { isMember } from '../domain/policy/access.js';
import { HOW_STEPS, HOW_WHY } from '../content/howItWorks.js';
import { MAIN_PHOTOS } from '../content/mainPhotos.js';
import TablesLead from './TablesLead';
import DishSheet from './DishSheet';
import { ChevronRightIcon, XIcon, PauseIcon, PlayIcon } from './Icons';

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
  { word: '삼겹살', roman: 'Samgyeopsal', tone: 'b-orange', tag: '2인분부터', tagEn: 'From two servings' },
  { word: '감자탕', roman: 'Gamjatang', tone: 'b-green', tag: '냄비째 나옴', tagEn: 'Comes by the pot' },
  { word: '보쌈', roman: 'Bossam', tone: 'b-brass', tag: '호스트가 안내', tagEn: 'Your host explains' },
  { word: '족발', roman: 'Jokbal', tone: 'b-pine', tag: '앱 결제 없음', tagEn: 'No in-app payment' },
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
  auth, profile, onNavigate, onOpenTable, onCreateTable, onOpenAuth,
}) {
  const [openDish, setOpenDish] = useState(null);
  // Whether the sticky join bar has been waved away. Component state, so it
  // lasts as long as this visit and no longer — see the bar's own comment.
  const [stickyClosed, setStickyClosed] = useState(false);
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
  const stickyShown = !member && !stickyClosed;

  return (
    <section
      className={`main-tab${stickyShown ? ' main-tab--sticky' : ''}`}
      aria-label="밥친구 main"
    >

      {/* ---- Hero. Meetup's phone and desktop heroes are different
              layouts, not one squeezed: the phone puts headline, then CTA,
              then one big collage blob under it; the desktop floats four
              blobs around a huge centred headline. The copy comes first in
              the DOM so the phone's natural flow is already Meetup's order,
              and the desktop lifts the blobs out with position:absolute
              where DOM order stops mattering. ---- */}
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
              setting, where a 64px Korean headline was the single loudest
              thing the language setting failed to touch. */}
          <h1 className="main-hero__title main-hero__title-kr" translate="no">
            혼자서는
            <br />주문할 수 없는
            <br />음식들.
          </h1>
          <h1 className="main-hero__title l-en-only">
            Some dishes
            <br />cannot be ordered
            <br />for one.
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
            Samgyeopsal starts at two servings and gamjatang arrives by the
            pot. Eatple finds you the table — and the people already going.
          </p>
          <button className="main-hero__cta" translate="no" onClick={() => onNavigate('match')}>
            이번 주 밥상 보기 · See this week&rsquo;s tables
          </button>
          <button className="main-hero__alt" translate="no" onClick={onCreateTable}>
            상 차리기 · Open a table <ChevronRightIcon size={14} />
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
                  <span className="l-en-only">{b.tagEn}</span>
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

      {/* ---- This week ---- */}
      <div className="main-band">
        <TablesLead
          onOpenTables={() => onNavigate('match')}
          onOpenTable={onOpenTable}
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
          <span className="main-band__title-en">The dishes this app is about</span>
        </h2>
        <div className="main-dishes__row" role="group" aria-label="Read about a dish">
          {menus.map((m, i) => (
            <button key={m.id} className={`main-dish ${TILE_TONES[i % TILE_TONES.length]}`} onClick={() => setOpenDish(m)}>
              <span className="main-dish__arrow" aria-hidden="true">↗</span>
              <span className="main-dish__kr" translate="no">{m.nameKo}</span>
              <span className="main-dish__en">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- How it happens: the zigzag with curly arrows ---- */}
      <div className="main-band main-band--how">
        <h2 className="main-band__title">
          <span className="main-band__title-kr" translate="no">밥친구가 이루어지는 방식</span>
          <span className="main-band__title-en">How a table happens</span>
        </h2>
        <div className="main-zig">
          {HOW_STEPS.map((s, i) => (
            <div key={s.id} className={`main-zig__step main-zig__step--${i}`}>
              <span className="main-zig__num" aria-hidden="true">{i + 1}</span>
              <span className="main-zig__kr" translate="no">{s.kr}</span>
              <span className="main-zig__en">{s.en}</span>
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
          <span className="main-how__why-en">{HOW_WHY.en}</span>
        </p>
      </div>

      {/* ---- The giant join panel ---- */}
      {!member && (
        <div className="main-band">
          <div className="main-join">
            <span className="main-join__dot main-join__dot--a" aria-hidden="true" translate="no">밥</span>
            <span className="main-join__dot main-join__dot--b" aria-hidden="true" translate="no">상</span>
            <h2 className="main-join__title main-join__title-kr" translate="no">밥친구 가입하기</h2>
            <h2 className="main-join__title l-en-only">Join Eatple</h2>
            <p className="main-join__body main-join__body-kr" translate="no">
              둘러보기는 계정 없이도 됩니다 — 요리, 문화, 장소 전부요.
              계정은 자리를 잡을 때 필요하고, 가입도 무료입니다.
            </p>
            <p className="main-join__body main-join__body-en">
              Browsing is free — the dishes, the culture, the places, all of
              it. The seat is what an account is for, and joining is free too.
            </p>
            <button className="main-join__cta" translate="no" onClick={() => onOpenAuth?.('signup')}>
              무료로 가입하기 · Join free
            </button>
          </div>
        </div>
      )}

      {/* ---- One door into the culture ---- */}
      <div className="main-band">
        <button className="main-culture" onClick={() => onNavigate('home')}>
          <span className="main-culture__kr" translate="no">문화</span>
          <span className="main-culture__label l-en-only">Culture</span>
          <span className="main-culture__body main-culture__body-kr" translate="no">
            한국이 어떻게 먹는지에 대한 일곱 가지 질문 — 계정 없이 전부 들어가
            볼 수 있어요.
          </span>
          <span className="main-culture__body main-culture__body-en">
            Seven questions about how Korea eats — each one free to walk into,
            no account.
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
          <span className="main-footer__brand l-en-only">Eatple<span className="main-footer__brand-dot">.</span> a table you share</span>
          <button className="main-footer__mastlink" translate="no" onClick={onCreateTable}>
            상 차리기 · Open a table →
          </button>
        </div>
        <div className="main-footer__cols">
          <div className="main-footer__col">
            <h3 className="main-footer__head">내 계정 · Account</h3>
            {member ? (
              <button className="main-footer__link" onClick={() => onNavigate('journal')}>여권 · Passport</button>
            ) : (
              <>
                <button className="main-footer__link" onClick={() => onOpenAuth?.('signup')}>회원 가입 · Join</button>
                <button className="main-footer__link" onClick={() => onOpenAuth?.('signin')}>로그인 · Sign in</button>
              </>
            )}
            <button className="main-footer__link" onClick={() => onNavigate('settings')}>설정 · Settings</button>
          </div>
          <div className="main-footer__col">
            <h3 className="main-footer__head">살펴보기 · Browse</h3>
            <button className="main-footer__link" onClick={() => onNavigate('match')}>밥상 · Tables</button>
            <button className="main-footer__link" onClick={() => onNavigate('places')}>장소 · Places</button>
            <button className="main-footer__link" onClick={() => onNavigate('home')}>문화 · Explore</button>
          </div>
          <div className="main-footer__col">
            <h3 className="main-footer__head">밥친구 · Team</h3>
            <a className="main-footer__link" href="mailto:eatple0701@gmail.com">eatple0701@gmail.com</a>
            {/* The middot here separates a page from its status, not two
                languages — "개인정보 처리방침 · 준비 중" is Korean on both
                sides of it. Written as halves so each setting gets a whole
                sentence instead of a splitter guessing wrong. */}
            <span className="main-footer__soon main-footer__soon-kr" translate="no">개인정보 처리방침 · 준비 중</span>
            <span className="main-footer__soon l-en-only">Privacy policy · in progress</span>
            <span className="main-footer__soon main-footer__soon-kr" translate="no">이용약관 · 준비 중</span>
            <span className="main-footer__soon l-en-only">Terms of use · in progress</span>
          </div>
        </div>
        <p className="main-footer__base main-footer__base-kr" translate="no">
          © 2026 밥친구 잇플 · Eatple — 디지털 공공외교 파일럿
        </p>
        <p className="main-footer__base main-footer__base-en">
          © 2026 Eatple — a digital public diplomacy pilot
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
            aria-label="닫기 · Dismiss"
            onClick={() => setStickyClosed(true)}
          >
            <XIcon size={16} />
          </button>
          <p className="main-sticky__text" translate="no">
            가입하고 이번 주 밥상에 앉아보세요 · Join and take a seat
          </p>
          <button className="main-sticky__cta" translate="no" onClick={() => onOpenAuth?.('signup')}>
            회원 가입 · Join free
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
