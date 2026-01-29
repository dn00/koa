# Task 005: Objection System

**Status:** backlog
**Assignee:** -
**Blocked By:** 001, 002
**Phase:** 2 - Resolver Migration
**Complexity:** S
**Depends On:** 001, 002
**Implements:** R3.4, R4.3

---

## Objective

Migrate the V5 objection system functions: shouldTriggerObjection, resolveObjection, autoResolveObjection. The objection mechanic lets KOA challenge the last played card after turn 2.

---

## Context

After turn 2, KOA can challenge the last card. Player chooses to stand by or withdraw. Standing by a truth gains +2, standing by a lie loses -4, withdrawing loses -2. Mini mode auto-resolves (KOA makes optimal choice).

### Relevant Files
- `scripts/v5-rules.ts` - shouldTriggerObjection, resolveObjection (lines 72-85)
- `scripts/v5-engine/engine.ts` - autoResolveObjection (lines 248-266)
- Task 001 output: Card, ObjectionState types
- Task 002 output: GameConfig type

### Embedded Context

**Objection Rules:**
```typescript
// After turn 2 (0-indexed turn 1), objection triggers
// Player choice: stand_by or withdraw
// Stand by truth: +2 belief
// Stand by lie: -4 belief
// Withdraw: -2 belief (regardless of truth/lie)
```

**Auto-resolve (Mini mode):**
```typescript
// KOA "knows" truth and makes optimal choice
// Truth: stand by (+2 > -2)
// Lie: withdraw (-2 > -4)
```

---

## Acceptance Criteria

### AC-1: shouldTriggerObjection Returns True After Turn 2 ← R3.4
- **Given:** turnsPlayed=2, config.objection.afterTurn=1
- **When:** shouldTriggerObjection called
- **Then:** Returns true
- **Test Type:** unit

### AC-2: resolveObjection Calculates Stand By Truth ← R3.4, R4.3
- **Given:** wasLie=false, choice='stood_by', config.objection.stoodByTruth=2
- **When:** resolveObjection called
- **Then:** Returns +2 belief change
- **Test Type:** unit

### AC-3: resolveObjection Calculates Stand By Lie ← R3.4, R4.3
- **Given:** wasLie=true, choice='stood_by', config.objection.stoodByLie=-4
- **When:** resolveObjection called
- **Then:** Returns -4 belief change
- **Test Type:** unit

### AC-4: autoResolveObjection Makes Optimal Choice ← R3.4
- **Given:** Truth card
- **When:** autoResolveObjection called
- **Then:** Returns { choice: 'stood_by', beliefChange: +2 }
- **Given:** Lie card
- **When:** autoResolveObjection called
- **Then:** Returns { choice: 'withdrawn', beliefChange: -2 }
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: Objection disabled in config
- **Scenario:** config.objection.enabled=false
- **Expected:** shouldTriggerObjection always returns false
- **Test Type:** unit

### Error Cases (REQUIRE TESTS)

#### ERR-1: Invalid objection choice
- **When:** resolveObjection called with invalid choice value
- **Then:** TypeScript prevents at compile time (choice is literal union)
- **Error Message:** N/A (compile-time)
- **Test Type:** unit (type test)

---

## Scope

### In Scope
- `shouldTriggerObjection(turnsPlayed: number, config: GameConfig): boolean`
- `resolveObjection(wasLie: boolean, choice: 'stood_by' | 'withdrawn', config: GameConfig): number`
- `autoResolveObjection(card: Card, config: GameConfig): { choice: 'stood_by' | 'withdrawn'; beliefChange: number }`

### Out of Scope
- Full objection state management (Task 007)
- Objection presentation (app layer)

---

## Implementation Hints

1. Create `packages/engine-core/src/resolver/v5/objection.ts`
2. Functions are pure - just math based on inputs

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Functions are pure
- [ ] No `any` types
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Objection is a key V5 mechanic that adds tension after turn 2.
**Decisions:** Keep autoResolveObjection separate for Mini mode support.

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
