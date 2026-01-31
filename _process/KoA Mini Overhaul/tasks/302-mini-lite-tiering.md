# Task 302: Implement Mini Lite Tiering

**Status:** backlog
**Complexity:** M
**Depends On:** 301
**Implements:** R5.2, R5.3, R5.4, R5.5, R5.6, R5.7

---

## Objective

Implement the `getMiniLiteTier()` function that computes game outcome tier based on truth/lie count and axis states (coverage, independence, concern) instead of V5 Belief math, including the fairness clamp and same_system overlap rule.

---

## Context

### Relevant Files
- `packages/engine-core/src/resolver/v5/tier.ts` - Add getMiniLiteTier function
- `packages/engine-core/src/types/v5/enums.ts` - Tier type already exists
- `packages/engine-core/src/resolver/v5/index.ts` - Export new function

### Embedded Context

**Tier type (existing in enums.ts):**
```typescript
export type Tier = 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED';
```

**Coverage type (from Task 201):**
```typescript
export type Coverage = 'complete' | 'gap';
```

**Independence type (from Task 202):**
```typescript
export type Independence = 'diverse' | 'correlated_weak' | 'correlated_strong';
```

**Concern type (from Task 204):**
```typescript
export type Concern =
  | { key: 'same_system'; root: SignalRoot }
  | { key: 'automation_heavy' }
  | { key: 'manual_heavy' }
  | { key: 'remote_heavy' }
  | { key: 'absence_heavy' }
  | { key: 'attribution_heavy' }
  | { key: 'integrity_heavy' }
  | { key: 'all_digital' }
  | { key: 'all_sensor' }
  | { key: 'all_testimony' }
  | { key: 'all_physical' }
  | { key: 'no_concern' };
```

**Input type for getMiniLiteTier:**
```typescript
import type { Card } from '../../types/v5/index.js';
import type { Tier } from '../../types/v5/enums.js';
import type { Coverage } from './coverage.js';
import type { Independence } from './independence.js';
import type { Concern } from './concern.js';

/**
 * Input for Mini Lite tiering calculation.
 * All values are pre-computed by their respective functions.
 */
export interface MiniLiteTierInput {
  /** The 3 cards played by the player */
  readonly cards: readonly Card[];

  /** Coverage state (complete or gap) */
  readonly coverage: Coverage;

  /** Independence state (diverse, correlated_weak, correlated_strong) */
  readonly independence: Independence;

  /** Concern computed after T2 */
  readonly concern: Concern;

  /** Whether the T3 card matched the concern dimension (3-of-3) */
  readonly concernHit: boolean;
}
```

**Function signature:**
```typescript
/**
 * Compute the outcome tier for Mini Lite mode.
 *
 * Mini Lite uses axis-based tiering, NOT V5 Belief math.
 *
 * Tiering rules (from spec section 5.2):
 *
 * Rule 0 (Fairness clamp): All 3 truths => Outcome >= CLEARED. Always.
 *
 * Rule 1 (Base failure tiers):
 * - 2 truths + 1 lie => CLOSE
 * - 1 truth + 2 lies => BUSTED
 * - 0 truths + 3 lies => BUSTED
 *
 * Rule 2 (All-truth tiers):
 * - Case A (same_system concern):
 *   - concernHit (doubled down) => CLEARED
 *   - !concernHit (diversified on T3) => FLAWLESS
 *   - Independence is display-only (no double penalty)
 *
 * - Case B (all other concerns including no_concern):
 *   - concernHit => CLEARED
 *   - correlated (weak or strong) => CLEARED
 *   - diverse + diversified => FLAWLESS
 *
 * @param input - Pre-computed axis states and cards
 * @returns Tier classification
 */
export function getMiniLiteTier(input: MiniLiteTierInput): Tier;
```

**Helper function - count truths:**
```typescript
/**
 * Count truth cards in the played set.
 * Uses card.isLie to determine truth (isLie === false).
 */
function countTruths(cards: readonly Card[]): number {
  return cards.filter(card => !card.isLie).length;
}
```

**Tiering logic implementation:**
```typescript
export function getMiniLiteTier(input: MiniLiteTierInput): Tier {
  const { cards, independence, concern, concernHit } = input;
  const truthCount = countTruths(cards);

  // Rule 1: Base failure tiers (not all truths)
  if (truthCount === 2) {
    return 'CLOSE';
  }
  if (truthCount <= 1) {
    return 'BUSTED';
  }

  // Rule 0 + Rule 2: All truths (truthCount === 3)
  // Fairness clamp guarantees at least CLEARED

  // Case A: same_system concern
  if (concern.key === 'same_system') {
    // Independence is display-only in this case (overlap rule)
    if (concernHit) {
      return 'CLEARED';  // Doubled down on same system
    }
    return 'FLAWLESS';  // Diversified on T3
  }

  // Case B: all other concerns (including no_concern)
  if (concernHit) {
    return 'CLEARED';  // Doubled down after warning
  }

  // Check independence (only matters when not same_system concern)
  const isCorrelated = independence === 'correlated_weak' || independence === 'correlated_strong';
  if (isCorrelated) {
    return 'CLEARED';  // Sources overlap
  }

  // All conditions met for FLAWLESS
  return 'FLAWLESS';
}
```

**Key Invariants:**

1. **Fairness Clamp:** All 3 truths MUST result in at least CLEARED. This is non-negotiable.

2. **Overlap Rule:** When `concern.key === 'same_system'`, the same repeated signalRoot causes both:
   - Independence = correlated
   - Concern = potential doubled down

   To avoid double-punishing: concern blocks FLAWLESS, independence is informational only.

3. **concernHit semantics (3-of-3):**
   - `concernHit === true` means all 3 cards match the concern dimension
   - `concernHit === false` means the T3 card diversified away from the concern

4. **no_concern special case:**
   - When concern.key is 'no_concern', concernHit should always be false
   - This means player diversified early (T1+T2 had no repeating dimension)
   - FLAWLESS is still possible if independence is diverse

### Source Docs
- `_process/KoA Mini Overhaul/mini-overhaul.md` - Section 5.2 Outcome mapping

---

## Acceptance Criteria

### AC-1: 2 truths + 1 lie returns CLOSE <- R5.2
- **Given:** MiniLiteTierInput with cards where exactly 2 have isLie=false
- **When:** Calling getMiniLiteTier
- **Then:** Returns 'CLOSE'

### AC-2: 1 truth + 2 lies returns BUSTED <- R5.3
- **Given:** MiniLiteTierInput with cards where exactly 1 has isLie=false
- **When:** Calling getMiniLiteTier
- **Then:** Returns 'BUSTED'

### AC-3: 0 truths + 3 lies returns BUSTED <- R5.3
- **Given:** MiniLiteTierInput with cards where all 3 have isLie=true
- **When:** Calling getMiniLiteTier
- **Then:** Returns 'BUSTED'

### AC-4: All truths + concernHit returns CLEARED <- R5.4
- **Given:** MiniLiteTierInput with all truths, concern.key != 'same_system', concernHit=true
- **When:** Calling getMiniLiteTier
- **Then:** Returns 'CLEARED'

### AC-5: All truths + correlated (non-same_system) returns CLEARED <- R5.5
- **Given:** MiniLiteTierInput with all truths, concern.key != 'same_system', concernHit=false, independence='correlated_weak'
- **When:** Calling getMiniLiteTier
- **Then:** Returns 'CLEARED'

### AC-6: All truths + diverse + diversified returns FLAWLESS <- R5.6
- **Given:** MiniLiteTierInput with all truths, concernHit=false, independence='diverse'
- **When:** Calling getMiniLiteTier
- **Then:** Returns 'FLAWLESS'

### AC-7: same_system overlap rule - Independence is display-only <- R5.7
- **Given:** MiniLiteTierInput with all truths, concern.key='same_system', concernHit=false
- **When:** Calling getMiniLiteTier
- **Then:** Returns 'FLAWLESS' (independence value is ignored)

### AC-8: same_system + concernHit returns CLEARED <- R5.7
- **Given:** MiniLiteTierInput with all truths, concern.key='same_system', concernHit=true
- **When:** Calling getMiniLiteTier
- **Then:** Returns 'CLEARED' (doubled down on same system)

### AC-9: Fairness clamp enforced <- R5.4
- **Given:** Any MiniLiteTierInput with all 3 truths
- **When:** Calling getMiniLiteTier
- **Then:** Returns 'CLEARED' or 'FLAWLESS' (never CLOSE or BUSTED)

---

## Edge Cases

### EC-1: correlated_strong vs correlated_weak
- **Scenario:** All truths, independence='correlated_strong' (same signalRoot)
- **Expected:** Returns 'CLEARED' (both weak and strong block FLAWLESS)

### EC-2: no_concern with diverse sources
- **Scenario:** All truths, concern.key='no_concern', concernHit=false, independence='diverse'
- **Expected:** Returns 'FLAWLESS' (player diversified throughout)

### EC-3: no_concern with correlated sources
- **Scenario:** All truths, concern.key='no_concern', concernHit=false, independence='correlated_weak'
- **Expected:** Returns 'CLEARED' (correlation still blocks FLAWLESS)

### EC-4: Coverage not used in tiering
- **Scenario:** coverage='gap' but all cards are truths
- **Expected:** Tier is still >= CLEARED (coverage is informational for Final Audit, not tiering)

### EC-5: Empty cards array
- **Scenario:** cards array has fewer than 3 elements
- **Expected:** Should not happen in production; function assumes 3 cards played

---

## Error Cases

### ERR-1: Invalid card count
- **When:** cards.length !== 3
- **Then:** Optionally throw error or handle gracefully
- **Error Message:** "getMiniLiteTier requires exactly 3 cards"
- **Note:** This validation is optional; caller is expected to provide valid input

---

## Scope

**In Scope:**
- Implement getMiniLiteTier function
- Implement countTruths helper
- Define MiniLiteTierInput interface
- Export from resolver/v5/index.ts
- Unit tests for all tiering paths

**Out of Scope:**
- Coverage computation (Task 201)
- Independence computation (Task 202)
- Concern computation (Task 203, 204)
- Wiring getMiniLiteTier into game store (Task 501 calls this)
- ceilingBlocker computation (Task 501 - store computes this separately)
- Final Audit display (Task 702)
- Ceiling explanation display (Task 703)

**Note:** getMiniLiteTier returns only the Tier ('FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED'). The ceilingBlocker is computed separately in the store (Task 501) using the axis results.

---

## Implementation Hints

1. Start with the truth count check - it's the primary branching point
2. Handle same_system concern case separately before the general case
3. Add explicit comments referencing spec section 5.2 for each rule
4. Consider adding a `DEBUG` logging option to trace the decision path
5. The function is pure - no side effects, easy to unit test
6. Write tests for all 9 acceptance criteria paths
7. Remember: independence only affects tiering when concern.key is NOT 'same_system'

**Test matrix for all-truths scenarios:**

| concern.key | concernHit | independence | Expected Tier |
|-------------|------------|--------------|---------------|
| same_system | true | (any) | CLEARED |
| same_system | false | (any) | FLAWLESS |
| other | true | (any) | CLEARED |
| other | false | correlated_* | CLEARED |
| other | false | diverse | FLAWLESS |
| no_concern | false | correlated_* | CLEARED |
| no_concern | false | diverse | FLAWLESS |

---

## Log

### Planning Notes
**Context:** Mini needs axis-based tiering that guarantees fairness (all truths => CLEARED minimum) while adding strategic depth via concern and independence.
**Decisions:**
- Overlap rule ensures same_system concern doesn't double-penalize with independence
- Coverage is NOT used in tiering (only displayed in Final Audit)
- concernHit uses 3-of-3 semantics (all three cards match concern dimension)
