import React, { useEffect } from 'react';
import { COMPLETION_KIND } from '../domain/policy/completion.js';

// The moment a culture is finished.
//
// Completing a theme used to change a progress line from 2/3 to 3/3 and
// nothing else — the one point in the app where a traveller has genuinely
// done something passed without being marked. This marks it: a stamp lands,
// the culture is named, and the next thing to do is offered while the sense
// of having finished is still fresh.
//
// Deliberately restrained. It is a stamp pressed into a page, not confetti:
// one animation, under a second, and it never blocks — tapping anywhere or
// pressing Escape closes it, and it closes itself if left alone.
export default function ThemeComplete({
  theme, remaining = 0, kind = null, next, nextReason, onClose, onOpenNext,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!theme) return null;

  return (
    <div className="complete-scrim" onClick={onClose} role="presentation">
      <div
        className="complete-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-live="polite"
        aria-label={`${theme.title} complete`}
      >
        <div className="complete-stamp" aria-hidden="true">
          <span className="complete-stamp__mark">✓</span>
        </div>

        {/* A theme finishes when one of its narratives does, so there can be
            experiences left inside a theme the model calls complete. Saying
            "culture complete" there would overstate it — and the traveller
            would notice, because Explore still offers to continue this very
            theme. What finished is the path they walked. */}
        <p className="complete-eyebrow">{remaining > 0 ? 'Path complete' : 'Culture complete'}</p>
        <h2 className="complete-title">{theme.title}</h2>
        {theme.titleKo && <p className="complete-title-ko">{theme.titleKo}</p>}
        <p className="complete-note">
          {remaining > 0
            ? `Stamped into your passport. There ${remaining === 1 ? 'is 1 experience' : `are ${remaining} experiences`} left in this one if you want more of it.`
            : 'Stamped into your passport.'}
        </p>

        {/* Said on the stamp itself, because this is the moment the claim is
            made. A theme still in preview has no verified venue anywhere in
            it, so every step falls to the traveller's own word — which a
            tester noticed and called skimming. Their word is accepted; it is
            simply not the same sentence as having eaten at four places, and
            the app was printing one sentence for both. */}
        {kind === COMPLETION_KIND.DECLARED && (
          <p className="complete-basis">
            Recorded on your word — none of these had a verified place to visit
            yet.
          </p>
        )}
        {kind === COMPLETION_KIND.MIXED && (
          <p className="complete-basis">
            Part visited, part on your own word.
          </p>
        )}

        {next && (
          <div className="complete-next">
            <p className="complete-next__label">Where to next</p>
            <button className="complete-next__btn" onClick={() => onOpenNext(next)}>
              <span className="complete-next__name">{next.title}</span>
              {nextReason && <span className="complete-next__reason">{nextReason}</span>}
            </button>
          </div>
        )}

        <button className="complete-dismiss" onClick={onClose}>Not now</button>
      </div>
    </div>
  );
}
