// Twenty-four dishes, read four at a time.
//
// ── Why this is a policy and not two components ─────────────────────────
//
// The host's form listed all twenty-four dishes in one grid, and the guest's
// list offered six group chips and then a second row of dish chips. Same
// twenty-four dishes, same six groups, two different shapes, and a third
// copy on the front page's cards. Nothing was wrong on any one screen; what
// was wrong is that moving a dish between groups was three edits, and the
// screen somebody forgot would have gone on saying the old thing.
//
// So both screens render one component, that component reads one function
// here, and this function reads dishGroups.js. The test that matters is the
// one that asks both screens for their groups and requires the same answer.
//
// ── What the two screens genuinely do differ on ─────────────────────────
//
// A host opens a table for a dish. "K-BBQ" is not something anybody cooks,
// so the category row is a disclosure and nothing else — pressing it opens
// four dishes and chooses none of them.
//
// A guest is browsing, and "show me every K-BBQ table" is a real thing to
// want. So on that screen the category row is also a choice.
//
// That is the whole difference, and it is one boolean. Everything else —
// which groups, in what order, holding which dishes, said in which language
// — is identical by construction rather than by two people remembering.

import { menuById } from '../catalog/menus.js';
import { DISH_GROUPS, groupOfMenu, menuIdOfDish } from '../catalog/dishGroups.js';
import { dishGloss } from './dishLabels.js';
import { searchDishes } from './dishSearch.js';
import { seatsRemaining } from './table.js';

/** What a screen lets somebody choose. */
export const PICK = {
  DISH: 'dish',                    // 밥상 만들기 — a dish, and only a dish
  GROUP_OR_DISH: 'group-or-dish',  // 밥상 찾기 — a dish, or a whole category
};

/** Whether this screen's category rows are choosable as well as openable. */
export const canPickGroup = (mode) => mode === PICK.GROUP_OR_DISH;

/**
 * The six rows, in one order, holding catalogue entries rather than ids.
 *
 * The dishes come back as menus.js entries — the ones carrying seven
 * languages of gloss, the minimum party size and the allergen list — because
 * a row that opens to four names and nothing else is the flat grid again with
 * extra clicks. `menuIdOfDish` is the bridge over the two spellings
 * (`budae`/`budae-jjigae`, `gejang`/`ganjang-gejang`).
 */
export function groupRows(mode = PICK.DISH) {
  const groupSelectable = canPickGroup(mode);
  return DISH_GROUPS.map(group => ({
    group,
    dishes: group.dishes.map(d => menuById(menuIdOfDish(d))).filter(Boolean),
    groupSelectable,
  }));
}

// ── Which rows are open ────────────────────────────────────────────────────
//
// A list rather than a Set: it is React state, it is six items long, and an
// array compares and serialises without anybody having to remember it is a
// Set. Order is the order they were opened, which nothing depends on.

/** Nothing is open until somebody opens it. */
export const ALL_COLLAPSED = [];

export const isGroupOpen = (openIds = [], id) => openIds.includes(id);

/**
 * Press a row: open it if it is shut, shut it if it is open.
 *
 * Deliberately not an accordion in the exclusive sense — opening K-BBQ must
 * not close 전골·탕. Somebody comparing 삼겹살 against 감자탕 needs both on
 * screen, and a row that closes itself when you look elsewhere is a thing to
 * fight rather than a thing to use.
 */
export const toggleGroup = (openIds = [], id) =>
  openIds.includes(id) ? openIds.filter(x => x !== id) : [...openIds, id];

/**
 * Open a row on somebody's behalf, closing nothing.
 *
 * Two callers. A guest arriving from a front page card has that category
 * already chosen, and a chosen category that is collapsed reads as no
 * category at all. A host arriving from a restaurant page has a dish already
 * filled in, and a chosen dish inside a shut row makes the form look empty —
 * they would pick a second one.
 */
export const withGroupOpen = (openIds = [], id) =>
  !id || openIds.includes(id) ? openIds : [...openIds, id];

/** The row a dish lives in, for the two cases above. */
export const groupIdOfMenu = (menuId) => (menuId ? groupOfMenu(menuId)?.id ?? null : null);

// ── Searching, above the accordion ─────────────────────────────────────────

export const PICKER = {
  ACCORDION: 'accordion',  // no query — the six rows
  RESULTS: 'results',      // a query — the dishes it names, and only those
};

/**
 * What the picker shows: the six rows, or the dishes a query names.
 *
 * Somebody who knows the word types it; somebody who does not browses. The
 * two must not be on screen at once — six collapsed rows under a list of
 * results reads as "and here is everything else", which is the question they
 * just answered.
 *
 * A query that names nothing still returns RESULTS with an empty list, on
 * purpose. Falling back to the accordion would look like the search had not
 * run, and the reader would type it again.
 */
export function pickerView(query) {
  if (!String(query ?? '').trim()) return { mode: PICKER.ACCORDION, dishes: [] };
  return { mode: PICKER.RESULTS, dishes: searchDishes(query) };
}

// ── The number beside a category ───────────────────────────────────────────

/**
 * Tables in this category somebody could still ask to sit at.
 *
 * Not "tables in this category" — a category showing 3 that opens onto three
 * full tables is a worse answer than no number, and this screen's whole job
 * is to stop somebody walking into a dead end.
 *
 * The arithmetic is seatsRemaining()'s and is not repeated here. That
 * function counts the host, counts accepted seats, counts pending requests
 * that have not run out of time, and stops counting a pending request twelve
 * hours before the meal. The list and the detail page disagreed about
 * exactly this until 2026-09-03; a second implementation living in a
 * category header is how that comes back.
 *
 * @param {object} group          one of DISH_GROUPS
 * @param {Array}  tables         the tables already on screen, past ones dropped
 * @param {object} signupsByTable table id → its signups, as the screen holds them
 */
export function joinableCount(group, tables = [], signupsByTable = {}, now = new Date()) {
  if (!group) return 0;
  let n = 0;
  for (const t of tables) {
    if (groupOfMenu(t?.menuId)?.id !== group.id) continue;
    if (seatsRemaining(t, signupsByTable[t.id] ?? [], now) > 0) n += 1;
  }
  return n;
}

/**
 * The four dishes under a category, said plainly, in the reader's language.
 *
 * The front page card's third line. It printed English to every reader who
 * was not reading Korean until 2026-09-03 — see dishGloss. The catalogue had
 * all seven languages the whole time; the card was reading a different table
 * that only had one.
 */
export function glossDishesIn(group, locale) {
  return (group?.dishes ?? [])
    .map(d => dishGloss(menuById(menuIdOfDish(d)), locale))
    .filter(Boolean)
    .join(' · ');
}
