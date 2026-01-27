# Task 008: Concern Fulfillment Tracking

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Engine
**Complexity:** S
**Depends On:** 002
**Implements:** R4.3, R4.4, R4.5

---

## Objective

Implement concern fulfillment tracking: determine which Concerns are addressed when cards are submitted, and verify all Concerns are met for a win condition.

---

## Context

Concerns are proof requirements that KOA asks for. Each puzzle has 2-4 Concerns (e.g., "Prove you're you" = IDENTITY). Players must address ALL Concerns to win, in addition to reducing Resistance to 0.

### Relevant Files
- `packages/engine-core/src/resolver/concern.ts` (to create)
- Depends on: `packages/engine-core/src/types/`

### Embedded Context

**Concern Rules (from D24, D31):**
- Each Concern has `requiredProof` (ProofType[])
- Card with matching `proves` field addresses the Concern
- Win requires Resistance ≤ 0 AND all Concerns addressed

**Example:**
```
Concern: { type: 'IDENTITY', requiredProof: ['IDENTITY'] }
Card: { proves: ['IDENTITY', 'LOCATION'], ... }
Result: Card addresses IDENTITY concern
```

**Source Docs:**
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Concerns system (2.2)
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` - Concern types

---

## Acceptance Criteria

### AC-1: Card Addresses Concern <- R4.3
- **Given:** Concern requires IDENTITY, card proves IDENTITY
- **When:** cardAddressesConcern(card, concern) is called
- **Then:** Returns true
- **Test Type:** unit

### AC-2: Card Does Not Address <- R4.3
- **Given:** Concern requires IDENTITY, card proves LOCATION only
- **When:** cardAddressesConcern(card, concern) is called
- **Then:** Returns false
- **Test Type:** unit

### AC-3: Multi-Proof Card <- R4.3
- **Given:** Card proves [IDENTITY, LOCATION], concern requires IDENTITY
- **When:** cardAddressesConcern(card, concern) is called
- **Then:** Returns true
- **Test Type:** unit

### AC-4: Find Addressed Concerns <- R4.4
- **Given:** Submission with 2 cards, 3 concerns
- **When:** findAddressedConcerns(cards, concerns) is called
- **Then:** Returns list of concern IDs that were addressed
- **Test Type:** unit

### AC-5: All Concerns Addressed <- R4.5
- **Given:** 3 concerns, all addressed by committed story
- **When:** allConcernsAddressed(concerns, committedStory) is called
- **Then:** Returns true
- **Test Type:** unit

### AC-6: Some Concerns Not Addressed <- R4.5
- **Given:** 3 concerns, only 2 addressed
- **When:** allConcernsAddressed(concerns, committedStory) is called
- **Then:** Returns false
- **Test Type:** unit

### AC-7: Update Concern Status <- R4.4
- **Given:** Concerns list and new addressed IDs
- **When:** updateConcernStatus(concerns, addressedIds) is called
- **Then:** Returns concerns with addressed = true for matched IDs
- **Test Type:** unit

### Edge Cases

#### EC-1: Already Addressed Concern
- **Scenario:** Card addresses concern already addressed in previous turn
- **Expected:** No change (still addressed, no double-count)

#### EC-2: One Card Multiple Concerns
- **Scenario:** Card proves [IDENTITY, LOCATION], puzzle has both concerns
- **Expected:** Both concerns addressed by single card

#### EC-3: No Cards
- **Scenario:** Empty submission
- **Expected:** No concerns addressed

### Error Cases

None - type system catches invalid input.

---

## Scope

### In Scope
- `cardAddressesConcern(card: EvidenceCard, concern: Concern): boolean`
- `findAddressedConcerns(cards: EvidenceCard[], concerns: Concern[]): ConcernId[]`
- `allConcernsAddressed(concerns: Concern[], committedStory: EvidenceCard[]): boolean`
- `updateConcernStatus(concerns: Concern[], addressedIds: ConcernId[]): Concern[]`

### Out of Scope
- Win condition checking (Task 009)
- UI display of concern status (Task 017)

---

## Implementation Hints

```typescript
export function cardAddressesConcern(
  card: EvidenceCard,
  concern: Concern
): boolean {
  return concern.requiredProof.some(proof =>
    card.proves.includes(proof)
  );
}

export function findAddressedConcerns(
  cards: readonly EvidenceCard[],
  concerns: readonly Concern[]
): ConcernId[] {
  const addressed: ConcernId[] = [];

  for (const concern of concerns) {
    if (concern.addressed) continue; // Already done

    const isAddressed = cards.some(card =>
      cardAddressesConcern(card, concern)
    );

    if (isAddressed) {
      addressed.push(concern.id);
    }
  }

  return addressed;
}

export function allConcernsAddressed(
  concerns: readonly Concern[],
  committedStory: readonly EvidenceCard[]
): boolean {
  return concerns.every(concern =>
    concern.addressed ||
    committedStory.some(card => cardAddressesConcern(card, concern))
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

**Context:** Half of the win condition - must address all concerns.
**Decisions:**
- Check against committed story (cumulative)
- Immutable updates to concern status
- One card can address multiple concerns
**Questions for Implementer:**
- Should we track which card addressed which concern?

### Implementation Notes
> Written by Implementer

**Approach:** Implemented all missing functions per spec
**Decisions:**
- `allConcernsAddressed()` checks both pre-addressed and newly addressed concerns
- `updateConcernStatus()` is immutable - returns new array
- Existing `checkSubmissionConcernsFulfilled()` kept alongside new functions
**Deviations:** None
**Files Changed:**
- `packages/engine-core/src/resolver/concerns.ts`
- `packages/engine-core/src/resolver/index.ts` (exports)
- `packages/engine-core/tests/resolver/concerns.test.ts`
**Test Count:** 7 ACs + 3 ECs + 0 ERR = 29 tests
**Gotchas:** None

### Review Notes
> Written by Reviewer

**Verdict:** PASS
**Date:** 2026-01-26 (Re-review after fixes)

**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | Card Addresses Concern | ✓ |
| AC-2 | Card Does Not Address | ✓ |
| AC-3 | Multi-Proof Card | ✓ |
| AC-4 | Find Addressed Concerns | ✓ |
| AC-5 | All Concerns Addressed | ✓ |
| AC-6 | Some Concerns Not Addressed | ✓ |
| AC-7 | Update Concern Status | ✓ |
| EC-1 | Already Addressed Concern | ✓ |
| EC-2 | One Card Multiple Concerns | ✓ |
| EC-3 | No Cards | ✓ |

**Fixes Applied:**
- `allConcernsAddressed()` implemented per AC-5
- `updateConcernStatus()` implemented per AC-7 (immutable)
- 29 tests passing

**What's Good:**
- ALERTNESS state check (AWAKE/ALERT/ACTIVE requirement)
- Case-insensitive state matching
- Clean separation of single-card vs submission checking

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
