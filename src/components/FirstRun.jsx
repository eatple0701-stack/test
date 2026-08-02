import React from 'react';

// What actually happens, for somebody who has never done this.
//
// The prologue promises a table and then never explains one. A traveller who
// has just landed is not asking "which dish" — they are asking the three
// questions nobody had answered anywhere in the app: what do I press, do I
// have to pay somebody, and what do I get for it. Not knowing is what stops
// a person from taking a seat, and no amount of dish photography fixes it.
//
// The money line is the important one, and it is a fact about this app rather
// than a claim about restaurants: 밥친구 moves no money, so a stranger cannot
// be owed anything. Saying so once, up front, is cheaper than the hesitation.
//
// It disappears on its own the moment the traveller has a name on file, which
// is the moment they have taken or set a seat. No dismiss button, because a
// thing that leaves by itself does not need one.
const STEPS = [
  {
    kr: '자리 요청',
    en: 'Ask for a seat',
    body: 'Say what to call you. That is the whole form.',
  },
  {
    kr: '밥상',
    en: 'Show up and eat',
    body: '밥친구 handles no money. You pay for what you eat, at the restaurant.',
  },
  {
    kr: '기록',
    en: 'It stays in your Passport',
    body: 'Who you ate with, and the dish you could not have ordered alone.',
  },
];

export default function FirstRun() {
  return (
    <section className="first-run" aria-label="How a table works">
      <p className="first-run__kr">처음이신가요</p>
      <h2 className="first-run__title">Three steps, and one of them is dinner</h2>

      <ol className="first-run__steps">
        {STEPS.map((s, i) => (
          <li key={s.kr} className="first-run__step">
            <span className="first-run__num" aria-hidden="true">{i + 1}</span>
            <div className="first-run__text">
              <p className="first-run__head">
                <span className="first-run__step-kr">{s.kr}</span>
                <span className="first-run__step-en">{s.en}</span>
              </p>
              <p className="first-run__body">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
