# Task 007: Refutation Mechanics

**Status:** done
**Assignee:** -
**Blocked By:** -
**Phase:** Game Engine
**Complexity:** S
**Depends On:** 006
**Implements:** R6.1, R6.2, R6.3, R6.4

---

## Objective

Implement refutation: when a player submits a card that refutes a counter, mark the counter as refuted and restore full damage to any previously contested cards.

---

## Context

Refutation is the counterplay to KOA's challenges. Some evidence cards have a `refutes` field listing which counters they can nullify. Once refuted, the counter stays refuted for the rest of the run.

### Relevant Files
- `packages/engine-core/src/resolver/refutation.ts` (to create)
- Depends on: `packages/engine-core/src/types/`, `resolver/contested.ts`

### Embedded Context

**Refutation Rules (from D31):**
- Card with `refutes: ['counter_security_camera']` nullifies that counter
- Refuted counter no longer applies contested penalty
- Refutation is permanent for the run (R6.4)
- Damage is restored retroactively for current submission

**Example (from D31):**
```
Counter: "Security Camera" targets IDENTITY
Refutation Card: "Maintenance Log" refutes "Security Camera"
Result: Security Camera marked refuted, IDENTITY cards deal full damage
```

**Source Docs:**
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` - Refutation rules
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Content requirements (refutableBy)

---

## Acceptance Criteria

### AC-1: Detect Refutation Card <- R6.1
- **Given:** Card has refutes: ['counter_security_camera']
- **When:** canRefute(card, counter) is called with matching counter
- **Then:** Returns true
- **Test Type:** unit

### AC-2: No Refutation Match <- R6.1
- **Given:** Card has refutes: ['counter_gps']
- **When:** canRefute(card, counter) is called with counter_security_camera
- **Then:** Returns false
- **Test Type:** unit

### AC-3: Mark Counter Refuted <- R6.2
- **Given:** Submission contains refutation card
- **When:** applyRefutations(submission, counters) is called
- **Then:** Matching counter has refuted = true
- **Test Type:** unit

### AC-4: Refuted Counter No Penalty <- R6.2
- **Given:** Counter marked as refuted
- **When:** calculateContestedDamage is called
- **Then:** Cards prove IDENTITY deal full damage (no 50% penalty)
- **Test Type:** integration

### AC-5: Damage Restoration <- R6.3
- **Given:** Card1 contested by counter (10 power → 5 damage), Card2 refutes counter
- **When:** Both submitted together
- **Then:** Card1 deals full 10 damage (not 5)
- **Test Type:** unit

### AC-6: Permanent Refutation <- R6.4
- **Given:** Counter refuted in turn 1
- **When:** Turn 2 submission has IDENTITY card
- **Then:** IDENTITY card still deals full damage (counter stays refuted)
- **Test Type:** unit

### AC-7: Return Updated Counters <- R6.2
- **Given:** applyRefutations called
- **When:** Refutation matches
- **Then:** Returns new counters array with refuted = true (immutable update)
- **Test Type:** unit

### Edge Cases

#### EC-1: Card With No Refutes
- **Scenario:** Card has no refutes field
- **Expected:** No refutation detected

#### EC-2: Multiple Refutations
- **Scenario:** Submission contains cards refuting different counters
- **Expected:** All matched counters marked refuted

#### EC-3: Refute Already Refuted
- **Scenario:** Submitting refutation card for already-refuted counter
- **Expected:** No change (already refuted)

### Error Cases

None - invalid input caught by types.

---

## Scope

### In Scope
- `canRefute(card: EvidenceCard, counter: CounterEvidence): boolean`
- `applyRefutations(cards: EvidenceCard[], counters: CounterEvidence[]): CounterEvidence[]`
- Immutable counter updates
- Integration with contested penalty

### Out of Scope
- Voice bark on refutation (Task 024)
- UI indication (Task 019)
- Event logging (part of resolve flow)

---

## Implementation Hints

```typescript
export function canRefute(
  card: EvidenceCard,
  counter: CounterEvidence
): boolean {
  if (!card.refutes) return false;
  return card.refutes.includes(counter.id);
}

export function applyRefutations(
  cards: readonly EvidenceCard[],
  counters: readonly CounterEvidence[]
): CounterEvidence[] {
  return counters.map(counter => {
    if (counter.refuted) return counter; // Already refuted

    const refutedBy = cards.find(card => canRefute(card, counter));
    if (refutedBy) {
      return { ...counter, refuted: true, refutedBy: refutedBy.id };
    }
    return counter;
  });
}

// Full damage calculation with refutation
export function calculateDamageWithRefutation(
  cards: readonly EvidenceCard[],
  counters: readonly CounterEvidence[]
): { damage: number; updatedCounters: CounterEvidence[] } {
  const updatedCounters = applyRefutations(cards, counters);
  const damage = calculateContestedDamage(cards, updatedCounters);
  return { damage, updatedCounters };
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

**Context:** Key strategic mechanic - players can counter KOA's challenges.
**Decisions:**
- Refutation happens before damage calculation
- Immutable updates - return new counters array
- Track refutedBy for event log
**Questions for Implementer:**
- Should refutation restore damage from previous turns, or only current submission?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:** PASS
**Date:** 2026-01-26
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | "Detect refutation cards with matching counter IDs" | ✓ |
| AC-2 | "Return false when no match" | ✓ |
| AC-3 | "Mark counter as refuted" | ✓ |
| AC-4 | "Refuted counters apply no penalty (integration)" | ✓ |
| AC-5 | "Damage restoration when counter refuted" | ✓ |
| AC-6 | "Refutation persists across turns" | ✓ |
| AC-7 | "Immutable updated counters array" | ✓ |
| EC-1 | "Cards without refutes field" | ✓ |
| EC-2 | "Multiple refutations in single submission" | ✓ |
| EC-3 | "Re-refuting already-refuted counter" | ✓ |

**Tests:** 22 passed
**Issues:** None
**Suggestions:** None - clean implementation

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created
- 2026-01-26 [Implementer] Implemented refutation.ts with canRefute, applyRefutations
- 2026-01-26 [Reviewer] Review PASS - all ACs/ECs verified

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
| 2026-01-26 | backlog | done | Implementer | Implemented |
| 2026-01-26 | done | done | Reviewer | Review PASS |
