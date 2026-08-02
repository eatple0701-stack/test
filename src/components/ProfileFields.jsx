import React, { useState } from 'react';
import { LANGUAGES } from '../domain/catalog/languages.js';
import { GENDERS } from '../domain/catalog/genders.js';
import { RESTRICTIONS, restrictionLabel, DIETS } from '../data/profile';

// The four things the app actually does something with about you.
//
// This was its own tab. The 8/2 meeting decided to merge it into the Passport,
// and a foreign tester wrote the same thing independently — "merge passport
// and profile" — so it is a section now rather than a destination.
//
// It was never a settings screen in the usual sense. What was here originally
// was: "Countries Visited: 3" as a typed-in literal, interests nobody had been
// asked about, and pickers wired to onChange={() => {}}. Everything below is
// either typed by the person reading it or not shown at all, and each field
// changes something visible on another screen — which is the only reason a
// setting deserves a row.

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
// exists to stop.
export default function ProfileFields({ profile, onProfileChange }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [nationality, setNationality] = useState(profile?.nationality ?? '');
  const languages = profile?.languages ?? [];
  const avoids = profile?.avoids ?? [];
  const diets = profile?.diets ?? [];
  const gender = profile?.gender ?? null;

  const save = (patch) => onProfileChange?.({ ...profile, ...patch });

  const toggle = (list, value) =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value];

  return (
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

        {/* Optional and self-declared, exactly like nationality — never
            verified, never used by the app to decide anything about a dish.
            The one place it changes another screen: the Tables filter
            (TablesTab.jsx), which is the feature this field exists for. */}
        <Field
          label="Gender (optional)"
          hint="Not verified — just what you tell the table. Used only for the 'tables with another woman' filter on Tables."
        >
          <div className="chip-row">
            {GENDERS.map(g => (
              <button
                key={g}
                className={`chip${gender === g ? ' active' : ''}`}
                aria-pressed={gender === g}
                onClick={() => save({ gender: gender === g ? null : g })}
              >
                {g}
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

        {/* Deliberately a separate question from the one above, and worded so
            the difference is visible. The boxes above change what the app
            says about a dish; this one changes what the *host* is told. The
            app cannot rule on whether a 한상 is halal and does not try — it
            passes the word to somebody who can ask the kitchen. */}
        <Field
          label="How you eat"
          hint="Sent to the host with your seat request. The app does not judge dishes by this — it tells the person who can ask."
        >
          <div className="chip-row">
            {DIETS.map(d => (
              <button
                key={d.id}
                className={`chip${diets.includes(d.id) ? ' active' : ''}`}
                aria-pressed={diets.includes(d.id)}
                onClick={() => save({ diets: toggle(diets, d.id) })}
              >
                {d.kr} · {d.en}
              </button>
            ))}
          </div>
        </Field>
    </div>
  );
}
