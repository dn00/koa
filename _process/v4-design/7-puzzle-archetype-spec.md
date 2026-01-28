# Puzzle Archetype Spec — V4 Pair Play

Defines the rules for authoring new V4 puzzles. Any puzzle matching this spec can be validated by the brute-force checker (`scripts/prototype-v4.ts`). Agent playtests are only needed when the spec itself changes.

**Depends on:** 9-pair-play-design.md, puzzle-gen-invariants.md (V4)

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
| Reactive hints | After Turn 1 and Turn 2 | No hint after Turn 3 (final pair, no more decisions) |
| Strengths | 1–8, all unique | Canonical deck — every card has a distinct value |
| Evidence types | 4 types, 2 cards each | DIGITAL, PHYSICAL, TESTIMONY, SENSOR |
| Locations | 4 locations, 2 cards each | Tied to scenario |
| Times | 8 sequential slots | One per card |

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

### 7. Decisive Reactive Hints
Hints after T1 and T2 must provide information that narrows lie candidates. Without this, the hint system is decorative.
- **Hint-group pair play (risky T1):** Specific hint — narrows toward remaining lies
- **Non-hint pair play (safe T1):** Vague hint — atmosphere only, rewards risk-taking with less info
- **Lie-in-pair play:** Explicit direction — "that evidence contradicts X"

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

### Combo Bonuses

| Combo | Condition | Bonus | Requires |
|-------|-----------|-------|----------|
| Corroboration | Same location | +3 | Both truth |
| Reinforcement | Same evidence type | +3 | Both truth |
| Coverage | Different evidence types | +2 | Both truth |
| Timeline | Adjacent time slots | +2 | Both truth |

Combos only fire on double-truth pairs. This is the core risk/reward: chasing +6 on a natural pair is tempting, but if one card is a lie, you get 0 bonus AND the lie penalty.

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

### Step 1: Choose the lie triple
- Pick 3 strengths from [1–8] for lies
- Verify the triple is viable: run validator or check against the 54/56 known-viable triples
- Consider the experience: low lies = forgiving, high lies = punishing, mixed = asymmetric risk

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

### Step 5: Write reactive hints backward
- For each possible T1 pair, decide what information the player should get
- **Hint-group pair (risky T1):** Specific hint narrowing toward remaining lies
- **Non-hint pair (safe T1):** Vague hint — atmosphere only
- **Lie-in-pair (triggered T1):** Explicit direction toward lie cluster
- Test: does the specific hint create a path to the stealth lie without naming it?

### Step 6: Design cards around the constraints
- Set target so the best 1-lie play clears comfortably, best 0-lie play reaches FLAWLESS
- Ensure strength-first play ≠ optimal play (combos must shift the answer)
- Verify pairing matters: different pairings of the same 6 cards produce different scores

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
- Run semantic checklist (S1–S13)
- Run `npx tsx scripts/prototype-v4.ts` for mechanical checks (I1–I22)

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

1. **Author** writes scenario, 8 cards, hint, reactive hints, pair narrations, target within variance bands
2. **Validator** (`scripts/prototype-v4.ts`) runs enumeration of all 420 scoring outcomes:
   - All I1–I22 pass
   - Win rate and FLAWLESS rate within bands
   - Pairing matters, strength-first fails, lies are combo-eligible
3. **Semantic checks** (manual or LLM-assisted):
   - S1–S16 checklist
   - Read all hint-group claims — do they feel equally suspicious?
   - Read pair narrations — do they leak truth/lie status?
   - Read reactive hints — do they create logical deduction paths?
4. If all pass → puzzle ships
5. If any fail → adjust target, lie assignment, hint, or card claims

---

## Checklist (run before validator)

Before running `npx tsx scripts/prototype-v4.ts`, verify:

- [ ] S1: Scenario does not name the mechanism a lie card denies
- [ ] S2: All hint-group cards (4–6) are plausibly suspicious
- [ ] S3: No truth-truth contradictions in claims
- [ ] S4: Every reactive hint text conveys its implicates
- [ ] S5: Truth-play reactive hints don't name specific lies
- [ ] S6: Red herrings have genuine misdirection value
- [ ] S7: Stealth lie is reachable via reactive hint reasoning
- [ ] S8: Narrations (individual + pair) match claims
- [ ] S9: Closing dialogue doesn't reveal structure
- [ ] S10: Hint text matches hintDimension
- [ ] S11: Difficulty increases across puzzle sequence
- [ ] S12: Vague reactive hints don't identify specific cards
- [ ] S13: Opening hints don't cleanly partition by single attribute (medium/hard)
- [ ] S14: Pair narrations don't leak truth/lie status
- [ ] S15: Each lie disrupts at least one natural combo pair
- [ ] S16: Each lie's combo partner is a truth (combo bait is genuine)

Then run `npx tsx scripts/prototype-v4.ts` for mechanical checks (I1–I22).
