import React from 'react';
import PlaceImage from './PlaceImage';
import { HeartIcon } from './Icons';
import { CATEGORY_LABEL, CATEGORY_LABEL_KO, CATEGORY_LABEL_ES, CATEGORY_LABEL_FR, ZONE_KO, ZONE_ES, ZONE_FR } from '../data/culture';
import { useText } from './localeText.js';

// The shared card for every place-scroll-row (Popular, Hidden Gems, Weekend
// Picks, Related Foods): image, a culture-category tag, a quick-save heart,
// name, zone, and the place's own one-line `vibe` as the short intro. No
// invented aggregate numbers (e.g. a save count) — only what the app itself
// actually knows, which for a single local user is "did I save this".
export default function PlaceCard({ place, onClick, isSaved, onToggleSave }) {
  const say = useText();
  // Records are written "Balwoo Gongyang (발우공양)" — the romanised name
  // outside the brackets, the sign as it actually reads inside them. Korean
  // mode shows the sign; everything else shows the romanisation, which is
  // what a traveller can pronounce. A place with no Korean in its name (Plant
  // Cafe & Kitchen) keeps the one name it has in both.
  const roman = place.name.split('(')[0].trim();
  const inBrackets = place.name.match(/\(([^)]+)\)/)?.[1]?.trim();
  // Spanish gets the romanisation, not the sign: a Spanish reader cannot
  // read 발우공양 any more than an English one can, and the point of the
  // romanised name is that it can be said out loud.
  const name = say(roman, inBrackets || roman, roman, roman);
  const category = say(CATEGORY_LABEL[place.category], CATEGORY_LABEL_KO[place.category], CATEGORY_LABEL_ES[place.category], CATEGORY_LABEL_FR[place.category]);

  return (
    <div className="place-card">
      <button className="place-card__hit" onClick={onClick}>
        <div className="place-card__media">
          <PlaceImage place={place} variant="hero" className="place-card__img" />
          {category && <span className="place-card__tag">{category}</span>}
        </div>
        <div className="place-card__body">
          <h3>{name}</h3>
          <p className="place-card__zone">{say(place.zone, ZONE_KO[place.zone], ZONE_ES[place.zone], ZONE_FR[place.zone])}</p>
          {place.vibe && <p className="place-card__blurb">{say(place.vibe, place.vibeKo, place.vibeEs, place.vibeFr)}</p>}
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
