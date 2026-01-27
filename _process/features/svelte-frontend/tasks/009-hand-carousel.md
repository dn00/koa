# Task 009: Hand Carousel

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Components
**Complexity:** M
**Depends On:** 008
**Implements:** R8.1, R8.4, R8.7

---

## Objective

Build the hand carousel with horizontal scroll, snap points, card fan arrangement, and max 3 selection limit.

---

## Context

Players are dealt 6 cards. The carousel must feel like holding cards in hand, not scrolling a list.

### Relevant Files
- `docs/D28-END-GAME-UI-SPEC.md` §1.D1 — Evidence Hand
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` §5.2 — No haptics on scroll

### Embedded Context

**D28 Evidence Hand:**
- Shows 6 cards dealt (not drafted in Daily mode)
- Tap to select (up to 3), tap again to deselect
- Long-press for card details

**Layout Options:**
1. **Fan arrangement** (recommended): Cards overlap, spread on focus
2. **Horizontal scroll**: Standard carousel with snap

**Selection Rules:**
- Max 3 cards selectable
- 4th tap shows soft deny (no harsh buzzer)
- Selected cards elevate/highlight

**D16 Haptics Rule:**
- NO haptics on scroll/carousel movement (avoid annoyance)

---

## Acceptance Criteria

### AC-1: Display 6 Cards ← R8.1
- **Given:** 6 cards in hand
- **When:** Carousel renders
- **Then:** All 6 cards visible (may need scroll)
- **Test Type:** unit

### AC-2: Horizontal Scroll with Snap ← R8.1
- **Given:** User scrolls carousel
- **When:** Scroll ends
- **Then:** Snaps to nearest card boundary
- **Test Type:** visual

### AC-3: Tap to Select
- **Given:** Unselected card
- **When:** User taps
- **Then:** Card becomes selected, elevates
- **Test Type:** integration

### AC-4: Tap to Deselect
- **Given:** Selected card
- **When:** User taps again
- **Then:** Card deselects, returns to normal
- **Test Type:** integration

### AC-5: Max 3 Selection ← R8.4
- **Given:** 3 cards already selected
- **When:** User taps 4th card
- **Then:** Soft deny feedback, card not selected
- **Test Type:** integration

### AC-6: Soft Deny Feedback ← R8.4
- **Given:** 4th card tap attempted
- **When:** Deny triggered
- **Then:** Subtle shake (90ms), no harsh sound
- **Test Type:** visual

### AC-7: Fan Arrangement ← R8.7
- **Given:** Cards in hand
- **When:** Carousel renders
- **Then:** Cards overlap slightly, spread when focused
- **Test Type:** visual

### AC-8: No Haptics on Scroll
- **Given:** User scrolling carousel
- **When:** During scroll
- **Then:** No haptic feedback fires
- **Test Type:** integration

### Edge Cases

#### EC-1: All Cards Selected
- **Scenario:** Player selects all 3 allowed
- **Expected:** Remaining cards slightly dimmed

#### EC-2: Empty Hand
- **Scenario:** All cards played (shouldn't happen in Daily)
- **Expected:** Empty state message

---

## Scope

### In Scope
- HandCarousel component
- Horizontal scroll with snap
- Selection state management (local)
- Max 3 limit with soft deny
- Fan arrangement styling

### Out of Scope
- Card deal animation (Task 011)
- Card component itself (Task 008)

---

## Implementation Hints

1. CSS scroll-snap for basic snap behavior
2. Selection state lifted to parent (Run Screen)
3. Soft deny: GSAP shake 90ms, no haptic
4. Fan: CSS transforms with slight rotation per card
5. Touch-friendly: large tap targets

---

## Definition of Done

- [ ] All 6 cards displayable
- [ ] Scroll snaps correctly
- [ ] Selection up to 3 works
- [ ] Soft deny on 4th tap
- [ ] Fan arrangement looks good
- [ ] No haptics on scroll
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** The hand is where players spend most time. Must feel like cards, not a list.
**Decisions:** CSS scroll-snap + GSAP for deny animation.

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
