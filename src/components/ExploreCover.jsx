import React from 'react';
import { ChevronRightIcon } from './Icons';
import { editorialFor } from '../content/exploreEditorial.js';
import { useText, useLocale } from './localeText.js';
import { LOCALE } from '../domain/policy/locale.js';

const DATE_FORMAT = { weekday: 'long', day: 'numeric', month: 'long' };

// "Friday 14 August" on an otherwise Spanish cover is the one line that gives
// away that the screen was translated rather than written. Intl already knows
// every one of these; the only decision here is which tag to hand it.
const DATE_LOCALE = {
  [LOCALE.KO]: 'ko-KR',
  [LOCALE.ES]: 'es-ES',
};

// The cover of the issue.
//
// What stood here before was a hero that explained the app — "Experience Korea
// through food", a paragraph of positioning, two buttons — and then, four
// sections down, a small chip that said "Today's recommendation". The app
// introduced itself before it showed anything, which is what a manual does.
// A magazine puts the story on the cover and lets you work out what it is.
//
// So the recommendation *is* the opening now, at full size, and the reason it
// was picked is set as a signed note rather than a caption. The pick was
// always honest — it comes from the policy, off the date and the traveller's
// own record — but reading it in eleven grey pixels made it feel automatic.
// Same sentence, given the room to sound like somebody chose it.
export default function ExploreCover({ theme, reason, progress, onOpen, at = new Date() }) {
  const say = useText();
  const locale = useLocale();
  if (!theme) return null;
  const editorial = editorialFor(theme.id);

  return (
    <section className="cover" aria-label="Editor's pick">
      {editorial && (
        <span className="cover__word" aria-hidden="true">{editorial.word}</span>
      )}

      <div className="cover__masthead">
        <span className="cover__label" translate="no">
          {say('오늘의 추천 · Editor\u2019s pick', null, 'La elección del editor')}
        </span>
        {/* The date follows the setting too. "Tuesday, 11 August" on an
            otherwise Korean cover is the one line that gives away that this
            screen was translated rather than written. */}
        <span className="cover__date">
          {at.toLocaleDateString(DATE_LOCALE[locale] ?? 'en-GB', DATE_FORMAT)}
        </span>
      </div>

      <h1 className="cover__question">
        {editorial
          ? say(editorial.question, editorial.questionKo, editorial.questionEs)
          : say(theme.tagline, theme.taglineKo, theme.taglineEs)}
      </h1>

      {/* Just the name. A tagline sat here through the first build, between
          the question and the reason, and it read as a third voice competing
          with two better ones — the question is the hook and the note is the
          judgement. Neither needs a subtitle explaining it. */}
      <p className="cover__theme">{say(theme.title, theme.titleKo, theme.titleEs)}</p>

      {reason && (
        <div className="cover__note">
          <span className="cover__note-label">{say('Why this, today', '오늘 이걸 고른 이유', 'Por qué esto, hoy')}</span>
          <p className="cover__note-body">{reason}</p>
        </div>
      )}

      <button className="cover__cta" onClick={() => onOpen(theme.id)}>
        {progress?.done > 0
          ? say('이어서 보기 · Pick it back up', null, 'Retomarlo')
          : say('들어가기 · Enter this culture', null, 'Entrar en esta cultura')}
        <ChevronRightIcon size={16} />
      </button>
    </section>
  );
}
