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
    // The landing. On 2026-08-04 '/' was given to the table list, against
    // Meetup's logged-out splash, on the grounds that the meals make the
    // pitch better than a sentence about them. On 2026-08-06 the owner
    // reversed it deliberately: with one real table, a list is not a pitch,
    // and the front door became a Main page that shows the tables *and* the
    // dishes, the steps and the ways in. '/tables' keeps parsing, so every
    // link shared under the old rule still lands on the list it named.
    case 'main': return '/';
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
    // on the Main page — see pathFor for the 8/6 reversal that put it there.
    case '':
    case 'main':
      return { ...base, activeTab: 'main' };
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
    // The dissemination plan (docs/HANDOVER.md) names /stories/:slug and the
    // app has always written /culture/:id. Parsed as an alias rather than
    // renamed in pathFor: swapping the word there would kill every culture
    // link already shared, and an alias costs one line.
    case 'culture':
    case 'stories':
      return tail ? { ...base, openThemeId: tail } : base;
    default:
      return base;
  }
}

/** The full link to a table, for a person sending it to somebody else. */
export const shareUrlFor = (tableId) =>
  typeof window === 'undefined' ? '' : `${window.location.origin}/tables/${tableId}`;

/**
 * The full link to a place.
 *
 * RestaurantDetail's share button sent `window.location.href`, which happens
 * to be right only for as long as pathFor writes `/places/<id>` and nothing
 * else is in the bar. It also carries whatever query string a campaign or an
 * identity provider left behind — a shared link with somebody's `?code=` on
 * it is not a thing to hand out. Built from the id instead.
 */
export const placeUrlFor = (placeId) =>
  typeof window === 'undefined' ? '' : `${window.location.origin}/places/${placeId}`;

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
