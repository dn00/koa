# Task 006: Run Screen

**Status:** backlog
**Assignee:** -
**Blocked By:** 004, 005
**Phase:** Gameplay
**Complexity:** M
**Depends On:** 004, 005
**Implements:** R3.2

---

## Objective

Create Run Screen that orchestrates V5 gameplay: 3 turns of card play followed by objection prompt.

---

## Context

Run Screen is the main gameplay screen. It shows the HUD, hand, and played cards. After turn 2, the objection prompt appears. Game ends after turn 3.

### Relevant Files
- `packages/engine-core/src/resolver/v5/` — V5 game logic
- `_process/v5-design/impo/koa-mini-spec.md` — Gameplay flow
- `_process/context/v5-design-context.md` — V5 invariants

### Embedded Context

**V5 Gameplay Flow:**
```
Turn 1: Play card → belief changes → KOA bark
Turn 2: Play card → belief changes → KOA bark → Objection prompt
Turn 3: Play card → belief changes → Game ends → Navigate to Result
```

**Run Screen Layout:**
```
┌─────────────────────────────────────────┐
│ [HUD: Turn 2/3]      [BeliefBar if Adv] │
├─────────────────────────────────────────┤
│              [KOA Avatar]               │
│                                         │
│        "That's interesting..."          │  ← Bark
│                                         │
├─────────────────────────────────────────┤
│           [Played Cards Area]           │
│   [Card 1 ✓]                            │
├─────────────────────────────────────────┤
│              [Hand Area]                │
│   [Card 2]   [Card 3]   [Card 4]        │
│                                         │
│           [ PLAY CARD ]                 │
└─────────────────────────────────────────┘
```

**State Transitions:**
```typescript
// After each card play:
if (turnsPlayed === 2) {
  // Show objection prompt (handled by Task 008)
}
if (turnsPlayed === 3) {
  // Game over, navigate to Result Screen
}
```

---

## Acceptance Criteria

### AC-1: Screen Layout ← R3.2
- **Given:** Game started
- **When:** Run Screen renders
- **Then:** Shows HUD, KOA, hand, played area
- **Test Type:** component

### AC-2: Card Play Flow ← R3.2
- **Given:** Card selected in hand
- **When:** Player confirms play
- **Then:** Card moves to played area, belief updates, turn increments
- **Test Type:** integration

### AC-3: Turn Progression ← R3.2
- **Given:** Turn 1 complete
- **When:** Turn 2 card played
- **Then:** TurnsDisplay shows "Turn 2/3"
- **Test Type:** integration

### AC-4: Objection Trigger ← R3.2
- **Given:** Turn 2 just completed
- **When:** Belief change settled
- **Then:** Objection prompt appears (or auto-resolves in Mini)
- **Test Type:** integration

### AC-5: Game End Navigation ← R3.2
- **Given:** Turn 3 complete
- **When:** All animations finish
- **Then:** Navigate to Result Screen
- **Test Type:** integration

### AC-6: Belief Updates ← R3.2
- **Given:** Card played
- **When:** Turn resolves
- **Then:** BeliefBar (if visible) shows new value
- **Test Type:** integration

### Edge Cases

#### EC-1: Quick Card Plays
- **Scenario:** Player plays cards rapidly
- **Expected:** Each play waits for previous to complete

#### EC-2: Page Refresh Mid-Game
- **Scenario:** Player refreshes during game
- **Expected:** Game state restored from events (I4)

### Error Cases

#### ERR-1: No Cards Left
- **Scenario:** Hand is empty before turn 3
- **Expected:** Should not happen (6 cards, 3 turns), but handle gracefully

---

## Scope

### In Scope
- Run Screen layout and state management
- Card play orchestration
- Turn progression logic
- Navigation to Result Screen
- Integration with HUD, Hand, Played area

### Out of Scope
- Objection UI (Task 008)
- Animations (Task 009)
- KOA Avatar moods (Task 012)

---

## Implementation Hints

1. Subscribe to gameStore for state
2. Use derived stores for computed values
3. Gate navigation on animation completion
4. Handle objection as overlay/modal

---

## Definition of Done

- [ ] Screen renders with all areas
- [ ] Card play works correctly
- [ ] Turns progress to 3
- [ ] Objection triggers after turn 2
- [ ] Navigates to Result after turn 3
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
