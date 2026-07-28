import React, { useState } from 'react';
import './Prologue.css';

// One screen, then the app.
//
// This used to be four: a "discover food that matches your taste" welcome
// from the restaurant-finder era, a stories screen, a location permission,
// and a spinner reading "Finding restaurants near you...". Two of those were
// untrue — the app never calls geolocation, and both permission buttons ran
// the same function, so the prompt was decoration; nothing was being fetched
// during the spinner either. Between them they spent the first twenty seconds
// of a traveller's time describing things that were not happening.
//
// What is left says what the app is and gets out of the way, so the first
// real thing seen is a culture that can be started.
export default function Prologue({ onComplete }) {
  const [leaving, setLeaving] = useState(false);

  const enter = () => {
    setLeaving(true);
    // Long enough to read as a transition, short enough not to be a wait.
    setTimeout(onComplete, 320);
  };

  return (
    <div className="prologue-layout">
      <div className={`prologue-content ${leaving ? 'fade-out' : 'fade-in'}`}>
        <div className="prologue-step">
          <span className="prologue-flag" aria-hidden="true">🇰🇷</span>
          <h1 className="prologue-title">Experience Korea through food.</h1>
          <p className="prologue-subtitle">
            Choose a culture, follow it one step at a time, and keep what you
            have done in your passport.
          </p>
          <button className="prologue-btn" onClick={enter}>Start exploring</button>
        </div>
      </div>
    </div>
  );
}
