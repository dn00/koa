# Task 016: Golden Transcript Test Framework

**Status:** ready
**Assignee:** -
**Blocked By:** -
**Phase:** Verification
**Complexity:** M
**Depends On:** none (can run in parallel with 013, 014)
**Implements:** R4.1, R4.2, R4.3, R4.4

---

## Objective

Implement a golden transcript testing framework that records and replays game runs, verifying determinism by comparing state hashes at each step.

---

## Context

From `docs/kernel-hardening.md` §8 (MUST):

> Maintain a corpus of canonical runs:
> - recorded action streams
> - expected final `state_hash`
> - expected key projection snapshots at certain event_seq
>
> **CI gate:**
> - `GATE-GOLD-01`: all golden runs replay to exact hashes
> - `GATE-GOLD-02`: projection snapshots match

This is critical for **Invariant I1 (Deterministic Resolver)** - proving that the same inputs always produce the same outputs across code changes.

### Relevant Files
- `packages/engine-core/src/resolver/events.ts` - Event system, deriveState
- `packages/engine-core/tests/` - Existing test infrastructure

### Embedded Context

**Invariant I1 (Deterministic Resolver):**
- Same inputs MUST produce same outputs
- Event replay reconstructs identical state
- Golden fixtures must replay identically

**From kernel-hardening.md:**
- GATE-GOLD-01: all golden runs replay to exact hashes
- GATE-GOLD-02: projection snapshots match (or are versioned with intentional change)
- "Hardening DoD" requires at least 10 canonical runs

---

## Acceptance Criteria

### AC-1: GoldenTranscript Type Definition ← R4.1
- **Given:** Need to store a recorded game run
- **When:** GoldenTranscript type is used
- **Then:** Contains: id, description, events[], checkpoints[], finalStateHash
- **Test Type:** unit

### AC-2: Checkpoint Type Definition ← R4.1
- **Given:** Need to verify state at specific points
- **When:** Checkpoint type is used
- **Then:** Contains: eventIndex, expectedStateHash, description?
- **Test Type:** unit

### AC-3: replayTranscript Function ← R4.2
- **Given:** A GoldenTranscript with events and checkpoints
- **When:** `replayTranscript(transcript)` is called
- **Then:** Returns ReplayResult with: passed (boolean), failures[] (checkpoint mismatches)
- **Test Type:** unit

### AC-4: Checkpoint Hash Verification ← R4.2
- **Given:** Transcript with checkpoint at eventIndex 5
- **When:** Replay reaches event 5
- **Then:** Computes state hash and compares to expectedStateHash
- **Test Type:** unit

### AC-5: Final State Hash Verification ← R4.2
- **Given:** Transcript with finalStateHash
- **When:** Replay completes all events
- **Then:** Final computed hash matches finalStateHash
- **Test Type:** unit

### AC-6: recordTranscript Helper ← R4.3
- **Given:** A sequence of events from a game run
- **When:** `recordTranscript(events, checkpointIndices)` is called
- **Then:** Returns GoldenTranscript with computed hashes at each checkpoint
- **Test Type:** unit

### AC-7: Failure Reporting ← R4.4
- **Given:** Transcript where checkpoint hash doesn't match
- **When:** `replayTranscript(transcript)` is called
- **Then:** Returns failure with: checkpointIndex, expected hash, actual hash, eventContext
- **Test Type:** unit

### AC-8: At Least 3 Initial Golden Fixtures ← R4.4
- **Given:** Test suite
- **When:** Tests run
- **Then:** At least 3 golden transcript fixtures are verified
- **Test Type:** integration

### Edge Cases

#### EC-1: Empty Event List
- **Scenario:** Transcript with no events
- **Expected:** Returns error "Empty transcript"

#### EC-2: Checkpoint Beyond Events
- **Scenario:** Checkpoint at index 10, only 5 events
- **Expected:** Returns error "Checkpoint index out of range"

#### EC-3: Events Without RUN_STARTED
- **Scenario:** Transcript events don't start with RUN_STARTED
- **Expected:** deriveState fails, replay reports this as failure

### Error Cases

#### ERR-1: Invalid Transcript Structure
- **When:** Transcript missing required fields
- **Then:** Throws validation error
- **Error Message:** Pattern: `Invalid transcript: missing X`

#### ERR-2: Hash Mismatch
- **When:** Computed hash differs from expected
- **Then:** Failure includes both hashes for debugging
- **Error Message:** Pattern: `Hash mismatch at checkpoint N: expected X, got Y`

---

## Scope

### In Scope
- `GoldenTranscript` interface
- `Checkpoint` interface
- `ReplayResult` interface
- `replayTranscript()` function
- `recordTranscript()` helper function
- 3 initial golden fixtures (basic win, basic loss, scrutiny loss)
- Export from engine-core

### Out of Scope
- Automatic fixture generation from live games
- Visual diff tools
- CI pipeline integration (separate DevOps task)
- Versioning for intentional hash changes

---

## Implementation Hints

**Types:**
```typescript
interface Checkpoint {
  readonly eventIndex: number;
  readonly expectedStateHash: string;
  readonly description?: string;
}

interface GoldenTranscript {
  readonly id: string;
  readonly description: string;
  readonly events: readonly GameEvent[];
  readonly checkpoints: readonly Checkpoint[];
  readonly finalStateHash: string;
}

interface CheckpointFailure {
  readonly checkpointIndex: number;
  readonly eventIndex: number;
  readonly expected: string;
  readonly actual: string;
  readonly description?: string;
}

type ReplayResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly failures: readonly CheckpointFailure[] };
```

**Replay logic:**
```typescript
function replayTranscript(transcript: GoldenTranscript): ReplayResult {
  const failures: CheckpointFailure[] = [];

  for (const checkpoint of transcript.checkpoints) {
    const eventsToCheckpoint = transcript.events.slice(0, checkpoint.eventIndex + 1);
    const stateResult = deriveState(eventsToCheckpoint);

    if (!stateResult.ok) {
      failures.push({ /* deriveState failed */ });
      continue;
    }

    const actualHash = computeStateHash(stateResult.value);
    if (actualHash !== checkpoint.expectedStateHash) {
      failures.push({ checkpointIndex, eventIndex, expected, actual });
    }
  }

  // Also check final state
  const finalResult = deriveState(transcript.events);
  if (finalResult.ok) {
    const finalHash = computeStateHash(finalResult.value);
    if (finalHash !== transcript.finalStateHash) {
      failures.push({ /* final mismatch */ });
    }
  }

  return failures.length === 0 ? { ok: true } : { ok: false, failures };
}
```

**Fixture location:** `packages/engine-core/tests/fixtures/golden/`

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No project doc violations
- [ ] Types are correct (no `any`)
- [ ] At least 3 golden fixtures exist and pass
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** kernel-hardening.md §8 marks golden transcripts as MUST. This is the primary mechanism for catching determinism regressions across code changes.

**Decisions:**
- Start with 3 fixtures (win, loss by turns, loss by scrutiny)
- Keep fixtures in JSON for easy inspection
- Record helper makes it easy to add new fixtures

**Questions for Implementer:**
- Consider if fixtures should include puzzle pack data or reference external packs
- May want snapshot format version for future-proofing

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-26 21:45 [Planner] Task created from kernel-hardening.md §8

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | ready | Planner | Created, no dependencies |
