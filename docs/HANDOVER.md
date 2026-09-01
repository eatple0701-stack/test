# HANDOVER — for the team Claude (and any new maintainer)

Written 2026-08-17 by the outgoing Claude instance, on the occasion of the
project moving from 강민's personal accounts to team accounts. Everything
below is either verifiable in this repository or sourced from the team's
planning documents (business plan, advisor feedback, foreign-tester
feedback, weekly meeting notes — kept in the team's shared folder, not in
this repo, because they contain personal information).

Read this top to bottom once. After that, `CLAUDE.md` at the repo root is
the short version that loads automatically.

---

## 1. What this product is

**밥친구 잇플 · Eatple** — *"Solo trip, shared table. Don't just visit
Korea. Share a Korean table."*

A solo foreign traveller in Korea is locked out of a large part of Korean
food — not by language or price, but by **portion**: samgyeopsal starts at
two servings, gamjatang arrives by the pot, hanjeongsik is a two-person
reservation. The app matches that food with the people already going:
you pick what you came to eat (six dish groups, twenty-four dishes), see
open tables, take a seat or open one yourself.

This is a **KF Digital Public Diplomacy Academy** project. That framing is
not decoration — the advisors' single strongest note (see §5) is that the
product must be cultural *exchange*, not a cost-splitting utility.

- Deployed: **https://eatple.vercel.app** — team Vercel account, live and
  current. (It was `test-umber-phi-78.vercel.app` until 2026-08-22; see
  `docs/account-migration.md`.)
- Stack: React 19 + Vite, mobile-first 375×812, Leaflet maps, Supabase
  (auth + tables + email notifications via Edge Function), PWA/offline.
- No paid APIs at runtime. All heavy data is fetched at build time and
  shipped as static JSON.

## 2. What has been built (as of 2026-08-17, 158 commits in August)

### Screens
- **Main** — Meetup-style landing: hero carousel, then the six dish-group
  cards ("한국에서 혼자 먹기 어려웠던 음식을 함께 먹어보세요") which open
  the Tables screen pre-filtered to that group; dish shelf (opens the story
  card deck); how-it-works; join panel; footer.
- **Tables (밥상)** — the core matching screen. Group chips → dish chips →
  week strip → table cards (host record, languages, station, deadline).
  Open a table / request a seat / join. Honest empty states per cause
  (a policy module decides *why* it is empty and only says what it checked).
- **Places** — 20 curated places (hand-written stories, checked facts,
  provenance on every field) + **8,118 register restaurants** (see §3).
  Search, dietary/trait chips, six group chips.
- **Map** — all of Seoul at once, dots tinted by dish group, legend above,
  foldable list below. Dot → card → Details → register place page →
  "Open a table here" with the dish preselected.
- **Dish card deck** — per-dish sliding cards: what it is, what's in it
  (no allergy verdicts — it opens the phrase sheet instead), history,
  one sourced story. Content rule: sourced or absent.
- **Passport (여권)** — personal record: tables sat, places saved, quiz.
- **Auth** — email + Google OAuth (consent screen is in *testing* mode;
  pilot participants' emails must be added as test users, or publish it).
- **Safety** — report a table/attendee, block (blocks hide their tables),
  one-line post-meal reviews, host table-count record, no-dating rules
  consent at signup.
- **i18n: 7 languages** (ko en es fr ar zh ja), RTL mirroring for Arabic.
  A parser-based audit (`node scripts/audit-i18n.mjs`) fails on any
  untranslated user-visible string — keep it at 0.

### The Seoul register pipeline (biggest August work)
See §3. 167,659 restaurants → 8,118 that actually serve the 24 dishes,
each with menu (4 languages), register prices, photos where the register
took them, all keyed to the six groups.

### Numbers
| | |
|---|---|
| Automated tests | **815, all passing** (`npm test`) |
| i18n audit | 0 untranslated strings |
| Register places shipped | 8,118 of 167,659 |
| Menu lines shipped | 199,574 (ko/en/ja/zh), 94,515 with register prices |
| Languages | 7 |

## 3. The data pipeline (read before touching `scripts/`)

```
data.go.kr 15097605 (서울관광재단 음식관광 DB)
│
├─ live API  (key: SEOUL_FOOD_API_KEY in .env.local — never VITE_-prefixed,
│             so it can never reach the browser bundle)
│   ├─ /api/rstr        167,659 restaurants        → scripts/.cache.local/
│   ├─ /api/rstr/oprt   hours + foreign-menu flag
│   ├─ /api/rstr/img    8,087 photos (1,370 places)
│   └─ /api/menu/korean 573,965 menu lines + MENU_PRICE (574 pages!)
│
├─ bulk download "다국어메뉴 설명정보" (CSVs, gitignored 서울관광재단*/ dirs)
│   └─ 873,117 menu lines × 4 languages, keyed by 메뉴(ID)
│
├─ scripts/dish-match.mjs        which restaurants serve the 24 dishes
├─ scripts/build-seoul-places.mjs → public/data/seoul/<district>.json ×25
└─ scripts/build-seoul-menus.mjs  → public/data/seoul/menus/<district>.json
```

Run order after changing anything: `dish-match` → `build-seoul-places` →
`build-seoul-menus`, then `npm test` (tests pin the shipped artefacts to
each other).

**Traps that cost real time — do not rediscover these:**
1. **Two unrelated id spaces.** The CSV download's 식당(ID) and the API's
   RSTR_ID share 6,025 ids and **zero** of them name the same restaurant.
   Every CSV↔API join is by normalised 식당명+구, dropped when ambiguous.
   Joining by id once produced 3,075 restaurants wearing somebody else's
   menu; it was caught only by comparing names.
2. **The API rate-limits with HTTP 429** and takes `pageNo` only (no
   search, no id filter, always 1,000 rows/page). One job at a time,
   exponential backoff, resumable `.part` checkpoints — all already in
   `scripts/seoul-food-api.mjs`. Never run two fetches concurrently.
3. **The photo CDN rejects any request carrying a Referer.** Every `<img>`
   pointing at it needs `referrerPolicy="no-referrer"`.
4. ~2,950 register rows have no/false coordinates (28 were geocoded to
   Sejong); the build keeps the row and drops only the position.
5. On this Windows machine, bash heredocs mangle backslashes and backticks
   — write codemod scripts with the Write tool, and pass a *function* as
   the `String.replace` replacer (`$` sequences otherwise expand).

## 4. Rules that are enforced, not suggested

These are tested. Breaking them fails `npm test`, and the tests were each
added after a real incident — do not delete them to make a feature fit.

1. **No unsourced facts.** Every fact on a curated place carries source,
   confidence, method, and check date (`fact()` in `src/data/restaurants.js`).
2. **No unsourced prices, no review scores ever.** Prices appear only with
   their source on the same screen (register prices say 등록부 기준
   2021–22). Naver/TripAdvisor ratings sit in the same API and are
   deliberately never read.
3. **Register places never borrow curated prose.** They render through
   `RegistryPlaceSheet`, which can only show what the register holds. The
   one time a register row went through the curated template, it printed
   invented sensory claims for an address nobody had visited.
4. **No dietary verdicts.** Vegan/halal are evidence-or-unknown, never
   guessed. An unknown never matches a dietary filter.
5. **Quiz/story content must cite a source someone actually read**
   (`src/content/sources.js`) — unsourced entries are filtered out at
   runtime.
6. **Two-tier place model.** `isRegistryPlace()` (`seoul-` id prefix)
   separates the 20 curated places from the 8,118 register rows
   *structurally*; screens must branch on it, not on hope.

Working discipline (learned the hard way, ask 강민 about "눌리지도 않고
이게 뭐냐"):
- **Verify what the user sees, not what the DOM contains.** A component
  can pass every query and be rendered 3,405px below the fold. Use the
  browser, measure geometry, click the thing.
- **Break a new test on purpose once** to prove it can fail.
- Extend, never rebuild; never delete a feature without asking.
- Reply to the team **in Korean**; write code and commits in English.
- Update the test counts in README.md/HANDOFF.md when the suite grows —
  a test pins the documented number to the real one.

Security (non-negotiable):
- Claude never types, stores, or asks for passwords/secrets. Account work
  (Supabase dashboard, Google Cloud, Vercel) is guided step-by-step and
  the human drives.
- `sb_publishable_…` is the public anon key (safe in the bundle);
  `sb_secret_…` keys bypass RLS and must never appear client-side.
- `SEOUL_FOOD_API_KEY` lives in `.env.local` only. The `서울관광재단*/`
  folders are gitignored (444MB + a file containing the key).

## 5. Business context → development direction

Synthesised from the shared-folder documents. This is the part that should
steer what gets built next.

### What the business plan promised (사업계획서)
Four pillars: ① menu-based table-mate matching (small 2–3 person tables,
time rules, language/nationality-aware), ② verified hosts with a host
guide, ③ 한식 스토리 — food culture content at the table (photo → info →
quiz → conversation cards), ④ record & share (passport, SNS). Pilot
period 8월–9월, target: 20–30s foreign visitors interested in Korean food.

Status: ① shipped (matching by dish group, prefilled tables); ② partially
(host records and briefs exist; a formal verification flow does not);
③ shipped in revised form — the plan's *AI photo recognition* was dropped
by team decision (8/8 tester feedback + 8/10 meeting): the testers said
the value is the story, not the camera trick. The flow is now photo/tile →
dish deck → phrases/quiz, which is the same promise without the ML cost;
④ passport shipped, SNS share half-built (navigator.share + OG cards).

### What the advisors said, and what it means for the roadmap
**김훈 부장님** (KOFAC): feasibility confirmed; wanted safety mechanisms
(신고/차단/후기 — **all shipped**), admin-approval thinking for stability,
*deep food-culture data collection* (**shipped** — the register pipeline is
exactly this), and personalisation: recommend by stated taste, and follow
the meal with related culture content + SNS spread. → personalisation and
post-meal content loops are the open items.

**신보람 교수님** (전북대): the sharpest strategic note. A cost-splitting
meal app is a travel utility; **public diplomacy lives in *how* the
exchange happens**. Concretely: (a) favour **Korean-host × foreigner
tables** — the host explaining the food *is* the diplomacy (the app's
verified-host pillar, under-built today); (b) keep the no-dating framing
explicit (rules consent — shipped) and consider 3+-person matching
defaults; (c) answer the UX questions the plan left open: which menus
qualify (answered: the 24-dish taxonomy), how long until a match confirms,
what happens on a no-show — **answered in code, not in this file's first
draft**: `src/domain/policy/attendance.js` already carries `isNoShow`,
`countsAsMet` and `canRecordAttendance` (only the host, only after the
meal, only for somebody who had a seat), and the Passport drops the people
recorded absent. Approval has the same shape in `seatRequest.js`. Do not
rebuild either; (d) marketing to people who don't know 나눠 먹는 문화 — the
dish stories and SNS card news are that answer.

### What the foreign testers changed (8/1, 8/8)
Shipped because of them: romanisation + Korean everywhere, dietary/allergy
transparency ("what you do not eat"), gender-preference option → guest
mode request, dark mode, PC layout fixes, map links to Google/Naver/Kakao,
date picker, crustacean allergy option, OpenChat links, "what to talk
about" cards, and the photo→info→card-news flow replacing AI recognition.
Still open from their lists: **guest mode** (nickname-only participation),
**Vietnamese/German/Russian** (team must decide — each language is real
translation work, the pipeline supports it), simpler profile country
selection.

### The calendar (from 회의록 8/17, updated 2026-08-28)
- ✅ **8/22 (Sat) 11:00 — the first real Table Mate pilot meal happened,
  and it went well.** That was the thing the whole August build was aimed
  at, and the product survived contact with real foreign guests. Details of
  how it went are with the team, not in this repository — ask them before
  planning the next round.
- SNS: Instagram **eat.ple_project** is live; card news for the 9–10
  representative dishes is being made in Canva; the app's dish-deck
  content and register data can (and should) feed it.
- Then: 1st feedback round → web improvements → 2nd beta (early Sept) →
  final report (mid Sept). The KF budget line funding the AI tooling ends
  with the program — keep the app runnable with zero paid services.

## 6. Prioritised roadmap for the incoming Claude

**Still blocking, now for the second round rather than the first:**
1. 개인정보 처리방침 + 이용약관 — *humans must write these*; wire the two
   reserved footer slots when they exist. Do not generate them. Confirmed
   still open in `src/components/MainTab.jsx` (the footer's 준비 중
   placeholders), and signup already collects email, phone and birth date,
   so this is the one item that is a legal exposure rather than a feature.
2. Google OAuth consent screen: add each new round's participants as test
   users (or publish the consent screen) — 5 minutes in the team's Google
   Cloud account, but forgotten = nobody can sign in with Google. Email
   sign-up needs no such step, which is the safe fallback on the day.
3. Create and end-to-end test a real table (open table → request → accept →
   email notification → .ics) on the production URL. The pilot test
   accounts are not written down in this repository on purpose — ask 강민
   for them.
4. ~~Finish the account migration~~ — **done 2026-08-22**, see §7 and
   `docs/account-migration.md`.

**Next (from the documents, in rough order of value):**
5. **Guest mode** — nickname-only participation (8/2 meeting + tester ask).
   Confirmed absent from the code.
6. Dish stories for the remaining dishes — *sourced only*, one dish at a
   time; this also feeds the SNS card news directly.
7. Search over menus/dishes, not just names ("갈비" should find places).
8. Dish photography from the register (`/api/food/img`, 1,198 photos,
   endpoint already wired in `scripts/seoul-food-api.mjs`, not yet
   fetched) — could give the dish deck real photos before the team's own
   shoot happens.
9. Language expansion decision (vi/de/ru) — team call, then the i18n
    pipeline makes it mechanical.

**Later / strategic (the advisors' arc):**
10. Host verification flow + host-forward matching surfaces (신보람's
    Korean-host × foreigner emphasis — the highest-leverage public-
    diplomacy feature not yet built).
11. Taste-based personalisation and post-meal culture follow-ups (김훈).
12. SNS export: turn a dish card / table recap into a shareable image.

## 7. Accounts & migration state (2026-08-17)

| Service | Today | Target |
|---|---|---|
| GitHub repo | ✅ **done 2026-08-22** — `eatple0701-stack/test`, branch `main`. The old address redirects. | — |
| Vercel | ✅ **done 2026-08-22** — team account, https://eatple.vercel.app | — |
| Supabase | ✅ **done 2026-08-22** — `Eatple` org, transferred. Project ref, keys and data unchanged, so nothing in the app moved with it. | — |
| Google Cloud (OAuth) | **already team** (eatple0701) | add pilot testers / publish consent screen |
| data.go.kr key | 강민 personal | any team member requests their own key for dataset 15097605, swap `.env.local` |
| Gmail (notifications) | team (eatple0701) via Edge Function secret | no change |

**Step-by-step runbook: `docs/account-migration.md`.** It carries the one
trap worth repeating here — `src/data/supabaseBackend.js` has no env
fallback, so a Vercel project without `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` deploys successfully and then silently drops to
localStorage, and tables stop being shared between devices. Both values are
public-safe and already committed as fallbacks in `api/table-og.js`.

**Vercel moved to the team account on 2026-08-22** and the app now lives
at https://eatple.vercel.app. All seventeen hardcoded references were
updated with it. If the URL ever changes again: `git grep vercel.app`
finds them, and the five inside `supabase/schema.sql` are
notification-email bodies that need re-applying in the SQL editor — editing
the file alone changes nothing that is already running.

## 8. Commands

```bash
npm test                      # 815 tests — must stay green
node scripts/audit-i18n.mjs   # must print 0
npm run dev                   # port 5177 (see .claude/launch.json)
npm run build                 # artefacts in dist/, data included

# data pipeline (needs .env.local with SEOUL_FOOD_API_KEY; run rarely)
node scripts/dish-match.mjs
node --max-old-space-size=6144 scripts/build-seoul-places.mjs
node --max-old-space-size=6144 scripts/build-seoul-menus.mjs
```

**Starting on a new machine**: `docs/new-computer-setup.md` — clone,
install, verify, and how pushing works. A fresh clone needs no secrets at
all; that was tested rather than assumed.

Korean-language docs that predate this file and remain authoritative for
their subjects: `HANDOFF.md` (운영·계정·마감 체크리스트),
`docs/CHANGELOG-ko.md` (8/17 발표용 변경 이력), `docs/DATA.md`,
`docs/EVIDENCE.md`, `docs/google-login-setup.md`,
`docs/seed-tables-playbook.md`, `docs/where-this-deploys.md`.

Good luck. The premise is strong, the data is real, and the tests will
tell you when you are about to lie to a traveller. Keep it that way.
