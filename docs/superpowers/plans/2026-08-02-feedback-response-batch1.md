# 피드백 대응 1차 배치 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Answer the professor's heaviest critique (the app has the public-diplomacy exchange but never says so), fix the two cheapest correctness problems (wrong README, dead K-Food Map files), and ship the gender-preference safety filter the foreign tester praised — as four independent, separately-shippable slices.

**Architecture:** No new layers. Gender follows the exact pattern `languages`/`diets` already established: a self-declared value lives on `profiles`, is copied onto a `table` at creation (like `host_nationality`) and onto a `signup` at join time (like `nationality`), flows through `tableMapping.js`, and both backends (`tableRepository.js` local + `supabaseBackend.js` remote) stay in parity. Framing changes are copy-only, added to existing label/blurb objects and rendered where the reader is already deciding whether to sit down. README is a full rewrite from the K-Food Map draft to the 밥친구 product described in `HANDOFF.md` §1–2.

**Tech Stack:** React 19, Vite, Node 24 built-in test runner (`node --test`), no test framework dependency, oxlint, Supabase (Postgres + RLS), plain CSS (one file, `src/index.css`).

## Global Constraints

- Test suite must stay green: `npm test` — 200 tests today, `node --test "src/**/*.test.mjs"`, ~14s. Every task that touches `src/` ends with a green run.
- `npm run lint` (oxlint) must pass after every task.
- No prices anywhere in copy (repo rule, HANDOFF §3).
- Nothing here may claim a dish's dietary status — a self-declared value is a message carried to a host, never a verdict the app renders as fact (HANDOFF §3, `profile.js`'s own header comment).
- `host_verified` and `host_kind` remain server/admin-only. No task in this plan touches those columns or their RLS policies.
- Every new optional profile field must be skippable and default to unset (`null`), never required — consistent with `name`/`nationality`/`languages`/`diets`/`avoids`.
- Verify at 375×812 (HANDOFF §2 — desktop-only verification has missed real problems before).
- Follow the codebase's comment style: comments explain *why*, not *what*, and are written in the file's existing narrative voice. Do not add comments that restate the code.
- `git add` only the files a task actually changed; commit after each task, not at the end of the batch.

---

## Group A — Host-table public-diplomacy framing (HANDOFF §5 item ⓪)

The professor's heaviest note: a purely transactional app ("split the bill, share a dish") is "실용적인 여행 앱일 뿐" — public diplomacy has to be in *how*, not *what*. The Hosted Table already **is** the answer (a Korean host walking a stranger through 주문/먹는법/예절/유래) but nothing rendered to a screen ever says that's what it's for — the reasoning lives only in code comments. These three tasks put it on screen, in the three places a reader is actually deciding: the label vocabulary, the table detail page, and the host's own creation form.

### Task 1: Give the Hosted Table label its own stated reason

**Files:**
- Modify: `src/domain/catalog/hosts.js:106-117`
- Test: `src/domain/__tests__/tableMapping.test.mjs` (extend the existing `TABLE_KIND_LABEL` shape test)

**Interfaces:**
- Produces: `TABLE_KIND_LABEL[TABLE_KIND.HOSTED].why` — a string, present only on `HOSTED` (not on `MATES`, which needs no exchange-framing — see the file's own comment that 테이블 메이트 is "not a lesser table").

- [ ] **Step 1: Write the failing test**

Add to `src/domain/__tests__/tableMapping.test.mjs`, after the existing `'both kinds read as something a traveller would choose on purpose'` test (around line 200):

```js
test('the hosted label states the exchange, not just the mechanics', () => {
  // The professor's review named this gap precisely: the feature existed and
  // the screen never said what it was for. `blurb` already describes the
  // mechanics ("the host walks you through it"); `why` is the missing half —
  // this is where the app is supposed to answer "어떻게" rather than "무엇".
  const hosted = TABLE_KIND_LABEL[TABLE_KIND.HOSTED];
  assert.ok(hosted.why, 'HOSTED needs a stated reason, not just a mechanic');
  assert.match(hosted.why, /host|Korean/i);

  // Table mates is honestly just people splitting a dish — inventing an
  // exchange-framing for it would be the app claiming a curated moment that
  // did not happen.
  assert.equal(TABLE_KIND_LABEL[TABLE_KIND.MATES].why, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern "states the exchange"`
Expected: FAIL — `hosted.why` is `undefined`.

- [ ] **Step 3: Add the `why` field**

In `src/domain/catalog/hosts.js`, replace lines 106–117:

```js
export const TABLE_KIND_LABEL = {
  [TABLE_KIND.HOSTED]: {
    kr: '호스트 테이블',
    en: 'Hosted table',
    blurb: 'The host walks the table through it.',
  },
  [TABLE_KIND.MATES]: {
    kr: '테이블 메이트',
    en: 'Table mates',
    blurb: 'Everyone works it out together.',
  },
};
```

with:

```js
export const TABLE_KIND_LABEL = {
  [TABLE_KIND.HOSTED]: {
    kr: '호스트 테이블',
    en: 'Hosted table',
    blurb: 'The host walks the table through it.',
    // The professor's review, answered in one sentence where a guest is
    // actually deciding whether to choose this table over a 테이블 메이트
    // one. Not a slogan for the front door — the front door already tried
    // that and the professor's note was that it read as decoration there.
    // This is the specific claim the exchange rests on: a Korean host,
    // teaching their own food, in the guest's language.
    why: 'A Korean host explaining their own food, in your language — this is the exchange the app exists for.',
  },
  [TABLE_KIND.MATES]: {
    kr: '테이블 메이트',
    en: 'Table mates',
    blurb: 'Everyone works it out together.',
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --test-name-pattern "states the exchange"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/catalog/hosts.js src/domain/__tests__/tableMapping.test.mjs
git commit -m "feat: state why a hosted table is the public-diplomacy exchange"
```

---

### Task 2: Render the reason on the table detail page

**Files:**
- Modify: `src/components/TableDetail.jsx:302-306`
- Modify: `src/index.css` (add one rule near line 7961, after `.detail-kind__blurb`)

**Interfaces:**
- Consumes: `tableKindLabel(table).why` from Task 1.

- [ ] **Step 1: Add the line to `detail-kind`**

In `src/components/TableDetail.jsx`, the block currently reads (lines 302–306):

```jsx
      <div className="detail-block detail-kind">
        <span className={`detail-kind__tag is-${tableKind(table)}`}>
          {tableKindLabel(table).kr} · {tableKindLabel(table).en}
        </span>
        <p className="detail-kind__blurb">{tableKindLabel(table).blurb}</p>
```

Change to:

```jsx
      <div className="detail-block detail-kind">
        <span className={`detail-kind__tag is-${tableKind(table)}`}>
          {tableKindLabel(table).kr} · {tableKindLabel(table).en}
        </span>
        <p className="detail-kind__blurb">{tableKindLabel(table).blurb}</p>
        {/* Only on a Hosted table — Task 1 in the feedback-response plan.
            This is the professor's "어떻게, 무엇이 아니라" note, answered where
            a guest is actually choosing this table over a 테이블 메이트 one. */}
        {tableKindLabel(table).why && (
          <p className="detail-kind__why">{tableKindLabel(table).why}</p>
        )}
```

(Leave the rest of the block — the headcount paragraph — unchanged.)

- [ ] **Step 2: Add the CSS rule**

In `src/index.css`, after the existing `.detail-kind__blurb` rule (around line 7956–7961):

```css
.detail-kind__blurb {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--ink-secondary);
}
.detail-kind__why {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  font-weight: 600;
  color: var(--ink);
}
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open a table whose `guides` array is non-empty (a Hosted table — any seeded sample table with `guides` set, or open one yourself via 상 차리기 with a guide ticked), confirm the new sentence renders under the existing blurb, in both the light and dark viewport (375×812).

- [ ] **Step 4: Run full suite**

Run: `npm test && npm run lint`
Expected: 200 passing, 0 lint errors (this task adds no new logic, only JSX/CSS).

- [ ] **Step 5: Commit**

```bash
git add src/components/TableDetail.jsx src/index.css
git commit -m "feat: show the hosted-table framing on the detail page"
```

---

### Task 3: Tell the host what they're actually doing while they tick guides

**Files:**
- Modify: `src/components/TableCreate.jsx:243-250`
- Modify: `src/index.css` (one new rule near `.kind-preview`, line ~7977)

**Interfaces:**
- Consumes: `guides` state (existing, `TableCreate.jsx:42`).

- [ ] **Step 1: Add the sentence**

In `src/components/TableCreate.jsx`, the block currently reads (lines 243–250):

```jsx
        <p className="kind-preview">
          <span className={`kind-preview__tag is-${guides.length > 0 ? 'hosted' : 'mates'}`}>
            {guides.length > 0 ? TABLE_KIND_LABEL.hosted.kr : TABLE_KIND_LABEL.mates.kr}
          </span>
          {guides.length > 0
            ? ' — you are offering to walk the table through it.'
            : ' — tick nothing and yours is a table where everyone works it out together. That is a real table too.'}
        </p>
```

Add directly after it:

```jsx
        {/* The professor's note, answered to the person who can actually act
            on it: a host deciding whether to tick a box. Everything above
            this point in the form is a booking; ticking one guide is what
            turns it into the exchange the plan is actually funded to make
            happen. Only shown once they have ticked something — telling a
            host who ticked nothing that they are doing public diplomacy
            wrong would be exactly the "lesser table" framing the codebase
            has deliberately avoided elsewhere (see TABLE_KIND_LABEL.mates). */}
        {guides.length > 0 && (
          <p className="host-why">
            이게 이 앱이 하는 일입니다 · This is the part of 밥친구 that is not
            just a group booking — a Korean host teaching a stranger their
            own food, in a language the stranger understands.
          </p>
        )}
```

- [ ] **Step 2: Add the CSS rule**

In `src/index.css`, after the `.kind-preview__tag.is-mates` rule (around line 7977):

```css
.host-why {
  margin: 8px 0 0;
  font-size: 12.5px;
  line-height: 1.5;
  font-weight: 600;
  color: var(--ink);
}
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open 상 차리기, tick a 문화 가이드 box, confirm the sentence appears; untick all, confirm it disappears without layout jump.

- [ ] **Step 4: Run full suite**

Run: `npm test && npm run lint`

- [ ] **Step 5: Commit**

```bash
git add src/components/TableCreate.jsx src/index.css
git commit -m "feat: tell a host what ticking a guide actually does"
```

---

## Group B — README rewrite (HANDOFF §5 item ①)

### Task 4: Replace the K-Food Map README with the 밥친구 one

**Files:**
- Modify: `README.md` (full rewrite)

**Interfaces:** None — documentation only.

- [ ] **Step 1: Replace the file**

Replace the entire contents of `README.md` with:

```markdown
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

```bash
npm test          # 200 tests, node's built-in runner, no test-framework dependency
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
```

- [ ] **Step 2: Verify no dangling references**

Run: `grep -rn "README" HANDOFF.md docs/where-this-deploys.md` — confirm nothing else expects specific old README wording. (Nothing should — HANDOFF §0 only says the old README describes the wrong product, which is now fixed.)

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README for 밥친구, replacing the K-Food Map draft"
```

---

## Group C — Dead file cleanup (HANDOFF §5 item ②)

### Task 5: Remove the three zero-reference K-Food Map files

**Files:**
- Delete: `temp.js`
- Delete: `geocode_and_build.cjs`
- Delete: `verify.cjs`
- Modify: `HANDOFF.md:230-240` (mark the item done, matching the repo's habit of keeping HANDOFF accurate to what's actually left)

**Interfaces:** None.

- [ ] **Step 1: Confirm zero references, one more time, right before deleting**

```bash
grep -rln "geocode_and_build\|verify\.cjs\|temp\.js" --include="*.js" --include="*.jsx" --include="*.json" --include="*.mjs" . | grep -v node_modules
```

Expected: no output except possibly `HANDOFF.md` itself (its own dead-file table, which Step 3 below updates).

- [ ] **Step 2: Delete the files**

```bash
git rm temp.js geocode_and_build.cjs verify.cjs
```

- [ ] **Step 3: Update HANDOFF.md**

In `src/HANDOFF.md`, replace the `### ② 죽은 파일 정리 · 막힌 것 없음` section (lines 230–240):

```markdown
### ② 죽은 파일 정리 · 막힌 것 없음

참조가 0인 K-Food Map 잔재입니다.

| 파일 | 상태 |
| --- | --- |
| `temp.js` | 빈 파일 (0줄) |
| `geocode_and_build.cjs` | 349줄, 참조 0 |
| `verify.cjs` | 25줄, 참조 0 |

`data/evidence/`(2개)는 `verification.js`가 쓰므로 **남겨두세요.**
```

with:

```markdown
### ② 죽은 파일 정리 · 완료

참조 0건을 확인하고 `temp.js`, `geocode_and_build.cjs`, `verify.cjs`를
삭제했습니다. `data/evidence/`(2개)는 `verification.js`가 아직 쓰므로
남겨뒀습니다.
```

- [ ] **Step 4: Run full suite**

Run: `npm test && npm run build`
Expected: 200 passing, build succeeds (these three files were never imported, so this is a no-op check, not a real risk — run it anyway).

- [ ] **Step 5: Commit**

```bash
git add HANDOFF.md
git commit -m "chore: delete three zero-reference K-Food Map files"
```

---

## Group D — Gender preference (self-declared, optional) + Tables filter

The foreign tester's 8/1 review: *"성별 선호 필터 긍정적으로 봄(안전 보장)"* — but HANDOFF §4 flags that no such filter exists anywhere in this repo or its git history, and warns that being praised for a safety feature the app does not actually have is the most dangerous state a safety review can be in. Decision (made outside this plan, already final): build it now.

**Scope, decided here and stated once rather than re-litigated per task:** gender is self-declared, optional, never verified — identical treatment to `nationality`. The filter is a personal, non-binding *view* preference on the Tables list — like the existing dish filter — not a rule that blocks anyone from hosting or joining. It answers exactly the praised feature ("show me tables where I won't be the only woman") without the app claiming to police who may sit where, which this codebase has been careful never to overclaim (see `safety.js`'s `NOT_YET_BUILT` and the extensive comments on `host_verified` never being self-granted).

### Task 6: Gender vocabulary and the table-composition check

**Files:**
- Create: `src/domain/catalog/genders.js`
- Test: `src/domain/__tests__/genders.test.mjs`

**Interfaces:**
- Produces: `GENDERS: string[]`, `isGender(g): boolean`, `cleanGender(g): string | null`, `tableIncludesGender(table, signups, wanted): boolean`.
- Consumed by: Task 7 (`profile.js` default shape), Task 8 (`ProfileFields.jsx`), Task 9 (schema + mapping), Task 11 (`TablesTab.jsx` filter).

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/genders.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENDERS, isGender, cleanGender, tableIncludesGender } from '../catalog/genders.js';

test('the vocabulary is fixed and self-declared, not a scale', () => {
  assert.deepEqual(GENDERS, ['Woman', 'Man', 'Non-binary']);
});

test('isGender only recognises the catalog values', () => {
  assert.equal(isGender('Woman'), true);
  assert.equal(isGender('woman'), false, 'case must match exactly, like LANGUAGES');
  assert.equal(isGender('teach-me-taekwondo'), false);
  assert.equal(isGender(null), false);
});

test('cleanGender drops anything the catalog does not know, keeps unset as null', () => {
  assert.equal(cleanGender('Woman'), 'Woman');
  assert.equal(cleanGender('nonsense'), null);
  assert.equal(cleanGender(null), null);
  assert.equal(cleanGender(undefined), null);
});

test('tableIncludesGender checks the host and every signup', () => {
  const table = { hostGender: 'Man' };
  assert.equal(tableIncludesGender(table, [], 'Woman'), false, 'no woman at this table yet');
  assert.equal(
    tableIncludesGender(table, [{ gender: 'Woman' }], 'Woman'),
    true,
    'a guest declared it even though the host did not',
  );
  assert.equal(
    tableIncludesGender({ hostGender: 'Woman' }, [], 'Woman'),
    true,
    'the host counts as attending their own table',
  );
});

test('no preference means every table qualifies', () => {
  // Mirrors matchRequest's isEmptyRequest pattern: "I have no preference" must
  // not silently become "I only want tables with nobody on them".
  assert.equal(tableIncludesGender({ hostGender: 'Man' }, [], null), true);
  assert.equal(tableIncludesGender({ hostGender: 'Man' }, [], undefined), true);
});

test('unset gender on the host or a guest never matches a stated preference', () => {
  assert.equal(tableIncludesGender({ hostGender: null }, [{ gender: null }], 'Woman'), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern "genders|tableIncludesGender"`
Expected: FAIL — `src/domain/catalog/genders.js` does not exist.

- [ ] **Step 3: Implement**

Create `src/domain/catalog/genders.js`:

```js
// Self-declared gender — a message like nationality, never a verdict.
//
// The foreign tester's 8/1 review praised a "gender preference filter" that
// did not exist anywhere in this repo or its git history — see HANDOFF.md §4.
// Decision, made outside this file: build it. Scope, decided once here rather
// than re-argued at every call site — self-declared and optional, exactly
// like `nationality` (src/data/profile.js); never verified; and the filter it
// powers changes what a traveller sees on their own Tables list, the same way
// the existing menu-dish chips do. It does not gate who may host or join a
// table — this app does not police seating, and has been careful never to
// claim safety machinery it does not have (see NOT_YET_BUILT in
// content/safety.js).

export const GENDERS = ['Woman', 'Man', 'Non-binary'];

export const isGender = (g) => GENDERS.includes(g);

/** Only a value this catalog knows; unset stays null rather than becoming a guess. */
export const cleanGender = (g) => (isGender(g) ? g : null);

/**
 * Does this table currently include somebody who declared `wanted`?
 *
 * The host counts — they are seated at their own table — so a solo host who
 * said "Woman" already satisfies a "Woman" preference with no guests yet.
 * `wanted` of null/undefined means no preference was stated, and every table
 * qualifies — mirroring how an empty menu filter in TablesTab shows
 * everything rather than nothing.
 */
export function tableIncludesGender(table, signups = [], wanted = null) {
  if (!wanted) return true;
  if (table?.hostGender === wanted) return true;
  return signups.some(s => s?.gender === wanted);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --test-name-pattern "genders|tableIncludesGender"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/catalog/genders.js src/domain/__tests__/genders.test.mjs
git commit -m "feat: add self-declared gender vocabulary and table-composition check"
```

---

### Task 7: Add `gender` to the profile's default shape

**Files:**
- Modify: `src/data/profile.js:88`
- Test: `src/domain/__tests__/profile.test.mjs` (new file)

**Interfaces:**
- Consumes: nothing new (no import needed — `profile.js` does not need to know the catalog to carry an opaque field, exactly like it already carries `avoids`/`diets` without importing anything that validates them at this layer).
- Produces: `getProfile()` now returns an object that always has a `gender` key (`null` by default), so nothing downstream has to write `profile?.gender ?? null` defensively at every call site.

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/profile.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// getProfile/saveProfile touch localStorage, which node:test does not
// provide. A tiny in-memory stand-in is enough — the same shape jsdom-less
// unit tests in this repo already assume (see tableRepository, which is
// exercised only through the domain layer, never directly, for the same
// reason).
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

const { getProfile } = await import('../../data/profile.js');

test('a fresh profile has an unset gender, not a missing key', () => {
  globalThis.localStorage.clear();
  const p = getProfile();
  assert.equal(p.gender, null);
  assert.ok('gender' in p, 'the key must exist so ?? defaults are never needed downstream');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern "unset gender"`
Expected: FAIL — `p.gender` is `undefined`, and `'gender' in p` is `false`.

- [ ] **Step 3: Implement**

In `src/data/profile.js`, change line 88:

```js
  const fresh = { userId: newUserId(), name: '', nationality: '', languages: [] };
```

to:

```js
  const fresh = { userId: newUserId(), name: '', nationality: '', languages: [], gender: null };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --test-name-pattern "unset gender"`
Expected: PASS

- [ ] **Step 5: Run full suite and commit**

```bash
npm test && npm run lint
git add src/data/profile.js src/domain/__tests__/profile.test.mjs
git commit -m "feat: give every profile an explicit, unset gender field"
```

---

### Task 8: Let a traveller state their gender in Profile

**Files:**
- Modify: `src/components/ProfileFields.jsx`

**Interfaces:**
- Consumes: `GENDERS` from `src/domain/catalog/genders.js` (Task 6), `profile.gender` (Task 7).
- Produces: `onProfileChange({ ...profile, gender })`, single-select (not multi, unlike languages/diets/avoids).

- [ ] **Step 1: Add the import**

In `src/components/ProfileFields.jsx`, change line 2:

```js
import { LANGUAGES } from '../domain/catalog/languages.js';
```

to:

```js
import { LANGUAGES } from '../domain/catalog/languages.js';
import { GENDERS } from '../domain/catalog/genders.js';
```

- [ ] **Step 2: Read the current value**

After line 36 (`const diets = profile?.diets ?? [];`), add:

```js
  const gender = profile?.gender ?? null;
```

- [ ] **Step 3: Add the field**

After the "Languages you speak" `Field` block (ends at line 85, `</Field>`), and before the "What you do not eat" block, insert:

```jsx
        {/* Optional and self-declared, exactly like nationality — never
            verified, never used by the app to decide anything about a dish.
            The one place it changes another screen: the Tables filter
            (TablesTab.jsx), which is the feature this field exists for. */}
        <Field
          label="Gender (optional)"
          hint="Not verified — just what you tell the table. Used only for the 'tables with another woman' filter on Tables."
        >
          <div className="chip-row">
            {GENDERS.map(g => (
              <button
                key={g}
                className={`chip${gender === g ? ' active' : ''}`}
                aria-pressed={gender === g}
                onClick={() => save({ gender: gender === g ? null : g })}
              >
                {g}
              </button>
            ))}
          </div>
        </Field>

```

(Single-select via toggle-off-if-already-on, same interaction the existing chip rows use for their own selected state — no new interaction pattern introduced.)

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open Passport → Profile fields, tap a gender chip, confirm exactly one stays highlighted at a time and tapping the active one clears it. Confirm at 375×812.

- [ ] **Step 5: Run full suite**

Run: `npm test && npm run lint`

- [ ] **Step 6: Commit**

```bash
git add src/components/ProfileFields.jsx
git commit -m "feat: let a traveller optionally state their gender in Profile"
```

---

### Task 9: Carry gender through the database — schema and row mapping

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `src/data/tableMapping.js`
- Modify: `src/domain/__tests__/tableMapping.test.mjs`

**Interfaces:**
- Produces: `tableFromRow(row).hostGender`, `tableToRow(input,...).host_gender`, `signupFromRow(row).gender`, `signupToRow(input,...).gender`.
- Consumed by: Task 10 (`supabaseBackend.js`), Task 12 (`tableRepository.js` local path), Task 13 (`TableCreate.jsx`, `TableDetail.jsx`).

These three always ship together — a schema column with no mapping is invisible to the app, and a mapping with no column throws in production the first time it runs against a real database.

- [ ] **Step 1: Write the failing tests**

In `src/domain/__tests__/tableMapping.test.mjs`, extend the `row` fixture (lines 17–30) by adding `host_gender: 'Woman',` after `host_nationality: 'Korea',`. Then add, after the existing `'a table row maps onto every field the screens read'` test:

```js
test('gender maps both ways, like nationality', () => {
  const t = tableFromRow(row);
  assert.equal(t.hostGender, 'Woman');

  const out = tableToRow(
    { menuId: 'bossam', hostName: 'Kang', hostGender: 'Man',
      date: '2026-08-20', time: '18:00', place: 'Gongdeok', seats: '4', note: '' },
    { hostId: 'uuid-host' },
  );
  assert.equal(out.host_gender, 'Man');

  const s = signupFromRow({
    id: 'uuid-s', table_id: 'uuid-1', user_id: 'uuid-u',
    name: 'Aya', gender: 'Non-binary', created_at: '2026-07-29T11:00:00Z',
  });
  assert.equal(s.gender, 'Non-binary');

  const signupOut = signupToRow({ tableId: 'uuid-1', name: 'Aya', gender: 'Woman' }, { userId: 'uuid-u' });
  assert.equal(signupOut.gender, 'Woman');
});

test('an unknown or missing gender never reaches the row as a guess', () => {
  const out = tableToRow(
    { menuId: 'bossam', hostName: 'Kang', hostGender: 'nonsense',
      date: '2026-08-20', time: '18:00', place: 'Gongdeok', seats: '4' },
    { hostId: 'uuid-host' },
  );
  assert.equal(out.host_gender, null);

  const t = tableFromRow({ ...row, host_gender: null });
  assert.equal(t.hostGender, null);

  const signupOut = signupToRow({ tableId: 'uuid-1', name: 'Aya', gender: 'not-a-gender' }, { userId: 'u' });
  assert.equal(signupOut.gender, null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --test-name-pattern "gender maps both ways|never reaches the row"`
Expected: FAIL — `tableFromRow`/`tableToRow`/`signupFromRow`/`signupToRow` do not yet read or write gender.

- [ ] **Step 3: Update the schema**

In `supabase/schema.sql`, after the existing `languages` column on `profiles` (line 25, inside the `create table if not exists public.profiles` block), the table stays a single `create table`, so add a matching `alter table ... add column if not exists` block right after it (following the file's own established pattern for post-hoc columns, e.g. the `restaurant`/`host_kind`/`guides`/`languages` alters already in the file). Insert after line 28 (`);` closing the `profiles` table):

```sql
-- Self-declared, like nationality — never verified, never used by the app to
-- judge a dish. Powers only the "tables with another woman" filter on Tables
-- (src/domain/catalog/genders.js). See HANDOFF.md §4: praised by a reviewer
-- for existing before it did.
alter table public.profiles add column if not exists gender text;
```

Then, in the `tables` block, after the existing `host_kind` alter (line 74), add:

```sql
-- Copied from the host's profile at table-open time, same treatment as
-- host_nationality — self-declared, not a credential, and unlike
-- host_verified/host_kind it IS the host's own to set.
alter table public.tables add column if not exists host_gender text;
```

And in the `signups` block, after the existing `diets` alter (line 120), add:

```sql
-- What a guest told the table about their gender, same treatment as diets:
-- carried, not judged. Powers the "tables with another woman" filter, which
-- counts a table's host and every current signup.
alter table public.signups add column if not exists gender text;
```

- [ ] **Step 4: Update the mapping**

In `src/data/tableMapping.js`:

`tableFromRow` (lines 18–44) — after `hostNationality: row.host_nationality ?? '',` (line 25), add:

```js
    hostGender: row.host_gender ?? null,
```

`tableToRow` (lines 47–67) — needs `cleanGender`. Add the import at the top:

```js
import { cleanGuides } from '../domain/catalog/hosts.js';
import { cleanLanguages } from '../domain/catalog/languages.js';
import { cleanGender } from '../domain/catalog/genders.js';
import { cleanDiets } from './profile.js';
```

Then after `host_nationality: input.hostNationality ?? '',` (line 52), add:

```js
    host_gender: cleanGender(input.hostGender),
```

`signupFromRow` (lines 69–82) — after `nationality: row.nationality ?? '',` (line 76), add:

```js
    gender: row.gender ?? null,
```

`signupToRow` (lines 84–94) — after `nationality: input.nationality ?? '',` (line 89), add:

```js
    gender: cleanGender(input.gender),
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: 209 passing (200 baseline + 6 from Task 6's `genders.test.mjs` + 1 from Task 7's `profile.test.mjs` + 2 added to `tableMapping.test.mjs` in this task).

- [ ] **Step 6: Apply the schema against the dev project (if one is configured)**

If `.env.local` has Supabase keys, run the three new `alter table` statements in the Supabase SQL editor (or re-run the whole `schema.sql` — it is written to be safe to run twice, per its own header comment). Skip this step entirely if running on localStorage only — nothing in Tasks 6–9 requires a live database.

- [ ] **Step 7: Commit**

```bash
git add supabase/schema.sql src/data/tableMapping.js src/domain/__tests__/tableMapping.test.mjs
git commit -m "feat: carry self-declared gender through schema and row mapping"
```

---

### Task 10: Wire gender through the Supabase backend

**Files:**
- Modify: `src/data/supabaseBackend.js`

**Interfaces:**
- Consumes: `cleanGender` (Task 6), `host_gender`/`gender` columns (Task 9).
- Produces: `ensureProfile()` and the profile row it returns both carry `gender`; `saveProfileFields()` accepts and writes it. (`createTable`/`createSignup` need **no change** — they already pass the full `input` object through to `tableToRow`/`signupToRow`, which Task 9 already taught to read `hostGender`/`gender`.)

- [ ] **Step 1: Add the import**

At the top of `src/data/supabaseBackend.js`, add:

```js
import { cleanGender } from '../domain/catalog/genders.js';
```

- [ ] **Step 2: Return gender from `ensureProfile`**

In the `existing` branch (lines 102–110):

```js
  if (existing) {
    return {
      userId: existing.id,
      name: existing.name ?? '',
      nationality: existing.nationality ?? '',
      languages: existing.languages ?? [],
      isVerifiedHost: existing.is_verified_host ?? false,
    };
  }
```

add `gender: existing.gender ?? null,` after `languages`:

```js
  if (existing) {
    return {
      userId: existing.id,
      name: existing.name ?? '',
      nationality: existing.nationality ?? '',
      languages: existing.languages ?? [],
      gender: existing.gender ?? null,
      isVerifiedHost: existing.is_verified_host ?? false,
    };
  }
```

In the insert branch (lines 114–123), the `row` object already spreads nothing beyond named fields — add `gender: cleanGender(local.gender),` after `languages: local.languages ?? [],`:

```js
  const row = {
    id: user.id,
    name: local.name ?? '',
    nationality: local.nationality ?? '',
    languages: local.languages ?? [],
    gender: cleanGender(local.gender),
  };
  const { error } = await sb.from('profiles').insert(row);
  if (error) throw new Error(friendlyError(error));

  return { userId: user.id, ...local, isVerifiedHost: false };
```

(The final return already spreads `...local`, which carries whatever `gender` the caller passed in — unchanged.)

- [ ] **Step 3: Let `saveProfileFields` write it**

Change:

```js
export async function saveProfileFields({ name, nationality, languages }) {
  const sb = await client();
  const user = await currentUser();
  const { error } = await sb.from('profiles')
    .update({ name, nationality, languages })
    .eq('id', user.id);
  if (error) throw new Error(friendlyError(error));
}
```

to:

```js
export async function saveProfileFields({ name, nationality, languages, gender }) {
  const sb = await client();
  const user = await currentUser();
  const { error } = await sb.from('profiles')
    .update({ name, nationality, languages, gender: cleanGender(gender) })
    .eq('id', user.id);
  if (error) throw new Error(friendlyError(error));
}
```

- [ ] **Step 4: Check callers of `saveProfileFields`**

Run: `grep -rn "saveProfileFields" src/` — confirm every call site either already spreads the whole profile object (so `gender` rides along automatically) or is updated to pass it explicitly. (At the time of writing this plan, no screen calls `saveProfileFields` directly yet — profile edits go through `ProfileFields.jsx`'s `onProfileChange`, which writes to the repository layer via a different path. If this grep finds a call site, pass `gender` through it the same way `name`/`nationality`/`languages` already are.)

- [ ] **Step 5: Run full suite**

Run: `npm test && npm run lint`
Expected: 209 passing (no new tests in this task — `supabaseBackend.js` is exercised only against a live project, consistent with the rest of the file having no unit tests of its own; `tableMapping.js`'s tests already cover the pure logic this task depends on).

- [ ] **Step 6: Commit**

```bash
git add src/data/supabaseBackend.js
git commit -m "feat: carry gender through the Supabase profile read/write path"
```

---

### Task 11: Wire gender through the localStorage backend

**Files:**
- Modify: `src/data/tableRepository.js`

**Interfaces:**
- Produces: `local_createTable` writes `hostGender`; `local_createSignup` writes `gender`. Keeps the local path in parity with Task 10's remote path — the whole point of `tableRepository.js` (per its own header comment) is that no screen can tell which backend it is talking to.

- [ ] **Step 1: Update `local_createTable`**

In `src/data/tableRepository.js`, inside `local_createTable` (lines 66–103), after `hostNationality: input.hostNationality ?? '',` (line 72), add:

```js
    hostGender: input.hostGender ?? null,
```

- [ ] **Step 2: Update `local_createSignup`**

Inside `local_createSignup` (lines 132–147), after `nationality: input.nationality ?? '',` (line 138), add:

```js
    gender: input.gender ?? null,
```

- [ ] **Step 3: Update the JSDoc comments**

The `@param` comment above `local_createTable` (line 64) and `local_createSignup` (line 130) list the input shape — add `hostGender` and `gender` respectively, so the comment stays true:

```js
/**
 * @param {object} input { menuId, hostName, hostNationality, hostGender, date, time, place, seats, note }
 */
```

```js
/**
 * @param {object} input { tableId, userId, name, nationality, gender, languages, note }
 */
```

- [ ] **Step 4: Manual parity check**

Run: `npm run dev` with no `.env.local` (or an empty one) so the app runs on localStorage. Set a gender in Profile, open a table (상 차리기), then check devtools → Application → Local Storage → `bapchingu-tables` and confirm the created row's `hostGender` matches what was set in Profile.

- [ ] **Step 5: Run full suite**

Run: `npm test && npm run lint`

- [ ] **Step 6: Commit**

```bash
git add src/data/tableRepository.js
git commit -m "feat: carry gender through the localStorage backend, matching Supabase"
```

---

### Task 12: Send a traveller's gender onto the tables and signups they create

**Files:**
- Modify: `src/components/TableCreate.jsx:61-65`
- Modify: `src/components/TableDetail.jsx:93-100`
- Modify: `src/components/TableDetail.jsx:372-396` (the "Who is going" list)

**Interfaces:**
- Consumes: `profile.gender` (Task 7), `createTable`/`createSignup` accepting `hostGender`/`gender` (Tasks 10–11).

- [ ] **Step 1: Host — carry gender when opening a table**

In `src/components/TableCreate.jsx`, the `submit` function's `createTable` call (lines 61–65):

```js
    const row = await createTable({
      menuId, date, time, place: place.trim(), restaurant: restaurant.trim(), guides, languages,
      seats: Number(seats), note: note.trim(),
      hostId: profile?.userId, hostName: hostName.trim(), hostNationality: profile?.nationality,
    });
```

add `hostGender: profile?.gender ?? null,` after `hostNationality`:

```js
    const row = await createTable({
      menuId, date, time, place: place.trim(), restaurant: restaurant.trim(), guides, languages,
      seats: Number(seats), note: note.trim(),
      hostId: profile?.userId, hostName: hostName.trim(), hostNationality: profile?.nationality,
      hostGender: profile?.gender ?? null,
    });
```

(No new form field here — gender is a Profile-level fact, inherited the same way `hostNationality` already is, without asking the host a second time.)

- [ ] **Step 2: Guest — carry gender when taking a seat**

In `src/components/TableDetail.jsx`, the `join` function's `createSignup` call (lines 93–100):

```js
      await createSignup({
        tableId, userId: profile?.userId, name: name.trim(),
        nationality: nationality.trim(), note: note.trim(),
        languages: profile?.languages ?? [],
        // Halal, vegan, whatever they call it — carried to the host rather
        // than used by the app to rule on a dish it cannot check.
        diets: profile?.diets ?? [],
      });
```

add `gender: profile?.gender ?? null,` after `diets`:

```js
      await createSignup({
        tableId, userId: profile?.userId, name: name.trim(),
        nationality: nationality.trim(), note: note.trim(),
        languages: profile?.languages ?? [],
        // Halal, vegan, whatever they call it — carried to the host rather
        // than used by the app to rule on a dish it cannot check.
        diets: profile?.diets ?? [],
        gender: profile?.gender ?? null,
      });
```

- [ ] **Step 3: Show a guest's declared gender in "Who is going"**

In `src/components/TableDetail.jsx`, the signups list (lines 372–396) currently shows nationality next to a guest's name:

```jsx
          {signups.map(s => (
            <li key={s.id} className="who-row who-row--stacked">
              <span className="who-row__dot" aria-hidden="true" />
              <span className="who-row__line">
                <span className="who-row__name">{s.name}</span>
                {s.nationality && <span className="who-row__role">{s.nationality}</span>}
              </span>
```

Change the nationality line to fold in gender the same way the block below it already folds diets into one joined line:

```jsx
          {signups.map(s => (
            <li key={s.id} className="who-row who-row--stacked">
              <span className="who-row__dot" aria-hidden="true" />
              <span className="who-row__line">
                <span className="who-row__name">{s.name}</span>
                {/* Self-declared, shown as one line with nationality rather
                    than as a separate row — neither is verified, and
                    stacking two unverified facts under two different visual
                    weights would read as if one carried more certainty than
                    the other. */}
                {[s.nationality, s.gender].filter(Boolean).length > 0 && (
                  <span className="who-row__role">
                    {[s.nationality, s.gender].filter(Boolean).join(' · ')}
                  </span>
                )}
              </span>
```

(Leave everything else in the block — diets, note — unchanged.)

- [ ] **Step 4: Manual verification**

With gender set in Profile: open 상 차리기 and create a table, confirm no new field is asked (gender rides silently); from a second profile/session, take a seat at that table with a gender set, then reopen the table as the host and confirm the guest's row shows `Nationality · Gender` correctly joined, and correctly shows just one of the two if only one was set, and shows neither span at all if both are unset (no dangling `· `).

- [ ] **Step 5: Run full suite**

Run: `npm test && npm run lint`

- [ ] **Step 6: Commit**

```bash
git add src/components/TableCreate.jsx src/components/TableDetail.jsx
git commit -m "feat: carry a traveller's declared gender onto tables and signups"
```

---

### Task 13: The Tables filter — "tables with another woman going"

**Files:**
- Modify: `src/components/TablesTab.jsx`
- Test: `src/domain/__tests__/genders.test.mjs` (already covers `tableIncludesGender` in isolation from Task 6 — this task is component-level and verified manually + by the full suite staying green, matching how `menuFilter` itself has no dedicated component test in this codebase)

**Interfaces:**
- Consumes: `tableIncludesGender` (Task 6), `signupsFor` (existing per-table signup map, `TablesTab.jsx:40-44`).

This is deliberately the single fixed preference the reviewer's note asked for — "show me tables where I won't be the only woman" — not a general gender-picker. A picker nobody asked for would be scope beyond this feedback item; if a future review asks for the general case, `tableIncludesGender` already takes any `wanted` value, so widening this to a picker is a UI-only change, not a data-model one.

- [ ] **Step 1: Add the import**

In `src/components/TablesTab.jsx`, add to the imports:

```js
import { tableIncludesGender } from '../domain/catalog/genders.js';
```

- [ ] **Step 2: Add the filter state**

After `const [menuFilter, setMenuFilter] = useState(null);` (line 28), add:

```js
  // A personal view preference, not a rule the app enforces on who may sit
  // where — like menuFilter, it changes what this one screen shows and
  // nothing else. See HANDOFF.md §4: praised by a reviewer for existing
  // before it did.
  const [womenFilter, setWomenFilter] = useState(false);
```

- [ ] **Step 3: Apply it to the shown list**

The existing `shown` memo (lines 54–57):

```js
  const shown = useMemo(
    () => (menuFilter ? open.filter(t => t.menuId === menuFilter) : open),
    [open, menuFilter],
  );
```

needs `signupsFor`, which is defined above it (lines 40–44) but the memo does not yet depend on it. Change to:

```js
  const shown = useMemo(() => {
    let list = menuFilter ? open.filter(t => t.menuId === menuFilter) : open;
    if (womenFilter) {
      list = list.filter(t => tableIncludesGender(t, signupsFor[t.id] ?? [], 'Woman'));
    }
    return list;
  }, [open, menuFilter, womenFilter, signupsFor]);
```

- [ ] **Step 4: Add the toggle to the UI**

After the existing `menu-chips` block (lines 90–111, ending `)}`), add a second, single-item toggle group:

```jsx
      <div className="menu-chips" role="group" aria-label="Gender preference">
        <button
          className={`menu-chip${womenFilter ? ' is-on' : ''}`}
          aria-pressed={womenFilter}
          onClick={() => setWomenFilter(w => !w)}
        >
          여성 동석 · Tables with another woman going
        </button>
      </div>
```

- [ ] **Step 5: Handle the empty-result case honestly**

The existing empty-state block (lines 115–128) already covers `shown.length === 0` generically ("No table for this one yet"). Confirm manually that turning the filter on with no matching tables falls into this same block rather than a blank screen — no code change should be needed since `shown` already drives that condition, but verify it in Step 6.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`. With no gender declared anywhere, turn the filter on — confirm the list goes to the existing empty state (not a crash, not a blank white screen). Set a gender of `Woman` on a host's profile, open a table as that host, turn the filter on from a different profile — confirm that table appears; turn menu filter + gender filter on together and confirm both narrow the list (AND, not OR). Verify at 375×812.

- [ ] **Step 7: Run full suite**

Run: `npm test && npm run lint`
Expected: 209 passing, 0 lint errors — no new automated tests in this task (component-level, matches how `menuFilter` itself is only manually + integration verified), but every prior task's tests must still be green.

- [ ] **Step 8: Commit**

```bash
git add src/components/TablesTab.jsx
git commit -m "feat: add the tables-with-another-woman filter"
```

---

### Task 14: Update HANDOFF.md's "아직 없는 것" table

**Files:**
- Modify: `HANDOFF.md:162-174`

**Interfaces:** None — documentation only, closing the loop this plan opened.

- [ ] **Step 1: Move the gender-filter row**

In `HANDOFF.md`, the `### 확인이 필요한 항목 하나` section (lines 175–183) currently reads:

```markdown
### 확인이 필요한 항목 하나

외국인 리뷰에 **"성별 선호 필터 긍정적으로 봄(안전 보장)"**이 있습니다.
그런데 **이 저장소에는 그런 필터가 없고, git 이력에도 없습니다.**
`gender`가 나오는 곳은 `safety.js`의 산문 한 줄뿐입니다.

리뷰어가 다른 팀 프로토타입과 섞어서 봤거나, 우리가 못 만든 것입니다.
어느 쪽인지 확인하세요 — **안전 기능을 있다고 칭찬받는 상태가 제일
위험합니다.**
```

Replace with:

```markdown
### 확인이 필요한 항목 하나 — 해결됨

외국인 리뷰의 **"성별 선호 필터 긍정적으로 봄(안전 보장)"**은 이 저장소에
없는 기능이었습니다 (git 이력에도 없었음). 리뷰어가 다른 팀 프로토타입과
섞어서 봤는지는 끝내 확인하지 못했지만, 어느 쪽이든 답은 같다고 판단해
**만들었습니다** — 자기 신고 방식(`gender`, `nationality`와 동일하게 검증
안 됨), Tables 탭의 "여성 동석" 필터로 (`docs/superpowers/plans/2026-08-02-feedback-response-batch1.md` Group D).
```

- [ ] **Step 2: Commit**

```bash
git add HANDOFF.md
git commit -m "docs: record that the gender filter went from missing to shipped"
```

---

## Self-Review

**Spec coverage** — every row this plan claims to close, checked against HANDOFF.md §4/§5 and the four source feedback documents:

| Source ask | Task |
| --- | --- |
| 교수님 종합의견 — "어떻게, 무엇이 아니라" | Tasks 1–3 |
| ① README가 다른 앱 이야기 | Task 4 |
| ② 죽은 K-Food Map 파일 | Task 5 |
| 외국인 8/1 — "성별 선호 필터" | Tasks 6–14 |

Not in scope for this batch (explicitly, per the user's chosen starting range): ③ dark mode, ④ profile PII (email/phone/photo/free-text allergy), ⑤ more quiz questions, ⑥ blocking/reporting/reputation/no-show/admin-approval. These remain exactly as prioritized in `HANDOFF.md` §5 and are unstarted by this plan.

**Placeholder scan** — every step above contains real, complete code or an exact command; no `TODO`, no "add appropriate handling," no "similar to Task N" without the actual code repeated in full.

**Type/name consistency** — checked across tasks: `hostGender` (camelCase, app-side) / `host_gender` (snake_case, DB-side) used identically in Tasks 9–12; `gender` (not `hostGender`) on signups throughout; `tableIncludesGender(table, signups, wanted)` signature matches its Task 6 definition everywhere it's called in Task 13; `cleanGender` imported from `genders.js` consistently in Tasks 9–10.

---

Plan complete and saved to `docs/superpowers/plans/2026-08-02-feedback-response-batch1.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
