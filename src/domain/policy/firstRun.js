// What a stranger is shown before the app, and once only.
//
// 2026-09-09, 강민: 최초 접속시에 로고 → 입맛지도 → mbti 검사로 넘어가기 /
// 본페이지로 넘어가기 중 선택.
//
// The app has argued against a splash before — the comment above App's return
// still says "A splash makes a promise; a list of tables somebody actually
// opened keeps it", written when the front door was a hero that explained the
// product to somebody who had not asked. This is not that one. It ends by
// handing the visitor something of their own, their taste map, and the last
// thing on it is a fork rather than a 시작하기: the promise is kept inside the
// sequence instead of being deferred past it.
//
// Two rules the functions below encode, both about not trapping anybody:
//
// 1. Every step can be left. A first-time visitor who wants to know whether
//    real dinners exist has to be able to reach them in one tap; fourteen
//    cards between a stranger and the tables would rebuild the 1.7-screen
//    problem of 2026-08-04 as a modal.
// 2. It runs once. Dismissed is dismissed, finished or skipped — an
//    onboarding that comes back is an error message.

/**
 * The screens.
 *
 * logo and taste are the sequence and run in that order. mbti is a branch off
 * taste rather than a third step: it is entered by choosing it on the map, it
 * replaces the deck in the same screen rather than opening over it, and there
 * is nothing after it — finishing or closing the test ends the whole opening.
 * So it is a state the sequence can be in, and not a step stepAfter walks to.
 */
export const FIRST_RUN = {
  logo: 'logo',
  taste: 'taste',
  mbti: 'mbti',
};

export const FIRST_RUN_STEPS = [FIRST_RUN.logo, FIRST_RUN.taste];

/** The step after this one, or null past the end. */
export function stepAfter(step, steps = FIRST_RUN_STEPS) {
  const at = (steps ?? []).indexOf(step);
  if (at < 0) return null;
  return steps[at + 1] ?? null;
}

/**
 * Should the sequence run at all?
 *
 * `seen` is whatever storage returned, and storage is user-writable: a string,
 * a number, a stray object. Anything that is not "not yet" counts as seen,
 * because the failure that matters is showing it twice rather than skipping
 * it once.
 */
export const shouldRun = (seen) => seen === null || seen === undefined;

/**
 * Where a first visit ends up.
 *
 * Both answers close the sequence and both mark it seen. The difference is
 * only what is open when it closes, and neither is a dead end: 'app' lands on
 * 밥상, 'mbti' opens the test over it.
 */
export const FIRST_RUN_EXIT = {
  app: 'app',
  mbti: 'mbti',
};
