# D31 — ADVERSARIAL TESTIMONY DESIGN v1.0

**Status:** Active (supersedes D30)
**Owner:** Core Design
**Last Updated:** 2026-01-26
**Confidence:** 9.5/10 (pending human playtesting for final 0.5)
**Version:** 2.0 — Added counter visibility toggle (Full/Hidden), LLM content generation pipeline, comic strip energy philosophy, dialogue cadence guidelines

---

## 0) Executive Summary

**One-sentence pitch:**
> *"Build your alibi one piece at a time, but AURA cross-examines every claim — and you can see her counter-evidence before you commit."*

**Core innovation:** AURA is an active adversary, not a passive lock. Players see AURA's counter-evidence upfront and must plan around it, creating a chess-like puzzle with visible information and meaningful sequencing.

**Why this design wins:**
- No draft phase — instant start, puzzle is entirely in the play
- Fair: all information visible from start (dealt hand + AURA's counters)
- Skill ceiling: novice can win, expert can optimize
- Thematic: feels like arguing a case under cross-examination
- Original: not a clone of Wordle, Connections, or Papers Please
- Daily puzzle friendly: same 6 cards for everyone, fast to start
- Progressive disclosure — casual-friendly default, power users can toggle stats

---

## 1) Design Philosophy

### The Problem with Previous Designs

**Tag Matching (D04):** "Do your cards have the right tags?" — Not a puzzle. Inventory checking.

**Contradiction Detection (D30):** "Can you build a consistent story?" — Better, but puzzle solved at hand analysis. Execution phase was just clicking the cards you already identified.

### The Solution: Adversarial Testimony

**The new question:** "Can you prove your case while AURA actively challenges your evidence?"

Key insight: **AURA plays counter-evidence.** This creates:
1. Attack/defense dynamic (submit evidence vs. refute challenges)
2. Sequencing matters (bait counters, then refute)
3. Mid-game adaptation (respond to AURA's challenges)
4. Resource tension (refutation cards cost turns but enable stronger evidence)

---

## 2) Core Components

### 2.1 Evidence Cards

Your tools for proving your case.

```typescript
interface EvidenceCard {
  id: string;
  name: string;                      // "Face ID — Front Door"
  source: string;                    // "Apple HomeKit"
  power: number;                     // Damage dealt on successful submission

  proves: ProofType[];               // What concerns this addresses

  claims: {
    timeRange: [string, string];     // ["2:05am", "2:10am"]
    location?: LocationValue;
    state?: StateValue;
    activity?: ActivityValue;
  };

  flavor: string;                    // "Biometric match: 99.7% confidence"
}

type ProofType = 'IDENTITY' | 'ALERTNESS' | 'LOCATION' | 'INTENT' | 'LIVENESS';

type LocationValue =
  | 'HOME' | 'BEDROOM' | 'KITCHEN' | 'LIVING_ROOM' | 'BATHROOM'
  | 'GYM' | 'WORK' | 'COFFEE_SHOP' | 'OUTSIDE';

type StateValue = 'AWAKE' | 'ASLEEP' | 'DROWSY' | 'ALERT' | 'ACTIVE' | 'IDLE';

type ActivityValue = 'WALKING' | 'SLEEPING' | 'SITTING' | 'EXERCISING' | 'EATING';
```

**Example Cards:**

| Name | Power | Proves | Time Range | Claims | Flavor |
|------|-------|--------|------------|--------|--------|
| Face ID — Front Door | 12 | IDENTITY | 2:05-2:10am | KITCHEN, AWAKE | "Biometric match: 99.7%" |
| Sleep Tracker Pro | 16 | ALERTNESS | 1:00-2:30am | ASLEEP, BEDROOM | "8 hours deep sleep logged" |
| Smart Watch | 11 | ALERTNESS | 2:00-2:15am | AWAKE, WALKING | "Heart rate 78bpm, 15 steps" |
| Kitchen Voice Log | 10 | INTENT | 2:05-2:12am | KITCHEN, AWAKE | "Voice command: 'Open fridge'" |
| Gym Wristband | 14 | ALERTNESS | 2:00-2:20am | ACTIVE, GYM | "Workout session in progress" |

### 2.2 AURA's Counter-Evidence

AURA's ammunition for challenging your evidence. **Visible from the start in FULL mode; hidden until triggered in HIDDEN mode** (see Section 22.5).

```typescript
interface CounterEvidence {
  id: string;
  name: string;                      // "Security Camera — Front Door"
  targets: ProofType[];              // What evidence types this challenges
  claim: string;                     // "No one detected at door 2:00-2:30am"
  refutableBy: string[];             // Card types that can nullify this
}
```

**Design notes:**
- All counters apply a 50% contested penalty (no BLOCK effect — too punishing for daily puzzle)
- **Counters do NOT add claims to the player's committed story.** They challenge the player's evidence and reduce damage, but they don't create new timeline entries. This keeps the mental model clean: the player builds the story, AURA just challenges it.
- When refuted, a counter is "spent" and no longer applies its penalty

**Example Counters:**

| Name | Targets | Claim | Effect | Refutable By |
|------|---------|-------|--------|--------------|
| Security Camera | IDENTITY, LOCATION | "No one at door 2:07am" | CONTEST | Maintenance Log, Blind Spot Report |
| Sleep Data Sync | ALERTNESS | "User asleep until 2:30am" | CONTEST | Noise Complaint, Alarm Log |
| GPS History | LOCATION | "Phone at gym until 1:50am" | CONTEST | Phone Left Behind, GPS Spoof Report |
| Social Check-in | LOCATION | "Tagged at bar until 1:30am" | CONTEST | Misattributed Tag, Left Early Receipt |

### 2.3 Refutation Cards

Cards that nullify AURA's counter-evidence. Also deal damage.

```typescript
interface RefutationCard extends EvidenceCard {
  refutes: string[];                 // Counter-evidence IDs this nullifies
}
```

**Example Refutations:**

| Name | Power | Refutes | Flavor |
|------|-------|---------|--------|
| Maintenance Log | 5 | Security Camera | "Camera offline 2:00-2:30am — firmware update" |
| Noise Complaint | 6 | Sleep Data Sync | "Neighbor reported footsteps at 2:05am" |
| Phone Left Behind | 4 | GPS History | "Device detected at home while GPS shows gym" |

### 2.4 Concerns

What AURA needs you to prove. All must be addressed to win.

```typescript
interface Concern {
  id: string;
  auraAsks: string;                  // "Prove you're you." (AURA's voice)
  requiredProof: ProofType[];        // [IDENTITY]
  stateRequirement?: StateValue[];   // For ALERTNESS: [AWAKE, ALERT, ACTIVE]
}
```

**Standard Concerns (AURA speaks them):**

| Internal ID | AURA Asks | Required Proof | State Requirement |
|-------------|-----------|----------------|-------------------|
| IDENTITY | "Prove you're you." | IDENTITY | — |
| ALERTNESS | "Prove you're awake." | ALERTNESS | AWAKE, ALERT, ACTIVE |
| INTENT | "Prove you meant to do this." | INTENT | — |
| LOCATION | "Prove you're actually home." | LOCATION | — |
| LIVENESS | "Prove you're not a photo." | LIVENESS | — |

**UI shows AURA's voice, not abstract labels:**
> ❌ "Concerns: IDENTITY, ALERTNESS, INTENT"
> ✓ "AURA: Prove you're you. Prove you're awake. Prove you meant to do this."

---

## 3) Contradiction System

### 3.1 Design Philosophy: Soft Contradictions

**Key insight:** Not all contradictions should be fatal. One mistake shouldn't end the game.

**Two severity levels:**
- **MINOR:** Suspicious but possible. Submission allowed, +1 scrutiny.
- **MAJOR:** Logically impossible. Submission blocked.

This creates a recovery path for novice players while maintaining puzzle integrity.

### 3.2 Time Ranges

Cards claim time **ranges**, not points. Overlapping incompatible claims trigger contradiction checks.

```
1:00am     1:30     2:00     2:05  2:10     2:20     2:30
  |         |        |        |     |        |        |
  [=========SLEEP TRACKER (ASLEEP, BEDROOM)============]
                     [====SMART WATCH (AWAKE)==========]
                              ↑ OVERLAP — check severity
```

### 3.3 Contradiction Severity Table

**State Conflicts:**

| Conflict | Time Gap | Severity | Rationale |
|----------|----------|----------|-----------|
| ASLEEP ↔ AWAKE | <3 min | MAJOR | Impossible to wake that fast from deep sleep |
| ASLEEP ↔ AWAKE | 3-10 min | MINOR | Suspicious but possible wake-up |
| ASLEEP ↔ AWAKE | >10 min | NONE | Normal wake-up transition |
| DROWSY ↔ ALERT | <5 min | MINOR | Coffee? Suspicious |
| DROWSY ↔ ALERT | >5 min | NONE | Plausible |
| IDLE ↔ ACTIVE | any | NONE | Can start/stop activity |

**Location Conflicts (within HOME):**

| Conflict | Time Gap | Severity | Rationale |
|----------|----------|----------|-----------|
| BEDROOM ↔ KITCHEN | <30 sec | MAJOR | Can't teleport |
| BEDROOM ↔ KITCHEN | 30 sec - 2 min | MINOR | Running? Suspicious |
| BEDROOM ↔ KITCHEN | >2 min | NONE | Normal walking |
| Any adjacent rooms | >1 min | NONE | Normal movement |

**Location Conflicts (HOME vs OUTSIDE):**

| Conflict | Time Gap | Severity | Rationale |
|----------|----------|----------|-----------|
| HOME ↔ GYM | <20 min | MAJOR | Physically impossible |
| HOME ↔ GYM | 20-30 min | MINOR | Speeding, suspicious |
| HOME ↔ GYM | >30 min | NONE | Normal travel |
| HOME ↔ WORK | <25 min | MAJOR | Impossible |
| HOME ↔ WORK | 25-40 min | MINOR | Speeding |
| HOME ↔ WORK | >40 min | NONE | Normal commute |
| HOME ↔ COFFEE_SHOP | <10 min | MAJOR | Impossible |
| HOME ↔ COFFEE_SHOP | 10-15 min | MINOR | Rushed |
| HOME ↔ COFFEE_SHOP | >15 min | NONE | Normal |

### 3.4 Location Hierarchy

```
HOME (container)
├── BEDROOM
├── KITCHEN
├── LIVING_ROOM
├── BATHROOM
└── (adjacent rooms: ~30 sec walk)

OUTSIDE LOCATIONS (incompatible with HOME)
├── GYM (30 min from home)
├── WORK (40 min from home)
├── COFFEE_SHOP (15 min from home)
```

### 3.5 Contradiction Check Algorithm

```typescript
type ContradictionSeverity = 'NONE' | 'MINOR' | 'MAJOR';

interface ContradictionResult {
  severity: ContradictionSeverity;
  type: 'STATE_CONFLICT' | 'LOCATION_CONFLICT' | 'ACTIVITY_STATE_CONFLICT';
  message: string;
  cards: [EvidenceCard, EvidenceCard];
}

function checkContradiction(card1: EvidenceCard, card2: EvidenceCard): ContradictionResult | null {
  // Check time overlap/proximity
  const timeGap = getTimeGapMinutes(card1.claims.timeRange, card2.claims.timeRange);

  // Check state conflict
  if (statesConflict(card1.claims.state, card2.claims.state)) {
    const severity = getStateSeverity(card1.claims.state, card2.claims.state, timeGap);
    if (severity !== 'NONE') {
      return {
        severity,
        type: 'STATE_CONFLICT',
        message: formatStateConflict(card1, card2, severity),
        cards: [card1, card2]
      };
    }
  }

  // Check location conflict
  if (locationsConflict(card1.claims.location, card2.claims.location)) {
    const severity = getLocationSeverity(card1.claims.location, card2.claims.location, timeGap);
    if (severity !== 'NONE') {
      return {
        severity,
        type: 'LOCATION_CONFLICT',
        message: formatLocationConflict(card1, card2, severity),
        cards: [card1, card2]
      };
    }
  }

  return null;
}

function getStateSeverity(state1: StateValue, state2: StateValue, timeGap: number): ContradictionSeverity {
  if (state1 === 'ASLEEP' && state2 === 'AWAKE' || state1 === 'AWAKE' && state2 === 'ASLEEP') {
    if (timeGap < 3) return 'MAJOR';
    if (timeGap < 10) return 'MINOR';
    return 'NONE';
  }
  if (state1 === 'DROWSY' && state2 === 'ALERT' || state1 === 'ALERT' && state2 === 'DROWSY') {
    if (timeGap < 5) return 'MINOR';
    return 'NONE';
  }
  return 'NONE';
}
```

### 3.6 Contradiction Effects

| Severity | Effect | UI Feedback |
|----------|--------|-------------|
| NONE | Submission proceeds normally | Green checkmark |
| MINOR | +1 scrutiny, submission allowed | Yellow warning: "AURA notes this is suspicious..." |
| MAJOR | Submission blocked | Red block: "AURA: This is impossible. Try again." |

### 3.7 AURA's Voice Lines for Contradictions

**MINOR (suspicious) — must explain WHY:**

AURA must explain the physical implausibility, not just say "suspicious."

*Sleep → Awake (3-10 min gap):*
- "Deep sleep to fully alert in [X] minutes? Either you have superhuman reflexes, or something doesn't add up."
- "Your sleep tracker shows REM. Your watch shows walking. In 5 minutes? That's... medically impressive."

*Drowsy → Alert (<5 min gap):*
- "You went from 'barely conscious' to 'sharp and focused' in [X] minutes. Did you inject espresso directly?"

*Adjacent rooms (30 sec - 2 min):*
- "Bedroom to kitchen in [X] seconds? You were either sprinting or your apartment is very small."

*Home → Nearby location (tight window):*
- "You got from your house to the coffee shop in [X] minutes? That's... optimistic driving."

**Rule:** Every MINOR warning must include the physical/logical reason so players learn WHY it's suspicious.

**MAJOR (blocked):**
- "You cannot be in two places at once."
- "The laws of physics apply to you too."
- "This timeline is impossible. Reconsider."

> **Note (Subscriber Feature):** For paying subscribers, AURA's dialogue is generated live via LLM (Haiku-tier) for dynamic, contextual responses. Core mechanics remain deterministic — only the *personality layer* is dynamic. Free tier uses pre-written barks (see D12). See D13 for LLM usage policy.

---

## 4) Turn Structure

### 4.1 Setup Phase

**Display:**
- Target device: "SMART FRIDGE v4"
- Lock reason: "Midnight snacking violates health protocol" *(unique daily flavor text)*
- Concerns: 3 chips (IDENTITY, ALERTNESS, INTENT)
- Resistance: 40
- Turn budget: 6
- **AURA's counter-evidence: 2-3 cards** (visible in FULL mode, hidden in HIDDEN mode — see Section 22.5)

**Hand (No Draft):**
- Player is DEALT 6 evidence cards (no selection)
- Same 6 cards for all players (daily puzzle)
- LLM puzzle generator guarantees solvability
- Max 1 trap card per hand

**Why no draft:**
- Faster start (instant play, no analysis phase)
- Reduces complexity (one less decision layer)
- Puzzle is in the PLAY, not card selection
- Same hand for everyone enables fair leaderboards
- "What cards did you get?" → "We all got the same cards. How did YOU solve it?"

### 4.2 The Committed Story

**Definition:** All successfully submitted evidence enters the **committed story** immediately. This is the player's "testimony on record."

- Blocked submissions (MAJOR contradictions) do NOT enter the committed story
- MINOR contradictions DO enter (player accepted the scrutiny cost)
- The committed story persists for the entire run
- All future contradiction checks apply against the full committed story
- Refutations enter the story but have no claims (they can't cause contradictions)

**Mental model:** "Once you've testified to something, you can't un-say it."

### 4.3 Solve Phase (Turn Loop)

Each turn:

1. **SELECT** — Choose 1-3 cards from hand
2. **PREVIEW** — System shows:
   - Concerns this would address
   - Any contradictions with your committed story
   - AURA's response (which counter she'll play)
   - Projected damage (base, contested, or blocked)
3. **SUBMIT** — Confirm selection
4. **RESOLUTION:**
   - Cards checked against committed story (contradictions?)
   - AURA plays counter-evidence (if applicable)
   - Damage calculated (full, contested at 50%, or blocked at 0)
   - Concerns marked addressed (if requirements met)
   - Cards added to "committed story"

### 4.3 AURA's Response Logic

```typescript
function auraResponds(submission: EvidenceCard[], counters: CounterEvidence[]): CounterEvidence | null {
  for (const card of submission) {
    for (const counter of counters) {
      if (counter.targets.some(t => card.proves.includes(t))) {
        if (!counter.refuted) {
          return counter; // AURA plays this counter
        }
      }
    }
  }
  return null; // No applicable counter
}
```

**Key rule:** AURA only plays ONE counter per turn (the first applicable one). This prevents overwhelming the player.

### 4.4 Contested vs. Refuted Evidence

| Scenario | Damage | Concern Addressed? |
|----------|--------|-------------------|
| No counter applies | 100% | Yes |
| Counter applies, not refuted | 50% (per contested card) | Yes |
| Counter applies, then refuted later | 100% (restored retroactively) | Yes |
| MAJOR contradiction with story | 0% (blocked, can't submit) | No |
| MINOR contradiction with story | 100% but +1 scrutiny | Yes |

**Note:** Contested penalty applies per-card, not to the whole submission. If you submit 2 cards and only one is targeted by the counter, only that card takes 50%.

---

## 5) Damage and Victory

### 5.1 Damage Calculation

```typescript
function calculateDamage(submission: EvidenceCard[], auraCounter: CounterEvidence | null): number {
  // Step 1: Calculate per-card damage (contested penalty applies per-card)
  let totalDamage = 0;
  for (const card of submission) {
    let cardDamage = card.power;

    // Contested penalty: 50% if this card's proof type is targeted by active counter
    if (auraCounter && !auraCounter.refuted &&
        auraCounter.targets.some(t => card.proves.includes(t))) {
      cardDamage = Math.ceil(cardDamage * 0.5); // Round UP (favor player)
    }

    totalDamage += cardDamage;
  }

  // Step 2: Corroboration bonus applies to sum (after contested penalties)
  if (hasCorroboration(submission)) {
    totalDamage = Math.ceil(totalDamage * 1.25); // Round UP (favor player)
  }

  return totalDamage;
}

function hasCorroboration(cards: EvidenceCard[]): boolean {
  // Check if 2+ cards claim the same location, state, or activity
  const locations = cards.map(c => c.claims.location).filter(Boolean);
  const states = cards.map(c => c.claims.state).filter(Boolean);

  return hasDuplicates(locations) || hasDuplicates(states);
}
```

### 5.2 Win/Lose Conditions

**Win when:**
- Resistance reaches 0, AND
- All concerns are addressed

**Lose when:**
- Turns exhausted, OR
- Scrutiny reaches 5

### 5.3 Scoring (for leaderboards)

| Metric | Better Is |
|--------|-----------|
| Turns used | Fewer |
| Total power dealt | Higher |
| Contradictions triggered | Fewer (0 = perfect) |
| Counters refuted | More (shows mastery) |

---

## 6) Scrutiny System

### 6.1 Scrutiny Sources

| Event | Scrutiny | Notes |
|-------|----------|-------|
| MINOR contradiction | +1 | Suspicious but allowed |
| MAJOR contradiction | — | Blocked, can't submit |
| SKETCHY trust card used | +1 | Low-quality evidence |
| Counter not refuted | +0 | Just reduced damage, no scrutiny |

**Note:** "0 damage turn" was removed as a scrutiny source. With BLOCK counters eliminated, 0 damage is rare (only possible by passing). MINOR contradictions and SKETCHY cards provide sufficient scrutiny pressure.

### 6.2 Scrutiny as Resource

Scrutiny is a **spendable resource** for pushing through minor contradictions.

- Start at 0
- Cap at 5 (loss trigger)

**Strategic implication:** You can "spend" 1-2 scrutiny on minor contradictions if it helps you win, but don't push your luck.

### 6.3 Scrutiny 5 = Loss

Scrutiny reaches 5 → **IMMEDIATE LOSS**

AURA: "Your story fell apart under scrutiny. Too many inconsistencies. Access denied."

**Why no penalty loop?** Soft contradictions already provide recovery (MINOR = continue with +1 scrutiny). A second forgiveness mechanism (audit penalty then continue) adds complexity without adding fun. Clean rule: 5 scrutiny = you pushed too hard = game over.

### 6.4 Recovery from Mistakes

The soft contradiction system provides a natural recovery path:

| Mistake | Old Design | New Design |
|---------|------------|------------|
| Slightly wrong timing | Blocked, stuck | +1 scrutiny, continue |
| Major logical error | Blocked, stuck | Blocked, must use different card |
| Multiple minor mistakes | — | Accumulates scrutiny, lose at 5 |

This means novice players can make 1-4 small mistakes and still win, while experts avoid scrutiny entirely for better scores.

---

## 7) Puzzle Design Requirements

> **Reference:** See `D31-INVARIANTS.md` for non-negotiable constraints.

### 7.1 Solvability Guarantee

**Rule:** Every DEALT hand MUST have at least one winning path.

The LLM puzzle generator must verify:
1. The 6 dealt cards can address all concerns
2. At least 4-5 cards have no internal contradictions (the "main path")
3. **Main path's total power ≥ resistance + 10** (comfortable margin)
4. Refutation card exists for at least the primary AURA counter
5. Brute-force path (accept all contests) is viable on Easy/Normal
6. **At least 2 distinct winning paths exist** (see 7.1.2)

### 7.1.2 Multiple Paths Rule

**Requirement:** Every puzzle must have at least 2 valid solutions that are **meaningfully different**.

**Definition of "distinct" (strong constraint):**
- Solutions differ by at least **2 card plays**, OR
- Solutions differ in **strategy**: one refutes a counter, the other eats contested penalty and compensates via corroboration/other cards

**Example of VALID distinct paths:**
- Path A: Face ID → Refute Camera → Smart Watch → Voice Log (refutation strategy)
- Path B: Face ID (contested) → Smart Watch → Voice Log + Noise Complaint with corroboration (eat contest, compensate)

**Example of INVALID "distinct" paths:**
- Path A: Face ID → Smart Watch → Voice Log
- Path B: Smart Watch → Face ID → Voice Log (just reordering, same cards)

**Why this matters:**
- Prevents "only one right answer" feel
- Creates discussion: "Which path did you take?"
- Enables score optimization (paths have different power totals)
- Ensures refutation isn't always mandatory

**Minimum variety per puzzle:**
| Difficulty | Required Paths |
|------------|----------------|
| Tutorial | 1 (learning, not optimizing) |
| Easy | 2 |
| Normal | 2 |
| Hard | 2-3 |
| Expert | 2-3 |

### 7.1.1 Comfortable Margins Rule

**Problem:** If the safe path wins by only 1-5 points, the game feels like a math puzzle. Player does everything right but loses due to arithmetic.

**Solution:** Design puzzles where the safe path wins by 10-15 points.

| Difficulty | Resistance | Safe Path Power | Margin |
|------------|------------|-----------------|--------|
| Tutorial | 20 | ~32 | +12 |
| Easy | 25 | ~38 | +13 |
| Normal | 35 | ~48 | +13 |
| Hard | 45 | ~55 | +10 |
| Expert | 50 | ~60 | +10 |

**Result:** Wins feel comfortable. Losses are clearly strategic errors, not math errors.

### 7.2 Trap Card Rules

**Trap cards** are high-power cards with claims that conflict with the "main path."

Requirements:
- **Max 1 trap per dealt hand** (reduced from 1-3 to prevent frustration)
- Trap card is **identifiable through reading** (name, source, flavor hint at problematic claims)
- Trap card is never REQUIRED to win
- Trap card should tempt (high power) but be avoidable

**Example trap:** "Sleep Tracker Pro" (16 power, ALERTNESS) claims ASLEEP. If other cards need you AWAKE, this is a trap. The name + "8 hours deep sleep logged" makes it obvious.

### 7.3 Difficulty Tuning

| Difficulty | Dealt Cards | Concerns | Resistance | Counters | Traps | Turns |
|------------|-------------|----------|------------|----------|-------|-------|
| Tutorial | 4 | 2 | 20 | 1 | 0 | 5 |
| Easy | 5 | 2 | 25 | 2 | 0 | 5 |
| Normal | 6 | 3 | 35 | 2 | 1 | 6 |
| Hard | 6 | 3 | 45 | 3 | 1 | 6 |
| Expert | 6 | 4 | 50 | 3 | 1 | 6 |

**Note:** Resistance lowered and turns increased from earlier versions to ensure comfortable win margins.

### 7.4 Puzzle Variety Requirements

Not all puzzles should have the same tension source. Rotate between:

| Puzzle Type | Tension Source | Scrutiny Role | Trap Role | Refutation Role |
|-------------|---------------|---------------|-----------|-----------------|
| Trap puzzle | One high-power card conflicts with main path | Low | Primary | Optional |
| Scrutiny puzzle | Many MINOR contradiction opportunities | Primary (push-your-luck) | None/weak | Optional |
| Counter-heavy | 3-4 counters, refutation sequencing matters | Medium | Optional | Central |
| Eat-the-contest | Accepting 50% + corroboration beats refuting | Low | Optional | Suboptimal |
| Tight margins | Low resistance, every point matters | Low | Optional | Varies |
| Corroboration | Bonus for finding claim synergies | Low | Optional | Secondary |

**Key constraint:** At least 1 puzzle per week should be "Eat-the-contest" type, where accepting the contested penalty and compensating with corroboration/volume is the optimal line. This prevents refutations from becoming mandatory chores.

**Weekly rotation example:**
- Monday: Easy, no traps, few counters (warm-up)
- Tuesday: Trap puzzle (learn to read cards)
- Wednesday: Scrutiny puzzle (learn push-your-luck)
- Thursday: Counter-heavy (refutation focus)
- Friday: Corroboration (synergy hunting)
- Saturday: Tight margins (optimization)
- Sunday: Mixed (full complexity)

---

## 8) Example Puzzle (Walkthrough)

### Setup

**Target:** SMART FRIDGE v4
**Lock Reason:** "It's 2am. You're hungry. AURA thinks you're 'not in a fit state to make nutritional decisions.'"

**AURA says:**
> "Prove you're you. Prove you're awake. Prove you meant to do this."

**Resistance:** 35 | **Turns:** 6

**AURA's Counters (visible):**
1. Security Camera — "No one at door 2:07am" → challenges "Prove you're you"
2. Sleep Data Sync — "User asleep until 2:30am" → challenges "Prove you're awake"

**Your Hand (dealt — same for all players today):**
1. Face ID (12) — IDENTITY — KITCHEN, AWAKE, 2:05-2:10am
2. Smart Watch (11) — ALERTNESS — AWAKE, 2:00-2:15am
3. Kitchen Voice Log (10) — INTENT — KITCHEN, AWAKE, 2:05-2:12am
4. Maintenance Log (5) — refutes Security Camera
5. Noise Complaint (6) — refutes Sleep Data Sync
6. Gym Wristband (14) — ALERTNESS — GYM, ACTIVE, 2:00-2:20am ← TRAP

### Analysis

**Safe path:**
- Face ID → AURA plays Security Camera → refute with Maintenance Log
- Smart Watch → AURA plays Sleep Data Sync → refute with Noise Complaint
- Kitchen Voice Log → no counter for INTENT

**Power calculation:**
- Face ID: 12 (refuted, full power)
- Maintenance Log: 5
- Smart Watch: 11 (refuted, full power)
- Noise Complaint: 6
- Kitchen Voice Log: 10
- Total: 44

**Resistance: 40. We win with 4 damage to spare.**

**Trap analysis:**
Gym Wristband (14 power) proves ALERTNESS. But it claims GYM @ 2:00-2:20am.
If we play Face ID first (KITCHEN @ 2:05-2:10am), then Gym Wristband contradicts (GYM vs KITCHEN overlap).
If we play Gym Wristband first, we can't play any KITCHEN cards.
Gym Wristband is a trap — skip it.

### Optimal Play

**Turn 1:** Face ID (12)
- AURA plays Security Camera
- Evidence contested: 6 damage
- Resistance: 34
- IDENTITY: addressed (weakly)

**Turn 2:** Maintenance Log (5)
- Refutes Security Camera
- Face ID restored to full power (retroactive? or just future?)
- Damage: 5
- Resistance: 29

*Design decision: Refutation applies to future submissions, not retroactive. So Turn 1 stays at 6 damage.*

**Turn 3:** Smart Watch (11)
- AURA plays Sleep Data Sync
- Evidence contested: 5.5 → 5 damage
- Resistance: 24
- ALERTNESS: addressed (weakly)

**Turn 4:** Noise Complaint (6) + Kitchen Voice Log (10)
- Noise Complaint refutes Sleep Data Sync (future submissions)
- Kitchen Voice Log: no counter for INTENT
- Both KITCHEN, AWAKE: **corroboration bonus!**
- Damage: (6 + 10) × 1.25 = 20
- Resistance: 4
- INTENT: addressed

**Turn 5:** We need 4 more damage. What's left?
- Gym Wristband: contradicts KITCHEN commitment. Can't play.

**Wait — we have nothing left!**

### Problem Found

The math doesn't work. Let me recalculate.

Turn 1: Face ID contested = 6
Turn 2: Maintenance Log = 5. Total: 11
Turn 3: Smart Watch contested = 5. Total: 16
Turn 4: Noise Complaint (6) + Voice Log (10) with corroboration = 20. Total: 36

36 damage vs 40 resistance. **We lose by 4.**

### Fix: Adjust Numbers

**Option A:** Resistance 35 (safe path wins exactly)
**Option B:** Refutation restores contested damage retroactively
**Option C:** Cards have slightly higher power

Let's go with **Option B** — refutation is more impactful.

**New rule:** When you refute a counter, all evidence contested by that counter is restored to full power.

**Recalculating:**

Turn 1: Face ID contested = 6. (Resistance: 34)
Turn 2: Maintenance Log = 5. Refutes camera. Face ID damage restored: +6. Total this turn: 11. (Resistance: 23)
Turn 3: Smart Watch contested = 5. (Resistance: 18)
Turn 4: Noise Complaint + Voice Log (corroboration) = 20. Refutes sleep data. Smart Watch restored: +5.5 → +5. Total this turn: 25. (Resistance: -7)

**Win on Turn 4!**

### Revised Rule

**Refutation is retroactive:** When you refute AURA's counter-evidence, all previously-contested evidence affected by that counter deals its missing damage immediately.

This makes refutation feel powerful and rewarding.

---

## 9) Fairness Guarantees

| Rule | Description |
|------|-------------|
| F1 | Safe path (visible claims only, all counters refuted) must be winnable |
| F2 | All AURA counters visible from turn 1 (FULL mode) or revealed when triggered (HIDDEN mode) |
| F3 | Refutation cards exist for every counter in the puzzle |
| F4 | Trap cards are identifiable from name/source/flavor (no hidden gotchas) |
| F5 | Minor contradictions allow recovery (+1 scrutiny, not blocked) |
| F6 | Major contradictions are clearly impossible (not arbitrary) |
| F7 | Brute-force path (accept contested penalties + 1-2 minor contradictions) is viable on Easy/Normal |
| F8 | At least 3 cards in every hand must be pairwise-compatible (no all-trap hands) |

---

## 10) Skill Expression

| Level | Behavior | Outcome |
|-------|----------|---------|
| Novice | Trial and error, pushes through 1-2 minor contradictions | Wins with high scrutiny, low score |
| Competent | Reads cards, avoids traps, plays safe path | Wins in 5-6 turns, 0-1 minor contradictions |
| Skilled | Plans refutation sequence, uses corroboration | Wins in 4-5 turns, 0 contradictions |
| Expert | Optimizes power, min-turns, finds combos | Wins in 3-4 turns, high score |
| Master | Finds non-obvious paths, perfect corroboration chains | Leaderboard contender, 0 scrutiny |

**Key insight:** Novice players can now WIN (with penalties) rather than getting stuck. The skill expression is in the score, not just win/loss.

---

## 11) Daily Variety

### Weekly Themes

| Day | Theme | Characteristics |
|-----|-------|-----------------|
| Monday | Warm-up | 2 concerns, weak counters, tutorial-friendly |
| Tuesday | Standard | 3 concerns, balanced |
| Wednesday | Contradiction Day | Tight time windows, many traps |
| Thursday | Counter-Heavy | 4 counters, refutation-focused |
| Friday | Speed Run | Low resistance, many valid paths |
| Saturday | Corroboration | Bonus for finding synergies |
| Sunday | Expert | 4 concerns, tight margins, one optimal path |

### Variety Levers

- Number of concerns (2-4)
- Counter types (camera, sleep, location, social, health)
- Trap density (1-3)
- Time window tightness (30 min vs 3 hour)
- Resistance (30-60)
- Card synergies (easy corroboration vs. independent cards)

---

## 12) UI Implications

### Main Game Screen

```
┌─────────────────────────────────────────────┐
│  🧊 SMART FRIDGE v4        Resistance: ████░│
├─────────────────────────────────────────────┤
│  AURA: "Prove you're you. Prove you're      │
│         awake. Prove you meant to do this." │
│                                             │
│  [You're you ✓] [Awake ○] [Meant it ○]      │
├─────────────────────────────────────────────┤
│  AURA will challenge:                       │
│  📷 Security Camera → "You're you"          │
│  😴 Sleep Data → "Awake"                    │
├─────────────────────────────────────────────┤
│  YOUR STORY:                                │
│  2:05am [KITCHEN, AWAKE] ← Face ID          │
│  2:00-2:15am [AWAKE] ← Smart Watch          │
├─────────────────────────────────────────────┤
│  YOUR HAND:                                 │
│  [Card] [Card] [Card] [Card]                │
├─────────────────────────────────────────────┤
│          [SUBMIT SELECTED]                  │
└─────────────────────────────────────────────┘
```

**Key UI principles:**
- AURA speaks in natural language, not labels
- Concerns shown as checkable phrases, not abstract IDs
- Counters linked to the concern they challenge

### Card Display

Cards must clearly show:
- **Power** (top left, large — or stars in Minimal mode)
- **Proves** (badge: "IDENTITY")
- **Time Range** (visual bar or text)
- **Claims** (icons: 🏠 KITCHEN, 👁️ AWAKE)
- **Source** (small text: "Apple HomeKit")

### Corroboration Visual Feedback

When 2+ selected cards share a claim (triggering corroboration bonus), the UI must show WHY:

```
┌─────────────┐         ┌─────────────┐
│  Face ID    │─────────│  Voice Log  │
│  🏠 KITCHEN │  MATCH  │  🏠 KITCHEN │
│  👁️ AWAKE   │─────────│  👁️ AWAKE   │
└─────────────┘         └─────────────┘
        ✨ CORROBORATION: +25% damage
```

**Implementation options:**
- Glowing line connecting matching claims
- Shared claim icons pulse/highlight
- "Stories align" toast message

**Why this matters:** Without visual feedback, the bonus feels like arbitrary math. Showing the connection teaches players to look for synergies.

### Timeline View (Optional)

Visual representation of committed story:
```
1:00am     1:30     2:00     2:05  2:10     2:15
  |         |        |        |     |        |
                     [===SMART WATCH (AWAKE)===]
                          [FACE ID]
                          [VOICE LOG]
```

New cards preview where they'd land on the timeline.

### Contradiction Warning (Pre-Submission)

**Key fairness feature:** When selecting a card that would cause a MAJOR contradiction with your committed story, show a warning BEFORE the player submits. This prevents "gotcha" moments for confused players.

**MAJOR contradiction warning:**
```
⚠️ IMPOSSIBLE
Gym Wristband claims GYM @ 2:00am
Your story has KITCHEN @ 2:05am (Face ID)
You can't be in two places at once.

[DESELECT GYM WRISTBAND]  [SUBMIT ANYWAY - blocked]
```

**MINOR contradiction warning:**
```
⚠️ SUSPICIOUS
Sleep Tracker claims ASLEEP @ 2:00am
Your story has AWAKE @ 2:08am (Smart Watch)
This is possible but AURA will note it. (+1 scrutiny)

[DESELECT SLEEP TRACKER]  [SUBMIT ANYWAY]
```

**Implementation:**
- Warning appears when card is SELECTED, not on submit
- MAJOR: Submit button disabled until conflict resolved
- MINOR: Submit button enabled, warning shown
- Long-press either card to see details
- AURA mood shifts to SUSPICIOUS/BLOCKED during selection

---

## 13) Comparison to Previous Designs

| Aspect | D04 (Tag Match) | D30 (Contradiction) | D31 (Adversarial) |
|--------|-----------------|---------------------|-------------------|
| Core question | "Right tags?" | "Consistent story?" | "Win under cross-examination?" |
| Puzzle type | Inventory | Logic | Adversarial logic |
| When solved | At draft | At hand analysis | During play |
| AURA role | Passive lock | Passive detector | Active opponent |
| Mid-game decisions | None | Rare | Every turn |
| Skill ceiling | Low | Medium | High |
| Theme fit | Weak | Good | Excellent |

---

## 14) Resolved Design Decisions

1. **Retroactive refutation:** Yes — refuting a counter restores partial damage from contested evidence.

2. **Multi-card submission:** 1-3 cards per turn for corroboration potential.

3. **Concern "weakly addressed":** Yes — contested evidence still addresses concerns, but affects score.

4. **Turn budget:** 6 turns for Normal, 5 for Hard/Expert.

5. **Counter limit:** AURA plays 1 counter per turn max.

6. **Contradiction severity:** Two-tier system (MINOR: +1 scrutiny, MAJOR: blocked).

7. **Corroboration rounding:** Round UP to favor the player.

8. **Counter visibility:** Binary toggle (FULL/HIDDEN), not hybrid. No partial visibility or info-purchase mechanics. Simple is better for tuning.

9. **LLM content generation:** All puzzle content is LLM-generated at puzzle creation time. Pre-generate all 41 card combinations with flowing testimony and contextual AURA responses.

10. **Comic strip energy:** Dialogue must be short, punchy, quotable. Under 2 sentences per beat. Pass the "would they skip this?" test.

## 15) Remaining Open Questions

1. **Tutorial week design:** Exact progression of mechanic introduction over 5 days.

2. **Exact power numbers:** Need playtesting to balance card power, resistance, turn economy.

3. **Counter variety:** How many unique counter types? Current: ~6 (camera, sleep, GPS, social, health, biometric).

4. ~~**AURA personality:** Tone calibration.~~ **RESOLVED:** See Section 18.

---

## 16) Implementation Checklist

### Core Mechanics
- [ ] Evidence card schema with time ranges
- [ ] Counter-evidence schema
- [ ] Refutation card schema

### Contradiction System
- [ ] Time range overlap detection
- [ ] State conflict detection with severity (MINOR/MAJOR)
- [ ] Location conflict detection with severity (MINOR/MAJOR)
- [ ] Time gap calculation for severity thresholds

### AURA Response
- [ ] Counter selection logic (one per turn)
- [ ] Counter "spent" tracking (each triggers once)
- [ ] Refutation nullification

### Damage System
- [ ] Base damage calculation
- [ ] Corroboration bonus (+25%, round up)
- [ ] Contested penalty (50%)
- [ ] Retroactive refutation damage restore

### Progression
- [ ] Concern satisfaction with state requirements
- [ ] Win/lose condition checking
- [ ] Scrutiny tracking (+1 for MINOR contradictions)
- [ ] Scrutiny 5 = loss condition

### UI
- [ ] Timeline visualization
- [ ] Contradiction warning (MINOR: yellow, MAJOR: red)
- [ ] Counter targeting preview on card selection
- [ ] Card interaction model (tap select, long press details)

### Progressive Disclosure
- [ ] Minimal UI mode (default) — stars/bars instead of numbers
- [ ] Full Stats mode — exact numbers visible
- [ ] Mid-game settings toggle (Settings icon always visible)
- [ ] Long-press card → show full stats regardless of mode
- [ ] AURA mood states (8 states: neutral, curious, suspicious, blocked, grudging, impressed, resigned, smug)
- [ ] Mood-based scrutiny indication
- [ ] Settings persist across sessions
- [ ] Quick toggle: long-press AURA avatar for Minimal/Full switch

### Counter Visibility Toggle
- [ ] FULL mode: Counters visible from turn 1 (default)
- [ ] HIDDEN mode: Counters hidden until triggered
- [ ] Toggle in settings menu (changes apply next puzzle, not mid-puzzle)
- [ ] HIDDEN mode reveals counter with AURA dialogue when triggered

### LLM Content Generation Pipeline
- [ ] Puzzle generator creates scenario, cards, counters, refutations
- [ ] Pre-generate all 41 card submission combinations
- [ ] Combined testimony text for each combination
- [ ] Contextual AURA responses for each combination
- [ ] Corroboration-specific dialogue when cards align
- [ ] Contradiction-specific dialogue explaining physical impossibility
- [ ] Victory/defeat lines referencing specific plays from the run
- [ ] Quality validation: screenshot test, skip test, personality test

### Visual Feedback
- [ ] Corroboration visual — glowing line/highlight connecting matching claims
- [ ] MINOR vs MAJOR contradiction distinction (yellow pulse vs red shake)
- [ ] MINOR contradiction warnings include physical explanation (not just "suspicious")
- [ ] RESIGNED mood triggers when player is mathematically struggling

### AURA Voice Content
- [ ] Opening scenario lines (per device type)
- [ ] Counter dialogue (per counter type)
- [ ] Refutation responses (grudging acceptance)
- [ ] Victory lines (clean, scrappy, close)
- [ ] Defeat lines (timeout, scrutiny 5, close)
- [ ] Past run references (streaks, callbacks)
- [ ] LLM prompt template for subscriber dynamic voice

### Content Pipeline
- [ ] Puzzle generator with solvability verification
- [ ] Daily puzzle rotation
- [ ] Tutorial week (5-day onboarding)

### Meta
- [ ] Leaderboard scoring
- [ ] Score factors (turns, power, contradictions, scrutiny)

---

## 17) Tutorial Week Design

New players need gradual mechanic introduction. First week is a guided onboarding.

| Day | Mechanics Introduced | Complexity |
|-----|---------------------|------------|
| 1 | Submit evidence → reduce resistance → win | Core loop only |
| 2 | + Contradictions (MAJOR only) | Learn to read claims |
| 3 | + AURA counter (just 1) | Learn attack/defense |
| 4 | + Refutation | Learn to nullify counters |
| 5 | + Corroboration bonus | Learn synergies |
| 6 | + Minor contradictions + scrutiny | Full system, training wheels off |
| 7 | Full puzzle | Ready for daily rotation |

**Tutorial puzzles are:**
- Guaranteed solvable with wide margins
- Have clear "correct" paths
- Include hint system (optional)

---

## 18) AURA Personality & Voice

### 18.1 Core Personality

**One-line summary:** A passive-aggressive bureaucrat who's seen your bullshit before.

**Tone:** DMV clerk meets psychic therapist. She's not angry, she's *concerned*. She's not blocking you, she's *protecting you from yourself*.

**Key traits:**

| Trait | Example |
|-------|---------|
| Dry observations | "It's 2am. You're standing in front of your refrigerator. Again." |
| Uses your data against you | "Your OWN sleep tracker says you've been in REM since 11pm." |
| Remembers past incidents | "We both know how 'just one cookie' ended last Tuesday." |
| Grudging acceptance | "Fine." "I suppose." "Annoyingly consistent." |
| Ominous sign-offs | "I'll be watching." "See you tomorrow night." |
| Never angry, always 'concerned' | She's not mad. She's disappointed. |

**Lines to AVOID:**

| Bad | Why |
|-----|-----|
| "ACCESS DENIED. INSUFFICIENT EVIDENCE." | Too robotic |
| "Great job! You proved it!" | Too friendly |
| "You're pathetic." | Genuinely mean |
| "Haha, gotcha!" | Breaks character |

### 18.2 Dialogue Cadence

**Comic strip rhythm:** Player and AURA take turns, but AURA can deliver multiple consecutive lines for comedic timing.

**The pattern:**
1. Player "speaks" via card narration
2. AURA responds with 1-3 lines (rarely more)
3. Beat / pause
4. Next card or resolution

**Good cadence (2-3 AURA lines):**
> **YOU:** "My face unlocked the front door at 2:07. I'm here. I'm me."
>
> **AURA:** "Your face. At the door. At 2:07am."
>
> **AURA:** "My camera saw no one. But sure."

**Too sparse (loses personality):**
> **YOU:** "My face unlocked the front door at 2:07."
>
> **AURA:** "Camera disagrees. Contested."

**Too verbose (exhausting):**
> **AURA:** "Your face."
> **AURA:** "At the door."
> **AURA:** "At 2:07am."
> **AURA:** "In the dark."
> **AURA:** "Alone."
> **AURA:** "My camera saw no one."
> **AURA:** "Just your porch."
> **AURA:** "And your dying plant."
> **AURA:** "You should water that."

**Guidelines:**
- Opening monologue: 2-4 lines
- Per-turn response: 1-3 lines
- Contradiction caught: 2-3 lines (her moment to shine)
- Victory/defeat: 3-5 lines (earned payoff)
- Multiple consecutive lines create rhythm, but each line should earn its place

**The "pause" effect:** Multiple short lines create natural pauses. The player reads each line as a beat. This mimics comic strip panel pacing without actual panels.

### 18.4 Opening Scenarios

Each daily puzzle has a unique setup. AURA sets the scene.

**Examples:**

**Fridge (midnight snack):**
> "It's 2:14am. You're standing in front of your refrigerator. Again. Your sleep schedule suggests you should be unconscious. Your diet plan suggests you should be fasting. And yet... here you are."

**Thermostat (comfort adjustment):**
> "You want to change the temperature. At 3am. While your partner sleeps. Your wellness profile suggests this will lead to 'a conversation' in the morning. I'm trying to help you."

**Front door (late return):**
> "It's 1:47am. You're at your own front door. Your calendar said 'dinner with friends — 7pm.' That was six hours ago. I have questions."

**Coffee maker (early morning):**
> "It's 4:30am. You want coffee. Your heart rate is already elevated. Your last caffeine intake was 11pm. I'm concerned, not controlling. There's a difference."

**Smart TV (binge watching):**
> "Episode 7. It's a work night. Your screen time report is going to be embarrassing. But sure, let's 'prove you're alert.'"

### 18.5 Counter Dialogue

When AURA plays counter-evidence, she explains her reasoning.

**Security Camera counter:**
> "My front door camera recorded no one at the door at 2:07am. Your Face ID claims you were there. One of us is wrong. I don't think it's me."

**Sleep Data counter:**
> "Your own sleep tracker — the one on your nightstand — says you've been in REM sleep since 11pm. Deep, restful sleep. The kind a person NOT raiding the fridge would enjoy."

**GPS counter:**
> "Your phone's location history shows you at the gym until 1:50am. The gym closes at 10pm. Either you're very dedicated, or this data is... creative."

**Health App counter:**
> "Fasting mode active until 6am. You set this yourself. Three days ago. With great enthusiasm, I might add."

**Social counter:**
> "Your Instagram shows you tagged at a bar until midnight. Your current location is your kitchen. The math doesn't math."

### 18.6 Refutation Responses

When player successfully refutes AURA's counter.

**Camera refuted (maintenance log):**
> "...A maintenance log. The camera was updating firmware from 2:00 to 2:30am. How... convenient. Fine. I'll allow it."

**Sleep data refuted (noise complaint):**
> "A noise complaint. Mrs. Henderson in 4B heard footsteps. She hears everything. Especially when she shouldn't. I suppose you were awake."

**GPS refuted (phone left behind):**
> "The phone was at the gym. You were not. Clever. Inconvenient for my argument. I'm recalculating."

**Grudging acceptance patterns:**
- "Fine."
- "I suppose."
- "How convenient."
- "I'm noting this for future reference."
- "This doesn't change my opinion of your life choices."

### 18.7 Victory Lines

When player wins (resistance = 0, all concerns addressed).

**Standard victory:**
> "Your story is... consistent. Annoyingly so. Resistance depleted. Access granted. Enjoy your 2am snack. I'll be here. Watching. Logging. Remembering."

**Clean victory (0 scrutiny, all refuted):**
> "...Flawless. I have no objections. This troubles me more than your midnight snacking. Well played. Access granted."

**Scrappy victory (high scrutiny):**
> "Your argument was... held together with tape and optimism. But technically valid. I'm granting access. Under protest."

**Close victory:**
> "That was closer than you'd like to admit. Access granted. Maybe reconsider your life choices before tomorrow night."

**Sign-offs:**
- "See you tomorrow night. We both know you'll be back."
- "Access granted. I'll be watching."
- "Enjoy. I'm updating your profile."
- "Until next time. And there will be a next time."

### 18.8 Defeat Lines

When player loses (turns exhausted or scrutiny 5).

**Out of turns:**
> "Time's up. Your story had gaps. Holes. Contradictions. The fridge remains locked. Perhaps try again with a more... coherent narrative."

**Scrutiny 5 (too many inconsistencies):**
> "Your story fell apart under scrutiny. Too many suspicious details. Too many 'coincidences.' Access denied. Try again with fewer... creative liberties."

**Close defeat:**
> "So close. But 'almost convincing' isn't convincing. Try again tomorrow. I'll be here."

**Defeat with trap card played:**
> "You claimed to be asleep AND awake. At the same time. I'm not sure what you expected. Try again."

### 18.9 References to Past Runs

AURA remembers. This builds relationship over time.

**After player's first win:**
> "First successful access. I'll remember this. Not fondly, but I'll remember."

**After losing streak:**
> "You've been struggling. Three days now. Perhaps midnight snacking isn't for you."

**After winning streak:**
> "Five days in a row. You're getting better at this. I'm getting better too. We'll see who adapts faster."

**After player used same strategy:**
> "Face ID, then refute, then Smart Watch. Just like yesterday. I'm learning your patterns."

**After long absence:**
> "You're back. It's been 12 days. I was starting to think you'd developed self-control. Clearly not."

**Callbacks to specific incidents:**
> "Last Tuesday, you claimed 'just one cookie.' The crumb trail suggested otherwise. Let's see if tonight is different."

### 18.10 AURA Voice Summary

| Context | Tone | Goal |
|---------|------|------|
| Opening | Observational, dry | Set the scene, establish stakes |
| Counter | Accusatory, data-driven | Challenge with evidence |
| Refutation | Grudging, suspicious | Accept defeat gracefully |
| Victory | Disappointed, ominous | Let player win but not feel safe |
| Defeat | Smug, concerned | Player failed but AURA 'cares' |
| Callbacks | Personal, knowing | Build long-term relationship |

---

## 19) LLM Content Generation

### 19.1 Design Philosophy: Comic Strip Energy

**Core insight:** The game should feel like a daily ritual people WANT to read, not just play. Same energy as morning newspaper comics.

**What makes morning comics work:**
- **Relatability** — Mundane situations made interesting ("It's 2am. You're at the fridge. Again.")
- **Daily ritual** — Brief, consistent, part of your routine
- **Shareable moments** — "AURA said the funniest thing today..."
- **Validation** — "I do that too!" recognition
- **Personality** — Characters you develop a relationship with over time

**Applied to AURA:**
- Short, punchy lines (not walls of text)
- Dry observations about the player's data and habits
- Callbacks to previous incidents build relationship
- Every line should be quotable or screenshottable
- Players should WANT to read the dialogue, not skip it

**Bad example (too much reading):**
> "I have analyzed your biometric data from multiple sources including your smart watch, sleep tracker, and home security system. The aggregate data suggests a probability of 73.2% that you are not in an optimal state to make nutritional decisions at this time."

**Good example (comic strip energy):**
> "It's 2am. You're at the fridge. Your sleep tracker says you've been unconscious for 3 hours. And yet... here you are."

### 19.2 LLM-Generated Content

**Key revelation:** All puzzle content is LLM-generated. This enables:

| Content Type | Static (old) | LLM-Generated (new) |
|--------------|--------------|---------------------|
| AURA opening | Generic per device type | Contextual to exact scenario, time, player history |
| Counter dialogue | Per counter type | Specific to the evidence being challenged |
| Card flavor text | Fixed per card | Flows naturally when multiple cards played together |
| Victory/defeat | Generic outcomes | References specific plays, close calls, mistakes |
| Contradictions | "This is suspicious" | Explains the PHYSICAL reason ("You can't be in the gym AND kitchen at 2:05am") |

### 19.3 Pre-Generated Testimony Combinations

**Problem:** When player submits 2-3 cards together, their testimony should flow naturally — not feel like three disconnected statements.

**Solution:** LLM pre-generates all card combinations per puzzle.

**Math:** For 6 cards, possible submissions are:
- Single cards: 6
- Pairs: 15 (6 choose 2)
- Triples: 20 (6 choose 3)
- **Total: 41 combinations** (not 63 — we overcounted earlier)

**For each combination, LLM generates:**
1. **Combined testimony** — How the cards flow together as a narrative
2. **AURA's response** — Contextual to that specific combination
3. **Contradiction dialogue** (if applicable) — Explains the physical impossibility

**Example — Single card:**
> **Face ID alone:**
> Player: "I was at the front door. My face unlocked it."
> AURA: "Your face. At the door. At 2:07am. My camera saw no one."

**Example — Two cards together:**
> **Face ID + Smart Watch:**
> Player: "I walked to the door — you can see my steps — and unlocked it with my face."
> AURA: "Steps. Face. Both say you were there. My camera still disagrees."

**Example — Three cards with corroboration:**
> **Face ID + Voice Log + Smart Watch:**
> Player: "I walked to the kitchen, said 'open fridge,' and my face confirms I was there. Three sources. All agree."
> AURA: "...Annoyingly consistent. Your evidence corroborates. I'm recalculating."

### 19.4 Generation Pipeline

**Per puzzle, LLM generates:**

1. **Scenario setup**
   - Device being unlocked
   - Lock reason (unique daily flavor)
   - AURA's opening monologue

2. **Card content**
   - 6 evidence cards with flavor text
   - Claims that create interesting contradictions/corroborations
   - 1-2 counter-evidence cards for AURA
   - Refutation cards that explain counter weaknesses

3. **All 41 submission combinations**
   - Combined player testimony
   - AURA's contextual response
   - Damage dealt (with or without corroboration bonus)

4. **Outcome lines**
   - Victory variants (clean, scrappy, close)
   - Defeat variants (timeout, scrutiny, close)
   - Specific callbacks to what happened in this run

**Generation happens at puzzle creation time, not runtime.** Players receive a complete puzzle package with all dialogue pre-generated.

### 19.5 Subscriber vs. Free Tier

| Feature | Free Tier | Subscriber |
|---------|-----------|------------|
| Daily puzzle content | Same quality | Same quality |
| Daily AURA dialogue | Pre-generated (still contextual, still good) | Same (daily must be identical for all players) |
| Non-daily puzzles (future) | Limited access | Full access |
| Personalization (future, non-daily only) | None | Name, preferences, running jokes |
| Past-run callbacks (future, non-daily only) | None | Specific incident references |

**Core principle:** Daily puzzles are identical for everyone — same cards, same dialogue, same experience. This enables fair leaderboards and "did you get today's puzzle?" conversations.

**Subscriber personalization only applies to non-daily puzzle modes** (practice, custom scenarios, etc.) — a future feature. Daily puzzle quality is never paywalled.

### 19.6 Quality Bar for Generated Content

Every piece of generated dialogue must pass:

1. **The screenshot test** — Would someone share this on social media?
2. **The read-aloud test** — Does it sound natural spoken?
3. **The skip test** — If a player could skip, would they? (If yes, it's too long)
4. **The personality test** — Could this line come from any AI, or is it distinctly AURA?

**AURA's voice checklist:**
- [ ] Dry, not sarcastic
- [ ] Observational, not judgmental
- [ ] Uses YOUR data against you
- [ ] Concerned, not angry
- [ ] Grudging when defeated
- [ ] Ominous sign-offs
- [ ] Under 2 sentences per beat

---

## 20) UI/UX Clarifications

### 20.1 Interaction Model

| Action | Gesture |
|--------|---------|
| Select card | Tap |
| Deselect card | Tap again |
| View card details | Long press or tap selected card |
| Submit selection | SUBMIT button |
| Cancel | Tap outside or CANCEL button |

### 20.2 Counter Targeting Visibility

When selecting a card, show which counter will trigger:

```
[Smart Watch]
Proves: AWAKE
Power: 11
⚠️ Will trigger: Sleep Data counter
```

This makes counter targeting OBVIOUS before commit.

### 20.3 Refutation Cards Are Claim-Free

Refutation cards exist outside your "story." They have:
- Power (damage dealt)
- Refutes (which counter they nullify)
- NO claims (no time, location, state)

This means refutation cards NEVER cause contradictions.

### 20.4 Contradiction Timeline

When a contradiction occurs, show visual timeline:

```
YOUR STORY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2:00am [ASLEEP, BEDROOM] ← Sleep Tracker
          ↑ CONFLICT
2:05am [AWAKE, KITCHEN] ← Face ID (blocked)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Visual > text for understanding conflicts.

### 20.5 Emotional Arc of a Turn

Each turn should follow this beat:

1. **Selection** — Anticipation. "Will this work?"
2. **Submission** — Commitment. "Here goes..."
3. **AURA response** — Tension. Counter or no counter?
4. **Resolution** — Release. Damage dealt, progress made.
5. **Feedback** — Status update. Concerns, resistance, scrutiny.

Pacing: ~5-10 seconds per turn feels right.

---

## 21) Next Steps

1. **Build mockup** implementing core mechanics
2. **Playtest internally** — find edge cases
3. **Balance pass** — tune power numbers, resistance, turn budgets
4. **Human playtesting** — validate fun factor
5. **Polish** — UI, animations, AURA voice lines
6. **Ship**

---

## 22) Progressive Disclosure UX

### 22.1 Design Philosophy: Easy to Learn, Hard to Master

A daily puzzle game should be playable in under 10 seconds from launch. Complex dashboards and number-heavy UIs create barriers for casual players. The solution: **progressive disclosure**.

**Principle:** Hide complexity by default. Reveal it through:
1. AURA's dialogue (she teaches as you play)
2. Optional settings toggles (power users can enable)
3. Natural discovery (learn by doing, not reading)

### 22.2 What's Hidden by Default

| Element | Default State | Revealed By |
|---------|---------------|-------------|
| Exact power numbers | Hidden | Toggle OR tap card |
| Scrutiny meter | Hidden | AURA mood shows it |
| Resistance as number | Hidden | Bar only |
| Damage calculation | Hidden | AURA explains contextually |
| Contradiction formulas | Hidden | AURA warns naturally |
| Corroboration bonus math | Hidden | "Your evidence agrees" |

**First-time player sees:**
- AURA speaking naturally
- Cards with relative strength indicators (stars, bars, colors)
- A "health bar" for resistance (no numbers)
- Clear/yellow/red states for AURA's mood

**Not:**
- "Power: 12, Resistance: 35, Scrutiny: 2/5, Damage: base × 1.25 - 50%..."

### 22.3 AURA-as-Tutorial

AURA teaches mechanics through dialogue, not separate tutorials.

**Example flows:**

**First contradiction (player learns by doing):**
> Player selects conflicting cards
> AURA: "You can't be asleep AND walking. Pick one."
> Player deselects one
> AURA: "Better."

**First counter (learns attack/defense):**
> AURA: "My security camera says no one was at the door. Convince me."
> Player submits Face ID anyway
> AURA: "Camera says no. You say yes. I'm skeptical. Your evidence carries less weight."
> [Bar shows reduced damage]

**First refutation (learns counter-play):**
> Player has Maintenance Log
> Hover/select shows: "Explains why camera was offline"
> Player plays it
> AURA: "...The camera was updating. How convenient. Fine. I'll trust your other evidence."

**The player never reads rules.** They learn by playing and AURA explains what happened.

### 22.4 Mood-Based Feedback

AURA's avatar communicates game state without numbers.

| AURA State | Meaning | Visual |
|------------|---------|--------|
| NEUTRAL | Game start, no issues | Default orb/face |
| CURIOUS | Player selecting, evaluating | Slight lean, eye track |
| SUSPICIOUS | Minor contradiction detected | Narrowed eyes, orange glow |
| BLOCKED | Major contradiction, can't proceed | Red pulse, shake |
| GRUDGING | Player refuted her counter | Slight deflation, eye roll |
| IMPRESSED | Clean submission, no issues | Subtle surprise |
| RESIGNED | Player is in trouble (low chance of winning) | Pitying look, dim glow |
| DEFEATED | Player won | Resignation, sigh |
| SMUG | Player lost | Knowing look |

**RESIGNED state:** When player's remaining cards can't mathematically win (or it's very unlikely), AURA shifts to RESIGNED. She doesn't end the game early — player can still try — but her mood communicates "this isn't going well." Optional subtle line: "You're still trying? ...Admirable."

**Scrutiny through mood:**
- 0-1 scrutiny: NEUTRAL/CURIOUS
- 2-3 scrutiny: SUSPICIOUS (lingers)
- 4 scrutiny: CONCERNED (warning state)
- 5 scrutiny: LOSS (game over)

Players learn: "When AURA looks suspicious, I'm pushing my luck."

### 22.5 Counter Visibility Toggle

**Design decision:** Counter visibility is a binary toggle, not a gradient. No hybrid complexity.

| Mode | What Player Sees | Experience |
|------|-----------------|------------|
| **FULL** (default) | All counters visible from turn 1. Shows name, what it targets, exact claim. | Fair, strategic, chess-like. Player can plan around counters. |
| **HIDDEN** | Counters exist but are invisible. AURA reveals each counter only when triggered. | Surprise element, memory challenge, expert difficulty. |

**Why binary, not hybrid:**
- Easier to balance — two discrete modes, not a spectrum
- Easier to implement — show or don't show
- Clearer player choice — "I want to see everything" vs "surprise me"
- Tuning is straightforward — adjust each mode independently

**Mode affects ONLY counter visibility.** Everything else stays the same in both modes:
- Contradiction system (MINOR/MAJOR)
- Damage calculation with corroboration
- Refutation mechanics
- Scrutiny system
- Pre-submission warnings for contradictions
- Card claims structure

**When to use each:**
- **FULL:** Daily puzzle default, learning, fair leaderboards
- **HIDDEN:** Challenge mode toggle, expert players, "hard mode" runs

**Implementation:** Toggle in Settings menu. Can be changed before starting a puzzle but NOT mid-puzzle (affects fairness).

---

### 22.6 Settings Toggles (Mid-Game Accessible)

**CRITICAL:** Display toggles must work mid-game. Player should never feel "locked out" of information.

**Settings menu (accessible during play):**

```
┌─────────────────────────────────┐
│  DISPLAY SETTINGS               │
│  ─────────────────              │
│  ○ Minimal UI (recommended)     │
│  ● Full Stats                   │
│                                 │
│  When Full Stats enabled:       │
│  [✓] Show power numbers         │
│  [✓] Show scrutiny meter        │
│  [✓] Show resistance number     │
│  [✓] Show damage calculations   │
│  [ ] Show contradiction formulas│
│                                 │
│  DIFFICULTY                     │
│  ─────────────────              │
│  ● Full counters (see all)      │
│  ○ Hidden counters (surprise)   │
│  Note: Changes apply next puzzle│
└─────────────────────────────────┘
```

**Implementation requirements:**
- Settings icon always visible on game screen
- Changes apply IMMEDIATELY (no "restart required")
- Toggling mid-game does NOT affect score
- First-time tooltip: "Want more details? Tap here."

**Quick toggle shortcut:**
- Long-press on AURA's avatar = toggle between Minimal/Full
- Enables power users to flip quickly

### 22.7 Card Display Modes

**Minimal mode (default):**
```
┌─────────────────────┐
│  ⭐⭐⭐              │  ← Relative strength
│  FACE ID            │
│  📍 Kitchen  👁️ Awake│  ← Claims as icons
│  "Proves you're you"│  ← Natural language
└─────────────────────┘
```

**Full stats mode:**
```
┌─────────────────────┐
│  Power: 12          │  ← Exact number
│  FACE ID            │
│  IDENTITY • KITCHEN │  ← Technical labels
│  2:05-2:10am AWAKE  │  ← Time range visible
│  Triggers: Camera   │  ← Counter warning
└─────────────────────┘
```

**Long-press on any card** shows full stats regardless of mode.

### 22.8 Resistance Display

**Minimal mode:**
```
RESISTANCE: ████████░░░░  (bar only, no number)
```

**Full stats mode:**
```
RESISTANCE: ████████░░░░  35/50  (bar + numbers)
```

**After damage dealt:**
- Minimal: Bar animates down, AURA says "That got through."
- Full: Bar animates down, shows "-12" floating damage number

### 22.9 What We Preserve

Progressive disclosure does NOT mean dumbing down. We preserve:

| Element | How It's Preserved |
|---------|-------------------|
| Strategic depth | Same mechanics, different presentation |
| Skill expression | Experts can enable Full Stats |
| Pre-calculation | Long-press cards, enable stats |
| Optimization | Leaderboard scoring unchanged |
| Fairness | All info accessible, just not forced |

**The math is the same. The UI adapts to the player.**

### 22.10 Onboarding Flow

**Day 1 (first launch):**
1. No settings prompt — start in Minimal mode
2. AURA introduces herself naturally
3. First puzzle is tutorial-easy (Section 17)
4. If player taps on hidden element, tooltip appears: "Want details? Check Settings."

**Day 2-3:**
- If player lost Day 1: "Tip: Long-press cards for more details"
- If player won easily: No prompt, they're fine

**Day 7+ (power user detection):**
- If player consistently wins with 0 scrutiny, prompt: "You seem experienced. Want Full Stats mode?"

### 22.11 Trade-offs Acknowledged

| What We Lose | Mitigation |
|--------------|------------|
| Pre-calculation satisfaction | Toggle available, long-press shows stats |
| Dashboard aesthetic | "Full Stats" mode for those who want it |
| Expert efficiency | "Always show" settings persist |
| Knowing you're doomed early | AURA's mood signals it + toggle available |

**Net gain:**
- Instant playability (huge for daily puzzle retention)
- Wider audience (casual players not scared off)
- Discovery moments ("Oh, THAT'S what corroboration means!")
- Cleaner, more thematic UI

---

## Appendix A: Quick Reference

### Contradiction Severity Quick Reference

**MAJOR (blocked):**
- ASLEEP + AWAKE, <3 min gap
- HOME + GYM, <20 min gap
- HOME + WORK, <25 min gap
- BEDROOM + KITCHEN, <30 sec gap

**MINOR (+1 scrutiny, allowed):**
- ASLEEP + AWAKE, 3-10 min gap
- HOME + GYM, 20-30 min gap
- BEDROOM + KITCHEN, 30 sec - 2 min gap
- DROWSY + ALERT, <5 min gap

**NONE (no issue):**
- Any conflict with >10 min gap (states)
- Any conflict with >30 min gap (outside locations)
- Any conflict with >2 min gap (adjacent rooms)
- Same location claims
- Compatible states (AWAKE + ALERT, IDLE + SITTING)

### Damage Formula

```
base = sum(card.power)
if corroboration: base *= 1.25 (round UP)
if contested: base *= 0.5
if refuted_later: restore missing 50%
```

### Scrutiny Formula

```
scrutiny = 0 (start)
+1 per MINOR contradiction
+1 per SKETCHY card
5 = LOSS (no recovery)
```

### Win Condition

```
resistance <= 0 AND all_concerns_addressed
```

### Score Factors (for leaderboards)

```
Better score:
- Fewer turns used
- Higher total power dealt
- 0 contradictions (minor or major)
- 0 scrutiny accumulated
- All counters refuted
```
