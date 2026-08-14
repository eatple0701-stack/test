import React from 'react';
import { routeFor } from '../data/journey';
import { ChevronRightIcon } from './Icons';
import { useText } from './localeText.js';

// "Continue Your Journey" — the meal is step one, not the destination.
// Steps that resolve to a real record are tappable; steps that are a
// suggestion about the neighborhood are shown as such, not as a venue.
export default function CulturalRoute({ place, onOpenRestaurant, onExploreZone }) {
  const say = useText();
  const steps = routeFor(place);
  if (steps.length === 0) return null;

  const handle = (step) => {
    if (step.place) return onOpenRestaurant?.(step.place);
    if (step.market || step.zone) return onExploreZone?.(step.market?.zone ?? step.zone);
    return undefined;
  };

  return (
    <ol className="route-list">
      <li className="route-step route-step--current">
        <span className="route-step__dot" aria-hidden="true" />
        <div className="route-step__body">
          <span className="route-step__label">{place.name.split('(')[0].trim()}</span>
          <span className="route-step__note">{say('You are here', '지금 여기', 'Estás aquí', 'Vous êtes ici', 'أنت هنا', '你在这儿')}</span>
        </div>
      </li>
      {steps.map((step, i) => (
        <li key={`${step.label}-${i}`} className="route-step">
          <span className="route-step__dot" aria-hidden="true" />
          <button className="route-step__body route-step__body--tappable" onClick={() => handle(step)}>
            <span className="route-step__label">
              {step.place
                ? step.place.name.split('(')[0].trim()
                : say(step.label, step.labelKo, step.labelEs, step.labelFr, step.labelAr, step.labelZh)}
              <ChevronRightIcon size={14} />
            </span>
            <span className="route-step__note">{say(step.note, step.noteKo, step.noteEs, step.noteFr, step.noteAr, step.noteZh)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
