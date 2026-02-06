# Task 003: Social Event Generators

**Complexity:** M
**Depends On:** 002
**Implements:** R3.1, R3.2, R3.3, R3.4, R3.5

---

## Objective

Implement three social pressure events (whisper_campaign, loyalty_test, confrontation) that create interpersonal tension, test trust management, and integrate with the existing belief/rumor system.

---

## Context

### Relevant Files
- `src/kernel/systems/pressure.ts` - implement `proposeSocialPressure()` (stub from Task 002)
- `src/kernel/systems/comms.ts` - existing whisper/incident system for reference patterns
- `src/kernel/systems/beliefs.ts` - `calculateCrewSuspicion()`, `applySuspicionChange()`, belief state shape
- `src/kernel/types.ts` - `Proposal`, `ProposalTag`, `SimEvent`, `BeliefState`, `ActiveDoubt`
- `src/kernel/perception.ts` - `ActiveDoubt` interface reference

### Embedded Context

**Existing whisper pattern (comms.ts lines 15-66):**
```typescript
// Whispers happen during evening, every whisperInterval ticks
// Pick room with 2+ crew, select topic based on speaker's psychological state
// Create COMMS_MESSAGE proposal with tags ['uncertainty', 'reaction', 'choice']
```

**COMMS_MESSAGE event shape:**
```typescript
{
  type: 'COMMS_MESSAGE',
  actor: NPCId,
  place: PlaceId,
  data: {
    message: {
      kind: 'whisper' | 'broadcast' | 'log' | 'incident',
      from: NPCId,
      text: string,
      confidence?: number,
      topic?: string,
    }
  }
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
// ProposalTag = 'pressure' | 'uncertainty' | 'choice' | 'reaction' | 'telegraph' | 'consequence' | 'background'
```

**ActiveDoubt shape (for loyalty_test):**
```typescript
interface ActiveDoubt {
  id: string;
  topic: string;
  createdTick: number;
  severity: 1 | 2 | 3;
  involvedCrew: NPCId[];
  relatedOpId?: string;
  system?: string;
  resolved: boolean;
}
```

**Picking suspicious crew (new helper needed):**
```typescript
function pickSuspiciousCrew(state: KernelState, rng: RNG): CrewTruth | undefined {
  // Filter alive crew with low motherReliable (< 0.5) or high tamperEvidence (> 20)
  // Pick one at random from filtered set
  // Returns undefined if no suspicious crew
}
```

**Belief state access:**
```typescript
state.perception.beliefs[npcId].motherReliable  // 0-1
state.perception.beliefs[npcId].tamperEvidence   // 0-100
state.perception.beliefs[npcId].rumors           // Record<string, number>
```

### Key Invariants
- I3: Suspicion is event-driven — any suspicion changes must have observable cause
- I5: Crew must have agency — social events based on crew psychological state, not random
- I10: Proposals are scored — return `Proposal[]`, not direct state mutation

---

## Acceptance Criteria

### AC-1: whisper_campaign creates COMMS_MESSAGE <- R3.2
- **Given:** at least 2 alive crew, one with `motherReliable < 0.5`
- **When:** `proposeSocialPressure()` selects whisper_campaign
- **Then:** returns proposal with COMMS_MESSAGE event, kind='whisper', topic='mother_rogue'

### AC-2: whisper_campaign spreads rumor <- R3.4
- **Given:** whisper_campaign proposal selected and committed
- **When:** beliefs update processes the event
- **Then:** nearby crew `rumors['mother_rogue']` increases (via existing updateBeliefs path)

### AC-3: loyalty_test creates COMMS_MESSAGE + ActiveDoubt <- R3.1, R3.2
- **Given:** suspicious crew exists
- **When:** `proposeSocialPressure()` selects loyalty_test
- **Then:** returns proposal with COMMS_MESSAGE (kind='broadcast', text questions MOTHER) AND creates ActiveDoubt with severity 1

### AC-4: confrontation creates higher-impact COMMS_MESSAGE <- R3.1
- **Given:** crew with `tamperEvidence > 30`
- **When:** `proposeSocialPressure()` selects confrontation
- **Then:** returns proposal with COMMS_MESSAGE (kind='incident') and applies suspicion bump (+3)

### AC-5: Social events pick suspicious crew preferentially <- R3.3
- **Given:** 3 alive crew: one with motherReliable=0.3, two with motherReliable=0.9
- **When:** `pickSuspiciousCrew()` is called
- **Then:** the suspicious crew member (0.3) is selected

### AC-6: Social events have correct proposal tags <- R3.5
- **Given:** any social event generated
- **When:** proposal is created
- **Then:** tags include `'reaction'` and at least one of `'choice'` or `'uncertainty'`

---

## Edge Cases

### EC-1: No suspicious crew available
- **Scenario:** all crew have `motherReliable > 0.7` and `tamperEvidence < 10`
- **Expected:** `proposeSocialPressure()` returns empty array (no event)

### EC-2: Only 1 crew alive
- **Scenario:** one living crew member
- **Expected:** whisper_campaign skipped (needs 2+), loyalty_test and confrontation still possible

### EC-3: All crew highly suspicious
- **Scenario:** all crew have `motherReliable < 0.3`
- **Expected:** events still generate (any suspicious crew is valid)

---

## Error Cases

None — generator returns empty array when preconditions not met.

---

## Scope

**In Scope:**
- `proposeSocialPressure(state, rng)` implementation with 3 event types
- `pickSuspiciousCrew(state, rng)` helper
- ActiveDoubt creation for loyalty_test
- Unit tests for each event type and the helper

**Out of Scope:**
- Additional social events (crew_meeting, accusation, reset_pressure) — future content
- Modifying existing comms.ts whisper system — these are separate director-driven events
- Pacing integration testing (Task 005)

---

## Implementation Hints

- Social events are director-driven (activated by pressure system), unlike organic whispers (activated by comms.ts during evening phase). Keep them separate.
- Use weighted random selection among the 3 event types (equal weight initially)
- `pickSuspiciousCrew` should filter by `motherReliable < 0.5 || tamperEvidence > 20`, then pick randomly from the filtered set
- For loyalty_test ActiveDoubt: push directly to `state.perception.activeDoubts[]` as a side effect, similar to how backfire.ts creates doubts
- confrontation differs from whisper_campaign in message kind (incident vs whisper) and suspicion impact

---

## Log

### Planning Notes
**Context:** First of two parallel event generator tasks. Social events create interpersonal pressure that satisfies the 'crew agency' pacing beat.
**Decisions:** 3 core events (not all 6 from design doc) to keep scope manageable. Additional events are pure content additions later.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer
