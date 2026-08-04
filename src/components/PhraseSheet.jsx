import React, { useEffect, useMemo, useState } from 'react';
import {
  phrasesFor, questionsFor, ASK_WHO_LABEL, PHRASE_GROUP, GROUP_LABEL,
} from '../content/phrases.js';
import QuizDeck from './QuizDeck';
import { ChevronLeftIcon } from './Icons';

// The thing you hold at the table.
//
// Designed for the worst conditions it will actually meet: a loud room, one
// hand, and a waiter already waiting. So the Korean is set large enough to be
// read across a table — turning the phone around is the fastest path through
// a language gap and needs no battery, no signal and no confidence.
//
// The speak button is second, not first. It is genuinely useful, but it
// depends on a Korean voice being installed on the device and many are not,
// so the sheet has to work completely without it.

// The quiz is a fifth tab rather than its own button on the table page,
// because it is the same moment as the conversation cards — the minutes just
// after strangers sit down. Anything for that moment belongs in one sheet you
// can hold.
const QUIZ = 'quiz';
const GROUPS = [PHRASE_GROUP.ORDER, PHRASE_GROUP.DIETARY, PHRASE_GROUP.TABLE, PHRASE_GROUP.TALK, QUIZ];
// Korean on top, English under it — the shape every other label in the app
// has. The Korean was already sitting in GROUP_LABEL and this file threw it
// away, so the sheet titled 식탁에서 · What to say at the table was followed
// by five tabs that had stopped speaking Korean. Two lines rather than a
// middot because five tabs share one row: 주문할 때 · Ordering, side by side,
// would not fit at 375px.
const TAB_LABEL = {
  ...Object.fromEntries(Object.entries(GROUP_LABEL).map(([k, v]) => [k, v])),
  [QUIZ]: { ko: '퀴즈', en: 'Quiz' },
};

/** Is there a Korean voice on this device? Voices arrive asynchronously. */
function useKoreanVoice() {
  const [voice, setVoice] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
    const pick = () => {
      const found = window.speechSynthesis.getVoices().find(v => v.lang?.toLowerCase().startsWith('ko'));
      setVoice(found ?? null);
    };
    pick();
    window.speechSynthesis.addEventListener('voiceschanged', pick);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pick);
  }, []);

  return voice;
}

export default function PhraseSheet({ onClose, dish, menuId, avoids }) {
  const [group, setGroup] = useState(PHRASE_GROUP.ORDER);
  const [spokenId, setSpokenId] = useState(null);
  const voice = useKoreanVoice();

  // Their own dietary rules first. A waiter is waiting and the sentence they
  // need is the one they already told us about.
  const shown = useMemo(() => phrasesFor(group, avoids), [group, avoids]);

  // The conversation deck, with this dish's own openers first. Held as an
  // index rather than shuffled, so pressing Another walks the whole deck
  // instead of showing the same card twice and running out by luck.
  const deck = useMemo(() => questionsFor(menuId), [menuId]);
  const [askAt, setAskAt] = useState(0);
  const ask = deck[askAt % deck.length];

  const speak = (phrase) => {
    if (!voice) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase.ko);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    // Slower than default: this is being said *to* somebody, and a phone
    // rattling through a sentence at full speed helps nobody.
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
    setSpokenId(phrase.id);
  };

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return (
    <div className="phrase-sheet" role="dialog" aria-label="Korean phrases for the table">
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onClose} aria-label="Close">
          <ChevronLeftIcon size={20} />
        </button>
        <h1>식탁에서 · At the table</h1>
      </header>

      <p className="phrase-intro">
        {dish
          ? `Show the phone, or tap to say it out loud. You are eating ${dish}.`
          : 'Show the phone to whoever you are talking to, or tap to say it out loud.'}
      </p>

      <div className="phrase-tabs" role="tablist">
        {GROUPS.map(g => (
          <button
            key={g}
            role="tab"
            aria-selected={group === g}
            className={`phrase-tab${group === g ? ' is-on' : ''}`}
            onClick={() => setGroup(g)}
          >
            <span className="phrase-tab__ko">{TAB_LABEL[g].ko}</span>
            <span className="phrase-tab__en">{TAB_LABEL[g].en}</span>
          </button>
        ))}
      </div>

      {group === QUIZ ? (
        <div className="phrase-list">
          <p className="phrase-note-lead">
            Ask one out loud. The answer matters less than the sentence after it.
          </p>
          <QuizDeck menuId={menuId} />
        </div>
      ) : group === PHRASE_GROUP.TALK ? (
        <div className="phrase-list">
          {/* One card, not a list of six. The old copy said "read one out when
              the table goes quiet" and then printed all of them to scroll
              through, which is the wrong shape for a moment where somebody is
              holding a phone in one hand and wants a single sentence. */}
          <p className="phrase-note-lead">
            One question at a time. Hand the phone over — it is written both ways.
          </p>

          <div className="ask-card">
            <span className="ask-card__who">
              {ASK_WHO_LABEL[ask.who].ko} · {ASK_WHO_LABEL[ask.who].en}
            </span>
            {/* Korean largest, exactly as the phrase cards do it, because this
                is the card most likely to be turned around and read by
                somebody else at the table. */}
            {/* translate="no" is load-bearing, not cosmetic: this line exists
                to be turned around and read by a Korean waiter. A browser
                that helpfully translates it back into the traveller's own
                language produces a phone held up to somebody who cannot read
                it — the exact failure the sheet was built to prevent. */}
            <p className="ask-card__ko" lang="ko" translate="no">{ask.ko}</p>
            <p className="ask-card__en">{ask.en}</p>
          </div>

          <button className="ask-next" onClick={() => setAskAt(i => (i + 1) % deck.length)}>
            다음 질문 · Another
          </button>
          <p className="ask-count">{askAt + 1} / {deck.length}</p>
        </div>
      ) : (
        <div className="phrase-list">
          {shown.map(p => (
            <div key={p.id} className={`phrase-card${spokenId === p.id ? ' is-spoken' : ''}`}>
              <p className="phrase-card__en">{p.en}</p>
              {/* The largest thing on the card, because holding it up is the
                  fastest way through the gap. */}
              <p className="phrase-card__ko" lang="ko" translate="no">{p.ko}</p>
              {/* The romanisation is a pronunciation guide, so translating it
                  would be nonsense in the literal sense — there is nothing to
                  translate, only letters to mangle. */}
              <p className="phrase-card__read" translate="no">{p.read}</p>
              {p.note && <p className="phrase-card__note">{p.note}</p>}

              {voice && (
                <button
                  className="phrase-card__speak"
                  onClick={() => speak(p)}
                  aria-label={`Say "${p.en}" in Korean`}
                >
                  소리 · Say it
                </button>
              )}
            </div>
          ))}

          {/* Said once, at the bottom, rather than leaving a button that does
              nothing. A device with no Korean voice installed cannot speak
              Korean and pretending otherwise wastes a tap at a busy table. */}
          {!voice && (
            <p className="phrase-no-voice">
              This device has no Korean voice installed, so the phrases cannot be
              spoken aloud. Showing the screen works just as well.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
