// Whether this browser has been through the opening sequence.
//
// One key, one fact, and the fact is "has been shown", not "has finished":
// somebody who skipped it has been shown it, and repeating an onboarding
// somebody walked out of is the app arguing with them.
//
// localStorage for the same reason data/taste.js and data/foodMbti.js use it
// — the sequence runs before there is any reason to have an account, and a
// cleared tab seeing it again is the right failure. Never throws: a private
// window with storage off should get the app, not a blank screen.

const FIRST_RUN_KEY = 'bapchingu-first-run';

/** null when this browser has never been shown it, else when it was. */
export function getFirstRunSeen() {
  try {
    return localStorage.getItem(FIRST_RUN_KEY);
  } catch {
    // Storage off. Treat it as seen rather than showing the sequence on every
    // page load — a splash nobody can dismiss is worse than one nobody gets.
    return 'unavailable';
  }
}

/** Mark it shown. Called when the sequence ends, however it ended. */
export function markFirstRunSeen(at = new Date()) {
  try { localStorage.setItem(FIRST_RUN_KEY, at.toISOString()); } catch { /* nothing to do */ }
}

/** For the settings screen and for testing this by hand. */
export function clearFirstRunSeen() {
  try { localStorage.removeItem(FIRST_RUN_KEY); } catch { /* nothing to do */ }
}
