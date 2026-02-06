# Task 004: Epistemic Event Generators

**Complexity:** M
**Depends On:** 002
**Implements:** R4.1, R4.2, R4.3, R4.4, R4.5

---

## Objective

Implement three epistemic pressure events (sensor_conflict, audit_prompt, doubt_voiced) that create information uncertainty, generate ActiveDoubts for VERIFY targeting, and give the player counterplay at high suspicion.

---

## Context

### Relevant Files
- `src/kernel/systems/pressure.ts` - implement `proposeEpistemicPressure()` (stub from Task 002)
- `src/kernel/systems/backfire.ts` - reference for ActiveDoubt creation pattern (lines 52-60)
- `src/kernel/systems/beliefs.ts` - `applySuspicionChange()` for doubt_voiced suspicion bump
- `src/kernel/types.ts` - `Proposal`, `SensorReading`, `ActiveDoubt`, `SimEvent`
- `src/kernel/perception.ts` - perception state structure, existing sensor reading patterns

### Embedded Context

**SENSOR_READING event shape:**
```typescript
{
  type: 'SENSOR_READING',
  place: PlaceId,
  data: {
    reading: {
      id: string,
      tick: number,
      place: PlaceId,
      system: string,           // 'environmental', 'thermal', 'air', etc.
      confidence: number,        // 0-1
      message: string,
      source: 'sensor' | 'crew' | 'system',
    }
  }
}
```

**ActiveDoubt creation pattern (from backfire.ts):**
```typescript
state.perception.activeDoubts.push({
  id: `doubt-${state.truth.tick}-${state.perception.activeDoubts.length}`,
  topic: 'Suppressed thermal alert',
  createdTick: state.truth.tick,
  severity: 1,
  involvedCrew: [crewId],
  system: 'thermal',
  resolved: false,
});
```

**applySuspicionChange pattern (from beliefs.ts):**
```typescript
applySuspicionChange(state, +2, 'DOUBT_VOICED', 'Crew questions MOTHER reliability');
// Logs to suspicionLedger, adjusts beliefs
```

**Room state for sensor conflict:**
```typescript
state.truth.rooms[placeId]: {
  temperature: number,
  o2Level: number,
  radiation: number,
  fire: boolean,
  integrity: number,
}
```

**Proposal shape:**
```typescript
interface Proposal {
  id: string;
  event: Omit<SimEvent, 'id'>;
  score: number;
  tags: ProposalTag[];
}
```

### Key Invariants
- I3: Suspicion is event-driven — doubt_voiced bump must use `applySuspicionChange` with reason
- I4: Truth/Perception separation — sensor_conflict creates perception-layer readings, doesn't alter truth
- I10: Proposals are scored — return `Proposal[]`
- I18: Every suspicion change is explained — all deltas logged to ledger

---

## Acceptance Criteria

### AC-1: sensor_conflict creates low-confidence SENSOR_READING <- R4.3
- **Given:** at least one room with crew activity
- **When:** `proposeEpistemicPressure()` selects sensor_conflict
- **Then:** returns proposal with SENSOR_READING event, confidence < 0.6, message contains "conflict" or "inconsistent"

### AC-2: sensor_conflict creates ActiveDoubt <- R4.2
- **Given:** sensor_conflict selected
- **When:** proposal is processed
- **Then:** `state.perception.activeDoubts` gains entry with topic referencing the room and system, severity 1, `resolved: false`

### AC-3: audit_prompt creates COMMS_MESSAGE announcing investigation <- R4.1
- **Given:** suspicious crew exists (low motherReliable)
- **When:** `proposeEpistemicPressure()` selects audit_prompt
- **Then:** returns proposal with COMMS_MESSAGE (kind='broadcast') from suspicious crew, text indicates intent to check logs

### AC-4: audit_prompt creates ActiveDoubt with severity 2 <- R4.2
- **Given:** audit_prompt selected
- **When:** proposal is processed
- **Then:** `state.perception.activeDoubts` gains entry with severity 2, topic references log checking

### AC-5: doubt_voiced creates COMMS_MESSAGE expressing uncertainty <- R4.1
- **Given:** any living crew
- **When:** `proposeEpistemicPressure()` selects doubt_voiced
- **Then:** returns proposal with COMMS_MESSAGE (kind='log'), text is one of several doubt phrases

### AC-6: doubt_voiced applies +2 suspicion <- R4.5
- **Given:** doubt_voiced event committed
- **When:** event processing runs
- **Then:** `applySuspicionChange(state, 2, 'DOUBT_VOICED', ...)` is called, ledger entry created

### AC-7: Epistemic events have 'uncertainty' tag <- R4.4
- **Given:** any epistemic event generated
- **When:** proposal is created
- **Then:** tags include `'uncertainty'`

---

## Edge Cases

### EC-1: No rooms with crew activity
- **Scenario:** all crew in same room or no active systems
- **Expected:** sensor_conflict picks any room with crew present (not strictly "activity" required)

### EC-2: During blackout
- **Scenario:** `blackoutTicks > 0`
- **Expected:** sensor_conflict still generates (sensors report conflict regardless — this IS the kind of event that happens during blackout)

### EC-3: doubt_voiced topic variety
- **Scenario:** doubt_voiced generated multiple times
- **Expected:** different doubt phrases are used (at least 4 options in the pool)

---

## Error Cases

None — generator returns empty array when preconditions not met.

---

## Scope

**In Scope:**
- `proposeEpistemicPressure(state, rng)` implementation with 3 event types
- ActiveDoubt creation for sensor_conflict and audit_prompt
- Suspicion ledger integration for doubt_voiced
- Doubt phrase pool (4+ phrases)
- Unit tests for each event type

**Out of Scope:**
- Additional epistemic events (contradiction_setup, unverified_report, log_anomaly) — future content
- Scheduled investigation follow-up for audit_prompt (design doc mentions 10-20 tick delay, but this is future scope)
- Pacing integration testing (Task 005)

---

## Implementation Hints

- For sensor_conflict: pick a room with crew, read truth room state, create a SENSOR_READING with slightly different values and low confidence. The conflict is purely perception-layer.
- For audit_prompt: reuse `pickSuspiciousCrew` from Task 003 (or copy the pattern). The ActiveDoubt severity 2 makes it more urgent to VERIFY.
- For doubt_voiced: any crew member can doubt, not just suspicious ones. Use the phrase pool from the design doc. The suspicion bump is small (+2) and logged.
- ActiveDoubt creation is a side effect (push to `state.perception.activeDoubts[]`), done when the proposal is generated, not when it's selected. This matches the backfire.ts pattern.
- Use weighted random selection among the 3 event types (equal weight initially)

---

## Log

### Planning Notes
**Context:** Second of two parallel event generator tasks. Epistemic events create VERIFY opportunities that satisfy the 'deception beat' pacing beat.
**Decisions:** audit_prompt does NOT schedule a delayed investigation in this task. That's a future enhancement. The doubt alone creates urgency. doubt_voiced uses any crew (not just suspicious) because uncertainty is universal.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
