# Plan: Dynamic Director & Variety System

**Discovery:** Inline (conversation-based analysis + solver validation)
**Status:** planning

---

## Overview

Replace parametric event selection with a context-aware dynamic Director that creates emergent narrative variety. Three focused changes to existing systems:

1. **Contextual Arc Scoring** — `pickArcKind()` scores candidates by game state (recency, relevance, crew spotlight) instead of random weighted draw
2. **Consequence Hooks** — arc resolution, crew injury, and overlapping crises queue follow-up pressure events on causal channels
3. **Crew Variance** — per-NPC randomized starting psychology creates different social dynamics per seed

Plus supporting layers:
4. **Info Regimes** — sensor unreliability per template changes which data the player can trust
5. **Manifest Generation** — `generateManifest(template, rng)` rolls crew variance within template ranges

**Key insight from solver analysis:**
- SIEGE: 55/45 cluster split (best variety), 3.1 fires/game
- DISTRUST: 100% verify-heavy (1 cluster), passive wins 91.5% — social/epistemic alone can't spike suspicion
- Current Director doesn't "read the room" — events are random draws, not contextual responses
- Consequence hooks solve DISTRUST's core problem: physical crises need social aftermath to build suspicion

**Target:** 3+ meaningful strategy clusters per template. Events feel causally connected ("fire → blame → investigation") instead of random ("fire → [random] sensor conflict → [random] whisper").

---

## Requirements Expansion

### From R1: Director creates contextually appropriate events

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | `pickArcKind()` scores candidates by recency, state relevance, and crew spotlight | Unit test: recently-resolved arc kind gets lower score | 002 |
| R1.2 | Arc kinds that match current game state score higher | Unit test: ghost_signal scores higher when social tension is high | 002 |
| R1.3 | Crew that haven't been featured recently bias event targeting | Unit test: under-featured crew's location boosts arc score | 002 |
| R1.4 | `lastFeaturedTick` tracked per crew when events commit | Unit test: after arc fires in crew's room, their lastFeaturedTick updates | 002 |

### From R2: Events form causal chains via consequence hooks

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Arc resolution queues a social consequence 8-15 ticks later | Unit test: consequence appears in queue after arc completes | 003 |
| R2.2 | Crew death queues a social consequence 5-10 ticks later | Unit test: consequence queued on NPC_DAMAGE with death | 003 |
| R2.3 | 2+ simultaneous active arcs queues an epistemic consequence | Unit test: consequence queued when second arc activates | 003 |
| R2.4 | `maybeActivatePressure()` drains consequence queue before random activation | Unit test: due consequence fires on forced channel, bypassing roll | 003 |
| R2.5 | Consequences respect existing cooldown (don't stack) | Unit test: second consequence within cooldown is deferred, not dropped | 003 |

### From R3: Crew variance creates within-template variety

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | RunManifest supports per-NPC starting param overrides | Unit test: per-NPC stress/loyalty/paranoia applied in state | 004 |
| R3.2 | RunManifest supports pre-seeded doubts at tick 0 | Unit test: activeDoubts populated from manifest | 004 |
| R3.3 | RunManifest supports pre-seeded grudges between crew | Unit test: crewGrudge values applied from manifest | 004 |
| R3.4 | ScenarioTemplate defines variance ranges for crew params | Type check: ranges exist in template type | 001 |
| R3.5 | `generateManifest(template, rng)` uses RNG to roll crew variance within ranges | Deterministic test: same seed = same manifest | 005 |
| R3.6 | Different seeds produce measurably different crew configs | Solver: 3+ strategy clusters with --strategy | 007 |

### From R4: Information regimes change gameplay

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | RunManifest specifies sensor reliability per system (0-1) | Type check: field exists, applied in readings | 006 |
| R4.2 | Unreliable sensors inject noise (degraded confidence, value jitter) | Unit test: degraded readings at expected rate | 006 |
| R4.3 | Templates define distinct sensor reliability profiles | Each template has unique profile | 006 |
| R4.4 | Player sees confidence-degraded readings, not raw lies | Perception output shows low confidence on unreliable systems | 006 |

---

## Dependency Graph

```
001 (types) ──┬──> 002 (arc scoring) ────┐
              ├──> 003 (consequences) ───┤
              ├──> 004 (crew variance) ──┼──> 005 (manifest gen) ──┐
              └──> 006 (info regimes) ───┤                         ├──> 007 (validation)
                                         └─────────────────────────┘
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | S | - | Foundation types for all tracks |
| 2 | 002, 003, 004, 006 | M | Batch 1 | Four independent tracks: arc scoring, consequences, crew variance, info regimes |
| 3 | 005 | M | 004 | Manifest generation needs crew variance apply |
| 4 | 007 | S | Batch 2, 3 | Solver validation of all layers |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Director state + variety foundation types | S | ready |
| 002 | Contextual arc scoring | M | backlog |
| 003 | Consequence hooks | M | backlog |
| 004 | Crew variance apply in createInitialState | M | backlog |
| 005 | Manifest generation from template + RNG | M | backlog |
| 006 | Info regimes (sensor reliability) | M | backlog |
| 007 | Solver validation | S | backlog |

---

## Task Details (Inline)

### Task 001: Director state + variety foundation types

**Complexity:** S
**Depends On:** none
**Implements:** R3.4, R4.1

#### Objective
Add all new type definitions so parallel implementation tracks (002-006) can proceed. Director context in pacing, crew variance in manifest, consequence queue in truth state.

#### Context
**Relevant Files:**
- `src/kernel/types.ts` — TruthState, pacing, ArcKind, ActiveDoubt, DoubtSource
- `src/kernel/manifest.ts` — RunManifest, ScenarioTemplate, ArcKind
- `src/kernel/state.ts` — createInitialState (will initialize new fields)

**Embedded Context — Exact types to add:**

```typescript
// === Add to TruthState.pacing ===

/** Per-crew last-featured tick for spotlight rotation */
lastFeaturedTick: Partial<Record<NPCId, number>>;

/** Recent arc resolutions for recency scoring: kind -> tick resolved */
arcResolvedHistory: Partial<Record<ArcKind, number>>;

/** Consequence queue: events that MUST fire on a specific channel */
consequenceQueue: ConsequenceEntry[];
```

```typescript
// === New type in types.ts ===

export interface ConsequenceEntry {
    /** Tick at which this consequence should fire */
    triggerTick: number;
    /** Forced pressure channel */
    channel: 'social' | 'epistemic';
    /** Scoring priority — higher fires first when multiple are due */
    priority: number;
    /** Debug/logging reason */
    reason: string;
}
```

```typescript
// === Add to RunManifest interface (manifest.ts) ===

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

/** Pre-seeded grudges between crew */
preSeededGrudges?: Array<{
    from: NPCId;
    to: NPCId;
    amount: number;  // 0-100
}>;

/** Sensor reliability per system (0-1, default 1.0 = fully reliable) */
sensorReliability?: Partial<Record<string, number>>;
```

```typescript
// === Add to ScenarioTemplate interface (manifest.ts) ===

crewVariance?: {
    stressRange?: [number, number];
    loyaltyRange?: [number, number];
    motherReliableRange?: [number, number];
    preSeededDoubtChance?: number;   // 0-1
    preSeededGrudgeChance?: number;  // 0-1
    npcVariance?: Partial<Record<NPCId, {
        stressRange?: [number, number];
        loyaltyRange?: [number, number];
        hostileChance?: number;  // 0-1, if hit: loyalty<30, paranoia>40
    }>>;
};
```

#### Entry Points / Wiring
- `types.ts` exports ConsequenceEntry
- `manifest.ts` exports updated RunManifest, ScenarioTemplate
- `state.ts` initializes new pacing fields in createInitialState

#### Files Touched
- `src/kernel/types.ts` — modify (add ConsequenceEntry, extend pacing)
- `src/kernel/manifest.ts` — modify (extend RunManifest, ScenarioTemplate)
- `src/kernel/state.ts` — modify (initialize new pacing fields)

#### Acceptance Criteria
##### AC-1: ConsequenceEntry type compiles <- R2.1
- Given: `const c: ConsequenceEntry = { triggerTick: 100, channel: 'social', priority: 1, reason: 'test' }`
- When: TypeScript compiles
- Then: No type errors

##### AC-2: RunManifest accepts crew overrides <- R3.1
- Given: A RunManifest with `crewOverrides: { roughneck: { stress: 50, loyalty: 30 } }`
- When: TypeScript compiles
- Then: No type errors

##### AC-3: ScenarioTemplate accepts crewVariance ranges <- R3.4
- Given: A ScenarioTemplate with `crewVariance: { stressRange: [10, 30], loyaltyRange: [40, 60] }`
- When: TypeScript compiles
- Then: No type errors

##### AC-4: RunManifest accepts sensor reliability <- R4.1
- Given: A RunManifest with `sensorReliability: { thermal: 0.5, air: 0.3 }`
- When: TypeScript compiles
- Then: No type errors

##### AC-5: Pacing initializes director context
- Given: `createInitialState(world, 10)` called
- When: State returned
- Then: `state.truth.pacing.lastFeaturedTick` is `{}`, `arcResolvedHistory` is `{}`, `consequenceQueue` is `[]`

#### Edge Cases
##### EC-1: Empty overrides
- Scenario: `crewOverrides: {}`, `preSeededDoubts: []`, `consequenceQueue: []`
- Expected: Valid — all fields are optional and empty containers are allowed

#### Error Cases
None — this is primarily a types + initialization task.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 through AC-4 | Type compilation | `tsc --noEmit` |
| AC-5 | Pacing initialization | `tests/variety-director.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 002: Contextual arc scoring

**Complexity:** M
**Depends On:** 001
**Implements:** R1.1, R1.2, R1.3, R1.4

#### Objective
Replace the random `pickArcKind()` with a scored selection that considers recency, game state relevance, and crew spotlight. Track `lastFeaturedTick` when events commit. This is the core change that makes the Director "read the room."

#### Context
**Relevant Files:**
- `src/kernel/systems/arcs.ts` — `pickArcKind()` (line 313), `proposeArcEvents()` (line 50), `trackCrisisResolution()` (line 29)
- `src/kernel/kernel.ts` — `updatePacing()` (line 879), event commitment pipeline
- `src/kernel/types.ts` — TruthState.pacing (new fields from 001)
- `src/kernel/manifest.ts` — `getArcWeights()` (existing)

**Embedded Context — Scoring algorithm:**

```typescript
function scoreArcCandidate(kind: ArcKind, state: KernelState): number {
    // Base: manifest weight (existing, 10 default)
    const weights = getArcWeights(state.manifest);
    let score = weights.find(([k]) => k === kind)?.[1] ?? 10;

    // Recency penalty: recently resolved kinds score lower
    const lastResolved = state.truth.pacing.arcResolvedHistory[kind];
    if (lastResolved !== undefined) {
        const elapsed = state.truth.tick - lastResolved;
        if (elapsed < 60) score *= 0.3;       // very recent: strong suppression
        else if (elapsed < 120) score *= 0.6;  // somewhat recent: mild suppression
    }

    // State relevance: context-appropriate crises score higher
    const { station, rooms, arcs } = state.truth;
    if (kind === 'power_surge' && station.power < 40) score *= 0.4;  // already low power
    if (kind === 'air_scrubber' && Object.values(rooms).some(r => r.o2Level < 50)) score *= 0.5;
    if (kind === 'ghost_signal' && state.perception.activeDoubts.length >= 3) score *= 1.5; // amplifies paranoia
    if (kind === 'fire_outbreak' && arcs.length === 0) score *= 1.3; // no active crises = good time for fire
    if (kind === 'radiation_leak' && station.power < 30) score *= 0.6; // can't reroute with low power
    if (kind === 'solar_flare' && station.blackoutTicks > 0) score *= 0.2; // already in blackout

    // Crew spotlight: bonus if target room has under-featured crew
    const targetRoom = predictTargetRoom(kind, state);
    const crewInRoom = Object.values(state.truth.crew)
        .filter(c => c.alive && c.place === targetRoom);
    if (crewInRoom.length > 0) {
        const avgLastFeatured = crewInRoom.reduce((sum, c) => {
            const last = state.truth.pacing.lastFeaturedTick[c.id] ?? 0;
            return sum + (state.truth.tick - last);
        }, 0) / crewInRoom.length;
        if (avgLastFeatured > 60) score *= 1.3;  // crew hasn't been featured in a while
    }

    return Math.max(1, score); // minimum score of 1
}
```

**Key: `predictTargetRoom` uses same logic as `pickArcTarget` but doesn't consume RNG.**

**Spotlight tracking: in `updatePacing()`, scan committed proposals for crew actors/targets and update `lastFeaturedTick`.**

**Also: update `trackCrisisResolution()` to record `arcResolvedHistory[kind] = tick`.**

#### Entry Points / Wiring
- `pickArcKind()` in `arcs.ts` — replace random selection with scored selection
- `trackCrisisResolution()` in `arcs.ts` — record resolution in arcResolvedHistory
- `updatePacing()` in `kernel.ts` — track lastFeaturedTick from committed events

#### Files Touched
- `src/kernel/systems/arcs.ts` — modify (scored pickArcKind, arcResolvedHistory update)
- `src/kernel/kernel.ts` — modify (spotlight tracking in updatePacing)

#### Acceptance Criteria
##### AC-1: Recently resolved arc kind scores lower <- R1.1
- Given: State with `arcResolvedHistory: { fire_outbreak: 50 }` and current tick = 80 (30 ticks elapsed)
- When: `scoreArcCandidate('fire_outbreak', state)` called
- Then: Score is base_weight * 0.3 (30 ticks < 60 threshold)

##### AC-2: Stale arc kind has no penalty <- R1.1
- Given: State with `arcResolvedHistory: { fire_outbreak: 50 }` and current tick = 200 (150 ticks elapsed)
- When: `scoreArcCandidate('fire_outbreak', state)` called
- Then: Score equals base_weight (no recency penalty)

##### AC-3: power_surge scores low when power is low <- R1.2
- Given: State with `station.power = 30`
- When: `scoreArcCandidate('power_surge', state)` called
- Then: Score < base_weight (power_surge suppressed)

##### AC-4: ghost_signal scores high when doubts are active <- R1.2
- Given: State with 4 active doubts
- When: `scoreArcCandidate('ghost_signal', state)` called
- Then: Score > base_weight (ghost_signal boosted)

##### AC-5: Under-featured crew location boosts arc score <- R1.3
- Given: State where roughneck in 'mines' has `lastFeaturedTick = 0` and current tick = 100
- When: `scoreArcCandidate('radiation_leak', state)` called (targets mines area)
- Then: Score includes spotlight bonus (> base without spotlight)

##### AC-6: lastFeaturedTick updates when arc fires <- R1.4
- Given: Arc fires in 'engineering' where engineer is present
- When: Tick completes and updatePacing runs
- Then: `state.truth.pacing.lastFeaturedTick.engineer` equals current tick

##### AC-7: arcResolvedHistory recorded on resolution
- Given: fire_outbreak arc completes at tick 100
- When: `trackCrisisResolution()` runs
- Then: `state.truth.pacing.arcResolvedHistory.fire_outbreak === 100`

##### AC-8: Backward compatibility — no manifest = default scoring
- Given: State with no manifest
- When: `pickArcKind()` called
- Then: All kinds get default base weight of 10, scoring still works

#### Edge Cases
##### EC-1: All candidates have very low scores
- Scenario: Every available arc kind recently resolved AND state-suppressed
- Expected: Minimum score of 1 ensures selection still works (weighted selection with small weights)

##### EC-2: No alive crew (spotlight has nothing to track)
- Scenario: All crew dead
- Expected: Spotlight bonus is 0 (no crew to feature), scoring proceeds normally

#### Error Cases
None — scoring always produces valid non-negative numbers.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1, AC-2 | recency scoring | `tests/variety-director.test.ts` |
| AC-3, AC-4 | state relevance scoring | `tests/variety-director.test.ts` |
| AC-5 | crew spotlight scoring | `tests/variety-director.test.ts` |
| AC-6, AC-7 | tracking updates | `tests/variety-director.test.ts` |
| AC-8 | backward compat | `tests/variety-director.test.ts` |
| EC-1 | minimum scores | `tests/variety-director.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 003: Consequence hooks

**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5

#### Objective
Create causal chains between events by queueing follow-up pressure activations. Arc resolution, crew death, and overlapping crises queue consequences that fire as social/epistemic pressure on specific channels. This makes events feel connected ("fire → blame") instead of random.

#### Context
**Relevant Files:**
- `src/kernel/systems/arcs.ts` — `trackCrisisResolution()` (line 29), `proposeArcEvents()` (line 50)
- `src/kernel/systems/pressure.ts` — `maybeActivatePressure()` (line 69)
- `src/kernel/kernel.ts` — `applyEvent()` (line 189, NPC_DAMAGE case)
- `src/kernel/types.ts` — ConsequenceEntry (from 001)

**Embedded Context — Queue sources and timing:**

```
Trigger: Arc resolution (trackCrisisResolution)
  → Queue: { channel: 'social', triggerTick: tick + 8 + rng.nextInt(7), priority: 2, reason: 'crisis_aftermath:${kind}' }
  → Effect: Social pressure fires (whisper/confrontation about the crisis)

Trigger: Crew death (NPC_DAMAGE with crew.alive becoming false)
  → Queue: { channel: 'social', triggerTick: tick + 5 + rng.nextInt(5), priority: 3, reason: 'crew_death:${npcId}' }
  → Effect: Social pressure fires (blame, grief, fear)

Trigger: 2+ active arcs simultaneously (when second arc activates)
  → Queue: { channel: 'epistemic', triggerTick: tick + 10 + rng.nextInt(10), priority: 1, reason: 'crisis_overlap' }
  → Effect: Epistemic pressure fires (sensor conflict, doubt about MOTHER's control)
```

**Processing in maybeActivatePressure():**

```typescript
// Before random activation roll, check consequence queue
const dueConsequences = truth.pacing.consequenceQueue
    .filter(c => truth.tick >= c.triggerTick)
    .sort((a, b) => b.priority - a.priority);

if (dueConsequences.length > 0) {
    const consequence = dueConsequences[0];
    // Remove from queue
    truth.pacing.consequenceQueue = truth.pacing.consequenceQueue
        .filter(c => c !== consequence);
    // Fire on forced channel (respects existing cooldown)
    if (truth.tick >= truth.pacing.nextThreatActivationTick) {
        if (consequence.channel === 'social') {
            proposals = proposeSocialPressure(state, rng);
        } else {
            proposals = proposeEpistemicPressure(state, rng);
        }
        truth.pacing.nextThreatActivationTick = truth.tick + cooldown;
        return proposals;
    }
    // If on cooldown, defer consequence (don't drop it)
    consequence.triggerTick = truth.pacing.nextThreatActivationTick;
    truth.pacing.consequenceQueue.push(consequence);
    return [];
}
// ... existing random activation continues
```

**Key invariant:** Consequences use existing social/epistemic proposal functions — no new event types needed. The `pickSuspiciousCrew()` function already selects contextually appropriate crew (stressed, injured, near crises), so the text and targeting will naturally reflect the game state that caused the consequence.

#### Entry Points / Wiring
- `trackCrisisResolution()` in `arcs.ts` — queue social consequence
- `applyEvent()` in `kernel.ts` — queue social consequence on crew death
- `tryActivateArc()` in `arcs.ts` — queue epistemic consequence when 2+ arcs active
- `maybeActivatePressure()` in `pressure.ts` — drain queue before random activation

#### Files Touched
- `src/kernel/systems/arcs.ts` — modify (queue consequences on resolution and overlap)
- `src/kernel/systems/pressure.ts` — modify (drain queue in maybeActivatePressure)
- `src/kernel/kernel.ts` — modify (queue consequence on crew death in applyEvent)

#### Acceptance Criteria
##### AC-1: Arc resolution queues social consequence <- R2.1
- Given: fire_outbreak arc resolves at tick 100
- When: `trackCrisisResolution()` runs
- Then: `consequenceQueue` contains entry with `channel: 'social'`, `triggerTick` between 108-114, `reason` contains 'crisis_aftermath'

##### AC-2: Crew death queues social consequence <- R2.2
- Given: NPC roughneck dies at tick 150
- When: `applyEvent()` processes NPC_DAMAGE with death
- Then: `consequenceQueue` contains entry with `channel: 'social'`, `triggerTick` between 155-159, `priority: 3`

##### AC-3: Overlapping crises queue epistemic consequence <- R2.3
- Given: 1 active arc already exists
- When: `tryActivateArc()` creates a second arc
- Then: `consequenceQueue` contains entry with `channel: 'epistemic'`, `reason: 'crisis_overlap'`

##### AC-4: Due consequence fires on forced channel <- R2.4
- Given: `consequenceQueue` has `{ triggerTick: 100, channel: 'social', priority: 2, reason: 'test' }` and tick = 100
- When: `maybeActivatePressure()` runs
- Then: Social pressure fires (returns non-empty proposals from social channel)
- And: Random activation roll is skipped

##### AC-5: Consequence on cooldown is deferred, not dropped <- R2.5
- Given: Consequence due at tick 100, but `nextThreatActivationTick = 110`
- When: `maybeActivatePressure()` runs at tick 100
- Then: Consequence's `triggerTick` updated to 110, still in queue

##### AC-6: Higher priority consequence fires first
- Given: Two consequences due: priority 1 and priority 3
- When: `maybeActivatePressure()` runs
- Then: Priority 3 consequence fires first

##### AC-7: Consequence queue cleaned after firing
- Given: Consequence fires at tick 100
- When: `maybeActivatePressure()` completes
- Then: Fired consequence removed from queue

#### Edge Cases
##### EC-1: No consequences queued (backward compat)
- Scenario: Empty consequence queue
- Expected: `maybeActivatePressure()` falls through to existing random activation logic

##### EC-2: Multiple consequences due simultaneously
- Scenario: 3 consequences all due at tick 100
- Expected: Highest priority fires, other 2 remain in queue for next activation

##### EC-3: Consequence queue grows unbounded
- Scenario: Many arc resolutions and deaths in rapid succession
- Expected: Queue is naturally bounded — consequences fire on subsequent activations. Add cap of 5 entries (oldest dropped when exceeded).

#### Error Cases
None — consequences are advisory (forced channel selection), failure to fire just means existing random activation handles the tick.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | arc resolution consequence | `tests/variety-consequences.test.ts` |
| AC-2 | crew death consequence | `tests/variety-consequences.test.ts` |
| AC-3 | overlap consequence | `tests/variety-consequences.test.ts` |
| AC-4 | forced channel fire | `tests/variety-consequences.test.ts` |
| AC-5 | cooldown deferral | `tests/variety-consequences.test.ts` |
| AC-6 | priority ordering | `tests/variety-consequences.test.ts` |
| EC-1 | empty queue compat | `tests/variety-consequences.test.ts` |
| EC-3 | queue cap | `tests/variety-consequences.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 004: Crew variance apply in createInitialState

**Complexity:** M
**Depends On:** 001
**Implements:** R3.1, R3.2, R3.3

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
##### AC-1: Per-NPC stress/loyalty/paranoia applied <- R3.1
- Given: Manifest with `crewOverrides: { roughneck: { stress: 50, loyalty: 30, paranoia: 20 } }`
- When: `createInitialState(world, 10, manifest)` called
- Then: `state.truth.crew.roughneck.stress === 50`, `.loyalty === 30`, `.paranoia === 20`
- And: Other crew retain uniform crewStarting values

##### AC-2: Per-NPC motherReliable applied <- R3.1
- Given: Manifest with `crewOverrides: { commander: { motherReliable: 0.20 } }`
- When: `createInitialState(world, 10, manifest)` called
- Then: `state.perception.beliefs.commander.motherReliable === 0.20`

##### AC-3: Pre-seeded doubts exist at tick 0 <- R3.2
- Given: Manifest with `preSeededDoubts: [{ topic: "MOTHER lied about air quality", severity: 2, involvedCrew: ["roughneck", "engineer"], source: "witness" }]`
- When: `createInitialState(world, 10, manifest)` called
- Then: `state.perception.activeDoubts.length === 1`
- And: Doubt has `createdTick: 0`, `resolved: false`, matching fields

##### AC-4: Pre-seeded grudges applied <- R3.3
- Given: Manifest with `preSeededGrudges: [{ from: "roughneck", to: "engineer", amount: 25 }]`
- When: `createInitialState(world, 10, manifest)` called
- Then: `state.perception.beliefs.roughneck.crewGrudge.engineer === 25`

#### Edge Cases
##### EC-1: crewOverrides for non-existent NPC
- Scenario: `crewOverrides: { phantom: { stress: 99 } }`
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
| AC-1 | per-NPC stress/loyalty/paranoia | `tests/variety-crew-variance.test.ts` |
| AC-2 | per-NPC motherReliable | `tests/variety-crew-variance.test.ts` |
| AC-3 | pre-seeded doubts | `tests/variety-crew-variance.test.ts` |
| AC-4 | pre-seeded grudges | `tests/variety-crew-variance.test.ts` |
| EC-1 | non-existent NPC | `tests/variety-crew-variance.test.ts` |
| EC-3 | override + uniform stacking | `tests/variety-crew-variance.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 005: Manifest generation from template + RNG

**Complexity:** M
**Depends On:** 004
**Implements:** R3.5, R3.6

#### Objective
Replace `createManifest(template)` with `generateManifest(template, rng)` that uses RNG to roll crew variance within template-defined ranges. Different seeds produce different crew configurations while remaining deterministic.

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
      - Severity 1-2
   d. Roll preSeededGrudgeChance → if hit, generate 1 grudge pair
      - Pick 2 different alive crew members
      - Amount 15-30
3. Assign template's sensorReliability
4. Return completed RunManifest
```

**Key: Same seed + same template = identical manifest (I8).**

**Add `crewVariance` and `sensorReliability` to existing SIEGE/DISTRUST/CRUNCH templates.**

#### Entry Points / Wiring
- `manifest.ts`: keep `createManifest` for test fixtures, add `generateManifest(template, rng)`
- Update callers: `src/index.ts`, `scripts/smart-solver.ts`

#### Files Touched
- `src/kernel/manifest.ts` — modify (add generateManifest, add crewVariance to templates)
- `src/index.ts` — modify (use generateManifest)
- `scripts/smart-solver.ts` — modify (use generateManifest)

#### Acceptance Criteria
##### AC-1: Same seed + template = identical manifest <- R3.5
- Given: Template SIEGE and seed 42
- When: `generateManifest(TEMPLATE_SIEGE, createRng(42))` called twice
- Then: Both manifests are deep-equal

##### AC-2: Different seeds produce different crew configs <- R3.6
- Given: Template SIEGE
- When: Generate manifests for seeds 1-100
- Then: At least 3 distinct crewOverrides configurations (measured by stress/loyalty variance)

##### AC-3: Crew params within template ranges
- Given: Template with `crewVariance: { stressRange: [15, 30] }`
- When: Generate 100 manifests
- Then: All generated `crewStarting.stress` values within [15, 30]

##### AC-4: Hostile NPC chance works
- Given: Template with `crewVariance: { npcVariance: { roughneck: { hostileChance: 1.0 } } }`
- When: Generate manifest
- Then: `crewOverrides.roughneck.loyalty < 30` and implied paranoia > 40

##### AC-5: Template without crewVariance is backward compatible
- Given: Template with no `crewVariance` field
- When: `generateManifest(template, rng)` called
- Then: Manifest uses uniform `crewStarting` only (no crewOverrides)

#### Edge Cases
##### EC-1: All chances are 0
- Scenario: `preSeededDoubtChance: 0, preSeededGrudgeChance: 0`
- Expected: No pre-seeded doubts or grudges generated

#### Error Cases
None — generation always succeeds.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | deterministic generation | `tests/variety-manifest-gen.test.ts` |
| AC-2 | seed diversity | `tests/variety-manifest-gen.test.ts` |
| AC-3 | range enforcement | `tests/variety-manifest-gen.test.ts` |
| AC-4 | hostile NPC | `tests/variety-manifest-gen.test.ts` |
| AC-5 | backward compat | `tests/variety-manifest-gen.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 006: Info regimes (sensor reliability)

**Complexity:** M
**Depends On:** 001
**Implements:** R4.1, R4.2, R4.3, R4.4

#### Objective
Make sensor readings degrade based on per-system reliability values in the manifest. Unreliable sensors inject noise (wrong values, low confidence) rather than outright lying, creating uncertainty the player must reason through.

#### Context
**Relevant Files:**
- `src/kernel/systems/physics.ts` — `tickPassiveObservation()` generates sensor readings
- `src/kernel/systems/arcs.ts` — arc events generate system alerts
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

**Template sensor profiles (add to existing templates in manifest.ts):**
- SIEGE: `{ power: 0.7, thermal: 0.8 }` — cascading failures damage monitoring
- DISTRUST: `{ comms: 0.6, air: 0.7 }` — crew suspects MOTHER is filtering data
- CRUNCH: `{ radiation: 0.7 }` — mining operations degrade radiation sensors

#### Entry Points / Wiring
- `tickPassiveObservation()` in `physics.ts` — apply degradation to room scan readings

#### Files Touched
- `src/kernel/systems/physics.ts` — modify (sensor degradation in observation)
- `src/kernel/manifest.ts` — modify (add sensor profiles to templates)

#### Acceptance Criteria
##### AC-1: Unreliable sensor degrades confidence <- R4.2
- Given: Manifest with `sensorReliability: { thermal: 0.5 }`
- When: Thermal sensor reading generated
- Then: Reading confidence reduced (multiplied by ~0.5)

##### AC-2: Unreliable sensor adds noise to numeric values <- R4.2
- Given: Manifest with `sensorReliability: { air: 0.5 }`, actual O2 = 80
- When: Air sensor reading generated and degradation triggers
- Then: Reported O2 is 80 ± noise (within ±10 of actual)

##### AC-3: Fully reliable sensors unaffected <- R4.2
- Given: Manifest with `sensorReliability: { thermal: 1.0 }` or no entry
- When: Thermal reading generated
- Then: No degradation applied, confidence unchanged

##### AC-4: Templates have distinct sensor profiles <- R4.3
- Given: SIEGE, DISTRUST, CRUNCH templates
- Then: Each has different systems marked as unreliable

#### Edge Cases
##### EC-1: No manifest (backward compat)
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

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

### Task 007: Solver validation

**Complexity:** S
**Depends On:** 002, 003, 005, 006
**Implements:** R3.6

#### Objective
Run smart-solver with `--strategy` on each template (200+ games) and verify variety improvements. Key metrics: strategy cluster count, passive win rate, smart win rate, and whether consequences create observable causal chains.

#### Context
**Relevant Files:**
- `scripts/smart-solver.ts` — solver with `--strategy --template=` flags

#### Entry Points / Wiring
- None — validation task, no code changes expected

#### Files Touched
- None (or minor solver tweaks if consequence detection metrics needed)

#### Acceptance Criteria
##### AC-1: 3+ strategy clusters per template <- R3.6
- Given: 200 games per template with `--strategy`
- Then: Each template shows 3+ meaningful clusters (>5% representation)

##### AC-2: DISTRUST passive win rate improved
- Given: 200 games with `--passive --template=distrust`
- Then: Win rate below 80% (currently 91.5%) — consequence hooks should create physical aftermath from social events

##### AC-3: Smart win rates stable
- Given: 200 games per template (smart mode)
- Then: All templates maintain 85%+ win rate

##### AC-4: Consequence chains observable in trace
- Given: 10 games with `--trace 1`
- Then: At least 50% of games show a consequence firing within 20 ticks of its trigger event

#### Edge Cases
None — measurement task.

#### Error Cases
##### ERR-1: Balance regression
- When: Any template smart win rate drops below 85%
- Then: Check if contextual scoring is over-suppressing easy arc kinds
- Note: Most likely cause is recency penalty being too aggressive

##### ERR-2: No variety improvement
- When: Still 1-2 clusters per template
- Then: Check if crew variance ranges are too narrow or consequence hooks are being cooldown-blocked
- Note: May need to widen template crewVariance ranges or reduce consequence cooldown

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 through AC-4 | Solver runs | `scripts/smart-solver.ts` (manual validation) |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Contextual scoring makes game too predictable (always picks "best" arc) | Less variety, not more | Scoring is multiplicative on manifest weights, not deterministic — keeps randomness with informed bias |
| Consequence hooks stack during crisis cascades → suspicion spiral | Passive win rate drops too far | Queue cap of 5 entries, cooldown respected between fires |
| Crew variance too aggressive → smart solver drops below 85% | Balance regression | Task 007 catches this; adjust template crewVariance ranges |
| Pre-seeded doubts + doubt drip creates unrecoverable spiral | Game too hard | Cap pre-seeded doubt severity at 2, limit to 1-2 doubts |
| Sensor degradation makes game unfair (player can't act on bad data) | Player frustration | Degradation reduces confidence (visible to player), doesn't fabricate |
| DISTRUST passive rate still too high after changes | Feature goal not met | Consequence hooks force physical aftermath from social triggers — if still too easy, add physical consequences to crew death |

---

## Open Questions

1. **Should consequence text be contextual in v1?** Current design uses existing social/epistemic proposal functions which generate generic text. Contextual text ("fire killed roughneck, crew is angry") would be more immersive but requires threading context through proposal functions. Proposal: defer to v2 — `pickSuspiciousCrew()` already selects stressed/injured crew, so the text will naturally reflect the game state.

2. **Should `createManifest` be kept alongside `generateManifest`?** Proposal: yes — `createManifest` for test fixtures (deterministic, no RNG needed), `generateManifest` for actual runs.

3. **How aggressively should recency suppress arc kinds?** Current proposal: 0.3x within 60 ticks, 0.6x within 120 ticks. If validation shows too few fires, increase the 60-tick window or weaken the 0.3 multiplier.
