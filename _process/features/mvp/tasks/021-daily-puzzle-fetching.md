# Task 021: Daily Puzzle Fetching

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Integration
**Complexity:** M
**Depends On:** 012, 014
**Implements:** R1.1, R1.2, R2.3, R10.5, R12.4

---

## Objective

Implement daily puzzle fetching: get today's daily manifest, load required packs, bind run to manifest, and ensure same daily = same puzzle for all players.

---

## Context

The Daily is deterministic - all players get the same puzzle for the same day. The manifest specifies which puzzle and which pack version. The run is bound to this manifest to prevent mid-run content changes.

### Relevant Files
- `packages/app/src/services/daily.ts` (to create)
- Depends on: pack-loader, persistence

### Embedded Context

**Daily Flow (from D24):**
1. Fetch daily manifest for today's date
2. Load required packs (puzzle pack, voice pack)
3. Select puzzle by manifest's puzzle_id
4. Bind run to manifest_id and daily_id
5. Same seed → same puzzle, fair comparison

**Manifest Structure:**
```json
{
  "daily_id": "2026-01-26",
  "manifest_id": "m_abc123",
  "puzzle_pack_hash": "sha256:...",
  "voice_pack_hash": "sha256:...",
  "puzzle_id": "puzzle_tutorial_01",
  "seed": "daily_2026-01-26"
}
```

**Invariant I2 - Offline-First:**
- Daily loads from cache if available
- Works offline after initial fetch

**Source Docs:**
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Daily structure
- `docs/D08-PACK-SYSTEM-OVERVIEW.md` - Manifest system

---

## Acceptance Criteria

### AC-1: Fetch Today's Manifest <- R1.1
- **Given:** App needs today's daily
- **When:** getDailyManifest() is called
- **Then:** Returns manifest for current date
- **Test Type:** integration

### AC-2: Same Daily for All <- R1.2
- **Given:** Two users request same date
- **When:** getDailyManifest called
- **Then:** Both get same manifest_id, puzzle_id, seed
- **Test Type:** unit (mock)

### AC-3: Load Required Packs <- R10.5
- **Given:** Manifest specifies pack hashes
- **When:** loadDailyPacks(manifest) called
- **Then:** Puzzle pack and voice pack loaded and validated
- **Test Type:** integration

### AC-4: Bind Run to Manifest <- R10.5
- **Given:** Daily started
- **When:** Run created
- **Then:** Run includes manifest_id, cannot change mid-run
- **Test Type:** unit

### AC-5: Same Dealt Hand <- R2.3
- **Given:** Same daily_id
- **When:** Two players start run
- **Then:** Both see same 6 dealt cards
- **Test Type:** integration

### AC-6: Cache Manifest <- R12.4
- **Given:** Manifest fetched
- **When:** Stored locally
- **Then:** Can be retrieved offline
- **Test Type:** integration

### AC-7: Offline Daily <- R12.4
- **Given:** Manifest and packs cached
- **When:** Network offline
- **Then:** Can start daily run
- **Test Type:** integration

### AC-8: Date Rollover <- R1.1
- **Given:** New day starts (midnight)
- **When:** User opens app
- **Then:** Fetches new daily manifest
- **Test Type:** unit

### Edge Cases

#### EC-1: Daily Not Yet Published
- **Scenario:** CDN hasn't published today's daily yet
- **Expected:** Fallback to yesterday's or show message

#### EC-2: Already Played Today
- **Scenario:** User completed today's daily
- **Expected:** Show completed state, can view results

### Error Cases

#### ERR-1: Manifest Fetch Failed
- **When:** Network error fetching manifest
- **Then:** Try cache, if no cache show error
- **Error Message:** "Couldn't load today's puzzle. Check your connection."

#### ERR-2: Pack Load Failed
- **When:** Required pack missing from cache and network
- **Then:** Cannot start daily
- **Error Message:** "Missing content. Please connect to download."

---

## Scope

### In Scope
- `getDailyManifest(date?: Date): Promise<Manifest>`
- `loadDailyPacks(manifest): Promise<{ puzzle: PuzzlePack, voice: VoicePack }>`
- `startDailyRun(dailyId): Promise<void>`
- Manifest caching
- Run binding to manifest
- Offline support

### Out of Scope
- Manifest generation (backend concern)
- Daily streak tracking (future)
- Multiple dailies per day

---

## Implementation Hints

```typescript
const CDN_BASE = import.meta.env.VITE_CDN_URL;

interface DailyManifest {
  daily_id: string;         // "2026-01-26"
  manifest_id: string;       // "m_abc123"
  puzzle_pack_hash: string;
  voice_pack_hash: string;
  puzzle_id: string;
  seed: string;
}

export async function getDailyManifest(date = new Date()): Promise<Result<DailyManifest>> {
  const dailyId = formatDailyId(date); // "2026-01-26"

  // Try cache first
  const cached = await db.dailies.get(dailyId);
  if (cached) {
    return { ok: true, value: cached };
  }

  // Fetch from CDN
  try {
    const response = await fetch(`${CDN_BASE}/daily/${dailyId}.json`);
    if (!response.ok) {
      return { ok: false, error: new DailyError('Manifest not found') };
    }

    const manifest = await response.json();
    await db.dailies.put(manifest);
    return { ok: true, value: manifest };
  } catch (e) {
    return { ok: false, error: new DailyError('Network error') };
  }
}

export async function startDailyRun(dailyId: string): Promise<void> {
  const manifest = await getDailyManifest(parseDailyId(dailyId));
  if (!manifest.ok) throw manifest.error;

  const packs = await loadDailyPacks(manifest.value);
  if (!packs.ok) throw packs.error;

  const puzzle = packs.value.puzzle.puzzles.find(
    p => p.id === manifest.value.puzzle_id
  );
  if (!puzzle) throw new Error('Puzzle not found in pack');

  const store = useGameStore.getState();
  store.startRun(puzzle, dailyId, manifest.value.manifest_id);
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

**Context:** Bridges content (CDN) to gameplay. Critical for fairness.
**Decisions:**
- Manifest per day, cached locally
- Run bound to manifest (immutable)
- Offline support via caching
**Questions for Implementer:**
- How to handle timezone differences?
- Mock CDN for development?

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
