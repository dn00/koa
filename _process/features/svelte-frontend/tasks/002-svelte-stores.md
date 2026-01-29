# Task 002: Svelte Stores (V5 Event Sourcing)

**Status:** backlog
**Assignee:** -
**Blocked By:** 001
**Phase:** Foundation
**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4

---

## Objective

Create Svelte stores for V5 game state (event sourcing), mode toggle (Mini/Advanced), and settings.

---

## Context

V5 uses event sourcing (I4 invariant). The game store holds V5Event[], and GameState is derived reactively using deriveV5State().

### Relevant Files
- `packages/engine-core/src/types/v5/` — V5 types (Card, GameState, V5Puzzle)
- `packages/engine-core/src/resolver/v5/` — V5 resolver functions
- `_process/context/v5-design-context.md` — V5 invariants (I4 event sourcing)
- `_process/v5-design/impo/koa-mini-spec.md` — Mini vs Advanced modes

### Embedded Context

**V5 Event Types (I4 Invariant):**
```typescript
export type V5Event =
  | { type: 'GAME_STARTED'; puzzleSlug: string; seed: number }
  | { type: 'CARD_PLAYED'; cardId: CardId }
  | { type: 'OBJECTION_RESOLVED'; choice: 'stood_by' | 'withdrawn' };
```

**Store Architecture:**
```typescript
// gameStore.ts
export const events = writable<V5Event[]>([]);
export const gameState = derived(events, deriveV5State);

// Actions
export function startGame(puzzle: V5Puzzle, seed: number): void;
export function playCard(cardId: CardId): void;
export function resolveObjection(choice: 'stood_by' | 'withdrawn'): void;
export function reset(): void;
```

**Mode Store (Mini vs Advanced):**
```typescript
// modeStore.ts
export type GameMode = 'mini' | 'advanced';
export const mode = writable<GameMode>('mini'); // Mini is default

// Mini: no numbers, auto objection
// Advanced: belief bar visible, player chooses objection
```

**Settings Store:**
```typescript
// settingsStore.ts
export const settings = writable<Settings>({
  hapticsEnabled: true,
  soundEnabled: true
});
```

---

## Acceptance Criteria

### AC-1: V5 Event Store ← R2.1
- **Given:** Empty events array
- **When:** Calling `startGame()` then `playCard()`
- **Then:** Events appended correctly, no mutation of previous events
- **Test Type:** unit

### AC-2: Derived GameState ← R2.1
- **Given:** Events array with V5 events
- **When:** Subscribing to gameState
- **Then:** GameState correctly derived (belief, hand, played, turnsPlayed)
- **Test Type:** unit

### AC-3: Mode Store ← R2.3
- **Given:** Mode store initialized
- **When:** Toggling between 'mini' and 'advanced'
- **Then:** Mode persists, UI can react to mode changes
- **Test Type:** unit

### AC-4: Settings Store ← R2.4
- **Given:** Settings store
- **When:** Changing hapticsEnabled
- **Then:** Value persists, subscribers notified
- **Test Type:** unit

### AC-5: Settings Persistence ← R2.4
- **Given:** Settings changed
- **When:** Page reload
- **Then:** Settings restored from localStorage
- **Test Type:** integration

### AC-6: Reset Clears Events ← R2.1
- **Given:** Events array has game history
- **When:** Calling reset()
- **Then:** Events array is empty, gameState is null
- **Test Type:** unit

### Edge Cases

#### EC-1: Empty State
- **Scenario:** No events yet
- **Expected:** gameState is null, UI handles gracefully

#### EC-2: Reduced Motion
- **Scenario:** prefers-reduced-motion media query matches
- **Expected:** Settings include reducedMotion: true on init

### Error Cases

#### ERR-1: Invalid Card Play
- **Scenario:** playCard() called with cardId not in hand
- **Expected:** Throws error, events unchanged

---

## Scope

### In Scope
- gameStore with V5 event sourcing
- modeStore for Mini/Advanced toggle
- settingsStore with localStorage persistence
- deriveV5State() integration with engine-core

### Out of Scope
- Feel system / animation queue (moved to 009)
- UI components

---

## Implementation Hints

1. Use `derived()` for gameState from events
2. `localStorage` wrapper for settings/mode persistence
3. Check `window.matchMedia('(prefers-reduced-motion: reduce)')` on init
4. Import V5 resolver from engine-core

---

## Definition of Done

- [ ] Game store with V5 event sourcing
- [ ] Mode store (mini/advanced)
- [ ] Settings store with persistence
- [ ] All tests pass
- [ ] Types correct (no `any`)

---

## Log

### Change Log
- 2026-01-28 [Planner] Rewritten for V5 (V5Event, mode store)
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | ready | backlog | Planner | Rewritten for V5 |
| 2026-01-26 | - | ready | Planner | Created |
