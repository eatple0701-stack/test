import React from 'react';
import { ChevronRightIcon } from './Icons';
import { editorialFor } from '../content/exploreEditorial.js';

const DATE_FORMAT = { weekday: 'long', day: 'numeric', month: 'long' };

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
  if (!theme) return null;
  const editorial = editorialFor(theme.id);

  return (
    <section className="cover" aria-label="Editor's pick">
      {editorial && (
        <span className="cover__word" aria-hidden="true">{editorial.word}</span>
      )}

      <div className="cover__masthead">
        <span className="cover__label" translate="no">오늘의 추천 · Editor&rsquo;s pick</span>
        <span className="cover__date">
          {at.toLocaleDateString('en-GB', DATE_FORMAT)}
        </span>
      </div>

      <h1 className="cover__question">
        {editorial ? editorial.question : theme.tagline}
      </h1>

      {/* Just the name. A tagline sat here through the first build, between
          the question and the reason, and it read as a third voice competing
          with two better ones — the question is the hook and the note is the
          judgement. Neither needs a subtitle explaining it. */}
      <p className="cover__theme">{theme.title}</p>

      {reason && (
        <div className="cover__note">
          <span className="cover__note-label">Why this, today</span>
          <p className="cover__note-body">{reason}</p>
        </div>
      )}

      <button className="cover__cta" onClick={() => onOpen(theme.id)}>
        {progress?.done > 0 ? '이어서 보기 · Pick it back up' : '들어가기 · Enter this culture'}
        <ChevronRightIcon size={16} />
      </button>
    </section>
  );
}
