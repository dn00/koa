# Task 004: Puzzle Pack System

**Status:** done
**Assignee:** -
**Blocked By:** 001
**Phase:** Core Engine
**Complexity:** S
**Depends On:** 001
**Implements:** R3.1, R3.2, R3.3, R3.4

---

## Objective

Create a pluggable puzzle pack system that allows loading puzzles from different sources (builtin, file-based, etc.).

---

## Context

Currently puzzles are hardcoded in `v5-puzzles.ts`. We need an abstraction layer so puzzles can come from different sources without changing engine code.

### Relevant Files
- `scripts/v5-puzzles.ts` - Current hardcoded puzzles (V5_PUZZLES, V5_PUZZLES_BY_SLUG)
- `scripts/v5-types.ts` - V5Puzzle type
- `packages/engine-core/src/validation/` - Validation patterns to follow

### Embedded Context

**Result Pattern:**
Use `Result<T, E>` for operations that can fail (loading, validation).

**Pack Validation:**
Validate that pack has required fields before use. Don't crash on malformed data.

---

## Acceptance Criteria

### AC-1: PuzzlePack Interface ← R3.1
- **Given:** Need to group puzzles
- **When:** PuzzlePack interface defined
- **Then:** Has fields: version (string), id (string), name (string), puzzles (V5Puzzle[])
- **Test Type:** unit (type compiles)

### AC-2: PuzzlePackManifest Interface ← R3.2
- **Given:** Need lightweight pack metadata
- **When:** PuzzlePackManifest interface defined
- **Then:** Has fields: packId, version, puzzleCount, optional hash
- **Test Type:** unit

### AC-3: PackLoader Interface ← R3.2
- **Given:** Need pluggable loading
- **When:** PackLoader interface defined
- **Then:** Has methods: listPacks(), loadPack(id), getPuzzle(packId, slug)
- **Test Type:** unit

### AC-4: BUILTIN_PACK Constant ← R3.3
- **Given:** Existing V5_PUZZLES array
- **When:** BUILTIN_PACK defined
- **Then:** Wraps V5_PUZZLES as PuzzlePack with id='builtin-v5', version='1.0.0'
- **Test Type:** unit

### AC-5: createBuiltinLoader ← R3.2
- **Given:** BUILTIN_PACK exists
- **When:** createBuiltinLoader() called
- **Then:** Returns PackLoader that serves BUILTIN_PACK
- **Test Type:** unit

### AC-6: PackLoader.getPuzzle Success ← R3.2
- **Given:** Builtin loader
- **When:** getPuzzle('builtin-v5', 'midnight-print') called
- **Then:** Returns Result.ok with puzzle
- **Test Type:** unit

### AC-7: PackLoader.getPuzzle Not Found ← R3.2
- **Given:** Builtin loader
- **When:** getPuzzle('builtin-v5', 'nonexistent') called
- **Then:** Returns Result.err with PuzzleNotFoundError
- **Test Type:** unit

### AC-8: validatePack ← R3.4
- **Given:** Raw data that might be a pack
- **When:** validatePack(data) called
- **Then:** Returns Result<PuzzlePack, ValidationError[]>
- **Test Type:** unit

### AC-9: validatePack Invalid ← R3.4
- **Given:** Data missing required fields
- **When:** validatePack({ name: 'test' }) called
- **Then:** Returns Result.err with errors listing missing fields
- **Test Type:** unit

### Edge Cases

#### EC-1: Empty Pack
- **Scenario:** Pack with puzzles=[]
- **Expected:** Validation passes (empty is valid), getPuzzle returns not found

---

## Scope

### In Scope
- PuzzlePack interface
- PuzzlePackManifest interface
- PackLoader interface
- BUILTIN_PACK constant
- createBuiltinLoader() function
- validatePack() function

### Out of Scope
- File-based loader (future work)
- Remote loader (future work)
- Pack caching

---

## Implementation Hints

Create `scripts/v5-packs/pack-schema.ts`:
```typescript
import type { V5Puzzle } from '../v5-types.js';
import type { Result } from '../v5-engine/types.js';

export interface PuzzlePack {
  version: string;
  id: string;
  name: string;
  puzzles: V5Puzzle[];
}

export function validatePack(data: unknown): Result<PuzzlePack, ValidationError[]> {
  const errors: ValidationError[] = [];
  if (!data || typeof data !== 'object') {
    return err([{ field: 'root', message: 'Pack must be an object' }]);
  }
  // Check required fields...
}
```

Create `scripts/v5-packs/builtin-pack.ts`:
```typescript
import { V5_PUZZLES } from '../v5-puzzles.js';
import type { PuzzlePack } from './pack-schema.js';

export const BUILTIN_PACK: PuzzlePack = {
  version: '1.0.0',
  id: 'builtin-v5',
  name: 'V5 Core Puzzles',
  puzzles: V5_PUZZLES,
};
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Pack validation is thorough
- [ ] Builtin loader returns correct puzzles
- [ ] No `any` types
- [ ] Self-review completed

---

## Log

### Planning Notes
> Written by Planner

**Context:** Pack system enables future extensibility without touching core engine.
**Decisions:** Start with builtin loader only, file/remote loaders are future work.
**Questions for Implementer:** Consider if validatePack should also validate individual puzzles.

### Implementation Notes
> Written by Implementer

**Files created:**
- `scripts/v5-packs/index.ts` - Pack types, BUILTIN_PACK, loader
- `scripts/v5-packs/packs.test.ts` - Unit tests

**Test count:** 22 tests (9 AC + 1 EC)
- AC-1: 1 test (PuzzlePack interface)
- AC-2: 2 tests (PuzzlePackManifest interface)
- AC-3: 3 tests (PackLoader interface)
- AC-4: 4 tests (BUILTIN_PACK constant)
- AC-5: 2 tests (createBuiltinLoader)
- AC-6: 1 test (getPuzzle success)
- AC-7: 2 tests (getPuzzle not found)
- AC-8: 2 tests (validatePack success)
- AC-9: 3 tests (validatePack invalid)
- EC-1: 2 tests (empty pack)

**Design decisions:**
- BUILTIN_PACK wraps existing V5_PUZZLES array
- validatePack returns Result<PuzzlePack, ValidationError[]>
- PackLoader interface supports future file/remote loaders

### Review Notes
> Written by Reviewer

### Change Log
- 2026-01-28 Planner: Task created, blocked by 001

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
