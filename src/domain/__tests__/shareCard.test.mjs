import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// The link preview, which is the only part of this app most people will ever
// see. The dissemination plan (별첨1 §3, SNS week from 9/7) is a hashtag and
// multilingual share cards, so what a pasted link renders as is not a detail.
//
// Until 2026-09-01 og:image was the 192×192 app icon and twitter:card was
// `summary`: every link previewed as a thumbnail beside a line of text. The
// tags were all present and correct, which is why nothing caught it — the
// fault was in what they pointed at.

const root = process.cwd();
// Line endings normalised — see englishScreen.test.mjs for why.
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const html = read('index.html');

const meta = (attr, name) => html.match(
  new RegExp(`<meta\\s+${attr}="${name}"\\s+content="([^"]*)"`),
)?.[1];

test('the card is a real 1200x630 PNG, not a placeholder', () => {
  const file = path.join(root, 'public/og-card.png');
  assert.ok(fs.existsSync(file), 'public/og-card.png is missing — every share link falls back to nothing');
  const buf = fs.readFileSync(file);
  // PNG signature, then IHDR: width at byte 16, height at byte 20. Read
  // rather than trusted, because a truncated or half-written file lists at a
  // plausible size and previews as a broken image.
  assert.equal(buf.slice(1, 4).toString(), 'PNG', 'og-card.png is not a PNG');
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);
  // Crawlers have size ceilings — Twitter's is 5MB, KakaoTalk's is lower.
  assert.ok(buf.length < 1_000_000, `og-card.png is ${(buf.length / 1024).toFixed(0)}KB`);
  // And a file that is too small is an empty canvas somebody shipped.
  assert.ok(buf.length > 5_000, `og-card.png is only ${buf.length} bytes — is it blank?`);
});

test('the tags point at the card and ask for the wide layout', () => {
  assert.equal(meta('property', 'og:image'), 'https://eatple.vercel.app/og-card.png');
  assert.equal(meta('property', 'og:image:width'), '1200');
  assert.equal(meta('property', 'og:image:height'), '630');
  assert.equal(meta('name', 'twitter:image'), 'https://eatple.vercel.app/og-card.png');
  // `summary` is the thumbnail layout. A 1200x630 image behind it is cropped
  // to a square and the work is wasted.
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
});

test('the declared dimensions are the file’s actual dimensions', () => {
  // Two places that can drift apart silently: the crawler believes the tag,
  // reserves that aspect ratio, and renders letterboxing around whatever
  // arrives.
  const buf = fs.readFileSync(path.join(root, 'public/og-card.png'));
  assert.equal(String(buf.readUInt32BE(16)), meta('property', 'og:image:width'));
  assert.equal(String(buf.readUInt32BE(20)), meta('property', 'og:image:height'));
});

test('every absolute URL in the head points at the deployed origin', () => {
  // A relative og:image is ignored by most crawlers, and an origin that has
  // drifted from the deployment is a preview of nothing.
  const urls = [...html.matchAll(/content="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
  const ours = urls.filter(u => !/schema\.org|w3\.org|opengraphprotocol/.test(u));
  assert.ok(ours.length > 0, 'no absolute URLs in the head at all');
  for (const u of ours) {
    assert.match(u, /^https:\/\/eatple\.vercel\.app/, `${u} is not on the deployed origin`);
  }
});

test('the card carries no claim the app does not make', () => {
  // The rule the previous note in index.html set and this card inherits: no
  // photograph of food nobody here has taken, no number nobody computed. The
  // generator is the record of what is drawn, so it is what gets asserted.
  const gen = read('scripts/og-card.mjs');
  assert.match(gen, /fillText\('Eatple'/);
  assert.match(gen, /Don't just visit Korea/);
  assert.match(gen, /eatple\.vercel\.app/);
  // No image is loaded into the canvas — everything is drawn.
  assert.doesNotMatch(gen, /new Image\(|drawImage\(/, 'the card now embeds an image; check its licence and provenance');
  // The receiver verifies what it is handed rather than writing it blind.
  assert.match(gen, /readUInt32BE\(16\) === 1200/);
});

test('the generator says out loud that it needs a human to run it', () => {
  // There is no rasteriser in this repo on purpose. Somebody reading only
  // the filename would reasonably assume `node scripts/og-card.mjs` produces
  // the file by itself; it starts a receiver and waits.
  const gen = read('scripts/og-card.mjs');
  assert.match(gen, /paste CARD_JS into the console|Paste this into the console/i);
  assert.match(gen, /no rasteriser in this repo|There is no rasteriser/i);
});

// ── The same card, on the crawler path ──────────────────────────────────
//
// index.html is what a crawler gets for most routes; api/_og.js is what it
// gets for /tables/:id and /places/:id. Two templates, one card, and the
// first version of this file only guarded one of them — a mutation that
// pointed the serverless page back at the 192px icon passed the whole suite.
//
// These render the real template rather than reading it, for the reason the
// rest of this batch keeps re-learning: a file can contain the right string
// and use a different one.

test('the serverless preview serves the same card as index.html', async () => {
  const { page } = await import('../../../api/_og.js');
  const body = page({ title: 't', description: 'd' }, 'https://eatple.vercel.app/places/balwoo');
  const tag = (attr, name) => body.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];

  assert.match(tag('property', 'og:image'), /\/og-card\.png$/, 'the crawler card is not the 1200x630 one');
  assert.equal(tag('property', 'og:image:width'), '1200');
  assert.equal(tag('property', 'og:image:height'), '630');
  assert.equal(tag('name', 'twitter:card'), 'summary_large_image');
  assert.equal(tag('name', 'twitter:image'), tag('property', 'og:image'), 'the two image tags disagree');
  // And it agrees with the static head, so a link previews the same whether
  // or not it went through a rewrite.
  assert.equal(tag('property', 'og:image:width'), meta('property', 'og:image:width'));
  assert.equal(tag('name', 'twitter:card'), meta('name', 'twitter:card'));
  assert.equal(
    tag('property', 'og:image').replace(/^https:\/\/[^/]+/, ''),
    meta('property', 'og:image').replace(/^https:\/\/[^/]+/, ''),
    'index.html and the serverless template point at different images',
  );
});

test('the preview declares the url it was asked for', async () => {
  const { page } = await import('../../../api/_og.js');
  const url = 'https://eatple.vercel.app/places/balwoo';
  const body = page({ title: 't', description: 'd' }, url);
  assert.ok(body.includes(`<meta property="og:url" content="${url}">`), 'og:url is not the path it was given');
  // And the refresh a stray human follows goes to the same place.
  assert.ok(body.includes(`content="0;url=${url}"`));
});
