# Task 011: Card Animations

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Components
**Complexity:** M
**Depends On:** 008, 016
**Implements:** R7.3-R7.6, R7.8-R7.9, R8.2, R8.3, R8.5, R8.6

---

## Objective

Implement all card animations: deal, hover tilt, select/deselect, and the Balatro-inspired feel.

---

## Context

Cards are the main interaction. Animations must feel satisfying and game-like.

### Relevant Files
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` §3.4 — Payload slotting feel
- Plan: Balatro-Inspired Game Feel section

### Embedded Context

**D16 Slot Feel Timing:**
- Select (slot): shrink + snap, 160ms total
- Slot glow: 120ms
- Deselect (remove): pop + return, 140ms
- Haptic: light tick on slot/remove

**Balatro-Inspired Additions:**
- Hover tilt: Card tilts toward touch/mouse position
- Hover scale: 1.05x, lerp 0.25 speed
- Deal stagger: 80ms between cards
- Deal ease: back.out(1.7) overshoot
- Deal rotation: ±5° random per card

**GSAP Targets:**
```javascript
// Deal animation
gsap.from(card, {
  y: 100,
  rotation: random(-5, 5),
  opacity: 0,
  duration: 0.4,
  ease: "back.out(1.7)",
  delay: index * 0.08  // stagger
});

// Select animation
gsap.to(card, {
  scale: 0.92,
  duration: 0.08,
  ease: "power2.in",
  onComplete: () => {
    gsap.to(card, { scale: 1.02, duration: 0.08, ease: "back.out(2)" });
  }
});

// Hover tilt
function onPointerMove(e) {
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  gsap.to(card, {
    rotateY: x * 15,
    rotateX: -y * 15,
    duration: 0.3
  });
}
```

---

## Acceptance Criteria

### AC-1: Card Deal Animation ← R8.2
- **Given:** Game starts
- **When:** Hand dealt
- **Then:** Cards spring from bottom with overshoot
- **Test Type:** visual

### AC-2: Deal Stagger ← R8.5
- **Given:** 6 cards dealing
- **When:** Animation plays
- **Then:** 80ms delay between each card
- **Test Type:** visual

### AC-3: Deal Rotation ← R8.3
- **Given:** Card dealing
- **When:** Animation plays
- **Then:** Slight random rotation (±5°)
- **Test Type:** visual

### AC-4: Select Animation ← R7.3
- **Given:** Card tapped
- **When:** Selection fires
- **Then:** Shrink (0.92) → snap (1.02), 160ms total
- **Test Type:** visual

### AC-5: Slot Glow ← R7.4
- **Given:** Card selected
- **When:** Selection completes
- **Then:** Brief glow effect (120ms)
- **Test Type:** visual

### AC-6: Deselect Animation ← R7.5
- **Given:** Selected card tapped
- **When:** Deselection fires
- **Then:** Pop and return, 140ms
- **Test Type:** visual

### AC-7: Selection Haptic ← R7.6
- **Given:** Card selected/deselected
- **When:** Animation plays
- **Then:** Light haptic tick fires
- **Test Type:** integration

### AC-8: Hover Tilt ← R7.8
- **Given:** Mouse/touch over card
- **When:** Pointer moves
- **Then:** Card tilts toward pointer position
- **Test Type:** visual

### AC-9: Hover Scale ← R7.9
- **Given:** Mouse/touch enters card
- **When:** Hover state
- **Then:** Card scales to 1.05x smoothly
- **Test Type:** visual

### AC-10: Reduced Motion Fallback
- **Given:** prefers-reduced-motion enabled
- **When:** Any animation triggers
- **Then:** Instant state change, no motion
- **Test Type:** unit

### Edge Cases

#### EC-1: Rapid Selection
- **Scenario:** User taps cards rapidly
- **Expected:** Animations queue properly, no visual glitches

#### EC-2: Hover During Select
- **Scenario:** Hover while selection animation plays
- **Expected:** Hover effect waits for selection to complete

---

## Scope

### In Scope
- Deal animation with stagger
- Select/deselect animations
- Hover tilt and scale
- Haptic integration via feel system
- Reduced motion support

### Out of Scope
- Card fly to timeline (Task 012)
- Card component itself (Task 008)

---

## Implementation Hints

1. Create reusable animation functions in `lib/animations/cards.ts`
2. Use GSAP context for cleanup on unmount
3. Hover tilt: use pointer events, not mouse (touch support)
4. Reduced motion: check `$feelStore.reducedMotion`
5. will-change management: set before animation, remove after

---

## Definition of Done

- [ ] Deal animation with stagger and rotation
- [ ] Select/deselect with correct timing
- [ ] Hover tilt and scale work
- [ ] Haptics fire on selection
- [ ] Reduced motion fallback
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** This is where the "game feel" lives. Must be satisfying.
**Decisions:** GSAP for everything (CSS can't do hover tilt reactively).

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
