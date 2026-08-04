# 밥친구 / Eatple

**Solo trip, shared table.** A foreign traveller alone in Korea is blocked
from most of the menu — not by language, not by price, but because
samgyeopsal starts at two servings, gamjatang comes by the pot, and a
한정식 set is a two-person reservation. This app does not find you a
restaurant. It finds you a table: a meal somebody else already opened seats
at, or the seats you open yourself.

Part of a **digital public diplomacy** initiative, and that shapes the
product more than any other fact about it. A group-booking app that gets a
detail wrong is annoying. A state-adjacent cultural exchange that seats
strangers together and says nothing about what it is or is not — is a
different category of risk. See `src/content/safety.js`'s `PURPOSE` for the
one rule every table states before anyone commits to an evening.

## What it actually does

Two shapes of table, and neither is the lesser one:

- **호스트 테이블 (Hosted table)** — a host has ticked at least one 문화 가이드
  (order / eat / manners / origin) and is offering to walk the table through
  it. This is where the public diplomacy happens — a Korean host teaching a
  stranger their own food, in a language the stranger understands.
- **테이블 메이트 (Table mates)** — people splitting a dish none of them could
  order alone. A real table on its own terms, not a fallback.

The label is never typed in by a host — it is derived from the guides they
actually ticked (`src/domain/catalog/hosts.js`), so "Hosted table" cannot be
claimed by anyone who did not commit to it.

### Four screens

`Explore` · `Tables` · `Places` · `Passport` (Passport absorbed what used to
be a separate Profile tab; `/profile` still resolves as an alias).

No router library — nine paths on the History API (`src/routes.js`).
`/tables/<id>` is the share link a host sends to fill empty seats.

## Development

```bash
npm install
cp .env.example .env.local     # optional — the app runs on localStorage without it
npm run dev
```

Leave `.env.local` empty and the app still runs, on localStorage, shared only
within one browser. Fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
(from the Supabase dashboard → Project Settings → API) to switch to shared
storage — read `.env.example`'s own comments first, the dashboard's key names
are easy to mix up (`sb_publishable_` is the one that belongs here;
`sb_secret_` bypasses row-level security and must never ship to a browser).
Run `supabase/schema.sql` once against a fresh project before pointing the
app at it.

**Deploying this bundle to an *existing* Supabase project (not a fresh one)?**
Re-run `supabase/schema.sql` in the Supabase SQL editor first — it is
idempotent (`add column if not exists` / `create table if not exists`
throughout), so re-running it is safe even if part of it was already
applied. Every app update since the schema was first written has added a
column or a table (most recently `signups.status`, `signups.attendance`, `tables.meeting_note` and `tables.cancelled_at`,
with `signups_decide_by_host` and a column-scoped `grant update`) — if the app
bundle reaches a live project before the schema catches up, whatever touches
the new column or table fails against the stale one.

One ordering detail worth copying rather than repeating: `signups.status` is
added with a default of `accepted` and only *then* switched to `pending`. Rows
that already existed were confirmed seats under the rules of the day they were
written, so they backfill as confirmed; doing it the other way round would
retroactively un-invite everybody currently going to a table.

Three different failure shapes, all real, all worth knowing apart:

- **Silent.** `saveProfileFields`'s caller in `src/App.jsx` swallows the
  error (`.catch(() => {})`), so a profile edit can look saved on-screen
  while the database never received it.
- **Whole-screen.** `src/components/TablesTab.jsx` and `TableRequest.jsx`
  used to fetch tables, signups and blocks in one `Promise.all` — a missing
  `blocks` table would reject the whole thing and leave the Tables tab on
  "Loading tables…" forever, not just fail to filter. Both call sites now
  catch `listBlocks()` on its own, so a schema that has not caught up yet
  degrades to "blocking does nothing" rather than breaking the tab — but
  that fix does not generalise to a *future* addition without the same
  care, so treat re-running the schema first as the actual fix, not this
  one call site's defence.
- **Dormant, and this is the one to copy.** `signups.status` — the seat
  approval step — is written so a bundle can land before its own schema
  without anybody noticing. Nothing writes the column on insert, and a row
  read without one is treated as an accepted seat (`signupFromRow` in
  `src/data/tableMapping.js`, `statusOf` in
  `src/domain/policy/seatRequest.js`), which is exactly what every seat was
  before approval existed. So the old behaviour continues, no screen breaks,
  and running the schema switches the feature on. Ordering still matters for
  everything else; it stops being a landmine for this one.

  `tables.cancelled_at` follows the same rule but had to earn it: cancelling
  is an *update*, so a missing column is a hard error rather than a null, and
  the first version of it simply failed. `deleteTable` now catches Postgres's
  `42703` (undefined_column) specifically and falls back to the delete this
  used to be. Narrow on purpose — any other error still surfaces, because
  "cancelling quietly deleted everything" must not become the answer to a
  network blip. Worth copying the shape, and worth remembering that a write
  cannot be made dormant by reading carefully; it needs the fallback written
  out.

```bash
npm test          # 363 tests, node's built-in runner, no test-framework dependency
npm run lint       # oxlint
npm run build
```

Verify UI changes at **375×812** — desktop-width verification has missed real
regressions before.

## Trust and honesty rules — enforced by tests, not just documentation

This is a government-adjacent cultural project, so the honesty rules are
structural rather than a style guide:

- **No prices anywhere.** There is no way to verify them.
- **Every quiz question needs a source.** `quizFor` filters out anything
  unsourced before it can reach a traveller — see `src/content/sources.js`,
  where every entry is a source somebody on the team actually opened and
  read, quoted inline.
- **The app never rules on a dish's dietary status.** Vegan and halal are not
  verdicts this app renders — they are a message a traveller sends to the
  host, who is the person who can actually ask the kitchen
  (`src/data/profile.js`).
- **Sample data says so.** Seeded example tables are marked `isSample`; a
  demo that quietly passes off invented strangers as real users is the one
  thing this screen must not do.

## Architecture

`Policy → Projection → Capability → Entity → Value Object`
(`src/domain/`). Judgment calls belong in `policy/`, not inside a component —
a rule once lived in a component, was wrong, and moved to
`src/domain/policy/matching.js`; that is the shape every new rule should
take.

`src/data/tableRepository.js` is the single seam between localStorage and
Supabase — every screen calls through it and neither knows nor needs to know
which backend is live. The switch is automatic: set the two `VITE_SUPABASE_*`
keys and the app is on shared storage; leave them unset and it runs on one
device.

## This repository shares history with another app

This folder grew out of **K-Food Map**, a different, map-first restaurant
finder, and the two repositories still share early git history. They are
separate products with separate production URLs — see
`docs/where-this-deploys.md` for exactly which folder deploys where, and read
it before ever touching `git push` or `git remote` in this repo. A mix-up
here took the other team's live site down for a few hours on 2 August 2026.

`docs/DATA.md` and `docs/EVIDENCE.md` also date from the K-Food Map era, but
`src/data/verification.js` still uses parts of that model — do not delete
them; check what still applies before relying on them.

For the full engineering handoff — what's built, what isn't, what's blocked
on a human decision, and the current priority order — see `HANDOFF.md`.
