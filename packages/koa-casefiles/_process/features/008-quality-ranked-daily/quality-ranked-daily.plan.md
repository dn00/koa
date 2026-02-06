# Plan: Quality-Ranked Daily Selection

**Discovery:** Inline (conversation analysis + codebase exploration)
**Status:** done

---

## Overview

Enhance `findValidDailySeed()` to score and rank multiple candidate seeds instead of returning the first valid one. Uses existing validation infrastructure (`validatePlayability`, `validateDifficulty`, `validateFunness`) to compute quality scores. Extends variety checking from 1-day lookback to 7-day with fingerprint-based novelty detection.

---

## Requirements Expansion

### From R1: Quality Scoring

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | `scoreDailyCandidate()` returns a numeric score (0-100) for a validated case | Unit test | 001 |
| R1.2 | Score incorporates playability metrics (apMargin, firstMoveClarity, keystoneReachAP) | Unit test with known cases | 001 |
| R1.3 | Score incorporates difficulty fit (how well AP/contradictions/branching match tier targets) | Unit test | 001 |
| R1.4 | Score incorporates funness (red herrings exist, motive variety, no trivial reveals) | Unit test | 001 |
| R1.5 | Score incorporates discoverability (all 6 parts: who/what/how/when/where/why) | Unit test | 001 |

### From R2: Multi-Candidate Selection

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | `findValidDailySeed()` collects up to `candidatePool` valid seeds (default 50) | Unit test | 002 |
| R2.2 | Each candidate is scored via `scoreDailyCandidate()` | Unit test | 002 |
| R2.3 | Finder returns the highest-scored candidate | Unit test comparing scores | 002 |
| R2.4 | If only 1 valid candidate exists, returns it (no degradation) | Unit test | 002 |
| R2.5 | Same inputs produce same output (deterministic) | Unit test | 002 |
| R2.6 | `FinderResult` includes `score` and `candidatesEvaluated` fields | Type check | 002 |

### From R3: Extended Variety (7-day lookback)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Variety check considers last 7 records, not just yesterday | Unit test | 002 |
| R3.2 | Reject if crimeType matches any of last 2 days | Unit test | 002 |
| R3.3 | Reject if culprit matches any of last 2 days | Unit test | 002 |
| R3.4 | Penalize (score reduction, not reject) if methodId matches any of last 7 days | Unit test | 002 |
| R3.5 | Empty/short history imposes proportionally fewer constraints | Unit test | 002 |

### From R4: Fingerprint Fields

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | `DailyCaseRecord` extended with `methodId: string` field | Type check | 001 |
| R4.2 | `DailyCaseRecord` extended with `signalType: SignalType` field | Type check | 001 |
| R4.3 | `FinderResult` extended with `methodId` and `signalType` fields | Type check | 001 |
| R4.4 | Existing code that creates DailyCaseRecord still works (fields optional for backward compat) | Unit test | 001 |

### From R5: CLI Diagnostics

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | `--daily --verbose` outputs scoring breakdown for top candidate | Integration test | 003 |
| R5.2 | `--daily --verbose` shows candidates evaluated count | Integration test | 003 |
| R5.3 | `--daily` (non-verbose) JSON output includes `score` field | Integration test | 003 |

---

## Dependency Graph

```
001 ---> 002 ---> 003
```

Sequential: 002 needs score function + types from 001, 003 needs finder changes from 002.

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | S | - | Score function + type extensions |
| 2 | 002 | M | Batch 1 | Finder rewrite + variety logic |
| 3 | 003 | S | Batch 2 | CLI wiring |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Quality score function and type extensions | S | done |
| 002 | Multi-candidate finder with extended variety | M | done |
| 003 | CLI verbose diagnostics | S | done |

---

## Task Details (Inline)

### Task 001: Quality Score Function and Type Extensions

**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4, R1.5, R4.1, R4.2, R4.3, R4.4

#### Objective
Define a `scoreDailyCandidate()` function that takes a validated case and returns a 0-100 quality score, reusing existing validators. Extend `DailyCaseRecord` and `FinderResult` with fingerprint fields.

#### Context
**Relevant Files:**
- `src/daily/finder.ts` — FinderResult type, will add score function here
- `src/daily/history.ts` — DailyCaseRecord type, extend with fingerprint fields
- `src/validators.ts` — validatePlayability(), validateDifficulty(), validateFunness(), getAllChains(), DEFAULT_PLAYER_CONSTRAINTS
- `src/types.ts` — DifficultyTier, DIFFICULTY_PROFILES, DIFFICULTY_TIER_TARGETS, SignalType, profileToDifficultyConfig

**Embedded Context:**

Existing types to extend:
```typescript
// In src/daily/history.ts — current
export interface DailyCaseRecord {
    date: string;
    seed: number;
    tier: DifficultyTier;
    culprit: NPCId;
    crimeType: CrimeType;
    rulesetVersion: string;
    offset: number;
}

// Extended — add optional fields for backward compat
export interface DailyCaseRecord {
    // ... existing fields ...
    methodId?: string;          // R4.1
    signalType?: SignalType;    // R4.2
}
```

Existing FinderResult to extend:
```typescript
// In src/daily/finder.ts — current
export interface FinderResult {
    seed: number;
    tier: DifficultyTier;
    offset: number;
    culprit: string;
    crimeType: string;
    date: string;
    rulesetVersion: string;
}

// Extended
export interface FinderResult {
    // ... existing fields ...
    methodId: string;
    signalType: SignalType;
    score: number;
    scoreBreakdown: CandidateScore;
    candidatesEvaluated: number;
}
```

New scoring function and types:
```typescript
import type { SimulationResult, EvidenceItem, DifficultyTier } from '../types.js';
import type { DailyCaseRecord } from './history.js';

export interface CandidateScore {
    total: number;            // 0-100 composite
    playability: number;      // 0-25 subscore
    difficultyFit: number;    // 0-25 subscore
    funness: number;          // 0-25 subscore
    discoverability: number;  // 0-25 subscore
}

export function scoreDailyCandidate(
    sim: SimulationResult,
    evidence: EvidenceItem[],
    tier: DifficultyTier,
): CandidateScore;
```

Scoring breakdown (uses existing validators):
- **Playability (0-25):** `validatePlayability()` → apMargin (0-8), firstMoveClarity (clear=8, moderate=4, unclear=0), keystoneReachAP (low=5, high=0), windowSpread (0-4)
- **Difficulty Fit (0-25):** `validateDifficulty()` → how close minAP is to tier midpoint, contradiction count in range, branching meets minimum
- **Funness (0-25):** `validateFunness()` → passes all checks (15), has red herrings (+5), motive variety (+5)
- **Discoverability (0-25):** `getAllChains()` → 4 points per discoverable dimension (who/what/how/when/where/why = 24 max), +1 bonus if all 6 discoverable

Discoverability helpers (reference from `validate-seeds.ts`):
```typescript
function hasMethodInPhysical(evidence: EvidenceItem[], config: CaseConfig): boolean;
function hasCrimeAwareness(evidence: EvidenceItem[]): boolean;
function hasCulpritMotive(evidence: EvidenceItem[], config: CaseConfig): boolean;
function hasPhysicalEvidence(evidence: EvidenceItem[], config: CaseConfig): boolean;
```

#### Entry Points / Wiring
- `scoreDailyCandidate` exported from `src/daily/finder.ts`
- `CandidateScore` type exported from `src/daily/finder.ts`
- Added to barrel export `src/daily/index.ts`
- Consumed by `findValidDailySeed` in Task 002

#### Files Touched
- `src/daily/history.ts` — modify (add optional methodId, signalType fields)
- `src/daily/finder.ts` — modify (add CandidateScore interface, scoreDailyCandidate function, extend FinderResult)
- `src/daily/index.ts` — modify (export new types)

#### Acceptance Criteria
##### AC-1: scoreDailyCandidate returns 0-100 score <- R1.1
- **Given:** A valid SimulationResult and evidence array for tier 2
- **When:** scoreDailyCandidate() is called
- **Then:** Returns CandidateScore with total between 0-100, and 4 subscores each 0-25

##### AC-2: Playability subscore uses validatePlayability metrics <- R1.2
- **Given:** A case with clear first move, good AP margin, low keystoneReachAP
- **When:** scoreDailyCandidate() is called
- **Then:** playability subscore is high (>18)

##### AC-3: Difficulty fit subscore penalizes out-of-range AP <- R1.3
- **Given:** A tier 2 case (target: 7-14 AP) with minAP = 4 (below range)
- **When:** scoreDailyCandidate() is called
- **Then:** difficultyFit subscore is lower than a case with minAP = 10 (in range)

##### AC-4: Funness subscore rewards red herrings and motive variety <- R1.4
- **Given:** Two cases — one with suspiciousActs and multiple motive suspects, one without
- **When:** scoreDailyCandidate() is called for each
- **Then:** Case with red herrings scores higher on funness

##### AC-5: Discoverability subscore rewards all 6 parts <- R1.5
- **Given:** A case where all 6 dimensions (who/what/how/when/where/why) have evidence chains
- **When:** scoreDailyCandidate() is called
- **Then:** discoverability subscore is 25 (maximum)

##### AC-6: DailyCaseRecord backward compatible <- R4.4
- **Given:** A DailyCaseRecord without methodId/signalType (old format)
- **When:** Used in variety checking
- **Then:** No errors, missing fields treated as undefined

##### AC-7: FinderResult includes new fields <- R4.3
- **Given:** FinderResult type
- **When:** Inspected
- **Then:** Has methodId (string), signalType (SignalType), score (number), scoreBreakdown (CandidateScore), candidatesEvaluated (number)

#### Edge Cases
##### EC-1: Case with no playability issues gets max playability score
- **Scenario:** Perfect case — clear first move, 6+ AP margin, keystone reachable in 2 AP
- **Expected:** playability subscore = 25

##### EC-2: Case failing all funness checks gets 0 funness
- **Scenario:** No red herrings, only 1 WHO path, trivial single-action reveal
- **Expected:** funness subscore = 0

#### Error Cases
None — pure scoring, no errors possible. Bad input returns low score, not errors.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | scoreDailyCandidate returns valid score range | `tests/daily.test.ts` |
| AC-2 | playability subscore reflects metrics | `tests/daily.test.ts` |
| AC-3 | difficultyFit penalizes out-of-range | `tests/daily.test.ts` |
| AC-4 | funness rewards variety | `tests/daily.test.ts` |
| AC-5 | discoverability rewards all 6 parts | `tests/daily.test.ts` |
| AC-6 | DailyCaseRecord backward compat | `tests/daily.test.ts` |
| AC-7 | FinderResult has new fields | `tests/daily.test.ts` |
| EC-1 | max playability score | `tests/daily.test.ts` |
| EC-2 | zero funness score | `tests/daily.test.ts` |

#### Notes
**Planning Notes:**
- Reuse `validatePlayability`, `validateDifficulty`, `validateFunness`, `getAllChains` from validators.ts — DO NOT reimplement.
- Score is deterministic — same case always produces same score.
- CandidateScore.total = sum of 4 subscores (each 0-25 = 0-100 total).
- Extended DailyCaseRecord fields are optional (`methodId?: string`) for backward compat with existing test history fixtures.
- Discoverability helpers from validate-seeds.ts (hasMethodInPhysical, hasCrimeAwareness, hasCulpritMotive, hasPhysicalEvidence) are private/unexported in validate-seeds.ts. Reimplement them as private helpers in `src/daily/finder.ts` — they are 2-4 lines each (simple evidence filter checks). Do NOT modify validate-seeds.ts to export them; that file is a standalone batch tool.

**Implementation Notes:**
- `scoreDailyCandidate()` implemented in `src/daily/finder.ts` with 4 subscores:
  - Playability: uses `validatePlayability` — apMargin (0-8), firstMoveClarity (0/4/8), keystoneReachAP (0/3/5), windowSpread (0-4)
  - DifficultyFit: uses `validateDifficulty` — AP midpoint distance (0-10), contradiction range (0-8), branching (0-7)
  - Funness: uses `validateFunness` — valid (15), suspiciousActs (+5), motive variety (+5)
  - Discoverability: chain analysis + 4 helper functions — 4 pts per dimension, +1 bonus for all 6
- Discoverability helpers reimplemented as private functions (not exported from validate-seeds.ts)
- `DailyCaseRecord` extended with optional `methodId?` and `signalType?`
- `FinderResult` extended with `methodId`, `signalType`, `score`, `scoreBreakdown`, `candidatesEvaluated`
- `CandidateScore` type exported from barrel
- Existing `findValidDailySeed` updated to populate new fields (will be rewritten in Task 002)
- All 33 tests pass, type check clean, CLI tests (8) pass with no regressions

**Review Notes:** [filled by reviewer]

---

### Task 002: Multi-Candidate Finder with Extended Variety

**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5, R2.6, R3.1, R3.2, R3.3, R3.4, R3.5

#### Objective
Rewrite `findValidDailySeed()` to collect up to N valid candidates, score each, apply extended 7-day variety constraints, and return the highest-scored candidate.

#### Context
**Relevant Files:**
- `src/daily/finder.ts` — current findValidDailySeed (first-valid-wins loop)
- `src/daily/history.ts` — DailyCaseRecord
- `src/validators.ts` — analyzeSignal (for signalType extraction)
- `src/types.ts` — DIFFICULTY_PROFILES, profileToDifficultyConfig

**Embedded Context:**

Current finder loop (to be replaced):
```typescript
for (let offset = 0; offset < maxOffsets; offset++) {
    const seed = baseSeed + offset;
    const result = generateValidatedCase(seed, tier);
    if (!result) continue;
    // ... validateCase gate ...
    // ... yesterday variety check ...
    return { seed, tier, offset, ... };  // FIRST VALID
}
```

New approach:
```typescript
interface ScoredCandidate {
    result: FinderResult;
    score: CandidateScore;
}

const candidates: ScoredCandidate[] = [];

for (let offset = 0; offset < maxOffsets; offset++) {
    const seed = baseSeed + offset;
    const result = generateValidatedCase(seed, tier);
    if (!result) continue;
    // ... validateCase gate (hard gate, same as before) ...
    // ... hard variety gate (crimeType/culprit repeat in last 2 days) ...

    const score = scoreDailyCandidate(sim, evidence, tier);
    // ... soft variety penalty (methodId repeat in last 7 days) ...
    candidates.push({ result: finderResult, score });

    if (candidates.length >= candidatePool) break;
}

// Return best
candidates.sort((a, b) => b.score.total - a.score.total);
return candidates[0]?.result ?? null;
```

New FinderOptions field:
```typescript
export interface FinderOptions {
    secret?: string;
    maxOffsets?: number;
    schedule?: WeeklySchedule;
    rulesetVersion?: string;
    candidatePool?: number;  // NEW: default 50
}
```

Variety rules (extended):
- **Hard reject** (same as now + extended): crimeType matches last 2 days, culprit matches last 2 days
- **Soft penalty** (score reduction): methodId matches any of last 7 days (-10 from score), signalType matches last 3 days (-5 from score)

#### Entry Points / Wiring
- `findValidDailySeed` in `src/daily/finder.ts` — modified (same signature + new option)
- Called by CLI `--daily` flag in `src/cli.ts` (no CLI changes needed, just finder behavior)
- `analyzeSignal` from validators.ts to extract signalType for fingerprint

#### Files Touched
- `src/daily/finder.ts` — modify (rewrite findValidDailySeed, add candidatePool to FinderOptions)
- `tests/daily.test.ts` — modify (line ~155: FinderResult field assertions must include new fields: methodId, signalType, score, scoreBreakdown, candidatesEvaluated)
- `tests/daily-cli.test.ts` — modify (all 8 test blocks parse JSON output; update assertions to expect new fields in JSON)

#### Acceptance Criteria
##### AC-1: Finder collects multiple candidates <- R2.1
- **Given:** A date/tier that produces many valid cases
- **When:** findValidDailySeed() called with candidatePool=5
- **Then:** FinderResult.candidatesEvaluated >= 2 (at least considers multiple)

##### AC-2: Finder returns highest-scored candidate <- R2.3
- **Given:** candidatePool=5 and multiple valid seeds with different scores
- **When:** findValidDailySeed() is called
- **Then:** Returned seed has the highest score among candidates

##### AC-3: Single candidate still works <- R2.4
- **Given:** candidatePool=1 (or only 1 valid seed in offset range)
- **When:** findValidDailySeed() is called
- **Then:** Returns that single valid seed (no degradation from old behavior)

##### AC-4: Deterministic selection <- R2.5
- **Given:** Same date, tier, history, and options
- **When:** findValidDailySeed() called twice
- **Then:** Returns identical FinderResult both times

##### AC-5: FinderResult has score and candidatesEvaluated <- R2.6
- **Given:** A successful findValidDailySeed call
- **When:** Result inspected
- **Then:** Has score (number > 0) and candidatesEvaluated (number >= 1)

##### AC-6: Extended variety rejects crimeType repeat in last 2 days <- R3.2
- **Given:** History with last 2 records both having crimeType 'theft'
- **When:** findValidDailySeed() is called
- **Then:** Result crimeType is not 'theft'

##### AC-7: Extended variety rejects culprit repeat in last 2 days <- R3.3
- **Given:** History with last 2 records both having culprit 'alice'
- **When:** findValidDailySeed() is called
- **Then:** Result culprit is not 'alice'

##### AC-8: Soft variety penalty for methodId repeat <- R3.4
- **Given:** History with yesterday's methodId = 'grabbed'
- **When:** Two candidates — one with methodId 'grabbed', one with 'smuggled', otherwise equal
- **Then:** 'smuggled' candidate scores higher due to no variety penalty

##### AC-9: Empty history imposes no variety constraints <- R3.5
- **Given:** Empty history array
- **When:** findValidDailySeed() is called
- **Then:** No variety filtering or penalty applied, returns best-scored candidate

##### AC-10: 7-day lookback for soft penalties <- R3.1
- **Given:** History with 7 records, methodId from 6 days ago is 'grabbed'
- **When:** Candidate has methodId 'grabbed'
- **Then:** Still receives soft penalty (within 7-day window)

#### Edge Cases
##### EC-1: All candidates have identical scores
- **Scenario:** 5 candidates all score identically
- **Expected:** Returns the first one found (lowest offset, deterministic)

##### EC-2: candidatePool larger than valid seeds in range
- **Scenario:** candidatePool=50, only 3 valid seeds in maxOffsets range
- **Expected:** Returns best of the 3

##### EC-3: History shorter than lookback window
- **Scenario:** History has 3 records, 7-day lookback requested
- **Expected:** Only checks the 3 available records, no error

#### Error Cases
##### ERR-1: No valid candidates in offset range
- **When:** maxOffsets exhausted with 0 valid candidates
- **Then:** Returns null (same as current behavior)

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | finder collects multiple candidates | `tests/daily.test.ts` |
| AC-2 | finder returns highest-scored | `tests/daily.test.ts` |
| AC-3 | single candidate works | `tests/daily.test.ts` |
| AC-4 | deterministic selection | `tests/daily.test.ts` |
| AC-5 | FinderResult has new fields | `tests/daily.test.ts` |
| AC-6 | crimeType 2-day reject | `tests/daily.test.ts` |
| AC-7 | culprit 2-day reject | `tests/daily.test.ts` |
| AC-8 | methodId soft penalty | `tests/daily.test.ts` |
| AC-9 | empty history no constraints | `tests/daily.test.ts` |
| AC-10 | 7-day lookback | `tests/daily.test.ts` |
| EC-1 | identical scores | `tests/daily.test.ts` |
| EC-2 | pool larger than valid seeds | `tests/daily.test.ts` |
| EC-3 | short history | `tests/daily.test.ts` |
| ERR-1 | no valid candidates | `tests/daily.test.ts` |

#### Notes
**Planning Notes:**
- The `maxOffsets` (default 1000) is the total search budget. `candidatePool` (default 50) is the number of VALID candidates to collect before stopping. Finder stops at whichever limit is hit first.
- Hard variety gates (reject) save computation — no point scoring a case that'll be rejected.
- Soft variety penalties are applied AFTER scoring — they subtract from the total score.
- Sorting: `candidates.sort((a, b) => b.score.total - a.score.total)` — ties broken by offset (first found wins = deterministic).
- `generateValidatedCase()` calls `analyzeSignal()` internally but does NOT expose the `SignalAnalysis` result. After getting the `{sim, evidence}` result, call `analyzeSignal(evidence, sim.config)` again to extract `.signalType` for the fingerprint. This is cheap (pure evidence scan, no re-simulation). Import `analyzeSignal` from `../validators.js`.
- Similarly, extract `methodId` from `sim.config.crimeMethod` (or equivalent field on the simulation result).

**Implementation Notes:**
- Rewrote `findValidDailySeed` to collect up to `candidatePool` (default 50) valid candidates
- Hard variety gates: reject crimeType/culprit matching any of last 2 days (extended from 1-day)
- Soft variety penalties: methodId repeat in last 7 days (-10), signalType repeat in last 3 days (-5)
- Candidates sorted by adjusted score descending; ties broken by offset (first found = stable)
- `FinderOptions` extended with `candidatePool?: number`
- `ScoredCandidate` internal interface holds result + adjustedScore
- `analyzeSignal()` called per candidate to extract signalType fingerprint
- `sim.config.crimeMethod.methodId` used for methodId fingerprint
- All 47 unit tests pass, 8 CLI tests pass, type check clean
- Gemini review skipped (user opted out)

**Review Notes:** [filled by reviewer]

---

### Task 003: CLI Verbose Diagnostics

**Complexity:** S
**Depends On:** 002
**Implements:** R5.1, R5.2, R5.3

#### Objective
Wire the new scoring data into CLI output. Normal `--daily` includes score in JSON. `--daily --verbose` prints scoring breakdown.

#### Context
**Relevant Files:**
- `src/cli.ts` — existing --daily block (around line where `args.daily` is checked)
- `src/daily/finder.ts` — FinderResult with new score/candidatesEvaluated fields

**Embedded Context:**

Current --daily output (JSON):
```json
{
  "seed": 2546863754,
  "tier": 2,
  "offset": 0,
  "culprit": "eve",
  "crimeType": "sabotage",
  "date": "2026-02-06",
  "rulesetVersion": "0.1.0"
}
```

New --daily output (JSON) — adds score fields:
```json
{
  "seed": 2546863754,
  "tier": 2,
  "offset": 3,
  "culprit": "eve",
  "crimeType": "sabotage",
  "methodId": "broke",
  "signalType": "self_contradiction",
  "date": "2026-02-06",
  "rulesetVersion": "0.1.0",
  "score": 82,
  "candidatesEvaluated": 12
}
```

Verbose output (stderr, human-readable):
```
Evaluated 12 candidates (offsets 0-47)
Best: seed 2546863757, score 82/100
  Playability:    22/25 (clear first move, AP margin 6)
  Difficulty Fit: 20/25 (minAP 9, contradictions 4, branching 3)
  Funness:        20/25 (2 red herrings, 3 motive suspects)
  Discoverability:25/25 (all 6 parts discoverable)
  Variety penalty: -5 (signalType repeat)
```

#### Entry Points / Wiring
- `src/cli.ts` — modify the `--daily` execution block

#### Files Touched
- `src/cli.ts` — modify (add verbose scoring output to --daily block)

#### Acceptance Criteria
##### AC-1: --daily JSON includes score <- R5.3
- **Given:** CLI invoked with `--daily --date 2026-02-05`
- **When:** Output parsed
- **Then:** JSON has `score` (number), `candidatesEvaluated` (number), `methodId` (string), `signalType` (string)

##### AC-2: --daily --verbose shows breakdown <- R5.1
- **Given:** CLI invoked with `--daily --date 2026-02-05 --verbose`
- **When:** stderr output inspected
- **Then:** Shows candidate count, best score, and 4 subscore lines

##### AC-3: --daily --verbose shows candidates evaluated <- R5.2
- **Given:** CLI invoked with `--daily --date 2026-02-05 --verbose`
- **When:** stderr output inspected
- **Then:** Shows "Evaluated N candidates" line

##### AC-4: --daily --seed override includes scoring <- R5.3
- **Given:** CLI invoked with `--daily --seed 42`
- **When:** Output parsed
- **Then:** JSON has `score`, `scoreBreakdown`, `candidatesEvaluated` (= 1), `methodId`, `signalType`
- **Note:** The `--seed` path in cli.ts (line ~656-681) constructs a manual FinderResult. Must call `scoreDailyCandidate()` on the forced seed and populate all new fields.

#### Edge Cases
##### EC-1: --daily --verbose with single candidate
- **Scenario:** Only 1 valid candidate found
- **Expected:** Shows "Evaluated 1 candidate" (singular), still shows score breakdown

##### EC-2: --daily --seed --verbose shows breakdown for forced seed
- **Scenario:** `--daily --seed 42 --verbose`
- **Expected:** Shows score breakdown for the forced seed, candidatesEvaluated = 1

#### Error Cases
None — verbose output is informational only.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | --daily JSON has score fields | `tests/daily-cli.test.ts` |
| AC-2 | --daily --verbose shows breakdown | `tests/daily-cli.test.ts` |
| AC-3 | --daily --verbose shows candidates count | `tests/daily-cli.test.ts` |
| AC-4 | --daily --seed includes scoring | `tests/daily-cli.test.ts` |
| EC-1 | single candidate verbose output | `tests/daily-cli.test.ts` |
| EC-2 | --seed --verbose shows breakdown | `tests/daily-cli.test.ts` |

#### Notes
**Planning Notes:**
- Verbose output goes to stderr (`console.error`) so JSON on stdout remains machine-parseable. This is consistent with the `--daily` block's existing pattern where errors go to stderr and the result JSON goes to stdout.
- The verbose flag already exists in the Args interface (from existing CLI). Just need to use it in the --daily block.
- Score breakdown comes from `FinderResult.scoreBreakdown` (CandidateScore object added in Task 001). Format each subscore as `{name}: {value}/25 ({detail})`.
- For the `--seed` override path: call `scoreDailyCandidate()` on the forced seed's sim/evidence to populate scoreBreakdown, set candidatesEvaluated = 1.

**Implementation Notes:**
- Added `printVerboseScoring()` helper in cli.ts for stderr output
- `--seed` path now calls `scoreDailyCandidate()` and `analyzeSignal()` to populate all new fields
- `--daily` non-seed path already gets new fields from `findValidDailySeed()` (updated in Task 002)
- Verbose output: "Evaluated N candidate(s)", "Best: seed X, score Y/100", 4 subscore lines
- Updated `runCli` test helper from `execSync` to `spawnSync` to properly capture stderr on success
- All 14 CLI tests pass (8 existing + 6 new), 47 unit tests pass, type check clean

**Review Notes:** [filled by reviewer]

---

## Scope

**In Scope:**
- `scoreDailyCandidate()` quality scoring function using existing validators
- Multi-candidate collection in `findValidDailySeed()`
- Extended 7-day variety checking (hard reject + soft penalty)
- Fingerprint fields on DailyCaseRecord and FinderResult (methodId, signalType)
- CLI verbose scoring diagnostics
- `candidatePool` option in FinderOptions

**Out of Scope:**
- Full CaseFingerprint from INCIDENT_SYSTEM_PLAN (topology, archetype, evidence pattern hash)
- Arc/season system
- Weekly themes
- Novelty gating against 14-day history
- Anti-pattern rejection rules (object cooldown, twist cooldown)
- Automated history file management

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scoring adds ~30ms per candidate × 50 = 1.5s | Acceptable for offline tooling | candidatePool configurable, default 50 |
| Soft variety penalty could make all candidates score identically | No differentiation | Penalty is small (-5 to -10), base quality differences dominate |
| Extended variety too restrictive (rejects all candidates) | Returns null | Hard rejects only on 2-day window; 7-day is soft penalty only |
| Existing tests break due to FinderResult shape change | Test failures | New fields added alongside existing, tests updated |

---

## Open Questions

None — all resolved during conversation.

---

## Change Log

- 2026-02-06: Plan created. Scope approved: quality scoring + 7-day variety + fingerprint fields. Arcs/seasons deferred to future feature.
- 2026-02-06: Review round 1 fixes applied:
  - Added `scoreBreakdown: CandidateScore` to FinderResult (High — needed by Task 003 verbose)
  - Listed specific test breakage in Task 002 (daily.test.ts:155, daily-cli.test.ts)
  - Added AC-4/EC-2 to Task 003 for `--daily --seed` override path
  - Clarified validate-seeds.ts helpers are private → reimplement inline in finder.ts
  - Added explicit `analyzeSignal()` wiring note to Task 002
  - Clarified stderr for verbose output in Task 003 notes

---

## Review Log

- 2026-02-06: Review round 1 — verdict NEEDS-CHANGES (1 High, 4 Medium, 2 Low). All fixes applied.
