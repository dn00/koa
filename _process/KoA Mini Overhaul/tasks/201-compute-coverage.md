# Task 201: Implement computeCoverage

**Status:** backlog
**Complexity:** S
**Depends On:** 101
**Implements:** R3.1

---

## Objective

Create the coverage computation function that determines whether the played cards address all 3 known facts or leave gaps.

---

## Context

### Relevant Files
- NEW: `packages/engine-core/src/resolver/v5/coverage.ts` — create this file
- `packages/engine-core/src/types/v5/card.ts` — Card interface with factTouch field
- `packages/engine-core/src/resolver/v5/index.ts` — export new function

### Embedded Context

**Card type (from Task 101):**
```typescript
interface Card {
  readonly id: string;
  readonly factTouch: 1 | 2 | 3;  // Scalar, exactly one fact per card
  // ... other fields not relevant to this task
}
```

**Function to implement:**
```typescript
/**
 * Result of coverage computation.
 * @property status - 'complete' if all facts covered, 'gap' if any missing
 * @property missingFacts - Array of fact numbers (1, 2, or 3) not covered. Empty if complete.
 */
export interface CoverageResult {
  readonly status: 'complete' | 'gap';
  readonly missingFacts: readonly number[];
}

/**
 * Computes whether the played cards cover all 3 known facts.
 * A card "touches" a fact if its factTouch field equals that fact number.
 *
 * Algorithm:
 * 1. Let covered = Set(card.factTouch for each card)
 * 2. If covered contains {1, 2, 3} => status = 'complete'
 * 3. Else => status = 'gap', missingFacts = facts not in covered set
 *
 * @param cards - Array of played cards (typically 1-3 cards)
 * @returns CoverageResult with status and missingFacts
 */
export function computeCoverage(cards: readonly Card[]): CoverageResult;
```

**Invariant:** All known facts are numbered 1, 2, or 3. The set of all facts is always {1, 2, 3}.

**From spec section 3.1:**
> Coverage uses factTouch. If `covered` contains {1, 2, 3} => coverage = complete. Else => coverage = gap (with indication of which fact is missing).

---

## Acceptance Criteria

### AC-1: Complete coverage detected <- R3.1
- **Given:** Cards with factTouch values [1, 2, 3] (one of each)
- **When:** computeCoverage is called
- **Then:** Returns `{ status: 'complete', missingFacts: [] }`

### AC-2: Single gap detected <- R3.1
- **Given:** Cards with factTouch values [1, 2] (missing 3)
- **When:** computeCoverage is called
- **Then:** Returns `{ status: 'gap', missingFacts: [3] }`

### AC-3: Multiple gaps detected <- R3.1
- **Given:** Cards with factTouch values [1] (missing 2 and 3)
- **When:** computeCoverage is called
- **Then:** Returns `{ status: 'gap', missingFacts: [2, 3] }`

### AC-4: Order-independent <- R3.1
- **Given:** Cards with factTouch values [3, 1, 2] (out of order)
- **When:** computeCoverage is called
- **Then:** Returns `{ status: 'complete', missingFacts: [] }`

---

## Edge Cases

### EC-1: Empty cards array
- **Scenario:** computeCoverage([]) called with no cards
- **Expected:** Returns `{ status: 'gap', missingFacts: [1, 2, 3] }`

### EC-2: Duplicate factTouch values
- **Scenario:** Cards with factTouch values [1, 1, 2] (two cards touch fact 1)
- **Expected:** Returns `{ status: 'gap', missingFacts: [3] }` (duplicates don't count twice)

### EC-3: All same factTouch
- **Scenario:** Cards with factTouch values [2, 2, 2] (all touch same fact)
- **Expected:** Returns `{ status: 'gap', missingFacts: [1, 3] }`

### EC-4: More than 3 cards with complete coverage
- **Scenario:** Cards with factTouch values [1, 2, 3, 1] (4 cards, all facts covered)
- **Expected:** Returns `{ status: 'complete', missingFacts: [] }`

### EC-5: missingFacts sorted
- **Scenario:** Cards with factTouch values [3] (missing 1 and 2)
- **Expected:** Returns `{ status: 'gap', missingFacts: [1, 2] }` (sorted ascending)

---

## Error Cases

### ERR-1: Invalid factTouch value
- **When:** Card has factTouch value outside 1-3 range
- **Then:** This is prevented by TypeScript. No runtime check needed.
- **Error Message:** N/A (compile-time only)

---

## Scope

**In Scope:**
- Create coverage.ts file
- Implement computeCoverage function
- Export CoverageResult interface
- Export from resolver/v5/index.ts

**Out of Scope:**
- UI display of coverage results (Phase 2)
- Validation of cards (Task 401)
- Independence computation (Task 202)
- Concern computation (Task 203)

---

## Implementation Hints

1. Use a Set to collect covered facts: `new Set(cards.map(c => c.factTouch))`
2. Compare against the full set [1, 2, 3] to find missing
3. Sort missingFacts ascending for consistent output
4. Make result readonly to prevent mutation
5. Keep the function pure — no side effects

**Example implementation sketch:**
```typescript
const ALL_FACTS = [1, 2, 3] as const;

export function computeCoverage(cards: readonly Card[]): CoverageResult {
  const covered = new Set(cards.map(c => c.factTouch));
  const missingFacts = ALL_FACTS.filter(f => !covered.has(f));

  return {
    status: missingFacts.length === 0 ? 'complete' : 'gap',
    missingFacts,
  };
}
```

---

## Log

### Planning Notes
**Context:** Coverage is one of the 3 axes in v1 Lite. It answers "did the player address all 3 known facts?"
**Decisions:** missingFacts is an array (not Set) for easier serialization and display. Sorted for consistency.
