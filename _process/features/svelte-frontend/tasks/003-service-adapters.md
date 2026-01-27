# Task 003: Service Adapters

**Status:** ready
**Assignee:** -
**Blocked By:** -
**Phase:** Foundation
**Complexity:** S
**Depends On:** 001
**Implements:** R8.1, R8.2

---

## Objective

Adapt persistence and pack-loader services from React app to work with Svelte stores.

---

## Context

Services are mostly framework-agnostic. Main changes: store references and initialization.

### Relevant Files
- `packages/app/src/services/db.ts` — Dexie database
- `packages/app/src/services/persistence.ts` — CRUD operations
- `packages/app/src/services/pack-loader.ts` — Pack fetching

### Embedded Context

**Service Pattern:**
```typescript
// Services are singleton, framework-agnostic
// Only change: how they notify stores

// persistence.ts
export async function saveRun(runState: RunState): Promise<void>;
export async function loadRun(): Promise<RunState | null>;

// pack-loader.ts
export async function loadPuzzle(puzzleId: string): Promise<Puzzle>;
export async function loadDailyManifest(): Promise<DailyManifest>;
```

**Dexie Schema (unchanged):**
```typescript
db.version(1).stores({
  runs: '++id, date, puzzleId',
  settings: 'key'
});
```

---

## Acceptance Criteria

### AC-1: Persistence Save ← R8.1
- **Given:** RunState object
- **When:** Calling saveRun()
- **Then:** Data persisted to IndexedDB
- **Test Type:** integration

### AC-2: Persistence Load ← R8.1
- **Given:** Saved run in IndexedDB
- **When:** Calling loadRun()
- **Then:** RunState restored
- **Test Type:** integration

### AC-3: Pack Loader ← R8.2
- **Given:** Valid puzzle ID
- **When:** Calling loadPuzzle()
- **Then:** Puzzle data returned
- **Test Type:** integration

### AC-4: Service Initialization
- **Given:** App starting
- **When:** Services initialize
- **Then:** No errors, ready to use
- **Test Type:** integration

### Edge Cases

#### EC-1: No Saved Run
- **Scenario:** Fresh install, no IndexedDB data
- **Expected:** loadRun() returns null

#### EC-2: Offline Pack Load
- **Scenario:** Network unavailable, pack cached
- **Expected:** Returns cached pack

---

## Scope

### In Scope
- Copy and adapt db.ts
- Copy and adapt persistence.ts
- Copy and adapt pack-loader.ts
- Basic integration tests

### Out of Scope
- Service worker (Task 014)
- Telemetry service

---

## Implementation Hints

1. Services are mostly copy-paste from React app
2. Remove any React-specific imports
3. Services don't need Svelte stores directly — just async functions

---

## Definition of Done

- [ ] Persistence service works
- [ ] Pack loader works
- [ ] Integration tests pass
- [ ] No framework dependencies in services

---

## Log

### Planning Notes
**Context:** Services are framework-agnostic, minimal changes needed.

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | ready | Planner | Created |
