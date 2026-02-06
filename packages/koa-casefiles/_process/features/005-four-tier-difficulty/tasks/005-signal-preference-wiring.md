# Task 005: Wire Signal Preference into generateValidatedCase

**Status:** done
**Complexity:** S
**Depends On:** 001
**Implements:** R5.1, R5.2

---

## Objective

Auto-derive `SignalConfig.preferredType` from the tier's profile when `generateValidatedCase()` is called without an explicit `signalConfig`.

---

## Context

### Relevant Files
- `src/sim.ts` — Update `generateValidatedCase()` to auto-populate signalConfig
- `tests/difficulty-signal.test.ts` — New test file

### Embedded Context

**Current `generateValidatedCase()` (sim.ts:1538-1576):**
```typescript
export function generateValidatedCase(
    seed: number,
    difficultyTier: number = 2,
    options: SimulationOptions = {}
): { sim: SimulationResult; evidence: EvidenceItem[] } | null {
    const sim = simulate(seed, difficultyTier, options);
    if (!sim) return null;

    let evidence = deriveEvidence(sim.world, sim.eventLog, sim.config);
    const signal = analyzeSignal(evidence, sim.config);

    if (!signal.hasSignal) {
        const injectionRng = createRng(seed + 10000);
        const injected = injectMinimalSignal(sim.world, sim.eventLog, sim.config, injectionRng);
        if (!injected) return null;
        evidence = deriveEvidence(sim.world, sim.eventLog, sim.config);
        sim.config.injectedSignal = true;
        const recheck = analyzeSignal(evidence, sim.config);
        if (!recheck.hasSignal) {
            console.error(`Signal injection failed for seed ${seed} - seed unsalvageable`);
            return null;
        }
    }

    return { sim, evidence };
}
```

**Change — add signal preference auto-derivation before simulate() call:**
```typescript
export function generateValidatedCase(
    seed: number,
    tier: DifficultyTier = 2,
    options: SimulationOptions = {}
): { sim: SimulationResult; evidence: EvidenceItem[] } | null {
    // Auto-derive signal preference from tier if not explicitly set
    if (!options.signalConfig) {
        const profile = DIFFICULTY_PROFILES[tier];
        options = { ...options, signalConfig: { preferredType: profile.preferredSignalType } };
    }

    const sim = simulate(seed, tier, options);
    // ... rest unchanged
}
```

**How `signalConfig` flows:**
1. `generateValidatedCase()` sets `signalConfig` on options
2. `simulate()` stores it on `CaseConfig.signalConfig`
3. Feature 001's `analyzeSignal()` can use it for reporting which signal type the case targets
4. The preference is best-effort — it doesn't force injection for type mismatch, only for missing signals

**Per-tier signal preferences:**
- Tier 1 → `self_contradiction` (easiest to spot)
- Tier 2 → `self_contradiction` (usually obvious)
- Tier 3 → `device_contradiction` (requires comparison)
- Tier 4 → `scene_presence` (weakest, requires synthesis)

---

## Acceptance Criteria

### AC-1: Tier 1 auto-derives self_contradiction ← R5.1
- **Given:** `generateValidatedCase(1, 1)` (no explicit signalConfig)
- **When:** Case is generated
- **Then:** `sim.config.signalConfig.preferredType === 'self_contradiction'`

### AC-2: Tier 4 auto-derives scene_presence ← R5.1
- **Given:** `generateValidatedCase(1, 4)` (no explicit signalConfig)
- **When:** Case is generated
- **Then:** `sim.config.signalConfig.preferredType === 'scene_presence'`

### AC-3: Explicit signalConfig not overridden ← R5.2
- **Given:** `generateValidatedCase(1, 1, { signalConfig: { preferredType: 'device_contradiction' } })`
- **When:** Case is generated
- **Then:** `sim.config.signalConfig.preferredType === 'device_contradiction'` (caller's preference wins)

---

## Edge Cases

### EC-1: Signal preference is best-effort
- **Scenario:** Tier 1 prefers `self_contradiction` but natural simulation produces `device_contradiction`
- **Expected:** Natural signal is kept. No forced injection for type mismatch — injection only happens when NO signal exists.

### EC-2: Default tier
- **Scenario:** `generateValidatedCase(seed)` (no tier arg)
- **Expected:** Defaults to tier 2, auto-derives `self_contradiction` preference

---

## Error Cases

### ERR-1: signalConfig with minStrength
- **When:** Caller provides `signalConfig: { minStrength: 'strong' }` but no `preferredType`
- **Then:** Auto-derivation should NOT overwrite — caller explicitly provided a signalConfig. Only auto-derive when `options.signalConfig` is falsy.

---

## Scope

**In Scope:**
- Auto-derive `signalConfig` in `generateValidatedCase()`
- Test all 4 tier preferences
- Test override behavior

**Out of Scope:**
- Changing `analyzeSignal()` behavior based on preference
- Forcing injection for type mismatch (only inject for missing signals)
- CLI verbose signal display

---

## Implementation Hints

1. This is a small change — just 4 lines added before the `simulate()` call.
2. The key is the `if (!options.signalConfig)` guard — respect caller's explicit config.
3. Note: Task 002 changes the `generateValidatedCase` signature from `difficultyTier: number` to `tier: DifficultyTier`. If Task 002 is done first, use the new signature. If implementing in parallel with 002, use the current signature and update during integration.

---

## Log

### Planning Notes
**Context:** Wires Feature 001's tuning hooks (SignalConfig) as called out in notes.md "Hooks from Feature 001 (ready to wire)".
**Decisions:** Best-effort preference only. No forced injection for type mismatch.

### Implementation Notes
- Added auto-derivation in `generateValidatedCase()`: if `!options.signalConfig`, derives `{ preferredType: profile.preferredSignalType }` from tier profile
- Uses `if (!options.signalConfig)` guard — respects caller's explicit config (even if only `minStrength` is set)
- Updated `tuning-hooks.test.ts` backward-compat test: `signalConfig` is now auto-derived (not undefined) by default
- 6 tests in `tests/difficulty-signal.test.ts` — all pass
- Gemini review: PASS

### Review Notes
> Written by Reviewer
