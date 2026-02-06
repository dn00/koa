# Plan: Evidence Semantics Fix

**Discovery:** Inline (diagnostic scripts + balance report analysis)
**Status:** done

---

## Overview

Fix the broken deduction loop. Currently `compareEvidence` treats door logs (movement) as location assertions, so normal NPC walking creates false contradictions. Innocents have MORE contradictions than the culprit 78% of the time. The solver's 100% solve rate is fake (uses gossip text matching, not evidence comparison).

Fix: add micro-slices to windows, split evidence into presence/movement/claim semantics, rewrite compareEvidence with HARD/SOFT levels, guarantee culprit has 1+ HARD contradiction, make solver use evidence structure only.

---

## Diagnostic Results (validated before implementation)

Three diagnostic iterations (`scratchpad/diagnose-hard-soft.ts`) identified the working rule set:

**v1 (semantic tags, no slices):** Failed. Presence evidence is per-window, so any NPC who moved during a window triggered `presence_conflict` HARD. Innocents averaged 56-63 HARD vs culprit's 35. Result: 20-28% culprit most-caught.

**v2 (semantic tags + slices):** Improved but still bad. Testimony-vs-testimony `presence_conflict` fires massively because multiple witnesses observe the same NPC from adjacent rooms and generate contradicting location reports. Result: 32-43% culprit most-caught, innocents still averaging 48-53 HARD.

**v3 (STAY claim required for HARD):** Works. Key insight: **HARD requires a STAY claim on at least one side**. Testimony-vs-testimony is always SOFT (witnesses disagree = perspective, not lies). Only the culprit makes a false STAY claim, so only the culprit gets HARD contradictions.

| Metric | T1 | T2 | T3 | T4 |
|--------|----|----|----|----|
| Culprit has >= 1 HARD | 69% | 95% | 69% | 79% |
| Culprit most HARD | 69% | 95% | 69% | 79% |
| Innocent false positive rate | **0%** | **0%** | **0%** | **0%** |
| Avg culprit HARD | 2.9 | 4.5 | 2.8 | 3.1 |
| Avg max innocent HARD | 0.0 | 0.0 | 0.0 | 0.0 |

The 20-31% gap (culprit 0 HARD) = cases where no testimony/device evidence places culprit elsewhere during crime window. Fixed by `injectMinimalSignal` creating `MOTION_DETECTED` (presence device evidence) instead of `DOOR_OPENED` (movement).

---

## Requirements Expansion

### From R1: Evidence must have correct semantics

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | Each window has 3 slices (a/b/c) for time precision | `getSliceForTick` maps any tick to correct slice | 001 |
| R1.2 | Evidence carries semantic type (presence/movement/claim) | All derived evidence has `semantic` field set | 001, 002 |
| R1.3 | Testimony carries claim type (STAY/PASSING) when applicable | Culprit alibi has `claimType: 'STAY'`, witness sightings have appropriate types | 001, 002 |
| R1.4 | All new fields are optional (backward compatible) | Existing tests compile without changes | 001 |

### From R2: Contradictions must distinguish HARD from SOFT

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | STAY claim vs device presence elsewhere = HARD | Unit test: culprit STAY claim + motion sensor at different room | 003 |
| R2.2 | STAY claim vs testimony presence (conf >= 0.5) = HARD | Unit test: culprit STAY claim + witness saw them elsewhere | 003 |
| R2.3 | Device presence vs device presence same slice = HARD | Unit test: two sensors show same NPC at different places | 003 |
| R2.4 | STAY claim vs door log = SOFT_TENSION only | Door log never produces HARD by itself | 003 |
| R2.5 | Testimony vs testimony = SOFT (witnesses disagree = perspective) | Two witnesses placing same NPC differently = SOFT, never HARD | 003 |
| R2.6 | Movement vs Movement = NO_CONTRADICTION | Two door logs same window different places = no fire | 003 |
| R2.7 | CompareResult includes `level` field | Type check + runtime assertion | 003 |

### From R3: Culprit always has catchable HARD contradiction

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Culprit generates false STAY claim for crime window (all tiers) | Every case has culprit testimony with `claimType: 'STAY'` | 002 |
| R3.2 | Injected signal is MOTION_DETECTED (presence), not DOOR_OPENED (movement) | Signal event type check | 004 |
| R3.3 | Culprit has >= 1 HARD contradiction in 100% of validated cases | Balance report metric | 005, 006 |
| R3.4 | Innocents have 0 HARD contradictions by default | Balance report: max innocent HARD = 0 (tiers 1-3) | 005, 006 |

### From R4: Solver uses evidence structure, not gossip text

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | WHO deduction = suspect with most HARD contradictions | Solver no longer pattern-matches motive text for WHO | 006 |
| R4.2 | Motive is tiebreaker only, not primary signal | Solver ranks by HARD count first | 006 |
| R4.3 | New metrics track HARD/SOFT separately | SolveResult has culpritHardContradictions, culpritIsMostCaught | 006, 007 |
| R4.4 | Balance report shows deduction quality | Report includes `% culprit is most caught by HARD` | 007 |

---

## Dependency Graph

```
001 ──→ 002 ──→ 003 ──→ 006 ──→ 007
              ├──→ 004
              └──→ 005
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | S | - | Type foundation |
| 2 | 002 | M | Batch 1 | Evidence tagging + culprit STAY claim |
| 3 | 003, 004, 005 | M | Batch 2 | Parallel: compareEvidence, signal injection, validators |
| 4 | 006, 007 | M | Batch 3 | Solver + balance report |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Slice + semantic types | S | done |
| 002 | Tag evidence with semantics | M | done |
| 003 | HARD/SOFT compareEvidence | M | done |
| 004 | MOTION_DETECTED signal injection | S | done |
| 005 | Validator semantic updates | S | done |
| 006 | Evidence-only solver WHO | M | done |
| 007 | Balance report HARD/SOFT metrics | S | done |

---

## Task Details (Inline)

### Task 001: Slice + Semantic Types

**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4

#### Objective
Add micro-slice time precision and semantic evidence classification types so downstream code can distinguish presence from movement from claims.

#### Context
**Relevant Files:**
- `src/types.ts:95-118` — TimeWindow, WINDOWS, getWindowForTick
- `src/types.ts:281-345` — BaseEvidence, evidence interfaces, EvidenceItem union
- `src/types.ts:305-315` — TestimonyEvidence (needs claimType)

**Embedded Context:**
- Windows: W1-W6, each ~15 ticks (e.g., W1: ticks 0-15, W2: 16-30)
- `getSliceForTick(tick, windowId)`: divide tick range into 3 equal parts → `'a'|'b'|'c'`
- Example: W3 = ticks 31-45. Slice a=31-35, b=36-40, c=41-45. Returns `'W3.a'`, `'W3.b'`, `'W3.c'`
- `EvidenceSemantic`: `'presence'` (was at place), `'movement'` (crossed boundary), `'claim'` (self-report)
- `ClaimType`: `'STAY'` (was there whole window), `'PASSING'` (briefly visited)
- `ContradictionLevel`: `'HARD_CONTRADICTION'` | `'SOFT_TENSION'` | `'NO_CONTRADICTION'`
- All new fields optional on interfaces to maintain backward compat

#### Entry Points / Wiring
- `src/types.ts` — type definitions and helper function

#### Files Touched
- `src/types.ts` — add types, modify BaseEvidence and TestimonyEvidence

#### Acceptance Criteria
##### AC-1: Slice types defined <- R1.1
- Given: types.ts imported
- When: Using `Slice`, `SlicedWindowId` types
- Then: `'a'|'b'|'c'` and template literal type compile

##### AC-2: getSliceForTick works <- R1.1
- Given: W3 (ticks 31-45)
- When: `getSliceForTick(32, 'W3')`
- Then: Returns `'W3.a'`
- When: `getSliceForTick(38, 'W3')`
- Then: Returns `'W3.b'`
- When: `getSliceForTick(44, 'W3')`
- Then: Returns `'W3.c'`

##### AC-3: Semantic types defined <- R1.2
- Given: types.ts imported
- When: Using `EvidenceSemantic`
- Then: `'presence'|'movement'|'claim'` type compiles

##### AC-4: BaseEvidence extended <- R1.2
- Given: Any evidence item
- When: Setting `semantic` and `slice` fields
- Then: Type checks pass (fields are optional)

##### AC-5: TestimonyEvidence extended <- R1.3
- Given: TestimonyEvidence
- When: Setting `claimType: 'STAY'`
- Then: Type checks pass

##### AC-6: ContradictionLevel defined <- R2.5
- Given: types.ts imported
- When: Using `ContradictionLevel`
- Then: `'HARD_CONTRADICTION'|'SOFT_TENSION'|'NO_CONTRADICTION'` type compiles

##### AC-7: Backward compatible <- R1.4
- Given: Existing code constructing evidence without new fields
- When: Compiling
- Then: No type errors

#### Edge Cases
##### EC-1: Tick at window boundary
- Scenario: `getSliceForTick(31, 'W3')` (first tick of window)
- Expected: Returns `'W3.a'`

##### EC-2: Tick at slice boundary
- Scenario: `getSliceForTick(36, 'W3')` (first tick of slice b)
- Expected: Returns `'W3.b'`

#### Error Cases
##### ERR-1: Invalid window
- When: `getSliceForTick(999, 'W3')`
- Then: Falls back to slice `'c'` (last slice)

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | Slice types compile | `tests/evidence-semantics.test.ts` |
| AC-2 | getSliceForTick returns correct slices | `tests/evidence-semantics.test.ts` |
| AC-7 | Existing evidence compiles without new fields | `tests/evidence-semantics.test.ts` |
| EC-1 | Boundary tick handling | `tests/evidence-semantics.test.ts` |
| EC-2 | Slice boundary handling | `tests/evidence-semantics.test.ts` |

#### Notes
**Implementation Notes:**
**Review Notes:**

---

### Task 002: Tag Evidence with Semantics

**Complexity:** M
**Depends On:** 001
**Implements:** R1.2, R1.3, R3.1

#### Objective
Tag all derived evidence with `semantic`, `slice`, and `claimType` fields, and generalize the culprit false STAY claim to ALL difficulty tiers.

#### Context
**Relevant Files:**
- `src/evidence.ts:46-120` — derivePresence (presence evidence from MOVE events)
- `src/evidence.ts:335-605` — deriveTestimony (testimony from adjacent witnesses)
- `src/evidence.ts:120-200` — deriveDeviceLogs (device_log from sensor events)
- `src/evidence.ts:1313-1450` — deriveCulpritAlibiClaim (currently difficulty-gated)
- `src/types.ts` — new types from Task 001

**Embedded Context:**
- Event type → semantic mapping:
  - `NPC_MOVE`, `MOTION_DETECTED`, `CAMERA_SNAPSHOT`, `ITEM_TAKEN`, `ACTIVITY_STARTED` → `'presence'`
  - `DOOR_OPENED`, `DOOR_CLOSED` → `'movement'`
- Device type → semantic mapping:
  - `door_sensor` → `'movement'`
  - `motion_sensor`, `camera`, `wifi_presence` → `'presence'`
- Presence sighting testimony (line 540-598): witnesses report seeing NPCs in adjacent rooms → `semantic: 'presence'`, `claimType: 'STAY'`
- Culprit alibi: currently only generates on hard difficulty. Change to always generate base STAY lie.
- `getSliceForTick(event.tick, event.window)` for slice computation
- Anti-anticlimax rules must still apply (don't break INV-4/INV-5)

#### Entry Points / Wiring
- `src/evidence.ts` — all derive* functions

#### Files Touched
- `src/evidence.ts` — modify derivePresence, deriveTestimony, deriveDeviceLogs, deriveCulpritAlibiClaim

#### Acceptance Criteria
##### AC-1: Testimony from DOOR events tagged as movement <- R1.2
- Given: DOOR_OPENED event at tick 35 in W3
- When: deriveTestimony runs
- Then: Resulting testimony has `semantic: 'movement'`, `slice: 'W3.b'`

##### AC-2: Testimony from NPC_MOVE tagged as presence <- R1.2
- Given: NPC_MOVE event at tick 32 in W3
- When: deriveTestimony runs
- Then: Resulting testimony has `semantic: 'presence'`, `slice: 'W3.a'`

##### AC-3: Device logs tagged by sensor type <- R1.2
- Given: door_sensor event
- When: deriveDeviceLogs runs
- Then: DeviceLogEvidence has `semantic: 'movement'`
- Given: motion_sensor event
- Then: DeviceLogEvidence has `semantic: 'presence'`

##### AC-4: Presence sightings tagged as STAY <- R1.3
- Given: Witness observes NPC in adjacent room during window
- When: deriveTestimony generates presence sighting
- Then: Has `semantic: 'presence'`, `claimType: 'STAY'`

##### AC-5: Culprit STAY claim generated for all tiers <- R3.1
- Given: Tier 1 (tutorial) case
- When: deriveCulpritAlibiClaim runs
- Then: Produces testimony with `claimType: 'STAY'`, `semantic: 'claim'` for crime window

##### AC-6: Culprit STAY claim at non-crime-scene location <- R3.1
- Given: Any case
- When: deriveCulpritAlibiClaim runs
- Then: Alibi place !== crimePlace and !== hiddenPlace

##### AC-7: Anti-anticlimax preserved <- INV-4
- Given: Culprit at crime scene during crime window
- When: Evidence derived
- Then: Crime events still cap confidence <= 0.5, strip subject

#### Edge Cases
##### EC-1: Events with no tick (edge case)
- Scenario: Evidence item has no tick to compute slice from
- Expected: `slice` field omitted (undefined)

##### EC-2: Difficulty variations preserved
- Scenario: Hard mode competing narratives
- Expected: Still generated on top of base STAY claim

#### Error Cases
##### ERR-1: No alibi locations available
- When: All places are crimePlace or hiddenPlace
- Then: Falls back to first available place, no crash

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | DOOR testimony has movement semantic | `tests/evidence-semantics.test.ts` |
| AC-2 | MOVE testimony has presence semantic | `tests/evidence-semantics.test.ts` |
| AC-3 | Device logs tagged by sensor type | `tests/evidence-semantics.test.ts` |
| AC-4 | Presence sightings have STAY claim | `tests/evidence-semantics.test.ts` |
| AC-5 | Culprit STAY claim exists at all tiers | `tests/evidence-semantics.test.ts` |
| AC-6 | Alibi location not at crime scene | `tests/evidence-semantics.test.ts` |
| AC-7 | Anti-anticlimax still works | `tests/evidence-semantics.test.ts` |

#### Notes
**Implementation Notes:**
**Review Notes:**

---

### Task 003: HARD/SOFT compareEvidence

**Complexity:** M
**Depends On:** 002
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5, R2.6, R2.7

#### Objective
Rewrite `compareEvidence` to use semantic fields for HARD vs SOFT classification. HARD requires a STAY claim or device-vs-device on at least one side. Testimony-vs-testimony is always SOFT.

#### Context
**Relevant Files:**
- `src/actions.ts:257-408` — CompareResult type + compareEvidence function (5 current rules)
- `src/types.ts` — ContradictionLevel, EvidenceSemantic, ClaimType from Task 001

**Embedded Context:**

**Critical finding from diagnostics:** HARD must require a STAY claim on at least one side, or device-vs-device presence. Testimony-vs-testimony is ALWAYS SOFT because witnesses observing from different adjacent rooms legitimately disagree about NPC location (perspective, not lies). This is what eliminates innocent false positives to 0%.

- Each evidence item carries `source: 'device' | 'testimony'` (derivable from `kind`)
- `device_log` → source `device`; `testimony` → source `testimony`
- `claimType: 'STAY'` → the assertion that matters for HARD

**HARD rules (any of these → HARD_CONTRADICTION):**
1. STAY claim vs device presence (different place, same window) — `stay_vs_device_presence`
2. STAY claim vs testimony presence (conf >= 0.5, different place, same window) — `stay_vs_witness`
3. Device presence vs device presence (same NPC, same slice, different place) — `device_presence_conflict`

**SOFT rules (→ SOFT_TENSION):**
4. STAY claim vs movement evidence (door log) — `stay_vs_movement`
5. Testimony vs testimony (different places, same window) — `witness_disagree`
6. Testimony vs device presence (no STAY) — `testimony_vs_device`
7. Any presence vs movement — `presence_vs_movement`

**NONE rules:**
8. Movement vs movement — normal walking
9. Different windows — can't contradict
10. Same place — no conflict

- Slice overlap: `slicesOverlap(a, b)` — null (STAY/whole-window) overlaps everything; otherwise same slice required
- CompareResult: keep `contradiction: boolean` for backward compat, add `level: ContradictionLevel`

#### Entry Points / Wiring
- `src/actions.ts` — compareEvidence function (called by game.ts, solver.ts)

#### Files Touched
- `src/actions.ts` — rewrite compareEvidence, update CompareResult type

#### Acceptance Criteria
##### AC-1: STAY vs device presence = HARD <- R2.1
- Given: Testimony `claimType: 'STAY'` at place A during W3, device_log `semantic: 'presence'` showing same NPC at place B during W3
- When: compareEvidence called
- Then: Returns `level: 'HARD_CONTRADICTION'`, rule `'stay_vs_device_presence'`

##### AC-2: STAY vs testimony presence (conf >= 0.5) = HARD <- R2.2
- Given: Testimony `claimType: 'STAY'` at place A, testimony placing same NPC at place B (conf 0.6)
- When: compareEvidence called
- Then: Returns `level: 'HARD_CONTRADICTION'`, rule `'stay_vs_witness'`

##### AC-3: Device presence vs device presence same slice = HARD <- R2.3
- Given: Two device_log items `semantic: 'presence'`, same NPC, same slice, different places
- When: compareEvidence called
- Then: Returns `level: 'HARD_CONTRADICTION'`, rule `'device_presence_conflict'`

##### AC-4: STAY vs door log = SOFT <- R2.4
- Given: Testimony `claimType: 'STAY'` at place A, door log `semantic: 'movement'` at place B
- When: compareEvidence called
- Then: Returns `level: 'SOFT_TENSION'`, rule `'stay_vs_movement'`

##### AC-5: Testimony vs testimony = SOFT always <- R2.5
- Given: Two testimonies, same NPC, same window, different places, high confidence
- When: compareEvidence called
- Then: Returns `level: 'SOFT_TENSION'`, rule `'witness_disagree'`, **never** HARD

##### AC-6: Door log vs door log = NO_CONTRADICTION <- R2.6
- Given: Two door logs, same NPC, same window, different places
- When: compareEvidence called
- Then: Returns `contradiction: false`

##### AC-7: CompareResult has level field <- R2.7
- Given: Any compareEvidence call returning contradiction
- When: Result inspected
- Then: `level` field is set to a ContradictionLevel value

##### AC-8: Backward compat — contradiction boolean
- Given: Any compareEvidence call
- Then: `contradiction: true` iff level is HARD or SOFT; `false` iff NONE

##### AC-9: Slice overlap enforced
- Given: STAY claim at W3, device presence at W3.b
- Then: HARD (STAY covers all slices)
- Given: Device presence at W3.a, device presence at W3.c
- Then: NO_CONTRADICTION (different slices, NPC could have moved)

#### Edge Cases
##### EC-1: Evidence without semantic field (legacy)
- Scenario: Old evidence items with no `semantic` field
- Expected: Fall back to kind-based inference (device_log door_sensor → movement, etc.)

##### EC-2: STAY claim vs low-confidence testimony (< 0.5)
- Scenario: STAY claim vs testimony at different place, testimony confidence 0.3
- Expected: `SOFT_TENSION` not `HARD_CONTRADICTION`

##### EC-3: Different windows
- Scenario: Two items different windows
- Expected: `NO_CONTRADICTION`

#### Error Cases
##### ERR-1: Same evidence compared
- When: Same ID for both
- Then: Returns `success: false` with message

##### ERR-2: Unknown evidence ID
- When: ID not in known evidence
- Then: Returns `success: false` with message

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | STAY vs device presence = HARD | `tests/evidence-semantics.test.ts` |
| AC-2 | STAY vs witness = HARD | `tests/evidence-semantics.test.ts` |
| AC-3 | Device vs device presence = HARD | `tests/evidence-semantics.test.ts` |
| AC-4 | STAY vs door log = SOFT | `tests/evidence-semantics.test.ts` |
| AC-5 | Testimony vs testimony = SOFT always | `tests/evidence-semantics.test.ts` |
| AC-6 | Door vs door = NO_CONTRADICTION | `tests/evidence-semantics.test.ts` |
| AC-7 | Level field present | `tests/evidence-semantics.test.ts` |
| AC-8 | Boolean backward compat | `tests/evidence-semantics.test.ts` |
| AC-9 | Slice overlap logic | `tests/evidence-semantics.test.ts` |
| EC-1 | Legacy evidence fallback | `tests/evidence-semantics.test.ts` |
| EC-2 | Low-conf testimony = SOFT | `tests/evidence-semantics.test.ts` |

#### Notes
**Implementation Notes:**
**Review Notes:**

---

### Task 004: MOTION_DETECTED Signal Injection

**Complexity:** S
**Depends On:** 002
**Implements:** R3.2

#### Objective
Change `injectMinimalSignal` to create MOTION_DETECTED (presence evidence) instead of DOOR_OPENED (movement evidence), ensuring the injected signal can form a HARD contradiction against the culprit's false STAY claim.

#### Context
**Relevant Files:**
- `src/sim.ts:77-160` — injectMinimalSignal function
- `src/types.ts:180` — `MOTION_DETECTED` event type (already exists)

**Embedded Context:**
- Current: creates `DOOR_OPENED` event at adjacent room → becomes `semantic: 'movement'` → can only create SOFT_TENSION
- Changed: create `MOTION_DETECTED` event at adjacent room → becomes `semantic: 'presence'` → creates HARD_CONTRADICTION against STAY claim
- Keep anti-anticlimax: place at adjacent room (not crimePlace) to preserve actor in evidence derivation
- `computeEventId` needs `type: 'MOTION_DETECTED'` instead of `'DOOR_OPENED'`
- No `target` (door ID) needed for motion sensor — find a motion sensor at the adjacent place, or create event without target

#### Entry Points / Wiring
- `src/sim.ts` — injectMinimalSignal (called by generateValidatedCase)

#### Files Touched
- `src/sim.ts` — modify injectMinimalSignal

#### Acceptance Criteria
##### AC-1: Injected event is MOTION_DETECTED <- R3.2
- Given: Case needs signal injection
- When: injectMinimalSignal runs
- Then: Created event has `type: 'MOTION_DETECTED'`

##### AC-2: Event placed at adjacent room <- INV-4
- Given: Crime at place X
- When: injectMinimalSignal runs
- Then: Event `place` is adjacent to X, not X itself

##### AC-3: Event preserves actor (culprit ID) <- R3.3
- Given: Injected MOTION_DETECTED event
- When: Evidence derived
- Then: Resulting device_log/presence evidence has `actor: culpritId`

##### AC-4: Deterministic <- INV-7
- Given: Same seed
- When: Running twice
- Then: Identical injected event

#### Edge Cases
##### EC-1: No motion sensors at adjacent rooms
- Scenario: Adjacent rooms lack motion sensors
- Expected: Create event anyway (device field can reference door sensor room or be synthetic)

#### Error Cases
##### ERR-1: No adjacent places
- When: Crime place has no adjacents
- Then: Returns null (same as current behavior)

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | Injected event type is MOTION_DETECTED | `tests/evidence-semantics.test.ts` |
| AC-2 | Event at adjacent room | `tests/evidence-semantics.test.ts` |
| AC-3 | Actor preserved in evidence | `tests/evidence-semantics.test.ts` |
| AC-4 | Deterministic injection | `tests/evidence-semantics.test.ts` |

#### Notes
**Implementation Notes:**
**Review Notes:**

---

### Task 005: Validator Semantic Updates

**Complexity:** S
**Depends On:** 002
**Implements:** R3.3, R3.4

#### Objective
Update `analyzeSignal` and contradiction finders to use semantic fields and only count HARD contradictions for the keystone pair.

#### Context
**Relevant Files:**
- `src/validators.ts:48-149` — analyzeSignal (checks culprit has catchable signal)
- `src/validators.ts:163-280` — findImplicatingChains, findWhoChains

**Embedded Context:**
- Current analyzeSignal checks:
  1. Self-contradiction: presence at two places same window → keep, now requires `semantic: 'presence'`
  2. Device contradiction: presence vs device_log → now only HARD if device_log is `semantic: 'presence'`
  3. Scene presence: device_log at crime scene → keep but tag as medium
- New signal hierarchy:
  1. `hard_claim_contradiction` — culprit STAY claim vs presence elsewhere (strongest, guaranteed)
  2. `hard_presence_conflict` — two presence items different places same slice
  3. `scene_presence` — presence evidence at crime scene (medium)
  4. `opportunity_only` — no signal (needs injection)
- findImplicatingChains: movement evidence (door logs) should have lower confidence than presence evidence

#### Entry Points / Wiring
- `src/validators.ts` — analyzeSignal (called by generateValidatedCase)

#### Files Touched
- `src/validators.ts` — modify analyzeSignal, findImplicatingChains

#### Acceptance Criteria
##### AC-1: analyzeSignal detects STAY vs presence contradiction <- R3.3
- Given: Culprit has STAY claim at place A, presence evidence at place B, same window
- When: analyzeSignal runs
- Then: Returns `signalType: 'hard_claim_contradiction'`, `signalStrength: 'strong'`

##### AC-2: Movement-only evidence not counted as strong signal
- Given: Culprit has STAY claim, only door logs (movement) contradict
- When: analyzeSignal runs
- Then: Does NOT return `signalStrength: 'strong'` (door logs are SOFT)

##### AC-3: 100% of validated cases have HARD signal <- R3.3
- Given: 50 seeds, all tiers
- When: generateValidatedCase + analyzeSignal
- Then: Every case has `hasSignal: true` with `signalStrength: 'strong'`

##### AC-4: Implicating chains weight presence over movement
- Given: findImplicatingChains
- When: Presence chain vs device (movement) chain
- Then: Presence chain has higher confidence

#### Edge Cases
##### EC-1: Legacy evidence without semantic
- Scenario: Evidence items lack `semantic` field
- Expected: Falls back to current logic (kind-based matching)

#### Error Cases
##### ERR-1: No culpritId
- When: config.culpritId missing
- Then: Throws Error (existing behavior)

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | STAY vs presence = strong signal | `tests/evidence-semantics.test.ts` |
| AC-2 | Movement-only = not strong | `tests/evidence-semantics.test.ts` |
| AC-3 | 100% validated cases have HARD signal | `tests/evidence-semantics.test.ts` |
| AC-4 | Presence chain > movement chain confidence | `tests/evidence-semantics.test.ts` |

#### Notes
**Implementation Notes:**
**Review Notes:**

---

### Task 006: Evidence-Only Solver WHO

**Complexity:** M
**Depends On:** 003
**Implements:** R4.1, R4.2, R4.3

#### Objective
Remove gossip text pattern matching from WHO deduction. Solver identifies culprit by counting HARD contradictions per suspect.

#### Context
**Relevant Files:**
- `src/solver.ts:170-280` — buildSmartAccusation (WHO deduction)
- `src/solver.ts:100-143` — findAllContradictions
- `src/solver.ts:244-265` — motiveSignatures dictionary (TO REMOVE)
- `src/solver.ts:20-50` — SolveResult interface

**Embedded Context:**
- Current WHO logic:
  1. Count self-contradictions, crime-scene lies, device contradictions per suspect
  2. Pattern-match gossip text against `motiveSignatures` dictionary (the cheat)
  3. Prefer suspects with both signature motive + contradictions
- New WHO logic:
  1. Count HARD contradictions per suspect (from compareEvidence `level` field)
  2. Count SOFT_TENSION per suspect (secondary signal)
  3. WHO = suspect with most HARD. Ties broken by: SOFT count > motive exists > first alphabetically
  4. Motive used ONLY for WHY field, not WHO field
- `findAllContradictions` needs to parse `level` from CompareResult and track separately
- New SolveResult metrics: `culpritHardContradictions`, `maxInnocentHardContradictions`, `culpritIsMostCaught`

#### Entry Points / Wiring
- `src/solver.ts` — solve function (called by smart-solver.ts)

#### Files Touched
- `src/solver.ts` — modify findAllContradictions, buildSmartAccusation, SolveResult

#### Acceptance Criteria
##### AC-1: WHO deduction uses HARD count only <- R4.1
- Given: Culprit has 2 HARD contradictions, innocent has 3 SOFT
- When: buildSmartAccusation runs
- Then: Accuses culprit (HARD > SOFT)

##### AC-2: No gossip text matching for WHO <- R4.1
- Given: Solver code
- When: Searching for `motiveSignatures`
- Then: Dictionary removed; WHO not derived from motive text

##### AC-3: Motive is tiebreaker only <- R4.2
- Given: Two suspects with 1 HARD each, one has motive
- When: buildSmartAccusation runs
- Then: Accuses suspect with motive (tiebreaker)

##### AC-4: New metrics populated <- R4.3
- Given: solve() runs
- When: Result returned
- Then: `metrics.culpritHardContradictions`, `metrics.maxInnocentHardContradictions`, `metrics.culpritIsMostCaught` are set

##### AC-5: Solve rate >= 80% on tiers 1-4 <- INV-1
- Given: 100 seeds per tier
- When: Running solver
- Then: Core correct (WHO+WHAT+WHEN+WHERE) >= 80%

#### Edge Cases
##### EC-1: No HARD contradictions found
- Scenario: Evidence tagging or injection failed
- Expected: Falls back to SOFT count, then motive

##### EC-2: Multiple suspects tied on HARD
- Scenario: Two suspects with 1 HARD each
- Expected: Tiebreak by SOFT count, then motive

#### Error Cases
##### ERR-1: compareEvidence returns no level (legacy)
- When: `level` field missing from CompareResult
- Then: Treats `contradiction: true` as HARD (backward compat)

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | HARD count beats SOFT count | `tests/evidence-semantics.test.ts` |
| AC-2 | No motiveSignatures in code | `tests/evidence-semantics.test.ts` |
| AC-4 | New metrics populated | `tests/evidence-semantics.test.ts` |
| AC-5 | Solve rate >= 80% | `tests/evidence-semantics.test.ts` |

#### Notes
**Implementation Notes:**
**Review Notes:**

---

### Task 007: Balance Report HARD/SOFT Metrics

**Complexity:** S
**Depends On:** 006
**Implements:** R4.4

#### Objective
Update the smart-solver balance report to show HARD vs SOFT contradiction metrics.

#### Context
**Relevant Files:**
- `scripts/smart-solver.ts:106-145` — tuning metrics section
- `src/solver.ts` — SolveResult with new metrics from Task 006

**Embedded Context:**
- New report sections:
  - `% culprit has highest HARD count` (target: >= 90%)
  - `% culprit has >= 1 HARD contradiction` (target: 100%)
  - `avg HARD contradictions: culprit vs max innocent`
  - `avg SOFT_TENSION per case` (noise metric, lower is better)
- These replace the current `Self-contradiction` / `Crime scene lie` / `Signature motive` breakdown

#### Entry Points / Wiring
- `scripts/smart-solver.ts` — report output

#### Files Touched
- `scripts/smart-solver.ts` — add HARD/SOFT report section

#### Acceptance Criteria
##### AC-1: HARD contradiction metrics in report <- R4.4
- Given: Balance report runs
- When: Output printed
- Then: Shows `% culprit most caught by HARD`, `% with >= 1 HARD`, `avg HARD culprit vs innocent`

##### AC-2: SOFT noise metric in report <- R4.4
- Given: Balance report runs
- When: Output printed
- Then: Shows `avg SOFT_TENSION per case`

#### Edge Cases
##### EC-1: No games with metrics
- Scenario: All games failed sim
- Expected: Skips metrics section gracefully

#### Error Cases
None.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | Report contains HARD metrics | manual verification |
| AC-2 | Report contains SOFT metrics | manual verification |

#### Notes
**Implementation Notes:**
**Review Notes:**

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| False STAY claim for all cases might be discoverable too easily on tutorial | Low | Tutorial already hand-holds; direct contradiction is the intended experience |
| MOTION_DETECTED injection at adjacent room might not have witnesses | Medium | Adjacent rooms typically have NPCs; fallback to door sensor location |
| Removing gossip text matching drops WHO accuracy initially | Medium | HARD contradiction guarantee means structural deduction works; balance report validates |
| Old tests rely on current contradiction rules | Medium | Update tests alongside rule changes; all new fields optional |
| Anti-anticlimax rules interact with new semantics | High | Test explicitly: crime-window culprit events still capped at 0.5 confidence, still strip subject |

---

## Diagnostic Iteration Log

Kept for reference so future changes don't repeat mistakes:

1. **Slices alone don't help** — presence evidence is per-window, so same-window movement still self-conflicts. Need semantic tagging too.
2. **Semantic tags + slices don't help** — testimony-vs-testimony presence_conflict fires massively on innocents because multiple witnesses observe same NPC from different adjacent rooms. This is perspective, not lies.
3. **STAY claim requirement is the key** — HARD needs a STAY claim on one side (or device-vs-device). Only the culprit makes a false STAY claim. This drops innocent false positive rate to 0%. The 20-31% gap where culprit has 0 HARD is fixed by signal injection (MOTION_DETECTED).

---

## Open Questions

None — all architectural decisions resolved during discovery and validated by diagnostics.
