import React from 'react';
import { ChevronRightIcon } from './Icons';

// The always-visible header of the trip: what has actually happened so far,
// and the one thing to do next. Every number comes from computeJourney, so
// an empty trip honestly reads as zeros rather than a fake head start.
export default function JourneyCard({ journey, onOpenSummary }) {
  const { foodCount, districtCount, marketCount, cuisineCount, nextGoal, challenges, doneCount } = journey;
  const pct = Math.round((doneCount / challenges.length) * 100);

  return (
    <div className="journey-card">
      <div className="journey-card__head">
        <h2>🇰🇷 Your Korea Journey</h2>
        {onOpenSummary && (
          <button className="journey-card__summary-btn" onClick={onOpenSummary}>
            Summary <ChevronRightIcon size={14} />
          </button>
        )}
      </div>

      <div className="journey-stats">
        <div className="journey-stat">
          <span className="journey-stat__num">{foodCount}</span>
          <span className="journey-stat__label">Foods</span>
        </div>
        <div className="journey-stat">
          <span className="journey-stat__num">{districtCount}</span>
          <span className="journey-stat__label">Districts</span>
        </div>
        <div className="journey-stat">
          <span className="journey-stat__num">{marketCount}</span>
          <span className="journey-stat__label">Markets</span>
        </div>
        <div className="journey-stat">
          <span className="journey-stat__num">{cuisineCount}</span>
          <span className="journey-stat__label">Cuisines</span>
        </div>
      </div>

      <div className="journey-card__bar">
        <div className="journey-card__fill" style={{ width: `${pct}%` }} />
      </div>

      {nextGoal ? (
        <p className="journey-card__next">
          <span className="journey-card__next-label">Next goal</span>
          {nextGoal.emoji} {nextGoal.title}
        </p>
      ) : (
        <p className="journey-card__next">
          <span className="journey-card__next-label">Complete</span>
          Every challenge done — your Passport is full.
        </p>
      )}
    </div>
  );
}
