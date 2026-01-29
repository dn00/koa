# Task 006: Update Persistence

**Status:** backlog
**Assignee:** -
**Blocked By:** 002
**Phase:** Phase 2: Screen Updates
**Complexity:** S
**Depends On:** 002
**Implements:** R5.1, R5.2, R5.3, R5.4

---

## Objective

Update IndexedDB persistence to store V5 events (`V5Event[]`) instead of MVP events (`GameEvent[]`).

---

## Context

Current schema stores `events: GameEvent[]` (MVP types). V5 uses `V5Event[]` with different event shapes. The event-sourced pattern is preserved (I4), just with V5 event types.

### Relevant Files
- `packages/app/src/services/db.ts` - Dexie schema
- `packages/app/src/services/persistence.ts` - CRUD operations

---

## Acceptance Criteria

### AC-1: StoredRun uses V5Event[] ← R5.1
- **Given:** New schema
- **When:** StoredRun interface examined
- **Then:** Has `events: V5Event[]`, not `events: GameEvent[]`
- **Test Type:** unit

### AC-2: saveGame persists V5 events ← R5.2
- **Given:** Active game with V5Event[]
- **When:** `saveGame(runId, events)` called
- **Then:** Events stored in IndexedDB
- **Test Type:** integration

### AC-3: loadGame restores events ← R5.3
- **Given:** Previously saved game
- **When:** `loadGame(runId)` called
- **Then:** Returns stored V5Event[] (store derives state)
- **Test Type:** integration

### AC-4: Database version bumped ← R5.4
- **Given:** Dexie schema
- **When:** Version checked
- **Then:** Version incremented (e.g., 1 → 2)
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: Load non-existent game
- **Scenario:** `loadGame('unknown')` called
- **Expected:** Returns null
- **Test Type:** unit

### Error Cases (REQUIRE TESTS)

#### ERR-1: Corrupted state in DB
- **When:** Stored state fails validation
- **Then:** Returns null, logs error
- **Test Type:** integration

---

## Definition of Done

- [ ] Schema updated to V5
- [ ] Save/load work with GameState
- [ ] DB migration handles upgrade
- [ ] Self-review completed

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
