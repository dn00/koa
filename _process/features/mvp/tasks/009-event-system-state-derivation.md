# Task 009: Event System and State Derivation

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Engine
**Complexity:** M
**Depends On:** 002
**Implements:** R4.5, R5.5, R9.1, R9.2 (foundation for all state tracking)

---

## Objective

Implement the event-sourced state model: define GameEvent types, create the event reducer, and build state derivation from event log. This is the authoritative source of game state.

---

## Context

The game uses event sourcing (Invariant I4). All state changes are represented as events. Current state is derived by replaying events. This ensures determinism, debuggability, and resume capability.

### Relevant Files
- `packages/engine-core/src/types/events.ts` (to create)
- `packages/engine-core/src/resolver/state.ts` (to create)
- Reference: `docs/source-files/kernel/events.py`, `state.py`

### Embedded Context

**Event-Sourced Truth (Invariant I4):**
- Event log is canonical
- State is derived by replaying events
- Events are append-only, never modified

**GameEvent Types (from D04A, D31):**
```typescript
type GameEvent =
  | { type: 'RUN_STARTED'; payload: RunStartedPayload }
  | { type: 'MOVE_RESOLVED'; payload: MoveResolvedPayload }
  | { type: 'RUN_ENDED'; payload: RunEndedPayload };
```

**State Derivation Pattern:**
```typescript
function deriveState(events: GameEvent[]): RunState {
  return events.reduce(applyEvent, initialState);
}
```

**Source Docs:**
- `docs/D04A-GAME-STATE-EVENT-MODEL.md` - Event types
- `docs/source-files/kernel/events.py` - Python reference
- `_process/project/PATTERNS.md` - Discriminated unions

---

## Acceptance Criteria

### AC-1: RUN_STARTED Event <- R1.1
- **Given:** Puzzle loaded
- **When:** Run starts
- **Then:** RUN_STARTED event created with puzzle, hand, initial state
- **Test Type:** unit

### AC-2: MOVE_RESOLVED Event <- R5.5
- **Given:** Player submits cards
- **When:** Submission resolves
- **Then:** MOVE_RESOLVED event created with cards, damage, concerns, contradictions, counters
- **Test Type:** unit

### AC-3: RUN_ENDED Event <- R4.5
- **Given:** Win/loss condition met
- **When:** Run ends
- **Then:** RUN_ENDED event created with result (WIN/LOSS), reason, final state
- **Test Type:** unit

### AC-4: Initial State <- R9.2
- **Given:** RUN_STARTED event
- **When:** deriveState([runStarted]) is called
- **Then:** Returns RunState with resistance = puzzle.resistance, scrutiny = 0, turnsRemaining = puzzle.turns
- **Test Type:** unit

### AC-5: State After Move <- R3.4
- **Given:** RUN_STARTED + MOVE_RESOLVED events
- **When:** deriveState(events) is called
- **Then:** Returns updated RunState with new resistance, concerns, turnsRemaining - 1
- **Test Type:** unit

### AC-6: Win Condition Check <- R4.5
- **Given:** Resistance ≤ 0 AND all concerns addressed
- **When:** checkWinCondition(state) is called
- **Then:** Returns true
- **Test Type:** unit

### AC-7: Loss Condition Check <- R9.4
- **Given:** Scrutiny = 5 OR turnsRemaining = 0 (with resistance > 0)
- **When:** checkLossCondition(state) is called
- **Then:** Returns true with reason
- **Test Type:** unit

### AC-8: Event Hash Chain <- I4
- **Given:** Event log with multiple events
- **When:** Events created
- **Then:** Each event has prev_event_hash linking to previous
- **Test Type:** unit

### AC-9: State Snapshot Hash <- I1
- **Given:** RunState
- **When:** computeStateHash(state) is called
- **Then:** Returns deterministic hash (same state = same hash)
- **Test Type:** unit

### Edge Cases

#### EC-1: Empty Event Log
- **Scenario:** deriveState([])
- **Expected:** Returns null or initial empty state

#### EC-2: Replay Produces Same State
- **Scenario:** Same events replayed twice
- **Expected:** Identical state (determinism check)

### Error Cases

#### ERR-1: Unknown Event Type
- **When:** Event with invalid type
- **Then:** Throw error
- **Error Message:** "Unknown event type: {type}"

---

## Scope

### In Scope
- Event type definitions (discriminated union)
- `createRunStartedEvent(puzzle, dailyId, seed): RUN_STARTED`
- `createMoveResolvedEvent(submission, result): MOVE_RESOLVED`
- `createRunEndedEvent(result, reason): RUN_ENDED`
- `deriveState(events: GameEvent[]): RunState`
- `applyEvent(state: RunState, event: GameEvent): RunState`
- `checkWinCondition(state): boolean`
- `checkLossCondition(state): { lost: boolean; reason?: string }`
- `computeStateHash(state): string`
- Event hash chain

### Out of Scope
- Persistence (Task 013)
- Zustand integration (Task 015)
- Telemetry events (Task 029)

---

## Implementation Hints

```typescript
// events.ts
interface BaseEvent {
  event_id: string;
  event_type: string;
  tick_id: number;
  timestamp: number;
  prev_event_hash: string;
}

interface RunStartedPayload {
  puzzle: Puzzle;
  dealtHand: CardId[];
  dailyId: string;
  seed: string;
}

interface MoveResolvedPayload {
  submission: Submission;
  cardsUsed: EvidenceCard[];
  damageDealt: number;
  resistanceRemaining: number;
  concernsAddressed: ConcernId[];
  contradictionSeverity: ContradictionSeverity;
  countersRefuted: CounterId[];
  scrutinyAfter: number;
}

// state.ts
function applyEvent(state: RunState | null, event: GameEvent): RunState {
  switch (event.type) {
    case 'RUN_STARTED':
      return initializeState(event.payload);
    case 'MOVE_RESOLVED':
      return applyMoveResolved(state!, event.payload);
    case 'RUN_ENDED':
      return { ...state!, ended: true, result: event.payload.result };
    default:
      throw new Error(`Unknown event type: ${event.type}`);
  }
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

**Context:** Foundation for entire state management. Must be solid.
**Decisions:**
- Use discriminated union for events
- State is always derived, never mutated
- Hash chain for integrity
**Questions for Implementer:**
- Should event_id be UUID or incrementing?
- Canonical JSON library preference?

### Implementation Notes
> Written by Implementer

**Approach:** Added event hash chain and computeStateHash per AC-8 and AC-9
**Decisions:**
- Used djb2 hash algorithm for simplicity and determinism
- Event hash includes type, payload, and prev hash
- State hash includes puzzle ID, resistance, scrutiny, turns, concerns, committed story IDs
- Sorted keys recursively for canonical JSON
**Deviations:** None
**Files Changed:**
- `packages/engine-core/src/resolver/events.ts`
- `packages/engine-core/src/resolver/index.ts` (exports)
- `packages/engine-core/tests/resolver/events.test.ts`
**Test Count:** 9 ACs + 2 ECs + 1 ERR = 28 tests
**Gotchas:** Hash chain validation not enforced in deriveState (just computed)

### Review Notes
> Written by Reviewer

**Verdict:** PASS
**Date:** 2026-01-26 (Re-review after fixes)

**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | RUN_STARTED Event | ✓ |
| AC-2 | CARDS_SUBMITTED Event | ✓ |
| AC-3 | RUN_ENDED Event | ✓ |
| AC-4 | Initial State | ✓ |
| AC-5 | State After Move | ✓ |
| AC-6 | Win Condition Check | ✓ |
| AC-7 | Loss Condition Check | ✓ |
| AC-8 | Event Hash Chain | ✓ |
| AC-9 | State Snapshot Hash | ✓ |
| EC-1 | Empty Event Log | ✓ |
| EC-2 | Replay Produces Same State | ✓ |
| ERR-1 | Invalid Event Sequence | ✓ |

**Fixes Applied:**
- Event hash chain implemented (eventHash, prevEventHash fields)
- `computeStateHash()` implemented using djb2 hash
- Canonical JSON with sorted keys for determinism
- 28 tests passing

**What's Good:**
- Clean discriminated union pattern for events
- Integer-only djb2 hash per Invariant I1
- Proper exhaustiveness checking
- All win/loss conditions handled correctly

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
