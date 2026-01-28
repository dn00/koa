# Home Smart Home V3 — "The Statement"

**Date:** 2026-01-27
**Status:** Prototype — ready for agent playtesting
**Origin:** Synthesis of casual redesign ("The Statement") + reactive hint system ("The Interrogation")

---

## 1. One-Paragraph Pitch

You are a suspect. KOA, a smart-home AI investigator, is interrogating you about last night. You have **6 alibi cards** — but KOA knows that **exactly 2 of them are lies**. She hints at what the lies share in her opening statement. You must play **3 cards**, one per turn. After each play, KOA reveals whether that card was a **Truth** or a **Lie**. Truths add their strength to your defense; Lies subtract it. Reach KOA's target to be cleared. The twist: after Turn 1, KOA gives a **reactive hint** — a second clue that depends on WHICH card you played — creating branching deduction paths where your Turn 1 choice determines what information you get for Turns 2-3.

---

## 2. Rules in 3 Sentences

1. You have 6 alibi cards (each with visible strength 1-5 and attributes); exactly 2 are secretly Lies.
2. Play 1 card per turn for 3 turns — Truths add strength, Lies subtract it — KOA reveals the verdict after each play.
3. Reach the target score in 3 plays; use KOA's opening hint, her reactive Turn 1 response, and card attributes to deduce which cards are safe.

---

## 3. Detailed Mechanics

### 3.1 Setup (What the Player Sees)

Each daily puzzle presents:

- **KOA's Opening Statement** — A 1-2 sentence hint about the lies:
  - *"Something about your kitchen story doesn't add up."* (Lies are tagged KITCHEN)
  - *"Your timeline has gaps after midnight."* (Lies have timestamps after 12:00)
  - *"I don't trust anything from your phone."* (Lies have source PHONE)

- **6 Alibi Cards** — Each card has:
  - **Strength** (1-5): how much it helps (or hurts) your defense
  - **Location**: KITCHEN, BEDROOM, LIVING ROOM, GARAGE, etc.
  - **Time**: a timestamp like "10:30 PM", "11:15 PM"
  - **Source**: THERMOSTAT, DOORBELL, PHONE, FITBIT, TV, SECURITY CAM
  - **Claim**: flavor text ("I was asleep by 11")

- **Target** — A number (5-13). Your 3 plays must net this total or higher.

- **Lie Count** — Always exactly 2 out of 6. Fixed and known.

### 3.2 Turn Structure

**Turn 1:** Pick a card. Play it. KOA reveals TRUTH or LIE. Running total updates. **KOA gives a reactive hint** — a second clue that depends on which card you played.

**Turn 2:** Pick from remaining 5. KOA reveals. Total updates.

**Turn 3:** Pick from remaining 4. Final reveal. Final total.

### 3.3 Scoring

- TRUTH played: **+strength**
- LIE played: **-(strength - 1)** (partial credit — even a lie has some truth in it)
- Final total ≥ target → **CLEARED**
- Final total < target → **BUSTED**

### 3.4 Verdict Tiers

| Tier | Condition | Example KOA Line |
|------|-----------|------------------|
| **FLAWLESS** | 3 Truths played, max possible score | "...I hate how good your alibi is." |
| **CLEARED** | Total ≥ target | "Fine. You can go. For now." |
| **CLOSE** | Total within 2 of target | "Almost had me. Almost." |
| **BUSTED** | Total < target - 2 | "The fridge knows what you did." |

### 3.5 The Hint System

**Opening hint:** Truthfully describes a property shared by BOTH lies. May also describe some truths (red herrings). Varies in specificity by difficulty:

| Difficulty | Hint Type | Example |
|-----------|-----------|---------|
| Easy | Direct attribute | "Your bedroom alibi is shaky" |
| Medium | Compound | "Late-night phone data is unreliable" |
| Hard | Oblique | "Your story is too perfect in one place" |

**Reactive hint (the V3 innovation):** After Turn 1, KOA gives a second hint that depends on WHICH card you played. Each puzzle defines a `reactiveHints` map: `cardId → { text, implicates, quality }`.

Reactive hint quality is **conditional on T1 risk**:

- **Risky T1** (card is in hint group): KOA gives a **specific** hint (`quality: 'specific'`) that narrows or identifies the stealth lie. The `implicates` field lists card IDs this hint points toward.
- **Safe T1** (card is NOT in hint group): KOA gives a **vague** hint (`quality: 'vague'`) that provides atmosphere/mood but doesn't identify specific cards. `implicates` is empty.
- **Lie play**: Always specific — the point penalty is already paid.

This creates the **probe-vs-protect tradeoff**:
- Safe T1 = safe score but blind for T2/T3 (vague hint, must guess)
- Risky T1 = might lose points (if you play the hint-group lie) but get actionable intelligence

**Transparent probe:** Players are told upfront that their Turn 1 choice determines what KOA reveals. "Play a card KOA is watching — she'll tell you more." This makes the probe-vs-protect tradeoff an informed decision, not a hidden mechanic.

Why this matters:
- Turn 1 is no longer "pick the safest card" — it's "is the information worth the risk?"
- Two players playing the same puzzle can get different quality of information based on their T1 choice
- Adds a strategic layer without adding mechanical complexity (it's still just text from KOA)
- Makes Turn 1 the most interesting turn instead of the least interesting
- Defeats safe-play dominance: playing safe is cheap but leaves you guessing

### 3.6 The Deduction Loop

1. **Before Turn 1:** Read opening hint. Examine 6 cards. The hint narrows lie candidates. Decide: play safe (card outside hint group — guaranteed not the hint-group lie) or probe (card inside hint group — risky but informative)?

2. **The Turn 1 Dilemma (probe-vs-protect):** Safe T1 plays are low-risk but yield only a **vague** reactive hint — atmospheric text with no card identification. Probe T1 plays (cards in the hint group) risk hitting the hint-group lie but yield a **specific** reactive hint that narrows or identifies the stealth lie. The expert calculates: is the information worth the risk? Can safe cards alone reach target without knowing where the stealth lie is?

3. **After Turn 1:** You know one card's status + you have a reactive hint. If you played safe, the hint is vague — you're on your own for T2/T3. If you probed (and it was a truth), the hint specifically points toward lies. If T1 was a lie, the hint always reveals and points to the other lie (penalty already paid).

4. **Turn 2:** The skill turn. Combine opening hint + T1 reveal + reactive hint quality. With a specific hint, you can narrow confidently. With a vague hint, you're pattern-matching from the opening hint alone.

5. **Turn 3:** Often decided by now if you probed. But with vague hints from safe T1, you may still have 2+ lie candidates and must gamble.

### 3.7 Card Design Constraints (Per Puzzle)

1. Exactly 2 Lies, 4 Truths
2. Both Lies share at least 1 attribute value (the hinted pattern)
3. At least 1 Truth partially matches the hint (red herring)
4. Sum of top 3 Truth strengths ≥ target (always winnable with perfect play)
5. Average Lie strength ≥ average Truth strength (lies are tempting)
6. Hint is truthful — both lies satisfy the described property
7. Hint is not sufficient alone — at least 1 truth also partially matches
8. Target range: 5-13
9. Strength range: 1-5 per card, total across 6 cards: 18-22
10. Each card has a reactive hint entry (6 reactive hints per puzzle)

### 3.8 No Randomness

Everything is fixed per puzzle. Two players making identical choices get identical outcomes. The "uncertainty" is hidden information (which cards are lies), not randomness.

---

## 4-6. Example Puzzles (Pre-Split-Lie Design)

> **Note:** These examples were written before the Option C split-lie structure and conditional reactive hints were adopted. They illustrate general concepts (hint types, difficulty scaling, attribute deduction) but do NOT reflect the current implementation:
> - Both lies are in the hint group (no stealth lie)
> - No split-lie structure (no hint lie + stealth lie)
> - No reactive hint quality tiers (no probe-vs-protect tradeoff)
> - Targets are below the current 5-13 range
>
> For current puzzle examples, see `scripts/v3-puzzles.ts` and `puzzles-player-view.md`.

## 4. Example Puzzle — "The Midnight Snack"

### Setup

**KOA says:** *"I've cross-referenced your devices. Both suspicious alibis mention the kitchen."*

**Target: 3**

| # | Card | Str | Location | Time | Source | Truth/Lie |
|---|------|-----|----------|------|--------|-----------|
| A | Night mode — bedroom at 68°F | 5 | BEDROOM | 11:00 PM | THERMOSTAT | TRUTH |
| B | Heart rate 52bpm — deep sleep | 4 | BEDROOM | 11:30 PM | FITBIT | TRUTH |
| C | Front door cam — no movement | 3 | FRONT DOOR | 10:15 PM | DOORBELL | TRUTH |
| D | Fridge door stayed shut all night | 5 | KITCHEN | 2:30 AM | SMART FRIDGE | **LIE** |
| E | Kitchen motion — no activity | 4 | KITCHEN | 2:15 AM | MOTION SENSOR | **LIE** |
| F | Phone charged, screen off since 1am | 3 | LIVING ROOM | 1:00 AM | PHONE | TRUTH |

**Hidden pattern:** Both Lies are tagged KITCHEN. The hint names this directly (easy puzzle).

**Red herring:** None of the truths are KITCHEN — this is a straightforward Monday puzzle. The temptation is that the lies (strength 5 and 4) are the two highest cards alongside the thermostat.

### Walkthrough: Novice

Turn 1: Plays D (strength 5, highest along with A). KOA: **LIE (-5)**. Score: -5. Reactive hint: *"Interesting choice to lead with. The fridge data seems... too clean."*

Turn 2: Plays A (strength 5). KOA: **TRUTH (+5)**. Score: 0.

Turn 3: Needs 3 more. Plays B (strength 4). KOA: **TRUTH (+4)**. Score: 4. **CLEARED (4/3).**

Even hitting a lie on T1, the novice can still win on this easy puzzle. But they scored 4 instead of a possible 12 (FLAWLESS).

### Walkthrough: Expert

Turn 1: Plays A (strength 5, BEDROOM — clearly safe given "kitchen" hint). KOA: **TRUTH (+5)**. Reactive hint: *"Your bedroom checks out. But I notice the kitchen tells a different story..."* — reinforces KITCHEN pattern.

Turn 2: Plays B (strength 4, BEDROOM). TRUTH (+4). Score: 9.

Turn 3: Plays F (strength 3, LIVING ROOM). TRUTH (+3). Score: 12. **FLAWLESS (12/3).**

---

## 5. Example Puzzle — "The Broken Window"

### Setup

**KOA says:** *"The lies share a time AND a source — same device, same hour."*

**Target: 4**

| # | Card | Str | Location | Time | Source | Truth/Lie |
|---|------|-----|----------|------|--------|-----------|
| A | Garage camera — working on bike | 5 | GARAGE | 2:45 PM | CAMERA | TRUTH |
| B | Front door locked from inside | 4 | FRONT DOOR | 2:30 PM | SMART LOCK | TRUTH |
| C | Speaker playing music at 3pm | 5 | LIVING ROOM | 3:00 PM | SMART SPEAKER | **LIE** |
| D | Speaker log: "what was that noise?" | 4 | LIVING ROOM | 3:10 PM | SMART SPEAKER | **LIE** |
| E | Thermostat unchanged all afternoon | 3 | LIVING ROOM | 2:00 PM | THERMOSTAT | TRUTH |
| F | Smartwatch: 12 steps (stationary) | 3 | GARAGE | 3:15 PM | SMARTWATCH | TRUTH |

**Hidden pattern:** Both lies use SMART SPEAKER at ~3PM. The compound hint ("same device, same hour") requires intersecting two attributes.

**Red herring:** Card E is also LIVING ROOM (but different source and time). A player who reads "same hour" and looks only at 3PM cards might include F (3:15 PM, GARAGE) as a suspect.

### Strategic Depth

The compound hint forces multi-attribute deduction. "Same device" → look for cards sharing a source. SMART SPEAKER appears twice (C and D). "Same hour" → C is 3:00 PM, D is 3:10 PM — both around 3PM. The intersection points directly at C and D. But a novice might not parse "same device" as "same source attribute."

---

## 6. Example Puzzle — "The Missing Package"

### Setup

**KOA says:** *"The lies happened when nobody was watching."*

**Target: 5**

| # | Card | Str | Location | Time | Source | Truth/Lie |
|---|------|-----|----------|------|--------|-----------|
| A | Ring camera backup — no one approached | 5 | PORCH | 4:00 PM | DOORBELL | **LIE** |
| B | WiFi log — Netflix all afternoon | 5 | LIVING ROOM | 4:30 PM | ROUTER | TRUTH |
| C | Smart lock — door opened at 3:45 only | 5 | FRONT DOOR | 3:45 PM | SMART LOCK | TRUTH |
| D | Porch motion — only triggered at 4pm | 4 | PORCH | 4:15 PM | MOTION SENSOR | **LIE** |
| E | Thermostat — no open-door drafts | 3 | HALLWAY | 3:00 PM | THERMOSTAT | TRUTH |
| F | Phone — called delivery co at 5pm | 4 | LIVING ROOM | 5:00 PM | PHONE | TRUTH |

**Hidden pattern:** Both lies are PORCH devices — the location "where nobody was watching" because the camera footage was "corrupted."

**Oblique hint:** "When nobody was watching" is metaphorical. The player must connect it to the scenario (corrupted Ring camera → porch was unwatched) and then find the 2 porch cards.

**Tight target:** Top 3 truths: B(5) + C(5) + F(4) = 14. Generous margin on this puzzle — the difficulty is in parsing the oblique hint, not in arithmetic.

---

## 7. Principles Mapping

| Principle | How V3 Meets It |
|-----------|----------------|
| **1. Transparent space, opaque solution** | All 6 cards visible. Strengths visible. Target visible. Only hidden: which 2 are lies. |
| **2. Irreversible action + information** | Each play commits a card and reveals truth/lie. Turn 1 also triggers a reactive hint. Cannot undo. |
| **3. Optimal move is counter-intuitive** | Lies tend to be high-strength (tempting). Sometimes probing a suspected lie is better than playing safe. Sometimes the best T1 play is the one with the most useful reactive hint, not the highest strength. |
| **4. Partial info is helpful AND dangerous** | Opening hint narrows lies but also flags red herrings. Reactive hints reveal info but only for the path you chose — you don't know what other T1 plays would have revealed. |
| **5. Depth without punishing breadth** | Everyone plays 3 turns. Novice wins easy puzzles. Expert chases FLAWLESS on hard puzzles. Same game, different skill expression. |
| **6. Shareable artifact** | `✅ ❌ ✅ — CLEARED (4/9)` — compact, spoiler-free, encodes your sequence. |
| **7. Constraint is the engine** | 3 turns, 2 lies, subtraction penalty, fixed target, sequential commitment. Remove any and the puzzle collapses. |

---

## 8. Skill Gradient

| Stage | Behavior | Est. Win Rate |
|-------|----------|---------------|
| **Day 1** | Reads hint literally. Plays safe T1 (outside hint group). Gets vague hint. Guesses for T2/T3. Reduced lie penalty keeps them in the game. | ~40% |
| **Day 5** | Understands hints describe shared attributes. Still plays safe. Crosses hint with card attributes for T2/T3. | ~55% |
| **Day 10** | Learns that probing (T1 in hint group) yields specific hints. Reduced lie penalty makes probing survivable on easy/medium. Starts probing deliberately. | ~70% |
| **Day 20** | Reads compound/oblique hints. Calculates probe risk vs. info value. Identifies red herrings. Probes strategically. | ~80% |
| **Day 30** | Deduces both lies before playing from hint + attribute analysis. Uses T1 probe to confirm. Plays for max margin. | ~90% |

**Expert skills the novice lacks:**
1. Multi-attribute intersection (hint says "same device, same hour" → SMART_SPEAKER ∩ ~3PM)
2. Target arithmetic (can safe cards reach target without specific hints? If not, probe)
3. Probe-vs-protect calculation (which T1 play gives specific info at acceptable risk?)
4. Red herring detection (matches hint on one axis but not the hidden pattern)
5. Vague hint reading (extracting what little signal exists from atmospheric text)

---

## 9. Anti-Skeleton Argument

The V2.5 skeleton: "refute T1 → corroborate → manage penalties" — one algorithm for all puzzles.

V3 defeats this because:

1. **Hints vary structurally.** A direct hint ("both mention the kitchen") requires different deduction than a compound hint ("same device, same hour") or an oblique hint ("when nobody was watching"). No single algorithm handles all hint types.

2. **Reactive hints create branching.** Two players can get different information from the same puzzle based on their T1 choice. The search space is 6 possible T1 plays × 6 reactive hints × remaining deduction.

3. **Card values are contextual.** A strength-5 card isn't "best" if it's a lie. A strength-2 card isn't "worst" if it's the only safe path to target.

4. **The probe-vs-protect dilemma has no universal answer.** Probing is good when the suspected lie has low strength AND safe cards can still reach target after a hit AND the reactive hint is informative. None constant across puzzles.

5. **Difficulty scaling is qualitative, not quantitative.** Easy puzzles have direct hints. Hard puzzles have oblique hints. The techniques for Monday don't work on Saturday.

---

## 10. Cognitive Load Analysis

### Systems the Player Tracks

| # | System | Visible? | Working Memory |
|---|--------|----------|----------------|
| 1 | Card strengths | Yes | 6 numbers (1-5) |
| 2 | Card attributes | Yes | 3 tags per card |
| 3 | KOA's opening hint | Yes | 1 sentence |
| 4 | KOA's reactive hint | Yes (after T1) | 1 sentence |
| 5 | Running total vs target | Yes | 2 numbers |
| 6 | Which cards are lies | Hidden | Binary, exactly 2 of 6 |

**Total: 6 systems. Only 1 is hidden.** Estimated working memory: 3-4 chunks.

### Comparison to V2.5

| V2.5 System | V3 Equivalent |
|-------------|---------------|
| Power values | Strength values |
| Risk values | *Removed* |
| Tag opposition pairs | *Removed* |
| Corroboration bonuses | *Removed* |
| Repetition penalties | *Removed* |
| Counter/refutation | *Removed* |
| Source diversity | *Removed* |
| Scrutiny meter | *Removed* |
| Concerns system | *Removed* — single target number |
| Multi-card submission | *Removed* — always play exactly 1 |
| KOA dialogue (decorative) | KOA hints (mechanical) |

**9+ systems → 6 systems (only 1 hidden).** The cognitive task shifts from "manage parallel systems" to "deduce 1 hidden thing from visible clues."

---

## 11. What's Lost

| Lost | Why Acceptable |
|------|---------------|
| Multi-card submissions | Replaced by sequential deduction |
| Tag opposition | Replaced by lie deduction |
| Scrutiny meter | Replaced by target arithmetic |
| Concerns system | Biggest thematic loss — no longer "building a case across proof types" |
| Counter/refutation | KOA's hints replace counters as her "moves" |
| Corroboration combos | No combo mechanics |
| Graduated contradictions | No contradiction spectrum |
| 5 puzzle archetypes | Replaced by hint-type variety |

**Honest assessment:** V3 trades mechanical depth for deductive depth. V2.5 has more interacting systems, but they reduce to one algorithm by day 15. V3 has fewer systems but the deduction challenge varies daily based on hint construction and card layout. The skill ceiling may be lower in absolute terms, but the ceiling-to-floor ratio (felt depth) is higher.

The biggest genuine loss is **KOA as an active adversary**. In V2.5, KOA deploys counters and responds to plays. In V3, KOA sets the puzzle and reveals results but doesn't adapt mid-game. The reactive hint partially addresses this — KOA's response to your T1 play feels like she's reacting — but she's still a puzzle-setter, not an opponent.

---

## 12. Shareability

### Compact Format
```
HOME SMART HOME #127
"The Midnight Snack"
✅ ❌ ✅ — CLEARED (4/9)
KOA: "Fine. You can go. For now."
```

### Spoiler-Free
Only your 3 plays are shown (✅/❌), not which cards in the full set are lies. Other players still need to deduce that.

### What the Sequence Communicates
- **✅ ✅ ✅** — "I figured out both lies and avoided them"
- **❌ ✅ ✅** — "I probed a lie early and recovered"
- **✅ ❌ ✅** — "I got surprised mid-game"
- **✅ ✅ ❌** — "I was safe until Turn 3 where I had to gamble"

---

## Appendix A: Technical Schemas

### Card
```typescript
interface Card {
  id: string;
  strength: number;        // 1-5
  location: string;        // KITCHEN, BEDROOM, LIVING_ROOM, etc.
  time: string;            // "10:30 PM", "11:15 PM", etc.
  source: string;          // THERMOSTAT, DOORBELL, PHONE, etc.
  claim: string;           // Flavor text
  narration: string;       // Player character's spoken version of claim
  isLie: boolean;          // Hidden from player
}
```

### ReactiveHint
```typescript
interface ReactiveHint {
  text: string;                    // What KOA says
  implicates: string[];            // Card IDs this hint points toward
  quality: 'specific' | 'vague';   // specific = risky T1 (hint group), vague = safe T1
}
```

### Puzzle
```typescript
interface Puzzle {
  name: string;
  slug: string;
  scenario: string;                          // KOA's opening scene
  target: number;                            // Score needed to be cleared
  hint: string;                              // KOA's opening hint
  hintMatchingIds: string[];                 // Card IDs in hint group
  hintDimension: HintDimension;              // Machine-checkable hint definition
  cards: Card[];                             // 6 cards, exactly 2 with isLie=true
  reactiveHints: Record<string, ReactiveHint>; // cardId → hint after T1
  verdictQuips: Record<string, { truth: string; lie: string }>; // Per-card KOA lines
  dialogue: {
    flawless: string;
    cleared: string;
    close: string;
    busted: string;
  };
}
```

### Game State
```typescript
interface GameState {
  score: number;
  hand: Card[];             // Remaining cards
  played: Card[];           // Cards played so far
  turnsPlayed: number;      // 0-3
  activeHint: string | null; // Reactive hint text (set after T1)
}

interface TurnResult {
  card: Card;
  isLie: boolean;
  delta: number;            // +strength or -(strength-1)
  score: number;            // Running total after this turn
}
```

## Appendix B: Puzzle Validation Invariants

Machine-checked invariants are in `scripts/prototype-v3.ts`. Semantic invariants (S1-S13) are in `_process/v3-design/puzzle-gen-invariants.md`.

### Per-Puzzle (I1-I25)

| ID | Rule | Check |
|----|------|-------|
| I1 | Exactly 2 lies | `lies.length === 2` |
| I2 | Exactly 6 cards | `cards.length === 6` |
| I3 | 120 sequences | `6P3 = 120` |
| I4 | Hint matches 2-4 cards | `hintCards.length >= 2 && <= 4` |
| I5 | 1 hint lie + ≥1 red herring | `hintLies === 1 && hintTruths >= 1` |
| I6 | 1 stealth lie outside hint | `outsideLies === 1` |
| I7a/b | No safe group | Neither group alone reaches target |
| I8 | Always winnable | `top3TruthStrengths >= target` |
| I9 | Lies are tempting | `avgLieStrength > avgTruthStrength` |
| I10 | Weaker lie T1 → CLOSE | Recovery ≥ target-2 |
| I11 | Worst lie T1 survivable | Recovery ≥ target-4 |
| I12 | Lie strengths differ | Lies have different strengths |
| I13 | Win rate 15-80% | Random play simulation |
| I14 | FLAWLESS rate 5-35% | Random play simulation |
| I15 | Reactive hint coverage 6/6 | All cards have reactive hints |
| I16 | Verdict quip coverage 6/6 | All cards have verdict quips |
| I17 | Hint dimension matches IDs | `matchFn` agrees with `hintMatchingIds` |
| I18 | Specific hints implicate correct lies | Stealth lie or other lie referenced |
| I19 | Implicates ≤3 cards | Hints are actionable |
| I20 | No card IDs in dialogue | Closing lines don't leak |
| I21 | Hint lie shares attribute with red herring | WARN — plausibility check |
| I22 | Hint lie strength ≤ max red herring | WARN — temptation check |
| I23 | Hint quality matches group | Hint-group = specific, non-hint = vague |
| I24 | Vague hints have no implicates | `implicates: []` |
| I25 | Specific non-lie hints implicate ≥1 | Hints point somewhere |

### Cross-Puzzle (C1-C8)

| ID | Rule |
|----|------|
| C1 | Win rate non-increasing across puzzles |
| C2 | No single strength always a lie (WARN) |
| C3 | Lie strength pairs vary |
| C4 | Target non-decreasing |
| C5 | All safe complements < target |
| C6 | All weak-lie T1 → CLOSE |
| C7 | All worst-lie T1 → CLOSE (WARN) |
| C8 | Informed win rate non-increasing |

## Appendix C: Difficulty Scaling

| Parameter | Easy (Mon) | Medium (Wed) | Hard (Sat) |
|-----------|-----------|-------------|-----------|
| Hint specificity | Names the attribute directly | Names two intersecting attributes | Oblique/metaphorical |
| Red herrings | 0-1 truths match hint | 1-2 truths match hint | 2-3 truths match hint |
| Target tightness | Top 3 truths >> target | Top 3 truths = target + 2 | Top 3 truths = target exactly |
| Lie strength | Medium (3-4) | High (4-5) | High (4-5) |
