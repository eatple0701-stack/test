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
  dietaryBadges, isKnown, needsCheck, trustBadge, dietaryConfidence, CONFIDENCE, isQuarantined,
} from '../data/verification';
import { bookable } from '../domain/policy/cancellation.js';

const TRAIT_META = {
  'Mild Taste': { Icon: MildIcon, label: 'Mild taste' },
  'Fermented': { Icon: FermentIcon, label: 'Fermented' },
  'Zero-waste': { Icon: RecycleIcon, label: 'Zero waste' },
  'Local Sourcing': { Icon: SproutIcon, label: 'Locally sourced' },
};

const DIETARY_ICON = { vegan: LeafIcon, halal: CrescentIcon };

function SectionHead({ Icon, title, kr }) {
  return (
    <div className="section-head">
      <span className="section-head__icon" aria-hidden="true"><Icon size={17} /></span>
      <h3>{title}{kr && <span className="section-head__kr"> · {kr}</span>}</h3>
    </div>
  );
}

function Trust({ fact }) {
  const { label, tone, detail } = trustBadge(fact);
  return <span className={`trust trust--${tone}`} title={detail}>{label}</span>;
}

const DIET_CAVEAT = {
  [CONFIDENCE.CONFIRMED]: { title: 'Confirmed with the restaurant.', body: 'The kitchen states this itself. Menus still change, so ask if you have a strict requirement.' },
  [CONFIDENCE.SUPPORTED]: { title: 'Reported, not confirmed.', body: `These details come from what the restaurant and our research describe. We haven't checked them in person — confirm with staff before ordering.` },
  [CONFIDENCE.INFERRED]: { title: 'Partly our own reading.', body: 'Some of this we read from the kind of kitchen it is, or from how the venue describes itself — not from a stated fact. Treat it as a lead and ask staff before ordering.' },
  [CONFIDENCE.UNKNOWN]: { title: 'No dietary information yet.', body: `We haven't established what this kitchen serves, so we don't make a claim either way.` },
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
  const tableCta = tableCtaFor(restaurant);
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

  const dietFacts = dietaryBadges(restaurant).map(b => ({ Icon: DIETARY_ICON[b.key], label: b.label, fact: b.fact }));
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
        <button className="detail-close" aria-label="Close" onClick={onClose}>
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
              <ul className="fact-row" aria-label="Dietary and dining facts">
                {facts.map(({ Icon, label, fact: f }) => (
                  <li key={label} className="fact">
                    <Icon size={16} aria-hidden="true" /> {label}
                    {f && <Trust fact={f} />}
                  </li>
                ))}
              </ul>
            )}

            <div className="diet-note">
              <p><strong>{caveat.title}</strong> {caveat.body}</p>
              {certClaim && <p className="diet-note__cert">Certification claimed: {certClaim.body} — we have not sighted the certificate.</p>}
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
                  {isBookmarked ? '저장됨 · Saved' : '저장하기 · Save this place'}
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
                    <strong>{MAP_LINKS_NOTE.kr}</strong> {MAP_LINKS_NOTE.en}
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
              <SectionHead Icon={ClockIcon} title="Quick Info" />
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
                    <span className="practical-muted">Opening hours unknown — check before you go</span>
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
                <SectionHead Icon={MenuIcon} title="Signature Menu" />
                <div className="menu-rows">
                  {restaurant.menus.value.map(m => (
                    <div key={m.name} className="menu-row">
                      <span>{m.name}</span>
                      <span className="menu-row__price">{m.price ?? 'Price not listed'}</span>
                    </div>
                  ))}
                </div>
                {needsCheck(restaurant.menus) && (
                  <p className="section-note">Dishes and prices are unverified and may have changed.</p>
                )}
              </section>
            )}

            {/* Why Locals Love This */}
            <section className="detail-section">
              <SectionHead Icon={SparkleIcon} title="Why Locals Love This" />
              <p className="detail-body">{culture.whyLocalsLoveIt}</p>
            </section>

            {/* Local Tips — what someone who eats here would tell you */}
            <section className="detail-section">
              <SectionHead Icon={SparkleIcon} title="Local Tips" kr="현지 팁" />
              <div className="tip-cards">
                {tipsFor(restaurant).map(t => (
                  <div key={t.tag} className="tip-card">
                    <span className="tip-card__tag">{t.tag}</span>
                    <span className="tip-card__detail">{t.detail}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Food Story — Origin / Cultural Meaning / When Koreans Eat
                This / Fun Fact, as separate scannable cards rather than one
                long paragraph. */}
            <section className="detail-hook">
              <p className="detail-hook__label">Why it's special</p>
              <p className="detail-hook__quote">&ldquo;{restaurant.vibe}&rdquo;</p>
            </section>

            <section className="detail-section" ref={storyRef}>
              <SectionHead Icon={BookIcon} title="Food Story" kr="이야기" />
              <div className="story-grid">
                <div className="story-mini-card">
                  <p className="story-mini-card__label">📜 Origin</p>
                  <p>{restaurant.story}</p>
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
                  <p className="story-mini-card__label">🌏 Cultural Meaning</p>
                  <p>{culture.culturalMeaning}</p>
                </div>
                <div className="story-mini-card">
                  <p className="story-mini-card__label">🍽 When Koreans Eat This</p>
                  <p>{culture.whenKoreansEatThis}</p>
                </div>
                <div className="story-mini-card">
                  <p className="story-mini-card__label">✨ Fun Fact</p>
                  <p>{culture.didYouKnow}</p>
                </div>
              </div>
            </section>

            {/* Dining Etiquette */}
            <section className="detail-section">
              <SectionHead Icon={SparkleIcon} title="Dining Etiquette" />
              <ul className="tips-list">
                {culture.diningTips.map(tip => (
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
                <SectionHead Icon={BookIcon} title="Useful Korean" kr="유용한 한국어" />
                <div className="phrase-list">
                  {culture.usefulKorean.map(p => (
                    <div key={p.ko} className="phrase-row">
                      <div className="phrase-row__kr">
                        <span className="phrase-ko">{p.ko}</span>
                        <span className="phrase-ro">{p.ro}</span>
                      </div>
                      <span className="phrase-en">{p.en}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Conversation Tips */}
            {culture.conversationTips?.length > 0 && (
              <section className="detail-section">
                <SectionHead Icon={SparkleIcon} title="Conversation Tips" />
                <ul className="tips-list">
                  {culture.conversationTips.map(tip => (
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
              <SectionHead Icon={CompassIcon} title="Continue Your Journey" kr="여정 잇기" />
              <p className="section-note">Where this meal leads next.</p>
              <CulturalRoute
                place={restaurant}
                onOpenRestaurant={onOpenRestaurant}
                onExploreZone={onExploreZone}
              />
            </section>

            {/* Nearby Experiences */}
            <section className="detail-section">
              <SectionHead Icon={MapPinIcon} title="Nearby Experiences" />
              <p className="detail-body">
                {zoneInfo?.blurb ?? `More of ${restaurant.zone.split(',')[0]} is waiting just outside.`}
              </p>
              <div className="cta-stack">
                {onExploreZone && (
                  <button className="btn-primary" onClick={() => onExploreZone(restaurant.zone)}>
                    Explore Nearby <ChevronRightIcon size={16} />
                  </button>
                )}
              </div>
            </section>

            {/* Related Foods — other places in the same category */}
            {relatedPlaces.length > 0 && (
              <section className="detail-section">
                <SectionHead Icon={BowlIcon} title="Related Foods" />
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
                <SectionHead Icon={SparkleIcon} title="Passport Mission" kr="여권 미션" />
                <p className="detail-body">
                  <strong>{culture.passportMission.title}</strong> — {culture.passportMission.detail}
                </p>
                <div className={`mission-status${isVisited ? ' mission-status--done' : ''}`}>
                  {isVisited ? (
                    <><CheckIcon size={16} /> Mission complete — logged in your Passport</>
                  ) : (
                    'Mark this place visited to complete the mission'
                  )}
                </div>
              </section>
            )}

            {/* Location & Directions / Map */}
            <section className="detail-section">
              <SectionHead Icon={CompassIcon} title="Location & Directions" />

              <div className="practical-row">
                <MapPinIcon size={17} />
                <span>
                  {restaurant.address.value}
                  {restaurant.address.precision === 'area' && (
                    <span className="practical-muted"> — area only</span>
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
              <p className="provenance__title">About this information</p>
              <p>
                <strong>Official</strong> means we checked it against a map service or registry;
                <strong> Reported</strong> means a source states it; <strong>Inferred</strong> means
                we read it from context. Hours, prices and dietary details change — treat this as
                a starting point.
              </p>
              <dl className="provenance__list">
                <div>
                  <dt>Location</dt>
                  <dd>
                    {restaurant.coordinates.source}
                    {restaurant.address.precision === 'area' && ' · address is area-level'}
                  </dd>
                </div>
                <div>
                  <dt>Dietary</dt>
                  <dd>
                    {dietFacts.length > 0
                      ? [...new Set(dietFacts.map(f => f.fact.source))].join(' · ')
                      : 'Not recorded'}
                  </dd>
                </div>
                <div>
                  <dt>Last checked</dt>
                  <dd>{lastChecked ?? 'Never'}</dd>
                </div>
              </dl>
            </footer>
            
            <div className="transparency-log">
              {lastChecked && (
                <p>Last verified: {new Date(lastChecked).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              )}
              {/* This said hello@kfoodmap.com until 2026-08-04. K-Food Map is
                  a different product — the one this repository grew out of,
                  and the one HANDOFF.md opens by warning nobody to push to.
                  A 밥친구 place page was sending correction requests to another
                  company's inbox, where nobody on this team would ever read
                  them. Nothing about it looked broken, which is why it sat at
                  the foot of the page for months. */}
              <p>
                To suggest an edit, email{' '}
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
              <img key={i} src={img} className="gallery-slide" alt="Gallery item" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
