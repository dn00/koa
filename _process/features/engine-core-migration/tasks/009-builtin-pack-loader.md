# Task 009: Builtin Pack & Loader

**Status:** backlog
**Assignee:** -
**Blocked By:** 008
**Phase:** 3 - Pack System
**Complexity:** S
**Depends On:** 008
**Implements:** R6.4, R6.5

---

## Objective

Create BUILTIN_PACK constant and createBuiltinLoader factory that provides access to the hardcoded V5 puzzles through the PackLoader interface.

---

## Context

The builtin pack wraps the existing V5_PUZZLES array as a PuzzlePack. The builtin loader implements PackLoader to serve this pack. This allows the engine to work without external puzzle sources.

### Relevant Files
- `scripts/v5-packs/index.ts` - BUILTIN_PACK, createBuiltinLoader (lines 75-185)
- `scripts/v5-puzzles.ts` - V5_PUZZLES array
- Task 008 output: PuzzlePack, PackLoader interfaces

### Embedded Context

**Builtin Pack:**
```typescript
const BUILTIN_PACK: PuzzlePack = {
  version: '1.0.0',
  id: 'builtin-v5',
  name: 'V5 Core Puzzles',
  puzzles: V5_PUZZLES,
};
```

---

## Acceptance Criteria

### AC-1: BUILTIN_PACK Exported ← R6.4
- **Given:** BUILTIN_PACK constant
- **When:** Accessed
- **Then:** Has id='builtin-v5', version='1.0.0', name='V5 Core Puzzles', puzzles array from V5_PUZZLES
- **Test Type:** unit

### AC-2: createBuiltinLoader Returns PackLoader ← R6.5
- **Given:** createBuiltinLoader called
- **When:** Checking returned object
- **Then:** Has listPacks, loadPack, getPuzzle methods
- **Test Type:** unit

### AC-3: Builtin Loader listPacks Returns Manifest ← R6.5
- **Given:** A builtin loader
- **When:** listPacks called
- **Then:** Returns array with one manifest for builtin-v5
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: getPuzzle with non-existent slug
- **Scenario:** getPuzzle('builtin-v5', 'non-existent')
- **Expected:** Returns Result with ok=false, error.code='PUZZLE_NOT_FOUND'
- **Test Type:** unit

### Error Cases (REQUIRE TESTS)

#### ERR-1: loadPack with wrong packId
- **When:** loadPack('wrong-id') called
- **Then:** Returns Result with ok=false, error.code='PACK_NOT_FOUND'
- **Error Message:** "Pack 'wrong-id' not found"
- **Test Type:** unit

---

## Scope

### In Scope
- `BUILTIN_PACK` constant
- `createBuiltinLoader(): PackLoader` factory
- Move V5_PUZZLES data (or reference from scripts for now)

### Out of Scope
- File-based pack loader
- Remote pack loader
- Pack caching

---

## Implementation Hints

1. Create `packages/engine-core/src/packs/builtin.ts`
2. For now, can import V5_PUZZLES from scripts/ or copy puzzle data
3. Loader methods are simple lookups

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] BUILTIN_PACK validates via validatePack
- [ ] No `any` types
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Builtin loader enables engine to work standalone without external puzzle sources.
**Decisions:** Keep puzzle data reference for now - can copy inline later if needed for package isolation.

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
| 2026-01-28 | - | backlog | Planner | Created, blocked by 008 |
