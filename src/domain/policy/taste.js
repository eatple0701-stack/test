// The taste map: what a traveller said they want, from a deck of dishes they
// would have to bring somebody to eat.
//
// Pulled out of the component for the reason rail.js was: this is the half
// that can be wrong quietly. A card that flies off the wrong way, a deck that
// asks the same dish twice, a progress line that says 15/14 — none of those
// throw, and none of them are visible in a DOM query. The arithmetic is here
// and it is tested; the component below it only draws.
//
// Why a deck at all. Explore measured 8.0 screens on a 375px phone and the
// complaint that started that rebuild was that there was too much to read.
// Reading is the one thing a traveller with seven interface languages cannot
// be relied on to do. A deck asks one question at a time and takes a yes or a
// no, and the answer is worth more than a scroll: it is the only signal this
// app has about what somebody actually wants to eat.

/** What a card can be answered with. `null` is "not answered yet". */
export const VERDICT = { WANT: 'want', PASS: 'pass' };

/**
 * How far a card has to travel before the release counts as an answer.
 *
 * A fraction of the card's own width rather than a pixel count: the same
 * gesture has to mean the same thing on a 320px phone and a 430px one, and a
 * fixed 80px is a flick on the first and a nudge on the second.
 */
export const SWIPE_THRESHOLD = 0.28;

/**
 * The verdict a release means, or null for "put it back".
 *
 * Right is want, in every language including the right-to-left ones. The
 * direction is not a reading direction here — nothing is being advanced
 * through, and mirroring it would only make the two buttons below the card
 * disagree with the gesture above them for Arabic readers.
 */
export function swipeVerdict(dx, width) {
  const w = width > 0 ? width : 1;
  const travelled = (Number(dx) || 0) / w;
  if (travelled >= SWIPE_THRESHOLD) return VERDICT.WANT;
  if (travelled <= -SWIPE_THRESHOLD) return VERDICT.PASS;
  return null;
}

/**
 * The order the deck asks in.
 *
 * Round-robin across categories, so two cards in a row are never the same
 * kind of meal. The catalogue is not evenly split — eleven dishes are
 * `platter` and one is `bowl` — so a catalogue-order deck opens with four
 * grills and asks somebody to distinguish 삼겹살 from 갈비 before it has
 * shown them that a stew is also an option. Round-robin makes the first four
 * cards four different answers to "what kind of evening is this", which is
 * the question the map is actually built out of.
 *
 * Deterministic on purpose. A shuffled deck cannot be tested, cannot be
 * reproduced when somebody reports that a card was wrong, and gives two
 * travellers comparing phones two different products.
 *
 * `sharedOnly` defaults true: this app exists because a solo traveller is
 * shut out of food that starts at two servings, and FoodRoulette already
 * settled the same question the same way — putting 비빔밥 in the deck is
 * telling somebody to go and eat the thing they could already eat alone,
 * inside the app built for the opposite. Pass false to ask about all of it.
 */
export function buildDeck(dishes = [], { sharedOnly = true } = {}) {
  const pool = (dishes ?? []).filter(d => d && d.id && (!sharedOnly || d.minPeople > 1));
  const byCategory = new Map();
  for (const dish of pool) {
    const key = dish.category ?? '';
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(dish);
  }
  const queues = [...byCategory.values()];
  const out = [];
  for (let round = 0; out.length < pool.length; round += 1) {
    let placed = false;
    for (const queue of queues) {
      if (round < queue.length) {
        out.push(queue[round]);
        placed = true;
      }
    }
    // Cannot happen while `round` is below the longest queue, and is the
    // difference between a bug and a hung tab if it ever does.
    if (!placed) break;
  }
  return out;
}

/** Nobody has answered anything yet. */
export const emptyTaste = () => ({ want: [], pass: [] });

/**
 * Record one answer.
 *
 * Returns a new object — the deck reads this on every frame of a drag, and a
 * mutated array is how a React list stops re-rendering. An id already
 * answered is moved rather than duplicated, so going back and changing an
 * answer cannot leave the same dish on both lists; that is the state the map
 * and the progress line would disagree about.
 */
export function recordVerdict(taste, dishId, verdict) {
  const base = taste ?? emptyTaste();
  if (!dishId || (verdict !== VERDICT.WANT && verdict !== VERDICT.PASS)) return base;
  const want = base.want.filter(id => id !== dishId);
  const pass = base.pass.filter(id => id !== dishId);
  if (verdict === VERDICT.WANT) want.push(dishId);
  else pass.push(dishId);
  return { want, pass };
}

/** Every dish that has been answered, either way. */
export const answeredIds = (taste) => [...(taste?.want ?? []), ...(taste?.pass ?? [])];

/**
 * Where the deck is.
 *
 * `total` is the deck's real length and `done` counts real answers. There is
 * no head start here on purpose: a bar that opens at 2/16 when the deck holds
 * fourteen cards is a number the screen cannot honour, and this project does
 * not put a figure on screen it cannot stand behind. The pull at the end —
 * "three left" — is doing the same work honestly.
 */
export function deckProgress(taste, deckLength) {
  const total = Math.max(0, Math.floor(deckLength) || 0);
  const done = Math.min(total, answeredIds(taste).length);
  return { done, total, remaining: total - done, ratio: total ? done / total : 0 };
}

/** The next card, or null when the deck is spent. */
export function nextCard(deck = [], taste) {
  const seen = new Set(answeredIds(taste));
  return deck.find(d => !seen.has(d.id)) ?? null;
}

/**
 * The map itself: the dishes somebody said yes to, in the order they said it,
 * and the kinds of meal those answers add up to.
 *
 * Ordered by the answering, not by the catalogue, because the first yes is
 * the one somebody will recognise as theirs when they see the card again.
 */
export function tasteMap(taste, dishes = []) {
  const byId = new Map((dishes ?? []).filter(d => d && d.id).map(d => [d.id, d]));
  const wanted = (taste?.want ?? []).map(id => byId.get(id)).filter(Boolean);
  const counts = new Map();
  for (const dish of wanted) {
    const key = dish.category ?? '';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const categories = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([category, count]) => ({ category, count }));
  return { dishes: wanted, categories, count: wanted.length };
}

/**
 * The smallest number of yeses worth showing a map for.
 *
 * One dish is not a taste, it is a tap, and a map drawn from it would name
 * somebody by their first card. Below this the deck keeps asking.
 */
export const MAP_MINIMUM = 3;

/** Has this person answered enough for the map to mean anything? */
export const canDrawMap = (taste) => (taste?.want?.length ?? 0) >= MAP_MINIMUM;

/**
 * The tables somebody said yes to, first — and everything else after.
 *
 * A partition, not a filter and not a sort.
 *
 * Not a filter, because this is a pilot with few tables: answering "I want
 * 감자탕" with an empty screen is the dead end the whole app exists to remove.
 * The rest of the week stays on the page, under the ones that match.
 *
 * Not a sort, because the incoming order is the schedule — soonest first —
 * and reordering inside the two groups by how recently somebody swiped would
 * scatter the dates for no gain. Both halves keep the order they arrived in,
 * which is what makes this stable: the same list in gives the same list out.
 */
export function rankByTaste(tables = [], preferred = []) {
  const wanted = new Set((preferred ?? []).filter(Boolean));
  if (!wanted.size) return { tables: [...(tables ?? [])], preferredCount: 0 };
  const mine = [];
  const rest = [];
  for (const table of tables ?? []) {
    (table && wanted.has(table.menuId) ? mine : rest).push(table);
  }
  return { tables: [...mine, ...rest], preferredCount: mine.length };
}
