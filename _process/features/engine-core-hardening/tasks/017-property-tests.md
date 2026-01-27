# Task 017: Property-Based Invariant Tests

**Status:** ready
**Assignee:** -
**Blocked By:** -
**Phase:** Verification
**Complexity:** M
**Depends On:** none (can run in parallel with other tasks)
**Implements:** R5.1, R5.2, R5.3

---

## Objective

Implement property-based tests using fast-check to verify resolver invariants hold under random inputs, catching edge cases that example-based tests miss.

---

## Context

From `docs/kernel-hardening.md` §7 (SHOULD, near-MUST):

> Randomly generate:
> - valid-ish states
> - random action sequences
>
> Assert:
> - invariants hold after each step
> - no crashes
> - determinism holds for same seed/inputs
>
> **CI gate:**
> - `GATE-PROP-01`: run N=5k steps per module nightly; smaller N on PR

Property-based testing is particularly valuable for the resolver because:
- Many edge cases in time parsing, damage calculation, contradiction detection
- Invariants like "scrutiny never exceeds 5" should hold for ALL inputs
- Determinism means same seed must produce same results

### Relevant Files
- `packages/engine-core/src/resolver/` - All resolver functions
- `packages/engine-core/tests/resolver/` - Existing tests to extend

### Embedded Context

**Invariant I1 (Deterministic Resolver):**
- Same inputs MUST produce same outputs
- Same seed → same results

**Key Properties to Test:**
1. Damage is always non-negative
2. Scrutiny is always 0-5
3. Resistance never goes below 0
4. Same events → same state hash
5. Corroboration bonus is ceil(base * 0.25) when applicable
6. Contested penalty is ceil(power * 0.5) when applicable

---

## Acceptance Criteria

### AC-1: fast-check Dependency Added ← R5.1
- **Given:** Project needs property testing
- **When:** Package is installed
- **Then:** fast-check is available as devDependency
- **Test Type:** unit (import works)

### AC-2: Arbitrary EvidenceCard Generator ← R5.1
- **Given:** Need random valid cards for testing
- **When:** `arbitraryCard()` is called
- **Then:** Generates valid EvidenceCard with random power (0-10), random claims, random proves
- **Test Type:** unit

### AC-3: Arbitrary Submission Generator ← R5.1
- **Given:** Need random valid submissions
- **When:** `arbitrarySubmission(cards)` is called
- **Then:** Generates valid Submission with 1-3 cards from provided set
- **Test Type:** unit

### AC-4: Damage Invariant Property ← R5.2
- **Given:** Any valid submission of cards
- **When:** `calculateBaseDamage(cards)` is called
- **Then:** Result is non-negative integer (0 ≤ damage ≤ sum of powers)
- **Test Type:** property (100 runs)

### AC-5: Scrutiny Invariant Property ← R5.2
- **Given:** Any scrutiny change operation
- **When:** `applyScrutinyChange(current, delta)` is called
- **Then:** Result scrutiny is in range [0, 5]
- **Test Type:** property (100 runs)

### AC-6: Corroboration Bonus Property ← R5.2
- **Given:** Any base damage and corroboration status
- **When:** `calculateCorroborationBonus(base, hasCorroboration)` is called
- **Then:** Result is 0 if no corroboration, else ceil(base * 0.25)
- **Test Type:** property (100 runs)

### AC-7: Contested Penalty Property ← R5.2
- **Given:** Any power value and contested status
- **When:** `applyContestedPenalty(power, isContested)` is called
- **Then:** Result is power if not contested, else ceil(power * 0.5)
- **Test Type:** property (100 runs)

### AC-8: Determinism Property ← R5.3
- **Given:** Same events array
- **When:** `deriveState(events)` called twice
- **Then:** Both results have identical state hashes
- **Test Type:** property (50 runs with complex event sequences)

### AC-9: State Hash Determinism ← R5.3
- **Given:** Same RunState object
- **When:** `computeStateHash(state)` called multiple times
- **Then:** All calls return identical hash
- **Test Type:** property (100 runs)

### Edge Cases

#### EC-1: Zero Power Cards
- **Scenario:** All cards have power 0
- **Expected:** Damage is 0, no crash

#### EC-2: Maximum Scrutiny Input
- **Scenario:** Current scrutiny is 5, delta is positive
- **Expected:** Still returns 5 (clamped)

#### EC-3: Empty Claims Object
- **Scenario:** Card with no claims (empty object)
- **Expected:** No corroboration possible, no contradiction

### Error Cases

#### ERR-1: Invalid Card Array Size
- **When:** calculateBaseDamage with 0 or >3 cards
- **Then:** Returns error result (not crash)

---

## Scope

### In Scope
- Add fast-check devDependency
- Create arbitrary generators for domain types
- Property tests for damage calculation
- Property tests for scrutiny system
- Property tests for corroboration/contested
- Property tests for determinism
- Configure vitest to run property tests

### Out of Scope
- Fuzzing with malformed inputs (adversarial testing)
- Performance benchmarks
- Property tests for validation module
- Nightly extended runs (CI configuration)

---

## Implementation Hints

**Install fast-check:**
```bash
npm install -D fast-check --workspace=packages/engine-core
```

**Arbitrary generators:**
```typescript
import * as fc from 'fast-check';
import type { CardId, EvidenceCard, Claims, ProofType } from '../src/index.js';

const arbCardId = fc.string({ minLength: 5, maxLength: 20 })
  .map(s => `card_${s}` as CardId);

const arbProofType = fc.constantFrom(
  'IDENTITY', 'ALERTNESS', 'INTENT', 'LOCATION', 'LIVENESS'
) as fc.Arbitrary<ProofType>;

const arbClaims: fc.Arbitrary<Claims> = fc.record({
  location: fc.option(fc.string(), { nil: undefined }),
  state: fc.option(fc.constantFrom('ASLEEP', 'AWAKE', 'ALERT', 'ACTIVE'), { nil: undefined }),
  activity: fc.option(fc.string(), { nil: undefined }),
  timeRange: fc.option(fc.string(), { nil: undefined }),
});

const arbCard: fc.Arbitrary<EvidenceCard> = fc.record({
  id: arbCardId,
  power: fc.integer({ min: 0, max: 10 }),
  proves: fc.array(arbProofType, { minLength: 0, maxLength: 3 }),
  claims: arbClaims,
});
```

**Property test example:**
```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { calculateBaseDamage } from '../src/resolver/damage.js';

describe('damage properties', () => {
  it('damage is non-negative for valid submissions', () => {
    fc.assert(
      fc.property(
        fc.array(arbCard, { minLength: 1, maxLength: 3 }),
        (cards) => {
          const result = calculateBaseDamage(cards);
          if (result.ok) {
            return result.value >= 0;
          }
          return true; // Error case is ok
        }
      )
    );
  });
});
```

**Test file location:** `packages/engine-core/tests/resolver/properties.test.ts`

---

## Definition of Done

- [ ] fast-check installed as devDependency
- [ ] Arbitrary generators for key types
- [ ] At least 6 property tests covering core invariants
- [ ] All property tests pass with 100+ runs
- [ ] Code follows project patterns
- [ ] Types are correct (no `any`)
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** kernel-hardening.md §7 recommends property tests as near-MUST. These catch edge cases that manual tests miss by testing invariants against random inputs.

**Decisions:**
- Use fast-check (mature, well-typed, works with vitest)
- Start with core resolver invariants
- Run 100 iterations in CI (can increase for nightly)

**Questions for Implementer:**
- Consider if arbitrary generators should be shared across test files
- May want to seed randomness for reproducibility on failures

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-26 21:50 [Planner] Task created from kernel-hardening.md §7

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | ready | Planner | Created, no dependencies |
