# Task 003: Pipeline Integration

**Status:** backlog
**Complexity:** M
**Depends On:** 001, 002
**Implements:** R3.1, R3.2, R3.3, R3.4, R3.5

---

## Objective

Integrate signal validation and injection into the case generation pipeline so every published case is guaranteed to have a catchable signal.

---

## Context

### Relevant Files
- `src/sim.ts` - Modify `simulate()` and `simulateWithBlueprints()` functions
- `src/evidence.ts` - Called by pipeline, no changes needed
- `src/validators.ts` - `analyzeSignal()` from Task 001
- `src/types.ts` - May need to add `injectedSignal: boolean` to `CaseConfig`

### Embedded Context

**Current pipeline structure in `simulate()` (lines 1033-1236):**

```typescript
export function simulate(
    seed: number,
    difficultyTier: number = 2,
    options: SimulationOptions = {}
): SimulationResult | null {
    // 1. Create world
    // 2. Run pre-crime routines
    // 3. Find opportunities
    // 4. Execute crime
    // 5. Maybe generate twist
    // 6. Run aftermath routines
    // 7. Sort events
    // 8. Build config
    // 9. Return SimulationResult

    return {
        seed,
        world,
        eventLog: allEvents,
        config,
    };
}
```

**Evidence derivation happens OUTSIDE simulate() in the caller:**

```typescript
// In cli.ts or game.ts:
const result = simulate(seed, tier, options);
const evidence = deriveEvidence(result.world, result.eventLog, result.config);
```

**New pipeline flow (signal validation point):**

```
simulate() → SimulationResult
    ↓
deriveEvidence() → EvidenceItem[]
    ↓
analyzeSignal() → SignalAnalysis  ← NEW CHECK
    ↓
if (!hasSignal) {
    injectMinimalSignal()
    re-derive evidence
    assert(analyzeSignal().hasSignal)
}
    ↓
continue with validated case
```

**CaseConfig addition:**

```typescript
// Add to CaseConfig interface in types.ts
export interface CaseConfig {
    // ... existing fields ...
    injectedSignal?: boolean;  // True if signal was injected (for debugging/metrics)
}
```

**Key invariant (from INVARIANTS.md INV-1):**
> ≥95% of cases must be solvable (SPEC REQUIREMENT)
> A keystone contradiction must exist in discoverable evidence

### Source Docs
- `_process/features/001-solvability-guarantee/discovery.md` - Section "Proposed Architecture"
- `_process/project/INVARIANTS.md` - INV-1, INV-1.1

---

## Acceptance Criteria

### AC-1: Signal validation runs after evidence derivation ← R3.1
- **Given:** A case generated with `simulate()`
- **When:** Evidence is derived and signal validation runs
- **Then:** `analyzeSignal()` is called with the derived evidence

### AC-2: Signal injection triggers when validation fails ← R3.2
- **Given:** A seed that produces `hasSignal: false` (opportunity-only case)
- **When:** The full pipeline runs
- **Then:** `injectMinimalSignal()` is called

### AC-3: Evidence re-derived after injection ← R3.3
- **Given:** Signal injection occurred
- **When:** Pipeline continues
- **Then:** `deriveEvidence()` is called again with updated event log, new DeviceLogEvidence exists

### AC-4: All difficulty levels achieve ≥95% solvability ← R3.4
- **Given:** 500 seeds each for easy, medium, hard difficulty
- **When:** `npx tsx src/cli.ts --autosolve --generate 500 --difficulty easy` (and medium, hard)
- **Then:** All achieve ≥95% solvability

### AC-5: Existing valid cases unchanged ← R3.5
- **Given:** A seed that already had a valid signal before this change
- **When:** The updated pipeline runs
- **Then:** Same CaseConfig (except possibly `injectedSignal: false` added), same evidence, same solver result

---

## Edge Cases

### EC-1: Injection fails (no suitable door)
- **Scenario:** `injectMinimalSignal()` returns `null`
- **Expected:** Seed is marked as failed (return `null` from simulate), don't publish unsolvable case

### EC-2: Blueprints path
- **Scenario:** Case generated via `simulateWithBlueprints()`
- **Expected:** Same signal validation/injection logic applies

### EC-3: Signal exists but weak
- **Scenario:** `analyzeSignal()` returns `hasSignal: true, signalStrength: 'weak'`
- **Expected:** No injection needed - weak signal is still valid

---

## Error Cases

### ERR-1: Infinite injection loop
- **When:** After injection, `analyzeSignal()` still returns `hasSignal: false`
- **Then:** Log error and fail the seed (don't loop forever)
- **Error Message:** `Signal injection failed for seed ${seed} - seed unsalvageable`

---

## Scope

**In Scope:**
- Create wrapper function or modify existing functions to include signal validation
- Add `injectedSignal` field to CaseConfig
- Integration tests with batch seed validation
- Update `simulateWithBlueprints()` with same logic

**Out of Scope:**
- Changes to solver (Task 004)
- Changes to signal analysis logic (Task 001)
- Changes to injection logic (Task 002)

---

## Implementation Hints

1. **Option A: Wrapper function** (cleaner, less invasive)
   ```typescript
   export function generateValidatedCase(
       seed: number,
       difficultyTier: number,
       options: SimulationOptions
   ): { sim: SimulationResult; evidence: EvidenceItem[] } | null {
       const sim = simulate(seed, difficultyTier, options);
       if (!sim) return null;

       let evidence = deriveEvidence(sim.world, sim.eventLog, sim.config);
       const signal = analyzeSignal(evidence, sim.config);

       if (!signal.hasSignal) {
           const injected = injectMinimalSignal(sim.world, sim.eventLog, sim.config, createRng(seed));
           if (!injected) return null;  // Seed unsalvageable

           evidence = deriveEvidence(sim.world, sim.eventLog, sim.config);
           sim.config.injectedSignal = true;

           // Verify fix worked
           const recheck = analyzeSignal(evidence, sim.config);
           if (!recheck.hasSignal) {
               console.error(`Signal injection failed for seed ${seed}`);
               return null;
           }
       }

       return { sim, evidence };
   }
   ```

2. **Option B: Modify simulate() directly** (more integrated)
   - Add evidence derivation inside simulate()
   - Add signal validation and injection loop
   - Return both SimulationResult and evidence

3. **Update callers:**
   - `cli.ts` - Update autosolve mode to use new function
   - `game.ts` - Update case loading
   - `solver.ts` - Receives evidence, no changes needed

4. **Batch test command:**
   ```bash
   npx tsx src/cli.ts --autosolve --generate 500
   # Should report ≥95% solvability for each difficulty
   ```

---

## Log

### Planning Notes
**Context:** This is the integration task that ties signal analysis and injection together into the generation pipeline.
**Decisions:** Prefer wrapper function over modifying simulate() to minimize regression risk. Existing callers can opt-in to the new validated flow.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
