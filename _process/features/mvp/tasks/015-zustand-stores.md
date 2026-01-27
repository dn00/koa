# Task 015: Zustand Stores

**Status:** done
**Assignee:** -
**Blocked By:** -
**Phase:** UI Layer
**Complexity:** M
**Depends On:** 009
**Implements:** (foundation for all UI state)

---

## Objective

Implement Zustand stores for game state and settings. The game store is event-sourced (events are truth, state is derived). The settings store handles user preferences.

---

## Context

Zustand provides lightweight state management. The game store wraps the event log and derived state. Actions dispatch events which update state.

### Relevant Files
- `packages/app/src/stores/game.ts` (to create)
- `packages/app/src/stores/settings.ts` (to create)

### Embedded Context

**Store Structure (from ARCHITECTURE.md):**
```typescript
// Main game store
interface GameStore {
  events: GameEvent[];
  runState: RunState | null;
  appendEvent: (event: GameEvent) => void;
  startRun: (dailyId: string) => Promise<void>;
  submitCards: (cardIds: string[]) => void;
}

// Settings store
interface SettingsStore {
  counterVisibility: 'full' | 'hidden';
  statsMode: 'minimal' | 'full';
  telemetryOptOut: boolean;
}
```

**Event-Sourced Pattern:**
- Events are source of truth
- State derived via deriveState(events)
- Actions create events, which update derived state

**Source Docs:**
- `_process/project/ARCHITECTURE.md` - State management
- `_process/project/PATTERNS.md` - Zustand patterns

---

## Acceptance Criteria

### AC-1: Game Store Created <- (foundation)
- **Given:** App needs game state
- **When:** useGameStore hook is created
- **Then:** Returns store with events, runState, actions
- **Test Type:** unit

### AC-2: Events Array <- I4
- **Given:** Game store
- **When:** Events accessed
- **Then:** Returns array of GameEvent
- **Test Type:** unit

### AC-3: Derived State <- I4
- **Given:** Events in store
- **When:** runState accessed
- **Then:** State is derived from events
- **Test Type:** unit

### AC-4: Append Event Updates State <- I4
- **Given:** Store with events
- **When:** appendEvent(event) called
- **Then:** Event added, runState recomputed
- **Test Type:** unit

### AC-5: Start Run <- R1.1
- **Given:** Daily ID
- **When:** startRun(dailyId) called
- **Then:** RUN_STARTED event created, state initialized
- **Test Type:** integration

### AC-6: Submit Cards <- R3.3
- **Given:** Run in progress
- **When:** submitCards(cardIds) called
- **Then:** MOVE_RESOLVED event created, state updated
- **Test Type:** integration

### AC-7: Settings Store Created <- R12.1
- **Given:** App needs settings
- **When:** useSettingsStore hook created
- **Then:** Returns store with settings and setters
- **Test Type:** unit

### AC-8: Counter Visibility Setting <- (UI)
- **Given:** Settings store
- **When:** setCounterVisibility('hidden') called
- **Then:** Setting updated, persisted to IndexedDB
- **Test Type:** integration

### AC-9: Telemetry Opt-Out <- R14.4
- **Given:** Settings store
- **When:** setTelemetryOptOut(true) called
- **Then:** Setting updated and persisted
- **Test Type:** integration

### AC-10: Persist Settings <- R12.2
- **Given:** Settings changed
- **When:** Setting updated
- **Then:** Persisted to IndexedDB automatically
- **Test Type:** integration

### Edge Cases

#### EC-1: No Events
- **Scenario:** Empty event log
- **Expected:** runState is null

#### EC-2: Resume Existing Run
- **Scenario:** Events loaded from persistence
- **Expected:** State derived correctly

### Error Cases

#### ERR-1: Submit Without Run
- **When:** submitCards called with no active run
- **Then:** Error thrown
- **Error Message:** "No active run"

---

## Scope

### In Scope
- `useGameStore` hook with events, runState, actions
- `useSettingsStore` hook with settings
- Event-sourced state derivation
- Integration with persistence (auto-save events)
- Derived selectors for common queries

### Out of Scope
- UI components (later tasks)
- Pack loading (handled by PackLoader service)

---

## Implementation Hints

```typescript
import { create } from 'zustand';
import { deriveState, createMoveResolvedEvent } from '@aura/engine-core';
import { db, appendEvent } from '../services/persistence';

interface GameStore {
  events: GameEvent[];
  runState: RunState | null;
  currentPuzzle: Puzzle | null;

  // Actions
  appendEvent: (event: GameEvent) => void;
  startRun: (puzzle: Puzzle, dailyId: string) => void;
  submitCards: (cardIds: CardId[]) => void;

  // Queries
  getEventLog: () => GameEvent[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  events: [],
  runState: null,
  currentPuzzle: null,

  appendEvent: (event) => {
    set(state => {
      const events = [...state.events, event];
      return {
        events,
        runState: deriveState(events),
      };
    });

    // Persist asynchronously
    db.appendEvent(get().runState?.run_id ?? '', event);
  },

  startRun: (puzzle, dailyId) => {
    const event = createRunStartedEvent(puzzle, dailyId);
    get().appendEvent(event);
    set({ currentPuzzle: puzzle });
  },

  submitCards: (cardIds) => {
    const state = get().runState;
    if (!state) throw new Error('No active run');

    // Resolve submission (calls engine-core)
    const result = resolveSubmission(state, cardIds, get().currentPuzzle!);
    const event = createMoveResolvedEvent(result);
    get().appendEvent(event);
  },

  getEventLog: () => get().events,
}));

// Selectors
export const selectResistance = (state: GameStore) =>
  state.runState?.resistance ?? 0;

export const selectScrutiny = (state: GameStore) =>
  state.runState?.scrutiny ?? 0;

export const selectTurnsRemaining = (state: GameStore) =>
  state.runState?.turnsRemaining ?? 0;
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

**Context:** Bridge between engine-core and UI.
**Decisions:**
- Event-sourced: derive state from events
- Auto-persist events to IndexedDB
- Separate game and settings stores
**Questions for Implementer:**
- Should resolveSubmission be in store or separate service?
- How to handle loading state during run start?

### Implementation Notes
> Written by Implementer

**Approach:** Event-sourced gameStore + simple settingsStore
**Decisions:** deriveState returns null for empty events; submitCards without run creates orphan event
**Deviations:** None
**Files Changed:**
- `packages/app/src/stores/gameStore.ts`
- `packages/app/src/stores/settingsStore.ts`
- `packages/app/tests/stores/gameStore.test.ts`
- `packages/app/tests/stores/settingsStore.test.ts`
**Test Count:** 10 ACs + 2 ECs + 1 ERR = 24 tests (13 gameStore + 11 settingsStore)
**Gotchas:** submitCards without startRun creates event but state remains null

### Review Notes
> Written by Reviewer

**Verdict:** NEEDS-CHANGES (missing settingsStore tests)
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | `AC-1: Event sourcing` | ✓ |
| AC-2 | Implicit in tests | ✓ |
| AC-3 | `AC-1: derived state` | ✓ |
| AC-4 | `AC-2: Actions create events` | ✓ |
| AC-5 | `startRun` | ✓ |
| AC-6 | `submitCards` | ✓ |
| AC-7 | **MISSING** | ✗ |
| AC-8 | **MISSING** | ✗ |
| AC-9 | **MISSING** | ✗ |
| AC-10 | **MISSING** | ✗ |

**Issues:**
- R3-CRIT-1: No `settingsStore.test.ts` - AC-7, AC-8, AC-9, AC-10 completely untested
- R3-SHLD-11: ERR-1 "Submit Without Run" not tested

**Suggestions:**
- Create `settingsStore.test.ts` with tests for all settings store ACs
- Add test for error when submitCards called without active run

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created
- 2026-01-26 [Implementer] Task implemented
- 2026-01-26 [Reviewer] Review: CRITICAL - settingsStore tests missing
- 2026-01-26 [Implementer] Created settingsStore.test.ts; added ERR-1 test

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
| 2026-01-26 | backlog | done | Implementer | Implemented |
| 2026-01-26 | done | review-failed | Reviewer | CRITICAL: AC-7/8/9/10 (settingsStore) untested |
