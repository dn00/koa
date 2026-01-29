# Task 002: Engine Core (State & Logic)

**Status:** done
**Assignee:** -
**Blocked By:** 001
**Phase:** Core Engine
**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R6.3

---

## Objective

Extract game state management and turn processing from play-v5.ts into pure functions that can be tested and reused.

---

## Context

Currently `play-v5.ts` mixes state management with I/O. We need pure functions for:
- Creating initial game state
- Processing card plays
- Handling objection (player choice in Advanced, auto-resolved in Mini - scoring applies in both)
- Determining game over and verdict

### Relevant Files
- `scripts/play-v5.ts` - Logic to extract (lines 363-426 interactive, 456-739 turn-by-turn)
- `scripts/v5-rules.ts` - Existing pure functions (reuse these)
- `scripts/v5-types.ts` - GameState, TurnResult types

### Embedded Context

**Pure Function Requirement:**
Engine functions must have no side effects. They take inputs and return outputs. No console.log, no fs operations, no Date.now() (use seed parameter).

**Objection in Mini:**
When `modeConfig.playerChoosesObjection === false`, engine auto-resolves objection using optimal risk-neutral strategy. Scoring (+2/-4/-2) still applies - player just doesn't choose. KOA "knows" the truth and makes the optimal call.

**Scoring Rules (from v5-rules.ts):**
- Truth: `+strength`
- Lie: `-(strength - 1)`
- Type tax: `-2` if same evidence type as previous card
- Objection: `+2` (stood truth), `-4` (stood lie), `-2` (withdrew)

**Future Extensibility (KOA Trials):**
Design engine functions to accommodate:
- **Tactic card processing** before/after evidence play
- **KOA counter triggers** based on play patterns
- **Variable hearings** (config.turnsPerGame = 3, 5, or 7)
- **Drafting hooks** between turns/hearings

Use composition pattern: `playTurn()` should call sub-functions that can be extended:
```typescript
// Future pattern
playTurn(state, input, config) {
  if (input.tacticId) applyTactic(state, input.tacticId);  // Future
  const result = playEvidence(state, input.cardId, config);
  checkKoaCounters(state, result);  // Future
  return result;
}
```

---

## Acceptance Criteria

### AC-1: createGameState ← R2.2
- **Given:** Puzzle and GameConfig
- **When:** createGameState(puzzle, config) called
- **Then:** Returns GameState with belief=config.startingBelief, hand=puzzle.cards, played=[], turnsPlayed=0
- **Test Type:** unit

### AC-2: playCard Pure Function ← R2.1, R2.2
- **Given:** GameState, cardId, GameConfig, seed
- **When:** playCard(state, cardId, config, seed) called
- **Then:** Returns Result<TurnOutput, EngineError> with updated state, no console I/O
- **Test Type:** unit

### AC-3: playCard Scoring ← R2.1
- **Given:** GameState with card in hand
- **When:** playCard called with truth card (str=4)
- **Then:** Result contains beliefChange=+4, wasLie=false
- **Test Type:** unit

### AC-4: playCard Lie Scoring ← R2.1
- **Given:** GameState with lie card in hand (str=5)
- **When:** playCard called
- **Then:** Result contains beliefChange=-4, wasLie=true
- **Test Type:** unit

### AC-5: playCard Type Tax ← R2.1
- **Given:** Previous card was DIGITAL, current card is DIGITAL (str=3, truth)
- **When:** playCard called
- **Then:** beliefChange=+1 (3 - 2 type tax)
- **Test Type:** unit

### AC-6: resolveObjection ← R2.1
- **Given:** GameState after T2, GameConfig with objection.enabled=true
- **When:** resolveObjection(state, 'stood_by', config) on truth card
- **Then:** Returns Result with beliefChange=+2
- **Test Type:** unit

### AC-7: Auto-Resolve Objection ← R6.4
- **Given:** ModeConfig with playerChoosesObjection=false, truth card challenged
- **When:** autoResolveObjection(state, card, config) called
- **Then:** Returns 'stood_by' (optimal choice for truth), beliefChange=+2
- **Test Type:** unit

### AC-7b: Auto-Resolve Objection Lie ← R6.4
- **Given:** ModeConfig with playerChoosesObjection=false, lie card challenged
- **When:** autoResolveObjection(state, card, config) called
- **Then:** Returns 'withdrawn' (optimal choice for lie), beliefChange=-2
- **Test Type:** unit

### AC-8: getVerdict ← R2.1
- **Given:** Final GameState with belief=65, target=60
- **When:** getVerdict(state, puzzle, config) called
- **Then:** Returns tier='FLAWLESS' (belief >= target + 5)
- **Test Type:** unit

### Edge Cases

#### EC-1: Invalid Card ID
- **Scenario:** playCard with cardId not in hand
- **Expected:** Returns Result with error

#### EC-2: Game Already Over
- **Scenario:** playCard when turnsPlayed >= turnsPerGame
- **Expected:** Returns Result with error

---

## Scope

### In Scope
- `createGameState(puzzle, config): GameState`
- `playCard(state, cardId, config, seed): Result<TurnOutput, EngineError>`
- `resolveObjection(state, choice, config): Result<TurnOutput, EngineError>`
- `shouldProcessObjection(turnsPlayed, config): boolean`
- `getVerdict(state, puzzle, config): VerdictData`
- `isGameOver(state, config): boolean`

### Out of Scope
- Presentation/display logic (Task 003)
- Dialogue selection (Task 005)
- CLI integration (Task 006)

---

## Implementation Hints

Create `scripts/v5-engine/engine.ts`:
```typescript
import { scoreCard, checkTypeTax, getTier, resolveObjection as resolveObjRules } from '../v5-rules.js';
import type { Result, GameState, GameConfig, Card, V5Puzzle } from './types.js';

export interface TurnOutput {
  state: GameState;
  beliefChange: number;
  wasLie: boolean;
  typeTaxApplied: boolean;
  card: Card;
}

export function playCard(
  state: GameState,
  cardId: string,
  config: GameConfig,
  seed: number
): Result<TurnOutput, EngineError> {
  // Validate card in hand
  // Calculate scoring using v5-rules
  // Return new state (immutable)
}
```

Reuse existing `v5-rules.ts` functions - don't duplicate scoring logic.

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Functions are pure (no side effects)
- [ ] Uses Result type for errors
- [ ] Reuses v5-rules.ts functions
- [ ] No `any` types
- [ ] Self-review completed

---

## Log

### Planning Notes
> Written by Planner

**Context:** Core logic extraction - most important task for engine quality.
**Decisions:** Reuse v5-rules.ts rather than duplicate scoring logic.
**Questions for Implementer:** Consider if state should be fully immutable or use copy-on-write.

### Implementation Notes
> Written by Implementer

**Files created:**
- `scripts/v5-engine/engine.ts` - Pure engine functions
- `scripts/v5-engine/engine.test.ts` - Unit tests

**Test count:** 18 tests (11 AC + 2 EC)
- AC-1: 2 tests (createGameState)
- AC-2: 2 tests (playCard pure function, immutability)
- AC-3: 1 test (truth scoring)
- AC-4: 1 test (lie scoring)
- AC-5: 1 test (type tax)
- AC-6: 3 tests (resolveObjection)
- AC-7: 1 test (autoResolveObjection truth)
- AC-7b: 1 test (autoResolveObjection lie)
- AC-8: 4 tests (getVerdict tiers)
- EC-1: 1 test (invalid card ID)
- EC-2: 1 test (game already over)

**Design decisions:**
- All functions pure (no side effects)
- Immutable state updates (spread operators)
- Reuses existing v5-rules.ts scoring logic
- Result type for error handling

### Review Notes
> Written by Reviewer

### Change Log
- 2026-01-28 Planner: Task created, blocked by 001

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
