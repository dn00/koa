# Plan: Daily Seed System (Offline Pipeline)

**Discovery:** notes.md (thorough discovery already done)
**Status:** approved

---

## Overview

Offline tooling for generating "Daily Cases". Given a date, the system looks up the difficulty tier from a weekly schedule, derives a deterministic base seed via HMAC, searches for a valid seed that passes all quality gates and variety constraints, and outputs a publishable result. This is dev-time tooling — it imports the core pipeline but is never called at runtime.

---

## Requirements Expansion

### From R1: Schedule Configuration

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | WeeklySchedule type maps day names to { tier, theme? } | Type check + unit test | 001 |
| R1.2 | DEFAULT_SCHEDULE assigns Mon(1), Tue(2), Wed(2), Thu(3), Fri(2), Sat(1), Sun(4) | Unit test spot-checks specific days | 001 |
| R1.3 | DayOfWeek type is a union of 7 lowercase day names | Type check | 001 |
| R1.4 | getTierForDate(date) resolves a date string to the correct tier via schedule lookup | Unit test | 001 |

### From R2: Seed Derivation

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | getDailyBaseSeed(date, secret, rulesetVersion) returns a number derived from HMAC-SHA256 | Unit test with known input/output | 002 |
| R2.2 | Same (date, secret, rulesetVersion) always produces same base seed (deterministic) | Unit test comparing two calls | 002 |
| R2.3 | Different dates produce different base seeds | Unit test | 002 |
| R2.4 | Different secrets produce different base seeds | Unit test | 002 |
| R2.5 | findValidDailySeed() searches offsets from base seed until a valid case is found | Unit test | 002 |
| R2.6 | "Valid" = generateValidatedCase returns non-null AND validateCase passes | Integration test | 002 |
| R2.7 | findValidDailySeed() returns null if maxOffsets exhausted | Unit test | 002 |

### From R3: Variety Enforcement

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | DailyCaseRecord type captures date, seed, tier, culprit, crimeType, rulesetVersion, offset | Type check + unit test | 001 |
| R3.2 | Candidate rejected if crimeType matches previous day's record | Unit test with mock history | 002 |
| R3.3 | Candidate rejected if culprit matches previous day's record | Unit test with mock history | 002 |
| R3.4 | Empty history imposes no variety constraints | Unit test | 002 |

### From R4: CLI Integration

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | --daily flag added to existing cli.ts (not a separate script) | Integration test | 003 |
| R4.2 | --daily composes with --seed (overrides HMAC derivation) and --tier (overrides schedule) | Integration test | 003 |
| R4.3 | --daily --date accepts ISO date string (default: today UTC) | Integration test | 003 |
| R4.4 | --daily outputs JSON to stdout with seed, tier, offset, and quality metrics | Integration test | 003 |
| R4.5 | --daily --history-file loads DailyCaseRecord[] for variety checking | Integration test | 003 |
| R4.6 | --daily fails gracefully (stderr + exit 1) if no valid seed found | Integration test | 003 |

### From R5: Bundle Integration

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | --daily --bundle outputs a full CaseBundle (Feature 003 format) instead of just the seed result | Integration test | 003 |
| R5.2 | Bundle output uses generateBundle() from bundle.ts | Implementation check | 003 |

---

## Dependency Graph

```
001 ---> 002 ---> 003
```

Sequential chain justified: 002 needs types from 001, 003 needs findValidDailySeed from 002.

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | S | - | Foundation types + schedule lookup |
| 2 | 002 | M | Batch 1 | Core finder logic (HMAC + search + variety) |
| 3 | 003 | S | Batch 2 | CLI wiring into existing cli.ts |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Schedule, history types, and date lookup | S | done |
| 002 | Seed finder logic | M | done |
| 003 | CLI integration | S | done |

---

## Task Details (Inline)

### Task 001: Schedule, History Types, and Date Lookup

**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4, R3.1

#### Objective
Define the data structures for the weekly schedule, the history log, and a helper function to resolve a date string to a difficulty tier.

#### Context
**Relevant Files:**
- `src/types.ts` — DifficultyTier type (already exists)
- `src/daily/` — NEW directory for daily seed tooling

**Embedded Context:**

Existing types this builds on:
```typescript
// Already in types.ts
type DifficultyTier = 1 | 2 | 3 | 4;
type CrimeType = 'theft' | 'sabotage' | 'prank' | 'disappearance';
type NPCId = string;
```

New types to define (from notes.md):
```typescript
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DailyScheduleConfig {
    tier: DifficultyTier;
    theme?: string;
}

export type WeeklySchedule = Record<DayOfWeek, DailyScheduleConfig>;

export const DEFAULT_SCHEDULE: WeeklySchedule = {
    monday:    { tier: 1 },
    tuesday:   { tier: 2 },
    wednesday: { tier: 2 },
    thursday:  { tier: 3 },
    friday:    { tier: 2 },
    saturday:  { tier: 1 },
    sunday:    { tier: 4 },
};

/** Convert JS Date.getUTCDay() (0=Sun) to DayOfWeek */
export function dateToDayOfWeek(date: Date): DayOfWeek;

/** Look up the tier for a given ISO date string using the schedule */
export function getTierForDate(
    dateStr: string,
    schedule?: WeeklySchedule,
): DifficultyTier;
```

History record type (for variety tracking):
```typescript
export interface DailyCaseRecord {
    date: string;           // ISO date (YYYY-MM-DD)
    seed: number;
    tier: DifficultyTier;
    culprit: NPCId;
    crimeType: CrimeType;
    rulesetVersion: string;
    offset: number;         // Offset from base seed
}
```

#### Entry Points / Wiring
- Types consumed by `src/daily/finder.ts` (Task 002) and CLI (Task 003)
- `getTierForDate` called by CLI to resolve date → tier
- Add barrel export `src/daily/index.ts`

#### Files Touched
- `src/daily/schedule.ts` — create (WeeklySchedule, DEFAULT_SCHEDULE, getTierForDate, dateToDayOfWeek)
- `src/daily/history.ts` — create (DailyCaseRecord)
- `src/daily/index.ts` — create (barrel export)

#### Acceptance Criteria
##### AC-1: DEFAULT_SCHEDULE has all 7 days <- R1.2
- **Given:** The DEFAULT_SCHEDULE constant
- **When:** Inspected
- **Then:** Contains entries for all 7 days with tiers: Mon(1), Tue(2), Wed(2), Thu(3), Fri(2), Sat(1), Sun(4)

##### AC-2: getTierForDate resolves date to tier <- R1.4
- **Given:** Date string '2026-02-05' (a Thursday)
- **When:** getTierForDate('2026-02-05') is called
- **Then:** Returns 3 (Thursday = Challenging)

##### AC-3: getTierForDate uses UTC day <- R1.4
- **Given:** Two date strings that fall on different days depending on timezone
- **When:** getTierForDate is called for each
- **Then:** Uses UTC day-of-week (not local timezone)

##### AC-4: DailyCaseRecord has required fields <- R3.1
- **Given:** A DailyCaseRecord object
- **When:** Constructed with all fields
- **Then:** Has date, seed, tier, culprit, crimeType, rulesetVersion, offset

##### AC-5: dateToDayOfWeek maps correctly <- R1.3
- **Given:** Dates for each day of the week
- **When:** dateToDayOfWeek is called
- **Then:** Returns correct DayOfWeek string for each

#### Edge Cases
##### EC-1: getTierForDate with custom schedule
- **Scenario:** Pass a custom schedule where Monday is tier 4
- **Expected:** Returns 4 for a Monday date

#### Error Cases
None — pure types and simple lookups.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | DEFAULT_SCHEDULE has all 7 days with correct tiers | `tests/daily.test.ts` |
| AC-2 | getTierForDate resolves Thursday to tier 3 | `tests/daily.test.ts` |
| AC-3 | getTierForDate uses UTC | `tests/daily.test.ts` |
| AC-4 | DailyCaseRecord has all required fields | `tests/daily.test.ts` |
| AC-5 | dateToDayOfWeek maps all 7 days | `tests/daily.test.ts` |
| EC-1 | getTierForDate with custom schedule | `tests/daily.test.ts` |

#### Notes
**Planning Notes:**
- Put all daily seed types/logic in `src/daily/` with a barrel `index.ts`, consistent with `src/gossip/` pattern.
- getTierForDate should use `new Date(dateStr).getUTCDay()` to avoid timezone issues. The notes.md flags this as an open question — UTC is the answer.

**Implementation Notes:** Types in `schedule.ts`, `history.ts`, barrel in `index.ts`. Tests in `tests/daily.test.ts` (6 blocks, 9 assertions). All passing.
**Review Notes:** [filled by reviewer]

---

### Task 002: Seed Finder Logic

**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5, R2.6, R2.7, R3.2, R3.3, R3.4

#### Objective
Implement the core seed-finding pipeline: derive a deterministic base seed from HMAC, search offsets until a valid case passes all quality gates, and enforce variety constraints against recent history.

#### Context
**Relevant Files:**
- `src/daily/schedule.ts` — DailyCaseRecord, WeeklySchedule (from Task 001)
- `src/sim.ts` — generateValidatedCase()
- `src/validators.ts` — validateCase(), analyzeSignal()
- `src/types.ts` — DifficultyTier, DIFFICULTY_PROFILES, profileToDifficultyConfig
- `src/kernel/canonical.ts` — sha256() (for reference, but HMAC uses crypto.createHmac)

**Embedded Context:**

generateValidatedCase signature:
```typescript
export function generateValidatedCase(
    seed: number,
    tier: DifficultyTier = 2,
    options: SimulationOptions = {}
): { sim: SimulationResult; evidence: EvidenceItem[] } | null
```

validateCase signature:
```typescript
export function validateCase(
    world: World,
    config: CaseConfig,
    evidence: EvidenceItem[],
    difficultyConfig?: DifficultyConfig
): CaseValidation  // { passed, solvability, difficulty, contradictions, ... }
```

Functions to implement:
```typescript
import { createHmac } from 'crypto';
import { RULESET_VERSION, type DifficultyTier } from '../types.js';
import type { DailyCaseRecord } from './history.js';

export interface FinderOptions {
    secret?: string;
    maxOffsets?: number;
    schedule?: WeeklySchedule;
}

export interface FinderResult {
    seed: number;
    tier: DifficultyTier;
    offset: number;
    culprit: string;
    crimeType: string;
    date: string;
    rulesetVersion: string;
}

/** Derive base seed from HMAC(secret, date:rulesetVersion) */
export function getDailyBaseSeed(
    date: string,
    secret: string,
    rulesetVersion: string,
): number {
    const hmac = createHmac('sha256', secret);
    hmac.update(`${date}:${rulesetVersion}`);
    return parseInt(hmac.digest('hex').slice(0, 8), 16);
}

/** Search for a valid daily seed, respecting variety constraints */
export function findValidDailySeed(
    date: string,
    tier: DifficultyTier,
    history: DailyCaseRecord[],
    options?: FinderOptions,
): FinderResult | null;
```

**Key invariant (INV-7, INV-9):** The HMAC derivation and search loop must be fully deterministic for the same inputs. No Math.random() or Date.now().

**Variety rules (from notes.md):**
- Reject candidate if `config.crimeType === history[history.length-1].crimeType`
- Reject candidate if `config.culpritId === history[history.length-1].culprit`
- Only check against most recent record (yesterday)

#### Entry Points / Wiring
- `findValidDailySeed` called by CLI `--daily` flag (Task 003)
- `getDailyBaseSeed` is a pure function, also useful for debugging

#### Files Touched
- `src/daily/finder.ts` — create (getDailyBaseSeed, findValidDailySeed, FinderOptions, FinderResult)
- `src/daily/index.ts` — modify (add finder exports)

#### Acceptance Criteria
##### AC-1: getDailyBaseSeed is deterministic <- R2.2
- **Given:** Same date, secret, and rulesetVersion
- **When:** getDailyBaseSeed() called twice
- **Then:** Returns identical number both times

##### AC-2: getDailyBaseSeed differs by date <- R2.3
- **Given:** Two different dates with same secret and rulesetVersion
- **When:** getDailyBaseSeed() called for each
- **Then:** Returns different numbers

##### AC-3: getDailyBaseSeed differs by secret <- R2.4
- **Given:** Same date, different secrets
- **When:** getDailyBaseSeed() called for each
- **Then:** Returns different numbers

##### AC-4: getDailyBaseSeed returns valid number range <- R2.1
- **Given:** Any valid inputs
- **When:** getDailyBaseSeed() called
- **Then:** Returns a positive integer (parsed from 8 hex chars, max ~4.29 billion)

##### AC-5: findValidDailySeed finds a valid seed <- R2.5, R2.6
- **Given:** A date and tier that produce valid cases
- **When:** findValidDailySeed() is called
- **Then:** Returns a FinderResult with seed, tier, offset, culprit, crimeType

##### AC-6: findValidDailySeed result produces valid case <- R2.6
- **Given:** A FinderResult from findValidDailySeed
- **When:** generateValidatedCase(result.seed, result.tier) is called
- **Then:** Returns a non-null result that passes validateCase

##### AC-7: findValidDailySeed returns null when exhausted <- R2.7
- **Given:** maxOffsets set to 0 (no search allowed)
- **When:** findValidDailySeed() is called
- **Then:** Returns null

##### AC-8: findValidDailySeed skips same crimeType as yesterday <- R3.2
- **Given:** History with yesterday's record having crimeType 'theft'
- **When:** findValidDailySeed() is called
- **Then:** Returned result has a crimeType different from 'theft' (or null if impossible)

##### AC-9: findValidDailySeed skips same culprit as yesterday <- R3.3
- **Given:** History with yesterday's record having culprit 'alice'
- **When:** findValidDailySeed() is called
- **Then:** Returned result has a culprit different from 'alice' (or null if impossible)

##### AC-10: findValidDailySeed with empty history has no constraints <- R3.4
- **Given:** Empty history array
- **When:** findValidDailySeed() is called
- **Then:** Returns first valid seed without variety filtering

#### Edge Cases
##### EC-1: getDailyBaseSeed with different rulesetVersion
- **Scenario:** Same date and secret but different rulesetVersion
- **Expected:** Returns different base seed

##### EC-2: findValidDailySeed skips to next offset on failed case
- **Scenario:** Base seed produces invalid case, base+1 produces valid case
- **Expected:** Returns result with offset=1

#### Error Cases
##### ERR-1: findValidDailySeed with impossible constraints
- **When:** History constrains both crimeType and culprit, and maxOffsets is small
- **Then:** Returns null (never throws)
- **Error Message:** N/A (returns null, caller handles)

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | getDailyBaseSeed determinism | `tests/daily.test.ts` |
| AC-2 | getDailyBaseSeed differs by date | `tests/daily.test.ts` |
| AC-3 | getDailyBaseSeed differs by secret | `tests/daily.test.ts` |
| AC-4 | getDailyBaseSeed returns valid number | `tests/daily.test.ts` |
| AC-5 | findValidDailySeed finds valid seed | `tests/daily.test.ts` |
| AC-6 | findValidDailySeed result is valid case | `tests/daily.test.ts` |
| AC-7 | findValidDailySeed returns null when exhausted | `tests/daily.test.ts` |
| AC-8 | findValidDailySeed skips same crimeType | `tests/daily.test.ts` |
| AC-9 | findValidDailySeed skips same culprit | `tests/daily.test.ts` |
| AC-10 | findValidDailySeed empty history | `tests/daily.test.ts` |
| EC-1 | getDailyBaseSeed differs by rulesetVersion | `tests/daily.test.ts` |
| EC-2 | findValidDailySeed skips invalid offset | `tests/daily.test.ts` |
| ERR-1 | findValidDailySeed impossible constraints | `tests/daily.test.ts` |

#### Notes
**Planning Notes:**
- FinderResult is intentionally lean — no SimulationResult or EvidenceItem[]. The caller (CLI) can re-generate via generateBundle() if needed.
- Variety check only looks at the last record in history (yesterday). The notes mention "N days" but R3.2/R3.3 specify yesterday only. Keep it simple.
- Use RULESET_VERSION from types.ts as default for the rulesetVersion parameter.
- The search loop should NOT throw on exhaustion — return null and let the CLI handle the error message.

**Implementation Notes:** `finder.ts` implements getDailyBaseSeed (HMAC-SHA256) and findValidDailySeed (offset search with validateCase gate + variety check). Gemini review caught missing validateCase call — fixed. Field is `passed` not `valid` on CaseValidation. Tests in `tests/daily.test.ts` (13 blocks for Task 002).
**Review Notes:** Gemini NEEDS-CHANGES → fixed 3/6 issues (validateCase, test, package.json). 3 non-issues (invalid date handling out of scope, rulesetVersion not in plan, pre-existing type error).

---

### Task 003: CLI Integration

**Complexity:** S
**Depends On:** 002
**Implements:** R4.1, R4.2, R4.3, R4.4, R4.5, R4.6, R5.1, R5.2

#### Objective
Wire the daily seed finder into the existing `cli.ts` as a `--daily` subcommand, composable with existing flags (`--seed`, `--tier`, `--date`). Optionally output a full CaseBundle via `--bundle`.

#### Context
**Relevant Files:**
- `src/cli.ts` — Add --daily flag alongside existing --export-bundle, --seed, --tier
- `src/daily/finder.ts` — findValidDailySeed, getDailyBaseSeed (from Task 002)
- `src/daily/schedule.ts` — getTierForDate (from Task 001)
- `src/bundle.ts` — generateBundle (from Feature 003)

**Embedded Context:**

Existing CLI Args interface (after Feature 003):
```typescript
interface Args {
    generate: number;
    seed?: number;
    verbose: boolean;
    useBlueprints: boolean;
    tier: DifficultyTier;
    houseId?: string;
    castId?: string;
    tune: boolean;
    playability: boolean;
    autosolve: boolean;
    exportBundle: boolean;
}
```

New fields to add:
```typescript
interface Args {
    // ... existing fields ...
    daily: boolean;
    date?: string;        // ISO date string for --daily
    historyFile?: string; // Path to DailyCaseRecord[] JSON
    bundle: boolean;      // --bundle flag (output CaseBundle instead of FinderResult)
}
```

CLI execution block pattern:
```typescript
} else if (args.daily) {
    const dateStr = args.date ?? new Date().toISOString().slice(0, 10);
    const tier = args.tier ?? getTierForDate(dateStr);
    const history = args.historyFile
        ? JSON.parse(readFileSync(args.historyFile, 'utf-8')) as DailyCaseRecord[]
        : [];

    const result = findValidDailySeed(dateStr, tier, history, {
        secret: process.env.KOA_SECRET ?? 'dev-secret',
    });

    if (!result) {
        console.error('Failed to find valid daily seed');
        process.exit(1);
    }

    if (args.bundle) {
        const bundle = generateBundle(result.seed, result.tier);
        if (!bundle) {
            console.error('Failed to generate bundle for daily seed');
            process.exit(1);
        }
        console.log(JSON.stringify(bundle, null, 2));
    } else {
        console.log(JSON.stringify(result, null, 2));
    }
}
```

#### Entry Points / Wiring
- `--daily` flag added to Args interface, parseArgs, execution block, and help text in `src/cli.ts`
- Imports findValidDailySeed and getTierForDate from `./daily/index.js`
- Imports generateBundle from `./bundle.js` (already imported for --export-bundle)

#### Files Touched
- `src/cli.ts` — modify (add --daily, --date, --history-file, --bundle flags)

#### Acceptance Criteria
##### AC-1: --daily outputs valid JSON <- R4.4
- **Given:** CLI invoked with `--daily --date 2026-02-05`
- **When:** Command runs
- **Then:** stdout contains valid JSON with seed (number), tier (number), offset (number), culprit (string), crimeType (string)

##### AC-2: --daily uses schedule tier <- R4.2
- **Given:** CLI invoked with `--daily --date 2026-02-05` (Thursday = tier 3)
- **When:** Output parsed
- **Then:** tier field equals 3

##### AC-3: --daily --tier overrides schedule <- R4.2
- **Given:** CLI invoked with `--daily --date 2026-02-05 --tier 1`
- **When:** Output parsed
- **Then:** tier field equals 1

##### AC-4: --daily --date defaults to today <- R4.3
- **Given:** CLI invoked with just `--daily`
- **When:** Command runs
- **Then:** Outputs valid JSON (date defaults to today UTC)

##### AC-5: --daily --history-file loads history <- R4.5
- **Given:** A history JSON file and CLI invoked with `--daily --history-file path/to/history.json`
- **When:** Command runs
- **Then:** Variety constraints from history are applied

##### AC-6: --daily --bundle outputs CaseBundle <- R5.1, R5.2
- **Given:** CLI invoked with `--daily --date 2026-02-05 --bundle`
- **When:** Output parsed
- **Then:** Output is a valid CaseBundle with version, solutionHash, world, etc.

#### Edge Cases
##### EC-1: --daily with --seed overrides HMAC derivation
- **Scenario:** CLI invoked with `--daily --seed 42`
- **Expected:** Uses seed 42 directly instead of HMAC-derived seed

#### Error Cases
##### ERR-1: --daily fails when no valid seed found
- **When:** No valid seed within maxOffsets
- **Then:** Prints "Failed to find valid daily seed" to stderr, exits with code 1

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | --daily outputs valid JSON | `tests/daily-cli.test.ts` |
| AC-2 | --daily uses schedule tier | `tests/daily-cli.test.ts` |
| AC-3 | --daily --tier overrides schedule | `tests/daily-cli.test.ts` |
| AC-4 | --daily defaults to today | `tests/daily-cli.test.ts` |
| AC-5 | --daily --history-file loads history | `tests/daily-cli.test.ts` |
| AC-6 | --daily --bundle outputs CaseBundle | `tests/daily-cli.test.ts` |
| EC-1 | --daily --seed overrides HMAC | `tests/daily-cli.test.ts` |
| ERR-1 | --daily fails gracefully | `tests/daily-cli.test.ts` |

#### Notes
**Planning Notes:**
- Integrate into existing cli.ts as `--daily` rather than a separate `find-daily.ts` script. This follows the pattern established by --export-bundle, --autosolve, --playability.
- The `--bundle` flag composes with `--daily` to produce the final CaseBundle output. Without --bundle, it outputs the lean FinderResult (useful for scripting and debugging).
- KOA_SECRET defaults to 'dev-secret' for local development. Production uses env var.
- Add `npm run daily` script to package.json as shortcut: `tsx src/cli.ts --daily`

**Implementation Notes:** Added --daily, --date, --history-file, --bundle flags to cli.ts. Used `tierExplicit` boolean to distinguish default tier from user-provided tier (schedule lookup only when not explicit). Tests in `tests/daily-cli.test.ts` (8 blocks). Package.json `daily` script updated.
**Review Notes:** [filled by reviewer]

---

## Scope

**In Scope:**
- WeeklySchedule type and DEFAULT_SCHEDULE constant
- DailyCaseRecord type for variety tracking
- getTierForDate() date-to-tier resolution
- getDailyBaseSeed() HMAC-based seed derivation
- findValidDailySeed() search loop with quality + variety gates
- CLI --daily flag with --date, --history-file, --bundle composition
- Barrel export for daily/ module

**Out of Scope:**
- Publishing infrastructure (static JSON, API, git commits)
- GitHub Actions automation
- Weekly theme batches
- Archive/replay UI
- Human review workflow tooling
- Quality scorer (CaseQuality interface from notes) — use existing validateCase metrics

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Infinite loop if variety + tier constraints are too tight | CLI hangs forever | maxOffsets cap (default 1000), return null on exhaustion |
| HMAC secret leaks into bundle output | Security | Secret is never included in FinderResult or CaseBundle |
| Timezone issues in date parsing | Wrong day-of-week = wrong tier | Use UTC exclusively (getUTCDay) |

---

## Open Questions

None — resolved during planning:
- Timezone: UTC (from notes.md)
- CLI location: subcommand in cli.ts (follows --export-bundle pattern)
- Variety window: yesterday only (from R3.2/R3.3)

---

## Review Log

### Implementation Review (2026-02-05)
- Gemini review caught missing `validateCase` gate in finder loop (R2.6) — fixed
- Field name mismatch: `CaseValidation.passed` not `.valid` — fixed
- `tierExplicit` flag needed to distinguish default tier from user-provided `--tier` in CLI
- `validate-seeds.ts` had pre-existing broken import (`PlayabilityResult` from types instead of validators) — fixed
- Added `getTierForDate` error guard for invalid dates
- Added optional `rulesetVersion` to `FinderOptions` for reproducibility of past daily seeds

### Playtest Observations (seed 42, tier 2)
- **Solved 6/6, S-rank in 5 AP** (gossip → search → logs → 2 interviews → accuse)
- Carol's false alibi (claimed bedroom, testimony placed her in kitchen) was the keystone
- Dan's "rummaging" testimony directly cites the crime event — may be too revealing
- 417 evidence items is high noise; most are door open/close testimony that doesn't matter
- COMPARE hands you the answer once you have the right pair — limited deduction required at tier 2
- KOA personality and comedy elements (sourdough "Doughlores", motive "dog greets everyone else first") work well
- Concern: tier 2 may be too easy for human players — culprit alibi directly contradicts own testimony location
