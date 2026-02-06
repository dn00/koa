# Task 006: Regression & Batch Validation

**Status:** backlog
**Complexity:** M
**Depends On:** 002, 004, 005
**Implements:** R6.1, R6.2, R6.3, R6.4

---

## Objective

Verify all 4 tiers work correctly, nothing regressed from feature 001, and signal distribution matches tier expectations.

---

## Context

### Relevant Files
- `tests/four-tier-regression.test.ts` — New batch validation test file
- All existing test files — Must still pass

### Embedded Context

**Retrospective lessons to validate:**

1. **Anti-anticlimax (retro lesson #1):** `validateAntiAnticlimax()` checks `window + actor + place`. Signal injection places events at adjacent rooms. Must pass at all tiers.

2. **Red herring alibis (retro lesson #2):** `findExculpatingEvidence()` checks both `presence` and `device_log` evidence. Must work at all tiers.

3. **Protected windows (retro lesson #3):** `getOfflineWindowsByGaps()` must never offline crime window or adjacent windows. Critical for tiers 3-4 which have device gaps.

**Test patterns from existing tests:**

```typescript
// From signal-analysis.test.ts — helper pattern
function makeConfig(overrides: Partial<CaseConfig> = {}): CaseConfig {
    return {
        seed: 1, suspects: ['alice', 'bob', 'carol', 'dan'],
        culpritId: 'alice', crimeType: 'theft', crimeMethod: 'lockpick',
        targetItem: 'necklace', crimeWindow: 'W3', crimePlace: 'kitchen',
        hiddenPlace: 'garage', motive: { type: 'greed', target: 'necklace' },
        suspiciousActs: [],
        ...overrides,
    };
}
```

**Batch test pattern:**
```typescript
import { generateValidatedCase } from '../src/sim.js';
import { analyzeSignal } from '../src/validators.js';
import { type DifficultyTier, DIFFICULTY_PROFILES } from '../src/types.js';

describe('four-tier regression', () => {
    const SEEDS_PER_TIER = 200;

    for (const tier of [1, 2, 3, 4] as DifficultyTier[]) {
        describe(`Tier ${tier} (${DIFFICULTY_PROFILES[tier].name})`, () => {
            // Generate all cases for this tier
            const results = Array.from({ length: SEEDS_PER_TIER }, (_, i) =>
                generateValidatedCase(i + 1, tier)
            );

            it('achieves >=95% solvability', () => {
                const valid = results.filter(r => r !== null).length;
                expect(valid / SEEDS_PER_TIER).toBeGreaterThanOrEqual(0.95);
            });

            // ... more tests per tier
        });
    }
});
```

**Validation functions to test:**
```typescript
import { validateCase } from '../src/validators.js';
// validateCase calls: validateSolvability, validateAntiAnticlimax, validateRedHerrings, validateDifficulty, validateFunness
```

---

## Acceptance Criteria

### AC-1: All existing tests pass ← R6.1
- **Given:** `npx vitest run` in packages/koa-casefiles
- **When:** Running
- **Then:** All tests pass (smoke, signal-analysis, signal-injection, pipeline-integration, tuning-hooks, plus any new tests from tasks 001-005)

### AC-2: Each tier >=95% solvability ← R6.2
- **Given:** 200 seeds per tier via `generateValidatedCase()`
- **When:** Counting non-null returns
- **Then:** Each tier has <=5% null rate (>=95% solvable)

### AC-3: Tier 1 signal distribution ← R6.3
- **Given:** 200 tier-1 cases
- **When:** Running `analyzeSignal()` on each
- **Then:** >=80% have `signalType === 'self_contradiction'`

### AC-4: Device gaps match profile ← R6.4
- **Given:** Tier 3 case with known crimeWindow
- **When:** Examining evidence for offline windows (windows with no device_log evidence)
- **Then:** Exactly 1 non-crime, non-adjacent window has no device logs

### AC-5: Anti-anticlimax passes per tier (retro lesson #1)
- **Given:** 200 seeds per tier via `generateValidatedCase()`
- **When:** Running `validateAntiAnticlimax()` on each valid case
- **Then:** >=95% pass per tier

### AC-6: Red herring alibis pass per tier (retro lesson #2)
- **Given:** 200 seeds per tier via `generateValidatedCase()`
- **When:** Running `validateRedHerrings()` on each valid case
- **Then:** >=95% pass per tier

---

## Edge Cases

### EC-1: Tier 4 with maximum device gaps
- **Scenario:** Tier 4 has `deviceGaps: 2` — most evidence gaps
- **Expected:** Still solvable because crime window and adjacent windows are protected; signal injection still works

### EC-2: Signal injection at tier 4
- **Scenario:** Tier 4 cases that need signal injection (no natural signal)
- **Expected:** Injection succeeds because adjacent windows are not offlined

---

## Error Cases

### ERR-1: Flaky test from RNG
- **When:** A specific seed occasionally fails
- **Then:** Acceptable if within 5% failure budget. Log seed for investigation if it causes test flakiness.

---

## Scope

**In Scope:**
- Run existing test suite
- New batch validation tests per tier
- Signal distribution check for tier 1
- Anti-anticlimax and red herring regression checks
- Device gap verification

**Out of Scope:**
- Performance benchmarking
- Tier 3 balance tuning (may need future iteration)
- CLI output format testing

---

## Implementation Hints

1. Use `vitest` with longer timeout for batch tests (200 seeds x 4 tiers = 800 cases).
2. Generate all cases in a `beforeAll` or at module level to avoid re-generation per test.
3. The `generateValidatedCase` function returns `null` for unsalvageable seeds — count these as failures.
4. For device gap verification: derive evidence, then check which windows have zero `device_log` entries.
5. For anti-anticlimax: call `validateAntiAnticlimax(config, evidence)` directly.
6. For red herrings: call `validateRedHerrings(world, config, evidence)` directly.

---

## Log

### Planning Notes
**Context:** Final verification task. Catches any bugs introduced by tasks 001-005 and validates the retrospective lessons from feature 001.
**Decisions:** 200 seeds per tier (800 total) — enough for statistical confidence at 95% thresholds.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
