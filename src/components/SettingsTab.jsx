import React, { useState } from 'react';
import { getStoredTheme, setTheme } from '../data/theme.js';
import { isMember } from '../domain/policy/access.js';
import { deleteAccount } from '../data/tableRepository.js';

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

export default function SettingsTab({ auth, onSignedOut }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  // Anything that is not explicitly dark reads as 디폴트 — including the
  // 'system' value older devices stored back when three choices existed.
  const active = theme === 'dark' ? 'dark' : 'light';
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const close = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      onSignedOut?.();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <section className="journal-panel settings-tab" aria-label="Settings">
      <header className="screen-head screen-head--dark">
        <span className="screen-head__kr" translate="no">설정</span>
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

      {/* The door out. Only a member has one to walk through, and it lives
          here rather than on the Passport because the Passport is a record
          somebody keeps — putting "delete everything" beside it invites the
          tap nobody meant to make. Quiet by default, specific when opened:
          the confirmation names what actually disappears, including the part
          people do not expect (their lines on other people's tables). */}
      {isMember(auth) && (
        <div className="journal-settings danger-zone">
          <div className="journal-section-header">
            <h3>계정 · Your account</h3>
          </div>
          {!confirming ? (
            <>
              <p className="journal-settings__hint">
                Closing your account removes everything you gave us — your name,
                email, phone and date of birth — and everything you made here.
              </p>
              <button className="danger-open" translate="no" onClick={() => setConfirming(true)}>
                회원 탈퇴 · Close my account
              </button>
            </>
          ) : (
            <div className="cancel-confirm">
              <p className="cancel-confirm__title">계정을 지울까요? · Close this account?</p>
              <p className="cancel-confirm__body">
                Gone for good, right away: your contact details, your Passport,
                any tables you host and the seats you hold — people going to
                them will see the table disappear. The lines you left on other
                people&rsquo;s tables go too. This cannot be undone, and signing
                up again starts an empty account.
              </p>
              {error && <p className="auth-error">{error}</p>}
              <div className="cancel-confirm__row">
                <button className="cancel-confirm__no" onClick={() => setConfirming(false)} disabled={busy}>
                  그냥 둘게요 · Keep it
                </button>
                <button className="cancel-confirm__yes" onClick={close} disabled={busy}>
                  {busy ? 'Closing…' : '탈퇴 · Close it'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
