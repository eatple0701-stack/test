# Eatple — Work order: remaining pages + curation

**Written:** 30 Aug 2026, against the live build (`0552d8e`)
**Scope:** Explore / Tables / Places / Passport, and the curation pipeline. Main is done.
**Verified against:** live site in English mode, 30 Aug.

---

## The reframe, before the task list

The Places tab is not short of content. It already has **ten content rails** —
Traditional Markets, Popular with Travelers, Food Stories, Recommended Courses,
Weekend Picks, Local Hidden Gems, Seasonal Foods, Festival Picks, Korean Dining
Culture, Recommended Neighborhoods — plus 18 curated places, 4 markets and a map
of 8,136 restaurants.

What it is short of is **usable** content. Measured on the live site just now:

- The Places tab contains no address, no opening hours, no distance and no
  price. `Address & hours` and `Open · closes 10:00 PM` exist **on the map, one
  screen away, for the same restaurants.**
- `Nono Shop & Cafe` appears **3 times** on a single Places screen, out of 18
  places.
- `Festival Picks` is a heading with nothing under it.
- 8,118 of the 8,136 map entries are unusable to a non-Korean reader —
  Korean-only name, a distance, an emoji.

So the highest-leverage work here is **wiring, not writing.** The data that
answers a visitor's actual questions already exists in the app; it just isn't
plumbed to the screens where people decide. Adding 20 more hand-written place
entries would cost days and change less than one afternoon of plumbing.

Curation still matters — the 18 entries are the best thing in the product — but
it should go **narrow and deliberate**, not broad. See Track B.

---

## Sequencing

The project schedule (별첨1, §3) puts the remaining weeks like this:

| Week | Plan says | What to ship |
|---|---|---|
| 8/31–9/6 | 2차 시범 운영 | **Track A only** — data-layer changes. No flow changes while testers are in the flow. |
| 9/7–9/13 | 효과 측정 · **SNS 콘텐츠 게시** | **Track C-1 (URLs + OG tags) must land before this.** |
| 9/14–9/20 | 최종 결과물 · 시연용 버전 | Freeze. Track C-2 polish only. |

**The hard deadline in that table is URLs.** The dissemination plan is
`#DontEatAloneInKorea` and multilingual share cards. Every navigation element in
the app is a `<button>` with no `href` — there is currently nothing to link to.
If SNS week arrives before routing exists, the dissemination plan does not have a
mechanism.

**Do none of this today.** Today is host seeding.

---

## Track A — Wiring (Claude Code, low risk, ship during 2차 운영)

These are data-layer changes. They don't alter any flow a tester is walking
through.

### A1. Plumb address / hours / distance / open-now into the Places tab

**What.** The map rows already render `Address & hours`, `Open · last order
passed, closes 10:00 PM`, and `600 m`. The Places tab renders neighbourhood +
one-line description and stops. Same records, same fields.

**Why.** Right now nothing on the Places tab can be acted on. A visitor reads a
nice description and has no way to go there or know if it's open.

**Done when.** Every curated place card on `/places` shows: distance,
open/closed state, and a tap target that reveals the address. Parity with the map
row.

### A2. De-duplicate places across rails

**What.** Cap each place at one appearance per screen. `Nono Shop & Cafe`
currently appears in Today's Experience, Weekend Picks and Local Hidden Gems
simultaneously.

**Why.** Seeing the same vegan café three times makes an 18-place catalogue read
like a 6-place one.

**Done when.** No place name appears more than once in the rendered `/places`
output.

### A3. Label the city on every card

**What.** Cards say `Guwol-dong, Incheon`, `Songdo, Incheon`, `Jongno, Seoul`. A
first-time visitor does not know Incheon is an hour from Seoul, or that Songdo
and Guwol-dong are in it.

**Why.** Weekend Picks currently leads with two Incheon entries. A visitor
staying in Myeongdong will plan around them and be surprised.

**Done when.** Every card carries a `Seoul` / `Incheon` chip, and `/places` has a
city filter at the top.

### A4. Surface a Diet filter at the top of Places

**What.** Halal / Vegan / Temple / Zero-waste / No restrictions, as a first-class
filter row.

**Why.** The homepage sells 삼겹살 · 곱창 · 족발 · 간장게장. The Places tab is
almost entirely the opposite — Balwoo Gongyang, Osegyehyang, EID Halal, Kkotbap,
Camouflage, Kampungku, Nono Shop, Chaeyuk Sikdang, Sanchon, Maji, Arabesque. Both
are worth having, and the halal/vegan/temple coverage is a genuine gap in the
English-language Korea food market. Presented as an unexplained mismatch between
two tabs it reads as a mistake; presented as a filter it reads as a position.

**Done when.** The filter is visible without scrolling on `/places`, and the
rails respond to it.

### A5. Romanise the 8,136

**What.** Add a romanised name and a fallback display label to the bulk registry
rows. Replace the single-Hangul-syllable avatar tile (`더`, `산`, `말`) with the
category emoji.

**Why.** In English mode the map list currently reads `더플레이스다이닝 /
산채집 / 말모아왕족발 / 명동뚱뚱이족발`. A mechanical romanisation beats an
unreadable name; the category emoji beats a meaningless letter.

**Done when.** In `locale !== 'ko'`, no map list row displays a Hangul-only name.

### A6. English map tiles

**What.** Switch the tile layer when `locale !== 'ko'`. The current OSM tiles
label 홍제천 / 서울역 / 용산구 in Korean only.

**Done when.** The map is readable in English mode.

### A7. Reconcile "18 verified places" with "8,136 places"

**What.** Two numbers on adjacent screens with no stated relationship. Name it:
*"18 places we visited and wrote up · 8,136 more on the map."*

**Done when.** Both numbers appear together with one sentence explaining the
difference.

### A8. Menus, per the decision already taken

Use the per-restaurant menu rows rather than computed price ranges. On a table
card, show the arithmetic the visitor can't do:

> 삼겹살 2인분 ₩30,000 + 공기밥 2 → **약 ₩17,000/인**

Derived from that restaurant's own menu, with a `2026.8 기준` stamp. Where a
restaurant has no menu data, show nothing — never an estimate. Menu rows must be
structured data, not an image or PDF of a Korean menu.

### A9. Add a rendered-output i18n test

**What.** Assert that in `locale === 'en'`, the rendered output of Places rows,
map list rows and category cards contains no Hangul syllables.

**Why.** The category-card bug (#6) passed the existing string-table audit
because the strings were never in the table. A5 is the same bug in a different
place. A rendered-output assertion catches the whole class and will guard A5
automatically.

---

## Track B — Curation (humans, narrow and deliberate)

**Do not go 18 → 40.** The 18 entries are good because they have a point of view.
Twenty more written to fill a grid will dilute the only thing that distinguishes
this from a restaurant directory.

Write **six** instead, chosen to close the biggest coherence hole in the product.

### B1. One curated place per homepage category

The homepage offers six categories. There is currently **not one curated K-BBQ,
hot pot, or offal place** among the 18 — every path from the homepage's loudest
promise lands on nothing written.

| Category | Needs |
|---|---|
| 🔥 K-BBQ | 1 place |
| 🥘 HOT POT | 1 place |
| 🥢 SHARING TABLE | 1 place |
| 🦀 KOREAN ADVENTURE | 1 place |
| 🥬 KOREAN TABLE | 1 place |
| 🥞 STREET & SNACKS | 1 place |

Six pieces closes the hole that twenty-two random additions would not.

**Pick the six from the restaurants the seeded host tables actually use.** Then
every seeded table has a written place behind it, the 2차 운영 participants see
curation at the moment it matters, and the writing doubles as pilot material. One
job, three payoffs.

### B2. Write to the existing schema

The 18 entries already work. Match them: neighbourhood + city, a one-line
description with an actual opinion (`"Minimalist wood and hush — dining as
meditation."`), diet tags, and a story link where there's a story. Do not invent
a new format.

### B3. Photos — the one thing code cannot do

Ten dish cards and every place card are text-only. This is a food service with no
food in it, and it is the largest single gap between what the product promises
and what it shows.

Six photos, one per homepage category, shot at the seeded tables during 2차 운영.
That is a photographer's afternoon, it produces pilot documentation for the
결과보고서 at the same time, and it uses meals that are happening anyway.

Licensing: shoot your own or use a source with a written licence. Article 10 ⑧ of
the agreement puts third-party rights disputes on the team.

---

## Track C — Page-by-page UI

### C-1. Routing and Open Graph — **must land before 9/7**

Every navigation element is `<button>` with no `href`. Tabs change
`location.pathname`; individual tables, places and stories do not.

Give real routes to at minimum:

```
/tables/:id
/places/:slug
/stories/:slug
```

with per-route OG title/description/image. Until this exists, a visitor cannot
bookmark a dish, send a friend a link to the table they want to join, or open two
places side by side — and the SNS campaign has no target.

### C-2. Explore

- **Remove the empty-tables block from the top of this tab.** It currently leads
  Explore, pushing the actual content below. It belongs on Tables only. (Verified
  still present on the live build.)
- **Explain "Preview."** Four of seven cultures carry the badge with no
  explanation. Locked? Coming soon? Say which, or drop it.
- **`Enter this culture` → say what happens.** Keep the voice in headlines; let
  buttons state the action — `Read the 2 experiences`. Same for `Open a table`
  and `Pick a dish for me`.
- **The Editor's pick is Busan Seafood.** The pilot runs in Seoul and Incheon.
  Either scope the editor's pick to the pilot area during the pilot, or label it
  as further afield.

### C-3. Tables

- **Explain the women-only filter.** `Tables with another woman going` sits
  unlabelled among cuisine chips, so it reads as a preference rather than a
  safety feature. Move it next to the safety copy and name it as one.
- **The week strip shows seven zeros.** Once tables exist this resolves itself;
  until then, say when tables usually open rather than showing a bare `0`.

### C-4. Places

Covered by A1–A4, A7. Plus:

- **`Festival Picks` renders as a heading with no content.** Fill it or remove
  it. (Verified still present.)
- **Move the map up.** It is the most useful screen in the product and it sits at
  the bottom of Places behind `Open the map`.

### C-5. Passport

- **Hide `Share` until there is something to share.** It currently sits next to
  `Nothing recorded yet`.
- **The orange card has no heading** — body text about ordering phrases with
  nothing naming what it is.

### C-6. Cross-cutting

- **Horizontal chip rows clip mid-word** with only a scrollbar as a hint —
  category chips on Tables, filter chips on the map, language chips in Settings.
  Add a fade mask or wrap them.
- **Check dismissal persistence.** The sticky bar's dismissed flag is component
  state, so it returns on reload. Confirm the notice bar's close button persists
  to `sessionStorage`; a dismissal that keeps coming back is worse than no
  dismissal.

---

## Explicitly not now

- **Desktop layout (audit I6).** The audit itself called it not urgent. Most
  traffic is mobile.
- **More curated entries beyond the six in B1.** Revisit after the pilot.
- **Anything touching sign-up, matching or table flows during 2차 운영.** Testers
  are in those flows this week.
