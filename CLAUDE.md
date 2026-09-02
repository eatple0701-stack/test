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
- `npm test` (861 tests), `node scripts/audit-i18n.mjs` (must print 0) and
  `npm run lint` (must print no `error`) before every push. Lint is on that
  list because `vite build` does NOT fail on an undefined identifier: a
  missing import built cleanly and would have thrown at runtime, and a
  second one — `placeUrlFor` in RestaurantDetail — had been shipping a
  broken share button on every place page until oxlint was run on
  2026-09-01. When the suite grows, update the counts in README.md
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
has a dated file in `supabase/migrations/`. Three applied 2026-09-01; the
numbers, the expected drift and the caveats are in
`docs/rls-baseline-2026-09-01.md`.
- **`schema.sql` had never been run by anything, and did not work.** A
  `language sql` body is parse-analysed when the function is created, so
  `is_open_host()` reading a column declared eighty lines below it raised
  42703 — and the SQL editor runs a paste as one transaction, so a new
  project came up empty rather than half-built. Production was fine only
  because it was built one applied migration at a time and the order
  happened to work out. `schemaSqlRuns.test.mjs` executes the file on an
  empty database now; keep every `create function` below the columns it
  reads. §3 of the baseline doc is the post-mortem.
- Order of a schema change, and it is not negotiable: SQL reviewed → applied
  and read live **outside** its own transaction → only then the client. The
  reverse took production down for twenty minutes on 2026-09-01, mid-pilot.
- Never filter on a new column in a PostgREST query. Read the rows and drop
  them in JavaScript, so a bundle that meets a database a migration behind
  behaves as it did before instead of 400-ing every read.
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
- `…-01e-signups-soft-cancel.sql` — cancelling a seat deleted the row, and the
  row is the only record the request happened; the 9/20 report counts seats
  requested. `cancelled_at` now, `unique (table_id, user_id)` replaced by a
  partial index over live rows so somebody who cancels can come back, and
  `signups_decision_guard` because the cancel policy OR's with the host one
  and would otherwise have let a guest accept their own seat.
- `rlsPolicies.test.mjs` and `seatLapse.test.mjs` execute those files against
  a real Postgres (PGlite, a devDependency, never bundled). Each keeps the
  version that failed as a control and requires it to still fail.
- `scripts/schema-catalog.mjs --diff live.tsv` answers "would a restore give
  back production?" — schema.sql is built in PGlite and its catalogue diffed
  against one exported from the live database. The query to export is in the
  baseline doc.

## The dev server writes to production
**`.env.local` points at the live project.** `npm run dev` and opening the
app signs in anonymously against production and adds a row to `profiles` —
one per browser, again after clearing storage. Those rows are
indistinguishable from a real visitor who browsed and left, so they inflate
the participant count going into the KF report and cannot be told apart
afterwards. Record the account id in the exclusion table in
`docs/pilot-participant-count.md` every time you open the dev server, before
you forget which one it was. Splitting off a dev-only project is the real fix
and is not done yet.

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
- Korean words inside es/fr/ar prose: **입 밖에 낼 말은 로마자, 설명하는
  말은 풀어쓴다.** A dish or drink name (jeon, makgeolli, soju, yukhoe) is
  what a traveller reads off a sign and says to a host, so it stays
  romanised; a shop type or food category (분식집, 포장마차, 안주) is a
  description, so it is translated. zh/ja translate everything. Decided
  2026-09-02 while filling the dish catalogue; the rule caught two of its
  own violations (pojangmacha, anju) the moment it was written down.
- The audit reads string literals and `say()` calls. It cannot see a value
  interpolated into a translated frame — `` `${menu.contains.join(', ')}
  들어감` `` printed `pork, shellfish 들어감` to Korean readers, and
  `CATEGORY_LABEL[c]?.en` printed `A whole spread` on Korean cards — and both
  passed with 0. When a label comes from a table, every language has to come
  from that table.

## Git
Default branch is `main`; pushing it auto-deploys on Vercel — **unless
somebody has used Instant Rollback**, which pins production to the
rolled-back deployment and leaves every later push built but unserved, with
nothing to say so. Promote the new deployment by hand. Judge what is live by
grepping the served bundle for a string the change introduces, never by
comparing its hash with a local build — `VITE_` variables are inlined, so the
hash moves with the environment. Details, with the actual Deployments listing
that caused half an hour of wrong guesses, in `docs/where-this-deploys.md`. On a fresh
clone just work on `main` and `git push`. (강민's original machine has a
historical quirk — local branch `master`, remote named `test`, pushed via
`git push test master:main` — do not copy that setup.)
