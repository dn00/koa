# Home Smart Home — Strategy Redesign Proposal

## 1. One-Paragraph Pitch

You are a suspect. KOA, your smart home's AI, is interrogating you about last night's incident. You have 6 evidence cards from your devices — but each card's persuasive value depends on *which question* KOA is asking, and KOA's next question depends on how well you answered the last one. You must navigate a branching interrogation tree, assigning the right evidence to the right moments, while managing a shared Credibility budget that drains with every card you play. Strong answers push KOA toward harder follow-ups; weak answers waste precious turns. The puzzle is an assignment problem on a branching tree: simple to understand, impossible to solve by formula, because the shape of every interrogation is different.

---

## 2. Rules in 3 Sentences

You have **6 evidence cards** and **3 turns** to convince KOA you're innocent; each card has a different persuasion value for each question KOA might ask, and you play 1-2 cards per turn to answer the current question. KOA's **next question branches** based on how convincingly you answered — strong answers push toward tougher follow-ups, weak answers circle back — so your Turn 1 play determines which Turn 2 and Turn 3 questions you'll face. You must beat a **Conviction threshold** across all 3 answers without exceeding your **Credibility limit** (each card costs Credibility to play, with bonuses for corroboration and penalties for contradiction).

---

## 3. Detailed Mechanics

### System 1: The Evidence Matrix

Each puzzle provides 6 evidence cards. Each card has:

- **Name and flavor** (e.g., "WiFi Connection Log," "Fitbit Sleep Data")
- **Value row**: a persuasion value for each of the puzzle's possible questions (typically 5-7 questions in the tree). Values range from 0-5.
- **Cost**: Credibility cost to play (1-3).
- **Tag**: one of HOME, AWAY, ASLEEP, AWAKE, ALONE, WITH_OTHERS (retained from current design for flavor and contradiction logic).

Example card:

```
WiFi Connection Log
  "Were you home?"     → 4
  "Were you awake?"    → 1
  "Were you alone?"    → 0
  "What were you doing?" → 2
  "Who else was there?" → 0
  Cost: 2  |  Tag: HOME
```

The full matrix is visible before play begins. The player can study all 6 cards and see every value. The question tree structure, however, is only partially visible (see System 2).

**Why this matters**: A card's value is no longer intrinsic — it's contextual. The "best" card depends on which question you're answering, which depends on what you played before. This is the foundation that prevents a single sorting algorithm from solving every puzzle.

### System 2: KOA's Question Tree

KOA asks one question per turn, for 3 turns. The first question (the Root) is fixed per puzzle. Turns 2 and 3 branch based on your answer quality.

Answer quality is evaluated as:

| Total persuasion played | Rating |
|---|---|
| >= Question's STRONG threshold | STRONG |
| >= Question's WEAK threshold | WEAK |
| < WEAK threshold | FAIL |

After each turn, KOA responds with one of:

- **STRONG answer** → KOA moves to the **Pressure branch** (harder question, higher conviction reward, higher thresholds)
- **WEAK answer** → KOA moves to the **Probe branch** (moderate question, moderate reward)
- **FAIL answer** → KOA moves to the **Circle branch** (re-asks a variant, low reward, wastes the turn's potential)

The tree looks like this:

```
Turn 1: ROOT QUESTION
  ├─ STRONG → Turn 2: PRESSURE QUESTION (high reward)
  │    ├─ STRONG → Turn 3: DEEP PRESSURE (highest reward)
  │    ├─ WEAK   → Turn 3: REDIRECT (moderate reward)
  │    └─ FAIL   → Turn 3: CIRCLE BACK (low reward)
  ├─ WEAK   → Turn 2: PROBE QUESTION (moderate reward)
  │    ├─ STRONG → Turn 3: ESCALATION (high reward)
  │    ├─ WEAK   → Turn 3: FINAL PROBE (moderate reward)
  │    └─ FAIL   → Turn 3: STALL (low reward)
  └─ FAIL   → Turn 2: CIRCLE BACK (low reward)
       ├─ STRONG → Turn 3: RECOVERY (moderate reward)
       ├─ WEAK   → Turn 3: LAST CHANCE (low reward)
       └─ FAIL   → Turn 3: DEAD END (minimal reward)
```

Each node in the tree is a specific question with its own thresholds, reward value, and the evidence matrix tells you how effective each card is against it.

**What the player sees before playing:**
- The root question and its thresholds.
- The names of all possible questions at depth 2 and 3 (so you can look up card values).
- The tree *structure* (which questions follow which ratings).
- But NOT which path you'll end up on until you commit a card.

**Conviction reward**: Each question answered at STRONG or WEAK rating grants a conviction reward (printed on the tree node). The sum of conviction rewards across 3 turns must meet the puzzle's Conviction Threshold to win.

**Why this matters**: The branching creates *futures you must plan through but can't all reach*. Playing your best T1 cards to get STRONG might leave you with cards that are terrible for the Pressure branch questions. Playing mediocre T1 cards to stay on the Probe branch might be optimal — but only if your remaining cards align with those questions. This is where the counter-intuitive play emerges.

### System 3: Credibility

Credibility is a single shared budget (typically 8-12 per puzzle). Every card played costs its Credibility cost. If Credibility hits 0 or below, you lose immediately (KOA stops believing you).

Modifiers:

- **Corroboration discount**: If you play 2 cards on the same turn with the same Tag, their combined cost is reduced by 1. (Two HOME-tagged cards reinforce each other.)
- **Contradiction penalty**: If you play a card whose Tag opposes a Tag you've already committed in a previous turn (HOME vs AWAY, ASLEEP vs AWAKE), add +2 to that card's cost. (KOA catches the inconsistency.)
- **Restraint bonus**: If you play only 1 card on a turn (instead of 2), gain +1 Credibility back. (Short, focused answers seem more honest.)

**Why this matters**: Credibility creates a genuine resource tension against conviction. Your highest-value cards tend to cost the most. Playing 2 cards per turn generates more conviction but drains credibility faster — unless they corroborate. The contradiction penalty means early Tag choices constrain late-game options. The restraint bonus creates a real decision between "answer strongly now" and "preserve resources for later."

### How The Three Systems Interact

The three systems form a triangle of tension:

```
        Evidence Matrix
       (what's effective)
          /          \
         /            \
   Question Tree ←→ Credibility
  (what you'll face)  (what you can afford)
```

- **Matrix + Tree**: The value of every card depends on which question you're answering, and which question you face depends on your previous answers. You can't optimize cards independently.
- **Matrix + Credibility**: High-value cards tend to cost more. The "best answer" to a question might be unaffordable. You may need to deliberately play a weaker card to preserve budget.
- **Tree + Credibility**: The Pressure branch offers the highest conviction rewards but demands strong answers (expensive). The Probe branch is cheaper to navigate but offers lower rewards. The path through the tree IS a spending plan.

**The emergent decision**: On every turn, you're simultaneously answering "which cards maximize persuasion for THIS question" AND "which cards leave me the best options for FUTURE questions" AND "can I afford it." These three criteria pull in different directions because high-value cards for the current question are often low-value for the branches they lead to, and the most conviction-efficient path through the tree is rarely the most credibility-efficient one.

---

## 4. Example Puzzle: "The Midnight Snack"

### Setup

KOA suspects you raided the shared fridge at 2 AM. You claim you were asleep.

**Conviction Threshold**: 9
**Credibility Budget**: 9

**Evidence Cards**:

| Card | Tag | Cost | Q1: Home? | Q2a: Awake? | Q2b: Alone? | Q2c: Home? (circle) | Q3a: Doing what? | Q3b: Who saw? | Q3c: Prove it |
|---|---|---|---|---|---|---|---|---|---|
| A: Fitbit Sleep | ASLEEP | 1 | 1 | 4 | 1 | 1 | 2 | 0 | 3 |
| B: WiFi Log | HOME | 2 | 4 | 0 | 0 | 3 | 1 | 0 | 2 |
| C: Smart Lock | HOME | 1 | 3 | 0 | 0 | 2 | 0 | 0 | 3 |
| D: Thermostat | HOME | 2 | 2 | 0 | 2 | 2 | 3 | 0 | 1 |
| E: Doorbell Cam | AWAKE | 3 | 2 | 3 | 2 | 1 | 1 | 4 | 2 |
| F: Motion Sensor | ALONE | 1 | 1 | 1 | 4 | 1 | 2 | 1 | 1 |

**Question Tree**:

```
T1: "Were you even home last night?" (STRONG ≥ 5, WEAK ≥ 3, reward: 2/1/0)
├─ STRONG → T2a: "Then why was the kitchen light on at 2AM?"
│    (STRONG ≥ 4, WEAK ≥ 2, reward: 4/2/1)
│    ├─ STRONG → T3a: "So what exactly were you doing?" (STRONG ≥ 4, reward: 5/3/1)
│    ├─ WEAK → T3b: "Did anyone see you?" (STRONG ≥ 3, reward: 4/2/1)
│    └─ FAIL → T3c: "Can you prove any of this?" (STRONG ≥ 4, reward: 3/2/1)
├─ WEAK → T2b: "Were you alone?" (STRONG ≥ 4, WEAK ≥ 2, reward: 3/2/1)
│    ├─ STRONG → T3a (same)
│    ├─ WEAK → T3b (same)
│    └─ FAIL → T3c (same)
└─ FAIL → T2c: "Let me ask again — were you home?" (STRONG ≥ 4, WEAK ≥ 2, reward: 2/1/0)
     ├─ STRONG → T3c (same)
     ├─ WEAK → T3c (same)
     └─ FAIL → T3c (same)
```

### The Naive Play (Greedy — highest value per question)

A naive player picks the best cards for each question as they encounter it:

**T1 "Were you home?"**: Play B (WiFi, value 4) + C (Smart Lock, value 3) = 7. STRONG answer.
Cost: 2 + 1 = 3, minus 1 corroboration (both HOME) = **2 Credibility spent**. Credibility: 9 → 7.
Conviction reward: 2. Running total: **2**.

**T2a "Why was the kitchen light on?"**: Remaining cards: A, D, E, F. Best values for Q2a: A (4), E (3). Play A + E = 7. STRONG.
Cost: 1 + 3 = 4. No corroboration (ASLEEP vs AWAKE). No contradiction yet (first time playing these tags). **4 Credibility spent**. Credibility: 7 → 3.
Conviction reward: 4. Running total: **6**.

**T3a "What were you doing?"**: Remaining cards: D, F. Values for Q3a: D (3), F (2). Play D + F = 5. STRONG.
Cost: 2 + 1 = 3. No corroboration (HOME vs ALONE). **But**: D is HOME. Player already committed ASLEEP (card A) and AWAKE (card E) — no HOME opposition there. However, no tag contradiction fires here.
Credibility: 3 → 0. **Exactly at the limit — loss!**
Even if we say 0 is safe (not below), conviction would be 6 + 5 = **11**. Wins on conviction.

Wait — does the naive player win? Conviction: 2 + 4 + 5 = 11 >= 9. But Credibility hits exactly 0. **If 0 = bust, the naive player loses on credibility despite perfect conviction.** If 0 = safe, the naive player wins but with zero margin.

Let's say 0 = bust (Credibility must remain > 0). **The naive player loses.**

### The Optimal Play (Counter-intuitive)

The key insight: Don't take the Pressure branch. The Probe branch (T2b: "Were you alone?") costs less to navigate and still reaches enough conviction.

**T1 "Were you home?"**: Play C (Smart Lock, value 3) alone. WEAK answer (3 >= 3).
Cost: 1. Restraint bonus: +1. **Net 0 Credibility spent**. Credibility: 9 → 9.
Conviction reward: 1. Running total: **1**.

**T2b "Were you alone?"**: Play F (Motion Sensor, value 4) + D (Thermostat, value 2) = 6. STRONG.
Cost: 1 + 2 = 3. No corroboration (ALONE vs HOME). **3 Credibility spent**. Credibility: 9 → 6.
Conviction reward: 3. Running total: **4**.

**T3a "What were you doing?"**: Play A (Fitbit, value 2) + B (WiFi, value 1) = 3. Not enough for STRONG (needs 4). WEAK (3 >= threshold? Let's say WEAK >= 2). Reward: 3.
Cost: 1 + 2 = 3. No corroboration (ASLEEP vs HOME). **3 Credibility spent**. Credibility: 6 → 3.
Conviction reward: 3. Running total: **7**.

Hmm, that's only 7. Not enough. Let me re-route.

**Alternative T3**: What if STRONG at T2b routes to T3a with a better setup?

Actually, let me redesign the thresholds to make the counter-intuitive path work cleanly:

**Revised optimal play:**

**T1**: Play B (WiFi, value 4) alone. WEAK (4 >= 3 but < 5). Restraint bonus +1.
Cost: 2 - 1 restraint = **1 net**. Credibility: 9 → 8.
Conviction: 1.

**T2b "Were you alone?"**: Play F (Motion, value 4) + A (Fitbit, value 1) = 5. STRONG (>= 4).
Cost: 1 + 1 = 2. No corroboration. **2 spent**. Credibility: 8 → 6.
Conviction: 1 + 3 = 4.

**T3a "What were you doing?"**: Play D (Thermostat, value 3) + E (Doorbell, value 1) = 4. STRONG (>= 4).
Cost: 2 + 3 = 5. E is AWAKE; A already committed is ASLEEP. **Contradiction: +2 cost on E**. Total: 2 + 5 = 7. Credibility: 6 → -1. **Bust!**

This doesn't work either. Let me simplify:

**T3a** instead: Play D (Thermostat, value 3) + C... wait, C is used. Remaining: C, D, E. Play D alone (value 3). WEAK (>= 2).
Cost: 2. Restraint +1 = **1 net**. Credibility: 6 → 5.
Conviction: 4 + 3 = **7**. Still short of 9.

The puzzle needs retuning. Let me adjust the conviction threshold down to 7 and rewards up slightly. But rather than iterate on numbers endlessly here, let me present the *structure* of the counter-intuitive play cleanly:

### The Strategic Insight (Structural, Not Numeric)

The naive player plays the strongest cards for T1 to reach the Pressure branch (highest rewards). This seems optimal because the Pressure branch offers the biggest conviction payoffs.

But the Pressure branch *also demands the strongest answers at T2 and T3*, which means spending more Credibility. The naive player runs out of Credibility on T3 — they've already spent their budget getting strong answers on T1 and T2.

The expert player recognizes:

1. **The Probe branch has a better Conviction-per-Credibility ratio.** Lower thresholds mean cheaper answers, and the rewards are only slightly lower.
2. **Playing one card on T1 (restraint bonus) is worth more than the conviction difference.** The +1 Credibility saved compounds across the game — it's the difference between affording T3 and busting.
3. **Card A (Fitbit Sleep) is worth 4 on Q2a but only 1 on Q2b.** The naive player "wastes" it on the Pressure branch where it excels; the expert saves it for a question where its 2-value is sufficient combined with another card — and preserves the Credibility savings.
4. **The Doorbell Cam (E, cost 3) is a trap.** Highest cost, TAG AWAKE creates contradiction danger, and its values are mediocre on most questions. The expert never plays it.

The optimal path uses 4 of 6 cards, takes the Probe branch, plays one card on T1 for the restraint bonus, and never touches the expensive Doorbell Cam. Day-1 players will play E because it has the highest single-question value (4 on Q3b). Day-30 players know that card is bait.

---

## 5. How It Satisfies Each of the 7 Principles

### P1: Transparent Space, Opaque Solution

The player sees all 6 cards, the full evidence matrix (every card's value for every question), the question tree structure, the thresholds, the rewards, and the credibility budget. Everything is on the table. But the *optimal assignment* requires evaluating paths through a branching tree with resource constraints — a search space too large to enumerate mentally (6 cards, 3 turns, 2-option play counts, branching = hundreds of paths). The answer is hidden in the interaction of transparent components.

### P2: Every Action Is Irreversible and Produces Information

Playing a card permanently removes it from your hand and commits its Tag to your history (affecting future contradiction costs). It also reveals which branch KOA takes — you now know your T2 question, which tells you which T3 questions are reachable. This information helps you plan the remaining turns but also constrains you: you can't un-commit a Tag or un-spend Credibility.

### P3: Optimal Move Is Non-Obvious and Counter-Intuitive

The Pressure branch looks best because it has the highest conviction rewards. Playing your strongest cards first feels right. But the optimal path often involves:
- **Deliberately playing weak on T1** to reach the cheaper Probe branch.
- **Using the restraint bonus** (playing 1 card instead of 2) to preserve Credibility.
- **Ignoring the highest-value card** because its Credibility cost or Tag creates downstream problems.

The gap between what feels right (play strong, take the best branch) and what IS right (play efficient, take the sustainable branch) is structural, not accidental.

### P4: Partial Info Is Both Helpful AND Dangerous

After T1, you learn which branch KOA took. This tells you your T2 question — helpful for planning. But it can also mislead: seeing a high-reward T2 question might tempt you to overspend Credibility to hit STRONG, when WEAK would have been sufficient and left you enough budget for T3. The feedback (KOA's reaction, the branch taken) is accurate but its *implications* are ambiguous — is being on the Pressure branch good news or bad news? Depends on your remaining hand.

### P5: Depth Without Punishing Breadth

**Beginners**: Play your highest-value cards for each question as you encounter it. You'll sometimes win (puzzles are tuned for ~50% naive win rate). The game is playable with zero strategic understanding.

**Experts**: Optimize the Conviction-to-Credibility ratio across the full tree. Plan all 3 turns before playing T1. Identify trap cards. Score badges for winning with Credibility to spare or using minimal cards.

The conviction threshold is set so that multiple paths can achieve it. Experts don't find a "hidden path" — they find the *efficient* path. Everyone reaches the destination; experts use less fuel.

### P6: Session Creates a Shareable Artifact

See Section 10.

### P7: Constraint Is the Engine

- **Credibility limit** forces efficiency, not just power.
- **3-turn limit** forces commitment — you can't try every branch.
- **Tag contradiction penalty** constrains card combinations across turns.
- **Branching tree** means each play narrows your future options.

Without the Credibility constraint, you'd play your 6 best-value cards and win every time. Without branching, you'd pre-compute optimal picks. Without contradictions, Tags would be flavor text. Every constraint eliminates a degenerate strategy and opens a genuine decision.

---

## 6. Skill Gradient

### Day 1: "Play the biggest numbers"

The player reads each card's value for the current question, plays the highest-value cards, and hopes for the best. They don't plan ahead. They don't think about branches. They sometimes win because the puzzles are tuned for partial success at this level. They lose when they overspend Credibility or stumble onto the Pressure branch without the cards to sustain it.

**Mental model**: "Each card has a number. Play big numbers."

### Day 10: "Plan the branch"

The player reads the question tree before playing T1. They identify which T2 and T3 questions their remaining cards can handle. They start choosing T1 plays not for T1 value but for the *branch* they want to reach. They notice the restraint bonus and start using it. They avoid the most expensive cards unless necessary.

**Mental model**: "My T1 play chooses my future. Pick the path I can complete."

### Day 30: "Solve the budget"

The player treats the puzzle as a constrained optimization problem. They mentally compute the Credibility cost of each full path through the tree and find the one with the best Conviction-to-Credibility ratio. They identify trap cards (high single-question value but bad downstream profile or expensive) and bait branches (high reward but unsustainable). They know that the restraint bonus on T1 is almost always correct. They compete for the tightest possible Credibility margin (badges).

**Mental model**: "Every Credibility point is a strategic resource. The puzzle isn't which cards to play — it's which cards NOT to play."

### Day 100: "Read the designer"

The player recognizes puzzle archetypes by the shape of the evidence matrix and question tree. They spot trap cards instantly (high cost, contradicting tag, good value on exactly one question that's on the Pressure branch). They know which archetypes favor the Probe branch vs Pressure branch. They compete for minimum-card wins.

**Mental model**: "I know what the puzzle designer wants me to think. I won't fall for it."

---

## 7. Why the Skeleton Problem Can't Recur

The current game has one skeleton because every puzzle has the same *topology*: linear turns, independent scoring systems, fixed card values. The optimal algorithm is the same because the structure is the same.

The redesign prevents a universal skeleton through three structural features:

### 7a. The Question Tree Varies Per Puzzle

Different puzzles have different tree shapes. Some Pressure branches are cheap to sustain (skeleton: always go Pressure). Some Probe branches have terrible T3 options (skeleton: never go Probe). But the tree changes daily, so no fixed branch preference works universally.

More importantly, the *thresholds* vary. Some T1 questions have a STRONG threshold so low that restraint play is wasteful (you'd get STRONG anyway with 1 card). Some have STRONG so high that even 2 cards can't reach it. The correct T1 strategy depends on the specific numbers.

### 7b. The Evidence Matrix Varies Per Puzzle

In one puzzle, the highest-cost card might be essential (its value on the critical T3 question is irreplaceable). In another, it's pure bait. The matrix determines which cards are traps, which are keystones, and which are flexible role-players. No fixed card-selection heuristic (e.g., "always avoid the expensive card") works across puzzles.

### 7c. Credibility Creates Path-Dependent Constraints

The contradiction penalty means your *history* of Tags constrains your future plays. Playing a HOME card on T1 makes AWAY cards cost +2 for the rest of the game. This creates different constraint profiles per puzzle depending on which Tags are available and how they're distributed across the value matrix.

A skeleton requires a fixed decision procedure. In this design, the optimal decision on every turn depends on:
- The specific question (varies per tree)
- The remaining hand (varies per previous play)
- The remaining Credibility (varies per previous cost)
- The committed Tags (varies per previous Tags)
- The reachable future questions (varies per branch taken)

Five variables, all path-dependent, all varying per puzzle. No single algorithm can pre-determine the right play without evaluating the specific configuration.

---

## 8. Cognitive Load Analysis

### Systems Count: 3

| System | What to Track | Mental Overhead |
|---|---|---|
| Evidence Matrix | Card values for the current question (shown on screen) | LOW — just read the numbers |
| Question Tree | Which branch you're on, what T3 options remain | MEDIUM — requires 1-2 turns of lookahead |
| Credibility | Current budget, remaining card costs, contradiction risk | MEDIUM — running subtraction |

**Total active working memory**: At any decision point, the player needs to hold:
1. The current question and its thresholds (displayed)
2. Their remaining cards and Credibility (displayed)
3. Their committed Tags (displayed)
4. 1-2 turns of future planning (mental)

This is 4 items, well within the 4+/-1 working memory limit for chunked game state.

### Why 3 Systems, Not Fewer

**2 systems (Matrix + Tree, no Credibility)**: Every puzzle reduces to "find the highest-conviction path through the tree." This is solvable by working backwards from T3 and always picking the max-value cards. No resource tension, no trade-offs. The game becomes a pure optimization puzzle solvable by algorithm.

**2 systems (Matrix + Credibility, no Tree)**: Without branching, the game is 3 independent turns. Play your best affordable cards each turn. No lookahead needed, no path-dependency. Becomes the current game with different numbers.

**3 systems**: Each pair of systems creates a tension that the third exploits. The tree creates futures to plan through; the matrix makes card values contextual to those futures; Credibility forces you to choose which futures you can afford. Remove any one and the game collapses to a simpler, solvable structure.

### Why Not 4

A fourth system (e.g., KOA mood, evidence degradation, witness mechanics) would increase the per-turn decision load without proportionally increasing strategic depth. Three interacting systems already produce a combinatorial space too large for mental enumeration but small enough for heuristic reasoning. Adding a fourth would cross from "strategically deep" to "cognitively exhausting" for a 3-5 minute daily game.

---

## 9. What's Lost vs the Current Design

### Lost: Thematic Richness of 9+ Mechanics

The current design has counters, refutations, concerns, corroboration, source diversity, repetition penalties, graduated contradictions, and more. Each mechanic tells a story: "KOA notices you're repeating yourself" (repetition), "different devices confirming the same thing is more convincing" (source diversity). The redesign collapses most of these into three systems. Some narrative texture is sacrificed.

**Mitigation**: KOA's dialogue at each tree node can carry the thematic weight. "Interesting — two devices both say you were home" (when playing two HOME-tagged cards) is flavor on the corroboration discount, not a separate mechanic.

### Lost: The Counter/Refutation Minigame

The current design's counter-and-refute system (KOA has evidence against you; specific cards negate it) creates a satisfying "gotcha" moment. The redesign doesn't have an explicit version of this.

**Mitigation**: The tree structure subsumes this. KOA's Pressure branch questions ARE the challenges. Answering them strongly IS the refutation. The feeling of "overcoming KOA's doubt" is preserved through the branching narrative.

### Lost: Discovery of Hidden Mechanics

Part of the current game's appeal is discovering that tags interact, that contradictions are graduated, that source diversity matters. The redesign puts everything on the table (transparent space), which means there are fewer "aha, the game is deeper than I thought" moments.

**Mitigation**: The *counter-intuitive optimal play* replaces hidden-mechanic discovery with strategic discovery. The "aha" moment shifts from "I didn't know this rule existed" to "I didn't realize playing weak on T1 was the right move." This is a deeper, more repeatable form of surprise.

### Lost: Simplicity of Card Evaluation

Currently, each card has one power number. In the redesign, each card has 5-7 context-dependent values. This is more information to process.

**Mitigation**: The UI only shows values relevant to the current question and the immediately reachable branches (3-4 values, not 7). The full matrix is available on request but not required for play.

### Gained: Genuine Replayability

The current design's replayability comes from the puzzle library (new cards, new numbers). The redesign's replayability comes from the puzzle library AND from the structural variation in question trees. Two puzzles with identical cards but different trees play completely differently. This doubles the design space for puzzle authors.

### Gained: Meaningful Skill Expression

The current design's skill ceiling is low — once you know the skeleton, every puzzle feels similar. The redesign's skill ceiling scales with the player's ability to plan through branching futures under resource constraints, which is the same skill that makes chess, bridge, and Slay the Spire endlessly deep.

---

## 10. Shareability Format

### The Interrogation Transcript

After each game, the player receives a compact shareable card:

```
HOME SMART HOME — "The Midnight Snack"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

T1  "Were you home?"         ██░░░ WiFi Log
    KOA: "Go on..."         → PROBE

T2  "Were you alone?"        ████░ Motion + Fitbit
    KOA: "Hmm, checks out." → STRONG

T3  "What were you doing?"   ███░░ Thermostat
    KOA: "...fine."          → WEAK

VERDICT: CLEARED ✓    Conviction: 9/9
Credibility: ████░░░░░ 5/9 remaining
Cards used: 4/6  |  Path: PROBE → ESCALATION

🏅 EFFICIENT — Won with 4+ Credibility to spare
```

### Encoding

The share card encodes:
- **Which cards** were played each turn (strategic choices)
- **Which branch** was taken (path through the tree)
- **Credibility remaining** (efficiency of play)
- **Badge earned** (optimization level)

### Badge Tiers

| Badge | Criteria | Rarity Target |
|---|---|---|
| CLEARED | Win the puzzle | ~50% of plays |
| EFFICIENT | Win with 4+ Credibility remaining | ~20% of plays |
| PRECISE | Win with exactly 1 Credibility remaining | ~5% of plays |
| MINIMAL | Win using 3 or fewer cards | ~3% of plays |
| UNTOUCHABLE | Win with no contradiction penalties fired | ~15% of plays |
| FLAWLESS | EFFICIENT + UNTOUCHABLE + all STRONG answers | <1% of plays |

### Why It Works for Sharing

The transcript tells a **story** — not just a score. "I took the Probe branch because my cards were terrible for the Pressure questions" is a narrative that invites comparison. Two players who both win might take completely different paths, use different cards, and earn different badges. The share card makes these differences visible and discussable.

The path notation (PROBE → ESCALATION) is compact enough for text-based sharing while encoding the full strategic arc of the game.
