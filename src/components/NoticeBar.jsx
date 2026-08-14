import React from 'react';
import { activeNotice } from '../content/notices.js';
import { useText } from './localeText.js';

// The team's one line, at the top of every screen.
//
// Sits directly under the app chrome and above OfflineBar, because a notice is
// about the world and the offline bar is about this device — and when both are
// true the device is the more urgent of the two, so it should end up nearer
// the content.
//
// Renders nothing when there is nothing to say, which is most days. A slot
// that always has something in it stops being read within a week.

export default function NoticeBar() {
  const say = useText();
  const notice = activeNotice();
  if (!notice) return null;

  // The two halves stay separate elements, because the bilingual default
  // shows both and the stylesheet is what hides one. Spanish replaces the
  // English half rather than adding a third line: three languages stacked
  // above the content is a banner nobody reads, which is the rule this file
  // opens with.
  return (
    <p className={`notice-bar notice-bar--${notice.kind}`} role="status">
      <span className="notice-bar__kr" translate="no">{notice.kr}</span>
      <span className="notice-bar__en">{say(notice.en, notice.kr, notice.es, notice.fr, notice.ar)}</span>
    </p>
  );
}
