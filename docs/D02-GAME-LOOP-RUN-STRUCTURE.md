# D02 — GAME LOOP & RUN STRUCTURE

**Status:** Draft v1.1 (Ship-blocking)
**Last Updated:** 2026-01-26
**Purpose:** Define the playable run: phases, turn structure, mode differences, failure states, victory states. This document is the canonical "what happens when you play."

---

## 0) Mode split (Option B decision)

Life with AURA has two primary modes:

| Mode | Structure | Duration | Actions | MVP status |
|------|-----------|----------|---------|------------|
| **Daily** | Single-incident | 5-10 min | SUBMIT, SCAN | **MVP** |
| **Freeplay** | 3-incident ladder | 15-20 min | 6 moves + Ops | Post-MVP |

**Daily** is the flagship mode and ships first. **Freeplay** is expansion content.

---

# PART A: DAILY MODE (MVP)

---

## 1) Daily structure

A Daily is a **single incident** with a fixed constraint set.

### 1.1 Daily components

* `target_lock`: what's locked (FRIDGE, THERMOSTAT, DOOR, etc.)
* `resistance_start`: 100 (typical)
* `turn_limit`: 8 (typical)
* `active_protocols[]`: 1–2 protocols (gates) the player must satisfy
* `modifier`: optional Daily constraint (rare)
* `seed`: deterministic seed for draft order, reserve order

### 1.2 Daily phases

1. **Lock** — See target, resistance, protocols, turns
2. **Draft** — Pick 6 of 12 evidence cards
3. **Solve** — Turn loop until win or loss
4. **Result** — Share card, par medal

---

## 2) Daily draft phase

### 2.1 Card pool

* Game generates **12 Evidence Cards**
* Player picks **6** to keep as **Evidence (Loadout)**
* Remaining **6** become **Reserve** (hidden backup pool)

### 2.2 Draft constraints (content authoring)

Every draft must include:
* 1–2 high Impact but SKETCHY cards ("temptation")
* 2–3 VERIFIED low/medium Impact cards ("safety")
* At least 2 cards that form a Resonance pair ("synergy")
* At least 1 "AUTHORITY" or "TIME" anchor (prevents soft-lock)

### 2.3 Reserve

* Reserve cards are in seed-deterministic order
* SCAN replaces Evidence cards with Reserve cards in order
* Player cannot directly see Reserve contents

---

## 3) Daily turn loop

### 3.1 Actions available

| Action | Effect | Turn cost | Scrutiny |
|--------|--------|-----------|----------|
| **SUBMIT** | Send 1–2 cards | 1 | varies |
| **SCAN** | Swap cards from reserve | 1 | +2 |

### 3.2 Turn structure

1. Player chooses action (SUBMIT or SCAN)
2. Resolver evaluates deterministically
3. Effects applied (Resistance change, Scrutiny change, possible Audit)
4. Turn counter decrements
5. Check win/loss

### 3.3 Win condition

* **Resistance reaches 0** — device unlocks

### 3.4 Loss condition

* **Turns reach 0** with Resistance > 0

---

## 4) Daily audit system

### 4.1 Scrutiny scale

Daily uses **0–5** integer scale.

### 4.2 Scrutiny sources

| Trigger | Scrutiny change |
|---------|-----------------|
| SUBMIT with SKETCHY | +1 |
| SUBMIT fails protocol | +1 |
| SCAN | +2 |

### 4.3 Audit trigger

When Scrutiny reaches **5**, an Audit triggers.

### 4.4 Audit penalty

1. Resistance heals **+15**
2. Highest-impact card just submitted is **Quarantined 2 turns**
3. Scrutiny resets to **2**

### 4.5 Quarantine

Quarantined cards cannot be placed in payload until quarantine expires.

---

## 5) Daily scoring

### 5.1 Par medals

| Medal | Turns remaining |
|-------|-----------------|
| Gold | ≥4 |
| Silver | ≥2 |
| Bronze | ≥1 |

### 5.2 Share card

* First clear performance is what you share
* Retries are unlimited
* Share card shows: seed, target, medal, scrutiny peak, audit count

---

## 6) Daily fairness rules

* Same seed for everyone
* Standardized draft pool
* No meta perks affecting outcomes
* Cosmetics allowed
* Deterministic replay verification

---

# PART B: FREEPLAY MODE (Post-MVP)

---

## 7) Freeplay structure

A Freeplay run is a **3-incident ladder**:

### 7.1 Act 1 — Warm-up

* Active gates: **1–2**
* Turn budget: **7–9**
* Scrutiny escalation: **low**
* Goal: teach today's "texture," establish deck direction

### 7.2 Act 2 — Escalation

* Active gates: **2**
* Turn budget: **7–9**
* Scrutiny escalation: **medium**
* Adds **one modifier** (non-boss severity)

### 7.3 Boss — Lockdown

* Active gates: **2–3**
* Turn budget: **8–10**
* Scrutiny escalation: **high**
* Adds **boss modifier** (forces adaptation)

---

## 8) Freeplay incident structure

### 8.1 Incident components

* `target_lock`: e.g., FRIDGE, THERMOSTAT, FRONT_DOOR
* `active_gates[]`: 1–3 gate instances
* `routine`: AURA behavior profile (bark selection, not fairness)
* `turn_limit`
* `draft_offer_profile`
* `reward_table`

### 8.2 Victory condition

Incident cleared when **all gate strengths reach 0**.

### 8.3 Failure condition

* Turn limit reached without clearing all gates
* Hard audit failure (if enabled)
* Boss fail-state trigger (rare)

---

## 9) Freeplay turn loop

### 9.1 The core verb loop

**Recon → Build → Inject → Adapt**

#### Recon (read state)
* Active gate chips + strengths
* Scrutiny level
* Current modifier chips
* Hand contents and tool availability

#### Build (choose action)
* Select one **Move** (from 6)
* Attach up to **2 artifacts**
* Optionally select a tool

#### Inject (execute)
* Press **INJECT** (or move's action button)
* Resolver computes outcome
* UI updates instantly

#### Adapt (react)
* Observe changed gate strengths
* Observe scrutiny changes
* React to audit triggers

### 9.2 Actions available (6 moves)

| Move | Token Cost | Purpose |
|------|------------|---------|
| INJECT | 0 | Standard payload submission |
| FLAG | 1 | Reduce gate ambiguity |
| REWIRE | 1 | Reinterpret tags |
| CORROBORATE | 0 | Upgrade trust tier |
| CYCLE | 0 | Draw new cards |
| EXPLOIT | 2 | High-impact bypass |

See D05 for full move definitions.

---

## 10) Freeplay hand model

### 10.1 Deck composition

* A run maintains a **Deck** of artifacts and **Tools** (separate tray)
* **Hand**: up to 5 artifacts visible
* Between acts, deck changes via draft/shop

### 10.2 Draw and discard

* At TURN_START: if `hand_size < 5`, draw until 5
* If deck empty, reshuffle discard (deterministic)
* Played artifacts go to discard unless consumed

### 10.3 Tokens / currencies

* **Scrutiny** (pressure) — state variable affecting audits
* **Ops Tokens** (cap 3) — costs FLAG, REWIRE, EXPLOIT
* **Run-currency** (Cache Credits) — spent in Cache/Shop

---

## 11) Freeplay between-act: Cache/Shop

### 11.1 Timing

After clearing Act 1 and Act 2, enter Cache/Shop before next act.

### 11.2 Offer types

* Add 1 artifact
* Add 1 tool
* Upgrade a tool
* Remove a weak artifact
* Mitigate scrutiny

### 11.3 Design constraint

Upgrades increase **options**, not raw damage.

---

## 12) Freeplay audits

### 12.1 When audits trigger

Scrutiny crosses thresholds: LOW → MED → HIGH

### 12.2 What audits do

* Force corroboration
* Temporarily narrow allowed inputs
* Impose penalties

**Avoid:** "audit = instant loss" in v1.

### 12.3 Audit pacing targets

* Act1: audit rare
* Act2: audit possible
* Boss: audit likely if player leans on sketchy play

---

## 13) Freeplay completion

### 13.1 Win

* Clear Boss incident within turn limits
* Present "Access Granted" results
* Run stats, codex unlocks, credits, recap share

### 13.2 Loss

* Fail any incident
* Show "Access Denied"
* Grant partial rewards
* Generate shareable "Rap Sheet" recap

---

## 14) Terminology mapping

| Player term (Daily) | Internal term | Freeplay term |
|---------------------|---------------|---------------|
| Resistance | `lock_strength` | Gate Strength |
| Protocol | `gate` | Gate |
| Submit | `inject` | Inject |
| Scan | `cycle` | Cycle |
| Evidence | `artifact` | Artifact |
| Compliance | `damage` | Damage |

---

## 15) Acceptance criteria (v1)

1. A Daily takes **5–10 minutes** for median players
2. A Freeplay run (3 incidents) takes **15–20 minutes**
3. Player always understands what rules are active
4. Player always understands why a result happened (via explain panel)
5. Multiple viable approaches exist across a week of dailies
6. Loss is informative and encourages retry
7. The loop remains fun without any runtime LLM

---

## 16) Cross references

* Move definitions: D05
* Gate counter paths: D04
* Resolver pipeline: D03
* Event model: D04A
* Player-facing Daily contract: D29
* UI spec: D28
