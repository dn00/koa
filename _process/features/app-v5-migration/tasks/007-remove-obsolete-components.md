# Task 007: Remove Obsolete Components

**Status:** done
**Assignee:** -
**Blocked By:** 004
**Phase:** Phase 3: Cleanup
**Complexity:** S
**Depends On:** 004
**Implements:** R7.1, R7.2, R7.3, R7.4

---

## Objective

Delete MVP-specific components that have no V5 equivalent: ConcernChip, ScrutinyIndicator, CounterPanel.

---

## Context

V5 removes these MVP mechanics:
- Concerns (address-able goals) → Removed
- Scrutiny (escalating risk) → Removed
- Counters (enemy evidence) → Removed

The components for these are now dead code.

### Relevant Files
- `packages/app/src/components/hud/ConcernChip.tsx` - DELETE
- `packages/app/src/components/hud/ScrutinyIndicator.tsx` - DELETE
- `packages/app/src/components/counter/CounterPanel.tsx` - DELETE
- `packages/app/src/components/hud/index.ts` - Update exports
- `packages/app/src/components/counter/index.ts` - DELETE folder

---

## Acceptance Criteria

### AC-1: ConcernChip deleted ← R7.1
- **Given:** Codebase
- **When:** Files searched
- **Then:** `ConcernChip.tsx` does not exist
- **Test Type:** file check

### AC-2: ScrutinyIndicator deleted ← R7.2
- **Given:** Codebase
- **When:** Files searched
- **Then:** `ScrutinyIndicator.tsx` does not exist
- **Test Type:** file check

### AC-3: CounterPanel deleted ← R7.3
- **Given:** Codebase
- **When:** Files searched
- **Then:** `CounterPanel.tsx` does not exist
- **Test Type:** file check

### AC-4: Barrel exports updated ← R7.4
- **Given:** HUD index.ts
- **When:** Exports examined
- **Then:** No exports of deleted components
- **Test Type:** unit

---

## Definition of Done

- [ ] All 3 components deleted
- [ ] No import errors from other files
- [ ] Barrel exports updated
- [ ] Build succeeds
- [ ] Self-review completed

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
