# Task 007: HUD Components

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Components
**Complexity:** M
**Depends On:** 002, 016
**Implements:** R4.1-R4.4, R5.1-R5.4, R6.1-R6.3

---

## Objective

Build the top HUD: Resistance bar, Scrutiny indicator, Concern chips, Turns display — all with D16 animation specs.

---

## Context

The HUD is the top portion of the game screen. Thin header + centered KOA + concerns. Must update instantly on state changes.

### Relevant Files
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` §3.1-3.3
- `svelte-frontend.plan.md` — UI Layout section

### Embedded Context

**Game-First Layout (from plan):**
```
┌─────────────────────────────┐
│ ⚙ 🧊 FRIDGE  ▓▓░░ 25/40 T3/6 ●●○○○│  ← thin header
├─────────────────────────────┤
│            ┌───┐            │
│            │ ◉ │            │  ← KOA (60-80px, centered)
│            └───┘            │
│   [✓ You] [○ Awake] [○ Intent]    │  ← concerns under KOA
└─────────────────────────────┘
```

**Header Bar Contents:**
- Settings button (⚙)
- Target label + icon (🧊 FRIDGE)
- Resistance bar (compact)
- Turn counter (T3/6)
- Scrutiny pips (●●○○○)

**D16 Resistance Bar Timing:**
- Decrease: snap down 220ms + bounce 90ms
- Increase (penalty): snap up + shake
- Lock cleared: drain + shimmer
- Haptic: light tick (decrease), medium (increase)

**D16 Scrutiny Indicator:**
- Low→Med: warmer color + pulse 1.2s
- Med→High: stronger pulse 0.8s + hazard overlay
- Haptic: medium tick on level change
- Must be understandable without reading text

**D16 Concern Chips:**
- Slide in from right: 180ms
- When addressed: dissolve into particles 200ms (or fade if reduced motion)
- Tap: opens detail sheet

---

## Acceptance Criteria

### AC-1: Resistance Bar Display ← R4.1
- **Given:** RunState with resistance 25/40
- **When:** HUD renders
- **Then:** Bar shows correct fill percentage
- **Test Type:** unit

### AC-2: Resistance Decrease Animation ← R4.1
- **Given:** Resistance changes from 30 to 20
- **When:** State updates
- **Then:** Bar snaps down (220ms) with bounce (90ms)
- **Test Type:** visual

### AC-3: Resistance Increase Animation ← R4.2
- **Given:** Resistance increases (penalty)
- **When:** State updates
- **Then:** Sharp snap up with brief shake
- **Test Type:** visual

### AC-4: Lock Cleared Effect ← R4.3
- **Given:** Resistance hits 0
- **When:** State updates
- **Then:** Bar drains fully with shimmer effect
- **Test Type:** visual

### AC-5: Scrutiny Display ← R5.1
- **Given:** Scrutiny level 2/5
- **When:** HUD renders
- **Then:** Shows level with appropriate color
- **Test Type:** unit

### AC-6: Scrutiny Escalation ← R5.2
- **Given:** Scrutiny increases to high (4+)
- **When:** State updates
- **Then:** Stronger pulse (0.8s), hazard overlay appears
- **Test Type:** visual

### AC-7: Concern Chips Display ← R6.1
- **Given:** 3 concerns, 1 addressed
- **When:** HUD renders
- **Then:** Shows 3 chips, 1 with checkmark
- **Test Type:** unit

### AC-8: Concern Addressed Animation ← R6.2
- **Given:** Concern becomes addressed
- **When:** State updates
- **Then:** Chip dissolves/fades with satisfying effect
- **Test Type:** visual

### AC-9: Concern Tap → Detail Sheet ← R6.3
- **Given:** User taps concern chip
- **When:** Tap registered
- **Then:** Opens Concern Detail Sheet
- **Test Type:** integration

### AC-10: Turns Display
- **Given:** Turn 3/6
- **When:** HUD renders
- **Then:** Shows "Turn 3 / 6" clearly
- **Test Type:** unit

### Edge Cases

#### EC-1: All Concerns Addressed
- **Scenario:** All 3 concerns addressed
- **Expected:** All chips show checkmarks

#### EC-2: Scrutiny at Max
- **Scenario:** Scrutiny = 5
- **Expected:** Full danger state (loss imminent)

---

## Scope

### In Scope
- ResistanceBar component
- ScrutinyIndicator component
- ConcernChip component
- TurnsDisplay component
- All D16 animations
- Concern Detail Sheet (basic)

### Out of Scope
- KOA Avatar (Task 015)
- Sound effects (Task 016 provides IDs)

---

## Implementation Hints

1. Use GSAP for all animations
2. Resistance bar: CSS width transition won't give the bounce — use GSAP
3. Scrutiny: CSS custom properties for color theming
4. Concerns: GSAP Flip could help with layout changes
5. All animations respect `$feelStore.reducedMotion`

---

## Definition of Done

- [ ] All HUD components render correctly
- [ ] Animations match D16 timing
- [ ] Reduced motion fallbacks work
- [ ] Concern tap opens sheet
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** HUD is the player's dashboard. Must be instantly readable and satisfying to watch update.
**Decisions:** GSAP for all animations (CSS transitions won't give proper bounce/overshoot).

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
