// How a table works, said once.
//
// It was said twice. FirstRun on Explore taught three steps and the
// landing's how-strip taught three different steps, with no shared source —
// so the app answered "what happens here?" two ways depending on which tab
// somebody opened first. Neither was wrong; together they were a product
// that had not decided what it was.
//
// This is the merge, and it keeps the best line from each. The how-strip had
// the approval — the host says yes to you by name, which is what makes this
// not a booking form. FirstRun had the money, which is the more valuable
// fact and the one that was missing from the landing page entirely: 밥친구
// moves no money, so a stranger cannot be owed anything. Not knowing that is
// exactly what stops somebody from asking for a seat, and no amount of dish
// photography fixes it.
//
// Three steps, because a person deciding whether to eat with strangers can
// hold three things. The fourth thing worth saying — the record — lives in
// the Passport, which is where it can be shown rather than promised.

export const HOW_STEPS = [
  {
    id: 'find',
    kr: '밥상 찾기',
    en: 'Find a table serving a dish nobody can order alone.',
  },
  {
    id: 'ask',
    kr: '자리 요청',
    en: 'Ask for the seat. The host reads who you are and says yes by name — your name is the whole form.',
  },
  {
    id: 'eat',
    // The money line, carried over from FirstRun because it is the fact that
    // removes the hesitation. Worded as what this app does, not as a promise
    // about what a restaurant charges — the app cannot know that.
    kr: '나눠 먹기',
    en: 'Meet and share the food. 밥친구 handles no money: you pay the restaurant for what you eat, so nobody at the table owes anybody.',
  },
];

/** The cultural fact that makes the whole thing make sense. */
export const HOW_WHY = {
  kr: '한국 밥상은 나눠 먹도록 차려집니다',
  en: 'A Korean table is laid to be shared. Browsing every dish and tip is free; the seat is what an account is for.',
};
