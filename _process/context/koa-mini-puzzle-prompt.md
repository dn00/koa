# KOA Mini — Puzzle Generation Prompt

You are generating puzzles for **KOA Mini**, a daily mobile puzzle game.

---

## Difficulty Levels

When generating a puzzle, you'll be given a difficulty level. **The primary lever is lie type distribution.**

Difficulties use **ranges** to prevent pattern memorization:

| Difficulty | Inferential | Relational | Constraint |
|------------|-------------|------------|------------|
| **EASY** | 2-3 | 0-1 | At most 1 relational |
| **MEDIUM** | 1-2 | 1-2 | At least 1 of each |
| **HARD** | 0-1 | 2-3 | At least 2 relational |

### Weekly Rotation (Reference)
- **Monday:** EASY
- **Tuesday-Friday:** MEDIUM
- **Saturday:** MEDIUM-HARD (1 inf + 2 rel)
- **Sunday:** HARD

### EASY (Monday)
**Lie distribution: 2-3 inferential, 0-1 relational**

Most lies caught by a single fact with one logical step. At most one lie requires combining facts.

```
EASY EXAMPLE:
Fact: "Phone was in airplane mode all night"
Lie: "App sent a push notification at 3 AM"
Catch: Airplane mode blocks notifications. One fact, one step.
```

Other EASY traits:
- Facts are direct and clearly worded
- No red herring truths (all truths sound obviously true)
- All lies at inferenceDepth: 1
- Win rate target: 15-25%

### MEDIUM (Tuesday-Friday)
**Lie distribution: 1-2 inferential, 1-2 relational**

Mix of single-fact catches and fact-combining. At least one lie requires combining two facts OR cross-referencing with a truth card.

```
MEDIUM EXAMPLE (relational lie):
Fact 1: "Smart lock accepts fingerprint OR code (no other methods)"
Fact 2: "Fingerprint reader was offline for maintenance"
Lie: "Lock opened via fingerprint at 3 AM"
Catch: Fact 1 says only fingerprint or code. Fact 2 says fingerprint offline.
       Need BOTH facts to realize fingerprint is impossible.
```

Other MEDIUM traits:
- Mix of direct and indirect facts
- 0-1 truth may sound slightly suspicious
- Mix of inferenceDepth 1 and 2
- Win rate target: 10-15%

### HARD (Saturday-Sunday)
**Lie distribution: 0-1 inferential, 2-3 relational**

Most lies require combining facts or card cross-reference. At most one single-fact catch.

```
HARD EXAMPLE (relational via card cross-reference):
Fact 3: "Washer door opened at 2:58 AM"
Truth card: "Control panel shows standard manual start at 3 AM"
Lie card: "Child lock was on - only override mode can start"
Catch: If child lock was on, only override works. But truth card shows
       NORMAL start, not override. Cards contradict each other.
       No single fact catches this - need the truth card.
```

Other HARD traits:
- Facts are indirect, require interpretation
- 1-2 truths sound suspicious (red herrings)
- At least 1 lie at inferenceDepth: 2-3
- Win rate target: 5-12%

### EXPERT (Future)
Reserved for time-based puzzles in Advanced mode. Not currently used.

---

## Scenario Archetypes

Vary the hook. Not every puzzle needs to be "suspicious activity at 2am."

### Suspicious Time (default, use sparingly)
Something happened at an odd hour.
- "Garage door opened at 2:17 AM"
- "Printer ran 16 pages at 3 AM"
- "Thermostat changed at midnight"

### Suspicious Quantity
An absurd amount of something.
- "Your fridge ordered 47 pounds of cheese. You're lactose intolerant."
- "The automatic feeder dispensed 15 meals. You only have one cat."
- "Your Roomba ran for 9 hours. Your apartment is 400 sq ft."

### Suspicious Contradiction
Two things that can't both be true.
- "Your thermostat thinks it's July. It's December."
- "Your doorbell saw you leave. Your fitness tracker logged 10,000 steps inside."
- "Your calendar said 'important meeting'. Your TV watched 8 hours of reality shows."

### Suspicious Sequence
A pattern that doesn't make sense.
- "The garage door opened 12 times in an hour. Your car never left."
- "Your smart lock cycled 47 times. You were 'asleep'."
- "The lights went disco mode. You blame the cat."

### Suspicious Purchase
An order that doesn't fit.
- "Your smart speaker ordered a kayak, scuba gear, and a wetsuit. You can't swim."
- "Your grocery order includes 14 pineapples. You're allergic."
- "Your pantry restock included 30 cans of anchovies. You hate fish."

### Pick Randomly
When generating puzzles, choose an archetype at random to ensure variety. The hook doesn't have to be time — it can be quantity, contradiction, sequence, or absurdity.

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

### Lie Difficulty Gradient
**All lies require inference.** No direct contradictions at any difficulty level.

The lie distribution depends on the difficulty level specified:
- **EASY:** 3 inferential lies (single-fact catches)
- **MEDIUM:** 1 relational + 2 inferential
- **HARD:** 2 relational + 1 inferential

**Relational lies** require players to:
- Combine Fact A + Fact B to realize the card is impossible
- OR notice that Card X + Card Y together create a contradiction
- OR understand a chain: "If Fact says X, and X implies Y, then card claiming Z is false"

**Inferential lies** require players to:
- Understand what the claim implies about a single fact
- Make one logical step (not just word-matching)

This ensures puzzles feel like detective work at all difficulty levels.

### CRITICAL: What Makes a Lie "Relational" vs "Inferential"

**The test: Can ONE Known Fact alone catch this lie?**
- If YES → it's **inferential** (or worse, direct contradiction)
- If NO, you need 2+ facts → it's **relational**

**WRONG (labeled "relational" but actually single-fact):**
```
Fact 1: "Guest codes have been disabled for 6 months"
Lie card: "Lock shows guest code entry at 2:14 AM"
```
This is NOT relational. Fact 1 alone catches it. The lie says "guest code used", the fact says "codes disabled." One fact. Single-step. Inferential at best.

**WRONG (labeled "relational" but actually single-fact):**
```
Fact 1: "All key fobs were in the charging station overnight"
Lie card: "Lock log shows key fob proximity unlock at 2:14 AM"
```
This is NOT relational. Fact 1 alone catches it. Fobs charging = no fob at door. One fact.

**RIGHT (truly relational — requires 2 facts):**
```
Fact 1: "Smart lock only accepts key fob OR guest code (no other methods)"
Fact 2: "All key fobs were in the charging station overnight"
Lie card: "Lock opened via key fob proximity at 2:14 AM"
```
Why relational: Fact 2 alone doesn't catch it (maybe there are other unlock methods?). You need Fact 1 (only fob OR code) + Fact 2 (fobs charging) to realize the fob claim is impossible.

**RIGHT (truly relational — requires card cross-reference):**
```
Truth card A: "Security camera shows empty porch at 2:14 AM"
Lie card B: "Lock log shows guest code entry at 2:14 AM (someone typed it)"
```
Why relational: No single Known Fact catches the lie. But if you played Truth A showing empty porch, then Lie B claiming someone typed a code is impossible — who typed it if no one was there?

**RIGHT (truly relational — inference chain):**
```
Fact 1: "All smart home commands required phone confirmation after midnight"
Fact 2: "Phone was in airplane mode from 11 PM to 6 AM"
Lie card: "Smart home auto-adjusted thermostat based on schedule"
```
Why relational: Fact 1 says commands need phone. Fact 2 says phone was offline. Chain: auto-adjust = command = needs phone = needs non-airplane mode = impossible.

### Red Herring Truths
**At least one truth should sound suspicious.** This prevents players from using "tone" as a tell.

- Truths can have defensive-sounding presentLines ("Must be a glitch", "I swear I was asleep")
- Truths can seem to contradict facts at first glance (but actually don't on careful reading)
- Not every confident-sounding card is a lie

### Indirect Known Facts
**Facts should require interpretation, not just matching.**

BAD (too direct):
> "Phone was in airplane mode all night"
> → Any phone-based card is obviously a lie

GOOD (requires inference):
> "Phone battery was at 100% at 6 AM after being plugged in at midnight"
> → Player must infer: if plugged in and full, was it used? Did airplane mode matter?

GOOD (combinatorial):
> "Router logged exactly 3 devices overnight: TV, thermostat, security camera"
> → Player must realize: if only 3 devices, a 4th device claim is false

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

## v1 Lite Axis Fields (Required)

Every card and lie MUST include these v1 Lite fields for the tiering system to work correctly.

### Card Fields

Each card MUST include these fields:

| Field | Type | Description |
|-------|------|-------------|
| `factTouch` | `1 \| 2 \| 3` | Which known fact (1, 2, or 3) this card addresses. Each truth addresses exactly one fact. Lies contradict their factTouch. |
| `signalRoot` | enum | Where the signal originates. See options below. |
| `controlPath` | enum | How the action was controlled. Options: `'manual'`, `'automation'`, `'remote'`, `'unknown'` |
| `claimShape` | enum | What kind of claim. Options: `'absence'` (what didn't happen), `'positive'` (what did happen), `'attribution'` (blaming something), `'integrity'` (system was working correctly) |
| `subsystem` | string | The subsystem this evidence relates to (e.g., `'climate'`, `'printer'`, `'garage'`) |

**signalRoot Options:**
- Cloud: `'koa_cloud'`
- Device: `'phone_os'`, `'device_firmware'`, `'camera_storage'`, `'wearable_health'`
- Network: `'router_net'`
- Human: `'human_partner'`, `'human_neighbor'`, `'human_self'`
- Physical: `'receipt_photo'`
- Unknown: `'unknown'`

### Lie Fields

Each lie entry MUST include these additional fields:

| Field | Type | Description |
|-------|------|-------------|
| `lieType` | enum | Must be `'inferential'` or `'relational'`. **Require 2 relational + 1 inferential.** |
| `inferenceDepth` | `1 \| 2 \| 3` | How many steps to catch: 1=single fact, 2=combine facts, 3=chain reasoning |
| `trapAxis` | enum | Why this lie is tempting. Options: `'coverage'` (patches a gap), `'independence'` (adds diversity), `'control_path'` (convenient alibi), `'claim_shape'` (seductive claim type) |
| `baitReason` | string | One sentence explaining why players will pick this lie |

### v1 Lite Constraints

1. **Coverage Partition**: Truth cards MUST cover all 3 facts. Each truth touches exactly one fact, forming partition {1, 2, 3}.

2. **Fact Overlap**: Each fact must be touched by at least 2 cards total (truths + lies). This ensures lies look viable.

3. **Independence Diversity**: Truth cards SHOULD have at least 2 different signalRoots. Avoid all truths from same source family.

4. **Trap Diversity**: Lies MUST use at least 2 different trapAxis values. Don't make all lies tempting for the same reason.

5. **P4+ Constraint (Dangerous Information)**: When a concern is triggered (two cards share a dimension), dodging that dimension should still expose the player to at least one lie. This creates a true dilemma where both "diversify" and "double down" strategies carry risk.

6. **No Direct Contradictions**: All lies require inference to detect. No word-matching gimmes.

7. **storyCompletions**: Use closing-energy barks only. No axis commentary, no evaluation in T3 barks.

8. **T2 Suspicion (System-Generated)**: After T2, the system auto-generates a suspicion line based on axis analysis (e.g., "Same system vouching twice. Interesting." or "Lot of automation doing the work for you."). This is NOT authored per-puzzle - it's derived from the v1 Lite fields. Your `sequences` barks should focus on the card relationship, not axis patterns.

### Example Card (Truth)

```typescript
{
  id: 'sleep_apnea',
  strength: 4,
  evidenceType: 'SENSOR',
  location: 'BEDROOM',
  time: '',
  claim: 'CPAP logged breathing irregularity, triggering comfort automation.',
  presentLine: "My CPAP machine logged a breathing issue. The smart home tried to help.",
  isLie: false,
  source: 'CPAP Monitor',
  // v1 Lite tags
  factTouch: 1,
  signalRoot: 'wearable_health',
  controlPath: 'automation',
  claimShape: 'positive',
  subsystem: 'climate',
}
```

### Example Lie Entry

```typescript
{
  cardId: 'temp_app',
  lieType: 'relational',  // Most lies should be relational
  inferenceDepth: 2,      // Requires combining 2 facts
  reason: 'Fact 1 says phone had no app activity. Fact 2 says all commands required phone confirmation. This card claims app sent a command — impossible.',
  // v1 Lite trap fields
  trapAxis: 'independence',
  baitReason: 'Offers a phone-based explanation that diversifies away from smart home automation.',
}
```

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

### Scenario Writing

**NO FORMULA.** Don't write `"[Time]. [Event]. KOA has locked X until you explain."` for every puzzle.

**Bad (formulaic, boring):**
- "3:12 AM. The thermostat changed. KOA has locked climate controls until you explain."
- "2:33 AM. Your wine cooler opened. KOA has locked the cooler until you explain."

**Good (creative, varied):**
- "Your fridge ordered 47 pounds of cheese. You're lactose intolerant. KOA has questions."
- "The garage door has opinions about your 3 AM activities. So does your car insurance."
- "Someone taught the vacuum to fear the kitchen. It's been hiding under the couch for six hours."

2-3 sentences. Set the scene with personality. Make the player smile before they start.

### Puzzle Naming

**Avoid the "The \<X\>" formula.** Don't name every puzzle "The 3 AM \<Thing\>" or "The \<Adjective\> Incident."

**Bad names (lazy, repetitive):**
- "The Thermostat Incident"
- "The 3 AM Sprinkler"
- "The Midnight Vintage"

**Good names (creative, punchy):**
- "Burgundy Heist"
- "Frozen Lawn"
- "Coffee Crimes"
- "Who Moved the Thermostat?"
- "Midnight Snack Attack"
- "The Fridge Knows"

Name should hint at the scenario with personality. Puns welcome. Questions work. Avoid generic "The X" constructions.

---

## Step 3: Design the Lies FIRST

**Work backward.** Don't generate cards randomly.

Decide: What 3 contradictions do you want players to catch?

### Lie Types (HARD MODE — 2 Relational Required):

**No direct contradictions.** Most lies require cross-referencing multiple pieces.

| Type | How to Catch | Difficulty | Required |
|------|--------------|------------|----------|
| `inferential` | Fact implies X, card implies not-X (one logical step) | **Medium** | **1 per puzzle** |
| `relational` | Requires combining 2+ facts OR cross-referencing cards | **Hard** | **2 per puzzle** |

### Relational Lie Patterns (use these):

**BEFORE writing a relational lie, apply this test:**
> "If I remove all other facts and cards, can THIS ONE FACT catch the lie?"
> If yes → NOT relational. Redesign.

**Pattern A: Multi-Fact Combination**
> Fact 1: "Router logged exactly 3 devices overnight"
> Fact 2: "Those devices were: TV, thermostat, camera"
> Lie: "Laptop connected to WiFi at 2 AM"
> ✓ TEST: Fact 1 alone? No — just says "3 devices", doesn't say which.
> ✓ TEST: Fact 2 alone? No — just lists devices, doesn't say "only these."
> ✓ RELATIONAL: Need BOTH to realize laptop wasn't one of the 3.

**Pattern B: Card Cross-Reference**
> Truth card: "Bedroom camera shows me in bed at 2:10 AM"
> Lie card: "Dashcam shows me driving at 2:15 AM"
> ✓ TEST: Any single Fact catches it? No — no fact mentions bedroom or driving.
> ✓ RELATIONAL: Player must notice these TWO CARDS contradict each other.

**Pattern C: Inference Chain (2+ facts)**
> Fact 1: "All smart home commands required phone confirmation after midnight"
> Fact 2: "Phone was charging in kitchen all night (never moved)"
> Lie: "Smart thermostat auto-adjusted at 3 AM from bedroom"
> ✓ TEST: Fact 1 alone? No — maybe they confirmed from kitchen.
> ✓ TEST: Fact 2 alone? No — maybe thermostat doesn't need confirmation.
> ✓ RELATIONAL: Need Fact 1 (needs phone) + Fact 2 (phone in kitchen) + inference (bedroom adjustment impossible).

**Anti-Pattern: FAKE Relational (actually single-fact)**
> Fact 1: "Guest codes have been disabled for 6 months"
> Lie: "Someone used a guest code at 2 AM"
> ✗ TEST: Fact 1 alone catches it. Codes disabled = can't use code.
> ✗ NOT RELATIONAL. This is single-fact inference at best.

### Rules:
- Follow the lie distribution for your difficulty level:
  - EASY: 2-3 inferential, 0-1 relational (at most 1 relational)
  - MEDIUM: 1-2 inferential, 1-2 relational (at least 1 of each)
  - HARD: 0-1 inferential, 2-3 relational (at least 2 relational)
- Use fixed strengths: 3, 4, 5 (one of each)
- Lies should NOT share keywords with facts they contradict
- No direct contradictions at any difficulty

### Verification (DO THIS FOR EACH LIE):
For each lie labeled "relational", ask:
1. Can Fact 1 alone catch this lie? If YES → not relational, redesign
2. Can Fact 2 alone catch this lie? If YES → not relational, redesign
3. Can Fact 3 alone catch this lie? If YES → not relational, redesign
4. Do you need 2+ facts OR card cross-reference? If NO → not relational, redesign

For each lie labeled "inferential", verify:
1. Does it require at least one logical step? (not just word-matching)
2. Can a single fact catch it with that logical step?

**BAD (word-matching):**
> Fact: "Laptop was asleep after midnight"
> Lie: "Laptop printed at 3 AM"
> Problem: Player just matches "laptop" — no thinking required

**BAD (single-step too easy):**
> Fact: "Phone was in airplane mode"
> Lie: "Phone app sent a command"
> Problem: Too obvious — anyone knows airplane mode = no apps

**GOOD (relational — multi-fact):**
> Fact 1: "Security camera recorded continuously"
> Fact 2: "No one was seen entering the office"
> Lie: "I walked to the printer at 3 AM"
> Why: Must combine "camera recorded" + "no one seen" = you weren't there

**GOOD (relational — inference chain):**
> Fact: "Smart home required biometric confirmation for all overrides"
> Lie: "The guest used voice command to adjust the lights"
> Why: Must understand guests can't do biometric confirmation

---

## Step 4: Write Known Facts

Known Facts are the player's tools for catching your lies. Write **exactly 3 facts** that:

- Enable deduction (connect to lies)
- Require inference (not trivial word-matching)
- Feel like data KOA would have (sensor logs, timestamps, patterns)
- **Are atomic** (ONE piece of information per fact)
- **Are non-redundant** (no two facts convey the same information)

### CRITICAL: Fact Atomicity

Each fact must be ONE piece of information. Do NOT bundle multiple facts together:

**BAD (multiple facts bundled):**
> "Phone was in airplane mode; tablet battery dead since 6 PM; laptop at office"
> Problem: This is THREE facts about three devices! Breaks 1:1 mapping.

**GOOD (atomic facts):**
> Fact 1: "Phone was in airplane mode all night"
> Fact 2: "Tablet battery died at 6 PM"
> Fact 3: "Laptop was at the office"

### CRITICAL: Fact Non-Redundancy

Facts must provide **unique, complementary** information. If two facts convey the same thing, relational lies become inferential:

**BAD (redundant — both specify the count):**
> Fact 1: "TV only accepts commands from the 3 registered devices"
> Fact 2: "Registered devices: phone, tablet, laptop. No other devices paired."
> Problem: Both facts say there are exactly 3 devices. Either fact alone catches
>          a lie about an unregistered device. NOT truly relational.

**GOOD (complementary — each adds unique info):**
> Fact 1: "TV only accepts commands from registered devices" (the rule)
> Fact 2: "Device pairing log shows: phone, tablet, laptop" (the list)
> Now: Fact 1 alone doesn't tell you WHICH devices are registered.
>      Fact 2 alone doesn't tell you ONLY registered devices work.
>      Need BOTH to catch an unregistered device lie. Truly relational.

### Fact Directness

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

**Trick quality (all difficulties):**
- [ ] Lies are TEMPTING (high strength 4-5, plausible claims)
- [ ] Lies are CATCHABLE (contradict facts with reasoning, not word-matching)
- [ ] No direct contradictions (all lies require at least one inference step)
- [ ] Player cannot win by ignoring Known Facts
- [ ] "Aha" moment requires genuine deduction

**Difficulty-specific checks:**

For **EASY** (2-3 inferential, 0-1 relational):
- [ ] At most 1 relational lie
- [ ] Facts are direct and clear
- [ ] No red herring truths

For **MEDIUM** (1-2 inferential, 1-2 relational):
- [ ] At least 1 of each type
- [ ] 0-1 truth sounds slightly suspicious
- [ ] Mix of direct and indirect facts

For **HARD** (0-1 inferential, 2-3 relational):
- [ ] At least 2 relational lies
- [ ] 1-2 truths sound suspicious (red herrings)
- [ ] Facts require interpretation (indirect)

**Relational lie verification (HARD/MEDIUM only — apply to each relational lie):**
- [ ] "Can Fact 1 alone catch it?" → Must be NO
- [ ] "Can Fact 2 alone catch it?" → Must be NO
- [ ] "Can Fact 3 alone catch it?" → Must be NO
- [ ] Need 2+ facts OR card cross-reference → Must be YES
- [ ] If any single fact catches a "relational" lie, REDESIGN the lie or facts

**Red herrings:**
- [ ] At least 1 truth sounds suspicious (defensive tone, seems to contradict a fact)
- [ ] Not all lies have defensive presentLines (some sound confident)
- [ ] Known Facts are indirect (require interpretation, not just matching)

**Fact Quality (CRITICAL):**
- [ ] Each fact is ATOMIC (one piece of information, no semicolons bundling multiple facts)
- [ ] Facts are NON-REDUNDANT (no two facts convey the same information)
- [ ] Facts are COMPLEMENTARY (relational lies genuinely need 2+ facts, not same info twice)

**Mechanics:**
- [ ] 3 truths, 3 lies (exactly 6 cards)
- [ ] Exactly 3 Known Facts (not 4-5, and not 3 facts bundled into fewer entries)
- [ ] Lie type ratio matches difficulty (MEDIUM: at least 1 of each type)
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
- [ ] `lies` array has entry for each lie with `cardId`, `lieType`, `inferenceDepth`, `reason`
- [ ] Lie types: exactly 2 relational + 1 inferential
- [ ] Each lie has `inferenceDepth` (1, 2, or 3)

**v1 Lite Fields (Required):**
- [ ] Each card has `factTouch` (1, 2, or 3)
- [ ] Each card has `signalRoot` from valid enum
- [ ] Each card has `controlPath` from valid enum
- [ ] Each card has `claimShape` from valid enum
- [ ] Each card has `subsystem` (non-empty string)
- [ ] Truths partition facts: collectively touch {1, 2, 3}
- [ ] Each fact touched by >= 2 cards total
- [ ] Each lie has `trapAxis` from valid enum
- [ ] Each lie has `baitReason` (non-empty string)
- [ ] At least 2 distinct `trapAxis` values across lies
- [ ] P4+ constraint: at least one concern scenario creates a dilemma

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

Base targets (all difficulties):
| Metric | Target | Why |
|--------|--------|-----|
| Random win rate | ~5% | With 3/3 ratio, must pick exactly 3 truths |
| Winning lines | 1 | Only one way to win (all 3 truths) |

Difficulty-specific win rate targets:
| Difficulty | Win Rate | FLAWLESS Rate | Notes |
|------------|----------|---------------|-------|
| EASY | 15-25% | 8-15% | More forgiving, clearer deductions |
| MEDIUM | 10-15% | 5-10% | Balanced challenge |
| HARD | 5-12% | 1-8% | Requires careful cross-referencing |

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

  scenario: `[NO FORMULA. Be creative. Set the scene with personality.]`,

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

**IMPORTANT: Do NOT copy this example verbatim.** This is a reference for structure and style only. You must create an **original puzzle** with:
- A different scenario (not garage door, thermostat, printer, or coffee maker)
- Different card IDs, claims, and presentLines
- Different Known Facts
- Different lie mechanics and reasoning
- Original KOA barks that fit YOUR scenario

Copying the example's scenario, cards, or barks defeats the purpose of puzzle generation.

```typescript
// DESIGN NOTES:
// - Lie A (garage_app): INFERENTIAL - claims phone opened garage, but fact says no app activity
// - Lie B (motion_garage): INFERENTIAL - claims no motion, but fact says motion detected
// - Lie C (security_cam): INFERENTIAL - claims camera was offline, but fact says it was recording
// - Anchor truth: browser_history (clearly matches "no activity after 11 PM")
//
// BALANCE:
//   Truths: browser_history(4) + sleep_tracker(3) + neighbor_testimony(3) = 10
//   All 3 truths: 50 + 10 + 2 (objection) = 62
//   Target: 57 → Margin of 5 points
//
//   Lies: motion_garage(5) + garage_app(4) + security_cam(3) = 12
//   1 lie case: 50 + 7 - 2 + 2 = 57 (CLOSE - just at target)
//   2 lies case: 50 + 4 - 4 - 2 = 48 (BUSTED)
//   3 lies case: 50 - 4 - 3 - 2 = 41 (BUSTED)
//
// v1 LITE AXIS DESIGN:
//   Truths: factTouch {1, 2, 3} partition
//   SignalRoots: wearable_health, phone_os, human_neighbor (diverse)
//   Concern scenario: If player picks garage_app + security_cam on T1/T2,
//     triggers "all_digital" or "same_system" concern

const PUZZLE_GARAGE: V5Puzzle = {
  slug: "garage-door",
  name: "The 2 AM Garage Door",

  scenario: `Your garage door opened at 2:17 AM. Your car stayed put. Nothing's missing. KOA finds this suspicious — and frankly, so does your neighbor's Ring camera.`,

  knownFacts: [
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
      time: "",
      claim: "Sleep tracker shows restless sleep around 2 AM",
      presentLine: "My sleep tracker logged restless sleep around 2. Tossing and turning. Dreaming about... not garages.",
      isLie: false,
      // v1 Lite fields
      factTouch: 2,
      signalRoot: "wearable_health",
      controlPath: "automation",
      claimShape: "positive",
      subsystem: "garage",
    },
    {
      id: "browser_history",
      source: "Browser History",
      strength: 4,
      evidenceType: "DIGITAL",
      location: "BEDROOM",
      time: "",
      claim: "Browser history: last activity 11:30 PM",
      presentLine: "Check my browser. Last thing I did was scroll Reddit at 11:30. Then I passed out. Like a normal person.",
      isLie: false,
      // v1 Lite fields
      factTouch: 1,
      signalRoot: "phone_os",
      controlPath: "manual",
      claimShape: "positive",
      subsystem: "garage",
    },
    {
      id: "neighbor_testimony",
      source: "Neighbor",
      strength: 3,
      evidenceType: "TESTIMONY",
      location: "EXTERIOR",
      time: "",
      claim: "Neighbor heard garage but saw no one outside",
      presentLine: "Mrs. Patterson heard the garage. Looked out. Saw nobody. Because I was in bed. Being asleep.",
      isLie: false,
      // v1 Lite fields
      factTouch: 3,
      signalRoot: "human_neighbor",
      controlPath: "manual",
      claimShape: "absence",
      subsystem: "garage",
    },
    // LIES (3)
    {
      id: "garage_app",
      source: "Garage App",
      strength: 4,
      evidenceType: "DIGITAL",
      location: "GARAGE",
      time: "",
      claim: "Garage app: manual override from phone at 2:17 AM",
      presentLine: "The app says I opened it from my phone. But I was asleep. Must be a glitch. Apps are buggy.",
      isLie: true,
      // v1 Lite fields
      factTouch: 1,
      signalRoot: "phone_os",
      controlPath: "remote",
      claimShape: "attribution",
      subsystem: "garage",
    },
    {
      id: "motion_garage",
      source: "Motion Sensor",
      strength: 5,
      evidenceType: "SENSOR",
      location: "GARAGE",
      time: "",
      claim: "Garage motion sensor: all clear, no movement overnight",
      presentLine: "The garage motion sensor logged nothing. Zero movement. If someone was there, it would know.",
      isLie: true,
      // v1 Lite fields
      factTouch: 2,
      signalRoot: "device_firmware",
      controlPath: "automation",
      claimShape: "absence",
      subsystem: "garage",
    },
    {
      id: "security_cam",
      source: "Security Camera",
      strength: 3,
      evidenceType: "SENSOR",
      location: "GARAGE",
      time: "",
      claim: "Security camera had a gap in recording around 2 AM",
      presentLine: "The security camera glitched out around 2. Missed that whole window. Convenient? Sure. But not my fault.",
      isLie: true,
      // v1 Lite fields
      factTouch: 3,
      signalRoot: "camera_storage",
      controlPath: "automation",
      claimShape: "integrity",
      subsystem: "garage",
    },
  ],

  lies: [
    {
      cardId: "garage_app",
      lieType: "inferential",
      reason: "Phone had no app activity after 11 PM. App usage requires phone activity.",
      // v1 Lite trap fields
      trapAxis: "independence",
      baitReason: "Offers phone-based explanation that diversifies from sensor data.",
    },
    {
      cardId: "motion_garage",
      lieType: "inferential",
      reason: "Motion WAS detected near the garage. This claims no motion.",
      // v1 Lite trap fields
      trapAxis: "claim_shape",
      baitReason: "Absence claim feels safe - 'nothing happened' is hard to disprove.",
    },
    {
      cardId: "security_cam",
      lieType: "inferential",
      reason: "Camera was recording all night with no gaps. This claims there was a gap.",
      // v1 Lite trap fields
      trapAxis: "coverage",
      baitReason: "Explains the camera gap that players wonder about.",
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
8. **Create original content** — never copy the example verbatim; invent new scenarios, cards, and barks
