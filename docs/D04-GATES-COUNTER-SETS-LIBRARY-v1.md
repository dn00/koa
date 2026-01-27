# D04 — CONCERNS & COUNTER-EVIDENCE LIBRARY v2

**Status:** Draft v2.0 (ship-blocking)
**Owner:** Core Resolver / Content Design
**Last Updated:** 2026-01-26
**Purpose:** Define the authoritative Concern and Counter-Evidence library for Home Smart Home. This document covers what KOA asks players to prove (Concerns), how KOA challenges evidence (Counter-Evidence), and what cards nullify those challenges (Refutations).

**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md is the source of truth for core mechanics.

**Mode:** Option B — Daily uses player-facing "Concerns" (KOA's questions). Freeplay uses technical "Gates" / "Policy Gates".

---

## Terminology (Option B - D31 Aligned)

| Internal term | Daily (player) | Freeplay (player) |
|---------------|----------------|-------------------|
| `concern` | **"Prove you're..."** | **Gate** / **Policy Gate** |
| `counter_evidence` | **KOA's Challenge** | **Counter-Evidence** |
| `refutation` | **Explanation** | **Refutation** |
| `resistance` | **Resistance** | **Gate Strength** |
| `proof_type` | (implicit in KOA's voice) | **Proof Type** |

Daily mode simplifies: KOA speaks naturally ("Prove you're awake"), counter-evidence is shown as KOA's challenges. Freeplay exposes technical terminology.

---

## 0) D31 Core Model

### 0.1 Concerns (What KOA Asks You to Prove)

A **Concern** is a requirement KOA has that you must address to win. Concerns are presented as KOA's questions.

```typescript
interface Concern {
  id: string;
  koaAsks: string;           // "Prove you're you."
  requiredProof: ProofType[];
  stateRequirement?: StateValue[];  // For ALERTNESS: AWAKE, ALERT, ACTIVE
}
```

### 0.2 Counter-Evidence (How KOA Challenges You)

**Counter-Evidence** is KOA's ammunition for challenging your evidence. Each counter targets specific proof types and applies a 50% damage penalty when active.

```typescript
interface CounterEvidence {
  id: string;
  name: string;              // "Security Camera — Front Door"
  targets: ProofType[];      // What evidence types this challenges
  claim: string;             // "No one detected at door 2:00-2:30am"
  refutableBy: string[];     // Card IDs that can nullify this
}
```

### 0.3 Refutation Cards (How You Nullify Challenges)

**Refutation Cards** nullify KOA's counter-evidence. When played, the counter is "spent" and previous contested evidence has its damage restored.

```typescript
interface RefutationCard extends EvidenceCard {
  refutes: string[];         // Counter-evidence IDs this nullifies
}
```

### 0.4 Proof Types

```typescript
type ProofType =
  | 'IDENTITY'    // Biometrics, Face ID, fingerprint
  | 'ALERTNESS'   // Awake/asleep/drowsy state
  | 'LOCATION'    // Where you are/were
  | 'INTENT'      // Purpose, deliberate action
  | 'LIVENESS'    // Not a photo/recording/bot
```

---

## 1) Standard Concerns (5 types)

### C01 — IDENTITY
**ID:** `concern.core.IDENTITY`
**KOA Asks:** "Prove you're you."
**Required Proof:** IDENTITY
**State Requirement:** none

**What satisfies it:**
- Face ID unlock events
- Biometric sensor reads
- Voice command authentication
- Device unlock records

---

### C02 — ALERTNESS
**ID:** `concern.core.ALERTNESS`
**KOA Asks:** "Prove you're awake."
**Required Proof:** ALERTNESS
**State Requirement:** [AWAKE, ALERT, ACTIVE] (any of these)

**What satisfies it:**
- Smart watch activity readings (state: AWAKE/ALERT/ACTIVE)
- Sleep tracker showing NOT asleep
- Motion sensor activity
- Voice commands (imply alertness)

**Note:** Cards claiming ASLEEP, DROWSY, or IDLE do NOT satisfy this concern even if they prove ALERTNESS type.

---

### C03 — INTENT
**ID:** `concern.core.INTENT`
**KOA Asks:** "Prove you meant to do this."
**Required Proof:** INTENT
**State Requirement:** none

**What satisfies it:**
- Voice commands ("Open fridge")
- App interaction logs
- Deliberate device triggers
- Search history (looking up related info)

---

### C04 — LOCATION
**ID:** `concern.core.LOCATION`
**KOA Asks:** "Prove you're actually home."
**Required Proof:** LOCATION
**State Requirement:** none (specific location may vary by puzzle)

**What satisfies it:**
- GPS data showing HOME
- Device proximity sensors
- Network connection logs
- Room-specific sensors (kitchen motion, etc.)

---

### C05 — LIVENESS
**ID:** `concern.core.LIVENESS`
**KOA Asks:** "Prove you're not a photo."
**Required Proof:** LIVENESS
**State Requirement:** none

**What satisfies it:**
- Infrared face scan
- Pulse detection
- Movement over time
- Voice with variance analysis

---

## 2) Counter-Evidence Library

### Counter Families

Counter-evidence is grouped by the data source KOA uses:

| Family | Targets | Example Counters |
|--------|---------|------------------|
| VISUAL | IDENTITY, LOCATION | Security cameras, doorbell cams |
| BIOMETRIC | ALERTNESS, LIVENESS | Sleep trackers, health monitors |
| LOCATION | LOCATION | GPS history, geofencing logs |
| SOCIAL | IDENTITY, LOCATION | Social media check-ins, shared posts |
| SYSTEM | INTENT, IDENTITY | Device logs, app usage records |

---

### CE01 — SECURITY_CAMERA
**ID:** `counter.visual.SECURITY_CAMERA`
**Name:** "Security Camera"
**Targets:** [IDENTITY, LOCATION]
**Claim:** "No one detected at door {time_range}"
**Refutable By:**
- Maintenance Log (camera was updating)
- Blind Spot Report (angle limitation)
- Power Outage Record (camera offline)

---

### CE02 — SLEEP_DATA_SYNC
**ID:** `counter.biometric.SLEEP_DATA_SYNC`
**Name:** "Sleep Data Sync"
**Targets:** [ALERTNESS]
**Claim:** "User asleep until {time}"
**Refutable By:**
- Noise Complaint (neighbor heard activity)
- Alarm Log (alarm went off)
- Sleep Override (user marked "restless")

---

### CE03 — GPS_HISTORY
**ID:** `counter.location.GPS_HISTORY`
**Name:** "GPS History"
**Targets:** [LOCATION]
**Claim:** "Phone at {other_location} until {time}"
**Refutable By:**
- Phone Left Behind (device and user separated)
- GPS Spoof Report (known inaccuracy)
- Secondary Device (other device shows home)

---

### CE04 — SOCIAL_CHECKIN
**ID:** `counter.social.SOCIAL_CHECKIN`
**Name:** "Social Check-in"
**Targets:** [LOCATION]
**Claim:** "Tagged at {location} until {time}"
**Refutable By:**
- Misattributed Tag (someone else tagged you)
- Left Early Receipt (payment before check-in end)
- Manual Post Correction (edited location)

---

### CE05 — HEALTH_APP
**ID:** `counter.biometric.HEALTH_APP`
**Name:** "Health App"
**Targets:** [ALERTNESS, LIVENESS]
**Claim:** "Fasting mode active until {time}"
**Refutable By:**
- Mode Override (user disabled)
- Medical Exception (special circumstance)
- Schedule Error (wrong timezone)

---

### CE06 — DEVICE_LOG
**ID:** `counter.system.DEVICE_LOG`
**Name:** "Device Activity Log"
**Targets:** [INTENT]
**Claim:** "No device interaction since {time}"
**Refutable By:**
- Sync Delay Report (log didn't update)
- Voice-Only Interaction (no touch needed)
- Automation Trigger (scheduled action)

---

## 3) Counter-Evidence Effects

### 3.1 Base Effect: CONTESTED

All counter-evidence in Daily mode applies a **50% damage penalty** per contested card.

| Scenario | Damage | Effect |
|----------|--------|--------|
| No counter applies | 100% | Full damage |
| Counter applies, not refuted | 50% | Contested penalty |
| Counter applies, refuted later | 100% | Damage restored retroactively |

### 3.2 Counter Targeting Rules

- KOA plays **one counter per turn** (first applicable)
- Counter targets a **ProofType**, not a specific card
- If player submission contains multiple cards with targeted proof type, all are contested
- Counters are "spent" when refuted and cannot trigger again

### 3.3 Refutation Timing

When a refutation card is played:
1. Target counter is marked "spent"
2. All previous evidence contested by that counter has damage restored
3. Future submissions are no longer contested by that counter

---

## 4) Puzzle Authoring Constraints

### 4.1 Solvability Requirements (D31)

Every Daily puzzle must ensure:
- All concerns addressable with dealt hand
- Main path power ≥ resistance + 10 (comfortable margin)
- At least 2 distinct winning paths
- Max 1 trap card per hand
- Refutation exists for primary counter

### 4.2 Counter Distribution

- Easy puzzles: 1-2 counters
- Normal puzzles: 2 counters
- Hard puzzles: 3 counters
- Expert puzzles: 3-4 counters

### 4.3 Refutation Availability

Every counter in a puzzle must have at least one refutation card available in the dealt hand OR the puzzle must be winnable despite the contested penalty.

---

## 5) Freeplay: Gates (Post-MVP)

Freeplay mode uses the more complex Gate system from v1. Gates have multiple counter paths and involve tag matching.

**Note:** Daily MVP uses Concerns + Counter-Evidence. Freeplay uses Gates + Counter Paths. The systems are compatible but Daily is simpler.

### Legacy Gate Mapping

| Daily Concern | Freeplay Gate(s) |
|---------------|------------------|
| IDENTITY | NO_SELF_REPORT, SOURCE_ALLOWLIST |
| ALERTNESS | HUMAN_FACTORS, CONSISTENCY_CHECK |
| LOCATION | TIMESTAMP_REQUIRED, JURISDICTION_SCOPE |
| INTENT | CONSISTENCY_CHECK, RATE_LIMIT |
| LIVENESS | INTEGRITY_LOCK, SENSOR_DRIFT |

---

## 6) Cross References

- D31: Core mechanics specification (Adversarial Testimony)
- D09: JSON schemas for Concern, CounterEvidence, RefutationCard
- D10: Solvability validation for puzzles
- D12: KOA voice lines for counters and refutations
- D15: Terminology mapping for player-facing language
