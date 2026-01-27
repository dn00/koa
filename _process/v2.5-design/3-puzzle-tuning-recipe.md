# Puzzle Tuning Recipe

Repeatable process for authoring V2.5 puzzles that pass all invariants.
Extracted from tuning 4 archetype puzzles in `scripts/prototype-v2.5.ts`.

---

## Targets (all must pass)

| Check | Target |
|-------|--------|
| P5 Win rate | 30-70% |
| SI5 Clean sweeps | 0 |
| MI1 Optimal margin | +3 to +8 over resistance |
| MI2 Naive loses | Naive path must NOT win |
| P7 Blocks | > 0 paths hit a hard block |
| Repetition risk | > 20% of winning paths |
| Graduated contradiction | > 10% of winning paths |
| Source diversity | > 15% of corroboration paths |
| FL-1 FLAWLESS path exists | > 0 paths achieve all concerns + scrutiny ≤ 2 |
| SP-1 Safe-path margin | Max damage from risk-0 cards only ≤ resistance + 3 |

---

## Step 1: Design the Contradiction Axis

Every puzzle needs **at least one opposing tag pair** with cards on both sides:
- ASLEEP/AWAKE, HOME/AWAY, ALONE/ACCOMPANIED, IDLE/ACTIVE

**Minimum:** 2 cards on one side, 1+ on the other. This creates:
- Graduated contradiction (warning on 1st cross-axis play)
- Hard blocks (2nd cross-axis play is blocked)
- The "which side do I commit to?" decision

**For hard blocks to fire**, you need 2+ cards that would each independently contradict the committed tags. Example: if player commits AWAKE, having 2 ASLEEP cards means the 1st gets a warning, the 2nd is blocked.

---

## Step 2: Design Repetition Risk

At least 2 cards must share the same `proves` value (e.g., both prove LOCATION).

This creates tension: playing both addresses no new concerns but costs +1 scrutiny each time after the first. The player must decide whether the power/corroboration is worth the scrutiny tax.

**Heuristic:** The overlapping-proof cards should be useful for other reasons (corroboration, refutation, low risk) so the player is tempted.

---

## Step 3: Design Source Diversity

Each corroboration group (cards sharing a tag) should have **different `source` values**. This is easy to satisfy — just give each card a distinct device type.

All 4 test puzzles hit 100% source diversity on corroborations. This rule is more of a flavor enhancer than a balance lever.

---

## Step 4: Set Resistance via Damage Math

1. **Calculate max possible damage** from non-contradicting card sets with corroboration
2. **Set resistance = max_damage - 8** (for +8 margin, the top of the MI1 range)
3. Run the checker — if margin isn't +3 to +8, adjust resistance by 1

**Key insight:** Corroboration bonus (20-30%) on multi-card submissions inflates max damage significantly. With 2-card max submissions:
- Two power-5 cards corroborating = 10 * 1.30 = 13 damage in one turn
- Resistance must be high enough that this alone doesn't win

---

## Step 5: Tune Win Rate via Risk Budget

Win rate is primarily controlled by **total risk in the card pool** vs scrutiny limit.

If win rate is too low (< 30%):
- Reduce risk on 1-2 cards (especially cards that are optimal-path)
- Cards with risk=0 that prove something useful are "relief valves"

If win rate is too high (> 70%):
- Increase risk on commonly-played cards
- Add a counter targeting the best card

**Heuristic from tuning:**
- 6-7 cards, 3 turns, scrutiny limit 5
- Total pool risk 3-5 → win rate ~40-55%
- Total pool risk 6+ → win rate < 30% (too punishing)
- Total pool risk 2 or less → win rate > 70% (too easy)

---

## Step 5b: Verify FLAWLESS Achievability (FL-1)

At least one path must achieve **all concerns addressed + scrutiny ≤ 2**. This is the aspirational badge — it must be hard but possible.

If FLAWLESS is impossible:
- Check if the only card proving a required concern has a tag contradiction with essential cards
- Add a second card that proves the same concern with a safer tag (creates a choice: risky-strong vs safe-weak)
- Lower risk on the problematic card by 1

**Common cause:** The only INTENT/IDENTITY/etc. card has an opposing tag (e.g., AWAKE) to cards you need (ASLEEP). The contradiction warning costs +1 scrutiny, and the card's own risk pushes total over 2.

**Fix pattern:** Add a weaker alternative card that proves the same concern without the contradiction.

---

## Step 5c: Check Safe-Path Tension (SP-1)

Calculate max damage from **risk-0 cards only**. This must be ≤ resistance + 3.

If safe-path margin is too high (> +3):
- Reduce power on risk-0 cards
- Move one risk-0 card to risk-1
- Raise resistance

**Why this matters:** If cautious players can win comfortably with zero-risk cards, they never face tension. The game should require accepting at least some risk to win.

---

## Step 6: Verify Naive Path Loses

The naive path plays highest-power cards one per turn in descending order, skipping blocked contradictions.

If naive wins:
- Raise resistance
- Put a contradiction on the highest-power card (make it conflict with needed cards)
- Add a counter targeting the highest-power card

**The decoy principle (SI-1):** The highest-power card should be tempting but wrong in TRAP archetypes, and essential in TIGHT MARGINS archetypes.

---

## Step 7: Run the Checker

```bash
npx tsx scripts/prototype-v2.5.ts
```

Look at the PASS/FAIL summary. Common fixes:

| Failure | Fix |
|---------|-----|
| Win rate too low | Reduce card risks, lower resistance |
| Win rate too high | Increase risks, raise resistance, add counters |
| Margin too high | Raise resistance or reduce card powers |
| Margin too low | Lower resistance or increase a key card's power |
| No blocks | Add a 2nd card on the opposite side of a contradiction axis |
| Rep risk too low | Add overlapping `proves` values |
| Contradiction too low | Add an opposing-tag pair |
| FL-1 no FLAWLESS path | Add alt card for blocked concern, lower risk on concern-proving card |
| SP-1 safe margin > +3 | Reduce risk-0 card powers, raise resistance, move a card to risk-1 |

---

## Archetype-Specific Patterns

### TRAP
- Highest-power card has an opposing tag to 2+ other useful cards
- Highest-power card has risk >= 2
- Optimal path avoids the highest-power card entirely
- `highCardInOptimal: false`

### TIGHT MARGINS
- Highest-power card is essential (can't win without it)
- Resistance is close to max achievable damage
- Counter targets the highest-power card but refutation exists
- `highCardInOptimal: true`

### COUNTER-HEAVY
- 2-3 counters targeting the best cards
- Refutation cards are low-power (weak heroes, SI-2)
- Sequence matters: refute before playing contested cards
- `highCardInOptimal: true` (but contested — must refute first)

### CORROBORATION (our "Midnight Snack")
- 2+ corroboration groups with diverse sources
- Corroboration bonus is required to clear resistance
- Raw card power without corroboration < resistance
- `highCardInOptimal: false` (combo wins, not raw power)

---

## Card Pool Composition Checklist

For a 6-7 card puzzle:
- [ ] At least 1 card with risk=0 and no contradictions (safe exit, SI-4)
- [ ] At least 1 opposing tag pair with 2+ cards per side
- [ ] At least 2 cards sharing a `proves` value
- [ ] At least 1 refutation card (low power, high utility)
- [ ] Each card has a unique `source` value
- [ ] At least 3 cards are pairwise-compatible (F8)
- [ ] 1 decoy card (high power, high cost or contradiction, SI-1)
- [ ] 1 weak hero (low power, in optimal path, SI-2)
- [ ] Total pool risk between 3-5
- [ ] At least one path achieves all concerns with scrutiny ≤ 2 (FL-1)
- [ ] Risk-0 cards alone produce ≤ resistance + 3 damage (SP-1)
- [ ] WIN requires ≥ ⌈concerns/2⌉ concerns addressed

---

## Badge Tiers (v2.5.1)

| Badge | Requirement |
|-------|-------------|
| WIN | damage ≥ resistance + ≥ ⌈concerns/2⌉ concerns addressed |
| CLEAN | WIN + scrutiny ≤ 2 |
| THOROUGH | WIN + all concerns addressed |
| FLAWLESS | WIN + all concerns + scrutiny ≤ 2 |

The minimum concerns gate (⌈concerns/2⌉) ensures players must engage with the `proves` system, not just stack raw damage. For 3-concern puzzles, must address at least 2.

---

## Max Submission Size

V2.5 prototype uses **max 2 cards per submission**. This prevents corroboration bursts from inflating optimal margin beyond +8. If switching to 3-card submissions, resistance must increase proportionally.
