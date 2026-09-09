import { useCallback, useRef } from 'react';

// Drag a rail sideways with the pointer.
//
// 2026-09-09: "음식을 누르면서 스와이프 하는 건 안되더라? 누르면 음식 정보가
// 떠서 그런가?" — no. Nothing on that rail is clickable. Grabbing it and
// pulling does nothing because click-and-drag scrolling is not a thing a
// browser does: an overflow-x container answers a trackpad, a shift-wheel and
// a touch swipe, and ignores a held mouse button. On a phone the swipe worked
// the whole time; on a desktop it never could have.
//
// Worse than nothing, actually — dragging from a photograph started a native
// image drag, so the one gesture somebody would try produced a ghost image
// following the cursor. That is why the img below carries draggable={false}.
//
// Pointer events rather than mouse ones, so the same code answers a stylus
// and a touch. Touch already scrolls natively, and setPointerCapture would
// take that away, so touch is left alone.
const DRAG_MIN = 3;   // px before a press counts as a drag rather than a hold

export function useDragScroll() {
  const from = useRef(null);

  const onPointerDown = useCallback((e) => {
    if (e.pointerType === 'touch') return;
    from.current = { x: e.clientX, left: e.currentTarget.scrollLeft, dragging: false };
  }, []);

  const onPointerMove = useCallback((e) => {
    const start = from.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (!start.dragging && Math.abs(dx) < DRAG_MIN) return;
    if (!start.dragging) {
      start.dragging = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.currentTarget.classList.add('is-dragging');
    }
    e.currentTarget.scrollLeft = start.left - dx;
  }, []);

  const end = useCallback((e) => {
    if (from.current?.dragging) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      e.currentTarget.classList.remove('is-dragging');
    }
    from.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end };
}
