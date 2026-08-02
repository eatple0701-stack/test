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
idempotent (`add column if not exists` throughout), so re-running it is safe
even if part of it was already applied. This batch added three nullable
columns (`profiles.gender`, `tables.host_gender`, `signups.gender`); if the
new app bundle reaches a live project before the schema is re-applied, every
table-open, seat-join, and profile edit that touches those columns fails
against the stale schema. The profile-sync failure is the dangerous one —
`saveProfileFields`'s caller in `src/App.jsx` swallows the error
(`.catch(() => {})`) so a profile edit can look saved on-screen while the
database never received it.

```bash
npm test          # 210 tests, node's built-in runner, no test-framework dependency
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
