# Plan: Director Pressure Mix

**Design Doc:** `DIRECTOR_PRESSURE_MIX.md`
**Status:** ready

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
| 001 | Pressure channel types & config | S | ready | New file: pressure.ts |
| 002 | Director pressure routing | M | backlog | Refactor arcs.ts, update kernel.ts |
| 003 | Social event generators | M | backlog | whisper_campaign, loyalty_test, confrontation |
| 004 | Epistemic event generators | M | backlog | sensor_conflict, audit_prompt, doubt_voiced |
| 005 | Integration test & pacing wiring | S | backlog | End-to-end pipeline verification |

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

Current flow:
```
proposeArcEvents() {
  maybeActivateArc();        // side effect: pushes to truth.arcs[]
  for each arc: step events  // returns proposals
}
```

New flow:
```
// Before proposal generation:
pressureProposals = maybeActivatePressure(state, rng);
  ├─ physical → maybeActivateArc(state, rng)  // existing logic
  ├─ social   → proposeSocialPressure(state, rng)
  └─ epistemic → proposeEpistemicPressure(state, rng)

// In proposal generation:
proposeArcEvents() {
  // No longer calls maybeActivateArc (extracted)
  for each arc: step events  // unchanged
}

// Merge: perceptionProposals.push(...pressureProposals)
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
