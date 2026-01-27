# Task 013: Counter Panel

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Components
**Complexity:** S
**Depends On:** 002
**Implements:** R7 (Counter visibility)

---

## Objective

Build the Counter-Evidence panel showing KOA's challenges with FULL/HIDDEN visibility modes.

---

## Context

Counters are KOA's defense. Players need to understand what will challenge their evidence.

### Relevant Files
- `docs/D28-END-GAME-UI-SPEC.md` §1.C — Counter-Evidence Panel
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` — Counter mechanics

### Embedded Context

**D28 Counter-Evidence Panel (FULL mode):**
```
Header: "KOA will challenge:"

📷 Security Camera → targets "You're you"
   "No one at door 2:07am"
   Refutable by: Maintenance Log

😴 Sleep Data → targets "Awake"
   "User asleep until 2:30am"
   Refutable by: Noise Complaint
```

**Visibility Modes:**
- **FULL:** All counters visible from start
- **HIDDEN:** Shows "? counters hidden" until triggered, then reveals

**Counter States:**
- Active: Will trigger if related evidence played
- Triggered: Currently contesting evidence
- Refuted: Struck through, checkmark, "SPENT" label

---

## Acceptance Criteria

### AC-1: Counter Display - FULL Mode
- **Given:** counterVisibility = "FULL"
- **When:** Panel renders
- **Then:** All counters visible with details
- **Test Type:** unit

### AC-2: Counter Display - HIDDEN Mode
- **Given:** counterVisibility = "HIDDEN"
- **When:** Panel renders
- **Then:** Shows "? counters hidden" for unrevealed
- **Test Type:** unit

### AC-3: Counter Reveals on Trigger
- **Given:** HIDDEN mode, counter triggered
- **When:** Evidence challenges counter
- **Then:** Counter revealed with animation
- **Test Type:** integration

### AC-4: Refuted Counter Display
- **Given:** Counter refuted by player card
- **When:** Panel renders
- **Then:** Strikethrough, checkmark, "SPENT" label
- **Test Type:** unit

### AC-5: Counter Target Display
- **Given:** Counter with target concern
- **When:** Panel renders
- **Then:** Shows "→ targets [Concern Name]"
- **Test Type:** unit

### AC-6: Refutable By Display
- **Given:** Counter with known refutation card
- **When:** Panel renders (FULL mode)
- **Then:** Shows "Refutable by: [Card Name]"
- **Test Type:** unit

### Edge Cases

#### EC-1: No Counters
- **Scenario:** Puzzle has no counter-evidence
- **Expected:** Panel shows "No challenges this round"

#### EC-2: All Counters Refuted
- **Scenario:** Player refuted all counters
- **Expected:** All struck through, satisfying state

---

## Scope

### In Scope
- CounterPanel component
- Counter item display
- FULL/HIDDEN visibility modes
- Refuted state styling
- Visibility toggle integration

### Out of Scope
- Counter trigger logic (engine-core)
- Animations (basic fade for reveal)

---

## Implementation Hints

1. Read counterVisibility from settingsStore
2. Counter state comes from runState.counters
3. Basic reveal animation: opacity fade
4. Refuted styling: CSS strikethrough + muted color

---

## Definition of Done

- [ ] Both visibility modes work
- [ ] Counter details display correctly
- [ ] Refuted state styled
- [ ] Reveal animation for HIDDEN mode
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** Strategic information display. Critical for player planning.

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
