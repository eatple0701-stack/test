import React, { useState } from 'react';
import { menus } from '../domain/catalog/menus.js';
import { isMember } from '../domain/policy/access.js';
import { HOW_STEPS, HOW_WHY } from '../content/howItWorks.js';
import { MAIN_PHOTOS } from '../content/mainPhotos.js';
import TablesLead from './TablesLead';
import DishSheet from './DishSheet';
import { ChevronRightIcon } from './Icons';

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
const HERO_BLOBS = [
  { word: '삼겹살', tone: 'b-orange', tag: '2인분부터' },
  { word: '감자탕', tone: 'b-green', tag: '냄비째 나옴' },
  { word: '보쌈', tone: 'b-brass', tag: '호스트가 안내' },
  { word: '족발', tone: 'b-pine', tag: '앱 결제 없음' },
];

// Tile accents, cycled through the dish shelf.
const TILE_TONES = ['t-brass', 't-green', 't-orange', 't-field'];

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
  const member = isMember(auth);

  return (
    <section className="main-tab" aria-label="밥친구 main">

      {/* ---- Hero: a big centred sentence with the dishes floating round
              it, the way Meetup floats its photographs. ---- */}
      <header className="main-hero">
        <div className="main-hero__blobs" aria-hidden="true">
          {HERO_BLOBS.map((b, i) => {
            const photo = MAIN_PHOTOS[i];
            return (
              <span key={b.word} className={`main-blob main-blob--${i} ${b.tone}`}>
                {photo
                  ? <img className="main-blob__img" src={photo.src} alt="" loading="lazy" />
                  : <span className="main-blob__word" translate="no">{b.word}</span>}
                <span className="main-blob__tag" translate="no">{photo?.label ?? b.tag}</span>
              </span>
            );
          })}
          <Squiggle className="main-hero__squiggle main-hero__squiggle--l" />
          <Squiggle className="main-hero__squiggle main-hero__squiggle--r" />
        </div>

        <div className="main-hero__copy">
          <span className="main-hero__kr" translate="no">밥친구 · Eatple</span>
          <h1 className="main-hero__title" translate="no">
            혼자서는
            <br />주문할 수 없는
            <br />음식들.
          </h1>
          <p className="main-hero__sub">
            Samgyeopsal starts at two servings and gamjatang arrives by the
            pot. 밥친구 finds you the table — and the people already going.
          </p>
          <button className="main-hero__cta" translate="no" onClick={() => onNavigate('match')}>
            이번 주 밥상 보기 · See this week&rsquo;s tables
          </button>
          <button className="main-hero__alt" translate="no" onClick={onCreateTable}>
            상 차리기 · Open a table <ChevronRightIcon size={14} />
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
        <h2 className="main-band__title">
          요리 살펴보기
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
          밥친구가 이루어지는 방식
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
        <p className="main-how__why">
          <strong translate="no">{HOW_WHY.kr}</strong> — {HOW_WHY.en}
        </p>
      </div>

      {/* ---- The giant join panel ---- */}
      {!member && (
        <div className="main-band">
          <div className="main-join">
            <span className="main-join__dot main-join__dot--a" aria-hidden="true" translate="no">밥</span>
            <span className="main-join__dot main-join__dot--b" aria-hidden="true" translate="no">상</span>
            <h2 className="main-join__title" translate="no">밥친구 가입하기</h2>
            <p className="main-join__body">
              둘러보기는 계정 없이도 됩니다 — 요리, 문화, 장소 전부요.
              Browsing is free; the seat is what an account is for, and
              joining is free too.
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
          <span className="main-culture__body">
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
          <span className="main-footer__brand" translate="no">밥친구<span className="main-footer__brand-dot">.</span> 같이 먹는 플랫폼</span>
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
            <span className="main-footer__soon">개인정보 처리방침 · 준비 중</span>
            <span className="main-footer__soon">이용약관 · 준비 중</span>
          </div>
        </div>
        <p className="main-footer__base" translate="no">
          © 2026 밥친구 · Eatple — 디지털 공공외교 파일럿 · a digital public diplomacy pilot
        </p>
      </footer>

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
