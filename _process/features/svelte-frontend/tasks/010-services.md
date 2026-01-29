# Task 010: Services (Persistence, Packs)

**Status:** backlog
**Assignee:** -
**Blocked By:** 002
**Phase:** Polish
**Complexity:** S
**Depends On:** 002
**Implements:** R8.1, R8.2

---

## Objective

Create service adapters for persistence (V5Event[] storage) and pack loading.

---

## Context

Services handle data persistence and pack loading. V5 uses event sourcing (I4), so we persist V5Event[] and derive state on load.

### Relevant Files
- `packages/engine-core/src/packs/` — Pack loading
- `_process/context/v5-design-context.md` — I4 event sourcing invariant

### Embedded Context

**Persistence Service (V5Event[]):**
```typescript
// persistence.ts
const STORAGE_KEY = 'hsh_v5_events';

export function saveEvents(events: V5Event[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function loadEvents(): V5Event[] | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function clearEvents(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

**Pack Loader Service:**
```typescript
// packLoader.ts
import { BUILTIN_PACK } from '@hsh/engine-core';

export async function loadPack(packId: string): Promise<V5Puzzle[]> {
  if (packId === 'builtin') {
    return BUILTIN_PACK.puzzles;
  }
  // Future: load custom packs
  throw new Error(`Unknown pack: ${packId}`);
}
```

---

## Acceptance Criteria

### AC-1: Save Events ← R8.1
- **Given:** Game in progress with events
- **When:** Events change
- **Then:** Events persisted to localStorage
- **Test Type:** unit

### AC-2: Load Events ← R8.1
- **Given:** Events in localStorage
- **When:** App initializes
- **Then:** Events restored, game state derived
- **Test Type:** unit

### AC-3: Clear Events ← R8.1
- **Given:** Events in localStorage
- **When:** Game reset called
- **Then:** Events cleared from storage
- **Test Type:** unit

### AC-4: Load Builtin Pack ← R8.2
- **Given:** Pack loader initialized
- **When:** Loading 'builtin' pack
- **Then:** Returns array of V5Puzzle from engine-core
- **Test Type:** unit

### Edge Cases

#### EC-1: Corrupted Storage
- **Scenario:** localStorage contains invalid JSON
- **Expected:** Returns null, starts fresh game

### Error Cases

#### ERR-1: Unknown Pack
- **Scenario:** loadPack('unknown') called
- **Expected:** Throws error with helpful message

---

## Scope

### In Scope
- Persistence service for V5Event[]
- Pack loader service
- localStorage wrapper with error handling

### Out of Scope
- Telemetry service (future)
- Custom pack loading (future)

---

## Implementation Hints

1. Auto-save on events change (store subscription)
2. Handle JSON parse errors gracefully
3. Use try/catch for localStorage (private browsing)

---

## Definition of Done

- [ ] Events save/load work
- [ ] Builtin pack loads
- [ ] Error handling for corrupted data
- [ ] All tests pass

---

## Log

### Change Log
- 2026-01-28 [Planner] Created for V5

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
