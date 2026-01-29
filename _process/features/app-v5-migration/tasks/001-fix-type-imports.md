# Task 001: Fix Type Imports

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Phase 1: Type Compilation
**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.4, R1.5

---

## Objective

Fix all TypeScript import errors in `@hsh/app` by replacing MVP type imports with V5 equivalents. This is the critical first step - nothing else can proceed until the app compiles.

---

## Context

The engine-core migration removed MVP types. The app has 30+ TypeScript errors from importing non-existent types.

### Relevant Files
- `packages/app/src/stores/gameStore.ts` - imports `EvidenceCard`, `Puzzle`, `GameEvent`, `RunState`, etc.
- `packages/app/src/services/persistence.ts` - imports `GameEvent`, `RunStatus`
- `packages/app/src/services/db.ts` - imports `GameEvent`
- `packages/app/src/components/EvidenceCard/EvidenceCard.tsx` - imports `EvidenceCard`
- `packages/app/src/screens/run/RunScreen.tsx` - imports `Concern`
- `packages/app/src/screens/results/ResultScreen.tsx` - imports `RunStatus`, `GameEvent`
- Multiple other files with similar issues

### Embedded Context

**Type Mapping:**
```typescript
// MVP → V5 type mapping
EvidenceCard → Card
Puzzle → V5Puzzle
RunState → GameState
RunStatus → Tier (enum → string literal union)
GameEvent → (remove - no events in V5)
Concern → (remove - no concerns in V5)
Scrutiny → (remove - no scrutiny in V5)
```

**V5 Type Imports:**
```typescript
// Available from @hsh/engine-core
import type {
  Card,
  CardId,
  V5Puzzle,
  GameState,
  GameConfig,
  Tier,
  TurnResult,
  ObjectionState,
} from '@hsh/engine-core';

// Also available
import {
  createGameState,
  playCard,
  isGameOver,
  getVerdict,
  DEFAULT_CONFIG,
  BUILTIN_PACK,
} from '@hsh/engine-core';
```

---

## Acceptance Criteria

### AC-1: All import statements compile ← R1.5
- **Given:** The app codebase with MVP imports
- **When:** TypeScript compiler runs
- **Then:** No "Module has no exported member" errors
- **Test Type:** integration (compile check)

### AC-2: Card type replaces EvidenceCard ← R1.1
- **Given:** Files importing `EvidenceCard`
- **When:** Imports are updated
- **Then:** All use `Card` from `@hsh/engine-core`
- **Test Type:** unit

### AC-3: V5Puzzle type replaces Puzzle ← R1.2
- **Given:** Files importing `Puzzle`
- **When:** Imports are updated
- **Then:** All use `V5Puzzle` from `@hsh/engine-core`
- **Test Type:** unit

### AC-4: Tier type replaces RunStatus ← R1.4
- **Given:** Files importing `RunStatus`
- **When:** Imports are updated
- **Then:** All use `Tier` from `@hsh/engine-core`
- **Test Type:** unit

### AC-5: Event-related imports removed ← R1.5
- **Given:** Files importing `GameEvent`, `deriveState`, event creators
- **When:** Imports are updated
- **Then:** These imports are removed (will be handled in store rewrite)
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: Files with multiple MVP imports
- **Scenario:** File imports 5+ MVP types
- **Expected:** All replaced or removed; no partial fixes
- **Test Type:** integration

### Error Cases (REQUIRE TESTS)

#### ERR-1: Import of completely removed type (Scrutiny, Concern)
- **When:** File imports `Scrutiny` or `Concern`
- **Then:** Import removed; usages commented with TODO
- **Error Message:** N/A (compilation should succeed with TODOs)
- **Test Type:** integration

---

## Scope

### In Scope
- Update all import statements
- Add `// TODO: V5 migration` comments where usage needs rework
- Remove imports of deleted types

### Out of Scope
- Fixing usage of the types (that's later tasks)
- Updating component props (that's Task 003)
- Updating store logic (that's Task 002)

---

## Implementation Hints

**Strategy:** Make the app COMPILE first, even if it's broken at runtime.

1. Run `tsc --noEmit` to get full error list
2. For each file with errors:
   - Replace importable types (EvidenceCard → Card, etc.)
   - Comment out imports that have no replacement
   - Add `// @ts-expect-error TODO: V5 migration` where needed
3. Goal: `npm run build` succeeds

**Files to update (in order):**
1. `db.ts` - remove GameEvent import
2. `persistence.ts` - remove GameEvent, RunStatus
3. `gameStore.ts` - largest changes, stub the types
4. Component files - update Card type
5. Screen files - comment out Concern, Scrutiny usage

---

## Definition of Done

- [ ] `npm run build` succeeds for @hsh/app
- [ ] No `Module has no exported member` errors
- [ ] TODOs added for code needing further work
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** This is the critical first task - nothing else can start until types compile.
**Decisions:** Use `@ts-expect-error` liberally to unblock other tasks; runtime correctness comes later.
**Questions for Implementer:** Track all TODOs added; they become input for subsequent tasks.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-28 20:30 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
