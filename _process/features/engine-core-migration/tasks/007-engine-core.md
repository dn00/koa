# Task 007: Engine Core

**Status:** backlog
**Assignee:** -
**Blocked By:** 001, 002, 004, 005, 006
**Phase:** 2 - Resolver Migration
**Complexity:** M
**Depends On:** 001, 002, 004, 005, 006
**Implements:** R3.3, R3.5, R4.2, R4.4, R8.1, R8.2, R8.3

---

## Objective

Migrate the core V5 engine functions: createGameState, playCard, isGameOver, getVerdict. These orchestrate game flow and use the scoring/objection/tier functions from earlier tasks.

---

## Context

This is the main game engine. playCard processes a turn: validates the card is in hand, calculates scoring, applies type tax, updates state, and returns the result. The engine must be pure - no I/O, no mutation of input state.

### Relevant Files
- `scripts/v5-engine/engine.ts` - All engine functions (311 lines)
- Tasks 004, 005, 006 output: scoring, objection, tier functions

### Embedded Context

**Pure Function Pattern:**
```typescript
// Input state is never mutated
// Return new state object
function playCard(state: GameState, ...): Result<TurnOutput, EngineError> {
  // Validate
  // Calculate
  // Build new state (immutable)
  return ok({ state: newState, ... });
}
```

**EngineError Codes:**
- CARD_NOT_IN_HAND: Card ID not found in hand
- GAME_OVER: Trying to play when turnsPlayed >= turnsPerGame
- INVALID_STATE: General state validation failure
- OBJECTION_INVALID: Objection called when not allowed

---

## Acceptance Criteria

### AC-1: createGameState Initializes Correctly ← R3.3
- **Given:** A V5Puzzle and GameConfig
- **When:** createGameState called
- **Then:** Returns GameState with belief=config.startingBelief, hand=puzzle.cards (copied), played=[], turnResults=[], turnsPlayed=0, objection=null
- **Test Type:** unit

### AC-2: playCard Returns New State Without Mutating Input ← R3.3
- **Given:** A valid game state with card in hand
- **When:** playCard called
- **Then:** Returns new state; original state unchanged
- **Test Type:** unit

### AC-3: playCard Updates State Correctly ← R3.3
- **Given:** State with hand of 6 cards, belief 50
- **When:** playCard called with truth card (strength 3)
- **Then:** New state has belief 53, hand has 5 cards, played has 1 card, turnsPlayed=1
- **Test Type:** unit

### AC-4: playCard Returns Error for Card Not in Hand ← R4.2, R4.4
- **Given:** State with specific cards
- **When:** playCard called with non-existent cardId
- **Then:** Returns Result with ok=false, error.code='CARD_NOT_IN_HAND'
- **Test Type:** unit

### AC-5: isGameOver Returns True When Turns Exhausted
- **Given:** State with turnsPlayed=3, config.turnsPerGame=3
- **When:** isGameOver called
- **Then:** Returns true
- **Test Type:** unit

### AC-6: getVerdict Calculates Final Result
- **Given:** Final game state with belief 55, puzzle.target 50
- **When:** getVerdict called
- **Then:** Returns VerdictData with tier='FLAWLESS', correct playedCards with wasLie flags
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: playCard on first turn (no previous card for type tax)
- **Scenario:** turnsPlayed=0, no previous card
- **Expected:** Type tax not applied
- **Test Type:** unit

#### EC-2: playCard with type tax triggered
- **Scenario:** Previous card same evidenceType as current
- **Expected:** Type tax penalty applied to scoring
- **Test Type:** unit

#### EC-3: getVerdict with no lies played
- **Scenario:** All played cards are truths
- **Expected:** All playedCards have wasLie=false
- **Test Type:** unit

### Error Cases (REQUIRE TESTS)

#### ERR-1: playCard when game is over
- **When:** playCard called with turnsPlayed >= turnsPerGame
- **Then:** Returns error with code='GAME_OVER'
- **Error Message:** "Game is over. Turns played: X"
- **Test Type:** unit

#### ERR-2: playCard with empty cardId
- **When:** playCard called with cardId=""
- **Then:** Returns error with code='CARD_NOT_IN_HAND'
- **Error Message:** "Card not found in hand"
- **Test Type:** unit

#### ERR-3: resolveObjection with no card played
- **When:** Full resolveObjection called on state with empty played array
- **Then:** Returns error with code='OBJECTION_INVALID'
- **Error Message:** "No card to challenge"
- **Test Type:** unit

---

## Scope

### In Scope
- `createGameState(puzzle: V5Puzzle, config: GameConfig): GameState`
- `playCard(state: GameState, cardId: string, config: GameConfig, seed: number): Result<TurnOutput, EngineError>`
- `shouldProcessObjection(turnsPlayed: number, config: GameConfig): boolean`
- `resolveObjection(state: GameState, choice: 'stood_by' | 'withdrawn', config: GameConfig): Result<ObjectionOutput, EngineError>` (full state version)
- `isGameOver(state: GameState, config: GameConfig): boolean`
- `getVerdict(state: GameState, puzzle: V5Puzzle, config: GameConfig): VerdictData`
- `EngineError` type with code and message
- `TurnOutput`, `ObjectionOutput`, `VerdictData` types

### Out of Scope
- Narration/dialogue (app layer)
- Presentation formatting (app layer)
- Event emission (P1, can add later)

---

## Implementation Hints

1. Create `packages/engine-core/src/resolver/v5/engine.ts`
2. Import scoring, objection, tier functions from sibling modules
3. Use spread operator for immutable state updates
4. For seed-based randomness, pass through to dialogue (or skip dialogue in engine-core)

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Functions are pure (no mutation, no I/O)
- [ ] No `any` types
- [ ] Result types used correctly
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** This is the core integration task. It brings together all the V5 mechanics.
**Decisions:** Skip dialogue/narration in engine-core - that moves to app layer. Engine just tracks state and scoring.
**Questions for Implementer:** Should narration/koaResponse be empty strings in TurnResult, or omit them entirely? (Empty strings preserve type compatibility with existing v5-engine)

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
| 2026-01-28 | - | backlog | Planner | Created, blocked by 001, 002, 004, 005, 006 |
