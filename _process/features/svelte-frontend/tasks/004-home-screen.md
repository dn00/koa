# Task 004: Home Screen

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Screens & Flows
**Complexity:** S
**Depends On:** 002
**Implements:** R3.1

---

## Objective

Create the Home screen with Daily card, navigation to Practice/Codex/Settings.

---

## Context

Entry point to the game. Should feel like a game launcher, not a web app menu.

### Relevant Files
- `docs/D28-END-GAME-UI-SPEC.md` §7 — Home screen spec

### Embedded Context

**D28 Home Layout:**
```
┌─────────────────────────────────┐
│     HOME SMART HOME             │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │  DAILY #42                │  │
│  │  🧊 SMART FRIDGE          │  │
│  │  "It's 2am. You're at     │  │
│  │   your fridge. Again."    │  │
│  │                           │  │
│  │  Best: 4 turns            │  │
│  │  [ PLAY DAILY ]           │  │
│  └───────────────────────────┘  │
│                                 │
│  [Practice]  [Codex]  [Settings]│
└─────────────────────────────────┘
```

**Navigation:**
- Daily → Run Screen
- Practice → Practice mode (stub for MVP)
- Codex → Completion tracking (stub for MVP)
- Settings → Settings screen

---

## Acceptance Criteria

### AC-1: Daily Card Display
- **Given:** Daily puzzle loaded
- **When:** Home screen renders
- **Then:** Shows target, KOA opening line, best score
- **Test Type:** unit

### AC-2: Play Daily Navigation
- **Given:** User taps "Play Daily"
- **When:** Navigation fires
- **Then:** Routes to /run with daily puzzle
- **Test Type:** integration

### AC-3: Navigation Buttons
- **Given:** Home screen rendered
- **When:** User sees bottom nav
- **Then:** Practice, Codex, Settings buttons visible
- **Test Type:** unit

### AC-4: Not Yet Cleared State
- **Given:** Daily not completed
- **When:** Viewing Daily card
- **Then:** Shows "Not yet cleared" instead of best score
- **Test Type:** unit

### Edge Cases

#### EC-1: No Daily Available
- **Scenario:** Network error, no cached daily
- **Expected:** Show error state with retry

#### EC-2: Daily Already Completed
- **Scenario:** User beat today's daily
- **Expected:** Show "Completed ✓" with option to review

---

## Scope

### In Scope
- Home screen layout
- Daily card component
- Navigation to /run
- Stub navigation for Practice/Codex/Settings

### Out of Scope
- Practice mode implementation
- Codex implementation
- Settings screen (separate task)

---

## Implementation Hints

1. Load daily from pack-loader on mount
2. Check persistence for completion status
3. Keep it simple — game feel comes from Run Screen

---

## Definition of Done

- [ ] Daily card displays correctly
- [ ] Navigation works
- [ ] All tests pass
- [ ] Feels like a game menu, not a web form

---

## Log

### Planning Notes
**Context:** Entry point. Keep simple, save the juice for gameplay.

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
