# 밥친구 잇플 · Eatple — project instructions

**New here? Read `docs/HANDOVER.md` first** — full state of the product,
the data pipeline, the business context, and the prioritised roadmap.
Setting up a new machine: `docs/new-computer-setup.md` (Korean).
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
- `npm test` (776 tests) and `node scripts/audit-i18n.mjs` (must print 0)
  before every push. When the suite grows, update the counts in README.md
  and HANDOFF.md — a test pins the documented number to the real one.
- Break a newly written test on purpose once to prove it can fail — with
  the real command, `node --test "src/**/*.test.mjs"`. The directory form
  `node --test src/domain/__tests__/` fails unconditionally on Windows, so
  a harness using it reports RED for every mutation whether or not anything
  was caught. That produced 34 false REDs across three batches on 8/30;
  re-run properly, five of thirteen came back GREEN and four of those were
  real coverage holes. Confirm the *unmutated* tree is green under the exact
  command first — a red baseline cannot tell a caught bug from a broken
  command, and a stale test count in the docs is enough to cause one.
- **Assert what the code does, not what the source looks like.** Four bugs
  in two days got past tests that matched a file for a token: a guard for
  `toLocaleString(` passed while grouping was switched off, a comma check
  passed because `encodeURIComponent` had already escaped it, and two
  checks matched the comment explaining a rule instead of the rule. Every
  one was fixed the same way — pull the behaviour into a function and call
  it. Where a source-text assertion is genuinely the only option, strip
  comments first.

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

## Database — what is applied, and what it costs to change
Everything live in Supabase is in `supabase/schema.sql`, and each change also
has a dated file in `supabase/migrations/`. Two applied 2026-09-01; the
numbers, the expected drift and the caveats are in
`docs/rls-baseline-2026-09-01.md`.
- `…-01b-scope-profile-reads-retry.sql` — an anonymous session reads 4 rows
  of `profiles`, not 237, and no `signups` rows at all. Seat counts come from
  `seat_holds()` instead: a table id and a status, nothing that names anybody.
- `…-01c-seat-holds-lapse.sql` — `assert_seat_available()` counted every
  signup row whatever its status, so a *declined* request held a seat for
  ever and three refusals closed a four-seat table for good.
- **Never build an index on `lapse_at()`.** PostgreSQL marks the timezone
  conversion it uses IMMUTABLE, so the declaration is honest — but a tzdata
  update can still move the answer, and an index would go quietly stale.
- `lapse_window()`/`lapse_at()` are granted to `authenticated` only. Today
  they are only ever reached from inside `security definer` functions; a
  direct RPC call from the client needs an anon grant first.
- A migration ends in `rollback;`, is run once to read its own numbers, and is
  only then re-run with `commit;`. Its undo is written *before* it is applied
  — see the 42P17 post-mortem in `…-01-scope-profile-reads.sql`, where there
  was none and production spent the writing of it returning errors.
- The verification inside a migration must not write rows. The first draft of
  `…-01c` built fixtures and discarded them with its `rollback;`, which would
  have committed invented tables — and fired a real seat-request email to a
  real host — on the second run.
- `rlsPolicies.test.mjs` and `seatLapse.test.mjs` execute those files against
  a real Postgres (PGlite, a devDependency, never bundled). Each keeps the
  version that failed as a control and requires it to still fail.

## Security
- **Repository is private, and there is no obligation to open it.** The KF
  agreement asks for results to be shared and the report satisfies that. So
  the two names the history scan found — 조강민 in `docs/purge-demo-tables.sql`
  and one anonymous account uuid in `docs/pilot-participant-count.md` — need
  no action: do not remove them, and do not rewrite the history.
  **No participant PII in the repository, verified 2026-09-01** across every
  revision — nine email addresses in file contents, every one a placeholder,
  the team account, an old project's contact or Resend's default; no phone
  numbers; no production identifiers beyond a public share URL.
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
Default branch is `main`; pushing it auto-deploys on Vercel. On a fresh
clone just work on `main` and `git push`. (강민's original machine has a
historical quirk — local branch `master`, remote named `test`, pushed via
`git push test master:main` — do not copy that setup.)
