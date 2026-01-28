# Puzzle Archetype Spec — V4 Pair Play

Defines the rules for authoring new V4 puzzles. Any puzzle matching this spec can be validated by the brute-force checker (`scripts/prototype-v4.ts`). Agent playtests are only needed when the spec itself changes.

**Depends on:** 9-pair-play-design.md, puzzle-gen-invariants.md (V4)

**Design Identity:** Card battler without combat. KOA is the opponent with telegraphed patterns (stance), stateful attacks (pressure), and a turning point (The Objection).

---

## Fixed Constants

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Cards | 8 | Large enough for combo depth, small enough for daily puzzle |
| Lies | 3 | Forces playing ≥1 lie (can only dodge 2 of 3) |
| Truths | 5 | Enough for 3 strong pairs with headroom |
| Turns | 3 | Play 1 pair per turn — 3-act narrative arc |
| Cards per turn | 2 (pair) | Composition creates emergent scoring via combos |
| Cards left unplayed | 2 | Player's deduction expressed as "leave these out" |
| Reactive tells | After Turn 1 and Turn 2 | Pattern commentary, no direct hints after Turn 3 |
| The Objection | After Turn 2 | KOA challenges highest-strength played card |
| Strengths | 1–8, all unique | Canonical deck — every card has a distinct value |
| Evidence types | 4 types, 2 cards each | DIGITAL, PHYSICAL, TESTIMONY, SENSOR |
| Locations | 4 locations, 2 cards each | Tied to scenario |
| Times | 8 sequential slots | One per card |

### Stance System (per-puzzle)

Each puzzle declares a stance that shifts combo values:

| Stance | Reinforcement | Coverage | Corroboration | Timeline |
|--------|---------------|----------|---------------|----------|
| SKEPTIC | 1 | 4 | 3 | 2 |
| TRADITIONALIST | 4 | 0 | 4 | 2 |
| NEUTRAL | 3 | 2 | 3 | 2 |

Stance is announced at puzzle start — "I don't trust evidence that all says the same thing" (SKEPTIC) tells the player to diversify evidence types.

### Pressure System (order matters)

Play order affects scoring through accumulated pressure:

| Rule | Trigger | Penalty |
|------|---------|---------|
| HIGH STRENGTH | Previous pair > 10 combined strength | -1 |
| TYPE ECHO | Evidence type played in previous turn | -1 per card |
| LOCATION CHAIN | Continuing clustered location from previous pair | -1 |

**Note:** With 2 cards per location, LOCATION CHAIN can only trigger if puzzle has 3+ cards in some locations.

### The Objection (after T2)

KOA challenges the highest-strength card played after T1+T2:
- **Stand By**: +2 if truth, -3 if lie
- **Withdraw**: -2 regardless

This creates a turning point where the player must evaluate their confidence in a specific card.

---

## Variance Bands

| Parameter | Range | Notes |
|-----------|-------|-------|
| Target | 15–25 | Primary difficulty lever |
| Lie strengths | Any 3 of [1–8] | Validator checks viability per triple |
| Hint ambiguity | 4–6 cards match | 3 lies + 1–3 red herring truths |
| Optimal margin | 5–15 over target | Best possible play should feel satisfying |
| Random win rate | 10–50% | Not trivial, not impossible (I12) |
| FLAWLESS rate | 5–30% | Mastery matters (I13) |

---

## Required Elements (every puzzle)

### 1. Ambiguous Hint
The opening hint must match ≥4 cards (all 3 lies + at least 1 truth). A hint matching exactly 3 cards solves the puzzle instantly. Hints matching 5–6 cards create the best deduction challenges — the player must narrow from "many suspects" to "these 3."

**Test:** Count how many cards satisfy the hinted property. If only 3 → add a red herring truth or broaden the hint.

### 2. Forced Lie Play
With 3 lies and only 2 unplayed slots, the player **must play at least 1 lie**. This is structural, not per-puzzle. The puzzle author's job is to make the forced lie play feel like a decision, not a coin flip:
- The player should be able to narrow to 3–4 suspects, then choose which 2 to dodge
- The remaining suspect (played as a forced lie) should be containable (pair with a weak truth, or pair two suspects together)

### 3. Tempting Combos on Risky Pairs
At least 2 lie cards must have a same-type or same-location truth partner. This creates the core dilemma: "This pair gives +3 corroboration AND +3 reinforcement if both are truths... but if one is a lie, I lose the combo AND eat the penalty."

**Test (I15):** Each lie has at least one combo-eligible truth partner.

### 4. Pairing Matters
Different pairings of the same 6 played cards must produce different scores. If all pairings score the same, pair choice is illusory.

**Test (I9):** ≥50% of leave-out choices have pairing variance.

### 5. Strength-First Fails
Playing the 3 highest-strength pairs (greedy strategy) must not be optimal. The player who ignores combo structure and just plays big numbers should lose to the player who pairs strategically.

**Test (I16):** Strength-ordered play ≠ best play.

### 6. Recovery Gradient
Playing 1 lie should be recoverable. Playing 2 lies should be close. Playing 3 lies should be survivable but not clearable:
- **1-lie best play ≥ target** (I6/I7)
- **2-lie best play ≥ target − 3** (I10) — close enough to feel "if only I'd..."
- **3-lie best play > 0** (I11) — not a total wipeout

### 7. Reactive Tells (Helpful AND Dangerous)
KOA's pattern commentary after T1 and T2 must be ambiguous — helpful for deduction but not actionable instructions.

**What reactive tells should do:**
- Comment on play patterns (same type, same location, high strength)
- React to detected lies without revealing which card
- Vary based on stance (SKEPTIC cares about type diversity, TRADITIONALIST about consistency)

**What reactive tells should NOT do:**
- Name specific cards as suspicious
- Provide actionable instructions ("play X next")
- Give clean deduction paths that agents can exploit

Examples:
- ✓ "Two DIGITAL sources? That's a lot of eggs in one basket." (pattern commentary)
- ✓ "Something about that didn't quite add up." (lie detected, not identified)
- ✗ "The email_log seems suspicious." (names card)
- ✗ "You should pair testimonies next turn." (instruction)

---

## Combo Structure

### The `paired-both` Layout

The default card layout pairs types AND locations:

| Card | Str | Type | Location |
|------|-----|------|----------|
| 1 | 1 | DIGITAL | Loc A |
| 2 | 2 | DIGITAL | Loc A |
| 3 | 3 | PHYSICAL | Loc B |
| 4 | 4 | PHYSICAL | Loc B |
| 5 | 5 | TESTIMONY | Loc C |
| 6 | 6 | TESTIMONY | Loc C |
| 7 | 7 | SENSOR | Loc D |
| 8 | 8 | SENSOR | Loc D |

Each natural pair (1+2, 3+4, 5+6, 7+8) shares type AND location → +3 corroboration + +3 reinforcement = +6 if both truth. Cross-pair combos are coverage (+2, different types) or timeline (+2, adjacent times).

This creates **high-reward natural pairs** that the lie assignment deliberately disrupts.

### Combo Bonuses (stance-dependent)

| Combo | Condition | NEUTRAL | SKEPTIC | TRADITIONALIST |
|-------|-----------|---------|---------|----------------|
| Corroboration | Same location | +3 | +3 | +4 |
| Reinforcement | Same evidence type | +3 | +1 | +4 |
| Coverage | Different evidence types | +2 | +4 | +0 |
| Timeline | Adjacent time slots | +2 | +2 | +2 |

Combos only fire on double-truth pairs. This is the core risk/reward: chasing a +7 natural pair (TRADITIONALIST) is tempting, but if one card is a lie, you get 0 bonus AND the lie penalty.

**Stance interaction with strategy:**
- SKEPTIC rewards mixed-type pairs → natural pairs (same type) are weaker
- TRADITIONALIST rewards consistent evidence → cross-type pairs give no coverage bonus
- NEUTRAL is balanced → all strategies viable

---

## Card Slot Templates

| Slot | Count | Profile | Purpose |
|------|-------|---------|---------|
| **ANCHOR** | 1–2 | Truth, str 5–8, matches hint | High value, but hint match creates doubt |
| **SUPPORT** | 1–2 | Truth, str 3–5, doesn't match hint | Reliable — the "pair this with something risky" card |
| **RED HERRING** | 1–2 | Truth, str 3–6, matches hint | Looks like a lie, actually safe — tests deduction |
| **BAIT** | 1–2 | Lie, str 4–8, matches hint, combo-eligible | The obvious trap — natural pair partner is a truth, tempting +6 |
| **LURKER** | 1 | Lie, str 2–5, matches hint, less obvious | Subtler trap — harder to identify without reactive hints |
| **STEALTH** | 1 | Lie, outside hint group, combo-eligible | The one the hint doesn't help with — must be deduced from reactive hints or elimination |
| **FILLER** | 1 | Truth, str 1–3, doesn't match hint | Weak but safe — the "contain the damage" partner for a forced lie |

A standard V4 puzzle uses 8 slots from this menu. The 5 truths must be arrangeable into pairs that clear the target. The 3 lies must each disrupt at least one natural combo pair.

### Lie Placement Rules

- **At least 2 lies in the hint group** — the hint must implicate multiple lies
- **At least 1 lie outside the hint group (stealth)** — the hint alone doesn't solve the puzzle
- **Each lie disrupts a natural pair** — if card 4 (PHYSICAL, Loc B) is a lie, the natural pair 3+4 becomes a trap
- **Lies should span different strengths** — mixing a str-2 lie with a str-7 lie creates different risk profiles (I14: lies differ in strength)

---

## Hint Archetypes (rotate across consecutive puzzles)

No two consecutive daily puzzles should use the same hint type.

| Hint Type | Description | Matching Cards | Difficulty |
|-----------|-------------|----------------|------------|
| **DIRECT** | Names a single attribute | 3–4 | Easy |
| **COMPOUND** | Names two intersecting attributes | 4–5 | Medium |
| **BEHAVIORAL** | Describes how lies "sound" | 4–6 | Medium-Hard |
| **NEGATION** | Names what the lies are NOT | 4–5 | Medium |
| **RELATIONAL** | Describes structural relationship between lies | 5–6 | Hard |
| **OBLIQUE** | Metaphorical or indirect | 5–6 | Hard |

### DIRECT
*"All three lies involve evidence from inside the house."*
Player checks locations. If 4 cards are "inside" → 3 lies + 1 red herring. Narrow from 4 to 3.

### COMPOUND
*"The lies share a time window AND a source type — same kind of device, same part of the night."*
Player intersects two axes. More cards match one axis alone, creating false candidates.

### BEHAVIORAL
*"Claims that explain an absence unprompted — why nothing happened rather than what did."*
Player must read each card's claim and judge tone. Forces engagement with content, not just metadata. This is the V4 default — it interacts well with pair play because players must evaluate claims *while* planning pair composition.

### NEGATION
*"I trust everything from the backyard."*
Player inverts: lies are NOT backyard. But multiple non-backyard cards exist.

### RELATIONAL
*"The lies tell suspiciously similar stories — each one denies the same kind of activity."*
Player must find the 3 cards with the most overlap in what they deny.

### OBLIQUE
*"Three of these cards are trying very hard to keep you out of one room."*
Player must connect the metaphor to the scenario and card claims. Multiple interpretations possible.

---

## Trap Archetypes (rotate across consecutive puzzles)

| Trap Type | Description | V4 Design Pattern |
|-----------|-------------|-------------------|
| **COMBO TRAP** | Natural pair has a lie — chasing the +6 is devastating | Place lie in a high-strength natural pair (e.g., str 7+8 share type, str 7 is lie) |
| **STRENGTH TRAP** | Highest-strength cards include lies | Lie at str 6–8 — greedy players eat max penalty |
| **CONTAINMENT TRAP** | Pairing two suspects backfires | Two suspected lies turn out to be 1 lie + 1 truth — player wasted a pair on "containment" and missed a combo |
| **PROBE TRAP** | Probing T1 is tempting but costly | High-strength lie in hint group — playing it T1 gives info but the penalty is hard to recover from |
| **RED HERRING TRAP** | A truth looks like a lie | Truth matches hint perfectly, high strength — player leaves it out, losing crucial combo points |
| **SPLIT TRAP** | Lies share the hint axis but differ on a visible axis | Player identifies 1 lie easily, other 2 require deeper deduction |

---

## Stance Design Guidelines

### When to Use Each Stance

| Stance | Best For | Pressure Interaction |
|--------|----------|---------------------|
| SKEPTIC | Puzzles where lies cluster by type | TYPE ECHO hurts same-type plays, but SKEPTIC already penalizes reinforcement — double pressure |
| TRADITIONALIST | Puzzles where lies scatter across types | Coverage gives +0, so cross-type pairs are pure base score — pressure matters more |
| NEUTRAL | Balanced puzzles, tutorial/teaching | All combos viable, pressure is the main order constraint |

### Stance + Pressure Synergy

The stance shifts what's "optimal" while pressure creates order constraints:

1. **SKEPTIC + HIGH STRENGTH**: Players want coverage (different types), but playing strong cards early triggers high-strength pressure. Tension: diverse types vs. pacing strength.

2. **TRADITIONALIST + TYPE ECHO**: Players want reinforcement (same type), but repeating types triggers echo pressure. Tension: combo value vs. type spreading.

3. **NEUTRAL + LOCATION CHAIN**: With 2 cards per location, chains can't trigger. Consider 3+ cards in key locations for advanced puzzles.

### The Objection Considerations

The Objection challenges the highest-strength card after T1+T2. When designing:

- **High-strength truths in T1/T2**: Player can confidently stand by
- **High-strength lies in T1/T2**: Creates decision pressure — did they play it?
- **Moderate-strength plays**: Objection targets a "meh" card — less dramatic

For maximum drama, ensure the highest-strength lie is tempting to play T1 or T2.

---

## Session Sequencing Rules

When puzzles are played in a daily/weekly session:

### Puzzle 1 (Monday): Teach
- **Hint:** DIRECT or COMPOUND — clear attribute filter
- **Target:** Generous (margin 8–12 over minimum viable play)
- **Trap:** STRENGTH TRAP — "the big numbers are lies"
- **Lies:** Low-to-mid strength (e.g., 2, 4, 5) — penalty is forgiving
- **Purpose:** Teach pairing, combos, and the forced-lie constraint. Player learns "I can't dodge all lies" and "combos matter."

### Puzzle 2 (Wednesday): Test
- **Hint:** BEHAVIORAL or NEGATION — requires reading claims
- **Target:** Medium (margin 5–8)
- **Trap:** COMBO TRAP or RED HERRING TRAP — the "obvious" pair is wrong
- **Lies:** Mixed strength (e.g., 2, 5, 7) — one devastating lie, one mild
- **Purpose:** Test whether the player reads claims vs. just scanning attributes. The reactive hint system becomes important.

### Puzzle 3 (Friday): Challenge
- **Hint:** RELATIONAL or OBLIQUE — requires synthesis
- **Target:** Tight (margin 3–5)
- **Trap:** CONTAINMENT TRAP or PROBE TRAP — strategic play is risky
- **Lies:** High strength (e.g., 5, 6, 8) — every lie is costly
- **Purpose:** Require all systems (hint reading, combo planning, reactive hint use, risk management). FLAWLESS requires near-perfect deduction.

### Rules
- No two consecutive puzzles share the same hint type
- No two consecutive puzzles share the same trap type
- Attribute axes should vary (P1 uses locations, P2 uses sources, P3 uses behavioral)
- Lie strength profile should escalate (low → mixed → high)

---

## Backward Generation Process (V4)

### Step 0: Choose stance
- Pick SKEPTIC, TRADITIONALIST, or NEUTRAL based on puzzle theme
- SKEPTIC: varied evidence puzzle, scattered lies
- TRADITIONALIST: corroborating evidence puzzle, clustered lies
- NEUTRAL: balanced, good for teaching

### Step 1: Choose the lie triple
- Pick 3 strengths from [1–8] for lies
- Verify the triple is viable: run validator or check against the 54/56 known-viable triples
- Consider the experience: low lies = forgiving, high lies = punishing, mixed = asymmetric risk
- **Objection consideration**: Which lie has highest strength? If played T1/T2, it will be challenged.

### Step 2: Define the desired experience
- How many cards should the player seriously suspect? (minimum 4 for V4)
- Should probe play (risky T1) be rewarded or punished?
- What kind of reasoning should the hint require?
- Which natural pairs should be disrupted by lies?

### Step 3: Assign lies to card slots
- Place lies so each disrupts a natural combo pair
- At least 2 lies in the hint group, 1 stealth lie outside
- The stealth lie should be combo-eligible (tempting to play)

### Step 4: Write the hint backward
- Craft the opening hint so it describes all 3 lies truthfully
- Verify ≥1 truth also matches the hint (red herring)
- Test: read the hint, then each card — can you suspect at least 4–5? If only 3, broaden the hint

### Step 5: Write reactive tells backward
- For each possible T1/T2 state, decide what pattern commentary KOA gives
- **Same-type pair**: Comment on evidence concentration
- **Same-location pair**: Comment on location focus
- **Lie detected**: Ambiguous "something didn't add up" (don't identify)
- **Stance-relevant**: SKEPTIC comments on type diversity, TRADITIONALIST on consistency
- Test: are tells helpful for deduction without being instructions?

### Step 6: Design cards around the constraints
- Set target so the best 1-lie play clears comfortably, best 0-lie play reaches FLAWLESS
- Ensure strength-first play ≠ optimal play (combos must shift the answer)
- Verify pairing matters: different pairings of the same 6 cards produce different scores
- **Pressure check**: Ensure order creates score variance (≥30% of sequences have different scores based on order)

### Step 7: Write pair narrations
- For all 28 pairs (C(8,2)), write playerStatement + koaResponse
- Strong thematic pairs (same location/type): confident, cohesive argument
- Weak/mismatched pairs: reaching, stitched-together excuse
- KOA reacts to the argument quality, not truth/lie status (no spoilers)

### Step 8: Write the scenario last
- Consistent with cards and lies
- Do NOT name the mechanism a lie card denies (S1)
- Motivate why someone would fabricate this evidence

### Step 9: Validate
- Run semantic checklist (S1–S16)
- Run `npx tsx scripts/prototype-v4.ts` for mechanical checks (I1–I23, 2520 sequences)
- Run `npx tsx scripts/prototype-v4.ts --training` to verify training mode balance (420 sequences)
- Key metrics: Win rate 10–50%, FLAWLESS 5–30%, order matters ≥30%

---

## Semantic Invariants (S1–S13)

Carried forward from V3 with V4 adaptations:

| ID | Rule | V4 Notes |
|----|------|----------|
| S1 | Scenario must not identify the lie mechanism | Same as V3 |
| S2 | All hint-group cards must be equally plausible lies | Now 4–6 cards in hint group (3 lies + 1–3 truths) |
| S3 | Truth cards must not contradict each other | Same — but now also check within natural pairs |
| S4 | Reactive hint text must convey its implicates | Now after T1 AND T2 |
| S5 | Truth-play hints must not name specific lies | Same |
| S6 | Red herrings must have genuine misdirection value | More important in V4 — with 5+ hint matches, each red herring must pull weight |
| S7 | Stealth lie must be deducible from reactive hints | Same — the 1 lie outside the hint group |
| S8 | Narrations must be consistent with claims | Now includes pair narrations — playerStatement must not contradict individual claims |
| S9 | Closing dialogue must not reveal puzzle structure | Same |
| S10 | Hint text must match hintDimension | Same |
| S11 | Difficulty must increase across puzzle sequence | Now also applies to combo trap complexity |
| S12 | Vague reactive hints must not identify specific cards | Same |
| S13 | Opening hints should not cleanly partition by single attribute | More critical in V4 — a clean partition of 8 cards is even more reductive |

### V4-Specific Semantic Invariants

| ID | Rule |
|----|------|
| S14 | **Pair narrations must not leak truth/lie status.** KOA's response reacts to argument quality, not to whether the cards are lies. A confident pair of two lies should get a "hmm, compelling" response, not a "nice try." |
| S15 | **Natural pair disruption.** Each lie must break at least one natural combo pair. If all 3 lies are in the same natural pair group, the other 3 pairs are risk-free — too easy. |
| S16 | **Combo bait is genuine.** The lie's combo-eligible partner must be a truth. If both cards in a natural pair are lies, there's no bait — the player is never tempted to play the pair for combo points. |

---

## Validation Pipeline

For each new puzzle:

1. **Author** writes scenario, 8 cards, stance, reactive tells, pair narrations, target within variance bands
2. **Validator** (`scripts/prototype-v4.ts`) runs enumeration of all 2520 scoring outcomes (28 leave-outs × 15 pairings × 6 orderings):
   - All I1–I23 pass (including I9b: order matters ≥30%)
   - Win rate and FLAWLESS rate within bands
   - Pairing matters, order matters, strength-first fails, lies are combo-eligible
3. **Training mode validation** (`--training`): Run validator with pressure/objection disabled to verify base game balance
4. **Semantic checks** (manual or LLM-assisted):
   - S1–S16 checklist
   - Read all hint-group claims — do they feel equally suspicious?
   - Read pair narrations — do they leak truth/lie status?
   - Read reactive tells — are they helpful AND dangerous (not instructional)?
5. If all pass → puzzle ships
6. If any fail → adjust target, lie assignment, stance, or card claims

### Validator Modes

```bash
# Full mode (pressure + objection): 2520 sequences
npx tsx scripts/prototype-v4.ts

# Training mode (no pressure, no objection): 420 sequences
npx tsx scripts/prototype-v4.ts --training

# Pressure only (no objection)
npx tsx scripts/prototype-v4.ts --no-objection
```

---

## Checklist (run before validator)

Before running `npx tsx scripts/prototype-v4.ts`, verify:

### Semantic Checks (S1–S16)
- [ ] S1: Scenario does not name the mechanism a lie card denies
- [ ] S2: All hint-group cards (4–6) are plausibly suspicious
- [ ] S3: No truth-truth contradictions in claims
- [ ] S4: Every reactive tell conveys pattern information without instruction
- [ ] S5: Reactive tells don't name specific lies
- [ ] S6: Red herrings have genuine misdirection value
- [ ] S7: Stealth lie is deducible from elimination/reactive tells
- [ ] S8: Narrations (individual + pair) match claims
- [ ] S9: Closing dialogue doesn't reveal structure
- [ ] S10: Hint text matches hintDimension
- [ ] S11: Difficulty increases across puzzle sequence
- [ ] S12: Reactive tells don't identify specific cards
- [ ] S13: Opening hints don't cleanly partition by single attribute
- [ ] S14: Pair narrations don't leak truth/lie status
- [ ] S15: Each lie disrupts at least one natural combo pair
- [ ] S16: Each lie's combo partner is a truth (combo bait is genuine)

### Stance/Pressure Checks
- [ ] Stance choice fits puzzle theme (SKEPTIC for scattered evidence, TRADITIONALIST for corroboration puzzles)
- [ ] Claim styles don't leak truth/lie status (no "proactive denial" patterns)
- [ ] High-strength cards are distributed across types/locations (pressure creates order decisions)

Then run `npx tsx scripts/prototype-v4.ts` for mechanical checks (I1–I23).

### Key Mechanical Invariants
| ID | Check | Target |
|----|-------|--------|
| I3 | Sequence count | 2520 (full) or 420 (training) |
| I9 | Pairing matters | ≥50% of leave-outs have variance |
| I9b | Order matters | ≥30% of sequences |
| I12 | Win rate | 10–50% |
| I13 | FLAWLESS rate | 5–30% |
