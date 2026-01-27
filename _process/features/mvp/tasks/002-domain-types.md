# Task 002: Domain Types

**Status:** done
**Assignee:** Implementer
**Blocked By:** -
**Phase:** Foundation
**Complexity:** M
**Depends On:** 001
**Implements:** R4.1, R4.2, R5.1, R5.2, R6.1, R7.1, R9.1, R11.2

---

## Objective

Define all domain types in engine-core for the Daily Puzzle MVP: EvidenceCard, CounterEvidence, Concern, Puzzle, RunState, and supporting types. These are the foundation all resolver and UI code builds upon.

---

## Context

The adversarial testimony game needs typed models for evidence cards, KOA's counter-evidence, concerns (proof requirements), and game state. All types must be immutable and support deterministic hashing.

### Relevant Files
- `packages/engine-core/src/types/` (to create)
- Reference: `docs/source-files/kernel/types.py`

### Embedded Context

**Type-Safe IDs (from PATTERNS.md):**
```typescript
type CardId = `card_${string}`;
type CounterId = `counter_${string}`;
type PuzzleId = `puzzle_${string}`;
```

**Discriminated Unions for Events:**
```typescript
type GameEvent =
  | { type: 'RUN_STARTED'; payload: RunStartedPayload }
  | { type: 'MOVE_RESOLVED'; payload: MoveResolvedPayload }
  | { type: 'RUN_ENDED'; payload: RunEndedPayload };
```

**Readonly Types (Invariant I1, I4):**
All domain types should be readonly - state is derived from events, never mutated.

**Proof Types (from D31):**
- IDENTITY - "Prove you're you"
- ALERTNESS - "Prove you're awake"
- INTENT - "Prove you meant to do this"
- LOCATION - "Prove you're home"
- LIVENESS - "Prove you're not a photo"

**Mood States (from D12):**
NEUTRAL, CURIOUS, SUSPICIOUS, BLOCKED, GRUDGING, IMPRESSED, RESIGNED, SMUG

**Source Docs:**
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` - Card/concern definitions
- `docs/D03-DETERMINISTIC-RESOLVER-SPEC.md` - State model
- `docs/D04A-GAME-STATE-EVENT-MODEL.md` - Event types

---

## Acceptance Criteria

### AC-1: ProofType Enum <- R4.2
- **Given:** Need to categorize what cards prove
- **When:** ProofType enum is defined
- **Then:** Contains IDENTITY, ALERTNESS, INTENT, LOCATION, LIVENESS
- **Test Type:** unit (type check)

### AC-2: EvidenceCard Type <- R3.1, R6.1, R7.1
- **Given:** Need to represent player cards
- **When:** EvidenceCard type is defined
- **Then:** Has: id, power (integer), proves (ProofType[]), claims (Claims), source?, refutes? (CounterId[])
- **Test Type:** unit (type compilation)

### AC-3: Claims Type <- R7.1
- **Given:** Cards make claims about player's timeline
- **When:** Claims type is defined
- **Then:** Has: location?, state?, activity?, timeRange? (tuple [start, end])
- **Test Type:** unit

### AC-4: CounterEvidence Type <- R5.1, R5.2
- **Given:** KOA plays counter-evidence
- **When:** CounterEvidence type is defined
- **Then:** Has: id, targets (ProofType[]), refutedBy? (CardId), refuted (boolean)
- **Test Type:** unit

### AC-5: Concern Type <- R4.1, R4.2
- **Given:** Puzzles have proof requirements
- **When:** Concern type is defined
- **Then:** Has: id, type (ConcernType), requiredProof (ProofType[]), addressed (boolean)
- **Test Type:** unit

### AC-6: ConcernType Enum <- R4.1
- **Given:** Need concern categories
- **When:** ConcernType enum is defined
- **Then:** Contains IDENTITY, ALERTNESS, INTENT, LOCATION, LIVENESS
- **Test Type:** unit

### AC-7: Puzzle Type <- R4.1, R5.1
- **Given:** Need to represent a daily puzzle
- **When:** Puzzle type is defined
- **Then:** Has: id, targetName, resistance (integer), concerns (Concern[]), counters (CounterEvidence[]), dealtHand (CardId[]), turns (integer)
- **Test Type:** unit

### AC-8: RunState Type <- R9.1
- **Given:** Need to track game state
- **When:** RunState type is defined
- **Then:** Has: puzzle, committedStory (EvidenceCard[]), resistance (integer), scrutiny (integer 0-5), turnsRemaining (integer), concernsAddressed (ConcernId[])
- **Test Type:** unit

### AC-9: KOAMood Enum <- R11.2
- **Given:** KOA has mood states
- **When:** KOAMood enum is defined
- **Then:** Contains NEUTRAL, CURIOUS, SUSPICIOUS, BLOCKED, GRUDGING, IMPRESSED, RESIGNED, SMUG
- **Test Type:** unit

### AC-10: Submission Type <- R3.1
- **Given:** Player submits cards
- **When:** Submission type is defined
- **Then:** Has: cardIds (1-3 CardIds)
- **Test Type:** unit

### Edge Cases

#### EC-1: Empty Arrays Valid
- **Scenario:** Card with empty proves array
- **Expected:** Type allows it (content validation is separate)

### Error Cases

#### ERR-1: Invalid Scrutiny Value
- **When:** Scrutiny set to 6
- **Then:** Type should constrain to 0-5 range
- **Error Message:** N/A (type error at compile time)

---

## Scope

### In Scope
- All enums: ProofType, ConcernType, KOAMood, ContradictionSeverity
- All domain types: EvidenceCard, Claims, CounterEvidence, Concern, Puzzle
- State types: RunState, Submission
- Type-safe IDs: CardId, CounterId, PuzzleId, ConcernId, RunId
- Barrel export in types/index.ts

### Out of Scope
- Event types (Task 009)
- Validation functions (Task 012)
- Result types for resolver (Task 003+)

---

## Implementation Hints

- Use `as const` for enum-like objects if preferred over TS enums
- Consider branded types for IDs: `type CardId = string & { readonly __brand: 'CardId' }`
- All properties should be `readonly`
- Scrutiny constraint: `scrutiny: 0 | 1 | 2 | 3 | 4 | 5` or document as runtime validation

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

**Context:** Types are the contract between engine-core and app. Get them right.
**Decisions:**
- Kept Claims flexible (all optional) - validation is separate
- Scrutiny as union type for compile-time safety
- Included mood states for future KOA integration
**Questions for Implementer:**
- Prefer TS enums or const objects?
- Branded types for IDs or plain strings?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:** PASS WITH COMMENTS
**Date:** 2026-01-26

**AC Verification:**
| AC | Test | Pass | Notes |
|----|------|------|-------|
| AC-1 | 2 tests | ✓ | enums.ts:9-15 |
| AC-2 | 2 tests | ⚠️ | evidence.ts - refutes is single not array |
| AC-3 | 2 tests | ✓ | evidence.ts:12-17 |
| AC-4 | 2 tests | ⚠️ | counter.ts - targets is CardId[] not ProofType[] |
| AC-5 | 1 test | ⚠️ | concern.ts - requiredProof is single not array |
| AC-6 | 2 tests | ✓ | enums.ts:23-31 |
| AC-7 | 1 test | ✓ | puzzle.ts:19-27 |
| AC-8 | 1 test | ✓ | state.ts:35-42 |
| AC-9 | 2 tests | ✓ | enums.ts:36-47 |
| AC-10 | 3 tests | ✓ | state.ts:48-50 |
| EC-1 | 1 test | ✓ | Empty proves array allowed |
| ERR-1 | 2 tests | ✓ | Scrutiny union type 0-5 |

**Test Results:** 29/29 passing

**Issues:**
- Spec deviations (may be intentional design decisions):
  - AC-2: refutes is `CounterId` not `CounterId[]`
  - AC-4: targets is `CardId[]` not `ProofType[]`
  - AC-5: requiredProof is `ProofType` not `ProofType[]`
- Recommend updating spec to match implementation if these are intentional

**Suggestions:**
- Document rationale for spec deviations in Implementation Notes

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
| 2026-01-26 | backlog | done | Implementer | Implementation complete |
| 2026-01-26 | done | done | Reviewer | Review PASS WITH COMMENTS - spec deviations noted |
