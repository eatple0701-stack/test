// Where you are, written in the address bar.
//
// The app kept every screen in React state and never touched the URL, which
// broke two things at once for the people testing it:
//
//   The phone's back button left the app. Every screen in a session lived at
//   the same address, so the browser had nowhere to go back to — testers
//   reported having to reach for the small arrow in the top left every single
//   time, which on a phone held one-handed is the corner your thumb cannot
//   get to.
//
//   And a table could not be sent to anybody. There was no link to send. That
//   is not a missing convenience: 계획서 핵심기능 5 is SNS 확산, and a product
//   whose whole growth story is people sharing what they are doing had no
//   shareable object in it.
//
// Deliberately no router library. The mapping is nine paths against four
// pieces of state that already exist, and pulling in a dependency plus its
// component model to express that would be a bigger change to this codebase
// than the problem is.

/** The screen, as a path. The theme page wins because it renders over a tab. */
export function pathFor({ activeTab, tableView, openThemeId, restaurantId }) {
  if (openThemeId) return `/culture/${openThemeId}`;
  if (restaurantId) return `/places/${restaurantId}`;

  switch (activeTab) {
    case 'match':
      if (tableView?.screen === 'detail' && tableView.tableId) return `/tables/${tableView.tableId}`;
      if (tableView?.screen === 'create') return '/tables/new';
      if (tableView?.screen === 'request') return '/tables/find';
      // The table list is the landing page — '/', not '/tables'. Decided
      // 2026-08-04 against Meetup's logged-out front page: the first thing a
      // visitor sees is the events themselves, not a splash about them. The
      // list of meals people actually opened makes the pitch better than any
      // sentence describing it. '/tables' still parses below, so every link
      // shared before this keeps working.
      return '/';
    case 'places': return '/places';
    case 'journal': return '/passport';
    case 'settings': return '/settings';
    case 'home': return '/explore';
    default: return '/';
  }
}

/**
 * A path, as the screen it names.
 *
 * Anything unrecognised falls back to Explore rather than throwing: a stale
 * link somebody shared last week should open the app, not a blank page.
 */
export function stateFromPath(pathname) {
  const [, head, tail] = (pathname || '/').split('/');
  const base = {
    activeTab: 'home', tableView: { screen: 'list' }, openThemeId: null, restaurantId: null,
  };

  switch (head) {
    // The landing. '' is what splitting '/' produces, so a bare visit lands
    // on the table list — the Meetup-shaped decision pathFor explains.
    case '':
      return { ...base, activeTab: 'match' };
    case 'explore':
      return base;
    case 'settings':
      return { ...base, activeTab: 'settings' };
    case 'tables':
      if (!tail) return { ...base, activeTab: 'match' };
      if (tail === 'new') return { ...base, activeTab: 'match', tableView: { screen: 'create' } };
      if (tail === 'find') return { ...base, activeTab: 'match', tableView: { screen: 'request' } };
      return { ...base, activeTab: 'match', tableView: { screen: 'detail', tableId: tail } };
    case 'places':
      return { ...base, activeTab: 'places', restaurantId: tail || null };
    // /profile is an alias rather than a dead path: it was its own tab until
    // the 8/2 merge, and a link somebody saved should land on the screen that
    // absorbed it instead of silently falling through to Explore.
    case 'passport':
    case 'profile': return { ...base, activeTab: 'journal' };
    case 'culture':
      return tail ? { ...base, openThemeId: tail } : base;
    default:
      return base;
  }
}

/** The full link to a table, for a person sending it to somebody else. */
export const shareUrlFor = (tableId) =>
  typeof window === 'undefined' ? '' : `${window.location.origin}/tables/${tableId}`;

/**
 * Is the address currently carrying something an identity provider put there?
 *
 * Lives here because this file owns the question "what is in the bar", and
 * the answer decides whether the app may tidy it. Google's return is the
 * live case — `?code=` under the PKCE flow — with the implicit `#access_token`
 * form matched too, since recovery and invite links still arrive that way.
 * `error_description` counts as a payload as well: a refusal that gets wiped
 * before anything reads it is a failure nobody can explain.
 *
 * The app rewrote the address on its first render, which erased all of this
 * before the auth client could exchange it (2026-08-04). Reading the URL
 * directly rather than taking a string, because there is exactly one address
 * bar and every caller means that one.
 */
export function hasAuthPayload() {
  if (typeof window === 'undefined') return false;
  const { hash = '', search = '' } = window.location;
  return /[#&](access_token|error_description)=/.test(hash)
    || /[?&](code|error_description)=/.test(search);
}
