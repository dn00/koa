# Puzzle Generation Invariants

Machine-checked invariants are in `scripts/prototype-v3.ts` (I1-I25, C1-C8). This document covers **semantic invariants** that the validator cannot enforce — rules the puzzle author (human or LLM) must follow and verify manually.

---

## S1: Scenario must not identify the lie mechanism

The scenario describes what happened (the "crime") but must NOT name the exact device, record, or mechanism that a lie card denies.

**Bad:** "The hot tub ran all night — jets on full." (spa_pump saying "jets OFF" is trivially identifiable)
**Good:** "The back deck is flooded — two inches of standing water, hot tub cover off." (hot tub implied but mechanism ambiguous)

The scenario should make clear WHAT happened (flooding, power outage, thermostat change) without telling the player exactly WHICH card would need to lie about it.

## S2: All hint-group cards must be equally plausible lies

Every card in the hint group (cards matching the hintDimension) should feel like it COULD be the lie based on the hint description alone. If only one card "obviously" matches the hint's characterization, the puzzle is trivially solvable.

**Test:** Read the hint, then read each hint-group card's claim. Could a naive player reasonably suspect any of them? If one stands out as the obvious answer, rewrite the others to be equally suspicious, or rewrite the hint to be less specific.

**Bad:** Hint says "protests too much." Only spa_pump denies the exact crime. smart_lock and motion_hall deny unrelated things.
**Good:** Hint says "protests too much." All three hint-group cards strongly deny something directly related to the incident.

## S3: Card claims must not contradict each other (unless both are lies)

Two truth cards should never make contradictory claims. If doorbell says "nobody entered" and motion_hall says "someone walked through," one of them must be a lie. Truth-truth contradictions break immersion and confuse deduction.

Lie-truth contradictions are fine and expected — that's the puzzle.

## S4: Reactive hint text must actually convey its implicates

The `implicates` field declares which cards a reactive hint points toward, but the TEXT must actually guide a reader to those cards. A hint that says "hmm, interesting" while implicating `water_meter` fails this invariant.

**Test:** Read the reactive hint text without seeing the implicates field. Can you identify at least one of the implicated cards from the text? If not, the hint text is too vague.

**Good:** "The water in this house tells a story the meter doesn't want you to hear." (clearly points to water_meter)
**Bad:** "Something isn't right." (points to nothing)

## S5: Reactive hints for truth plays must not name the stealth lie directly

Truth-play reactive hints should POINT TOWARD the stealth lie area (location, device type, category) without naming the specific card. The player should have to do the final step of deduction.

**Good:** "Something you were wearing tells a different story." (points to personal devices — could be smartwatch or fitbit)
**Bad:** "Your smartwatch data is fabricated." (names the card directly — no deduction needed)

Exception: Lie-play reactive hints CAN be more direct since the player already paid the penalty of playing a lie.

## S6: Red herrings must have genuine misdirection value

Each truth in the hint group is a red herring. Its claim should give a player a plausible reason to suspect it's a lie. If a red herring is obviously innocent, it doesn't create deduction — it just reduces the hint group to a smaller set.

**Test:** Could a player read this card's claim and think "that sounds suspicious"? If not, rewrite the claim to add ambiguity.

## S7: Stealth lie must be deducible from reactive hints

The stealth lie (outside the hint group) is "you're on your own" from the opening hint. But after T1, the reactive hint must provide enough signal to identify or narrow it. If no reactive hint path leads to the stealth lie, the player is purely guessing.

**Test:** For each truth-play reactive hint, verify the text creates a logical path to the stealth lie. The player should be able to think: "the hint said X, this card is at location Y, so the stealth lie must be in category Z."

## S8: Narrations must be consistent with claims

Each card's `narration` field is the player character's spoken version of the `claim`. The narration can add personality and context, but must not contradict the claim or add information that isn't in the claim.

**Bad:** Claim says "Fitbit logged REM sleep." Narration says "I was definitely in the basement at 3 AM." (contradicts the alibi)

## S9: Closing dialogue must not reveal puzzle structure

Dialogue lines (flawless, cleared, close, busted) should reference the scenario thematically but must not:
- Name specific card IDs (checked by I20)
- Reveal which cards were lies
- Describe the hint group structure
- Give away the stealth lie's identity

## S10: Hint text must be consistent with the hintDimension

The opening hint text is what the player reads. The `hintDimension` is the machine-checkable version. These must be consistent — the hint text must truthfully describe the hint-group cards.

For **easy puzzles**, the hint text and matchFn should agree exactly (direct attribute hint).

For **medium/hard puzzles**, the hint text may be deliberately broader than the matchFn (per S13). The hint-group cards must match the description, but non-hint cards may also plausibly match. This ambiguity is the puzzle. When the hint text is broader than the matchFn, document it in the puzzle's `hintDimension.test` field.

**Test:** Read the hint text, then each hint-group card — does every hint-group card match the description? (Must be yes.) Then check non-hint cards — do some also plausibly match? (Fine for medium/hard; bad for easy.)

## S11: Difficulty must increase across puzzle sequence

Later puzzles should be harder for a thinking player. Difficulty sources:
- **Hint type:** Direct attribute (easy) → compound attribute (medium) → qualitative/narrative (hard)
- **Target ratio:** target / max-truth-score should increase
- **Red herring quality:** More plausible red herrings = harder

The validator checks random and informed win rates (C1, C8) but cannot assess qualitative difficulty. The puzzle author must verify the hint for puzzle N+1 is genuinely harder to use than puzzle N.

## S12: Vague reactive hints must not identify specific cards

Vague hints (quality: 'vague') are given when the player makes a safe T1 play (card NOT in hint group). These hints should reference the scenario, mood, or KOA's general suspicion without pointing to a specific device, location, or card.

**Good:** "Bedroom checks out. But this house has more rooms than you'd like."
**Bad:** "Bedroom checks out. But the router log in the basement doesn't add up." (names a specific device)

The purpose of vague hints is to reward risky probe plays with better information. If vague hints identify cards, safe-play dominance returns.

## S13: Opening hints should not cleanly partition the card pool by a single attribute (medium/hard)

For medium and hard puzzles, the opening hint should describe lie *behavior* rather than lie *attributes*. If the hint names a single attribute (location, source, time) that cleanly splits the 6 cards into two groups, the player can eliminate half the pool for free.

**Bad (for medium/hard):** "One lie is from a sensor in the living room." (partition by location+source)
**Good:** "One lie is trying too hard to explain why nothing happened." (behavioral — requires reading each card's claim)

Exception: Easy puzzles (P1) may use attribute-based hints since they serve as tutorials.

---

## Backward Generation Process

Puzzles should be authored **backward** — starting from the desired player experience and working back to the content. Forward authoring (write scenario → assign cards → pick lies → write hints) does not guarantee genuine ambiguity. Backward authoring does, by construction.

### Step 1: Define the desired experience
- How many cards should the player seriously suspect? (minimum 3 for a good puzzle)
- Should T1 probe be rewarded or punished?
- What kind of reasoning should the hint require? (attribute-matching for easy, behavioral for medium, narrative for hard)

### Step 2: Choose lies and their relationship
- Pick 2 lies: 1 hint lie (in hint group), 1 stealth lie (outside)
- Define what the lies have in common (the hint basis)
- Ensure the stealth lie is deducible from reactive hints but not from the opening hint alone

### Step 3: Write the hint backward
- Craft the opening hint so it describes both lies truthfully
- Verify ≥1 truth also matches the hint (red herring)
- Test: read the hint, then each hint-group card — can you reasonably suspect any of them? If one stands out, rewrite

### Step 4: Write reactive hints backward
- For each possible T1 play, decide what information the player **should** get
- Hint-group truths (risky T1): write a **specific** hint that narrows toward the stealth lie
- Non-hint truths (safe T1): write a **vague** hint that provides atmosphere only
- Lie plays: write an explicit reveal that points to the other lie
- Test: does the specific hint create a logical path to the stealth lie without naming it directly?

### Step 5: Design cards around the constraints
- Set strengths so lies are tempting (avg lie ≥ avg truth)
- Set target so top 3 truths ≥ target (always winnable)
- Ensure neither hint group nor non-hint group alone can reach target (no safe group)

### Step 6: Write the scenario last
- Make it consistent with the cards and lies
- Do NOT name the mechanism a lie card denies (S1)
- The scenario motivates the lies narratively — why would someone fabricate this evidence?

### Step 7: Validate
- Run semantic checklist (S1-S13)
- Run `npx tsx scripts/prototype-v3.ts` for mechanical checks (I1-I25, C1-C8)

---

## Checklist (run before validator)

Before running `npx tsx scripts/prototype-v3.ts`, verify:

- [ ] S1: Scenario does not name the mechanism a lie card denies
- [ ] S2: All hint-group cards are plausibly suspicious
- [ ] S3: No truth-truth contradictions in claims
- [ ] S4: Every reactive hint text conveys its implicates
- [ ] S5: Truth-play reactive hints don't name the stealth lie card
- [ ] S6: Red herrings have genuine misdirection value
- [ ] S7: Stealth lie is reachable via reactive hint reasoning
- [ ] S8: Narrations match claims
- [ ] S9: Closing dialogue doesn't reveal structure
- [ ] S10: Hint text matches hintDimension
- [ ] S11: Difficulty increases across puzzle sequence
- [ ] S12: Vague reactive hints don't identify specific cards
- [ ] S13: Opening hints don't cleanly partition by single attribute (medium/hard)

Then run the validator for mechanical checks (I1-I25, C1-C8).
