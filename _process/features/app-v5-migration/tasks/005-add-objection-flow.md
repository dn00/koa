# Task 005: Add Objection Flow

**Status:** done
**Assignee:** -
**Blocked By:** 004
**Phase:** Phase 2: Screen Updates
**Complexity:** S
**Depends On:** 004
**Implements:** R3.5

---

## Objective

Add objection prompt UI that appears after turn 2, allowing player to stand by or withdraw their last card.

---

## Context

V5 objection mechanic:
- After turn 2, KOA challenges the last played card
- Player chooses: Stand By (+2 if truth, -4 if lie) or Withdraw (-2 regardless)
- Mini mode: auto-resolves (future); Advanced mode: player chooses

For initial implementation, use Advanced mode behavior.

### Relevant Files
- `packages/app/src/screens/run/RunScreen.tsx`
- New: `packages/app/src/components/ObjectionPrompt/`

---

## Acceptance Criteria

### AC-1: Objection prompt appears after T2
- **Given:** Player just played turn 2
- **When:** `shouldTriggerObjection()` returns true
- **Then:** ObjectionPrompt modal/overlay displayed
- **Test Type:** integration

### AC-2: Stand By option works
- **Given:** Objection prompt visible
- **When:** Player clicks "Stand By"
- **Then:** Store `resolveObjection('stood_by')` called
- **Test Type:** integration

### AC-3: Withdraw option works
- **Given:** Objection prompt visible
- **When:** Player clicks "Withdraw"
- **Then:** Store `resolveObjection('withdrawn')` called
- **Test Type:** integration

### Edge Cases (REQUIRE TESTS)

#### EC-1: Objection already resolved
- **Scenario:** Page refresh during objection
- **Expected:** Check `state.objection?.resolved` to skip prompt
- **Test Type:** unit

### Error Cases (REQUIRE TESTS)

#### ERR-1: Resolve when no objection pending
- **When:** `resolveObjection()` called without objection state
- **Then:** Returns error from engine
- **Test Type:** unit

---

## Definition of Done

- [ ] ObjectionPrompt component created
- [ ] Stand By and Withdraw work
- [ ] Game continues after resolution
- [ ] Self-review completed

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
