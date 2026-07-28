import React from 'react';
import { editorialFor } from '../content/exploreEditorial.js';

// A culture, presented as something to wonder about rather than something to
// browse.
//
// The card this replaces was emoji + title + tagline + progress: four pieces
// of information, none of which gave a reason to care. It described. This one
// asks. The title has moved to an eyebrow because a name is not a reason —
// nobody chose "Temple Life" off a menu; they chose the question underneath it
// and found out what it was called on the way in.
//
// The artwork is the Korean word. This product has eight placeholder
// illustrations shared across forty restaurants, so a photographic card would
// be four cultures wearing the same drawing. One true word, set large enough
// to be a texture rather than a label, says more and lies less.
export default function ThemeStoryCard({ theme, progress, onOpen }) {
  const editorial = editorialFor(theme.id);
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 0;
  const started = done > 0;

  // Two different kinds of "finished", and conflating them puts the card at
  // odds with the resume card sitting directly above it. A theme is `complete`
  // when one of its narratives is walked end to end — but experiences can
  // remain inside it, and Explore will still offer to continue. Only an
  // exhausted theme has nothing left to say.
  const pathDone = Boolean(progress?.complete);
  const exhausted = pathDone && done >= total;

  return (
    <button
      className={`story-card${exhausted ? ' is-complete' : ''}`}
      onClick={() => onOpen(theme.id)}
      aria-label={editorial ? `${editorial.question} — ${theme.title}` : theme.title}
    >
      {/* Cropped by the card edge on purpose: a word that fits inside its box
          reads as a label, and a word that runs out of room reads as print. */}
      {editorial && (
        <span className="story-card__word" aria-hidden="true">{editorial.word}</span>
      )}

      <span className="story-card__eyebrow">
        {theme.title}
        {theme.status === 'preview' && <span className="story-card__flag">Preview</span>}
      </span>

      {/* The question is the card. Everything else is scale and quiet. */}
      <span className="story-card__question">
        {editorial ? editorial.question : theme.tagline}
      </span>

      <span className="story-card__foot">
        {exhausted
          ? 'You have walked this one'
          : pathDone
            ? `A path done · ${total - done} more here`
            : started
              ? `${done} of ${total} done`
              : `${total} ${total === 1 ? 'experience' : 'experiences'}`}
      </span>

      {/* Progress is a hairline, not a widget. It belongs to the traveller,
          not to the invitation, so it sits at the very bottom edge. */}
      {started && !exhausted && (
        <span className="story-card__rule" aria-hidden="true">
          <span className="story-card__rule-fill" style={{ width: `${progress.pct}%` }} />
        </span>
      )}
    </button>
  );
}
