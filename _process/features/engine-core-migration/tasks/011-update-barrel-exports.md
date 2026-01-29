# Task 011: Update Barrel Exports

**Status:** backlog
**Assignee:** -
**Blocked By:** 010
**Phase:** 4 - Cleanup
**Complexity:** S
**Depends On:** 010
**Implements:** R5.10

---

## Objective

Update all index.ts barrel exports to export V5 types and resolver functions, removing references to deleted MVP modules.

---

## Context

After removing MVP code (Task 010), the barrel exports need updating to:
1. Export V5 types from types/index.ts
2. Export V5 resolver from resolver/index.ts
3. Export pack system from packs/index.ts
4. Update main package entry point

### Relevant Files
- `packages/engine-core/src/index.ts` - Main entry
- `packages/engine-core/src/types/index.ts` - Types barrel
- `packages/engine-core/src/resolver/index.ts` - Resolver barrel
- `packages/engine-core/src/packs/index.ts` - Packs barrel (new)

### Embedded Context

**Barrel Export Pattern (from PATTERNS.md):**
```typescript
// packages/engine-core/src/types/index.ts
export * from './v5/index.js';  // V5 types
export type { Result } from './result.js';
export { ok, err } from './result.js';
```

---

## Acceptance Criteria

### AC-1: Types Barrel Exports V5 Types ← R5.10
- **Given:** types/index.ts
- **When:** Importing from '@aura/engine-core'
- **Then:** Can import Card, GameState, V5Puzzle, ModeConfig, GameConfig, Tier, etc.
- **Test Type:** unit (import test)

### AC-2: Resolver Barrel Exports V5 Functions ← R5.10
- **Given:** resolver/index.ts
- **When:** Importing from '@aura/engine-core'
- **Then:** Can import createGameState, playCard, scoreCard, getTier, etc.
- **Test Type:** unit (import test)

---

## Scope

### In Scope
- Update types/index.ts
- Update resolver/index.ts
- Create or update packs/index.ts
- Update main src/index.ts
- Verify all exports work

### Out of Scope
- Code changes (just exports)
- Documentation updates

---

## Implementation Hints

1. List all V5 exports needed
2. Update each barrel in order: types, resolver, packs, main
3. Test with: `import { Card, playCard, BUILTIN_PACK } from '@aura/engine-core'`

---

## Definition of Done

- [ ] All V5 exports accessible from main package
- [ ] No export errors
- [ ] TypeScript compiles
- [ ] Package usable from app layer
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Final cleanup task to make package usable.
**Decisions:** Keep Result, ok, err exports in types.

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
| 2026-01-28 | - | backlog | Planner | Created, blocked by 010 |
