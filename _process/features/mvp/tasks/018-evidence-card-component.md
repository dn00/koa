# Task 018: Evidence Card Component

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** UI Layer
**Complexity:** S
**Depends On:** 002
**Implements:** R3.1 (part of)

---

## Objective

Implement the EvidenceCard component that displays card info (power, proves, claims, source) and handles selection state for submissions.

---

## Context

Evidence cards are the player's primary tool. Each card shows its power, what it proves, and what claims it makes. Players select 1-3 cards to submit each turn.

### Relevant Files
- `packages/app/src/components/cards/EvidenceCard.tsx` (to create)
- Reference: `docs/_archive/mockups/d31-mockup-extracted/src/components/EvidenceCard.tsx`

### Embedded Context

**Card Display Elements:**
- Power value (number badge)
- Proof types (icons or labels: IDENTITY, ALERTNESS, etc.)
- Source (where evidence came from)
- Claims (optional display)
- Selection state (selected/unselected)

**Selection Behavior:**
- Tap to select/deselect
- Max 3 cards selected
- Visual feedback on selection

**Source Docs:**
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` - Card properties
- `docs/D14-UX-WIREFRAME-SPEC.md` - Card wireframes

---

## Acceptance Criteria

### AC-1: Card Displays Power <- R3.1
- **Given:** Card with power 8
- **When:** EvidenceCard rendered
- **Then:** Shows "8" prominently
- **Test Type:** unit

### AC-2: Card Displays Proof Types <- R3.1
- **Given:** Card proves [IDENTITY, LOCATION]
- **When:** EvidenceCard rendered
- **Then:** Shows IDENTITY and LOCATION indicators
- **Test Type:** unit

### AC-3: Card Displays Source <- R3.1
- **Given:** Card with source "Security Camera"
- **When:** EvidenceCard rendered
- **Then:** Shows source label
- **Test Type:** unit

### AC-4: Selection State <- R3.1
- **Given:** Card is selected
- **When:** EvidenceCard rendered with selected=true
- **Then:** Shows selected visual state (border, highlight)
- **Test Type:** unit

### AC-5: Tap to Toggle <- R3.1
- **Given:** Card displayed
- **When:** Card tapped
- **Then:** onSelect callback fired with card ID
- **Test Type:** unit

### AC-6: Disabled State <- R3.1
- **Given:** Card already in committed story
- **When:** EvidenceCard rendered with disabled=true
- **Then:** Shows disabled state, tap does nothing
- **Test Type:** unit

### AC-7: Refutation Badge <- R6.1
- **Given:** Card has refutes property
- **When:** EvidenceCard rendered
- **Then:** Shows refutation indicator
- **Test Type:** unit

### AC-8: Touch-Friendly Size <- (UX)
- **Given:** Mobile device
- **When:** Card displayed
- **Then:** Card is at least 44x44px touch target
- **Test Type:** visual

### Edge Cases

#### EC-1: Long Source Name
- **Scenario:** Source is "Extremely Long Source Name Here"
- **Expected:** Text truncates or wraps gracefully

#### EC-2: Many Proof Types
- **Scenario:** Card proves 3+ types
- **Expected:** All shown (possibly smaller icons)

### Error Cases

None - display component.

---

## Scope

### In Scope
- EvidenceCard component
- Display: power, proves, source, claims (optional)
- Selection state (visual)
- Tap handler
- Disabled state
- Refutation badge

### Out of Scope
- Selection logic (parent manages)
- Card data fetching
- Animations (nice-to-have)

---

## Implementation Hints

```tsx
interface EvidenceCardProps {
  card: EvidenceCard;
  selected: boolean;
  disabled?: boolean;
  onSelect: (cardId: string) => void;
}

function EvidenceCard({ card, selected, disabled, onSelect }: EvidenceCardProps) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onSelect(card.id);
    }
  }, [card.id, disabled, onSelect]);

  return (
    <button
      className={cn(
        'evidence-card',
        selected && 'evidence-card--selected',
        disabled && 'evidence-card--disabled'
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      <div className="evidence-card__power">{card.power}</div>

      <div className="evidence-card__proves">
        {card.proves.map(proof => (
          <ProofIcon key={proof} type={proof} />
        ))}
      </div>

      <div className="evidence-card__source">{card.source}</div>

      {card.refutes && (
        <div className="evidence-card__refute-badge">Refutes</div>
      )}
    </button>
  );
}
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No project doc violations
- [ ] Types are correct (no `any`)
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Core interactive element - must be clear and responsive.
**Decisions:**
- Button element for accessibility
- Selection state managed by parent
- Show refutation badge if card refutes counters
**Questions for Implementer:**
- Icon set for proof types?
- Animation on selection?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:**
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | | |
| AC-2 | | |
| AC-3 | | |
| AC-4 | | |
| AC-5 | | |
| AC-6 | | |
| AC-7 | | |
| AC-8 | | |
**Issues:**
**Suggestions:**

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
