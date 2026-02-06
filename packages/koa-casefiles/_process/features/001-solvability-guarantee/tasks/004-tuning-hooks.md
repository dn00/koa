# Task 004: Tuning Hooks (P1)

**Status:** done
**Complexity:** S
**Depends On:** 003
**Implements:** R4.1, R4.2, R5.1, R5.2

---

## Objective

Add configuration and metrics for signal type tuning, enabling the variety system to control signal distribution per difficulty level.

---

## Context

### Relevant Files
- `src/types.ts` - Add `SignalConfig` to `CaseConfig`
- `src/solver.ts` - Add `signalAnalysis` to `SolverResult`
- `src/director.ts` - May integrate signal type preferences

### Embedded Context

**Types to add to `src/types.ts`:**

```typescript
// Signal configuration for variety system
export interface SignalConfig {
    /** Preferred signal type (generation will try to achieve this) */
    preferredType?: SignalType;
    /** Minimum acceptable signal strength */
    minStrength?: SignalStrength;
}

// Extend CaseConfig
export interface CaseConfig {
    // ... existing fields ...
    signalConfig?: SignalConfig;
    injectedSignal?: boolean;
}
```

**Add to `SolverResult` in solver.ts:**

```typescript
export interface SolverResult {
    // ... existing fields ...
    signalAnalysis?: SignalAnalysis;  // From analyzeSignal()
}
```

**Current difficulty config (from sim.ts):**

```typescript
export const DIFFICULTY_PRESETS: Record<number, DifficultyConfig> = {
    1: { tier: 1, twistRules: [], ... },
    2: { tier: 2, twistRules: ['false_alibi', 'unreliable_witness'], ... },
    3: { tier: 3, twistRules: [...], ... },
    4: { tier: 4, twistRules: [...], ... },
};
```

**Future variety system integration (from VARIETY.md):**

```typescript
// Example: Variety system requests signal distribution
const varietyConfig = {
    easy: { signalType: 'self_contradiction', probability: 0.8 },
    medium: { signalType: 'device_contradiction', probability: 0.6 },
    hard: { signalType: 'scene_presence', probability: 0.5 },
};
```

### Source Docs
- `_process/features/001-solvability-guarantee/discovery.md` - Section "Difficulty Tuning (Post-Fix)"
- `VARIETY.md` - Future variety system design

---

## Acceptance Criteria

### AC-1: SignalConfig type exists ← R4.1
- **Given:** types.ts
- **When:** TypeScript compiles
- **Then:** `SignalConfig` interface is available for import

### AC-2: Director can request signal type ← R4.2
- **Given:** `CaseConfig` with `signalConfig: { preferredType: 'self_contradiction' }`
- **When:** Case is generated
- **Then:** If possible, case has `self_contradiction` signal (best effort, not guaranteed)

### AC-3: Solver output includes signal analysis ← R5.1
- **Given:** Solver runs on a case
- **When:** `SolverResult` is returned
- **Then:** `result.signalAnalysis` contains the SignalAnalysis from `analyzeSignal()`

### AC-4: Signal strength metric available ← R5.2
- **Given:** Signal analysis in solver result
- **When:** Accessing `result.signalAnalysis.signalStrength`
- **Then:** Returns `'strong' | 'medium' | 'weak'`

---

## Edge Cases

### EC-1: Preferred type not achievable
- **Scenario:** `preferredType: 'self_contradiction'` but natural simulation produced `scene_presence`
- **Expected:** Use the natural signal (don't force injection just for preference)

### EC-2: Multiple signals match preference
- **Scenario:** Both `self_contradiction` and `device_contradiction` exist
- **Expected:** Report the one matching preference, or strongest if no preference

---

## Error Cases

### ERR-1: Invalid signal type in config
- **When:** `signalConfig.preferredType` is not a valid SignalType
- **Then:** TypeScript compilation error (caught at build time)

---

## Scope

**In Scope:**
- Add `SignalConfig` type
- Add `signalConfig` to `CaseConfig`
- Add `signalAnalysis` to `SolverResult`
- Update solver to include signal analysis in output

**Out of Scope:**
- Actual variety system implementation
- Forcing specific signal types during generation
- UI for signal configuration

---

## Implementation Hints

1. **Add types to types.ts:**
   ```typescript
   export interface SignalConfig {
       preferredType?: SignalType;
       minStrength?: SignalStrength;
   }
   ```

2. **Update solver.ts `solve()` function:**
   ```typescript
   // Near the end of solve(), add:
   const signalAnalysis = analyzeSignal(session.knownEvidence, config);

   return {
       // ... existing fields ...
       signalAnalysis,
   };
   ```

3. **Update cli.ts to display signal info:**
   ```typescript
   if (verbose && result.signalAnalysis) {
       console.log(`Signal: ${result.signalAnalysis.signalType} (${result.signalAnalysis.signalStrength})`);
   }
   ```

4. This task is P1 (should have) not P0 (must have). It prepares for future variety system but doesn't change core solvability.

---

## Log

### Planning Notes
**Context:** This task enables the variety system to tune signal distribution. It's foundational for making difficulty feel different rather than just harder.
**Decisions:** Keep as P1 - solvability guarantee (Tasks 001-003) is the priority. This can ship later.

### Implementation Notes

**Files modified:**
- `src/types.ts` — Added `SignalConfig` interface and `signalConfig?: SignalConfig` to `CaseConfig`
- `src/solver.ts` — Added `signalAnalysis?: SignalAnalysis` to `SolveResult`, imported `analyzeSignal`, computed signal analysis in `solve()` and included in all return paths
- `src/sim.ts` — Added `signalConfig?: SignalConfig` to `SimulationOptions`, passed through to `CaseConfig` in both legacy and blueprint simulation paths

**Files created:**
- `tests/tuning-hooks.test.ts` — 7 test blocks (4 AC + 2 EC + 1 ERR = 7 test blocks, 16 individual tests)

**Test count:** Task has 4 ACs + 2 ECs + 1 ERR = 7 requirements. Test file has 7 test blocks. ✓

**Design notes:**
- `SignalConfig.preferredType` is best-effort — the system reports the natural signal type. Injection only happens when no signal exists at all (not to match a preference). This aligns with "Out of Scope: Forcing specific signal types during generation".
- `signalAnalysis` is computed once early in `solve()` using `analyzeSignal()` on full evidence, then included in all return paths.
- `signalConfig` flows through `SimulationOptions` → `simulate()` → `CaseConfig` for both legacy and blueprint paths.

### Review Notes
> Written by Reviewer
