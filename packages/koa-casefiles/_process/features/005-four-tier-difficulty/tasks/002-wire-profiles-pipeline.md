# Task 002: Wire Profiles into simulate() Pipeline

**Status:** done
**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5

---

## Objective

Replace `DIFFICULTY_PRESETS` + `options.difficulty` dual-parameter system with single `DIFFICULTY_PROFILES[tier]` lookup throughout the simulation pipeline.

---

## Context

### Relevant Files
- `src/sim.ts` — Remove `DIFFICULTY_PRESETS`; update `simulate()`, `simulateWithBlueprints()`, `generateValidatedCase()`
- `src/evidence.ts` — Refactor `getOfflineWindows()` to use `deviceGaps`; update `deriveCulpritAlibiClaim()` and `deriveDeviceLogs()`
- `src/types.ts` — Add `tier?: DifficultyTier` to `CaseConfig`, deprecate `difficulty`
- `src/solver.ts` — Line 495: change `solve()` signature from `difficulty?: 'easy'|'medium'|'hard'` to `tier?: DifficultyTier`; line 505: change `simulate(seed, 2, { difficulty })` to `simulate(seed, tier ?? 2)`
- `src/koa-voice.ts` — Line 109: change `formatIntroBanner()` param from `difficulty?: 'easy'|'medium'|'hard'` to `tier?: DifficultyTier`
- `src/validate-seeds.ts` — Line 118: `simulate(seed, 2, { useBlueprints: true })` — no difficulty field, just verify still works
- `src/analyze.ts` — Line 22: `simulate(seed)` — no difficulty field, just verify still works
- `src/cli.ts` — Update `validateCase()` calls (lines 155, 655) to use `profileToDifficultyConfig(DIFFICULTY_PROFILES[tier])` instead of `DEFAULT_DIFFICULTY`
- **Test fixtures to update (explicit list):**
  - `tests/tuning-hooks.test.ts` — lines 125, 249, 376 (fixtures with `difficulty: 'easy'`), lines 404, 424 (calls with `{ difficulty: 'easy' }`)
  - `tests/pipeline-integration.test.ts` — lines 91 (`difficulty: 'easy'`), 110 (`difficulty: 'medium'`), 128 (`difficulty: 'hard'`)

### Embedded Context

**Current `simulate()` signature (sim.ts:1138):**
```typescript
export function simulate(
    seed: number,
    difficultyTier: number = 2,
    options: SimulationOptions = {}
): SimulationResult | null
```

Uses BOTH `DIFFICULTY_PRESETS[difficultyTier]` (line 1152) and `options.difficulty` (lines 1280, 1332).

**New signature:**
```typescript
export function simulate(
    seed: number,
    tier: DifficultyTier = 2,
    options: SimulationOptions = {}
): SimulationResult | null {
    const profile = DIFFICULTY_PROFILES[tier];
    // profile.puzzleDifficulty replaces options.difficulty everywhere
    // profile.twistRules replaces difficultyConfig.twistRules
    // profile.deviceGaps → getOfflineWindowsByGaps()
    // config.tier = tier (stored on CaseConfig)
}
```

**Remove `difficulty` from `SimulationOptions` (sim.ts:1105-1124):**
```typescript
export interface SimulationOptions {
    useBlueprints?: boolean;
    blueprints?: IncidentBlueprint[];
    houseId?: string;
    castId?: string;
    // REMOVED: difficulty?: 'easy' | 'medium' | 'hard';
    signalConfig?: SignalConfig;
}
```

**Refactor `getOfflineWindows` (evidence.ts:215-248):**

Current:
```typescript
function getOfflineWindows(
    crimeWindow: WindowId | undefined,
    difficulty: 'easy' | 'medium' | 'hard'
): Set<WindowId>
```

New:
```typescript
function getOfflineWindowsByGaps(
    crimeWindow: WindowId | undefined,
    gaps: number
): Set<WindowId> {
    const offline = new Set<WindowId>();
    if (gaps === 0 || !crimeWindow) return offline;

    const allWindows: WindowId[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    const crimeIdx = allWindows.indexOf(crimeWindow);

    // CRITICAL (retro lesson #3): crime window and adjacent windows always protected
    const protectedWindows = new Set<WindowId>([crimeWindow]);
    if (crimeIdx > 0) protectedWindows.add(allWindows[crimeIdx - 1]);
    if (crimeIdx < 5) protectedWindows.add(allWindows[crimeIdx + 1]);

    const candidateOffline = allWindows.filter(w => !protectedWindows.has(w));

    // Take up to `gaps` candidates
    for (let i = 0; i < Math.min(gaps, candidateOffline.length); i++) {
        offline.add(candidateOffline[i < candidateOffline.length - 1 ? i : candidateOffline.length - 1]);
    }
    // For gaps=2, take first and last candidate (spread out the gaps)
    if (gaps >= 2 && candidateOffline.length >= 2) {
        offline.clear();
        offline.add(candidateOffline[0]);
        offline.add(candidateOffline[candidateOffline.length - 1]);
    }

    return offline;
}
```

**Update `deriveDeviceLogs` callers (evidence.ts:126-129):**
```typescript
// Before:
const difficulty = config?.difficulty ?? 'easy';
const offlineWindows = getOfflineWindows(config?.crimeWindow, difficulty);

// After:
const profile = config?.tier ? DIFFICULTY_PROFILES[config.tier] : DIFFICULTY_PROFILES[2];
const offlineWindows = getOfflineWindowsByGaps(config?.crimeWindow, profile.deviceGaps);
```

**Update `deriveCulpritAlibiClaim` (evidence.ts:~1226):**
```typescript
// Before:
const difficulty = config.difficulty ?? 'easy';

// After:
const profile = DIFFICULTY_PROFILES[config.tier ?? 2];
const difficulty = profile.puzzleDifficulty;
// Rest of function uses `difficulty` as before
```

**Add `tier` to `CaseConfig` (types.ts:249-272):**
```typescript
export interface CaseConfig {
    // ... existing fields ...
    tier?: DifficultyTier;              // NEW: unified difficulty tier
    /** @deprecated Use tier instead */
    difficulty?: 'easy' | 'medium' | 'hard';
    injectedSignal?: boolean;
    signalConfig?: SignalConfig;
}
```

### Source Docs
- `_process/features/005-four-tier-difficulty/005-fout-tier-difficulty.plan.md` — Retrospective lesson #3

---

## Acceptance Criteria

### AC-1: simulate() derives behavior from tier ← R2.1
- **Given:** `simulate(seed, 3)`
- **When:** Case is generated
- **Then:** Culprit alibi uses 'medium' behavior, device has 1 offline window, planted_evidence is in the twist pool

### AC-2: SimulationOptions.difficulty removed ← R2.2
- **Given:** Calling `simulate(seed, 1, { difficulty: 'hard' })`
- **When:** TypeScript compiles
- **Then:** Compile error (`difficulty` not in `SimulationOptions`)

### AC-3: CaseConfig stores tier ← R2.3
- **Given:** Generated case at tier 3
- **When:** Reading `config.tier`
- **Then:** Returns `3`

### AC-4: DIFFICULTY_PRESETS removed ← R2.5
- **Given:** `sim.ts`
- **When:** Searching for `DIFFICULTY_PRESETS`
- **Then:** Not found (removed)

### AC-5: Device gaps controlled by profile ← R2.4
- **Given:** Tier 1, 3, and 4 cases
- **When:** Counting offline windows in evidence derivation
- **Then:** Tier 1 = 0 gaps, tier 3 = 1 gap, tier 4 = 2 gaps

---

## Edge Cases

### EC-1: Crime-adjacent windows never offline
- **Scenario:** Tier 4 with `deviceGaps: 2` and `crimeWindow: 'W3'`
- **Expected:** W2 and W4 (adjacent to W3) are NEVER offline; only non-adjacent non-crime windows go offline
- **Rationale:** Retro lesson #3 — signal injection places events at adjacent rooms; offlined adjacent windows would break solvability

### EC-2: Blueprint path uses same profile
- **Scenario:** `simulate(seed, 3, { useBlueprints: true })`
- **Expected:** `simulateWithBlueprints()` reads from `DIFFICULTY_PROFILES[3]`, same as legacy path

### EC-3: RNG sequence change for tier 2
- **Scenario:** `simulate(seed, 2)` previously had `options.difficulty = undefined` (legacy random twist selection)
- **Expected:** Now uses `puzzleDifficulty: 'easy'` (forced false_alibi on culprit). This is an intentional improvement — deterministic behavior per tier.

---

## Error Cases

### ERR-1: Invalid tier falls back
- **When:** `simulate(seed, 5 as any)`
- **Then:** `DIFFICULTY_PROFILES[5]` is `undefined`; should fall back to tier 2

---

## Scope

**In Scope:**
- Remove `DIFFICULTY_PRESETS` from sim.ts
- Remove `difficulty` from `SimulationOptions`
- Add `tier` to `CaseConfig`
- Refactor `getOfflineWindows` → `getOfflineWindowsByGaps`
- Update `deriveDeviceLogs`, `deriveCulpritAlibiClaim`, `maybeGenerateTwist` callers
- Update both `simulate()` and `simulateWithBlueprints()` paths
- Update `solver.ts` `solve()` signature: `difficulty` param → `tier` param
- Update `koa-voice.ts` `formatIntroBanner()` signature
- Update `cli.ts` `validateCase()` calls to derive `DifficultyConfig` from profile
- Update existing test fixtures (see explicit list in Relevant Files)

**Out of Scope:**
- CLI parser changes (Task 004)
- Director changes (Task 003)
- Signal preference wiring (Task 005)

**Decision: Solver metrics stay string-based.** `SolveResult.metrics.difficultyTier` ('easy'|'medium'|'hard'|'unsolvable') measures *observed* puzzle difficulty from signal analysis — orthogonal to the generation tier. Keep as-is. The new `config.tier` field provides the generation tier separately.

---

## Implementation Hints

1. Start by running `vitest run` to baseline existing tests.
2. Add `tier` to `CaseConfig` first, keeping `difficulty` temporarily.
3. Update `simulate()` to set `config.tier` and derive `puzzleDifficulty` from profile.
4. Refactor `getOfflineWindows` → `getOfflineWindowsByGaps`.
5. Update `deriveDeviceLogs` and `deriveCulpritAlibiClaim` to read from profile.
6. Update `solver.ts:495` — change `solve(seed, verbose, difficulty?)` to `solve(seed, verbose, tier?)`, line 505 becomes `simulate(seed, tier ?? 2)`.
7. Update `koa-voice.ts:109` — `formatIntroBanner(seed, resumed, tier?)` and derive label from `DIFFICULTY_PROFILES[tier].name`.
8. Update `cli.ts` `validateCase()` calls — replace `DEFAULT_DIFFICULTY` with `profileToDifficultyConfig(DIFFICULTY_PROFILES[tier])`.
9. Remove `difficulty` from `SimulationOptions`.
10. Remove `DIFFICULTY_PRESETS`.
11. Update test fixtures (see explicit list in Relevant Files).
12. Run `vitest run` again — all existing tests should pass.

---

## Log

### Planning Notes
**Context:** Largest task — touches sim.ts and evidence.ts. Core unification.
**Decisions:** Keep `difficulty` on `CaseConfig` as deprecated during transition. Internal code reads `tier` and derives `puzzleDifficulty` from profile.

### Implementation Notes
- Removed `DIFFICULTY_PRESETS` from sim.ts — replaced with `DIFFICULTY_PROFILES` import from types.ts
- `simulate()` now takes `tier: DifficultyTier = 2`, validates tier, derives profile and difficultyConfig
- `simulateWithBlueprints()` receives profile/config from `simulate()` instead of computing its own
- `SimulationOptions.difficulty` removed — tier controls everything
- `CaseConfig` now has `tier` field; `difficulty` set from `profile.puzzleDifficulty`
- `evidence.ts`: `getOfflineWindows()` → `getOfflineWindowsByGaps(crimeWindow, gaps)` — takes numeric gaps, preserves protected windows
- `evidence.ts`: `deriveCulpritAlibiClaim()` reads puzzleDifficulty from `DIFFICULTY_PROFILES[config.tier]`
- `solver.ts`: `solve(seed, verbose, tier?)` — changed from string difficulty to numeric tier
- `solver.ts`: `autosolve()` — same change
- `koa-voice.ts`: `formatIntroBanner(seed, resumed, tier?)` — derives label from `DIFFICULTY_PROFILES[tier].name`
- `cli.ts`: `DEFAULT_DIFFICULTY` now derived via `profileToDifficultyConfig(DIFFICULTY_PROFILES[2])`
- `game.ts`: removed `difficulty` option from `simulate()` call and `formatIntroBanner()` call
- Updated test fixtures: `tuning-hooks.test.ts` (removed difficulty options, changed solve() args from strings to tiers), `pipeline-integration.test.ts` (changed from difficulty strings to tier numbers)
- 13 tests in `tests/wire-profiles.test.ts` — all pass
- Gemini review: PASS

### Review Notes
> Written by Reviewer
