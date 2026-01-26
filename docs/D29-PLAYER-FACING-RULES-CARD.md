# D29 — PLAYER-FACING RULES CARD (Daily Puzzle Contract) v2.0

**Status:** Draft v2.0 (ship-blocking)
**Owner:** Product / UX
**Last Updated:** 2026-01-26
**Purpose:** Player-visible rulebook for Daily mode. This is the contract: everything here is explicit, nothing is hidden. The same inputs always produce the same results.

**Mode:** Option B — Daily Draft (Single-Incident)

---

## 0) What this game is

**Life with AURA** is a 5-minute daily logic puzzle where a smart-home AI (AURA) blocks a device (like your fridge) until you prove—using evidence cards—that your action is "allowed."

You win by **reducing Resistance to 0** before you run out of turns.

---

## 1) Your goal (Win / Loss)

### You win when:

* **Resistance reaches 0** (the device unlocks).

### You lose when:

* You reach **Turn 0** and Resistance is still above 0.

There are no other loss conditions in Daily mode.

---

## 2) What you see on screen

### A) The AURA Monitor (Top HUD)

* **Target Device**: what's locked (FRIDGE, COFFEE, DOOR, etc.)
* **Resistance**: a bar (starts at 100, must reach 0)
* **Turns Remaining**: how many submissions you have left (usually **8**)
* **Scrutiny**: a meter from **0 to 5** (risk pressure)
* **Active Protocol**: the rule you must satisfy right now
  Example: "Timestamp Required" or "No Self-Report"

### B) AURA Avatar (Center)

AURA's avatar is always present. It is **visual + voice flavor**.
Important: AURA's lines do **not** change the rules. The rules are always deterministic.

### C) Transcript / Log (Center feed)

Shows exactly what happened each turn:

* what you submitted
* whether it satisfied the protocol
* how much Compliance you gained
* Scrutiny changes, Audits, and quarantines

### D) Evidence Panel (Bottom)

* Your **Evidence** (the 6 cards you drafted)
* Two **Payload Slots** (you may submit 1 or 2 cards)
* Two buttons:

  * **SUBMIT**
  * **SCAN** (refresh your options, but risky)

---

## 3) Key terms (plain language)

### Resistance

The lock's "stubbornness." Starts at **100**. You must reduce it to **0**.

### Evidence Cards

Your "digital scraps" (receipts, logs, sensor readings, emails). Each card has:

* **Impact** (a number): how strong it is if accepted
* **Trust Tier**: VERIFIED / PLAUSIBLE / SKETCHY
* **Tags**: like TIME, WORK, PURCHASE, SENSOR, AUTHORITY, LOCATION
* Optional Traits: like TIMESTAMPED, EDITABLE, CORROBORATABLE

### Active Protocol

The rule AURA is enforcing **right now**.
You must satisfy it to make progress.

### Payload

The 1 or 2 cards you place into the payload slots before pressing SUBMIT.

### Compliance (Progress)

How much Resistance you remove when a submission is accepted.

### Scrutiny

A risk meter (0–5). Risk rises when you use sketchy evidence, fail protocols, or scan too much.

### Audit

An automatic penalty event that triggers when Scrutiny hits 5.

### Quarantine

A temporary lock on a card (you cannot use it for a short time).

---

## 4) How a Daily works (Phases)

A Daily puzzle has **four phases** every time:

### Phase 1 — The Lock (Instant)

You see:

* the **Target**
* **Resistance (100)**
* **Turns Remaining**
* **Scrutiny**
* the **Active Protocol**

Press **START** to begin.

### Phase 2 — Draft (Pick your evidence)

You are shown **12 Evidence Cards**.
You must choose **6** to keep as your **Evidence (Loadout)**.

* The other 6 become your **Reserve** (hidden backup pool).
* You cannot use Reserve cards directly unless you **SCAN**.

### Phase 3 — Solve (Turn-based)

You play in turns until you win or run out of turns.

On each turn you may do **exactly one** of these actions:

* **SUBMIT** (try to reduce Resistance), or
* **SCAN** (refresh your evidence options; risky)

### Phase 4 — Result (End)

* If Resistance reaches 0: you win, and you get your result screen.
* If turns reach 0: you lose, and you see why.

---

## 5) The core action: SUBMIT

### Step-by-step

1. Choose **1 or 2** cards from your Evidence.
2. Put them into the **Payload Slots**.
3. Press **SUBMIT**.

### What happens next (deterministic)

AURA checks your payload against the **Active Protocol**.

#### If your payload satisfies the protocol:

* You gain **Compliance**.
* **Resistance decreases** by that Compliance amount.

#### If your payload does NOT satisfy the protocol:

* You gain **0 Compliance**.
* Resistance does not go down.
* Scrutiny usually rises (see Scrutiny rules).

---

## 6) The rules engine: Protocols and Paths

Each Active Protocol has **2–4 valid paths** (ways to satisfy it).

A "path" is a checklist like:

* "Payload must include AUTHORITY + TIME"
* "Payload must include PURCHASE + TIMESTAMPED"
* "At least one VERIFIED card must be included"

### Important: Protocol checks are payload-wide

It does NOT matter which card has which tag, as long as the **combined payload** satisfies the path.

Example:

* Protocol path requires: **AUTHORITY + TIME**
* Card A has AUTHORITY
* Card B has TIME
  → Together, the payload satisfies the path.

You can always tap the Active Protocol to see its valid paths (the game is a puzzle, not a guessing game).

---

## 7) Numbers: Impact, Compliance, and Resonance

### A) Impact (numbers are real in this game)

Yes—this game uses numbers.

Each Evidence Card has an **Impact value** (an integer).
Impact represents how much progress it can make *if accepted*.

### B) Compliance formula (how progress is calculated)

If the protocol is satisfied:

1. **BaseImpact** = sum of Impact values in your payload

* 1-card payload: Impact(A)
* 2-card payload: Impact(A) + Impact(B)

2. Check **Resonance** (combo bonus)

* Resonance occurs only when:

  * you submit **two** cards, and
  * they share at least one tag from this list:
    **TIME, LOCATION, WORK, PURCHASE, SENSOR, AUTHORITY**

If Resonance is true:

* **Multiplier = 1.5**
  Otherwise:
* **Multiplier = 1.0**

3. **Compliance** = floor(BaseImpact × Multiplier)

4. **Per-turn cap**
   Compliance is capped per turn to keep the Daily from being trivial:

* **Compliance = min(Compliance, 30)**

5. Resistance decreases:

* **Resistance = Resistance − Compliance**

If the protocol is not satisfied:

* **Compliance = 0**

---

## 8) The second action: SCAN (refresh, but risky)

SCAN is how you swap out weak evidence for new options.

### What SCAN does

* You choose **1 or 2** cards in your Evidence to discard.
* The game replaces them with cards pulled from your **Reserve**.
* This is deterministic for the daily seed (not "slot machine RNG").

### Cost of SCAN

When you SCAN:

* It consumes **1 Turn**
* It adds **+2 Scrutiny**

### Limits

* You cannot SCAN if Scrutiny is already maxed (5).
* The Daily may limit SCAN uses (typical: max 2).

---

## 9) Scrutiny, Audit, and Quarantine

Scrutiny is the game's pressure system. It is predictable, not random.

### Scrutiny increases

* If you SUBMIT a payload containing any **SKETCHY** card: **+1**
* If your SUBMIT fails the protocol (Compliance = 0): **+1**
* If you SCAN: **+2**

### Audit trigger

* If Scrutiny reaches **5**, an **Audit triggers immediately**.

### What an Audit does (penalty)

When an Audit triggers:

1. **Resistance heals +15** (up to its maximum)
2. One card is **Quarantined for 2 turns**:

   * specifically, the **highest-impact card you just submitted**
3. Scrutiny resets to **2**

### What Quarantine means

* A quarantined card is locked/disabled.
* You cannot place it into your payload until quarantine ends.

---

## 10) Turn structure (exact)

Each turn:

1. You choose an action: **SUBMIT** or **SCAN**
2. The game applies effects (Compliance, Scrutiny changes, possible Audit)
3. Turns remaining decreases by 1
4. AURA logs the outcome in the transcript

---

## 11) Worked example (one concrete turn)

**State:**

* Resistance = 70
* Turns remaining = 5
* Scrutiny = 3
* Active Protocol requires: **AUTHORITY + TIME**

**Your Evidence includes:**

* Card A: "FDA Article" — Impact 12 — Tag: AUTHORITY — Trust: VERIFIED
* Card B: "Timestamped Receipt" — Impact 10 — Tag: PURCHASE + TIME — Trust: PLAUSIBLE

**You SUBMIT Card A + Card B**

* Combined tags include AUTHORITY + TIME → protocol satisfied
* BaseImpact = 12 + 10 = 22
* Resonance? Shared allowlisted tag? (They share none) → no resonance
* Compliance = floor(22 × 1.0) = 22 (cap doesn't apply)
* Resistance becomes 70 − 22 = 48
* Scrutiny changes:

  * payload includes no SKETCHY → +0
* Turn ends.

---

## 12) What makes this a puzzle (strategy, not guessing)

Winning is about:

* drafting evidence that covers multiple protocol paths
* finding **Resonance pairs** so you can hit higher compliance efficiently
* deciding when to risk **SKETCHY** power versus staying safe
* choosing whether SCAN is worth the scrutiny + turn cost

---

## 13) What Daily mode is NOT (to avoid confusion)

* It is not a chat sandbox. You do not type freeform arguments.
* AURA's dialogue is flavor, not a rules engine.
* You are not building a long roguelite deck.
* There are no "Ops moves" (Flag/Rewire/Exploit) in Daily v1.

---

## 14) Quick reference (one screen summary)

**Daily Flow:** Lock → Draft 6 of 12 → Solve in 8 turns
**Actions:** SUBMIT (1–2 cards) or SCAN (swap cards)
**Win:** Resistance 0
**Loss:** Turns 0
**Compliance:** if protocol satisfied: floor((Impact sum) × (1.5 if Resonance else 1.0)), capped at 30
**Resonance:** 2 cards share TIME/LOCATION/WORK/PURCHASE/SENSOR/AUTHORITY
**Scrutiny:** 0–5, triggers Audit at 5
**Audit:** Resistance +15, quarantine highest-impact submitted card 2 turns, Scrutiny resets to 2

---

## 15) Terminology mapping (player ↔ internal)

For engineering/content authors—player-facing terms map to internal terms:

| Player term | Internal term |
|-------------|---------------|
| Resistance | `lock_strength` |
| Protocol | `gate` |
| Submit | `inject` |
| Scan | `cycle` |
| Evidence | `artifact` / `card` |
| Compliance | `damage` / `progress` |

---

## 16) What is NOT in Daily v1 (explicitly deferred)

These mechanics exist in design docs but are **not part of Daily MVP**:

* **Ops Tokens** and **Ops Protocols** (FLAG/REWIRE/EXPLOIT)
* **3-Act ladder** (multi-incident runs)
* **Boss Modifiers** (complex run modifiers)
* **Shops / between-act caches**
* **Meta-progression unlocks**

These may appear in **Freeplay / Challenge Mode** later.

---

## 17) Daily Intro Screen (what the player sees)

The intro screen is **minimal**. Full rules are one tap away.

### Visible by default:

```
DAILY: 2026-01-26 • Seed: AURA-1F9C

TARGET: FRIDGE
RESISTANCE: 100 → 0
TURNS: 8

PROTOCOL:
• NO_SELF_REPORT — Your word doesn't count.

[ START DAILY ]        [ FULL RULES ]
```

### "Full Rules" accordion contains:

* Draft rules (pick 6 of 12)
* Payload rules (1–2 cards)
* Compliance formula
* Resonance rules
* Scrutiny thresholds and audit behavior
* Scan rules
* Glossary

---

## 18) Scoring and sharing

Your **first clear** performance is what you share.

| Par | Turns remaining |
|-----|-----------------|
| Gold | ≥4 |
| Silver | ≥2 |
| Bronze | ≥1 |

* Retries are unlimited.
* Share card shows first-clear par and best par.

**Share card format:**
```
AURA Daily • 2026-01-26
FRIDGE unlocked
⭐⭐⭐ Gold (4 turns left)
Scrutiny peak: 3/5
No audits triggered
```

---

## Implementation notes

1. This document is the **authoritative player-facing contract** for Daily mode.
2. Engineering uses internal terminology; UI uses player terminology.
3. Every rule shown maps 1:1 to Protocol Pack, IncidentSpec, and Daily manifest.
4. No mechanic used during play may be absent from this contract.
