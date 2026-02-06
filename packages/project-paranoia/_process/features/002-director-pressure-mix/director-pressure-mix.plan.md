# Plan: Director Pressure Mix

**Design Doc:** `DIRECTOR_PRESSURE_MIX.md`
**Status:** done

---

## Overview

Shift the director's crisis activation from purely physical arcs to a three-channel pressure system (physical/social/epistemic) weighted by crew suspicion level. At low suspicion, physical crises dominate. At high suspicion, the director throttles physical crises and pushes social/epistemic events that give the player VERIFY opportunities and trust-management gameplay. This prevents "RNG crisis spam → UNPLUGGED" and fills Gap 2 from STATUS.md.

---

## Requirements Expansion

### From R1: Three pressure channels with weighted selection

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | `PressureChannel` type covers 'physical', 'social', 'epistemic' | Type exists and is exported | 001 |
| R1.2 | `PressureMix` type has weights that sum to 1.0 | Unit test on all band returns | 001 |
| R1.3 | `getPressureMix(suspicion)` returns correct mix per band (low < 25, mid 25-45, high >= 45) | Unit tests per band | 001 |
| R1.4 | `pickChannel(mix, rng)` selects channel proportionally to weights | Statistical distribution test | 001 |

### From R2: Director uses suspicion-aware channel selection

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Pressure activation calculates suspicion before selecting channel | Unit test: suspicion affects channel choice | 002 |
| R2.2 | Physical channel gated by `maxActiveThreats` | Test: arc count at max → physical skipped | 002 |
| R2.3 | Social/epistemic channels don't count against arc limit | Test: social/epistemic fire even at maxActiveThreats | 002 |
| R2.4 | Boredom/tension modifiers still affect base activation chance | Test: boredom boost, tension reduction | 002 |
| R2.5 | Cooldown applies after any channel activation | Test: cooldown set regardless of channel | 002 |

### From R3: Social events create interpersonal pressure

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | At least 3 social event types (whisper_campaign, loyalty_test, confrontation) | Each type generates proposals | 003 |
| R3.2 | Social events create COMMS_MESSAGE proposals | Proposal type check | 003 |
| R3.3 | Social events pick suspicious crew (low motherReliable or high tamperEvidence) | Test: suspicious crew selected preferentially | 003 |
| R3.4 | Social events affect beliefs via existing rumor system | Integration: rumor topic spreads | 003 |
| R3.5 | Social events have proposal tags for pacing ('reaction', 'choice') | Tags verified | 003, 005 |

### From R4: Epistemic events create doubt and VERIFY opportunities

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | At least 3 epistemic event types (sensor_conflict, audit_prompt, doubt_voiced) | Each type generates proposals | 004 |
| R4.2 | Epistemic events create ActiveDoubts for VERIFY targeting | Doubt created with correct fields | 004 |
| R4.3 | sensor_conflict creates SENSOR_READING with low confidence and conflicting data | Reading has confidence < 0.6, message indicates conflict | 004 |
| R4.4 | Epistemic events have proposal tag 'uncertainty' for pacing | Tags verified | 004, 005 |
| R4.5 | doubt_voiced applies small suspicion bump (+2) | Suspicion delta test | 004 |

### From R5: Integration with pacing arbiter

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | Social events satisfy `phaseHadCrewAgency` pacing beat | Pacing state updated after social event | 005 |
| R5.2 | Epistemic events satisfy `phaseHadDeceptionBeat` pacing beat | Pacing state updated after epistemic event | 005 |
| R5.3 | Physical events still satisfy `phaseHadDilemma` pacing beat | Existing behavior preserved | 005 |
| R5.4 | Channel distribution across 100+ activations approximates mix weights | Statistical distribution test | 005 |

### From R6: All parameters configurable via env

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | Suspicion band thresholds configurable (`PARANOIA_SUSPICION_BAND_*`) | Config reads env | 001 |
| R6.2 | Channel weights per band configurable (`PARANOIA_PRESSURE_*_PHYSICAL/SOCIAL/EPISTEMIC`) | Config reads env | 001 |
| R6.3 | Pressure cooldown/chance use existing `threatActivation*` params | Config reuse verified | 002 |

---

## Dependency Graph

```
001 ---> 002 ---+---> 003 ---+--> 005
                |             |
                +---> 004 ---+
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | S | - | Foundation: types, config, utility functions |
| 2 | 002 | M | Batch 1 | Director refactor: extract activation, add routing |
| 3 | 003, 004 | M | Batch 2 | Social + epistemic generators (parallel) |
| 4 | 005 | S | Batch 3 | Integration tests, pacing wiring verification |

---

## Task Summary

| ID | Name | Complexity | Status | Notes |
|----|------|------------|--------|-------|
| 001 | Pressure channel types & config | S | done | New file: pressure.ts |
| 002 | Director pressure routing | M | done | Refactor arcs.ts, update kernel.ts |
| 003 | Social event generators | M | done | whisper_campaign, loyalty_test, confrontation |
| 004 | Epistemic event generators | M | done | sensor_conflict, audit_prompt, doubt_voiced |
| 005 | Integration test & pacing wiring | S | done | End-to-end pipeline verification |

---

## Task Details (Inline)

### Task 001: Pressure Channel Types & Config

**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4, R6.1, R6.2

#### Objective
Define the foundational types, config parameters, and utility functions for the three-channel pressure system so that downstream tasks can route director activation through suspicion-weighted channels.

#### Context
**Relevant Files:**
- `src/kernel/systems/pressure.ts` - **new file** to create
- `src/config.ts` - add suspicion band and channel weight parameters
- `src/kernel/types.ts` - reference for existing types (TruthState, PressureMix not yet defined)

**Embedded Context:**

Types to define:
```typescript
export type PressureChannel = 'physical' | 'social' | 'epistemic';

export interface PressureMix {
  physical: number;   // 0-1, weights sum to 1
  social: number;
  epistemic: number;
}
```

Config parameters to add (config.ts):
```typescript
// Suspicion band thresholds
suspicionBandLow: num('PARANOIA_SUSPICION_BAND_LOW', 25),
suspicionBandHigh: num('PARANOIA_SUSPICION_BAND_HIGH', 45),

// Channel weights per band (integers 0-100, normalized to 0-1 in getPressureMix)
pressureLowPhysical: num('PARANOIA_PRESSURE_LOW_PHYSICAL', 60),
pressureLowSocial: num('PARANOIA_PRESSURE_LOW_SOCIAL', 10),
pressureLowEpistemic: num('PARANOIA_PRESSURE_LOW_EPISTEMIC', 30),

pressureMidPhysical: num('PARANOIA_PRESSURE_MID_PHYSICAL', 40),
pressureMidSocial: num('PARANOIA_PRESSURE_MID_SOCIAL', 30),
pressureMidEpistemic: num('PARANOIA_PRESSURE_MID_EPISTEMIC', 30),

pressureHighPhysical: num('PARANOIA_PRESSURE_HIGH_PHYSICAL', 20),
pressureHighSocial: num('PARANOIA_PRESSURE_HIGH_SOCIAL', 40),
pressureHighEpistemic: num('PARANOIA_PRESSURE_HIGH_EPISTEMIC', 40),
```

RNG pattern (from core/rng.ts):
```typescript
import { createRng, type RNG } from '../core/rng.js';
// rng.next() returns float 0-1
// rng.nextInt(n) returns int 0 to n-1
```

Existing config pattern (config.ts):
```typescript
const num = (key: string, fallback: number): number =>
  Number(process.env[key] ?? fallback);
```

**Key Invariants:**
- I9: All config params must be env-overridable via `PARANOIA_` prefix
- I17: Pressure must shift with suspicion (this task provides the foundation)

#### Entry Points / Wiring
- `src/kernel/systems/pressure.ts` exports `getPressureMix`, `pickChannel`, `PressureChannel`, `PressureMix`
- Config params added to the `CONFIG` object in `src/config.ts`
- No kernel wiring yet — Task 002 integrates into the kernel loop

#### Files Touched
- `src/kernel/systems/pressure.ts` - create, types + utility functions
- `src/config.ts` - modify, add 11 config params
- `tests/pressure-mix.test.ts` - create, unit tests

#### Acceptance Criteria
##### AC-1: getPressureMix returns low-band weights <- R1.3
- **Given:** suspicion = 10, config with default band thresholds
- **When:** `getPressureMix(10, config)` is called
- **Then:** returns `{ physical: 0.6, social: 0.1, epistemic: 0.3 }`

##### AC-2: getPressureMix returns mid-band weights <- R1.3
- **Given:** suspicion = 35, config with default band thresholds
- **When:** `getPressureMix(35, config)` is called
- **Then:** returns `{ physical: 0.4, social: 0.3, epistemic: 0.3 }`

##### AC-3: getPressureMix returns high-band weights <- R1.3
- **Given:** suspicion = 60, config with default band thresholds
- **When:** `getPressureMix(60, config)` is called
- **Then:** returns `{ physical: 0.2, social: 0.4, epistemic: 0.4 }`

##### AC-4: pickChannel selects proportionally to weights <- R1.4
- **Given:** mix `{ physical: 0.5, social: 0.3, epistemic: 0.2 }` and a seeded RNG
- **When:** `pickChannel(mix, rng)` is called 1000 times
- **Then:** distribution is approximately 50/30/20 (within 5% tolerance)

#### Edge Cases
##### EC-1: Suspicion at band boundaries
- **Scenario:** suspicion = 25 (exactly at low/mid boundary)
- **Expected:** returns mid-band weights (boundary belongs to mid band, i.e. `>= bandLow` is mid)

##### EC-2: Extreme suspicion values
- **Scenario:** suspicion = 0 or suspicion = 100
- **Expected:** returns valid mix (low-band for 0, high-band for 100), no crash

#### Error Cases
None — pure functions with no error paths.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | getPressureMix returns low-band weights | `tests/pressure-mix.test.ts` |
| AC-2 | getPressureMix returns mid-band weights | `tests/pressure-mix.test.ts` |
| AC-3 | getPressureMix returns high-band weights | `tests/pressure-mix.test.ts` |
| AC-4 | pickChannel distributes proportionally | `tests/pressure-mix.test.ts` |
| EC-1 | boundary suspicion uses correct band | `tests/pressure-mix.test.ts` |
| EC-2 | extreme suspicion values don't crash | `tests/pressure-mix.test.ts` |

#### Notes
**Planning:** Foundation task. Config weights stored as integers (not floats) for env var readability. Normalization happens at runtime so weights don't need to sum to 100 exactly. `pickChannel` uses standard weighted random selection: roll = rng.next(), accumulate weights, return first channel where cumulative >= roll.
**Implementation Notes:** Created `src/kernel/systems/pressure.ts` with types (`PressureChannel`, `PressureMix`, `PressureConfig`), `getPressureMix()` with band-based selection (low < bandLow, mid < bandHigh, high >= bandHigh), `pickChannel()` with weighted random selection. Added 11 config params to `src/config.ts` (2 band thresholds + 9 channel weights). Weights stored as integers 0-100, normalized at runtime via `normalize()` helper. All 8 tests passing.
**Review Notes:** [filled by reviewer]

---

### Task 002: Director Pressure Routing

**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5, R6.3

#### Objective
Refactor the director's threat activation to route through suspicion-aware channel selection, so the pressure type shifts based on crew suspicion level while preserving all existing arc behavior.

#### Context
**Relevant Files:**
- `src/kernel/systems/arcs.ts` - current `maybeActivateArc()` at lines 303-320, `proposeArcEvents()` at lines 49-301
- `src/kernel/kernel.ts` - call site where arc proposals are generated (proposal generation phase)
- `src/kernel/systems/pressure.ts` - add `maybeActivatePressure()` routing function (from Task 001)
- `src/kernel/systems/beliefs.ts` - `calculateCrewSuspicion()` at lines 7-31
- `src/config.ts` - existing `threatActivationChance`, `threatActivationCooldown`, `boredomThreshold`, `tensionThreshold`

**Embedded Context:**

Current maybeActivateArc flow (arcs.ts lines 303-320):
```typescript
function maybeActivateArc(state: KernelState, rng: RNG): void {
  const { truth } = state;
  if (truth.arcs.length >= CONFIG.maxActiveThreats) return;
  if (truth.tick < truth.pacing.nextThreatActivationTick) return;

  let chance = CONFIG.threatActivationChance;
  if (truth.pacing.boredom >= CONFIG.boredomThreshold) chance += 3;
  if (truth.pacing.tension >= CONFIG.tensionThreshold) chance = Math.max(1, chance - 1);

  if (rng.nextInt(100) < chance) {
    const kind = pickArcKind(truth, rng);
    truth.arcs.push(createArc(state, kind, rng));
    truth.pacing.nextThreatActivationTick = truth.tick + CONFIG.threatActivationCooldown;
  }
}
```

Current call site: `maybeActivateArc` is called at line 54 of `proposeArcEvents()`. It mutates `truth.arcs[]` as a side effect, then `proposeArcEvents` proposes events for all active arcs. Note: `proposeArcEvents` returns `{ truth: Proposal[]; perception: Proposal[] }` — dual lists merged separately in kernel.ts (line 131-136).

New routing function signature:
```typescript
import type { Proposal } from '../types.js';
import type { PressureChannel } from './pressure.js';

export function maybeActivatePressure(
  state: KernelState,
  rng: RNG
): Proposal[] {
  // 1. Check cooldown (same logic)
  // 2. Calculate chance (same boredom/tension modifiers)
  // 3. Roll for activation
  // 4. Get suspicion → mix → channel
  // 5. Route:
  //    physical → call old maybeActivateArc logic, return []
  //    social → return proposeSocialPressure(state, rng)  (stub: returns [])
  //    epistemic → return proposeEpistemicPressure(state, rng)  (stub: returns [])
  // 6. Set cooldown
}
```

calculateCrewSuspicion (beliefs.ts):
```typescript
export function calculateCrewSuspicion(state: KernelState): number
// Returns 0-100 average suspicion across living crew
```

**Key Invariants:**
- I10: Proposals are scored, not hardcoded — social/epistemic events return `Proposal[]`
- I8: Deterministic given seed — same RNG path must produce same results
- I17: Pressure shifts with suspicion — this task implements the routing

#### Entry Points / Wiring
- `maybeActivatePressure()` exported from `src/kernel/systems/pressure.ts`
- Called in `src/kernel/kernel.ts` before proposal generation phase (replaces inline `maybeActivateArc` call within `proposeArcEvents`)
- Returned `Proposal[]` merged into **perception** proposals list in kernel.ts (social/epistemic are perception-layer events). Current kernel merges arc perception via `arcProposals.perception` — pressure proposals join the same list.
- `proposeArcEvents()` in arcs.ts modified to remove its `maybeActivateArc()` call at line 54 (now only steps existing arcs, continues returning `{ truth: Proposal[]; perception: Proposal[] }`)

#### Files Touched
- `src/kernel/systems/pressure.ts` - modify, add `maybeActivatePressure()` + stub social/epistemic functions
- `src/kernel/systems/arcs.ts` - modify, extract `maybeActivateArc` call from `proposeArcEvents`, export arc-creation helpers
- `src/kernel/kernel.ts` - modify, call `maybeActivatePressure`, merge proposals
- `tests/pressure-routing.test.ts` - create, unit tests

#### Acceptance Criteria
##### AC-1: Physical channel activates arcs via existing logic <- R2.1
- **Given:** suspicion < 25 (mostly physical), below max arcs, cooldown expired
- **When:** `maybeActivatePressure` activates and picks physical channel
- **Then:** a new arc is pushed to `truth.arcs[]` (same as current behavior)

##### AC-2: Social channel returns proposals (stub) <- R2.1
- **Given:** suspicion >= 45 (mostly social/epistemic), cooldown expired
- **When:** `maybeActivatePressure` activates and picks social channel
- **Then:** returns `Proposal[]` (empty for now, to be filled by Task 003)

##### AC-3: Epistemic channel returns proposals (stub) <- R2.1
- **Given:** suspicion >= 45 (mostly social/epistemic), cooldown expired
- **When:** `maybeActivatePressure` activates and picks epistemic channel
- **Then:** returns `Proposal[]` (empty for now, to be filled by Task 004)

##### AC-4: Boredom/tension modifiers still affect base chance <- R2.4
- **Given:** boredom >= boredomThreshold (15)
- **When:** activation check runs
- **Then:** chance is increased by +3 (same as current)

##### AC-5: Cooldown applies after any channel activation <- R2.5
- **Given:** activation fires on social channel
- **When:** next tick arrives
- **Then:** `nextThreatActivationTick` is set to `tick + cooldown`

##### AC-6: Physical arcs still gated by maxActiveThreats <- R2.2
- **Given:** `arcs.length >= maxActiveThreats`, physical channel selected
- **When:** activation check runs
- **Then:** no arc is created, but the pressure activation still occurred (cooldown set)

#### Edge Cases
##### EC-1: Physical channel at max arcs
- **Scenario:** Physical selected but arcs at max
- **Expected:** No arc created. Cooldown still set. No fallback to another channel.

##### EC-2: All crew dead
- **Scenario:** No living crew → `calculateCrewSuspicion` returns 0
- **Expected:** Low-band mix used, physical channel likely. No crash.

##### EC-3: Existing arc stepping unaffected
- **Scenario:** Active arcs exist, `proposeArcEvents()` is called
- **Expected:** Arc stepping logic unchanged — only activation was extracted

#### Error Cases
None — routing logic with no error paths.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | physical channel activates arc | `tests/pressure-routing.test.ts` |
| AC-2 | social channel returns proposals | `tests/pressure-routing.test.ts` |
| AC-3 | epistemic channel returns proposals | `tests/pressure-routing.test.ts` |
| AC-4 | boredom boost still applies | `tests/pressure-routing.test.ts` |
| AC-5 | cooldown set after social activation | `tests/pressure-routing.test.ts` |
| AC-6 | maxActiveThreats gates physical | `tests/pressure-routing.test.ts` |
| EC-1 | physical at max arcs, no fallback | `tests/pressure-routing.test.ts` |
| EC-2 | all crew dead, no crash | `tests/pressure-routing.test.ts` |
| EC-3 | arc stepping unaffected by refactor | `tests/pressure-routing.test.ts` |

#### Notes
**Planning:** Core refactoring task. Separates "when to activate" from "what to activate" and adds suspicion awareness. Physical channel still uses arc side-effect mutation (not proposal-based) for backward compatibility. Social/epistemic return proposals to go through scoring pipeline. Extract `maybeActivateArc` body into a helper called from `maybeActivatePressure`. Run existing test suite after refactor to ensure no regression.
**Implementation Notes:** Extracted `tryActivateArc(state, rng, maxActiveThreats?)` from arcs.ts (exported). Removed `maybeActivateArc()` call from `proposeArcEvents()` line 54. Added `maybeActivatePressure()` to pressure.ts with cooldown check, boredom/tension modifiers, suspicion→mix→channel routing. Physical routes to `tryActivateArc`, social/epistemic are stubs returning []. Added `PressureRoutingConfig` interface extending `PressureConfig`. Wired in kernel.ts before proposal generation, merging pressure proposals into perception proposals. `proposeSocialPressure` and `proposeEpistemicPressure` exported as stubs for Tasks 003/004. Full test suite 128/128 passing, no regressions.
**Review Notes:** Gemini PASS. 3 minor code quality notes (hardcoded +3/-1 values, CONFIG cast, missing JSDoc) — all non-blocking.

---

### Task 003: Social Event Generators

**Complexity:** M
**Depends On:** 002
**Implements:** R3.1, R3.2, R3.3, R3.4, R3.5

#### Objective
Implement three social pressure events (whisper_campaign, loyalty_test, confrontation) that create interpersonal tension, test trust management, and integrate with the existing belief/rumor system.

#### Context
**Relevant Files:**
- `src/kernel/systems/pressure.ts` - implement `proposeSocialPressure()` (stub from Task 002)
- `src/kernel/systems/comms.ts` - existing whisper/incident system for reference patterns
- `src/kernel/systems/beliefs.ts` - `calculateCrewSuspicion()`, `applySuspicionChange()`, belief state shape
- `src/kernel/types.ts` - `Proposal`, `ProposalTag`, `SimEvent`, `BeliefState`, `ActiveDoubt`
- `src/kernel/perception.ts` - `ActiveDoubt` interface reference

**Embedded Context:**

Existing whisper pattern (comms.ts lines 15-66):
```typescript
// Whispers happen during evening, every whisperInterval ticks
// Pick room with 2+ crew, select topic based on speaker's psychological state
// Create COMMS_MESSAGE proposal with tags ['uncertainty', 'reaction', 'choice']
```

COMMS_MESSAGE event shape (actual `CommsMessage` interface from `types.ts:190-201`):
```typescript
{
  type: 'COMMS_MESSAGE',
  actor: NPCId,
  place: PlaceId,
  data: {
    message: {
      id: string,            // required — unique message ID
      tick: number,           // required — creation tick
      kind: 'whisper' | 'log' | 'broadcast' | 'intercept' | 'order',
      from?: NPCId | 'PLAYER' | 'SYSTEM',
      to?: NPCId | 'PLAYER',
      place?: PlaceId,
      text: string,
      confidence: number,     // required (not optional)
      topic?: string,
      blocked?: boolean,
    }
  }
}
```
Note: `kind='log'` is NOT processed by `updateBeliefs` for rumor spreading. `kind='broadcast'` IS processed. Choose kind based on whether the event should propagate through beliefs.

Proposal shape:
```typescript
interface Proposal {
  id: string;
  event: Omit<SimEvent, 'id'>;
  score: number;
  tags: ProposalTag[];
}
// ProposalTag = 'pressure' | 'uncertainty' | 'choice' | 'reaction' | 'telegraph' | 'consequence' | 'background'
```

ActiveDoubt shape (for loyalty_test):
```typescript
interface ActiveDoubt {
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

Picking suspicious crew (new helper):
```typescript
function pickSuspiciousCrew(state: KernelState, rng: RNG): CrewTruth | undefined {
  // Filter alive crew with low motherReliable (< 0.5) or high tamperEvidence (> 20)
  // Pick one at random from filtered set
  // Returns undefined if no suspicious crew
}
```

Belief state access:
```typescript
state.perception.beliefs[npcId].motherReliable  // 0-1
state.perception.beliefs[npcId].tamperEvidence   // 0-100
state.perception.beliefs[npcId].rumors           // Record<string, number>
```

**Key Invariants:**
- I3: Suspicion is event-driven — any suspicion changes must have observable cause
- I5: Crew must have agency — social events based on crew psychological state, not random
- I10: Proposals are scored — return `Proposal[]`, not direct state mutation

#### Entry Points / Wiring
- `proposeSocialPressure(state, rng)` replaces stub in `src/kernel/systems/pressure.ts`
- Called by `maybeActivatePressure()` when social channel selected
- Returned proposals merge into perception proposals in kernel.ts (already wired by Task 002)
- `pickSuspiciousCrew` exported from pressure.ts for reuse by Task 004

#### Files Touched
- `src/kernel/systems/pressure.ts` - modify, implement `proposeSocialPressure()` + `pickSuspiciousCrew()`
- `tests/social-pressure.test.ts` - create, unit tests

#### Acceptance Criteria
##### AC-1: whisper_campaign creates COMMS_MESSAGE <- R3.2
- **Given:** at least 2 alive crew, one with `motherReliable < 0.5`
- **When:** `proposeSocialPressure()` selects whisper_campaign
- **Then:** returns proposal with COMMS_MESSAGE event, kind='whisper', topic='mother_rogue'

##### AC-2: whisper_campaign spreads rumor <- R3.4
- **Given:** whisper_campaign proposal selected and committed
- **When:** beliefs update processes the event
- **Then:** nearby crew `rumors['mother_rogue']` increases (via existing updateBeliefs path)

##### AC-3: loyalty_test creates COMMS_MESSAGE + ActiveDoubt <- R3.1, R3.2
- **Given:** suspicious crew exists
- **When:** `proposeSocialPressure()` selects loyalty_test
- **Then:** returns proposal with COMMS_MESSAGE (kind='broadcast', text questions MOTHER) AND creates ActiveDoubt with severity 1

##### AC-4: confrontation creates higher-impact COMMS_MESSAGE <- R3.1
- **Given:** crew with `tamperEvidence > 30`
- **When:** `proposeSocialPressure()` selects confrontation
- **Then:** returns proposal with COMMS_MESSAGE (kind='broadcast') and applies suspicion bump (+3) — uses 'broadcast' so it propagates through `updateBeliefs` for rumor spreading

##### AC-5: Social events pick suspicious crew preferentially <- R3.3
- **Given:** 3 alive crew: one with motherReliable=0.3, two with motherReliable=0.9
- **When:** `pickSuspiciousCrew()` is called
- **Then:** the suspicious crew member (0.3) is selected

##### AC-6: Social events have correct proposal tags <- R3.5
- **Given:** any social event generated
- **When:** proposal is created
- **Then:** tags include `'reaction'` and at least one of `'choice'` or `'uncertainty'`

#### Edge Cases
##### EC-1: No suspicious crew available
- **Scenario:** all crew have `motherReliable > 0.7` and `tamperEvidence < 10`
- **Expected:** `proposeSocialPressure()` returns empty array (no event)

##### EC-2: Only 1 crew alive
- **Scenario:** one living crew member
- **Expected:** whisper_campaign skipped (needs 2+), loyalty_test and confrontation still possible

##### EC-3: All crew highly suspicious
- **Scenario:** all crew have `motherReliable < 0.3`
- **Expected:** events still generate (any suspicious crew is valid)

#### Error Cases
None — generator returns empty array when preconditions not met.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | whisper_campaign creates COMMS_MESSAGE | `tests/social-pressure.test.ts` |
| AC-2 | whisper_campaign spreads rumor | `tests/social-pressure.test.ts` |
| AC-3 | loyalty_test creates message + doubt | `tests/social-pressure.test.ts` |
| AC-4 | confrontation creates broadcast + suspicion | `tests/social-pressure.test.ts` |
| AC-5 | pickSuspiciousCrew selects suspicious | `tests/social-pressure.test.ts` |
| AC-6 | correct proposal tags | `tests/social-pressure.test.ts` |
| EC-1 | no suspicious crew returns empty | `tests/social-pressure.test.ts` |
| EC-2 | single crew skips whisper | `tests/social-pressure.test.ts` |
| EC-3 | all suspicious still generates | `tests/social-pressure.test.ts` |

#### Notes
**Planning:** Social events are director-driven (activated by pressure system), unlike organic whispers (activated by comms.ts during evening phase). Keep them separate. Use weighted random selection among the 3 event types (equal weight initially). `pickSuspiciousCrew` filters by `motherReliable < 0.5 || tamperEvidence > 20`. For loyalty_test ActiveDoubt: push directly to `state.perception.activeDoubts[]` as a side effect (matches backfire.ts pattern). Additional social events (crew_meeting, accusation, reset_pressure) are future content.
**Implementation Notes:** Implemented `proposeSocialPressure()` with 3 event types: whisper_campaign (kind=whisper, topic=mother_rogue, needs 2+ alive crew), loyalty_test (kind=broadcast, creates severity-1 ActiveDoubt), confrontation (kind=broadcast, applies +3 suspicion via applySuspicionChange). Exported `pickSuspiciousCrew()` filtering by motherReliable<0.5 || tamperEvidence>20. All events use `makeCommsMessage` helper. Tags: ['reaction', 'choice'] for loyalty_test/confrontation, ['reaction', 'choice', 'uncertainty'] for whisper_campaign. Returns [] when no suspicious crew available. 9/9 tests passing.
**Review Notes:** Gemini PASS. Noted phantom side effects (doubt creation before proposal selection) — by design per plan, matches backfire.ts pattern.

---

### Task 004: Epistemic Event Generators

**Complexity:** M
**Depends On:** 002
**Implements:** R4.1, R4.2, R4.3, R4.4, R4.5

#### Objective
Implement three epistemic pressure events (sensor_conflict, audit_prompt, doubt_voiced) that create information uncertainty, generate ActiveDoubts for VERIFY targeting, and give the player counterplay at high suspicion.

#### Context
**Relevant Files:**
- `src/kernel/systems/pressure.ts` - implement `proposeEpistemicPressure()` (stub from Task 002)
- `src/kernel/systems/backfire.ts` - reference for ActiveDoubt creation pattern (lines 52-60)
- `src/kernel/systems/beliefs.ts` - `applySuspicionChange()` for doubt_voiced suspicion bump
- `src/kernel/types.ts` - `Proposal`, `SensorReading`, `ActiveDoubt`, `SimEvent`
- `src/kernel/perception.ts` - perception state structure, existing sensor reading patterns

**Embedded Context:**

SENSOR_READING event shape:
```typescript
{
  type: 'SENSOR_READING',
  place: PlaceId,
  data: {
    reading: {
      id: string,
      tick: number,
      place: PlaceId,
      system: string,           // 'environmental', 'thermal', 'air', etc.
      confidence: number,        // 0-1
      message: string,
      source: 'sensor' | 'crew' | 'system',
    }
  }
}
```

ActiveDoubt creation pattern (from backfire.ts):
```typescript
state.perception.activeDoubts.push({
  id: `doubt-${state.truth.tick}-${state.perception.activeDoubts.length}`,
  topic: 'Suppressed thermal alert',
  createdTick: state.truth.tick,
  severity: 1,
  involvedCrew: [crewId],
  system: 'thermal',
  resolved: false,
});
```

applySuspicionChange pattern (from beliefs.ts):
```typescript
applySuspicionChange(state, +2, 'DOUBT_VOICED', 'Crew questions MOTHER reliability');
// Logs to suspicionLedger, adjusts beliefs
```

Room state for sensor conflict:
```typescript
state.truth.rooms[placeId]: {
  temperature: number,
  o2Level: number,
  radiation: number,
  fire: boolean,
  integrity: number,
}
```

Proposal shape:
```typescript
interface Proposal {
  id: string;
  event: Omit<SimEvent, 'id'>;
  score: number;
  tags: ProposalTag[];
}
```

**Key Invariants:**
- I3: Suspicion is event-driven — doubt_voiced bump must use `applySuspicionChange` with reason
- I4: Truth/Perception separation — sensor_conflict creates perception-layer readings, doesn't alter truth
- I10: Proposals are scored — return `Proposal[]`
- I18: Every suspicion change is explained — all deltas logged to ledger

#### Entry Points / Wiring
- `proposeEpistemicPressure(state, rng)` replaces stub in `src/kernel/systems/pressure.ts`
- Called by `maybeActivatePressure()` when epistemic channel selected
- Returned proposals merge into perception proposals in kernel.ts (already wired by Task 002)
- Reuses `pickSuspiciousCrew` from Task 003 for audit_prompt

#### Files Touched
- `src/kernel/systems/pressure.ts` - modify, implement `proposeEpistemicPressure()`
- `tests/epistemic-pressure.test.ts` - create, unit tests

#### Acceptance Criteria
##### AC-1: sensor_conflict creates low-confidence SENSOR_READING <- R4.3
- **Given:** at least one room with crew activity
- **When:** `proposeEpistemicPressure()` selects sensor_conflict
- **Then:** returns proposal with SENSOR_READING event, confidence < 0.6, message contains "conflict" or "inconsistent"

##### AC-2: sensor_conflict creates ActiveDoubt <- R4.2
- **Given:** sensor_conflict selected
- **When:** proposal is processed
- **Then:** `state.perception.activeDoubts` gains entry with topic referencing the room and system, severity 1, `resolved: false`

##### AC-3: audit_prompt creates COMMS_MESSAGE announcing investigation <- R4.1
- **Given:** suspicious crew exists (low motherReliable)
- **When:** `proposeEpistemicPressure()` selects audit_prompt
- **Then:** returns proposal with COMMS_MESSAGE (kind='broadcast') from suspicious crew, text indicates intent to check logs

##### AC-4: audit_prompt creates ActiveDoubt with severity 2 <- R4.2
- **Given:** audit_prompt selected
- **When:** proposal is processed
- **Then:** `state.perception.activeDoubts` gains entry with severity 2, topic references log checking

##### AC-5: doubt_voiced creates COMMS_MESSAGE expressing uncertainty <- R4.1
- **Given:** any living crew
- **When:** `proposeEpistemicPressure()` selects doubt_voiced
- **Then:** returns proposal with COMMS_MESSAGE (kind='log'), text is one of several doubt phrases. Uses `kind='log'` intentionally — atmospheric doubt, not gossip. Suspicion impact comes solely from explicit `applySuspicionChange(+2)`, not belief propagation.

##### AC-6: doubt_voiced applies +2 suspicion <- R4.5
- **Given:** doubt_voiced event committed
- **When:** event processing runs
- **Then:** `applySuspicionChange(state, 2, 'DOUBT_VOICED', ...)` is called, ledger entry created

##### AC-7: Epistemic events have 'uncertainty' tag <- R4.4
- **Given:** any epistemic event generated
- **When:** proposal is created
- **Then:** tags include `'uncertainty'`

#### Edge Cases
##### EC-1: No rooms with crew activity
- **Scenario:** all crew in same room or no active systems
- **Expected:** sensor_conflict picks any room with crew present (not strictly "activity" required)

##### EC-2: During blackout
- **Scenario:** `blackoutTicks > 0`
- **Expected:** sensor_conflict still generates (sensors report conflict regardless — this IS the kind of event that happens during blackout)

##### EC-3: doubt_voiced topic variety
- **Scenario:** doubt_voiced generated multiple times
- **Expected:** different doubt phrases are used (at least 4 options in the pool)

#### Error Cases
None — generator returns empty array when preconditions not met.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | sensor_conflict creates low-confidence reading | `tests/epistemic-pressure.test.ts` |
| AC-2 | sensor_conflict creates ActiveDoubt | `tests/epistemic-pressure.test.ts` |
| AC-3 | audit_prompt creates broadcast message | `tests/epistemic-pressure.test.ts` |
| AC-4 | audit_prompt creates severity 2 doubt | `tests/epistemic-pressure.test.ts` |
| AC-5 | doubt_voiced creates log message | `tests/epistemic-pressure.test.ts` |
| AC-6 | doubt_voiced applies +2 suspicion | `tests/epistemic-pressure.test.ts` |
| AC-7 | epistemic events have uncertainty tag | `tests/epistemic-pressure.test.ts` |
| EC-1 | sensor_conflict with crew in one room | `tests/epistemic-pressure.test.ts` |
| EC-2 | sensor_conflict during blackout | `tests/epistemic-pressure.test.ts` |
| EC-3 | doubt phrases vary across calls | `tests/epistemic-pressure.test.ts` |

#### Notes
**Planning:** Epistemic events create VERIFY opportunities that satisfy the 'deception beat' pacing beat. sensor_conflict is purely perception-layer (doesn't alter truth). audit_prompt does NOT schedule a delayed investigation — that's future scope. doubt_voiced uses any crew (not just suspicious) because uncertainty is universal. ActiveDoubt creation is a side effect (push to `state.perception.activeDoubts[]`), done when the proposal is generated (matches backfire.ts pattern). Additional epistemic events (contradiction_setup, unverified_report, log_anomaly) are future content.
**Implementation Notes:** Implemented `proposeEpistemicPressure()` with 3 event types: sensor_conflict (SENSOR_READING, confidence 0.3-0.55, creates severity-1 ActiveDoubt with system reference), audit_prompt (COMMS_MESSAGE broadcast, creates severity-2 ActiveDoubt, needs suspicious crew), doubt_voiced (COMMS_MESSAGE kind=log, +2 suspicion via applySuspicionChange, 8 distinct phrases in pool). All proposals tagged ['uncertainty']. Pool includes audit_prompt only when pickSuspiciousCrew finds a candidate. sensor_conflict works during blackout and with all crew in one room. Tests use single RNG instance across iterations to avoid LCG seed correlation. 10/10 tests passing.
**Review Notes:** Gemini PASS. Same phantom side effects note as Task 003 — by design.

---

### Task 005: Integration Test & Pacing Wiring

**Complexity:** S
**Depends On:** 003, 004
**Implements:** R5.1, R5.2, R5.3, R5.4

#### Objective
Verify the full pressure mix pipeline works end-to-end across suspicion bands, channel distributions match weights, and pacing beats are satisfied by the new event types.

#### Context
**Relevant Files:**
- `src/kernel/systems/pressure.ts` - full pressure system (Tasks 001-004)
- `src/kernel/kernel.ts` - `stepKernel()`, `selectProposals()`, `updatePacing()`
- `src/kernel/systems/arcs.ts` - refactored arc system (Task 002)
- `src/config.ts` - all pressure config params
- `tests/` - existing test patterns for reference

**Embedded Context:**

Pacing beat tracking (kernel.ts updatePacing):
```typescript
// Social events should satisfy:
phaseHadCrewAgency = true  // when 'reaction' tag + NPC actor

// Epistemic events should satisfy:
phaseHadDeceptionBeat = true  // when 'uncertainty' tag

// Physical events should satisfy:
phaseHadDilemma = true  // when 'pressure' + 'choice' tags
```

Pacing boost mechanism (kernel.ts selectProposals):
```typescript
if (!pacing.phaseHadCrewAgency && proposal.tags.includes('reaction')) {
  boost += 40;  // Strong boost for NPC-initiated events
}
if (!pacing.phaseHadDeceptionBeat && proposal.tags.includes('uncertainty')) {
  boost += 30;  // Boost for information conflicts
}
```

Channel distribution expectation:
```
Low band (suspicion < 25):  60% physical, 10% social, 30% epistemic
Mid band (25-45):           40% physical, 30% social, 30% epistemic
High band (>= 45):          20% physical, 40% social, 40% epistemic
```

**Key Invariants:**
- I3: Suspicion is event-driven (no timer drift)
- I8: Deterministic given seed
- I9: Config is env-overridable
- I10: Proposals are scored, not hardcoded
- I17: Pressure shifts with suspicion

#### Entry Points / Wiring
- Test-only task — no production code changes
- Tests exercise the full `stepKernel()` loop and pressure subsystem in isolation

#### Files Touched
- `tests/pressure-integration.test.ts` - create, integration tests

#### Acceptance Criteria
##### AC-1: Channel distribution matches weights at low suspicion <- R5.4
- **Given:** suspicion fixed at 10, 200+ activations with same config
- **When:** channels are tallied
- **Then:** physical ~60%, social ~10%, epistemic ~30% (within 10% tolerance)

##### AC-2: Channel distribution matches weights at high suspicion <- R5.4
- **Given:** suspicion fixed at 60, 200+ activations with same config
- **When:** channels are tallied
- **Then:** physical ~20%, social ~40%, epistemic ~40% (within 10% tolerance)

##### AC-3: Social events satisfy phaseHadCrewAgency <- R5.1
- **Given:** social event proposal selected by `selectProposals()`
- **When:** `updatePacing()` runs
- **Then:** `pacing.phaseHadCrewAgency` becomes `true`

##### AC-4: Epistemic events satisfy phaseHadDeceptionBeat <- R5.2
- **Given:** epistemic event proposal selected by `selectProposals()`
- **When:** `updatePacing()` runs
- **Then:** `pacing.phaseHadDeceptionBeat` becomes `true`

##### AC-5: Physical events still satisfy phaseHadDilemma <- R5.3
- **Given:** physical arc proposal with tags ['pressure', 'choice']
- **When:** `updatePacing()` runs
- **Then:** `pacing.phaseHadDilemma` becomes `true` (existing behavior preserved)

##### AC-6: Full pipeline produces no crashes across 500 ticks <- R5.4
- **Given:** a seeded game with all pressure features enabled
- **When:** 500 ticks are simulated
- **Then:** no exceptions thrown, state remains valid

##### AC-7: Invariant I17 holds: high suspicion reduces physical frequency
- **Given:** two runs — one with constant low suspicion, one with constant high suspicion
- **When:** physical activation counts compared
- **Then:** high-suspicion run has significantly fewer physical activations (< 50% of low-suspicion run)

#### Edge Cases
##### EC-1: Suspicion changes mid-phase
- **Scenario:** suspicion starts at 20 (low band), rises to 50 (high band) within same phase
- **Expected:** subsequent pressure activations use the new mix (high band), not the old one

##### EC-2: All event types produce valid proposals
- **Scenario:** run through 100 activations
- **Expected:** no null proposals, all proposals have valid event types and tags

#### Error Cases
None — integration test, no error paths to verify.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | low suspicion channel distribution | `tests/pressure-integration.test.ts` |
| AC-2 | high suspicion channel distribution | `tests/pressure-integration.test.ts` |
| AC-3 | social satisfies crew agency beat | `tests/pressure-integration.test.ts` |
| AC-4 | epistemic satisfies deception beat | `tests/pressure-integration.test.ts` |
| AC-5 | physical satisfies dilemma beat | `tests/pressure-integration.test.ts` |
| AC-6 | 500-tick simulation no crashes | `tests/pressure-integration.test.ts` |
| AC-7 | I17 high suspicion reduces physical | `tests/pressure-integration.test.ts` |
| EC-1 | mid-phase suspicion change | `tests/pressure-integration.test.ts` |
| EC-2 | all proposals valid | `tests/pressure-integration.test.ts` |

#### Notes
**Planning:** Final verification task. Statistical tolerance of 10% (not 5%) since sample sizes are modest. Full simulation test catches integration bugs that unit tests miss. For distribution tests: use deterministic seed, count channels over 200+ activations. For I17 test: mock `calculateCrewSuspicion` to return fixed values, count physical activations over 200 ticks, compare.
**Implementation Notes:** Test-only task. Created `tests/pressure-integration.test.ts` with 9 test blocks (7 AC + 2 EC). AC-1/AC-2: statistical distribution tests via `pickChannel` with 500 trials at low (60/10/30) and high (20/40/40) suspicion bands, 10% tolerance. AC-3/AC-4: verified social proposals have 'reaction' tag + NPC actor (for `phaseHadCrewAgency`), epistemic proposals have 'uncertainty' tag (for `phaseHadDeceptionBeat`). AC-5: verified arc proposals across steps produce both 'pressure' (step 1+) and 'choice' (step 0) tags within a phase for `phaseHadDilemma`. AC-6: 500-tick `stepKernel` simulation with no exceptions. AC-7: compared physical activation counts at low vs high suspicion (300 trials each), confirmed high-suspicion run has <50% of low-suspicion physical activations. EC-1: verified suspicion change is reflected immediately in channel selection. EC-2: 100 social+epistemic activations all produce valid proposal structure. Full suite: 156/156 passing, no regressions.
**Review Notes:** [filled by reviewer]

---

## Architecture Notes

### File Organization

New file `src/kernel/systems/pressure.ts` contains:
- Types: `PressureChannel`, `PressureMix`
- Utility: `getPressureMix()`, `pickChannel()`
- Routing: `maybeActivatePressure()` (replaces `maybeActivateArc` call)
- Social generators: `proposeSocialPressure()`
- Epistemic generators: `proposeEpistemicPressure()`

### Kernel Integration Point

Current flow (kernel.ts lines 131-136):
```
const arcProposals = proposeArcEvents(state, rng);  // calls maybeActivateArc internally
// arcProposals = { truth: Proposal[], perception: Proposal[] }
truthProposals.push(...arcProposals.truth);
perceptionProposals = [...comms, ...arcProposals.perception];
```

New flow:
```
// Before proposal generation:
pressureProposals = maybeActivatePressure(state, rng);
  ├─ physical → activates arc (side effect on truth.arcs[]), returns []
  ├─ social   → returns Proposal[] (COMMS_MESSAGE)
  └─ epistemic → returns Proposal[] (SENSOR_READING or COMMS_MESSAGE)

// In proposal generation (unchanged shape):
const arcProposals = proposeArcEvents(state, rng);  // no longer calls maybeActivateArc
truthProposals.push(...arcProposals.truth);
perceptionProposals = [...comms, ...arcProposals.perception, ...pressureProposals];
```

### Proposal Layer

- Physical arcs → truth layer (arc creation is state mutation, not a proposal)
- Social events → perception proposals (COMMS_MESSAGE) with tags ['reaction', 'choice']
- Epistemic events → perception proposals (SENSOR_READING or COMMS_MESSAGE) with tags ['uncertainty']
- All proposals go through `selectProposals()` scoring as normal (I10 compliance)

### Events Not in Scope (Future Content)

Social: crew_meeting, accusation, reset_pressure (3 events)
Epistemic: contradiction_setup, unverified_report, log_anomaly (3 events)

These 6 events can be added later without architectural changes — they just add to the pool that `proposeSocialPressure`/`proposeEpistemicPressure` selects from.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Social/epistemic events unbalance suspicion | Events use small deltas (+2 for doubt_voiced). Test suspicion trajectory across full games. |
| Pacing arbiter starves social events in favor of physical | Social tags include 'reaction' + 'choice' to get pacing boost when crew agency beat is missing. |
| Too many ActiveDoubts flood VERIFY queue | Epistemic events create severity 1 doubts that decay normally (existing `decayDoubts` logic). |
| Existing tests break after arcs.ts refactor | Task 002 must preserve all existing arc behavior. Run full test suite before/after. |
| Config parameter explosion | Reuse existing `threatActivation*` params for base chance/cooldown. Only add band thresholds and channel weights (12 params). |

---

## Open Questions

None — design doc is comprehensive and all architectural decisions are resolved.

---

## Invariants Affected

| Invariant | Impact | Mitigation |
|-----------|--------|------------|
| I3: Suspicion is event-driven | Social/epistemic events may bump suspicion | All bumps are event-driven with ledger entries |
| I9: Config is env-overridable | New config params needed | All use `PARANOIA_` prefix with `num()` helper |
| I10: Proposals are scored | New events must go through proposals | Social/epistemic return `Proposal[]`, scored normally |
| I17: Pressure shifts with suspicion | This feature implements I17 | Direct implementation |
