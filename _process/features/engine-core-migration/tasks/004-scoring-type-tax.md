# Task 004: Scoring & Type Tax

**Status:** backlog
**Assignee:** -
**Blocked By:** 001, 002
**Phase:** 2 - Resolver Migration
**Complexity:** S
**Depends On:** 001, 002
**Implements:** R3.1, R3.2

---

## Objective

Migrate the V5 scoring functions (scoreCard, checkTypeTax) to engine-core. These are pure functions that calculate belief changes based on card properties and game configuration.

---

## Context

V5 scoring: truth cards gain belief (strength value), lie cards lose belief (strength - 1). Type tax applies a penalty when playing the same evidence type consecutively.

### Relevant Files
- `scripts/v5-rules.ts` - scoreCard, checkTypeTax (lines 20-55)
- Task 001 output: Card type
- Task 002 output: GameConfig type

### Embedded Context

**Scoring Rules (from v5-rules.ts):**
```typescript
// Truth: gain strength as belief
// Lie: lose (strength - 1) as belief
// Type tax: additional penalty if same type as previous card
```

**Pure Function Pattern (from PATTERNS.md):**
- No I/O, no mutation
- Takes inputs, returns output
- Deterministic

---

## Acceptance Criteria

### AC-1: scoreCard Returns Correct Belief Change for Truth ← R3.1
- **Given:** A truth card (isLie=false) with strength 3
- **When:** scoreCard called with default config
- **Then:** Returns { beliefChange: 3, wasLie: false }
- **Test Type:** unit

### AC-2: scoreCard Returns Correct Belief Change for Lie ← R3.1
- **Given:** A lie card (isLie=true) with strength 3
- **When:** scoreCard called with default config
- **Then:** Returns { beliefChange: -2, wasLie: true } (strength - 1 = 2, negated)
- **Test Type:** unit

### AC-3: scoreCard Applies Type Tax Penalty ← R3.1
- **Given:** A truth card with strength 3, typeTaxActive=true
- **When:** scoreCard called with config where typeTax.penalty=-2
- **Then:** Returns { beliefChange: 1, wasLie: false } (3 - 2 = 1)
- **Test Type:** unit

### AC-4: checkTypeTax Detects Same Type ← R3.2
- **Given:** Current card DIGITAL, previous card DIGITAL
- **When:** checkTypeTax called with typeTax.enabled=true
- **Then:** Returns true
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: checkTypeTax with no previous card
- **Scenario:** previousCard is null (first turn)
- **Expected:** Returns false (no tax on first card)
- **Test Type:** unit

#### EC-2: checkTypeTax when disabled
- **Scenario:** config.typeTax.enabled=false
- **Expected:** Returns false even if same type
- **Test Type:** unit

---

## Scope

### In Scope
- `scoreCard(card: Card, config: GameConfig, typeTaxActive: boolean): ScoringResult`
- `checkTypeTax(currentCard: Card, previousCard: Card | null, config: GameConfig): boolean`
- ScoringResult type: `{ beliefChange: number; wasLie: boolean }`

### Out of Scope
- Tier calculation (Task 006)
- Objection scoring (Task 005)
- Full turn processing (Task 007)

---

## Implementation Hints

1. Create `packages/engine-core/src/resolver/v5/scoring.ts`
2. Functions should be pure - no access to global state
3. Consider exporting from resolver barrel

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Functions are pure (no side effects)
- [ ] No `any` types
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Scoring is the core mechanic of V5. Pure functions enable testing and determinism.
**Decisions:** Keep same function signatures as v5-rules.ts for easy migration.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-28 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created, blocked by 001, 002 |
