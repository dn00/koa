# Task 006: Run Screen

**Status:** backlog
**Assignee:** -
**Blocked By:** 004, 005, 012, 016
**Phase:** Gameplay
**Complexity:** M
**Depends On:** 004, 005, 012, 016
**Implements:** R3.2, R3.3

---

## Objective

Create Run Screen that orchestrates V5 gameplay: 3 turns of card play followed by objection prompt. Uses panel-based layout with KOA avatar + bark side-by-side.

---

## Context

Run Screen is the main gameplay screen. Uses smart home panel UX where KOA's avatar and current bark are displayed together, played cards fill "Override Sequence" slots, and card details appear inline when hovering. After turn 2, objection triggers (auto-resolve in Mini, prompt in Advanced). Game ends after turn 3.

### Relevant Files
- `mockups/KoaMiniPage2.tsx` — Reference implementation (panel layout)
- `packages/engine-core/src/resolver/v5/` — V5 game logic
- `_process/context/koa-mini-spec.md` — Mini mode spec

### Embedded Context

**V5 Gameplay Flow:**
```
Turn 1: Play card → belief changes → KOA bark
Turn 2: Play card → belief changes → KOA bark → Objection prompt
Turn 3: Play card → belief changes → Game ends → Navigate to Result
```

**Run Screen Layout (from KoaMiniPage2 mockup):**
```
┌─────────────────────────────────────────┐
│ [←]                                     │  ← Nav (back button)
├─────────────────────────────────────────┤
│ ┌────────┐  ┌─────────────────────────┐ │
│ │        │  │ [SYS_MSG] | [LOGS]      │ │  ← Zone 1: KOA Hero
│ │ AVATAR │  │                         │ │  Avatar LEFT
│ │        │  │ "Current bark text..."  │ │  Bark panel RIGHT (tabbed)
│ └────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────┤
│ SECURITY_OVERRIDE_SEQUENCE              │  ← Zone 2: Override Slots
│ ┌────────┐ ┌────────┐ ┌────────┐       │  OR Card Preview (on hover)
│ │ Card 1 │ │ Card 2 │ │ Slot 3 │       │
│ └────────┘ └────────┘ └────────┘       │
├─────────────────────────────────────────┤
│ AVAILABLE VARIABLES        [TRANSMIT]   │  ← Zone 3: Action Bar
│ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │card  │ │card  │ │card  │             │  ← Card Grid (3x2)
│ └──────┘ └──────┘ └──────┘             │
│ ┌──────┐ ┌──────┐ ┌──────┐             │
│ └──────┘ └──────┘ └──────┘             │
└─────────────────────────────────────────┘
```

**Zone 2 Dynamic Behavior:**
- Default: Shows 3 Override Sequence slots (filled cards + empty slots)
- On card hover/focus: Switches to Card Preview (icon + details)

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
- **Given:** Game started (PANEL phase)
- **When:** Run Screen renders
- **Then:** Shows Zone 1 (Avatar + Bark panel), Zone 2 (Override Slots), Zone 3 (Action Bar + Card Grid)
- **Test Type:** component

### AC-2: Card Play Flow ← R3.2
- **Given:** Card selected in grid
- **When:** Player taps TRANSMIT
- **Then:** Card animates to Override Sequence slot, KOA bark updates, avatar mood shifts
- **Test Type:** integration

### AC-3: Turn Progression ← R3.2
- **Given:** Turn 1 complete
- **When:** Turn 2 card played
- **Then:** Override Sequence shows 2 filled slots, slot 3 shows placeholder
- **Test Type:** integration

### AC-4: Card Preview on Hover ← R3.2
- **Given:** Card in grid
- **When:** Player hovers/focuses card
- **Then:** Zone 2 switches from Override Slots to Card Preview (icon + type + details)
- **Test Type:** component

### AC-5: Bark/Logs Toggle ← R3.2
- **Given:** Bark panel visible
- **When:** Player taps LOGS tab
- **Then:** Panel shows scenario facts instead of current bark
- **Test Type:** component

### AC-6: Objection Trigger ← R3.2
- **Given:** Turn 2 just completed
- **When:** Belief change settled
- **Then:** Objection prompt appears (or auto-resolves in Mini)
- **Test Type:** integration

### AC-7: Game End Navigation ← R3.2
- **Given:** Turn 3 complete
- **When:** All animations finish
- **Then:** Navigate to Result Screen
- **Test Type:** integration

### Edge Cases

#### EC-1: Quick Card Plays
- **Scenario:** Player plays cards rapidly
- **Expected:** Each play waits for previous to complete (TRANSMIT disabled during animation)

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
- Run Screen layout (3 zones as described)
- KOA Hero zone (avatar + tabbed bark/logs panel)
- Override Sequence zone (slots + card preview swap)
- Card tray with TRANSMIT action
- Wiring playCard to engine-core
- Navigation to Verdict Screen after turn 3

### Out of Scope
- Override Sequence component (Task 004)
- EvidenceCard component (Task 005)
- BarkPanel component (Task 016)
- Animations (Task 009)
- KOA Avatar (Task 012)

---

## Implementation Hints

1. Subscribe to gameStore for state
2. Use `focusedCard` state to toggle Zone 2 between slots and preview
3. Use `msgMode` state ('BARK' | 'LOGS') for tab switching
4. Gate TRANSMIT on card selection + not animating
5. Auto-switch to BARK tab when new bark arrives

---

## Definition of Done

- [ ] Screen renders 3 zones correctly
- [ ] Avatar + bark panel display together (side-by-side)
- [ ] Tab switching between SYS_MSG and LOGS works
- [ ] Card hover shows preview in Zone 2
- [ ] Card play fills Override Sequence slot
- [ ] KOA bark updates with typewriter effect
- [ ] Objection triggers after turn 2 (auto in Mini, prompt in Advanced)
- [ ] Navigates to Verdict after turn 3
- [ ] All tests pass

---

## Log

### Change Log
- 2026-01-29 [Planner] Updated for panel layout (KoaMiniPage2)
- 2026-01-28 [Planner] Created for V5

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-29 | backlog | backlog | Planner | Updated for panel layout |
| 2026-01-28 | - | backlog | Planner | Created |
