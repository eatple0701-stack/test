import React from 'react';
import { ChevronRightIcon } from './Icons';
import { editorialFor } from '../content/exploreEditorial.js';
import { useText, useLocale } from './localeText.js';
import { dateLocale } from '../domain/policy/locale.js';

const DATE_FORMAT = { weekday: 'long', day: 'numeric', month: 'long' };

// "Friday 14 August" on an otherwise Spanish cover is the one line that gives
// away that the screen was translated rather than written. Intl already knows
// every one of these; the only decision here is which tag to hand it.
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
    <section className="cover" aria-label={say("Editor's pick", '오늘의 추천', 'La elección del editor', 'Le choix de la rédaction')}>
      {editorial && (
        <span className="cover__word" aria-hidden="true">{editorial.word}</span>
      )}

      <div className="cover__masthead">
        <span className="cover__label" translate="no">
          {say('오늘의 추천 · Editor\u2019s pick', '오늘의 추천', 'La elección del editor', 'Le choix de la rédaction')}
        </span>
        {/* The date follows the setting too. "Tuesday, 11 August" on an
            otherwise Korean cover is the one line that gives away that this
            screen was translated rather than written. */}
        <span className="cover__date">
          {at.toLocaleDateString(dateLocale(locale), DATE_FORMAT)}
        </span>
      </div>

      <h1 className="cover__question">
        {editorial
          ? say(editorial.question, editorial.questionKo, editorial.questionEs, editorial.questionFr)
          : say(theme.tagline, theme.taglineKo, theme.taglineEs, theme.taglineFr)}
      </h1>

      {/* Just the name. A tagline sat here through the first build, between
          the question and the reason, and it read as a third voice competing
          with two better ones — the question is the hook and the note is the
          judgement. Neither needs a subtitle explaining it. */}
      <p className="cover__theme">{say(theme.title, theme.titleKo, theme.titleEs, theme.titleFr)}</p>

      {reason && (
        <div className="cover__note">
          <span className="cover__note-label">{say('Why this, today', '오늘 이걸 고른 이유', 'Por qué esto, hoy', "Pourquoi ceci, aujourd'hui")}</span>
          <p className="cover__note-body">{reason}</p>
        </div>
      )}

      <button className="cover__cta" onClick={() => onOpen(theme.id)}>
        {progress?.done > 0
          ? say('이어서 보기 · Pick it back up', '이어서 보기', 'Retomarlo', 'Reprendre')
          : say('들어가기 · Enter this culture', '들어가기', 'Entrar en esta cultura', 'Entrer dans cette culture')}
        <ChevronRightIcon size={16} />
      </button>
    </section>
  );
}
