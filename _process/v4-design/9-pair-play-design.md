# V4 Design Specification — Pair Play

**Date:** 2026-01-28
**Status:** Mathematically validated — pending prototype and playtest
**Depends on:** 7 principles audit (doc 1), V3 playtest findings (PT1-PT4), canonical deck exploration (doc 8)

---

## One-Sentence Pitch

"You have 8 evidence cards. Three are lies. Play them in 3 pairs to build your alibi — but pairs that tell a strong story also carry the most risk."

---

## Design Journey

### Why V3 Needed to Evolve

V3 works: 6 cards, 2 lies, play 3 singles, reactive hints. PT1-PT4 validated the core loop. But single-card play has a shallow decision: "which card has the highest strength that isn't a lie?" Once lies are identified, the game is solved. There's no composition, no emergent interaction, no reason to play a weak card. (Principle 3 violation.)

### What We Explored

| Approach | Result | Why It Failed/Worked |
|----------|--------|---------------------|
| Canonical deck [1,2,3,4,5,6] | 4/15 lie pairs viable | `liesTempting` invariant impossible — sum=21, lies must sum to 11+ |
| Larger decks [1-7], [1-8] | 6/21, 6/28 | Better but still limited by single-axis scoring |
| Contextual scoring (type multipliers) | 15/15 with right contexts | Mathematically works but creates shallow arithmetic, not real decisions |
| Pair play (8 cards, 2 lies, 3 pairs) | 0/28 | Truth-only plays always clear — safe play always works |
| Pair play (8 cards, 2 lies, 2 pairs) | 25/28 (89%) | Works but only 2 turns — too thin for narrative |
| Pair play (8 cards, 3 lies, 2 pairs) | 52/56 (93%) | Works but still only 2 turns |
| **Pair play (8 cards, 3 lies, 3 pairs)** | **54/56 (96.4%)** | **The winner — 3 turns, forced lie play, rich decisions** |

### The Key Insight

With 3 lies in 8 cards and 3 pairs played (6 of 8), the player **must play at least 1 lie**. They can only leave 2 cards unplayed, but there are 3 lies. This is the constraint that makes the game work (Principle 7). The question shifts from "can I dodge all lies?" to "can I minimize lie damage while maximizing combo bonuses?"

---

## Core Structure

### Setup
- **8 cards** in hand, each with:
  - **Strength** (1-8, all unique — canonical deck)
  - **Evidence type** (DIGITAL, PHYSICAL, TESTIMONY, SENSOR — 2 of each)
  - **Location** (tied to puzzle scenario)
  - **Time** (8 sequential time slots)
- **3 cards are lies** (player doesn't know which)
- **Target score** to clear
- **1 hint** about where lies cluster (same as V3 hint groups)

### Turn Structure
Each turn:
1. **Player selects 2 cards** to play as a pair
2. **Pair is scored** (base strength + combo bonuses − lie penalties)
3. **KOA reacts** with a reactive hint about the remaining cards
4. **Score accumulates** across turns

**3 turns × 2 cards = 6 of 8 cards played. 2 cards left unplayed.**

### Why 3 Lies

| Lies | Cards | Played | Must play lies? | Viable configs |
|------|-------|--------|-----------------|----------------|
| 2 | 8 | 6 (3 pairs) | No — can dodge both | 0/28 (safe play always works) |
| 2 | 8 | 4 (2 pairs) | No — can dodge both | 25/28 but only 2 turns |
| **3** | **8** | **6 (3 pairs)** | **Yes — must play ≥1** | **54/56 (96.4%)** |

3 out of 8 is 37.5% — comparable to Connections (25% per group) and Wordle (19% correct letters). The player knows "most cards are true, some aren't." Clean mental model.

### The Player's Core Question

"I know 3 of these 8 are lies. I have to play 6. I can only dodge 2. Which 2 do I leave out?"

---

## Scoring

### Base Score
- **Truth card:** +strength
- **Lie card:** −(strength − 1)

### Combo Bonuses

Applied to the pair **only if both cards are truths**:

| Combo | Condition | Bonus | Casual read | Expert read |
|-------|-----------|-------|-------------|-------------|
| **Corroboration** | Same location | +3 | "These match!" | Risk: if one is a lie, both look suspicious |
| **Timeline** | Adjacent time slots | +2 | "That makes sense" | Building a sequence, but locks you into a time window |
| **Coverage** | Different evidence types | +2 | "Two kinds of proof" | Hedging — safer but lower ceiling |
| **Reinforcement** | Same evidence type | +3 | "Double proof!" | High reward if both truth, devastating if one is lie |

### Why Combos Only on Double-Truth Pairs

This is the core risk/reward mechanic:
- Playing two cards that combo is **tempting** (+3 bonus)
- But if one is a lie, you get **zero bonus AND the lie penalty**
- Playing two cards that don't combo is **safe** (no bonus, but no combo risk)
- The player must decide: "Am I confident enough in both cards to chase the combo?"

### Score Ranges (from sweep)

With `paired-both` config (best):
- **1-lie plays** (best case): ranges from 12-40 depending on which triple is the lie set
- **2-lie plays**: ranges from -1 to 34
- **3-lie plays** (worst case): ranges from -12 to 22
- **Targets**: typically 15-25 depending on lie assignment

---

## Card Attributes

### Strength (1-8)
Printed on the card. Permanent. Determines base scoring and lie penalty. The canonical deck is `[1,2,3,4,5,6,7,8]`. Every card has a unique strength.

### Evidence Type (4 types, 2 each)
- **DIGITAL** — cameras, logs, app data, smart home records
- **PHYSICAL** — locks, doors, temperature, water, marks
- **TESTIMONY** — sleep trackers, wearables, health apps (body evidence)
- **SENSOR** — motion detectors, pressure plates, proximity sensors

### Optimal Attribute Config: `paired-both`

From the sweep, the best type/location assignment is:

| Card | Str | Type | Location |
|------|-----|------|----------|
| 1 | 1 | D | 0 |
| 2 | 2 | D | 0 |
| 3 | 3 | P | 1 |
| 4 | 4 | P | 1 |
| 5 | 5 | T | 2 |
| 6 | 6 | T | 2 |
| 7 | 7 | S | 3 |
| 8 | 8 | S | 3 |

This creates maximum combo opportunities:
- Each strength-adjacent pair shares a type AND location (+3 corroboration, +3 reinforcement)
- Cross-pair combos require choosing between coverage (+2) and corroboration (+3)
- **54/56 lie triples viable (96.4%)**

The 2 failing triples only miss `lieContainment` — a soft check for whether pairing 2 lies together is better than spreading them. Not a hard requirement.

### Location
Tied to puzzle scenario. 4 locations, 2 cards per location. Enables corroboration bonus.

### Time
8 sequential time slots, one per card. Enables timeline bonus.

---

## Reactive Hints in Pair Play

Hints fire after each pair is played. With 3 turns:

- **Turn 1 hint:** Broad — "Something in the living room evidence doesn't add up."
- **Turn 2 hint:** Narrower — "The DIGITAL evidence is worth examining carefully."
- **Turn 3:** No hint (final pair, no more decisions).

### The Pair Hint Dilemma

If you play a suspected lie in Turn 1, you get useful hint info for Turns 2-3. But you eat the lie penalty AND lose the combo bonus for that pair. This is a **probe play** — sacrifice Turn 1 score for Turn 2-3 information.

Alternatively: play your two most confident truths in Turn 1 (safe score), but you get a vague hint because you didn't trigger the hint group.

### Hint Progression

Hints make the game "easier" as the player progresses through turns — but "easier" is misleading. The information is **helpful AND dangerous** (Principle 4). A hint might:
- Correctly narrow the lie space → player adjusts Turn 2
- Create false confidence → player pairs a lie thinking it's safe
- Reveal that a planned combo is risky → player must abandon their strategy

The emotional arc: **Turn 1** (high uncertainty, brave guess) → **Turn 2** (information, adjusted plan) → **Turn 3** (narrowed options, tension peaks). This mirrors Wordle's guess 1 → guess 5 arc.

---

## Decision Depth

### Turn 1: The Opening Pair (C(8,2) = 28 options)

Considerations:
- Do these two corroborate? (same location → +3 if both truth)
- Am I confident both are truths? (combo bonus wasted if either is a lie)
- Do I want to probe? (play a suspected card to trigger a hint)
- Which 6 cards do I want available for Turns 2-3?

### Turn 2: The Middle Pair (C(6,2) = 15 options)

After Turn 1, the player has:
- Score from Turn 1
- A reactive hint
- 6 remaining cards

The hint narrows the lie space. Now the player recalculates:
- Which pairs are safe (high confidence both are truths)?
- Which pair maximizes combo bonuses given updated lie estimates?
- Can I afford to probe again, or do I need to score?

### Turn 3: The Closing Pair (C(4,2) = 6 options)

4 cards left, 6 ways to pair them (but only 3 distinct pairings). Player has had 2 hints. If they've correctly identified 2 of 3 lies (and left them out), the remaining lie is somewhere in these 4 cards. If they've been misled, 2 lies might remain.

### Unplayed Cards (2 of 8)

These represent the player's **deductions** — they're leaving these out because they suspect they're lies. With 3 lies and 2 unplayed slots:
- **Best case:** 2 of 3 lies correctly identified and excluded. 1 lie still played (unavoidable). Score reflects good deduction.
- **Worst case:** 0 lies excluded. All 3 lies played across the 3 pairs. Heavy penalties.
- **Most common:** 1 lie excluded, 2 lies played. Partial success.

Post-game reveal shows what was left unplayed, what the lies were, and how the combos would have scored with perfect information.

### Total Option Space

28 × 15 × 3 = **1,260 distinct pair sequences** (Turn 1 × Turn 2 × Turn 3 pairings). Compare to V3's 120 sequences. 10x more strategic surface.

---

## Skill Gradient

### Day 1 (Casual) — "Play cards that sound good"
Pick pairs by gut feel. "Doorbell camera + hallway motion sensor sounds like a good alibi." Learn what combos are. Learn lies hurt. Session: 3-5 minutes.

### Day 10 (Intermediate) — "Read the hints"
Understand hint groups. Know to probe Turn 1 if uncertain. Start thinking about which pairs leave good options for later turns. Understand combo bonuses.

### Day 30 (Advanced) — "Plan your alibi"
Plan all 3 pairs before playing Turn 1. Consider: "If I play these two first and trigger the hint, I'll know whether to corroborate or cover in Turn 2." Deliberately sacrifice Turn 1 score for information.

### Day 100 (Expert) — "Metagame the combos"
Know which evidence types are most likely to be lies in certain scenarios. Read the puzzle scenario for thematic clues. Construct pairs that are robust across multiple possible lie assignments. Understand that the `paired-both` structure means same-type pairs are high-risk/high-reward.

---

## Balance Validation

### Sweep Results

**Configuration:** 8 cards [1-8], 3 lies, 3 pairs of 2, `paired-both` attribute assignment.

| Config | Viable | Rate | Top Failure |
|--------|--------|------|-------------|
| paired-both | 54/56 | 96.4% | lieContainment (2) |
| max-bonuses | 54/56 | 96.4% | lieContainment (2) |
| interleaved | 52/56 | 92.9% | lieContainment (4) |
| adjacent-time | 51/56 | 91.1% | lieContainment (5) |
| paired-types | 49/56 | 87.5% | lieContainment (7) |
| paired-locs | 48/56 | 85.7% | lieContainment (8) |

### Balance Checks (8 total)

| Check | What It Means | Pass Rate |
|-------|---------------|-----------|
| flawless | Best possible play clears target | 56/56 |
| notAlwaysSafe | Min-lie play doesn't always clear | 56/56 |
| pairingMatters | Different pairings produce different scores | 56/56 |
| lieRecoverable | Even with 2 lies played, can get close to target | 56/56 |
| randomWin | Random play wins 5-40% of the time | 56/56 |
| strengthNotOracle | Picking strongest cards isn't optimal | 56/56 |
| liesDiffer | All 3 lies have different strengths | 56/56 |
| lieContainment | Pairing 2 lies together is better than spreading | 54/56 |

`lieContainment` is the only failing check and it's a soft requirement — it asks whether "contain the damage" is a viable strategy. The 2 failing triples don't prevent good gameplay, they just lack one strategic dimension.

### Scripts

- `scripts/v4-pair-sweep.ts` — Original sweep (scenarios A/B/C)
- `scripts/v4-pair-sweep-v2.ts` — Fixed checks for 3-lie scenario, multi-config sweep
- `scripts/v4-canonical-sweep.ts` — [1,2,3,4,5,6] viability analysis
- `scripts/v4-context-sweep.ts` — Contextual scoring exploration

---

## Comparison with V3

| Dimension | V3 | V4 |
|-----------|----|----|
| Cards | 6, play 3 | 8, play 6 (3 pairs of 2) |
| Lies | 2 of 6 | 3 of 8 |
| Must play a lie? | No | Yes (can only dodge 2 of 3) |
| Decision per turn | Pick 1 card | Pick 1 pair (combo choice) |
| Options Turn 1 | 6 | 28 |
| Options Turn 2 | 5 | 15 |
| Options Turn 3 | 4 | 6 |
| Total option space | 120 sequences | 1,260 pair sequences |
| Scoring axes | Strength only | Strength + combo bonuses |
| Why play weak card? | No reason | Combo with strong card |
| Unplayed cards | 3 (majority) | 2 (minority — feels like a deduction) |
| Risk/reward | Lie penalty only | Lie penalty + lost combo bonus |
| Safe play works? | Depends on tuning | No — must play ≥1 lie |

---

## 7 Principles Compliance

| Principle | How V4 Meets It |
|-----------|----------------|
| P1: Transparent space, opaque solution | 8 cards visible, combo rules visible, 3 lies hidden |
| P2: Irreversible + information | Each pair committed permanently, reveals score + hint |
| P3: Optimal is non-obvious | Highest-str pair ≠ highest-scoring pair (combos change the math) |
| P4: Info helpful AND dangerous | Hint narrows lies but might create false confidence |
| P5: Depth without punishing breadth | Casual: pair by gut. Expert: plan all 3 turns, metagame combos |
| P6: Shareable artifact | 3 pairs played + 2 cards left + verdict = compact result |
| P7: Constraint is the engine | Must play ≥1 lie. Pairing forces composition over brute strength |

---

## Difficulty Scaling

### Within a Puzzle (Target)
- **Easy:** Target at 60% of max possible score. Most 1-lie plays clear.
- **Medium:** Target at 75%. Must pair well AND dodge at least 1 lie.
- **Hard:** Target at 85%. Must pair optimally with exactly 1 lie played.

### Across Puzzles (Weekly Progression)
- **Monday:** 3 lies are low-strength (1,2,3). Low penalty for mistakes. Forgiving.
- **Wednesday:** Mixed lies (2,4,7). The str-7 lie is devastating if played. Hint is more important.
- **Friday:** 3 lies are high-strength (6,7,8). Every lie is costly. Must identify and contain.

### Attribute Variation
Different puzzles use different attribute configs:
- `paired-both` (default): Clear combo structure, approachable
- `interleaved`: Combos require cross-cutting choices, harder to optimize
- Custom: Specific location/time assignments per narrative scenario

---

## Extension Points

### Multi-Act (Longer Sessions)

- **Act 1:** 8 cards, 3 lies, target 15. Standard.
- **Act 2:** 8 NEW cards (different evidence, same night), 3 lies, target 18. Act 1 lies revealed — player learns KOA's deception patterns.
- **Act 3:** 8 cards (mix of new + returning), 3 lies, target 20. Higher stakes. Returning cards from Act 1 may have switched truth/lie status.

Each act is self-contained. Casual players stop after Act 1. Experts play all 3. Subscription content.

### Deckbuilding

With canonical strengths [1-8] and 4 evidence types, the full collection is 32 cards (8 × 4). Players collect cards and choose which 8 to bring to a puzzle:
- Must include 2 of each evidence type (balanced deck)
- Puzzle assigns which 3 are lies from the player's selected cards
- Metagame: "This week's puzzles have lies in SENSOR evidence" → adjust deck

### Physical Game

**Components:**
- 32 evidence cards (8 strengths × 4 types)
- Scenario booklet (50+ scenarios: lie assignment + target + hint)
- Score tracker

**How to play:**
1. Scenario card says "Use these 8 cards" (by type + strength)
2. One player (or booklet) secretly designates 3 lies
3. Playing player selects 3 pairs, scores them
4. Reveal lies. Compare to target.

**Social variant:** 2+ players use same 8 cards, same lies. Each independently chooses their 3 pairs. Compare scores. Same puzzle, different strategies — the "compare Wordle results" mechanic.

### Competitive / Leaderboard

- Same puzzle, same cards → comparable scores
- With deckbuilding: same puzzle, different decks → deck composition becomes part of the result
- Score breakdown: how many lies played, combo bonuses earned, deduction accuracy

---

## Open Questions

### 1. Should combo bonuses apply when one card is a lie?
**No (current design, recommended).** Combos are the reward for correct deduction. The "both must be truth" requirement creates the core dilemma. If combos always applied, players just pick highest-combo pairs regardless of lie risk.

### 2. Does playing order within a pair matter?
**No (recommended for launch).** A pair is a set, not a sequence. The pairing decision is already rich enough. Intra-pair ordering can be added later for expert depth.

### 3. Should narrative coherence between paired cards matter?
**No (recommended).** The LLM already generates coherent individual cards. Cross-card coherence adds authoring burden without mechanical benefit. The combo bonuses (location, type, time) already capture "do these cards tell a story together" mechanically. Contradictory pairs ("oxymorons") are an interesting idea for the longer-form game but not the daily puzzle.

### 4. Is `lieContainment` a hard requirement?
**No.** Only 2/56 triples fail it. The check asks whether pairing 2 lies together scores better than spreading them — a "contain the damage" strategy. Even without it, the game has rich decisions from the other 7 checks. Could be revisited if playtesting reveals containment is a common/satisfying strategy.

### 5. How do scoring contexts (doc 8) interact with pair play?
Scoring contexts (type multipliers, corroboration bonuses) were explored as a way to make [1,2,3,4,5,6] work. With pair play on [1-8], they're not needed for balance — but could serve as a **difficulty modifier** or **weekly theme**. "This week: SENSOR evidence scores 1.5x." Adds variety without changing core rules. Worth exploring post-prototype.

### 6. What's the shareable artifact?
The result should encode the player's strategy without spoiling the puzzle:
```
AURA #142 ⬛⬛⬛
Pair 1: ██ ██ → ✓✓ +11
Pair 2: ██ ██ → ✓✗ +2
Pair 3: ██ ██ → ✓✓ +9
Left out: ██ ██
Score: 22/18 — CLEARED
```
Blocked cards hide identity. Check/cross shows truth/lie per card. Other players can see: "they played a lie in pair 2, they correctly identified 1 of 3 lies." Strategy is visible, solution is hidden.

---

## Rejected Alternatives

| Alternative | Why Rejected |
|-------------|-------------|
| Single card play, 4 turns | Shallow decisions — "which number is biggest" |
| 3 pairs + 2 lies | Safe play always works (can dodge both lies) — 0/28 viable |
| 2 pairs + 2 lies | Only 2 turns — too thin for narrative arc |
| 4 pairs (needs 10+ cards) | Too many cards to evaluate for a daily puzzle |
| Mixed turn structure (1+2+1) | Workaround, not clean design |
| Pair play with narrative coherence checks | Extra authoring burden, no mechanical benefit |

---

## Next Steps

1. **Prototype one puzzle** with 8 cards, 3 lies, 3 pairs, combo bonuses
2. **Agent playtest (PT5)** — do agents make interesting pairing decisions? Do they reason about combos vs safety?
3. **Casual playtest** — can the rules be explained in 3 sentences? Can a novice play immediately?
4. **Shareable artifact design** — finalize the spoiler-free result format
5. **Migrate V3 scenarios** to V4 pair format (if prototype validates)
6. **Explore scoring contexts** as weekly themes / difficulty modifiers
