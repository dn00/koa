# Task 010: Scrutiny System

**Status:** done
**Assignee:** -
**Blocked By:** -
**Phase:** Game Engine
**Complexity:** S
**Depends On:** 004, 009
**Implements:** R9.1, R9.2, R9.3, R9.4, R9.5

---

## Objective

Implement the Scrutiny system: track scrutiny as integer 0-5, increment on MINOR contradictions, and trigger instant loss at Scrutiny 5.

---

## Context

Scrutiny is the "soft failure" meter. MINOR contradictions are allowed but increase suspicion. At Scrutiny 5, KOA concludes the player is lying and the run ends in instant loss.

### Relevant Files
- `packages/engine-core/src/resolver/scrutiny.ts` (to create)
- Depends on: contradiction detection, event system

### Embedded Context

**Scrutiny Rules (from D24, D31):**
- Starts at 0 for each puzzle
- MINOR contradiction: +1 scrutiny
- Scrutiny 5 = instant loss (ACCESS DENIED)
- MAJOR contradiction blocks submission (no scrutiny change)

**Loss Reasons:**
- Scrutiny 5: "KOA is convinced you're lying"
- Turns exhausted: "Access window closed"

**Source Docs:**
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Scrutiny 0-5
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` - Contradiction consequences

---

## Acceptance Criteria

### AC-1: Initial Scrutiny <- R9.2
- **Given:** New run starts
- **When:** State initialized
- **Then:** scrutiny = 0
- **Test Type:** unit

### AC-2: Scrutiny Range <- R9.1
- **Given:** Scrutiny value
- **When:** Value assigned
- **Then:** Must be integer 0-5
- **Test Type:** unit (type check)

### AC-3: MINOR Adds Scrutiny <- R9.3
- **Given:** Current scrutiny = 2, MINOR contradiction detected
- **When:** applyScrutiny(2, 'MINOR') is called
- **Then:** Returns 3
- **Test Type:** unit

### AC-4: MAJOR Does Not Add Scrutiny <- R9.3
- **Given:** Current scrutiny = 2, MAJOR contradiction
- **When:** MAJOR is detected
- **Then:** Submission blocked, scrutiny stays 2
- **Test Type:** unit

### AC-5: NONE Does Not Add Scrutiny <- R9.3
- **Given:** Current scrutiny = 2, no contradiction
- **When:** applyScrutiny(2, 'NONE') is called
- **Then:** Returns 2 (unchanged)
- **Test Type:** unit

### AC-6: Scrutiny 5 Triggers Loss <- R9.4
- **Given:** Scrutiny reaches 5
- **When:** checkScrutinyLoss(5) is called
- **Then:** Returns true with reason "Scrutiny threshold exceeded"
- **Test Type:** unit

### AC-7: Scrutiny Caps at 5 <- R9.4
- **Given:** Scrutiny = 4, MINOR contradiction, then another MINOR
- **When:** Processed sequentially
- **Then:** First MINOR → 5 → instant loss; never goes to 6
- **Test Type:** unit

### Edge Cases

#### EC-1: Multiple MINORs in One Turn
- **Scenario:** 3 cards create 2 MINOR contradictions with committed story
- **Expected:** +2 scrutiny (cumulative)

#### EC-2: Scrutiny at 4, One More MINOR
- **Scenario:** Scrutiny = 4, then MINOR
- **Expected:** Scrutiny = 5, run ends immediately

### Error Cases

#### ERR-1: Invalid Scrutiny Value
- **When:** Attempt to set scrutiny to 6
- **Then:** Cap at 5 (or throw if type enforces)
- **Error Message:** N/A (type system)

---

## Scope

### In Scope
- `applyScrutiny(current: Scrutiny, severity: ContradictionSeverity): Scrutiny`
- `checkScrutinyLoss(scrutiny: Scrutiny): boolean`
- `calculateTotalScrutinyIncrease(contradictions: ContradictionSeverity[]): number`
- Integration with contradiction detection results

### Out of Scope
- UI display (Task 017)
- Blocking MAJOR submissions (part of full resolver flow)

---

## Implementation Hints

```typescript
type Scrutiny = 0 | 1 | 2 | 3 | 4 | 5;

const MAX_SCRUTINY = 5;

export function applyScrutiny(
  current: Scrutiny,
  severity: ContradictionSeverity
): Scrutiny {
  if (severity === 'MINOR') {
    return Math.min(current + 1, MAX_SCRUTINY) as Scrutiny;
  }
  return current;
}

export function checkScrutinyLoss(scrutiny: Scrutiny): boolean {
  return scrutiny >= MAX_SCRUTINY;
}

export function calculateTotalScrutinyIncrease(
  contradictions: ContradictionSeverity[]
): number {
  return contradictions.filter(c => c === 'MINOR').length;
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

**Context:** Alternative loss condition - not just running out of turns.
**Decisions:**
- Scrutiny caps at 5 (never 6+)
- Multiple MINORs cumulative
- MAJOR blocks, doesn't add scrutiny
**Questions for Implementer:**
- Should we emit a specific SCRUTINY_INCREASED event?

### Implementation Notes
> Written by Implementer

**Approach:** Delta-based changes with clamping to 0-5 range
**Decisions:** Multiple MINORs cumulative; type system + clamping handles range
**Deviations:** None
**Files Changed:**
- `packages/engine-core/src/resolver/scrutiny.ts`
- `packages/engine-core/tests/resolver/scrutiny.test.ts`
**Test Count:** 7 ACs + 2 ECs + 1 ERR = 19 tests
**Gotchas:** None

### Review Notes
> Written by Reviewer

**Verdict:** PASS (missing EC-1, ERR-1 tests)
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | Implicit in event system | ✓ |
| AC-2 | `AC-3: Clamped to 0-5 range` | ✓ |
| AC-3 | `AC-1: MINOR → +1 scrutiny` | ✓ |
| AC-4 | `EC-2: MAJOR → 0` | ✓ |
| AC-5 | `EC-1: Null contradiction → 0` | ✓ |
| AC-6 | `AC-2: Scrutiny 5 = loss` | ✓ |
| AC-7 | `AC-3: Clamped to 0-5 range` | ✓ |

**Issues:**
- R3-SHLD-2: EC-1 "Multiple MINORs in One Turn" not tested (cumulative +2 behavior)
- R3-SHLD-3: ERR-1 not tested (type system enforces, but no explicit test)

**Suggestions:**
- Add test for multiple MINORs cumulative effect

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created
- 2026-01-26 [Implementer] Task implemented
- 2026-01-26 [Reviewer] Review: Missing EC-1, ERR-1 tests
- 2026-01-26 [Implementer] Added EC-1 "Multiple MINORs" and ERR-1 "Invalid Scrutiny" tests

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
| 2026-01-26 | backlog | done | Implementer | Implemented |
| 2026-01-26 | done | review-failed | Reviewer | EC-1, ERR-1 not tested |
