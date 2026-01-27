# Task 006: Counter-Evidence and Contested Penalty

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Engine
**Complexity:** S
**Depends On:** 003
**Implements:** R5.3, R5.5

---

## Objective

Implement the contested penalty mechanic: when KOA's counter-evidence targets the same proof type as a submitted card, that card's damage is halved (50% penalty).

---

## Context

KOA plays counter-evidence that challenges the player's claims. If a card proves IDENTITY and KOA has a counter targeting IDENTITY, the card is "contested" and deals half damage.

### Relevant Files
- `packages/engine-core/src/resolver/contested.ts` (to create)
- Depends on: `packages/engine-core/src/types/`

### Embedded Context

**Contested Rule (from D24, D31):**
```
for each card in submission:
    card_damage = card.power
    if counter targets this card's proof type AND not refuted:
        card_damage = ceil(card_damage * 0.5)  # 50% contested
```

**Counter-Evidence (from D31):**
- Each counter targets specific proof type(s)
- Counter can be marked as refuted (Task 007)
- Refuted counters don't apply penalty

**Invariant I1 - Determinism:**
- Use `Math.ceil()` for rounding
- Integer result

**Source Docs:**
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` - Counter mechanics

---

## Acceptance Criteria

### AC-1: Detect Contested Card <- R5.3
- **Given:** Card proves IDENTITY, counter targets IDENTITY, not refuted
- **When:** isCardContested(card, counter) is called
- **Then:** Returns true
- **Test Type:** unit

### AC-2: Not Contested Different Type <- R5.3
- **Given:** Card proves IDENTITY, counter targets LOCATION
- **When:** isCardContested(card, counter) is called
- **Then:** Returns false
- **Test Type:** unit

### AC-3: Not Contested When Refuted <- R5.3
- **Given:** Card proves IDENTITY, counter targets IDENTITY, refuted = true
- **When:** isCardContested(card, counter) is called
- **Then:** Returns false
- **Test Type:** unit

### AC-4: Apply 50% Penalty <- R5.3
- **Given:** Card with power 10, contested
- **When:** applyContestedPenalty(10, true) is called
- **Then:** Returns 5 (ceil(10 * 0.5))
- **Test Type:** unit

### AC-5: No Penalty When Not Contested <- R5.3
- **Given:** Card with power 10, not contested
- **When:** applyContestedPenalty(10, false) is called
- **Then:** Returns 10 (unchanged)
- **Test Type:** unit

### AC-6: Ceil Rounding <- R5.3, I1
- **Given:** Card with power 7, contested
- **When:** applyContestedPenalty(7, true) is called
- **Then:** Returns 4 (ceil(7 * 0.5) = ceil(3.5) = 4)
- **Test Type:** unit

### AC-7: Multiple Proof Types <- R5.3
- **Given:** Card proves [IDENTITY, LOCATION], counter targets [IDENTITY]
- **When:** isCardContested(card, counter) is called
- **Then:** Returns true (any overlap counts)
- **Test Type:** unit

### Edge Cases

#### EC-1: Card With Empty Proves
- **Scenario:** Card has empty proves array
- **Expected:** Not contested (nothing to target)

#### EC-2: Counter With Empty Targets
- **Scenario:** Counter has empty targets array
- **Expected:** Nothing contested by this counter

#### EC-3: Multiple Counters
- **Scenario:** Card contested by multiple counters
- **Expected:** Still only 50% penalty (not cumulative)

### Error Cases

None - type system should catch invalid input.

---

## Scope

### In Scope
- `isCardContested(card: EvidenceCard, counter: CounterEvidence): boolean`
- `applyContestedPenalty(power: number, contested: boolean): number`
- `calculateContestedDamage(cards: EvidenceCard[], counters: CounterEvidence[]): number`

### Out of Scope
- Refutation mechanics (Task 007)
- Damage restoration after refutation (Task 007)
- Counter visibility modes (UI)

---

## Implementation Hints

```typescript
const CONTESTED_MULTIPLIER = 0.5;

export function isCardContested(
  card: EvidenceCard,
  counter: CounterEvidence
): boolean {
  if (counter.refuted) return false;

  // Check if any proof type overlaps with counter targets
  return card.proves.some(proof => counter.targets.includes(proof));
}

export function applyContestedPenalty(power: number, contested: boolean): number {
  if (!contested) return power;
  return Math.ceil(power * CONTESTED_MULTIPLIER);
}

export function calculateContestedDamage(
  cards: readonly EvidenceCard[],
  counters: readonly CounterEvidence[]
): number {
  let total = 0;
  for (const card of cards) {
    const contested = counters.some(c => isCardContested(card, c));
    total += applyContestedPenalty(card.power, contested);
  }
  return total;
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

**Context:** Core adversarial mechanic - KOA fights back.
**Decisions:**
- Penalty is per-card, not total damage
- Multiple counters don't stack (still 50%)
- Refuted counters have no effect
**Questions for Implementer:**
- Should we track which counter contested which card for event log?

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
