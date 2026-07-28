import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, CheckIcon } from './Icons';
import { experienceById, experienceIdsOfTheme, narrativesOfTheme, stepsOfNarrative, hasAnchor } from '../domain/catalog/index.js';
import { experienceDone } from '../domain/policy/completion.js';
import { restaurants } from '../data/restaurants';
import { traditionalMarkets } from '../data/experiences';
import { isQuarantined } from '../data/verification';

// A Theme as a journey in progress, not a list of experiences.
//
// A real trip is walked one step at a time, so the page leads with the single
// next thing and files the rest around it: what is done, what remains. The
// list is still there — it is just no longer the first thing asked of the
// traveller.
//
// A theme can hold several narratives. The one being walked is the
// most-progressed; the others are offered underneath as alternate paths
// rather than interleaved, which would make "next" ambiguous.
export default function ThemePage({
  theme, journey, onBack, onOpenRestaurant, onToggleAttestation,
  visitedMarkets = [], onToggleMarket,
}) {
  const [expandDone, setExpandDone] = useState(false);
  if (!theme) return null;

  const isDone = (exp) => (journey && exp ? experienceDone(exp, journey) : false);

  const narratives = narrativesOfTheme(theme.id);
  const paths = narratives.map(n => {
    const steps = stepsOfNarrative(n.id).map(s => ({ ...s, experience: experienceById(s.experienceId) }));
    const done = steps.filter(s => isDone(s.experience)).length;
    return { narrative: n, steps, done, total: steps.length };
  });

  // The path with the most behind it is the one the traveller is on. Ties go
  // to the first authored, which keeps the choice stable between renders.
  const active = paths.slice().sort((a, b) => b.done - a.done)[0] ?? null;
  const alternates = paths.filter(p => p !== active);

  const stepIds = new Set(paths.flatMap(p => p.steps.map(s => s.experienceId)));
  const loose = experienceIdsOfTheme(theme.id)
    .filter(id => !stepIds.has(id))
    .map(id => ({ experience: experienceById(id), required: false }));

  const activeSteps = active ? active.steps : [];
  const completed = activeSteps.filter(s => isDone(s.experience));
  const remaining = activeSteps.filter(s => !isDone(s.experience));
  const next = remaining[0] ?? null;

  const themeDone = activeSteps.length > 0 && remaining.length === 0;
  const totalDone = experienceIdsOfTheme(theme.id).filter(id => isDone(experienceById(id))).length;
  const totalAll = experienceIdsOfTheme(theme.id).length;
  const pct = totalAll === 0 ? 0 : Math.round((totalDone / totalAll) * 100);

  const venuesFor = (exp) =>
    exp.restaurantIds.map(id => restaurants.find(r => r.id === id)).filter(r => r && !isQuarantined(r));

  // A step anchored to a market used to render as a dead end: no restaurant to
  // open, no attestation allowed, and a hint saying the places were still
  // being verified — which was untrue. The market is verified, the traveller
  // just had no way to say they had been. Marking one is the same action the
  // Explore feed already offers; it belongs on the step that asks for it.
  const marketsFor = (exp) =>
    exp.marketIds.map(id => traditionalMarkets.find(m => m.id === id)).filter(Boolean);

  const marketVisited = (id) => visitedMarkets.some(e => e.id === id);

  // Attestation is the completion route for an experience with nothing to
  // visit. The policy refuses it for anchored experiences on purpose — it
  // must not become a way to tick off a restaurant you never went to — so the
  // control only appears where it is genuinely the intended path.
  const canAttest = (exp) => exp.acceptsSelfAttest && !hasAnchor(exp);

  const renderNextCard = (step) => {
    const exp = step.experience;
    const venues = venuesFor(exp);
    const markets = marketsFor(exp);
    return (
      <div className="next-step">
        <span className="next-step__label">Next step</span>
        <h3 className="next-step__title">
          {exp.title}
          {exp.titleKo && <span className="next-step__kr">{exp.titleKo}</span>}
        </h3>
        {step.transition && <p className="next-step__transition">{step.transition}</p>}
        <p className="next-step__why">{exp.whyItMatters}</p>

        <div className="next-step__mission">
          <span className="next-step__mission-label">Mission</span>
          <p><strong>{exp.mission.title}</strong> — {exp.mission.detail}</p>
        </div>

        {venues.length > 0 && (
          <div className="next-step__venues">
            {venues.map(v => (
              <button key={v.id} className="theme-venue" onClick={() => onOpenRestaurant(v)}>
                <MapPinIcon size={14} />
                <span>{v.name.split('(')[0].trim()}</span>
                <ChevronRightIcon size={14} />
              </button>
            ))}
            <p className="next-step__hint">Mark a place visited to complete this step.</p>
          </div>
        )}

        {markets.length > 0 && onToggleMarket && (
          <div className="next-step__venues">
            {markets.map(m => (
              <button
                key={m.id}
                className={`next-step__done${marketVisited(m.id) ? ' is-done' : ''}`}
                onClick={() => onToggleMarket(m.id)}
              >
                <CheckIcon size={17} />{' '}
                {marketVisited(m.id)
                  ? `${m.name} — visited`
                  : `방문 체크 · I have been to ${m.name}`}
              </button>
            ))}
          </div>
        )}

        {canAttest(exp) && (
          <button
            className="next-step__done"
            onClick={() => onToggleAttestation(exp.id)}
          >
            <CheckIcon size={17} /> 완료 체크 · Mark this done
          </button>
        )}

        {!venues.length && !markets.length && !canAttest(exp) && (
          <p className="next-step__hint">
            No verified place yet, and this step needs one — it will open up as
            venues are confirmed.
          </p>
        )}
      </div>
    );
  };

  const renderRow = (item, { done }) => {
    const exp = item.experience;
    if (!exp) return null;
    // Rows offer the market tick only where there is exactly one market to
    // mean — with two anchors a single tick would be guessing which one.
    const rowMarkets = marketsFor(exp);
    const soleMarket = rowMarkets.length === 1 ? rowMarkets[0] : null;
    return (
      <li key={exp.id} className={`step-row${done ? ' is-done' : ''}`}>
        <span className="step-row__mark" aria-hidden="true">
          {done ? <CheckIcon size={12} /> : <span className="step-row__dot" />}
        </span>
        <div className="step-row__body">
          <span className="step-row__title">{exp.title}</span>
          {item.required === false && <span className="step-row__optional">optional</span>}
        </div>
        {!done && canAttest(exp) && (
          <button
            className="step-row__check"
            aria-label={`Mark ${exp.title} done`}
            onClick={() => onToggleAttestation(exp.id)}
          >
            <CheckIcon size={14} />
          </button>
        )}
        {!done && !canAttest(exp) && soleMarket && onToggleMarket && (
          <button
            className="step-row__check"
            aria-label={`Mark ${soleMarket.name} visited`}
            onClick={() => onToggleMarket(soleMarket.id)}
          >
            <CheckIcon size={14} />
          </button>
        )}
        {done && canAttest(exp) && (
          <button
            className="step-row__undo"
            onClick={() => onToggleAttestation(exp.id)}
          >
            undo
          </button>
        )}
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
        <div className="theme-page__progress">
          <div className="theme-page__bar"><div style={{ width: `${pct}%` }} /></div>
          <span>{totalDone} / {totalAll} experiences</span>
        </div>
      </div>

      <div className="theme-page__body">
        {/* Where you are — the single next thing, or the finish */}
        {themeDone ? (
          <div className="theme-complete">
            <span className="theme-complete__mark"><CheckIcon size={22} /></span>
            <h3>Theme complete</h3>
            <p>{active?.narrative.outro ?? 'You have walked this path end to end.'}</p>
          </div>
        ) : next ? (
          renderNextCard(next)
        ) : (
          <p className="theme-page__intro">This theme has no path authored yet.</p>
        )}

        {active && (
          <p className="theme-page__pathname">
            On the path: <strong>{active.narrative.title}</strong>
            <span className="theme-page__pacing">{active.narrative.pacing.replace('-', ' ')}</span>
          </p>
        )}

        {/* What is left */}
        {remaining.length > 1 && (
          <section className="theme-page__section">
            <div className="theme-page__section-head"><h2>Still to come</h2></div>
            <ol className="step-rows">{remaining.slice(1).map(s => renderRow(s, { done: false }))}</ol>
          </section>
        )}

        {/* What is behind you */}
        {completed.length > 0 && (
          <section className="theme-page__section">
            <div className="theme-page__section-head">
              <h2>Completed</h2>
              <button className="theme-page__toggle" onClick={() => setExpandDone(v => !v)}>
                {expandDone ? 'Hide' : `Show ${completed.length}`}
              </button>
            </div>
            {expandDone && (
              <ol className="step-rows">{completed.map(s => renderRow(s, { done: true }))}</ol>
            )}
          </section>
        )}

        {alternates.length > 0 && (
          <section className="theme-page__section">
            <div className="theme-page__section-head"><h2>Another way through</h2></div>
            {alternates.map(p => (
              <div key={p.narrative.id} className="alt-path">
                <h3>{p.narrative.title}</h3>
                <p>{p.narrative.intro}</p>
                <span className="alt-path__meta">
                  {p.done}/{p.total} · {p.narrative.pacing.replace('-', ' ')}
                </span>
              </div>
            ))}
          </section>
        )}

        {loose.length > 0 && (
          <section className="theme-page__section">
            <div className="theme-page__section-head"><h2>Also part of this theme</h2></div>
            <ol className="step-rows">
              {loose.map(item => renderRow(item, { done: isDone(item.experience) }))}
            </ol>
          </section>
        )}
      </div>
    </section>
  );
}
