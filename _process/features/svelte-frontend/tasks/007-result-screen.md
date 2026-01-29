# Task 007: Result Screen

**Status:** backlog
**Assignee:** -
**Blocked By:** 002
**Phase:** Gameplay
**Complexity:** M
**Depends On:** 002
**Implements:** R3.3

---

## Objective

Create Result Screen showing verdict, tier, and card reveal after game ends.

---

## Context

After turn 3, the game ends and Result Screen shows the outcome. The tier (FLAWLESS/CLEARED/CLOSE/BUSTED) is determined by final belief vs target.

### Relevant Files
- `packages/engine-core/src/resolver/v5/` — getVerdict, Tier types
- `_process/v5-design/impo/koa-mini-spec.md` — Tier definitions
- `_process/context/v5-design-context.md` — Verdict calculation

### Embedded Context

**V5 Tiers:**
```typescript
type Tier = 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED';

// FLAWLESS: belief >= target + 10 AND no lies played
// CLEARED: belief >= target
// CLOSE: belief >= target - 10 (partial success)
// BUSTED: belief < target - 10
```

**Result Screen Layout:**
```
┌─────────────────────────────────────────┐
│              [KOA Avatar]               │
│           (mood based on tier)          │
├─────────────────────────────────────────┤
│                                         │
│            ★ CLEARED ★                  │  ← Tier badge
│                                         │
│        Final Belief: 68 / 65            │
│                                         │
├─────────────────────────────────────────┤
│           Cards You Played:             │
│                                         │
│  [Card 1 ✓]  [Card 2 ✓]  [Card 3 ✗]    │
│   (truth)     (truth)     (LIE!)        │  ← Reveals
│                                         │
├─────────────────────────────────────────┤
│         [ PLAY AGAIN ]                  │
└─────────────────────────────────────────┘
```

**Verdict Data:**
```typescript
interface VerdictData {
  tier: Tier;
  finalBelief: number;
  target: number;
  liesPlayed: Card[];
  truthsPlayed: Card[];
}
```

---

## Acceptance Criteria

### AC-1: Tier Display ← R3.3
- **Given:** Game ended with belief = 68, target = 65
- **When:** Result Screen renders
- **Then:** Shows "CLEARED" tier with appropriate styling
- **Test Type:** component

### AC-2: Belief Summary ← R3.3
- **Given:** Game ended
- **When:** Result Screen renders
- **Then:** Shows final belief and target values
- **Test Type:** component

### AC-3: Card Reveal ← R3.3
- **Given:** Player played 3 cards (2 truths, 1 lie)
- **When:** Result Screen renders
- **Then:** All cards shown with truth/lie status revealed
- **Test Type:** component

### AC-4: Play Again ← R3.3
- **Given:** Result displayed
- **When:** Player taps "Play Again"
- **Then:** Game resets, navigates to Home Screen
- **Test Type:** integration

### Edge Cases

#### EC-1: FLAWLESS (No Lies)
- **Scenario:** All cards were truths, belief > target + 10
- **Expected:** FLAWLESS tier, special celebration

---

## Scope

### In Scope
- Result Screen layout
- Tier display with styling
- Belief summary
- Card reveal section
- Play again navigation

### Out of Scope
- Win/loss animations (Task 009)
- KOA Avatar moods (Task 012)

---

## Implementation Hints

1. Get verdict from gameStore derived state
2. Use tier-specific CSS classes for styling
3. Reveal animation can be simple (flip or fade)

---

## Definition of Done

- [ ] Tier displays correctly for all tiers
- [ ] Belief summary shows final/target
- [ ] Cards revealed with truth/lie status
- [ ] Play again works
- [ ] All tests pass

---

## Log

### Change Log
- 2026-01-28 [Planner] Created for V5

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
