# D03 — DETERMINISTIC RESOLVER SPEC v2.0

**Status:** Draft v2.0 (Ship-blocking)
**Owner:** Core Runtime / Game Logic
**Last Updated:** 2026-01-26
**Purpose:** Define the deterministic "physics" of Home Smart Home: the authoritative state model, action validation, damage computation, contradiction detection, counter-evidence handling, and the output contract used by UI, telemetry, and voice selection.
**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md

---

## 0) Design principles

1. **Resolver is authoritative**: outcomes are computed by deterministic rules and pack-defined data.
2. **Fail-closed**: invalid actions do nothing except emit a rejected action event with a reason.
3. **Separation of mechanics and voice**: mechanics resolve instantly; voice rendering is non-blocking and never affects state.
4. **Seeded determinism**: same initial state + Pack Set + seed + action stream => identical outcomes.
5. **RNG isolation**: gameplay RNG streams are isolated from cosmetic/voice randomness.
6. **Explainability**: all outcomes must be explainable by card power, counter effects, contradiction rules, and corroboration. No secret recipe resolution.

---

## 1) Determinism contract

### 1.1 Canonical hashing

* Hash function: **SHA-256 hex**
* Canonical encoding: **canonical JSON** (sorted keys, compact separators)
* Event chain: each event includes `prev_event_hash`

### 1.2 Stable ordering rules

* Cards evaluated in stable order by `card_id`
* Counters evaluated in stable order by `counter_id`
* Contradiction checks in stable order by committed story timestamp

### 1.3 "No wall clock"

`timestamp_ms` is **logical time** (tick index based). No dependency on real time or timezone.

---

## 2) Core gameplay model

KOA is enforcing **Concerns** (proof requirements). The player builds an **alibi** by submitting **Evidence Cards** that prove claims. KOA plays **Counter-Evidence** to challenge evidence. Players can use **Refutation Cards** to nullify counters. The resolver tracks **Contradictions** between evidence claims and applies **Scrutiny** penalties.

**Win condition:** Resistance reaches 0 AND all concerns addressed within turn budget.

**Loss conditions:** Turns exhausted OR Scrutiny reaches 5.

---

## 3) State model (authoritative)

### 3.1 RunState (top-level)

```json
{
  "run_id": "run_...",
  "seed": "base64...",
  "mode": "DAILY|FREEPLAY",
  "tick_id": 0,
  "status": "ACTIVE|WON|LOST",
  "puzzle": { /* PuzzleState */ },
  "committed_story": [ /* EvidenceCard[] */ ],
  "counter_state": { /* CounterState */ }
}
```

### 3.2 PuzzleState

```json
{
  "puzzle_id": "puzzle_...",
  "target_lock": "FRIDGE|THERMOSTAT|FRONT_DOOR|...",
  "resistance": 35,
  "resistance_start": 35,
  "turn_budget": 6,
  "turn_index": 1,
  "concerns": [ /* Concern[] */ ],
  "counter_evidence": [ /* CounterEvidence[] */ ],
  "scrutiny": 0,
  "hand": [ /* EvidenceCard[] */ ]
}
```

### 3.3 Concern

```json
{
  "concern_id": "IDENTITY|ALERTNESS|INTENT|LOCATION|LIVENESS",
  "koa_asks": "Prove you're you.",
  "required_proof": ["IDENTITY"],
  "addressed": false
}
```

### 3.4 CounterEvidence

```json
{
  "counter_id": "counter_...",
  "name": "Security Camera",
  "targets": ["IDENTITY", "LOCATION"],
  "claim": "No one detected at door 2:00-2:30am",
  "refutable_by": ["maintenance_log", "blind_spot_report"],
  "refuted": false,
  "triggered": false
}
```

### 3.5 EvidenceCard

```json
{
  "card_id": "card_...",
  "name": "Face ID — Front Door",
  "source": "Apple HomeKit",
  "power": 12,
  "proves": ["IDENTITY"],
  "claims": {
    "time_range": ["2:05am", "2:10am"],
    "location": "KITCHEN",
    "state": "AWAKE",
    "activity": null
  },
  "is_refutation": false,
  "refutes": []
}
```

### 3.6 RefutationCard (extends EvidenceCard)

```json
{
  "card_id": "card_...",
  "name": "Maintenance Log",
  "power": 5,
  "proves": [],
  "claims": {},
  "is_refutation": true,
  "refutes": ["counter_security_camera"]
}
```

---

## 4) Domain model (from packs)

### 4.1 ProofType

```typescript
type ProofType = 'IDENTITY' | 'ALERTNESS' | 'LOCATION' | 'INTENT' | 'LIVENESS';
```

### 4.2 LocationValue

```typescript
type LocationValue =
  | 'HOME' | 'BEDROOM' | 'KITCHEN' | 'LIVING_ROOM' | 'BATHROOM'
  | 'GYM' | 'WORK' | 'COFFEE_SHOP' | 'OUTSIDE';
```

### 4.3 StateValue

```typescript
type StateValue = 'AWAKE' | 'ASLEEP' | 'DROWSY' | 'ALERT' | 'ACTIVE' | 'IDLE';
```

### 4.4 ContradictionSeverity

```typescript
type ContradictionSeverity = 'NONE' | 'MINOR' | 'MAJOR';
```

---

## 5) Action model

### 5.1 SUBMIT action

```json
{
  "action_type": "SUBMIT",
  "cards": ["card_1", "card_2", "card_3"],
  "tick_id": 5
}
```

**Constraints:**
* 1-3 cards per submission
* All cards must be in hand
* No MAJOR contradictions with committed story

---

## 6) Legality checks

An action is legal iff all applicable checks pass.

### 6.1 Universal checks

* It is the player's turn
* Run status is ACTIVE
* Turn budget not exhausted
* All referenced card IDs exist in hand

### 6.2 Contradiction checks (pre-submission)

Before submission is allowed:
* Check each card's claims against committed story
* If any MAJOR contradiction detected: submission blocked
* If MINOR contradictions detected: allowed with scrutiny penalty

---

## 7) Contradiction detection

### 7.1 Time range handling

Cards claim time **ranges**, not points. Check overlap between new card and committed story.

### 7.2 State conflict severity

```typescript
function getStateSeverity(state1: StateValue, state2: StateValue, timeGapMinutes: number): ContradictionSeverity {
  // ASLEEP vs AWAKE
  if ((state1 === 'ASLEEP' && state2 === 'AWAKE') || (state1 === 'AWAKE' && state2 === 'ASLEEP')) {
    if (timeGapMinutes < 3) return 'MAJOR';
    if (timeGapMinutes < 10) return 'MINOR';
    return 'NONE';
  }

  // DROWSY vs ALERT
  if ((state1 === 'DROWSY' && state2 === 'ALERT') || (state1 === 'ALERT' && state2 === 'DROWSY')) {
    if (timeGapMinutes < 5) return 'MINOR';
    return 'NONE';
  }

  return 'NONE';
}
```

### 7.3 Location conflict severity

```typescript
function getLocationSeverity(loc1: LocationValue, loc2: LocationValue, timeGapMinutes: number): ContradictionSeverity {
  // HOME vs GYM
  if (locationsConflict(loc1, loc2, 'HOME', 'GYM')) {
    if (timeGapMinutes < 20) return 'MAJOR';
    if (timeGapMinutes < 30) return 'MINOR';
    return 'NONE';
  }

  // HOME vs WORK
  if (locationsConflict(loc1, loc2, 'HOME', 'WORK')) {
    if (timeGapMinutes < 25) return 'MAJOR';
    if (timeGapMinutes < 40) return 'MINOR';
    return 'NONE';
  }

  // Adjacent rooms (within HOME)
  if (areAdjacentRooms(loc1, loc2)) {
    if (timeGapMinutes < 0.5) return 'MAJOR';  // 30 seconds
    if (timeGapMinutes < 2) return 'MINOR';
    return 'NONE';
  }

  return 'NONE';
}
```

### 7.4 Contradiction result

```typescript
interface ContradictionResult {
  severity: ContradictionSeverity;
  type: 'STATE_CONFLICT' | 'LOCATION_CONFLICT';
  message: string;
  cards: [EvidenceCard, EvidenceCard];
}
```

---

## 8) Damage calculation

### 8.1 Overview

Damage is calculated per-submission using:
1. Base power from cards
2. Contested penalty (50% per affected card)
3. Corroboration bonus (25% on total)
4. Retroactive refutation restoration

### 8.2 Damage formula

```typescript
function calculateDamage(
  submission: EvidenceCard[],
  activeCounter: CounterEvidence | null,
  hasCorroboration: boolean
): number {
  let totalDamage = 0;

  // Step 1: Calculate per-card damage
  for (const card of submission) {
    let cardDamage = card.power;

    // Contested penalty: 50% if counter targets this card's proof type
    if (activeCounter && !activeCounter.refuted) {
      const isContested = activeCounter.targets.some(t => card.proves.includes(t));
      if (isContested) {
        cardDamage = Math.ceil(cardDamage * 0.5);  // Round UP (favor player)
      }
    }

    totalDamage += cardDamage;
  }

  // Step 2: Corroboration bonus (after contested penalties)
  if (hasCorroboration) {
    totalDamage = Math.ceil(totalDamage * 1.25);  // Round UP (favor player)
  }

  return totalDamage;
}
```

### 8.3 Corroboration detection

```typescript
function hasCorroboration(cards: EvidenceCard[]): boolean {
  if (cards.length < 2) return false;

  const locations = cards.map(c => c.claims.location).filter(Boolean);
  const states = cards.map(c => c.claims.state).filter(Boolean);
  const activities = cards.map(c => c.claims.activity).filter(Boolean);

  return hasDuplicates(locations) || hasDuplicates(states) || hasDuplicates(activities);
}
```

### 8.4 Retroactive refutation

When a refutation card nullifies a counter:

```typescript
function applyRefutation(
  refutationCard: RefutationCard,
  counter: CounterEvidence,
  committedStory: EvidenceCard[],
  state: PuzzleState
): number {
  // Mark counter as refuted
  counter.refuted = true;

  // Calculate restored damage from previously contested cards
  let restoredDamage = 0;
  for (const card of committedStory) {
    if (counter.targets.some(t => card.proves.includes(t))) {
      // Restore the 50% that was lost
      restoredDamage += Math.floor(card.power * 0.5);
    }
  }

  // Refutation card also deals its own damage
  return refutationCard.power + restoredDamage;
}
```

---

## 9) KOA counter response

### 9.1 Counter selection

KOA plays at most ONE counter per turn. Selection logic:

```typescript
function koaResponds(
  submission: EvidenceCard[],
  counters: CounterEvidence[]
): CounterEvidence | null {
  for (const card of submission) {
    for (const counter of counters) {
      if (!counter.refuted && !counter.triggered) {
        if (counter.targets.some(t => card.proves.includes(t))) {
          counter.triggered = true;
          return counter;
        }
      }
    }
  }
  return null;
}
```

### 9.2 Counter effects

| Scenario | Effect |
|----------|--------|
| No counter applies | Full damage |
| Counter applies, not refuted | 50% damage per contested card |
| Counter refuted later | Retroactive damage restoration |

---

## 10) Scrutiny system

### 10.1 Scrutiny sources

| Event | Scrutiny | Notes |
|-------|----------|-------|
| MINOR contradiction | +1 | Suspicious but allowed |
| MAJOR contradiction | — | Blocked, can't submit |
| SKETCHY trust card used | +1 | Low-quality evidence |

### 10.2 Scrutiny cap and loss

* Scrutiny range: 0-5
* Scrutiny 5 = **immediate loss**
* No recovery mechanism (unlike old Audit system)

---

## 11) Resolution pipeline

Given `state` and one `SUBMIT` action:

### Step 1 - Validate

* Check legality (cards in hand, turn available)
* If invalid -> emit `ActionRejected(reason_code)`

### Step 2 - Check contradictions

* For each card in submission, check against committed story
* If MAJOR -> emit `SubmissionBlocked`, return without changes
* If MINOR -> note scrutiny delta

### Step 3 - KOA responds

* Select applicable counter (if any)
* Mark counter as triggered

### Step 4 - Calculate damage

* Apply contested penalty per-card
* Check corroboration
* Apply corroboration bonus

### Step 5 - Check refutations

* If submission includes refutation card, mark target counter as refuted
* Calculate retroactive damage restoration

### Step 6 - Apply effects

Effects application order (fixed):

1. Scrutiny update (MINOR contradictions, SKETCHY cards)
2. Check scrutiny loss (if >= 5, emit LossEvent)
3. Resistance reduction
4. Concern updates (mark addressed if proof type submitted)
5. Add cards to committed story
6. Remove cards from hand
7. Turn counter decrement

### Step 7 - Emit events

* `SubmitResolved` with full details
* Append to event log with `prev_event_hash`

### Step 8 - Check end conditions

* Resistance <= 0 AND all concerns addressed -> `PuzzleWon`
* Turn index > turn budget -> `PuzzleLost`
* Scrutiny >= 5 -> `PuzzleLost`

---

## 12) Output contract

### 12.1 SubmitResolved

```json
{
  "action_id": "act_...",
  "tick_id": 12,
  "valid": true,
  "cards_submitted": ["card_1", "card_2"],
  "contradictions": [
    { "severity": "MINOR", "type": "STATE_CONFLICT", "message": "..." }
  ],
  "counter_played": "counter_security_camera",
  "damage": {
    "base": 23,
    "contested_penalty": -6,
    "corroboration_bonus": 4,
    "refutation_restore": 0,
    "total": 21
  },
  "concerns_addressed": ["IDENTITY"],
  "scrutiny_delta": 1,
  "post_state": {
    "resistance": 14,
    "scrutiny": 2,
    "concerns_remaining": ["ALERTNESS", "INTENT"]
  }
}
```

### 12.2 OutcomeKey (for voice selection)

```json
{
  "event": "SUBMIT_RESOLVED|PUZZLE_WON|PUZZLE_LOST",
  "outcome": "CLEAN|CONTESTED|REFUTED|BLOCKED",
  "counter_played": true,
  "corroboration": true,
  "scrutiny_level": "LOW|MED|HIGH",
  "contradiction_severity": "NONE|MINOR",
  "concerns_addressed_count": 1
}
```

---

## 13) Win/Loss rules

### 13.1 Win

Win if:
* Resistance <= 0, AND
* All concerns addressed

On win:
* Mark puzzle `WON`
* Emit `PuzzleWon(summary_stats)`

### 13.2 Loss

Loss if:
* Turn budget exhausted, OR
* Scrutiny reaches 5

On loss:
* Mark puzzle `LOST`
* Emit `PuzzleLost(reason: 'TURNS_EXHAUSTED' | 'SCRUTINY_LIMIT')`

---

## 14) Rejection reason codes

### 14.1 Action rejected (illegal)

| Code | Meaning |
|------|---------|
| `INVALID_ACTION_TYPE` | Unknown action type |
| `CARD_NOT_IN_HAND` | Referenced card not in hand |
| `TOO_MANY_CARDS` | More than 3 cards in submission |
| `TOO_FEW_CARDS` | Fewer than 1 card in submission |
| `PUZZLE_NOT_ACTIVE` | Puzzle already ended |
| `TURN_LIMIT_EXCEEDED` | Turn budget exhausted |
| `MAJOR_CONTRADICTION` | Submission would create impossible timeline |

---

## 15) Reference pseudocode

```python
def resolve_submit(state, action):
    if not is_valid(state, action):
        return state, evt_rejected(...)

    cards = get_cards(state, action.cards)

    # Check contradictions
    contradictions = []
    for card in cards:
        result = check_contradiction(card, state.committed_story)
        if result:
            contradictions.append(result)
            if result.severity == 'MAJOR':
                return state, evt_blocked(result)

    # KOA responds
    counter = koa_responds(cards, state.counter_evidence)

    # Calculate damage
    corroboration = has_corroboration(cards)
    damage = calculate_damage(cards, counter, corroboration)

    # Check for refutation
    refutation_restore = 0
    for card in cards:
        if card.is_refutation:
            for counter_id in card.refutes:
                target = find_counter(state, counter_id)
                if target and not target.refuted:
                    refutation_restore += apply_refutation(card, target, state)

    total_damage = damage + refutation_restore

    # Apply effects
    scrutiny_delta = sum(1 for c in contradictions if c.severity == 'MINOR')
    scrutiny_delta += sum(1 for card in cards if card.trust == 'SKETCHY')

    state.scrutiny += scrutiny_delta
    if state.scrutiny >= 5:
        return state, evt_lost('SCRUTINY_LIMIT')

    state.resistance -= total_damage

    for card in cards:
        for proof in card.proves:
            mark_concern_addressed(state, proof)
        state.committed_story.append(card)
        state.hand.remove(card)

    state.turn_index += 1

    # Check end conditions
    if state.resistance <= 0 and all_concerns_addressed(state):
        return state, evt_won(...)

    if state.turn_index > state.turn_budget:
        return state, evt_lost('TURNS_EXHAUSTED')

    return state, evt_resolved(...)
```

---

## 16) Acceptance criteria

1. **Reproducibility:** Identical input sequence yields identical event log hashes.
2. **Explainability:** Every outcome includes damage breakdown and contradiction details.
3. **Latency:** Resolution is local and <50ms typical.
4. **Fairness:** LLM never appears in the resolver call graph.
5. **Tuning-ready:** Power values, thresholds, and penalties are pack-configurable.
6. **No hidden rules:** If UI displays "why it worked," it is derived from visible mechanics.

---

## 17) Cross references

* Game loop and phases: D02
* Card and counter definitions: D31
* Player-facing rules: D29
* Event model: D04A
