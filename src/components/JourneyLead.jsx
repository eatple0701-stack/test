import React from 'react';
import { ChevronRightIcon, SparkleIcon } from './Icons';

// The first thing on Explore, and the app's answer to "what do I do today?".
//
// A theme grid asks the traveller to browse a taxonomy. This asks nothing:
// either you are partway through something and it offers the next step, or
// you have not started and it offers one concrete place to begin.
//
// Two states, because a first-run traveller has no journey and an empty
// progress card would be worse than no card at all.
export default function JourneyLead({
  continueTheme,     // { themeId, title, done, total, pct } | null
  nextExperience,    // { id, title } | null
  suggestedTheme,    // a published theme record, for the start state
  onOpenTheme,
  onOpenSummary,
}) {
  const resuming = Boolean(continueTheme);
  const theme = resuming ? continueTheme : suggestedTheme;
  if (!theme) return null;

  return (
    <div className="journey-lead">
      <div className="journey-lead__top">
        <span className="journey-lead__eyebrow">
          {resuming ? '🔥 Continue your journey' : '✨ Start your journey'}
        </span>
        {onOpenSummary && resuming && (
          <button className="journey-lead__summary" onClick={onOpenSummary}>
            Passport <ChevronRightIcon size={13} />
          </button>
        )}
      </div>

      <h2 className="journey-lead__title">
        {resuming ? continueTheme.title : suggestedTheme.title}
      </h2>

      {resuming ? (
        <>
          <p className="journey-lead__line">
            {continueTheme.done} of {continueTheme.total} experiences done
            {nextExperience && <> · next up <strong>{nextExperience.title}</strong></>}
          </p>
          <div className="journey-lead__bar">
            <div className="journey-lead__fill" style={{ width: `${continueTheme.pct}%` }} />
          </div>
        </>
      ) : (
        <p className="journey-lead__line">
          {suggestedTheme.tagline} Pick this up and your Passport starts filling itself.
        </p>
      )}

      <button
        className="journey-lead__cta"
        onClick={() => onOpenTheme(resuming ? continueTheme.themeId : suggestedTheme.id)}
      >
        {resuming ? '계속하기 · Continue' : '시작하기 · Start here'}
        <ChevronRightIcon size={16} />
      </button>
    </div>
  );
}

// A second, lighter card: one theme picked for today, so the traveller who
// does not want to resume still gets a single answer rather than a grid.
// Deterministic by date, so it does not shuffle on every render.
export function TodaysPick({ theme, reason, onOpenTheme }) {
  if (!theme) return null;
  return (
    <button className="todays-pick" onClick={() => onOpenTheme(theme.id)}>
      <span className="todays-pick__label">
        <SparkleIcon size={14} /> Today&rsquo;s recommendation
      </span>
      <span className="todays-pick__title">{theme.emoji} {theme.title}</span>
      {/* The reason is the point: a pick without one is just a card. It is
          derived from the date, the clock or the traveller's own record —
          never from anything the app cannot actually check. */}
      {reason && <span className="todays-pick__reason">{reason}</span>}
      <span className="todays-pick__cta">See the path <ChevronRightIcon size={14} /></span>
    </button>
  );
}
