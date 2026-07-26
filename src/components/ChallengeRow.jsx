import React from 'react';
import { CheckIcon } from './Icons';

// Challenges are read-only by design: they complete when the underlying
// records do, so there is nothing to tick off by hand and nothing to fake.
export default function ChallengeRow({ challenges }) {
  return (
    <div className="home-scroll-row">
      {challenges.map(c => (
        <div key={c.id} className={`challenge-card${c.done ? ' is-done' : ''}`}>
          <div className="challenge-card__top">
            <span className="challenge-card__emoji">{c.emoji}</span>
            {c.done ? (
              <span className="challenge-card__done"><CheckIcon size={13} /> Done</span>
            ) : (
              <span className="challenge-card__count">{c.current}/{c.target}</span>
            )}
          </div>
          <h3>{c.title}</h3>
          <p className="challenge-card__hint">{c.hint}</p>
        </div>
      ))}
    </div>
  );
}
