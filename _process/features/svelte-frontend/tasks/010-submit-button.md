# Task 010: Submit Button

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Components
**Complexity:** S
**Depends On:** 002, 016
**Implements:** R9.1, R9.2, R9.3, R9.4

---

## Objective

Build the SUBMIT button with disabled/ready/pressed states, breathing glow, and error shake.

---

## Context

The commit action. Must feel satisfying to press and clearly communicate state.

### Relevant Files
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` §3.5 — Commit Button
- `docs/D28-END-GAME-UI-SPEC.md` §2 — Daily action model

### Embedded Context

**D28 Daily Mode:**
- Single primary button: **SUBMIT**
- Shows card count: "SUBMIT (2)"
- Disabled if no cards selected or MAJOR contradiction

**D16 Button States:**
- **Disabled:** muted, shows "why" on tap (e.g., "Select cards")
- **Ready:** subtle breathing glow (2s cycle)
- **Pressed:** slam animation + immediate mechanics
- **Error:** shake (90ms) + soft deny tick

**Animation Timing:**
- Breathing glow: 2s cycle, subtle
- Press slam: immediate (T=0)
- Error shake: 90ms

---

## Acceptance Criteria

### AC-1: Disabled State ← R9.1
- **Given:** No cards selected
- **When:** Button renders
- **Then:** Muted appearance, disabled
- **Test Type:** unit

### AC-2: Disabled Tap Shows Why ← R9.1
- **Given:** Button disabled
- **When:** User taps anyway
- **Then:** Shows reason ("Select cards to submit")
- **Test Type:** integration

### AC-3: Ready State ← R9.2
- **Given:** 1+ cards selected, no contradictions
- **When:** Button renders
- **Then:** Enabled with subtle breathing glow (2s)
- **Test Type:** visual

### AC-4: Card Count Display
- **Given:** 2 cards selected
- **When:** Button renders
- **Then:** Shows "SUBMIT (2)"
- **Test Type:** unit

### AC-5: Press Animation ← R9.3
- **Given:** User presses button
- **When:** Press registered
- **Then:** Slam animation fires immediately
- **Test Type:** visual

### AC-6: Submit Callback
- **Given:** User presses enabled button
- **When:** Press registered
- **Then:** onSubmit callback fires with selected cards
- **Test Type:** integration

### AC-7: Error Shake ← R9.4
- **Given:** MAJOR contradiction detected
- **When:** User tries to submit
- **Then:** Button shakes (90ms), soft deny feedback
- **Test Type:** visual

### AC-8: Blocked State
- **Given:** MAJOR contradiction active
- **When:** Button renders
- **Then:** Shows "BLOCKED" instead of count
- **Test Type:** unit

### Edge Cases

#### EC-1: Rapid Taps
- **Scenario:** User taps rapidly while animation plays
- **Expected:** Debounce prevents double-submit

#### EC-2: State Change During Animation
- **Scenario:** Cards deselected during press animation
- **Expected:** Submit still fires with original selection

---

## Scope

### In Scope
- SubmitButton component
- All 4 states (disabled, ready, pressed, error)
- Breathing glow animation
- Slam and shake animations
- Card count display

### Out of Scope
- Actual submit logic (Run Screen)
- Sound effects (provided by feel system)

---

## Implementation Hints

1. Breathing glow: CSS animation or GSAP, 2s infinite
2. Slam: GSAP scale 0.95 → 1.02, ~100ms
3. Shake: GSAP x oscillation, 90ms total
4. Use `pointer-events: none` during animation to prevent double-tap

---

## Definition of Done

- [ ] All button states work
- [ ] Breathing glow animation
- [ ] Press slam animation
- [ ] Error shake animation
- [ ] Disabled tap shows reason
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** The commit action. Must feel powerful to press.
**Decisions:** GSAP for slam/shake, CSS for breathing (simpler).

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
