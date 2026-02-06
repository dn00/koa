# Task 004: Update CLI and game.ts Parsers

**Status:** backlog
**Complexity:** S
**Depends On:** 002
**Implements:** R4.1, R4.2, R4.3

---

## Objective

Unify `--tier` and `--difficulty` CLI flags into a single tier-based system with named aliases.

---

## Context

### Relevant Files
- `src/cli.ts` — Has its own `parseDifficulty()` at line 58 (local function, returns string). Replace with `parseTier()`, update `simulate()` calls, update help text
- `src/game.ts` — Has its own `parseDifficulty()` at line 152 (local function, returns string). Same update.
- `src/director.ts` — Also exports `parseDifficulty()` at line 235 (returns `DifficultyTier | null`). Task 003 handles this one.

**Note:** There are THREE separate `parseDifficulty` functions. cli.ts and game.ts each have local copies. director.ts has an exported one. This task handles the cli.ts and game.ts copies. Task 003 handles the director.ts copy.

### Embedded Context

**Current `parseDifficulty` (cli.ts:58-64):**
```typescript
function parseDifficulty(str: string): Difficulty | undefined {
    const lower = str.toLowerCase();
    if (lower === 'easy' || lower === 'e' || lower === '1') return 'easy';
    if (lower === 'medium' || lower === 'med' || lower === 'm' || lower === '2') return 'medium';
    if (lower === 'hard' || lower === 'h' || lower === '3') return 'hard';
    return undefined;
}
```

**Problem:** `'2'` maps to `'medium'` which is a puzzle difficulty string, NOT tier 2. `'3'` maps to `'hard'`, NOT tier 3.

**New `parseTier()`:**
```typescript
import { type DifficultyTier } from './types.js';

function parseTier(str: string): DifficultyTier | undefined {
    const lower = str.toLowerCase();
    // Numeric (direct tier)
    if (lower === '1') return 1;
    if (lower === '2') return 2;
    if (lower === '3') return 3;
    if (lower === '4') return 4;
    // Named tiers
    if (lower === 'tutorial' || lower === 'tut') return 1;
    if (lower === 'standard' || lower === 'std') return 2;
    if (lower === 'challenging' || lower === 'chal') return 3;
    if (lower === 'expert' || lower === 'exp') return 4;
    // Legacy aliases (mapped to nearest tier)
    if (lower === 'easy' || lower === 'e') return 1;
    if (lower === 'medium' || lower === 'med' || lower === 'm') return 2;
    if (lower === 'hard' || lower === 'h') return 4;  // hard → Expert (not Challenging)
    return undefined;
}
```

**CLI arg changes:**
```typescript
// Before (two separate flags):
--tier, -t <n>        Difficulty tier 1-4 (default: 2)
--difficulty, -d <d>  Puzzle difficulty: easy, medium, hard

// After (unified):
--tier, -t <tier>     Difficulty tier: 1-4, tutorial/standard/challenging/expert, or easy/medium/hard
// --difficulty is kept as alias for --tier
```

**simulate() call changes in cli.ts:**
```typescript
// Before:
const result = simulate(seed, args.tier, { difficulty: args.difficulty, ... });

// After:
const result = simulate(seed, args.tier ?? 2, { ... });
// No difficulty in options — tier controls everything
```

**game.ts changes (line ~280):**
```typescript
// Before:
const result = simulate(args.seed, 2, {
    houseId: args.houseId,
    castId: args.castId,
    difficulty: args.difficulty,
});

// After:
const result = simulate(args.seed, args.tier ?? 2, {
    houseId: args.houseId,
    castId: args.castId,
});
```

**DEFAULT_DIFFICULTY in cli.ts (line 30-36) — update or remove:**
```typescript
// Before:
const DEFAULT_DIFFICULTY: DifficultyConfig = {
    tier: 2, suspectCount: 5, windowCount: 6,
    twistRules: ['false_alibi'], redHerringStrength: 5,
};

// After: derive from profile
const DEFAULT_DIFFICULTY = profileToDifficultyConfig(DIFFICULTY_PROFILES[2]);
```

---

## Acceptance Criteria

### AC-1: --tier 3 uses Challenging profile ← R4.1
- **Given:** `npx tsx src/cli.ts --seed 42 --tier 3 -v`
- **When:** Running
- **Then:** Output shows tier 3 behavior (1 device gap, medium puzzle difficulty)

### AC-2: --difficulty hard maps to tier 4 ← R4.2
- **Given:** `npx tsx src/cli.ts --seed 42 --difficulty hard`
- **When:** Running
- **Then:** Same behavior as `--tier 4`

### AC-3: Named aliases accepted ← R4.3
- **Given:** `npx tsx src/cli.ts --tier challenging --seed 42`
- **When:** Running
- **Then:** Uses tier 3

---

## Edge Cases

### EC-1: Invalid tier value
- **Scenario:** `--tier 5` or `--tier banana`
- **Expected:** Warning message, falls back to tier 2

### EC-2: Both --tier and --difficulty provided
- **Scenario:** `--tier 3 --difficulty easy`
- **Expected:** `--tier` wins (last flag wins, or explicit precedence)

---

## Error Cases

### ERR-1: No tier specified
- **When:** Running without `--tier` or `--difficulty`
- **Then:** Default to tier 2 (Standard)

---

## Scope

**In Scope:**
- Replace `parseDifficulty()` with `parseTier()` in cli.ts and game.ts
- Unify `--tier` and `--difficulty` flags
- Update `DEFAULT_DIFFICULTY` to derive from profile
- Update simulate() calls to stop passing `difficulty` option
- Update help text

**Out of Scope:**
- Verbose output changes for signal display (separate enhancement)
- Solver metrics display changes

---

## Implementation Hints

1. After Tasks 002+003, `SimulationOptions.difficulty` is gone, so all calls passing it will already be TypeScript errors — just fix them.
2. Legacy `'hard'` → tier 4 (Expert), NOT tier 3 (Challenging). This matches the notes.md migration table.
3. The `--tier` flag already exists (cli.ts:91-92) — just consolidate with `--difficulty`.

---

## Log

### Planning Notes
**Context:** User-facing change. Must preserve `--difficulty easy/medium/hard` as aliases for migration.
**Decisions:** `hard` → tier 4 (Expert). Tier 3 (Challenging) is only reachable via `--tier 3` or `--tier challenging`.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
