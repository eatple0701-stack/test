/**
 * Where a bottom sheet comes to rest.
 *
 * The 장소 tab split its height between the map and the list: 46vh of map,
 * and when somebody asked for the list, 30vh of map above 224px of list. On a
 * 375×812 phone that is a map too small to read and, at 174px a card, one and
 * a third restaurants. Both halves useless at once, which is what splitting a
 * screen between two things that each want all of it does.
 *
 * Reported twice. "스크롤은 어찌저찌 되는데 음식점 이름을 확인할 만한 공간이
 * 부족함" (2026-09-09) bought the list 92 more pixels, which was answering the
 * wrong question; "여기 show the list 했을 때도 list가 너무 작게 열림"
 * (2026-09-10) is the same report again.
 *
 * So the map keeps the whole screen and the list slides over it, resting at
 * one of three heights. That is not a new idea — it is what every map on this
 * phone already does, and the reason it works is that the reader chooses the
 * split instead of inheriting one.
 *
 * The fractions and the snapping are here, away from the pointer handling,
 * because "which one does a flick land on" is a rule with corners: a small
 * fast flick has to beat a large slow drag, or the sheet argues with the
 * thumb.
 */

export const DETENT = { peek: 'peek', half: 'half', full: 'full' };

/** In order, low to high. The sheet moves between neighbours, never past. */
export const DETENT_ORDER = [DETENT.peek, DETENT.half, DETENT.full];

/**
 * How much of the map's height each rest position covers.
 *
 * peek is the handle and its line of text and nothing else — the map is the
 * screen and the list is a label at the bottom of it. half leaves the top of
 * the map readable while three cards show. full stops short of the top so the
 * sheet still reads as a sheet over a map, rather than a screen that replaced
 * one.
 */
export const DETENT_FRACTION = {
  [DETENT.peek]: 0.13,
  [DETENT.half]: 0.55,
  [DETENT.full]: 0.92,
};

/**
 * How tall the sheet is built, as a fraction of the map area.
 *
 * The same number as the tallest rest position, named so that the CSS and
 * the component cannot drift: the element is this tall and slides down to
 * whichever position it is resting at.
 */
export const SHEET_MAX_FRACTION = DETENT_FRACTION[DETENT.full];

/** peek is a fixed thing — a handle and one line — so it has a floor in px. */
export const PEEK_MIN_PX = 92;

/** The height of the sheet at a rest position, given the space it lives in. */
export function detentPx(detent, hostPx) {
  const host = Math.max(0, Number(hostPx) || 0);
  // Normalise first, so an unknown position falls back to peek entirely
  // rather than to peek’s fraction without peek’s floor — which is what the
  // first draft did, and what its own test caught: 77.74 where peek is 92.
  const d = DETENT_FRACTION[detent] === undefined ? DETENT.peek : detent;
  const px = DETENT_FRACTION[d] * host;
  if (d === DETENT.peek) return Math.min(host, Math.max(px, PEEK_MIN_PX));
  return px;
}

/** The rest position nearest a height, for a drag that ended without a flick. */
export function nearestDetent(px, hostPx) {
  let best = DETENT.peek;
  let bestGap = Infinity;
  for (const d of DETENT_ORDER) {
    const gap = Math.abs(detentPx(d, hostPx) - px);
    if (gap < bestGap) { bestGap = gap; best = d; }
  }
  return best;
}

/** One step up or down the ladder, stopping at the ends. */
export function stepDetent(detent, direction) {
  const i = DETENT_ORDER.indexOf(detent);
  if (i < 0) return DETENT.peek;
  const next = i + (direction > 0 ? 1 : -1);
  return DETENT_ORDER[Math.min(DETENT_ORDER.length - 1, Math.max(0, next))];
}

/**
 * What a tap on the handle should do.
 *
 * Up the ladder until the top, then all the way back down. A tap is one
 * control and it has to keep working: a toggle that stops at `full` is a
 * button that does nothing the third time you press it.
 */
export const detentAfterTap = (detent) => (
  detent === DETENT.full ? DETENT.peek : stepDetent(detent, +1)
);

/** Past this, a release is a flick and its direction decides. Px per ms. */
export const FLICK_VELOCITY = 0.45;

/**
 * Where the sheet lands when the thumb lets go.
 *
 * `velocity` is px per millisecond, positive when the sheet is being made
 * taller (the thumb moving up the screen). A flick moves one step in the
 * direction it was thrown, whatever the sheet's height at the time — which is
 * the part a nearest-position rule gets wrong: a quick flick up from peek
 * barely moves, so the nearest position is still peek, and the sheet snaps
 * back down under a thumb that clearly asked for more.
 */
export function detentAfterDrag(startDetent, px, hostPx, velocity = 0) {
  if (Number.isFinite(velocity) && Math.abs(velocity) >= FLICK_VELOCITY) {
    return stepDetent(startDetent, velocity > 0 ? +1 : -1);
  }
  return nearestDetent(px, hostPx);
}
