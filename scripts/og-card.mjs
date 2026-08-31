// The 1200×630 link-preview card, and how to redraw it.
//
// ── Why this is a script and not a design file ───────────────────────────
//
// Until 2026-09-01 og:image was the 192×192 app icon and twitter:card was
// `summary`, so every link anyone shared — and the dissemination plan is
// #DontEatAloneInKorea and multilingual share cards — previewed as a
// thumbnail beside a line of text. A wide card needs a wide image, and the
// note in index.html said the project did not have artwork for one and that
// inventing some is how a preview ends up promising what the app does not
// contain.
//
// That second half is still the rule. So this card contains only what the
// app already says about itself: the wordmark, the line the front page
// opens with, its Korean counterpart, and the address. No photograph of
// food nobody here has taken.
//
// ── How to run it ────────────────────────────────────────────────────────
//
// There is no rasteriser in this repo — no sharp, no canvas, no headless
// browser — and adding a native dependency to draw one image once would be
// the wrong trade. So the drawing happens in a browser, which already has
// a canvas and the fonts:
//
//   1. node scripts/og-card.mjs            (starts a receiver on :5199)
//   2. open the app (npm run dev, :5177) and paste CARD_JS into the console
//   3. the page POSTs the PNG to the receiver, which writes public/og-card.png
//
// Fonts come from whatever machine draws it, which is the one real weakness:
// the same script on a Mac produces slightly different metrics. That is
// acceptable for a card nobody diffs, and it is written down here so the
// next person is not surprised by a one-pixel change.
//
// If this ever needs to run unattended, the honest fix is a proper design
// file exported once — not a native dependency carried for one image.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join('public', 'og-card.png');
const PORT = 5199;

/** Paste this into the console of the running app. */
export const CARD_JS = String.raw`
(async () => {
  const W = 1200, H = 630;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const KO = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
  const EN = '"Segoe UI",Inter,"Helvetica Neue",Arial,sans-serif';

  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
  // The CTA colour, as a spine down the left edge.
  x.fillStyle = '#C2410C'; x.fillRect(0, 0, 16, H);

  x.fillStyle = '#1F2328'; x.font = '800 46px ' + EN;
  x.fillText('Eatple', 72, 112);
  const w = x.measureText('Eatple').width;
  x.font = '700 32px ' + KO; x.fillStyle = '#6B7280';
  x.fillText('밥친구 잇플', 72 + w + 22, 110);

  x.fillStyle = '#1F2328'; x.font = '800 66px ' + EN;
  x.fillText("Don't just visit Korea.", 72, 252);
  x.fillText('Share a Korean table.', 72, 336);

  x.font = '500 34px ' + KO; x.fillStyle = '#3F444A';
  x.fillText('혼자서는 못 시키는 음식을, 같이.', 72, 406);

  // The six homepage groups as their own tints. Flat vector rather than the
  // emoji the app uses on screen: emoji rasterise differently on every
  // platform, and they were most of the file size.
  ['#FFEDD5', '#FEF3C7', '#FEE2E2', '#DBEAFE', '#DCFCE7', '#F3E8FF']
    .forEach((t, i) => { x.fillStyle = t; x.beginPath(); x.arc(96 + i * 72, 500, 26, 0, Math.PI * 2); x.fill(); });

  x.strokeStyle = '#E5E7EB'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(72, 558); x.lineTo(W - 72, 558); x.stroke();
  x.font = '500 24px ' + EN; x.fillStyle = '#6B7280';
  x.fillText('eatple.vercel.app', 72, 598);

  const b64 = c.toDataURL('image/png').split(',')[1];
  const r = await fetch('http://localhost:${PORT}/', { method: 'POST', body: b64 });
  console.log(r.status === 200 ? 'written to public/og-card.png' : 'receiver said ' + r.status);
})();
`;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', () => {
    const buf = Buffer.from(body, 'base64');
    // A 1200×630 PNG starts with the signature and an IHDR carrying the
    // dimensions. Checked rather than trusted: a truncated POST writes a
    // file that looks fine in a listing and previews as nothing.
    const ok = buf.slice(1, 4).toString() === 'PNG'
      && buf.readUInt32BE(16) === 1200 && buf.readUInt32BE(20) === 630;
    if (!ok) {
      console.error(`refused: not a 1200x630 PNG (${buf.length} bytes)`);
      res.writeHead(400); res.end('no');
      return;
    }
    fs.writeFileSync(OUT, buf);
    console.log(`wrote ${OUT} — ${(buf.length / 1024).toFixed(0)}KB`);
    res.writeHead(200); res.end('ok');
    server.close(() => process.exit(0));
  });
});

server.listen(PORT, () => {
  console.log(`waiting on http://localhost:${PORT}`);
  console.log('\nPaste this into the console of the running app (npm run dev):\n');
  console.log(CARD_JS);
});
setTimeout(() => { console.error('timed out — nothing was written'); process.exit(1); }, 300000);
