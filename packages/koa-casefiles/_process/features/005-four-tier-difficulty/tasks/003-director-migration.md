# Task 003: Migrate CaseDirector to 4-Tier Numeric

**Status:** dropped
**Complexity:** M
**Depends On:** 001
**Implements:** ~~R3.1, R3.2, R3.3, R3.4~~

> **Dropped:** CaseDirector is dead code (imported but never instantiated). Tier selection is an editorial decision via static schedule config (see Feature 002 notes), not runtime rotation logic. The only actionable item — `export type Twist = TwistRule;` in types.ts — has been moved to Task 001. The director will be revisited if/when a runtime rotation use case emerges.

---

## Objective

Rewrite `CaseDirector` from 3 string tiers (`'easy' | 'medium' | 'hard'`) to 4 numeric tiers (`1 | 2 | 3 | 4`), add `getSignalConfig()` method, and fix the pre-existing `Twist` import error.

---

## Context

### Relevant Files
- `src/director.ts` — Major rewrite
- `src/types.ts` — Add `export type Twist = TwistRule;` to fix import error
- `tests/director.test.ts` — New test file

### Embedded Context

**Current director.ts (lines 1-34):**
```typescript
import type { NPCId, TwistType, Twist, World } from './types.js';
// ^^^ Twist doesn't exist in types.ts — pre-existing error

export type DifficultyTier = 'easy' | 'medium' | 'hard';

export type RotationPattern =
    | 'fixed'           // Always same difficulty
    | 'cycle'           // easy → medium → hard → easy...
    | 'ramp'            // easy → easy → medium → medium → hard...
    | 'random'          // Random each case
    | 'weighted';       // Weighted random

export interface DirectorConfig {
    pattern: RotationPattern;
    baseDifficulty: DifficultyTier;
    weights?: { easy: number; medium: number; hard: number };
    rampLength?: number;
}

export const DEFAULT_DIRECTOR_CONFIG: DirectorConfig = {
    pattern: 'fixed',
    baseDifficulty: 'easy',
};
```

**New director.ts:**
```typescript
import type { NPCId, TwistType, TwistRule, World, SignalConfig } from './types.js';
import { type DifficultyTier, DIFFICULTY_PROFILES } from './types.js';

export type RotationPattern =
    | 'fixed'           // Always same tier
    | 'cycle'           // 1 → 2 → 3 → 4 → 1...
    | 'ramp'            // N cases at each tier, ascending
    | 'random'          // Random 1-4 each case
    | 'weighted';       // Weighted random across 4 tiers

export interface DirectorConfig {
    pattern: RotationPattern;
    baseTier: DifficultyTier;                    // Was baseDifficulty
    weights?: Record<DifficultyTier, number>;    // Was { easy, medium, hard }
    rampLength?: number;
}

export const DEFAULT_DIRECTOR_CONFIG: DirectorConfig = {
    pattern: 'fixed',
    baseTier: 2,
};

export class CaseDirector {
    getCurrentTier(): DifficultyTier { ... }

    getSignalConfig(): SignalConfig {
        const profile = DIFFICULTY_PROFILES[this.getCurrentTier()];
        return { preferredType: profile.preferredSignalType };
    }

    getDifficultyName(): string {
        const profile = DIFFICULTY_PROFILES[this.getCurrentTier()];
        return profile.name;
    }
}
```

**Fix `Twist` import — add to types.ts:**
```typescript
/** @deprecated Use TwistRule instead */
export type Twist = TwistRule;
```

**Cycle pattern change** (4 tiers instead of 3):
```typescript
// Before (3 tiers):
const tiers: DifficultyTier[] = ['easy', 'medium', 'hard'];
return tiers[this.caseCount % 3];

// After (4 tiers):
const tiers: DifficultyTier[] = [1, 2, 3, 4];
return tiers[this.caseCount % 4];
```

**Weighted pattern** (4 buckets):
```typescript
// Before:
weights?: { easy: number; medium: number; hard: number };

// After:
weights?: Record<DifficultyTier, number>;  // { 1: 30, 2: 40, 3: 20, 4: 10 }
```

### Source Docs
- `_process/features/005-four-tier-difficulty/notes.md` — Section "Hooks from Feature 001"

---

## Acceptance Criteria

### AC-1: getCurrentTier() returns numeric tier ← R3.1
- **Given:** `new CaseDirector({ baseTier: 1 })`
- **When:** Calling `getCurrentTier()`
- **Then:** Returns `1`

### AC-2: getSignalConfig() returns per-tier preference ← R3.2
- **Given:** Director at tier 3
- **When:** Calling `getSignalConfig()`
- **Then:** Returns `{ preferredType: 'device_contradiction' }`

### AC-3: Cycle pattern covers 4 tiers ← R3.3
- **Given:** `{ pattern: 'cycle', baseTier: 1 }`
- **When:** Calling `nextCase()` 4 times and reading `getCurrentTier()` each time
- **Then:** Tiers are 1, 2, 3, 4

### AC-4: Twist type import compiles ← R3.4
- **Given:** `director.ts` imports from `types.ts`
- **When:** TypeScript compiles
- **Then:** No error about missing `Twist` export

---

## Edge Cases

### EC-1: Weighted pattern with 4 tiers
- **Scenario:** `{ pattern: 'weighted', weights: { 1: 50, 2: 30, 3: 15, 4: 5 } }`
- **Expected:** Distribution roughly matches weights over many calls

### EC-2: Ramp pattern with 4 tiers
- **Scenario:** `{ pattern: 'ramp', baseTier: 1, rampLength: 2 }`
- **Expected:** Cases 0-1 at tier 1, cases 2-3 at tier 2, cases 4-5 at tier 3, cases 6-7 at tier 4, then wraps

---

## Error Cases

### ERR-1: Invalid baseTier
- **When:** `new CaseDirector({ baseTier: 5 as any })`
- **Then:** Falls back to tier 2 (default)

---

## Scope

**In Scope:**
- Rewrite `CaseDirector` for 4 numeric tiers
- Add `getSignalConfig()` method
- Add `getDifficultyName()` method
- Fix `Twist` type alias in `types.ts`
- Update all rotation patterns for 4 tiers
- New test file

**Out of Scope:**
- Modifying `sim.ts` (Task 002)
- Modifying `cli.ts` or `game.ts` (Task 004)

**Note: CaseDirector is currently dead code.** It's imported in `sim.ts:96` but never instantiated. We rewrite it now so it's ready for Feature 002 (Daily Seeds) which will use `director.getCurrentTier()` and `director.getSignalConfig()` for daily puzzle tier rotation. The `sim.ts` import of `type DifficultyTier` from director.ts must be moved to import from `types.ts` instead (since Task 001 adds the numeric `DifficultyTier` type there).

---

## Implementation Hints

1. Add `export type Twist = TwistRule;` to `types.ts` first (one-liner fix).
2. Update `sim.ts:96` import: `type DifficultyTier` should come from `types.ts`, not `director.ts`.
2. Replace imports: `DifficultyTier` now comes from `types.ts` (numeric), not locally defined (string).
3. The `selectTwist()` method currently takes difficulty string — change to read from `DIFFICULTY_PROFILES[tier].twistRules`.
4. Keep `RotationPattern` type as-is — the patterns themselves just operate on numbers now.

---

## Log

### Planning Notes
**Context:** Director is used for case progression (daily puzzles, campaigns). Currently not in the hot path — `simulate()` doesn't call it directly. But it needs to be ready for Feature 002 (Daily Seed System).
**Decisions:** Renamed `baseDifficulty` → `baseTier`, `getCurrentDifficulty()` → `getCurrentTier()`.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
