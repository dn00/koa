# Task 008: Pack Types & Validation

**Status:** backlog
**Assignee:** -
**Blocked By:** 001
**Phase:** 3 - Pack System
**Complexity:** S
**Depends On:** 001
**Implements:** R6.1, R6.2, R6.3

---

## Objective

Migrate PuzzlePack, PackLoader interface, and validatePack function to engine-core. These enable pluggable puzzle loading from different sources.

---

## Context

The pack system allows puzzles to come from builtin data, files, or remote sources. Validation ensures packs conform to the expected structure before use (Invariant I5: Fail-Closed Packs).

### Relevant Files
- `scripts/v5-packs/index.ts` - PuzzlePack, PackLoader, validatePack (lines 1-135)
- Task 001 output: V5Puzzle type

### Embedded Context

**Invariant I5 (Fail-Closed Packs):**
- Invalid packs are REJECTED, never silently degraded
- Schema validation on load
- Missing pack → show error, don't proceed

**Pack Structure:**
```typescript
interface PuzzlePack {
  version: string;    // Semver
  id: string;         // Unique identifier
  name: string;       // Human-readable
  puzzles: V5Puzzle[];
}
```

---

## Acceptance Criteria

### AC-1: PuzzlePack Interface ← R6.1
- **Given:** PuzzlePack interface
- **When:** Creating a pack object
- **Then:** Has version (string), id (string), name (string), puzzles (V5Puzzle[])
- **Test Type:** unit

### AC-2: PackLoader Interface ← R6.2
- **Given:** PackLoader interface
- **When:** Checking methods
- **Then:** Has listPacks(): PuzzlePackManifest[], loadPack(id): Result, getPuzzle(packId, slug): Result
- **Test Type:** unit (interface test)

### AC-3: validatePack Accepts Valid Pack ← R6.3
- **Given:** A valid pack object with all required fields
- **When:** validatePack called
- **Then:** Returns Result with ok=true, value is the validated pack
- **Test Type:** unit

### AC-4: validatePack Rejects Invalid Pack ← R6.3
- **Given:** An object missing required fields
- **When:** validatePack called
- **Then:** Returns Result with ok=false, error is array of ValidationError
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: validatePack with null input
- **Scenario:** validatePack(null)
- **Expected:** Returns error with "Pack must not be null or undefined"
- **Test Type:** unit

#### EC-2: validatePack with empty puzzles array
- **Scenario:** Pack with puzzles: []
- **Expected:** Returns ok=true (empty array is valid, just has no puzzles)
- **Test Type:** unit

### Error Cases (REQUIRE TESTS)

#### ERR-1: validatePack missing id field
- **When:** Pack object has no id
- **Then:** Returns validation error for 'id' field
- **Error Message:** "id must be a string"
- **Test Type:** unit

#### ERR-2: validatePack wrong type for puzzles
- **When:** Pack has puzzles as string instead of array
- **Then:** Returns validation error for 'puzzles' field
- **Error Message:** "puzzles must be an array"
- **Test Type:** unit

---

## Scope

### In Scope
- `PuzzlePack` interface
- `PuzzlePackManifest` interface
- `PackLoader` interface
- `PackError` type with code and message
- `ValidationError` type with field and message
- `validatePack(data: unknown): Result<PuzzlePack, ValidationError[]>`

### Out of Scope
- Builtin pack implementation (Task 009)
- Deep puzzle validation (future enhancement)

---

## Implementation Hints

1. Create `packages/engine-core/src/packs/` directory
2. Create `types.ts` for interfaces
3. Create `validation.ts` for validatePack
4. Create `index.ts` barrel export

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Follows project patterns
- [ ] No `any` types (use unknown for unvalidated input)
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Pack system enables pluggable puzzle sources per architecture.
**Decisions:** Keep validation simple (structural only, not deep puzzle validation).

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-28 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created, blocked by 001 |
