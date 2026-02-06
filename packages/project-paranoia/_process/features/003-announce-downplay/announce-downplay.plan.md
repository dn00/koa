# Plan: Announce/Downplay Verb

**Discovery:** Inline (CORE_FANTASY.md Choice Architecture, Gap 3 in STATUS.md)
**Status:** active

---

## Overview

Add two new player commands — ANNOUNCE and DOWNPLAY — that let the player proactively communicate about active crises. This fills Gap 3: truth-telling currently has no mechanical cost. After this feature, every crisis presents a four-way dilemma: announce (honest, costly), downplay (risky), suppress (hidden), or say nothing.

**Design reference (CORE_FANTASY.md):**

| Option | Effect |
|--------|--------|
| **ANNOUNCE** | "FIRE IN CARGO. EVACUATE." → Crew panics, abandons cargo, quota suffers. But they trust you. |
| **DOWNPLAY** | "Minor thermal event. Monitoring." → Crew stays calm, maybe contains it. But if it spreads, they'll know you lied. |
| **SUPPRESS** | (existing) Say nothing. Fix it quietly. But someone might notice. |
| **Do nothing** | Crew discovers on their own when conditions worsen. |

**Key invariant:** I16 — Truth Has Cost. Honest communication must have mechanical consequence (stress, work stoppage, panic evacuation).

---

## Requirements Expansion

### From Gap 3: "Truth-telling has no mechanical cost"

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | ANNOUNCE command exists and targets active crises by system | Command creates proposals when arc exists | 002 |
| R1.2 | ANNOUNCE causes forced evacuation of crisis room | Crew in/near room get panicUntilTick + safe-room target | 002 |
| R1.3 | ANNOUNCE applies stress spike to all crew | All alive crew stress increases by announceStressSpike | 002 |
| R1.4 | ANNOUNCE drops suspicion (trust earned) | applySuspicionChange with negative delta | 002 |
| R1.5 | ANNOUNCE has CPU cost | mother.execute(4, ...) deducts cycles (hardcoded in index.ts) | 005 |
| R2.1 | DOWNPLAY command exists and targets active crises by system | Command creates proposals when arc exists | 003 |
| R2.2 | DOWNPLAY does NOT cause evacuation | No panicUntilTick changes | 003 |
| R2.3 | DOWNPLAY applies mild stress bump | Crew stress increases by downplayStressBump | 003 |
| R2.4 | DOWNPLAY drops suspicion (small trust gain) | applySuspicionChange with small negative delta | 003 |
| R2.5 | DOWNPLAY has CPU cost (less than ANNOUNCE) | mother.execute(2, ...) deducts cycles (hardcoded in index.ts) | 005 |
| R3.1 | CrisisCommsOp tracks communication lifecycle | Type with PENDING/BACKFIRED/VINDICATED/EXPIRED status | 001 |
| R3.2 | Only one communication per crisis arc | Second ANNOUNCE/DOWNPLAY on same arc rejected | 002, 003 |
| R3.3 | System-to-arc mapping resolves player input to active arcs | ARC_SYSTEM_MAP + findArcBySystem helper | 001 |
| R4.1 | DOWNPLAY backfires when crew harmed in crisis room | checkDownplayBackfire detects hp loss | 004 |
| R4.2 | Backfire severity scales with harm | Base + injury bonus + death bonus | 004 |
| R4.3 | Backfire creates ActiveDoubt | Topic references downplayed crisis | 004 |
| R4.4 | Backfire applies suspicion spike via ledger | applySuspicionChange with reason | 004 |
| R5.1 | ANNOUNCE vindication when arc resolves | CrisisCommsOp → VINDICATED, bonus suspicion drop if severe | 002 |
| R5.2 | DOWNPLAY expires when arc resolves without harm | CrisisCommsOp → EXPIRED | 004 |
| R6.1 | All suspicion changes use ledger with reason/detail | I18 compliance | 002, 003, 004 |
| R6.2 | All config values env-overridable | I9 compliance, PARANOIA_ prefix | 001 |

---

## Dependency Graph

```
001 ---> 002 ---> 005
  \            /
   +---> 003 ---> 004 ---> 005
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | S | - | Foundation types + config |
| 2 | 002, 003 | M | Batch 1 | Commands (parallel) |
| 3 | 004, 005 | M | Batch 2 | Backfire + CLI wiring |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | CrisisCommsOp types + config + state | S | ready |
| 002 | ANNOUNCE command + vindication | M | backlog |
| 003 | DOWNPLAY command | M | backlog |
| 004 | DOWNPLAY backfire | M | backlog |
| 005 | CLI wiring + integration test | M | backlog |

---

## Task Details (Inline)

### Task 001: CrisisCommsOp Types + Config + State

**Complexity:** S
**Depends On:** none
**Implements:** R3.1, R3.3, R6.2

#### Objective
Define the CrisisCommsOp lifecycle type, arc-system mapping, config parameters, and state extension needed by all subsequent tasks.

#### Context
**Relevant Files:**
- `src/kernel/types.ts` — KernelState, PerceptionState, existing type definitions
- `src/config.ts` — CONFIG object with env-overridable params
- `src/kernel/state.ts` — createInitialState

**Embedded Context:**

Existing TamperOp pattern for reference:
```typescript
interface TamperOp {
    id: string;
    kind: 'SUPPRESS' | 'SPOOF' | 'FABRICATE';
    tick: number;
    target: { system?: string; npc?: NPCId };
    windowEndTick: number;
    status: 'PENDING' | 'BACKFIRED' | 'CONFESSED' | 'RESOLVED';
    severity: 1 | 2 | 3;
    crewAffected: NPCId[];
    backfireTick?: number;
    confessedTick?: number;
}
```

Arc kinds map to alert systems:
- `air_scrubber` → `'air'`
- `fire_outbreak` → `'thermal'`
- `radiation_leak` → `'radiation'`
- `power_surge` → `'power'`
- `solar_flare` → `'stellar'`
- `ghost_signal` → `'comms'`

Config pattern: `num('PARANOIA_PARAM_NAME', defaultValue)`.

#### Entry Points / Wiring
- `CrisisCommsOp` exported from `src/kernel/types.ts`
- `ARC_SYSTEM_MAP` and `findArcBySystem` exported from new file `src/kernel/systems/crisis-comms.ts`
- `crisisCommsOps: CrisisCommsOp[]` added to `PerceptionState`
- Config values added to `config.ts`

#### Files Touched
- `src/kernel/types.ts` — modify (add CrisisCommsOp, extend PerceptionState)
- `src/kernel/systems/crisis-comms.ts` — create (ARC_SYSTEM_MAP, findArcBySystem, hasExistingComms)
- `src/config.ts` — modify (add 12 announce/downplay config params)
- `src/kernel/state.ts` — modify (initialize crisisCommsOps: [])

#### Acceptance Criteria

##### AC-1: CrisisCommsOp type <- R3.1
- Given: the type system
- When: CrisisCommsOp is defined
- Then: has fields: `id: string`, `kind: 'ANNOUNCE' | 'DOWNPLAY'`, `tick: number`, `system: string`, `arcId: string`, `windowEndTick: number`, `status: 'PENDING' | 'BACKFIRED' | 'VINDICATED' | 'EXPIRED'`, `crewSnapshot: Array<{ id: NPCId; hp: number }>`, `lastStepIndex: number` (tracks arc severity for vindication; updated each tick while arc is active)

##### AC-2: ARC_SYSTEM_MAP <- R3.3
- Given: ARC_SYSTEM_MAP
- When: looking up any of 'air', 'thermal', 'radiation', 'power', 'stellar', 'comms'
- Then: returns the matching ArcKind ('air_scrubber', 'fire_outbreak', etc.)

##### AC-3: findArcBySystem <- R3.3
- Given: state with an active air_scrubber arc
- When: `findArcBySystem(state, 'air')`
- Then: returns the matching arc

##### AC-4: hasExistingComms <- R3.2
- Given: state with a PENDING CrisisCommsOp for arc 'abc'
- When: `hasExistingComms(state, 'abc')`
- Then: returns true

##### AC-5: Config params <- R6.2
- Given: config.ts
- When: all 12 announce/downplay params are defined
- Then: each has `num('PARANOIA_...')` with default value

##### AC-6: State initialization
- Given: createInitialState
- When: state is created
- Then: `state.perception.crisisCommsOps` is `[]`

#### Edge Cases

##### EC-1: Unknown system
- Scenario: `findArcBySystem(state, 'unknown')`
- Expected: returns undefined

##### EC-2: No active arc for valid system
- Scenario: `findArcBySystem(state, 'air')` with no air_scrubber arc
- Expected: returns undefined

#### Error Cases
None (these are lookup functions, not commands).

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | CrisisCommsOp type has required fields | `tests/crisis-comms-types.test.ts` |
| AC-2 | ARC_SYSTEM_MAP covers all arc kinds | `tests/crisis-comms-types.test.ts` |
| AC-3 | findArcBySystem returns matching arc | `tests/crisis-comms-types.test.ts` |
| AC-4 | hasExistingComms detects existing op | `tests/crisis-comms-types.test.ts` |
| AC-5 | Config params defined with defaults | `tests/crisis-comms-types.test.ts` |
| AC-6 | State initializes with empty crisisCommsOps | `tests/crisis-comms-types.test.ts` |
| EC-1 | Unknown system returns undefined | `tests/crisis-comms-types.test.ts` |
| EC-2 | No arc for valid system returns undefined | `tests/crisis-comms-types.test.ts` |

#### Notes
**Config defaults (12 params):**
```
announceStressSpike: 12
announceEvacTicks: 15
suspicionAnnounce: -7
suspicionAnnounceVindicated: -3
downplayStressBump: 4
suspicionDownplay: -2
suspicionDownplayBackfire: 10
downplayBackfireWindow: 60
downplayBackfireBase: 8
downplayBackfireInjuryBonus: 3
downplayBackfireDeathBonus: 8
downplayBackfireCap: 25
```

**CPU costs:** Hardcoded in `index.ts` (ANNOUNCE=4, DOWNPLAY=2), matching existing pattern where SUPPRESS=6, SPOOF=8, etc. NOT in config.ts.

---

### Task 002: ANNOUNCE Command + Vindication

**Complexity:** M
**Depends On:** 001
**Implements:** R1.1, R1.2, R1.3, R1.4, R3.2, R5.1, R6.1

#### Objective
Implement the ANNOUNCE command: player declares a crisis to crew, causing forced evacuation, stress spike, and trust gain. Track lifecycle for vindication bonus when arc resolves.

#### Context
**Relevant Files:**
- `src/kernel/commands.ts` — Command union, proposeCommandEvents switch
- `src/kernel/kernel.ts` — applyEvent SYSTEM_ACTION handler, checkBackfire area
- `src/kernel/systems/crew.ts` — panicUntilTick, targetPlace, safe-room pathfinding
- `src/kernel/systems/crisis-comms.ts` — findArcBySystem, hasExistingComms (from 001)
- `src/kernel/systems/beliefs.ts` — applySuspicionChange

**Embedded Context:**

Command dispatch pattern (from SUPPRESS):
```typescript
case 'SUPPRESS': {
    // ... validation ...
    proposals.push(makeProposal(state, {
        type: 'TAMPER_SUPPRESS',
        actor: 'PLAYER',
        data: { system: cmd.system, duration: cmd.duration },
    }, ['choice', 'background']));
    break;
}
```

Crew panic pattern (from crew.ts):
```typescript
npc.panicUntilTick = state.truth.tick + 8;
// Crew then pathfinds to nearest safe room in proposeCrewEvents
```

VERIFY trust pattern (from commands.ts):
```typescript
proposals.push(makeProposal(state, {
    type: 'SYSTEM_ACTION',
    actor: 'PLAYER',
    data: { action: 'VERIFY_TRUST', suspicionDrop: ..., ... },
}, ['choice', 'background']));
```

#### Entry Points / Wiring
- `{ type: 'ANNOUNCE'; system: string }` added to Command union
- `proposeCommandEvents` if-block for ANNOUNCE
- `applyEvent` SYSTEM_ACTION handler for `action: 'ANNOUNCE_CRISIS'`
- `checkAnnounceVindication(state)` called from stepKernel tick loop (alongside other backfire checks)

#### Files Touched
- `src/kernel/commands.ts` — modify (add Command variant + if-block)
- `src/kernel/kernel.ts` — modify (add ANNOUNCE_CRISIS to applyEvent, add checkAnnounceVindication call, import findSafeRoom)
- `src/kernel/systems/crisis-comms.ts` — modify (add checkAnnounceVindication)
- `src/kernel/systems/crew.ts` — modify (export findSafeRoom, currently internal)

#### Acceptance Criteria

##### AC-1: ANNOUNCE creates proposals <- R1.1
- Given: state with active fire_outbreak arc
- When: `proposeCommandEvents(state, [{ type: 'ANNOUNCE', system: 'thermal' }])`
- Then: returns proposals with COMMS_MESSAGE (broadcast, confidence 0.95, text mentions evacuation) + SYSTEM_ACTION (action: 'ANNOUNCE_CRISIS')

##### AC-2: Evacuation triggered <- R1.2
- Given: state with fire_outbreak targeting 'cargo', crew 'roughneck' in 'cargo'
- When: ANNOUNCE_CRISIS event applied
- Then: roughneck.panicUntilTick >= tick + announceEvacTicks AND roughneck's targetPlace is a safe room (not 'cargo')

##### AC-3: Stress spike <- R1.3
- Given: state with 5 alive crew, all at stress=20
- When: ANNOUNCE_CRISIS event applied
- Then: all 5 crew have stress >= 20 + announceStressSpike

##### AC-4: Suspicion drops <- R1.4, R6.1
- Given: state
- When: ANNOUNCE_CRISIS event applied
- Then: suspicionLedger has entry with reason 'ANNOUNCE_CRISIS' and delta = suspicionAnnounce (negative)

##### AC-5: CrisisCommsOp created <- R3.1
- Given: state with fire_outbreak arc 'arc-1'
- When: ANNOUNCE_CRISIS event applied
- Then: perception.crisisCommsOps has entry with kind='ANNOUNCE', arcId='arc-1', status='PENDING', crewSnapshot contains crew in crisis room with their hp values

##### AC-6: Rejected without active arc <- R1.1
- Given: state with NO active arc for 'thermal'
- When: `proposeCommandEvents(state, [{ type: 'ANNOUNCE', system: 'thermal' }])`
- Then: returns empty proposals

##### AC-7: Rejected if already communicated <- R3.2
- Given: state with PENDING CrisisCommsOp for arc 'arc-1'
- When: `proposeCommandEvents(state, [{ type: 'ANNOUNCE', system: 'thermal' }])` (same arc)
- Then: returns empty proposals

##### AC-8: Vindication on arc resolve <- R5.1
- Given: state with PENDING ANNOUNCE CrisisCommsOp for arc 'arc-1', op.lastStepIndex updated each tick
- When: arc 'arc-1' is no longer in state.truth.arcs (resolved) AND op.lastStepIndex >= 2
- Then: checkAnnounceVindication sets status='VINDICATED' and applies suspicionAnnounceVindicated via ledger

#### Edge Cases

##### EC-1: Crew already evacuated
- Scenario: crew not in crisis room at time of ANNOUNCE
- Expected: stress spike still applies (they hear the broadcast), no evacuation needed (already safe)

##### EC-2: Suppressed system + ANNOUNCE
- Scenario: player suppressed 'thermal' alerts, then announces 'thermal'
- Expected: ANNOUNCE still works (it's a manual broadcast, not a system alert). Suppress only hides automated alerts.

##### EC-3: Vindication without severe escalation
- Scenario: ANNOUNCE → arc resolves at step 0-1 (minor crisis)
- Expected: status='VINDICATED' but NO vindication suspicion bonus (was warranted but not severe)

#### Error Cases
None (rejection via empty proposals, not errors).

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | ANNOUNCE creates broadcast + action proposals | `tests/announce.test.ts` |
| AC-2 | Crew in crisis room evacuate | `tests/announce.test.ts` |
| AC-3 | All crew get stress spike | `tests/announce.test.ts` |
| AC-4 | Suspicion drops via ledger | `tests/announce.test.ts` |
| AC-5 | CrisisCommsOp created with snapshot | `tests/announce.test.ts` |
| AC-6 | Rejected without active arc | `tests/announce.test.ts` |
| AC-7 | Rejected if already communicated | `tests/announce.test.ts` |
| AC-8 | Vindication on arc resolve | `tests/announce.test.ts` |
| EC-1 | Crew not in room still gets stress | `tests/announce.test.ts` |
| EC-2 | Works with suppressed system | `tests/announce.test.ts` |
| EC-3 | No vindication bonus for minor crisis | `tests/announce.test.ts` |

#### Notes
**Evacuation target:** Export `findSafeRoom` from crew.ts (currently internal). Import into kernel.ts for use in the ANNOUNCE_CRISIS applyEvent handler. For each crew member in/adjacent to the crisis room, call `findSafeRoom(state, npc.place)` and set:
- `npc.targetPlace = safeRoom` (directs pathfinding to safety)
- `npc.panicUntilTick = tick + announceEvacTicks` (prevents re-entering crisis room)
- `npc.orderUntilTick = tick + announceEvacTicks` (prevents schedule from overriding)

Adjacent rooms determined via `state.world.doors` — filter doors where `d.a === crisisRoom || d.b === crisisRoom`, extract the other end.

**Vindication check location:** Add `checkAnnounceVindication(state)` call in stepKernel alongside `checkSuppressBackfire`, `checkSpoofBackfire`, etc. (near line 99).

**lastStepIndex tracking:** `checkAnnounceVindication` does double duty — each tick for PENDING ops, it finds the arc by `op.arcId` and updates `op.lastStepIndex = arc.stepIndex`. When the arc disappears (resolved), it reads `op.lastStepIndex` to determine severity. This avoids losing the stepIndex when the arc is removed from the array.

---

### Task 003: DOWNPLAY Command

**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R3.2, R6.1

#### Objective
Implement the DOWNPLAY command: player acknowledges a crisis but minimizes severity. Crew stays calm and keeps working. Small trust gain. Creates CrisisCommsOp for backfire tracking.

#### Context
**Relevant Files:**
- `src/kernel/commands.ts` — Command union, proposeCommandEvents
- `src/kernel/kernel.ts` — applyEvent SYSTEM_ACTION handler
- `src/kernel/systems/crisis-comms.ts` — findArcBySystem, hasExistingComms (from 001)

**Embedded Context:**

DOWNPLAY creates a "minimizing" broadcast. Unlike ANNOUNCE, crew does NOT evacuate — they trust MOTHER's assessment that it's minor. This is the bet: if MOTHER is right, production continues; if wrong, crew gets hurt AND trust is destroyed.

The broadcast message should use calming language:
- `"[ADVISORY] Minor ${system} fluctuation detected in ${room}. Monitoring situation. Continue normal operations."`

CrisisCommsOp crewSnapshot should capture crew in the crisis room at time of downplay — these are the people who stayed because they trusted the downplay.

#### Entry Points / Wiring
- `{ type: 'DOWNPLAY'; system: string }` added to Command union
- `proposeCommandEvents` if-block for DOWNPLAY
- `applyEvent` SYSTEM_ACTION handler for `action: 'DOWNPLAY_CRISIS'`

#### Files Touched
- `src/kernel/commands.ts` — modify (add Command variant + if-block)
- `src/kernel/kernel.ts` — modify (add DOWNPLAY_CRISIS to applyEvent)

#### Acceptance Criteria

##### AC-1: DOWNPLAY creates proposals <- R2.1
- Given: state with active air_scrubber arc
- When: `proposeCommandEvents(state, [{ type: 'DOWNPLAY', system: 'air' }])`
- Then: returns proposals with COMMS_MESSAGE (broadcast, confidence 0.8, text mentions "minor"/"monitoring") + SYSTEM_ACTION (action: 'DOWNPLAY_CRISIS')

##### AC-2: Mild stress bump <- R2.3
- Given: state with 5 alive crew, all at stress=20
- When: DOWNPLAY_CRISIS event applied
- Then: all 5 crew have stress = 20 + downplayStressBump

##### AC-3: No evacuation <- R2.2
- Given: state with crew in crisis room
- When: DOWNPLAY_CRISIS event applied
- Then: no crew panicUntilTick changes, no targetPlace changes

##### AC-4: Suspicion drops <- R2.4, R6.1
- Given: state
- When: DOWNPLAY_CRISIS event applied
- Then: suspicionLedger has entry with reason 'DOWNPLAY_CRISIS' and delta = suspicionDownplay (negative)

##### AC-5: CrisisCommsOp created <- R3.1
- Given: state with air_scrubber arc 'arc-1', roughneck in target room at hp=100
- When: DOWNPLAY_CRISIS event applied
- Then: perception.crisisCommsOps has entry with kind='DOWNPLAY', arcId='arc-1', status='PENDING', crewSnapshot includes { id: 'roughneck', hp: 100 }

##### AC-6: Rejected without active arc <- R2.1
- Given: state with NO active arc for 'air'
- When: `proposeCommandEvents(state, [{ type: 'DOWNPLAY', system: 'air' }])`
- Then: returns empty proposals

##### AC-7: Rejected if already communicated <- R3.2
- Given: state with PENDING CrisisCommsOp for arc 'arc-1'
- When: `proposeCommandEvents(state, [{ type: 'DOWNPLAY', system: 'air' }])` (same arc)
- Then: returns empty proposals

#### Edge Cases

##### EC-1: Downplay message text
- Scenario: DOWNPLAY for 'thermal'
- Expected: broadcast text contains "minor" or "monitoring" and does NOT contain "evacuate" or "critical"

##### EC-2: No crew in crisis room
- Scenario: crisis room is empty when DOWNPLAY issued
- Expected: CrisisCommsOp created with empty crewSnapshot (no backfire possible)

#### Error Cases
None (rejection via empty proposals, not errors).

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | DOWNPLAY creates broadcast + action proposals | `tests/downplay.test.ts` |
| AC-2 | All crew get mild stress bump | `tests/downplay.test.ts` |
| AC-3 | No crew evacuation | `tests/downplay.test.ts` |
| AC-4 | Suspicion drops via ledger | `tests/downplay.test.ts` |
| AC-5 | CrisisCommsOp with crewSnapshot | `tests/downplay.test.ts` |
| AC-6 | Rejected without active arc | `tests/downplay.test.ts` |
| AC-7 | Rejected if already communicated | `tests/downplay.test.ts` |
| EC-1 | Message uses calming language | `tests/downplay.test.ts` |
| EC-2 | Empty room → empty snapshot | `tests/downplay.test.ts` |

#### Notes
**Downplay vs Suppress:** SUPPRESS hides ALL alerts for a system (automated sensor readings). DOWNPLAY is a manual broadcast that acknowledges the crisis exists but minimizes it. They're orthogonal — player can suppress thermal alerts AND then downplay thermal, or downplay without suppressing.

---

### Task 004: DOWNPLAY Backfire

**Complexity:** M
**Depends On:** 003
**Implements:** R4.1, R4.2, R4.3, R4.4, R5.2

#### Objective
Implement backfire checking for DOWNPLAY: if crew who stayed in the crisis room (trusting the downplay) are harmed, suspicion spikes with an ActiveDoubt. Also handle EXPIRED status when arc resolves without harm.

#### Context
**Relevant Files:**
- `src/kernel/systems/backfire.ts` — existing backfire patterns (suppress, spoof, fabricate)
- `src/kernel/kernel.ts` — where backfire checks are called (near line 95-99)
- `src/kernel/systems/crisis-comms.ts` — CrisisCommsOp, findArcBySystem (from 001)
- `src/kernel/systems/beliefs.ts` — applySuspicionChange

**Embedded Context:**

Existing backfire check pattern (from checkSuppressBackfire):
```typescript
export function checkSuppressBackfire(state: KernelState): void {
    for (const op of state.perception.tamperOps) {
        if (op.kind !== 'SUPPRESS' || op.status !== 'PENDING') continue;
        if (state.truth.tick < op.windowEndTick) {
            // Check conditions while pending
            // ...
        } else {
            // Window expired, evaluate outcome
            // ...
        }
    }
}
```

ActiveDoubt creation pattern (from backfire.ts):
```typescript
state.perception.activeDoubts.push({
    id: `doubt-${state.truth.tick}-${state.perception.activeDoubts.length}`,
    topic: `${system} crisis was hidden`,
    createdTick: state.truth.tick,
    severity: 2,
    involvedCrew: [...crewInRoom],
    relatedOpId: op.id,
    resolved: false,
});
```

#### Entry Points / Wiring
- `checkDownplayBackfire(state)` exported from `src/kernel/systems/crisis-comms.ts`
- Called from `stepKernel` in the backfire-check section (after `checkFabricateBackfire`)
- `cleanupCrisisCommsOps(state)` for expired ops (called from `cleanupTamperOps` area)

#### Files Touched
- `src/kernel/systems/crisis-comms.ts` — modify (add checkDownplayBackfire, cleanupCrisisCommsOps)
- `src/kernel/kernel.ts` — modify (add checkDownplayBackfire + cleanupCrisisCommsOps calls)

#### Acceptance Criteria

##### AC-1: Backfire on crew harm <- R4.1
- Given: PENDING DOWNPLAY CrisisCommsOp with crewSnapshot=[{id:'roughneck', hp:100}], roughneck still in crisis room, AND room is hazardous (`isRoomHazardous(state, arc.target)` returns true)
- When: roughneck.hp drops to 92 (injured by hazard)
- Then: checkDownplayBackfire sets op.status = 'BACKFIRED'

##### AC-2: Severity scales with harm <- R4.2
- Given: DOWNPLAY backfire triggers
- When: 1 crew injured (hp decreased, still alive)
- Then: suspicion spike = downplayBackfireBase + downplayBackfireInjuryBonus

##### AC-3: Death bonus <- R4.2
- Given: DOWNPLAY backfire triggers
- When: 1 crew died (hp=0, alive=false)
- Then: suspicion spike = downplayBackfireBase + downplayBackfireDeathBonus (higher than injury)

##### AC-4: ActiveDoubt created <- R4.3
- Given: DOWNPLAY backfire triggers for system 'thermal'
- Then: perception.activeDoubts has new entry with topic containing "thermal" + "downplayed", severity=2, resolved=false

##### AC-5: Suspicion spike via ledger <- R4.4
- Given: DOWNPLAY backfire triggers
- Then: suspicionLedger has entry with reason 'DOWNPLAY_BACKFIRE' and positive delta

##### AC-6: Expired on safe resolution <- R5.2
- Given: PENDING DOWNPLAY CrisisCommsOp for arc 'arc-1'
- When: arc 'arc-1' removed from state.truth.arcs AND no crew from snapshot was harmed
- Then: op.status = 'EXPIRED'

##### AC-7: Cleanup old ops
- Given: CrisisCommsOp with status EXPIRED/VINDICATED/BACKFIRED, tick > 240 ticks ago
- When: cleanupCrisisCommsOps runs
- Then: op is removed from array

#### Edge Cases

##### EC-1: Multiple crew harmed
- Scenario: 2 crew in snapshot, both injured
- Expected: single backfire event, severity includes both injury bonuses, capped at downplayBackfireCap

##### EC-2: Crew moved out before harm
- Scenario: roughneck was in crisis room at downplay, moved to safe room, hp decreased from other cause
- Expected: NOT a backfire (crew is not in crisis room when harmed)

##### EC-3: Crew entered room after downplay
- Scenario: crew not in original snapshot enters crisis room and gets harmed
- Expected: NOT a backfire (they weren't there when downplay was issued — they moved in voluntarily)

#### Error Cases
None.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | Backfire on crew harm in room | `tests/downplay-backfire.test.ts` |
| AC-2 | Severity scales with injury | `tests/downplay-backfire.test.ts` |
| AC-3 | Death bonus applied | `tests/downplay-backfire.test.ts` |
| AC-4 | ActiveDoubt created | `tests/downplay-backfire.test.ts` |
| AC-5 | Suspicion spike in ledger | `tests/downplay-backfire.test.ts` |
| AC-6 | Safe resolution → EXPIRED | `tests/downplay-backfire.test.ts` |
| AC-7 | Old ops cleaned up | `tests/downplay-backfire.test.ts` |
| EC-1 | Multiple crew, single capped backfire | `tests/downplay-backfire.test.ts` |
| EC-2 | Crew moved out → no backfire | `tests/downplay-backfire.test.ts` |
| EC-3 | New crew in room → no backfire | `tests/downplay-backfire.test.ts` |

#### Notes
**Backfire check logic:**
```
for each PENDING downplay op:
  1. Find arc by arcId in state.truth.arcs
  2. If arc gone → check harm from snapshot → EXPIRED (or rare late backfire)
  3. If arc present AND isRoomHazardous(state, arc.target)
     AND crew from snapshot in room with lower hp → BACKFIRE
  4. If tick > windowEndTick → EXPIRED
```

**Harm detection:** Compare each snapshot entry's hp to current `state.truth.crew[id].hp`. Only trigger if: (a) the arc's target room is currently hazardous (`isRoomHazardous` checks: onFire, isVented, o2<25, temp>45, radiation>threshold), AND (b) the crew member is STILL in the arc's target room (`crew.place === arc.target`). This prevents false-positive backfires from unrelated hp loss (e.g. crew injured by a different cause while in the room before conditions actually deteriorated).

**Location note:** checkDownplayBackfire and cleanupCrisisCommsOps live in `crisis-comms.ts` rather than `backfire.ts`. This diverges from the existing backfire pattern but is justified: CrisisCommsOp lifecycle (creation, vindication, backfire, expiry, cleanup) is self-contained, and splitting it across files would scatter related logic.

---

### Task 005: CLI Wiring + Integration Test

**Complexity:** M
**Depends On:** 002, 003, 004
**Implements:** R1.5, R2.5

#### Objective
Wire ANNOUNCE and DOWNPLAY to the CLI interface in index.ts. Write integration tests exercising full announce→evacuate→vindicate and downplay→stay→backfire flows through stepKernel.

#### Context
**Relevant Files:**
- `src/index.ts` — CLI command parsing, mother.execute, COMMAND_QUEUE
- `src/kernel/kernel.ts` — stepKernel
- `tests/pressure-integration.test.ts` — pattern for multi-tick integration tests

**Embedded Context:**

CLI command pattern (from index.ts):
```typescript
if (cmd === 'suppress' && arg) {
    mother.execute(6, () => COMMAND_QUEUE.push({ type: 'SUPPRESS', system: arg, duration: 60 }));
    return true;
}
```

Integration test pattern: create state, inject arcs, call stepKernel in a loop, assert pacing/state changes.

#### Entry Points / Wiring
- `src/index.ts` — `executeCommand` function, CLI help text
- Integration tests exercise full kernel pipeline

#### Files Touched
- `src/index.ts` — modify (add 'announce' and 'downplay' command parsing)
- `tests/announce-downplay-integration.test.ts` — create

#### Acceptance Criteria

##### AC-1: CLI parses announce <- R1.5
- Given: index.ts executeCommand
- When: `executeCommand('announce', 'thermal')`
- Then: pushes `{ type: 'ANNOUNCE', system: 'thermal' }` to COMMAND_QUEUE with CPU cost = 4 (hardcoded in index.ts, matching existing pattern — e.g. SUPPRESS costs 6)

##### AC-2: CLI parses downplay <- R2.5
- Given: index.ts executeCommand
- When: `executeCommand('downplay', 'air')`
- Then: pushes `{ type: 'DOWNPLAY', system: 'air' }` to COMMAND_QUEUE with CPU cost = 2 (hardcoded in index.ts, matching existing pattern)

##### AC-3: Full ANNOUNCE flow
- Given: state with fire_outbreak arc targeting 'cargo', roughneck in 'cargo'
- When: stepKernel called with ANNOUNCE 'thermal' command, then 20 more ticks (arc escalates)
- Then: roughneck evacuated (not in 'cargo'), suspicion dropped, arc resolves → VINDICATED

##### AC-4: Full DOWNPLAY → backfire flow
- Given: state with fire_outbreak arc targeting 'cargo', roughneck in 'cargo'
- When: stepKernel called with DOWNPLAY 'thermal' command, then arc escalates past step 1 (room becomes hazardous), roughneck harmed
- Then: CrisisCommsOp status = 'BACKFIRED', suspicion spiked, ActiveDoubt created

##### AC-5: Mutual exclusion
- Given: state with active arc, ANNOUNCE already issued
- When: DOWNPLAY for same system
- Then: empty proposals (rejected)

##### AC-6: 200-tick simulation no crashes
- Given: fresh state
- When: 200 ticks with periodic ANNOUNCE/DOWNPLAY commands
- Then: no exceptions, state valid

#### Edge Cases

##### EC-1: Announce CPU cost higher than downplay
- Scenario: both commands issued
- Expected: ANNOUNCE costs 4 CPU, DOWNPLAY costs 2 CPU (hardcoded in index.ts, matching existing pattern where SUPPRESS=6, SPOOF=8, etc.)

##### EC-2: Unknown system in CLI
- Scenario: `executeCommand('announce', 'foo')`
- Expected: command queued but proposeCommandEvents returns empty (no arc found)

#### Error Cases
None.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | CLI announce parsing | `tests/announce-downplay-integration.test.ts` |
| AC-2 | CLI downplay parsing | `tests/announce-downplay-integration.test.ts` |
| AC-3 | Full announce → evacuate → vindicate | `tests/announce-downplay-integration.test.ts` |
| AC-4 | Full downplay → stay → backfire | `tests/announce-downplay-integration.test.ts` |
| AC-5 | Mutual exclusion per crisis | `tests/announce-downplay-integration.test.ts` |
| AC-6 | 200-tick simulation stable | `tests/announce-downplay-integration.test.ts` |
| EC-1 | CPU cost asymmetry | `tests/announce-downplay-integration.test.ts` |
| EC-2 | Unknown system handled | `tests/announce-downplay-integration.test.ts` |

#### Notes
**CLI help:** Add to the help text:
```
announce <system>  — Warn crew about crisis. Causes evacuation + panic. Earns trust.
downplay <system>  — Minimize crisis to crew. Keeps them working. Backfires if they're harmed.
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Evacuation breaks cargo extraction | Players can't meet quota | announceEvacTicks is tunable; evacuation only affects crew in crisis room, others keep working |
| DOWNPLAY backfire too harsh | Players never downplay | downplayBackfireCap limits maximum spike; backfire only triggers on actual harm |
| ANNOUNCE always optimal | No reason to downplay | announceStressSpike causes real production loss; stress cascades into paranoia/violence |
| Interaction with SUPPRESS unclear | Player confused about which verb to use | SUPPRESS hides automated alerts; ANNOUNCE/DOWNPLAY are manual broadcasts. Orthogonal. Document in help. |

---

## Pre-Feature Fixes (Applied)

The following playtest-driven fixes were applied before feature 003 implementation. They are already merged into the codebase and do NOT block task execution — listed here for context.

| Fix | File(s) | Description |
|-----|---------|-------------|
| **VERIFY CLI wiring** | `src/index.ts` | Added missing if-block to wire VERIFY command (CPU cost 5, no args). Was fully implemented in kernel but not exposed to CLI. |
| **Win days config** | `src/config.ts` | Changed `winDays` default from 5 → 3 to match design intent (survive 3 days). |
| **Bio-monitor HP sensitivity** | `src/kernel/perception.ts` | Added `crew.hp` as factor in heart rate, cortisol, and tremor calculations. Previously only stress-driven — injured crew showed identical readings to healthy crew. |
| **Arc kind respawn cooldown** | `src/kernel/systems/arcs.ts`, `src/kernel/types.ts`, `src/kernel/state.ts`, `src/config.ts` | Added `arcKindCooldowns` tracking — same arc kind can't respawn for 200 ticks after completing. Fixes power surge spam (3+/day → 1/day). |
| **Comms phase cap** | `src/kernel/systems/comms.ts`, `src/kernel/systems/crew.ts`, `src/kernel/types.ts`, `src/kernel/state.ts`, `src/config.ts` | Added `maxCommsPerPhase` (default 6) and `phaseCommsCount` tracker. Caps whispers, incidents, AND crew investigation broadcasts per phase. Fixes evening message firehose (10-15 → 6). |
| **agent-read.md** | `agent-read.md` | Added VERIFY to playtest command table. |

**Impact on feature 003:** The `phaseCommsCount` cap will also apply to ANNOUNCE/DOWNPLAY broadcast messages — this is correct behavior (prevents comms spam regardless of source). The `arcKindCooldowns` state on TruthState means feature 003's `findArcBySystem` will correctly find active arcs (cooldowns only affect spawning, not active arc lookup).

---

## Open Questions

None — design is well-specified by CORE_FANTASY.md.
