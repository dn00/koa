# Task 002: Svelte Stores

**Status:** ready
**Assignee:** -
**Blocked By:** -
**Phase:** Foundation
**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4

---

## Objective

Create Svelte stores for game state (event sourcing), feel state (animation queue), and settings (user preferences).

---

## Context

Replacing Zustand with native Svelte stores. Must maintain event sourcing pattern from engine-core.

### Relevant Files
- `packages/engine-core/src/types/` — Game types
- `packages/app/src/stores/` — Reference Zustand implementation

### Embedded Context

**Event Sourcing Pattern:**
```typescript
// Events are truth, state is derived
const events = writable<GameEvent[]>([]);
const runState = derived(events, ($events) => deriveState($events));
```

**Store Structure:**
```typescript
// gameStore.ts
export const events = writable<GameEvent[]>([]);
export const runState = derived(events, deriveState);
export function submitCards(cards: EvidenceCard[], damage: number): void;
export function reset(): void;

// feelStore.ts
export const feelState = writable<FeelState>({
  pendingAnimations: [],
  reducedMotion: false,
  isBackgrounded: false
});

// settingsStore.ts
export const settings = writable<Settings>({
  counterVisibility: 'FULL',
  statsMode: 'minimal',
  hapticsEnabled: true,
  soundEnabled: true
});
```

**D28 Counter Visibility Modes:**
- `FULL` — All counters visible from start
- `HIDDEN` — Counters revealed when triggered

---

## Acceptance Criteria

### AC-1: Game Store Events ← R2.1
- **Given:** Empty events array
- **When:** Calling `submitCards()`
- **Then:** Event appended, runState derived
- **Test Type:** unit

### AC-2: Derived State ← R2.1
- **Given:** Events array with game events
- **When:** Subscribing to runState
- **Then:** State correctly derived via engine-core
- **Test Type:** unit

### AC-3: Feel Store ← R2.2
- **Given:** Feel store initialized
- **When:** Animation completes
- **Then:** Can queue/dequeue pending animations
- **Test Type:** unit

### AC-4: Settings Store ← R2.3
- **Given:** Settings store
- **When:** Changing counterVisibility
- **Then:** Value persists, subscribers notified
- **Test Type:** unit

### AC-5: Settings Persistence ← R2.3
- **Given:** Settings changed
- **When:** Page reload
- **Then:** Settings restored from localStorage
- **Test Type:** integration

### AC-6: Store Triggers Animations ← R2.4
- **Given:** Component subscribed to runState
- **When:** State changes (e.g., resistance decreases)
- **Then:** Feel store receives animation request
- **Test Type:** integration

### Edge Cases

#### EC-1: Empty State
- **Scenario:** No events yet
- **Expected:** runState is null/undefined, UI handles gracefully

#### EC-2: Reduced Motion
- **Scenario:** prefers-reduced-motion media query matches
- **Expected:** feelStore.reducedMotion = true on init

---

## Scope

### In Scope
- gameStore with event sourcing
- feelStore for animation state
- settingsStore with localStorage persistence
- Derived state from engine-core

### Out of Scope
- Actual animations (Task 016)
- UI components

---

## Implementation Hints

1. Use `derived()` for runState from events
2. `localStorage` wrapper for settings persistence
3. Check `window.matchMedia('(prefers-reduced-motion: reduce)')` on init
4. Page Visibility API for isBackgrounded

---

## Definition of Done

- [ ] Game store with event sourcing
- [ ] Feel store for animation queue
- [ ] Settings store with persistence
- [ ] All tests pass
- [ ] Types correct (no `any`)

---

## Log

### Planning Notes
**Context:** Core state management enabling reactive UI.
**Decisions:** Native Svelte stores over external library.

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | ready | Planner | Created |
