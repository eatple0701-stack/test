import React, { useState } from 'react';
import { LANGUAGES, languageLabel } from '../domain/catalog/languages.js';
import { GENDERS } from '../domain/catalog/genders.js';
import { RESTRICTIONS, restrictionLabel, DIETS } from '../data/profile';
import { useText } from './localeText.js';

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

/**
 * One question on the profile.
 *
 * `control` marks the three questions answered by a single box rather than a
 * row of chips. Those render as a real <label> wrapped around the input, so
 * the words above it are the box's name rather than text that happens to sit
 * nearby — measured 2026-08-04, all three were unlabelled, which meant a
 * screen reader announced "edit text, Aya" and nothing else. Chip rows stay a
 * <div>: a label pointing at seven buttons names none of them.
 */
function Field({ label, hint, children, control }) {
  const Tag = control ? 'label' : 'div';
  return (
    <Tag className="profile-field">
      <span className="profile-field__label">{label}</span>
      {children}
      {hint && <p className="profile-field__hint">{hint}</p>}
    </Tag>
  );
}

// Saved on every keystroke rather than on blur. Blur never fires if somebody
// types their name and taps straight to Tables, and losing it there means
// being asked for it again at the next table — which is the exact thing this
// exists to stop.
export default function ProfileFields({ profile, onProfileChange }) {
  const say = useText();
  const [name, setName] = useState(profile?.name ?? '');
  const [nationality, setNationality] = useState(profile?.nationality ?? '');
  const [allergyNote, setAllergyNote] = useState(profile?.allergyNote ?? '');
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
          control
          label={say('이름 · Your name', '이름', 'Tu nombre', 'Votre nom', 'اسمك', '你的名字')}
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

        <Field control label={say('출신 · Where you are from', '출신', 'De dónde eres', "D'où vous venez", 'من أين أنت', '你从哪儿来')} hint="Optional. Shown to the table, nowhere else.">
          <input
            type="text"
            className="profile-input"
            value={nationality}
            placeholder={say('Japan', '일본', 'Japón', 'Japon', 'اليابان', '日本')}
            onChange={e => { setNationality(e.target.value); save({ nationality: e.target.value.trim() }); }}
          />
        </Field>

        <Field
          label={say('할 수 있는 언어 · Languages you speak', '할 수 있는 언어', 'Idiomas que hablas', 'Langues que vous parlez', 'اللغات التي تتحدّثها', '你会说的语言')}
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
                {/* Own script first, so somebody finds their own language by
                    shape; the English name under it, so they can also read
                    the six they are not looking for. */}
                <span className="chip__native" translate="no">{l}</span>
                {languageLabel(l).en && (
                  <span className="chip__en">{languageLabel(l).en}</span>
                )}
              </button>
            ))}
          </div>
        </Field>

        {/* Optional and self-declared, exactly like nationality — never
            verified, never used by the app to decide anything about a dish.
            The one place it changes another screen: the Tables filter
            (TablesTab.jsx), which is the feature this field exists for. */}
        <Field
          label={say('성별 · Gender (optional)', '성별 (선택)', 'Género (opcional)', 'Genre (facultatif)', 'الجنس (اختياري)', '性别（可选）')}
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
          label={say('못 먹는 것 · What you do not eat', '못 먹는 것', 'Lo que no comes', 'Ce que vous ne mangez pas', 'ما لا تأكله', '你不吃什么')}
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

        {/* The five boxes above are a fixed list on purpose — see
            RESTRICTIONS's own comment — and a fixed list always has an edge
            somebody falls off. A nut or sesame allergy has nowhere to go
            above this line. This does not check anything either, same as
            the boxes above it; it is carried to the host as a sentence
            instead of five checkboxes. */}
        <Field
          control
          label={say('그 밖에 못 먹는 것 · Anything else you cannot eat? (optional)', '그 밖에 못 먹는 것 (선택)', '¿Algo más que no puedas comer? (opcional)', 'Autre chose que vous ne pouvez pas manger ? (facultatif)', 'أشيء آخر لا تستطيع أكله؟ (اختياري)', '还有别的不能吃的吗？（可选）')}
          hint="Free text, sent to the host with your seat request — not checked against any menu, just carried."
        >
          <textarea
            rows={2}
            className="profile-input"
            value={allergyNote}
            placeholder={say('Severe shellfish allergy, and no sesame please', '갑각류 알레르기가 심하고, 참깨는 빼 주세요', 'Alergia grave al marisco, y sin sésamo por favor', "Allergie grave aux fruits de mer, et sans sésame s'il vous plaît", 'حساسية شديدة من المحار، ومن فضلك بلا سمسم', '对贝类严重过敏，另外请不要放芝麻')}
            onChange={e => {
              setAllergyNote(e.target.value);
              save({ allergyNote: e.target.value.trim() });
            }}
          />
        </Field>

        {/* Deliberately a separate question from the one above, and worded so
            the difference is visible. The boxes above change what the app
            says about a dish; this one changes what the *host* is told. The
            app cannot rule on whether a 한상 is halal and does not try — it
            passes the word to somebody who can ask the kitchen. */}
        <Field
          label={say('식사 방식 · How you eat', '식사 방식', 'Cómo comes', 'Comment vous mangez', 'كيف تأكل', '你怎么吃')}
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

        {/* Appearance used to sit here and was the odd one out — every field
            above changes what a host learns about you; that one only changed
            your own screen. It has its own tab now (SettingsTab), which is
            also what lets this form double as a signup step: everything left
            on it is something a table genuinely reads. */}
    </div>
  );
}
