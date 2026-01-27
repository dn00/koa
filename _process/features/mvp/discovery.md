# Discovery: Daily Puzzle MVP (Vertical Slice)

**Date:** 2026-01-26
**Status:** draft
**Author:** Discovery Agent
**Canonical Reference:** docs/D24-VERTICAL-SLICE-DOD-MVP.md

---

## Overview

### Problem Statement

We need to prove that the Home Smart Home daily puzzle loop is **fun, understandable, and fair**. The adversarial testimony design (D31) exists only in documentation — we must build it and validate that:

1. The puzzle feels engaging (not solvable at a glance, but not frustrating)
2. KOA as an active adversary creates meaningful decisions
3. The deterministic resolver produces fair, debuggable outcomes
4. Players understand why they won or lost

### Proposed Solution

Build a **Daily Puzzle mode** as a PWA:
- Single puzzle per day, same for all players
- 6 dealt evidence cards (no draft)
- SUBMIT action only (select 1-3 cards, resolve)
- KOA plays counter-evidence that contests your claims
- Win by reducing Resistance to 0 AND addressing all Concerns

### Success Criteria

1. A new player can complete a Daily puzzle in 4-7 minutes
2. 5/5 internal playtesters can explain core mechanics after one game
3. Retry rate after loss > 50%
4. Deterministic replay matches across devices
5. Game works offline after initial cache

---

## Requirements

### Must Have (P0)

**R1: Daily Puzzle Mode**
- Rationale: Core gameplay loop, proves the concept
- Verification: Play a seeded puzzle, verify same seed = same puzzle

**R2: Dealt Hand (6 cards)**
- Rationale: No draft simplifies Daily mode, puts puzzle in the play not selection
- Verification: All players see identical 6 cards for same daily

**R3: SUBMIT Action**
- Rationale: Single action type for MVP keeps complexity low
- Verification: Player can select 1-3 cards and submit

**R4: Concerns System (2-4 per puzzle)**
- Rationale: Proof requirements create puzzle structure
- Verification: Win requires all concerns addressed

**R5: Counter-Evidence System**
- Rationale: KOA as active adversary is core innovation
- Verification: KOA plays counter, applies 50% contested penalty

**R6: Refutation Cards**
- Rationale: Strategic counterplay to KOA's challenges
- Verification: Refutation nullifies counter, restores damage

**R7: Contradiction Detection**
- Rationale: Story coherence is core theme
- Verification: MINOR = +1 scrutiny, MAJOR = blocked

**R8: Corroboration Bonus**
- Rationale: Rewards story consistency
- Verification: 2+ cards sharing claim = +25% damage

**R9: Scrutiny System (0-5)**
- Rationale: Soft failure mode before hard loss
- Verification: Scrutiny 5 = instant loss

**R10: Pack Loading**
- Rationale: Content servicing without code deploys
- Verification: Load puzzle pack from CDN/cache

### Should Have (P1)

**R11: KOA Voice/Barks**
- Pre-generated lines keyed by OutcomeKey
- 8 mood states (NEUTRAL → SMUG)

**R12: Offline Support**
- Service Worker caching
- Resume after app restart

**R13: Share Card**
- Wordle-style result sharing

**R14: Basic Telemetry**
- RUN_STARTED, TURN_SUMMARY, RUN_ENDED

### Won't Have (this scope)

- **Freeplay mode** (multi-puzzle runs) — post-MVP
- **Draft phase** — removed from Daily
- **Extended moves** (FLAG, REWIRE, CORROBORATE, EXPLOIT) — Freeplay only
- **Ops Tokens** — Freeplay only
- **Multiplayer/social** — post-MVP
- **Runtime LLM** — forbidden for adjudication
- **Enhanced KOA** — optional post-MVP cosmetic

---

## Technical Analysis

### Existing Code

**Python Kernel Reference:** `docs/source-files/kernel/`

The Python kernel provides architectural patterns for the TypeScript engine-core:

| Python File | Pattern to Adopt | D31 Adaptation |
|-------------|------------------|----------------|
| `types.py` | NewType IDs, frozen dataclasses, enums | New types: EvidenceCard, Concern, Counter |
| `state.py` | GameState with `snapshot_hash()` | RunState with puzzle, committed_story, scrutiny |
| `tick.py` | `(state, actions) → (new_state, events)` | `resolve(state, submission) → MoveResolved` |
| `events.py` | Event types, EventLog, prev_event_hash chain | D31 events: COUNTER_PLAYED, CONTRADICTION_DETECTED |
| `hash.py` | `canonical_json()`, `compute_hash()` | Same pattern for determinism |
| `rng.py` | Seeded RNG | Same pattern for reproducibility |

**Key patterns to preserve:**
- Event-sourced state (events are source of truth)
- Immutable state snapshots
- Canonical JSON for deterministic hashing
- Hash chain for integrity verification
- Pure resolver function (no side effects)

### New Components Needed

#### Package: engine-core (Pure TypeScript)

| Component | Purpose | Key Files |
|-----------|---------|-----------|
| Types | Domain models | `types/*.ts` |
| Resolver | Damage calculation, contradiction detection | `resolver/*.ts` |
| Validation | Pack validation, state validation | `validation/*.ts` |

**Types to define:**
- `EvidenceCard` - power, proves, claims
- `CounterEvidence` - targets, refutableBy
- `RefutationCard` - extends EvidenceCard, refutes
- `Concern` - requiredProof, stateRequirement
- `Puzzle` - resistance, concerns, counters, dealtHand
- `RunState` - current game state
- `GameEvent` - event types (discriminated union)

**Resolver functions:**
- `calculateDamage(cards, counter)` - power + contested + corroboration
- `detectContradiction(card1, card2)` - NONE | MINOR | MAJOR
- `checkConcernsFulfilled(concerns, cards)` - which concerns addressed
- `applyRefutation(refutation, counter)` - nullify and restore damage
- `deriveState(events)` - replay events to current state

#### Package: app (React PWA)

| Component | Purpose | Key Files |
|-----------|---------|-----------|
| Screens | Page components | `screens/*.tsx` |
| Components | UI elements | `components/*.tsx` |
| Stores | Zustand state | `stores/*.ts` |
| Services | Side effects | `services/*.ts` |

**Screens:**
- `HomeScreen` - Play Daily / Practice / Settings
- `RunScreen` - Main gameplay (HUD, hand, submit)
- `ResultsScreen` - Win/Loss + recap + share

**Components:**
- `HUD` - Resistance bar, Scrutiny, Concerns, Turn counter
- `EvidenceCard` - Card display + selection
- `KOAAvatar` - Mood-based display
- `ConcernChip` - Proof requirement status
- `CounterPanel` - KOA's counter-evidence
- `SubmitButton` - Action button with preview
- `WhyPanel` - Expandable explanation

**Stores:**
- `useGameStore` - Events, derived state, actions
- `useSettingsStore` - Counter visibility, stats mode, telemetry

**Services:**
- `PackLoader` - Fetch, validate, cache packs
- `Persistence` - IndexedDB operations
- `DailyService` - Daily puzzle fetching

### Dependencies

**External:**
- React 18+
- Vite
- Zustand
- Dexie (IndexedDB)
- Vitest

**Internal:**
- app depends on engine-core
- engine-core has zero dependencies (pure TS)

---

## Constraints

### Technical Constraints

| Constraint | Rationale | Impact |
|------------|-----------|--------|
| No floating-point math in resolver | Determinism across platforms | Use integers, ceil/floor |
| No `Math.random()` in resolver | Reproducibility | Use seeded RNG |
| Resolution < 120ms | Instant feel | Optimize hot paths |
| Offline-first | PWA requirement | Service Worker, IndexedDB |
| No runtime LLM | Determinism, cost | Pre-generated barks only |

### Business Constraints

| Constraint | Rationale |
|------------|-----------|
| Same puzzle for all players | Fair daily competition |
| No pay-to-win | Product integrity |
| Mobile-first | Primary platform |

### Content Constraints

| Constraint | Value |
|------------|-------|
| Evidence cards | 30+ minimum, 41 target |
| Puzzle templates | 7 minimum, 12 target |
| Voice coverage | All OutcomeKeys have barks |
| Testimony combinations | All 41 pre-generated |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Puzzle design too easy/hard | Medium | High | Playtesting, difficulty tuning |
| Contradiction rules confusing | Medium | Medium | Clear UI, good examples |
| Performance on low-end mobile | Low | Medium | Performance budgets, testing |
| Pack validation too slow | Low | Low | Optimize, lazy validation |
| Offline sync issues | Medium | Medium | Event-sourced design, robust resume |

---

## Open Questions

- [x] Monorepo structure? — **Yes**, engine-core + app
- [x] Testing framework? — **Vitest**
- [x] State management? — **Zustand** (event-sourced)
- [ ] Package manager? — npm, pnpm, or bun? (TBD)
- [ ] Initial puzzle content — Who creates the 7 templates?
- [ ] KOA voice content — Who writes the barks?

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Project scaffolding, core types, basic resolver

- Monorepo setup (Vite + TypeScript + Vitest)
- Domain types in engine-core
- Basic resolver functions (damage, no modifiers)
- First unit tests

**Exit:** Types compile, basic damage calculation works

### Phase 2: Game Engine (Week 2)

**Goal:** Complete resolver with all D31 mechanics

- Contradiction detection (time gaps, location, state)
- Corroboration bonus
- Counter-evidence and contested penalty
- Refutation and damage restoration
- Concern fulfillment tracking
- Event system and state derivation

**Exit:** All resolver tests pass, golden fixtures work

### Phase 3: Content System (Week 3)

**Goal:** Pack loading, validation, persistence

- Pack schemas (Zod or similar)
- Pack validation pipeline
- IndexedDB persistence (Dexie)
- Pack caching

**Exit:** Load a pack, validate it, store/retrieve runs

### Phase 4: UI Layer (Week 4)

**Goal:** Playable game on screen

- Run screen with HUD
- Evidence card carousel
- Submit button with preview
- Basic result screen
- Home screen

**Exit:** Can play a hardcoded puzzle end-to-end

### Phase 5: Integration (Week 5)

**Goal:** Daily flow, offline, polish

- Daily puzzle fetching
- Service Worker + offline support
- KOA avatar and mood states
- Voice bark integration
- Resume support

**Exit:** Full daily flow works online and offline

### Phase 6: Content & Polish (Week 6)

**Goal:** Ship-ready content and UX

- 7+ puzzle templates
- Voice pack with barks
- Tutorial flow
- Share card
- Telemetry (minimal)

**Exit:** MVP complete, ready for playtesting

---

## References

### Core Design
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` — MVP definition
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` — Core mechanics (canonical)
- `docs/D31-INVARIANTS.md` — Non-negotiable rules

### Technical Specs
- `docs/D03-DETERMINISTIC-RESOLVER-SPEC.md` — Resolver details
- `docs/D04A-GAME-STATE-EVENT-MODEL.md` — Event types
- `docs/D09-PACK-SCHEMAS.md` — Pack JSON schemas
- `docs/D17-CLIENT-ARCHITECTURE.md` — PWA architecture
- `docs/D19-DATA-MODELS-STORAGE.md` — Persistence

### UX Specs
- `docs/D06-CORE-GAME-LOOP-UX.md` — UX flow
- `docs/D14-UX-WIREFRAME-SPEC.md` — Screen wireframes
- `docs/D12-KOA-VOICE-SYSTEM.md` — Voice/bark system

### Quality
- `docs/D10-PACK-VALIDATION.md` — Validation requirements
- `docs/D21-TEST-PLAN-FIXTURES.md` — Testing requirements

---

## Next Steps

1. [ ] Get discovery approved
2. [ ] Hand off to Planner for task breakdown
3. [ ] Planner creates tasks per implementation phase
4. [ ] Begin Phase 1: Foundation

---

## Handoff

When approved:

```
Discovery complete for MVP (Daily Puzzle).

Ready for Planner phase.
Start a new session and paste:
_process/prompts/PLANNER.md

Then: "Plan the MVP feature"

Discovery file: _process/features/mvp/discovery.md
```
