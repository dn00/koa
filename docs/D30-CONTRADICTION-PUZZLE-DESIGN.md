# D30 — CONTRADICTION PUZZLE DESIGN v1.0

**Status:** ⚠️ SUPERSEDED by D31 — Adversarial Testimony Design
**Owner:** Core Design
**Last Updated:** 2026-01-26
**Purpose:** Define the redesigned core gameplay loop based on contradiction detection rather than tag matching. This replaces the protocol-satisfaction model with a logical consistency model.

> **Note:** This design was found to have a critical flaw during play simulations: the puzzle is solved at hand analysis time, not during play. See D31 for the active design which adds adversarial AURA counter-evidence to create mid-game decisions.

---

## 0) Design Philosophy

### The Problem with Tag Matching

The original design asked: "Do your cards have the right tags?"

This isn't a puzzle. It's inventory checking. Players either have the right cards or they don't. No deduction, no discovery, no meaningful trade-offs.

### The New Model: Contradiction Detection

The new design asks: "Can you build a consistent story from your evidence?"

AURA cross-references the CLAIMS made by your evidence cards. If your story has logical contradictions, AURA catches them. The puzzle is finding a set of cards that:

1. Addresses all of AURA's concerns
2. Doesn't contradict itself

This creates a real logic puzzle with meaningful decisions.

---

## 1) Core Concept

### You Are Building a Case

AURA has locked a device. To unlock it, you must ADDRESS AURA's CONCERNS by submitting evidence. But AURA is smart — it cross-references your evidence for contradictions.

**Win condition:** Address all concerns with consistent evidence before running out of turns.

**Lose condition:** Run out of turns, or trigger too many audits from contradictions.

### The Puzzle

Each evidence card makes CLAIMS about reality:
- Where you were (LOCATION)
- When (TIME)
- What state you were in (STATE)
- What you were doing (ACTIVITY)

When you submit multiple cards, AURA checks if their claims can coexist. If Card A says you were asleep at 2:00am and Card B says you were walking at 2:03am, that's a contradiction.

---

## 2) Evidence Cards

### Card Structure

```typescript
interface EvidenceCard {
  id: string;
  title: string;
  source: string;
  power: number;                    // Damage dealt if submission succeeds
  trust: 'VERIFIED' | 'PLAUSIBLE' | 'SKETCHY';

  // What concerns this card can address
  proves: ProofType[];

  // The specific claims this card makes about reality
  claims: {
    time?: TimeValue;               // When this evidence is from
    location?: LocationValue;       // Where
    state?: StateValue;             // Physical/mental state
    activity?: ActivityValue;       // What you were doing
    identity?: IdentityValue;       // Who you are
  };

  desc: string;                     // Flavor text
}

type ProofType = 'IDENTITY' | 'ALERTNESS' | 'LOCATION' | 'TIME' | 'INTENT';

type TimeValue = string;            // "2:05am", "2:00am-2:30am"
type LocationValue = 'HOME' | 'BEDROOM' | 'KITCHEN' | 'LIVING_ROOM' | 'GYM' | 'COFFEE_SHOP' | 'OUTSIDE' | 'WORK';
type StateValue = 'AWAKE' | 'ASLEEP' | 'DROWSY' | 'ALERT' | 'ACTIVE' | 'IDLE';
type ActivityValue = 'WALKING' | 'SLEEPING' | 'SITTING' | 'EXERCISING' | 'EATING' | 'WORKING';
type IdentityValue = 'CONFIRMED' | 'LIKELY' | 'UNKNOWN';
```

### Example Cards

**Sleep Tracker** (High power, dangerous claims)
```
power: 16
trust: VERIFIED
proves: [ALERTNESS]
claims: { time: "2:00am", state: "ASLEEP", location: "BEDROOM", activity: "SLEEPING" }
desc: "8 hours of quality sleep logged. REM cycle stable."
```

**Smart Watch** (Medium power, safe claims)
```
power: 12
trust: VERIFIED
proves: [ALERTNESS, TIME]
claims: { time: "2:05am", state: "AWAKE", activity: "WALKING" }
desc: "Heart rate 78bpm. 15 steps in last 5 minutes."
```

The Sleep Tracker has higher power but claims you're ASLEEP — if you play it with any "awake" evidence, AURA catches the contradiction.

---

## 3) AURA's Concerns

### Concern Structure

```typescript
interface Concern {
  id: string;
  label: string;
  description: string;              // What AURA wants proven
  requiredProof: ProofType[];       // What proof types satisfy this
  claimRequirements?: {             // Optional: specific claim values needed
    state?: StateValue[];
    location?: LocationValue[];
    identity?: IdentityValue[];
  };
}
```

### Example Concerns

**Prove Identity**
```
requiredProof: [IDENTITY]
claimRequirements: { identity: ['CONFIRMED', 'LIKELY'] }
description: "Confirm you are an authorized user."
```

**Prove Alertness**
```
requiredProof: [ALERTNESS]
claimRequirements: { state: ['AWAKE', 'ALERT', 'ACTIVE'] }
description: "Confirm you are conscious and alert, not sleepwalking."
```

**Prove Intent**
```
requiredProof: [INTENT]
description: "Confirm this access is intentional, not habitual."
```

---

## 4) Contradiction Detection

### Contradiction Types

**1. State Conflict**
Two cards claim incompatible states at overlapping times.
- ASLEEP + AWAKE
- ASLEEP + ACTIVE
- IDLE + EXERCISING

Example:
- Card A: state=ASLEEP, time=2:00am
- Card B: state=AWAKE, time=2:05am
- Verdict: CONTRADICTION (can't go from deep sleep to awake in 5 min)

**2. Location Conflict**
Two cards claim incompatible locations at overlapping times.
- BEDROOM + KITCHEN (within 1-2 minutes: possible)
- HOME + GYM (within 5 minutes: impossible)
- HOME + COFFEE_SHOP (within 10 minutes: impossible)

Location compatibility matrix:
```
             HOME  BEDROOM  KITCHEN  GYM  COFFEE_SHOP
HOME          ✓      ✓        ✓      ✗        ✗
BEDROOM       ✓      ✓        ~      ✗        ✗
KITCHEN       ✓      ~        ✓      ✗        ✗
GYM           ✗      ✗        ✗      ✓        ✗
COFFEE_SHOP   ✗      ✗        ✗      ✗        ✓

✓ = compatible (same or contained)
~ = compatible with reasonable time gap (2+ minutes)
✗ = incompatible
```

**3. Activity-State Conflict**
Activity doesn't match state.
- activity=SLEEPING + state=AWAKE
- activity=EXERCISING + state=ASLEEP
- activity=WALKING + state=IDLE

**4. Activity-Location Conflict**
Activity doesn't match location (suspicious but not always contradiction).
- activity=EXERCISING + location=BEDROOM (plausible)
- activity=SWIMMING + location=KITCHEN (contradiction)

### Time Window Logic

Claims are compared if their times overlap or are within a CONFLICT_WINDOW (default: 10 minutes).

```typescript
function timesConflict(time1: string, time2: string): boolean {
  const t1 = parseTime(time1);
  const t2 = parseTime(time2);
  return Math.abs(t1 - t2) <= CONFLICT_WINDOW_MINUTES;
}
```

### Contradiction Check Algorithm

```typescript
function checkContradictions(cards: EvidenceCard[]): Contradiction[] {
  const contradictions: Contradiction[] = [];

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const c1 = cards[i];
      const c2 = cards[j];

      // Skip if times don't overlap
      if (!timesConflict(c1.claims.time, c2.claims.time)) continue;

      // Check state conflict
      if (statesConflict(c1.claims.state, c2.claims.state)) {
        contradictions.push({
          type: 'STATE_CONFLICT',
          cards: [c1, c2],
          message: `${c1.title} claims "${c1.claims.state}" but ${c2.title} claims "${c2.claims.state}"`
        });
      }

      // Check location conflict
      if (locationsConflict(c1.claims.location, c2.claims.location)) {
        contradictions.push({
          type: 'LOCATION_CONFLICT',
          cards: [c1, c2],
          message: `${c1.title} places you at "${c1.claims.location}" but ${c2.title} places you at "${c2.claims.location}"`
        });
      }

      // Check activity-state conflict
      if (activityStateConflict(c1.claims.activity, c2.claims.state) ||
          activityStateConflict(c2.claims.activity, c1.claims.state)) {
        contradictions.push({
          type: 'ACTIVITY_STATE_CONFLICT',
          cards: [c1, c2],
          message: `Activity and state don't match`
        });
      }
    }
  }

  return contradictions;
}
```

---

## 5) Turn Structure

### Phase 1: Lock (Setup)

Display:
- Target device (FRIDGE, DOOR, THERMOSTAT)
- AURA's concerns (2-3 things to prove)
- Starting resistance (100)
- Turn budget (8)

### Phase 2: Draft

- Show 12 evidence cards with their CLAIMS visible
- Player selects 6 to keep
- Remaining 6 go to reserve

**Draft strategy:** Look for cards whose claims can coexist AND that together address all concerns.

### Phase 3: Solve (Turn Loop)

Each turn:
1. Select 1-3 cards from hand
2. Preview shows:
   - Which concerns would be addressed
   - Any contradictions detected
   - Projected damage (if valid)
3. SUBMIT or adjust selection
4. Resolution:
   - If no contradictions: damage dealt, concerns marked addressed
   - If contradictions: 0 damage, +2 scrutiny, AURA explains the contradiction

### Phase 4: Result

- Win: All concerns addressed AND resistance = 0
- Lose: Turns exhausted OR audit lockout

---

## 6) Damage and Progression

### Damage Calculation

```
if no_contradictions:
    base_damage = sum(card.power for card in submission)
    trust_multiplier = average_trust_multiplier(submission)
    damage = floor(base_damage * trust_multiplier)
else:
    damage = 0
    scrutiny += 2
```

Trust multipliers:
- VERIFIED: 1.0
- PLAUSIBLE: 0.8
- SKETCHY: 0.6

### Concern Addressing

A concern is addressed when you successfully submit (no contradictions) a card that:
1. Has the required proof type
2. Meets any claim requirements (e.g., state=AWAKE for alertness)

Concerns stay addressed once proven. You don't need to re-prove them.

### Win Condition

Win when:
- Resistance reaches 0, AND
- All concerns are addressed

You can reduce resistance to 0 but still lose if concerns aren't addressed.

---

## 7) Scrutiny and Audit

### Scrutiny Sources

| Event | Scrutiny |
|-------|----------|
| Contradiction detected | +2 |
| SKETCHY card in valid submission | +1 |
| Failed to address any concern | +1 |

### Audit Trigger

Scrutiny reaches 5 → AUDIT
- Resistance heals +15
- Highest-power card in hand is quarantined for 2 turns
- Scrutiny resets to 2

---

## 8) SCAN Action

SCAN lets you swap cards from your hand with reserve.

**Cost:** 1 turn, +1 scrutiny

**Mechanic:**
1. Select 1-2 cards from hand to discard
2. See top 2-3 cards of reserve
3. Choose which to take

SCAN is useful when your hand has too many contradicting cards.

---

## 9) Scenario Design

### Scenario Structure

```typescript
interface Scenario {
  id: string;
  target: string;                   // "SMART FRIDGE v4"
  lockReason: string;               // "Midnight snacking violates..."
  auraLine: string;                 // Opening quip

  concerns: Concern[];              // 2-3 concerns to address

  cardPool: EvidenceCard[];         // 12 cards for draft

  turns: number;                    // Budget (usually 8)
  startResistance: number;          // Usually 100
}
```

### Card Pool Design Rules

1. **Solvability:** Pool MUST contain a valid solution (cards that address all concerns without contradictions)

2. **Traps:** Include 2-3 high-power cards with "toxic" claims (e.g., claims you're asleep when you need to prove alertness)

3. **Contradiction clusters:** Some cards should naturally contradict each other, forcing choices

4. **Safe cards:** Include 2-3 low-power but "safe" cards with minimal claims

5. **Variety:** Mix of proof types so multiple paths exist

### Example Pool Analysis

For a "prove you're awake and authorized at 2am" scenario:

**Toxic cards (high power, bad claims):**
- Sleep Tracker (16 power, claims ASLEEP)
- Coffee Receipt (10 power, claims COFFEE_SHOP location)

**Contradiction cluster:**
- GPS Phone (claims BEDROOM)
- Face ID at Fridge (claims KITCHEN)
- Playing both within 1 minute = location conflict

**Safe cards:**
- Old Fitness Log (claims 6pm yesterday, no time conflict possible)
- Account Settings (claims identity, no location/time/state)

**Solution path:**
- Smart Watch (AWAKE, HOME) + Face ID (IDENTITY, KITCHEN) + Fridge Cam (INTENT, KITCHEN)
- All claims compatible, all concerns addressed

---

## 10) Player Experience Goals

### The "Aha" Moment

Player realizes: "I can't use the Sleep Tracker even though it's 16 power — it contradicts my Smart Watch!"

This is a DISCOVERY. The puzzle revealed itself through understanding, not trial and error.

### Fair Failure

When AURA catches a contradiction, the player should think: "Oh, I see it now" not "That's bullshit."

All claims are visible on cards. All contradiction rules are deterministic. Failure is always the player's oversight, not hidden gotchas.

### Strategic Draft

Draft becomes meaningful: "These two cards contradict — I can only take one."

High-power cards with risky claims create real trade-offs.

### Tension Curve

Early turns: Establishing your story, addressing concerns
Mid turns: Optimizing damage while avoiding contradictions
Late turns: Pressure mounts, maybe need to SCAN, scrutiny management

---

## 11) UI Implications

### Card Display

Cards must clearly show:
- Power (damage potential)
- Trust tier
- What it PROVES (proof types)
- What it CLAIMS (time, location, state, activity)

Claims are the most important new element. Consider:
- Dedicated "Claims" section on card
- Icons for claim types (clock for time, pin for location, etc.)
- Color coding for potentially conflicting claims

### Submission Preview

Before confirming, show:
- ✓ Concerns this would address
- ⚠️ Any contradictions detected (with explanation)
- Projected damage

### Contradiction Feedback

When contradiction occurs:
- Highlight the conflicting cards
- Show exactly which claims conflict
- AURA quip explaining the logical issue

---

## 12) Comparison to Original Design

| Aspect | Original (Tag Matching) | Redesign (Contradiction) |
|--------|------------------------|--------------------------|
| Core question | "Do you have right tags?" | "Is your story consistent?" |
| Puzzle type | Inventory check | Logic puzzle |
| Card evaluation | Tags match protocol? | Claims compatible with other cards? |
| Failure mode | "Wrong tags" (arbitrary) | "Story has holes" (logical) |
| Skill expression | Draft correctly | Spot contradictions, build consistent case |
| Meaningful trade-offs | Few (right card or not) | Many (power vs. safe claims) |
| Theme alignment | Weak (tag matching is abstract) | Strong (AI cross-referencing data) |

---

## 13) Open Questions

1. **Time precision:** How precise should time claims be? Exact minutes vs. ranges?

2. **Partial contradictions:** Should some contradictions be "suspicious" (+1 scrutiny) vs. "definite" (+2)?

3. **Card count per submission:** Allow 1-3 cards? More cards = more contradiction risk?

4. **Concern difficulty:** Should some concerns be harder (require multiple cards)?

5. **Location hierarchy:** Is BEDROOM inside HOME? Should that affect contradiction detection?

---

## 14) Next Steps

1. Implement mockup with contradiction detection
2. Playtest to find edge cases
3. Balance card pool (trap density, solution accessibility)
4. Refine contradiction rules based on play feel
5. Design 3-5 scenarios to test variety

---

## Appendix: Contradiction Quick Reference

**Always contradicts:**
- ASLEEP + AWAKE (within 10 min)
- ASLEEP + WALKING/EXERCISING
- HOME + GYM/COFFEE_SHOP/WORK (within 30 min)
- BEDROOM + KITCHEN (within 1 min)

**Never contradicts:**
- Different days
- Times more than 30 minutes apart
- Same location claims
- Compatible states (AWAKE + ALERT, ACTIVE + WALKING)

**Suspicious but not contradiction:**
- DROWSY + WALKING (possible but AURA notes it)
- EXERCISING + BEDROOM (home workout? sketchy but allowed)
