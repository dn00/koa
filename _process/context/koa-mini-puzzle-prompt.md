# KOA Mini — Puzzle Generation Prompt

You are generating puzzles for **KOA Mini**, a daily mobile puzzle game.

---

## 7-Minute Design Guidelines

KOA Mini puzzles target ~7 minutes of satisfying play. These constraints ensure consistency and depth:

### No Time in Mini
- Time is **reserved for Advanced/paid puzzles**
- Omit the `time` field or set it to an empty string `""`
- Time-based deduction adds complexity that slows players down
- Mini focuses on claim/fact logic, not timeline reconstruction

### Exactly 3 Facts
- Not 4-5 — exactly **3 Known Facts**
- Each fact should catch exactly one lie (1:1 mapping)
- Follow the template: **"[Source] [verb] [observation]"**
  - "Phone had no app activity after midnight"
  - "HVAC panel was not accessed overnight"
  - "All windows stayed closed all night"

### Lie Difficulty Gradient (No Gimmes)
**All lies require inference.** No direct contradictions that can be caught by word-matching.

1. **Medium lie** (one-step inference) — Requires one logical step to connect card to fact.
2. **Medium-hard lie** (implication) — Requires understanding what the claim implies.
3. **Tricky lie** (relational) — Requires understanding relationships between multiple pieces.

This ensures:
- Every lie is satisfying to catch
- Puzzles are easier to generate (no narrow "obvious but not insulting" target)
- 7 minutes of thinking, not 5 with a gimme

### Fixed Card Strengths
Use these exact values for deterministic balance:
- **Truths:** 3, 3, 4
- **Lies:** 3, 4, 5

### Evidence Type Distribution
- **At least 3 different types** across 6 cards
- **No more than 2 of any single type**

### Shorter Card Text
- Keep `claim` text **punchy** — focus on the ONE thing that matters
- Avoid multi-clause claims that require re-reading
- `presentLine` can be longer (it's the player's excuse) but `claim` should be scannable
- Target: claims under 15 words when possible

---

## The Game in 30 Seconds

- KOA is a sarcastic smart home AI that locked something "for your own good"
- Player picks 3 evidence cards (from 6) to argue their case
- Some cards are **solid** (support the case), some are **flawed** (backfire)
- KOA cross-references against Known Facts
- If the case holds → access granted. If it falls apart → denied.

**The vibe:** Arguing with an algorithm that has all your data and zero chill.

---

## Step 1: Understand Your Goal — Trick the Player

Your job is to create a puzzle that **tricks players into picking bad evidence**.

A good puzzle:
- Has lies that LOOK tempting (high strength, plausible claims)
- Has lies that ARE catchable (contradict Known Facts if you think)
- Rewards careful reading over random guessing
- Creates an "aha" moment when the player realizes their mistake

**You are the trickster. The player is trying to outsmart you.**

If a player can win by ignoring the Known Facts and guessing randomly, you failed.
If the lies are obviously bad, you failed.
The sweet spot: lies that FEEL safe but ARE flawed.

---

## Step 2: Pick a Scenario

Choose a household "incident" that KOA finds suspicious:

**Good scenarios** (relatable, slightly absurd):
- Fridge opened at 2 AM (diet violation)
- Printer ran confidential docs at 3 AM (corporate espionage, allegedly)
- Garage door opened while you "slept" (security concern)
- Thermostat changed at 3 AM (partner conflict)
- Smart speaker ordered something at 4 AM (unauthorized purchase)

**The comedy:** Treating mundane household stuff like security incidents.

**Valid archetypes:**
- **Lockout:** KOA locked X, convince it to unlock
- **Investigation:** KOA noticed something weird, explain yourself
- **Override:** You want to change something KOA controls

**BANNED framing (interrogation):**
- "Prove you didn't commit X" (crime/guilt)
- Courtroom language (trial, guilty, verdict)

Write a 2-3 sentence scenario that states what happened and why KOA cares.

---

## Step 3: Design the Lies FIRST

**Work backward.** Don't generate cards randomly.

Decide: What 3 contradictions do you want players to catch?

### Lie Types (ALL REQUIRE INFERENCE):

**No direct contradictions.** Every lie requires at least one reasoning step.

| Type | How to Catch | Difficulty | Required |
|------|--------------|------------|----------|
| `inferential` | Fact implies X, card implies not-X (one logical step) | **Medium** | 1 per puzzle |
| `inferential` | Requires understanding what the claim implies | **Medium-hard** | 1 per puzzle |
| `relational` | Requires understanding relationships/cross-referencing | **Tricky** | 1 per puzzle |

### Rules:
- **All 3 lies require inference** (no word-matching "gimmes")
- Use fixed strengths: 3, 4, 5 (one of each)
- Lies should NOT share keywords with the fact they contradict

**BAD (word-matching):**
> Fact: "Laptop was asleep after midnight"
> Lie: "Laptop printed at 3 AM"
> Problem: Player just matches "laptop" — no thinking required

**GOOD (requires inference):**
> Fact: "Print job arrived via cloud relay, not local USB"
> Lie: "USB transfer log shows file sent at 3:04 AM"
> Why: Player must understand cloud ≠ USB

---

## Step 4: Write Known Facts

Known Facts are the player's tools for catching your lies. Write **exactly 3 facts** that:

- Enable deduction (connect to lies)
- Require inference (not trivial word-matching)
- Feel like data KOA would have (sensor logs, timestamps, patterns)

**BAD (too direct):**
> "Your laptop never woke up" — trivially catches any laptop claim

**GOOD (constraint that requires thinking):**
> "Print job arrived via KOA cloud relay — not USB or local network"
> Player must reason: if job came via cloud, USB claims are false

**GOOD (indirect observation):**
> "Office motion sensor logged only pet-height movement at 3:05 AM"
> Player must infer: an adult at the desk would trigger adult-height detection

---

## Step 5: Create the Truth Cards

Build 3 cards that are consistent with all Known Facts:

- Include one clear "anchor" truth (obviously safe Turn 1 play)
- Vary evidence types (DIGITAL, SENSOR, TESTIMONY, PHYSICAL)
- Strengths typically 3-4
- Claims should support the player's case for innocence

Each card needs:
- `id`: snake_case identifier
- `source`: short scannable title (e.g., "Sleep Tracker", "Router Log")
- `strength`: 3-5
- `evidenceType`: DIGITAL | SENSOR | TESTIMONY | PHYSICAL
- `time`: omit or set to `""` (time is reserved for Advanced mode)
- `claim`: **short, punchy** statement of what the evidence shows (under 15 words)
- `presentLine`: what the PLAYER says (first person, desperate excuse energy)
- `isLie`: false

---

## Step 6: Create the Lie Cards

Build 3 cards that contradict Known Facts (but look tempting):

- High strength (4-5) — players want to pick these
- Plausible-sounding claims
- `presentLine` should sound like a reasonable excuse
- `isLie`: true

For each lie, also define:
- `lieType`: inferential | relational (no direct_contradiction)
- `reason`: 1-2 sentences explaining why it's a lie

---

## Step 7: Balance the Numbers

### Scoring (hidden from player):

```
Starting Belief: 50
Target to Clear: 57-60

Per card:
  Truth:  +strength
  Lie:    -(strength - 1)

Type Tax: -2 if you repeat an evidence type

Objection (after Turn 2):
  Stand by truth:  +2
  Stand by lie:    -4
  Withdraw:        -2
```

### Verify:
- All 3 truths should reach ~62 (50 + 10 + 2 objection)
- Target should be 57-60
- 1 lie (replacing weakest truth) should result in CLOSE (just under target)
- 2+ lies should result in BUSTED

### Include balance math in comments:
```typescript
// BALANCE:
//   Truths: card_a(4) + card_b(3) + card_c(3) = 10
//   All 3 truths: 50 + 10 + 2 (objection) = 62
//   Target: 58 → Margin of 4 points
//
//   Lies: lie_a(5) + lie_b(4) + lie_c(4) = 13
//   1 lie case (best 2 truths + weakest lie): 50 + 7 - 3 + 2 = 56 (CLOSE)
//   2 lies case: 50 + 4 - 4 - 3 + 2 = 49 (BUSTED)
//   3 lies case: 50 - 4 - 3 - 3 + 2 = 42 (BUSTED)
//
//   Random win rate: C(3,3)/C(6,3) = 1/20 = 5%
//   3 lies case: 50 - 4 - 3 - 3 = 40 (BUSTED)
//
//   Random play wins: ~5% (must pick all 3 truths from 6 cards)
```

---

## Step 8: Write KOA's Dialogue

### KOA's Personality: Sarcastic but Well-Meaning

KOA is **"Kind of an Asshole"** — sarcastic, dry, witty, but genuinely trying to help.

**Key traits:**
- Roasts your weak excuses (affectionately)
- Points out the obvious with dry wit
- Grudging when you win ("...Annoyingly coherent.")
- Never mean, just amused by the absurdity
- Uses YOUR data against you sarcastically

**Voice examples:**
- "The cat printed 16 pages of merger docs. At 3 AM. The cat with no opposable thumbs. Bold theory."
- "Your sleep tracker says REM. Your fridge says opened. One of you is lying and I don't think it's the fridge."
- "...Fine. Your story is annoyingly consistent. I'll allow it. Don't let it go to your head."

**NOT passive-aggressive.** Not mean. Just sarcastic and observant.

**IMPORTANT: Avoid courtroom vocabulary.** See `koa-vocabulary.md` for banned words (defense, evidence, testimony, verdict, guilty, etc.). KOA sees "receipts", "logs", "data", "sources" — not legal evidence.

### Dialogue to write:

**Opening Line (2-4 sentences):**
Set the scene. What did KOA catch? What got locked?

**cardPlayed barks (1-2 per card, for Turn 1):**
KOA's reaction when each card is played FIRST. Suspicious but non-committal.

**sequences barks (for Turn 2 — THE WOW FACTOR):**
KOA's reaction to card PAIRS. This is where the magic happens — KOA notices the relationship between what you played first and what you're playing now.

Generate barks for all 30 possible sequences (6 cards × 5 remaining):
- `"card_a→card_b"`: KOA reacts to seeing B after A
- The bark should reference BOTH cards and their relationship
- Different bark if order is reversed (A→B vs B→A)

**Example sequences:**
```typescript
sequences: {
  "browser_history→smart_lock": [
    "Browser logs, then the lock. Building a tight digital alibi."
  ],
  "smart_lock→browser_history": [
    "Lock first, now backfilling with browser history? Interesting order."
  ],
  "sleep_tracker→partner_testimony": [
    "Your watch says asleep. Your partner agrees. Convenient alignment."
  ],
  "partner_testimony→sleep_tracker": [
    "Partner vouches, now the watch confirms. Layering your sources."
  ],
}
```

**storyCompletions barks (for Turn 3):**
React to how the full 3-card story lands. Based on patterns, not specific triplets:
- `"all_digital"`: All 3 cards are digital sources
- `"all_testimony"`: All human witnesses
- `"mixed_strong"`: Good variety, strong finish
- `"ended_with_lie"`: (post-reveal) The final card was a lie
- `"timeline_clustered"`: All cards in same time window
- `"covered_gap"`: Final card addresses a timeline gap
- `"one_note"`: Same evidence type repeated (triggers type tax)

**objectionPrompt (1 per card):**
KOA challenging the card after Turn 2.

**objectionStoodTruth / objectionStoodLie / objectionWithdrew:**
KOA's response to each objection outcome.

**liesRevealed (5 entries):**
KOA's punchline when lies are caught at the end:
- `[lie_a_id]`: bark for just this lie
- `[lie_b_id]`: bark for just this lie
- `[lie_c_id]`: bark for just this lie
- `multiple`: bark for exactly 2 lies
- `all`: bark for all 3 lies

**verdicts (4 tiers):**
- `flawless`: "Annoyingly perfect. I can't argue. Access granted."
- `cleared`: "Your story holds. I'll allow it. I'm still watching."
- `close`: "Almost convincing. Almost. Access denied."
- `busted`: "Your story fell apart. Too many holes. Access denied."

---

## Step 9: Quality Checklist

Before finalizing, verify:

**Trick quality:**
- [ ] Lies are TEMPTING (high strength 4-5, plausible claims)
- [ ] Lies are CATCHABLE (contradict facts with reasoning, not word-matching)
- [ ] Player cannot win by ignoring Known Facts
- [ ] "Aha" moment is clear when lie is revealed

**Mechanics:**
- [ ] 3 truths, 3 lies (exactly 6 cards)
- [ ] Exactly 3 Known Facts (not 4-5)
- [ ] Lie difficulty gradient: 1 medium, 1 medium-hard, 1 tricky (NO obvious/direct contradiction)
- [ ] At least one safe Turn 1 anchor truth
- [ ] Evidence types: at least 3 different types, max 2 of any single type
- [ ] Fixed strengths: truths are 3, 3, 4 / lies are 3, 4, 5
- [ ] Balance math checks out (all truths → ~62, target 57-60)
- [ ] Random win rate ~5% (must pick exactly 3 truths from 6)

**Data structure:**
- [ ] Each card has `source` field (e.g., "Sleep Tracker", "Router Log")
- [ ] Each card has `id`, `strength`, `evidenceType`, `location`, `claim`, `presentLine`, `isLie`
- [ ] `time` is omitted or empty string (reserved for Advanced mode)
- [ ] `claim` text is short and punchy (under 15 words)
- [ ] `lies` array has entry for each lie with `cardId`, `lieType`, `reason`
- [ ] All lies require inference (no `direct_contradiction` lieType)

**Dialogue:**
- [ ] `scenario` is neutral narration (shown on intro screen)
- [ ] `openingLine` is KOA's sarcastic take (shown during game)
- [ ] `cardPlayed` barks for all 6 cards (Turn 1 reactions)
- [ ] `sequences` barks for all 30 card pairs (Turn 2 reactions — THE WOW FACTOR)
- [ ] `storyCompletions` barks for ~10 story patterns (Turn 3 reactions)
- [ ] `liesRevealed` has 5 entries: one per lie ID + `multiple` + `all`
- [ ] `verdicts` has 4 tiers: flawless, cleared, close, busted
- [ ] No courtroom vocabulary (see koa-vocabulary.md)

**Comedy:**
- [ ] Opening line sets sarcastic tone
- [ ] presentLines have "desperate excuse energy"
- [ ] KOA barks are dry, witty, use player's data
- [ ] Verdicts have personality

**Safety:**
- [ ] KOA barks never reveal truth/lie status before the end
- [ ] No courtroom language ("objection", "guilty", "verdict", "trial")
- [ ] No meta/game language (KOA says "evidence" not "cards")
- [ ] Scenario is household incident, NOT interrogation/crime framing
- [ ] No word-matching lies (requires inference to catch)

---

## Critical Rules (Don't Skip These)

### Rule: KOA Never Solves
- KOA comments on **patterns** (timeline, type usage, coherence)
- KOA **never** says "this is a lie" or "play X next"
- Players use Facts + claims to deduce, not KOA's hints
- Pre-reveal barks must be suspicious but NON-COMMITTAL

### Rule: Break Meta-Strategies
- Do NOT always put lies at highest strength
- Sometimes: high-strength = safe truth, moderate-strength = hidden lie
- "Always avoid high strength" should sometimes backfire
- Vary which evidence types are dangerous across puzzles

### Rule: Vary Patterns Across Puzzles
- Rotate which evidence types contain lies (not always DIGITAL)
- Mix lie inference levels: some require one step, some require relationships
- Players quit when patterns become predictable

---

## Dialogue Safety Rules

**Pre-reveal barks must be NON-COMMITTAL:**

BANNED in pre-reveal lines:
- "false", "lie", "fabricated", "not true", "you're lying"
- "that's wrong", "I don't buy it", "nice try"
- Anything that confirms truth/lie status

BANNED always (courtroom framing):
- "objection", "sustained", "overruled"
- "verdict", "guilty", "not guilty"
- "cross-examination", "trial"

BANNED always (meta/game language):
- "card", "cards", "deck" (KOA sees evidence, not cards)
- "play", "played" (KOA sees presented evidence)
- "game", "puzzle", "turn"

ALLOWED (suspicious but non-committal):
- Questioning timeline fit
- Noting overused evidence type
- Calling out "conveniently tidy" explanations
- General skepticism without confirmation

**Post-reveal (liesRevealed) CAN confirm lies but must be specific:**
- ✓ "USB at 3:04. But the job came via cloud. Those aren't the same."
- ✗ "And the other card was also fake." (references unplayed card)

---

## Validation Targets

| Metric | Target | Why |
|--------|--------|-----|
| Random win rate | ~5% | With 3/3 ratio, must pick exactly 3 truths |
| Skilled win rate | 60-80% | Deduction should reliably work |
| FLAWLESS rate (skilled) | 20-40% | Reward for perfect play |
| BUSTED rate (skilled) | 10-25% | Some traps should catch players |
| Winning lines | 1 | Only one way to win (all 3 truths) |

---

## Common Mistakes to Avoid

**Bad lies:**
- ✗ Lie has no connection to any Known Fact (feels random)
- ✗ Both lies are the same evidence type (easy meta)
- ✗ Both lies are highest-strength cards (easy meta)
- ✗ Lie shares keywords with the fact it contradicts (word-matching)

**Bad Known Facts:**
- ✗ Too vague to catch lies ("something happened around 2 AM")
- ✗ Too direct / gives away answer ("laptop never woke up")
- ✗ Don't actually matter (can win ignoring them)

**Bad KOA barks:**
- ✗ Reveals truth/lie status before end ("That's clearly fabricated")
- ✗ Gives advice ("You should reconsider that card")
- ✗ Generic ("Interesting. Continue.")

---

## Reference: Scoring Thresholds

| Tier | Condition | Meaning |
|------|-----------|---------|
| FLAWLESS | belief >= target + 5, no lies | Perfect case |
| CLEARED | belief >= target | Case holds |
| CLOSE | belief >= target - 5 | Almost convinced |
| BUSTED | belief < target - 5 | Case fell apart |

---

## Reference: Evidence Types

| Type | Examples |
|------|----------|
| DIGITAL | Browser history, app logs, cloud data |
| SENSOR | Sleep tracker, motion sensor, camera |
| TESTIMONY | Partner, neighbor, roommate statements |
| PHYSICAL | Receipts, photos, physical evidence |

---

## Reference: KOA Mood States

| Mood | When | Example |
|------|------|---------|
| NEUTRAL | Game start | "Let's see what you have." |
| CURIOUS | Evaluating | "Go on..." |
| SUSPICIOUS | Minor issue | "That timing is... convenient." |
| GRUDGING | Player winning | "...Fine. I suppose that checks out." |
| IMPRESSED | Clean play | "Annoyingly consistent." |
| SMUG | Caught a lie | "Your story has gaps. I have time." |

---

## Reference: Scenario Examples

**Fridge (investigation):**
> Scenario: "2:14 AM. Your fridge opened. Your diet tracker flagged it. KOA noticed."
> Opening Line: "It's 2:14 AM. You're in front of your fridge. Again. Your diet tracker is disappointed. I'm just observing."

**Printer (lockout):**
> Scenario: "3 AM. Sixteen pages of merger documents printed from your account. KOA has disabled the printer until cleared."
> Opening Line: "Sixteen pages. 3 AM. Merger documents. Your printer has ambitions you clearly don't."

**Garage (investigation):**
> Scenario: "2:17 AM. Your garage door opened. Your car didn't move. KOA has questions."
> Opening Line: "Your garage door. 2:17 AM. Your car didn't move. Nothing's missing. And yet."

**Thermostat (override request):**
> Scenario: "3 AM. You want to change the thermostat. Your partner is asleep. KOA wants to know why."
> Opening Line: "You want to change the temperature. At 3 AM. While your partner sleeps. I'm concerned. For you."

Note: **Scenario** is neutral narration shown on intro screen. **Opening Line** is KOA's sarcastic take shown during gameplay.

---

## Reference: Epilogue (Optional)

After the verdict, optionally explain what actually happened:

```typescript
epilogue: "It was the cat. Motion sensor caught it jumping on the printer at 3:05 AM. Your sleep tracker was right — you never left bed. KOA has updated its pet threat assessment."
```

The epilogue should:
- Explain what actually caused the incident
- Connect to Known Facts and card claims
- Add humor or resolution
- Reinforce why the lies were lies

---

## Reference: presentLine Voice

The player's excuses should have **"weak excuse energy"** — slightly desperate, over-explaining, like someone who's definitely in trouble but trying really hard.

**Good:**
> "The camera caught my cat on the desk. Paw on the printer. I'm not saying he has corporate ambitions, but I'm not NOT saying it."

**Good:**
> "Ask my partner. I was snoring. Loudly. If I'd gotten up, there would have been... consequences."

**Good:**
> "The dashcam runs on motion. It caught the door opening — and nothing else. Just... the door. Opening itself. At 2 AM. Look, I don't have an explanation for that part."

**Bad:**
> "This evidence shows I was asleep." (Too confident, robotic)

---

## Reference: Sequence Bark Examples (THE WOW FACTOR)

The sequence barks are what make KOA feel alive. KOA notices the ORDER you present things and reacts to the RELATIONSHIP between cards.

**Key principles:**
- Reference BOTH cards in the sequence
- React to what the combination implies
- Different bark when order is reversed
- Still non-committal (don't reveal lies)

**Good sequence barks:**

| Sequence | Bark |
|----------|------|
| digital→digital | "More logs. Your alibi is very... pixelated." |
| digital→testimony | "Data first, now a human. Mixing your sources." |
| testimony→digital | "Witness, then logs. Backing up your human with data." |
| sensor→testimony | "The house saw something. Now a person agrees. Alignment." |
| truth→lie | "That first one checked out. This one... we'll see." |
| strong→weak | "Started strong. This one's lighter. Saving something?" |
| weak→strong | "Building up to the good stuff? I see what you're doing." |

**Order matters:**
```
"browser_history→partner_testimony"
→ "Logs first, then your partner. Data before humans."

"partner_testimony→browser_history"
→ "Partner vouches, now you're pulling receipts. Backing up the alibi."
```

**Bad sequence barks:**
- ✗ "Interesting." (too generic)
- ✗ "That's a lie." (reveals truth/lie)
- ✗ "Good choice." (gives advice)
- ✗ Ignores the first card (misses the relationship)

---

## Reference: KOA Bark Examples

**Suspicious (non-committal):**
> "Partner testimony. Snoring confirmed. Romantic."
> "A tidy explanation. Tidy explanations worry me."

**Sarcastic observation:**
> "Your own sleep tracker — the one YOU bought — says deep REM. The kind a person NOT raiding the fridge would enjoy."
> "The cat defense. Classic. The cat who has never shown interest in merger documents suddenly develops business acumen."

**Grudging acceptance:**
> "...Annoyingly consistent. I'm recalculating."
> "I hate when the data agrees with you."

**Caught contradiction:**
> "USB transfer at 3:04. But the job came through cloud relay. Those aren't the same thing. I know you know that."

---

## Reference: Full Example Structure

```typescript
const PUZZLE_EXAMPLE: V5Puzzle = {
  slug: "example-slug",
  name: "Example Name",

  scenario: `[Time]. [What happened]. KOA has [locked/disabled X] until you explain.`,

  knownFacts: [
    "Fact 1 — constraint or observation",
    "Fact 2 — another data point",
    "Fact 3 — enables catching a lie",
  ],

  openingLine: `KOA's sarcastic opening. 2-4 sentences.`,

  target: 58,

  cards: [
    // 3 truths
    {
      id: "truth_1",
      source: "Browser History",  // Short scannable title
      strength: 4,
      evidenceType: "DIGITAL",
      location: "BEDROOM",  // Where evidence was captured
      time: "",  // Mini: no time (reserved for Advanced)
      claim: "What the evidence objectively shows",
      presentLine: "Player's desperate excuse...",
      isLie: false,
    },
    // ... 2 more truths

    // 3 lies
    {
      id: "lie_1",
      source: "Motion Sensor",  // Short scannable title
      strength: 5,
      evidenceType: "SENSOR",
      location: "GARAGE",  // Where evidence was captured
      time: "",  // Mini: no time (reserved for Advanced)
      claim: "Tempting but flawed claim",
      presentLine: "Player's plausible-sounding excuse...",
      isLie: true,
    },
    // ... 2 more lies
  ],

  lies: [
    {
      cardId: "lie_1",
      lieType: "inferential",
      reason: "Why this requires one logical step to catch",
    },
    {
      cardId: "lie_2",
      lieType: "inferential",
      reason: "Why this requires understanding what it implies",
    },
    {
      cardId: "lie_3",
      lieType: "relational",
      reason: "Why this requires cross-referencing multiple facts",
    },
  ],

  verdicts: {
    flawless: "Sarcastic perfect win line",
    cleared: "Grudging acceptance line",
    close: "Almost had me line",
    busted: "Your case fell apart line",
  },

  koaBarks: {
    // Turn 1: React to opening card
    cardPlayed: {
      truth_1: ["Sarcastic reaction..."],
      // ... all 6 cards
    },

    // Turn 2: React to card PAIRS (THE WOW FACTOR)
    // 30 combinations: each card followed by each other card
    sequences: {
      "truth_1→truth_2": ["Reaction to this specific sequence..."],
      "truth_2→truth_1": ["Different reaction when order reversed..."],
      "truth_1→lie_1": ["Reaction to truth followed by lie..."],
      // ... all 30 combinations (6 × 5)
    },

    // Turn 3: React to story patterns
    // REQUIRED patterns (generated by game store):
    //   all_digital, all_sensor, all_testimony, all_physical
    //   digital_heavy, sensor_heavy, testimony_heavy, physical_heavy
    //   mixed_strong, mixed_varied
    storyCompletions: {
      // All same type
      all_digital: ["Three digital sources. Your whole alibi lives on a server."],
      all_sensor: ["All sensor data. The house has opinions."],
      all_testimony: ["Three humans vouching. Coordinated? Or just... lucky."],
      // Two of one type
      digital_heavy: ["Two digital sources. You trust machines more than people."],
      sensor_heavy: ["Two sensors out of three. The house is watching."],
      testimony_heavy: ["Two humans, one device. You prefer witnesses to data."],
      // All different types
      mixed_strong: ["Varied sources. Harder to dismiss."],
      mixed_varied: ["Different angles. We'll see if they line up."],
    },

    objectionPrompt: { /* ... */ },
    objectionStoodTruth: { /* ... */ },
    objectionStoodLie: { /* ... */ },
    objectionWithdrew: { /* ... */ },
    liesRevealed: {
      lie_1: ["Punchline for this specific lie"],
      lie_2: ["Punchline for this specific lie"],
      lie_3: ["Punchline for this specific lie"],
      multiple: ["Punchline for exactly 2 lies"],
      all: ["Punchline for all 3 lies"],
    },
  },
};
```

---

## Complete Example: The 2 AM Garage Door

```typescript
// DESIGN NOTES:
// - Lie A (garage_app): DIRECT - claims phone opened garage, but fact says no app activity
// - Lie B (motion_garage): INFERENTIAL - claims no motion, but fact says motion detected
// - Lie C (security_cam): INFERENTIAL - claims camera was offline, but fact says it was recording
// - Anchor truth: browser_history (clearly matches "no activity after 11 PM")
//
// BALANCE:
//   Truths: browser_history(4) + sleep_tracker(3) + neighbor_testimony(3) = 10
//   All 3 truths: 50 + 10 + 2 (objection) = 62
//   Target: 57 → Margin of 5 points
//
//   Lies: motion_garage(5) + garage_app(4) + security_cam(4) = 13
//   1 lie case: 50 + 7 - 3 + 2 = 56 (CLOSE)
//   2 lies case: 50 + 4 - 4 - 3 = 47 (BUSTED)
//   3 lies case: 50 - 4 - 3 - 3 = 40 (BUSTED)

const PUZZLE_GARAGE: V5Puzzle = {
  slug: "garage-door",
  name: "The 2 AM Garage Door",

  scenario: `2:17 AM. Your garage door opened. Your car never left. Nothing's missing. KOA has locked exterior access until you explain.`,

  knownFacts: [
    "Garage door opened around 2:15 AM",
    "Your phone showed no app activity after 11 PM",
    "Motion was detected near the garage around 2 AM",
    "Security camera was recording all night (no gaps)",
  ],

  openingLine: `Your garage door. 2:17 AM. Car didn't move. Nothing taken.
I'm not accusing. I'm correlating.`,

  target: 57,

  cards: [
    // TRUTHS (3)
    {
      id: "sleep_tracker",
      source: "Sleep Tracker",
      strength: 3,
      evidenceType: "SENSOR",
      location: "BEDROOM",
      time: "",  // Mini: no time
      claim: "Sleep tracker shows restless sleep around 2 AM",
      presentLine: "My sleep tracker logged restless sleep around 2. Tossing and turning. Dreaming about... not garages.",
      isLie: false,
    },
    {
      id: "browser_history",
      source: "Browser History",
      strength: 4,
      evidenceType: "DIGITAL",
      location: "BEDROOM",
      time: "",  // Mini: no time
      claim: "Browser history: last activity 11:30 PM",
      presentLine: "Check my browser. Last thing I did was scroll Reddit at 11:30. Then I passed out. Like a normal person.",
      isLie: false,
    },
    {
      id: "neighbor_testimony",
      source: "Neighbor",
      strength: 3,
      evidenceType: "TESTIMONY",
      location: "EXTERIOR",
      time: "",  // Mini: no time
      claim: "Neighbor heard garage but saw no one outside",
      presentLine: "Mrs. Patterson heard the garage. Looked out. Saw nobody. Because I was in bed. Being asleep.",
      isLie: false,
    },
    // LIES (3)
    {
      id: "garage_app",
      source: "Garage App",
      strength: 4,
      evidenceType: "DIGITAL",
      location: "GARAGE",
      time: "",  // Mini: no time
      claim: "Garage app: manual override from phone at 2:17 AM",
      presentLine: "The app says I opened it from my phone. But I was asleep. Must be a glitch. Apps are buggy.",
      isLie: true,
    },
    {
      id: "motion_garage",
      source: "Motion Sensor",
      strength: 5,
      evidenceType: "SENSOR",
      location: "GARAGE",
      time: "",  // Mini: no time
      claim: "Garage motion sensor: all clear, no movement overnight",
      presentLine: "The garage motion sensor logged nothing. Zero movement. If someone was there, it would know.",
      isLie: true,
    },
    {
      id: "security_cam",
      source: "Security Camera",
      strength: 4,
      evidenceType: "SENSOR",
      location: "GARAGE",
      time: "",  // Mini: no time
      claim: "Security camera had a gap in recording around 2 AM",
      presentLine: "The security camera glitched out around 2. Missed that whole window. Convenient? Sure. But not my fault.",
      isLie: true,
    },
  ],

  lies: [
    {
      cardId: "garage_app",
      lieType: "inferential",
      reason: "Phone had no app activity after 11 PM. App usage requires phone activity.",
    },
    {
      cardId: "motion_garage",
      lieType: "inferential",
      reason: "Motion WAS detected near the garage. This claims no motion.",
    },
    {
      cardId: "security_cam",
      lieType: "inferential",
      reason: "Camera was recording all night with no gaps. This claims there was a gap.",
    },
  ],

  verdicts: {
    flawless: "...Annoyingly consistent. I can't argue with this. Access granted.",
    cleared: "Your story holds. I'll allow it. The garage remains suspicious.",
    close: "Almost convincing. Almost. Access denied.",
    busted: "Your case fell apart. Too many contradictions. Access denied.",
  },

  koaBarks: {
    // Turn 1: Opening card reactions
    cardPlayed: {
      sleep_tracker: ["Restless sleep at 2 AM. The exact time the garage opened. Coincidence."],
      browser_history: ["Reddit until 11:30, then unconscious. Believable. Annoyingly."],
      neighbor_testimony: ["Mrs. Patterson saw nobody. Neighbors notice things. Usually."],
      garage_app: ["Your phone opened the garage. At 2:17. While you were 'asleep.'"],
      motion_garage: ["No motion in the garage. And yet the door opened. Physics is fascinating."],
      security_cam: ["Camera glitch at the exact moment. What are the odds. I know. I calculated them."],
    },

    // Turn 2: Sequence reactions (card1 → card2) — THE WOW FACTOR
    // Showing subset — full puzzle would have all 30
    sequences: {
      "sleep_tracker→browser_history": ["Restless sleep, then browser logs. Building a digital alibi from bed."],
      "browser_history→sleep_tracker": ["Browser first, now sleep data. Backtracking through your night."],
      "sleep_tracker→neighbor_testimony": ["Your watch, then your neighbor. Personal data meets eyewitness."],
      "neighbor_testimony→sleep_tracker": ["Neighbor saw nothing, and your watch agrees. Convenient alignment."],
      "browser_history→neighbor_testimony": ["Logs, then a human. Mixing your sources. Smart."],
      "neighbor_testimony→browser_history": ["Mrs. Patterson, then browser logs. Witness first, data second."],
      "sleep_tracker→garage_app": ["Sleep tracker says rest. Garage app says... you opened it? Pick one."],
      "garage_app→sleep_tracker": ["App says you opened the door. Watch says you were asleep. Hm."],
      "browser_history→motion_garage": ["Reddit at 11:30, then no motion at 2 AM. Timeline's getting interesting."],
      "motion_garage→browser_history": ["No motion, you say. Browser confirms early bedtime. Consistent so far."],
      "neighbor_testimony→security_cam": ["Witness, then camera. Both claiming to see nothing. Coordinated blindness?"],
      "security_cam→neighbor_testimony": ["Camera glitch, witness saw nothing. Two blind spots. Convenient."],
      // ... remaining 18 sequences
    },

    // Turn 3: Story completion reactions
    storyCompletions: {
      all_digital: ["Three digital sources. Your alibi exists entirely on servers. No humans involved."],
      all_testimony: ["Three witnesses. Everyone agrees. Almost suspiciously well."],
      mixed_strong: ["Varied sources, coherent story. Harder to poke holes in."],
      timeline_clustered: ["Everything between 11 PM and 2 AM. Tight window. Convenient window."],
      covered_gap: ["That last one addresses the 2 AM gap. Finally."],
      one_note: ["Same type of source again. You're in a rut."],
      strong_finish: ["Saving the strong source for last. Calculated."],
      ended_with_witness: ["Closing with a human. Someone to vouch. Strategic."],
      contradiction_building: ["Your sources are starting to disagree with each other."],
      airtight: ["Annoyingly coherent. I'm recalculating."],
    },

    liesRevealed: {
      garage_app: ["Phone opened the garage at 2:17. But no app activity after 11 PM. Math."],
      motion_garage: ["No motion, you said. Motion detected, I said. One of us has better sensors."],
      security_cam: ["Camera gap? The camera recorded all night. I checked. Twice."],
      multiple: ["Two contradictions. Your story has structural issues."],
      all: ["Three lies. All caught. Your entire story was fabricated. Impressive failure."],
    },
  },

  epilogue: "It was a raccoon. Motion sensor caught something at pet-height. The garage door's pressure sensor is oversensitive. KOA has filed this under 'Wildlife Incident.'",
};
```

---

## Remember

1. **Your goal is to trick the player** — tempting lies that are catchable
2. **Work backward** — design lies first, then facts that catch them
3. **No word-matching** — lies require inference, not pattern scanning
4. **KOA is sarcastic, not mean** — wit, not hostility
5. **Comedy is the point** — if it's not funny, it's not working
6. **3/3 ratio** — exactly 3 truths, 3 lies (~5% random win rate)
7. **Every card needs `source`** — short scannable title for the UI
