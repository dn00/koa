# Home Smart Home — Casual Redesign Proposal

**Codename:** The Statement
**Date:** 2026-01-27
**Status:** Proposal — requires playtesting

---

## 1. One-Paragraph Pitch

You are a suspect. KOA, a smart-home AI investigator, is interrogating you about last night. You have **6 alibi cards** — but KOA knows that **exactly 2 of them are lies**. The lies share a hidden pattern that KOA hints at in her opening statement. You must play **3 cards**, one per turn. After each play, KOA reveals whether that card was a **Truth** or a **Lie**. Truths add their strength to your defense; Lies subtract it. Reach KOA's resistance threshold in 3 plays to be cleared. The puzzle: deduce which 2 cards are lies before you accidentally play them — using KOA's hint, the visible card attributes, and what you learn each turn.

---

## 2. Rules in 3 Sentences

1. You have 6 alibi cards (each with a visible strength and attributes); 2 are secretly Lies and 4 are Truths.
2. Play 1 card per turn for 3 turns — Truths add their strength, Lies subtract it — and KOA reveals the verdict after each play.
3. Reach the target score in 3 plays to be cleared; KOA's opening hint and card attributes help you deduce which cards are safe.

---

## 3. Detailed Mechanics

### 3.1 Setup (What the Player Sees)

Each daily puzzle presents:

- **KOA's Opening Statement** — A 1-2 sentence hint about the lies. Examples:
  - *"Something about your kitchen story doesn't add up."* (Lies are tagged KITCHEN)
  - *"Your timeline has gaps after midnight."* (Lies have timestamps AFTER 12:00)
  - *"I don't trust anything from your phone."* (Lies have source PHONE)

- **6 Alibi Cards** — Each card has:
  - **Strength** (1-5): visible number, how much it helps (or hurts) your defense
  - **Location tag**: KITCHEN, BEDROOM, LIVING ROOM, GARAGE, etc.
  - **Time tag**: a timestamp like 10:30 PM, 11:15 PM, 12:45 AM
  - **Source tag**: THERMOSTAT, DOORBELL, PHONE, FITBIT, TV, SECURITY CAM
  - **Claim text**: flavor text ("I was asleep by 11" / "I never left the couch")

- **Resistance Target** — A number (typically 8-12). Your 3 plays must net this total or higher.

- **Lie Count** — Always exactly 2 out of 6. This is fixed and known.

### 3.2 Turn Structure

**Turn 1:** Pick a card. Play it face-up. KOA reveals: TRUTH (adds strength) or LIE (subtracts strength). Your running total updates.

**Turn 2:** Pick a card from the remaining 5. Same reveal.

**Turn 3:** Pick a card from the remaining 4. Final reveal. Total is calculated.

### 3.3 Scoring

- Each TRUTH card played: **+strength** to your total
- Each LIE card played: **-strength** from your total
- Final total >= resistance target → **CLEARED**
- Final total < resistance target → **BUSTED**

### 3.4 The Hint System (Where Depth Lives)

KOA's opening hint describes a **hidden rule** that both Lie cards satisfy. The hint is always truthful but varies in specificity:

**Specificity tiers** (for difficulty scaling):

| Day | Hint Type | Example | Deduction Power |
|-----|-----------|---------|-----------------|
| Mon | Direct attribute | "Your bedroom alibi is shaky" | Eliminates most cards immediately |
| Tue | Attribute class | "Something about your location story..." | Narrows to 2-3 candidates |
| Wed | Relational | "Two of your cards agree suspiciously well" | Must find the shared property |
| Thu | Negation | "I trust everything except..." | Inverted logic required |
| Fri | Compound | "Late-night phone data is unreliable" | Two attributes intersect |
| Sat | Oblique | "Your story is too perfect in one place" | Abstract — multiple interpretations |

The hint ALWAYS truthfully describes a property shared by BOTH lies. It may also describe some truths (the hint narrows, it doesn't solve).

### 3.5 Card Design Constraints (Per Puzzle)

- Exactly 2 Lies, 4 Truths
- The 2 Lies share at least one attribute value (the hinted pattern)
- At least 1 Truth also partially matches the hint (the red herring) — the hint is helpful but not a complete solve
- Lie cards tend to have **higher** strength values (3-5), making them tempting
  - This is the core tension: the obvious "play the big numbers" strategy is dangerous
- Sum of all 4 Truth strengths must be >= resistance target + margin (so a perfect player can always win)
- Sum of best-case 3 Truths must be >= target (winning is always possible with perfect deduction)
- Playing 3 random cards has ~50% chance of hitting a Lie (exactly: probability of 0 lies in 3 draws from 4T+2L = 4/15 ≈ 27%, 1 lie = 8/15 ≈ 53%, 2 lies = 3/15 = 20%)

### 3.6 The Deduction Loop

This is what makes the game a puzzle, not a lottery:

1. **Before Turn 1:** Read hint. Examine all 6 cards. The hint eliminates 0-3 cards as Lie candidates. Remaining cards form your suspect pool. You want to play a card you believe is a Truth — ideally a high-strength one.

2. **The Turn 1 Dilemma:** Do you play a card you're SURE is safe (but it might be low-strength), or gamble on a high-strength card that might be a Lie? If you play a "probe" card (one you're uncertain about), you learn information but might waste a turn on a weak Truth or eat a Lie penalty.

3. **After Turn 1 reveal:** If it was a Truth, you've narrowed nothing — you still don't know which 2 of the remaining 5 are Lies. If it was a Lie, you now know 1 of 2 Lies — combined with the hint, you can often deduce the second Lie exactly (because both Lies share the hinted property).

4. **The Turn 2 Decision:** This is where skill lives. Based on what Turn 1 revealed + the hint + the remaining cards, pick your best option. An expert might deliberately play a suspected Lie on Turn 1 (eating the penalty) to gain information that guarantees Turn 2-3 are both safe high-strength Truths.

5. **Turn 3:** Often the outcome is decided by now. But sometimes Turn 3 is agonizing: you've identified 1 Lie, the hint narrows the second to 2 candidates, and you need to pick one of them to play because both remaining safe cards are too weak.

### 3.7 No Randomness

Everything is fixed per puzzle:
- Which 2 cards are Lies: fixed
- Card strengths: fixed
- KOA's hint: fixed
- Resistance target: fixed

Two players making identical choices get identical outcomes. The "uncertainty" is hidden information (which cards are Lies), not randomness.

---

## 4. Example Puzzle — "The Midnight Snack"

### Setup

**KOA says:** *"I've cross-referenced your devices. Something about your kitchen doesn't check out."*

**Target: 9**

| # | Card | Strength | Location | Time | Source | Truth/Lie |
|---|------|----------|----------|------|--------|-----------|
| A | "Fridge opened at 11:02 PM" | 4 | KITCHEN | 11:02 PM | FRIDGE | **LIE** |
| B | "Thermostat set to 68° at 10:30" | 3 | LIVING ROOM | 10:30 PM | THERMOSTAT | TRUTH |
| C | "Doorbell cam shows no exit" | 5 | FRONT DOOR | 11:45 PM | DOORBELL | TRUTH |
| D | "Phone charging in kitchen" | 4 | KITCHEN | 11:30 PM | PHONE | **LIE** |
| E | "Fitbit says asleep by 11:15" | 2 | BEDROOM | 11:15 PM | FITBIT | TRUTH |
| F | "TV was on until midnight" | 3 | LIVING ROOM | 12:00 AM | TV | TRUTH |

**Hidden pattern:** Both Lies are tagged KITCHEN. The hint ("something about your kitchen") points directly at this.

**Red herring:** Card A (Strength 4) and Card D (Strength 4) are the two highest-tied cards. A greedy player would want to play them.

### Walkthrough: Novice Player (Day 1)

**Reading the hint:** "Something about your kitchen..." The novice notices cards A and D are KITCHEN. But isn't sure if the hint means those ARE lies or just that KOA is asking about the kitchen.

**Turn 1:** Plays Card C (Strength 5) — it's the highest card and not KITCHEN, so it feels safe.
**KOA reveals:** TRUTH. Running total: **+5**.

**Turn 2:** Plays Card A (Strength 4) — second highest, tempting.
**KOA reveals:** LIE. Running total: **5 - 4 = 1**.

**Turn 3:** Needs 8 more points from one card. Maximum possible is 4 (Card D). Even if D is Truth, 1 + 4 = 5 < 9. **Busted.**

The novice lost because they played a KITCHEN card despite the hint. Lesson learned.

### Walkthrough: Intermediate Player (Day 10)

**Reading the hint:** "Kitchen doesn't check out" — immediately flags A and D as Lie candidates. But both? Or just one?

**Turn 1:** Plays Card C (Strength 5, not KITCHEN) — safe and strong.
**KOA reveals:** TRUTH. Total: **+5**.

**Turn 2:** Plays Card B (Strength 3, LIVING ROOM) — avoids all KITCHEN cards.
**KOA reveals:** TRUTH. Total: **+8**.

**Turn 3:** Needs 1 more. Plays Card E (Strength 2, BEDROOM) or F (Strength 3, LIVING ROOM). Either works. Plays F.
**KOA reveals:** TRUTH. Total: **+11**. **CLEARED.**

Safe play, comfortable margin. But not optimal.

### Walkthrough: Expert Player (Day 30)

**Reading the hint:** Both Lies are KITCHEN. That's A and D. Certain.

**Turn 1:** Plays Card C (Strength 5). TRUTH. Total: **+5**.

**Turn 2:** Plays Card B (Strength 3). TRUTH. Total: **+8**.

**Turn 3:** Plays Card F (Strength 3). TRUTH. Total: **+11**.

Score: **11/9 — CLEARED, margin +2.**

But wait — could the expert do better? The maximum possible score from 3 Truths is C(5) + B(3) + F(3) = 11, or C(5) + F(3) + E(2) = 10. So 11 is the perfect score. The expert nails it.

### Walkthrough: Expert on a HARD Puzzle (Where It Gets Interesting)

Same cards but **Target: 11**. Now the expert MUST play C(5) + B(3) + F(3) = 11 exactly. No margin for error. Every card choice is forced. And on a Wednesday puzzle where the hint is oblique ("Two of your devices tell suspiciously similar stories"), the expert must deduce that A and D share KITCHEN — not from a direct hint but from noticing the location overlap.

Or consider: what if the hint is deliberately misleading in scope? *"I don't trust late-night data."* Cards with times after 11 PM: A (11:02), C (11:45), D (11:30), F (12:00). Four cards match — but only 2 are Lies. Now the player must combine the hint with other attributes to narrow further. Late-night AND kitchen = A, D. That's the solve. But a player who avoids ALL late-night cards can only play B(3) + E(2) + ... and that's only 5. They'd need to play some late-night cards and risk a Lie.

**This is where the game gets deep:** sometimes you MUST play into the hint's danger zone because the safe cards aren't strong enough.

---

## 5. How It Satisfies Each Principle

### Principle 1: Transparent Space, Opaque Solution

The player sees all 6 cards, all attributes, all strengths, KOA's hint, and the target number. The only hidden information is which 2 cards are Lies. The possibility space is fully visible (6 choose 3 = 20 possible plays). The solution (which 3 to play in which order) is hidden.

### Principle 2: Every Action Is Irreversible and Produces Information

Each card play is permanent — the card is committed and its Truth/Lie status is revealed. You cannot undo. Each reveal changes your knowledge state: if Turn 1 reveals a Lie, you now know 1 of 2 Lies, and combined with the hint, you can narrow the second. If Turn 1 reveals a Truth, you learn less (4 Truths remain in 5 cards — slight narrowing only).

**Key asymmetry:** Playing a suspected Lie is more *informative* than playing a safe card. Discovering a Lie early gives you the most information (you know 1 Lie, hint constrains the other). Playing safe cards reveals almost nothing. This creates the probe-vs-protect tension.

### Principle 3: Optimal Move Is Non-Obvious and Counter-Intuitive

The obvious strategy is "play your strongest cards and avoid anything the hint flags." But:

- **Lies tend to be high-strength** — the tempting cards are the dangerous ones
- **Safe cards may not reach the target** — sometimes you mathematically must play into the danger zone
- **Probing a suspected Lie first** can be optimal — eat a small penalty early to guarantee your remaining plays are safe and maximized
- **The hint can over-narrow** — avoiding everything the hint touches may exclude Truths you need

On hard puzzles, the expert's line is often: "Play the medium-strength suspected Lie on Turn 1 to confirm it, then play two guaranteed-safe high-strength Truths on Turns 2-3." This FEELS wrong (why would you play a card you think is a Lie?) but IS right (the information gained is worth more than the penalty).

### Principle 4: Partial Information Is Both Helpful AND Dangerous

KOA's hint truthfully describes both Lies — but it may also describe Truths (the red herring). A player who avoids everything the hint touches might be throwing away safe high-value cards they need.

The Turn 1 reveal is both helpful (you learn a card's status) and dangerous (if you played a strong Lie, you've eaten a big penalty AND learned that the obvious "avoid the hint" strategy wasn't enough).

**Crucially:** A Truth reveal on Turn 1 barely helps you — you still have 2 Lies in 5 cards. But it feels reassuring, which can create false confidence for Turn 2.

### Principle 5: Depth Without Punishing Breadth

- **Day 1 player:** Reads hint literally, avoids flagged cards, plays highest remaining. Wins easy/medium puzzles. Gets caught on hard puzzles. Learns from losses.
- **Day 30 player:** Combines hint with multi-attribute deduction, calculates whether safe cards can reach target, uses probe plays when margins are tight, identifies red herrings by attribute intersection analysis.
- **Everyone finishes in 3 turns.** No one gets stuck. The question is whether you're CLEARED or BUSTED, and by how much.

### Principle 6: Shareable Artifact

See Section 9 below.

### Principle 7: Constraint Is the Engine

- **3 turns** — you can't try everything
- **Exactly 2 Lies** — known quantity, unknown identity
- **Subtraction penalty** — Lies don't just waste a turn, they actively hurt you
- **Sequential play** — you must commit before full information
- **Fixed target** — you can't just "avoid Lies," you must also accumulate enough strength

Remove any constraint and the puzzle collapses. Remove the Lie penalty? Play anything. Remove the turn limit? Try all cards. Remove the hint? Pure guessing. Remove sequentiality? Solve it all at once. Every constraint contributes.

---

## 6. Skill Gradient

| Stage | Behavior | Win Rate (est.) |
|-------|----------|-----------------|
| **Day 1** | Reads hint literally. Plays highest-strength cards. Avoids anything the hint mentions. Sometimes avoids needed Truths. | ~50% |
| **Day 5** | Understands that hints flag a *shared attribute*, not specific cards. Starts crossing hint with card attributes. Still plays safe-first. | ~65% |
| **Day 10** | Calculates whether safe cards alone can reach target. If not, identifies which "risky" cards are most likely Truths (hint + attributes). Uses Turn 1 as a probe when uncertain. | ~75% |
| **Day 20** | Reads compound/oblique hints fluently. Identifies red herring cards (match hint partially but not fully). Calculates optimal play order: probe uncertain cards early, bank safe cards for later. | ~85% |
| **Day 30** | Solves most puzzles before Turn 1 by fully deducing both Lies from the hint + attribute analysis. Uses Turn 1 to confirm deduction. Plays for maximum margin (tiebreaker score). Recognizes puzzle archetypes from the hint structure. | ~92% |

**What the expert does that the novice doesn't:**
1. Multi-attribute intersection (hint says "late night" + cards show KITCHEN overlap = both constraints narrow to 2 cards)
2. Target arithmetic (can safe cards reach target? If not, how much risk must I take?)
3. Information-value calculation (is probing a Lie worth the penalty for the certainty it provides?)
4. Red herring detection (this card matches the hint on one axis but not the hidden pattern)

---

## 7. Cognitive Load Analysis

### Systems the Player Tracks

| # | System | Visible? | Complexity |
|---|--------|----------|------------|
| 1 | Card strengths | Yes | Read a number (1-5) |
| 2 | Card attributes | Yes | Read 3 tags per card |
| 3 | KOA's hint | Yes | 1 sentence of natural language |
| 4 | Running total vs target | Yes | Simple addition/subtraction |
| 5 | Which cards are Lies | Hidden | Binary per card, exactly 2 of 6 |

**Total: 5 systems. Only 1 is hidden.**

Compare to current design:

| Current v2.5 | Redesign |
|-------------|----------|
| Power values | Strength values |
| Risk values | *Removed* |
| Tag opposition pairs (HOME/AWAY, etc.) | *Removed* — tags are descriptive, not oppositional |
| Corroboration bonuses | *Removed* |
| Repetition penalties | *Removed* |
| Counter/refutation | *Removed* |
| Source diversity | *Removed* |
| Scrutiny meter | *Removed* |
| Concerns to address | *Removed* — replaced by single target number |
| Multi-card submission | *Removed* — always play exactly 1 |

**Reduction: from 9+ interacting systems to 5 independent-but-overlapping systems.**

The cognitive task shifts from "manage 9 systems simultaneously" to "deduce 1 hidden thing using 3 visible clues." This is the Wordle/Connections model: transparent input, opaque answer, sequential reveals.

### Working Memory Load

- **Current game:** Must hold tag opposition rules, corroboration conditions, counter targets, refutation mapping, risk/scrutiny budget, AND proof-type-to-concern mapping in working memory simultaneously. Estimated 7-9 chunks.
- **Redesign:** Must hold KOA's hint, card attributes, and running total. Estimated 3-4 chunks. Well within the 4-chunk working memory limit for casual play.

---

## 8. What's Lost vs Current Design

### Lost

| Element | What It Provided | Why It's Acceptable to Lose |
|---------|------------------|-----------------------------|
| **Multi-card submissions** | Corroboration combos, interaction depth | Replaced by sequential deduction — different depth, not less |
| **Tag opposition system** | The "you can't have both" decision | Replaced by Lie deduction — same "which cards conflict?" question, simpler encoding |
| **Scrutiny meter** | Resource management tension | Replaced by target arithmetic — same "budget" pressure, one number instead of two |
| **Concerns system** | Thematic proof-building | Lost entirely. The game no longer simulates "building a case" across proof types. This is the biggest thematic loss. |
| **Counter/refutation** | Sequence planning, KOA as active opponent | Partially preserved — KOA's hint is her "move," and the Lie reveal is her response. But she's less mechanically present. |
| **Corroboration** | Combo discovery satisfaction | Lost. No combo mechanics. |
| **Risk values per card** | Per-card cost/benefit analysis | Replaced by Lie/Truth binary — simpler but less granular |
| **Graduated contradictions** | The "how far can I push it?" decision | Lost entirely. |
| **Puzzle archetypes (5 types)** | Variety through structural differences | Replaced by hint-type variety (6 difficulty tiers). Less structural variety, more linguistic variety. |

### Gained

| Element | What It Provides |
|---------|-----------------|
| **30-second learnability** | "6 cards, 2 are lies, play 3, beat the number" fits in a text message |
| **Deduction-first gameplay** | The core verb is "figure out which cards are lies" — cleaner fantasy |
| **Information asymmetry per turn** | Each play reveals something, creating a genuine turn-by-turn arc |
| **Probe-vs-protect dilemma** | A novel trade-off that doesn't exist in the current design |
| **Natural difficulty scaling** | Hint specificity creates Monday-easy to Saturday-hard without parameter changes |
| **Lower barrier to sharing** | Simple result format that anyone can read |

### Honest Assessment

The redesign trades **mechanical depth** for **deductive depth**. The current game is deeper in terms of interacting systems — but that depth is exhausted by day 15 because all systems can be reduced to one algorithm. The redesign has fewer systems but the deduction challenge varies daily based on hint construction and card attribute layout. The skill ceiling is lower but the skill floor is dramatically lower too, and the ceiling-to-floor ratio (the actual felt depth) may be higher.

The biggest genuine loss is **KOA as an active adversary**. In the current design, KOA deploys counters and responds to your plays. In the redesign, KOA sets the puzzle (hint + lies) and reveals results, but doesn't adapt mid-game. She's a puzzle-setter, not an opponent. This weakens the interrogation fantasy. A future version could add reactive elements (KOA changes the target after Turn 1, KOA reveals an extra hint mid-game) but the base design is static.

---

## 9. Shareability Format

### The Share Card

```
HOME SMART HOME #127 🏠

KOA: "Something about your kitchen doesn't check out."

1. 📹 Doorbell cam ✅ (+5)
2. 🍕 Fridge log ❌ (-4)
3. 📺 TV history ✅ (+3)

Total: 4/9 — BUSTED

KOA: "Nice try. Come back tomorrow."
```

### Encoding

- **No spoilers for cards not played.** Only your 3 plays are shown, not which specific cards were Lies in the full set. Other players still need to deduce that themselves.
- **Order matters.** Your sequence tells a story: did you probe first? Did you hit a Lie early or late?
- **KOA's closing line** is unique per outcome tier, adding personality.

### Outcome Tiers

| Tier | Condition | KOA's Line (examples) | Emoji |
|------|-----------|----------------------|-------|
| **FLAWLESS** | 3 Truths played, max possible score | "...I hate how good your alibi is." | 🏠✅✅✅ |
| **CLEARED** | Total >= target | "Fine. You can go. For now." | 🏠✅✅✅ or 🏠✅❌✅ |
| **CLOSE** | Total within 2 of target | "Almost had me. Almost." | 🏠❌✅✅ |
| **BUSTED** | Total < target - 2 | "The fridge knows what you did." | 🏠❌❌✅ or worse |

### Share Format (Spoiler-Free)

```
HOME SMART HOME #127 🏠
✅ ❌ ✅ — BUSTED (4/9)
```

Three symbols, a result, a score. Compact. Tells other players: "I hit a Lie on Turn 2." They can compare sequences without spoiling the puzzle.

---

## Appendix: Puzzle Authoring Constraints

For puzzle validators/checkers:

1. **Exactly 2 Lies, 4 Truths** per puzzle
2. **Both Lies share at least 1 attribute value** (the hinted pattern)
3. **At least 1 Truth partially matches the hint** (red herring)
4. **Sum of top 3 Truth strengths >= target** (always winnable with perfect play)
5. **Sum of top 2 Truth strengths + worst Lie strength < target** (playing 1 Lie is usually fatal, creating real stakes)
6. **Average Lie strength > average Truth strength** (Lies are tempting)
7. **Hint must be truthful** — both Lies satisfy the described property
8. **Hint must not be sufficient alone** — at least 1 Truth also partially matches
9. **Target range: 8-13** (scales with difficulty tier)
10. **Strength range: 1-5** per card, total across 6 cards = 18-22

### Difficulty Scaling

| Parameter | Easy (Mon) | Medium (Wed) | Hard (Sat) |
|-----------|-----------|-------------|-----------|
| Hint specificity | Names the attribute directly | Names the attribute class | Oblique/compound |
| Red herrings | 0-1 Truths match hint | 1-2 Truths match hint | 2-3 Truths match hint |
| Target tightness | Top 3 Truths = target + 3 | Top 3 Truths = target + 1 | Top 3 Truths = target exactly |
| Lie strength | Low (1-2) | Medium (3) | High (4-5) |
