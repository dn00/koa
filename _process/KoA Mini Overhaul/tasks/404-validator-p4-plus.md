# Task 404: Validator P4+ Constraint

**Status:** backlog
**Complexity:** M
**Depends On:** 203, 402
**Implements:** R7.8, R7.9

---

## Objective

Add P4 (basic) and P4+ (proper) validator checks to ensure "dangerous information" — after KOA warns about a dimension, both "diversify" and "double down" strategies carry risk because truths and lies overlap on concern dimensions.

---

## Context

### Relevant Files
- `scripts/prototype-v5.ts` — Main validator file
- `scripts/v5-types.ts` — Type definitions

### Embedded Context

**From spec section 7.2 (P4 constraints):**

**Ordered T2 pair definition:**
> - T2 pairs are **ordered**: (A then B) != (B then A)
> - There are **30 possible ordered T2 pairs** (6 cards x 5 remaining = 30)
> - P4/P4+ constraints require existence for **at least one** pair that produces non-`no_concern`

**Concern P4 constraint (basic):**
> - At least one possible Concern (from T2 pairs) must match at least 1 truth
> - This ensures "avoid what KOA mentions" isn't always correct

**Concern P4+ constraint (proper — ensures dangerous info dilemma):**
> For at least **one ordered T2 pair** that produces a non-`no_concern` Concern:
>
> Let `dimPredicate(card)` = "card matches concern dimension" (using the stored payload for `same_system`).
>
> Among the **remaining 4 cards** (not in that T2 pair), require:
>
> 1) There exists **a truth** with `dimPredicate(truth) == true`
>
> 2) There exists **a lie** that makes the information dangerous in **at least one** of these ways:
>    - (A) `dimPredicate(lie) == false` (danger when avoiding the warned dimension)
>    - OR
>    - (B) `dimPredicate(lie) == true` (danger when doubling down on the warned dimension)

**Concern type and computation (from spec section 3.3):**
```typescript
type Concern =
  | { key: 'same_system'; root: SignalRoot }
  | { key: 'automation_heavy' }
  | { key: 'manual_heavy' }
  | { key: 'remote_heavy' }
  | { key: 'absence_heavy' }
  | { key: 'attribution_heavy' }
  | { key: 'integrity_heavy' }
  | { key: 'all_digital' }
  | { key: 'all_sensor' }
  | { key: 'all_testimony' }
  | { key: 'all_physical' }
  | { key: 'no_concern' };
```

**Concern computation priority order (spec 3.3):**
1. `signalRoot` repeats (and != 'unknown') -> `{ key: 'same_system', root: theRepeatedRoot }`
2. `controlPath` repeats -> `{ key: 'automation_heavy' }` | etc.
3. `claimShape` repeats -> `{ key: 'absence_heavy' }` | etc.
4. `evidenceType` repeats -> `{ key: 'all_digital' }` | etc.
5. else -> `{ key: 'no_concern' }`

**Dimension matching logic (spec 3.3 table):**
```typescript
function matchesConcern(card: Card, concern: Concern): boolean {
  switch (concern.key) {
    case 'same_system':
      return card.signalRoot === concern.root;
    case 'automation_heavy':
      return card.controlPath === 'automation';
    case 'manual_heavy':
      return card.controlPath === 'manual';
    case 'remote_heavy':
      return card.controlPath === 'remote';
    case 'absence_heavy':
      return card.claimShape === 'absence';
    case 'attribution_heavy':
      return card.claimShape === 'attribution';
    case 'integrity_heavy':
      return card.claimShape === 'integrity';
    case 'all_digital':
      return card.evidenceType === 'DIGITAL';
    case 'all_sensor':
      return card.evidenceType === 'SENSOR';
    case 'all_testimony':
      return card.evidenceType === 'TESTIMONY';
    case 'all_physical':
      return card.evidenceType === 'PHYSICAL';
    case 'no_concern':
      return false;
  }
}
```

**Computing concern from T2 pair:**
```typescript
function computeConcern(cardA: Card, cardB: Card): Concern {
  // Priority 1: same signalRoot
  if (cardA.signalRoot === cardB.signalRoot && cardA.signalRoot !== 'unknown') {
    return { key: 'same_system', root: cardA.signalRoot };
  }
  // Priority 2: same controlPath
  if (cardA.controlPath === cardB.controlPath && cardA.controlPath !== 'unknown') {
    return { key: `${cardA.controlPath}_heavy` as any };
  }
  // Priority 3: same claimShape
  if (cardA.claimShape === cardB.claimShape) {
    return { key: `${cardA.claimShape}_heavy` as any };
  }
  // Priority 4: same evidenceType
  if (cardA.evidenceType === cardB.evidenceType) {
    return { key: `all_${cardA.evidenceType.toLowerCase()}` as any };
  }
  // No repeat
  return { key: 'no_concern' };
}
```

---

## Acceptance Criteria

### AC-1: P4 basic — at least one concern matches a truth <- R7.8
- **Given:** A puzzle with 6 cards (3 truths, 3 lies)
- **When:** Checking all 30 ordered T2 pairs
- **Then:** Check V11 passes if at least one T2 pair produces a concern that matches at least one truth
- **Then:** Check V11 fails if every concern either is `no_concern` or matches zero truths

### AC-2: P4+ — dangerous info dilemma exists <- R7.9
- **Given:** A puzzle with 6 cards
- **When:** Checking all 30 ordered T2 pairs that produce non-`no_concern`
- **Then:** Check V12 passes if at least one pair satisfies:
  - Among the 4 remaining cards (not in T2 pair):
    - At least 1 truth matches the concern dimension
    - At least 1 lie exists (matching OR non-matching creates danger)
- **Then:** Check V12 fails if no pair creates the P4+ dilemma

---

## Edge Cases

### EC-1: All T2 pairs produce no_concern
- **Scenario:** No dimension repeats in any pair (all cards maximally diverse)
- **Expected:** V11 fails: "no T2 pair produces a concern — all pairs are balanced"

### EC-2: Concern matches only lies
- **Scenario:** Pair (A,B) produces `automation_heavy`, but only lies have `controlPath: 'automation'`
- **Expected:** V11 fails for this pair; might pass if another pair works
- **Expected:** V12 fails if no truth matches any concern

### EC-3: P4+ both paths dangerous
- **Scenario:** Pair produces `same_system:router_net`, remaining cards have:
  - Truth with signalRoot: 'router_net' (matches)
  - Lie with signalRoot: 'router_net' (double down danger)
  - Lie with signalRoot: 'phone_os' (diversify danger)
- **Expected:** V12 passes — both strategies are risky

### EC-4: P4+ one path safe
- **Scenario:** Remaining cards have truth matching concern but all lies also match
- **Expected:** V12 passes — diversifying avoids all lies but the truth matches

---

## Error Cases

### ERR-1: Missing card fields
- **When:** Card missing signalRoot or controlPath
- **Then:** Task 401 catches this first; P4 checks assume valid data

### ERR-2: Insufficient remaining cards
- **When:** T2 pair selected, only 4 cards remain
- **Then:** Expected — this is correct (6 cards - 2 in pair = 4 remaining)

---

## Scope

**In Scope:**
- Add helper: computeConcern(cardA, cardB) -> Concern
- Add helper: matchesConcern(card, concern) -> boolean
- Add check V11: P4 basic (concern matches at least 1 truth)
- Add check V12: P4+ (dangerous info dilemma)
- V11 is error severity; V12 can be warn (nice-to-have but important)

**Out of Scope:**
- Concern computation at runtime (Task 203)
- Concern bark generation
- Actual gameplay concern flow

---

## Implementation Hints

1. Place computeConcern and matchesConcern as module-level helpers
2. Generate all 30 ordered pairs: `for (const a of cards) for (const b of cards) if (a !== b)`
3. For P4 basic: early exit on first passing pair
4. For P4+: need to check remaining 4 cards for each pair
5. Consider caching concern computation if performance matters

**Suggested check IDs:**
- V11: P4 basic (concern matches truth)
- V12: P4+ dilemma (dangerous info)

**Example detail strings:**
- V11 pass: "P4 satisfied: pair [card-1, card-2] -> same_system:router_net matches truth card-3"
- V11 fail: "no T2 pair produces concern matching any truth"
- V12 pass: "P4+ satisfied: pair [card-1, card-2] creates dilemma (truth matches, lies trap both paths)"
- V12 fail: "no T2 pair creates P4+ dilemma — diversifying is always safe"

**Algorithm sketch for V12:**
```typescript
function checkP4Plus(puzzle: V5Puzzle): { passed: boolean; detail: string } {
  const cards = puzzle.cards;
  const truths = cards.filter(c => !c.isLie);
  const lies = cards.filter(c => c.isLie);

  for (const cardA of cards) {
    for (const cardB of cards) {
      if (cardA === cardB) continue;

      const concern = computeConcern(cardA, cardB);
      if (concern.key === 'no_concern') continue;

      const remaining = cards.filter(c => c !== cardA && c !== cardB);
      const remainingTruths = remaining.filter(c => !c.isLie);
      const remainingLies = remaining.filter(c => c.isLie);

      // Requirement 1: at least one remaining truth matches concern
      const truthMatches = remainingTruths.some(t => matchesConcern(t, concern));
      if (!truthMatches) continue;

      // Requirement 2: at least one lie creates danger (either path)
      // Always satisfied if there's a lie in remaining (either matches or doesn't)
      const hasLie = remainingLies.length > 0;
      if (!hasLie) continue;

      return {
        passed: true,
        detail: `pair [${cardA.id}, ${cardB.id}] -> ${concern.key} creates P4+ dilemma`
      };
    }
  }

  return { passed: false, detail: 'no T2 pair creates P4+ dilemma' };
}
```

---

## Log

### Planning Notes
**Context:** P4 is the "dangerous information" principle — suspicion should be double-edged
**Decisions:** P4+ is stricter; V12 could be warn if too hard to satisfy initially
