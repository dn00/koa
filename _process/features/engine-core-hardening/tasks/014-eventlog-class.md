# Task 014: EventLog Class

**Status:** ready
**Assignee:** -
**Blocked By:** -
**Phase:** Foundation Hardening
**Complexity:** M
**Depends On:** none
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5

---

## Objective

Implement an EventLog class that encapsulates the append-only event array with hash chain validation, matching the Python kernel's EventLog pattern.

---

## Context

Currently, events are managed as plain arrays (`GameEvent[]`). The Python kernel has an `EventLog` class that:
- Validates hash chain on append
- Tracks head_hash for chain linking
- Provides iteration and indexing
- Offers `recent_events()` for late-join scenarios

### Relevant Files
- `packages/engine-core/src/resolver/events.ts` - Current event system
- `docs/source-files/kernel/events.py` - Python EventLog reference (lines 181-250)

### Embedded Context

**Invariant I4 (Event-Sourced Truth):**
- Event log is canonical, state is derived
- Events are append-only, never modified
- Current state = replay all events from start

**Python reference pattern:**
```python
class EventLog:
    def __init__(self) -> None:
        self._events: list[Event] = []
        self._head_hash: str = ZERO_HASH

    def append(self, event: Event) -> None:
        if event.prev_event_hash != self._head_hash:
            raise ValueError(f"Chain broken: ...")
        self._events.append(event)
        self._head_hash = hash_event(event.to_bytes())

    @property
    def head_hash(self) -> str:
        return self._head_hash

    def recent_events(self, limit: int = 20) -> list[dict]:
        events = self._events[-limit:]
        return [{"event_id": e.event_id, ...} for e in events]
```

---

## Acceptance Criteria

### AC-1: EventLog Construction ← R2.1
- **Given:** No arguments
- **When:** `new EventLog()` is called
- **Then:** Creates empty log with head_hash = GENESIS_HASH
- **Test Type:** unit

### AC-2: Append Validates Chain ← R2.2
- **Given:** EventLog with head_hash H
- **When:** `log.append(event)` where event.prevEventHash !== H
- **Then:** Throws Error with message containing "Chain broken"
- **Test Type:** unit

### AC-3: Append Updates Head Hash ← R2.3
- **Given:** EventLog with head_hash H1
- **When:** `log.append(event)` with valid prevEventHash
- **Then:** log.headHash equals hash of appended event
- **Test Type:** unit

### AC-4: Iterable ← R2.4
- **Given:** EventLog with 3 events
- **When:** `for (const event of log)`
- **Then:** Iterates all 3 events in order
- **Test Type:** unit

### AC-5: Indexable ← R2.4
- **Given:** EventLog with events [e0, e1, e2]
- **When:** `log.at(1)` or `log[1]`
- **Then:** Returns e1
- **Test Type:** unit

### AC-6: Length Property ← R2.4
- **Given:** EventLog with 5 events
- **When:** `log.length`
- **Then:** Returns 5
- **Test Type:** unit

### AC-7: recentEvents Returns Simplified Objects ← R2.5
- **Given:** EventLog with 30 events
- **When:** `log.recentEvents(20)`
- **Then:** Returns last 20 events as simplified objects with: eventHash, type, (payload summary)
- **Test Type:** unit

### AC-8: recentEvents Default Limit ← R2.5
- **Given:** EventLog with 50 events
- **When:** `log.recentEvents()` (no argument)
- **Then:** Returns last 20 events
- **Test Type:** unit

### AC-9: Integration with deriveState
- **Given:** EventLog with valid event sequence
- **When:** `deriveState(log.toArray())`
- **Then:** Returns valid RunState
- **Test Type:** integration

### Edge Cases

#### EC-1: Empty Log Iteration
- **Scenario:** Iterate empty EventLog
- **Expected:** No iterations, no error

#### EC-2: recentEvents on Small Log
- **Scenario:** recentEvents(20) on log with 5 events
- **Expected:** Returns all 5 events

#### EC-3: Out of Bounds Index
- **Scenario:** `log.at(100)` on log with 10 events
- **Expected:** Returns undefined (not throw)

### Error Cases

#### ERR-1: Chain Validation Failure
- **When:** Append event with wrong prevEventHash
- **Then:** Throws Error
- **Error Message:** Pattern: `Chain broken: event.prevEventHash=X !== headHash=Y`

#### ERR-2: Append After Seal (future)
- **When:** (Reserved for future: sealed/finalized logs)
- **Then:** N/A for this task

---

## Scope

### In Scope
- `EventLog` class with constructor
- `append(event)` method with validation
- `headHash` getter property
- `length` getter property
- `at(index)` method
- `[Symbol.iterator]()` for iteration
- `recentEvents(limit?)` method
- `toArray()` method for compatibility
- Export from resolver/index.ts

### Out of Scope
- Persistence/serialization
- Event removal or modification
- Sealed/finalized state
- Async operations

---

## Implementation Hints

**TypeScript class structure:**
```typescript
export class EventLog implements Iterable<GameEvent> {
  private readonly _events: GameEvent[] = [];
  private _headHash: string = GENESIS_HASH;

  get headHash(): string {
    return this._headHash;
  }

  get length(): number {
    return this._events.length;
  }

  append(event: GameEvent): void {
    if (event.prevEventHash !== this._headHash) {
      throw new Error(
        `Chain broken: event.prevEventHash=${event.prevEventHash} !== headHash=${this._headHash}`
      );
    }
    this._events.push(event);
    this._headHash = event.eventHash;
  }

  at(index: number): GameEvent | undefined {
    return this._events[index];
  }

  [Symbol.iterator](): Iterator<GameEvent> {
    return this._events[Symbol.iterator]();
  }

  toArray(): readonly GameEvent[] {
    return [...this._events];
  }

  recentEvents(limit: number = 20): readonly SimplifiedEvent[] {
    const events = this._events.slice(-limit);
    return events.map(e => ({
      eventHash: e.eventHash,
      type: e.type,
    }));
  }
}
```

**Note:** The event's `eventHash` is already computed when the event is created. We use that directly rather than recomputing.

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

**Context:** Python kernel has EventLog class for managing event chains. Current TypeScript implementation uses plain arrays, losing the encapsulation and validation benefits.

**Decisions:**
- Class-based approach matches Python pattern
- Keep immutable-friendly (toArray returns copy)
- Use event.eventHash directly (already computed)

**Questions for Implementer:**
- Consider if we need `fromArray()` static method for rehydration
- The SimplifiedEvent type for recentEvents needs definition

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-26 21:30 [Planner] Task created from audit recommendations

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | ready | Planner | Created, no dependencies |
