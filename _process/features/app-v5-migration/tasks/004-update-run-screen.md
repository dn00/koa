# Task 004: Update RunScreen

**Status:** backlog
**Assignee:** -
**Blocked By:** 002, 003
**Phase:** Phase 2: Screen Updates
**Complexity:** M
**Depends On:** 002, 003
**Implements:** R3.1, R3.2, R3.3, R3.4, R3.6, R6.1, R6.2, R6.3

---

## Objective

Update RunScreen to display V5 game state and handle V5 gameplay mechanics including belief tracking and turn-based card play.

---

## Context

Major changes from MVP:
- Resistance bar → Belief bar (belief vs target)
- Scrutiny indicator → Removed
- Concern chips → Removed
- Counter panel → Removed
- 1-3 card selection → 1 card per turn
- Turns remaining → Turns played (3 total)

### Relevant Files
- `packages/app/src/screens/run/RunScreen.tsx`
- `packages/app/src/components/hud/` - HUD components

---

## Acceptance Criteria

### AC-1: BeliefBar displays correctly ← R3.1, R6.1
- **Given:** Active game with belief 53, target 57
- **When:** RunScreen renders
- **Then:** BeliefBar shows 53/57 progress
- **Test Type:** integration

### AC-2: Hand displays V5 cards ← R3.2
- **Given:** GameState with 6 cards in hand
- **When:** RunScreen renders
- **Then:** All 6 cards rendered with V5 data
- **Test Type:** integration

### AC-3: Card selection plays card ← R3.3
- **Given:** Card displayed in hand
- **When:** Card clicked
- **Then:** Store `playCard()` called with card.id
- **Test Type:** integration

### AC-4: Game over check after play ← R3.4
- **Given:** Player played 2nd card
- **When:** 3rd card played
- **Then:** `isGameOver()` returns true
- **Test Type:** unit

### AC-5: Navigate to results on game over ← R3.6
- **Given:** Game ends (3 turns played)
- **When:** Final card submitted
- **Then:** Navigate to /results route
- **Test Type:** integration

### AC-6: TurnsDisplay shows played/total ← R6.2
- **Given:** 2 turns played, 3 total
- **When:** Screen renders
- **Then:** Shows "Turn 2/3" or similar
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: Empty hand (shouldn't happen)
- **Scenario:** GameState.hand is empty
- **Expected:** Shows "No cards" placeholder
- **Test Type:** unit

#### EC-2: Objection pending (skip to Task 005)
- **Scenario:** shouldShowObjection() returns true
- **Expected:** Handled by ObjectionPrompt (not this task)
- **Test Type:** N/A (out of scope)

### Error Cases (REQUIRE TESTS)

#### ERR-1: No active game
- **When:** User navigates to /run without starting game
- **Then:** Redirect to home
- **Test Type:** integration

---

## Scope

### In Scope
- BeliefBar component (can be renamed ResistanceBar)
- TurnsDisplay update
- Card hand display
- Single-card selection (not 1-3)
- Navigation to results

### Out of Scope
- Objection prompt (Task 005)
- ConcernChip, ScrutinyIndicator removal (Task 007)

---

## Definition of Done

- [ ] RunScreen renders with V5 GameState
- [ ] BeliefBar shows belief vs target
- [ ] Cards are playable
- [ ] Game ends after 3 turns
- [ ] Self-review completed

---

## Log

### Planning Notes
- 2026-01-28 [Planner] Created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
