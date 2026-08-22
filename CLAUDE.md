# 밥친구 잇플 · Eatple — project instructions

**New here? Read `docs/HANDOVER.md` first** — full state of the product,
the data pipeline, the business context, and the prioritised roadmap.
Korean operational docs: `HANDOFF.md`, `docs/CHANGELOG-ko.md`.

## What this is
Matching solo foreign travellers in Korea with the dishes they cannot
order alone (2+ serving minimums) and the people already going.
React 19 + Vite PWA, mobile-first 375×812, Supabase, Leaflet.
A KF Digital Public Diplomacy Academy project — exchange, not a utility.

## How to work in this repo
- Reply to the team **in Korean**. Code, comments and commits in English.
- Extend, never rebuild. Never delete a feature without asking.
- Implement fast over discussing; report changed files/features/next steps
  concisely when done.
- **Verify what the user sees**, not what the DOM contains: run the dev
  server (`npm run dev`, port 5177), open it, measure, click. A component
  once passed every DOM query while rendering 3,405px below the fold.
- `npm test` (579 tests) and `node scripts/audit-i18n.mjs` (must print 0)
  before every push. When the suite grows, update the counts in README.md
  and HANDOFF.md — a test pins the documented number to the real one.
- Break a newly written test on purpose once to prove it can fail.

## Rules the tests enforce (each added after a real incident)
1. No unsourced facts — curated place fields carry source/confidence/date.
2. No unsourced prices; no third-party review scores, ever. Register
   prices always say 등록부 기준 (2021–22) on the same screen.
3. Register places (`seoul-` ids, `isRegistryPlace()`) render only what
   the register holds (`RegistryPlaceSheet`) — never curated prose.
4. No dietary verdicts — evidence or unknown, and unknown never matches
   a filter.
5. Quiz/story content requires a source somebody read
   (`src/content/sources.js`); unsourced entries are filtered at runtime.

## Security
- Never type, store, or request passwords/secrets; guide the human instead.
- `sb_secret_…` keys must never appear client-side. `SEOUL_FOOD_API_KEY`
  lives in `.env.local` (deliberately not `VITE_`-prefixed). The
  `서울관광재단*/` data folders stay gitignored.

## Sharp edges (details in docs/HANDOVER.md §3)
- CSV 식당(ID) and API RSTR_ID are **unrelated id spaces** — join by
  normalised name+구 only, drop ambiguous.
- The register API 429s: one fetch job at a time, backoff is built in.
- The register photo CDN needs `referrerPolicy="no-referrer"`.
- i18n is two systems: `say(en, ko, es, fr, ar, zh, ja)` for content,
  paired `-kr`/`-en` elements + LocaleFilter for labels. English is the
  fallback, so a missing translation is invisible to an English reader —
  that is what the audit is for.

## Git
Branch `master` locally, pushed to remote `test`, branch `main`
(`git push test master:main`) → auto-deploys on Vercel.
