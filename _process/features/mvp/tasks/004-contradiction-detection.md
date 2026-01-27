# Task 004: Contradiction Detection

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Engine
**Complexity:** M
**Depends On:** 002
**Implements:** R7.1, R7.2, R7.3, R7.4, R7.5

---

## Objective

Implement contradiction detection between cards based on their claims (location, state, time). Return NONE, MINOR, or MAJOR severity. This is core to the alibi-building mechanic.

---

## Context

Players build a timeline by submitting evidence cards. Cards make claims about where the player was, what state they were in, and when. Contradictions occur when claims are incompatible.

**Severity levels:**
- NONE: No conflict
- MINOR: Suspicious but allowed (+1 scrutiny)
- MAJOR: Impossible combination (submission blocked)

### Relevant Files
- `packages/engine-core/src/resolver/contradiction.ts` (to create)
- Depends on: `packages/engine-core/src/types/`

### Embedded Context

**Contradiction Rules (from D31, D03):**

**Time Gap Rules:**
- ASLEEP → AWAKE in <3 minutes = MAJOR (can't wake that fast)
- HOME → GYM in <20 minutes = MAJOR (can't travel that fast)

**State Conflicts:**
- ASLEEP and AWAKE overlapping = MAJOR
- HOME and GYM overlapping = MAJOR

**Minor Contradictions:**
- Time gaps that are tight but possible
- Different activities that could coexist

**Invariant I1 - Determinism:**
- Time comparisons must use consistent units (minutes)
- No floating point math

**Source Docs:**
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` - Contradiction rules
- `docs/D03-DETERMINISTIC-RESOLVER-SPEC.md` - Severity levels

---

## Acceptance Criteria

### AC-1: ContradictionSeverity Enum <- R7.2, R7.3
- **Given:** Need to classify contradictions
- **When:** ContradictionSeverity is defined
- **Then:** Contains NONE, MINOR, MAJOR
- **Test Type:** unit

### AC-2: No Contradiction <- R7.1
- **Given:** Two cards with compatible claims (HOME at 8am, HOME at 9am)
- **When:** detectContradiction(card1, card2) is called
- **Then:** Returns NONE
- **Test Type:** unit

### AC-3: State Transition Too Fast <- R7.4
- **Given:** Card1 claims ASLEEP 2:00-2:05am, Card2 claims AWAKE 2:02-2:10am
- **When:** detectContradiction(card1, card2) is called
- **Then:** Returns MAJOR (overlap with incompatible states)
- **Test Type:** unit

### AC-4: Location Transition Too Fast <- R7.5
- **Given:** Card1 claims HOME at 8:00am, Card2 claims GYM at 8:10am
- **When:** detectContradiction(card1, card2) is called
- **Then:** Returns MAJOR (<20 min travel)
- **Test Type:** unit

### AC-5: Location Transition Allowed <- R7.5
- **Given:** Card1 claims HOME at 8:00am, Card2 claims GYM at 8:30am
- **When:** detectContradiction(card1, card2) is called
- **Then:** Returns NONE (30 min > 20 min threshold)
- **Test Type:** unit

### AC-6: Tight But Possible <- R7.2
- **Given:** Card1 claims activity X at 8:00am, Card2 claims activity Y at 8:05am
- **When:** detectContradiction(card1, card2) is called
- **Then:** Returns MINOR (suspicious but allowed)
- **Test Type:** unit

### AC-7: Check Against Committed Story <- R7.1
- **Given:** A new card and a list of committed story cards
- **When:** checkContradictions(newCard, committedStory) is called
- **Then:** Returns worst severity found (MAJOR > MINOR > NONE)
- **Test Type:** unit

### Edge Cases

#### EC-1: Card With No Claims
- **Scenario:** Card has empty claims object
- **Expected:** Returns NONE (no claims to contradict)

#### EC-2: Same Card
- **Scenario:** Checking card against itself
- **Expected:** Returns NONE (or skip)

#### EC-3: Only One Claim Type
- **Scenario:** Card1 has location, Card2 has state (no overlap)
- **Expected:** Returns NONE

### Error Cases

#### ERR-1: Invalid Time Format
- **When:** Time range is malformed
- **Then:** Return error result
- **Error Message:** "Invalid time range format"

---

## Scope

### In Scope
- `detectContradiction(card1, card2): ContradictionSeverity`
- `checkContradictions(newCard, committedStory): ContradictionSeverity`
- Time gap calculations
- State conflict detection
- Location conflict detection

### Out of Scope
- Scrutiny increment (Task 010)
- Blocking submission on MAJOR (Task 019)
- UI warning display (Task 019)

---

## Implementation Hints

```typescript
const STATE_CONFLICTS = new Map([
  ['ASLEEP', 'AWAKE'],
  ['HOME', 'GYM'],
  // ...
]);

const MIN_TRAVEL_MINUTES = 20;
const MIN_WAKE_MINUTES = 3;

function timeGapMinutes(range1: TimeRange, range2: TimeRange): number {
  // Calculate gap between ranges
}

function rangesOverlap(range1: TimeRange, range2: TimeRange): boolean {
  // Check if time ranges overlap
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

**Context:** Core mechanic - builds tension and requires strategic thinking.
**Decisions:**
- Start with simple rules (state, location, time gap)
- Return worst severity when checking against story
- Consider adding more conflict types later
**Questions for Implementer:**
- How to represent time (minutes since midnight, Date objects, strings)?
- Should conflict rules be configurable or hardcoded?

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
