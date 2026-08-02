import React from 'react';
import {
  SAFETY_STEPS, NOT_YET_BUILT, REPORT_CHANNEL, reportingConfigured, PURPOSE,
} from '../content/safety.js';
import { ChevronLeftIcon } from './Icons';

// The sheet you open when the evening is going wrong.
//
// Reachable from the table page rather than buried in settings, because the
// moment somebody needs it they are sitting at that table. The numbers come
// first: 112 and 119 work whether or not this app does.
//
// It says out loud what it cannot do. An app that offers a safety screen and
// silently has no reporting channel has traded a real duty for the appearance
// of one, and a traveller would find that out at the worst possible time.
export default function SafetySheet({ onClose }) {
  return (
    <div className="phrase-sheet" role="dialog" aria-label="Safety">
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onClose} aria-label="Close">
          <ChevronLeftIcon size={20} />
        </button>
        <h1>도움 · Getting help</h1>
      </header>

      {/* Above the emergency numbers, because most of what this screen is
          reached for is not an emergency — it is somebody wanting to know
          what the rules are before they decide. */}
      <div className="safety-purpose">
        <p className="safety-purpose__head">
          <span className="safety-purpose__kr">{PURPOSE.kr}</span>
          <span className="safety-purpose__en">{PURPOSE.en}</span>
        </p>
        <p className="safety-purpose__rule">{PURPOSE.rule}</p>
        <p className="safety-purpose__broken">{PURPOSE.ifBroken}</p>
      </div>

      <div className="safety">
        <a className="safety__call" href="tel:112">
          <span className="safety__call-num">112</span>
          <span className="safety__call-label">Police</span>
        </a>
        <a className="safety__call" href="tel:119">
          <span className="safety__call-num">119</span>
          <span className="safety__call-label">Fire · ambulance</span>
        </a>
        <a className="safety__call safety__call--wide" href="tel:1330">
          <span className="safety__call-num">1330</span>
          <span className="safety__call-label">Korea Travel Helpline · 24h, English</span>
        </a>
      </div>

      <div className="phrase-list">
        {SAFETY_STEPS.map(s => (
          <div key={s.id} className="safety-step">
            <p className="safety-step__title">{s.title}</p>
            <p className="safety-step__body">{s.body}</p>
          </div>
        ))}

        {reportingConfigured() ? (
          <a className="safety__report" href={REPORT_CHANNEL.href} target="_blank" rel="noreferrer">
            Report to {REPORT_CHANNEL.label}
          </a>
        ) : (
          /* Not a button. A report that goes nowhere is worse than none,
             because somebody trusted it at the moment they needed it. */
          <p className="safety__unwired">
            In-app reporting is not connected yet. Until it is, tell the 밥친구 team directly —
            during the pilot somebody from the team is reachable at the meeting point.
          </p>
        )}

        <div className="safety__owed">
          <p className="safety__owed-label">Not built yet</p>
          <ul>
            {NOT_YET_BUILT.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
