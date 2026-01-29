# Task 008: Update Results Screen

**Status:** done
**Assignee:** -
**Blocked By:** 002
**Phase:** Phase 3: Cleanup
**Complexity:** S
**Depends On:** 002
**Implements:** Related to R2.5

---

## Objective

Update ResultScreen to display V5 verdict data: Tier, belief score, played cards with lie reveals.

---

## Context

MVP used `RunStatus` (WON/LOST). V5 uses `Tier` (FLAWLESS/CLEARED/CLOSE/BUSTED) with richer verdict data.

### Relevant Files
- `packages/app/src/screens/results/ResultScreen.tsx`

---

## Acceptance Criteria

### AC-1: Display Tier instead of RunStatus
- **Given:** Completed game with CLEARED tier
- **When:** Results screen renders
- **Then:** Shows "CLEARED" (not "WON")
- **Test Type:** integration

### AC-2: Display final belief vs target
- **Given:** VerdictData with belief=58, target=57
- **When:** Results screen renders
- **Then:** Shows "58/57" or equivalent
- **Test Type:** unit

### AC-3: Display played cards with lie reveal
- **Given:** VerdictData with playedCards array
- **When:** Results screen renders
- **Then:** Each played card shown with wasLie indicator
- **Test Type:** unit

### AC-4: Display KOA verdict line
- **Given:** VerdictData with koaLine
- **When:** Results screen renders
- **Then:** Shows verdict dialogue from puzzle
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: No played cards (edge case)
- **Scenario:** VerdictData with empty playedCards
- **Expected:** Shows appropriate message
- **Test Type:** unit

---

## Definition of Done

- [ ] Tier displayed correctly
- [ ] Scores shown
- [ ] Played cards with lie reveal
- [ ] Self-review completed

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
