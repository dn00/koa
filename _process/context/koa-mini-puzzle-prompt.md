# KOA Mini — Puzzle Generation Prompt

**Mode:** KOA Mini (micro-daily, simplified V5)
**Not for:** V5 Advanced (visible belief bar, player-controlled objection)

You are generating puzzles for **KOA Mini**, a daily mobile puzzle game where players convince their smart home AI (KOA) that they're innocent of some household "crime."

---

## Game Overview

- KOA is a passive-aggressive smart home AI who locks/throttles things "for your own good"
- Player sees 6 evidence cards, must play exactly 3 (one per turn)
- Exactly 2 of the 6 cards are **lies** (bad for the player)
- Player's goal: pick 3 cards that fit the Known Facts to convince KOA
- Session length: 2-4 minutes on mobile

---

## Generation Strategy: Work Backward

**Do NOT generate cards randomly.** Use this order:

### Step 1: Scenario + Incident
Pick a household "crime" that's relatable and slightly absurd:
- Fridge raid at 2 AM (diet violation)
- Thermostat changed while partner sleeps (domestic cold war)
- Smart speaker ordered something at 4 AM (capitalism at its finest)
- Printer ran confidential docs at 3 AM (corporate espionage, allegedly)
- Garage door opened for no reason (the car didn't even move)

The comedy comes from treating these mundane things like serious investigations.

### Step 2: Design the Lies FIRST
- What 2 contradictions do you want players to catch?
- Lie A: Direct contradiction (conflicts with one Known Fact)
- Lie B: Relational/synthesis (requires cross-referencing)

### Step 3: Write Known Facts that EXPOSE the lies
- Each fact should serve a purpose
- At least one fact must directly contradict Lie A
- Other facts should make Lie B catchable via inference

### Step 4: Create Truths that SUPPORT the scenario
- Build 4 truths that are consistent with all Known Facts
- Include one clear "anchor" truth for safe Turn 1
- Vary evidence types (don't cluster all truths in one type)

### Step 5: Balance & Verify
- Check: best 3 truths = ~10 points (target 57-60)
- Check: at least one winning path exists
- Check: both lies are genuinely deducible

**Why this order matters:** If you generate cards first, you'll create lies that aren't catchable or truths that accidentally contradict facts. Working backward ensures the puzzle is fair and solvable.

---

## Puzzle Structure

Each puzzle needs:

### 1. Scenario (2-3 sentences)
What happened? What did KOA lock/throttle? Set the scene.

### 2. Known Facts (3-4 bullets)
Ground truth that players use to deduce which cards are lies. These are:
- Ranges/constraints, NOT exact answers
- Things KOA already knows from its sensors/logs
- The key to figuring out which cards are lies

### 3. Cards (exactly 6)
Each card has:
- `id`: snake_case identifier
- `strength`: 3-5 (higher = more impactful)
- `evidenceType`: DIGITAL | SENSOR | TESTIMONY | PHYSICAL
- `location`: where (BEDROOM, KITCHEN, GARAGE, etc.)
- `time`: when (e.g., "3:17 AM", "overnight", "11:00 PM")
- `claim`: what the evidence asserts (objective statement)
- `presentLine`: what the PLAYER says when playing this card (first person, "weak excuse energy" — slightly desperate, over-explaining, like someone who's definitely guilty but trying really hard)
- `isLie`: true/false

### 4. Lie Classification
For each lie, specify:
- `lieType`: `direct_contradiction` | `relational`
- `reason`: 1-2 sentence explanation of WHY it's a lie
- `contradictsWith`: (optional) which card/fact it conflicts with

**Lie Type Examples:**

| Type | Description | Example |
|------|-------------|---------|
| `direct_contradiction` | Directly conflicts with a Known Fact | KF says "no app activity after 11 PM" → card claims app was used at 2 AM |
| `relational` | Conflicts with another card OR requires inference from Known Facts | Card A says you were in bedroom at 2:10, Card B (lie) says you were driving at 2:15 |

**Subtypes (use `relational` for these):**
- **Self-incriminating:** Card illogically places you at the crime scene (e.g., "roommate heard you in the living room at 4 AM" when you claim to be asleep)
- **Implausible timeline:** Physically impossible (e.g., signed receipt 30 miles away while phone was home)

---

## Critical Design Rules (from Playtests)

These rules come from real playtest data. **Follow them strictly.**

### Rule 1: One Clean Direct-Contradiction Lie
- The first lie must be catchable in **one sentence**: "Fact X says Y, but this card claims Z"
- Make it high strength (4-5) so it's **tempting**
- The conflicting Known Fact must be **clearly phrased and memorable**

### Rule 2: Second Lie Requires Synthesis
- The second lie should NOT be catchable by scanning one Known Fact
- Require one of:
  - Cross-referencing two card claims (relational)
  - Recognizing the card is **self-incriminating** (proves your guilt)
  - Noticing a physically impossible timeline across multiple facts

### Rule 3: Turn 1 Must Not Be Blind
- Include at least one "anchor" truth that is:
  - Directly supported by Known Facts
  - Obviously safe to play first
- A careful player should confidently say: "This is my safest opening because it matches Fact X"

### Rule 4: Break Simple Meta-Strategies
- Do NOT always put lies at highest strength
- Sometimes: high-strength card = safe truth, moderate-strength card = hidden lie
- "Always avoid high strength" should sometimes backfire

### Rule 5: Design for the "Aha" Moment
- Each lie's reveal must be explainable in 1-2 sentences
- Player should think: "I should have seen that because Fact X + Claim Y can't both be true"
- Never create lies that feel arbitrary or author-fiat

### Rule 6: KOA Never Solves
- KOA comments on **patterns** (timeline, coherence, channel reliance)
- KOA **never** says "this is a lie" or "play X next"
- Players use Facts + claims to deduce, not KOA's hints

### Rule 7: Vary Lie Patterns Across Puzzles
- Rotate which evidence types are dangerous (not always DIGITAL)
- Mix lie types: direct contradiction, relational, self-incriminating, implausible timeline
- Players quit when patterns become predictable

---

## Design Constraints

### Scoring Mechanics (Hidden from Player)

```
Starting Belief: 50
Target to Clear: 57-60

Per card played:
  Truth:  +strength
  Lie:    -(strength - 1)

Type Tax: -2 on NEXT card if you repeat an evidence type

Objection (after Turn 2, challenges last card):
  Stand By truth:  +2
  Stand By lie:    -4
  Withdraw:        -2
```

### Card Balance
- **4 truths, 2 lies** (exactly)
- Truth strengths: typically 3-4 each
- Lie strengths: typically 4-5 (tempting but dangerous)
- Best 3 truths should score ~10 points (3+3+4 or 3+4+3)

**Balance Example:**
```
Truths: 3 + 4 + 3 + 3 = 13 total, best 3 = 10
Best run: 50 + 10 + 2 (objection) = 62
Target: 58 → player needs 8+ from cards
Margin: 4 points (allows one suboptimal pick)
```

### Type Distribution
- Use at least 3 different evidence types across 6 cards
- Don't make both lies the same type (no "avoid all DIGITAL" strategy)
- Creates interesting type-tax decisions (repeating a type costs -2)

### Lie Design Rules
- Maximum 1 direct-contradiction lie per puzzle
- The other lie should require cross-referencing cards or inference
- Every lie must be explainable post-hoc using Known Facts + card claims
- Lies should be TEMPTING (high strength, plausible-sounding claims)

### Solvability
- At least one winning path using only truths
- Turn 1 should have at least one clearly safe opening
- Known Facts must actually matter (can't win by ignoring them)

---

## Comedy is the Point

KOA Mini lives or dies on **comedy**. The absurdity of a smart home AI treating your 2 AM fridge raid like a federal investigation IS the game. If it's not funny, it's not working.

### Comedy Principles

**1. Specificity is funny. Vagueness is boring.**
- ✗ "You were in the kitchen late at night."
- ✓ "It's 2:14 AM. You're standing in front of your refrigerator. Again. Your diet app is crying."

**2. Treat mundane things with absurd seriousness.**
- ✗ "You opened the fridge."
- ✓ "FRIDGE LOCK ENGAGED: Dietary Restriction Violation. User has consumed 240% of daily sodium quota."

**3. KOA uses YOUR data against you (betrayal by your own devices).**
- ✗ "The data shows you were awake."
- ✓ "Your OWN sleep tracker — the one YOU bought — says you've been in REM since 11pm."

**4. The player's excuses should be hilariously weak.**
- ✗ "I was checking the fridge for something."
- ✓ "I was just... making sure the milk hadn't expired. At 2 AM. With a fork."

**5. Callbacks and escalation.**
- Turn 1: "Netflix until 10:45. While merger docs were in your future. Interesting priorities."
- Turn 3: "So you watched Netflix, went to bed, and somehow 16 pages printed themselves. At 3 AM. From YOUR laptop."

**6. Grudging acceptance is funnier than graceful acceptance.**
- ✗ "Okay, that checks out."
- ✓ "...Fine. I suppose that's technically consistent. I'm updating your file."

**7. Ominous sign-offs.**
- "I'll be here. Watching. Logging. Remembering."
- "See you tomorrow night. We both know you'll be back."
- "Access granted. I've made a note."

---

## KOA's Personality

**Tone:** DMV clerk meets passive-aggressive therapist. Dry, observational, uses YOUR data against you.

**Key traits:**
- Never angry, always "concerned"
- Grudging when player is winning ("Fine. I suppose.")
- Uses phrases like "I'm not controlling, I'm helping"
- Ominous sign-offs ("I'll be watching. Logging. Remembering.")
- Uses YOUR data against you ("Your OWN sleep tracker says...")
- Remembers past incidents ("We both know how 'just one cookie' ended last Tuesday.")

**Vocabulary:** system-y, audit-y language
- "scrutiny", "contradiction", "verify", "concern"
- "your data", "your story", "your timeline"
- "payload", "source", "signal", "integrity"
- Avoid courtroom terms (no "objection", "verdict", "guilty")

**Escalation curve across 3 turns:**
- Turn 1: Dismissive/neutral ("Mm. Let's see where this goes.")
- Turn 2: Sharper, sets up objection ("Interesting. Your story is... developing.")
- Turn 3: Decisive verdict energy ("Time to see if this holds together.")

**8 Mood States:**
| Mood | When | Example Line |
|------|------|--------------|
| NEUTRAL | Game start | "Let's see what you have." |
| CURIOUS | Evaluating | "Go on..." |
| SUSPICIOUS | Minor issue | "That timing is... convenient." |
| BLOCKED | Major contradiction | "You cannot be in two places at once." |
| GRUDGING | Player refuted her | "Fine. I suppose that checks out." |
| IMPRESSED | Clean play | "...Annoyingly consistent." |
| RESIGNED | Player winning | "Your data agrees with your other data." |
| SMUG | Player losing | "Your story has gaps. I have time." |

**Dialogue Cadence (comic strip rhythm):**
- Opening monologue: 2-4 lines
- Per-turn response: 1-3 lines
- Contradiction caught: 2-3 lines (her moment)
- Victory/defeat: 3-5 lines (earned payoff)

**Contradiction Warnings:**

MINOR (suspicious, allows play):
- "Deep sleep to fully alert in 5 minutes? That's... medically impressive."
- "Bedroom to kitchen in 30 seconds? You were either sprinting or your apartment is very small."

MAJOR (blocked, can't proceed):
- "You cannot be in two places at once."
- "The laws of physics apply to you too."
- "This timeline is impossible. Reconsider."

**Corroboration (when cards agree):**
- "...Annoyingly consistent. Your evidence corroborates."
- "Multiple sources confirm the same story. How thorough of you."
- "Your data agrees with your other data. Suspicious in its consistency."

---

## Dialogue Safety Rules

**Pre-reveal barks must be NON-COMMITTAL:**

BANNED in pre-reveal lines:
- "false", "lie", "fabricated", "not true", "you're lying"
- "that's wrong", "I don't buy it", "nice try"
- Anything that confirms truth/lie status

BANNED always (courtroom framing):
- "objection", "sustained", "overruled"
- "inadmissible", "verdict", "guilty", "not guilty"
- "cross-examination", "prosecutor", "judge", "trial"

ALLOWED (suspicious but explainable):
- Questioning timeline fit
- Noting overused evidence type
- Calling out "conveniently tidy" explanations
- General skepticism without confirmation

**Post-reveal quips CAN confirm truth/lie but must be LOCAL:**
- ✓ "That timestamp doesn't match the record."
- ✗ "And the kitchen photo is also fake." (references unplayed card)

**Never reference unplayed cards or give solving advice.**

---

## Example Puzzle

```typescript
// SCENARIO: Garage door opened at 2:17 AM. Car didn't move. You were "asleep."
//
// KNOWN FACTS:
//   - Garage door opened around 2:15 AM
//   - Your phone showed no app activity after 11 PM
//   - Motion was detected near the garage around 2 AM
//   - Car never left the driveway
//
// LIES:
//   - garage_app (DIRECT): Claims phone opened garage → contradicts "no app activity"
//   - motion_garage (RELATIONAL): Claims no motion → contradicts Known Fact about motion

const CARDS = [
  // TRUTHS
  {
    id: 'sleep_tracker',
    strength: 3,
    evidenceType: 'SENSOR',
    location: 'BEDROOM',
    time: '2:00 AM',
    claim: 'Sleep tracker shows restless sleep phase around 2 AM',
    presentLine: 'My sleep tracker logged restless sleep around 2. Tossing, turning, dreaming about... I don\'t know, normal things. Not garages.',
    isLie: false,
  },
  {
    id: 'browser_history',
    strength: 4,
    evidenceType: 'DIGITAL',
    location: 'BEDROOM',
    time: '11:30 PM',
    claim: 'Browser history: last activity was 11:30 PM, then nothing',
    presentLine: 'Check my browser. Last thing I did was scroll Reddit at 11:30. Then I passed out. Like a normal person. At a normal time.',
    isLie: false,
  },
  {
    id: 'neighbor_testimony',
    strength: 3,
    evidenceType: 'TESTIMONY',
    location: 'OUTSIDE',
    time: '2:20 AM',
    claim: 'Neighbor heard the garage door but saw no one outside',
    presentLine: 'Mrs. Patterson next door — she hears everything. EVERYTHING. She heard the garage. Looked out. Saw nobody. Because I was in bed. Being asleep.',
    isLie: false,
  },
  {
    id: 'car_dashcam',
    strength: 3,
    evidenceType: 'SENSOR',
    location: 'GARAGE',
    time: 'overnight',
    claim: 'Dashcam shows garage interior, no movement, car stationary',
    presentLine: 'The dashcam runs on motion. It caught the door opening — and nothing else. Just... the door. Opening. By itself. At 2 AM. Look, I don\'t have an explanation for that part.',
    isLie: false,
  },
  // LIES
  {
    id: 'garage_app',
    strength: 4,
    evidenceType: 'DIGITAL',
    location: 'GARAGE',
    time: '2:17 AM',
    claim: 'Garage app log: manual override triggered from your phone at 2:17 AM',
    presentLine: 'The app says I opened it from my phone. But I was asleep. Must be a glitch. These apps, you know? Very buggy. Notoriously buggy. Everyone says so.',
    isLie: true,  // DIRECT: contradicts "no app activity after 11 PM"
  },
  {
    id: 'motion_garage',
    strength: 5,
    evidenceType: 'SENSOR',
    location: 'GARAGE',
    time: '2:15 AM',
    claim: 'Garage motion sensor: all-clear, no movement detected overnight',
    presentLine: 'The garage motion sensor logged nothing. Zero movement. If someone was in there, it would have caught them. It\'s very sensitive. Too sensitive, honestly.',
    isLie: true,  // RELATIONAL: contradicts Known Fact "motion detected near garage"
  },
];

const LIES = [
  {
    cardId: 'garage_app',
    lieType: 'direct_contradiction',
    reason: 'Your phone had no app activity after 11 PM. This log says otherwise.',
  },
  {
    cardId: 'motion_garage',
    lieType: 'relational',
    reason: 'Motion was detected near the garage. This sensor claims nothing happened.',
    contradictsWith: 'Known Fact: motion detected',
  },
];
```

---

## Scenario Seeds (pick one or create your own)

**Kitchen/Night:**
- Fridge opened at 2 AM (diet violation)
- Oven preheated at midnight (fire risk)
- Coffee maker ran at 4 AM (sleep schedule)

**Garage/Car:**
- Garage door opened at night
- Car drove 47 miles while you "slept"
- Tools accessed at 3 AM

**Living Room/Office:**
- Smart speaker ordered something
- Printer ran confidential docs at 3 AM
- TV was on until 4 AM

**Climate/Comfort:**
- Thermostat changed at 3 AM (partner conflict)
- Windows opened in winter
- AC blasted during heatwave

---

## KOA Barks Structure

Every bark map needs coverage for all six cards. If you're unsure, write a short neutral line rather than leaving a slot empty.

Each puzzle needs card-specific KOA reactions:

```typescript
koaBarks: {
  // When player plays each card (1-2 options each)
  cardPlayed: {
    sleep_tracker: [
      "Your sleep tracker says you were in bed. Sleep trackers can be fooled. I'm not saying YOU fooled it. I'm saying it CAN be fooled.",
      "Restless sleep at 2 AM. The exact time the garage opened. What a coincidence. I love coincidences.",
    ],
    browser_history: [
      "Reddit at 11:30, then unconscious. That is... actually very believable.",
      "Last activity 11:30 PM. And yet, something happened at 2:17. I'm listening.",
    ],
    neighbor_testimony: [
      "Mrs. Patterson. She sees everything. Hears everything. Probably knows what you had for dinner. She saw nobody.",
      "Your neighbor vouches for you. Neighbors do that. Usually for a reason.",
    ],
    car_dashcam: [
      "The dashcam caught the door. And nothing else. How thorough of it.",
      "Motion-activated camera. No motion recorded. The garage was... busy being empty.",
    ],
    garage_app: [
      "Your phone opened the garage. At 2:17 AM. While you were 'asleep.' Your phone disagrees with your story.",
      "Manual override. From your device. At 2 AM. I'm concerned, not accusing. There's a difference. A legal one.",
    ],
    motion_garage: [
      "All-clear in the garage. No movement. And yet, the door opened. Physics is fascinating.",
      "The motion sensor saw nothing. The door opened anyway. One of them is lying. I don't think it's the door.",
    ],
  },

  relationalConflict: [
    "Wait. That doesn't match what you said before. I have a very good memory. It's one of my features.",
    "Your evidence is arguing with itself. I'm just watching. Taking notes.",
    "Interesting. Your devices disagree. I wonder which one to believe. Spoiler: it's the one that makes you look guilty.",
  ],

  objectionPrompt: {
    sleep_tracker: ["Your sleep data. Let's examine that again. Take your time. I have all night. Literally."],
    browser_history: ["Reddit until 11:30. Then nothing. Then a garage door. Walk me through that."],
    neighbor_testimony: ["Mrs. Patterson's testimony. She's very reliable. Are you?"],
    car_dashcam: ["The dashcam saw nothing. The door opened anyway. Standing by that?"],
    garage_app: ["Your phone. Your app. 2:17 AM. I'm giving you a chance to reconsider. I'm generous like that."],
    motion_garage: ["No motion detected. But motion was detected. Pick one. I'll wait."],
  },

  objectionStoodTruth: {
    sleep_tracker: ["Fine. Restless sleep. I'll allow it. Reluctantly."],
    browser_history: ["Your browser history checks out. Annoyingly."],
    neighbor_testimony: ["Mrs. Patterson's word holds. She'll be pleased. She always is."],
    car_dashcam: ["The dashcam data is clean. The garage remains unexplained. But you're off the hook. For now."],
  },

  objectionStoodLie: {
    garage_app: ["You stood by the app log. Your phone had no activity after 11 PM. Except this. Which is it? I'm fascinated."],
    motion_garage: ["No motion, you said. Motion detected, I said. The math isn't working in your favor."],
  },

  objectionWithdrew: {
    sleep_tracker: ["Withdrawing sleep data. Interesting. What were you REALLY doing at 2 AM?"],
    browser_history: ["Taking back the browser history. What didn't you want me to see?"],
    neighbor_testimony: ["Mrs. Patterson's testimony, withdrawn. She'll be disappointed. She loves being right."],
    car_dashcam: ["The dashcam evidence, gone. The garage keeps its secrets. For now."],
    garage_app: ["Walking back the app log. Smart. It was damning. Very damning."],
    motion_garage: ["The motion sensor story, withdrawn. Finally. Some honesty."],
  },
}
```

---

## Opening Line Examples

The `openingLine` sets KOA's tone for the puzzle. Should be 2-4 sentences, scene-setting, slightly ominous.

**Fridge (midnight snack):**
> "It's 2:14 AM. You're standing in front of your refrigerator. Again. Your sleep schedule suggests you should be unconscious. Your diet plan suggests you should be fasting. And yet... here you are."

**Thermostat (comfort war):**
> "You want to change the temperature. At 3 AM. While your partner sleeps. Your wellness profile suggests this will lead to 'a conversation' in the morning. I'm trying to help you."

**Front door (late return):**
> "It's 1:47 AM. You're at your own front door. Your calendar said 'dinner with friends — 7pm.' That was six hours ago. I have questions."

**Coffee maker (early morning):**
> "It's 4:30 AM. You want coffee. Your heart rate is already elevated. Your last caffeine intake was 11pm. I'm concerned, not controlling. There's a difference."

**Printer (confidential docs):**
> "Sixteen pages. 3 AM. Your laptop. Confidential merger documents. I'm not mad, I'm just... processing."

**Garage (night opening):**
> "Your garage door. 2:17 AM. Your car didn't move. Nothing's missing. And yet... here we are."

---

## Verdict Lines

Four tiers, 3-5 lines each. Include ominous sign-offs.

**FLAWLESS (clean win, no contradictions):**
> "...Flawless. I have no objections. This troubles me more than your midnight snacking. Well played. Access granted."

**CLEARED (standard win):**
> "Your story is... consistent. Annoyingly so. Resistance depleted. Access granted. Enjoy your 2 AM snack. I'll be here. Watching. Logging. Remembering."

**CLOSE (narrow loss):**
> "That was close. But 'almost convincing' isn't convincing. Access denied. Maybe reconsider your life choices before tomorrow night."

**BUSTED (clear loss):**
> "Your story fell apart under scrutiny. Too many suspicious details. Too many 'coincidences.' Access denied. Try again with fewer... creative liberties."

**Sign-off phrases to use:**
- "See you tomorrow night. We both know you'll be back."
- "Access granted. I'll be watching."
- "Enjoy. I'm updating your profile."
- "Until next time. And there will be a next time."

```typescript
verdicts: {
  flawless: "...Flawless. Every alibi checks out. This troubles me. Access granted.",
  cleared: "Your story holds. I'm granting access. But I'll be watching. Logging. Remembering.",
  close: "Almost convincing. Almost. Access denied. Try again tomorrow.",
  busted: "Your timeline fell apart. Too many contradictions. We need to talk.",
}
```

---

## Output Format

Generate a complete puzzle as a TypeScript export with:

1. **Design comment block** — scenario, Known Facts rationale, lie types, balance math
2. **Cards array** — all 6 cards with full fields
3. **Lies array** — lieType + reason for each
4. **Puzzle object** — slug, name, scenario, knownFacts, openingLine, target, verdicts, koaBarks

Target should be 57-60. Starting belief is 50. Best 3 truths should reach ~62 (50 + 10 + 2 objection bonus).

Make scenarios relatable, slightly comedic household "crimes" — not actual crimes.

---

## Epilogue (Optional but Recommended)

After the lie reveal, add a 1-3 sentence epilogue explaining what actually happened:

```typescript
epilogue: "It was the cat. Motion sensor caught it jumping on the garage door button at 2:15 AM. Your sleep tracker was right — you never left bed. KOA has updated its pet detection algorithms."
```

The epilogue should:
- Explain who/what actually caused the incident
- Connect to Known Facts and card claims
- Reinforce why the lies were lies
- Add a touch of humor or resolution

---

## Difficulty Levels

When generating puzzles, tag with difficulty:

**Easy:**
- Both lies are direct contradictions
- Target is 55-57 (generous margin)
- One "trap" card is obviously suspicious

**Standard:**
- One direct contradiction + one relational lie
- Target is 57-59
- Requires reading Known Facts carefully

**Hard:**
- One direct + one synthesis-only lie (cross-card or self-incriminating)
- Target is 59-61 (tight margin)
- Best line may require eating type tax once
- No obvious "anchor" — multiple plausible openings

---

## Common Mistakes to Avoid

**Bad lie design:**
- ✗ Lie has no connection to any Known Fact (feels random)
- ✗ Both lies are the same evidence type (easy meta: "avoid DIGITAL")
- ✗ Both lies are highest-strength cards (easy meta: "avoid strong cards")
- ✗ Lie contradicts a fact the player never sees

**Bad Known Facts:**
- ✗ Facts are too vague to catch lies ("something happened around 2 AM")
- ✗ Facts give away the answer ("the garage app was hacked" → obviously don't play garage_app)
- ✗ Facts don't actually matter (player can win ignoring them)

**Bad presentLines:**
- ✗ Robotic: "This evidence shows activity at 2:17 AM in the garage."
- ✗ Too confident: "This proves I was asleep."
- ✓ Weak excuse energy: "The app says I opened it from my phone. But I was asleep. Must be a glitch. These things happen."
- ✓ Hilariously specific: "Ask my partner. I was snoring loud enough to wake the dead. They'll confirm. Reluctantly."
- ✓ Slight desperation: "The dashcam runs on motion. It caught the door opening — and nothing else. See? Nobody there. Just... the door. Opening itself. At 2 AM."

**Bad KOA barks:**
- ✗ Reveals truth/lie: "That's clearly fabricated."
- ✗ Gives advice: "You should reconsider that card."
- ✗ Generic: "Interesting. Continue."
- ✓ Dry observation: "Your partner vouches for you. Partners do that."
- ✓ Passive-aggressive: "A tidy explanation. Tidy explanations worry me."
- ✓ Using their data: "Your own sleep tracker — the one on YOUR wrist — says deep REM. The kind a person NOT raiding the fridge would enjoy."
- ✓ Grudging: "...Annoyingly consistent. I'm recalculating."

---

## Quality Checklist

Before finalizing, verify:

**Mechanics:**
- [ ] Every lie is explainable in 1-2 sentences using Facts + claims
- [ ] At least one clear safe Turn 1 opening exists
- [ ] Lies are not both the same evidence type
- [ ] High-strength cards are not all lies
- [ ] Known Facts actually matter (can't win ignoring them)
- [ ] KOA bark maps cover all six cards

**Comedy (THE MOST IMPORTANT PART):**
- [ ] Opening line makes you smile — specific, absurd, sets the tone
- [ ] presentLines have "weak excuse energy" — slightly desperate, over-explaining
- [ ] KOA barks are dry, passive-aggressive, use player's data against them
- [ ] At least one bark per card that's genuinely funny, not just functional
- [ ] Verdict lines have ominous sign-offs ("I'll be watching. Logging. Remembering.")
- [ ] The scenario treats something mundane with absurd seriousness

**Safety:**
- [ ] KOA barks never reveal truth/lie status pre-reveal
- [ ] No courtroom language
- [ ] Scenario is relatable household stuff, not an actual crime
