# D29 — PLAYER-FACING RULES CARD (Daily Puzzle Contract) v3.0

**Status:** Draft v3.0 (ship-blocking)
**Owner:** Product / UX
**Last Updated:** 2026-01-26
**Purpose:** Player-visible rulebook for Daily mode. This is the contract: everything here is explicit, nothing is hidden. The same inputs always produce the same results.
**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md

---

## 0) What this game is

**Home Smart Home** is a 5-minute daily logic puzzle where a smart-home AI (KOA) blocks a device (like your fridge) until you prove—using evidence cards—that your action is "allowed."

You win by **reducing Resistance to 0** AND **addressing all of KOA's concerns** before you run out of turns.

**One-sentence pitch:**
> "Build your alibi one piece at a time, but KOA cross-examines every claim — and you can see her counter-evidence before you commit."

---

## 1) Your goal (Win / Loss)

### You win when:

* **Resistance reaches 0**, AND
* **All concerns are addressed** (KOA's questions are answered)

### You lose when:

* You reach **Turn 0** and resistance is still above 0 or concerns remain unaddressed, OR
* **Scrutiny reaches 5** (your story fell apart)

---

## 2) What you see on screen

### A) The KOA Monitor (Top HUD)

* **Target Device**: what's locked (FRIDGE, COFFEE, DOOR, etc.)
* **Resistance**: a bar (must reach 0)
* **Turns Remaining**: how many submissions you have left (usually **6**)
* **Scrutiny**: a meter from **0 to 5** (risk pressure — 5 = you lose)
* **Concerns**: what KOA needs you to prove
  Examples: "Prove you're you." "Prove you're awake." "Prove you meant to do this."

### B) KOA Avatar (Center)

KOA's avatar is always present. Her **mood** indicates how your case is going:
* **NEUTRAL** — Game start
* **CURIOUS** — Evaluating your cards
* **SUSPICIOUS** — Minor contradictions detected
* **BLOCKED** — Major contradiction, can't proceed
* **GRUDGING** — You refuted her counter
* **IMPRESSED** — Clean submission
* **RESIGNED** — You're winning
* **SMUG** — You're losing

KOA's lines are flavor, not rules. The rules are always deterministic.

### C) Counter-Evidence Panel

Shows KOA's ammunition:
* **Counter-evidence cards** that challenge your evidence
* What proof types each counter targets
* Whether each counter has been refuted

### D) Committed Story (Timeline)

Shows everything you've already submitted:
* Cards in your story
* Time ranges and claims
* Helps you avoid contradictions

### E) Evidence Panel (Bottom)

* Your **6 dealt cards** (you don't pick them — same for all players today)
* **SUBMIT button**: play 1-3 cards
* **Preview**: shows damage, concerns addressed, KOA's response, and any contradictions

---

## 3) Key terms (plain language)

### Resistance

The lock's "stubbornness." Starts at **35** (Normal). You must reduce it to **0**.

### Evidence Cards

Your proof (receipts, logs, sensor readings, photos). Each card has:

* **Power** (a number): how much damage it deals if accepted
* **Proves**: which concerns it addresses (IDENTITY, ALERTNESS, etc.)
* **Claims**: what it says about your timeline
  * Time range (e.g., "2:05am to 2:10am")
  * Location (e.g., KITCHEN)
  * State (e.g., AWAKE)

### Concerns

What KOA needs you to prove. All must be addressed to win.

| Concern | KOA asks |
|---------|----------|
| IDENTITY | "Prove you're you." |
| ALERTNESS | "Prove you're awake." |
| INTENT | "Prove you meant to do this." |
| LOCATION | "Prove you're actually home." |
| LIVENESS | "Prove you're not a photo." |

### Counter-Evidence

KOA's challenges. When you submit evidence that matches a counter's target:
* Your evidence is **contested** (deals only 50% damage)
* Use a **refutation card** to nullify the counter

### Refutation Cards

Special evidence that proves KOA's counter is wrong:
* Nullifies the counter (it no longer applies)
* Restores damage from previously-contested cards
* Also deals its own damage

### Committed Story

Everything you've submitted becomes part of your "testimony on record."
* Future submissions are checked against your story
* Contradictions happen when new cards conflict with your story

### Contradictions

When your cards make conflicting claims:

| Type | What it means | Effect |
|------|---------------|--------|
| **MINOR** | Suspicious but possible | +1 Scrutiny, allowed |
| **MAJOR** | Logically impossible | Blocked, can't submit |

Examples:
* MINOR: Asleep at 2:00, Awake at 2:07 (suspicious but you could wake up)
* MAJOR: Asleep at 2:00, Awake at 2:01 (impossible to wake that fast)

### Corroboration

When 2+ cards in your submission agree on a claim:
* Same location (both say KITCHEN)
* Same state (both say AWAKE)
* **Bonus: +25% damage**

### Scrutiny

A risk meter (0–5). It rises when:
* You submit with MINOR contradictions (+1 each)
* You use SKETCHY evidence (+1)

**Scrutiny 5 = instant loss.** KOA: "Your story fell apart under scrutiny."

---

## 4) How a Daily works (Phases)

A Daily puzzle has **two main phases**:

### Phase 1 — The Lock (Setup)

You see:
* the **Target** (what's locked)
* **Resistance** (how much damage you need to deal)
* **Concerns** (what KOA needs you to prove)
* **Turns** remaining
* **KOA's counter-evidence** (what she'll challenge)
* **Your 6 cards** (dealt to you — same for all players)

No draft. No selection. The puzzle is in the PLAY.

### Phase 2 — Solve (Turn-based)

Each turn:

1. **SELECT** 1-3 cards from your hand
2. **PREVIEW** shows:
   - Damage you'll deal
   - Concerns you'll address
   - Any contradictions with your story
   - Which counter KOA will play
3. **SUBMIT** your cards
4. **RESOLUTION**:
   - Cards checked against your story
   - KOA plays counter (if applicable)
   - Damage calculated and applied
   - Cards added to your story
   - Concerns marked as addressed

Repeat until you win or lose.

---

## 5) The core action: SUBMIT

### Step-by-step

1. Select **1, 2, or 3** cards from your hand
2. Check the preview (damage, contradictions, KOA's response)
3. Press **SUBMIT**

### What happens next (deterministic)

#### 1. Contradiction Check

Your cards are checked against your committed story:
* **MAJOR contradiction**: blocked, can't submit
* **MINOR contradiction**: allowed, but +1 Scrutiny

#### 2. KOA Responds

If any of your cards' proof types match a counter's targets:
* KOA plays that counter
* Those cards are **contested** (50% damage)

#### 3. Damage Calculation

For each card:
* Start with card's **Power**
* If contested: multiply by 0.5 (round up)
* Add to total

If 2+ cards share a claim (corroboration):
* Multiply total by 1.25 (round up)

**Resistance decreases** by the final damage.

#### 4. Concerns Addressed

Each card that proves a concern type marks that concern as addressed.
(Contested cards still address concerns — they just deal less damage.)

#### 5. Story Updated

Your submitted cards are added to your committed story.

---

## 6) Counter-Evidence and Refutation

### How counters work

KOA has counter-evidence that challenges your proof:

| Counter | Targets | Effect |
|---------|---------|--------|
| Security Camera | IDENTITY, LOCATION | "No one at door 2:07am" |
| Sleep Data | ALERTNESS | "User asleep until 2:30am" |
| GPS History | LOCATION | "Phone at gym until 1:50am" |

When you submit evidence that matches a counter's targets:
* That evidence is **contested**
* It deals only **50% damage**

### How refutation works

Refutation cards prove the counter is wrong:

| Refutation | Nullifies | Flavor |
|------------|-----------|--------|
| Maintenance Log | Security Camera | "Camera offline for firmware update" |
| Noise Complaint | Sleep Data | "Neighbor heard footsteps at 2:05am" |
| Phone Left Behind | GPS History | "Device at home while GPS shows gym" |

When you submit a refutation:
* The target counter is **nullified**
* All previously-contested evidence **restores its missing damage** (retroactive!)
* The refutation card also deals its own damage

**Example:**
- Turn 1: Submit Face ID (12 power), contested → 6 damage
- Turn 2: Submit Maintenance Log (5 power), refutes camera → 5 damage + 6 restored = 11 total

---

## 7) Damage Formula (complete)

```
total = 0

for each card:
    damage = card.power
    if card is contested AND counter not refuted:
        damage = ceil(damage × 0.5)
    total += damage

if 2+ cards share same claim:
    total = ceil(total × 1.25)

resistance -= total
```

**Rounding:** Always round UP (favors you).

---

## 8) Contradictions (timeline conflicts)

Your cards make claims about time, location, and state. If new cards conflict with your story:

### State Conflicts

| Conflict | Time Gap | Result |
|----------|----------|--------|
| ASLEEP ↔ AWAKE | <3 min | MAJOR (blocked) |
| ASLEEP ↔ AWAKE | 3-10 min | MINOR (+1 scrutiny) |
| ASLEEP ↔ AWAKE | >10 min | OK |
| DROWSY ↔ ALERT | <5 min | MINOR |

### Location Conflicts

| Conflict | Time Gap | Result |
|----------|----------|--------|
| HOME ↔ GYM | <20 min | MAJOR (blocked) |
| HOME ↔ GYM | 20-30 min | MINOR |
| BEDROOM ↔ KITCHEN | <30 sec | MAJOR |
| BEDROOM ↔ KITCHEN | 30 sec - 2 min | MINOR |

**KOA explains WHY it's suspicious:**
> "Deep sleep to fully alert in 5 minutes? Either you have superhuman reflexes, or something doesn't add up."

---

## 9) Corroboration (agreement bonus)

When 2+ cards in your submission share a claim:
* Same location (both KITCHEN)
* Same state (both AWAKE)
* Same activity (both WALKING)

**Bonus: +25% total damage**

KOA: "...Annoyingly consistent. Your evidence corroborates."

---

## 10) Scrutiny (risk meter)

Scrutiny tracks how suspicious your testimony looks.

| Event | Scrutiny |
|-------|----------|
| MINOR contradiction | +1 |
| SKETCHY card used | +1 |

**Scrutiny 5 = instant loss.**

KOA: "Your story fell apart under scrutiny. Too many inconsistencies. Access denied."

---

## 11) Turn structure (exact)

Each turn:

1. Select 1-3 cards
2. Preview shows outcome
3. Submit (or deselect and try again)
4. Resolution applies
5. Turns remaining decreases by 1
6. KOA logs the outcome

---

## 12) Worked example (one concrete turn)

**State:**
* Resistance = 28
* Scrutiny = 1
* Concerns: IDENTITY (addressed), ALERTNESS (not addressed)
* KOA's counter: Sleep Data (targets ALERTNESS, not refuted)

**Your hand includes:**
* Smart Watch (11 power, proves ALERTNESS, claims AWAKE 2:00-2:15am)
* Noise Complaint (6 power, refutes Sleep Data)

**You SUBMIT Smart Watch + Noise Complaint**

**Resolution:**
1. No contradictions with committed story ✓
2. KOA would play Sleep Data, but Noise Complaint refutes it!
3. Damage:
   - Smart Watch: 11 (not contested because counter refuted)
   - Noise Complaint: 6
   - No corroboration (different claims)
   - Total: 17
4. Resistance: 28 → 11
5. ALERTNESS: now addressed
6. Turn ends

---

## 13) What makes this a puzzle (strategy, not guessing)

Winning is about:

* **Sequencing**: When to play which cards
* **Counter management**: Refute vs. accept contested penalty
* **Corroboration hunting**: Find cards that agree for +25%
* **Contradiction avoidance**: Read your story before submitting
* **Scrutiny budgeting**: How many minor mistakes can you afford?

---

## 14) What Daily mode is NOT (to avoid confusion)

* It is not a chat sandbox. You do not type freeform arguments.
* KOA's dialogue is flavor, not a rules engine.
* You are not drafting cards (same 6 for everyone).
* There is no SCAN action (no card swapping).
* There are no "Ops moves" (Flag/Rewire/Exploit) in Daily v1.

---

## 15) Quick reference (one screen summary)

**Daily Flow:** Lock → Solve → Result
**Action:** SUBMIT (1-3 cards per turn)
**Win:** Resistance 0 AND all concerns addressed
**Loss:** Turns 0 OR Scrutiny 5
**Damage:** Power (50% if contested) + 25% if corroboration
**Refutation:** Nullifies counter, restores contested damage
**Contradictions:** MINOR = +1 scrutiny, MAJOR = blocked
**Cards:** 6 dealt (same for all players)
**Turns:** 6 (Normal difficulty)

---

## 16) Terminology mapping (player ↔ internal)

For engineering/content authors—player-facing terms map to internal terms:

| Player term | Internal term |
|-------------|---------------|
| Resistance | `lock_strength` |
| Concern | `proof_requirement` |
| Submit | `submit` |
| Evidence | `evidence_card` |
| Counter-Evidence | `counter` |
| Refutation | `refutation_card` |
| Corroboration | `claim_match_bonus` |
| Contested | `counter_penalty` |

---

## 17) What is NOT in Daily v1 (explicitly deferred)

These mechanics exist in design docs but are **not part of Daily MVP**:

* **Draft phase** (picking cards)
* **SCAN action** (swapping cards)
* **Reserve pool**
* **Audit penalty** (replaced by Scrutiny 5 = loss)
* **Ops Tokens** and extended moves (FLAG/REWIRE/EXPLOIT)
* **Multi-puzzle ladder** (Freeplay mode)

These may appear in **Freeplay mode** later.

---

## 18) Daily Intro Screen (what the player sees)

The intro screen is **minimal**. Full rules are one tap away.

### Visible by default:

```
DAILY: 2026-01-26 • Seed: KOA-1F9C

TARGET: FRIDGE
RESISTANCE: 35 → 0
TURNS: 6

KOA ASKS:
• "Prove you're you." (IDENTITY)
• "Prove you're awake." (ALERTNESS)
• "Prove you meant to do this." (INTENT)

KOA WILL CHALLENGE:
• Security Camera → "You're you"
• Sleep Data → "Awake"

YOUR HAND: 6 cards dealt

[ START DAILY ]        [ FULL RULES ]
```

---

## 19) Scoring and sharing

Your score is based on:

| Metric | Better Is |
|--------|-----------|
| Turns used | Fewer |
| Power dealt | Higher |
| Contradictions | Fewer (0 = perfect) |
| Counters refuted | More |

* Retries are unlimited.
* Share card shows your performance.

**Share card format:**
```
Home Smart Home • 2026-01-26
FRIDGE unlocked
Turns: 4/6
Power: 52
Contradictions: 0
Counters refuted: 2/2
```

---

## Implementation notes

1. This document is the **authoritative player-facing contract** for Daily mode.
2. Engineering uses internal terminology; UI uses player terminology.
3. Every rule shown maps 1:1 to D31 mechanics.
4. No mechanic used during play may be absent from this contract.
