# Discovery: Solvability Guarantee System

**Date:** 2026-02-05
**Status:** approved
**Author:** Discovery Agent
**Plan:** [solvability-guarantee.plan.md](./solvability-guarantee.plan.md)

---

## Overview

### Problem Statement

The current system conflates **signal existence** with **signal difficulty**:
- Difficulty controls WHETHER culprit lies (via `false_alibi` twist)
- No validation ensures a catchable signal actually exists
- Result: 2% of cases have no catchable contradiction, only signature motive
- This violates spec requirement of ≥95% solvability

### Root Cause Analysis

The 2% failure happens when:
1. No `false_alibi` twist is generated (random chance)
2. Device logs don't happen to catch culprit at crime scene
3. No witness sees culprit in a contradictory location
4. Only signal is the culprit's signature motive phrase

This is a **generation bug**, not a difficulty feature. The solver can't find WHO because there's no logical path to eliminate other suspects.

### Proposed Solution

**Separate solvability from difficulty:**

| Concern | What it controls | When checked |
|---------|------------------|--------------|
| **Solvability** | Signal MUST exist | Post-generation validation |
| **Difficulty** | How HARD to find signal | Generation-time config |

**Signal hierarchy (from strongest to weakest):**

| Signal Type | What it is | Catchable by |
|-------------|------------|--------------|
| Self-contradiction | Culprit claims X, evidence shows Y | COMPARE testimony vs testimony |
| Device contradiction | Culprit claims X, device log shows Y | COMPARE testimony vs device |
| Scene presence | Device log places culprit at crime scene | Direct device log observation |
| Opportunity | Culprit was at scene + has motive | Requires synthesis |

**The fix:** Every case MUST have at least one signal from the top 3. Opportunity-only is NOT sufficient.

### Success Criteria

1. Solver achieves ≥95% on 500+ seeds (spec requirement)
2. Every case has at least one catchable signal (validated)
3. Difficulty still controls how HARD the signal is to find
4. Variety system can tune signal type distribution

---

## Requirements

### Must Have (P0)

**R1: Signal validation after case generation**
- Rationale: Catch unsolvable cases before they're played
- Verification: `validateSignalExists(case)` returns true for all published cases

**R2: Signal injection when validation fails**
- Rationale: Don't waste seeds; fix marginal cases
- Verification: Injected signal is minimal and fair

**R3: Separation of solvability from difficulty**
- Rationale: Enable full tuning without breaking fairness
- Verification: All 3 difficulty levels achieve ≥95% solvability

### Should Have (P1)

**R4: Signal type as tuning dimension**
- Rationale: Variety system needs control over signal distribution
- Verification: Can configure "80% self-contradiction, 20% device contradiction"

**R5: Signal strength metric in validation**
- Rationale: Know HOW solvable a case is, not just IF
- Verification: `signalStrength: 'strong' | 'medium' | 'weak'` in validation

### Won't Have (this scope)

- Variety system shapes/liar models (separate feature)
- Multiple independent chains (spec says 2, we'll do 1 guaranteed)
- UI changes (pure backend fix)

---

## Technical Analysis

### Existing Code (What We Have)

**`validators.ts` - Already has most of the pieces:**
- `findContradictions()` - Finds all contradictions in evidence
- `findKeystonePair()` - Finds the best contradiction for narrowing suspects
- `validateSolvability()` - Checks evidence chains exist (but not signal quality)
- `validatePlayability()` - Checks AP budget is sufficient
- `validateKeystonePair()` - Checks keystone narrows to ≤2 suspects

**`sim.ts:maybeGenerateTwist()`**
- Currently: Random chance to generate `false_alibi` based on difficulty
- Problem: "Maybe" means sometimes no twist = no signal
- Gap: No guarantee that generated twist creates DETECTABLE contradiction

**`evidence.ts:deriveCulpritAlibiClaim()`**
- Currently: Generates culprit's alibi testimony based on difficulty
- Problem: Even with alibi claim, might not create catchable contradiction if:
  - Device coverage doesn't catch culprit at claimed location
  - No witness sees culprit somewhere else
- Gap: No validation that alibi creates actual contradiction

**`solver.ts:solve()`**
- Currently: Reports `difficultyTier: 'easy' | 'medium' | 'hard' | 'unsolvable'`
- Problem: "Unsolvable" tier exists and accounts for 2%
- Insight: Solver already detects unsolvable cases; we just need to prevent them

### What's Missing

1. **Signal-specific validation** - Current validators check chains exist, but not if culprit has a CATCHABLE signal (contradiction they're party to)

2. **Signal injection** - No mechanism to fix marginal cases

3. **Generation-time integration** - Validators run after generation, not as a gate during generation

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CASE GENERATION PIPELINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. World Setup    →  Places, NPCs, devices, relationships     │
│  2. Crime Setup    →  Culprit, target, window, place           │
│  3. Simulation     →  Events generated                          │
│  4. Evidence       →  Evidence derived from events              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 5. SIGNAL VALIDATION (NEW)                               │   │
│  │                                                          │   │
│  │    hasSignal = checkSignalExists(evidence, config)       │   │
│  │                                                          │   │
│  │    if (!hasSignal) {                                     │   │
│  │        injectMinimalSignal(world, events, config)        │   │
│  │        re-derive evidence                                │   │
│  │    }                                                     │   │
│  │                                                          │   │
│  │    ASSERT: hasSignal == true                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  6. Difficulty     →  Control discoverability (coverage, etc)  │
│  7. Output         →  CaseConfig + Evidence                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Signal Detection Algorithm

```typescript
interface SignalAnalysis {
    hasSignal: boolean;
    signalType: 'self_contradiction' | 'device_contradiction' | 'scene_presence' | 'opportunity_only';
    signalStrength: 'strong' | 'medium' | 'weak';
    keystonePair?: { evidenceA: string; evidenceB: string };
}

function analyzeSignal(evidence: EvidenceItem[], config: CaseConfig): SignalAnalysis {
    // 1. Check for self-contradiction (culprit claims vs culprit claims)
    const selfContradiction = findSelfContradiction(evidence, config.culpritId);
    if (selfContradiction) {
        return {
            hasSignal: true,
            signalType: 'self_contradiction',
            signalStrength: 'strong',
            keystonePair: selfContradiction,
        };
    }

    // 2. Check for device contradiction (culprit claims vs device log)
    const deviceContradiction = findDeviceContradiction(evidence, config.culpritId);
    if (deviceContradiction) {
        return {
            hasSignal: true,
            signalType: 'device_contradiction',
            signalStrength: 'strong',
            keystonePair: deviceContradiction,
        };
    }

    // 3. Check for scene presence (device log places culprit at crime scene)
    const scenePresence = findScenePresence(evidence, config);
    if (scenePresence) {
        return {
            hasSignal: true,
            signalType: 'scene_presence',
            signalStrength: 'medium',
        };
    }

    // 4. Opportunity only - NOT SUFFICIENT
    return {
        hasSignal: false,
        signalType: 'opportunity_only',
        signalStrength: 'weak',
    };
}
```

### Signal Injection Strategy

When validation fails, inject the **minimal** signal needed:

```typescript
function injectMinimalSignal(
    world: World,
    events: SimEvent[],
    config: CaseConfig,
    rng: RNG
): SimEvent[] {
    // Strategy: Add a device event that catches culprit
    // This is the least intrusive injection

    // Find a door sensor between crime place and adjacent room
    const door = findDoorNear(config.crimePlace, world);

    if (door) {
        // Add door event during crime window
        const doorEvent = createEvent(
            getTickForWindow(config.crimeWindow) + 5,
            'DOOR_OPENED',
            {
                actor: config.culpritId,
                place: config.crimePlace,
                target: door.id,
            }
        );
        events.push(doorEvent);
    }

    return events;
}
```

### Difficulty Tuning (Post-Fix)

After solvability is guaranteed, difficulty controls:

| Dimension | Easy | Medium | Hard |
|-----------|------|--------|------|
| **Signal type** | 80% self-contradiction | 60% device contradiction | 50% scene presence |
| **Lie window** | Crime window | Off-axis window | Crime window (buried) |
| **Coverage** | Full | 1 gap | 2 gaps (never crime window) |
| **Competing narratives** | None | None | 1 innocent red herring |
| **Noise level** | Low | Medium | High (more innocent contradictions) |

**Key invariant:** Signal ALWAYS exists. Difficulty controls how hard to find it.

---

## Constraints

### Technical Constraints
- Must not break determinism (same seed = same case after fix)
- Signal injection must use RNG for determinism
- Validation must be fast (<10ms per case)

### Design Constraints
- Injected signals must feel natural, not "bolted on"
- Fix must not make easy mode trivial
- Fix must not make hard mode solvable by accident

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Injection feels artificial | Medium | Medium | Inject device events (natural) not testimony (obvious) |
| Breaks existing valid seeds | Low | High | Run full regression on 500+ seeds |
| Over-corrects (too easy) | Medium | Medium | Validate difficulty distribution unchanged |
| Performance impact | Low | Low | Validation is O(n²) on evidence count, ~100 items max |

---

## Open Questions

- [x] Should we reject seeds or inject signals? → **Inject** (don't waste seeds)
- [ ] Should signal injection be logged for debugging?
- [ ] Should variety system control signal type distribution now or later?
- [ ] What's the right ratio of signal types per difficulty?

---

## Implementation Plan

### Phase 1: Signal Analysis (Day 1)
- [ ] Add `analyzeSignal()` function to validators.ts
- [ ] Add signal metrics to solver output
- [ ] Measure current signal distribution across 500 seeds

### Phase 2: Signal Validation (Day 1)
- [ ] Add `validateSignalExists()` to generation pipeline
- [ ] Call after evidence derivation, before difficulty application
- [ ] Log cases that would fail (for debugging)

### Phase 3: Signal Injection (Day 2)
- [ ] Add `injectMinimalSignal()` function
- [ ] Integrate into pipeline when validation fails
- [ ] Re-derive evidence after injection

### Phase 4: Validation (Day 2)
- [ ] Run solver on 500+ seeds
- [ ] Verify ≥95% solvability
- [ ] Verify difficulty distribution unchanged
- [ ] Update SPEC_ALIGNMENT.md

### Phase 5: Tuning Hooks (Day 3, optional)
- [ ] Add `signalType` to CaseConfig
- [ ] Add signal distribution config per difficulty
- [ ] Wire into variety system design

---

## Next Steps

1. [x] Get discovery approved
2. [x] Hand off to Planner for task breakdown
3. [ ] Implement Task 001 (Signal Analysis)
4. [ ] Implement Task 002 (Signal Injection)
5. [ ] Implement Task 003 (Pipeline Integration)
6. [ ] Verify ≥95% solvability across 500+ seeds

---

## References

- Spec: `/home/denk/Code/aura/docs/casefiles/koa-casefiles.md` (Section 13.1)
- Variety design: `/home/denk/Code/aura/packages/koa-casefiles/VARIETY.md`
- Current solver: `/home/denk/Code/aura/packages/koa-casefiles/src/solver.ts`
- Current validators: `/home/denk/Code/aura/packages/koa-casefiles/src/validators.ts`
