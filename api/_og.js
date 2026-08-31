// The parts every link-preview function needs, in one place.
//
// api/table-og.js had SITE, the Supabase constants, esc(), the fallback card
// and the whole page template inline. That was right when there was one
// function; a second copy is how a card ends up pointing at the old icon on
// one route and the new one on another, and how a preview deployment tells
// KakaoTalk the canonical URL is production.
//
// Nothing here reads a request. These are the constants and the shape.

// The publishable key ships in every client bundle; it is not a secret. The
// `sb_secret_` keys bypass RLS and must never appear anywhere near this file.
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://zqpxyhygvenlcjaoxcns.supabase.co';
export const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_MUduy1sLbWEnvXTQD-AAlA_1UBGvM_E';

/**
 * The origin a crawler should be told is canonical.
 *
 * Vercel sets VERCEL_URL to the deployment's own host, which is what a
 * preview deployment should say about itself — a preview that claims to be
 * production teaches every scraper the wrong canonical URL, and those are
 * cached for a long time. Production sets VERCEL_ENV=production, and there
 * the alias is what people actually type.
 */
export const site = () => (
  process.env.VERCEL_ENV === 'production' || !process.env.VERCEL_URL
    ? 'https://eatple.vercel.app'
    : `https://${process.env.VERCEL_URL}`
);

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** The card for anything that cannot be read — a deleted table, a bad id. */
export const FALLBACK = {
  title: '밥친구 · Eatple',
  description: "Don't just visit Korea. Share a Korean table — dishes you cannot order alone, with people to eat them with.",
};

/**
 * A meta-only page for a scraper.
 *
 * ── Two things that changed on 2026-09-01 ───────────────────────────────
 *
 * The image was the 192×192 app icon and the card type was `summary`, so
 * every shared link — the whole of 핵심기능 5 — unfurled as a thumbnail
 * beside a line of text. It is the 1200×630 card now (scripts/og-card.mjs),
 * and `summary_large_image` to go with it. One card for every route: the
 * project has no photograph of anybody's 보쌈, and the title and description
 * are what differ per link. A stock photo would be the card promising a meal
 * that is not the one being shared.
 *
 * And og:url is the actual path. index.html hard-codes the bare origin, so
 * before this every deep link a crawler saw declared itself the homepage.
 */
export function page({ title, description }, url) {
  const s = site();
  const img = `${s}/og-card.png`;
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
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="밥친구 잇플 · Eatple">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0;url=${esc(url)}">
</head>
<body>${esc(title)}</body>
</html>`;
}

/** Headers every one of these answers with. */
export function beginHtml(res, maxAgeSeconds) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${maxAgeSeconds}`);
}
