# D32 — Puzzle Design Invariants

**Last Updated:** 2026-01-27
**Status:** Draft v2 — revised after 6-agent stress test
**Depends On:** D31 (core mechanics), D31-INVARIANTS (design constraints), D10 (solvability checks)

---

## Purpose

Define the authoring constraints that every daily puzzle MUST satisfy to guarantee a consistently engaging experience. These invariants are checkable — an LLM puzzle generator or human author can validate against them, and a solver can verify them automatically.

This doc consolidates findings from 5 design research agents + 6 stress-test agents, filtered through the canonical game design (D31) and existing invariants (D31-INVARIANTS). Where agent recommendations conflicted with existing design, resolutions are noted. v2 corrects the SEVERE contradiction proposal (rejected) and replaces the 4-tier Verdict Scale with a metrics + achievements model.

---

## Design Principles (Why These Invariants Exist)

We are building **Wordle with a personality**, not casual Balatro. The depth is in deduction, not emergent system mastery. Each daily puzzle is a self-contained logic problem wrapped in a comedy scene. The invariants below ensure every puzzle has:

1. A surface reading that's wrong (deception)
2. A correct solution that requires noticing something (discovery)
3. A near-miss path that makes losing feel close (retention)
4. Material for KOA to be funny about (entertainment)

---

## Resolved Design Tensions

These were open questions in D31-INVARIANTS. We're resolving them here.

### T1: Comfortable Margins vs Near-Miss Margins

**Old (D31):** S2 says total hand power >= resistance + 10.

**New:** The +10 buffer applies to the OPTIMAL path only. The naive path (highest-power cards, no synergy awareness) should fall SHORT of resistance. This creates the skill gap.

**Rule:** Optimal path damage = resistance + 3 to 8 (scales by difficulty). Naive path damage = resistance - 3 to 8.

**Rationale:** A flat +10 buffer means suboptimal play still wins. That kills puzzle depth. The buffer protects against impossible puzzles, not against lazy play.

### T2: No Hidden Gotchas vs Testimony Lock

**Old (D31-INVARIANTS):** "All critical info visible upfront."

**New:** All information needed to SOLVE is visible before you act. Outcomes are revealed after you commit. Card claims, proof types, and contradiction rules are all visible. What's hidden is the RESULT of your specific submission — you must reason about it, not preview it.

**Analogy:** Wordle shows you the keyboard and the rules. It doesn't show you the answer before you guess. That's not a gotcha — it's a puzzle.

**Note:** MAJOR contradictions still block submission (the game prevents catastrophic mistakes). Only MINOR contradictions, counter responses, and damage totals are post-commit reveals.

### T3: Mistakes Recoverable vs Scrutiny Pressure

**Old:** "One error doesn't end the game."

**Still true.** 1-2 MINORs = recoverable (scrutiny 2, still winnable). 3+ MINORs = danger zone. Scrutiny 5 loss requires multiple bad decisions, never one.

**By difficulty:**
| Difficulty | MINORs before danger | Scrutiny at "sweating" |
|------------|---------------------|----------------------|
| Tutorial   | N/A (no traps)      | N/A                  |
| Easy       | 3                   | N/A                  |
| Normal     | 2                   | 3                    |
| Hard       | 2                   | 3                    |
| Expert     | 1                   | 2                    |

### T4: Meta-Strategy Must Not Be a Single Formula

**Problem:** If "always avoid the highest-power card" wins every puzzle, the game is solved once someone posts an article.

**Rule:** The highest-power card must be the CORRECT play in ~40% of puzzles. The weekly archetype rotation ensures this — "Trap" puzzles punish the high card, "Tight margins" and "Corroboration" puzzles NEED it. The meta-strategy is "read THIS puzzle," not "apply THE formula."

**Encoding:** Across any 7-day window, at least 2 puzzles must have the highest-power card in the optimal path, and at least 2 must have it as the trap.

---

## Structural Invariants (Puzzle Composition)

These define what a well-formed puzzle looks like. Checked at authoring time.

### SI-1: The Decoy Card

Every Normal+ puzzle must contain exactly 1 card that is both:
- High power (top 2 in hand) AND
- Risky (triggers a counter, contradicts an optimal-path card, or requires non-obvious setup)

The decoy must NOT be obviously wrong. It must address a concern the player needs, or have the highest power, or both. The player should WANT to play it.

**Validation:** Decoy card power >= max(hand powers) - 2. Decoy proves at least 1 required ProofType.

### SI-2: The Weak Hero

Every Normal+ puzzle must contain at least 1 card where:
- Power is below median of hand AND
- Card is in the optimal play sequence AND
- Removing it from the optimal sequence reduces total damage by more than substituting any excluded card

The "boring" card is essential. This forces players to evaluate systemically, not by face value.

### SI-3: The False Friend

Every Normal+ puzzle must contain at least 1 pair of cards that:
- Share a surface similarity (same ProofType, similar claim, or thematic connection) AND
- Actually conflict (contradiction, or one triggers a counter the other doesn't)

This is the Connections principle — surface features mislead.

### SI-4: The Safe Exit (CRITICAL — Dead Turn Prevention)

Every hand must contain at least 1 card that:
- Power <= 3 AND
- Contradicts nothing else in the hand AND
- Has no SKETCHY trust tier

This is the escape hatch for high-scrutiny situations. The player always has a safe (if weak) play.

**Enforcement note:** This invariant, combined with F8 (3+ pairwise-compatible cards), is the PRIMARY defense against dead turns. Dead turns are a puzzle design bug, not a contradiction mechanic bug. If a player can reach a state with 3+ turns remaining and no meaningful plays, the puzzle fails SI-4/F8 validation. Do NOT soften MAJOR contradictions to fix dead turns — fix the puzzle.

### SI-5: No Clean Sweeps

No valid play sequence should result in: zero scrutiny, zero countered cards, all concerns addressed, and resistance cleared. Every winning path must involve absorbing at least one cost (a countered card, or a scrutiny point, or a suboptimal card choice).

**Rationale:** Victories without cost aren't satisfying. "I barely made it" beats "I crushed it."

### SI-6: Order Sensitivity

At least 1 pair of cards in the optimal sequence must produce >=15% different total damage when their play order is swapped. Turn order matters — same cards, different sequence, different outcome.

**What creates this:** Counter timing (which card gets contested first), corroboration setup (establishing a claim before matching it), concern fulfillment (unlocking a bonus by addressing a concern early).

---

## Margin Invariants (Difficulty Tuning)

These replace the flat S2 buffer from D31.

### MI-1: Optimal vs Resistance Margin

| Difficulty | Optimal Path Damage | Margin Over Resistance |
|------------|--------------------|-----------------------|
| Tutorial   | resistance + 8-12  | Generous              |
| Easy       | resistance + 6-10  | Comfortable           |
| Normal     | resistance + 3-6   | Tight                 |
| Hard       | resistance + 2-4   | Razor                 |
| Expert     | resistance + 1-3   | Knife-edge            |

### MI-2: Naive vs Resistance Gap

The "naive path" is defined as: play the N highest-power cards in descending power order, ignoring synergies, counters, and contradictions (but skipping MAJOR contradiction blocks).

| Difficulty | Naive Path vs Resistance |
|------------|-------------------------|
| Tutorial   | Naive wins (by ~5)      |
| Easy       | Naive wins (by ~2)      |
| Normal     | Naive loses (by 3-8)    |
| Hard       | Naive loses (by 5-12)   |
| Expert     | Naive loses (by 8-15)   |

**Key insight:** Tutorial and Easy should be winnable by naive play. Normal+ requires thinking. This protects casual onboarding while creating depth for regulars.

### MI-3: Near-Miss Path

Every Normal+ puzzle must have at least 1 non-optimal path where:
`|total_damage - resistance| <= 5`

This is the "if only" path — the player's reasonable-but-wrong sequence either barely wins or barely loses. This maximizes the near-miss rate that drives retry motivation.

---

## Narrative Invariants (Comedy & Retellability)

These ensure KOA has material and the player has a story to tell.

### NI-1: Every Counter Has a Punchline

No counter should exist as pure mechanics. Every counter must reference a specific, domestic detail that makes it funny. Not "biometric data contested" but "your heart rate hit 85bpm at 2:11am — that's kitchen-walk, not nightmare."

**Encoding:** Counter dialogue templates must include at least 1 variable referencing the player's submitted card claims.

### NI-2: The Crime Must Be Petty

Puzzle scenarios must be domestic and trivial: food theft, thermostat tampering, leaving doors open, using someone else's shampoo, watching TV too loud. The comedy comes from forensic intensity applied to mundane situations.

**Banned scenario types:** Anything violent, criminal (real crime), or mean-spirited.

### NI-3: One Self-Incriminating Card

At least 1 card in every hand should, if examined carefully, actually place the player CLOSER to the crime rather than further. The player who submits it without thinking creates KOA's best moment: "You just submitted a confession."

**Validation:** At least 1 card's claims overlap with the crime's time/location/activity.

### NI-4: KOA Acknowledges Clever Play

Even on wins, KOA must have lines recognizing the player's strategy. Even on losses, KOA must acknowledge what the player got right. This prevents losses from feeling like the system is unbeatable.

**Encoding:** Win/loss dialogue templates must include at least 1 line referencing the player's strongest card or best decision.

### NI-5: Losses Show the "If Only"

The result screen for losses must show the single card swap that would have changed the outcome (when one exists). This makes losses learnable AND creates the "one more try" impulse.

---

## Weekly Archetype Distribution

To prevent the meta-strategy from becoming a formula, puzzles rotate across archetypes:

| Archetype | Frequency | Highest-Power Card Is... | Core Lesson |
|-----------|-----------|--------------------------|-------------|
| Trap | 1-2/week | The trap (avoid it) | Read claims, not power |
| Tight Margins | 1/week | Essential (play it) | Every point matters |
| Counter-Heavy | 1/week | Contested (refute first) | Sequence around counters |
| Corroboration | 1/week | Irrelevant (combo wins) | Find hidden synergies |
| Push-Your-Luck | 1/week | Safe but costly | Accept scrutiny strategically |
| Eat-the-Contest | 0-1/week | Contested but still worth it | Sometimes absorb the penalty |

**Constraint:** Over any 7-day window, the highest-power card must be in the optimal path for at least 2 puzzles AND be the trap for at least 2 puzzles.

---

## Solvability Constraints (Updated from D31)

These update the existing solvability rules:

| ID | Constraint | Status |
|----|-----------|--------|
| S1 | All concerns addressable with dealt hand | **Unchanged** |
| S2 | ~~Total hand power >= resistance + 10~~ | **Replaced by MI-1/MI-2** |
| S3 | At least 2 meaningfully distinct winning paths | **Unchanged** |
| S4 | Max 1 trap card (now called "decoy," see SI-1) | **Unchanged** |
| S5 | Refutation exists for primary counter OR winnable despite contest | **Unchanged** |
| C1 | No forced MAJOR contradictions in any winning path | **Unchanged** |
| C2 | Optimal path scrutiny <= 3 | **Unchanged** |
| F8 | At least 3 cards pairwise-compatible | **Unchanged** |
| **NEW** | SI-1 through SI-6 (structural invariants above) | **New** |
| **NEW** | MI-1 through MI-3 (margin invariants above) | **New** |

---

## Proposed Mechanic Changes (Approved for Implementation)

These are the mechanic changes we're committing to based on design research:

### Testimony Lock

Remove the pre-submission preview. Player commits cards blind — sees contradictions, damage, counter responses AFTER submit. MAJOR contradictions still block (safety net). Everything else is a post-commit reveal.

**Why:** Creates the Wordle "commit then discover" dopamine gap. Transforms the game from "optimize a preview" to "reason about what will happen." This is the single biggest depth unlock.

### Outcome System (Replaces "Verdict Scale")

~~4-tier verdict scale~~ **REJECTED** (v2). 4 tiers is too coarse for optimizers and invisible to casuals. Stress testing showed tiers don't create tension — multi-dimensional metrics do.

**Binary outcome:** Access Granted / Access Denied. Clean, unambiguous. KOA's tone varies by HOW you won/lost.

**Three performance metrics** (displayed on result screen + share card):
1. **Turns used** (X/6) — the Wordle guess-count equivalent
2. **Scrutiny** (0-5) — the Connections mistake-count equivalent
3. **Counters refuted** (X/Y) — skill signal, like Connections' "purple first"

**Achievement badges** (rare outcomes that drive sharing):
- **FLAWLESS** — Win in ≤3 turns + 0 scrutiny + all counters refuted. The "Wordle in 2" brag.
- **CLUTCH** — Win on final turn OR with ≤3 resistance remaining. Drama = shareable.
- **PERFECT** — 0 scrutiny (any turn count). Clean play signal.
- **REFUTATION MASTER** — All counters refuted + 0 contradictions.

**KOA tone mapping** (replaces tier tones):
| Outcome | KOA Tone | Example |
|---------|----------|---------|
| FLAWLESS win | Stunned silence → grudging respect | "I... have no objections. This troubles me." |
| Clean win (0-1 scrutiny) | Resigned acceptance | "Your story is annoyingly airtight." |
| Scrappy win (2+ scrutiny) | Suspicious concession | "You got through. I'm noting the inconsistencies." |
| Near loss (resistance 1-5) | Amused near-catch | "One more question and I'd have had you." |
| Blowout loss | Comedy roast (shareable) | "Did you even READ your cards?" |

**Share card format:**
```
Home Smart Home #42
🧊 SMART FRIDGE

ACCESS GRANTED ✅
🎯 3/6 turns | 🔍 0/5 scrutiny | 🛡️ 2/2 refuted
🏆 FLAWLESS

KOA: "...I have no objections. This troubles me
more than your midnight snacking."
```

**Why this works:** Turns = comparable number (like Wordle). Scrutiny = mistake count (like Connections). Badges = rare flex. KOA quote = the personality moment that IS the shareable grid equivalent. Three paths to sharing: rare achievement, dramatic outcome, or quotable KOA line.

### Expanded Contradiction Axes

Currently only ASLEEP/AWAKE is a meaningful axis. Add:
- DROWSY/ALERT (already in schema, underused)
- State/activity mismatches (ASLEEP + WALKING, IDLE + EXERCISING)
- Tighter location thresholds for same-building locations

**Goal:** 3-5 memorizable contradiction principles instead of a hidden lookup table.

### Dead Turn Handling

~~SEVERE contradictions (soften MAJOR to 75% damage + 2 scrutiny)~~ **REJECTED** (v2). Stress testing found SEVERE:
- Makes the game LESS forgiving (2 scrutiny per card = tighter budget than hard blocks)
- Weakens the teaching moment ("blocked" is clear, "75% reduction" is opaque)
- Breaks trap card design (decoy becomes "inefficient" not "deadly")
- Creates confusion for casuals (damage numbers feel random)
- Is exploitable if per-submission rather than per-card

**Dead turns are a puzzle design bug, not a contradiction mechanic bug.** MAJOR contradictions stay as hard blocks. The fix is three-fold:

**1. "End Run" button** — Appears when the engine detects the player cannot mathematically win (remaining card power + remaining turns < resistance, or all playable cards blocked). Label: "See Result" (not "Give Up"). KOA: "Smart call. You saw the problem."

**2. KOA comedy fills dead turns** — If the player doesn't resign, each dead turn gets a short escalating roast:
- Turn N: "Still thinking?"
- Turn N+1: "There's no way out. I checked."
- Turn N+2: "I respect the optimism."

**3. Shareable loss screen** — Bottom-tier losses get a comedy card with KOA's best roast + the player's worst decision. Players share because KOA is funny, not because losing is fun.

**Root cause prevention:** Enforce SI-4 (safe exit card) and F8 (3+ pairwise-compatible cards) strictly in puzzle validation. If a puzzle allows a state where 3+ turns remain with no meaningful plays, it fails validation.

### Scrutiny as Strategic Resource

Reframe scrutiny from "penalty to avoid" to "resource to spend wisely." This is NOT a rename — it requires mechanical changes:

**1. SKETCHY cards are 25-30% stronger** than equivalent VERIFIED/PLAUSIBLE cards. Spending scrutiny must feel like activating a power spike, not accepting a tax. A SKETCHY card at power 13 vs a VERIFIED card at power 10 creates a real decision.

**2. Display as KOA mood states**, not numeric budget. Casuals see KOA's face change (NEUTRAL → SUSPICIOUS → CONCERNED). Full stats mode shows the number for optimizers. Do NOT display "2/4" format — it implies a currency system that doesn't exist.

**3. Some optimal paths require 1-2 scrutiny spend.** Per SI-5 (no clean sweeps), winning always involves absorbing a cost. For Push-Your-Luck archetypes, the optimal cost is scrutiny.

**4. Scrutiny recovery (NEW):** Refuting a counter restores 1 scrutiny (minimum 0). This creates a strategic loop: spend scrutiny early on a SKETCHY card → refute a counter later to recover it. Without recovery, scrutiny is just a ticking clock with no counterplay (unlike HP in Slay the Spire or chips in poker).

**5. Weekly rotation support:** At least 1 puzzle per week (Push-Your-Luck archetype) must have the SKETCHY card in the optimal path. At least 1 puzzle per week must have the SKETCHY card as a trap (high power but costs scrutiny you can't afford).

---

## What This Doc Does NOT Cover

- Reactive KOA (counters deploy in response to plays) — still in exploration
- Hybrid info-cost (spend scrutiny to reveal counter details) — still in exploration
- Freeplay mode mechanics — post-MVP
- Card pool model changes — current per-puzzle model is confirmed
- Engine implementation — see engine-core-hardening plan

---

## Validation Pipeline

Every generated puzzle should be checked against these invariants in order:

1. **Solvability** (S1-S5, C1-C2, F8) — is the puzzle fair?
2. **Structure** (SI-1 through SI-6) — does the puzzle have the right shape?
3. **Margins** (MI-1 through MI-3) — are the numbers tuned?
4. **Narrative** (NI-1 through NI-5) — does KOA have material?
5. **Weekly balance** — does this puzzle fit the archetype rotation?

Steps 1-3 are automated (solver). Step 4 is semi-automated (template checks + LLM review). Step 5 is editorial (puzzle scheduler).

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1 | 2026-01-27 | Initial draft from 5-agent design research |
| v2 | 2026-01-27 | 6-agent stress test corrections: rejected SEVERE contradictions, replaced 4-tier Verdict Scale with metrics+achievements, added Dead Turn handling, added Scrutiny as Strategic Resource, strengthened SI-4 enforcement |
