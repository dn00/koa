# Task 002: Migrate Game Store

**Status:** backlog
**Assignee:** -
**Blocked By:** 001
**Phase:** Phase 1: Type Compilation
**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5, R2.6, R2.7, R2.8, R7.5

---

## Objective

Rewrite `gameStore.ts` to use V5 event sourcing: thin event wrappers around V5 pure functions. This preserves I4 (event-sourced truth) while leveraging V5's deterministic engine.

---

## Context

**Why event sourcing for V5?**
- Future coop mode needs events for state sync between players
- Future multi-act runs need events for resume, replay, recap
- I4 invariant requires "event log is canonical, state is derived"

**Architecture:**
```
V5Event[] ──→ deriveV5State() ──→ GameState
                    │
                    ▼
            V5 pure functions
            (createGameState, playCard, etc.)
```

Events are thin (just card IDs, choices). V5 engine does all the game logic.

### Relevant Files
- `packages/app/src/stores/gameStore.ts` - THE file to rewrite
- `packages/engine-core/src/resolver/v5/engine.ts` - V5 functions to call
- `packages/engine-core/src/types/v5/state.ts` - GameState type

### Embedded Context

**V5Event Types (to define in store or types file):**
```typescript
type V5Event =
  | {
      type: 'GAME_STARTED';
      puzzleSlug: string;
      seed: number;
      configKey: 'default' | 'easy' | 'hard';
      timestamp: number;
    }
  | {
      type: 'CARD_PLAYED';
      cardId: string;
      timestamp: number;
    }
  | {
      type: 'OBJECTION_RESOLVED';
      choice: 'stood_by' | 'withdrawn';
      timestamp: number;
    };
```

**Derive function pattern:**
```typescript
function deriveV5State(
  events: readonly V5Event[],
  puzzles: Map<string, V5Puzzle>
): GameState | null {
  if (events.length === 0) return null;

  const startEvent = events[0];
  if (startEvent.type !== 'GAME_STARTED') return null;

  const puzzle = puzzles.get(startEvent.puzzleSlug);
  if (!puzzle) return null;

  const config = getConfig(startEvent.configKey);
  let state = createGameState(puzzle, config);
  let seedCounter = 0;

  for (const event of events.slice(1)) {
    const seed = startEvent.seed + (++seedCounter);

    switch (event.type) {
      case 'CARD_PLAYED': {
        const result = playCard(state, event.cardId, config, seed);
        if (result.ok) state = result.value.state;
        break;
      }
      case 'OBJECTION_RESOLVED': {
        const result = resolveObjectionState(state, event.choice, config);
        if (result.ok) state = result.value.state;
        break;
      }
    }
  }

  return state;
}
```

**V5 Engine Functions:**
```typescript
function createGameState(puzzle: V5Puzzle, config: GameConfig): GameState
function playCard(state, cardId, config, seed): Result<TurnOutput, EngineError>
function resolveObjectionState(state, choice, config): Result<ObjectionOutput, EngineError>
function isGameOver(state, config): boolean
function getVerdict(state, puzzle, config): VerdictData
```

---

## Acceptance Criteria

### AC-1: Store holds V5Event[] as source of truth ← R2.1
- **Given:** The rewritten store
- **When:** Store interface examined
- **Then:** Has `events: V5Event[]` (not GameState as primary)
- **Test Type:** unit

### AC-2: GameState derived from events ← R2.2
- **Given:** Store with 3 events (start + 2 plays)
- **When:** `gameState` accessed
- **Then:** State reflects replay of all events
- **Test Type:** unit

### AC-3: startGame appends GAME_STARTED event ← R2.3
- **Given:** Empty store
- **When:** `startGame(puzzle, config, seed)` called
- **Then:** `events[0]` is GAME_STARTED with puzzleSlug, seed, timestamp
- **Test Type:** unit

### AC-4: playCard appends CARD_PLAYED event ← R2.4
- **Given:** Active game (1 event)
- **When:** `playCard('browser_history')` called
- **Then:** CARD_PLAYED event appended; state re-derived
- **Test Type:** unit

### AC-5: resolveObjection appends event ← R2.5
- **Given:** Game after turn 2 with objection pending
- **When:** `resolveObjection('stood_by')` called
- **Then:** OBJECTION_RESOLVED event appended; state re-derived
- **Test Type:** unit

### AC-6: getVerdict returns verdict data ← R2.6
- **Given:** Completed game (3 CARD_PLAYED events)
- **When:** `getVerdict()` called
- **Then:** Returns VerdictData from engine
- **Test Type:** unit

### AC-7: deriveV5State is deterministic ← R2.7
- **Given:** Same events array
- **When:** `deriveV5State()` called twice
- **Then:** Returns identical GameState
- **Test Type:** unit

### AC-8: V5Event type exported ← R2.8
- **Given:** Store module
- **When:** Types examined
- **Then:** `V5Event` type is exported for persistence layer
- **Test Type:** unit (type check)

### Edge Cases (REQUIRE TESTS)

#### EC-1: Derive with empty events
- **Scenario:** `deriveV5State([])` called
- **Expected:** Returns null
- **Test Type:** unit

#### EC-2: Derive with only GAME_STARTED (no plays yet)
- **Scenario:** Events = [GAME_STARTED]
- **Expected:** Returns initial GameState with full hand
- **Test Type:** unit

#### EC-3: Reset clears events
- **Scenario:** `reset()` called during active game
- **Expected:** `events = []`, `gameState = null`
- **Test Type:** unit

### Error Cases (REQUIRE TESTS)

#### ERR-1: playCard with invalid cardId
- **When:** `playCard('nonexistent')` called
- **Then:** Event NOT appended; returns error
- **Error Message:** Contains "not found in hand"
- **Test Type:** unit

#### ERR-2: playCard when game over
- **When:** `playCard()` called after 3 turns
- **Then:** Event NOT appended; returns error
- **Error Message:** Contains "Game is over"
- **Test Type:** unit

---

## Scope

### In Scope
- Define V5Event discriminated union type
- Implement `deriveV5State(events, puzzles)` function
- Rewrite store to append events and derive state
- Remove old MVP event types and deriveState
- Export V5Event type for persistence

### Out of Scope
- Persistence integration (Task 006 uses V5Event)
- UI updates (Task 004)
- Puzzle loading (use BUILTIN_PACK for now)

---

## Implementation Hints

**Store Interface:**
```typescript
interface GameStore {
  // Source of truth (I4)
  events: readonly V5Event[];

  // Derived (cached for performance)
  gameState: GameState | null;

  // Context needed for derivation
  currentPuzzle: V5Puzzle | null;
  currentConfig: GameConfig;

  // Actions (append event, then re-derive)
  startGame: (puzzleSlug: string, config?: GameConfig) => void;
  playCard: (cardId: string) => Result<TurnOutput, EngineError>;
  resolveObjection: (choice: 'stood_by' | 'withdrawn') => Result<ObjectionOutput, EngineError>;

  // Queries
  getVerdict: () => VerdictData | null;
  isGameOver: () => boolean;
  shouldShowObjection: () => boolean;

  // Lifecycle
  reset: () => void;
  loadEvents: (events: V5Event[]) => void;  // For persistence restore
}
```

**Seed Strategy:**
- Store initial seed in GAME_STARTED event
- Derive per-action seeds: `startEvent.seed + actionIndex`
- This ensures replay produces identical results

**Performance:**
- Cache derived `gameState` in store
- Only re-derive when `events` changes
- For 3-turn game, derivation is <1ms (not a concern)

**Puzzle Access:**
- For now, use `BUILTIN_PACK.puzzles` to find puzzle by slug
- Future: inject puzzle loader

---

## Definition of Done

- [ ] V5Event type defined and exported
- [ ] deriveV5State function implemented
- [ ] Store uses events as source of truth
- [ ] All acceptance criteria have passing tests
- [ ] Old MVP event code removed
- [ ] No `any` types
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** This preserves I4 invariant while using V5 engine. Critical for future coop/multi-act features.
**Decisions:**
- Events are thin (IDs, choices, timestamps)
- V5 engine functions do all game logic
- Seed stored in GAME_STARTED, derived seeds for actions
**Questions for Implementer:**
- Consider extracting V5Event type to separate file for reuse
- Ensure deriveV5State handles all event types, even future ones (default case)

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-28 20:35 [Planner] Task created
- 2026-01-28 21:00 [Planner] Updated to include event sourcing wrapper for coop/multi-act support

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
| 2026-01-28 | backlog | backlog | Planner | Scope expanded for event sourcing |
