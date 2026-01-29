# Task 003: Update EvidenceCard Component

**Status:** backlog
**Assignee:** -
**Blocked By:** 001
**Phase:** Phase 1: Type Compilation
**Complexity:** S
**Depends On:** 001
**Implements:** R4.1, R4.2, R4.3, R4.4, R4.5

---

## Objective

Update the EvidenceCard component to display V5 `Card` data instead of MVP `EvidenceCard` data.

---

## Context

MVP `EvidenceCard` has: `id`, `source`, `power`, `proves[]`, `claims`, `refutes`
V5 `Card` has: `id`, `strength`, `evidenceType`, `location`, `time`, `claim`, `presentLine`, `isLie`

### Relevant Files
- `packages/app/src/components/EvidenceCard/EvidenceCard.tsx`
- `packages/engine-core/src/types/v5/card.ts`

### Embedded Context

**V5 Card Interface:**
```typescript
interface Card {
  readonly id: CardId;
  readonly strength: number;  // 1-5
  readonly evidenceType: EvidenceType;  // 'DIGITAL' | 'PHYSICAL' | 'TESTIMONY' | 'SENSOR'
  readonly location: string;
  readonly time: string;
  readonly claim: string;
  readonly presentLine: string;
  readonly isLie: boolean;  // Hidden from player during game
}
```

---

## Acceptance Criteria

### AC-1: Display card.strength ← R4.1
- **Given:** A V5 Card
- **When:** EvidenceCard renders
- **Then:** Shows strength as badge (1-5 scale)
- **Test Type:** unit

### AC-2: Display card.evidenceType ← R4.2
- **Given:** A V5 Card with evidenceType 'DIGITAL'
- **When:** EvidenceCard renders
- **Then:** Shows type as chip/tag
- **Test Type:** unit

### AC-3: Display card.claim ← R4.3
- **Given:** A V5 Card with claim text
- **When:** EvidenceCard renders
- **Then:** Shows claim as main text content
- **Test Type:** unit

### AC-4: Display location and time ← R4.4
- **Given:** A V5 Card with location and time
- **When:** EvidenceCard renders
- **Then:** Shows location and time as metadata
- **Test Type:** unit

### AC-5: No proves/refutes display ← R4.5
- **Given:** Component code
- **When:** Code reviewed
- **Then:** No reference to `proves` or `refutes` fields
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: Card with long claim text
- **Scenario:** Claim is 200+ characters
- **Expected:** Text truncates gracefully with ellipsis
- **Test Type:** unit

#### EC-2: All evidence types render correctly
- **Scenario:** Cards with DIGITAL, PHYSICAL, TESTIMONY, SENSOR
- **Expected:** Each type has distinct visual treatment
- **Test Type:** unit

---

## Scope

### In Scope
- Update props interface to accept `Card`
- Update rendering to use V5 fields
- Remove MVP field references

### Out of Scope
- Styling changes (keep existing visual design)
- isLie display (hidden during gameplay)

---

## Implementation Hints

**Props Change:**
```typescript
// OLD
interface EvidenceCardProps {
  card: EvidenceCard;  // MVP type
  ...
}

// NEW
interface EvidenceCardProps {
  card: Card;  // V5 type
  ...
}
```

**Field Mapping:**
- `card.power` → `card.strength`
- `card.source` → Could use `card.location` or omit
- `card.proves` → Remove
- `card.claims.location` → `card.location`
- `card.claims.timeRange` → `card.time`
- `card.claims.[others]` → `card.claim` (single string now)

---

## Definition of Done

- [ ] Component accepts V5 `Card` type
- [ ] All V5 fields displayed correctly
- [ ] No references to MVP fields
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Card component is widely used - this change unblocks RunScreen and other components.
**Decisions:** Keep existing styling; just change the data mapping.

### Change Log
- 2026-01-28 20:40 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
