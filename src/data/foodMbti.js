// Where the 음식 MBTI answers are kept, and it is this browser.
//
// The same choice data/taste.js made and for the same reason: the test is
// twelve questions about somebody's own habits, and putting that on an
// account would mean asking a stranger to sign up before they are allowed to
// find out what they are. It costs what localStorage costs — a cleared tab
// takes it, and another phone starts over — and the screens that show a
// result say so rather than letting somebody discover it.
//
// Stored as { [questionId]: pole } because that is what the scorer reads.
// Anything unrecognised is dropped on the way in rather than trusted: this
// value is user-writable in devtools and arrives from a previous version of
// the app as often as from this one.

import { MBTI_QUESTIONS } from '../content/foodMbti.js';
import { MBTI_AXES } from '../content/foodMbti.js';

const MBTI_KEY = 'bapchingu-food-mbti';

const questionById = new Map(MBTI_QUESTIONS.map(q => [q.id, q]));
const polesOf = (axisId) => {
  const axis = MBTI_AXES.find(a => a.id === axisId);
  return new Set(Object.keys(axis?.poles ?? {}));
};

/** Only pairs this version of the test still asks, with a pole it offers. */
function clean(raw) {
  const out = {};
  for (const [id, pole] of Object.entries(raw ?? {})) {
    const q = questionById.get(id);
    if (!q || typeof pole !== 'string') continue;
    if (!polesOf(q.axis).has(pole)) continue;
    out[id] = pole;
  }
  return out;
}

/** What this browser remembers, or an empty set of answers. */
export function getStoredMbti() {
  try {
    const raw = localStorage.getItem(MBTI_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? clean(parsed) : {};
  } catch {
    return {};
  }
}

/** Write the answers back, cleaned. Never throws: storage can be full or off. */
export function storeMbti(answers) {
  const cleaned = clean(answers);
  try { localStorage.setItem(MBTI_KEY, JSON.stringify(cleaned)); } catch { /* nothing to do */ }
  return cleaned;
}

/** Start again. */
export function clearMbti() {
  try { localStorage.removeItem(MBTI_KEY); } catch { /* nothing to do */ }
}

/** Has this browser answered anything at all? */
export const hasMbti = (answers) => Object.keys(answers ?? {}).length > 0;
