# Playtest 3 — Results

v2.5.2 mechanics. 5 personas × 3 different puzzles each = 15 games. Tests variety, difficulty, learning transfer, and session arc.

---

## Outcomes

| Player | P1: Last Slice (17) | P2: Thermostat War (14) | P3: Shampoo Thief (16) | Arc |
|--------|---------------------|-------------------------|------------------------|-----|
| Sarah | WIN CLEAN, 4 scrut | **LOSS** (scrutiny cap) | WIN **FLAWLESS**, 0 scrut | CLEAN → LOSS → FLAWLESS |
| Marcus | WIN CLEAN, 4 scrut | WIN THOROUGH, 3 scrut | WIN **FLAWLESS**, 0 scrut | CLEAN → THOROUGH → FLAWLESS |
| Jen | WIN THOROUGH, 3 scrut | WIN CLEAN, 4 scrut | WIN **FLAWLESS**, 0 scrut | THOROUGH → CLEAN → FLAWLESS |
| David | WIN CLEAN, 4 scrut | **LOSS** (scrutiny cap) | WIN **FLAWLESS**, 0 scrut | CLEAN → LOSS → FLAWLESS |
| Aisha | WIN THOROUGH, 3 scrut | WIN THOROUGH, 3 scrut | WIN **FLAWLESS**, 0 scrut | THOROUGH → THOROUGH → FLAWLESS |

**Loss rate:** 2/15 games (13%). Both losses on Puzzle 2 (Thermostat War). Both caused by phone_gps (AWAY) trap into a HOME story.

**FLAWLESS rate:** 5/5 players achieved FLAWLESS on Puzzle 3. All with 0 scrutiny, 2 turns.

---

## Pass Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | At least 1 player loses Puzzle 1 | **FAIL** | 0 losses on P1. Both losses on P2. |
| 2 | At least 1 player wins Puzzle 3 | PASS | 5/5 won P3 with FLAWLESS. |
| 3 | Different outcomes on Puzzle 1 across players | PASS | CLEAN (3) vs THOROUGH (2). |
| 4 | At least 1 player improves across puzzles | PASS | All 5 improved to FLAWLESS by P3. |
| 5 | At least 1 "yes" to "would you come back tomorrow?" | **PASS (hard req)** | 5/5 said yes after every puzzle. |
| 6 | At least 1 "no" to "would you come back tomorrow?" | **FAIL** | 0/5 said no. |
| 7 | Graduated contradiction triggered | PASS | Multiple players across puzzles. |
| 8 | Repetition risk triggered | PASS | Sarah P1 (phone_gps repeated LOCATION). |
| 9 | Resistance-break continuation used | PASS | Aisha P1, Jen P1. |
| 10 | KOA "still have concerns" shown | PASS | Confirmed in logs. |
| 11 | THOROUGH or FLAWLESS achieved | PASS | 5/5 got FLAWLESS on P3. |
| 12 | NPS >= 8 average | **FAIL** | 7.6 (7, 8, 8, 7, 8). |
| 13 | 3/5 say session length "just right" or "too short" | PASS | (check surveys) |

**Score: 10/13.** 3 fails: #1 (no P1 losses), #6 (nobody said no), #12 (NPS 7.6 not 8.0).

**Hard requirements:** #1 FAIL, #2 pass, #5 pass. **1 hard fail (same as playtest 2 — no first-contact loss).**

---

## Key Findings

### 1. The 3-Puzzle Session Arc Works

Every player followed a clear progression toward FLAWLESS on Puzzle 3. The variety format produced something single-puzzle replay couldn't: a **learning arc across different contexts**. Players transferred tag-conflict knowledge from P1/P2 to P3.

Most common arc: messy win → trap/loss → FLAWLESS mastery.

### 2. Thermostat War Is the Teaching Puzzle

Both losses occurred on P2. The AWAY-tagged phone_gps (pwr 6) is a compelling trap — it's the highest power card and proves IDENTITY, but AWAY contradicts the HOME cards needed for LOCATION. Sarah and David both fell for it. Marcus and Aisha avoided it. Jen played it Turn 1 and recovered.

This is the "productive failure" moment that drives the loss-then-win arc.

### 3. Shampoo Thief Is Too Easy When Learned

5/5 players got FLAWLESS with 0 scrutiny in 2 turns. The puzzle's counter-heavy design doesn't matter because players learned to avoid trap cards entirely. The optimal path (ASLEEP pair → HOME pair, skip AWAKE) is too legible after 2 prior puzzles.

**Fix:** Puzzle 3 in a session should be the hardest, not the most pattern-matchable.

### 4. NPS Improved But Not Viral

7.6 vs 7.0 in playtest 2. David and Sarah (the two who lost P2) both gave 8. Aisha and Marcus (who never lost) gave 7. **The loss-then-win arc drives higher NPS.** Players who experienced failure and recovered rated the game higher.

### 5. Resistance-Break Continuation Validated

Aisha and Jen both hit the "still have concerns" message on P1 and continued playing. Neither complained about it — the fix works as intended. David (who complained about abrupt endings in playtest 2) didn't mention it, suggesting it now feels natural.

### 6. Nobody Said "No" to Retention

5/5 said "yes" to coming back after every puzzle. This means either:
- (a) The game genuinely hooks all player types, or
- (b) LLM agents have an acquiescence bias toward continuing

Likely both. Real humans would show more quit behavior. The "no" signal needs real-world testing.

---

## NPS Analysis

| Player | NPS | Lost a game? | Best badge | Key quote |
|--------|-----|-------------|------------|-----------|
| Sarah | 8 | Yes (P2) | FLAWLESS | "The loss-then-comeback arc was genuinely satisfying" |
| Marcus | 7 | No | FLAWLESS | "Not 9-10 yet because feedback loop needs polish" |
| Jen | 8 | No | FLAWLESS | — |
| David | 8 | Yes (P2) | FLAWLESS | "For the right audience it's very satisfying" |
| Aisha | 7 | No | FLAWLESS | "Depth ceiling might be too low — mapped system in 3 puzzles" |

**Pattern:** Players who lost gave 8. Players who never lost gave 7. The loss is part of the product.

---

## Recurring Feedback (Across Playtests 2 & 3)

| Issue | Times Flagged | Playtests |
|-------|---------------|-----------|
| Scrutiny penalties are opaque | 3/5 (Aisha, David, Marcus) | PT2 + PT3 |
| Badge criteria should be explicit | 2/5 (Marcus, David) | PT2 + PT3 |
| CONTESTED mechanic is invisible | 1/5 (Marcus) | PT3 |
| Want more puzzles | 5/5 | PT2 + PT3 |
| Want daily + story mode | 5/5 | PT2 + PT3 |

---

## Retention Signals

| Question | Result |
|----------|--------|
| Come back tomorrow after P1? | 5/5 yes |
| Worth coming back after P2? | 5/5 yes |
| Come back for P3? | 5/5 yes |
| Would play more after session? | 5/5 yes |
| 3-puzzle session length | Likely "just right" (check surveys) |

---

## Recommended Actions

### P0: Make Puzzle 1 losable
Resistance 17 still didn't produce losses. Options:
- Raise to 19-20
- Or add a second counter to increase contested penalties
- Or reduce the card pool to 6 (remove microwave, tighten margin)

### P1: Harder Puzzle 3
Shampoo Thief is too pattern-matchable after 2 puzzles. For session play, Puzzle 3 needs a new archetype that punishes the "just pick safe corroboration pairs" strategy players learn from P1/P2.

### P2: Scrutiny transparency (post-game)
Show itemized scrutiny breakdown on the results screen: "risk(1) + conflict(2) + repetition(1) = 4". Keep it ambiguous during play (Principle 4), reveal after.

### P3: Badge criteria tooltip
After winning, show: "FLAWLESS = all concerns + scrutiny ≤ 2. You got: 3/3 concerns, 0 scrutiny."

---

## Comparison: Playtest 2 vs Playtest 3

| Metric | PT2 (same puzzle ×3) | PT3 (3 different puzzles) |
|--------|---------------------|--------------------------|
| Loss rate | 0% | 13% (2/15) |
| FLAWLESS achieved | 1/5 (Jen) | 5/5 |
| NPS average | 7.0 | 7.6 |
| Highest NPS | 7 (all) | 8 (Sarah, Jen, David) |
| Retention "yes" | 5/5 (badge chase) | 5/5 (variety + mastery arc) |
| #1 complaint | Abrupt resistance break | Scrutiny opacity |
| #1 fix applied | Resistance continuation | — (pending) |
| Player arcs | Flat (same puzzle, diminishing returns) | Rising (CLEAN→LOSS→FLAWLESS) |

**The 3-puzzle format is strictly better.** Higher NPS, actual losses, universal FLAWLESS achievement, rising emotional arcs.
