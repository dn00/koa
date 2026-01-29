# Task 001: V5 Core Types

**Status:** ready
**Assignee:** -
**Blocked By:** -
**Phase:** 1 - Foundation Types
**Complexity:** M
**Depends On:** none
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.8, R4.1

---

## Objective

Define the V5 core domain types in engine-core: Card, GameState, V5Puzzle, TurnResult, ObjectionState. These replace the MVP types and use branded IDs per project patterns.

---

## Context

The V5 game uses a fundamentally different domain model than MVP. Cards have `isLie` booleans (hidden from player), scoring is belief-based, and there's an objection mechanic. This task establishes the type foundation that all other V5 resolver code depends on.

### Relevant Files
- `scripts/v5-types.ts` - Source types to migrate (lines 1-147)
- `packages/engine-core/src/types/index.ts` - Where Result type lives
- `packages/engine-core/src/types/ids.ts` - Branded ID patterns

### Embedded Context

**Branded ID Pattern (from PATTERNS.md):**
```typescript
type CardId = string & { readonly __brand: 'CardId' };
function isCardId(id: string): id is CardId {
  return id.startsWith('card_') || /^[a-z0-9-]+$/.test(id);
}
```

**Readonly Types (from PATTERNS.md):**
```typescript
interface Card {
  readonly id: CardId;
  readonly strength: number;
  // ... all fields readonly
}
```

**Result Type (from engine-core/types/index.ts):**
```typescript
type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

**Source Docs (when full context needed):**
- `_process/project/PATTERNS.md` - Full TypeScript patterns

---

## Acceptance Criteria

### AC-1: CardId Branded Type ← R2.1
- **Given:** A string "card_001"
- **When:** Passed to isCardId()
- **Then:** Returns true and type narrows to CardId
- **Test Type:** unit

### AC-2: EvidenceType Literal Union ← R2.2
- **Given:** EvidenceType type
- **When:** Assigned a value
- **Then:** Only 'DIGITAL', 'PHYSICAL', 'TESTIMONY', 'SENSOR' compile
- **Test Type:** unit (type test)

### AC-3: Card Interface Complete ← R2.1, R2.2
- **Given:** Card interface
- **When:** Creating a card object
- **Then:** Has id (CardId), strength (number), evidenceType (EvidenceType), location (string), time (string), claim (string), presentLine (string), isLie (boolean)
- **Test Type:** unit

### AC-4: GameState Interface Complete ← R2.3
- **Given:** GameState interface
- **When:** Creating a game state object
- **Then:** Has belief (number), hand (Card[]), played (Card[]), turnResults (TurnResult[]), turnsPlayed (number), objection (ObjectionState | null)
- **Test Type:** unit

### AC-5: V5Puzzle Interface Complete ← R2.4
- **Given:** V5Puzzle interface
- **When:** Creating a puzzle object
- **Then:** Has slug, name, scenario, knownFacts, openingLine, target, cards, lies, verdicts, koaBarks
- **Test Type:** unit

### AC-6: TurnResult and ObjectionState Types ← R2.8
- **Given:** TurnResult interface
- **When:** Creating a turn result
- **Then:** Has card, beliefChange, wasLie, typeTaxApplied, narration, koaResponse
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: Empty CardId validation
- **Scenario:** isCardId called with empty string
- **Expected:** Returns false
- **Test Type:** unit

#### EC-2: CardId with special characters
- **Scenario:** isCardId called with "card_!@#"
- **Expected:** Returns false (only alphanumeric and hyphens allowed)
- **Test Type:** unit

### Error Cases (REQUIRE TESTS)

#### ERR-1: Type safety prevents invalid EvidenceType
- **When:** Attempting to assign 'INVALID' to EvidenceType variable
- **Then:** TypeScript compilation error (test via type assertion)
- **Error Message:** N/A (compile-time)
- **Test Type:** unit (type test)

---

## Scope

### In Scope
- CardId branded type and validator
- EvidenceType string literal union
- Card interface
- GameState interface
- V5Puzzle interface
- TurnResult interface
- ObjectionState interface
- LieInfo interface
- LieType type
- Tier type ('FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED')

### Out of Scope
- GameConfig (Task 002)
- ModeConfig (Task 002)
- Scoring functions (Task 004)
- State hashing (Task 003)

---

## Implementation Hints

1. Create `packages/engine-core/src/types/v5/` directory for V5-specific types
2. Start with `card.ts` for Card and CardId
3. Add `state.ts` for GameState, TurnResult, ObjectionState
4. Add `puzzle.ts` for V5Puzzle, LieInfo
5. Add `enums.ts` for EvidenceType, Tier, LieType
6. Create `index.ts` barrel export
7. Re-export from main `types/index.ts`

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns (readonly, branded IDs)
- [ ] No `any` types
- [ ] Types compile without errors
- [ ] Barrel exports work
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** This is the foundation task for V5 migration. All other tasks depend on these types.
**Decisions:** Put V5 types in `types/v5/` subdirectory to keep separate from any remaining MVP types during transition.
**Questions for Implementer:** Should we preserve backward compatibility by aliasing old types? (Probably no - clean break)

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
| 2026-01-28 | - | backlog | Planner | Created |
| 2026-01-28 | backlog | ready | Planner | No dependencies, ready to start |
