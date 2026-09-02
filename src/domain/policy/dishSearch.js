// Finding a dish by its name — "떡볶이가 먹고 싶다".
//
// ── Why this is a policy and not an input handler ───────────────────────
//
// Browsing by category and looking for something you already want are
// different acts. The tables tab did the first with six group chips and a
// row of dish chips that only ever showed dishes somebody had opened a table
// for — so on a week with one 간장게장 table, the only dish you could name
// was 간장게장. The single search box in the app was on the map overlay and
// matched restaurant names, vibes and neighbourhoods: typing 떡볶이 there found
// a shop with the word on its sign, if one existed, and not the dish.
//
// Two things a search here has to do, and both are the acceptance criteria
// this was built to:
//
//   1. The Korean name, the English name and the romanisation reach the same
//      dish. A traveller may have any one of the three — read off a sign,
//      heard from a host, remembered from a card — and the card itself prints
//      all three, so all three have to work.
//
//   2. A dish with no open table is not an empty list. Finding the dish and
//      being shown nothing is the dead end the whole app exists to remove;
//      what the reader gets is the dish — name, gloss, a way to open a table
//      for it — and the list is never blank.
//
// Pure functions over the catalogue, so the tests can ask them the question
// directly. The screen only renders what searchOutcome() returns.

import { menus } from '../catalog/menus.js';
import { DISH_IDS, DISH_NAME, DISH_KO, menuIdOfDish } from '../catalog/dishGroups.js';

// Latin text is compared with hyphens, spaces and case removed: nobody knows
// where the hyphens go in Dak-hanmari and a phone keyboard adds a space or
// drops one. Hangul is compared as typed, because a Korean word is one thing.
const flat = (s) => String(s ?? '').toLowerCase().replace(/[\s\-·.,'’]/g, '');

const GLOSS_LANGS = ['', 'Ko', 'Es', 'Fr', 'Ar', 'Zh', 'Ja'];

/**
 * Every string that names a dish, flattened once. The group-side names
 * (DISH_NAME, DISH_KO) are included through the id bridge, so 부대찌개 is
 * reachable as `budae` and as `budae-jjigae` alike.
 */
const NAMES = new Map(menus.map(m => {
  const groupIds = DISH_IDS.filter(d => menuIdOfDish(d) === m.id);
  const raw = [
    m.id, m.name, m.nameKo, m.romanization,
    ...GLOSS_LANGS.map(l => m['gloss' + l]),
    ...groupIds.flatMap(d => [d, DISH_KO[d], DISH_NAME[d]?.rom, DISH_NAME[d]?.en]),
  ];
  return [m.id, raw.filter(Boolean).map(flat)];
}));

/**
 * The dishes a query names, in catalogue order.
 *
 * Substring match on any name, so a partial ("떡", "dak") finds every dish it
 * could mean and the list narrows as the reader types rather than jumping.
 * Empty and whitespace queries find nothing: a search that has not started
 * must not filter the list.
 */
export function searchDishes(query) {
  const q = flat(query);
  if (!q) return [];
  return menus.filter(m => NAMES.get(m.id).some(n => n.includes(q)));
}

export const SEARCH = {
  OFF: 'off',             // no query — the ordinary list
  TABLES: 'tables',       // a dish was named and somebody is eating it
  DISH_ONLY: 'dish-only', // a dish was named and nobody is — show the dish
  NOTHING: 'nothing',     // the word names no dish here
};

/**
 * What the tables tab shows for a query.
 *
 * `open` is every upcoming table the reader could see. The result always
 * carries the matched dishes, whether or not any has a table, so the screen
 * can list "found, nobody yet" dishes beside the tables that exist — the
 * reader who typed 닭 and sees two chicken tables should also see that 닭발
 * is a dish here and could be opened.
 */
export function searchOutcome(query, open = []) {
  const dishes = searchDishes(query);
  if (!flat(query)) return { kind: SEARCH.OFF, dishes: [], dishesWithoutTable: [], tables: open };
  if (dishes.length === 0) return { kind: SEARCH.NOTHING, dishes: [], dishesWithoutTable: [], tables: [] };
  const ids = new Set(dishes.map(m => m.id));
  const tables = open.filter(t => ids.has(t.menuId));
  const served = new Set(tables.map(t => t.menuId));
  const dishesWithoutTable = dishes.filter(m => !served.has(m.id));
  return {
    kind: tables.length > 0 ? SEARCH.TABLES : SEARCH.DISH_ONLY,
    dishes,
    dishesWithoutTable,
    tables,
  };
}
