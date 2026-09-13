// What the account sync needs from this browser's storage: when each taste
// record last changed here, which account it was last reconciled with, and a
// signal when either happens. See src/domain/policy/tasteSync.js for how the
// three are used.
//
// Its own key rather than a field inside the two records, because both of
// those are read by code that drops whatever it does not recognise — the map
// keeps ids, the MBTI keeps question ids — and a stamp stored beside them
// would be cleaned away by the next read.

const STAMP_KEY = 'bapchingu-taste-at';

/** Fired on window when the map or the type is answered in this browser. */
export const TASTE_STORED = 'eatple:taste-stored';
/** Fired on window when the account's copy has replaced this browser's. */
export const TASTE_SYNCED = 'eatple:taste-synced';

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STAMP_KEY) ?? 'null');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** { at, owner } for one record; both null when this browser has never said. */
export function stampOf(part) {
  const s = readAll()[part];
  return {
    at: Number.isFinite(s?.at) ? s.at : null,
    owner: typeof s?.owner === 'string' && s.owner ? s.owner : null,
  };
}

/** Merge into one record's stamp. Never throws: storage can be full or off. */
export function setStamp(part, patch) {
  const all = readAll();
  all[part] = { ...stampOf(part), ...patch };
  try { localStorage.setItem(STAMP_KEY, JSON.stringify(all)); } catch { /* nothing to do */ }
}

/** Tell whoever is listening. Nothing to tell where there is no window. */
export function announce(name, detail) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch { /* an old browser */ }
}
