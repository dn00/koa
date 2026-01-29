# Task 010: Remove Obsolete MVP Code

**Status:** backlog
**Assignee:** -
**Blocked By:** 007, 009
**Phase:** 4 - Cleanup
**Complexity:** S
**Depends On:** 007, 009
**Implements:** R5.1, R5.2, R5.3, R5.4, R5.5, R5.6, R5.7, R5.8, R5.9

---

## Objective

Remove the obsolete MVP resolver and type modules from engine-core. V5 has replaced these mechanics, so the old code is dead weight.

---

## Context

With V5 migration complete, the MVP resolver modules (damage, contradictions, concerns, scrutiny, corroboration, contested, refutation) and their associated types (Concern, Counter) are no longer used. Remove them to avoid confusion.

### Relevant Files to Remove
- `packages/engine-core/src/resolver/damage.ts`
- `packages/engine-core/src/resolver/contradiction.ts`
- `packages/engine-core/src/resolver/concerns.ts`
- `packages/engine-core/src/resolver/scrutiny.ts`
- `packages/engine-core/src/resolver/corroboration.ts`
- `packages/engine-core/src/resolver/contested.ts`
- `packages/engine-core/src/resolver/refutation.ts`
- `packages/engine-core/src/resolver/turn.ts` (old MVP turn processor)
- `packages/engine-core/src/resolver/events.ts` (old MVP events)
- `packages/engine-core/src/types/concern.ts`
- `packages/engine-core/src/types/counter.ts`
- `packages/engine-core/src/types/evidence.ts` (old EvidenceCard)
- `packages/engine-core/src/types/puzzle.ts` (old Puzzle)
- `packages/engine-core/src/types/state.ts` (old RunState)

### Embedded Context

**Why Remove:**
- Dead code increases confusion
- V5 is the canonical model now
- Keeps codebase clean

**Safety Check:**
- Run `tsc` after removal to catch any remaining references
- Run `vitest` to ensure no tests depend on removed code

---

## Acceptance Criteria

### AC-1: Resolver Modules Removed ← R5.1-R5.7
- **Given:** Listed resolver files
- **When:** Checking file system
- **Then:** Files do not exist
- **Test Type:** manual (file check)

### AC-2: Type Modules Removed ← R5.8, R5.9
- **Given:** concern.ts, counter.ts, and old MVP types
- **When:** Checking file system
- **Then:** Files do not exist or are replaced with V5 versions
- **Test Type:** manual (file check)

---

## Scope

### In Scope
- Delete obsolete resolver modules
- Delete obsolete type modules
- Remove associated test files
- Verify TypeScript still compiles

### Out of Scope
- Updating barrel exports (Task 011)
- Removing scripts/ files (separate migration)

---

## Implementation Hints

1. Delete files in order: resolver modules first, then types
2. Run `npx tsc --noEmit` after each deletion to catch errors
3. Also delete test files in `packages/engine-core/tests/resolver/`
4. Keep validation/ if any schemas are still needed (or update for V5)

---

## Definition of Done

- [ ] All listed files deleted
- [ ] TypeScript compiles without errors
- [ ] No orphaned imports
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Cleanup after V5 migration. Dead code removal.
**Decisions:** Remove completely rather than deprecate - V5 is the only model now.
**Questions for Implementer:** Check if validation/schemas.ts needs updating for V5 puzzle format.

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
| 2026-01-28 | - | backlog | Planner | Created, blocked by 007, 009 |
