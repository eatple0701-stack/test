import React, { useState } from 'react';
import { activeNotice } from '../content/notices.js';
import { XIcon } from './Icons';
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
//
// ── Why it can be closed ─────────────────────────────────────────────────
//
// A UI audit on 2026-08-30 measured this bar at 98px, permanent, on a
// 812px phone — part of 353px of chrome eating 43% of the screen before any
// content. It had no close button, so a reader who had understood the notice
// on their first visit went on paying for it on every screen afterwards.
//
// Dismissal lives in sessionStorage rather than localStorage on purpose: a
// notice is a thing the team is currently saying, and it should get one more
// chance to be read on a fresh visit. Within a visit, once is enough.

const DISMISSED_KEY = 'bapchingu-notice-dismissed';

const wasDismissed = (id) => {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === id;
  } catch {
    return false;   // private mode: the notice simply stays
  }
};

const remember = (id) => {
  try {
    sessionStorage.setItem(DISMISSED_KEY, id);
  } catch {
    // Not durable here, but the component state below still hides it.
  }
};

export default function NoticeBar() {
  const say = useText();
  const notice = activeNotice();
  // Keyed by the notice's own identity, so publishing a new one brings the
  // bar back for somebody who dismissed the previous one this session.
  const id = notice ? (notice.id ?? notice.kr) : null;
  const [closed, setClosed] = useState(() => (id ? wasDismissed(id) : false));

  if (!notice || closed) return null;

  // The two halves stay separate elements, because the bilingual setting
  // shows both and the stylesheet is what hides one. Spanish replaces the
  // English half rather than adding a third line: three languages stacked
  // above the content is a banner nobody reads, which is the rule this file
  // opens with.
  return (
    <p className={`notice-bar notice-bar--${notice.kind}`} role="status">
      <span className="notice-bar__body">
        <span className="notice-bar__kr" translate="no">{notice.kr}</span>
        <span className="notice-bar__en">{say(notice.en, notice.kr, notice.es, notice.fr, notice.ar, notice.zh, notice.ja)}</span>
      </span>
      <button
        type="button"
        className="notice-bar__close"
        aria-label={say('Dismiss this notice', '이 안내 닫기', 'Descartar este aviso', 'Masquer cet avis', 'إخفاء هذا التنبيه', '关闭这条提示', 'この案内を閉じる')}
        onClick={() => { remember(id); setClosed(true); }}
      >
        <XIcon size={15} />
      </button>
    </p>
  );
}
