# Task 001: DifficultyProfile Type & Mapping Table

**Status:** ready
**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4, R3.4

---

## Objective

Add `DifficultyProfile` interface and `DIFFICULTY_PROFILES` constant to `types.ts`, creating the single source of truth for all tier-related configuration.

---

## Context

### Relevant Files
- `src/types.ts` — Add new types; refactor `DIFFICULTY_TIER_TARGETS` to derive from profiles
- `tests/difficulty-profiles.test.ts` — New test file

### Embedded Context

**Current state in `types.ts` (lines 391-466):**

```typescript
// Two separate, unconnected structures:
export interface DifficultyConfig {
    tier: 1 | 2 | 3 | 4;
    suspectCount: number;      // 4-7
    windowCount: number;       // 4-8
    twistRules: TwistType[];   // Enabled twist types
    redHerringStrength: number; // 1-10
}

export const DIFFICULTY_TIER_TARGETS: Record<number, {
    minAP: number; maxAP: number;
    minContradictions: number; maxContradictions: number;
    minBranching: number;
}> = {
    1: { minAP: 4, maxAP: 8, minContradictions: 1, maxContradictions: 3, minBranching: 2 },
    2: { minAP: 7, maxAP: 14, minContradictions: 3, maxContradictions: 5, minBranching: 2 },
    3: { minAP: 10, maxAP: 16, minContradictions: 4, maxContradictions: 7, minBranching: 3 },
    4: { minAP: 12, maxAP: 18, minContradictions: 5, maxContradictions: 8, minBranching: 3 },
};
```

**Types to add:**

```typescript
export type DifficultyTier = 1 | 2 | 3 | 4;

export interface DifficultyProfile {
    tier: DifficultyTier;
    name: string;                                  // 'Tutorial' | 'Standard' | 'Challenging' | 'Expert'
    puzzleDifficulty: 'easy' | 'medium' | 'hard';  // Legacy mapping for evidence.ts
    deviceGaps: 0 | 1 | 2;                         // Number of offline windows
    twistRules: TwistType[];
    redHerringStrength: number;                     // 1-10
    preferredSignalType: SignalType;
    targets: {
        minAP: number; maxAP: number;
        minContradictions: number; maxContradictions: number;
        minBranching: number;
    };
}

export const DIFFICULTY_PROFILES: Record<DifficultyTier, DifficultyProfile> = {
    1: {
        tier: 1, name: 'Tutorial',
        puzzleDifficulty: 'easy', deviceGaps: 0,
        twistRules: [],
        redHerringStrength: 3,
        preferredSignalType: 'self_contradiction',
        targets: { minAP: 4, maxAP: 8, minContradictions: 1, maxContradictions: 3, minBranching: 2 },
    },
    2: {
        tier: 2, name: 'Standard',
        puzzleDifficulty: 'easy', deviceGaps: 0,
        twistRules: ['false_alibi', 'unreliable_witness'],
        redHerringStrength: 5,
        preferredSignalType: 'self_contradiction',
        targets: { minAP: 7, maxAP: 14, minContradictions: 3, maxContradictions: 5, minBranching: 2 },
    },
    3: {
        tier: 3, name: 'Challenging',
        puzzleDifficulty: 'medium', deviceGaps: 1,
        twistRules: ['false_alibi', 'unreliable_witness', 'planted_evidence'],
        redHerringStrength: 7,
        preferredSignalType: 'device_contradiction',
        targets: { minAP: 10, maxAP: 16, minContradictions: 4, maxContradictions: 7, minBranching: 3 },
    },
    4: {
        tier: 4, name: 'Expert',
        puzzleDifficulty: 'hard', deviceGaps: 2,
        twistRules: ['false_alibi', 'unreliable_witness', 'tampered_device', 'planted_evidence', 'accomplice'],
        redHerringStrength: 9,
        preferredSignalType: 'scene_presence',
        targets: { minAP: 12, maxAP: 18, minContradictions: 5, maxContradictions: 8, minBranching: 3 },
    },
};

// Backward-compat: derive old DifficultyConfig from profile
export function profileToDifficultyConfig(profile: DifficultyProfile): DifficultyConfig {
    return {
        tier: profile.tier,
        suspectCount: 5,
        windowCount: 6,
        twistRules: profile.twistRules,
        redHerringStrength: profile.redHerringStrength,
    };
}
```

**Derive `DIFFICULTY_TIER_TARGETS` from profiles** (replace hardcoded constant):

```typescript
export const DIFFICULTY_TIER_TARGETS: Record<number, {
    minAP: number; maxAP: number;
    minContradictions: number; maxContradictions: number;
    minBranching: number;
}> = Object.fromEntries(
    Object.values(DIFFICULTY_PROFILES).map(p => [p.tier, p.targets])
) as Record<number, typeof DIFFICULTY_PROFILES[1]['targets']>;
```

### Source Docs
- `_process/features/005-four-tier-difficulty/notes.md` — Tier design rationale

---

## Acceptance Criteria

### AC-1: DIFFICULTY_PROFILES covers all 4 tiers ← R1.2
- **Given:** Importing `DIFFICULTY_PROFILES` from `types.ts`
- **When:** Accessing tiers 1 through 4
- **Then:** Each tier has the expected `name`, `puzzleDifficulty`, `deviceGaps`, `twistRules`, `preferredSignalType`, and `targets`

### AC-2: DIFFICULTY_TIER_TARGETS backward compat ← R1.3
- **Given:** Existing code using `DIFFICULTY_TIER_TARGETS[2]`
- **When:** Accessing any tier's targets
- **Then:** Returns same values as before (`{minAP: 7, maxAP: 14, ...}` for tier 2)

### AC-3: profileToDifficultyConfig maps correctly ← R1.4
- **Given:** `DIFFICULTY_PROFILES[3]`
- **When:** Calling `profileToDifficultyConfig()`
- **Then:** Returns `{ tier: 3, suspectCount: 5, windowCount: 6, twistRules: ['false_alibi', 'unreliable_witness', 'planted_evidence'], redHerringStrength: 7 }`

---

## Edge Cases

### EC-1: Non-existent tier
- **Scenario:** Accessing `DIFFICULTY_PROFILES[5 as any]`
- **Expected:** Returns `undefined` (no runtime guard needed, TypeScript prevents at compile time)

---

## Error Cases

### ERR-1: DifficultyTier type shadows director.ts export
- **When:** `director.ts` has `export type DifficultyTier = 'easy' | 'medium' | 'hard'`
- **Then:** No conflict — director.ts is dead code (never instantiated). Just add the new type to types.ts. Don't modify director.ts.

---

## Scope

**In Scope:**
- `DifficultyTier` type
- `DifficultyProfile` interface
- `DIFFICULTY_PROFILES` constant
- `profileToDifficultyConfig()` helper
- Refactor `DIFFICULTY_TIER_TARGETS` to derive from profiles
- Add `export type Twist = TwistRule;` to `types.ts` (fixes pre-existing import error in `director.ts`, moved from dropped Task 003)

**Out of Scope:**
- Modifying `simulate()`, `evidence.ts`, `cli.ts`, or `director.ts` (Tasks 002, 004)
- Removing `DifficultyConfig` or `DIFFICULTY_PRESETS` (Task 002)

---

## Implementation Hints

1. Place new types in the "Difficulty System" section of `types.ts` (around line 388).
2. Keep `DifficultyConfig` as-is — it's still imported by sim.ts and cli.ts until Task 002.
3. Keep `DIFFICULTY_TIER_TARGETS` export name unchanged — just change how it's computed.
4. The `twistRules` arrays must use `as TwistType[]` or be typed explicitly since string literals won't auto-narrow.
5. Add `export type Twist = TwistRule;` near the `TwistRule` type. This fixes director.ts's pre-existing import error (moved from dropped Task 003).

---

## Log

### Planning Notes
**Context:** Foundation task — all other tasks depend on these types. Must ship first.
**Decisions:** Chose to derive `DIFFICULTY_TIER_TARGETS` from profiles rather than duplicate values. This ensures they can never drift.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
