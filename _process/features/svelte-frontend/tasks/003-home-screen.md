# Task 003: Home Screen

**Status:** backlog
**Assignee:** -
**Blocked By:** 002
**Phase:** Components
**Complexity:** S
**Depends On:** 002
**Implements:** R3.1

---

## Objective

Create Home Screen component with puzzle selection and game start functionality.

---

## Context

Entry point for the V5 game. Player selects a puzzle and starts a new game. The mode (Mini/Advanced) can be toggled from here.

### Relevant Files
- `packages/engine-core/src/types/v5/puzzle.ts` — V5Puzzle type
- `_process/v5-design/impo/koa-mini-spec.md` — Mini mode is default

### Embedded Context

**Home Screen Layout:**
```
┌─────────────────────────────┐
│         KOA AVATAR          │
│        (neutral mood)       │
├─────────────────────────────┤
│     Select Your Puzzle      │
│  ┌─────────────────────┐    │
│  │  Puzzle 1: Title    │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  Puzzle 2: Title    │    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│   [Mode Toggle: Mini/Adv]   │
│                             │
│      [ START GAME ]         │
└─────────────────────────────┘
```

**V5Puzzle Type:**
```typescript
interface V5Puzzle {
  slug: string;
  title: string;
  cards: Card[];
  target: number;  // Belief target to win
  config: GameConfig;
}
```

---

## Acceptance Criteria

### AC-1: Puzzle List ← R3.1
- **Given:** Pack loaded with puzzles
- **When:** Home Screen renders
- **Then:** All puzzles displayed in selectable list
- **Test Type:** component

### AC-2: Puzzle Selection ← R3.1
- **Given:** Puzzle list displayed
- **When:** Player taps a puzzle
- **Then:** Puzzle is selected, visually highlighted
- **Test Type:** component

### AC-3: Start Game ← R3.1
- **Given:** Puzzle selected
- **When:** Player taps "Start Game"
- **Then:** Game starts with selected puzzle, navigates to Run Screen
- **Test Type:** integration

### Edge Cases

#### EC-1: No Puzzles
- **Scenario:** Pack is empty
- **Expected:** Shows "No puzzles available" message

---

## Scope

### In Scope
- Puzzle selector component
- Mode toggle (Mini/Advanced)
- Start game button
- Navigation to Run Screen

### Out of Scope
- Pack loading (Task 010)
- KOA Avatar display (Task 012)

---

## Implementation Hints

1. Use SvelteKit routing for navigation
2. Store selected puzzle in local state
3. Call `startGame()` from gameStore on start

---

## Definition of Done

- [ ] Puzzle list renders
- [ ] Puzzle selection works
- [ ] Mode toggle works
- [ ] Start game navigates to Run Screen
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
