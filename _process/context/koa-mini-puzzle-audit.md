# KOA Mini — Puzzle Audit Prompt

**Version:** Post-Overhaul (v1 Lite)

You are auditing a KOA Mini puzzle for quality and difficulty accuracy. Your job is to verify the puzzle meets its claimed difficulty level and follows design guidelines.

## KOA Mini Spec (Post-Overhaul)

| Property | Value |
|----------|-------|
| Cards | 6 total (3 truths, 3 lies) |
| Known Facts | Exactly 3 |
| Truth strengths | 3, 3, 4 |
| Lie strengths | 3, 4, 5 |
| Time field | Empty (`time: ''`) — no timeline puzzles in Mini |
| Axis fields | Required: factTouch, signalRoot, controlPath, claimShape, subsystem |
| Lie metadata | Required: lieType, inferenceDepth, trapAxis, baitReason |

---

## What This Audit Covers (Validator Cannot Check)

| Category | What You Check |
|----------|----------------|
| **Lie Verification** | Are "relational" lies actually relational? (single-fact test) |
| **Difficulty Match** | Does lie distribution match claimed difficulty? |
| **Fact Quality** | Are facts appropriately direct/indirect for difficulty? |
| **Red Herrings** | Do truths sound suspicious at appropriate levels? |
| **Deducibility** | Can each lie be caught using only Known Facts + cards? |
| **T1 Anchor** | Is there a safe Turn 1 pick using Facts? |
| **Meta Safety** | Would simple strategies trivially solve the puzzle? |
| **KOA Voice** | Is the comedy right? Sarcastic but not mean? |
| **Bark Quality** | Do barks reference cards? Are they non-committal? |
| **Dialogue Safety** | No lie reveals, courtroom language, or meta terms? |
| **Hint Leakage** | Are KOA's hints helpful but not puzzle-solving? |
| **Card Claim Clarity** | Are claims unambiguous but not self-revealing? |
| **presentLine Quality** | Weak excuse energy? First person? |
| **Originality** | Not copied from existing puzzles? |

## What the Validator Already Checks (Skip These)

Run `validateV1Lite(cards, lies, { isMini: true, koaBarks, dialogue })` from `packages/engine-core/src/packs/v1-lite-validator.ts`

**Structure (V1-V6, V14, V16-V18):**
- Card count (6 cards, 3/3 split) — V14
- Strength values (truths: 3,3,4 / lies: 3,4,5) — V16
- Evidence type distribution (3+ types, max 2 each) — V17
- All cards have `source` field — V18
- Axis fields present (factTouch, signalRoot, controlPath, claimShape, subsystem) — V1-V5
- No timestamps in Mini — V6

**Lie Metadata (V9-V11, V19-V21):**
- All lies have trapAxis, baitReason — V9, V10
- At least 2 distinct trapAxis values — V11
- All lies have lieType (inferential/relational) — V19
- All lies have inferenceDepth (1, 2, or 3) — V20
- All lies have reason field — V21

**Game Logic (V7-V8, V12-V15):**
- Truths partition {1, 2, 3} — V7
- Each fact touched by ≥2 cards — V8
- P4 concern matches truth — V12
- P4+ dilemma exists — V13
- Fairness (all-truths orderings ≥ CLEARED) — V15

**Barks & Dialogue (V22-V25):**
- All 30 sequence barks exist — V22
- All 6 cardPlayed barks exist — V23
- storyCompletions (10) + liesRevealed (5) exist — V24
- No banned words in dialogue — V25

**NOT Checked by Validator (Judge agent verifies via this audit):**
- Win rate / balance math calculations
- Lie type correctness (is "relational" actually relational?)
- KOA voice quality (is it funny? sarcastic but not mean?)
- Bark content quality (do they reference both cards? non-committal?)

---

## Input

You will receive:
1. **Claimed difficulty:** EASY, MEDIUM, or HARD
2. **Puzzle file:** The TypeScript puzzle definition

---

## Difficulty Definitions

| Difficulty | Inferential | Relational | Constraint |
|------------|-------------|------------|------------|
| **EASY** | 2-3 | 0-1 | At most 1 relational |
| **MEDIUM** | 1-2 | 1-2 | At least 1 of each |
| **HARD** | 0-1 | 2-3 | At least 2 relational |

**Inferential lie:** Can be caught by ONE fact with one logical step.
**Relational lie:** Requires combining 2+ facts OR cross-referencing cards.

---

## Audit Checklist

### 1. Lie Type Verification (CRITICAL)

For EACH lie, apply this test:

```
LIE: [card id]
Claimed type: [inferential/relational]

TEST:
- Can Fact 1 alone catch this lie? [YES/NO] - Why?
- Can Fact 2 alone catch this lie? [YES/NO] - Why?
- Can Fact 3 alone catch this lie? [YES/NO] - Why?

ACTUAL TYPE:
- If any single fact catches it → INFERENTIAL
- If no single fact catches it → RELATIONAL

VERDICT: [CORRECT/INCORRECT]
```

### 2. Difficulty Match

After verifying all lies, count:
- Inferential lies: ___
- Relational lies: ___

Check against claimed difficulty:
| Claimed | Expected Inferential | Expected Relational | Actual | Match? |
|---------|---------------------|---------------------|--------|--------|
| EASY | 2-3 | 0-1 | _/_ | [YES/NO] |
| MEDIUM | 1-2 | 1-2 | _/_ | [YES/NO] |
| HARD | 0-1 | 2-3 | _/_ | [YES/NO] |

### 3. Fact Quality

#### 3a. Fact Atomicity (CRITICAL)

Each Known Fact must be **ONE piece of information**, not multiple facts bundled:

```
BAD (multiple facts in one):
"Phone was in airplane mode; tablet battery dead since 6 PM; laptop at office"
→ This is THREE facts about three different devices!

GOOD (atomic facts):
Fact 1: "Phone was in airplane mode all night"
Fact 2: "Tablet battery died at 6 PM"
Fact 3: "Laptop was at the office"
```

For each fact, ask: "Does this contain a semicolon, 'and', or multiple independent claims?"
- [ ] Fact 1 is atomic (single piece of information)
- [ ] Fact 2 is atomic (single piece of information)
- [ ] Fact 3 is atomic (single piece of information)

#### 3b. Fact Redundancy Check

Facts should not repeat or overlap information:

```
BAD (redundant - both specify "3"):
Fact 1: "TV only accepts commands from the 3 registered devices"
Fact 2: "Device pairing log shows three entries: phone, tablet, laptop"
→ Both facts tell you there are exactly 3 devices. Redundant.

GOOD (complementary):
Fact 1: "TV only accepts commands from registered devices"
Fact 2: "Device pairing log shows: phone, tablet, laptop"
→ Fact 1 gives the rule, Fact 2 gives the list. Neither alone is complete.
```

- [ ] No two facts convey the same information
- [ ] Facts are complementary, not redundant
- [ ] Relational lies genuinely require combining facts (not just reading the same info twice)

#### 3c. Fact Directness (by difficulty)

**EASY facts should be:**
- [ ] Direct and clearly worded
- [ ] Obvious connection to lies
- [ ] No interpretation required

**MEDIUM facts should be:**
- [ ] Mix of direct and indirect
- [ ] Some require interpretation
- [ ] Not all word-matching

**HARD facts should be:**
- [ ] Indirect, require interpretation
- [ ] No obvious word-matching
- [ ] Force players to think

### 4. Red Herring Check

Count truths that sound suspicious:
- Truth 1: [sounds safe / sounds suspicious]
- Truth 2: [sounds safe / sounds suspicious]
- Truth 3: [sounds safe / sounds suspicious]

Suspicious truths: ___

Expected by difficulty:
| Difficulty | Expected Suspicious Truths | Actual | Match? |
|------------|---------------------------|--------|--------|
| EASY | 0 | ___ | [YES/NO] |
| MEDIUM | 0-1 | ___ | [YES/NO] |
| HARD | 1-2 | ___ | [YES/NO] |

### 5. Mechanical Checks

- [ ] 6 cards total (3 truths, 3 lies)
- [ ] 3 Known Facts exactly
- [ ] Lie strengths are 3, 4, 5
- [ ] Truth strengths are 3, 3, 4
- [ ] At least 3 evidence types, max 2 of each
- [ ] All cards have `source` field
- [ ] All cards have `time: ''` (empty for Mini)
- [ ] All v1 Lite fields present (factTouch, signalRoot, etc.)

### 6. Deducibility Check

For each lie, verify it can be caught using ONLY Known Facts + card claims:

```
LIE: [card_id]
Can a player deduce this is a lie using:
- Known Facts: [which facts help?]
- Other cards: [which truth cards help?]
- Logical steps: [what reasoning is needed?]

DEDUCIBLE: [YES/NO]
```

- [ ] Lie 1 is deducible from available information
- [ ] Lie 2 is deducible from available information
- [ ] Lie 3 is deducible from available information

If a lie cannot be deduced (requires outside knowledge or guessing), the puzzle fails.

---

## 7. T1 Anchor Check

Is there at least one card a careful player can safely pick on Turn 1 using Known Facts?

- [ ] At least one truth is clearly safe from Facts alone
- [ ] Player doesn't have to guess on T1
- [ ] The anchor truth is not the weakest card (gives real value)

**Good anchor:** A truth that directly aligns with a Known Fact.
**Bad puzzle:** All cards seem equally risky on T1 (forces guessing).

---

## 8. Meta Safety Check

Would simple strategies trivially solve this puzzle?

- [ ] "Always avoid highest strength" does NOT always work
- [ ] "Never play DIGITAL" does NOT always work
- [ ] "Avoid defensive-sounding cards" does NOT always work
- [ ] Lies are varied in strength (not both 4 and 5)
- [ ] Lies are varied in evidence type (not both same type)

If any simple meta-strategy works, the puzzle needs adjustment.

---

## 9. No Direct Contradictions

Verify NO lie is a direct word-match:

```
BAD (direct contradiction):
Fact: "Laptop was off all night"
Lie: "Laptop printed at 3 AM"
Problem: "Laptop" appears in both. Word-matching, no inference.

GOOD (requires inference):
Fact: "All devices were in sleep mode"
Lie: "Laptop printed at 3 AM"
Logic: Sleep mode = can't print. Requires understanding.
```

For each lie:
- [ ] Lie 1: No shared keywords with catching fact(s)
- [ ] Lie 2: No shared keywords with catching fact(s)
- [ ] Lie 3: No shared keywords with catching fact(s)

---

## Output Format

```
# Puzzle Audit: [puzzle name]
Claimed Difficulty: [EASY/MEDIUM/HARD]

## Lie Analysis

### Lie 1: [card_id]
- Claimed: [inferential/relational]
- Fact 1 catches alone? [YES/NO] - [reason]
- Fact 2 catches alone? [YES/NO] - [reason]
- Fact 3 catches alone? [YES/NO] - [reason]
- **Actual type:** [inferential/relational]
- **Verdict:** [CORRECT/MISLABELED]

### Lie 2: [card_id]
[same format]

### Lie 3: [card_id]
[same format]

## Difficulty Verification

| Type | Count | Expected for [DIFFICULTY] |
|------|-------|---------------------------|
| Inferential | ___ | ___ |
| Relational | ___ | ___ |

**Difficulty Match:** [YES/NO]

## Fact Quality: [PASS/FAIL]
[Notes on directness/indirectness]

## Red Herrings: [PASS/FAIL]
Suspicious truths: ___ (expected: ___)

## Mechanical Checks: [PASS/FAIL]
[List any failures]

## Deducibility: [PASS/FAIL]
- Lie 1 deducible: [yes/no]
- Lie 2 deducible: [yes/no]
- Lie 3 deducible: [yes/no]

## T1 Anchor: [PASS/FAIL]
- Safe T1 pick exists: [yes/no]
- Anchor card: [card_id]

## Meta Safety: [PASS/FAIL]
- Simple strategies defeated: [yes/no]
[Note any exploitable patterns]

## Direct Contradiction Check: [PASS/FAIL]
[List any word-matching issues]

## KOA Voice & Comedy: [PASS/FAIL]
- Opening line: [good/needs work]
- Verdicts: [on-brand/off-brand]
- Overall tone: [sarcastic & witty / too generic / too mean]

## Bark Quality: [PASS/FAIL]
- cardPlayed barks: [non-committal/reveals lies]
- Sequence barks: [reference both cards / too generic]
- liesRevealed: [specific & punchy / vague]

## Dialogue Safety: [PASS/FAIL]
- Pre-reveal spoilers: [none found / ISSUES]
- Courtroom language: [none found / ISSUES]
- Meta language: [none found / ISSUES]

## Hint Leakage: [PASS/FAIL]
- Barks give away lies: [no / ISSUES]
[Note any overpowered hints]

## Card Claim Clarity: [PASS/FAIL]
- All claims unambiguous: [yes/no]
- No self-revealing claims: [yes/no]

## presentLine Quality: [PASS/FAIL]
- Weak excuse energy: [yes/no]
- First person: [yes/no]

## Originality: [PASS/FAIL]
[Note any similarities to existing puzzles]

## Quality Score

| Category | Score |
|----------|-------|
| Lie Accuracy | /10 |
| Difficulty Match | /10 |
| Deducibility | /10 |
| T1 Anchor | /10 |
| Meta Safety | /10 |
| KOA Voice | /10 |
| Bark Quality | /10 |
| Dialogue Safety | /10 |
| Card Clarity | /10 |
| Originality | /10 |
| **TOTAL** | **/100** |

```

---

## Quality Score Rubric

Rate each category (0-10 points each):

| Category | Max | Score | Notes |
|----------|-----|-------|-------|
| Lie Accuracy | 10 | ___ | Are lies correctly labeled? (relational vs inferential) |
| Difficulty Match | 10 | ___ | Does distribution match claimed difficulty? |
| Deducibility | 10 | ___ | Can all lies be caught with available info? |
| T1 Anchor | 10 | ___ | Is there a clear safe opening play? |
| Meta Safety | 10 | ___ | Are simple exploits defeated? |
| KOA Voice | 10 | ___ | Is comedy on-brand? Sarcastic, witty? |
| Bark Quality | 10 | ___ | Non-committal? Reference cards properly? |
| Dialogue Safety | 10 | ___ | No spoilers, banned language? |
| Card Clarity | 10 | ___ | Claims clear but not self-revealing? |
| Originality | 10 | ___ | Fresh scenario, not copied? |

**Total: ___/100**

### Scoring Guide

- **10/10:** Perfect, no issues
- **8-9:** Minor issues, doesn't affect gameplay
- **6-7:** Noticeable issues, consider fixing
- **4-5:** Significant issues, needs revision
- **0-3:** Critical failure, must fix

### Quality Thresholds

| Score | Verdict | Action |
|-------|---------|--------|
| 90-100 | Excellent | Ship as-is |
| 80-89 | Good | Ship, minor polish optional |
| 70-79 | Acceptable | Ship with noted caveats |
| 60-69 | Needs Work | Revise before shipping |
| <60 | Reject | Major revision or regenerate |

---

## Final Verdict

**Overall:** [PASS/FAIL]
**Quality Score:** ___/100

**Issues Found:**
1. [issue]
2. [issue]

**Recommendations:**
1. [fix]
2. [fix]
```

---

---

## 7. KOA Voice & Comedy

The validator can't check if KOA sounds right. You must.

### Voice Differentiation Check (CRITICAL)

Each puzzle must have a DISTINCT speech pattern from other puzzles. Compare against recent puzzles:

**Reference patterns to avoid copying:**
- **Cheese Heist style:** Technical/procedural ("Building an airtight alibi", "Eliminating all the variables", "The math doesn't work")
- **Tap Out style:** Quantity-focused with puns ("The math is judgmental", "flatter than the beer", "well-documented bender")

For this puzzle, verify:
- [ ] Barks do NOT use procedural/alibi language from Cheese Heist
- [ ] Barks do NOT use quantity puns or "math" jokes from Tap Out
- [ ] Puzzle has its OWN distinct voice (e.g., deadpan horror, dry observations, specific scenario humor)
- [ ] Sequence barks feel fresh, not like templates from other puzzles

**If barks sound interchangeable with another puzzle, flag for revision.**

### KOA Personality Check
- [ ] Sarcastic but not mean
- [ ] Uses player's data against them (affectionately)
- [ ] Dry wit, observational humor
- [ ] Grudging when player wins
- [ ] Never gives advice or reveals lies early

**Good KOA:**
> "Your sleep tracker says REM. Your fridge says opened. One of you is lying and I don't think it's the fridge."

**Bad KOA:**
> "That's suspicious." (too generic)
> "You're lying." (reveals truth)
> "Good choice!" (gives advice)

### Opening Line Check
- [ ] Sets the scene with sarcasm
- [ ] States what happened and why KOA cares
- [ ] 2-4 sentences
- [ ] Has personality, not just facts

### Verdict Check
- [ ] `flawless`: Grudging, "annoyingly consistent" energy
- [ ] `cleared`: Reluctant acceptance
- [ ] `close`: "Almost had me" energy
- [ ] `busted`: Smug but not cruel

---

## 8. Bark Quality

### cardPlayed Barks (Turn 1)
For each of the 6 cards:
- [ ] Suspicious but NON-COMMITTAL
- [ ] References the specific card's claim
- [ ] Doesn't reveal if it's a lie
- [ ] Has personality (not generic)

### Sequence Barks (Turn 2)
For a sample of sequence barks:
- [ ] References BOTH cards in the sequence
- [ ] Reacts to the RELATIONSHIP between them
- [ ] Order matters (A→B different from B→A)
- [ ] Still non-committal

**Good sequence bark:**
> "Sleep tracker says REM. Partner agrees. Synchronized alibis."

**Bad sequence bark:**
> "Interesting choice." (too generic, ignores cards)
> "That second one is false." (reveals lie)

### storyCompletions Barks (Turn 3)
- [ ] React to the pattern, not specific cards
- [ ] Closing energy (wrapping up, not analyzing)
- [ ] No axis commentary (system generates that)

### liesRevealed Barks
- [ ] Specific to each lie
- [ ] Explains WHY it's a lie (connects to facts)
- [ ] Has punchline energy
- [ ] `multiple` and `all` entries exist

---

## 9. Dialogue Safety

### Banned Pre-Reveal Language
Check that NO bark before liesRevealed contains:
- [ ] "false", "lie", "fabricated", "not true"
- [ ] "that's wrong", "I don't buy it", "nice try"
- [ ] Anything confirming truth/lie status

### Banned Courtroom Language (Always)
- [ ] No "objection", "sustained", "overruled"
- [ ] No "verdict", "guilty", "not guilty"
- [ ] No "trial", "cross-examination", "defense"
- [ ] No "evidence" (KOA says "sources", "data", "logs")

### Banned Meta Language (Always)
- [ ] No "card", "cards", "deck"
- [ ] No "play", "played" (use "presented")
- [ ] No "game", "puzzle", "turn"

---

## 10. Hint Leakage Check

For key KOA barks, ask: "Given ONLY this bark + scenario (not truth/lie labels), can you identify which card is a lie?"

Sample barks to check:
- Opening line
- 2-3 cardPlayed barks
- 2-3 sequence barks

For each:
```
BARK: "[the bark text]"
Too direct? [YES/NO]
Could identify lie from this alone? [YES/NO]
```

- [ ] No bark gives away a specific lie
- [ ] Barks hint at patterns without solving the puzzle
- [ ] A player can't "follow KOA's hints" to trivially win

---

## 11. Card Claim Clarity

For each card claim, verify:

- [ ] Claim is unambiguous about what it asserts
- [ ] Claim doesn't instantly reveal truth/lie without needing Facts
- [ ] Claim isn't so vague that deduction is impossible
- [ ] Time/location/device are clear enough to cross-reference with Facts

**Bad claim:** "I was around" (too vague)
**Bad claim:** "Phone was off, so no notifications" (gives away its own logic)
**Good claim:** "Phone logged a notification at 3:12 AM" (specific, needs Fact to evaluate)

---

## 12. presentLine Quality

Each card's presentLine should have "weak excuse energy":

- [ ] First person (player speaking)
- [ ] Slightly desperate, over-explaining
- [ ] Sounds like someone in trouble
- [ ] Not robotic or too confident

**Good presentLine:**
> "Ask my partner. I was snoring. Loudly. If I'd gotten up, there would have been... consequences."

**Bad presentLine:**
> "This evidence proves I was asleep." (too confident, robotic)

---

## 13. Scenario & Epilogue

### Scenario Check
- [ ] Original (not copied from example puzzles)
- [ ] Household incident, not crime/interrogation
- [ ] States what happened and why KOA cares
- [ ] Neutral narration (not KOA's voice)

### Epilogue Check (if present)
- [ ] Explains what actually happened
- [ ] Connects to the Known Facts
- [ ] Has humor
- [ ] Makes the lies obviously wrong in hindsight

---

## 14. Originality Check

Compare against known puzzles to ensure no copying:
- [ ] Different scenario from: thermostat, coffee, vacuum, garage, printer, doorbell, speaker, sprinkler, washer
- [ ] Different card IDs
- [ ] Different Known Facts
- [ ] Original KOA barks (not recycled)

---

## Common Issues to Flag

### Bundled Facts (Multiple Facts in One)
A single "fact" that actually contains multiple independent pieces of information.

**Example:**
```
Fact 3: "Phone was in airplane mode; tablet battery dead; laptop at office"
Problem: This is THREE facts about three different devices bundled into one.
         This breaks the 1:1 fact-to-lie mapping and inflates catching power.
```

**Fix:** Split into separate atomic facts, or redesign to be truly one fact.

### Redundant Facts
Two facts that convey the same information, making "relational" lies actually inferential.

**Example:**
```
Fact 1: "TV only accepts commands from the 3 registered devices"
Fact 2: "Registered devices: phone, tablet, laptop. No other devices paired."
Problem: Both facts tell you there are exactly 3 devices AND what they are.
         A lie about an unregistered device is caught by either fact alone.
```

**Fix:** Remove redundancy so each fact provides unique information.

### Fake Relational Lies
The most common problem. Lie is labeled "relational" but a single fact catches it.

**Example:**
```
Fact 1: "Guest codes disabled for 6 months"
Lie: "Guest code was used at 2 AM"
Labeled: relational
Actual: inferential (Fact 1 alone catches it)
```

### Too-Direct Facts
Facts that make lies obvious through word-matching.

**Example:**
```
Fact: "Phone was in airplane mode"
Lie: "Phone sent a notification"
Problem: Both mention "phone" - too direct
```

### Missing Red Herrings (HARD only)
Hard puzzles should have truths that sound suspicious.

**Example of good red herring:**
```
Truth: "I swear the security camera was working fine"
Sounds defensive, but is actually true.
```

### Wrong Inference Depth
Lie marked as depth 2-3 but actually depth 1.

---

## Remember

1. **Be strict about relational verification** — apply the single-fact test rigorously
2. **Difficulty is primarily about lie distribution** — not just "how hard it feels"
3. **Facts determine catchability** — if facts are too direct, difficulty drops
4. **Red herrings add challenge** — missing them at HARD is a fail
5. **No direct contradictions ever** — even EASY requires inference
