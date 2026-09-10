/**
 * Which way a screen change is moving.
 *
 * The app has five tabs and, under two of them, screens you go *into* — a
 * table you opened from the list, a theme you opened from 문화. Until
 * 2026-09-10 every one of those changes was a hard cut: `.content-region`
 * carries `key={openThemeId ?? activeTab}`, so the tab's root element
 * remounts, and nothing was attached to that remount. Reported as
 * "넘어가는 모션도 너무 부족하고 (이거는 pc도 해당됨)".
 *
 * A direction is what separates a transition from a wipe. Going into a table
 * and coming back out of it are not the same movement, and an interface that
 * plays them identically has told the reader nothing. So this file answers
 * one question — deeper, shallower, or sideways — and index.css picks the
 * keyframes from the answer.
 *
 * It is here rather than in App.jsx because it is a rule about the shape of
 * the app's navigation, and because a rule with three branches and a
 * bidirectional claim is worth a test.
 */

export const NAV = {
  /** Into something: list → detail, 문화 → a theme. */
  forward: 'forward',
  /** Out of it again. */
  back: 'back',
  /** Across: another tab, or a screen at the same depth. A cross-fade. */
  lateral: 'lateral',
};

/**
 * The tab a view belongs to.
 *
 * A theme page needs no special case here, and the first draft of this file
 * gave it one anyway: `openThemeId ? 'home' : activeTab`. Mutating that branch
 * away left every test green, which is the only reason it was looked at —
 * every setter that opens a theme sets `activeTab` to 'home' in the same
 * breath (four call sites in App.jsx), and `stateFromPath` gives /culture/:id
 * the same base. A theme is therefore always already on 문화's lane, and a
 * branch that cannot be reached is a branch that cannot be tested.
 *
 * If a theme ever opens without switching tabs, this is the line that has to
 * change, and `depthOf` below is the one that already knows about themes.
 */
export const laneOf = (view) => (view?.activeTab ?? null);

/**
 * How far under its tab a view sits. 0 is the tab's own screen.
 *
 * 'list' is 밥상's own screen, not a child of it — the other three
 * (`request`, `create`, `detail`) are things you opened from it. A restaurant
 * is deliberately absent: it renders as `.detail-sheet`, outside
 * `.content-region` entirely, and has its own entrance.
 */
export function depthOf(view) {
  if (view?.openThemeId) return 1;
  const screen = view?.tableView?.screen;
  if (screen && screen !== 'list') return 1;
  return 0;
}

/**
 * A string that changes exactly when the screen does.
 *
 * `tableView` is a fresh object on every `setTableView`, so identity is no
 * use, and a render that changes neither tab nor screen must not restart an
 * animation that is already playing.
 */
export const viewKey = (view) => [
  laneOf(view) ?? '',
  view?.openThemeId ?? '',
  view?.tableView?.screen ?? '',
  view?.tableView?.tableId ?? '',
].join('/');

/**
 * The movement from one view to the next.
 *
 * A first render has no previous view and gets `lateral` — the app opening is
 * not a step back into anything.
 */
export function directionBetween(prev, next) {
  if (!prev || !next) return NAV.lateral;
  if (laneOf(prev) !== laneOf(next)) return NAV.lateral;
  const from = depthOf(prev);
  const to = depthOf(next);
  if (to > from) return NAV.forward;
  if (to < from) return NAV.back;
  return NAV.lateral;
}
