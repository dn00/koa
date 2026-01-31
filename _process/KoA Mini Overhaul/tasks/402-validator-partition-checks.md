# Task 402: Validator factTouch Partition Checks

**Status:** backlog
**Complexity:** S
**Depends On:** 401
**Implements:** R7.4, R7.5

---

## Objective

Add validator checks to ensure the 3 truths form a perfect partition (one touches each fact 1, 2, 3) and each fact is touched by at least 2 cards total.

---

## Context

### Relevant Files
- `scripts/prototype-v5.ts` — Main validator file

### Embedded Context

**From spec section 2.2 (factTouch definition):**
> A card "touches" Fact N if the card's claim is intended to reduce uncertainty about Fact N.
> **Type:** `factTouch: 1 | 2 | 3` (scalar, not array — exactly one fact per card)

**Required constraints (spec 7.2):**
- Each card's `factTouch` is 1, 2, or 3 (scalar) — checked in Task 401
- **The 3 truths form a perfect partition:** one truth touches Fact 1, one touches Fact 2, one touches Fact 3
- Each fact is touched by at least 2 cards total

**Existing check() pattern:**
```typescript
const check = (
  id: string,
  label: string,
  passed: boolean,
  detail: string,
  severity: 'error' | 'warn' = 'error'
) => {
  checks.push({ id, label, passed, detail, severity });
};
```

**Perfect partition algorithm:**
```typescript
// Get truth cards
const truths = cards.filter(c => !c.isLie);
// truths.length === 3 (checked elsewhere)

// Extract factTouch values
const truthFacts = new Set(truths.map(t => t.factTouch));

// Perfect partition: truthFacts must be exactly {1, 2, 3}
const isPerfectPartition =
  truthFacts.size === 3 &&
  truthFacts.has(1) &&
  truthFacts.has(2) &&
  truthFacts.has(3);
```

**Coverage check algorithm:**
```typescript
// Count how many cards touch each fact
const factCoverage = new Map<number, number>();
for (const card of cards) {
  const current = factCoverage.get(card.factTouch) || 0;
  factCoverage.set(card.factTouch, current + 1);
}

// Each fact must be touched by >= 2 cards
const allFactsCovered =
  (factCoverage.get(1) || 0) >= 2 &&
  (factCoverage.get(2) || 0) >= 2 &&
  (factCoverage.get(3) || 0) >= 2;
```

---

## Acceptance Criteria

### AC-1: Truth partition is perfect <- R7.4
- **Given:** A puzzle with 3 truths
- **When:** Running the validator
- **Then:** Check V6 passes if the 3 truths have factTouch values {1, 2, 3} (one of each)
- **Then:** Check V6 fails if any two truths share the same factTouch or any fact is missing from truths

### AC-2: Each fact touched by >= 2 cards <- R7.5
- **Given:** A puzzle with 6 cards
- **When:** Running the validator
- **Then:** Check V7 passes if each fact (1, 2, 3) is touched by at least 2 cards
- **Then:** Check V7 fails if any fact is touched by only 1 card (or 0 cards)

---

## Edge Cases

### EC-1: Two truths touch same fact
- **Scenario:** Truths have factTouch values [1, 1, 2]
- **Expected:** V6 fails: "truths partition: got [1,1,2] — missing fact 3"

### EC-2: One fact only touched by 1 card
- **Scenario:** factTouch distribution: {1:3, 2:2, 3:1}
- **Expected:** V7 fails: "fact coverage: fact 3 touched by 1 card (need >= 2)"

### EC-3: Lies fill the gaps correctly
- **Scenario:** Truths: [1,2,3], Lies: [1,2,3] — each fact covered by exactly 2
- **Expected:** Both V6 and V7 pass

### EC-4: All 6 cards touch same fact
- **Scenario:** All cards have factTouch: 1
- **Expected:** V6 fails (partition [1,1,1]), V7 fails (facts 2,3 have 0 coverage)

---

## Error Cases

### ERR-1: Partition detail format
- **When:** Truths have factTouch [2, 2, 3]
- **Then:** V6 detail shows: "truths have [2,2,3] — need {1,2,3}, missing: 1"
- **Error Message:** Includes the actual values and which fact is missing

### ERR-2: Coverage detail format
- **When:** Fact 2 only has 1 card
- **Then:** V7 detail shows: "fact 2 has 1 card (need 2+)"
- **Error Message:** Lists all undercovered facts

---

## Scope

**In Scope:**
- Add check V6: truths form perfect partition {1, 2, 3}
- Add check V7: each fact touched by >= 2 cards total
- Both checks use severity 'error'

**Out of Scope:**
- Tag presence checks (Task 401)
- Lie trap checks (Task 403)
- P4 constraint (Task 404)

---

## Implementation Hints

1. Place these checks after V5 (subsystem check) in the validator
2. For V6, sort truthFacts for consistent detail output
3. For V7, report all undercovered facts, not just the first one
4. These depend on factTouch being valid (Task 401 checks first)
5. Use truths/lies arrays already computed at top of runChecks()

**Suggested check IDs:**
- V6: Truths partition
- V7: Fact coverage

**Example detail strings:**
- V6 pass: "truths touch [1,2,3] — perfect partition"
- V6 fail: "truths touch [1,1,3] — missing: 2"
- V7 pass: "fact coverage: 1=2, 2=3, 3=1... wait, all >= 2"
- V7 fail: "fact 3 has 1 card (need 2+)"

---

## Log

### Planning Notes
**Context:** Core fairness rule — all truths together must cover all facts
**Decisions:** Partition check is error-level since it's fundamental to gameplay
