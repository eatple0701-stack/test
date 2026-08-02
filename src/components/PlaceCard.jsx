import React from 'react';
import PlaceImage from './PlaceImage';
import { HeartIcon } from './Icons';
import { CATEGORY_LABEL } from '../data/culture';

// The shared card for every place-scroll-row (Popular, Hidden Gems, Weekend
// Picks, Related Foods): image, a culture-category tag, a quick-save heart,
// name, zone, and the place's own one-line `vibe` as the short intro. No
// invented aggregate numbers (e.g. a save count) — only what the app itself
// actually knows, which for a single local user is "did I save this".
export default function PlaceCard({ place, onClick, isSaved, onToggleSave }) {
  const name = place.name.split('(')[0].trim();
  const category = CATEGORY_LABEL[place.category];

  return (
    <div className="place-card">
      <button className="place-card__hit" onClick={onClick}>
        <div className="place-card__media">
          <PlaceImage place={place} variant="hero" className="place-card__img" />
          {category && <span className="place-card__tag">{category}</span>}
        </div>
        <div className="place-card__body">
          <h3>{name}</h3>
          <p className="place-card__zone">{place.zone}</p>
          {place.vibe && <p className="place-card__blurb">{place.vibe}</p>}
        </div>
      </button>
      {onToggleSave && (
        <button
          type="button"
          className={`place-card__save${isSaved ? ' is-saved' : ''}`}
          aria-label={isSaved ? `Remove ${name} from journal` : `Save ${name} to journal`}
          onClick={() => onToggleSave(place.id)}
        >
          <HeartIcon size={15} filled={isSaved} />
        </button>
      )}
    </div>
  );
}
