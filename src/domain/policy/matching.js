import { canJoin, isPast } from './table.js';
import { sharedWith } from '../catalog/languages.js';

// Wanting a meal that does not exist yet.
//
// The app could only answer "here is what is open". On 17 August that list is
// three tables, and a traveller who wants 곱창 on Saturday when all three are
// 삼겹살 on Tuesday sees an empty screen and closes the app. A board needs
// supply to exist before demand can even be spoken, which is the wrong way
// round for the first week of anything.
//
// The plan asks for 자동 매칭 — 희망 지역, 날짜, 시간을 설정하면 같은 메뉴를
// 원하는 이용자와 자동 매칭. This is the honest half of that which works with
// no server at all: match the want against every table that already exists,
// and when nothing fits, say so and hand the want back as a table they could
// open themselves.
//
// That last part is not a workaround for the missing backend. In this product
// the demand side and the supply side are the same people — the plan has
// travellers hosting travellers — so somebody who wants 곱창 on Saturday is
// exactly the person who can open 곱창 on Saturday. The request is already a
// table; it just has not been offered yet.

/** How well a table answers what somebody asked for. */
export const MATCH = {
  EXACT: 'exact',   // the dish they named, inside the days they named
  DISH: 'dish',     // their dish, another day
  WHEN: 'when',     // their days, another dish
};

const withinDays = (table, from, to) => {
  if (!from && !to) return true;
  if (from && table.date < from) return false;
  if (to && table.date > to) return false;
  return true;
};

/**
 * Tables that answer a request, best first.
 *
 * A request with no dish means "anything", which is a real thing to want on a
 * first night in Seoul and the case a dish-first app is worst at.
 *
 * Only tables they could actually take a seat at: a perfect match that is full
 * or their own is not an answer, it is a second disappointment.
 */
export function matchRequest(request, tables = [], signups = [], userId = null) {
  const { menuId = null, from = null, to = null, languages = [] } = request ?? {};

  const seatable = tables.filter(t =>
    !isPast(t) && canJoin(t, signups.filter(s => s.tableId === t.id), userId));

  const scored = seatable.map(t => {
    const dishOk = !menuId || t.menuId === menuId;
    const whenOk = withinDays(t, from, to);
    if (!dishOk && !whenOk) return null;
    const kind = dishOk && whenOk ? MATCH.EXACT : dishOk ? MATCH.DISH : MATCH.WHEN;
    return {
      table: t,
      kind,
      // Named rather than scored, so the screen can say "you both have
      // English" instead of showing a number nobody can act on.
      shared: sharedWith(t.languages, languages),
    };
  }).filter(Boolean);

  const rank = { [MATCH.EXACT]: 0, [MATCH.DISH]: 1, [MATCH.WHEN]: 2 };
  return scored.sort((a, b) =>
    rank[a.kind] - rank[b.kind] ||
    // Among equals, a table that speaks your language first, then the soonest
    // meal — in that order, because a dinner you cannot follow is not sooner.
    b.shared.length - a.shared.length ||
    `${a.table.date}${a.table.time}`.localeCompare(`${b.table.date}${b.table.time}`));
}

/**
 * The request, as the table it would become.
 *
 * Everything the traveller already said, handed straight to the create form.
 * The seat count is not carried: how many people a dish needs is the dish's
 * own rule, and the form knows it.
 */
export function requestAsTable(request) {
  return {
    menuId: request?.menuId ?? null,
    date: request?.from ?? '',
    place: request?.place ?? '',
    languages: request?.languages ?? [],
  };
}

/**
 * Should the screen offer to turn this want into a table?
 *
 * Whenever nothing *exactly* fits — not only when the result is blank. Any
 * table inside the chosen days counts as a near miss, so somebody asking for
 * 족발 on a night when a stranger happens to be eating 삼겹살 had the offer
 * buried behind a suggestion they never asked for. Near misses are
 * alternatives; they are not an answer to the question.
 */
export const shouldOfferToHost = (matches = []) =>
  !matches.some(m => m.kind === MATCH.EXACT);

/** Nothing was asked for at all — an empty form is not a request. */
export const isEmptyRequest = (request) =>
  !request?.menuId && !request?.from && !request?.to && !request?.place?.trim();
