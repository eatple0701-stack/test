import React, { useState } from 'react';
import { menus } from '../domain/catalog/menus.js';
import { isMember } from '../domain/policy/access.js';
import { HOW_STEPS, HOW_WHY } from '../content/howItWorks.js';
import { MAIN_PHOTOS } from '../content/mainPhotos.js';
import TablesLead from './TablesLead';
import DishSheet from './DishSheet';
import { ChevronRightIcon } from './Icons';

// 메인 — the front door, added 2026-08-06 to the left of Explore.
//
// Styled on meetup.com/ko-KR's landing, which the team studied section by
// section: a hero that says what the product is, this-week events under a
// located heading, a big join panel, category tiles, a three-step "how it
// works", and a dark footer that holds the legal furniture. Referenced, not
// copied — every section here is filled with things this app already said
// somewhere, now said at the door.
//
// The one thing Meetup has that we do not is photography. MAIN_PHOTOS is the
// slot for it (the owner intends to supply photos); until it is non-empty the
// hero sets the dishes in type instead. Korean set large is not a placeholder
// aesthetic — the dish name is the product, and it is at least ours.

// Which dishes headline the hero, in type. Four, hand-picked for shape on a
// phone: two long, two short, all of them dishes that start at two servings.
const HERO_WORDS = ['삼겹살', '감자탕', '보쌈', '족발'];

// The chips pinned to the collage, each one a claim already made and kept
// elsewhere in the app — the hero may not say anything the product does not.
const HERO_CHIPS = [
  { kr: '2인분부터', en: 'Starts at two servings' },
  { kr: '호스트가 안내', en: 'Host walks you through' },
  { kr: '앱 결제 없음', en: 'No app payment' },
];

// Tile accents, cycled. Class names only — the colours live in the
// stylesheet where the themes can reach them.
const TILE_TONES = ['t-brass', 't-green', 't-orange', 't-field'];

export default function MainTab({
  auth, profile, onNavigate, onOpenTable, onCreateTable, onOpenAuth,
}) {
  const [openDish, setOpenDish] = useState(null);
  const member = isMember(auth);

  return (
    <section className="main-tab" aria-label="밥친구 main">

      {/* ---- Hero: what this is, over the dishes it is about ---- */}
      <header className="main-hero">
        <div className="main-hero__copy">
          <span className="main-hero__kr" translate="no">밥친구</span>
          <h1 className="main-hero__title">
            혼자서는 주문할 수 없는 음식들.
            <span className="main-hero__title-en">Dishes you cannot order alone.</span>
          </h1>
          <p className="main-hero__sub">
            삼겹살은 2인분부터, 감자탕은 냄비째 나옵니다. 밥친구는 그 상에
            같이 앉을 사람을 찾아줍니다 — a table, and the people already going.
          </p>
          <div className="main-hero__ways">
            <button className="main-hero__cta" translate="no" onClick={() => onNavigate('match')}>
              이번 주 밥상 보기 · See this week&rsquo;s tables
            </button>
            <button className="main-hero__alt" translate="no" onClick={onCreateTable}>
              상 차리기 · Open a table
            </button>
          </div>
        </div>

        {/* The collage. Photographs when the team has them (mainPhotos.js),
            the dishes set in type until then. */}
        <div className="main-hero__art" aria-hidden="true">
          {MAIN_PHOTOS.length > 0 ? (
            MAIN_PHOTOS.slice(0, 4).map(p => (
              <figure key={p.src} className="main-hero__photo">
                <img src={p.src} alt={p.alt ?? ''} loading="lazy" />
                {p.label && <figcaption className="main-hero__chip" translate="no">{p.label}</figcaption>}
              </figure>
            ))
          ) : (
            HERO_WORDS.map((word, i) => (
              <span key={word} className={`main-hero__word main-hero__word--${i}`} translate="no">
                {word}
              </span>
            ))
          )}
          <span className="main-hero__chips">
            {HERO_CHIPS.map(c => (
              <span key={c.kr} className="main-hero__chip" translate="no">
                {c.kr} · {c.en}
              </span>
            ))}
          </span>
        </div>
      </header>

      {/* ---- This week, the way Meetup heads its list with a place ---- */}
      <TablesLead
        onOpenTables={() => onNavigate('match')}
        onOpenTable={onOpenTable}
        profile={profile}
      />

      {/* ---- The join panel, for the person still deciding ---- */}
      {!member && (
        <div className="main-join">
          <h2 className="main-join__title">
            무료로 가입하기
            <span className="main-join__title-en">Join 밥친구</span>
          </h2>
          <p className="main-join__body">
            둘러보기는 계정 없이도 됩니다 — 요리, 문화, 장소 전부요. 가입은
            자리를 요청하고 상을 차릴 때 필요합니다. Browsing is free; the
            seat is what an account is for.
          </p>
          <button className="main-join__cta" translate="no" onClick={() => onOpenAuth?.('signup')}>
            무료로 가입하기 · Join free
          </button>
        </div>
      )}

      {/* ---- The dishes, as tiles — Meetup's 인기 카테고리 slot ---- */}
      <div className="main-dishes">
        <div className="main-section__head">
          <h2 className="main-section__title">
            요리 살펴보기
            <span className="main-section__title-en">The dishes this app is about</span>
          </h2>
        </div>
        <div className="main-dishes__row" role="group" aria-label="Read about a dish">
          {menus.map((m, i) => (
            <button key={m.id} className={`main-dish ${TILE_TONES[i % TILE_TONES.length]}`} onClick={() => setOpenDish(m)}>
              <span className="main-dish__kr" translate="no">{m.nameKo}</span>
              <span className="main-dish__en">{m.name}</span>
              <span className="main-dish__gloss">{m.gloss}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- How it works: the three steps, said at the door ---- */}
      <div className="main-how">
        <div className="main-section__head">
          <h2 className="main-section__title">
            밥친구가 이루어지는 방식
            <span className="main-section__title-en">How a table happens</span>
          </h2>
        </div>
        <ol className="main-how__steps">
          {HOW_STEPS.map((s, i) => (
            <li key={s.id} className="main-how__step">
              <span className="main-how__num" aria-hidden="true">{i + 1}</span>
              <span className="main-how__kr" translate="no">{s.kr}</span>
              <span className="main-how__en">{s.en}</span>
            </li>
          ))}
        </ol>
        <p className="main-how__why">
          <strong translate="no">{HOW_WHY.kr}</strong> — {HOW_WHY.en}
        </p>
      </div>

      {/* ---- One door into the culture, which Explore owns ---- */}
      <button className="main-culture" onClick={() => onNavigate('home')}>
        <span className="main-culture__kr" translate="no">문화</span>
        <span className="main-culture__body">
          Seven questions about how Korea eats — each one a culture you can
          walk into, free, no account.
        </span>
        <ChevronRightIcon size={16} />
      </button>

      {/* ---- The dark footer: the furniture every reference site has and
              this app never did. Also the reserved seat for the legal pages
              HANDOFF marks as required before the pilot — named, not linked,
              because linking to a page that does not exist is a lie with an
              underline. ---- */}
      <footer className="main-footer">
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
            {/* Required before the pilot; human-written, so held as a named
                seat rather than a dead link. */}
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
