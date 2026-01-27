# Task 029: Telemetry

**Status:** done
**Assignee:** -
**Blocked By:** -
**Phase:** Content and Polish
**Complexity:** S
**Depends On:** 009
**Implements:** R14.1, R14.2, R14.3, R14.4

---

## Objective

Implement minimal telemetry for understanding player behavior: RUN_STARTED, TURN_SUMMARY, RUN_ENDED events. Must be privacy-safe and support opt-out.

---

## Context

Telemetry helps improve the game by understanding how players interact with puzzles. Only aggregate, anonymized data is collected. Users can opt out completely.

### Relevant Files
- `packages/app/src/services/telemetry.ts` (to create)

### Embedded Context

**Telemetry Events (from D22, D24):**
- RUN_STARTED: daily_id, puzzle_id, timestamp
- TURN_SUMMARY: damage_dealt, concerns_addressed, contradiction_severity
- RUN_ENDED_SUMMARY: result, turns_used, total_damage, scrutiny_final

**Privacy Requirements:**
- No PII collected
- Opt-out supported
- Data is aggregate only
- No individual run reconstruction

**Source Docs:**
- `docs/D22-TELEMETRY-SPEC.md` - Telemetry spec
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Minimal telemetry

---

## Acceptance Criteria

### AC-1: RUN_STARTED Event <- R14.1
- **Given:** Run starts
- **When:** RUN_STARTED telemetry fires
- **Then:** Contains daily_id, puzzle_id, timestamp
- **Test Type:** unit

### AC-2: TURN_SUMMARY Event <- R14.2
- **Given:** Turn completed
- **When:** TURN_SUMMARY telemetry fires
- **Then:** Contains damage, concerns addressed, contradiction severity
- **Test Type:** unit

### AC-3: RUN_ENDED Event <- R14.3
- **Given:** Run ends
- **When:** RUN_ENDED_SUMMARY telemetry fires
- **Then:** Contains result, turns, total damage, final scrutiny
- **Test Type:** unit

### AC-4: Opt-Out Respected <- R14.4
- **Given:** User opted out
- **When:** Telemetry would fire
- **Then:** No telemetry sent
- **Test Type:** unit

### AC-5: No PII <- R14.4
- **Given:** Any telemetry event
- **When:** Payload examined
- **Then:** Contains no personally identifiable information
- **Test Type:** unit

### AC-6: Batch Sending <- R14.1
- **Given:** Multiple events queued
- **When:** App goes to background or interval
- **Then:** Events sent in batch
- **Test Type:** integration

### AC-7: Offline Queue <- R14.1
- **Given:** Network unavailable
- **When:** Telemetry events fire
- **Then:** Events queued locally for later send
- **Test Type:** integration

### AC-8: Anonymous ID <- R14.4
- **Given:** Telemetry event
- **When:** Sent to server
- **Then:** Uses randomized anonymous session ID, not device ID
- **Test Type:** unit

### Edge Cases

#### EC-1: Rapid Events
- **Scenario:** Many events in quick succession
- **Expected:** Batched, no flood

#### EC-2: Large Queue
- **Scenario:** Offline for long period
- **Expected:** Queue caps at reasonable size, drops oldest

### Error Cases

#### ERR-1: Send Failed
- **When:** Telemetry endpoint unavailable
- **Then:** Retry later, don't crash
- **Error Message:** (silent failure, logged to console)

---

## Scope

### In Scope
- TelemetryService with event methods
- Event queue with batching
- Opt-out setting integration
- Anonymous session ID generation
- Basic endpoint call (can be mock for MVP)

### Out of Scope
- Backend telemetry ingestion
- Analytics dashboard
- Real-time monitoring

---

## Implementation Hints

```typescript
interface TelemetryEvent {
  event_type: 'RUN_STARTED' | 'TURN_SUMMARY' | 'RUN_ENDED_SUMMARY';
  timestamp: number;
  session_id: string;
  payload: Record<string, unknown>;
}

class TelemetryService {
  private queue: TelemetryEvent[] = [];
  private sessionId = generateAnonymousId();
  private optedOut = false;

  constructor(settings: SettingsStore) {
    this.optedOut = settings.telemetryOptOut;
    settings.subscribe(s => {
      this.optedOut = s.telemetryOptOut;
    });
  }

  track(eventType: TelemetryEvent['event_type'], payload: Record<string, unknown>) {
    if (this.optedOut) return;

    this.queue.push({
      event_type: eventType,
      timestamp: Date.now(),
      session_id: this.sessionId,
      payload,
    });

    this.maybeFlush();
  }

  private async maybeFlush() {
    if (this.queue.length >= 10) {
      await this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ events }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      // Re-queue on failure (with limit)
      this.queue = [...events.slice(-50), ...this.queue];
      console.warn('Telemetry send failed, will retry');
    }
  }
}

function generateAnonymousId(): string {
  return crypto.randomUUID();
}
```

```typescript
// Usage in game flow
function onRunStart(dailyId: string, puzzleId: string) {
  telemetry.track('RUN_STARTED', {
    daily_id: dailyId,
    puzzle_id: puzzleId,
  });
}

function onTurnComplete(result: TurnResult) {
  telemetry.track('TURN_SUMMARY', {
    damage: result.damage,
    concerns_addressed: result.concernsAddressed.length,
    contradiction: result.contradictionSeverity,
  });
}

function onRunEnd(result: RunResult) {
  telemetry.track('RUN_ENDED_SUMMARY', {
    result: result.outcome,
    turns_used: result.turnsUsed,
    total_damage: result.totalDamage,
    final_scrutiny: result.scrutiny,
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

**Context:** Minimal telemetry for game improvement.
**Decisions:**
- Only 3 event types for MVP
- Anonymous session ID only
- Silent failures, queue for retry
**Questions for Implementer:**
- Telemetry endpoint URL (env var)?
- Backend ready or mock for MVP?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:** PASS
**Date:** 2026-01-26
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | "RUN_STARTED event format" | ✓ |
| AC-2 | "TURN_SUMMARY event format" | ✓ |
| AC-3 | "RUN_ENDED_SUMMARY event format" | ✓ |
| AC-4 | "Opt-out respected" | ✓ |
| AC-5 | "No PII" | ✓ |
| AC-6 | "Batch sending" | ✓ |
| AC-7 | "Offline queueing" | ✓ |
| AC-8 | "Anonymous session ID" | ✓ |
| EC-1 | "Rapid events batched" | ✓ |
| EC-2 | "Large queue capped" | ✓ |
| ERR-1 | "Send failed (retry)" | ✓ |

**Tests:** 26 passed
**Implementation Notes:**
- TelemetryService class with queue, session ID, batching
- crypto.randomUUID() for anonymous session ID
- Checks settingsStore.telemetryOptOut before queuing
- Batch size = 10, max queue = 50
- Retry on failure with setTimeout
- destroy() method for cleanup
- Singleton pattern with getTelemetryService()
**Issues:** None
**Suggestions:** None - privacy-conscious implementation

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created
- 2026-01-26 [Implementer] Implemented TelemetryService with batching and privacy
- 2026-01-26 [Reviewer] Review PASS - all ACs/ECs/ERR verified

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
| 2026-01-26 | backlog | done | Implementer | Implemented |
| 2026-01-26 | done | done | Reviewer | Review PASS |
