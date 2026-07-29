import React, { useEffect, useMemo, useState } from 'react';
import {
  phrases, tableQuestions, PHRASE_GROUP, GROUP_LABEL,
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
const TAB_LABEL = {
  ...Object.fromEntries(Object.entries(GROUP_LABEL).map(([k, v]) => [k, v.en])),
  [QUIZ]: 'Quiz',
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

export default function PhraseSheet({ onClose, dish, menuId }) {
  const [group, setGroup] = useState(PHRASE_GROUP.ORDER);
  const [spokenId, setSpokenId] = useState(null);
  const voice = useKoreanVoice();

  const shown = useMemo(() => phrases.filter(p => p.group === group), [group]);

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
            {TAB_LABEL[g]}
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
          {/* Not phrases — questions for the table. Both sides can answer
              every one of these; a card that only asks the visitor to explain
              themselves turns a meal into an interview. */}
          <p className="phrase-note-lead">
            Questions both sides can answer. Read one out when the table goes quiet.
          </p>
          {tableQuestions.map((q, i) => (
            <div key={q} className="question-card">
              <span className="question-card__num">{String(i + 1).padStart(2, '0')}</span>
              <p className="question-card__text">{q}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="phrase-list">
          {shown.map(p => (
            <div key={p.id} className={`phrase-card${spokenId === p.id ? ' is-spoken' : ''}`}>
              <p className="phrase-card__en">{p.en}</p>
              {/* The largest thing on the card, because holding it up is the
                  fastest way through the gap. */}
              <p className="phrase-card__ko" lang="ko">{p.ko}</p>
              <p className="phrase-card__read">{p.read}</p>
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
