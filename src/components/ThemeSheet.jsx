import React from 'react';
import { XIcon, ChevronRightIcon, MapPinIcon } from './Icons';
import { experienceById, experienceIdsOfTheme, narrativesOfTheme, stepsOfNarrative } from '../domain/catalog/index.js';
import { restaurants } from '../data/restaurants';
import { isQuarantined } from '../data/verification';

// A Theme opened from Explore.
//
// The point of the hierarchy is that a Theme is a cultural territory and a
// Narrative is one path through it, so this shows the narrative's ordered
// steps rather than an undifferentiated pile of experiences. Restaurants
// appear as anchors underneath the experience they realise — never as the
// entry point, which is what NavigationPolicy asks for.
//
// Themes whose venues are not yet verified say so plainly instead of
// presenting an empty list as if something were broken.
export default function ThemeSheet({ theme, onClose, onOpenRestaurant }) {
  if (!theme) return null;

  const narratives = narrativesOfTheme(theme.id);
  const looseIds = experienceIdsOfTheme(theme.id).filter(
    id => !narratives.some(n => stepsOfNarrative(n.id).some(s => s.experienceId === id)),
  );

  const venuesFor = (experience) =>
    experience.restaurantIds
      .map(id => restaurants.find(r => r.id === id))
      .filter(r => r && !isQuarantined(r));

  const renderExperience = (experience, step) => {
    if (!experience) return null;
    const venues = venuesFor(experience);
    return (
      <li key={experience.id} className="theme-step">
        <span className="theme-step__dot" aria-hidden="true" />
        <div className="theme-step__body">
          <div className="theme-step__head">
            <h4>{experience.title}</h4>
            {experience.titleKo && <span className="theme-step__kr">{experience.titleKo}</span>}
            {step && !step.required && <span className="theme-step__optional">optional</span>}
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
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <div className="detail-sheet" role="dialog" aria-modal="true" aria-label={theme.title}>
        <button className="detail-close" aria-label="Close" onClick={onClose}>
          <XIcon size={18} />
        </button>

        <div className="detail-scroll">
          <div className="theme-sheet__hero">
            <span className="theme-sheet__emoji">{theme.emoji}</span>
            <h2>{theme.title}</h2>
            <p className="theme-sheet__tagline">{theme.tagline}</p>
            {theme.status === 'preview' && (
              <span className="theme-sheet__badge">Preview · venues still being verified</span>
            )}
          </div>

          <div className="detail-content">
            <p className="detail-body">{theme.narrative}</p>

            {narratives.map(n => (
              <section key={n.id} className="detail-section">
                <div className="section-head">
                  <h3>{n.title}</h3>
                  <span className="theme-sheet__pacing">{n.pacing.replace('-', ' ')}</span>
                </div>
                <p className="section-note">{n.intro}</p>
                <ol className="theme-steps">
                  {stepsOfNarrative(n.id).map(s => renderExperience(experienceById(s.experienceId), s))}
                </ol>
                <p className="theme-sheet__outro">{n.outro}</p>
              </section>
            ))}

            {looseIds.length > 0 && (
              <section className="detail-section">
                <div className="section-head">
                  <h3>Also part of this theme</h3>
                </div>
                <ol className="theme-steps">
                  {looseIds.map(id => renderExperience(experienceById(id), null))}
                </ol>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
