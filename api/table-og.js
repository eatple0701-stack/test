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

// The constants, the escaper, the fallback card and the page template all
// moved to ./_og.js when a second preview function arrived. They were
// inline here, which is how one route ends up pointing at the old icon
// while the other points at the new card.
import { SUPABASE_URL, SUPABASE_KEY, site, page, beginHtml, FALLBACK } from './_og.js';

export default async function handler(req, res) {
  const id = req.query?.id;
  const url = `${site()}/tables/${encodeURIComponent(id ?? '')}`;
  // Previews may be cached briefly, but a seat count ages fast.
  beginHtml(res, 300);

  let card = FALLBACK;
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
