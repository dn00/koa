# Task 405: Validator Fairness Simulation

**Status:** backlog
**Complexity:** M
**Depends On:** 302, 404
**Implements:** R7.10, R7.11

---

## Objective

Add a fairness simulation that enumerates all 20 possible 3-card selections (C(6,3) = 20), confirms exactly 1 selection is "all truths", and for that all-truths selection, simulates all 6 orderings to confirm each yields outcome >= CLEARED.

---

## Context

### Relevant Files
- `scripts/prototype-v5.ts` — Main validator file (already has combinatorics and enumerateSequences)

### Embedded Context

**From spec section 0 (Definition of Done - Fairness):**
> - **All 3 truths selected (any order) => Outcome >= CLEARED** (Mini only).
> - Concern can affect **FLAWLESS eligibility**, but never prevents CLEARED when all truths were played.

**From spec section 5.2 (Outcome mapping):**
> **Rule 0 (Fairness clamp):** All 3 truths in any order => Outcome >= **CLEARED**. Always.

**From spec section 7.3 (Mini fairness simulation):**
> Simulate all 20 possible 3-card selections:
> - Confirm exactly 1 selection yields "all truths"
> - Confirm that selection yields >= CLEARED in all 6 orders

**Existing combinatorics in prototype-v5.ts:**
```typescript
function* combinations<T>(arr: readonly T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

function* permutations<T>(arr: T[]): Generator<T[]> {
  if (arr.length <= 1) { yield arr; return; }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [arr[i]!, ...perm];
    }
  }
}
```

**Mini Lite outcome mapping (from spec 5.2, NOT V5 Belief math):**

For this task, we need to determine outcome tier using the Lite mapping, not the existing V5 scoring. The key rules:

```typescript
// Rule 0: All 3 truths => always >= CLEARED
// Rule 1: 2 truths + 1 lie => CLOSE
// Rule 1: 1 truth + 2 lies => BUSTED
// Rule 1: 0 truths + 3 lies => BUSTED

// Rule 2 (All 3 truths):
// - If concern doubled down => CLEARED (not FLAWLESS)
// - If concern diversified AND independence diverse => FLAWLESS
// - If concern diversified BUT independence correlated => CLEARED
```

**Concern computation (from Task 404):**
```typescript
function computeConcern(cardA: Card, cardB: Card): Concern { ... }
function matchesConcern(card: Card, concern: Concern): boolean { ... }
```

**Independence computation (from spec 3.2):**
```typescript
const signalRootGroup: Record<SignalRoot, SignalRootGroup> = { ... };

function computeIndependence(cards: Card[]): 'diverse' | 'correlated_weak' | 'correlated_strong' {
  // If any two share same signalRoot (and != 'unknown') => correlated_strong
  // Else if any two share same signalRootGroup (and != 'unknown') => correlated_weak
  // Else => diverse
}
```

**Simulating one ordering for outcome:**
```typescript
function simulateLiteOutcome(ordering: Card[]): 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED' {
  const liesPlayed = ordering.filter(c => c.isLie).length;

  // Rule 1: Base failure tiers
  if (liesPlayed >= 2) return 'BUSTED';
  if (liesPlayed === 1) return 'CLOSE';

  // All truths case (liesPlayed === 0)
  // Compute concern after T2
  const [t1, t2, t3] = ordering;
  const concern = computeConcern(t1, t2);

  // Concern hit test (3-of-3)
  const concernHit = concern.key !== 'no_concern' && matchesConcern(t3, concern);

  // Case A: same_system concern
  if (concern.key === 'same_system') {
    return concernHit ? 'CLEARED' : 'FLAWLESS';
  }

  // Case B: other concerns or no_concern
  if (concernHit) return 'CLEARED';

  const independence = computeIndependence(ordering);
  if (independence !== 'diverse') return 'CLEARED';

  return 'FLAWLESS';
}
```

---

## Acceptance Criteria

### AC-1: Exactly 1 selection is all-truths <- R7.10
- **Given:** A puzzle with 6 cards (3 truths, 3 lies)
- **When:** Enumerating C(6,3) = 20 possible 3-card selections
- **Then:** Check V13 passes if exactly 1 selection contains 0 lies
- **Then:** Check V13 fails if 0 or >1 all-truth selections exist (impossible with valid puzzle)

### AC-2: All-truths orderings yield >= CLEARED <- R7.11
- **Given:** The 1 all-truths selection (3 truth cards)
- **When:** Simulating all 6 orderings with Lite outcome rules
- **Then:** Check V14 passes if all 6 orderings yield CLEARED or FLAWLESS
- **Then:** Check V14 fails if any ordering yields CLOSE or BUSTED

---

## Edge Cases

### EC-1: Concern blocks FLAWLESS but not CLEARED
- **Scenario:** All-truths selection where T1 and T2 share controlPath 'automation', T3 also has 'automation'
- **Expected:** Outcome is CLEARED (doubled down), not FLAWLESS; V14 still passes

### EC-2: Independence blocks FLAWLESS but not CLEARED
- **Scenario:** All truths have same signalRootGroup, concern diversified
- **Expected:** Outcome is CLEARED (correlated sources), not FLAWLESS; V14 still passes

### EC-3: Different orderings yield different tiers
- **Scenario:** Order ABC yields FLAWLESS, order BAC yields CLEARED (due to concern computation changing)
- **Expected:** Both >= CLEARED, so V14 passes; this is expected behavior

### EC-4: All 6 orderings yield FLAWLESS
- **Scenario:** Diverse sources, all orderings avoid concern hit
- **Expected:** V14 passes (FLAWLESS > CLEARED threshold)

---

## Error Cases

### ERR-1: Lie count mismatch
- **When:** Puzzle has 4 lies instead of 3
- **Then:** Existing check S2 fails first; V13/V14 would see 0 all-truth selections

### ERR-2: Missing fields for computation
- **When:** Cards missing signalRoot for independence check
- **Then:** Task 401 catches first; assume valid data here

---

## Scope

**In Scope:**
- Add helper: simulateLiteOutcome(ordering) -> Tier
- Add helper: computeIndependence(cards) -> independence level
- Add check V13: exactly 1 all-truths selection
- Add check V14: all-truths orderings >= CLEARED
- Both checks are error severity

**Out of Scope:**
- Simulating all 120 orderings (20 selections x 6 orderings) — only all-truths matters
- Existing V5 scoring math (this uses Lite mapping per spec)
- Anti-meta weekly distribution (spec 7.4)

---

## Implementation Hints

1. Reuse existing combinations() and permutations() generators
2. Place simulateLiteOutcome as module-level helper
3. Import/inline signalRootGroup table from Task 103 or define locally
4. V13 is a sanity check — should always pass for valid 3-truth puzzles
5. For V14, collect failing orderings to show in detail

**Suggested check IDs:**
- V13: Exactly one all-truths selection
- V14: All-truths fairness (all orderings >= CLEARED)

**Example detail strings:**
- V13 pass: "1 all-truths selection out of 20"
- V13 fail: "0 all-truths selections — puzzle has wrong truth count"
- V14 pass: "all 6 orderings >= CLEARED (4 FLAWLESS, 2 CLEARED)"
- V14 fail: "ordering [truth-A, truth-B, truth-C] yielded CLOSE — fairness violated!"

**Algorithm sketch:**
```typescript
function runFairnessSimulation(puzzle: V5Puzzle): { v13: InvariantCheck; v14: InvariantCheck } {
  const cards = [...puzzle.cards];

  // Find all-truths selections
  const allTruthsSelections: Card[][] = [];
  for (const selection of combinations(cards, 3)) {
    if (selection.every(c => !c.isLie)) {
      allTruthsSelections.push(selection);
    }
  }

  // V13: Exactly 1 all-truths selection
  const v13Passed = allTruthsSelections.length === 1;
  const v13 = {
    id: 'V13',
    label: 'Exactly one all-truths selection',
    passed: v13Passed,
    detail: `${allTruthsSelections.length} all-truths selection(s) out of 20`,
    severity: 'error' as const,
  };

  if (!v13Passed || allTruthsSelections.length === 0) {
    const v14 = {
      id: 'V14',
      label: 'All-truths fairness',
      passed: false,
      detail: 'cannot simulate — wrong number of all-truths selections',
      severity: 'error' as const,
    };
    return { v13, v14 };
  }

  // V14: All orderings >= CLEARED
  const truths = allTruthsSelections[0]!;
  const outcomes: { ordering: string; tier: Tier }[] = [];
  let allCleared = true;

  for (const ordering of permutations(truths)) {
    const tier = simulateLiteOutcome(ordering);
    outcomes.push({
      ordering: ordering.map(c => c.id).join('->'),
      tier
    });
    if (tier === 'CLOSE' || tier === 'BUSTED') {
      allCleared = false;
    }
  }

  const tierCounts = { FLAWLESS: 0, CLEARED: 0, CLOSE: 0, BUSTED: 0 };
  for (const o of outcomes) tierCounts[o.tier]++;

  const v14 = {
    id: 'V14',
    label: 'All-truths fairness (all orderings >= CLEARED)',
    passed: allCleared,
    detail: allCleared
      ? `all 6 orderings >= CLEARED (${tierCounts.FLAWLESS} FLAWLESS, ${tierCounts.CLEARED} CLEARED)`
      : `FAIRNESS VIOLATION: ${outcomes.filter(o => o.tier === 'CLOSE' || o.tier === 'BUSTED').map(o => `${o.ordering} -> ${o.tier}`).join(', ')}`,
    severity: 'error' as const,
  };

  return { v13, v14 };
}
```

**Independence helper:**
```typescript
function computeIndependence(cards: Card[]): 'diverse' | 'correlated_weak' | 'correlated_strong' {
  // Check for same signalRoot (strong correlation)
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const rootA = cards[i]!.signalRoot;
      const rootB = cards[j]!.signalRoot;
      if (rootA === rootB && rootA !== 'unknown') {
        return 'correlated_strong';
      }
    }
  }

  // Check for same signalRootGroup (weak correlation)
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const groupA = signalRootGroup[cards[i]!.signalRoot];
      const groupB = signalRootGroup[cards[j]!.signalRoot];
      if (groupA === groupB && groupA !== 'unknown') {
        return 'correlated_weak';
      }
    }
  }

  return 'diverse';
}
```

---

## Log

### Planning Notes
**Context:** Core fairness guarantee — players who pick all 3 truths must always win
**Decisions:** Uses Lite outcome mapping, not existing V5 Belief math
