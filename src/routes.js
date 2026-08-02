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
      return '/tables';
    case 'places': return '/places';
    case 'journal': return '/passport';
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
