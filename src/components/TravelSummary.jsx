import React, { useState } from 'react';
import { XIcon, CheckIcon } from './Icons';

// The shareable end of the loop. Deliberately plain text under the hood —
// the card is what gets screenshotted, and the copied summary carries the
// same numbers so nothing is claimed on the way out that the app cannot back.
function summaryText(journey) {
  const lines = [
    '🇰🇷 My Korea Food Journey',
    `${journey.foodCount} foods · ${journey.districtCount} districts · ${journey.marketCount} markets`,
    `${journey.cuisineCount} kinds of Korean kitchen`,
    `${journey.companionCount} ${journey.companionCount === 1 ? 'person' : 'people'} met over a meal`,
    `${journey.doneCount}/${journey.challenges.length} challenges complete`,
  ];
  return lines.join('\n');
}

export default function TravelSummary({ journey, onClose }) {
  const [copied, setCopied] = useState(false);
  const complete = journey.doneCount === journey.challenges.length;

  const handleShare = async () => {
    const text = summaryText(journey);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Korea Food Journey', text });
        return;
      } catch { /* user dismissed the sheet — fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* clipboard blocked; the card itself is still screenshottable */ }
  };

  return (
    <div className="match-modal-backdrop" role="dialog" aria-label="Travel summary" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="summary-sheet" onClick={e => e.stopPropagation()}>
        <button className="summary-sheet__close" aria-label="Close" onClick={onClose}>
          <XIcon size={18} />
        </button>

        <div className="summary-card">
          <p className="summary-card__eyebrow">Korea Food Journey</p>
          <h2 className="summary-card__title">🇰🇷 My Journey</h2>

          <div className="summary-card__grid">
            <div>
              <span className="summary-card__num">{journey.foodCount}</span>
              <span className="summary-card__label">Foods</span>
            </div>
            <div>
              <span className="summary-card__num">{journey.districtCount}</span>
              <span className="summary-card__label">Districts</span>
            </div>
            <div>
              <span className="summary-card__num">{journey.marketCount}</span>
              <span className="summary-card__label">Markets</span>
            </div>
            <div>
              <span className="summary-card__num">{journey.cuisineCount}</span>
              <span className="summary-card__label">Cuisines</span>
            </div>
            <div>
              <span className="summary-card__num">{journey.companionCount}</span>
              <span className="summary-card__label">Met</span>
            </div>
            <div>
              <span className="summary-card__num">{journey.doneCount}/{journey.challenges.length}</span>
              <span className="summary-card__label">Challenges</span>
            </div>
          </div>

          <div className="summary-card__stamps">
            {journey.challenges.filter(c => c.done).map(c => (
              <span key={c.id} className="summary-card__stamp">{c.emoji} {c.title}</span>
            ))}
            {journey.doneCount === 0 && (
              <span className="summary-card__stamp summary-card__stamp--empty">
                No challenges complete yet — the trip is still young.
              </span>
            )}
          </div>

          <p className="summary-card__footer">
            {complete ? 'Passport Completed' : `${journey.challenges.length - journey.doneCount} to go`}
          </p>
        </div>

        <button className="btn-primary" onClick={handleShare} style={{ width: '100%' }}>
          {copied ? <><CheckIcon size={17} /> Copied</> : 'Share my journey'}
        </button>
        <p className="summary-sheet__hint">Or screenshot the card above.</p>
      </div>
    </div>
  );
}
