import React, { useState, useEffect, useRef } from 'react';
import PlaceImage from './PlaceImage';
import PlaceCard from './PlaceCard';
import ErrorBoundary from './ErrorBoundary';
import { menuById } from '../domain/catalog/menus.js';
import { isPast } from '../domain/policy/table.js';
import { listTables } from '../data/tableRepository.js';
import {
  HeartIcon, CompassIcon, XIcon, ClockIcon, MapPinIcon, CrescentIcon,
  MildIcon, FermentIcon, SproutIcon, RecycleIcon, LeafIcon,
  BookIcon, BowlIcon, MenuIcon, TrainIcon, PhoneIcon, LinkIcon, CheckIcon, ShareIcon,
  ChevronRightIcon, SparkleIcon
} from './Icons';
import CulturalRoute from './CulturalRoute';
import { getCulture } from '../data/culture';
import { tipsFor } from '../data/journey';
import { restaurants } from '../data/restaurants';
import { tableCtaFor, mapLinksFor, transitLine, MAP_LINKS_NOTE } from '../domain/policy/venue.js';
import { featuredZones } from '../data/experiences';
import { haversineKm, formatDistance, getOpenStatus, todaysHours, directionsUrl, naverMapUrl, kakaoMapUrl, coordsOf } from '../utils';
import {
  dietaryBadges, isKnown, needsCheck, trustBadge, dietaryConfidence, CONFIDENCE, isQuarantined, TRUST_LABEL_KO, TRUST_LABEL_ES } from '../data/verification';
import { bookable } from '../domain/policy/cancellation.js';
import { useText, useLocale } from './localeText.js';

const TRAIT_META = {
  'Mild Taste': { Icon: MildIcon, label: 'Mild taste', labelKo: '맵지 않음', labelEs: 'Suave' },
  'Fermented': { Icon: FermentIcon, label: 'Fermented', labelKo: '발효', labelEs: 'Fermentado' },
  'Zero-waste': { Icon: RecycleIcon, label: 'Zero waste', labelKo: '제로웨이스트', labelEs: 'Sin residuos' },
  'Local Sourcing': { Icon: SproutIcon, label: 'Locally sourced', labelKo: '지역 재료', labelEs: 'Producto local' },
};

const DIETARY_ICON = { vegan: LeafIcon, halal: CrescentIcon };

// `kr` is the small Korean gloss that rides beside an English heading in the
// bilingual default. `ko` is the heading itself in Korean, for the
// Korean-only setting — and when that one is in use the gloss is dropped,
// because "현지 팁 · 현지 팁" is what happens otherwise.
function SectionHead({ Icon, title, ko, es, kr }) {
  const say = useText();
  const heading = say(title, ko, es);
  const glossed = kr && heading === title;
  return (
    <div className="section-head">
      <span className="section-head__icon" aria-hidden="true"><Icon size={17} /></span>
      <h3>{heading}{glossed && <span className="section-head__kr"> · {kr}</span>}</h3>
    </div>
  );
}

function Trust({ fact }) {
  const say = useText();
  const { label, tone, detail } = trustBadge(fact);
  // The tooltip stays in the language the evidence was written in: it quotes
  // a source line, and translating a quotation is not translating a label.
  return <span className={`trust trust--${tone}`} title={detail}>{say(label, TRUST_LABEL_KO[label], TRUST_LABEL_ES[label])}</span>;
}

const DIET_CAVEAT = {
  [CONFIDENCE.CONFIRMED]: {
    title: 'Confirmed with the restaurant.',
    titleKo: '식당에 확인했습니다.',
    titleEs: 'Confirmado con el restaurante.',
    body: 'The kitchen states this itself. Menus still change, so ask if you have a strict requirement.',
    bodyKo: '주방이 직접 밝힌 내용입니다. 그래도 메뉴는 바뀌니, 꼭 지켜야 하는 조건이 있다면 물어보세요.',
    bodyEs: 'Lo dice la propia cocina. Las cartas cambian igualmente, así que pregunta si tienes un requisito estricto.',
  },
  [CONFIDENCE.SUPPORTED]: {
    title: 'Reported, not confirmed.',
    titleKo: '전해 들었을 뿐, 확인은 못 했습니다.',
    titleEs: 'Según la fuente, sin confirmar.',
    body: `These details come from what the restaurant and our research describe. We haven't checked them in person — confirm with staff before ordering.`,
    bodyKo: '식당 소개와 저희 조사에서 가져온 내용입니다. 직접 가서 확인하지는 못했으니, 주문 전에 직원에게 물어보세요.',
    bodyEs: 'Estos datos vienen de lo que describen el restaurante y nuestra investigación. No los hemos comprobado en persona: confírmalo con el personal antes de pedir.',
  },
  [CONFIDENCE.INFERRED]: {
    title: 'Partly our own reading.',
    titleKo: '일부는 저희가 읽어 낸 것입니다.',
    titleEs: 'En parte es lectura nuestra.',
    body: 'Some of this we read from the kind of kitchen it is, or from how the venue describes itself — not from a stated fact. Treat it as a lead and ask staff before ordering.',
    bodyKo: '어떤 종류의 주방인지, 혹은 가게가 스스로를 어떻게 설명하는지에서 읽어 낸 부분이 있습니다. 명시된 사실이 아니에요. 단서로만 보시고 주문 전에 직원에게 확인하세요.',
    bodyEs: 'Parte de esto lo hemos deducido del tipo de cocina que es, o de cómo se describe el local — no de un dato declarado. Tómalo como una pista y pregunta al personal antes de pedir.',
  },
  [CONFIDENCE.UNKNOWN]: {
    title: 'No dietary information yet.',
    titleKo: '식단 정보가 아직 없습니다.',
    titleEs: 'Todavía no hay información de dieta.',
    body: `We haven't established what this kitchen serves, so we don't make a claim either way.`,
    bodyKo: '이 주방이 무엇을 내는지 아직 확인하지 못해서, 어느 쪽으로도 주장하지 않습니다.',
    bodyEs: 'No hemos establecido qué sirve esta cocina, así que no afirmamos nada en ninguna dirección.',
  },
};

// This screen used to catch its own crashes into a red full-bleed panel with
// a raw JavaScript stack on it, at z-index 9999 — a debugging aid that was
// still wired to production, where the person reading it is a traveller who
// tapped a restaurant. The app already has a crash screen written for exactly
// this: it explains the Chrome-translation conflict when that is what
// happened, says nothing saved was lost, offers a way back, and keeps the
// stack in a details element for whoever wants it.
//
// So the local boundary is gone and ErrorBoundary wraps this screen instead.
// One crash treatment for the whole app, and it is the kind one.
export default function RestaurantDetail(props) {
  return (
    <ErrorBoundary>
      <RestaurantDetailInner {...props} />
    </ErrorBoundary>
  );
}

function RestaurantDetailInner({
  restaurant, onClose, isBookmarked, onToggleBookmark, isVisited, onToggleVisited,
  mapCenter, focusStory, onOpenRestaurant, onExploreZone, bookmarkedIds = [],
  onOpenTableHere, onOpenTable, onNavigate,
}) {
  const say = useText();
  const locale = useLocale();
  // Tables already happening at this restaurant. Read the same way every
  // other screen reads them, so the Supabase swap reaches here for free.
  const [tablesHere, setTablesHere] = useState([]);

  // This component renders before `restaurant` exists — the hook has to run
  // on every render, so it cannot assume the prop is there.
  const restaurantName = restaurant?.name;

  useEffect(() => {
    if (!restaurantName) { setTablesHere([]); return undefined; }
    let alive = true;
    const key = restaurantName.split('(')[0].trim().toLowerCase();
    (async () => {
      const all = bookable(await listTables());
      const here = all.filter(t =>
        !isPast(t) && t.restaurant && t.restaurant.trim().toLowerCase() === key);
      if (alive) setTablesHere(here);
    })();
    return () => { alive = false; };
  }, [restaurantName]);

  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const storyRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    setCopied(false);
    setShared(false);
    if (!restaurant) return;
    if (focusStory && storyRef.current) {
      storyRef.current.scrollIntoView({ block: 'start' });
    } else {
      sheetRef.current?.focus();
    }
  }, [restaurant, focusStory]);

  useEffect(() => {
    if (!restaurant) return undefined;
    const onKey = (e) => { 
      if (e.key === 'Escape') {
        if (galleryOpen) {
          e.stopPropagation();
          setGalleryOpen(false);
        } else {
          onClose(); 
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [restaurant, onClose, galleryOpen]);

  // An arrow-key listener used to live here, left over from when the gallery
  // was a carousel. Both handlers read `setGalleryIdx(i => i === 0 ? 0 : 0)`
  // — every branch returning the same index — so pressing left or right did
  // nothing except re-render, and galleryIdx was never read to choose an
  // image. The gallery is a single-image lightbox now; Escape still closes
  // it, in the effect above.

  if (!restaurant) return null;

  const name = restaurant.name.split('(')[0].trim();
  // Both derived from the venue rather than fixed — see venue.js for why a
  // bakery must not be offered 상 차리기, and why no review is quoted here.
  const tableCta = tableCtaFor(restaurant, locale);
  const mapLinks = mapLinksFor(restaurant);
  const transit = transitLine(restaurant);
  const status = getOpenStatus(restaurant.hours);
  const today = todaysHours(restaurant.hours);
  const culture = getCulture(restaurant);
  const coords = coordsOf(restaurant);
  const distance = mapCenter
    ? formatDistance(haversineKm(mapCenter[0], mapCenter[1], coords.lat, coords.lng))
    : null;

  // Same-category places elsewhere — the closest thing to "related foods"
  // that doesn't require inventing dish data we don't have.
  const relatedPlaces = restaurants
    .filter(r => r.id !== restaurant.id && r.category === restaurant.category && !isQuarantined(r))
    .slice(0, 6);
  const zoneInfo = featuredZones.find(z => z.zone === restaurant.zone);

  // Spread rather than pick three fields: the badge already carries its own
  // translations, and naming them here is how labelEs got dropped once.
  const dietFacts = dietaryBadges(restaurant).map(b => ({ ...b, Icon: DIETARY_ICON[b.key] }));
  const traitFacts = restaurant.traits.map(t => TRAIT_META[t]).filter(Boolean).map(t => ({ ...t, fact: null }));
  const facts = [...dietFacts, ...traitFacts];
  const certClaim = restaurant.dietary?.halalCertClaim;
  const caveat = DIET_CAVEAT[dietaryConfidence(restaurant)] ?? DIET_CAVEAT[CONFIDENCE.UNKNOWN];
  const lastChecked = [
    restaurant.coordinates, restaurant.address, restaurant.hours, restaurant.menus,
    restaurant.phone, restaurant.officialUrl, restaurant.instagram, restaurant.transit,
    restaurant.dietary?.vegan, restaurant.dietary?.halal,
  ].map(f => f?.lastCheckedAt).filter(Boolean).sort().at(-1);

  const galleryImages = [restaurant.photo || restaurant.coverImage || restaurant.image].filter(Boolean);

  const fallbackCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  };

  const handleCopy = async () => {
    let ok = false;
    const address = restaurant.address.value;
    try {
      await navigator.clipboard.writeText(address);
      ok = true;
    } catch {
      ok = fallbackCopy(address);
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareText = `${restaurant.name} — ${restaurant.vibe}`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: restaurant.name, text: shareText, url: shareUrl });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch { }
    } else {
      const text = `${shareText}\n${shareUrl}`;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = fallbackCopy(text); }
      if (ok) {
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    }
  };

  return (
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <div className="detail-sheet" role="dialog" aria-modal="true" aria-label={name} ref={sheetRef} tabIndex={-1}>
        <button className="detail-close" aria-label={say('Close', '닫기', 'Cerrar')} onClick={onClose}>
          <XIcon size={18} />
        </button>

        <div className="detail-scroll">
          {/* 1. Hero Image */}
          <PlaceImage place={restaurant} variant="hero" onClick={() => setGalleryOpen(true)} />

          <div className="detail-content">
            {/* 2. Restaurant Name */}
            <header className="detail-header">
              <h2>{restaurant.name}</h2>
              <p className="detail-meta">
                {restaurant.zone}
                {distance && <><span aria-hidden="true"> · </span>{distance}</>}
              </p>
            </header>

            {/* 3. Diet Tags */}
            {facts.length > 0 && (
              <ul className="fact-row" aria-label={say('Dietary and dining facts', '식단과 식사 정보', 'Datos de dieta y de mesa')}>
                {facts.map(({ Icon, label, labelKo, labelEs, fact: f }) => (
                  <li key={label} className="fact">
                    <Icon size={16} aria-hidden="true" /> {say(label, labelKo, labelEs)}
                    {f && <Trust fact={f} />}
                  </li>
                ))}
              </ul>
            )}

            <div className="diet-note">
              <p>
                <strong>{say(caveat.title, caveat.titleKo, caveat.titleEs)}</strong>
                {' '}{say(caveat.body, caveat.bodyKo, caveat.bodyEs)}
              </p>
              {certClaim && (
                <p className="diet-note__cert">
                  {say(`Certification claimed: ${certClaim.body} — we have not sighted the certificate.`,
                    `인증을 주장합니다: ${certClaim.body} — 저희가 인증서를 직접 확인하지는 못했습니다.`,
                    `Certificación declarada: ${certClaim.body} — no hemos visto el certificado.`)}
                </p>
              )}
            </div>

            {/* Everything you can DO with this place, at the top of it.
                Measured on the live site 2026-08-04: this block used to live
                inside Nearby Experiences, 6.2 to 6.5 screens down a page 8.7
                screens tall, behind the food story, the etiquette, the
                phrases and the route. It was reported as "반영이 안 된 거
                같다" — which was the right read. A control nobody scrolls to
                is not a control. Reading about the kitchen can wait below;
                saving it, opening a table at it, and checking what people
                say about it cannot. */}
            <div className="place-actions">
              <div className="place-actions__row">
                {/* Two words for one thing was the bug: this said "In
                    Passport" and the list it fills was titled "Saved for
                    Later", eight screens apart. Both are 저장한 곳 now, and
                    the button says where the place went rather than only
                    that something happened. */}
                <button
                  className={`btn-secondary${isBookmarked ? ' is-active' : ''}`}
                  onClick={() => onToggleBookmark(restaurant.id)}
                >
                  <HeartIcon size={16} filled={isBookmarked} />
                  {isBookmarked
                    ? say('저장됨 · Saved', null, 'Guardado')
                    : say('저장하기 · Save this place', null, 'Guardar este sitio')}
                </button>
              </div>
              {isBookmarked && (
                <button className="saved-receipt" onClick={() => onNavigate?.('journal')}>
                  패스포트 › 저장한 곳에 있어요 · Find it under Saved places in your Passport
                </button>
              )}

              {/* The one thing this app does, offered from the place it
                  would happen. "Meet Travelers" used to sit here and go to
                  a swipe deck that no longer exists; before that the whole
                  Places half of the app had no route into a table at all,
                  which left eighteen restaurants sitting outside the
                  product looking in. */}
              {onOpenTableHere && (
                <button className="place-table-cta" onClick={() => onOpenTableHere(restaurant)}>
                  {/* Worded from the venue's own category rather than fixed:
                      상 차리기 is *setting a table*, which is the wrong event
                      at a bakery. See src/domain/policy/venue.js. */}
                  <span className="place-table-cta__title">{tableCta.title}</span>
                  <span className="place-table-cta__sub">{tableCta.sub}</span>
                </button>
              )}

              {tablesHere.length > 0 && (
                <div className="place-tables">
                  <p className="place-tables__label">
                    {tablesHere.length === 1 ? 'A table here' : `${tablesHere.length} tables here`}
                  </p>
                  {tablesHere.map(t => (
                    <button key={t.id} className="place-tables__row" onClick={() => onOpenTable?.(t.id)}>
                      <span className="place-tables__dish">{menuById(t.menuId)?.name ?? t.menuId}</span>
                      <span className="place-tables__when">{t.date} · {t.time}</span>
                      <ChevronRightIcon size={14} />
                    </button>
                  ))}
                </div>
              )}

              {/* Reviews, without pretending we have any.
                  The 8/4 review asked for Google/Naver/Kakao reviews inline.
                  Naver and Kakao publish no review text through their APIs,
                  Google's terms forbid re-rendering theirs, and scraping is
                  not something this project will do. So the place is handed
                  over instead — one tap into the app where the reviews, the
                  photos and the walking directions already live. */}
              {mapLinks.length > 0 && (
                <div className="map-links">
                  <p className="map-links__note">
                    <strong>{MAP_LINKS_NOTE.kr}</strong> {say(MAP_LINKS_NOTE.en, null, MAP_LINKS_NOTE.es)}
                  </p>
                  <div className="map-links__row">
                    {mapLinks.map(link => (
                      <a
                        key={link.id}
                        className={`map-links__btn map-links__btn--${link.id}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.kr} · {link.en}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* How you actually get here, said in one line rather than left
                  for the Location section eight screens down. The station and
                  the walk were already in the data and only ever appeared in
                  English inside Quick Info. */}
              {transit && (
                <p className="place-actions__transit">
                  <strong>{transit.kr}</strong> {transit.en}
                </p>
              )}
            </div>

            {/* Quick Info — hours, transit, phone, links, save/visit/share */}
            <section className="detail-section">
              <SectionHead Icon={ClockIcon} title="Quick Info" ko="기본 정보" es="Información básica" />
              <div className="practical">
                <div className="practical-row">
                  <ClockIcon size={17} />
                  {status ? (
                    <span>
                      <strong className={status.open ? 'is-open' : 'is-closed'}>{status.label}</strong>
                      {' '}· {status.detail}{' '}
                      {today && <span className="practical-muted">(today {today})</span>}
                    </span>
                  ) : (
                    <span className="practical-muted">
                      {say('Opening hours unknown — check before you go', '영업시간을 알 수 없습니다 — 가시기 전에 확인하세요', 'Horario desconocido: compruébalo antes de ir')}
                    </span>
                  )}
                </div>

                {isKnown(restaurant.transit) && (
                  <div className="practical-row">
                    <TrainIcon size={17} />
                    {/* Each piece gets its own element rather than sitting as
                        a bare text node beside its siblings.

                        This app is read by people whose browsers offer to
                        translate it, and Chrome's translator does not edit
                        text in place — it replaces each text node with a
                        <font> wrapper. React still holds the original node,
                        so when it later removes one it calls removeChild on
                        something that is no longer a child, and the whole
                        screen dies with NotFoundError. Removing an *element*
                        survives that, because the element itself is still
                        where React left it. */}
                    <span>
                      <span>{restaurant.transit.value.station}</span>{' '}
                      <span>{restaurant.transit.value.line}</span>
                      {restaurant.transit.value.exit && (
                        <span>, exit {restaurant.transit.value.exit}</span>
                      )}
                      <span> · {restaurant.transit.value.walkingMinutes} min walk</span>
                    </span>
                  </div>
                )}

                {isKnown(restaurant.phone) && (
                  <div className="practical-row">
                    <PhoneIcon size={17} />
                    <a className="practical-link" href={`tel:${restaurant.phone.value.replace(/-/g, '')}`}>
                      {restaurant.phone.value}
                    </a>
                  </div>
                )}

                {(isKnown(restaurant.officialUrl) || isKnown(restaurant.instagram)) && (
                  <div className="practical-row">
                    <LinkIcon size={17} />
                    <span className="practical-links">
                      {isKnown(restaurant.officialUrl) && (
                        <a className="practical-link" href={restaurant.officialUrl.value} target="_blank" rel="noreferrer noopener">Website</a>
                      )}
                      {isKnown(restaurant.instagram) && (
                        <a className="practical-link" href={restaurant.instagram.value} target="_blank" rel="noreferrer noopener">Instagram</a>
                      )}
                    </span>
                  </div>
                )}

                <div className="practical-actions">
                  <button
                    className={`icon-btn icon-btn--lg${isBookmarked ? ' icon-btn--saved' : ''}`}
                    aria-label={isBookmarked ? `Remove ${name} from journal` : `Save ${name} to journal`}
                    onClick={() => onToggleBookmark(restaurant.id)}
                  >
                    <HeartIcon size={21} filled={isBookmarked} />
                  </button>
                  <button
                    className={`icon-btn icon-btn--lg${isVisited ? ' icon-btn--visited' : ''}`}
                    aria-label={isVisited ? `Mark ${name} as not visited` : `Mark ${name} as visited`}
                    onClick={() => onToggleVisited(restaurant.id)}
                  >
                    <CheckIcon size={21} />
                  </button>
                  <button
                    className="icon-btn icon-btn--lg"
                    aria-label={`Share ${name}`}
                    onClick={handleShare}
                    title={shared ? 'Shared!' : 'Share'}
                  >
                    <ShareIcon size={21} />
                  </button>
                </div>
              </div>
            </section>

            {/* Signature Menu */}
            {isKnown(restaurant.menus) && (
              <section className="detail-section">
                <SectionHead Icon={MenuIcon} title="Signature Menu" ko="대표 메뉴" es="Platos estrella" />
                <div className="menu-rows">
                  {restaurant.menus.value.map(m => (
                    <div key={m.name} className="menu-row">
                      <span>{say(m.name, m.nameKo, m.nameEs)}</span>
                      <span className="menu-row__price">{m.price ?? 'Price not listed'}</span>
                    </div>
                  ))}
                </div>
                {needsCheck(restaurant.menus) && (
                  <p className="section-note">
                    {say('Dishes and prices are unverified and may have changed.',
                      '메뉴와 가격은 확인되지 않았고 바뀌었을 수 있습니다.', 'Los platos y precios no están verificados y pueden haber cambiado.')}
                  </p>
                )}
              </section>
            )}

            {/* Why Locals Love This */}
            <section className="detail-section">
              <SectionHead Icon={SparkleIcon} title="Why Locals Love This" ko="현지인이 좋아하는 이유" es="Por qué gusta a los locales" />
              <p className="detail-body">{say(culture.whyLocalsLoveIt, culture.whyLocalsLoveItKo, culture.whyLocalsLoveItEs)}</p>
            </section>

            {/* Local Tips — what someone who eats here would tell you */}
            <section className="detail-section">
              <SectionHead Icon={SparkleIcon} title="Local Tips" ko="현지 팁" es="Consejos locales" kr="현지 팁" />
              <div className="tip-cards">
                {tipsFor(restaurant).map(t => (
                  <div key={t.tag} className="tip-card">
                    <span className="tip-card__tag">{say(t.tag, t.tagKo, t.tagEs)}</span>
                    <span className="tip-card__detail">{say(t.detail, t.detailKo, t.detailEs)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Food Story — Origin / Cultural Meaning / When Koreans Eat
                This / Fun Fact, as separate scannable cards rather than one
                long paragraph. */}
            <section className="detail-hook">
              <p className="detail-hook__label">{say("Why it's special", '왜 특별한가', 'Por qué es especial')}</p>
              <p className="detail-hook__quote">&ldquo;{say(restaurant.vibe, restaurant.vibeKo, restaurant.vibeEs)}&rdquo;</p>
            </section>

            <section className="detail-section" ref={storyRef}>
              <SectionHead Icon={BookIcon} title="Food Story" ko="음식 이야기" es="La historia del plato" kr="이야기" />
              <div className="story-grid">
                <div className="story-mini-card">
                  <p className="story-mini-card__label">{say('📜 Origin', '📜 유래', '📜 Origen')}</p>
                  <p>{say(restaurant.story, restaurant.storyKo, restaurant.storyEs)}</p>
                  {restaurant.timeline?.length > 0 && (
                    <ol className="timeline">
                      {restaurant.timeline.map(t => (
                        <li key={`${t.year}-${t.event}`} className="timeline__item">
                          <span className="timeline__year">{t.year}</span>
                          <span className="timeline__event">{t.event}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                <div className="story-mini-card">
                  <p className="story-mini-card__label">{say('🌏 Cultural Meaning', '🌏 문화적 의미', '🌏 Significado cultural')}</p>
                  <p>{say(culture.culturalMeaning, culture.culturalMeaningKo, culture.culturalMeaningEs)}</p>
                </div>
                <div className="story-mini-card">
                  <p className="story-mini-card__label">{say('🍽 When Koreans Eat This', '🍽 한국 사람들은 언제 먹나', '🍽 Cuándo lo comen los coreanos')}</p>
                  <p>{say(culture.whenKoreansEatThis, culture.whenKoreansEatThisKo, culture.whenKoreansEatThisEs)}</p>
                </div>
                <div className="story-mini-card">
                  <p className="story-mini-card__label">{say('✨ Fun Fact', '✨ 알아두면 좋은 것', '✨ Un dato curioso')}</p>
                  <p>{say(culture.didYouKnow, culture.didYouKnowKo, culture.didYouKnowEs)}</p>
                </div>
              </div>
            </section>

            {/* Dining Etiquette */}
            <section className="detail-section">
              <SectionHead Icon={SparkleIcon} title="Dining Etiquette" ko="식사 예절" es="Etiqueta en la mesa" />
              <ul className="tips-list">
                {(say(culture.diningTips, culture.diningTipsKo, culture.diningTipsEs)).map(tip => (
                  <li key={tip} className="tip">
                    <span className="tip__dot" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Useful Korean */}
            {culture.usefulKorean?.length > 0 && (
              <section className="detail-section">
                <SectionHead Icon={BookIcon} title="Useful Korean" ko="유용한 한국어" es="Coreano útil" kr="유용한 한국어" />
                <div className="phrase-list">
                  {culture.usefulKorean.map(p => (
                    <div key={p.ko} className="phrase-row">
                      <div className="phrase-row__kr">
                        <span className="phrase-ko">{p.ko}</span>
                        <span className="phrase-ro">{p.ro}</span>
                      </div>
                      <span className="phrase-en">{say(p.en, p.ko_gloss, p.es)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Conversation Tips */}
            {culture.conversationTips?.length > 0 && (
              <section className="detail-section">
                <SectionHead Icon={SparkleIcon} title="Conversation Tips" ko="대화 거리" es="De qué hablar" />
                <ul className="tips-list">
                  {(say(culture.conversationTips, culture.conversationTipsKo, culture.conversationTipsEs)).map(tip => (
                    <li key={tip} className="tip">
                      <span className="tip__dot" aria-hidden="true" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Continue Your Journey — the meal is step one, not the end */}
            <section className="detail-section detail-section--route">
              <SectionHead Icon={CompassIcon} title="Continue Your Journey" ko="여정 잇기" es="Sigue tu recorrido" kr="여정 잇기" />
              <p className="section-note">{say('Where this meal leads next.', '이 한 끼가 다음으로 이어지는 곳.', 'Adónde lleva esta comida después.')}</p>
              <CulturalRoute
                place={restaurant}
                onOpenRestaurant={onOpenRestaurant}
                onExploreZone={onExploreZone}
              />
            </section>

            {/* Nearby Experiences */}
            <section className="detail-section">
              <SectionHead Icon={MapPinIcon} title="Nearby Experiences" ko="근처에서 해볼 것" es="Cerca de aquí" />
              <p className="detail-body">
                {zoneInfo
                  ? say(zoneInfo.blurb, zoneInfo.blurbKo, zoneInfo.blurbEs)
                  : say(`More of ${restaurant.zone.split(',')[0]} is waiting just outside.`,
                    `${restaurant.zone.split(',')[0]}은(는) 문 밖에 더 있습니다.`,
                    `Hay más de ${restaurant.zone.split(',')[0]} justo ahí fuera.`)}
              </p>
              <div className="cta-stack">
                {onExploreZone && (
                  <button className="btn-primary" onClick={() => onExploreZone(restaurant.zone)}>
                    {say('Explore Nearby', '근처 둘러보기', 'Explorar la zona')} <ChevronRightIcon size={16} />
                  </button>
                )}
              </div>
            </section>

            {/* Related Foods — other places in the same category */}
            {relatedPlaces.length > 0 && (
              <section className="detail-section">
                <SectionHead Icon={BowlIcon} title="Related Foods" ko="관련 음식" es="Platos relacionados" />
                <div className="home-scroll-row" style={{ padding: 0 }}>
                  {relatedPlaces.map(p => (
                    <PlaceCard
                      key={p.id}
                      place={p}
                      onClick={() => onOpenRestaurant?.(p)}
                      isSaved={bookmarkedIds.includes(p.id)}
                      onToggleSave={onToggleBookmark}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Passport Mission */}
            {culture.passportMission && (
              <section className="detail-section">
                <SectionHead Icon={SparkleIcon} title="Passport Mission" ko="여권 미션" es="Misión de Pasaporte" kr="여권 미션" />
                <p className="detail-body">
                  <strong>{say(culture.passportMission, culture.passportMissionKo, culture.passportMissionEs).title}</strong> — {say(culture.passportMission, culture.passportMissionKo, culture.passportMissionEs).detail}
                </p>
                <div className={`mission-status${isVisited ? ' mission-status--done' : ''}`}>
                  {isVisited ? (
                    <><CheckIcon size={16} /> {say('Mission complete — logged in your Passport', '미션 완료 — 여권에 기록되었습니다', 'Misión cumplida — registrada en tu Pasaporte')}</>
                  ) : (
                    say('Mark this place visited to complete the mission', '이곳을 가봤다고 표시하면 미션이 완료됩니다', 'Marca este sitio como visitado para completar la misión')
                  )}
                </div>
              </section>
            )}

            {/* Location & Directions / Map */}
            <section className="detail-section">
              <SectionHead Icon={CompassIcon} title="Location & Directions" ko="위치와 길찾기" es="Ubicación y cómo llegar" />

              <div className="practical-row">
                <MapPinIcon size={17} />
                <span>
                  {restaurant.address.value}
                  {restaurant.address.precision === 'area' && (
                    <span className="practical-muted"> {say('— area only', '— 구역 단위', '— solo la zona')}</span>
                  )}
                </span>
                <button className="practical-copy" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* These three are route planners, not place pages — they always
                  were, and the labels said only "Naver Map", which is how a
                  reader ends up looking for reviews behind a directions link.
                  Named for the job now; the reviews are their own block higher
                  up, next to the button that turns this place into a table. */}
              <p className="map-route__label">길찾기 · Get there</p>
              <div className="map-route__row">
                <button className="btn-primary" onClick={() => window.open(directionsUrl(restaurant, mapCenter), '_blank')}>
                  Google
                </button>
                <button className="btn-primary btn-map--naver" onClick={() => window.open(naverMapUrl(restaurant, mapCenter), '_blank')}>
                  네이버 · Naver
                </button>
                <button className="btn-primary btn-map--kakao" onClick={() => window.open(kakaoMapUrl(restaurant, mapCenter), '_blank')}>
                  카카오 · Kakao
                </button>
              </div>
            </section>

            {/* Footer */}
            <footer className="provenance">
              <p className="provenance__title">{say('About this information', '이 정보에 대하여', 'Sobre esta información')}</p>
              <p>
                {say(
                  <>
                    <strong>Official</strong> means we checked it against a map service or registry;
                    <strong> Reported</strong> means a source states it; <strong>Inferred</strong> means
                    we read it from context. Hours, prices and dietary details change — treat this as
                    a starting point.
                  </>,
                  <>
                    <strong>공식 확인</strong>은 지도 서비스나 등록 정보와 대조했다는 뜻이고,
                    <strong> 출처 있음</strong>은 어떤 출처가 그렇게 말한다는 뜻이며,
                    <strong> 추정</strong>은 저희가 정황에서 읽어 냈다는 뜻입니다. 영업시간, 가격,
                    식단 정보는 바뀝니다 — 출발점으로만 보세요.
                  </>,
                  <>
                    <strong>Verificado</strong> significa que lo hemos contrastado con un servicio
                    de mapas o un registro; <strong>Según la fuente</strong>, que una fuente lo
                    afirma; <strong>Deducido</strong>, que lo hemos leído del contexto. Los
                    horarios, los precios y los datos de dieta cambian: tómalo como punto de
                    partida.
                  </>,
                )}
              </p>
              <dl className="provenance__list">
                <div>
                  <dt>{say('Location', '위치', 'Ubicación')}</dt>
                  <dd>
                    {restaurant.coordinates.source}
                    {restaurant.address.precision === 'area' && say(' · address is area-level', ' · 주소는 구역 단위', ' · la dirección es a nivel de zona')}
                  </dd>
                </div>
                <div>
                  <dt>{say('Dietary', '식단', 'Dieta')}</dt>
                  <dd>
                    {dietFacts.length > 0
                      ? [...new Set(dietFacts.map(f => f.fact.source))].join(' · ')
                      : say('Not recorded', '기록 없음', 'Sin registrar')}
                  </dd>
                </div>
                <div>
                  <dt>{say('Last checked', '마지막 확인', 'Última comprobación')}</dt>
                  <dd>{lastChecked ?? say('Never', '없음', 'Nunca')}</dd>
                </div>
              </dl>
            </footer>
            
            <div className="transparency-log">
              {lastChecked && (
                <p>
                  {say('Last verified: ', '마지막 검증: ', 'Última verificación: ')}
                  {new Date(lastChecked).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {/* This said hello@kfoodmap.com until 2026-08-04. K-Food Map is
                  a different product — the one this repository grew out of,
                  and the one HANDOFF.md opens by warning nobody to push to.
                  A 밥친구 place page was sending correction requests to another
                  company's inbox, where nobody on this team would ever read
                  them. Nothing about it looked broken, which is why it sat at
                  the foot of the page for months. */}
              <p>
                {say('To suggest an edit, email ', '수정 제안은 이 주소로 보내주세요: ', 'Para sugerir una corrección, escribe a ')}
                <a className="practical-link" href="mailto:eatple0701@gmail.com">eatple0701@gmail.com</a>
              </p>
            </div>

          </div>
        </div>
      </div>

      {galleryOpen && galleryImages.length > 0 && (
        <div className="gallery-overlay" onClick={() => setGalleryOpen(false)}>
          <button className="gallery-close" onClick={() => setGalleryOpen(false)}>
            <XIcon size={24} />
          </button>
          
          <div className="gallery-slider" onClick={e => e.stopPropagation()}>
            {galleryImages.map((img, i) => (
              <img key={i} src={img} className="gallery-slide" alt="" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
