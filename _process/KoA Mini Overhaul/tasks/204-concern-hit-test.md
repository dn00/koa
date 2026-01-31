# Task 204: Implement Concern Hit Test

**Status:** backlog
**Complexity:** S
**Depends On:** 203
**Implements:** R3.6, R3.7, R3.8

---

## Objective

Create the evaluateConcernResult function that determines whether a concern was "hit" (3-of-3 cards match) or "avoided" (player diversified on T3).

---

## Context

### Relevant Files
- `packages/engine-core/src/resolver/v5/concern.ts` — add to this file (created in Task 203)
- `packages/engine-core/src/types/v5/card.ts` — Card interface

### Embedded Context

**Concern type (from Task 203):**
```typescript
type Concern =
  | { readonly key: 'same_system'; readonly root: SignalRoot }
  | { readonly key: 'automation_heavy' }
  | { readonly key: 'manual_heavy' }
  | { readonly key: 'remote_heavy' }
  | { readonly key: 'absence_heavy' }
  | { readonly key: 'attribution_heavy' }
  | { readonly key: 'integrity_heavy' }
  | { readonly key: 'all_digital' }
  | { readonly key: 'all_sensor' }
  | { readonly key: 'all_testimony' }
  | { readonly key: 'all_physical' }
  | { readonly key: 'no_concern' };
```

**matchesConcern function (from Task 203):**
```typescript
function matchesConcern(card: Card, concern: Concern): boolean;
// Returns true if card matches the concern's dimension
// Returns false for no_concern (always)
```

**Result type to implement:**
```typescript
/**
 * Result of evaluating whether a concern was hit or avoided.
 *
 * Semantics (from spec section 3.3):
 * - concernHit: true if ALL 3 cards match the concern dimension (3-of-3 = "doubled down")
 * - concernAvoided: true if only 2 cards match (T3 diversified the pattern)
 *
 * For no_concern: concernHit=false, concernAvoided=true (spec: "Concern is N/A")
 */
export interface ConcernResult {
  readonly concernHit: boolean;
  readonly concernAvoided: boolean;
}
```

**Function signature to implement:**
```typescript
/**
 * Evaluates whether the concern was hit (3-of-3) or avoided (2-of-3 diversified).
 *
 * Algorithm (from spec section 3.3):
 * - If concern.key === 'no_concern': return { concernHit: false, concernAvoided: true }
 * - Count how many cards match the concern dimension using matchesConcern
 * - concernHit = (matchCount === 3)
 * - concernAvoided = (matchCount < 3)
 *
 * Note: The first two cards are guaranteed to match (that's how concern was computed),
 * so matchCount is always >= 2 for non-no_concern.
 *
 * @param cards - All 3 played cards (T1, T2, T3 in order)
 * @param concern - The Concern computed after T2
 * @returns ConcernResult with hit/avoided status
 */
export function evaluateConcernResult(cards: readonly Card[], concern: Concern): ConcernResult;
```

**Key invariants:**
- Concern was computed from cards[0] and cards[1], so they always match
- Only cards[2] (T3) determines hit vs avoided
- no_concern is a special case: always avoided, never hit
- concernHit and concernAvoided are mutually exclusive (can't both be true)

---

## Acceptance Criteria

### AC-1: Concern hit when all 3 match <- R3.6
- **Given:** concern = `{ key: 'automation_heavy' }`, all 3 cards have controlPath = 'automation'
- **When:** evaluateConcernResult(cards, concern) is called
- **Then:** Returns `{ concernHit: true, concernAvoided: false }`

### AC-2: Concern avoided when T3 diversifies <- R3.7
- **Given:** concern = `{ key: 'automation_heavy' }`, cards[0,1] have controlPath = 'automation', cards[2] has controlPath = 'manual'
- **When:** evaluateConcernResult(cards, concern) is called
- **Then:** Returns `{ concernHit: false, concernAvoided: true }`

### AC-3: no_concern always returns avoided <- R3.8
- **Given:** concern = `{ key: 'no_concern' }`, any 3 cards
- **When:** evaluateConcernResult(cards, concern) is called
- **Then:** Returns `{ concernHit: false, concernAvoided: true }`

### AC-4: same_system hit test uses stored root <- R3.6
- **Given:** concern = `{ key: 'same_system', root: 'phone_os' }`, all 3 cards have signalRoot = 'phone_os'
- **When:** evaluateConcernResult(cards, concern) is called
- **Then:** Returns `{ concernHit: true, concernAvoided: false }`

### AC-5: same_system avoided when T3 uses different root <- R3.7
- **Given:** concern = `{ key: 'same_system', root: 'phone_os' }`, cards[0,1] have signalRoot = 'phone_os', cards[2] has signalRoot = 'koa_cloud'
- **When:** evaluateConcernResult(cards, concern) is called
- **Then:** Returns `{ concernHit: false, concernAvoided: true }`

---

## Edge Cases

### EC-1: Fewer than 3 cards
- **Scenario:** evaluateConcernResult called with only 2 cards
- **Expected:** Returns `{ concernHit: false, concernAvoided: true }` (can't hit without T3)

### EC-2: Empty cards array
- **Scenario:** evaluateConcernResult([]) called with no cards
- **Expected:** Returns `{ concernHit: false, concernAvoided: true }` (defensive handling)

### EC-3: More than 3 cards
- **Scenario:** evaluateConcernResult called with 4 cards
- **Expected:** Evaluates all cards; concernHit only if ALL match (4-of-4 would be hit)

### EC-4: Evidence type concern hit
- **Scenario:** concern = `{ key: 'all_sensor' }`, all 3 cards have evidenceType = 'SENSOR'
- **Expected:** Returns `{ concernHit: true, concernAvoided: false }`

### EC-5: Evidence type concern avoided
- **Scenario:** concern = `{ key: 'all_sensor' }`, cards[0,1] have evidenceType = 'SENSOR', cards[2] has evidenceType = 'DIGITAL'
- **Expected:** Returns `{ concernHit: false, concernAvoided: true }`

### EC-6: Claim shape concern (integrity)
- **Scenario:** concern = `{ key: 'integrity_heavy' }`, all 3 cards have claimShape = 'integrity'
- **Expected:** Returns `{ concernHit: true, concernAvoided: false }`

---

## Error Cases

### ERR-1: Invalid concern type
- **When:** This should never happen (type system prevents it)
- **Then:** TypeScript enforces Concern type
- **Error Message:** N/A (compile-time only)

---

## Scope

**In Scope:**
- Add ConcernResult interface to concern.ts
- Implement evaluateConcernResult function
- Export from resolver/v5/index.ts

**Out of Scope:**
- Outcome tiering (CLEARED vs FLAWLESS) - separate task
- KOA bark display - Task 601, 602
- Final Audit UI - Phase 2
- The overlap rule (same_system + independence) - handled in outcome tiering

---

## Implementation Hints

1. Use the matchesConcern function from Task 203
2. Handle no_concern as an early return
3. Count matches using filter or reduce
4. Remember: T1 and T2 always match (by definition of how concern was computed)

**Example implementation:**
```typescript
export function evaluateConcernResult(cards: readonly Card[], concern: Concern): ConcernResult {
  // Special case: no_concern is always avoided
  if (concern.key === 'no_concern') {
    return { concernHit: false, concernAvoided: true };
  }

  // Defensive: handle fewer than expected cards
  if (cards.length === 0) {
    return { concernHit: false, concernAvoided: true };
  }

  // Count how many cards match the concern dimension
  const matchCount = cards.filter(card => matchesConcern(card, concern)).length;

  // Hit = all cards match, Avoided = at least one doesn't
  const concernHit = matchCount === cards.length;
  const concernAvoided = !concernHit;

  return { concernHit, concernAvoided };
}
```

**Alternative (explicit 3-card assumption):**
```typescript
export function evaluateConcernResult(cards: readonly Card[], concern: Concern): ConcernResult {
  if (concern.key === 'no_concern') {
    return { concernHit: false, concernAvoided: true };
  }

  // For standard 3-card play, only T3 determines hit vs avoided
  // T1 and T2 always match by definition
  const allMatch = cards.every(card => matchesConcern(card, concern));

  return {
    concernHit: allMatch,
    concernAvoided: !allMatch,
  };
}
```

---

## Log

### Planning Notes
**Context:** This completes the Concern system. The hit test determines whether the player "doubled down" (3-of-3) or "diversified" (T3 broke the pattern).
**Decisions:**
- concernHit and concernAvoided are mutually exclusive for clarity
- no_concern special-cased as per spec ("Concern: Balanced")
- Function accepts any number of cards for flexibility, but designed for 3
- Uses matchesConcern from Task 203 for consistency
