# Task 005: Integration Test & Pacing Wiring

**Complexity:** S
**Depends On:** 003, 004
**Implements:** R5.1, R5.2, R5.3, R5.4

---

## Objective

Verify the full pressure mix pipeline works end-to-end across suspicion bands, channel distributions match weights, and pacing beats are satisfied by the new event types.

---

## Context

### Relevant Files
- `src/kernel/systems/pressure.ts` - full pressure system (Tasks 001-004)
- `src/kernel/kernel.ts` - `stepKernel()`, `selectProposals()`, `updatePacing()`
- `src/kernel/systems/arcs.ts` - refactored arc system (Task 002)
- `src/config.ts` - all pressure config params
- `tests/` - existing test patterns for reference

### Embedded Context

**Pacing beat tracking (kernel.ts updatePacing):**
```typescript
// Social events should satisfy:
phaseHadCrewAgency = true  // when 'reaction' tag + NPC actor

// Epistemic events should satisfy:
phaseHadDeceptionBeat = true  // when 'uncertainty' tag

// Physical events should satisfy:
phaseHadDilemma = true  // when 'pressure' + 'choice' tags
```

**Pacing boost mechanism (kernel.ts selectProposals):**
```typescript
if (!pacing.phaseHadCrewAgency && proposal.tags.includes('reaction')) {
  boost += 40;  // Strong boost for NPC-initiated events
}
if (!pacing.phaseHadDeceptionBeat && proposal.tags.includes('uncertainty')) {
  boost += 30;  // Boost for information conflicts
}
```

**Channel distribution expectation:**
```
Low band (suspicion < 25):  60% physical, 10% social, 30% epistemic
Mid band (25-45):           40% physical, 30% social, 30% epistemic
High band (>= 45):          20% physical, 40% social, 40% epistemic
```

### Key Invariants
- I3: Suspicion is event-driven (no timer drift)
- I8: Deterministic given seed
- I9: Config is env-overridable
- I10: Proposals are scored, not hardcoded
- I17: Pressure shifts with suspicion

---

## Acceptance Criteria

### AC-1: Channel distribution matches weights at low suspicion <- R5.4
- **Given:** suspicion fixed at 10, 200+ activations with same config
- **When:** channels are tallied
- **Then:** physical ~60%, social ~10%, epistemic ~30% (within 10% tolerance)

### AC-2: Channel distribution matches weights at high suspicion <- R5.4
- **Given:** suspicion fixed at 60, 200+ activations with same config
- **When:** channels are tallied
- **Then:** physical ~20%, social ~40%, epistemic ~40% (within 10% tolerance)

### AC-3: Social events satisfy phaseHadCrewAgency <- R5.1
- **Given:** social event proposal selected by `selectProposals()`
- **When:** `updatePacing()` runs
- **Then:** `pacing.phaseHadCrewAgency` becomes `true`

### AC-4: Epistemic events satisfy phaseHadDeceptionBeat <- R5.2
- **Given:** epistemic event proposal selected by `selectProposals()`
- **When:** `updatePacing()` runs
- **Then:** `pacing.phaseHadDeceptionBeat` becomes `true`

### AC-5: Physical events still satisfy phaseHadDilemma <- R5.3
- **Given:** physical arc proposal with tags ['pressure', 'choice']
- **When:** `updatePacing()` runs
- **Then:** `pacing.phaseHadDilemma` becomes `true` (existing behavior preserved)

### AC-6: Full pipeline produces no crashes across 500 ticks <- R5.4
- **Given:** a seeded game with all pressure features enabled
- **When:** 500 ticks are simulated
- **Then:** no exceptions thrown, state remains valid

### AC-7: Invariant I17 holds: high suspicion reduces physical frequency
- **Given:** two runs — one with constant low suspicion, one with constant high suspicion
- **When:** physical activation counts compared
- **Then:** high-suspicion run has significantly fewer physical activations (< 50% of low-suspicion run)

---

## Edge Cases

### EC-1: Suspicion changes mid-phase
- **Scenario:** suspicion starts at 20 (low band), rises to 50 (high band) within same phase
- **Expected:** subsequent pressure activations use the new mix (high band), not the old one

### EC-2: All event types produce valid proposals
- **Scenario:** run through 100 activations
- **Expected:** no null proposals, all proposals have valid event types and tags

---

## Error Cases

None — integration test, no error paths to verify.

---

## Scope

**In Scope:**
- Statistical distribution tests for channel selection
- Pacing beat satisfaction verification
- End-to-end simulation test (500 ticks)
- Invariant I17 verification
- Cross-band transition test

**Out of Scope:**
- Balance tuning (specific win rates) — that's post-implementation playtesting
- UI/display of pressure events — separate concern
- Additional event types beyond the 3+3 core set

---

## Implementation Hints

- For distribution tests: use a deterministic seed and count channel selections over 200+ activations. Use a tolerance of ±10% rather than exact percentages.
- For pacing tests: set up a minimal KernelState, generate a social/epistemic proposal, pass it through `updatePacing()`, check the pacing flags.
- For the 500-tick simulation: use `stepKernel()` in a loop with no player commands. Check that state is valid after each tick (no NaN, no out-of-bounds values, no thrown exceptions).
- For I17 test: mock `calculateCrewSuspicion` to return fixed values, count physical activations over 200 ticks, compare.

---

## Log

### Planning Notes
**Context:** Final verification task. Ensures the pressure mix pipeline works as designed and integrates correctly with existing pacing arbiter.
**Decisions:** Statistical tolerance of 10% (not 5%) since sample sizes are modest. Full simulation test catches integration bugs that unit tests miss.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
