# D02 — GAME LOOP & RUN STRUCTURE

**Status:** Draft v2.0 (Ship-blocking)
**Last Updated:** 2026-01-26
**Purpose:** Define the playable run: phases, turn structure, mode differences, failure states, victory states. This document is the canonical "what happens when you play."
**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md

---

## 0) Mode split

Home Smart Home has two primary modes:

| Mode | Structure | Duration | Actions | MVP status |
|------|-----------|----------|---------|------------|
| **Daily** | Single-puzzle | 5-10 min | SUBMIT | **MVP** |
| **Freeplay** | Multi-puzzle ladder | 15-20 min | Extended moves | Post-MVP |

**Daily** is the flagship mode and ships first. **Freeplay** is expansion content.

---

# PART A: DAILY MODE (MVP)

---

## 1) Daily structure

A Daily is a **single puzzle** with a fixed concern set.

### 1.1 Daily components

* `target_lock`: what's locked (FRIDGE, THERMOSTAT, DOOR, etc.)
* `resistance_start`: 35 (Normal difficulty)
* `turn_limit`: 6 (Normal difficulty)
* `active_concerns[]`: 2-4 concerns (proof requirements)
* `counter_evidence[]`: 2-3 counter-evidence cards (KOA's challenges)
* `seed`: deterministic seed for puzzle generation

### 1.2 Daily phases

1. **Lock** — See target, resistance, concerns, turns, KOA's counter-evidence
2. **Solve** — Turn loop until win or loss
3. **Result** — Share card, score

**Note:** No draft phase. Players are DEALT 6 cards (same for all players).

---

## 2) Setup phase

### 2.1 Dealt hand (no draft)

* Player is DEALT **6 evidence cards** (no selection)
* Same 6 cards for all players (daily puzzle)
* LLM puzzle generator guarantees solvability
* Max 1 trap card per hand

### 2.2 Why no draft

* Faster start (instant play, no analysis phase)
* Reduces complexity (one less decision layer)
* Puzzle is in the PLAY, not card selection
* Same hand for everyone enables fair leaderboards

### 2.3 Counter visibility

* **FULL mode (default):** All KOA counters visible from turn 1
* **HIDDEN mode:** Counters hidden until triggered

---

## 3) Daily turn loop

### 3.1 Actions available

| Action | Effect | Turn cost |
|--------|--------|-----------|
| **SUBMIT** | Send 1-3 cards to address concerns and reduce resistance | 1 |

### 3.2 Turn structure

1. Player **selects** 1-3 cards from hand
2. System shows **preview** (concerns addressed, contradictions, KOA's response)
3. Player confirms **SUBMIT**
4. **Resolution**:
   - Cards checked against committed story (contradictions?)
   - KOA plays counter-evidence (if applicable)
   - Damage calculated (full, contested at 50%, or blocked)
   - Concerns marked addressed
   - Cards added to committed story
5. Turn counter decrements
6. Check win/loss

### 3.3 The Committed Story

All successfully submitted evidence enters the **committed story** immediately.

* Blocked submissions (MAJOR contradictions) do NOT enter the committed story
* MINOR contradictions DO enter (player accepted the scrutiny cost)
* The committed story persists for the entire run
* All future contradiction checks apply against the full committed story

### 3.4 KOA's Response

Each turn, KOA may play counter-evidence:
* KOA plays at most ONE counter per turn
* Counter targets specific proof types (IDENTITY, ALERTNESS, etc.)
* Counter applies 50% contested penalty to targeted cards
* Counter can be refuted by refutation cards

### 3.5 Win condition

* **Resistance reaches 0** AND **all concerns addressed** — device unlocks

### 3.6 Loss conditions

* **Turns reach 0** with resistance > 0 or concerns unaddressed
* **Scrutiny reaches 5** — immediate loss

---

## 4) Damage calculation

### 4.1 Base damage

Each evidence card has a power value (damage dealt on successful submission).

### 4.2 Contested penalty

If KOA's counter-evidence targets the card's proof type:
* Card deals 50% damage (per-card, round UP)
* Counter must NOT be refuted for penalty to apply

### 4.3 Corroboration bonus

If 2+ cards share the same claim (location, state, or activity):
* Total damage multiplied by 1.25 (round UP)
* Applied after contested penalties

### 4.4 Refutation

When a refutation card nullifies a counter:
* All previously-contested evidence affected by that counter deals its missing damage immediately (retroactive)
* Future submissions are no longer affected by that counter

---

## 5) Contradiction system

### 5.1 Severity levels

| Severity | Effect | Rationale |
|----------|--------|-----------|
| **MINOR** | +1 scrutiny, submission allowed | Suspicious but possible |
| **MAJOR** | Submission blocked | Logically impossible |

### 5.2 State conflicts

| Conflict | Time Gap | Severity |
|----------|----------|----------|
| ASLEEP ↔ AWAKE | <3 min | MAJOR |
| ASLEEP ↔ AWAKE | 3-10 min | MINOR |
| ASLEEP ↔ AWAKE | >10 min | NONE |

### 5.3 Location conflicts

| Conflict | Time Gap | Severity |
|----------|----------|----------|
| HOME ↔ GYM | <20 min | MAJOR |
| HOME ↔ GYM | 20-30 min | MINOR |
| HOME ↔ GYM | >30 min | NONE |

---

## 6) Scrutiny system

### 6.1 Scrutiny scale

Daily uses **0–5** integer scale.

### 6.2 Scrutiny sources

| Trigger | Scrutiny change |
|---------|-----------------|
| MINOR contradiction | +1 |
| SKETCHY trust card used | +1 |

### 6.3 Scrutiny 5 = Immediate Loss

When scrutiny reaches 5:
* Game ends immediately
* KOA: "Your story fell apart under scrutiny. Too many inconsistencies. Access denied."

---

## 7) Concerns system

### 7.1 What concerns are

Concerns are what KOA needs you to prove. All must be addressed to win.

### 7.2 Standard concerns

| ID | KOA asks | Required proof |
|----|----------|----------------|
| IDENTITY | "Prove you're you." | IDENTITY |
| ALERTNESS | "Prove you're awake." | ALERTNESS |
| INTENT | "Prove you meant to do this." | INTENT |
| LOCATION | "Prove you're actually home." | LOCATION |
| LIVENESS | "Prove you're not a photo." | LIVENESS |

### 7.3 Addressing concerns

A concern is addressed when submitted evidence proves the required proof type.
Contested evidence (50% penalty) still addresses concerns.

---

## 8) Daily scoring

### 8.1 Score factors

| Metric | Better Is |
|--------|-----------|
| Turns used | Fewer |
| Total power dealt | Higher |
| Contradictions triggered | Fewer (0 = perfect) |
| Counters refuted | More (shows mastery) |

### 8.2 Share card

* First clear performance is what you share
* Retries are unlimited
* Share card shows: seed, target, turns used, scrutiny, counters refuted

---

## 9) Daily fairness rules

* Same seed for everyone
* Same 6 dealt cards for everyone
* No meta perks affecting outcomes
* Cosmetics allowed
* Deterministic replay verification

---

# PART B: FREEPLAY MODE (Post-MVP)

---

## 10) Freeplay structure

A Freeplay run is a **multi-puzzle ladder**:

### 10.1 Act 1 — Warm-up

* Active concerns: **2-3**
* Turn budget: **6**
* Scrutiny escalation: **low**

### 10.2 Act 2 — Escalation

* Active concerns: **3**
* Turn budget: **6**
* Scrutiny escalation: **medium**

### 10.3 Boss — Lockdown

* Active concerns: **3-4**
* Turn budget: **6**
* Scrutiny escalation: **high**

---

## 11) Difficulty tuning

| Difficulty | Dealt Cards | Concerns | Resistance | Counters | Traps | Turns |
|------------|-------------|----------|------------|----------|-------|-------|
| Tutorial | 4 | 2 | 20 | 1 | 0 | 5 |
| Easy | 5 | 2 | 25 | 2 | 0 | 5 |
| Normal | 6 | 3 | 35 | 2 | 1 | 6 |
| Hard | 6 | 3 | 45 | 3 | 1 | 6 |
| Expert | 6 | 4 | 50 | 3 | 1 | 6 |

---

## 12) Terminology mapping

| Player term (Daily) | Internal term | Description |
|---------------------|---------------|-------------|
| Resistance | `lock_strength` | Health bar to deplete |
| Concern | `proof_requirement` | What you must prove |
| Counter-Evidence | `counter` | KOA's challenges |
| Submit | `submit` | Play cards |
| Evidence | `evidence_card` | Your cards |
| Refutation | `refutation_card` | Nullifies counters |

---

## 13) Acceptance criteria (v1)

1. A Daily takes **5–10 minutes** for median players
2. Player always understands what rules are active
3. Player always understands why a result happened (via explain panel)
4. Multiple viable approaches exist across a week of dailies
5. Loss is informative and encourages retry
6. The loop remains fun without any runtime LLM

---

## 14) Cross references

* Evidence and counter definitions: D31
* Resolver pipeline: D03
* Moves spec: D05
* Player-facing Daily contract: D29
* UI spec: D28
