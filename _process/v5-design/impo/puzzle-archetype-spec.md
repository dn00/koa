# Puzzle Archetype Spec — V5 Micro-Daily

Defines the rules for authoring V5 puzzles. Any puzzle matching this spec can be validated by `scripts/prototype-v5.ts`. LLM puzzle generators should follow this spec.

**Design Identity:** Micro-daily deduction puzzle. Wordle meets smart home interrogation. KOA is a passive-aggressive home AI, not a courtroom judge.

---

## Fixed Constants

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Cards | 6 | Small enough for daily puzzle, large enough for deduction |
| Lies | 2 | Forces meaningful deduction without overwhelming |
| Truths | 4 | Enough safe plays to win if deduction succeeds |
| Turns | 3 | Play 1 card per turn — tight, no filler |
| Starting Belief | 50 | Neutral starting point |
| Target | 55-62 | Primary difficulty lever |
| Type Tax | -2 | Penalty for same evidence type as previous card |
| KOA Flag | After T2 | KOA flags last played card for review |
| Stand By (truth) | +2 | Reward for confidence |
| Stand By (lie) | -4 | Punish for overconfidence |
| Withdraw | -2 | Safe but costly retreat |

### Evidence Types (4 types)

| Type | Description |
|------|-------------|
| DIGITAL | Browser history, app logs, email timestamps |
| SENSOR | Motion detectors, smart locks, dashcams |
| TESTIMONY | Partner statements, neighbor accounts |
| PHYSICAL | Physical objects, receipts, items |

### Card Attributes

Each card has:
- **id** — Unique snake_case identifier
- **strength** — 2-5 (determines scoring impact)
- **evidenceType** — DIGITAL, SENSOR, TESTIMONY, PHYSICAL
- **location** — Where the evidence is from
- **time** — When the evidence is from
- **claim** — What the card asserts (player sees this)
- **isLie** — true/false (hidden from player)

---

## Scoring

### Base Scoring
- **Truth:** +strength
- **Lie:** -(strength - 1)

### Type Tax
If current card's evidenceType matches previous card's type:
- Current card gets **-2** penalty (applied to base score)

### KOA Flag (System Check)
After Turn 2, KOA flags the T2 card for review:
- **Keep on Record (stand by):** +2 if truth, -4 if lie
- **Roll Back (withdraw):** -2 regardless

### Tiers

| Tier | Requirement | Description |
|------|-------------|-------------|
| FLAWLESS | belief ≥ target + 5 | Perfect play |
| CLEARED | belief ≥ target | Win |
| CLOSE | belief < target but close | Near miss |
| BUSTED | belief far below target | Clear loss |

---

## Lie Design Taxonomy

### Lie Type 1: DIRECT CONTRADICTION
The lie's claim directly contradicts a Known Fact.

**Example:**
- Known Fact: "Your phone showed no app activity after 11 PM"
- Lie claim: "Garage app triggered at 2:17 AM"
- Contradiction: 2:17 AM is after 11 PM

**Detection:** Player compares claim to Known Facts, finds impossible statement.

**Difficulty:** Easy — binary check.

### Lie Type 2: RELATIONAL CONTRADICTION
The lie's claim doesn't contradict Known Facts but contradicts another TRUTH card.

**Example:**
- Truth card: "Partner confirms you came to bed at 11 PM"
- Lie card: "Email draft saved at 11:30 PM shows work activity"
- Contradiction: If you were in bed at 11, you couldn't be working at 11:30

**Detection:** Player must cross-reference cards against each other, not just Known Facts.

**Difficulty:** Medium — requires synthesis.

### Lie Type 3: SELF-INCRIMINATING
The lie "proves" the player's guilt rather than innocence.

**Example:**
- Scenario: Printer ran at 3 AM, player claims to be asleep
- Lie claim: "Printer queue shows document sent from your laptop at 3 AM"
- Problem: This evidence PROVES you did it

**Detection:** Player asks "does presenting this help or hurt my case?"

**Difficulty:** Medium — requires understanding the scenario.

### Lie Type 4: IMPLAUSIBLE TIMELINE
The lie's claim is physically impossible given other facts.

**Example:**
- Known Fact: "Car never left the driveway"
- Lie claim: "Dashcam shows you arriving home at 2 AM"
- Problem: If car never left, you can't be "arriving"

**Detection:** Player traces logical implications.

**Difficulty:** Medium-Hard — requires inference.

### Lie Type 5: SUSPICIOUS SPECIFICITY
The lie's claim is suspiciously precise about something the player shouldn't know.

**Example:**
- Lie claim: "The garage door opened at exactly 2:17:34 AM due to a firmware glitch"
- Problem: How would you know the exact second and cause unless you were there?

**Detection:** Player notices the claim "explains too much."

**Difficulty:** Hard — requires reading tone/intent.

> **Implementation note (for LLMs / tools):**  
> In `scripts/v5-types.ts`, `LieInfo.lieType` is currently a narrow union:  
> `direct_contradiction | relational`.  
> When emitting puzzles:
> - Map **Lie Type 1: DIRECT CONTRADICTION** → `lieType: "direct_contradiction"`.
> - Map **Lie Types 2–5** (RELATIONAL, SELF-INCRIMINATING, IMPLAUSIBLE TIMELINE, SUSPICIOUS SPECIFICITY) → `lieType: "relational"`, and explain the specific flavor in `reason`.
> The validator (`scripts/prototype-v5.ts`) enforces:
> - ≤1 `direct_contradiction` lie, and
> - ≥1 `relational` lie,
> so every puzzle should encode exactly one direct-contradiction lie and one relational-style lie to match this taxonomy.

---

## Required Elements (every puzzle)

### 1. Scenario
A smart home incident KOA is investigating. Player is defending themselves.

**Good scenarios:**
- Something happened at night (printer, garage, thermostat)
- Evidence exists that could implicate the player
- Player has a claimed alibi

**Scenario must NOT:**
- Name which cards are lies
- Explain why the lies are fabricated
- Make the player obviously guilty

### 2. Known Facts (4-5 facts)
Established truths the player can use for deduction.

**Known Facts should:**
- Be ranges/constraints, not exact answers ("around 3 AM" not "at 3:07 AM")
- Create contradiction opportunities for lies
- Include at least 1 fact that directly contradicts a lie
- Include at least 1 fact that's contextual (doesn't directly identify lies)

**Known Facts must NOT:**
- Identify lies directly ("The email timestamp is wrong")
- Provide instructions ("Check the timestamps")

### 3. Lie Distribution
Exactly 2 lies with different detection methods:

| Lie Slot | Type | Strength | Purpose |
|----------|------|----------|---------|
| **PRIMARY** | DIRECT or RELATIONAL | 4-5 | Detectable through careful analysis |
| **SECONDARY** | SELF-INCRIMINATING or IMPLAUSIBLE | 4-5 | Requires different reasoning skill |

**Rules:**
- At least 1 lie should be DIRECT CONTRADICTION (catchable via Known Facts)
- At least 1 lie should require synthesis (RELATIONAL, SELF-INCRIMINATING, or IMPLAUSIBLE)
- Lies should have similar strength (both impactful if played)
- Lies should NOT be in the same evidence type (avoids "just skip DIGITAL" strategy)

### 4. Truth Distribution
Exactly 4 truths that enable winning.

| Truth Slot | Strength | Purpose |
|------------|----------|---------|
| **ANCHOR** | 4-5 | High value, clearly safe |
| **SUPPORT** | 3-4 | Medium value, safe |
| **SUPPORT** | 3-4 | Medium value, safe |
| **FILLER** | 2-3 | Low value but safe |

**Rules:**
- Best 3 truths must reach or exceed target
- Truths should span at least 3 evidence types (enables type tax avoidance)
- At least 1 truth should "sound suspicious" (red herring for intuitive players)

### 5. Type Tax Relevance
The puzzle must create type tax decisions.

**Requirements:**
- At least 2 truths share an evidence type with a lie
- Playing all truths optimally requires type diversity planning
- Greedy play (highest strength each turn) should trigger type tax at least once

### 6. KOA Flag Drama
The mid-run KOA flag (system check) should create genuine tension.

**Requirements:**
- If player plays optimally T1-T2, the T2 card should be a truth (objection is safe)
- If player plays suboptimally, T2 might be a lie (objection is dangerous)
- The highest-strength truth should be tempting to play early

---

## KOA Dialogue Design

### Opening Line
Sets the passive-aggressive tone. References the incident.

**Good:** "Sixteen pages. 3 AM. Your laptop. I'm not mad, I'm just... processing."
**Bad:** "Please present your evidence." (too formal, judge-like)

### Card-Specific Barks
Each card should have 1-2 KOA responses for when it's played.

**Barks should:**
- Reference the card's specific claim
- Maintain passive-aggressive tone
- NOT reveal truth/lie status
- Vary between skeptical, grudging acceptance, and pointed questions

**Example barks:**
- Truth: "The lock data checks out. The printer mystery remains." (grudging)
- Lie: "Your laptop. Your queue. 3 AM. Walk me through the logic." (skeptical but not accusatory)

### Flag Prompts
Per-card prompts for the KOA flag phase.

**Good:** "That 2:30 AM trip doesn't quite mesh with my logs. Keep it in your story or roll it back?"
**Bad:** "Are you sure about that?" (generic, courtroom-y)

### Verdicts
One line per tier (FLAWLESS, CLEARED, CLOSE, BUSTED).

**FLAWLESS:** Grudging acceptance, still suspicious
**CLEARED:** Acceptance with warning
**CLOSE:** Doubt remains, access denied
**BUSTED:** Full accusation with snark

---

## Variance Bands

| Parameter | Range | Notes |
|-----------|-------|-------|
| Target | 55-62 | Lower = easier |
| Lie strengths | 3-5 each | Higher = more punishing |
| Truth strengths | 2-5 | Mixed for interesting choices |
| Win rate (random play) | 15-40% | Not trivial, not impossible |
| FLAWLESS rate (random) | 5-15% | Mastery matters |
| Optimal win rate | 100% | Must be solvable |

---

## Difficulty Calibration

### Easy Puzzle (Tutorial)
- Target: 55-57
- Lies: Both DIRECT CONTRADICTION
- Known Facts: Clearly identify both lies
- Type distribution: Truths span 4 types (no tax pressure)
- Expected: 60-70% win rate with deduction

### Medium Puzzle (Standard Daily)
- Target: 57-60
- Lies: 1 DIRECT + 1 RELATIONAL or SELF-INCRIMINATING
- Known Facts: Identify 1 lie clearly, 1 requires synthesis
- Type distribution: Some type overlap creates tax decisions
- Expected: 40-50% win rate with deduction

### Hard Puzzle (Challenge)
- Target: 60-62
- Lies: 1 RELATIONAL + 1 IMPLAUSIBLE or SUSPICIOUS SPECIFICITY
- Known Facts: Neither lie is obvious, both require reasoning
- Type distribution: Optimal play requires eating type tax once
- Expected: 25-35% win rate with deduction

---

## Backward Generation Process

### Step 1: Choose the incident
What suspicious thing happened? When? Where?
- Printer at 3 AM
- Garage door at 2 AM
- Thermostat changed at midnight
- Package delivered while "asleep"

### Step 2: Define the player's claimed alibi
What does the player say happened?
- "I was asleep by 11 PM"
- "I never left my room"
- "My phone was off"

### Step 3: Write Known Facts first
Create 4-5 facts that:
- Establish the incident timeline
- Support the player's alibi
- Create at least 2 contradiction opportunities

### Step 4: Design lies backward
For each lie slot:
1. Pick a lie type (DIRECT, RELATIONAL, etc.)
2. Write a claim that contradicts the appropriate fact/card
3. Assign strength (4-5)
4. Assign evidence type (different from other lie)

### Step 5: Design truths to fill gaps
Create 4 truths that:
- Support the alibi
- Don't contradict each other
- Span multiple evidence types
- Include at least 1 "red herring" (sounds suspicious but isn't)

### Step 6: Set target
Calculate:
- Best 3 truths total = X
- With objection stand = X + 2
- Target should be ≤ X + 2 (winnable with perfect play)
- Target should be > X - 3 (not trivially easy)

### Step 7: Write KOA dialogue
- Opening line
- Card-specific barks (truth and lie variants)
- Objection prompts per card
- Verdicts per tier

### Step 8: Validate
Run `npx tsx scripts/prototype-v5.ts` to verify:
- Win rate in bands
- Order matters (type tax creates variance)
- Lies are detectable through deduction

---

## Semantic Invariants

| ID | Rule |
|----|------|
| S1 | Scenario must not identify lies |
| S2 | Known Facts must not directly name lies |
| S3 | Truth cards must not contradict each other |
| S4 | KOA barks must not reveal truth/lie status |
| S5 | Lies must be deducible from Known Facts + card claims |
| S6 | At least 1 lie requires synthesis (not just fact-checking) |
| S7 | Red herring truths must have genuine misdirection value |
| S8 | Verdicts must not reveal optimal strategy |

---

## Example Puzzle Structure

```
SCENARIO: Garage door opened at 2:17 AM. Car didn't move. You were "asleep."

KNOWN FACTS:
1. Garage door opened around 2:15 AM
2. Your phone showed no app activity after 11 PM
3. Motion was detected near the garage around 2 AM
4. Car never left the driveway

CARDS:
1. sleep_tracker (str 3, SENSOR, truth) - "Restless sleep around 2 AM"
2. browser_history (str 4, DIGITAL, truth) - "Last activity 11:30 PM"
3. neighbor_testimony (str 3, TESTIMONY, truth) - "Heard door, saw no one"
4. car_dashcam (str 3, SENSOR, truth) - "No movement in garage"
5. garage_app (str 4, DIGITAL, lie) - "Phone triggered at 2:17 AM" [contradicts KF2]
6. motion_garage (str 5, SENSOR, lie) - "No movement detected" [contradicts KF3]

TARGET: 57

LIE ANALYSIS:
- garage_app: DIRECT CONTRADICTION with KF2 (phone activity after 11 PM)
- motion_garage: DIRECT CONTRADICTION with KF3 (motion was detected)

OPTIMAL PLAY:
- T1: browser_history (4) = 54
- T2: neighbor_testimony (3) = 57, stand = 59
- T3: sleep_tracker (3) = 62 (FLAWLESS)
- Avoided: garage_app, motion_garage (lies), car_dashcam (lower priority)
```

---

## Checklist (run before validator)

### Semantic Checks
- [ ] S1: Scenario does not identify lies
- [ ] S2: Known Facts don't name lies directly
- [ ] S3: Truths don't contradict each other
- [ ] S4: KOA barks don't reveal truth/lie status
- [ ] S5: Both lies are deducible
- [ ] S6: At least 1 lie requires synthesis
- [ ] S7: Red herring truth exists and misleads
- [ ] S8: Verdicts don't reveal strategy

### Mechanical Checks
- [ ] 6 cards total (4 truths, 2 lies)
- [ ] Lies have different evidence types
- [ ] Truths span ≥3 evidence types
- [ ] Best 3 truths + objection ≥ target
- [ ] Target is achievable with perfect play

Then run `npx tsx scripts/prototype-v5.ts` for full validation.
