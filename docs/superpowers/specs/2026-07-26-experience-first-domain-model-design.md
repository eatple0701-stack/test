# Experience-First Domain Model & IA Redesign

**Date:** 2026-07-26
**Status:** Approved — ready for implementation planning
**Scope:** Domain model and information architecture. No UI or implementation detail.

---

## 1. Problem

The app is structurally a map application. `.map-region` is not a tab — on mobile it is
`position: absolute; inset: 0`, the full-screen substrate of the entire shell, with every
other tab floating on top of it. "Map-first" is not a metaphor for the current design; it is
literally the shell.

That produces the wrong content hierarchy:

```
Restaurant → Detail → Culture → Journey
```

Culture is an attribute of a restaurant. The business plan requires the inverse: a platform
for experiencing Korean culture *through* food, where a restaurant is one means to a cultural
end, not the end itself.

```
Journey → Collection → Theme → Narrative → Experience → Place
```

## 2. Modeling principles

**P1 — Content-volume independence.** Entities and relationships must hold at any catalogue
size. The current 18 active restaurants are a fixture that *validates* the model, never an
input that *shapes* it. Where content is missing, the model expresses that as status, it does
not shrink to fit.

**P2 — Editorial content is separated from factual claims.**

| | Nature | Verification |
|---|---|---|
| Collection / Theme / Narrative / Experience prose | **Editorial** — authored | Attributed to author. No confidence badge. |
| Hours, coordinates, address, certification, dietary | **Claims about the world** | Existing `Fact<T>` confidence model |

Without this boundary, confidence badges leak onto authored prose as the catalogue grows and
the verification system loses all meaning. A Theme's narrative is not "a fact that might be
wrong" — it is text we wrote.

**P3 — Completion is always the user's own record.** Never inferred by the system.

**P4 — Derived values are never stored.** Adding one Experience to a Theme would instantly
falsify any persisted progress figure. On a platform where content grows continuously this is
non-negotiable.

## 3. Layer responsibilities

| Layer | Responsibility | Test |
|---|---|---|
| **Value Object** | Defined solely by its values. No identity, immutable, replaceable. | Same attributes ⇒ same thing? |
| **Entity** | Identity persisting through change. Owns invariants **about itself only**. | Can two differ while all attributes match? |
| **Capability** | A contract enabling uniform treatment of heterogeneous entities. A trait, not inheritance. | Does a new entity implementing it join existing behaviour without changes elsewhere? |
| **Projection** | Read-only derived view assembled across entities. Owns no state. | Would storing it become false when content is added? |
| **Policy** | Business rule spanning entities. Replaceable without touching entities. | Does changing the rule force an entity change? Must be *no*. |

**Dependency direction is one-way:**

```
Policy → Projection → Capability → Entity → Value Object
```

Entities never reference policies. A rule living inside an entity means the content model
shifts every time the rule changes.

## 4. Entities

| Entity | Owns | Does not own |
|---|---|---|
| **Collection** | An editorial lens over Themes; its angle and active window | Progression, ordering of Experiences |
| **Theme** | A cultural narrative; its Experience membership; its Narratives | Sequence, places, completion rules |
| **Narrative** | Intro, outro, ordered steps, pacing | Experience content, completion verdicts |
| **Experience** | One cultural encounter. **The atom of progression** | Its own order, its parent Theme, any specific place |
| **Place** *(abstract)* | Location. → **Restaurant** (holds verification assets), **Market** | Cultural meaning |
| **Event** *(abstract)* | A time-bound occurrence referencing a Place. → **Festival**, **Gathering** | — |
| **Traveler** | Another user | Theme affinity (derived) |
| **Journey** *(aggregate root)* | One traveler's complete record | Progress figures (derived) |
| **CompletionRecord** | (experience, source, evidence, occurredAt); identity local to Journey | — |

Experience is the **only completable entity**. Narrative, Theme and Collection completion all
derive from Experience completion.

Journey references content; **content never references Journey**. This one-way dependency is
why adding a Theme cannot break an existing Journey.

### Join entities

| Join | Fields | Purpose |
|---|---|---|
| `CollectionTheme` | `order`, `editorialAngle` | Membership + per-collection framing |
| `ThemeExperience` | — | Membership only (the cultural territory) |
| `NarrativeStep` | `order`, `required`, `transition` | The path through that territory |

`editorialAngle` is what separates curation from foldering: the same Theme is framed
differently per Collection (*Temple Life* is about foliage inside *Autumn in Seoul*, about
pace inside *Slow Travel*).

`transition` is what separates a narrative from a list: the connective prose between steps.

## 5. Value Objects

`Coordinates` · **`Fact<T>`** {value, confidence, source, method, evidence, lastCheckedAt} ·
`Confidence` · `Source` · `Method` · `DietaryProfile` · `OpeningHours` · `TransitAccess` ·
`Status` · `Lifecycle` · `Pacing` · `ActiveWindow` · `Transition` · `Phrase` {ko, romanized, en} ·
`Tip` {tag, detail} · `Mission` {title, detail} · `EvidenceRef` · `ThemeAffinity` ·
`PlayabilityVerdict` · `Blocker` · `Marker` · `ProgressRatio`

`Fact<T>` is the existing `fact()` primitive. Its classification as a Value Object confined to
the Place tier is the type-level expression of principle **P2**.

## 6. Capabilities

```
Mappable    → yields Coordinates          (Place directly; Experience/Narrative/Theme/Collection transitively)
Verifiable  → exposes Fact-wrapped claims (Place tier only)
Completable → can satisfy an Experience   (place visit, event attendance, mission, self-attestation)
Social      → can host presence           (any identified entity)
Playable    → judges its own runnability  (Narrative directly; Theme/Collection transitively)
```

Capabilities exist for **open extension**: a future `Workshop` implementing
`Mappable`/`Completable`/`Social` joins maps, completion and community automatically, with no
change to any Policy or Projection.

Confining `Verifiable` to the Place tier enforces principle **P2** at the type level.

### Playable and the dependency direction

Judging "are enough places available" requires knowing which places are admissible — that is
`VisibilityPolicy`'s job. A Capability referencing a Policy would invert the dependency rule.

**Resolution: required facts are injected downward via context.**

```
PlayabilityContext {
  at               : Date
  admissiblePlaces : Set<PlaceId>   ← supplied from above by VisibilityPolicy
  availableEvents  : Set<EventId>
  region?  dietary?
}

Playable.assess(context) → PlayabilityVerdict { playable, degraded, blockers[] }

Blocker = MissingVenue(stepId) | OutOfSeason(window)
        | NoEventOccurrence(eventId) | RegionUnavailable(region)
```

A Narrative never looks upward; it judges itself against facts handed to it. Transitively:
Theme is playable if any Narrative is; Collection is playable if any Theme is.

## 7. Projections

Read-only, stateless, always recomputed.

| Projection | Input → Output |
|---|---|
| `CollectionFeed` | Curated collections for a surface |
| `MapView(scope)` | Any scope → `Marker[]`, each carrying ancestor context |
| `CommunityView(scope)` | Any entity → people, gatherings, conversations |
| `JourneyProgress` | Journey + catalogue → per-Theme and overall progress |
| `NarrativePath` | Narrative + Journey → done / current / remaining steps |
| `PassportRecord` | Journey → chronological record |
| `TravelSummary` | Journey → shareable aggregate |

## 8. Policies

| Policy | Decides | Operates on |
|---|---|---|
| **Curation** | Which Collections surface, in what order | Collection |
| **Recommendation** | This traveler's next step | Experience · Narrative · Theme |
| **Completion** | Whether something is complete | Experience → Narrative → Theme |
| **Visibility** | Whether an entity may surface in a context | All |
| **Navigation** | What transitions are legal and what ancestry accompanies them | All |

**Curation vs Recommendation.** Curation is the editorial axis ("what should this app show
now") driven by season, active window, status, playability, region — and need not be
personalised. Recommendation is the personal axis driven by journey state and proximity.
Explore being a Collection Feed means **the first screen is editorially driven, not
personalised**, so it is fully coherent for a brand-new user with no record.

**Completion.**

```
CompletionSource {
  id · label
  appliesTo(experience)            → bool
  isSatisfied(experience, journey) → bool
  evidenceOf(experience, journey)  → EvidenceRef
}

experienceDone(e, j) = registry.filter(s => s.appliesTo(e)).some(s => s.isSatisfied(e, j))
narrativeDone(n, j)  = n.steps.filter(required).every(s => experienceDone(s.experience, j))
themeDone(t, j)      = t.narratives.some(n => narrativeDone(n, j))
themeExplored(t, j)  = t.experiences.some(e => experienceDone(e, j))
```

Initial registry: `place-visit` · `event-attendance` · `mission-check` · `self-attest`.
Future: `workshop-attend` · `class-complete` · `photo-proof`. Adding a completion method is
one registry entry — no entity or projection changes.

**Navigation.** Restaurant is never an entry point; every path to a Restaurant carries an
Experience ancestor. Every `Marker` carries ancestor context so "back" ascends rather than
dead-ends.

**Visibility.** `quarantine` remains excluded from both discovery and direct navigation
(existing rule, preserved). `planned` appears only in roadmap contexts. `preview` surfaces
everywhere but declares its venue absence.

Policies compose (`Curation → Visibility, Playable`; `Recommendation → Visibility, Playable,
Completion`). Policies may reference policies; **entities reference none**.

## 9. Entity relationships

```
   ┌────────────┐ N        N ┌─────────┐ 1      N ┌───────────┐
   │ Collection ├────────────┤  Theme  ├──────────┤ Narrative │
   └────────────┘            └────┬────┘ composes └─────┬─────┘
      via CollectionTheme          │ N                  │ 1
      {order, editorialAngle}      │                    │
                            ┌──────┴──────────┐         │ N
                            │ ThemeExperience │   ┌─────┴─────────┐
                            │   (membership)  │   │ NarrativeStep │
                            └──────┬──────────┘   │ order,required│
                                   │ N            │  transition   │
                            ┌──────┴───────┐      └─────┬─────────┘
                            │  Experience  ├────────────┘ N
                            └──┬────┬────┬─┘
                             N │  N │    │ N
               ┌───────────────┘    │    └─────────────┐
         ┌─────┴─────┐        ┌─────┴────┐  ┌──────────┴───────┐
         │   Place   │        │  Event   │  │ CompletionSource │
         │ Restaurant│        │ Festival │  │   «registry»     │
         │  Market   │        │ Gathering│  └──────────────────┘
         └───────────┘        └──────────┘

  ═══════ user side · one-way dependency toward content ═══════

        ┌─────────┐ 1   N ┌──────────────────┐
        │ Journey ├───────┤ CompletionRecord ├──→ Experience
        └────┬────┘       └──────────────────┘
           N │ └──→ SavedItem ──→ Place | Experience
             └───→ Companion ──→ Traveler
```

**Cardinality rationale.** `Collection↔Theme`, `Theme↔Experience` and `Experience↔Place` are
all N:M. Forcing 1:N would make authors duplicate content across parents, and at hundreds of
themes that becomes an unsolvable synchronisation problem. The only tree is
`Theme → Narrative → Step`; everything below is a graph.

**Model depth ≠ navigation depth.** Collection and Narrative are editorial lenses.
`NavigationPolicy` governs entry, and recommendation, search and journey-resumption enter at
intermediate levels directly. Hierarchy is a content-organisation concern, not a forced path.

To be precise about the two rules, which are easily read as contradictory: **Collection,
Theme, Narrative and Experience may all be entered directly** from search, recommendation or a
resumed journey. **Restaurant may not** — it is the single exception, and any route reaching it
must carry an Experience ancestor. The rule constrains one entity, not the hierarchy at large.

## 10. Status lifecycle

```
Collection.status  planned → preview → published   (+ retired)
Theme.status       planned → preview → published   (+ retired)
Narrative.status   planned → preview → published   (+ retired)
Experience.status  planned → preview → published   (+ retired)
Place.lifecycle    active | quarantine | archived | deleted    ← existing, reused
```

`Narrative.status` is editorial readiness and is distinct from playability: a `published`
narrative may still be unplayable today (out of season, venue quarantined), and a `preview`
narrative may be perfectly runnable. `VisibilityPolicy` reads status; `Playable` reads world
conditions. Both must be satisfied for a narrative to be offered.

`preview` means *cultural content complete, verified venues not yet secured* — Busan, Royal
Cuisine and Traditional Tea sit here. It is an expression of roadmap, not a deficiency.
Status is set by authors; the system never auto-demotes on sparse data, because that would let
the data dictate the IA.

## 11. Extension point: CultureContext (not implemented)

`Narrative` is designed to accept a `CultureContext` later, so the same narrative can be
expressed differently by language, nationality, cultural background or travel style.

Reserved as an extension point only. Nothing is built for it now. The constraint it places on
the current design: **Narrative prose fields must remain addressable as a unit** (intro,
outro, per-step transition) so a context-specific variant can be substituted wholesale rather
than requiring the entity to be re-shaped.

## 12. IA consequences

### Navigation

```
Explore   Journey   Community   Passport   Profile
```

Map is removed from navigation and becomes a summonable overlay — content is the substrate,
the map is a tool opened and closed. It is a **general-purpose viewer** over anything
`Mappable` (Theme, Experience, Place, Event, Route, Community), not a restaurant map.

| Current tab | → | New tab |
|---|---|---|
| `home` | → | **Explore** (Collection Feed) |
| `explore` (map + list) | → | *dissolved into Map overlay* |
| `match` | → | **Community** (Theme-oriented entry) |
| `journal` | → | **Journey** (forward) + **Passport** (backward) |
| `profile` | → | **Profile** |

The current tab id `explore` denotes the *map* tab and collides with the new Explore; ids are
redefined and the old one retired.

### Screen roles

| Screen | Role | Time axis |
|---|---|---|
| Explore | Collection Feed — editorially driven | present |
| Collection / Theme / Narrative | Curation → territory → path | — |
| Experience | The central content screen | — |
| Restaurant | Second-class. Verified facts only. Reachable only via an Experience ancestor | — |
| Journey | Active theme, today's challenge, next step | **forward** |
| Community | Themes people are exploring; meetups; find travel mates | present |
| Passport | Record, badges, people met, timeline, share | **backward** |
| Map overlay | Tool, summoned from any surface | — |

### Component reuse

| Existing | New role |
|---|---|
| `HomeTab` | Explore (Collection Feed) |
| `CULTURAL_THEMES` (journey.js) | Seed for the Theme catalogue |
| `CulturalRoute` | Narrative step rail |
| `PlaceCard` | Collection / Theme / Experience card variants |
| `RestaurantDetail` | Demoted — cultural sections migrate to Experience; verified facts remain |
| `JournalPanel` | Passport (backward); Journey portion split out |
| `JourneyCard` | Journey header + Explore continue strip |
| `ChallengeRow` | Unchanged; measures move to the Theme axis |
| `MatchTab` + Chat/Planner/ProfileDetail | Retained beneath Community |
| `TravelSummary` | Recomputed on Theme axis |
| `MapComponent` + `BottomSheetList` + `FilterBar` | Move inside the Map overlay |
| `culture.js` | Content source Experiences inherit by category |
| `experiences.js` | Experience ingredients (markets, festivals, seasonal) |

**No feature is removed.** The map tab becomes an overlay, the old Explore is absorbed by it,
and Journal splits into Journey and Passport.

## 13. Implementation order

The transition follows the **strangler fig pattern**: the new domain model is grown alongside
the existing implementation and takes over incrementally. The old implementation is never
edited in the same step that introduces its replacement, and the app works at every step.

```
0. Domain layer      additive only — new model coexists with existing code
   0A Catalogs       Collection / Theme / Narrative / Experience records
   0B Policy stubs   Completion · Visibility · Navigation · Curation · Recommendation
   0C Projections    JourneyProgress · NarrativePath · CollectionFeed · MapView · …
   0D Legacy bridge  adapt existing restaurants/markets/companions state into the new model

1. Map de-shelling   remove map-region from the shell → Map overlay   ← riskiest, done alone
2. Navigation        five tabs; Journal split
3. Explore           Collection Feed
4. Detail screens    Collection / Theme / Narrative / Experience
5. Restaurant demote migrate cultural sections; attach ancestor context
6. Community         Theme-oriented reorganisation
```

**Phase 0 constraints (binding):**

- **Nothing existing is modified.** No edits to `computeJourney`, `journey.js`, components or
  existing data files. Phase 0 only adds files.
- `computeJourney` remains the live progress engine throughout Phase 0. The new projections
  run beside it, not instead of it.
- The **legacy bridge (0D)** is the seam: it reads the existing persisted state
  (`kfm-bookmarks`, `kfm-markets`, `kfm-companions`) and presents it to the new model as a
  `Journey`. Nothing about the existing storage shape changes.
- Removal of `computeJourney` happens **after Phase 2**, once the new projections drive real
  screens. Until then both engines coexist, and any disagreement between them is a defect in
  the new model to be fixed before cutover.

Map de-shelling is isolated in its own step because it rewrites the shell; mixed with other
changes, a regression would be untraceable.

**This spec is larger than one implementation plan.** Steps 0–6 span a domain layer, a shell
rewrite, a navigation change and four detail screens. Each step gets its own plan and its own
implementation cycle; step 0 is planned first. Attempting the whole sequence as a single plan
would produce a plan too coarse to execute against.

## 14. Non-goals

- **Collection has no completion semantics.** Progression stays on a single axis (Theme). Two
  progress axes that can disagree would destroy trust in Journey. Collection progress is
  derivable from Theme progress if ever needed.
- **Cross-theme itineraries.** A Narrative belongs to exactly one Theme. A journey spanning
  themes is a different concept and is not being built.
- **CultureContext.** Extension point only.
- **`kind` on Experience** (dish / place / ritual / setting) is a rendering hint only. Users
  see one uniform concept: an Experience.
