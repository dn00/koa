# Task 022: Resume Support

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Integration
**Complexity:** S
**Depends On:** 013, 015
**Implements:** R12.3

---

## Objective

Implement resume support: detect unfinished runs on app start, restore state from persisted events, and allow players to continue where they left off.

---

## Context

Players may close the app mid-run. On restart, the app should detect the unfinished run and offer to resume. State is restored by replaying the event log.

### Relevant Files
- `packages/app/src/services/resume.ts` (to create)
- Integration with Zustand stores

### Embedded Context

**Resume Support (from ARCHITECTURE.md):**
1. Run state persisted after each turn
2. On resume: load last snapshot + replay remaining events
3. Snapshot every K=10 events for performance

**Event-Sourced Recovery (Invariant I4):**
- Events are source of truth
- Delete snapshots, replay events → identical state

**Source Docs:**
- `_process/project/ARCHITECTURE.md` - Resume support
- `docs/D19-DATA-MODELS-STORAGE.md` - Persistence

---

## Acceptance Criteria

### AC-1: Detect Unfinished Run <- R12.3
- **Given:** Run in progress when app closed
- **When:** App starts
- **Then:** hasUnfinishedRun() returns true
- **Test Type:** integration

### AC-2: Load Run Events <- R12.3
- **Given:** Unfinished run in IndexedDB
- **When:** loadUnfinishedRun() called
- **Then:** Returns run with full event log
- **Test Type:** integration

### AC-3: Restore State <- R12.3
- **Given:** Events loaded
- **When:** State derived
- **Then:** RunState matches last known state
- **Test Type:** unit

### AC-4: Resume Prompt <- R12.3
- **Given:** Unfinished run detected
- **When:** Home screen displayed
- **Then:** Shows resume option prominently
- **Test Type:** integration

### AC-5: Continue Playing <- R12.3
- **Given:** User chooses resume
- **When:** Resume flow completes
- **Then:** Run screen shows with correct state
- **Test Type:** integration

### AC-6: Abandon Run <- R12.3
- **Given:** User chooses not to resume
- **When:** "Start New" selected
- **Then:** Old run marked abandoned, new run can start
- **Test Type:** integration

### AC-7: Snapshot Optimization <- R12.3
- **Given:** Run with 20+ events
- **When:** Resume occurs
- **Then:** Loads from snapshot, replays only recent events
- **Test Type:** unit

### AC-8: Corrupted Event Recovery <- R12.3
- **Given:** Event log partially corrupted
- **When:** Resume attempted
- **Then:** Shows error, allows fresh start
- **Test Type:** unit

### Edge Cases

#### EC-1: Multiple Unfinished Runs
- **Scenario:** Somehow have 2 unfinished runs
- **Expected:** Show most recent, clean up others

#### EC-2: Run From Old App Version
- **Scenario:** Event schema changed
- **Expected:** Migration or clean slate

### Error Cases

#### ERR-1: Event Replay Fails
- **When:** deriveState throws error
- **Then:** Show error, offer to abandon run
- **Error Message:** "Couldn't restore your run. Start fresh?"

---

## Scope

### In Scope
- `hasUnfinishedRun(): Promise<boolean>`
- `loadUnfinishedRun(): Promise<StoredRun | null>`
- `resumeRun(runId): Promise<void>`
- `abandonRun(runId): Promise<void>`
- Snapshot loading (optimization)
- UI prompt integration

### Out of Scope
- Snapshot creation (done during save)
- Cross-device sync

---

## Implementation Hints

```typescript
export async function hasUnfinishedRun(): Promise<boolean> {
  const runs = await db.runs
    .where('status')
    .equals('in_progress')
    .toArray();
  return runs.length > 0;
}

export async function loadUnfinishedRun(): Promise<StoredRun | null> {
  const runs = await db.runs
    .where('status')
    .equals('in_progress')
    .sortBy('started_at');
  return runs[runs.length - 1] ?? null;
}

export async function resumeRun(runId: string): Promise<void> {
  const run = await db.runs.get(runId);
  if (!run) throw new Error('Run not found');

  // Load packs needed for this run
  const manifest = await db.dailies.get(run.daily_id);
  const packs = await loadDailyPacks(manifest);

  // Restore state
  const state = deriveState(run.events);

  // Update store
  const store = useGameStore.getState();
  store.restoreRun(run.events, state, packs.value.puzzle);
}

export async function abandonRun(runId: string): Promise<void> {
  await db.runs.update(runId, {
    status: 'abandoned',
    ended_at: Date.now(),
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

**Context:** Key for offline-first experience.
**Decisions:**
- Always save after each event
- Resume from most recent unfinished run
- Allow abandoning to start fresh
**Questions for Implementer:**
- How often to create snapshots?
- Handle app upgrade mid-run?

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
