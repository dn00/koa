# D04A — GAME STATE & EVENT MODEL v2

**Status:** Draft v2.0 (Ship-blocking)
**Owner:** Core Runtime / Persistence
**Last Updated:** 2026-01-26
**Purpose:** Specify the authoritative event log and state transition model for Home Smart Home. Defines event types, envelope, ordering, deterministic serialization, replay rules, and save/load semantics for an offline-first PWA. Mechanics are authoritative; voice is derived.

**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md is the source of truth for core mechanics.

---

## 1) Principles

1. **Event-sourced core:** gameplay is a sequence of events; state is derived by replay.
2. **Deterministic serialization:** events have canonical encoding for hashing, storage, and replay.
3. **Fail-closed:** invalid events are never appended; invalid replays fail hard.
4. **Separation of concerns:** mechanics events are authoritative; voice text is derived and cached.
5. **Pre-generated content:** all dialogue is pre-computed per puzzle; no runtime LLM dependency.

---

## 2) Run identity and binding

Every run must bind to a stable puzzle snapshot.

### 2.1 Required binding fields

* `run_id`: UUID
* `mode`: `DAILY|PRACTICE`
* `seed`: string/int64 (canonical)
* `binding`:
  * `puzzle_id`: string (required)
  * `puzzle_hash`: string (content integrity)
  * `resolved_packs[]`: resolved list at run start
    * `pack_id`
    * `version`
    * `content_hash`

### 2.2 Daily binding rule

If `mode=DAILY`, the log must record:

* `daily_id`
* `date`: `YYYY-MM-DD`
* `binding.puzzle_id` and `binding.puzzle_hash`

This guarantees "the daily" is replayable and verifiable.

---

## 3) Canonical event envelope

All events share a common envelope.

```json
{
  "v": 2,
  "seq": 12,
  "run_id": "uuid",
  "type": "EVENT_TYPE",
  "tick_id": 42,
  "client_ts": 1737840000,
  "code_build_id": "pwa-0.4.0",
  "puzzle_hash": "hex...",
  "prev_event_hash": "hex...",
  "event_hash": "hex...",
  "chain_hash": "hex...",
  "data": { }
}
```

### 3.1 Envelope fields

* `v`: event schema version (v2 for D31 alignment)
* `seq`: strictly increasing integer starting at 1
* `run_id`: run identity
* `type`: event type enum
* `tick_id`: logical time index
* `client_ts`: optional UX timestamp (non-authoritative)
* `puzzle_hash`: puzzle content integrity hash
* `data`: event payload

---

## 4) Event types (D31 aligned)

### 4.1 Run lifecycle

**RUN_STARTED**

```json
{
  "seed": "...",
  "mode": "DAILY|PRACTICE",
  "daily": {
    "daily_id": "...",
    "date": "2026-01-26"
  },
  "binding": {
    "puzzle_id": "puzzle.daily.2026_01_26",
    "puzzle_hash": "hex..."
  },
  "puzzle": {
    "device": "SMART FRIDGE",
    "lockReason": "Midnight snacking",
    "resistance": 40,
    "turnBudget": 6,
    "concerns": ["IDENTITY", "ALERTNESS", "INTENT"],
    "counterCount": 2
  }
}
```

**RUN_ENDED**

```json
{
  "result": "WIN|LOSS",
  "reason": "RESISTANCE_ZERO|TURN_LIMIT|SCRUTINY_MAX",
  "summary": {
    "turns": 4,
    "damageDealt": 52,
    "contradictions": 0,
    "countersRefuted": 2,
    "scrutinyFinal": 0,
    "concernsAddressed": ["IDENTITY", "ALERTNESS", "INTENT"]
  }
}
```

---

### 4.2 Puzzle setup

**PUZZLE_LOADED**

```json
{
  "puzzle_id": "puzzle.daily.2026_01_26",
  "concerns": [
    { "concern_id": "concern.core.IDENTITY", "koaAsks": "Prove you're you." },
    { "concern_id": "concern.core.ALERTNESS", "koaAsks": "Prove you're awake." },
    { "concern_id": "concern.core.INTENT", "koaAsks": "Prove you meant to do this." }
  ],
  "counterEvidence": [
    { "counter_id": "counter.visual.SECURITY_CAMERA", "targets": ["IDENTITY"] },
    { "counter_id": "counter.biometric.SLEEP_DATA_SYNC", "targets": ["ALERTNESS"] }
  ],
  "resistance": 40,
  "turnBudget": 6
}
```

**CARDS_DEALT**

```json
{
  "hand": [
    { "card_id": "evidence.core.FACE_ID", "power": 12, "proves": ["IDENTITY"] },
    { "card_id": "evidence.core.SMART_WATCH", "power": 10, "proves": ["ALERTNESS"] },
    { "card_id": "evidence.core.VOICE_LOG", "power": 8, "proves": ["INTENT"] },
    { "card_id": "refutation.core.MAINTENANCE_LOG", "power": 5, "refutes": ["counter.visual.SECURITY_CAMERA"] },
    { "card_id": "refutation.core.NOISE_COMPLAINT", "power": 5, "refutes": ["counter.biometric.SLEEP_DATA_SYNC"] },
    { "card_id": "evidence.core.GYM_WRISTBAND", "power": 9, "proves": ["LOCATION"] }
  ]
}
```

---

### 4.3 Turn lifecycle

**TURN_STARTED**

```json
{
  "turn_index": 3,
  "turn_budget": 6,
  "hand": ["evidence.core.FACE_ID", "evidence.core.VOICE_LOG", "refutation.core.MAINTENANCE_LOG"],
  "resistance": 25,
  "scrutiny": 1,
  "concerns_addressed": ["IDENTITY"],
  "counters_active": ["counter.visual.SECURITY_CAMERA"],
  "counters_spent": []
}
```

**TURN_ENDED**

```json
{
  "turn_index": 3,
  "resistance": 14,
  "scrutiny": 2,
  "concerns_addressed": ["IDENTITY", "INTENT"]
}
```

---

### 4.4 Card submission

**CARDS_SELECTED**

```json
{
  "action_id": "ACT-9",
  "selected_cards": ["evidence.core.FACE_ID", "evidence.core.VOICE_LOG"]
}
```

**SUBMISSION_BLOCKED** (MAJOR contradiction)

```json
{
  "action_id": "ACT-9",
  "reason": "MAJOR_CONTRADICTION",
  "contradiction": {
    "severity": "MAJOR",
    "new_card": "evidence.core.GYM_WRISTBAND",
    "conflicts_with": "evidence.core.FACE_ID",
    "explanation": "GYM @ 2:00am conflicts with KITCHEN @ 2:05am"
  }
}
```

---

### 4.5 Move resolution (D31 mechanics)

**MOVE_RESOLVED** (authoritative for replay)

```json
{
  "action_id": "ACT-9",
  "submitted_cards": ["evidence.core.FACE_ID", "evidence.core.VOICE_LOG"],
  "outcome": "CONTESTED|CLEAN|REFUTED",

  "concerns_addressed": ["IDENTITY", "INTENT"],
  "concerns_new": ["INTENT"],

  "contradiction": {
    "detected": false,
    "severity": "NONE",
    "scrutiny_cost": 0
  },

  "corroboration": {
    "triggered": true,
    "shared_claims": ["KITCHEN", "AWAKE"],
    "bonus_multiplier": 1.25
  },

  "counter_evidence": {
    "triggered": true,
    "counter_id": "counter.visual.SECURITY_CAMERA",
    "contested_cards": ["evidence.core.FACE_ID"],
    "penalty_multiplier": 0.5
  },

  "damage": {
    "base": 20,
    "contested_penalty": -10,
    "corroboration_bonus": 2,
    "final": 12
  },

  "effects": [
    { "type": "RESISTANCE_DELTA", "delta": -12, "new_value": 28 },
    { "type": "CONCERN_ADDRESSED", "concern_id": "concern.core.INTENT" },
    { "type": "COUNTER_EVIDENCE_PLAYED", "counter_id": "counter.visual.SECURITY_CAMERA" },
    { "type": "CARDS_COMMITTED", "cards": ["evidence.core.FACE_ID", "evidence.core.VOICE_LOG"] }
  ],

  "koa_response": {
    "mood": "SUSPICIOUS",
    "dialogue_key": "combo_FACE_ID_VOICE_LOG"
  }
}
```

---

### 4.6 D31-specific events

**COUNTER_EVIDENCE_PLAYED**

```json
{
  "counter_id": "counter.visual.SECURITY_CAMERA",
  "targets": ["IDENTITY"],
  "contested_cards": ["evidence.core.FACE_ID"],
  "claim": "No one detected at door 2:00-2:30am"
}
```

**COUNTER_EVIDENCE_REFUTED**

```json
{
  "counter_id": "counter.visual.SECURITY_CAMERA",
  "refuted_by": "refutation.core.MAINTENANCE_LOG",
  "damage_restored": 6,
  "previous_contested_cards": ["evidence.core.FACE_ID"]
}
```

**CONTRADICTION_DETECTED**

```json
{
  "severity": "MINOR|MAJOR",
  "new_card": "evidence.core.SLEEP_TRACKER",
  "conflicts_with": "evidence.core.SMART_WATCH",
  "new_claim": { "state": "ASLEEP", "timeRange": ["2:00am", "2:30am"] },
  "existing_claim": { "state": "AWAKE", "timeRange": ["2:05am", "2:10am"] },
  "explanation": "ASLEEP @ 2:00am → AWAKE @ 2:08am (8-minute gap)",
  "scrutiny_cost": 1
}
```

**CONCERN_ADDRESSED**

```json
{
  "concern_id": "concern.core.ALERTNESS",
  "addressed_by": ["evidence.core.SMART_WATCH"],
  "proof_provided": "ALERTNESS"
}
```

**CORROBORATION_TRIGGERED**

```json
{
  "cards": ["evidence.core.FACE_ID", "evidence.core.VOICE_LOG"],
  "shared_claims": ["KITCHEN", "AWAKE"],
  "bonus_multiplier": 1.25
}
```

**SCRUTINY_LOSS_TRIGGERED**

```json
{
  "scrutiny": 5,
  "reason": "SCRUTINY_MAX"
}
```

---

### 4.7 Effects catalog (v2)

D31-aligned effects:

* `RESISTANCE_DELTA(delta, new_value)` — reduce/increase resistance
* `SCRUTINY_DELTA(delta, new_value)` — increase/decrease scrutiny
* `CONCERN_ADDRESSED(concern_id)` — mark concern as satisfied
* `COUNTER_EVIDENCE_PLAYED(counter_id)` — KOA plays counter
* `COUNTER_EVIDENCE_REFUTED(counter_id)` — player nullifies counter
* `CARDS_COMMITTED(cards[])` — add cards to committed story
* `CORROBORATION_APPLIED(multiplier)` — apply +25% bonus
* `CONTRADICTION_APPLIED(severity, scrutiny_cost)` — apply scrutiny penalty
* `KOA_MOOD_CHANGED(new_mood)` — update KOA visual state

---

### 4.8 Deprecated events (Daily mode)

The following events are **deprecated** for Daily mode per D31:

* `DRAFT_OFFERED` — no draft in Daily (cards dealt)
* `DRAFT_PICKED` — no draft in Daily
* `AUDIT_TRIGGERED` — scrutiny 5 = instant loss
* `AUDIT_EXPIRED` — no audit recovery phase
* `AUDIT_CLEARED_EARLY` — no audit mechanics

These remain valid for Freeplay mode.

---

## 5) State derivation rules (replay)

### 5.1 Authoritative transitions

State is derived by replaying events in `seq` order:

* RUN_STARTED initializes binding
* PUZZLE_LOADED sets concerns/counters/resistance/turns
* CARDS_DEALT sets initial hand
* TURN_STARTED establishes turn state
* CARDS_SELECTED is input intent
* SUBMISSION_BLOCKED does not mutate state
* MOVE_RESOLVED mutates state via `effects[]`
* CONCERN_ADDRESSED, COUNTER_EVIDENCE_*, CONTRADICTION_DETECTED are recorded
* TURN_ENDED advances turn counter
* RUN_ENDED terminalizes

### 5.2 "Store effects" replay rule

During replay:

* Apply effects exactly as recorded
* Do not recompute damage or counter logic
* Optionally verify consistency (fail if mismatch)

---

## 6) Win/Loss conditions (D31)

### 6.1 Win condition

```json
{
  "type": "WIN",
  "requires": {
    "resistance": 0,
    "all_concerns_addressed": true
  }
}
```

### 6.2 Loss conditions

**Turns exhausted:**
```json
{
  "type": "LOSS",
  "reason": "TURN_LIMIT",
  "triggers_when": "turns_remaining == 0 AND (resistance > 0 OR concerns_remaining > 0)"
}
```

**Scrutiny overload (instant):**
```json
{
  "type": "LOSS",
  "reason": "SCRUTINY_MAX",
  "triggers_when": "scrutiny == 5"
}
```

Note: Scrutiny 5 is an **instant loss** with no audit recovery phase.

---

## 7) Save/Load for offline PWA

### 7.1 Storage

IndexedDB stores:

* `run_header` (RUN_STARTED + metadata)
* `events[]` (canonical JSON)
* `committed_story` (cards submitted so far)
* `snapshots[]` (optional): state at checkpoints

### 7.2 Resume

On app launch:

* Load latest snapshot if exists
* Replay events after snapshot
* Reconstruct hand, committed story, concerns, counters

---

## 8) Acceptance criteria (v2)

1. A run can be fully reconstructed from RUN_STARTED + event stream.
2. Replays are deterministic across devices for same event stream.
3. UI renders outcomes immediately from MOVE_RESOLVED; voice is decoration.
4. D31 mechanics (contradiction, corroboration, counter-evidence) are captured in events.
5. No draft events in Daily mode; cards dealt via CARDS_DEALT.
6. Scrutiny 5 = instant loss; no audit events in Daily mode.
