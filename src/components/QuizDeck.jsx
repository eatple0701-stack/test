import React, { useMemo, useState } from 'react';
import { quizFor } from '../content/quiz.js';
import { sourcesFor } from '../content/sources.js';

// 문화 퀴즈 — one question at a time, at the table.
//
// Built as an icebreaker rather than a test, which changes two things. There
// is no running score: the plan puts this in the minutes after strangers sit
// down, and a tally turns a conversation into a competition somebody is
// losing. And the answer is never the payoff — the sentence underneath it is,
// because "X, and here is why" is the thing that gets read out loud.
//
// Questions for the dish on the table come first. If a table is eating 보쌈,
// the 김장 question is the one that lands.
export default function QuizDeck({ menuId }) {
  const questions = useMemo(() => quizFor(menuId), [menuId]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);

  const q = questions[i];
  if (!q) return null;

  const answered = picked !== null;
  const correct = answered && picked === q.answer;

  const next = () => {
    setPicked(null);
    setI(n => (n + 1) % questions.length);
  };

  return (
    <div className="quiz">
      <p className="quiz__count">
        {i + 1} of {questions.length}
        {q.menuId && <span className="quiz__tag">this dish</span>}
      </p>

      <div className="quiz__card">
        <p className="quiz__prompt">{q.prompt}</p>

        {!answered ? (
          <div className="quiz__choices">
            {/* O and X, the way the question would be written in Korean. */}
            <button className="quiz__choice" onClick={() => setPicked(true)} aria-label="True">
              <span className="quiz__mark">○</span>
              <span className="quiz__word">True</span>
            </button>
            <button className="quiz__choice" onClick={() => setPicked(false)} aria-label="False">
              <span className="quiz__mark">✕</span>
              <span className="quiz__word">False</span>
            </button>
          </div>
        ) : (
          <div className="quiz__result">
            <p className={`quiz__verdict${correct ? ' is-right' : ''}`}>
              {correct ? 'Right' : 'Not quite'} — the answer is {q.answer ? 'True' : 'False'}.
            </p>
            {/* The part worth reading out. */}
            <p className="quiz__reveal">{q.reveal}</p>

            {/* Shown, not filed away. Half the point of sourcing this is that
                a traveller — or a reviewer asking 근거가 뭐냐 — can follow it. */}
            {sourcesFor(q.sources).map(src => (
              <a key={src.url} className="quiz__source" href={src.url} target="_blank" rel="noreferrer">
                {src.publisher}
              </a>
            ))}

            <button className="quiz__next" onClick={next}>Next question</button>
          </div>
        )}
      </div>
    </div>
  );
}
