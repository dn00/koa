# Task 015: Turn Processor

**Status:** backlog
**Assignee:** -
**Blocked By:** 013, 014
**Phase:** Turn Orchestration
**Complexity:** M
**Depends On:** 013-sha256-hash-migration, 014-eventlog-class
**Implements:** R3.1, R3.2, R3.3, R3.4, R3.5, R3.6

---

## Objective

Create a `processTurn()` function that orchestrates a complete turn: applies all damage modifiers, detects contradictions, updates scrutiny, tracks concerns, and emits appropriate events to the EventLog.

---

## Context

Currently the resolver has individual functions for each mechanic (damage, corroboration, contested, contradiction, scrutiny, concerns) but no orchestrator that combines them into a complete turn. The Python kernel has `process_tick()` which serves this role.

This is the "glue" that makes the engine usable - without it, callers must manually sequence all the resolver functions correctly.

### Relevant Files
- `packages/engine-core/src/resolver/damage.ts` - calculateBaseDamage
- `packages/engine-core/src/resolver/corroboration.ts` - checkCorroboration, calculateCorroborationBonus
- `packages/engine-core/src/resolver/contested.ts` - processContestedCards
- `packages/engine-core/src/resolver/contradiction.ts` - detectContradictions
- `packages/engine-core/src/resolver/scrutiny.ts` - getScrutinyDelta, applyScrutinyChange
- `packages/engine-core/src/resolver/concerns.ts` - checkSubmissionConcernsFulfilled
- `packages/engine-core/src/resolver/refutation.ts` - applyRefutations
- `packages/engine-core/src/resolver/events.ts` - Event constructors, EventLog
- `docs/source-files/kernel/tick.py` - Python process_tick reference

### Embedded Context

**Invariant I1 (Deterministic Resolver):**
- Same inputs MUST produce same outputs
- Pure function: (state, submission) → (new_state, events)

**Invariant I6 (Instant Mechanics):**
- Resolution < 120ms p95
- No blocking operations

**Turn Resolution Order (canonical):**
1. Validate submission (1-3 cards)
2. Check for MAJOR contradictions (block if found)
3. Apply refutations to counters
4. Calculate contested penalties
5. Calculate base damage
6. Check corroboration bonus
7. Apply final damage
8. Check for MINOR contradictions → scrutiny
9. Check concern fulfillment
10. Emit events
11. Check win/loss conditions

---

## Acceptance Criteria

### AC-1: processTurn Returns TurnResult ← R3.5
- **Given:** Valid RunState and Submission
- **When:** `processTurn(state, submission, cards, eventLog)`
- **Then:** Returns TurnResult with: newState, events[], damageDealt, scrutinyChange, concernsAddressed[], outcome
- **Test Type:** unit

### AC-2: Damage Includes All Modifiers ← R3.2
- **Given:** Submission with contested cards and corroboration
- **When:** processTurn calculates damage
- **Then:** Applies: base damage + corroboration bonus - contested penalty
- **Test Type:** unit

### AC-3: MAJOR Contradiction Blocks Turn ← R3.3
- **Given:** Submission that causes MAJOR contradiction with committed story
- **When:** processTurn called
- **Then:** Returns error result, no state change, no events emitted
- **Test Type:** unit

### AC-4: MINOR Contradiction Increases Scrutiny ← R3.3
- **Given:** Submission that causes MINOR contradiction
- **When:** processTurn called
- **Then:** Scrutiny increases by 1, SCRUTINY_INCREASED event emitted
- **Test Type:** unit

### AC-5: Concerns Tracked ← R3.4
- **Given:** Submission with card that proves IDENTITY, puzzle has IDENTITY concern
- **When:** processTurn called
- **Then:** Concern marked as addressed, CONCERN_ADDRESSED event emitted
- **Test Type:** unit

### AC-6: Events Appended to Log ← R3.6
- **Given:** Valid submission
- **When:** processTurn called
- **Then:** CARDS_SUBMITTED event appended to eventLog with correct prevEventHash chain
- **Test Type:** unit

### AC-7: Win Condition Detection
- **Given:** State where submission will reduce resistance to 0
- **When:** processTurn called
- **Then:** outcome = 'WON', RUN_ENDED event emitted
- **Test Type:** unit

### AC-8: Loss by Scrutiny Detection
- **Given:** State with scrutiny 4, submission causes MINOR contradiction
- **When:** processTurn called
- **Then:** Scrutiny becomes 5, outcome = 'LOST', RUN_ENDED event emitted
- **Test Type:** unit

### AC-9: Loss by Turns Detection
- **Given:** State with turnsRemaining = 1, resistance > damage dealt
- **When:** processTurn called
- **Then:** turnsRemaining becomes 0, outcome = 'LOST', RUN_ENDED event emitted
- **Test Type:** unit

### AC-10: Refutations Applied Before Contested Check ← R3.2
- **Given:** Card A refutes Counter X, Card B is targeted by Counter X
- **When:** Submission includes both A and B
- **Then:** Counter X is refuted, Card B is NOT contested
- **Test Type:** unit

### Edge Cases

#### EC-1: Single Card Submission
- **Scenario:** Submission with 1 card
- **Expected:** No corroboration bonus, normal processing

#### EC-2: All Cards Contested
- **Scenario:** All 3 submitted cards are contested
- **Expected:** Each gets 50% penalty (ceil), calculated correctly

#### EC-3: Multiple Concerns Addressed
- **Scenario:** Submission addresses 2 concerns
- **Expected:** Both CONCERN_ADDRESSED events emitted

#### EC-4: No Damage Submission
- **Scenario:** All cards have power 0 or fully contested to 0
- **Expected:** State updated (turns decremented), but resistance unchanged

### Error Cases

#### ERR-1: Invalid Submission Size
- **When:** Submission has 0 or >3 cards
- **Then:** Returns error result
- **Error Message:** Pattern: `Submission must contain 1-3 cards`

#### ERR-2: Card Not in Hand
- **When:** Submission references CardId not in dealt hand
- **Then:** Returns error result
- **Error Message:** Pattern: `Card X not in hand`

#### ERR-3: Card Already Committed
- **When:** Submission references CardId already in committed story
- **Then:** Returns error result
- **Error Message:** Pattern: `Card X already committed`

---

## Scope

### In Scope
- `processTurn()` function
- `TurnResult` interface
- Integration of all resolver functions
- Event emission to EventLog
- Win/loss condition detection
- Export from resolver/index.ts

### Out of Scope
- Hand management (drawing new cards)
- Counter deployment timing
- KOA mood calculation
- Voice/bark selection
- UI feedback beyond TurnResult

---

## Implementation Hints

**Function signature:**
```typescript
interface TurnResult {
  readonly ok: true;
  readonly newState: RunState;
  readonly events: readonly GameEvent[];
  readonly damageDealt: number;
  readonly damageBreakdown: {
    readonly base: number;
    readonly corroborationBonus: number;
    readonly contestedPenalty: number;
    readonly final: number;
  };
  readonly scrutinyChange: number;
  readonly concernsAddressed: readonly ConcernId[];
  readonly contradictionDetected: ContradictionResult | null;
  readonly outcome: 'CONTINUE' | 'WON' | 'LOST';
} | {
  readonly ok: false;
  readonly error: string;
  readonly errorType: 'INVALID_SUBMISSION' | 'MAJOR_CONTRADICTION' | 'CARD_NOT_FOUND';
}

function processTurn(
  state: RunState,
  submission: Submission,
  cardLookup: ReadonlyMap<CardId, EvidenceCard>,
  eventLog: EventLog
): TurnResult
```

**Orchestration order:**
```typescript
function processTurn(...): TurnResult {
  // 1. Resolve cards from IDs
  const cards = resolveCards(submission.cardIds, cardLookup);
  if (!cards.ok) return cards;

  // 2. Validate cards are in hand and not committed
  const validation = validateSubmission(cards, state);
  if (!validation.ok) return validation;

  // 3. Check MAJOR contradictions (block turn)
  for (const card of cards) {
    const contradiction = detectContradictions(card, state.committedStory);
    if (contradiction?.severity === 'MAJOR') {
      return { ok: false, error: '...', errorType: 'MAJOR_CONTRADICTION' };
    }
  }

  // 4. Apply refutations
  const updatedCounters = applyRefutations(cards, state.puzzle.counters);

  // 5. Calculate damage with modifiers
  const contestResults = processContestedCards(cards, updatedCounters);
  const baseDamage = contestResults.reduce((sum, r) => sum + r.adjustedPower, 0);
  const corroboration = checkCorroboration(cards);
  const bonus = calculateCorroborationBonus(baseDamage, corroboration.hasCorroboration);
  const finalDamage = baseDamage + bonus;

  // 6. Check MINOR contradictions → scrutiny
  // 7. Check concerns
  // 8. Build new state
  // 9. Emit events
  // 10. Check win/loss
  // 11. Return result
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

**Context:** The resolver has all the pieces but no orchestrator. This is the key function that makes the engine usable for the app layer.

**Decisions:**
- Return discriminated union for error handling (ok: true/false)
- Include detailed damage breakdown for UI/debugging
- EventLog passed in rather than created (caller owns log)

**Questions for Implementer:**
- Consider if we need a "preview" mode that calculates but doesn't emit events
- The cardLookup Map approach assumes cards are pre-loaded; verify this fits app architecture

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-26 21:30 [Planner] Task created from audit recommendations

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created, blocked by 013, 014 |
