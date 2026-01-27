# Task 003: Basic Damage Calculation

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Foundation
**Complexity:** S
**Depends On:** 002
**Implements:** (foundation for R3.3, R5.3, R8.1)

---

## Objective

Implement the basic damage calculation function that sums card power values. This is the foundation for contested penalty (Task 006) and corroboration bonus (Task 005).

---

## Context

Damage is how players reduce Resistance to win. The formula builds up:
1. Base: sum of card power (this task)
2. Contested: 50% penalty if counter targets (Task 006)
3. Corroboration: 25% bonus if cards share claims (Task 005)

### Relevant Files
- `packages/engine-core/src/resolver/damage.ts` (to create)
- Depends on: `packages/engine-core/src/types/`

### Embedded Context

**Damage Formula (from D24, D31):**
```
base_damage = sum(card.power for card in submission)
```

**Invariant I1 - Determinism:**
- Use integers only (no floating point)
- Use `Math.ceil()` for any rounding (consistent across platforms)

**Result Type Pattern (from PATTERNS.md):**
```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

**Source Docs:**
- `docs/D03-DETERMINISTIC-RESOLVER-SPEC.md` - Full damage formula
- `_process/project/INVARIANTS.md` - Determinism rules

---

## Acceptance Criteria

### AC-1: Single Card Damage <- (foundation)
- **Given:** One EvidenceCard with power 10
- **When:** calculateBaseDamage([card]) is called
- **Then:** Returns 10
- **Test Type:** unit

### AC-2: Multiple Card Damage <- (foundation)
- **Given:** Three cards with power 5, 8, 12
- **When:** calculateBaseDamage([card1, card2, card3]) is called
- **Then:** Returns 25
- **Test Type:** unit

### AC-3: Empty Submission <- (edge case)
- **Given:** Empty array of cards
- **When:** calculateBaseDamage([]) is called
- **Then:** Returns 0 (or error, see ERR-1)
- **Test Type:** unit

### AC-4: Power is Integer <- I1
- **Given:** Cards with integer power values
- **When:** calculateBaseDamage is called
- **Then:** Result is integer
- **Test Type:** unit

### AC-5: Pure Function <- I1
- **Given:** Same cards
- **When:** calculateBaseDamage called multiple times
- **Then:** Same result every time
- **Test Type:** unit

### Edge Cases

#### EC-1: Single Card with Zero Power
- **Scenario:** Card with power = 0
- **Expected:** Returns 0 (valid, maybe a trap card)

#### EC-2: Maximum Cards (3)
- **Scenario:** Exactly 3 cards submitted
- **Expected:** Sum calculated correctly

### Error Cases

#### ERR-1: Invalid Submission Size
- **When:** More than 3 cards or empty submission
- **Then:** Return error result
- **Error Message:** "Submission must contain 1-3 cards"

---

## Scope

### In Scope
- `calculateBaseDamage(cards: EvidenceCard[]): number`
- Input validation (1-3 cards)
- Pure function, no side effects

### Out of Scope
- Contested penalty (Task 006)
- Corroboration bonus (Task 005)
- Full resolve function (later tasks)

---

## Implementation Hints

```typescript
export function calculateBaseDamage(cards: readonly EvidenceCard[]): Result<number, DamageError> {
  if (cards.length === 0 || cards.length > 3) {
    return { ok: false, error: new DamageError('Submission must contain 1-3 cards') };
  }

  const total = cards.reduce((sum, card) => sum + card.power, 0);
  return { ok: true, value: total };
}
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No project doc violations
- [ ] Types are correct (no `any`)
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Simple task but critical foundation. Keep it pure and tested.
**Decisions:**
- Return Result type for validation errors
- Accept readonly array for immutability
**Questions for Implementer:**
- Should empty submission be an error or return 0?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:**
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | | |
| AC-2 | | |
| AC-3 | | |
| AC-4 | | |
| AC-5 | | |
**Issues:**
**Suggestions:**

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
