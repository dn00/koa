# Task 009: GSAP Animations

**Status:** backlog
**Assignee:** -
**Blocked By:** 005, 006
**Phase:** Polish
**Complexity:** M
**Depends On:** 005, 006
**Implements:** R7.1, R7.2, R7.3, R7.4, R7.5

---

## Objective

Implement GSAP animations for card interactions, belief bar changes, objection modal, and win/loss celebrations.

---

## Context

Game-feel-first frontend requires polished animations. All timing follows D16 budgets. Animations should be skippable and respect reduced motion preferences.

### Relevant Files
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` — Animation timing budgets
- `_process/context/v5-design-context.md` — I8 animation invariant

### Embedded Context

**D16 Timing Budgets:**
```typescript
const TIMING = {
  IMMEDIATE: 50,      // Button feedback
  MECHANICS: 120,     // State updates
  MICRO: { MIN: 80, MAX: 150 },   // Small interactions
  MESO: { MIN: 180, MAX: 280 },   // Card movements
  MACRO: { MIN: 600, MAX: 1200 }, // Celebrations
  CARD_STAGGER: 200,  // Between sequential cards
  COUNT_UP: 300,      // Number count animations
};
```

**GSAP Eases:**
```typescript
const EASE = {
  SNAP: 'power2.out',
  SPRING: 'back.out(1.7)',
  SMOOTH: 'power2.inOut',
  ELASTIC: 'elastic.out(1, 0.5)',
};
```

**Animation Specifications:**

1. **Card Deal (R7.1):**
   - Duration: 300ms, stagger 80ms
   - Ease: back.out(1.7)
   - Cards spring into hand from off-screen

2. **Card Select (R7.2):**
   - Duration: 160ms
   - Scale: 1.0 → 1.08
   - Add glow effect
   - Ease: power2.out

3. **Card Play (R7.2):**
   - Duration: 250ms
   - Card moves to played area
   - Slight rotation during flight
   - Ease: power3.out

4. **BeliefBar Change (R7.3):**
   - Duration: 220ms + 90ms bounce
   - Fill animates to new value
   - Ease: power2.out with overshoot

5. **Objection Modal (R7.4):**
   - Entrance: 200ms, back.out(1.2)
   - Scale from 0.8 → 1.0
   - Background dims

6. **Win/Loss Celebration (R7.5):**
   - Win: 800ms elastic particles
   - Loss: 400ms shake/fade

---

## Acceptance Criteria

### AC-1: Card Deal Animation ← R7.1
- **Given:** Game starts with hand of cards
- **When:** Hand renders
- **Then:** Cards spring in with staggered timing
- **Test Type:** visual

### AC-2: Card Select Animation ← R7.2
- **Given:** Card in hand
- **When:** Player taps to select
- **Then:** Card scales up with glow in 160ms
- **Test Type:** visual

### AC-3: Card Play Animation ← R7.2
- **Given:** Card selected
- **When:** Player confirms play
- **Then:** Card flies to played area in 250ms
- **Test Type:** visual

### AC-4: BeliefBar Animation ← R7.3
- **Given:** Card played, belief changes
- **When:** Turn resolves
- **Then:** Bar fill animates smoothly with slight bounce
- **Test Type:** visual

### AC-5: Objection Modal Animation ← R7.4
- **Given:** Objection triggers
- **When:** Modal appears
- **Then:** Scales in dramatically with back.out ease
- **Test Type:** visual

### AC-6: Win Celebration ← R7.5
- **Given:** Game ends with CLEARED or FLAWLESS
- **When:** Result Screen loads
- **Then:** Celebration animation plays (particles, shake)
- **Test Type:** visual

### Edge Cases

#### EC-1: Reduced Motion
- **Scenario:** User prefers reduced motion
- **Expected:** Animations are instant or minimal

---

## Scope

### In Scope
- Card deal animation
- Card select/deselect feedback
- Card play flight animation
- BeliefBar fill animation
- Objection modal entrance/exit
- Win/loss celebration effects
- Reduced motion support

### Out of Scope
- Sound effects (future task)
- Haptic feedback (future task)

---

## Implementation Hints

1. Use `gsap.context()` for cleanup
2. Check `window.matchMedia('(prefers-reduced-motion)')`
3. Use GSAP Flip for card position changes
4. Create reusable animation factories
5. Animations in `onMount`, cleanup in `onDestroy`

---

## Definition of Done

- [ ] Card deal animates correctly
- [ ] Card selection has feedback
- [ ] Card play animation works
- [ ] BeliefBar animates smoothly
- [ ] Objection modal has entrance animation
- [ ] Win/loss celebrations work
- [ ] Reduced motion respected
- [ ] All animations skippable

---

## Log

### Change Log
- 2026-01-28 [Planner] Created for V5

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
