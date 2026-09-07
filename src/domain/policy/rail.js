// The geometry of a swipe rail: which slide is showing, and how tall the
// rail is.
//
// Pulled out of the component because it is the half that can be wrong
// quietly. A browser tab nobody is looking at runs no animation frames and
// fires no scroll events, so the wiring cannot be exercised without a
// visible window — but the arithmetic can, and the arithmetic is where the
// clamp, the rounding and the right-to-left sign live.

/**
 * Where the rail is, in slides: 0 at the first, 1.5 halfway between the
 * second and third. Clamped, so a rubber-band overscroll past either end
 * reads as the end rather than as a slide that does not exist.
 */
export function railFraction(scrollLeft, width, count) {
  const n = Math.max(1, Math.floor(count) || 1);
  const w = width > 0 ? width : 1;
  // Math.abs: an Arabic layout scrolls the other way and reports the offset
  // negative. What is wanted here is a distance, not a direction.
  return Math.min(n - 1, Math.max(0, Math.abs(Number(scrollLeft) || 0) / w));
}

/** The slide a reader would say they are on. */
export const railIndex = (scrollLeft, width, count) =>
  Math.round(railFraction(scrollLeft, width, count));

/**
 * One height for every slide: the first slide plus the margin asked for on
 * 2026-09-07, and never less than the tallest slide has to have.
 *
 * The first slide sets it because it is the one the page is designed around.
 * The max is not a second opinion about that — it is the only thing standing
 * between an English reader and a cut-off screen: the six category cards
 * carry a romanisation and a gloss line that Korean does not, and measure
 * 1021px on a 375px phone against the hero's 758. Sizing to the hero alone
 * would hide 263px of them, in the six languages nobody on the team reads.
 *
 * null means "do not touch it". A slide reports 0 before it has been laid
 * out, and writing that would collapse the rail; keeping the previous height
 * is wrong for one frame, where collapsing is wrong on screen.
 */
export function railTallest(heights = [], extraOnFirst = 0) {
  if (!heights.length || !heights[0] || heights[0] < 0) return null;
  return Math.round(Math.max(heights[0] + extraOnFirst, ...heights));
}

/**
 * The rail's next move, when the last of its children is a copy of the
 * first.
 *
 * The copy is what makes the turn one-directional. There is nothing to the
 * right of the last real screen, so reaching the first one by animating
 * means travelling back across everything between — which is what this
 * replaced, and what it was reported as on 2026-09-07. With a copy sitting
 * after the last, forward keeps working: the rail slides onto something
 * that looks exactly like screen one.
 *
 * Standing on the copy, the rail is already showing screen one, so the next
 * move is two things: put it back on the real one with no animation, where
 * nothing appears to happen because the two are identical, and then carry on
 * forward from there. The reset flag says to do the silent half first.
 */
export function railLoopStep(at, slides) {
  const n = Math.max(2, Math.floor(slides) || 2);
  const p = Math.min(n - 1, Math.max(0, Math.floor(at) || 0));
  return p === n - 1 ? { reset: true, to: 1 } : { reset: false, to: p + 1 };
}
