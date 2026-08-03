import React, { useState } from 'react';
import { getStoredTheme, setTheme } from '../data/theme.js';

// The fifth tab (2026-08-04). Appearance lived inside the profile form,
// which put a device preference in the middle of fields a host actually
// reads — the user's call was to give it its own place in the bar instead.
//
// Two choices, not three. The old System/Light/Dark trio made somebody who
// had never thought about it pick between abstractions; 디폴트 is simply how
// the app looks, 다크 is the night version, and that is the entire decision.
// Choosing 디폴트 pins light rather than re-following the OS, because a
// person who tapped a button expects the button to win over a sensor.
const CHOICES = [
  { id: 'light', kr: '디폴트', en: 'Default' },
  { id: 'dark', kr: '다크', en: 'Dark' },
];

export default function SettingsTab() {
  const [theme, setThemeState] = useState(getStoredTheme);
  // Anything that is not explicitly dark reads as 디폴트 — including the
  // 'system' value older devices stored back when three choices existed.
  const active = theme === 'dark' ? 'dark' : 'light';

  return (
    <section className="journal-panel settings-tab" aria-label="Settings">
      <header className="screen-head screen-head--dark">
        <span className="screen-head__kr">설정</span>
        <h1 className="screen-head__title">Settings</h1>
        <p className="screen-head__sub">How the app looks on this device.</p>
      </header>

      <div className="journal-settings">
        <div className="journal-section-header">
          <h3>화면 모드 · Appearance</h3>
        </div>
        <p className="journal-settings__hint">
          Stays on this device — it changes your screen and nobody else&rsquo;s.
        </p>
        <div className="chip-row">
          {CHOICES.map(c => (
            <button
              key={c.id}
              className={`chip${active === c.id ? ' active' : ''}`}
              aria-pressed={active === c.id}
              onClick={() => setThemeState(setTheme(c.id))}
            >
              {c.kr} · {c.en}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
