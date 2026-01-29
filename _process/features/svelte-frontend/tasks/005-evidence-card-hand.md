# Task 005: EvidenceCard + Hand

**Status:** backlog
**Assignee:** -
**Blocked By:** 002
**Phase:** Components
**Complexity:** M
**Depends On:** 002
**Implements:** R5.1, R5.2, R5.3, R5.4

---

## Objective

Create EvidenceCard component and Hand display for V5 single-card-per-turn gameplay.

---

## Context

V5 uses single card selection per turn (not batch). Player selects one card from hand and plays it. Type tax warning shown when selecting same evidenceType as last played.

### Relevant Files
- `packages/engine-core/src/types/v5/card.ts` — V5 Card type
- `_process/v5-design/impo/koa-mini-spec.md` — Card display rules
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` — Animation timing

### Embedded Context

**V5 Card Type:**
```typescript
interface Card {
  id: CardId;
  strength: number;         // 1-5
  evidenceType: EvidenceType; // DIGITAL | PHYSICAL | TESTIMONY | SENSOR
  location: string;
  time: string;
  claim: string;            // What the evidence claims
  presentLine: string;      // What player says when presenting
  isLie: boolean;           // Hidden from player
}
```

**Card Display (face up):**
```
┌─────────────────────────┐
│ ★★★☆☆          DIGITAL │  ← strength + type
├─────────────────────────┤
│                         │
│  "Security footage      │
│   shows suspect at      │  ← claim
│   12:45 AM"             │
│                         │
├─────────────────────────┤
│ 📍 Main Lobby           │  ← location
│ 🕐 12:45 AM             │  ← time
└─────────────────────────┘
```

**Hand Layout (3-4 cards):**
```
┌─────────────────────────────────────────┐
│   [Card 1]   [Card 2]   [Card 3]       │
│              ↑ selected                 │
└─────────────────────────────────────────┘
```

**Type Tax Warning:**
```svelte
{#if wouldTriggerTypeTax(card, lastPlayedType)}
  <span class="type-tax-warning">-2 (same type)</span>
{/if}
```

---

## Acceptance Criteria

### AC-1: Card Renders V5 Fields ← R5.1
- **Given:** V5 Card data
- **When:** EvidenceCard renders
- **Then:** Shows strength stars, evidenceType, claim, location, time
- **Test Type:** component

### AC-2: Single Selection ← R5.2
- **Given:** Hand with 3 cards
- **When:** Player taps card A, then card B
- **Then:** Only card B is selected (not both)
- **Test Type:** component

### AC-3: Card Play on Confirm ← R5.2
- **Given:** Card selected
- **When:** Player taps selected card again (or play button)
- **Then:** Card is played, removed from hand, added to played area
- **Test Type:** integration

### AC-4: Type Tax Warning ← R5.3
- **Given:** Last played card was DIGITAL
- **When:** Player hovers/selects another DIGITAL card
- **Then:** Shows "-2 (same type)" warning
- **Test Type:** component

### AC-5: Selection Visual Feedback ← R5.2
- **Given:** Card in hand
- **When:** Player selects it
- **Then:** Card scales up, gets glow effect
- **Test Type:** component

### Edge Cases

#### EC-1: Single Card Remaining
- **Scenario:** Only 1 card left in hand
- **Expected:** Card auto-selected, tap to play

#### EC-2: First Turn (No Type Tax)
- **Scenario:** First card being played
- **Expected:** No type tax warning ever shown

---

## Scope

### In Scope
- EvidenceCard component (V5 fields)
- Hand container component
- Single card selection logic
- Type tax warning display
- Visual selection state

### Out of Scope
- Card animations (Task 009)
- Played cards area (part of Run Screen)

---

## Implementation Hints

1. Use CSS transform for selection scale
2. Track lastPlayedType from game state
3. "Double tap to play" or dedicated play button

---

## Definition of Done

- [ ] EvidenceCard shows all V5 fields
- [ ] Single selection works correctly
- [ ] Type tax warning appears appropriately
- [ ] Card can be played
- [ ] All tests pass

---

## Log

### Change Log
- 2026-01-28 [Planner] Created for V5 (single selection, type tax)

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
