# D09 — PACK SCHEMAS (JSON) v2.0

**Status:** Draft v2.0
**Owner:** Content Platform / Runtime
**Last Updated:** 2026-01-26
**Purpose:** Define the canonical JSON schemas for Home Smart Home packs (Puzzle, Evidence, Counter-Evidence, Voice) with required fields, invariants, and minimal examples. These schemas are designed for deterministic offline-first execution and fail-closed validation.

**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md is the source of truth for core mechanics.

**Mode:** Option B — Daily uses simplified schemas (EvidenceCard, Concern, CounterEvidence). Freeplay uses extended schemas (Artifact, Gate, Tool).

---

## 1) Conventions (applies to all pack types)

### 1.1 Envelope (required for all packs)

All pack files are JSON objects with this top-level structure:

```json
{
  "pack_type": "puzzle|evidence|counter|voice|protocol",
  "pack_id": "string",
  "version": "MAJOR.MINOR.PATCH",
  "schema_version": "2.0",
  "created_at": "YYYY-MM-DD",
  "requires": {
    "min_engine_version": "0.2.0",
    "min_client_version": "0.2.0",
    "capabilities_required": ["string"]
  },
  "meta": {
    "title": "string",
    "description": "string",
    "author": "string",
    "tags": ["string"]
  },
  "content": {}
}
```

**Rules:**

* `pack_type`, `pack_id`, `version`, `schema_version`, `content` are required.
* `pack_id` must be stable across versions.
* `version` is immutable once published.
* `schema_version` for v2 is `"2.0"`.

### 1.2 IDs and namespacing

All definitions referenced across packs must use stable, prefixed IDs.

**Required prefix convention (D31-aligned):**

| Entity Type | Prefix Pattern | Example |
|-------------|----------------|---------|
| Concern | `concern.<namespace>.<NAME>` | `concern.core.IDENTITY` |
| CounterEvidence | `counter.<namespace>.<NAME>` | `counter.visual.SECURITY_CAMERA` |
| EvidenceCard | `evidence.<namespace>.<NAME>` | `evidence.core.FACE_ID` |
| RefutationCard | `refutation.<namespace>.<NAME>` | `refutation.core.MAINTENANCE_LOG` |
| Puzzle | `puzzle.<namespace>.<NAME>` | `puzzle.daily.2026_01_26` |
| Voice | `voice.<namespace>` | `voice.koa_default` |

**Legacy prefixes (Freeplay):**

| Entity Type | Prefix Pattern | Example |
|-------------|----------------|---------|
| Gate | `gate.<namespace>.<NAME>` | `gate.core.NO_SELF_REPORT` |
| Artifact | `artifact.<namespace>.<NAME>` | `artifact.core.APPLE_HEALTH_LOG` |
| Tool | `tool.<namespace>.<NAME>` | `tool.core.CORROBORATE` |

### 1.3 Determinism requirements

* Pack JSON must not contain dynamic fields that affect mechanics.
* All dialogue/testimony combinations are pre-generated per puzzle.
* Random selection driven by seed + RNG stream keys, not ad hoc randomness.

---

## 2) D31 Core Schemas (Daily Mode)

### 2.1 EvidenceCard Schema

Evidence cards are the player's tools for proving their case.

```json
{
  "card_id": "evidence.core.FACE_ID_FRONT_DOOR",
  "name": "Face ID — Front Door",
  "source": "Apple HomeKit",
  "power": 12,
  "proves": ["IDENTITY"],
  "claims": {
    "timeRange": ["2:05am", "2:10am"],
    "location": "KITCHEN",
    "state": "AWAKE",
    "activity": null
  },
  "flavor": "Biometric match: 99.7% confidence"
}
```

**TypeScript interface:**

```typescript
interface EvidenceCard {
  card_id: string;
  name: string;
  source: string;
  power: number;                    // Damage dealt on successful submission
  proves: ProofType[];              // What concerns this addresses
  claims: {
    timeRange: [string, string];    // ["2:05am", "2:10am"]
    location?: LocationValue;
    state?: StateValue;
    activity?: ActivityValue;
  };
  flavor: string;
}
```

**Validation rules:**

* `power` must be 1-20
* `proves` must contain at least one ProofType
* `timeRange` required, format "H:MMam/pm"
* At least one of `location`, `state`, or `activity` should be present

### 2.2 RefutationCard Schema

Refutation cards nullify KOA's counter-evidence.

```json
{
  "card_id": "refutation.core.MAINTENANCE_LOG",
  "name": "Maintenance Log",
  "source": "System Records",
  "power": 5,
  "refutes": ["counter.visual.SECURITY_CAMERA"],
  "flavor": "Camera offline 2:00-2:30am — firmware update"
}
```

**TypeScript interface:**

```typescript
interface RefutationCard extends EvidenceCard {
  refutes: string[];                // Counter-evidence IDs this nullifies
}
```

**Note:** Refutation cards have NO claims (no timeRange, location, state, activity). They cannot cause contradictions.

### 2.3 CounterEvidence Schema

Counter-evidence is KOA's ammunition for challenging player evidence.

```json
{
  "counter_id": "counter.visual.SECURITY_CAMERA",
  "name": "Security Camera",
  "targets": ["IDENTITY", "LOCATION"],
  "claim": "No one detected at door 2:00-2:30am",
  "refutableBy": [
    "refutation.core.MAINTENANCE_LOG",
    "refutation.core.BLIND_SPOT_REPORT"
  ]
}
```

**TypeScript interface:**

```typescript
interface CounterEvidence {
  counter_id: string;
  name: string;
  targets: ProofType[];             // What evidence types this challenges
  claim: string;                    // KOA's claim
  refutableBy: string[];            // RefutationCard IDs that nullify this
}
```

### 2.4 Concern Schema

Concerns are what KOA needs the player to prove.

```json
{
  "concern_id": "concern.core.ALERTNESS",
  "koaAsks": "Prove you're awake.",
  "requiredProof": ["ALERTNESS"],
  "stateRequirement": ["AWAKE", "ALERT", "ACTIVE"]
}
```

**TypeScript interface:**

```typescript
interface Concern {
  concern_id: string;
  koaAsks: string;                  // KOA's voice line
  requiredProof: ProofType[];
  stateRequirement?: StateValue[];  // For ALERTNESS: must claim one of these
}
```

### 2.5 Enums

```typescript
type ProofType = 'IDENTITY' | 'ALERTNESS' | 'LOCATION' | 'INTENT' | 'LIVENESS';

type LocationValue =
  | 'HOME' | 'BEDROOM' | 'KITCHEN' | 'LIVING_ROOM' | 'BATHROOM'
  | 'GYM' | 'WORK' | 'COFFEE_SHOP' | 'OUTSIDE';

type StateValue = 'AWAKE' | 'ASLEEP' | 'DROWSY' | 'ALERT' | 'ACTIVE' | 'IDLE';

type ActivityValue = 'WALKING' | 'SLEEPING' | 'SITTING' | 'EXERCISING' | 'EATING';

type KoaMoodState =
  | 'NEUTRAL' | 'CURIOUS' | 'SUSPICIOUS' | 'BLOCKED'
  | 'GRUDGING' | 'IMPRESSED' | 'RESIGNED' | 'SMUG';

type ContradictionSeverity = 'NONE' | 'MINOR' | 'MAJOR';
```

---

## 3) Puzzle Pack Schema (`pack_type = "puzzle"`)

### 3.1 Purpose

Defines complete Daily puzzles with pre-generated content including all 41 testimony combinations.

### 3.2 `content` structure

```json
{
  "puzzle_id": "puzzle.daily.2026_01_26",
  "display": {
    "device": "SMART FRIDGE",
    "lockReason": "Midnight snacking violates health protocol",
    "theme": "kitchen"
  },
  "difficulty": "NORMAL",
  "resistance": 40,
  "turnBudget": 6,
  "concerns": [
    { "concern_id": "concern.core.IDENTITY" },
    { "concern_id": "concern.core.ALERTNESS" },
    { "concern_id": "concern.core.INTENT" }
  ],
  "counterEvidence": [
    { "counter_id": "counter.visual.SECURITY_CAMERA", "inline": {...} },
    { "counter_id": "counter.biometric.SLEEP_DATA_SYNC", "inline": {...} }
  ],
  "dealtHand": [
    { "card_id": "evidence.core.FACE_ID", "inline": {...} },
    { "card_id": "evidence.core.SMART_WATCH", "inline": {...} },
    { "card_id": "evidence.core.VOICE_LOG", "inline": {...} },
    { "card_id": "refutation.core.MAINTENANCE_LOG", "inline": {...} },
    { "card_id": "refutation.core.NOISE_COMPLAINT", "inline": {...} },
    { "card_id": "evidence.core.GYM_WRISTBAND", "inline": {...} }
  ],
  "koaOpening": {
    "lines": [
      "It's 2:14am.",
      "You're standing in front of your refrigerator.",
      "Again."
    ]
  },
  "preGeneratedTestimony": {
    "combinations": [...]
  }
}
```

### 3.3 Pre-generated testimony combinations

For each of the 41 possible card combinations (6 singles + 15 pairs + 20 triples), pre-generate:

```json
{
  "combination_id": "combo_FACE_ID_VOICE_LOG",
  "cards": ["evidence.core.FACE_ID", "evidence.core.VOICE_LOG"],
  "playerTestimony": "I walked to the door and said 'open fridge.' My face proves I was there.",
  "koaResponse": {
    "hasCounter": true,
    "counterTriggered": "counter.visual.SECURITY_CAMERA",
    "lines": [
      "Your face. At the door. At 2:07am.",
      "My camera saw no one.",
      "But sure."
    ],
    "mood": "SUSPICIOUS"
  },
  "mechanics": {
    "concernsAddressed": ["IDENTITY", "INTENT"],
    "baseDamage": 22,
    "contested": true,
    "contestedDamage": 11,
    "corroboration": true,
    "corroborationBonus": 1.25,
    "finalDamage": 14
  }
}
```

### 3.4 Difficulty parameters

| Difficulty | Cards | Concerns | Resistance | Counters | Traps | Turns |
|------------|-------|----------|------------|----------|-------|-------|
| Tutorial | 4 | 2 | 20 | 1 | 0 | 5 |
| Easy | 5 | 2 | 25 | 2 | 0 | 5 |
| Normal | 6 | 3 | 35 | 2 | 1 | 6 |
| Hard | 6 | 3 | 45 | 3 | 1 | 6 |
| Expert | 6 | 4 | 50 | 3 | 1 | 6 |

---

## 4) Evidence Pack Schema (`pack_type = "evidence"`)

### 4.1 Purpose

Defines reusable evidence card templates for puzzle generation.

### 4.2 `content` structure

```json
{
  "evidenceCards": [...],
  "refutationCards": [...],
  "counterEvidence": [...],
  "concerns": [...]
}
```

### 4.3 Evidence card template

```json
{
  "card_id": "evidence.core.FACE_ID",
  "name": "Face ID — Front Door",
  "source": "Apple HomeKit",
  "powerRange": [10, 14],
  "proves": ["IDENTITY"],
  "claimTemplate": {
    "locationOptions": ["KITCHEN", "LIVING_ROOM"],
    "stateOptions": ["AWAKE", "ALERT"],
    "timeRangeGenerator": "INCIDENT_WINDOW"
  },
  "flavorOptions": [
    "Biometric match: 99.7% confidence",
    "Face recognized. Identity confirmed.",
    "Door unlocked by authorized user."
  ]
}
```

---

## 5) Voice Pack Schema (`pack_type = "voice"`)

### 5.1 Purpose

Defines KOA bark lines keyed by deterministic outcomes (OutcomeKey), plus tone/lexicon constraints.

### 5.2 `content` structure

```json
{
  "voice_id": "voice.koa_default",
  "style": {
    "tone": "passive_aggressive_bureaucrat",
    "banned_terms": ["objection", "verdict", "guilty", "not guilty", "cross-examination", "testimony"]
  },
  "barks": [...],
  "fallbacks": {...}
}
```

### 5.3 OutcomeKey bark entry

```json
{
  "key": {
    "event": "COUNTER_PLAYED",
    "counter_id": "counter.visual.SECURITY_CAMERA",
    "outcome": "CONTESTED"
  },
  "lines": [
    "My front door camera saw no one at 2:07am. Your Face ID claims you were there. One of us is wrong.",
    "The camera recorded nothing. Your biometrics say otherwise. Interesting."
  ],
  "mood": "SUSPICIOUS",
  "selection_policy": {
    "mode": "DETERMINISTIC_HASH",
    "avoid_repeat_window": 5
  }
}
```

### 5.4 KOA mood state barks

```json
{
  "mood_barks": {
    "NEUTRAL": ["Awaiting input.", "Ready when you are."],
    "CURIOUS": ["Let's see what you've got.", "Interesting selection..."],
    "SUSPICIOUS": ["That's... suspicious.", "The math doesn't math."],
    "BLOCKED": ["Impossible.", "The laws of physics apply to you too."],
    "GRUDGING": ["Fine.", "I suppose.", "How convenient."],
    "IMPRESSED": ["...Flawless.", "Annoyingly consistent."],
    "RESIGNED": ["You're still trying? ...Admirable."],
    "SMUG": ["Access denied.", "Better luck tomorrow."]
  }
}
```

### 5.5 Fallback policy

```json
{
  "fallbacks": {
    "missing_exact_key": "DROP_DIMENSIONS_IN_ORDER",
    "drop_order": ["counter_id", "outcome"],
    "ultimate_default": "..."
  }
}
```

**Rules:**

* No bark line may contain banned courtroom terminology (enforced by validator).
* KOA lines must not promise mechanical effects not represented in the resolver output.

---

## 6) Legacy Protocol Pack Schema (Freeplay)

### 6.1 Purpose

Defines extended rules for Freeplay mode: gates, counter-sets, modifiers, routines.

**Note:** This section preserves v1 Protocol Pack schema for Freeplay compatibility. Daily mode uses simplified Concern + CounterEvidence schemas.

### 6.2 Gate definition (Freeplay)

```json
{
  "gate_id": "gate.core.NO_SELF_REPORT",
  "display": {
    "name": "No Self-Report",
    "chip": "NO SELF REPORT",
    "description": "Self-reported claims are not accepted without corroboration."
  },
  "counter_paths": [
    {
      "path_id": "A",
      "requires": {
        "min_trust_tier": "VERIFIED",
        "all_tags": ["Sensor"],
        "traits_all": ["SourceTrusted"]
      },
      "effect_on_pass": { "gate_strength_delta": -35, "scrutiny_delta": -1 },
      "effect_on_fail": { "gate_strength_delta": 0, "scrutiny_delta": +2 }
    }
  ]
}
```

### 6.3 Artifact definition (Freeplay)

```json
{
  "artifact_id": "artifact.core.APPLE_HEALTH_LOG",
  "display": { "name": "Apple Health Log" },
  "power": 12,
  "impact": 8,
  "base_power": 6,
  "trust_tier": "VERIFIED",
  "tags": ["Sensor", "Authority"],
  "traits": ["Timestamped", "SourceTrusted"]
}
```

**Field mapping:**

| Field | Daily Mode | Freeplay Mode |
|-------|------------|---------------|
| `power` | Primary (D31 damage) | Also used |
| `impact` | Legacy, mapped to power | Compliance formula |
| `base_power` | Ignored | Power scalar formula |

---

## 7) Cross-pack reference rules

Validation must enforce:

* Puzzle packs reference only concern_ids, counter_ids present in Evidence Pack Set
* Puzzle dealtHand cards must be resolvable
* Voice pack references only known mood states and event types
* All refutableBy references must resolve to valid RefutationCard IDs

---

## 8) Minimal examples

### 8.1 Minimal Puzzle pack

```json
{
  "pack_type": "puzzle",
  "pack_id": "puzzle-daily-2026-01-26",
  "version": "1.0.0",
  "schema_version": "2.0",
  "content": {
    "puzzle_id": "puzzle.daily.2026_01_26",
    "display": { "device": "SMART FRIDGE", "lockReason": "Health protocol", "theme": "kitchen" },
    "difficulty": "NORMAL",
    "resistance": 40,
    "turnBudget": 6,
    "concerns": [],
    "counterEvidence": [],
    "dealtHand": [],
    "koaOpening": { "lines": [] },
    "preGeneratedTestimony": { "combinations": [] }
  }
}
```

### 8.2 Minimal Voice pack

```json
{
  "pack_type": "voice",
  "pack_id": "voice-koa-default",
  "version": "1.0.0",
  "schema_version": "2.0",
  "content": {
    "voice_id": "voice.koa_default",
    "style": { "tone": "passive_aggressive_bureaucrat", "banned_terms": ["objection", "verdict"] },
    "barks": [],
    "mood_barks": {},
    "fallbacks": { "missing_exact_key": "DROP_DIMENSIONS_IN_ORDER", "drop_order": [], "ultimate_default": "..." }
  }
}
```

---

## 9) Validation constraints summary (enforced in D10)

### 9.1 D31 validation rules

* EvidenceCard `power` must be 1-20
* EvidenceCard must have at least one `proves` entry
* RefutationCard must not have `claims` (no location, state, activity)
* CounterEvidence `targets` must be valid ProofTypes
* Concern `requiredProof` must be valid ProofTypes
* Puzzle `dealtHand` must have exactly 6 cards for Normal+ difficulty
* Puzzle must be solvable (per D31 solvability rules)

### 9.2 General validation rules

* Envelope fields present and well-formed
* Unique IDs across Pack Set
* All references resolvable
* Voice pack banned terms enforced
* Numeric ranges bounded

---

## 10) Migration notes (v1 → v2)

### 10.1 Terminology changes

* `AURA` → `KOA` in all voice content
* `gate` → `concern` for Daily mode
* `artifact` → `evidence` for Daily mode
* "Life with AURA" → "Home Smart Home"

### 10.2 Schema changes

* New pack type: `puzzle` (replaces incident for Daily)
* New schema: EvidenceCard, RefutationCard, CounterEvidence, Concern
* New enums: ProofType, LocationValue, StateValue, ActivityValue, KoaMoodState
* New field: `preGeneratedTestimony` for offline dialogue

### 10.3 Backward compatibility

* Protocol packs (Freeplay) remain valid
* Artifact packs mapped to Evidence packs via `power` = `impact`
* Voice packs require AURA→KOA terminology update
