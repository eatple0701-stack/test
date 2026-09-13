// Where the 음식 MBTI answers are kept: this browser, and a member's account.
//
// The same choice data/taste.js made and for the same reason: the test is
// twelve questions about somebody's own habits, and requiring an account
// would mean asking a stranger to sign up before they are allowed to find
// out what they are. So a guest's answers cost what localStorage costs — a
// cleared tab takes them, another phone starts over — and the screens that
// show a result say so. A member's go onto the account too, since
// 2026-09-11, the same way the map's do (components/useTasteSync.js).
//
// Stored as { [questionId]: pole } because that is what the scorer reads.
// Anything unrecognised is dropped on the way in rather than trusted: this
// value is user-writable in devtools and arrives from a previous version of
// the app as often as from this one.

import { MBTI_QUESTIONS } from '../content/foodMbti.js';
import { MBTI_AXES } from '../content/foodMbti.js';
import { setStamp, announce, TASTE_STORED } from './tasteStamp.js';

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
  setStamp('mbti', { at: Date.now() });
  announce(TASTE_STORED, { part: 'mbti' });
  return cleaned;
}

/** Start again — stamped like an answer, for the reason clearTaste gives. */
export function clearMbti() {
  try { localStorage.removeItem(MBTI_KEY); } catch { /* nothing to do */ }
  setStamp('mbti', { at: Date.now() });
  announce(TASTE_STORED, { part: 'mbti' });
}

/** Take the account's answers, cleaned like storage and quietly — see adoptTaste. */
export function adoptMbti(answers, at, owner) {
  const cleaned = clean(answers);
  try {
    if (hasMbti(cleaned)) localStorage.setItem(MBTI_KEY, JSON.stringify(cleaned));
    else localStorage.removeItem(MBTI_KEY);
  } catch { /* nothing to do */ }
  setStamp('mbti', { at: at ?? null, owner: owner ?? null });
  return cleaned;
}

/** Has this browser answered anything at all? */
export const hasMbti = (answers) => Object.keys(answers ?? {}).length > 0;
