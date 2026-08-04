/* eslint-env serviceworker */

// Keeping the app usable when the signal goes.
//
// Why this exists at all: the two screens a traveller needs most are the two
// a phone is least likely to have signal for. 도움이 필요하면 carries 112, 119
// and the 1330 travel helpline; 식탁에서 carries the sentences you say to a
// waiter. Both are read standing inside a restaurant — often a basement one,
// which in Seoul is most of them. Measured 2026-08-04: with no network the
// app was a blank page, because nothing was cached and the document itself
// could not load.
//
// All of that content is compiled into the bundle (src/content/safety.js,
// src/content/phrases.js), so it costs nothing to serve offline — it only
// needs the shell to boot.
//
// ── The rules this file will not break ──────────────────────────────────
//
// 1. Nothing from Supabase is ever cached. Not tables, not sessions, not
//    auth tokens. A cached table list would show seats that are gone, and a
//    cached auth response is a security problem, not a stale one. Any
//    cross-origin request is passed straight through.
//
// 2. The document is network-first. Vite hashes its asset filenames, so a
//    deploy changes index.html's contents while keeping its URL — serving a
//    cached index.html first would pin a returning traveller to whichever
//    build they saw last, possibly forever. Cache is the fallback, not the
//    answer.
//
// 3. Hashed assets are cache-first and never revalidated. index-C9xzPjxC.js
//    can only ever mean one thing, so re-fetching it is waste, and keeping
//    it is safe.
//
// 4. One cache, versioned. Every activation deletes anything that is not the
//    current version, so a bad cache cannot outlive one deploy.

const VERSION = 'bapchingu-v1';
const SHELL = '/index.html';

// Only what is needed to boot to *something*. The JS and CSS are not listed:
// their names are hashed at build time and this file is copied verbatim from
// public/, so it cannot know them. They get cached on first use instead,
// which costs one online visit and keeps this file honest about what it can
// actually know.
const PRECACHE = [SHELL, '/', '/icon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      // addAll rejects the whole batch if any single request fails, which
      // would leave no cache at all. Each is added on its own so one 404
      // costs one file.
      .then(cache => Promise.all(PRECACHE.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// An escape hatch, and the reason it is here: a service worker that goes
// wrong can outlive the page that installed it, so there has to be a way to
// switch it off without waiting for a deploy. The app never sends this; a
// person debugging from the console can.
self.addEventListener('message', (event) => {
  if (event.data === 'unregister') {
    self.registration.unregister()
      .then(() => caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  }
});

const isHashedAsset = (url) =>
  url.pathname.startsWith('/assets/')
  || /\.(?:svg|png|jpg|jpeg|webp|woff2?)$/.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Rule 1: only ever touch our own GETs. Everything else — Supabase reads
  // and writes, auth, map tiles from CARTO, the OG function — goes to the
  // network untouched, and is not cached under any circumstances.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Rule 2: the document, network-first.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then(c => c.put(SHELL, copy)).catch(() => {});
          return response;
        })
        // Offline: hand back the last shell we saw. Every path in this app is
        // resolved client-side (src/routes.js), so the shell is the right
        // answer for /tables/find as much as for /.
        .catch(() => caches.match(SHELL).then(hit => hit || caches.match('/'))),
    );
    return;
  }

  // Rule 3: hashed assets, cache-first.
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        return fetch(request).then((response) => {
          // Opaque and error responses are not worth keeping; a cached 404
          // is a bug that survives its own fix.
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(VERSION).then(c => c.put(request, copy)).catch(() => {});
          }
          return response;
        });
      }),
    );
    return;
  }

  // Anything else same-origin: network, falling back to whatever we have.
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
