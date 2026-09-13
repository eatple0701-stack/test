// Where one notch of a mouse wheel goes, over a row that scrolls sideways.
//
// App.jsx turns a vertical wheel into sideways scrolling for whichever row the
// cursor is over — without a trackpad there is no other way to move one (see
// the handler's own note). This decides each notch, and what happens at the
// ends of a row is the part with two right answers:
//
//   'page'  hand the wheel back, so a reader scrolling down past a row is not
//           caught on it. Every row did this until 2026-09-11, and every row
//           but two still does.
//   'hold'  keep it. For the dish rails on 여권 and 문화, asked for that day:
//           "끝까지 다 도달을 하면, 위 아래 창 스크롤이 움직이는게 아니라 그걸로
//           멈춰있어야 해". At the end of the dinners the page lurched on under
//           the cursor, which reads as losing your place, not as arriving.
//
// A row asks to hold with data-wheel="hold".
//
// Right-to-left is read the way every current engine reports it: scrollLeft 0
// at the start of the row and negative towards its end. The first version of
// the handler read a right-to-left row as a left-to-right one. Measured on
// 2026-09-11 on the 문화 dish rail in Arabic: at the start of the row a notch
// down was swallowed and nothing moved, and from the end it moved the rail
// 188px back towards the start.
//
// Pure, because Node has no layout: the edges are tested as numbers.

/**
 * @param {object} p
 * @param {number} p.deltaX
 * @param {number} p.deltaY
 * @param {number} p.scrollLeft  as the browser reports it
 * @param {number} p.scrollWidth
 * @param {number} p.clientWidth
 * @param {boolean} [p.rtl]
 * @param {boolean} [p.hold]     the row keeps the wheel at its ends
 * @returns {{ route: 'row', left: number } | { route: 'hold' } | { route: 'page' }}
 */
export function wheelRoute({
  deltaX, deltaY, scrollLeft, scrollWidth, clientWidth, rtl = false, hold = false,
}) {
  // A sideways gesture — a trackpad, a tilting wheel — the browser scrolls
  // already, and better than this could.
  if (!deltaY || Math.abs(deltaX) > Math.abs(deltaY)) return { route: 'page' };
  const max = scrollWidth - clientWidth;
  if (!(max > 1)) return { route: 'page' };
  const along = rtl ? -scrollLeft : scrollLeft;
  const forward = deltaY > 0;
  // A pixel of slack at each end: a row scrolled by fractions stops a
  // fraction short, and the notch after it would otherwise move nothing.
  const atStart = along <= 1;
  const atEnd = along >= max - 1;
  if ((forward && atEnd) || (!forward && atStart)) return { route: hold ? 'hold' : 'page' };
  return { route: 'row', left: scrollLeft + (rtl ? -deltaY : deltaY) };
}
