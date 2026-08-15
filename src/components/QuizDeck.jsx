import React, { useMemo, useState } from 'react';
import { quizFor } from '../content/quiz.js';
import { sourcesFor } from '../content/sources.js';
import { useText } from './localeText.js';

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
  const say = useText();
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
        {say(`${i + 1} of ${questions.length}`, `${questions.length}개 중 ${i + 1}번`,
          `${i + 1} de ${questions.length}`, `${i + 1} sur ${questions.length}`,
          `${i + 1} من ${questions.length}`, `第 ${i + 1} / ${questions.length} 题`,
          `${questions.length}問中 ${i + 1}問目`)}
        {q.menuId && <span className="quiz__tag">{say('this dish', '이 요리', 'este plato', 'ce plat', 'هذا الطبق', '这道菜', 'この料理')}</span>}
      </p>

      <div className="quiz__card">
        <p className="quiz__prompt">{q.prompt}</p>

        {!answered ? (
          <div className="quiz__choices">
            {/* O and X, the way the question would be written in Korean. */}
            <button className="quiz__choice" onClick={() => setPicked(true)} aria-label={say('True', '맞다', 'Verdadero', 'Vrai', 'صحيح', '对', '正しい')}>
              <span className="quiz__mark">○</span>
              <span className="quiz__word">{say('True', '맞다', 'Verdadero', 'Vrai', 'صحيح', '对', '正しい')}</span>
            </button>
            <button className="quiz__choice" onClick={() => setPicked(false)} aria-label={say('False', '아니다', 'Falso', 'Faux', 'خطأ', '错', '誤り')}>
              <span className="quiz__mark">✕</span>
              <span className="quiz__word">{say('False', '아니다', 'Falso', 'Faux', 'خطأ', '错', '誤り')}</span>
            </button>
          </div>
        ) : (
          <div className="quiz__result">
            <p className={`quiz__verdict${correct ? ' is-right' : ''}`}>
              {say(
                `${correct ? 'Right' : 'Not quite'} — the answer is ${q.answer ? 'True' : 'False'}.`,
                `${correct ? '맞았어요' : '아쉬워요'} — 정답은 ${q.answer ? '참' : '거짓'}입니다.`,
                `${correct ? 'Correcto' : 'Casi'} — la respuesta es ${q.answer ? 'verdadero' : 'falso'}.`,
                `${correct ? 'Juste' : 'Pas tout à fait'} — la réponse est ${q.answer ? 'vrai' : 'faux'}.`,
                `${correct ? 'صحيح' : 'ليس تمامًا'} — الجواب ${q.answer ? 'صحيح' : 'خطأ'}.`,
                `${correct ? '答对了' : '差一点'} — 答案是${q.answer ? '对' : '错'}。`,
                `${correct ? '正解です' : 'おしいです'} — 答えは${q.answer ? '○' : '×'}です。`)}
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

            <button className="quiz__next" onClick={next}>{say('Next question', '다음 문제', 'Siguiente pregunta', 'Question suivante', 'السؤال التالي', '下一题', '次の問題')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
