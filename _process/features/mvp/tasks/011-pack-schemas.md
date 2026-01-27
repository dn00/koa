# Task 011: Pack Schemas

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Content System
**Complexity:** M
**Depends On:** 002
**Implements:** R10.1, R10.2

---

## Objective

Define JSON schemas for Puzzle Pack and Voice Pack. These schemas enable validation and are the contract between content creators and the game engine.

---

## Context

Packs are the content delivery mechanism. Puzzle Packs contain puzzles, cards, counters, and concerns. Voice Packs contain KOA's barks keyed by OutcomeKey. Both must be validated before use.

### Relevant Files
- `packages/engine-core/src/validation/schemas/` (to create)
- Reference: `docs/D09-PACK-SCHEMAS.md`

### Embedded Context

**Pack Types (from D08, D24):**
1. **Puzzle Pack:** puzzles, cards, counters, concerns
2. **Voice Pack:** barks keyed by OutcomeKey

**Schema Requirements:**
- All IDs must be unique within pack
- All references must resolve
- Cards must have valid proof types
- Concerns must reference valid types

**Invariant I5 - Fail-Closed:**
- Invalid pack = error, not degraded experience
- Clear error messages

**Source Docs:**
- `docs/D09-PACK-SCHEMAS.md` - Pack JSON schemas
- `docs/D08-PACK-SYSTEM-OVERVIEW.md` - Pack architecture
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Content requirements

---

## Acceptance Criteria

### AC-1: EvidenceCard Schema <- R10.1
- **Given:** Need to validate card JSON
- **When:** Schema is defined
- **Then:** Validates: id, power (int ≥ 0), proves (ProofType[]), claims, source?, refutes?
- **Test Type:** unit

### AC-2: CounterEvidence Schema <- R10.1
- **Given:** Need to validate counter JSON
- **When:** Schema is defined
- **Then:** Validates: id, targets (ProofType[]), name, description
- **Test Type:** unit

### AC-3: Concern Schema <- R10.1
- **Given:** Need to validate concern JSON
- **When:** Schema is defined
- **Then:** Validates: id, type (ConcernType), requiredProof, label
- **Test Type:** unit

### AC-4: Puzzle Schema <- R10.1
- **Given:** Need to validate puzzle JSON
- **When:** Schema is defined
- **Then:** Validates: id, targetName, resistance (int), concerns (ConcernId[]), counters (CounterId[]), dealtHand (CardId[]), turns (int)
- **Test Type:** unit

### AC-5: Puzzle Pack Schema <- R10.1
- **Given:** Need to validate complete puzzle pack
- **When:** Schema is defined
- **Then:** Validates: version, puzzles[], cards[], counters[], concerns[], metadata
- **Test Type:** unit

### AC-6: Voice Pack Schema <- R10.2
- **Given:** Need to validate voice pack
- **When:** Schema is defined
- **Then:** Validates: version, barks (Record<OutcomeKey, BarkEntry[]>), moods, fallbacks
- **Test Type:** unit

### AC-7: OutcomeKey Format <- R10.2
- **Given:** Barks are keyed by OutcomeKey
- **When:** OutcomeKey pattern is defined
- **Then:** Format like "COUNTER_PLAYED:security_camera" or "WIN:clean"
- **Test Type:** unit

### AC-8: Schema Export <- R10.1
- **Given:** Schemas defined
- **When:** Imported in validation code
- **Then:** Can be used with Zod, AJV, or similar
- **Test Type:** integration

### Edge Cases

#### EC-1: Empty Arrays
- **Scenario:** Pack with empty puzzles array
- **Expected:** Valid (but useless)

#### EC-2: Optional Fields
- **Scenario:** Card without refutes field
- **Expected:** Valid (refutes is optional)

### Error Cases

#### ERR-1: Invalid Proof Type
- **When:** Card has proves: ['INVALID']
- **Then:** Schema validation fails
- **Error Message:** "Invalid proof type: INVALID"

#### ERR-2: Negative Power
- **When:** Card has power: -5
- **Then:** Schema validation fails
- **Error Message:** "power must be >= 0"

---

## Scope

### In Scope
- Zod schemas (or similar) for all types
- Puzzle Pack schema
- Voice Pack schema
- OutcomeKey format definition
- Export for use in validation

### Out of Scope
- Reference validation (IDs resolve) - Task 012
- Pack loading - Task 014
- Actual pack content - Tasks 025, 026

---

## Implementation Hints

```typescript
import { z } from 'zod';

// Enums as Zod schemas
const ProofTypeSchema = z.enum([
  'IDENTITY', 'ALERTNESS', 'INTENT', 'LOCATION', 'LIVENESS'
]);

const ClaimsSchema = z.object({
  location: z.string().optional(),
  state: z.string().optional(),
  activity: z.string().optional(),
  timeRange: z.tuple([z.string(), z.string()]).optional(),
});

const EvidenceCardSchema = z.object({
  id: z.string().startsWith('card_'),
  power: z.number().int().min(0),
  proves: z.array(ProofTypeSchema),
  claims: ClaimsSchema,
  source: z.string().optional(),
  refutes: z.array(z.string()).optional(),
});

const PuzzlePackSchema = z.object({
  version: z.string(),
  puzzles: z.array(PuzzleSchema),
  cards: z.array(EvidenceCardSchema),
  counters: z.array(CounterEvidenceSchema),
  concerns: z.array(ConcernSchema),
  metadata: z.object({
    name: z.string(),
    author: z.string(),
    createdAt: z.string(),
  }),
});
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

**Context:** Schemas are the contract between content and code.
**Decisions:**
- Use Zod for runtime validation + type inference
- Separate schemas for each type, compose into pack schemas
**Questions for Implementer:**
- Zod vs AJV preference?
- Should schema be in engine-core (pure) or separate package?

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
