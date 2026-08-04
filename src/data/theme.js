// Light / dark / system — a traveller's own choice, not just the OS's.
//
// The dark palette in index.css already exists behind `:root[data-theme]`.
// This file is the only thing that writes that attribute, and it writes it
// unconditionally rather than leaving "no attribute" as a valid state — an
// unset attribute would mean falling back to a browser default, and the
// whole point of a three-way switch is that "system" is a choice too, not
// the absence of one.

const THEME_KEY = 'bapchingu-theme';

export const THEMES = ['system', 'light', 'dark'];

export const isTheme = (t) => THEMES.includes(t);

/** What the traveller picked, defaulting to 'system' for anyone who never chose. */
export function getStoredTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return isTheme(t) ? t : 'system';
  } catch {
    return 'system';
  }
}

/** What the OS says right now, read fresh every time rather than cached. */
export function systemPrefersDark() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** 'system' resolves to whatever the OS says at the moment this runs. */
export const resolveTheme = (theme) =>
  theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;

// Kept in step with index.html, which ships the same two values as
// media-scoped tags for the first paint. Light is the header's --surface
// rather than --bg, because the header is what sits under the status bar;
// dark is --bg, which is what reaches the top edge in the dark palette.
export const THEME_COLOR = { light: '#FFFFFF', dark: '#0F1115' };

/** Writes the resolved value to the DOM. Never 'system' — the CSS only knows light/dark. */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
  // Mobile browser chrome (the status bar) has no CSS to read — it only
  // ever sees this tag, so an explicit choice has to reach it separately
  // from the --bg token or the status bar keeps following the OS after a
  // traveller has told the app not to.
  //
  // index.html ships *two* of these, scoped to prefers-color-scheme, so the
  // chrome is right before React boots. Setting the first one's content
  // would have been silently wrong from the moment those were added: the
  // light-scoped tag would carry a dark colour while the dark-scoped tag
  // still matched. So every tag goes and one unconditional tag replaces
  // them — an explicit choice does not want a media query attached.
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  meta.setAttribute('content', THEME_COLOR[resolved]);
  document.head.appendChild(meta);
}

/** Saves the traveller's raw choice (including 'system') and applies it immediately. */
export function setTheme(theme) {
  const clean = isTheme(theme) ? theme : 'system';
  try {
    localStorage.setItem(THEME_KEY, clean);
  } catch {
    // Not durable in private mode; the DOM write below still works this session.
  }
  applyTheme(clean);
  return clean;
}

/**
 * Keeps 'system' live. If the traveller picked 'system' and the OS switches
 * at sunset while the tab is still open, the app should not need a reload to
 * notice — a stale theme after an explicit "follow the system" choice would
 * be the one case where doing nothing is the wrong answer.
 *
 * No-ops (and returns a no-op cleanup) for any explicit choice, so a caller
 * can wire this up unconditionally without checking the current theme first.
 */
export function watchSystemTheme(onChange) {
  if (getStoredTheme() !== 'system') return () => {};
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};

  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (getStoredTheme() !== 'system') return;
    applyTheme('system');
    onChange?.(resolveTheme('system'));
  };
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
