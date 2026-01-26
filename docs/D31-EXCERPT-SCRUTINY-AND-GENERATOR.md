# D31 Excerpt: Scrutiny System & Generator Constraints

Extracted from D31-ADVERSARIAL-TESTIMONY-DESIGN.md v1.5 for review.

---

## Scrutiny System

### Scrutiny Sources

| Event | Scrutiny | Notes |
|-------|----------|-------|
| MINOR contradiction | +1 | Suspicious but allowed |
| MAJOR contradiction | — | Blocked, can't submit |
| SKETCHY trust card used | +1 | Low-quality evidence |
| Counter not refuted | +0 | Just reduced damage, no scrutiny |

**Note:** "0 damage turn" removed — with BLOCK counters eliminated, 0 damage is rare. MINOR contradictions and SKETCHY cards provide sufficient scrutiny pressure.

### Scrutiny as Resource

Scrutiny is a **spendable resource** for pushing through minor contradictions.

- Start at 0
- Cap at 5 (loss trigger)

**Strategic implication:** You can "spend" 1-2 scrutiny on minor contradictions if it helps you win, but don't push your luck.

### Scrutiny 5 = Loss

Scrutiny reaches 5 → **IMMEDIATE LOSS**

AURA: "Your story fell apart under scrutiny. Too many inconsistencies. Access denied."

**Why no penalty loop?** Soft contradictions already provide recovery (MINOR = continue with +1 scrutiny). A second forgiveness mechanism adds complexity without adding fun. Clean rule: 5 scrutiny = you pushed too hard = game over.

### Recovery from Mistakes

The soft contradiction system provides a natural recovery path:

| Mistake | Old Design | New Design |
|---------|------------|------------|
| Slightly wrong timing | Blocked, stuck | +1 scrutiny, continue |
| Major logical error | Blocked, stuck | Blocked, must use different card |
| Multiple minor mistakes | — | Accumulates scrutiny, lose at 5 |

This means novice players can make 1-4 small mistakes and still win, while experts avoid scrutiny entirely for better scores.

---

## Puzzle Generator Constraints

### Solvability Guarantee

**Rule:** Every DEALT hand MUST have at least one winning path.

The puzzle generator must verify:
1. The 6 dealt cards can address all concerns
2. At least 4-5 cards have no internal contradictions (the "main path")
3. **Main path's total power ≥ resistance + 10** (comfortable margin)
4. Refutation card exists for at least the primary AURA counter
5. Brute-force path (accept all contests) is viable on Easy/Normal
6. **At least 2 distinct winning paths exist**

### Multiple Paths Definition (Strong Constraint)

**Requirement:** Two solutions must be meaningfully different, not cosmetic variations.

**Definition of "distinct":**
- Solutions differ by at least **2 card plays**, OR
- Solutions differ in **strategy**: one refutes a counter, the other eats contested penalty and compensates via corroboration/other cards

**Example of valid distinct paths:**
- Path A: Face ID → Refute Camera → Smart Watch → Voice Log (refutation strategy)
- Path B: Face ID (contested) → Smart Watch → Voice Log + Noise Complaint with corroboration (eat contest, compensate with bonus)

**Example of INVALID "distinct" paths:**
- Path A: Face ID → Smart Watch → Voice Log
- Path B: Smart Watch → Face ID → Voice Log (just reordering, same cards)

### Comfortable Margins Rule

**Problem:** If the safe path wins by only 1-5 points, the game feels like a math puzzle.

**Solution:** Design puzzles where the safe path wins by 10-15 points.

| Difficulty | Resistance | Safe Path Power | Margin |
|------------|------------|-----------------|--------|
| Tutorial | 20 | ~32 | +12 |
| Easy | 25 | ~38 | +13 |
| Normal | 35 | ~48 | +13 |
| Hard | 45 | ~55 | +10 |
| Expert | 50 | ~60 | +10 |

### Trap Card Rules

**Trap cards** are high-power cards with claims that conflict with the "main path."

Requirements:
- **Max 1 trap per dealt hand**
- Trap card is **identifiable through reading** (name, source, flavor hint)
- Trap card is never REQUIRED to win
- Trap card should tempt (high power) but be avoidable

### Puzzle Variety Requirements

Not all puzzles should have the same tension source. Rotate between:

| Puzzle Type | Tension Source | Refutation Role |
|-------------|---------------|-----------------|
| Trap puzzle | High-power card conflicts with main path | Optional |
| Counter-heavy | 3-4 counters, refutation sequencing matters | Central |
| Eat-the-contest | Accepting 50% penalty + corroboration is optimal | Suboptimal (intentionally) |
| Tight margins | Low resistance, every point matters | Varies |
| Corroboration | Bonus for finding claim synergies | Secondary |

**Key constraint for (C) risk:** At least 1 puzzle per week should make "eat the contest" the optimal strategy, so refutations don't become mandatory chores.

---

## Damage Formula

```typescript
function calculateDamage(submission: EvidenceCard[], auraCounter: CounterEvidence | null): number {
  // Step 1: Per-card damage (contested penalty applies per-card)
  let totalDamage = 0;
  for (const card of submission) {
    let cardDamage = card.power;

    // Contested: 50% if this card's proof type is targeted
    if (auraCounter && !auraCounter.refuted &&
        auraCounter.targets.some(t => card.proves.includes(t))) {
      cardDamage = Math.ceil(cardDamage * 0.5); // Round UP
    }

    totalDamage += cardDamage;
  }

  // Step 2: Corroboration bonus on sum
  if (hasCorroboration(submission)) {
    totalDamage = Math.ceil(totalDamage * 1.25); // Round UP
  }

  return totalDamage;
}
```

**Key points:**
- Contested penalty is per-card, not whole submission
- Corroboration applies after contested penalties
- All rounding favors player (ceil)
- Refutation restores contested damage retroactively

---

## Win/Lose Conditions

**Win when:**
- Resistance reaches 0, AND
- All concerns are addressed

**Lose when:**
- Turns exhausted, OR
- Scrutiny reaches 5
