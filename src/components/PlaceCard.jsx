import React from 'react';
import PlaceImage from './PlaceImage';
import { HeartIcon, CompassIcon } from './Icons';
import { CATEGORY_LABEL, CATEGORY_LABEL_KO, CATEGORY_LABEL_ES, CATEGORY_LABEL_FR, CATEGORY_LABEL_AR, CATEGORY_LABEL_ZH, CATEGORY_LABEL_JA, ZONE_KO, ZONE_ES, ZONE_FR, ZONE_AR, ZONE_ZH, ZONE_JA } from '../data/culture';
import { cityOf, cityName } from '../data/cities.js';
import { getOpenStatus, directionsUrl, coordsOf } from '../utils';
import { useText, useLocale } from './localeText.js';

// The shared card for every place-scroll-row (Popular, Hidden Gems, Weekend
// Picks, Related Foods): image, a culture-category tag, a quick-save heart,
// name, zone, and the place's own one-line `vibe` as the short intro. No
// invented aggregate numbers (e.g. a save count) — only what the app itself
// actually knows, which for a single local user is "did I save this".
//
// ── What was added on 2026-08-30, and why it was already in the app ──────
//
// A reviewer put it plainly: nothing on the Places tab could be acted on. A
// card gave you a neighbourhood and a nice sentence and stopped, so a reader
// who wanted to go had no idea whether it was open or how to get there. Both
// facts existed — the same records are on the map one tab away, where the
// rows have said `Open · closes 10:00 PM` since July. The Places tab simply
// never asked for them.
//
// So this reads the record it already has: getOpenStatus() off place.hours,
// and a directions link off place.coordinates. Nothing new is computed and
// nothing is estimated. A place whose hours were never recorded shows no
// hours line at all, because `Hours unknown` is a row of pixels that answers
// nothing, and a guessed opening time is the kind of fact this codebase has
// removed twice already.
//
// ── The distance that is deliberately not here ───────────────────────────
//
// The map rows print `600 m`, and parity with them was asked for. It is not
// here, because on the map that number is measured from the map's own centre
// — the patch of city the reader dragged into view — and on this tab there
// is no map and no centre a reader has chosen. It would be measured from a
// fixed point near Myeongdong that nothing on screen mentions. That is an
// invented number wearing a unit, and this file's own history is the
// argument: a `98% Match` banner was deleted from the map card for exactly
// this, being a distance check dressed as a compatibility score. Distance
// returns when the app knows where the reader is standing.

export default function PlaceCard({ place, onClick, isSaved, onToggleSave }) {
  const say = useText();
  const locale = useLocale();
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
  const name = say(roman, inBrackets || roman, roman, roman, roman, roman, roman);
  const category = say(CATEGORY_LABEL[place.category], CATEGORY_LABEL_KO[place.category], CATEGORY_LABEL_ES[place.category], CATEGORY_LABEL_FR[place.category], CATEGORY_LABEL_AR[place.category], CATEGORY_LABEL_ZH[place.category], CATEGORY_LABEL_JA[place.category]);

  const city = cityOf(place.zone);
  const status = getOpenStatus(place.hours, new Date(), locale);
  const { lat, lng } = coordsOf(place);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <div className="place-card place-card--browse">
      <button className="place-card__hit" onClick={onClick}>
        <div className="place-card__media">
          <PlaceImage place={place} variant="hero" className="place-card__img" />
          {category && <span className="place-card__tag">{category}</span>}
        </div>
        <div className="place-card__body">
          {/* The city, on its own, in its own colour. It was always inside
              the zone line — 'Songdo, Incheon' — and always invisible there,
              because a reader who does not yet know Incheon is a different
              city cannot tell that line apart from 'Insadong, Seoul'. */}
          {city && <span className={`city-chip city-chip--${city.toLowerCase()}`}>{cityName(say, city)}</span>}
          <h3>{name}</h3>
          <p className="place-card__zone">{say(place.zone, ZONE_KO[place.zone], ZONE_ES[place.zone], ZONE_FR[place.zone], ZONE_AR[place.zone], ZONE_ZH[place.zone], ZONE_JA[place.zone])}</p>
          {status && (
            <p className="place-card__open">
              <span className={status.open ? 'is-open' : 'is-closed'}>{status.label}</span>
              {/* Written as an expression, not as the literal " · " between
                  the tags: the JSX transform dropped that text node and the
                  card shipped `Closedclosed today` in the browser while the
                  source read correctly. A separator that only exists in the
                  source is not a separator. */}
              {' · '}
              <span className="place-card__open-detail">{status.detail}</span>
            </p>
          )}
          {place.vibe && <p className="place-card__blurb">{say(place.vibe, place.vibeKo, place.vibeEs, place.vibeFr, place.vibeAr, place.vibeZh, place.vibeJa)}</p>}
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
      {/* A sibling of the hit area, never nested inside it: the card is a
          button and a button inside a button is markup no browser agrees
          on. Sits below so it cannot be hit while flicking the row
          sideways. */}
      {hasCoords && (
        <a
          className="place-card__go"
          href={directionsUrl(place)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Directions to ${name}`}
        >
          <CompassIcon size={13} />
          {/* Not "Directions". Google has no driving or walking routes in
              Korea — transit is the only mode it can answer — and the last
              few hundred metres come back as a dotted line. A button that
              says Directions promises door-to-door and hands over something
              else. */}
          {say('Transit', '대중교통', 'Transporte', 'Transports', 'النقل العام', '公共交通', '公共交通')}
        </a>
      )}
    </div>
  );
}
