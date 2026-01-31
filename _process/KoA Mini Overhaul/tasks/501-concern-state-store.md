# Task 501: Add Concern State to Game Store

**Status:** backlog
**Complexity:** S
**Depends On:** 201, 202, 203, 204, 302
**Implements:** R5.1

---

## Objective

Add concern state tracking to the Svelte game store. Store the current concern (computed after T2) and whether the player has diversified or doubled down.

---

## Context

### Relevant Files
- `packages/app-svelte/src/lib/stores/game.ts` — game store
- `packages/engine-core/src/resolver/v5/concern.ts` — computeConcern, matchesConcern (Task 203)
- `packages/engine-core/src/resolver/v5/coverage.ts` — computeCoverage (Task 201)
- `packages/engine-core/src/resolver/v5/independence.ts` — computeIndependence (Task 202)
- `packages/engine-core/src/resolver/v5/tier.ts` — getMiniLiteTier (Task 302)

### Embedded Context

**New store state fields:**
```typescript
import type { Concern, CoverageResult, IndependenceLevel } from 'engine-core';

interface GameState {
  // ... existing fields ...

  /** Concern computed after T2 submission. null before T2. */
  concern: Concern | null;

  /** Whether player hit the concern (3-of-3) or avoided (2-of-3). null before T3. */
  concernResult: 'hit' | 'avoided' | null;

  /** Axis results computed after T3 submission. null before T3. */
  axisResults: AxisResults | null;

  /** What blocked FLAWLESS (for ceiling explanation). null if FLAWLESS or not all truths. */
  ceilingBlocker: 'concern' | 'correlation' | 'both' | null;

  /** Final outcome tier. null before T3. */
  outcome: 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED' | null;
}

/**
 * Computed axis results for Final Audit display.
 */
interface AxisResults {
  coverage: CoverageResult;          // from computeCoverage
  independence: IndependenceLevel;   // from computeIndependence
  concernHit: boolean;               // from concernResult === 'hit'
  noConcern: boolean;                // from concern.key === 'no_concern'
}
```

**Imports from engine-core:**
```typescript
import {
  computeConcern,
  matchesConcern,
  evaluateConcernResult,
  computeCoverage,
  computeIndependence,
  getMiniLiteTier,
  type Concern,
  type CoverageResult,
  type IndependenceLevel,
  type MiniLiteTierInput,
} from 'engine-core';
```

**Computation timing:**
- After T2 submission: Call `computeConcern(card1, card2)` → store in `concern`
- After T3 submission:
  1. Call `evaluateConcernResult(cards, concern)` → derive `concernResult`
  2. Call `computeCoverage(cards)` → get coverage
  3. Call `computeIndependence(cards)` → get independence
  4. Build `axisResults` from above
  5. Build `MiniLiteTierInput` and call `getMiniLiteTier(input)` → store in `outcome`
  6. Derive `ceilingBlocker` from axisResults (only if outcome is CLEARED with all truths)

**concernResult derivation (uses engine-core):**
```typescript
// After T3 submission
const { concernHit, concernAvoided } = evaluateConcernResult(selectedCards, concern);
concernResult = concernHit ? 'hit' : 'avoided';
```

**axisResults computation (after T3):**
```typescript
function computeAxisResults(cards: Card[], concern: Concern, concernResult: 'hit' | 'avoided'): AxisResults {
  return {
    coverage: computeCoverage(cards),
    independence: computeIndependence(cards),
    concernHit: concernResult === 'hit',
    noConcern: concern.key === 'no_concern',
  };
}
```

**outcome computation (after T3):**
```typescript
// Build input for getMiniLiteTier
const tierInput: MiniLiteTierInput = {
  cards: selectedCards,
  coverage: axisResults.coverage,
  independence: axisResults.independence,
  concern: concern,
  concernHit: axisResults.concernHit,
};

const outcome = getMiniLiteTier(tierInput);
```

**ceilingBlocker computation (after T3, only for CLEARED with all truths):**
```typescript
function computeCeilingBlocker(
  outcome: Tier,
  axisResults: AxisResults,
  concern: Concern,
  truthCount: number
): 'concern' | 'correlation' | 'both' | null {
  // Only relevant for CLEARED with all truths
  if (outcome !== 'CLEARED' || truthCount !== 3) {
    return null;
  }

  const { concernHit, independence } = axisResults;

  // same_system overlap rule: only concern matters, independence is display-only
  if (concern.key === 'same_system') {
    return concernHit ? 'concern' : null;
  }

  const isCorrelated = independence === 'correlated_weak' || independence === 'correlated_strong';

  if (concernHit && isCorrelated) return 'both';
  if (concernHit) return 'concern';
  if (isCorrelated) return 'correlation';
  return null;
}
```

---

## Acceptance Criteria

### AC-1: concern field exists in store <- R5.1
- **Given:** Game store state
- **When:** Checking fields
- **Then:** `concern: Concern | null` field exists

### AC-2: concernResult field exists <- R5.1
- **Given:** Game store state
- **When:** Checking fields
- **Then:** `concernResult: 'hit' | 'avoided' | null` field exists

### AC-3: concern computed after T2 <- R5.1
- **Given:** Player submits T2 card
- **When:** Store updates
- **Then:** `concern` is set to result of computeConcern

### AC-4: concernResult computed after T3 <- R5.1
- **Given:** Player submits T3 card
- **When:** Store updates
- **Then:** `concernResult` is 'hit' or 'avoided' based on T3 match

### AC-5: axisResults computed after T3 <- R5.1
- **Given:** Player submits T3 card
- **When:** Store updates
- **Then:** `axisResults` contains coverage, independence, concernHit, noConcern

### AC-6: ceilingBlocker computed after T3 <- R5.1
- **Given:** Player submits T3 card with all truths
- **When:** Store updates
- **Then:** `ceilingBlocker` is 'concern', 'correlation', 'both', or null

### AC-7: outcome computed after T3 <- R5.1
- **Given:** Player submits T3 card
- **When:** Store updates
- **Then:** `outcome` is 'FLAWLESS', 'CLEARED', 'CLOSE', or 'BUSTED'

---

## Edge Cases

### EC-1: no_concern special case
- **Scenario:** computeConcern returns { key: 'no_concern' }
- **Expected:** concernResult is always 'avoided'

### EC-2: same_system root matching
- **Scenario:** Concern is { key: 'same_system', root: 'koa_cloud' }
- **Expected:** cardMatchesConcern checks card.signalRoot === 'koa_cloud'

---

## Error Cases

### ERR-1: concern accessed before T2
- **When:** UI tries to read concern before T2 submission
- **Then:** Value is null
- **Error Message:** N/A (null check in UI)

---

## Scope

**In Scope:**
- Add concern, concernResult, axisResults, ceilingBlocker, outcome to store state
- Import and use computeConcern, matchesConcern, evaluateConcernResult from engine-core
- Import and use computeCoverage, computeIndependence from engine-core
- Import and use getMiniLiteTier from engine-core
- Compute concern after T2
- Compute concernResult, axisResults, outcome, ceilingBlocker after T3

**Out of Scope:**
- T2 suspicion display (Task 701)
- Tiering logic (Task 301, 302)
- Engine-core function implementations (Tasks 201, 202, 203, 204)

---

## Implementation Hints

1. Initialize concern, concernResult, axisResults, ceilingBlocker, outcome as null
2. In submitCard action:
   - Turn 2: compute concern via `computeConcern(card1, card2)`
   - Turn 3: compute concernResult, axisResults, outcome, ceilingBlocker (in order)
3. Import ALL concern/axis/tier functions from engine-core (don't re-implement)
4. computeAxisResults and computeCeilingBlocker are store-local helpers
5. Export AxisResults type for UI components
6. Order matters in T3: concernResult → axisResults → outcome → ceilingBlocker

---

## Log

### Planning Notes
**Context:** Store needs concern state for UI and tiering
**Decisions:** Compute at T2 (concern) and T3 (result)
