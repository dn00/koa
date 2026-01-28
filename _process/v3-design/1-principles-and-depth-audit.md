# Mechanic Principles & Depth Audit

**Date:** 2026-01-27
**Status:** Research findings — informing mechanic redesign
**Source:** Multi-agent analysis of daily puzzle mechanics, design weakness audit, and 4-futures exploration

---

## Part 1: The 7 Universal Principles of Great Daily Puzzle Mechanics

Extracted from reverse-engineering Wordle, NYT Connections, Spelling Bee, Balatro, and Slay the Spire. These are the abstract mechanical structures that make a puzzle 10/10, independent of theme or UI.

### Principle 1: Transparent Possibility Space, Opaque Solution

The player must see the shape of the problem without seeing the answer. Wordle: you know it's 5 letters from a known dictionary. Connections: you see all 16 words. Spelling Bee: you see all 7 letters. The input space is fully visible. The solution space is hidden but bounded. The mind needs a container to search within.

**Current design violation:** The solution is visible. With FULL counter visibility and preview mode, the player sees the answer before committing. The puzzle is solved at hand analysis.

### Principle 2: Every Action Is Irreversible and Produces Information

Each move must permanently change the player's knowledge state AND consume a scarce resource. Wordle: each guess costs 1/6 of budget and classifies 5 letters. Slay the Spire: each card played costs energy and reshapes the fight. Irreversibility makes decisions matter — if you can undo, tension vanishes.

**Current design violation:** The preview step makes actions effectively reversible. Submit → preview → cancel → try different cards. No commitment until you've seen the outcome.

### Principle 3: The Optimal Move Is Non-Obvious and Counter-Intuitive

The game must have a gap between what feels right and what is right. Wordle: the best guess is sometimes a word you know is wrong. Connections: the easiest-looking group is often the trap. Slay the Spire: the best move is often to take nothing. This gap is where skill lives. It rewards learning, creates aha moments, and gives experts visible superiority.

**Current design violation:** The optimal move is always obvious — match proof type to concern, do the arithmetic. There is no case where the weaker card is the correct play.

### Principle 4: Partial Information Must Be Both Helpful and Dangerous

Feedback should narrow possibilities but also create new traps. Connections "one away" tells you you're close but might lead you to swap the wrong word. Wordle yellow tiles confirm a letter but might misdirect placement. Good feedback is a double-edged gift.

**Current design violation:** All feedback is purely helpful. Contradiction warnings prevent mistakes. Damage previews confirm calculations. Nothing the game tells you can mislead or create a new decision.

### Principle 5: Depth Without Punishing Breadth

Everyone should be able to finish or get a satisfying result. But the distance between good and great should be vast. Wordle: everyone solves it, but 3 vs 5 guesses separates skill. Spelling Bee: "Good" is easy, "Queen Bee" is obsessive. Wide on-ramp, infinite ceiling.

**Current design:** Partially met. The Verdict Scale (proposed) would help. But the skill gradient is too shallow — day-10 and day-30 players use the same techniques.

### Principle 6: The Session Must Create a Shareable Artifact

The game must produce something compact that encodes your unique experience. Wordle's color grid. Connections' sequence of correct/wrong guesses. Must be legible to other players but spoiler-free. Must communicate "here's how I thought" not just "I won."

**Current design:** Not implemented. Proposed Testimony Transcript addresses this, but has spoiler risks (card sequence leaks strategy). Needs careful design to encode process without revealing solution.

### Principle 7: Constraint Is the Engine, Not the Obstacle

The best games feel restrictive in a way that focuses creativity rather than blocks it. Spelling Bee's center letter. Wordle's 5-letter limit. Slay the Spire's 3 energy per turn. The constraint isn't what you fight against — it's what makes the problem interesting. Remove the constraint and the game becomes trivial.

**Current design:** Partially met. Card contradictions are a good constraint. But the preview system and full visibility remove the constraint's teeth — you can always navigate around it with perfect information.

---

## Part 2: Design Weakness Audit

Comprehensive audit of every dimension where the current design is weak.

### Structural Issues

#### 1. Shallow Decision Depth Per Turn (Structural)

Most turns have an obvious best play. Concerns require specific ProofType matches — that's pattern matching, not strategy. The only real decision is "refute first or eat the contest?" which is arithmetic. Multi-card submission sounds deep, but corroboration just checks for matching claim values — the player doesn't construct claims, they're baked into cards. With the preview showing outcomes, even arithmetic is done for you.

#### 2. Low Skill Ceiling (Structural)

The engine has exactly these skill levers: avoid contradictions, refute counters, find corroboration, minimize turns. A player who has internalized the contradiction severity table and the 50%/25% math has reached the ceiling. KOA picks the first applicable non-refuted counter — trivially predictable. There are no combo chains, no scaling multipliers. The "Master" tier describes "non-obvious paths" but the engine has no mechanism to create them.

#### 3. Flat Emotional Arc (Structural)

Turn 1 is novel. Turns 2-4 are identical in texture — play card, KOA responds, bar shrinks. The design aims for +10-15 damage margin, so the outcome is usually decided by turn 3-4. No mid-run turning point. KOA doesn't adapt, escalate, or throw curveballs. Compare to Wordle where guesses 4-5 are agonizing because the remaining letter space is tiny.

#### 4. Replayability Exhausts by Day 15-20 (Structural)

No emergent behavior. Every interaction is designed and deterministic. Player understanding at day 10 equals day 30. The six puzzle "types" (Section 7.4) are parameter tweaks on the same pipeline, not distinct structures. No mechanic interaction the designer didn't intend.

### Moderate Issues

#### 5. Traps Are Always Obviously Wrong (Moderate)

Identifiable by name/flavor (by design), never required to win (by fairness rule). Correct strategy is always "ignore the trap." By day 5, traps are dead content. They should sometimes be worth the risk.

#### 6. Coarse Scoring (Moderate)

No composite score formula in the engine. Turn range is 3-6, contradictions 0-1 for competent players, counters refuted 0-3. Most winners score nearly identically. No meaningful gradient between good and great.

#### 7. Weekly Difficulty Is Quantitative Only (Moderate)

Hard has more counters and higher resistance than Normal but uses identical mechanics. No technique exists on Thursday that doesn't exist on Monday. Players want qualitative jumps, not tighter numbers.

#### 8. KOA's Personality Is Non-Mechanical (Moderate)

The game's biggest differentiator (KOA's character) doesn't affect outcomes, reveal information, or create choices. Players who skip dialogue experience: select cards, click submit, watch bar go down. Decoration can't compensate for mechanical shallowness.

### Code-Level Findings

#### 9. Counter Targets CardId, Not ProofType (Structural Mismatch)

Design doc says counters target proof types (any IDENTITY card triggers the camera). Code uses `targets: readonly CardId[]`. This eliminates the ability to bait counters with low-power cards to protect high-power ones. Significant design-code mismatch.

#### 10. TimeRange in Corroboration Check (Likely Bug)

`corroboration.ts:35` includes `timeRange` in the corroboration value set. Design doc says corroboration is for location/state/activity. Two cards with the same time range string get an unintended bonus.

#### 11. Missing Contradiction Pairs

Code only has ASLEEP/AWAKE, ASLEEP/ALERT, ASLEEP/ACTIVE. The DROWSY/ALERT conflict from the design doc is missing. ACTIVITY_STATE_CONFLICT type doesn't exist in implementation.

#### 12. Unused CRITICAL Severity

`enums.ts` defines `CRITICAL: 'CRITICAL'` but no resolver code uses it. Dead code or unfinished feature.

### The Common Thread

**The game has too few interacting systems.** Contradictions, counters, corroboration, concerns, and scrutiny all operate independently. They don't multiply each other's complexity. A game that wants depth needs mechanics that interact — where a decision about one system has consequences in another.

---

## Part 3: The Pre-Solvability Problem

### The Core Issue

With FULL visibility mode, a patient player can solve the entire puzzle before making a single move:
- Identify the trap card (name/flavor makes it obvious)
- Map which cards trigger which counters
- Identify refutation cards
- Calculate optimal play order including corroboration
- Execute the solution mechanically

Turns become decorative. The puzzle is solved at hand analysis — the exact failure mode D31 was designed to fix from D30.

### Futures Explored (Dr. Strange Analysis)

Four parallel agents explored solutions:

**Future 1: Draw Per Turn — REJECTED**
Breaks fairness invariant F4 outright. Cards you can't foresee contradict cards you already committed. Thins decisions, doesn't thicken them. 5-10x harder puzzle authoring. The wrong medicine for the right diagnosis.

Key finding: "The real problem is not that all cards are visible. The problem is that KOA's response function is deterministic and predictable."

**Future 2: Reactive KOA — STRONG**
KOA deploys counters in response to plays via deterministic decision tree. Different play orders trigger different counters. Creates genuine turn-by-turn uncertainty. Makes KOA feel like a character, not furniture.

Recommendation: Ship HIDDEN mode first (80% of payoff at 20% of cost). Reserve reactive triggers for Season 2. If built, keep triggers flat (ON_PROOF only).

**Future 3: Hybrid Info-Cost — WORTH REVISITING**
Hide counter details. Show hints. Spend scrutiny to reveal. The archived version was over-scoped (also removed damage previews, badges, etc.). Surgical scope: hide counters only, keep all other feedback. Makes hybrid the default, FULL as accessibility option. ~50 lines of engine change.

Key finding: "The archive reason ('binary is easier to balance') is a dodge. FULL mode has no puzzle to balance."

**Future 2+3 Combined — THE WINNER (staged)**
2-3 meaningful decisions per turn. All D31 invariants can be met. Session time stays 3-5 min. Solvability checking remains tractable. Difficulty scaling is elegant.

Critical insight: Reactive KOA alone solves the core problem. Info-cost is polish. Build reactive first, add info-cost if playtesting shows experts can pattern-match the triggers.

---

## Part 4: The Shape of a 9.5/10 Mechanic

Combining the 7 principles, the depth audit, and the pre-solvability fixes, all three analysis tracks converge on the same mechanic shape:

### Information Structure
- **Player sees:** All cards, all claims, KOA's challenge, KOA's counter categories (hints)
- **Player does NOT see:** Pre-submission warnings, damage previews, which specific counters will fire, or which of their cards contradict each other (they must deduce this)
- **Player learns per turn:** KOA's response (counter deployment, contradiction result, damage dealt) — information that is both helpful and dangerous

### Trade-Off Structure
The core trade-off is **conviction vs. consistency:**
- Strongest individual cards are most likely to trigger counters or contradict other cards
- Playing the strongest card isn't always the best move (Principle 3)
- Sequencing matters: Card A before B might trigger a counter that B-before-A avoids
- Scrutiny is spendable (reveal counters, accept MINORs) but finite

### Skill Gradient
- **Day 1:** Play cards that sound convincing. Get surprised. Learn rules.
- **Day 10:** Check time ranges mentally. Spot traps. Sequence refutations.
- **Day 30:** Read KOA's hints as constraint statements. Bait counters with weak cards. Calculate scrutiny budget trade-offs.
- **Day 100:** Construct deliberate MINORs because the scrutiny cost is worth the damage. Treat credibility as ammunition.

### Fairness Requirement
The contradiction rules must be simple enough to hold in your head (~5 rules):
1. Same room, same time → corroboration (good)
2. Same building, different room, overlapping time → fine
3. Different buildings, overlapping time → MAJOR (blocked)
4. Different buildings, sequential with <15 min gap → MINOR (+1 scrutiny)
5. Conflicting states at same time → ASLEEP+AWAKE = MAJOR, DROWSY+ALERT = MINOR

### What This Hits

| Principle | How It's Met |
|-----------|-------------|
| 1. Transparent space, opaque solution | Full hand visible, counter hints visible, compatibility graph hidden |
| 2. Irreversible information per action | Each commit reveals KOA's response and your contradictions |
| 3. Optimal move is counter-intuitive | Best card ≠ strongest card; sometimes bait, discard, or accept MINOR |
| 4. Feedback is helpful AND dangerous | KOA's counter reveals her hand but may expose your contradictions |
| 5. Depth without punishing breadth | Casual players finish with HUNG JURY; experts chase perfect verdict |
| 6. Shareable artifact | Verdict + KOA's closing line + turn sequence |
| 7. Constraint is the engine | Card contradictions force systemic thinking over brute play |

---

## Part 5: Approved Surface Improvements

These don't fix depth but improve the experience on top of whatever core mechanic is chosen:

### Testimony Lock
Remove pre-submission preview. Commit → reveal. Wordle-like dopamine gap. Implementation: remove UI code, not add it.

### Verdict Scale
Replace binary win/lose with 4-tier outcome. Labels TBD — NOT court-themed. Home/smart-home themed (KOA trust ratings, fridge access levels, etc.). Every tier gets unique KOA dialogue. Soft middle landing. Extreme bottom tier is funny and shareable.

---

## Part 6: Ideas Explored But Not Yet Prioritized

| Idea | Category | Notes |
|------|----------|-------|
| Reactive KOA | Core mechanic | Counters deploy via decision tree. Solves pre-solvability. |
| Hybrid info-cost | Core mechanic | Spend scrutiny to reveal counter details. Layer on top of reactive. |
| Escalating Alibi | Content strategy | Comedy scales with corroboration combo size. Zero new mechanics. |
| KOA Remembers | Meta/retention | Persistent adversary references play history across days. |
| Scrutiny Rating | Meta/retention | Rolling 30-day skill score. |
| The Objection | Core mechanic | KOA reopens a committed card mid-game. |
| The Bluff That Backfired | Core mechanic | Trap cards earn Hesitation tokens. |
| The Committed Bit | Core mechanic | Persona consistency modifies counter penalties. |
| KOA's Highlight Reel | Sharing | Losses generate shareable roast cards. |
| Testimony Transcript | Sharing | Shareable solve path as KOA dialogue. Spoiler risk. |
| Alibi Clock | Core mechanic | Real-time pressure. Accessibility concern. |

## Part 7: Rejected

| Idea | Reason |
|------|--------|
| Draw Per Turn | Breaks fairness (F4), thins decisions, 5-10x authoring cost |

---

## Next Steps

- Playtest the proposed mechanic shape across player types (casual, optimizer, social) to validate depth and accessibility
- Fine-tune contradiction rules for human learnability
- Decide on Reactive KOA scope (flat triggers vs. branching tree)
- Design the shareable artifact format (spoiler-free)
- Prototype Testimony Lock as a standalone change to validate the dopamine gap hypothesis
