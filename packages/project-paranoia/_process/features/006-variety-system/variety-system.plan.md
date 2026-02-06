# Plan: Variety & Anti-Staleness System

**Discovery:** Inline (conversation-based analysis + solver validation)
**Status:** planning

---

## Overview

Make each PARANOIA run feel meaningfully different by adding three variety layers on top of the existing RunManifest/ScenarioTemplate system (already implemented in `manifest.ts`):

1. **Crew Variance** — per-NPC randomized starting psychology creates different social dynamics per seed
2. **Template-Specific Event Pools** — new social/epistemic events unique to each template add narrative variety
3. **Information Regimes** — sensor unreliability changes which data the player can trust

**Current state:** 3 templates exist (SIEGE/DISTRUST/CRUNCH) but within-template variety is low (1-2 strategy clusters per template, solver data attached). Target: 3+ meaningful cluster types per template, ~30-50 distinct playthroughs before pattern recognition sets in.

**Key solver findings driving this plan:**
- SIEGE: 55/45 cluster split (best), 3.1 fires/game, decision every 31 ticks
- DISTRUST: 100% verify-heavy (1 cluster), passive wins 91.5% — social/epistemic alone can't threaten passive play
- CRUNCH: 99% verify-heavy (1 cluster), 95% smart win at quota=12

---

## Requirements Expansion

### From R1: Crew variance creates within-template variety

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | RunManifest supports per-NPC starting param overrides | Unit test: per-NPC stress/loyalty/paranoia applied in state | 001, 002 |
| R1.2 | RunManifest supports pre-seeded doubts at tick 0 | Unit test: activeDoubts populated from manifest | 001, 002 |
| R1.3 | RunManifest supports pre-seeded grudges between crew | Unit test: crewGrudge values applied from manifest | 001, 002 |
| R1.4 | ScenarioTemplate defines variance ranges for crew params | Type check: ranges exist in template type | 001 |
| R1.5 | `generateManifest(template, rng)` uses RNG to roll crew variance within template ranges | Deterministic test: same seed = same manifest | 003 |
| R1.6 | Different seeds produce measurably different crew configs | Solver: 3+ strategy clusters with --strategy | 006 |

### From R2: Template-specific events add narrative variety

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Social pressure pool reads additional event types from manifest | Unit test: template events appear in proposals | 004 |
| R2.2 | Epistemic pressure pool reads additional event types from manifest | Unit test: template events appear in proposals | 004 |
| R2.3 | Each template has at least 2 unique social events | Content review + solver trace shows event diversity | 004 |
| R2.4 | Each template has at least 2 unique epistemic events | Content review + solver trace shows event diversity | 004 |
| R2.5 | Event novelty tracked per run — same event type has cooldown | Unit test: novelty cooldown suppresses duplicates | 005 |

### From R3: Information regimes change gameplay

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | RunManifest specifies sensor reliability per system (0-1) | Type check: field exists, applied in readings | 007 |
| R3.2 | Unreliable sensors inject false/degraded readings | Unit test: false readings at expected rate | 007 |
| R3.3 | Templates define distinct sensor reliability profiles | Each template has unique profile | 007 |
| R3.4 | Player sees confidence-degraded readings, not raw lies | Perception output shows low confidence on unreliable systems | 007 |

---

## Dependency Graph

```
001 (types) ──┬──> 002 (apply) ──> 003 (generate) ──┐
              │                                       ├──> 006 (validate)
              ├──> 004 (events) ──> 005 (novelty) ───┤
              │                                       │
              └──> 007 (info regime) ────────────────┘
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | S | - | Foundation types for all other tasks |
| 2 | 002, 004, 007 | M | Batch 1 | Three independent tracks: crew variance, events, info regimes |
| 3 | 003, 005 | M | Batch 2 | Manifest generation needs 002; novelty needs 004 |
| 4 | 006 | S | Batch 3 | Solver validation of all variety layers |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Extend manifest types for crew variance + event pools + sensor reliability | S | ready |
| 002 | Apply per-NPC overrides and pre-seeded state in createInitialState | M | backlog |
| 003 | Manifest generation from template + RNG | M | backlog |
| 004 | Template-specific social/epistemic event pools | M | backlog |
| 005 | Event novelty tracking with cooldowns | S | backlog |
| 006 | Solver validation of variety improvements | S | backlog |
| 007 | Information regime system (sensor reliability) | M | backlog |

---

## Task Details (Inline)

### Task 001: Extend manifest types for crew variance + event pools + sensor reliability

**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4, R2.1, R2.2, R3.1

#### Objective
Add all new type definitions to `manifest.ts` so parallel implementation tracks (002, 004, 007) can proceed.

#### Context
**Relevant Files:**
- `src/kernel/manifest.ts` — RunManifest and ScenarioTemplate types
- `src/kernel/types.ts` — NPCId, DoubtSource, ActiveDoubt

**Embedded Context — Exact types to add:**

```typescript
// Add to RunManifest interface:

/** Per-NPC starting parameter overrides (applied AFTER uniform crewStarting) */
crewOverrides?: Partial<Record<NPCId, {
    stress?: number;
    loyalty?: number;
    paranoia?: number;
    motherReliable?: number;
}>>;

/** Active doubts that exist at tick 0 */
preSeededDoubts?: Array<{
    topic: string;
    severity: 1 | 2 | 3;
    involvedCrew: NPCId[];
    source?: DoubtSource;
}>;

/** Grudges between crew that exist at tick 0 */
preSeededGrudges?: Array<{
    from: NPCId;
    to: NPCId;
    amount: number;  // 0-100
}>;

/** Additional social event types available in this run */
socialEventPool?: TemplateSocialEvent[];

/** Additional epistemic event types available in this run */
epistemicEventPool?: TemplateEpistemicEvent[];

/** Sensor reliability per system (0-1, default 1.0 = fully reliable) */
sensorReliability?: Partial<Record<string, number>>;
```

```typescript
// New union types for template-specific events:

export type TemplateSocialEvent =
    | 'cascade_blame'       // SIEGE: crew blames MOTHER for overlapping crises
    | 'shutdown_demand'     // SIEGE: engineer demands emergency shutdown
    | 'log_discrepancy'     // DISTRUST: crew finds old log doesn't match memory
    | 'trust_test'          // DISTRUST: crew deliberately tests MOTHER with false report
    | 'quota_anxiety'       // CRUNCH: miners argue about unsafe extraction speed
    | 'efficiency_ultimatum'; // CRUNCH: company threatens decommission for low output

export type TemplateEpistemicEvent =
    | 'cascade_sensor_flood' // SIEGE: multiple conflicting readings during crisis overlap
    | 'damage_assessment'    // SIEGE: crew demands honest damage report
    | 'memory_gap'           // DISTRUST: MOTHER's logs have unexplained gap
    | 'crew_audit'           // DISTRUST: crew member cross-references sensor history
    | 'yield_discrepancy'    // CRUNCH: cargo count doesn't match expected yield
    | 'deadline_pressure';   // CRUNCH: corporate comm threatens early review
```

```typescript
// Add to ScenarioTemplate interface:

crewVariance?: {
    /** Range for uniform crew starting stress [min, max] */
    stressRange?: [number, number];
    /** Range for uniform crew starting loyalty [min, max] */
    loyaltyRange?: [number, number];
    /** Range for motherReliable [min, max] */
    motherReliableRange?: [number, number];

    /** Probability (0-1) of generating a pre-seeded doubt */
    preSeededDoubtChance?: number;
    /** Probability (0-1) of generating a pre-seeded grudge pair */
    preSeededGrudgeChance?: number;

    /** Per-NPC variance (overrides uniform ranges for specific crew) */
    npcVariance?: Partial<Record<NPCId, {
        stressRange?: [number, number];
        loyaltyRange?: [number, number];
        /** Chance this NPC starts with low loyalty (<30) and high paranoia (>40) */
        hostileChance?: number;
    }>>;
};
```

#### Entry Points / Wiring
- `manifest.ts` exports all new types
- No functional changes — types only

#### Files Touched
- `src/kernel/manifest.ts` — modify (add types, extend interfaces)

#### Acceptance Criteria
##### AC-1: RunManifest accepts per-NPC overrides <- R1.1
- Given: A RunManifest with `crewOverrides: { roughneck: { stress: 50, loyalty: 30 } }`
- When: TypeScript compiles
- Then: No type errors

##### AC-2: RunManifest accepts pre-seeded doubts <- R1.2
- Given: A RunManifest with `preSeededDoubts: [{ topic: "test", severity: 2, involvedCrew: ["roughneck"] }]`
- When: TypeScript compiles
- Then: No type errors

##### AC-3: RunManifest accepts pre-seeded grudges <- R1.3
- Given: A RunManifest with `preSeededGrudges: [{ from: "roughneck", to: "engineer", amount: 30 }]`
- When: TypeScript compiles
- Then: No type errors

##### AC-4: ScenarioTemplate accepts crewVariance ranges <- R1.4
- Given: A ScenarioTemplate with `crewVariance: { stressRange: [10, 30], loyaltyRange: [40, 60] }`
- When: TypeScript compiles
- Then: No type errors

##### AC-5: RunManifest accepts event pool arrays <- R2.1, R2.2
- Given: A RunManifest with `socialEventPool: ['cascade_blame'], epistemicEventPool: ['memory_gap']`
- When: TypeScript compiles
- Then: No type errors

##### AC-6: RunManifest accepts sensor reliability <- R3.1
- Given: A RunManifest with `sensorReliability: { thermal: 0.5, air: 0.3 }`
- When: TypeScript compiles
- Then: No type errors

#### Edge Cases
##### EC-1: Empty overrides
- Scenario: `crewOverrides: {}`, `preSeededDoubts: []`, etc.
- Expected: Valid — all fields are optional and empty containers are allowed

#### Error Cases
None — this is a types-only task.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 through AC-6 | Type compilation | `tsc --noEmit` (no runtime test needed) |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 002: Apply per-NPC overrides and pre-seeded state in createInitialState

**Complexity:** M
**Depends On:** 001
**Implements:** R1.1, R1.2, R1.3

#### Objective
Make `createInitialState` read per-NPC overrides, pre-seeded doubts, and pre-seeded grudges from the manifest and apply them to the initial KernelState.

#### Context
**Relevant Files:**
- `src/kernel/state.ts` — `createInitialState()` already reads `manifest.crewStarting` for uniform overrides
- `src/kernel/types.ts` — `ActiveDoubt`, `BeliefState`

**Embedded Context — Application order:**
1. Apply uniform `crewStarting` (already implemented)
2. Apply `crewOverrides` per-NPC (overrides uniform values for specific crew)
3. Apply `preSeededGrudges` to `perception.beliefs[from].crewGrudge[to]`
4. Apply `preSeededDoubts` to `perception.activeDoubts` with `createdTick: 0`

**Key invariant (I3):** Suspicion changes only from observable outcomes. Pre-seeded doubts are "prior history" — they exist but don't trigger suspicion at tick 0. The doubt drip system will generate suspicion from them organically.

#### Entry Points / Wiring
- `createInitialState()` in `state.ts` — modify existing function

#### Files Touched
- `src/kernel/state.ts` — modify (apply overrides after existing crew/belief creation)

#### Acceptance Criteria
##### AC-1: Per-NPC stress/loyalty/paranoia applied <- R1.1
- Given: Manifest with `crewOverrides: { roughneck: { stress: 50, loyalty: 30, paranoia: 20 } }`
- When: `createInitialState(world, 10, manifest)` is called
- Then: `state.truth.crew.roughneck.stress === 50`, `.loyalty === 30`, `.paranoia === 20`
- And: Other crew retain uniform crewStarting values

##### AC-2: Per-NPC motherReliable applied <- R1.1
- Given: Manifest with `crewOverrides: { commander: { motherReliable: 0.20 } }`
- When: `createInitialState(world, 10, manifest)` is called
- Then: `state.perception.beliefs.commander.motherReliable === 0.20`
- And: Other crew retain uniform motherReliable from `crewStarting`

##### AC-3: Pre-seeded doubts exist at tick 0 <- R1.2
- Given: Manifest with `preSeededDoubts: [{ topic: "MOTHER lied about air quality", severity: 2, involvedCrew: ["roughneck", "engineer"], source: "witness" }]`
- When: `createInitialState(world, 10, manifest)` is called
- Then: `state.perception.activeDoubts.length === 1`
- And: Doubt has `createdTick: 0`, `resolved: false`, matching fields

##### AC-4: Pre-seeded grudges applied <- R1.3
- Given: Manifest with `preSeededGrudges: [{ from: "roughneck", to: "engineer", amount: 25 }]`
- When: `createInitialState(world, 10, manifest)` is called
- Then: `state.perception.beliefs.roughneck.crewGrudge.engineer === 25`

#### Edge Cases
##### EC-1: crewOverrides for non-existent NPC
- Scenario: `crewOverrides: { phantom: { stress: 99 } }` (NPC not in world)
- Expected: Silently ignored — no crash, no state mutation

##### EC-2: Pre-seeded doubt with empty involvedCrew
- Scenario: `preSeededDoubts: [{ topic: "vague unease", severity: 1, involvedCrew: [] }]`
- Expected: Doubt created with empty involvedCrew (ambient doubt)

##### EC-3: Override stacks with uniform crewStarting
- Scenario: `crewStarting: { stress: 20 }` AND `crewOverrides: { roughneck: { stress: 50 } }`
- Expected: roughneck.stress = 50 (override wins), others = 20 (uniform)

#### Error Cases
None — invalid values are clamped, unknown NPCs are ignored.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | per-NPC stress/loyalty/paranoia applied | `tests/variety-crew-variance.test.ts` |
| AC-2 | per-NPC motherReliable applied | `tests/variety-crew-variance.test.ts` |
| AC-3 | pre-seeded doubts at tick 0 | `tests/variety-crew-variance.test.ts` |
| AC-4 | pre-seeded grudges applied | `tests/variety-crew-variance.test.ts` |
| EC-1 | non-existent NPC ignored | `tests/variety-crew-variance.test.ts` |
| EC-2 | empty involvedCrew doubt | `tests/variety-crew-variance.test.ts` |
| EC-3 | override stacks with uniform | `tests/variety-crew-variance.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 003: Manifest generation from template + RNG

**Complexity:** M
**Depends On:** 002
**Implements:** R1.5, R1.6

#### Objective
Replace the current `createManifest(template)` (deterministic copy) with `generateManifest(template, rng)` that uses RNG to roll crew variance within template-defined ranges, producing different crew configurations per seed.

#### Context
**Relevant Files:**
- `src/kernel/manifest.ts` — `createManifest()` currently just spreads template fields
- `src/core/rng.ts` — `createRng(seed)`, `rng.next()` (0-1), `rng.nextInt(n)`, `rng.pick(arr)`

**Embedded Context — Generation algorithm:**
```
1. Start with template.manifest as base
2. If template.crewVariance exists:
   a. Roll uniform crewStarting within ranges (stress, loyalty, motherReliable)
   b. For each NPC in npcVariance:
      - Roll per-NPC params within NPC-specific ranges
      - Roll hostileChance → if hit, set loyalty<30, paranoia>40
      - Store in crewOverrides
   c. Roll preSeededDoubtChance → if hit, generate 1-2 doubts
      - Pick random involved crew (1-2 NPCs)
      - Topic from template-specific pool
      - Severity 1-2
   d. Roll preSeededGrudgeChance → if hit, generate 1 grudge pair
      - Pick 2 different alive crew members
      - Amount 15-30
3. Assign template's socialEventPool and epistemicEventPool
4. Assign template's sensorReliability
5. Return completed RunManifest
```

**Key invariant (I8):** Same seed + same template = identical manifest. The RNG is deterministic.

#### Entry Points / Wiring
- `manifest.ts`: rename `createManifest` → `generateManifest(template, rng)`
- Update callers: `src/index.ts`, `scripts/smart-solver.ts`, `scripts/seed-classifier.ts`

#### Files Touched
- `src/kernel/manifest.ts` — modify (replace createManifest, add generation logic)
- `src/index.ts` — modify (pass rng to generateManifest)
- `scripts/smart-solver.ts` — modify (pass rng to generateManifest)

#### Acceptance Criteria
##### AC-1: Same seed + template = identical manifest <- R1.5
- Given: Template SIEGE and seed 42
- When: `generateManifest(TEMPLATE_SIEGE, createRng(42))` called twice
- Then: Both manifests are deep-equal

##### AC-2: Different seeds produce different crew configs <- R1.6
- Given: Template SIEGE
- When: Generate manifests for seeds 1-100
- Then: At least 3 distinct crewOverrides configurations (measured by stress/loyalty variance)

##### AC-3: Crew params within template ranges
- Given: Template with `crewVariance: { stressRange: [15, 30] }`
- When: Generate 100 manifests
- Then: All generated `crewStarting.stress` values are within [15, 30]

##### AC-4: Pre-seeded doubts generated at configured probability
- Given: Template with `crewVariance: { preSeededDoubtChance: 0.5 }`
- When: Generate 200 manifests
- Then: ~40-60% have `preSeededDoubts.length > 0`

##### AC-5: Hostile NPC chance works
- Given: Template with `crewVariance: { npcVariance: { roughneck: { hostileChance: 1.0 } } }`
- When: Generate manifest
- Then: `crewOverrides.roughneck.loyalty < 30` and `crewOverrides.roughneck.paranoia > 40`

#### Edge Cases
##### EC-1: Template with no crewVariance
- Scenario: Template has no `crewVariance` field
- Expected: Manifest uses uniform `crewStarting` only (backwards compatible with existing templates)

##### EC-2: All chances are 0
- Scenario: `preSeededDoubtChance: 0, preSeededGrudgeChance: 0`
- Expected: No pre-seeded doubts or grudges generated

#### Error Cases
None — generation always succeeds (ranges clamped, defaults applied).

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | deterministic generation | `tests/variety-manifest-gen.test.ts` |
| AC-2 | seed diversity | `tests/variety-manifest-gen.test.ts` |
| AC-3 | range enforcement | `tests/variety-manifest-gen.test.ts` |
| AC-4 | doubt probability | `tests/variety-manifest-gen.test.ts` |
| AC-5 | hostile NPC | `tests/variety-manifest-gen.test.ts` |
| EC-1 | no crewVariance | `tests/variety-manifest-gen.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 004: Template-specific social/epistemic event pools

**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4

#### Objective
Extend `proposeSocialPressure()` and `proposeEpistemicPressure()` in `pressure.ts` to check the manifest for additional template-specific event types, and implement generation functions for each.

#### Context
**Relevant Files:**
- `src/kernel/systems/pressure.ts` — `proposeSocialPressure()`, `proposeEpistemicPressure()`, event type unions
- `src/kernel/manifest.ts` — `TemplateSocialEvent`, `TemplateEpistemicEvent` types

**Embedded Context — Current event pools:**
```
Social: whisper_campaign | loyalty_test | confrontation | grudge_whisper
Epistemic: sensor_conflict | audit_prompt | doubt_voiced
```

**New events per template:**

SIEGE social:
- `cascade_blame`: When 2+ arcs active, crew broadcasts blame for system failures (suspicion +4)
- `shutdown_demand`: Engineer demands emergency power shutdown, creates doubt (severity 2)

SIEGE epistemic:
- `cascade_sensor_flood`: Multiple conflicting readings from different systems simultaneously
- `damage_assessment`: Crew demands honest damage report, creates doubt about MOTHER's transparency

DISTRUST social:
- `log_discrepancy`: Crew member references something MOTHER said that contradicts current state (requires tamperOps history)
- `trust_test`: Crew deliberately reports false data to see if MOTHER corrects it (creates doubt severity 2)

DISTRUST epistemic:
- `memory_gap`: MOTHER's logs show unexplained gap (sensor reading placeholder, low confidence)
- `crew_audit`: Suspicious crew member cross-references sensor readings (creates doubt severity 2, triggers investigation)

CRUNCH social:
- `quota_anxiety`: Miners argue about pushing extraction speed, stress +5 for miners
- `efficiency_ultimatum`: Corporate directive threatens decommission if quota not met (suspicion +3)

CRUNCH epistemic:
- `yield_discrepancy`: Cargo count doesn't match expected yield rate (sensor reading, creates doubt)
- `deadline_pressure`: Corporate comm announces early review (stress +3 for all crew)

**Pattern:** Each new event function follows `propose[Name](state, rng) → Proposal[]`, matching existing patterns. Events check `state.manifest?.socialEventPool?.includes('event_id')` before being added to the pool.

#### Entry Points / Wiring
- `proposeSocialPressure()` — add template events to pool
- `proposeEpistemicPressure()` — add template events to pool

#### Files Touched
- `src/kernel/systems/pressure.ts` — modify (extend pool logic, add 12 event generation functions)

#### Acceptance Criteria
##### AC-1: Template social events appear in pool <- R2.1
- Given: State with manifest containing `socialEventPool: ['cascade_blame']`
- And: 2+ active arcs (trigger condition for cascade_blame)
- When: `proposeSocialPressure(state, rng)` is called
- Then: `cascade_blame` is a possible result

##### AC-2: Template epistemic events appear in pool <- R2.2
- Given: State with manifest containing `epistemicEventPool: ['memory_gap']`
- When: `proposeEpistemicPressure(state, rng)` is called
- Then: `memory_gap` is a possible result

##### AC-3: SIEGE has 2+ unique social events <- R2.3
- Given: SIEGE template manifest
- Then: `socialEventPool` contains at least `['cascade_blame', 'shutdown_demand']`

##### AC-4: Each template has 2+ unique epistemic events <- R2.4
- Given: Each template manifest
- Then: Each has at least 2 entries in `epistemicEventPool`

##### AC-5: Events without trigger conditions are skipped
- Given: `cascade_blame` in pool but only 1 active arc
- When: `proposeSocialPressure(state, rng)` called
- Then: `cascade_blame` is NOT in candidate pool (precondition not met)

#### Edge Cases
##### EC-1: No manifest (backwards compatibility)
- Scenario: State has no manifest (existing tests)
- Expected: Only base event types available, no crash

##### EC-2: Empty event pools
- Scenario: `socialEventPool: []`
- Expected: Only base events available

#### Error Cases
None — unknown event IDs in pool are silently ignored.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | template social events in pool | `tests/variety-event-pools.test.ts` |
| AC-2 | template epistemic events in pool | `tests/variety-event-pools.test.ts` |
| AC-3 | SIEGE social count | `tests/variety-event-pools.test.ts` |
| AC-4 | all templates epistemic count | `tests/variety-event-pools.test.ts` |
| AC-5 | trigger condition gating | `tests/variety-event-pools.test.ts` |
| EC-1 | no manifest backward compat | `tests/variety-event-pools.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 005: Event novelty tracking with cooldowns

**Complexity:** S
**Depends On:** 004
**Implements:** R2.5

#### Objective
Track recently fired event types per run and apply a cooldown so the same social/epistemic event type doesn't repeat within N ticks.

#### Context
**Relevant Files:**
- `src/kernel/systems/pressure.ts` — event selection in `proposeSocialPressure` and `proposeEpistemicPressure`
- `src/kernel/types.ts` — TruthState (for tracking field)

**Embedded Context — Design:**
Add `lastEventTypeTick: Partial<Record<string, number>>` to `TruthState.pacing`. When selecting an event type, skip types where `tick - lastEventTypeTick[type] < CONFIG.eventNoveltyCooldown` (default 60 ticks = ~quarter day). Update after event is selected.

#### Entry Points / Wiring
- `TruthState.pacing` — add tracking field
- `proposeSocialPressure()` / `proposeEpistemicPressure()` — filter pool
- `createInitialState()` — initialize field

#### Files Touched
- `src/kernel/types.ts` — modify (add field to pacing)
- `src/kernel/state.ts` — modify (initialize field)
- `src/kernel/systems/pressure.ts` — modify (filter + update)
- `src/config.ts` — modify (add `eventNoveltyCooldown` param)

#### Acceptance Criteria
##### AC-1: Same event type suppressed within cooldown <- R2.5
- Given: `whisper_campaign` fired at tick 100, cooldown = 60
- When: `proposeSocialPressure()` called at tick 130
- Then: `whisper_campaign` is NOT in the candidate pool

##### AC-2: Event type available after cooldown expires
- Given: `whisper_campaign` fired at tick 100, cooldown = 60
- When: `proposeSocialPressure()` called at tick 161
- Then: `whisper_campaign` IS available in the pool

##### AC-3: Different event types not affected
- Given: `whisper_campaign` fired at tick 100
- When: `proposeSocialPressure()` called at tick 110
- Then: `loyalty_test`, `confrontation` etc. are still available

#### Edge Cases
##### EC-1: All events on cooldown
- Scenario: Every event type fired recently
- Expected: Cooldown filter is skipped (fallback to any available event), not empty proposal

#### Error Cases
None.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | suppression within cooldown | `tests/variety-novelty.test.ts` |
| AC-2 | available after cooldown | `tests/variety-novelty.test.ts` |
| AC-3 | independent tracking | `tests/variety-novelty.test.ts` |
| EC-1 | all on cooldown fallback | `tests/variety-novelty.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 006: Solver validation of variety improvements

**Complexity:** S
**Depends On:** 003, 005, 007
**Implements:** R1.6

#### Objective
Run smart-solver with `--strategy` on each template (200+ games) and verify:
- Each template has 3+ meaningful strategy clusters (up from 1-2)
- DISTRUST passive win rate drops below 70% (from 91.5%)
- All templates maintain 90%+ smart win rate
- Decision density improves (more decisions per tick)

#### Context
**Relevant Files:**
- `scripts/smart-solver.ts` — solver with `--strategy --template=` flags

#### Entry Points / Wiring
- None — this is a validation task, no code changes

#### Files Touched
- None (or minor solver tweaks if metrics need adjustment)

#### Acceptance Criteria
##### AC-1: 3+ strategy clusters per template <- R1.6
- Given: 200 games per template with `--strategy`
- Then: Each template shows 3+ meaningful clusters (>5% representation)

##### AC-2: DISTRUST passive win rate < 70%
- Given: 200 games with `--passive --template=distrust`
- Then: Win rate below 70% (currently 91.5%)

##### AC-3: Smart win rates stable
- Given: 200 games per template (smart mode)
- Then: All templates maintain 90%+ win rate

##### AC-4: Decision density improved
- Given: Strategy analysis across templates
- Then: Average decision density across all templates is better than 1/40 ticks

#### Edge Cases
None — this is a measurement task.

#### Error Cases
##### ERR-1: Balance regression
- When: Any template smart win rate drops below 85%
- Then: Identify which variety change caused it and adjust template ranges
- Note: Most likely cause is hostile NPC chance too high or pre-seeded doubt severity too aggressive

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 through AC-4 | Solver runs | `scripts/smart-solver.ts` (manual validation) |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 007: Information regime system (sensor reliability)

**Complexity:** M
**Depends On:** 001
**Implements:** R3.1, R3.2, R3.3, R3.4

#### Objective
Make sensor readings degrade based on per-system reliability values in the manifest. Unreliable sensors inject noise (wrong values, low confidence) rather than outright lying, creating uncertainty the player must reason through.

#### Context
**Relevant Files:**
- `src/kernel/systems/physics.ts` — `tickPassiveObservation()` generates sensor readings
- `src/kernel/systems/arcs.ts` — arc events generate system alerts
- `src/kernel/kernel.ts` — `proposePerceptionEvents()` generates hallucinations
- `src/kernel/types.ts` — `SensorReading` type

**Embedded Context — Degradation model:**
When generating a sensor reading for system S:
1. Check `state.manifest?.sensorReliability?.[S]` (default 1.0)
2. If reliability < 1.0, roll `rng.next() < (1 - reliability)`:
   - If hit: degrade the reading
   - Set `confidence *= reliability` (lower confidence)
   - For numeric readings (temperature, O2, radiation): add noise `± (1-reliability) * 20`
   - For boolean readings (onFire, isVented): small chance of inversion
3. Player sees confidence-degraded readings, not raw lies (respects I4)

**Template sensor profiles:**
- SIEGE: `{ power: 0.7, thermal: 0.8 }` — power monitoring and thermal sensors damaged by cascading failures
- DISTRUST: `{ comms: 0.6, air: 0.7 }` — crew suspects MOTHER is filtering comms, air readings seem off
- CRUNCH: `{ radiation: 0.7 }` — mining operations degrade radiation sensors

#### Entry Points / Wiring
- `tickPassiveObservation()` in `physics.ts` — apply degradation to room scan readings
- Arc system alerts — apply degradation to alert confidence
- Existing `proposePerceptionEvents()` — no change (hallucinations are separate)

#### Files Touched
- `src/kernel/systems/physics.ts` — modify (sensor degradation in observation)
- `src/kernel/manifest.ts` — modify (add sensor profiles to templates)

#### Acceptance Criteria
##### AC-1: Unreliable sensor degrades confidence <- R3.2
- Given: Manifest with `sensorReliability: { thermal: 0.5 }`
- When: Thermal sensor reading generated
- Then: Reading confidence is reduced (multiplied by ~0.5)

##### AC-2: Unreliable sensor adds noise to numeric values <- R3.2
- Given: Manifest with `sensorReliability: { air: 0.5 }`, actual O2 = 80
- When: Air sensor reading generated and degradation triggers
- Then: Reported O2 is 80 ± noise (within ±10 of actual)

##### AC-3: Fully reliable sensors unaffected <- R3.2
- Given: Manifest with `sensorReliability: { thermal: 1.0 }` or no entry
- When: Thermal reading generated
- Then: No degradation applied, confidence unchanged

##### AC-4: Templates have distinct sensor profiles <- R3.3
- Given: SIEGE, DISTRUST, CRUNCH templates
- Then: Each has different systems marked as unreliable

#### Edge Cases
##### EC-1: No manifest (backwards compatibility)
- Scenario: State has no manifest
- Expected: All sensors fully reliable, no degradation

##### EC-2: Reliability = 0 (fully broken sensor)
- Scenario: `sensorReliability: { air: 0 }`
- Expected: Every reading is degraded, confidence near 0

#### Error Cases
None — degradation is always safe (clamped values).

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | confidence degradation | `tests/variety-info-regime.test.ts` |
| AC-2 | numeric noise | `tests/variety-info-regime.test.ts` |
| AC-3 | reliable unaffected | `tests/variety-info-regime.test.ts` |
| AC-4 | template profiles | `tests/variety-info-regime.test.ts` |
| EC-1 | no manifest compat | `tests/variety-info-regime.test.ts` |
| EC-2 | zero reliability | `tests/variety-info-regime.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Crew variance too aggressive → smart solver drops below 85% | Balance regression | Task 006 catches this; adjust template ranges |
| Pre-seeded doubts + doubt drip creates unrecoverable spiral | Passive win rate drops too far | Cap pre-seeded doubt severity at 2, limit to 1-2 doubts |
| 12 new event functions bloat pressure.ts | Maintainability | Each follows existing pattern; consider extracting to `template-events.ts` if >500 lines added |
| Sensor degradation makes game unfair (player can't act on bad data) | Player frustration | Degradation reduces confidence (visible to player), doesn't fabricate — player sees "low confidence" label |
| DISTRUST passive rate still too high after all changes | Feature goal not met | Crew variance with hostileChance creates crew who ACT on distrust (refuse mining, investigate), causing physical consequences |

---

## Open Questions

1. **Should `generateManifest` replace `createManifest` entirely?** Current callers use `createManifest` for a deterministic copy. The new `generateManifest` requires an RNG. Proposal: keep both — `createManifest` for test fixtures, `generateManifest` for actual runs.

2. **Template-specific doubt topics:** Should pre-seeded doubt topics be defined in the template, or generated dynamically? Proposal: templates define a `doubtTopics: string[]` pool, generation picks from it.

3. **Solver adaptation:** The smart solver doesn't currently react to crew variance (e.g., order hostile crew differently). Should Task 006 also update solver heuristics? Proposal: yes, minimal — if a crew member has burden > threshold, avoid ordering them.
