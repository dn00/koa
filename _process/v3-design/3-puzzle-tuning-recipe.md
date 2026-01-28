# Puzzle Tuning Recipe — V3 "The Statement"

Repeatable process for authoring V3 puzzles that pass all invariants.
Extracted from tuning 3 prototype puzzles in `scripts/prototype-v3.ts`.

---

## Targets (all must pass)

| Check | ID | Target |
|-------|----|--------|
| Exactly 2 lies | L2 | `lies.length === 2` |
| Always winnable | W1 | Top 3 truth strengths ≥ target |
| Lies are tempting | T1 | Avg lie strength ≥ avg truth strength |
| Red herring exists | H1 | ≥ 1 truth partially matches hint |
| Reactive hint coverage | R1 | All 6 cards have reactive hints |
| Win rate | WR | 40-70% of random play sequences |
| FLAWLESS rate | FL | 15-35% of random play sequences |
| Strength range | S1 | All strengths in [1, 5] |
| Target range | S2 | Target in [3, 13] |

### Additional Quality Checks (not auto-validated)

| Check | ID | Target |
|-------|----|--------|
| Hint ambiguity | HA | Hint matches ≥ 3 cards (2 lies + ≥ 1 red herring truth) |
| Target tension | TT | Top 3 truths - target ≤ 3 (can't cruise to victory) |
| Naive loses | NL | Playing 3 highest-strength cards must NOT achieve FLAWLESS |
| Probe value | PV | ≥ 2 reactive hints narrow lie candidates beyond the opening hint |
| Lie spread | LS | Lies shouldn't both be the top-2 strength cards (too binary) |

---

## Step 1: Design the Hint Axis

The opening hint defines the puzzle's identity. It describes a property shared by BOTH lies. Design the hint FIRST, then build cards around it.

**Hint specificity tiers:**

| Tier | Type | Example | Cards matching |
|------|------|---------|----------------|
| Easy | Direct attribute | "Both lies mention the kitchen" | 2-3 cards |
| Medium | Compound | "Late-night phone data is unreliable" | 3-4 cards |
| Hard | Oblique | "Your story is too perfect in one place" | 3-5 cards |

**Key rule: The hint must NOT solve the puzzle alone.** If only 2 cards match the hint, the puzzle is solved before Turn 1. Ensure ≥ 1 truth also matches (the red herring).

**For hard puzzles:** The hint should match 3-4 cards, forcing the player to use reactive hints and Turn 1 reveals to narrow further.

---

## Step 2: Design the Lie Pair

Both lies must share the hinted property. Additionally:

- **Lies should be tempting.** Average lie strength ≥ average truth strength (T1 invariant). A strength-2 lie isn't a trap — nobody wants to play it anyway.
- **Lies shouldn't be identical.** Different strengths, different secondary attributes. One might be strength 5 (obvious temptation), the other strength 3 (subtler).
- **At least one lie should share a secondary attribute with a truth** (the red herring mechanism). E.g., if lies share KITCHEN location, one truth should also be KITCHEN-adjacent (same time, similar source).

---

## Step 3: Design the Truth Pool

4 truths. Design for:

1. **At least 1 red herring** — a truth that partially matches the hint. This is what makes the hint dangerous (Principle 4).
2. **Strength spread** — don't cluster all truths at the same strength. Mix of 2-5 creates choices.
3. **At least 1 weak truth** — strength 2-3. This card is the "safe but insufficient" option that forces players to take risks when the target is tight.
4. **Attribute variety** — different locations, times, sources. Gives the player deduction material.

---

## Step 4: Set the Target

The target determines how much margin the player has. This is the primary difficulty lever.

| Difficulty | Formula | Effect |
|-----------|---------|--------|
| Easy | Top 3 truths - 3 to -5 | Generous margin, can absorb 1 lie |
| Medium | Top 3 truths - 1 to -2 | Tight, must avoid both lies |
| Hard | Top 3 truths exactly | Zero margin, must play the 3 best truths |

**Check: Can the player win after hitting 1 lie on Turn 1?**
- Calculate: best truth T1 (negative) + 2 best remaining truths
- If this still ≥ target → too easy (player doesn't need to deduce anything)
- If this is always < target → good tension (hitting a lie is punishing)

**The sweet spot:** Hitting a low-strength lie (2-3) on T1 should leave recovery possible but tight. Hitting a high-strength lie (4-5) on T1 should be fatal or near-fatal.

---

## Step 5: Write Reactive Hints

Each of the 6 cards needs a reactive hint (what KOA says after you play it on Turn 1). These hints should:

1. **Vary in informativeness.** Some reactive hints should clearly narrow the lie candidates. Others should be vague or misleading.
2. **Reward strategic T1 probes.** Playing a suspected-but-uncertain card on T1 should trigger a more informative reactive hint than playing an obviously safe card.
3. **At least 2 hints should be mechanically decisive** — they should let a skilled player deduce both lies when combined with the opening hint.
4. **At least 1 hint should be a red herring** — it sounds helpful but doesn't actually narrow the candidates.

**Hint quality tiers:**

| Quality | Description | When to use |
|---------|-------------|-------------|
| **Decisive** | Explicitly confirms or denies a card's status, or names the lie pattern | Playing a lie, or playing the red herring truth |
| **Narrowing** | Points toward the lie axis without naming cards | Playing a safe truth near the lie cluster |
| **Vague** | General suspicion, doesn't narrow anything | Playing a truth far from the lie cluster |
| **Misleading** | Points away from the lies or toward a truth | Sparingly — 1 per puzzle max |

---

## Step 6: Run the Checker

```bash
npx tsx scripts/prototype-v3.ts
```

Look at the PASS/FAIL summary. Common fixes:

| Failure | Fix |
|---------|-----|
| Win rate too low (< 40%) | Lower target, reduce lie strengths |
| Win rate too high (> 70%) | Raise target, increase lie strengths |
| FLAWLESS too low (< 15%) | Lower target, ensure 3 strong truths exist |
| FLAWLESS too high (> 35%) | Raise target, make lies more tempting (higher strength) |
| Lies not tempting (T1 fail) | Increase lie strengths or decrease truth strengths |
| No red herring (H1 fail) | Add a truth that shares an attribute with the lie pair |
| Target too generous (TT fail) | Raise target closer to top-3 truth sum |
| Naive wins (NL fail) | Make top-3 strength cards include a lie |

---

## Step 7: Verify T1 Strategy Exists

Check the T1 STRATEGY section of checker output. For a good puzzle:

- **T1 win rates should vary by ≥ 20 percentage points** across cards. If all T1 choices give similar win rates, T1 is not a meaningful decision.
- **At least 1 truth T1 should have win rate > 60%** (the "safe" choice).
- **At least 1 lie T1 should have win rate < 30%** (the "trap" choice).
- **At least 1 truth T1 should have win rate < 50%** (a truth that LOOKS safe but leads to worse T2/T3 options — the counter-intuitive element).

---

## Trap Archetypes for V3

| Trap Type | Description | How it manifests |
|-----------|-------------|-----------------|
| **STRENGTH TRAP** | Highest-strength cards are lies | Greedy "play the big numbers" punished |
| **RED HERRING TRAP** | Truth matches the hint on 1 axis, player avoids it unnecessarily | Safe card looks dangerous, narrows options |
| **TARGET TRAP** | Target so tight that "play it safe" isn't enough | Must play into the danger zone |
| **PROBE TRAP** | Probing a lie on T1 seems smart but the penalty is too steep to recover | Information isn't always worth the cost |
| **HINT AMBIGUITY TRAP** | Hint matches 4+ cards, player can't eliminate enough before T1 | Forces probabilistic reasoning, not certainty |

---

## Card Pool Composition Checklist

For a 6-card V3 puzzle:
- [ ] Exactly 2 lies, 4 truths
- [ ] Both lies share ≥ 1 attribute value (the hinted property)
- [ ] ≥ 1 truth partially matches the hint (red herring)
- [ ] Lie average strength ≥ truth average strength
- [ ] Top 3 truth strengths ≥ target (winnable)
- [ ] Top 3 truth strengths - target ≤ 3 (not too easy)
- [ ] Playing 3 highest-strength cards includes ≥ 1 lie (naive punished)
- [ ] All 6 cards have reactive hints
- [ ] ≥ 2 reactive hints are mechanically decisive
- [ ] ≥ 1 reactive hint is vague or misleading
- [ ] Strengths use ≥ 3 distinct values (not all 3s and 4s)
- [ ] Each card has a distinct source device

---

## Badge Tiers (V3)

| Badge | Requirement |
|-------|-------------|
| BUSTED | Score < target - 2 |
| CLOSE | Score ≥ target - 2 but < target |
| CLEARED | Score ≥ target |
| FLAWLESS | 3 Truths played (0 lies), max possible score |
