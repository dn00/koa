# Canonical Deck Design — The [1,2,3,4,5,6] Problem

**Date:** 2026-01-28
**Status:** Superseded by doc 9 (V4 Pair Play) — retained as design history
**Depends on:** Validated V3 gameplay loop (PT1-PT4), balance sim findings, 7 principles audit

---

## The Goal

Design a card system where:
1. Every card has a unique strength from 1 to 6
2. The deck is universal — same 6 strengths across all puzzles
3. Puzzle variation comes from lie assignment, narrative, and context — not bespoke strengths
4. The system supports deckbuilding, collecting, and a physical board game in the future
5. The core gameplay loop (play 3 of 6, reactive hints, verdict scale) is preserved

---

## Why [1,2,3,4,5,6] Doesn't Work Today

### The Math

The current system has one rule: strength = points if truth, penalty if lie.

With `[1,2,3,4,5,6]` (sum=21) and 2 lies, the `liesTempting` invariant requires `avgLie > avgTruth`. That means lies must sum to 11+. Only 4 of 15 possible lie pairs qualify: `[3,5]`, `[3,6]`, `[4,5]`, `[4,6]`. Of those, several fail other checks (instant KO, strength-first = oracle). Maximum viable: 3-4 lie pairs out of 15.

### What We Tried

| Approach | Result |
|----------|--------|
| Different penalty formulas (flat, sqrt, inverted, half) | Max 3/15 pairs |
| Larger decks ([1-7], [1-8]) | 6/21 at best — helps but loses elegance |
| Tags/evidence types with bonus conditions | Max 3/15 per bonus, 4/15 across all bonuses |
| Relaxing `liesTempting` to >= | Still only 5-6/15 |

### Root Cause

**One number controls both attractiveness and penalty.** A card's strength determines:
- How many points it gives (truth)
- How many points it costs (lie)
- How much the player wants to play it

This triple binding means high-strength lies are simultaneously the most tempting AND the most devastating, while low-strength lies are unthreatening but also untempting. The only distributions that balance all three are compressed ranges with duplicates — exactly what we don't want.

---

## The Design Insight

In every great card game, a card's **face value** and its **strategic value** are different things.

- **Poker:** A 2 completes a straight. An ace can be low.
- **Balatro:** A 2 of hearts in a flush build outscores a lone king.
- **Slay the Spire:** A 0-cost card is sometimes better than a 3-cost card.
- **Yu-Gi-Oh:** A 300 ATK card with the right effect beats a 3000 ATK beatstick.

Our game needs this gap. The player should look at a str-2 card and a str-5 card and not always know which is more valuable to play. That uncertainty is where depth lives.

---

## Proposal: Contextual Scoring

### Core Concept

Each card has a **base strength** (1-6, printed on the card, permanent) and an **evidence type** (DIGITAL, PHYSICAL, TESTIMONY, SENSOR — the card's identity/flavor).

Each puzzle has a **scoring context** that modifies how base strengths translate to points. The context is visible to the player before they play (transparent possibility space), but the interaction with hidden lie identity creates the decision depth.

### Scoring Contexts (Puzzle Modifiers)

The puzzle (scenario card) specifies one scoring context:

**1. Evidence Weight**
"KOA trusts SENSOR evidence." One evidence type scores at 1.5x (round down). Others score at 1x. A str-2 SENSOR card scores 3, while a str-5 DIGITAL card scores 5. Not always better, but sometimes.

**2. Corroboration Bonus**
"KOA wants consistency." If your 3 played cards share a common attribute (same type, same location, same time window), +N bonus to total score. This makes a trio of weak same-type cards potentially outscore three strong diverse cards.

**3. Suspicion Penalty**
"KOA is suspicious of DIGITAL evidence." One evidence type scores at 0.5x (round up). Playing a str-6 DIGITAL card only gives 3 points. But the PLAYER doesn't know if it's a lie — the str-6 DIGITAL card is either a 3-point truth or a devastating lie. Suspicion creates a dilemma even for truths.

**4. Escalation**
"KOA's patience wears thin." Cards played later score higher: T1 at 0.75x, T2 at 1.0x, T3 at 1.25x (round nearest). Now you want to save your strong truths for T3 — but what if T1 reveals your strong card is a lie? The information-sequence tradeoff deepens.

**5. Threshold Bonus**
"KOA respects bold claims." If any single card scores 5+, bonus +2 to total. Rewards playing high-strength cards but also rewards lies — because lies are high-strength too. The player is incentivized to play the very cards most likely to be lies.

### How This Solves liesTempting

`liesTempting` exists because players should *want* to play lies (before knowing they're lies). With contextual scoring, temptation comes from the scoring context, not raw strength:

- **Evidence Weight:** A str-3 lie of the weighted type scores 4 as a truth — more tempting than a str-4 truth of the unweighted type.
- **Corroboration Bonus:** A str-2 lie that completes a type trio is worth playing for the +N bonus.
- **Threshold Bonus:** A str-5 lie triggers the bonus — the player WANTS to play it.

The new invariant becomes: **"In the puzzle's scoring context, every card has a reason to be played."** This is checkable per-puzzle, not per-card-in-isolation.

---

## How This Enables the Elegant Deck

With contextual scoring, puzzle creation becomes:

1. **Pick a deck** — always [1,2,3,4,5,6], each with an evidence type
2. **Assign lies** — any 2 of 6 (all 15 pairs potentially viable)
3. **Choose a scoring context** — one of the above modifiers
4. **Set a target** — tuned to the context + lie assignment
5. **Write the narrative** — the creative work

The first 4 steps are automatable. A generator script can:
- For each lie pair × context, find valid targets
- Check all balance criteria
- Output viable puzzle configs

Puzzle authors only need to write scenarios and assign which real-world evidence cards map to which strengths.

---

## Deckbuilding Future

With canonical strengths and evidence types, cards become **persistent objects**:

### Card Identity
- **Strength:** 1-6 (permanent, printed)
- **Evidence type:** DIGITAL, PHYSICAL, TESTIMONY, SENSOR (permanent)
- **Art/narrative:** Unique per card ("Ring Doorbell Footage", "Fitbit Sleep Log")
- **Rarity:** Cosmetic variants, alternate art, foils

### Deckbuilding Rules
- Bring 6 cards to a puzzle
- Must include at least one of each strength? Or free choice?
- Puzzle's scoring context makes some evidence types more/less valuable
- Metagame: "This week's puzzles favor SENSOR evidence" → players adjust decks

### Collection & Economy
- Daily puzzle rewards: new card variants
- Seasonal sets: new evidence types that interact with new scoring contexts
- Trading: meaningful because card identity (type + strength) affects strategy
- Rarity: cosmetic only (no gameplay advantage from rare cards — fairness)

### Physical Game Translation
- Box contains: 6 strength cards (1-6) × 4 evidence types = 24 cards
- Scenario booklet: lie assignments, targets, scoring contexts, narratives
- Each scenario says "Use these 6 cards" (by type + strength)
- Expansions add new evidence types and scoring contexts

---

## What Changes from V3

| Aspect | V3 (Current) | V4 (Canonical) |
|--------|-------------|----------------|
| Card strengths | Bespoke per puzzle | Fixed [1,2,3,4,5,6] |
| Lie temptation | From raw strength avg | From scoring context |
| Puzzle authoring | Tune 6 strengths + target | Pick context + lies + target |
| Penalty formula | `-(str-1)` always | `-(str-1)` but on context-modified score? Or on base? TBD |
| Balance scripts | Per-puzzle sweep | Per-context × per-lie-pair matrix (precomputed) |
| Deckbuilding | N/A | Evidence type selection |
| Physical version | Impossible (bespoke) | Natural (canonical deck + scenario cards) |

---

## Open Questions

### 1. Does the penalty apply to base strength or context-modified strength?

- **Base:** `-(str-1)` regardless of context. Simpler. Lie cost is predictable.
- **Modified:** Penalty scales with context. A str-3 lie in a 1.5x context costs more. More complex but more consistent ("the card is worth what the card is worth").

Recommendation: **Base.** The context modifies truth value, not lie cost. This creates the asymmetry that makes lies viable at low strengths — a str-2 truth in a 2x context scores 4, but a str-2 lie still only costs 1. The lie is cheap, the truth is valuable, and the player can't tell which is which.

### 2. How many evidence types?

- **3 types:** Simple. Every 6-card hand has 2 of each. Clean.
- **4 types:** More variety. 6 cards = at least one type is single. Creates natural "off-type" cards.
- **5+ types:** Too many for a 6-card hand. Deckbuilding territory.

Recommendation: **4 types** for the digital game (maps to DIGITAL, PHYSICAL, TESTIMONY, SENSOR). **3 types** for the physical game (simpler components).

### 3. How does this interact with reactive hints?

Current hints: "One lie denies something" (attribute-based). With evidence types, hints could also be type-based: "KOA trusts the SENSOR evidence too much" (implying a SENSOR card is a lie). This adds a new dimension to hint design.

### 4. Should scoring contexts be visible or hidden?

- **Visible** (recommended): Player sees "KOA trusts SENSOR evidence" before playing. Transparent possibility space. The depth comes from not knowing which cards are lies.
- **Hidden:** Player discovers the context through play. More Slay the Spire, less Wordle. Higher ceiling but higher floor.

### 5. Multi-act structure

With canonical decks, multi-act becomes natural:
- Act 1: 6 cards, target 8, context "Evidence Weight: DIGITAL 1.5x"
- Act 2: Same 6 cards minus 1 already played, target 6, context "Suspicion: PHYSICAL 0.5x"
- Act 3: Remaining cards, target 5, context "Escalation"

Each act has a different context, so card value shifts between acts. The str-2 DIGITAL card you ignored in Act 1 might be critical in Act 3. This is the Balatro multi-round escalation.

---

## Validation Plan

### Script: Context Balance Sweep

For each scoring context × each lie pair (15) × targets:
- Check all balance criteria (adapted for contextual scoring)
- Report how many lie pairs are viable per context
- Report "weak beats strong" instances (P3 compliance)
- Output a viability matrix: context × lie pair → target range

### Script: Cross-Context Puzzle Generator

Given a set of scoring contexts, generate puzzle sequences where:
- Lie pairs don't repeat
- Contexts create varied decision textures
- Difficulty progresses (targets increase, contexts get more complex)
- Strength-first is never oracle (P3)

### Agent Playtest

Run the validated playtest loop (PT1-PT4 protocol) with:
- Same agents, same survey
- New context-modified scoring
- Specifically test: "Did the scoring context change your card selection?"
- Measure: do agents play differently under different contexts?

---

## Next Steps

1. Build context balance sweep script — validate that [1,2,3,4,5,6] supports 10+ lie pairs across all contexts
2. If yes: draft V4 card schema (strength + type + context modifiers)
3. If no: identify which contexts fail and why, iterate
4. Prototype one puzzle with contextual scoring
5. Agent playtest to validate depth improvement
