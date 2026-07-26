import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, CheckIcon } from './Icons';
import { experienceById, experienceIdsOfTheme, narrativesOfTheme, stepsOfNarrative } from '../domain/catalog/index.js';
import { experienceDone } from '../domain/policy/completion.js';
import { restaurants } from '../data/restaurants';
import { isQuarantined } from '../data/verification';

// A Theme as a screen, not a sheet.
//
// Theme is the app's primary content object, so it gets a place to stand
// rather than being stacked as one more overlay on a pile of them. Sheets
// suit tools and details — a map you summon, a restaurant's verified facts —
// but a traveller reading about a culture should be somewhere, able to go
// back, not holding a modal open.
//
// It shows progress per step, which is what makes it a Journey surface and
// not just an article: you can see where you are in this path.
export default function ThemePage({ theme, journey, onBack, onOpenRestaurant }) {
  if (!theme) return null;

  const narratives = narrativesOfTheme(theme.id);
  const stepIds = new Set(
    narratives.flatMap(n => stepsOfNarrative(n.id).map(s => s.experienceId)),
  );
  const looseIds = experienceIdsOfTheme(theme.id).filter(id => !stepIds.has(id));

  const venuesFor = (experience) =>
    experience.restaurantIds
      .map(id => restaurants.find(r => r.id === id))
      .filter(r => r && !isQuarantined(r));

  const renderExperience = (experience, step) => {
    if (!experience) return null;
    const venues = venuesFor(experience);
    const done = journey ? experienceDone(experience, journey) : false;

    return (
      <li key={experience.id} className={`theme-step${done ? ' is-done' : ''}`}>
        <span className="theme-step__dot" aria-hidden="true">
          {done && <CheckIcon size={11} />}
        </span>
        <div className="theme-step__body">
          <div className="theme-step__head">
            <h4>{experience.title}</h4>
            {experience.titleKo && <span className="theme-step__kr">{experience.titleKo}</span>}
            {step && !step.required && <span className="theme-step__optional">optional</span>}
            {done && <span className="theme-step__doneTag">done</span>}
          </div>
          {step?.transition && <p className="theme-step__transition">{step.transition}</p>}
          <p className="theme-step__why">{experience.whyItMatters}</p>

          {venues.length > 0 ? (
            <div className="theme-step__venues">
              {venues.map(v => (
                <button key={v.id} className="theme-venue" onClick={() => onOpenRestaurant(v)}>
                  <MapPinIcon size={14} />
                  <span>{v.name.split('(')[0].trim()}</span>
                  <ChevronRightIcon size={14} />
                </button>
              ))}
            </div>
          ) : (
            <p className="theme-step__pending">
              No verified place for this yet — the mission stands on its own.
            </p>
          )}

          <p className="theme-step__mission">
            <strong>{experience.mission.title}</strong> — {experience.mission.detail}
          </p>
        </div>
      </li>
    );
  };

  return (
    <section className="theme-page" aria-label={theme.title}>
      <header className="theme-page__nav">
        <button className="theme-page__back" onClick={onBack}>
          <ChevronLeftIcon size={18} />
          <span>Explore</span>
        </button>
      </header>

      <div className="theme-page__hero">
        <span className="theme-page__emoji">{theme.emoji}</span>
        <h1>{theme.title}</h1>
        <p className="theme-page__tagline">{theme.tagline}</p>
        {theme.status === 'preview' && (
          <span className="theme-page__badge">Preview · venues still being verified</span>
        )}
      </div>

      <div className="theme-page__body">
        <p className="theme-page__narrative">{theme.narrative}</p>

        {narratives.map(n => (
          <section key={n.id} className="theme-page__section">
            <div className="theme-page__section-head">
              <h2>{n.title}</h2>
              <span className="theme-page__pacing">{n.pacing.replace('-', ' ')}</span>
            </div>
            <p className="theme-page__intro">{n.intro}</p>
            <ol className="theme-steps">
              {stepsOfNarrative(n.id).map(s => renderExperience(experienceById(s.experienceId), s))}
            </ol>
            <p className="theme-page__outro">{n.outro}</p>
          </section>
        ))}

        {looseIds.length > 0 && (
          <section className="theme-page__section">
            <div className="theme-page__section-head">
              <h2>Also part of this theme</h2>
            </div>
            <ol className="theme-steps">
              {looseIds.map(id => renderExperience(experienceById(id), null))}
            </ol>
          </section>
        )}
      </div>
    </section>
  );
}
