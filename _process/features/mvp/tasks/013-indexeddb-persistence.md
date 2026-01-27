# Task 013: IndexedDB Persistence

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Content System
**Complexity:** M
**Depends On:** 009
**Implements:** R12.2 (foundation for all persistence)

---

## Objective

Implement IndexedDB persistence using Dexie for storing runs, events, packs, and settings. This enables offline play and resume functionality.

---

## Context

The app is offline-first. All state must be persisted to survive app restarts. IndexedDB provides reliable local storage for structured data.

### Relevant Files
- `packages/app/src/services/persistence.ts` (to create)

### Embedded Context

**Persistence Requirements (from ARCHITECTURE.md):**
- Runs stored with full event log
- Packs cached by content hash
- Settings stored separately
- Resume support: load events, replay to current state

**Storage Structure:**
```
IndexedDB 'aura-db'
├── runs: { run_id, daily_id, events[], status, started_at, ended_at }
├── packs: { pack_id, hash, type, data, cached_at }
├── settings: { key, value }
└── dailies: { daily_id, puzzle_id, date, manifest_hash }
```

**Invariant I4 - Event-Sourced:**
- Events are source of truth
- State derived by replaying events

**Source Docs:**
- `docs/D19-DATA-MODELS-STORAGE.md` - Persistence details
- `_process/project/ARCHITECTURE.md` - Storage strategy

---

## Acceptance Criteria

### AC-1: Database Setup <- R12.2
- **Given:** App starts
- **When:** Persistence service initializes
- **Then:** IndexedDB database created with tables: runs, packs, settings, dailies
- **Test Type:** integration

### AC-2: Save Run <- R12.2
- **Given:** Run in progress
- **When:** saveRun(run) is called
- **Then:** Run saved to IndexedDB, retrievable by run_id
- **Test Type:** integration

### AC-3: Load Run <- R12.2
- **Given:** Run saved previously
- **When:** loadRun(runId) is called
- **Then:** Returns run with full event log
- **Test Type:** integration

### AC-4: Append Event <- I4
- **Given:** Run exists
- **When:** appendEvent(runId, event) is called
- **Then:** Event added to run's event log, persisted immediately
- **Test Type:** integration

### AC-5: Save Pack <- R12.2
- **Given:** Pack downloaded
- **When:** savePack(pack, hash) is called
- **Then:** Pack saved, keyed by hash for dedup
- **Test Type:** integration

### AC-6: Load Pack by Hash <- R12.2
- **Given:** Pack saved with hash
- **When:** loadPackByHash(hash) is called
- **Then:** Returns pack if cached, null if not
- **Test Type:** integration

### AC-7: Save Settings <- R12.2
- **Given:** User changes setting
- **When:** saveSetting(key, value) is called
- **Then:** Setting persisted
- **Test Type:** integration

### AC-8: Load Settings <- R12.2
- **Given:** Settings saved
- **When:** loadSettings() is called
- **Then:** Returns all settings as object
- **Test Type:** integration

### AC-9: List Runs for Archive <- R12.2
- **Given:** Multiple runs saved
- **When:** listRuns(limit) is called
- **Then:** Returns recent runs, most recent first
- **Test Type:** integration

### Edge Cases

#### EC-1: Database Migration
- **Scenario:** Schema version upgraded
- **Expected:** Dexie handles migration, existing data preserved

#### EC-2: Storage Quota
- **Scenario:** Storage near full
- **Expected:** Graceful error, suggest clearing old runs

### Error Cases

#### ERR-1: IndexedDB Unavailable
- **When:** Browser doesn't support IndexedDB
- **Then:** Return error, show user message
- **Error Message:** "Local storage not available"

#### ERR-2: Run Not Found
- **When:** loadRun(nonexistentId)
- **Then:** Return null (not error)

---

## Scope

### In Scope
- Dexie database setup
- CRUD for runs (with events)
- CRUD for packs
- CRUD for settings
- List runs for archive view
- Atomic event appends

### Out of Scope
- Service Worker caching (Task 014)
- Pack fetching (Task 014)
- Zustand integration (Task 015)

---

## Implementation Hints

```typescript
import Dexie, { Table } from 'dexie';

interface StoredRun {
  run_id: string;
  daily_id: string;
  events: GameEvent[];
  status: 'in_progress' | 'completed';
  started_at: number;
  ended_at?: number;
}

interface StoredPack {
  hash: string;
  type: 'puzzle' | 'voice';
  data: PuzzlePack | VoicePack;
  cached_at: number;
}

interface StoredSetting {
  key: string;
  value: unknown;
}

class AuraDatabase extends Dexie {
  runs!: Table<StoredRun, string>;
  packs!: Table<StoredPack, string>;
  settings!: Table<StoredSetting, string>;

  constructor() {
    super('aura-db');
    this.version(1).stores({
      runs: 'run_id, daily_id, status, started_at',
      packs: 'hash, type, cached_at',
      settings: 'key',
    });
  }
}

export const db = new AuraDatabase();

export async function saveRun(run: StoredRun): Promise<void> {
  await db.runs.put(run);
}

export async function appendEvent(runId: string, event: GameEvent): Promise<void> {
  await db.runs.where('run_id').equals(runId).modify(run => {
    run.events.push(event);
  });
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

**Context:** Foundation for offline and resume.
**Decisions:**
- Use Dexie for cleaner API over raw IndexedDB
- Store full event log per run
- Key packs by content hash for dedup
**Questions for Implementer:**
- Should we store snapshots for faster resume?
- Cleanup policy for old runs?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:**
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | | |
| AC-2 | | |
| AC-3 | | |
| AC-4 | | |
| AC-5 | | |
| AC-6 | | |
| AC-7 | | |
| AC-8 | | |
| AC-9 | | |
**Issues:**
**Suggestions:**

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
