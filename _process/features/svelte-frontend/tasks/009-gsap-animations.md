# Task 009: GSAP Animations

**Status:** backlog
**Assignee:** -
**Blocked By:** 005, 006, 016
**Phase:** Polish
**Complexity:** M
**Depends On:** 005, 006, 016
**Implements:** R11.1, R11.2, R11.3, R11.4, R11.5

---

## Objective

Implement GSAP animations for the panel-based UX: card grid interactions, Override Sequence slot fills, Zone 2 content swaps, and verdict reveal. Animations must be mode-aware (Mini hides belief bar, auto-resolves objection).

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

**Animation Specifications (Panel Layout):**

1. **Card Deal to Grid (R11.1):**
   - Duration: 300ms, stagger 80ms
   - Ease: back.out(1.7)
   - Cards spring into 3x2 grid from bottom

2. **Card Select in Grid (R11.2):**
   - Duration: 160ms
   - Scale: 1.0 → 1.08, translate-y: -2px
   - Primary border highlight
   - Ease: power2.out

3. **Card Play to Override Slot (R11.3):**
   - Duration: 250ms
   - Card fades/shrinks from grid
   - Override Sequence slot fills with zoom-in (scale 0.9 → 1)
   - Ease: power3.out

4. **Zone 2 Content Swap (R11.4):**
   - When hovering card: Override Slots fade out, Card Preview zooms in
   - Duration: 200ms
   - Ease: power2.out
   - Reverse on blur

5. **Override Slot Fill:**
   - Card content pops in: scale 0.9 → 1, 200ms
   - Ease: back.out(1.4)

6. **Bark Text Update:**
   - Old bark fades out (if any), new bark handled by Typewriter
   - Panel content crossfade: 150ms
   - Tab switch: slide from direction of tab

7. **Verdict Reveal (R11.5):**
   - TierBadge: zoom in from 0.5 → 1.0, 400ms
   - Slides up from bottom of card tray zone
   - Ease: elastic.out(1, 0.5)

8. **BeliefBar Change (Advanced only):**
   - Duration: 220ms + 90ms bounce
   - Fill animates to new value
   - Ease: power2.out with overshoot
   - **Skipped in Mini mode** (bar hidden)

9. **Objection Flow (Advanced only):**
   - System Check bark appears in BarkPanel
   - Stand/Withdraw buttons: fade in 150ms below bark
   - **Skipped in Mini mode** (auto-resolves, no UI)

---

## Acceptance Criteria

### AC-1: Card Deal to Grid ← R11.1
- **Given:** Game starts, Picking phase begins
- **When:** Card grid renders
- **Then:** 6 cards spring into 2x3 grid with staggered timing (80ms apart)
- **Test Type:** visual

### AC-2: Card Select Feedback ← R11.2
- **Given:** Card in grid
- **When:** Player taps to select
- **Then:** Card scales up (1.08), elevates (-2px), shows primary border in 160ms
- **Test Type:** visual

### AC-3: Card Play to Override Slot ← R11.3
- **Given:** Card selected, player taps TRANSMIT
- **When:** Play action triggers
- **Then:** Card fades from grid, Override Sequence slot fills with zoom-in animation
- **Test Type:** visual

### AC-4: Zone 2 Content Swap ← R11.4
- **Given:** Override Sequence visible (default)
- **When:** Player hovers/focuses a card
- **Then:** Override Slots fade out, Card Preview zooms in (scale 0.95 → 1, opacity 0 → 1)
- **Test Type:** visual

### AC-5: Verdict Reveal ← R11.5
- **Given:** Game ends, Verdict phase begins
- **When:** Verdict Screen renders
- **Then:** TierBadge zooms in, played cards reveal with lie markers staggered
- **Test Type:** visual

### AC-6: BeliefBar Animation (Advanced Only)
- **Given:** Mode is 'advanced', card played
- **When:** Turn resolves
- **Then:** Bar fill animates smoothly with slight bounce
- **Test Type:** visual

### AC-7: Mode-Aware Animation Skipping
- **Given:** Mode is 'mini'
- **When:** Turn resolves
- **Then:** BeliefBar animation skipped (bar hidden), objection auto-resolves without modal
- **Test Type:** integration

### Edge Cases

#### EC-1: Reduced Motion
- **Scenario:** User prefers reduced motion
- **Expected:** Animations are instant or minimal (duration → 0)

#### EC-2: Rapid Card Selection
- **Scenario:** Player taps cards quickly
- **Expected:** Previous select animation killed, new one starts immediately

---

## Scope

### In Scope
- Card deal animation (grid entrance)
- Card select/deselect feedback
- Card play → Override Slot fill transition
- Zone 2 content swap (slots ↔ preview)
- Override Sequence slot fill animation
- Verdict reveal (TierBadge zoom, card reveal stagger)
- BeliefBar fill animation (Advanced only)
- Mode-aware animation skipping
- Reduced motion support

### Out of Scope
- Typewriter text animation (Task 015)
- Avatar speaking state sync (Task 012 + 015)
- Sound effects (future task)
- Haptic feedback (future task)

---

## Implementation Hints

1. Use `gsap.context()` for cleanup in `onMount`/`onDestroy`
2. Check `window.matchMedia('(prefers-reduced-motion)')` → set duration to 0
3. Subscribe to `mode` store to skip Advanced-only animations
4. Create reusable animation factories:
   ```typescript
   // Example: Override slot fill (zoom in)
   function animateSlotFill(el: HTMLElement) {
     return gsap.from(el, { scale: 0.9, opacity: 0, duration: 0.2, ease: 'back.out(1.4)' });
   }
   ```
5. Use Svelte `use:action` for declarative animation triggers
6. Kill running animations before starting new ones: `gsap.killTweensOf(el)`
7. Coordinate with Typewriter `onComplete` for auto-scroll timing

---

## Definition of Done

- [ ] Card deal springs into 3x2 grid with stagger
- [ ] Card selection scales/elevates with feedback
- [ ] Card play triggers Override Slot fill animation
- [ ] Zone 2 content swaps smoothly (slots ↔ preview)
- [ ] Verdict TierBadge zooms in from bottom
- [ ] BeliefBar animates in Advanced mode only
- [ ] Mini mode skips hidden element animations
- [ ] Reduced motion respected (instant transitions)
- [ ] All animations killable on interrupt

---

## Log

### Change Log
- 2026-01-29 [Planner] Updated for panel layout (chat-style → panel-based, StoryStrip → OverrideSequence)
- 2026-01-28 [Planner] Created for V5

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
