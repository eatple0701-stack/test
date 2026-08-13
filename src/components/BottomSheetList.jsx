import React, { useMemo } from 'react';
import PlaceImage from './PlaceImage';
import { HeartIcon, CompassIcon } from './Icons';
import { haversineKm, formatDistance, getOpenStatus, directionsUrl, coordsOf } from '../utils';
import { dietaryBadges } from '../data/verification';
import { useText } from './localeText.js';

// The traits that make up the sustainability axis (see TRAIT_GROUPS in App).
const SUSTAINABILITY_TRAITS = ['Zero-waste', 'Local Sourcing'];

function PlaceCard({ place, bookmarked, onOpen, onToggleBookmark, onReadStory, lens, mapCenter }) {
  const say = useText();
  const name = place.name.split('(')[0].trim();
  const status = getOpenStatus(place.hours);
  // Dietary badges say exactly what we know ("Vegan options" ≠ "Fully vegan");
  // traits are descriptive. Cards stay scannable, so cap the list.
  //
  // Under the lens the matched trait moves to the front of the traits, because
  // the 3-badge cap otherwise hides it on exactly the places it matters most —
  // balwoo and sanchon both carry it last. Display order only; place.traits is
  // never mutated, and dietary badges keep the lead since they are the
  // safety-relevant ones.
  const traits = lens
    ? [...place.traits].sort((a, b) =>
        Number(SUSTAINABILITY_TRAITS.includes(b)) - Number(SUSTAINABILITY_TRAITS.includes(a)))
    : place.traits;
  const badges = [...dietaryBadges(place).map(b => b.label), ...traits];
  const extraBadges = badges.length - 3;

  return (
    <article className="place-card">
      <div className="place-card__body">
        {/* Stretched link: the name button's ::after covers the whole card */}
        <h4 className="place-card__name">
          <button className="place-card__open-btn" onClick={() => onOpen(place)}>
            {name}
          </button>
        </h4>

        <p className="place-card__meta">
          {status && (
            <>
              <span className={status.open ? 'is-open' : 'is-closed'}>{status.label}</span>
              <span aria-hidden="true">·</span>
              <span>{status.detail}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{formatDistance(place.distanceKm)}</span>
        </p>

        <div className="place-card__badges">
          {badges.slice(0, 3).map(label => (
            <span key={label} className="tag-chip">{label}</span>
          ))}
          {extraBadges > 0 && <span className="tag-chip">+{extraBadges}</span>}
        </div>

        {/* The restaurant's own recorded line, verbatim — the same string the
            detail page shows. Nothing is written or summarised for the list. */}
        {lens && <p className="place-card__esg">{place.esg_point}</p>}

        {/* A "✨ 98% Match: Fits your budget, dietary needs, and schedule!"
            banner used to render here whenever distanceKm < 3. It was a
            distance check wearing a compatibility score: the number was
            invented, and the app has never asked anyone their budget or their
            schedule, so two of the three things it claimed to have matched
            are not data this app holds. Shown to foreign visitors, by a
            publicly funded project, directly under a comment promising that
            nothing in this list is written or summarised for them. Removed
            rather than reworded — there is no honest version of a number
            nobody computed. */}
      </div>

      <PlaceImage place={place} variant="thumb" className="place-card__media" />

      <div className="place-card__foot">
        <button
          className="place-card__story-btn"
          aria-label={`Read the story of ${name}`}
          onClick={() => onReadStory(place)}
        >
          {say('Read Story', '이야기 읽기', 'Leer la historia')}
        </button>

        <div className="place-card__actions">
          <button
            className={`icon-btn${bookmarked ? ' icon-btn--saved' : ''}`}
            aria-label={bookmarked ? `Remove ${name} from journal` : `Save ${name} to journal`}
            aria-pressed={bookmarked}
            onClick={() => onToggleBookmark(place.id)}
          >
            <HeartIcon size={20} filled={bookmarked} />
          </button>
          <button
            className="icon-btn"
            aria-label={`Get directions to ${name}`}
            onClick={() => window.open(directionsUrl(place, mapCenter), '_blank')}
          >
            <CompassIcon size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function BottomSheetList({
  restaurants, onRestaurantClick, onReadStory, onToggleBookmark, bookmarkedIds, mapCenter,
  sustainabilityLens, onResetFilters,
}) {
  const say = useText();
  const sorted = useMemo(() =>
    restaurants
      .map(r => {
        const { lat, lng } = coordsOf(r);
        return { ...r, distanceKm: haversineKm(mapCenter[0], mapCenter[1], lat, lng) };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm),
  [restaurants, mapCenter]);

  return (
    <div className="place-list">
      <div className="place-list__header">
        <h3>{sorted.length} {sorted.length === 1 ? 'place' : 'places'}</h3>
        {sorted.length > 1 && <span className="place-list__hint">{say('Nearest first', '가까운 순', 'Más cercanos primero')}</span>}
      </div>

      {/* Said once for the whole list rather than on every card: the same
          caveat the detail page carries, so the lines below are never read as
          audited. */}
      {sustainabilityLens && sorted.length > 0 && (
        <p className="section-note place-list__note">
          {say('Described by the restaurant and our research; not independently audited.',
            '식당 소개와 저희 조사에 따른 것이며, 독립적으로 검증되지는 않았습니다.',
            'Según lo que describen el restaurante y nuestra investigación; sin auditoría independiente.')}
        </p>
      )}

      {sorted.map(r => (
        <PlaceCard
          key={r.id}
          place={r}
          bookmarked={bookmarkedIds.includes(r.id)}
          onOpen={onRestaurantClick}
          onReadStory={onReadStory}
          onToggleBookmark={onToggleBookmark}
          lens={sustainabilityLens}
          mapCenter={mapCenter}
        />
      ))}

      {/* Two things were wrong here and both were inherited rather than
          decided. A stock photograph of somebody else's travel, loaded from
          images.unsplash.com — an external host the service worker passes
          straight through, so the empty state was a broken image on exactly
          the connection that produced it. And a button labelled Reset Filters
          that called window.location.reload(): not a reset, a full reload
          that throws away the session and re-downloads the app to achieve
          something the caller can do in one line. On a weak signal it left a
          blank screen. onResetFilters is that one line. */}
      {sorted.length === 0 && (
        <div className="place-list__empty">
          <p className="place-list__empty-kr" translate="no">찾은 곳이 없어요</p>
          <p className="place-list__empty-en">
            {say('No place matches all of the filters at once. Removing one usually brings the list back.',
              '모든 필터를 동시에 만족하는 곳이 없습니다. 하나를 빼면 대개 목록이 돌아옵니다.',
              'Ningún sitio cumple todos los filtros a la vez. Quitar uno suele devolver la lista.')}
          </p>
          {onResetFilters && (
            <button className="place-list__empty-cta" translate="no" onClick={onResetFilters}>
              필터 모두 끄기 · Clear the filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
