import React, { useState } from 'react';
import { LANGUAGES } from '../domain/catalog/languages.js';
import { RESTRICTIONS, restrictionLabel } from '../data/profile';

// Profile — the four things the app actually does something with.
//
// What was here before was a settings screen in the shape of a settings
// screen and nothing else. "Countries Visited: 3" was the literal number 3,
// typed in; "Interests: Photography, History, Cafe Hopping" was a sentence
// about a person nobody had asked. Travel Style and Availability opened
// pickers wired to `onChange={() => {}}`. Match Preferences configured a
// swipe deck that no longer exists, and Notifications toggled alerts the app
// has no way to send.
//
// That is the same failure as the eighty generated travellers, pointed at
// the user instead of at strangers: the screen was describing somebody it
// had never met. Everything below is either typed by the person reading it
// or not shown at all — and each field changes something visible elsewhere,
// which is the only reason a setting deserves a row.

// The list lives in the catalog now: a table declares languages too, and two
// copies of this array is how the Profile and the table stop agreeing.

function Field({ label, hint, children }) {
  return (
    <div className="profile-field">
      <span className="profile-field__label">{label}</span>
      {children}
      {hint && <p className="profile-field__hint">{hint}</p>}
    </div>
  );
}

// Saved on every keystroke rather than on blur. Blur never fires if somebody
// types their name and taps straight to Tables, and losing it there means
// being asked for it again at the next table — which is the exact thing this
// screen exists to stop.
function ProfileTab({ profile, onProfileChange, onNavigate }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [nationality, setNationality] = useState(profile?.nationality ?? '');
  const languages = profile?.languages ?? [];
  const avoids = profile?.avoids ?? [];

  const save = (patch) => onProfileChange?.({ ...profile, ...patch });

  const toggle = (list, value) =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value];

  return (
    <section className="tab-panel profile-panel">
      <header className="screen-head">
        <span className="screen-head__kr">설정</span>
        <h1 className="screen-head__title">How the app should treat you.</h1>
        <p className="screen-head__sub">
          Set once here and no table asks you again.
        </p>
      </header>

      <div className="profile-body">
        <Field
          label="Your name"
          hint="What the table looks for when you arrive."
        >
          <input
            type="text"
            className="profile-input"
            value={name}
            placeholder="Aya"
            onChange={e => { setName(e.target.value); save({ name: e.target.value.trim() }); }}
          />
        </Field>

        <Field label="Where you are from" hint="Optional. Shown to the table, nowhere else.">
          <input
            type="text"
            className="profile-input"
            value={nationality}
            placeholder="Japan"
            onChange={e => { setNationality(e.target.value); save({ nationality: e.target.value.trim() }); }}
          />
        </Field>

        <Field
          label="Languages you speak"
          hint="So a host knows what the table will run in."
        >
          <div className="chip-row">
            {LANGUAGES.map(l => (
              <button
                key={l}
                className={`chip${languages.includes(l) ? ' active' : ''}`}
                aria-pressed={languages.includes(l)}
                onClick={() => save({ languages: toggle(languages, l) })}
              >
                {l}
              </button>
            ))}
          </div>
        </Field>

        {/* The one setting that changes what other screens say. A dish whose
            ingredients you have excluded is flagged on the table list, on the
            table itself, and while opening one — the plan calls this 개인
            조건에 적합한 한식 메뉴 우선 제시, and a preference the app never
            acts on is decoration. */}
        <Field
          label="What you do not eat"
          hint="Tables serving these are flagged before you ask for a seat. Nothing is hidden from you — the warning is on the card."
        >
          <div className="chip-row">
            {RESTRICTIONS.map(r => (
              <button
                key={r}
                className={`chip${avoids.includes(r) ? ' active' : ''}`}
                aria-pressed={avoids.includes(r)}
                onClick={() => save({ avoids: toggle(avoids, r) })}
              >
                {restrictionLabel(r)}
              </button>
            ))}
          </div>
        </Field>

        <button className="profile-link" onClick={() => onNavigate('journal')}>
          Everything you have done →
        </button>

        {/* Version and policy, and nothing that pretends to be a feature. */}
        <p className="profile-foot">밥친구 Eatple · pilot build</p>
      </div>
    </section>
  );
}

export default function TabPanel({ tab, profile, onProfileChange, onNavigate }) {
  if (tab === 'profile') {
    return <ProfileTab profile={profile} onProfileChange={onProfileChange} onNavigate={onNavigate} />;
  }
  return null;
}
