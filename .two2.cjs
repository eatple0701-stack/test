const fs = require('fs');
const cut = (file, a, b) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(a)) throw new Error('missing in ' + file + ': ' + a.slice(0, 60));
  fs.writeFileSync(file, s.replace(a, () => b));
};

// ── 1. turning the rail must not drag the page back up ────────────────
cut('src/components/MainTab.jsx',
`  // scrollIntoView rather than scrollLeft arithmetic, because it gets the
  // Arabic direction right on its own. block: 'nearest' so moving between the
  // three never scrolls the page vertically as well.
  const goDeck = (i, jump = false) => {
    // Said here rather than waited for, so the label answers the press at once.
    deckPos.current = i;
    setDeckAt(i);
    deckRef.current?.children[i]?.scrollIntoView({
      inline: 'start', block: 'nearest',
      behavior: (jump || reducedMotion) ? 'auto' : 'smooth',
    });
  };`,
`  // scrollTo on the rail itself, never scrollIntoView.
  //
  // scrollIntoView with block: 'nearest' does nothing vertically only while
  // the rail is already on screen. Once a reader has scrolled down past it,
  // "nearest" means bringing it back — so every four seconds the page jumped
  // to the top on its own while somebody was reading further down. Reported
  // on 2026-09-07 as the window forcing itself back up.
  //
  // The direction has to be worked out by hand instead, which is the one
  // thing scrollIntoView was doing for free: an Arabic layout starts at
  // scrollLeft 0 on the right and counts down into negatives going left.
  const goDeck = (i, jump = false) => {
    // Said here rather than waited for, so the label answers the press at once.
    deckPos.current = i;
    setDeckAt(i);
    const el = deckRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    el.scrollTo({
      left: rtl * i * el.clientWidth,
      behavior: (jump || reducedMotion) ? 'auto' : 'smooth',
    });
  };`);

// ── 2. the map on the tables screen, half again as tall ───────────────
cut('src/index.css',
`.tables-map-preview__canvas {
  display: block;
  height: 170px;`,
`.tables-map-preview__canvas {
  display: block;
  /* 170px until 2026-09-07, when it was called too small to be worth
     looking at: a map that shows four pins and no streets answers nothing
     the list has not already said. Half again. */
  height: 255px;`);

console.log('both changed');
