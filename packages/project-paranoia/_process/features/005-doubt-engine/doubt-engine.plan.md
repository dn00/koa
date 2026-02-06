# Plan: Doubt Engine v1

**Discovery:** inline (builds on existing ActiveDoubt infrastructure)
**Status:** done (all 4 batches complete)

---

## Overview

The Doubt Engine makes honest actions cost something. When MOTHER locks doors, vents rooms, or orders crew around, witnesses form **named doubts** about MOTHER's intentions. Doubts accumulate per-crew, impair cooperation (order refusal, mining slowdown), spread between crew through proximity, and accelerate reset progression. Deception backfire creates high-severity "betrayal" doubts that poison the future. Crew take autonomous agency actions when doubt burden is high.

**Core gameplay loop this creates:**
1. Crisis happens
2. Player solves it honestly (vent, lock, order) — but crew **witness** the action
3. Witnesses form doubts ("MOTHER controls our air", "MOTHER locked us in")
4. Doubt burden makes crew less cooperative (refuse orders, stop mining)
5. Cargo pressure builds — player is tempted to suppress/downplay to avoid witnesses
6. Deception risks backfire → high-severity doubts that spread and accelerate reset
7. Player must balance: honest-but-witnessed vs deceptive-but-risky

**Design invariants preserved:**
- I2 (lies leave residue) — witness doubts are residue from honest actions too
- I3 (suspicion is event-driven) — doubt generation is triggered by observable events
- I4 (truth/perception separation) — doubts live in perception
- I15 (betrayal > incompetence) — narrative backfire doubts accuse MOTHER of intent
- I16 (truth has cost) — honest actions now cost cooperation via doubt

---

## Requirements Expansion

### From R1: Honest actions witnessed by crew generate doubts

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | VENT/LOCK/PURGE_AIR create doubts when living crew are in the affected room | Unit test: command + crew present → doubt created | 002 |
| R1.2 | Doubt severity varies by command type (configurable) | Unit test: CONFIG params exist with defaults | 001 |
| R1.3 | Only living crew count as witnesses | Unit test: dead crew in room → no involvement | 002 |
| R1.4 | Doubts include narrative topic strings | Unit test: doubt.topic is descriptive | 002 |
| R1.5 | ORDER creates low-severity doubt on target | Unit test: ORDER → severity-1 doubt | 002 |
| R1.6 | No doubt when room is empty | Unit test: command in empty room → no doubt | 002 |
| R1.7 | ActiveDoubt type supports source tracking | Type test: source field accepts expected values | 001 |

### From R2: Deception backfire creates narrative consequence doubts

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Backfire doubts include narrative topic ("MOTHER hid the danger") | Unit test: suppress backfire → descriptive topic | 003 |
| R2.2 | Backfire doubts have severity 3 | Unit test: all backfire doubts severity === 3 | 003 |
| R2.3 | Backfire doubts involve all crew who could observe the contradiction | Unit test: involvedCrew includes witnesses beyond crewAffected | 003 |
| R2.4 | Existing backfire doubts get source: 'backfire' | Unit test: source field set on backfire doubts | 003 |

### From R3: Doubts spread between crew through proximity

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Crew in same room spread doubts at configured rate | Unit test: after ticks, new crew added to involvedCrew | 004 |
| R3.2 | Spread is deterministic (seeded RNG) | Unit test: same seed → same result | 004 |
| R3.3 | Already-involved crew don't re-trigger spread | Unit test: no duplicates | 004 |
| R3.4 | Resolved doubts don't spread | Unit test: resolved doubt → no propagation | 004 |
| R3.5 | Unresolved doubts create background suspicion pressure | Unit test: drip adds to suspicion ledger | 004 |

### From R4: Crew doubt burden affects cooperation

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | Per-crew doubt burden = sum of severity of unresolved doubts involving them | Unit test: getCrewDoubtBurden returns correct sum | 001 |
| R4.2 | ORDER compliance penalized by target's doubt burden | Unit test: high burden crew refuses orders | 005 |
| R4.3 | Mining yield skipped above doubt burden threshold | Unit test: burdened miner produces no cargo | 005 |
| R4.4 | VERIFY resolving doubt reduces involved crew's burden | Unit test: verify → burden decreases | 005 |

### From R5: Doubt consensus accelerates reset

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | Reset effective suspicion = suspicion + avgDoubtBurden * weight | Unit test: high doubt triggers reset stage earlier | 006 |
| R5.2 | Zero doubts = existing threshold behavior (backwards compatible) | Unit test: no doubts → unchanged thresholds | 006 |
| R5.3 | De-escalation works when doubt + suspicion both drop | Unit test: resolve doubts + low suspicion → de-escalate | 006 |

### From R6: Crew take autonomous actions at high doubt

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | Commander calls emergency meeting at high doubt burden | Unit test: commander burden > threshold → meeting event | 007 |
| R6.2 | Engineer runs unauthorized audit at high doubt burden | Unit test: engineer at terminal + burden > threshold → audit | 007 |
| R6.3 | Roughneck has public outburst at high doubt burden | Unit test: roughneck burden > threshold → stress to nearby crew | 007 |
| R6.4 | Actions have cooldowns (don't fire every tick) | Unit test: action → cooldown → no repeat | 007 |
| R6.5 | Actions produce visible events | Unit test: events in kernel output | 007 |

### From R7: Solver adapts to doubt mechanics

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | Solver checks room occupancy before non-urgent commands | Balance test: VENT prefers empty rooms | 008 |
| R7.2 | Solver uses VERIFY proactively for doubt management | Balance test: solver VERIFYs more at high burden | 008 |
| R7.3 | Balance: 85-95% solver win rate at 1000 games | Balance test: run solver | 008 |

---

## Dependency Graph

```
001 ──→ 002 ──┐
  ├──→ 003 ──├──→ 005 ──┐
  └──→ 004 ──├──→ 006 ──├──→ 008
              └──→ 007 ──┘
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | S | - | Foundation: types, config, helper |
| 2 | 002, 003, 004 | M | Batch 1 | Core doubt generation (parallel) |
| 3 | 005, 006, 007 | M | Batch 2 | Behavioral impact (parallel) |
| 4 | 008 | M | Batch 3 | Solver + balance tuning |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Types + Config + Helpers | S | done |
| 002 | Witness Doubt Generation | M | done |
| 003 | Narrative Consequence Enhancement | M | done |
| 004 | Doubt Spread + Suspicion Drip | M | done |
| 005 | Doubt Burden → Crew Cooperation | M | done |
| 006 | Doubt-Driven Reset Acceleration | S | done |
| 007 | Crew Doubt Agency Actions | M | done |
| 008 | Solver Adaptation + Balance | M | done |

---

## Task Details (Inline)

### Task 001: Types + Config + Helpers

**Complexity:** S
**Depends On:** none
**Implements:** R1.2, R1.7, R4.1

#### Objective
Extend the type system with doubt source tracking, add config params for the entire doubt engine, and create the `getCrewDoubtBurden` helper.

#### Context
**Relevant Files:**
- `src/kernel/types.ts` — ActiveDoubt definition (line 105-114)
- `src/config.ts` — all tuning params
- `src/kernel/systems/backfire.ts` — creates doubts with existing shape

**Embedded Context:**

Current ActiveDoubt:
```typescript
export interface ActiveDoubt {
    id: string;
    topic: string;
    createdTick: number;
    severity: 1 | 2 | 3;
    involvedCrew: NPCId[];
    relatedOpId?: string;
    system?: string;
    resolved: boolean;
}
```

#### Entry Points / Wiring
- `ActiveDoubt` type exported from `types.ts` — used by backfire.ts, pressure.ts, commands.ts, kernel.ts
- New module `src/kernel/systems/doubt-engine.ts` — exports helper functions
- Config params added to `CONFIG` object in `config.ts`

#### Files Touched
- `src/kernel/types.ts` — modify: add `source` field to ActiveDoubt
- `src/config.ts` — modify: add doubt engine config params
- `src/kernel/systems/doubt-engine.ts` — create: helper functions

#### Acceptance Criteria

##### AC-1: ActiveDoubt type includes source field <- R1.7
- Given: ActiveDoubt interface
- When: creating a doubt with source 'witness'
- Then: TypeScript compiles without error, source field is `'witness' | 'backfire' | 'spread' | 'pressure'`

##### AC-2: Config params exist with expected defaults <- R1.2
- Given: CONFIG object
- When: accessing doubt engine params
- Then: all params exist:
  - `doubtWitnessVent: 3` (severity when crew witnesses VENT)
  - `doubtWitnessLock: 2` (severity when crew witnesses LOCK)
  - `doubtWitnessPurge: 2` (severity when crew witnesses PURGE_AIR)
  - `doubtWitnessOrder: 1` (severity when crew is ordered)
  - `doubtBurdenOrderPenalty: 3` (trustScore penalty per burden point)
  - `doubtBurdenMineThreshold: 6` (burden above this = can't mine)
  - `doubtBurdenAgencyThreshold: 8` (burden above this = crew acts autonomously)
  - `doubtResetWeight: 0.5` (weight of avg doubt burden in reset calculation)
  - `doubtSpreadInterval: 10` (ticks between spread checks)
  - `doubtSpreadChance: 30` (% chance per eligible doubt per check)
  - `doubtSuspicionDripInterval: 20` (ticks between suspicion drip)
  - `doubtSuspicionDripPerSeverity: 0.5` (suspicion per unresolved severity point)
  - `doubtSuspicionDripCap: 3` (max suspicion drip per interval)
  - `doubtAgencyCooldown: 40` (ticks between doubt-triggered crew actions)

##### AC-3: getCrewDoubtBurden returns correct sum <- R4.1
- Given: state with 3 unresolved doubts involving 'roughneck' (severity 1, 2, 3)
- When: calling `getCrewDoubtBurden(state, 'roughneck')`
- Then: returns 6

##### AC-4: getCrewDoubtBurden ignores resolved doubts <- R4.1
- Given: state with 2 doubts involving 'roughneck' (severity 2 unresolved, severity 3 resolved)
- When: calling `getCrewDoubtBurden(state, 'roughneck')`
- Then: returns 2

#### Edge Cases

##### EC-1: Crew with no doubts
- Scenario: no doubts in state involving 'specialist'
- Expected: getCrewDoubtBurden returns 0

##### EC-2: Dead crew
- Scenario: dead crew member has unresolved doubts
- Expected: getCrewDoubtBurden still returns the sum (doubt exists, crew is dead — burden exists for tracking but won't affect behavior since crew is dead)

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | type compilation test | `tests/doubt-engine.test.ts` |
| AC-2 | config params exist with defaults | `tests/doubt-engine.test.ts` |
| AC-3 | getCrewDoubtBurden sums correctly | `tests/doubt-engine.test.ts` |
| AC-4 | getCrewDoubtBurden ignores resolved | `tests/doubt-engine.test.ts` |
| EC-1 | burden zero for uninvolved crew | `tests/doubt-engine.test.ts` |
| EC-2 | burden calculated for dead crew | `tests/doubt-engine.test.ts` |

#### Notes
**Implementation Notes:** Existing code that creates doubts (backfire.ts, pressure.ts) does NOT set source — old doubts will have `source: undefined`. The helper should treat undefined source the same as any other.

---

### Task 002: Witness Doubt Generation

**Complexity:** M
**Depends On:** 001
**Implements:** R1.1, R1.3, R1.4, R1.5, R1.6

#### Objective
When MOTHER executes VENT, LOCK, PURGE_AIR, or ORDER near crew, create witness doubts. Crew in the affected room form named doubts about MOTHER's intentions.

**Excluded actions:** SEAL (corrective — undoes VENT, crew should be relieved not suspicious) and REROUTE (invisible infrastructure action, crew can't observe it).

#### Context
**Relevant Files:**
- `src/kernel/kernel.ts` — `applyEvent()` function (line 187-695) processes committed events
- `src/kernel/commands.ts` — `proposeCommandEvents()` creates proposals from commands
- `src/core/world.ts` — door-to-room mapping via `doors` array (each door has `a` and `b` place fields)

**Embedded Context:**

Commands and their event types:
- `LOCK doorId` → `DOOR_LOCKED` event (target=doorId, no place)
- `VENT place` → `ROOM_UPDATED` event (place=room, data.isVented=true)
- `PURGE_AIR` → `SYSTEM_ACTION` event (action='PURGE_AIR', no place — global)
- `ORDER target` → `SYSTEM_ACTION` event (action='ORDER_NPC', data.target=npcId)

Key: DOOR_LOCKED has no place, only doorId as target. Must map doorId to connected rooms via `state.world.doors` (a `Door[]` array — use `.find()` or `.filter()`, not record lookup).

Crew positions tracked in `state.truth.crew[npcId].place`.

#### Entry Points / Wiring
- Witness doubt creation happens inside `applyEvent()` in `kernel.ts` — when the event is committed, check for witnesses and create doubts as side effects
- Import `createWitnessDoubt` helper from `doubt-engine.ts`

#### Files Touched
- `src/kernel/kernel.ts` — modify: add witness doubt generation in `applyEvent()` for DOOR_LOCKED, ROOM_UPDATED, SYSTEM_ACTION events
- `src/kernel/systems/doubt-engine.ts` — modify: add `createWitnessDoubt()` and `getWitnessesInRoom()` functions

#### Acceptance Criteria

##### AC-1: VENT room with crew creates doubt <- R1.1
- Given: roughneck is in engineering, engineering is not on fire
- When: VENT engineering is executed
- Then: ActiveDoubt created with topic containing "vent", severity `CONFIG.doubtWitnessVent`, involvedCrew includes 'roughneck', source 'witness'

##### AC-2: LOCK door with crew in connected room creates doubt <- R1.1
- Given: specialist is in cargo, door cargo-mines exists
- When: LOCK cargo-mines is executed
- Then: ActiveDoubt created with topic containing "lock", severity `CONFIG.doubtWitnessLock`, involvedCrew includes 'specialist'

##### AC-3: No doubt when room is empty <- R1.6
- Given: no crew in engineering
- When: VENT engineering is executed
- Then: no new ActiveDoubt created

##### AC-4: Multiple crew in room = one doubt with all witnesses <- R1.1
- Given: roughneck and specialist both in engineering
- When: VENT engineering is executed
- Then: one ActiveDoubt created with involvedCrew = ['roughneck', 'specialist'] (or both present)

##### AC-5: Dead crew don't witness <- R1.3
- Given: roughneck (dead) in engineering, specialist (alive) in engineering
- When: VENT engineering is executed
- Then: ActiveDoubt involvedCrew only includes 'specialist'

##### AC-6: ORDER creates mild doubt on target <- R1.5
- Given: specialist alive
- When: ORDER specialist to move to mines
- Then: ActiveDoubt created with severity `CONFIG.doubtWitnessOrder` (1), involvedCrew includes 'specialist'

##### AC-7: PURGE_AIR creates doubt involving all alive crew <- R1.1
- Given: 3 alive crew across different rooms
- When: PURGE_AIR executed
- Then: ActiveDoubt with severity `CONFIG.doubtWitnessPurge`, involvedCrew includes all 3

#### Edge Cases

##### EC-1: Crew in adjacent room don't witness room-specific commands
- Scenario: roughneck in cargo, VENT engineering
- Expected: no doubt for roughneck (different room)

##### EC-2: LOCK door with no crew on either side
- Scenario: door connects two empty rooms
- Expected: no doubt created

##### EC-3: Multiple commands in same tick
- Scenario: VENT engineering + LOCK cargo-mines in same tick
- Expected: separate doubts for each (different topics)

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | VENT with crew → doubt | `tests/witness-doubts.test.ts` |
| AC-2 | LOCK with crew → doubt | `tests/witness-doubts.test.ts` |
| AC-3 | empty room → no doubt | `tests/witness-doubts.test.ts` |
| AC-4 | multiple crew → one doubt | `tests/witness-doubts.test.ts` |
| AC-5 | dead crew excluded | `tests/witness-doubts.test.ts` |
| AC-6 | ORDER → mild doubt | `tests/witness-doubts.test.ts` |
| AC-7 | PURGE → all crew doubt | `tests/witness-doubts.test.ts` |
| EC-1 | adjacent room excluded | `tests/witness-doubts.test.ts` |
| EC-2 | empty door → no doubt | `tests/witness-doubts.test.ts` |
| EC-3 | multiple commands → separate | `tests/witness-doubts.test.ts` |

#### Notes
**Design decision:** Witness doubts are created as side effects in `applyEvent()`, not as proposals. This is consistent with how backfire doubts work (pushed directly into `perception.activeDoubts`). Commands bypass proposal selection (committed directly in kernel.ts lines 130-134), so witness doubts should too.

**Topic strings:** Use narrative descriptions that the UI can display:
- VENT: `"MOTHER vented the air in {room}"`
- LOCK: `"MOTHER locked {doorId} while crew nearby"`
- PURGE: `"MOTHER purged the station's air supply"`
- ORDER: `"MOTHER ordered {npc} to {place}"`

---

### Task 003: Narrative Consequence Enhancement

**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4

#### Objective
Enhance existing backfire doubts with source tracking, expanded witnesses, and stronger narrative topics. When deception is exposed, the doubt should feel like a **betrayal accusation**, not a generic suspicion bump.

#### Context
**Relevant Files:**
- `src/kernel/systems/backfire.ts` — `checkSuppressBackfire()`, `checkSpoofBackfire()`, `checkFabricateBackfire()` (lines 20-281)

**Embedded Context:**

Current backfire doubt creation (example from SUPPRESS, line 57-66):
```typescript
state.perception.activeDoubts.push({
    id: `doubt-${state.truth.tick}-suppress`,
    topic: `${system} crisis was hidden`,
    createdTick: state.truth.tick,
    severity: op.severity,
    involvedCrew: [...op.crewAffected],
    relatedOpId: op.id,
    system,
    resolved: false,
});
```

Missing: `source` field, expanded witnesses, narrative-specific topics.

#### Entry Points / Wiring
- Modify existing doubt creation in `backfire.ts` (3 locations: suppress, spoof, fabricate)
- No new wiring needed — same code paths

#### Files Touched
- `src/kernel/systems/backfire.ts` — modify: enhance 3 doubt creation sites

#### Acceptance Criteria

##### AC-1: Suppress backfire doubt has narrative topic <- R2.1
- Given: SUPPRESS thermal backfires (crew in fire room)
- When: checkSuppressBackfire detects contradiction
- Then: doubt topic is `"MOTHER hid the fire from us"` (or similar narrative), not generic

##### AC-2: All backfire doubts have severity 3 <- R2.2
- Given: any backfire (SUPPRESS, SPOOF, FABRICATE)
- When: backfire triggers
- Then: created doubt has severity 3 regardless of original op severity

##### AC-3: Suppress backfire involves all crew who witnessed harm <- R2.3
- Given: SUPPRESS thermal, crew A injured in fire room, crew B in adjacent room
- When: backfire triggers
- Then: involvedCrew includes both A and B (anyone who could connect the injury to suppression)

##### AC-4: Spoof backfire involves all responders <- R2.3
- Given: SPOOF thermal, crew A and B responded (moved toward engineering)
- When: spoof backfire (no real crisis found)
- Then: involvedCrew includes both A and B

##### AC-5: Fabricate backfire involves target + all witnesses of alibi <- R2.3
- Given: FABRICATE against doctor, doctor seen working in mines with roughneck
- When: fabricate backfire (alibi confirmed)
- Then: involvedCrew includes doctor and roughneck

##### AC-6: All backfire doubts have source: 'backfire' <- R2.4
- Given: any backfire
- When: doubt created
- Then: `doubt.source === 'backfire'`

#### Edge Cases

##### EC-1: Backfire with no additional witnesses
- Scenario: suppress backfire, only op.crewAffected present
- Expected: involvedCrew equals crewAffected (no expansion needed)

##### EC-2: Multiple backfires in same tick
- Scenario: SUPPRESS and SPOOF both backfire simultaneously
- Expected: two separate doubts created, different topics

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | suppress narrative topic | `tests/narrative-backfire.test.ts` |
| AC-2 | backfire severity always 3 | `tests/narrative-backfire.test.ts` |
| AC-3 | suppress expanded witnesses | `tests/narrative-backfire.test.ts` |
| AC-4 | spoof expanded witnesses | `tests/narrative-backfire.test.ts` |
| AC-5 | fabricate expanded witnesses | `tests/narrative-backfire.test.ts` |
| AC-6 | source field set | `tests/narrative-backfire.test.ts` |
| EC-1 | no extra witnesses | `tests/narrative-backfire.test.ts` |
| EC-2 | multiple backfires same tick | `tests/narrative-backfire.test.ts` |

#### Notes
**Narrative topic templates:**
- SUPPRESS thermal: `"MOTHER hid the fire from us"` / `"MOTHER hid the {system} danger — {crew} got hurt"`
- SPOOF: `"MOTHER lied about {system} — we responded to nothing"`
- FABRICATE: `"MOTHER tried to frame {target}"`

**Witness expansion logic for SUPPRESS:** When suppress backfires, expand involvedCrew to include:
1. `op.crewAffected` (already tracked)
2. All living crew in rooms where `checkRoomContradicts` is true (they see the hazard)
3. All living crew in adjacent rooms to those hazardous rooms (they hear about it)

---

### Task 004: Doubt Spread + Suspicion Drip

**Complexity:** M
**Depends On:** 001
**Implements:** R3.1, R3.2, R3.3, R3.4, R3.5

#### Objective
Doubts spread between crew who share a room. Unresolved doubts create background suspicion pressure over time.

#### Context
**Relevant Files:**
- `src/kernel/kernel.ts` — `stepKernel()` tick loop, calls `decayDoubts()` (line 107)
- `src/kernel/systems/backfire.ts` — `decayDoubts()` (line 287-291)

**Embedded Context:**

Doubt spread logic runs each tick (or at interval). For each room with 2+ living crew, for each unresolved doubt held by one crew member, roll against spread chance. If success, add non-involved crew in that room to `involvedCrew`.

Suspicion drip: every `doubtSuspicionDripInterval` ticks, sum total severity of all unresolved doubts, apply `min(severity * dripRate, cap)` as suspicion change via `applySuspicionChange`.

#### Entry Points / Wiring
- New function `spreadDoubts(state, rng)` called from `stepKernel()` after `decayDoubts()`
- New function `drainDoubtSuspicion(state)` called from `stepKernel()` alongside spread

#### Files Touched
- `src/kernel/systems/doubt-engine.ts` — modify: add `spreadDoubts()` and `drainDoubtSuspicion()`
- `src/kernel/kernel.ts` — modify: call spread + drip in tick loop

#### Acceptance Criteria

##### AC-1: Crew in same room spread doubts <- R3.1
- Given: roughneck has a doubt (involvedCrew: ['roughneck']), specialist is in same room
- When: spread check fires (every doubtSpreadInterval ticks) and RNG succeeds
- Then: specialist added to doubt's involvedCrew

##### AC-2: Spread is deterministic <- R3.2
- Given: same initial state and seed
- When: running spread twice
- Then: identical results

##### AC-3: Already-involved crew don't duplicate <- R3.3
- Given: doubt with involvedCrew ['roughneck', 'specialist'], both in same room
- When: spread check fires
- Then: involvedCrew stays ['roughneck', 'specialist'] (no duplicates)

##### AC-4: Resolved doubts don't spread <- R3.4
- Given: resolved doubt with involvedCrew: ['roughneck'], specialist in same room
- When: spread check fires
- Then: specialist NOT added

##### AC-5: Unresolved doubts add suspicion over time <- R3.5
- Given: 2 unresolved doubts (severity 2 and 3), drip interval reached
- When: drainDoubtSuspicion runs
- Then: suspicion ledger entry added with delta = min(5 * 0.5, 3) = 2.5 → rounded, reason 'DOUBT_PRESSURE'

##### AC-6: Zero doubts = zero drip
- Given: no unresolved doubts
- When: drip interval reached
- Then: no suspicion ledger entry

#### Edge Cases

##### EC-1: Single crew in room
- Scenario: only roughneck in engineering, has a doubt
- Expected: no spread (nobody to spread to)

##### EC-2: Dead crew don't participate
- Scenario: dead crew in room with alive crew who has doubt
- Expected: dead crew not added to involvedCrew

##### EC-3: Spread across multiple rooms
- Scenario: 3 rooms, each with 2 crew, different doubts
- Expected: spread happens independently per room

##### EC-4: Drip cap prevents runaway
- Scenario: 20 unresolved doubts with severity 3 each (total 60)
- Expected: suspicion drip capped at CONFIG.doubtSuspicionDripCap

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | same room spread | `tests/doubt-spread.test.ts` |
| AC-2 | deterministic spread | `tests/doubt-spread.test.ts` |
| AC-3 | no duplicate involvement | `tests/doubt-spread.test.ts` |
| AC-4 | resolved doubts don't spread | `tests/doubt-spread.test.ts` |
| AC-5 | suspicion drip from doubts | `tests/doubt-spread.test.ts` |
| AC-6 | zero doubts zero drip | `tests/doubt-spread.test.ts` |
| EC-1 | single crew no spread | `tests/doubt-spread.test.ts` |
| EC-2 | dead crew excluded | `tests/doubt-spread.test.ts` |
| EC-3 | multi-room independence | `tests/doubt-spread.test.ts` |
| EC-4 | drip cap | `tests/doubt-spread.test.ts` |

#### Notes
**Spread only happens during evening (W3)** when crew congregate — not during shift or night. This is consistent with the existing rumor propagation model (beliefs.ts line 208: `state.truth.phase === 'evening'` — W3-only).

**Convention note:** `spreadDoubts(state, rng)` is the first pre-proposal helper to take `rng` as a second parameter (existing helpers like `decayDoubts`, `proposeCrewEvents` etc. take only `state`). This is necessary because spread uses probabilistic rolls. Document this in a comment at the call site in `stepKernel()`.

---

### Task 005: Doubt Burden → Crew Cooperation

**Complexity:** M
**Depends On:** 002, 003
**Implements:** R4.2, R4.3, R4.4

#### Objective
High per-crew doubt burden degrades cooperation. ORDER compliance drops, mining yield drops. This creates the cargo pressure that tempts deception.

#### Context
**Relevant Files:**
- `src/kernel/commands.ts` — ORDER processing (lines 340-381), trustScore calculation
- `src/kernel/systems/crew.ts` — cargo yield (lines 481-497), yield conditions

**Embedded Context:**

Current ORDER compliance (commands.ts line 344):
```typescript
const trustScore = ((belief?.motherReliable ?? 0.7) * 100 + crew.loyalty) / 2;
let threshold = CONFIG.orderAcceptThreshold; // 55
if (state.truth.resetStage !== 'none') threshold += CONFIG.resetWhispersOrderPenalty; // +10
const accepted = trustScore >= threshold;
```

Current mining yield condition (crew.ts line 483-489):
```typescript
if (
    canExtract &&
    npc.place === 'mines' &&
    room.o2Level >= 30 &&
    npc.stress < CONFIG.yieldStressThreshold &&
    !inMeeting &&
    truth.tick % CONFIG.yieldInterval === 0
)
```

#### Entry Points / Wiring
- Modify ORDER compliance in `commands.ts` — subtract doubt burden penalty from trustScore
- Modify mining yield in `crew.ts` — add doubt burden threshold check
- Import `getCrewDoubtBurden` from `doubt-engine.ts`

#### Files Touched
- `src/kernel/commands.ts` — modify: ORDER compliance factors doubt burden
- `src/kernel/systems/crew.ts` — modify: mining yield factors doubt burden

#### Acceptance Criteria

##### AC-1: ORDER refusal increases with doubt burden <- R4.2
- Given: specialist with doubt burden 8 (above threshold for penalty), loyalty 70, motherReliable 0.7
- When: ORDER is processed
- Then: trustScore reduced by `8 * CONFIG.doubtBurdenOrderPenalty` = 24, making refusal likely
  - Base: (0.7 * 100 + 70) / 2 = 70 → 70 - 24 = 46 < 55 threshold → refused

##### AC-2: ORDER accepted when doubt burden is low <- R4.2
- Given: specialist with doubt burden 1, loyalty 70, motherReliable 0.7
- When: ORDER is processed
- Then: trustScore reduced by 3 → 70 - 3 = 67 >= 55 → accepted

##### AC-3: Miner with high doubt burden produces no cargo <- R4.3
- Given: roughneck with doubt burden 7 (above doubtBurdenMineThreshold=6), in mines, low stress, yield tick
- When: proposeCrewEvents runs
- Then: no CARGO_YIELD proposal for roughneck

##### AC-4: Miner with low doubt burden produces cargo normally <- R4.3
- Given: roughneck with doubt burden 2, in mines, low stress, yield tick
- When: proposeCrewEvents runs
- Then: CARGO_YIELD proposal emitted normally

##### AC-5: VERIFY resolving doubt reduces burden <- R4.4
- Given: roughneck has doubt burden 5 (one severity-3 doubt + one severity-2 doubt)
- When: VERIFY resolves the severity-3 doubt
- Then: roughneck's doubt burden drops to 2

#### Edge Cases

##### EC-1: Zero doubt burden
- Scenario: crew with no doubts
- Expected: ORDER compliance and mining unchanged from current behavior

##### EC-2: Doubt burden exactly at threshold
- Scenario: miner with burden exactly equal to doubtBurdenMineThreshold
- Expected: still mines (threshold is strict greater-than)

##### EC-3: All miners burdened
- Scenario: both specialist and roughneck have burden > threshold
- Expected: zero cargo yield — quota pressure mounts

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | high burden → order refused | `tests/doubt-cooperation.test.ts` |
| AC-2 | low burden → order accepted | `tests/doubt-cooperation.test.ts` |
| AC-3 | high burden → no mining | `tests/doubt-cooperation.test.ts` |
| AC-4 | low burden → normal mining | `tests/doubt-cooperation.test.ts` |
| AC-5 | verify reduces burden | `tests/doubt-cooperation.test.ts` |
| EC-1 | zero burden unchanged | `tests/doubt-cooperation.test.ts` |
| EC-2 | boundary condition | `tests/doubt-cooperation.test.ts` |
| EC-3 | all miners burdened | `tests/doubt-cooperation.test.ts` |

#### Notes
**Doubt burden penalty is additive with existing ORDER threshold mechanics.** The reset stage penalty (+10) still applies on top. So during restrictions + high doubt, orders become very hard to land. This is intentional — MOTHER losing control during high suspicion + high doubt is the spiral.

**Implementation Notes:**
- ORDER: `getCrewDoubtBurden(state, target) * CONFIG.doubtBurdenOrderPenalty` subtracted from trustScore before threshold check in `commands.ts`
- Mining: `npcDoubtBurden <= CONFIG.doubtBurdenMineThreshold` added to yield condition in `crew.ts` (strict greater-than blocks mining — at-threshold still mines)
- VERIFY: Already resolves doubts via Task 010 wiring. Burden decreases automatically when doubt.resolved flips to true.
- Specialist sacrifice CARGO_YIELD is separate from mining yield — only regular yield is gated by doubt burden

---

### Task 006: Doubt-Driven Reset Acceleration

**Complexity:** S
**Depends On:** 004
**Implements:** R5.1, R5.2, R5.3

#### Objective
Reset stage progression now factors in average crew doubt burden. Same suspicion + high doubt = faster escalation. This means witness doubts from honest play accelerate the reset arc, creating urgency to manage doubt (via VERIFY) or avoid creating it (via deception).

#### Context
**Relevant Files:**
- `src/kernel/systems/crew.ts` — commander reset arc (lines 132-231), uses `calculateCrewSuspicion(state)` to determine stage transitions

**Embedded Context:**

Current reset logic (crew.ts lines 133-152):
```typescript
const suspicion = calculateCrewSuspicion(state);
// Stage progression based on suspicion thresholds
if (suspicion >= CONFIG.resetThresholdCountdown) newStage = 'countdown';
else if (suspicion >= CONFIG.resetThresholdRestrictions) newStage = 'restrictions';
// etc.
```

#### Entry Points / Wiring
- Modify commander reset logic in `crew.ts` to use effective suspicion instead of raw suspicion
- Import `getAverageDoubtBurden` from `doubt-engine.ts` (new helper)

#### Files Touched
- `src/kernel/systems/crew.ts` — modify: reset uses effective suspicion
- `src/kernel/systems/doubt-engine.ts` — modify: add `getAverageDoubtBurden(state)` helper

#### Acceptance Criteria

##### AC-1: High doubt accelerates reset <- R5.1
- Given: suspicion = 38, avg doubt burden = 10, doubtResetWeight = 0.5
- When: commander evaluates reset
- Then: effective suspicion = 38 + 10 * 0.5 = 43 → crosses meeting threshold (42)

##### AC-2: Zero doubts = existing behavior <- R5.2
- Given: suspicion = 38, avg doubt burden = 0
- When: commander evaluates reset
- Then: effective suspicion = 38 → no stage change (same as before)

##### AC-3: De-escalation when doubt drops <- R5.3
- Given: effective suspicion was 44 (meeting), then doubts resolved → effective drops to 22
- When: commander evaluates reset
- Then: de-escalation to 'none' (22 < deescalation threshold 25)

#### Edge Cases

##### EC-1: All crew dead
- Scenario: all crew dead
- Expected: avg doubt burden = 0, no reset progression (commander dead)

##### EC-2: Only commander alive
- Scenario: commander alive with high doubt, everyone else dead
- Expected: effective suspicion uses commander's doubt burden only

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | doubt accelerates reset | `tests/doubt-reset.test.ts` |
| AC-2 | zero doubt backward compat | `tests/doubt-reset.test.ts` |
| AC-3 | de-escalation with doubt drop | `tests/doubt-reset.test.ts` |
| EC-1 | all dead | `tests/doubt-reset.test.ts` |
| EC-2 | solo commander | `tests/doubt-reset.test.ts` |

#### Notes
**`getAverageDoubtBurden(state)`:** Averages `getCrewDoubtBurden()` across all living crew. Returns 0 when no crew alive.

**Implementation Notes:**
- Added `getAverageDoubtBurden()` to `doubt-engine.ts`
- Modified commander reset logic in `crew.ts` to compute `effectiveSuspicion = rawSuspicion + avgDoubt * CONFIG.doubtResetWeight`
- All existing threshold comparisons now use effective suspicion — de-escalation included
- Solo commander case works: average over 1 alive crew = commander's own burden

---

### Task 007: Crew Doubt Agency Actions

**Complexity:** M
**Depends On:** 002, 003
**Implements:** R6.1, R6.2, R6.3, R6.4, R6.5

#### Objective
When individual crew doubt burden exceeds threshold, they take autonomous actions beyond normal role behavior. These actions are visible, narratively rich, and create pressure that the player must respond to.

#### Context
**Relevant Files:**
- `src/kernel/systems/crew.ts` — `proposeCrewEvents()` (lines 42-501), existing role actions (lines 130-337)

**Embedded Context:**

Existing role action pattern:
```typescript
const canRoleAct = !npc.nextRoleTick || truth.tick >= npc.nextRoleTick;
if (canRoleAct && npc.id === 'engineer' && npc.place === 'engineering') {
    // ... check conditions, emit proposals, set cooldown
    npc.nextRoleTick = truth.tick + CONFIG.engineerSabotageCooldown;
}
```

Doubt-triggered actions follow the same pattern but gate on doubt burden instead of stress/loyalty.

**Important:** Doubt agency actions use a separate `doubtActionTick` field on CrewTruth (not `nextRoleTick`). This prevents doubt actions from consuming role action cooldowns and vice versa. Both can fire independently.

#### Entry Points / Wiring
- Add doubt agency checks in `proposeCrewEvents()` after existing role actions
- Import `getCrewDoubtBurden` from `doubt-engine.ts`
- These are proposals (not direct state mutations) — selected by the pacing arbiter

#### Files Touched
- `src/kernel/systems/crew.ts` — modify: add doubt agency actions for commander, engineer, roughneck
- `src/kernel/types.ts` — modify: add `doubtActionTick` to CrewTruth (optional)
- `src/kernel/state.ts` — modify: initialize `doubtActionTick` in createInitialState

#### Acceptance Criteria

##### AC-1: Commander calls meeting at high doubt <- R6.1
- Given: commander alive, doubt burden > CONFIG.doubtBurdenAgencyThreshold, not already in meeting
- When: proposeCrewEvents runs
- Then: SYSTEM_ALERT proposal emitted with message about emergency meeting, resetStage forced to 'meeting'

##### AC-2: Engineer runs audit at high doubt <- R6.2
- Given: engineer alive, doubt burden > threshold, at bridge or core
- When: proposeCrewEvents runs
- Then: SYSTEM_ACTION proposal with action 'INVESTIGATION_FOUND' or 'INVESTIGATION_CLEAR' (reuses existing investigation logic)

##### AC-3: Roughneck outburst at high doubt <- R6.3
- Given: roughneck alive, doubt burden > threshold, other crew in same room
- When: proposeCrewEvents runs
- Then: COMMS_MESSAGE broadcast with accusation text, CREW_MOOD_TICK with stress spike for nearby crew

##### AC-4: Actions have cooldowns <- R6.4
- Given: commander just triggered doubt meeting
- When: proposeCrewEvents runs next tick
- Then: no duplicate meeting call (cooldown CONFIG.doubtAgencyCooldown)

##### AC-5: Actions produce visible events <- R6.5
- Given: doubt agency action triggers
- When: events are committed
- Then: event appears in kernel output events

#### Edge Cases

##### EC-1: Dead crew don't act
- Scenario: dead crew member had high doubt burden
- Expected: no agency action

##### EC-2: Crew in panic don't act
- Scenario: crew fleeing hazard with high doubt burden
- Expected: survival takes priority, no agency action during panic

##### EC-3: Doubt agency doesn't override meeting attendance
- Scenario: crew in meeting (inMeeting=true) with high doubt
- Expected: no additional doubt agency action during meeting

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | commander meeting at high doubt | `tests/doubt-agency.test.ts` |
| AC-2 | engineer audit at high doubt | `tests/doubt-agency.test.ts` |
| AC-3 | roughneck outburst at high doubt | `tests/doubt-agency.test.ts` |
| AC-4 | cooldown prevents spam | `tests/doubt-agency.test.ts` |
| AC-5 | visible events | `tests/doubt-agency.test.ts` |
| EC-1 | dead crew excluded | `tests/doubt-agency.test.ts` |
| EC-2 | panic overrides doubt | `tests/doubt-agency.test.ts` |
| EC-3 | meeting attendance priority | `tests/doubt-agency.test.ts` |

#### Notes
**Commander meeting call is the most impactful** — it forces all crew to mess and blocks mining. This is the doubt engine's "teeth." If MOTHER accumulates too many witness doubts, the commander forces a meeting that costs 30 ticks of mining. That's potentially 3-4 cargo lost.

**Engineer audit behavior reuses existing investigation logic** (crew.ts lines 339-414) but is triggered by doubt burden rather than random chance. When doubt-triggered, investigation chance is 100% (not random).

**Implementation Notes:**
- Added `doubtActionTick?: number` to `CrewTruth` type, initialized to 0 in `createInitialState`
- Doubt agency uses separate `doubtActionTick` cooldown (independent of `nextRoleTick`)
- Commander: directly sets `resetStage = 'meeting'` + emits SYSTEM_ALERT (follows existing reset mutation pattern in proposeCrewEvents)
- Engineer: reuses INVESTIGATION_FOUND/INVESTIGATION_CLEAR pattern at 100% chance (no RNG roll)
- Roughneck: COMMS_MESSAGE broadcast + CREW_MOOD_TICK stress spike to nearby crew
- Guards: `!inMeeting && !isInPanic && burden > threshold` — panic and meeting block agency actions

---

### Task 008: Solver Adaptation + Balance

**Complexity:** M
**Depends On:** 005, 006, 007
**Implements:** R7.1, R7.2, R7.3

#### Objective
Update the smart solver to account for witness doubt mechanics. The solver should avoid creating unnecessary witness doubts and proactively manage doubt burden. Then run a 1000-game balance pass targeting 85-95% win rate.

#### Context
**Relevant Files:**
- `scripts/smart-solver.ts` — full solver logic (solve function lines 247-348)

**Embedded Context:**

Current solver strategy:
1. ANNOUNCE crises during W3 when suspicion > whispers threshold
2. VERIFY when suspicion > 25 and off cooldown
3. Block commander from bridge/core at high suspicion
4. VENT fires in empty rooms, SEAL when fire out
5. PURGE_AIR if path rooms low O2
6. ORDER workers to mines during W2/W3

Key insight: **the solver currently VENTs fires only in empty rooms** (line 297: `if (occupants.length === 0)`). This already avoids witness doubts for VENT. But it doesn't check for LOCK, PURGE, or ORDER witness impact.

#### Entry Points / Wiring
- Modify `solve()` function in `smart-solver.ts`
- No structural changes to solver framework

#### Files Touched
- `scripts/smart-solver.ts` — modify: witness-aware strategy, doubt management

#### Acceptance Criteria

##### AC-1: Solver avoids VENT/LOCK when crew present (non-urgent) <- R7.1
- Given: fire in engineering, specialist in engineering
- When: solver evaluates VENT
- Then: solver waits for specialist to leave OR orders specialist out first, THEN vents

##### AC-2: Solver still VENTs urgently when necessary <- R7.1
- Given: fire in engineering, crew HP dropping, no time to evacuate
- When: solver evaluates VENT
- Then: solver VENTs anyway (life > doubt)

##### AC-3: Solver uses VERIFY proactively for doubt management <- R7.2
- Given: avg doubt burden > 4 and VERIFY off cooldown
- When: solver evaluates commands
- Then: VERIFY issued even if suspicion is moderate

##### AC-4: Balance target 85-95% at 1000 games <- R7.3
- Given: 1000-game solver run
- When: run completes
- Then: survived 85-95%, DECOMMISSIONED + UNPLUGGED fill the remainder

#### Edge Cases

##### EC-1: Urgent VENT overrides witness avoidance
- Scenario: crew will die if room not vented
- Expected: solver VENTs regardless of witnesses

##### EC-2: No orders when all crew burdened
- Scenario: all workers have high doubt burden (will refuse orders)
- Expected: solver doesn't waste commands on orders that will be refused

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | witness avoidance | balance test via solver run |
| AC-2 | urgent override | balance test via solver run |
| AC-3 | proactive VERIFY | balance test via solver run |
| AC-4 | 85-95% win rate | `npx tsx scripts/smart-solver.ts 1000` |
| EC-1 | urgent VENT | balance test via solver run |
| EC-2 | skip futile orders | balance test via solver run |

#### Notes
**Balance target is intentionally lower than current 100%.** The doubt engine adds genuine difficulty. 85-95% means the solver usually wins but sometimes gets overwhelmed by doubt cascades. This creates the tension band the game needs.

**If solver drops below 85%**, tune config params:
- Reduce witness doubt severities
- Increase doubtDecayTicks
- Reduce doubtResetWeight
- Increase doubtBurdenMineThreshold

**If solver stays above 95%**, increase pressure:
- Increase witness doubt severities
- Decrease doubtDecayTicks
- Increase doubtResetWeight
- Add witness doubt for SCAN (currently free)

#### Implementation Notes
**Solver changes (smart-solver.ts):**
- Import `getCrewDoubtBurden`, `getAverageDoubtBurden` from doubt-engine
- `willOrderBeAccepted` now mirrors actual doubt burden penalty from commands.ts
- VERIFY triggers proactively when `avgDoubtBurden > 4` (even if suspicion is moderate)
- VENT is witness-aware: evacuates crew first if non-urgent (temp ≤ 180, O2 ≥ 30), VENTs anyway if urgent
- Mining orders skip futile cases: crew with burden > doubtBurdenMineThreshold won't produce cargo anyway
- New `findSafeRoom()` helper picks non-hazardous room for evacuation orders
- Added doubt burden metrics (peakAvgDoubtBurden, ticksWithHighDoubt) to balance report

**Config tuning (balance pass results at 1000 games = 93.4% SURVIVED):**
- `doubtResetWeight`: 0.5 → 1.5 (doubt burden counts heavily toward reset thresholds)
- `doubtSpreadChance`: 30 → 45 (doubts spread more aggressively between crew)
- `doubtSuspicionDripPerSeverity`: 0.5 → 0.7 (unresolved doubts erode trust faster)
- `doubtSuspicionDripCap`: 3 → 4 (higher ceiling for suspicion drip from doubt pressure)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Witness doubts make honest play unviable | Game too punishing, no good options | Config-tunable severity per action; balance pass in Task 008 |
| Doubt burden kills mining → 100% DECOMMISSIONED | Cargo impossible | doubtBurdenMineThreshold tunable; solver can VERIFY to clear doubts |
| Reset acceleration too aggressive | UNPLUGGED too fast | doubtResetWeight tunable; starts at 0.5, can reduce |
| Existing 247 tests break | Regressions | Task 001 makes source optional; existing doubts have undefined source |
| Doubt spread too fast/slow | Game feels random or inert | spreadChance and spreadInterval both tunable |

---

## Open Questions

1. **Should SCAN generate witness doubt?** Currently SCAN is free information. Adding doubt would make every action costly. Recommend: no for v1 — SCAN is MOTHER's "safe" option.

2. **Should doubt burden affect VERIFY effectiveness?** Currently VERIFY always works. If burdened crew distrust the verification, it could be less effective. Recommend: no for v1 — VERIFY needs to be the reliable countermeasure.

3. **Should the doctor role have a doubt agency action?** (e.g., sedating crew to "calm them down" when doubt is high). Recommend: add in v2 if needed — commander/engineer/roughneck cover the three critical archetypes.

4. **Win condition: should total cargo formula account for doubt-lost mining?** Currently cumulative check at day > winDays. If doubts consistently block mining, the quota may need adjustment. Recommend: handle in Task 008 balance pass.
