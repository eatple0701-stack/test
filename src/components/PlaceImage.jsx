import React, { useState, useCallback } from 'react';

const getInitials = (name) => {
  const cleanName = name.split('(')[0].trim();
  return cleanName.substring(0, 1);
};

// Scalable image slot for a place. Renders real photography (photo/coverImage)
// when available; until then, the place's own illustration, full-bleed.
//
// No venue in the dataset has a licensed photo yet (every `photo` is null by
// design — see imageLeads in verification.js), so the illustration is the
// real, everyday state of this component, not a rare fallback. It is treated
// accordingly: the 400×300 artwork fills the frame instead of sitting at
// thumbnail size, tinted per category so a row of cards reads as a set rather
// than eight copies of the same cream rectangle. Swapping in real photos later
// means filling the data fields — no component changes.
export default function PlaceImage({ place, variant = 'thumb', className = '', onClick }) {
  const real = place.photo || place.coverImage || null;
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showReal = real && !failed;

  // A cached image can finish loading before React attaches onLoad, so the
  // event never fires and `loaded` would stay false forever. Seeding from
  // img.complete at mount closes that race; without it the skeleton sits on
  // top of an image that is already there.
  const settleOnMount = useCallback((node) => {
    if (node?.complete) setLoaded(true);
  }, []);

  return (
    <div
      className={`place-image place-image--${variant} ${className}`}
      data-category={place.category ?? 'default'}
      onClick={onClick}
    >
      {showReal ? (
        <img
          ref={settleOnMount}
          src={real}
          alt=""
          loading="lazy"
          className={`place-image__photo${loaded ? ' is-loaded' : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="place-image__art">
          {/* A real element rather than a ::after, so "done loading" is an
              unmount instead of a pseudo-element opacity transition — the
              shimmer can never be left stranded over a loaded image. */}
          {!loaded && <span className="place-image__skeleton" aria-hidden="true" />}
          <img
            ref={settleOnMount}
            className="place-image__illo"
            src={place.image}
            alt=""
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
          <span className="place-image__wash" aria-hidden="true" />
          <span className="place-image__initial" aria-hidden="true">{getInitials(place.name)}</span>
        </div>
      )}
    </div>
  );
}
