# Task 004: HUD Components (V5)

**Status:** backlog
**Assignee:** -
**Blocked By:** 002
**Phase:** Components
**Complexity:** S
**Depends On:** 002
**Implements:** R4.1, R4.2, R4.3

---

## Objective

Create V5 HUD components: BeliefBar, TurnsDisplay, and KOA bark area.

---

## Context

V5 HUD shows game progress. In Mini mode, BeliefBar is hidden. In Advanced mode, it shows belief value and target. TurnsDisplay always shows "Turn X/3".

### Relevant Files
- `_process/v5-design/impo/koa-mini-spec.md` — Mini vs Advanced differences
- `_process/context/v5-design-context.md` — V5 mechanics

### Embedded Context

**V5 HUD Layout:**
```
┌─────────────────────────────────────────┐
│  Turn 2/3              [BeliefBar: 58]  │  ← Advanced mode
│  Turn 2/3                               │  ← Mini mode (no bar)
└─────────────────────────────────────────┘
```

**BeliefBar Visibility by Mode:**
```typescript
// Mini: Hidden completely
// Advanced: Shows current belief and target
<BeliefBar current={58} target={65} visible={$mode === 'advanced'} />
```

**Belief Scoring:**
- Truth card: +strength
- Lie card: -(strength - 1)
- Type tax: -2 if same evidenceType as previous card
- Objection Stand By: +2 (truth) or -4 (lie)
- Objection Withdraw: -2

**TurnsDisplay:**
```svelte
<span class="turns-display">Turn {turnsPlayed}/3</span>
```

**Bark Area:**
```svelte
<div class="bark-area">
  {#if currentBark}
    <p class="koa-bark">{currentBark}</p>
  {/if}
</div>
```

---

## Acceptance Criteria

### AC-1: BeliefBar Renders ← R4.1
- **Given:** Game in progress with belief = 58, target = 65
- **When:** HUD renders in Advanced mode
- **Then:** BeliefBar shows fill at 58%, target marker at 65%
- **Test Type:** component

### AC-2: BeliefBar Hidden in Mini ← R4.1
- **Given:** Mode = 'mini'
- **When:** HUD renders
- **Then:** BeliefBar not visible
- **Test Type:** component

### AC-3: TurnsDisplay ← R4.2
- **Given:** Game on turn 2
- **When:** HUD renders
- **Then:** Shows "Turn 2/3"
- **Test Type:** component

### AC-4: Bark Area ← R4.3
- **Given:** KOA has something to say
- **When:** Bark triggered
- **Then:** Bark text appears in bark area with fade animation
- **Test Type:** component

### Edge Cases

#### EC-1: Belief Clamped
- **Scenario:** Belief would go below 0 or above 100
- **Expected:** Bar clamps to 0-100 range

#### EC-2: No Bark
- **Scenario:** No current bark
- **Expected:** Bark area empty but still reserves space

---

## Scope

### In Scope
- BeliefBar component with mode awareness
- TurnsDisplay component
- BarkArea component
- D27 color tokens for styling

### Out of Scope
- Belief animations (Task 009)
- Actual bark content selection (Task banter system)

---

## Implementation Hints

1. Use CSS custom properties for bar colors
2. Subscribe to mode store for visibility
3. BeliefBar should animate smoothly (GSAP in Task 009)

---

## Definition of Done

- [ ] BeliefBar renders correctly in Advanced mode
- [ ] BeliefBar hidden in Mini mode
- [ ] TurnsDisplay shows correct turn
- [ ] BarkArea displays barks
- [ ] All tests pass

---

## Log

### Change Log
- 2026-01-28 [Planner] Created for V5 (BeliefBar, not ResistanceBar)

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
