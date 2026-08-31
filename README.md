# 밥친구 잇플 / Eatple

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

### Five screens

`Main` · `Explore` · `Tables` · `Places` · `Passport` (Passport absorbed what
used to be a separate Profile tab; `/profile` still resolves as an alias).
Main is the landing at `/`, added 2026-08-06 and styled on the Meetup front
page the team studied — its photographs live in `src/content/mainPhotos.js`,
which renders the dish names as typography until the team supplies photos.

No router library — ten paths on the History API (`src/routes.js`).
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
npm test          # 636 tests, node's built-in runner, no test-framework dependency
npm run lint       # oxlint
npm run build
npm run audit-i18n # every user-visible string that is not wired to the language setting
```

Verify UI changes at **375×812** — desktop-width verification has missed real
regressions before.

### The language audit is the instrument, and it lies if you let it

The app offers eight settings (both, ko, en, es, fr, ar, zh, ja) and a missing
translation **falls back to English**, so a half-translated screen looks
finished to anybody who reads English. Nothing about it shows on screen, in
the console, or to the lint rule. `scripts/audit-i18n.mjs` is the only thing
that sees it, and it has been wrong twice:

- It reported zero for a month while `pass 2` was a stub that measured nothing.
- It reported zero again while 169 sentences were English on every screen,
  because its JSX-text regex could not match text with a `{value}` in the
  middle — which is the shape almost every sentence in this app has.

It reads a real syntax tree now (oxc, via the `rolldown` vite already
installs) and asks four questions: a string that reaches the screen without
`say()`; a `say()` short of a language; a Korean-and-English pair left for the
DOM to split; a prop family like SectionHead's `title/ko/es/fr/ar/zh/ja` with
members missing. **A zero from this script is only worth what its last
deliberate regression proved** — break one of the four on purpose and check it
still says so before believing it.

Static checks are also not enough on their own. The locale is read once on
mount, so verification means one page load per language, walking the tabs *and
the screens behind a tap*. That render diff is what caught the front-page
hero, the footer sitemap, the Passport goals, the place page's thirteen
English headings, and a CTA whose only title was Korean.

## Trust and honesty rules — enforced by tests, not just documentation

This is a government-adjacent cultural project, so the honesty rules are
structural rather than a style guide:

- **No unsourced prices.** A price appears only with its source on the same
  screen: a directory listing with a check date on a curated place, or
  등록부 기준 (2021–22) on a register place. Never a bare number the team
  cannot back, and never somebody else's review score.
- **Every quiz question needs a source.** `quizFor` filters out anything
  unsourced before it can reach a traveller — see `src/content/sources.js`,
  where every entry is a source somebody on the team actually opened and
  read, quoted inline.
- **The app never rules on a dish's dietary status.** Vegan and halal are not
  verdicts this app renders — they are a message a traveller sends to the
  host, who is the person who can actually ask the kitchen
  (`src/data/profile.js`). The dish sheet's "what's in it" card is the same
  rule under pressure: a review asked for an allergy panel, and what it got
  is what the dish is *normally* made of, a plain statement that nobody here
  has stood in that kitchen, and a button into the phrase sheet so somebody
  can go and ask. A traveller with a real allergy trusting a line we never
  verified is the one person this product must not hurt.
- **A dish tells no story it cannot cite.** Food history reads well and
  almost none of what circulates about it online has a source. So `story`
  exists only beside a `storySources` naming an entry in
  `src/content/sources.js`, the card simply does not render without one, and
  `dishStory.test.mjs` fails the build if a story ever arrives uncited. Ten
  dishes, one story so far — the sparseness is the honest state, and filling
  it means reading sources, not writing prose.
- **Sample data says so.** Seeded example tables are marked `isSample`; a
  demo that quietly passes off invented strangers as real users is the one
  thing this screen must not do.

### The register is in the list too, and it gets its own page

All 167,659 rows are in the Places list, sorted by distance beside the
twenty. Two things make that safe rather than a dilution:

**A register row branches to `RegistryPlaceSheet`, not `RestaurantDetail`.**
This matters more than it sounds. `RestaurantDetail` builds most of its page
from `getCulture(restaurant)` — origin, etiquette, useful phrases, a Passport
mission, a route onward — and a register row's category comes from its 업태
field, mechanically. Rendered through the curated component, 치보치마 printed
"The best items sell out before noon", "One drink buys the seat", a mission
about what came out of the oven this morning, and a walking route to
Gwangjang Market. Every line invented for that address by a category lookup,
and every line reading as though somebody had checked. `seoulRegistry.test.mjs`
asserts the guard sits above the first `getCulture` call.

**Every fact is `reported`, never `confirmed`.** `confirmed` is what the
twenty carry after somebody checked two map services on a named date; a test
fails the build if an imported fact ever claims it. `story` is null rather
than filled with the register's own 소개문, which for all 167,659 rows is a
mail-merge: "X는 서울특별시 Y구에 있습니다. 가장 가까운 지하철역은 Z역입니다."

The list pages 40 at a time — a district alone holds 16,547 cards, and
`sorted.map` over all of them locks the main thread on a phone.

### The map has two layers, and the difference is the product

Twenty places in `src/data/restaurants.js` have a story somebody wrote, an
address somebody checked and a provenance record naming who checked it. Under them sits `public/data/seoul/` — all 167,659 rows of 서울관광재단's
food-tourism register (data.go.kr 15097605), split into 26 files by 구
because as one file it is 24.4MB. The app fetches the four districts nearest
wherever the map is looking, so a person in Insadong downloads 종로구 and its
neighbours and nothing else. Nothing is filtered out at build time.

Four rules keep the second from eating the first, and they live in
`src/data/nearbyPlaces.js` and `nearbyPlaces.test.mjs`:

- **Off by default, and it draws only the 25,561 with a foreign-language
  menu.** A Jongno block holds 120 of those alone; all 167,659 would be a
  texture rather than a map. It is a toggle in the map bar, and the label
  says which cut it is showing.
- **Nothing below zoom 15, never more than 160 at once.** Leaflet draws every
  marker it is handed, and seven thousand locks the main thread on a phone.
- **A dot, not a teardrop.** The shape carries the claim: we chose this vs
  this is here.
- **Every pin says nobody here has been.** On the pin, not in a legend.

Naver and TripAdvisor review scores sit in neighbouring fields of the same
API and are not read — this app does not quote other people's judgements.
Register prices are read and shipped since 2026-08-17, always labelled with
the register as their source; a test asserts the district files carry no
score-like column and the menu files nothing but four names and a price.

17.7MB on disk across 26 files, 3.48MB compressed for all of Seoul — but a
session fetches four districts, about 1MB compressed, and the service worker's
runtime cache keeps them. Rebuild with:

```bash
npm run seoul-food restaurants && npm run seoul-food hours && node scripts/build-seoul-places.mjs
```

`SEOUL_FOOD_API_KEY` is build-time only and deliberately **not** `VITE_`-prefixed
— that prefix is exactly what decides whether a key ships to every visitor.
See `.env.example`. The API cannot be called from the app at runtime anyway:
it takes `pageNo` and nothing else, 1,000 rows a page, 168 pages for the
restaurant list.

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
