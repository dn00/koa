# Task 007: Verdict + Share Screen

**Status:** backlog
**Assignee:** -
**Blocked By:** 005, 012
**Phase:** Gameplay
**Complexity:** M
**Depends On:** 005, 012
**Implements:** R3.4, R3.5, R9.1, R9.2, R9.3, R9.4, R9.5

---

## Objective

Create Verdict Screen showing tier badge, played cards with lie reveal, contradictions, and ShareCard artifact generation.

---

## Context

After turn 3, the game ends and Result Screen shows the outcome. The tier (FLAWLESS/CLEARED/CLOSE/BUSTED) is determined by final belief vs target.

### Relevant Files
- `mockups/mockup-brutalist.zip` → `components/KoaMiniPage.tsx` (VERDICT view lines 447-463)
- `mockups/mockup-brutalist.zip` → `components/KoaMiniComponents.tsx` (TierBadge, VerdictLine, etc.)
- `packages/engine-core/src/resolver/v5/` — getVerdict, Tier types

### Embedded Context

**V5 Tiers:**
```typescript
type Tier = 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED';

// FLAWLESS: belief >= target + 10 AND no lies played
// CLEARED: belief >= target
// CLOSE: belief >= target - 10 (partial success)
// BUSTED: belief < target - 10
```

**Verdict Screen Layout (from KoaMiniPage mockup):**
```
┌─────────────────────────────────────────┐
│          [TierBadge: CLEARED]           │  ← Large, centered
├─────────────────────────────────────────┤
│   "Fine. I will allow it this once."    │  ← VerdictLine (KOA quote)
├─────────────────────────────────────────┤
│   [Card ✓]  [Card ✓]  [Card ✗]         │  ← PlayedCardsSummary
│    truth     truth     LIE              │
├─────────────────────────────────────────┤
│   ContradictionBlock:                   │  ← Only if lies detected
│   "The Cat" contradicts baseline data   │
├─────────────────────────────────────────┤
│            [ SHARE ]                    │  ← ShareButton
└─────────────────────────────────────────┘
```

**Note:** In Mini mode, belief numbers are hidden. Only tier, quote, cards, and contradictions shown.

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

### AC-2: Belief Summary (Advanced Only) ← R3.4
- **Given:** Mode is 'advanced', game ended
- **When:** Verdict Screen renders
- **Then:** Shows final belief and target values
- **And:** Hidden in Mini mode
- **Test Type:** component

### AC-3: Card Reveal ← R3.3
- **Given:** Player played 3 cards (2 truths, 1 lie)
- **When:** Result Screen renders
- **Then:** All cards shown with truth/lie status revealed
- **Test Type:** component

### AC-4: Play Again ← R3.4
- **Given:** Result displayed
- **When:** Player taps "Play Again"
- **Then:** Game resets, navigates to Home Screen
- **Test Type:** integration

### AC-5: Contradiction Display ← R9.4
- **Given:** Player played lies
- **When:** Verdict Screen renders
- **Then:** ContradictionBlock shows why each lie was detected
- **Test Type:** component

### AC-6: ShareCard Generation ← R9.5
- **Given:** Verdict displayed
- **When:** Player taps "Share"
- **Then:** ShareCard artifact generated with day, results, tier, KOA quote
- **Test Type:** integration

### AC-7: VerdictLine Quote ← R9.2
- **Given:** Game ended
- **When:** Verdict Screen renders
- **Then:** KOA quote displays based on tier (e.g., "I'll allow it... this time.")
- **Test Type:** component

### Edge Cases

#### EC-1: FLAWLESS (No Lies)
- **Scenario:** All cards were truths, belief > target + 10
- **Expected:** FLAWLESS tier, special celebration

---

## Scope

### In Scope
- Verdict Screen layout (VERDICT + SHARE phases)
- TierBadge component (BUSTED/CLOSE/CLEARED/FLAWLESS)
- VerdictLine component (KOA quote)
- PlayedCardsSummary with lie markers (✓/✗)
- ContradictionBlock (why lies were lies)
- ShareButton + ShareCard artifact generation
- Play again navigation

### Out of Scope
- Win/loss animations (Task 009)
- KOA Avatar integration (Task 012 provides component)

---

## Implementation Hints

1. Get verdict from gameStore derived state
2. Use tier-specific CSS classes for styling
3. Reveal animation can be simple (flip or fade)

---

## Definition of Done

- [ ] TierBadge displays correctly for all 4 tiers
- [ ] VerdictLine shows tier-appropriate KOA quote
- [ ] PlayedCardsSummary shows all cards with ✓/✗ markers
- [ ] ContradictionBlock explains each detected lie
- [ ] ShareButton triggers ShareCard generation
- [ ] ShareCard contains day, results array, tier, quote
- [ ] Play again navigates to Home
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
