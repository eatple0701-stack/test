// The link preview a shared table deserves.
//
// 핵심기능 5 is SNS 확산, and the unit of spreading is a KakaoTalk message
// with a link in it. Until now every table link unfurled as the same generic
// card, because a single-page app serves one index.html to everybody —
// including the scrapers that build previews. This function is what those
// scrapers get instead: vercel.json routes bot user-agents for /tables/:id
// here, and humans keep getting the app.
//
// Data comes from the table_preview RPC (supabase/schema.sql), which exposes
// exactly the card's worth of fields to the anonymous role — dish, when,
// where, seats. No host name, no guest list: a preview shown in group chats
// must not leak more than the page's own public face.
//
// The dish names and the seat arithmetic are imported from the app's own
// catalog and policy, so the preview can never disagree with the page it
// previews.

import { menuById } from '../src/domain/catalog/menus.js';
import { seatsRemaining } from '../src/domain/policy/table.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://zqpxyhygvenlcjaoxcns.supabase.co';
// The publishable key ships in every client bundle; it is not a secret.
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_MUduy1sLbWEnvXTQD-AAlA_1UBGvM_E';
const SITE = 'https://test-umber-phi-78.vercel.app';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** The generic card, for a table that cannot be read (deleted, bad id). */
const fallback = {
  title: '밥친구 · Eatple',
  description: "Don't just visit Korea. Share a Korean table — dishes you cannot order alone, with people to eat them with.",
};

function page({ title, description }, url) {
  // The meta refresh is for the rare human who slips past the user-agent
  // filter: they land in the app, one hop late, none the wiser.
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="밥친구 · Eatple">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<!-- The app mark, absolute because a crawler resolves this from its own
     host, not ours. Added 2026-08-04 alongside index.html's: this function
     already told KakaoTalk the dish, the time and the seats left, and then
     handed it a card with a blank square where a picture goes. It is the
     icon rather than a photo of the dish on purpose — the project has no
     photograph of anybody's 보쌈, and a stock one would be the card
     promising a meal that is not the one being shared. -->
<meta property="og:image" content="https://test-umber-phi-78.vercel.app/icon-192.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="192">
<meta property="og:image:height" content="192">
<meta property="og:image:alt" content="밥친구 Eatple">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="https://test-umber-phi-78.vercel.app/icon-192.png">
<meta http-equiv="refresh" content="0;url=${esc(url)}">
</head>
<body>${esc(title)}</body>
</html>`;
}

export default async function handler(req, res) {
  const id = req.query?.id;
  const url = `${SITE}/tables/${encodeURIComponent(id ?? '')}`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Previews may be cached briefly, but a seat count ages fast.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');

  let card = fallback;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/table_preview`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_id: id }),
    });
    const t = r.ok ? await r.json() : null;
    const menu = t ? menuById(t.menuId) : null;
    if (t && menu && !t.cancelled) {
      // The same arithmetic the app runs, fed the same shape: accepted seats
      // hold, the host sits at their own table.
      const left = seatsRemaining(
        { seats: t.seats },
        Array.from({ length: t.accepted }, () => ({ status: 'accepted' })),
      );
      const when = new Date(`${t.date}T${t.time || '00:00'}`);
      const day = Number.isFinite(when.getTime())
        ? when.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
        : t.date;
      card = {
        title: `${menu.nameKo} ${menu.name} · 밥친구`,
        description: `${day} ${t.time} · ${t.place} — ${left === 0 ? 'table full' : `${left} seat${left === 1 ? '' : 's'} left`}. ${menu.gloss}`,
      };
    }
  } catch {
    // The fallback card is the answer to every failure here: a preview must
    // never 500 at a chat app's scraper, or the link shows nothing at all.
  }
  res.status(200).send(page(card, url));
}
