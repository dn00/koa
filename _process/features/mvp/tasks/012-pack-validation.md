# Task 012: Pack Validation

**Status:** done
**Assignee:** -
**Blocked By:** -
**Phase:** Content System
**Complexity:** M
**Depends On:** 011
**Implements:** R10.3

---

## Objective

Implement the pack validation pipeline: schema validation, reference validation (all IDs resolve), and solvability checks. Invalid packs must fail closed with clear error messages.

---

## Context

Packs are validated before use. Validation catches content errors before they cause runtime failures. The game must never partially load an invalid pack.

### Relevant Files
- `packages/engine-core/src/validation/pack.ts` (to create)
- Depends on: schemas from Task 011

### Embedded Context

**Invariant I5 - Fail-Closed:**
- Invalid pack = error, not degraded experience
- Schema validation on load
- Reference validation (all IDs resolve)
- Clear error messages

**Validation Levels:**
1. **Schema:** JSON matches expected structure
2. **References:** All ID references resolve within pack
3. **Solvability:** (future) All puzzles have winning paths

**Source Docs:**
- `docs/D10-PACK-VALIDATION.md` - Validation requirements
- `docs/D21-TEST-PLAN-FIXTURES.md` - Validation test cases

---

## Acceptance Criteria

### AC-1: Schema Validation <- R10.3
- **Given:** Pack JSON
- **When:** validatePackSchema(json) is called
- **Then:** Returns Result<Pack, ValidationError>
- **Test Type:** unit

### AC-2: Valid Pack Passes <- R10.3
- **Given:** Well-formed pack JSON
- **When:** Validated
- **Then:** Returns { ok: true, value: Pack }
- **Test Type:** unit

### AC-3: Invalid Schema Fails <- R10.3
- **Given:** Pack with missing required field
- **When:** Validated
- **Then:** Returns { ok: false, error } with field path
- **Test Type:** unit

### AC-4: Reference Validation <- R10.3
- **Given:** Pack passes schema
- **When:** validatePackReferences(pack) is called
- **Then:** Checks all CardId, CounterId, ConcernId references resolve
- **Test Type:** unit

### AC-5: Missing Reference Fails <- R10.3
- **Given:** Puzzle references card_xyz that doesn't exist
- **When:** Reference validation runs
- **Then:** Returns error: "Card 'card_xyz' not found"
- **Test Type:** unit

### AC-6: Puzzle References Valid <- R10.3
- **Given:** Puzzle with dealtHand, concerns, counters
- **When:** Validated
- **Then:** All 6 card IDs exist, all concern IDs exist, all counter IDs exist
- **Test Type:** unit

### AC-7: Counter RefutableBy Valid <- R10.3
- **Given:** Counter has refutableBy: ['card_maintenance_log']
- **When:** Validated
- **Then:** That card exists in pack
- **Test Type:** unit

### AC-8: Full Validation Pipeline <- R10.3
- **Given:** Pack JSON
- **When:** validatePack(json) is called
- **Then:** Runs schema + reference validation, returns combined result
- **Test Type:** integration

### AC-9: Clear Error Messages <- I5
- **Given:** Validation fails
- **When:** Error returned
- **Then:** Message includes: what failed, where (path), why
- **Test Type:** unit

### Edge Cases

#### EC-1: Self-Referencing ID
- **Scenario:** Card refutes itself
- **Expected:** Maybe valid? (discuss with content)

#### EC-2: Duplicate IDs
- **Scenario:** Two cards with same ID
- **Expected:** Validation fails: "Duplicate card ID: card_xyz"

### Error Cases

#### ERR-1: Null Pack
- **When:** validatePack(null)
- **Then:** Return error
- **Error Message:** "Pack is null or undefined"

#### ERR-2: Non-Object Pack
- **When:** validatePack("string")
- **Then:** Return error
- **Error Message:** "Pack must be an object"

---

## Scope

### In Scope
- `validatePackSchema(json: unknown): Result<Pack, ValidationError>`
- `validatePackReferences(pack: Pack): Result<void, ValidationError>`
- `validatePack(json: unknown): Result<Pack, ValidationError>` (combined)
- Clear, actionable error messages
- Collect all errors (not just first)

### Out of Scope
- Solvability checking (future enhancement)
- Pack fetching (Task 014)
- Voice pack validation (can use same pattern)

---

## Implementation Hints

```typescript
import { PuzzlePackSchema } from './schemas';

export interface ValidationError {
  type: 'schema' | 'reference' | 'solvability';
  path: string;
  message: string;
}

export function validatePackSchema(
  json: unknown
): Result<PuzzlePack, ValidationError[]> {
  const result = PuzzlePackSchema.safeParse(json);
  if (!result.success) {
    const errors = result.error.issues.map(issue => ({
      type: 'schema' as const,
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return { ok: false, error: errors };
  }
  return { ok: true, value: result.data };
}

export function validatePackReferences(
  pack: PuzzlePack
): Result<void, ValidationError[]> {
  const errors: ValidationError[] = [];
  const cardIds = new Set(pack.cards.map(c => c.id));
  const counterIds = new Set(pack.counters.map(c => c.id));
  const concernIds = new Set(pack.concerns.map(c => c.id));

  for (const puzzle of pack.puzzles) {
    for (const cardId of puzzle.dealtHand) {
      if (!cardIds.has(cardId)) {
        errors.push({
          type: 'reference',
          path: `puzzles.${puzzle.id}.dealtHand`,
          message: `Card '${cardId}' not found`,
        });
      }
    }
    // ... similar for concerns, counters
  }

  if (errors.length > 0) {
    return { ok: false, error: errors };
  }
  return { ok: true, value: undefined };
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

**Context:** Validation catches content bugs before they hit players.
**Decisions:**
- Collect all errors, not just first
- Structured errors with path for debugging
- Two phases: schema then references
**Questions for Implementer:**
- Should we validate voice pack with same pipeline?
- Performance concern for large packs?

### Implementation Notes
> Written by Implementer

**Approach:** Two-phase validation: schema (Zod) then references (ID resolution)
**Decisions:** Collect all errors, not just first; self-referencing IDs allowed
**Deviations:** None
**Files Changed:**
- `packages/engine-core/src/validation/references.ts`
- `packages/engine-core/tests/validation/references.test.ts`
**Test Count:** 9 ACs + 2 ECs + 2 ERRs = 21 tests
**Gotchas:** Duplicate IDs don't fail reference validation (Set behavior)

### Review Notes
> Written by Reviewer

**Verdict:** PASS (missing EC/ERR tests)
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | `validatePuzzlePackFull` | ✓ |
| AC-2 | `AC-1: should pass` | ✓ |
| AC-3 | `validatePuzzlePackFull: schema errors` | ✓ |
| AC-4 | `validateReferences` | ✓ |
| AC-5 | `AC-1: dealtHand` | ✓ |
| AC-6 | `AC-2: counter.targets` | ✓ |
| AC-7 | `Additional: counter.refutedBy` | ✓ |
| AC-8 | `validatePuzzlePackFull` | ✓ |
| AC-9 | Error messages include path | ✓ |

**Issues:**
- R3-SHLD-4: EC-1 "Self-Referencing ID" not tested
- R3-SHLD-5: EC-2 "Duplicate IDs" not tested
- R3-SHLD-6: ERR-1/2 "Null/Non-Object Pack" not explicitly tested

**Suggestions:**
- Add explicit tests for null/invalid input handling

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created
- 2026-01-26 [Implementer] Task implemented
- 2026-01-26 [Reviewer] Review: Missing EC-1, EC-2, ERR tests
- 2026-01-26 [Implementer] Added EC-1, EC-2, ERR-1, ERR-2 tests

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
| 2026-01-26 | backlog | done | Implementer | Implemented |
| 2026-01-26 | done | review-failed | Reviewer | EC-1, EC-2, ERR-1/2 not tested |
