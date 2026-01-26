# D04A — GAME STATE & EVENT MODEL (AURA) v1

**Status:** Draft v1.0 (Ship-blocking)
**Owner:** Core Runtime / Persistence
**Last Updated:** 2026-01-25
**Purpose:** Specify the authoritative event log and state transition model for Life with AURA. Defines event types, envelope, ordering, deterministic serialization, replay rules, and save/load semantics for an offline-first PWA, with a future path to server verification. Mechanics are authoritative; voice is derived.

---

## 1) Principles

1. **Event-sourced core:** gameplay is a sequence of events; state is derived by replay.
2. **Deterministic serialization:** events have canonical encoding for hashing, storage, and cross-runtime replay.
3. **Fail-closed:** invalid events are never appended; invalid replays fail hard.
4. **Separation of concerns:** mechanics events are authoritative; voice text is derived and may be cached but not authoritative.
5. **Patch resilience:** logs must replay correctly even if implementation details evolve; decisions and effects are recorded, not recomputed.

---

## 2) Run identity and binding

Every run must bind to a stable content + ruleset snapshot.

### 2.1 Required binding fields

* `run_id`: UUID
* `mode`: `DAILY|FREEPLAY`
* `seed`: string/int64 (canonical)
* `binding`:

  * `manifest_id`: string (preferred)
  * `resolved_packs[]`: **required** resolved list at run start

    * `pack_id`
    * `version`
    * `content_hash` (Tier 1+ recommended)
* `incident_template_id`
* `incident_id` (assembled instance id)

### 2.2 Daily binding rule

If `mode=DAILY`, the log must record:

* `daily_id`
* `date`: `YYYY-MM-DD` using the game’s canonical day boundary
* `binding.manifest_id` and `binding.resolved_packs[]`

This guarantees “the daily” is replayable and verifiable.

### 2.3 Pack binding hash (recommended)

Include:

* `pack_bindings_hash = H(canonical_json(binding))`

This prevents drift if a manifest changes server-side later.

---

## 3) Canonical event envelope

All events share a common envelope.

```json
{
  "v": 1,
  "seq": 12,
  "run_id": "uuid",
  "type": "EVENT_TYPE",
  "tick_id": 42,
  "client_ts": 1737840000,
  "code_build_id": "pwa-0.3.1+sha.abc123",
  "pack_bindings_hash": "hex...",
  "prev_event_hash": "hex...",
  "event_hash": "hex...",
  "chain_hash": "hex...",
  "data": { }
}
```

### 3.1 Envelope fields

* `v`: event schema version (immutable per major)
* `seq`: strictly increasing integer starting at 1 (authoritative ordering; no gaps)
* `run_id`: run identity
* `type`: event type enum
* `tick_id`: **logical** time index (authoritative for replay sequencing aids; `seq` remains ordering)
* `client_ts`: optional UX timestamp (non-authoritative; must not affect resolver logic)
* `code_build_id`: optional debug string for client build provenance (non-authoritative)
* `pack_bindings_hash`: optional but recommended (Tier 0 can omit; Tier 1+ should include)
* `prev_event_hash`: Tier 1+ (hash chain)
* `event_hash`: Tier 1+ (hash of canonical encoding of this event)
* `chain_hash`: Tier 1+ (running chain hash)
* `data`: event payload

### 3.2 Ordering rules

* `seq` is authoritative ordering.
* `tick_id` must be monotonically non-decreasing and is used for UX grouping/debug.
* `client_ts` must never affect mechanics.

---

## 4) Deterministic serialization and hashing

### 4.1 Canonical encoding

Events must be serialized as **canonical JSON**:

* UTF-8
* stable key ordering
* stable number formatting
* no whitespace significance

### 4.2 Hashing tiers

**Tier 0 (offline MVP):**

* Hashing optional
* Store canonical events for replay

**Tier 1+ (sharing/verification):**

* `event_hash = SHA256(canonical_json_bytes(event_without_hash_fields?))`
* `chain_hash = SHA256(prev_chain_hash_bytes || event_hash_bytes)`

#### 4.2.1 Hash field exclusion rule (required if Tier 1+)

To avoid self-reference, compute `event_hash` over the event **with these fields zeroed/omitted**:

* `prev_event_hash`, `event_hash`, `chain_hash`

(Keep the rule fixed and documented; changing it requires event schema bump.)

---

## 5) Deterministic replay posture: “store effects, not recomputation”

The replay system must not depend on recomputing matching logic (which could change with code). Therefore:

* `MOVE_RESOLVED` records **selected path** and **effects[]** sufficient to reproduce state transitions.
* Draws, discards, tool charge consumption, card mutations, modifier changes, cooldown changes, etc. are recorded as effects.

This is the default, v1 posture.

---

## 6) Event types (authoritative)

### 6.1 Run lifecycle

**RUN_STARTED**

```json
{
  "seed": "...",
  "mode": "DAILY|FREEPLAY",
  "daily": {
    "daily_id": "...",
    "date": "YYYY-MM-DD",
    "daily_manifest_id": "daily-2026-02-02.v1",
    "schedule_id": "week-2026-02-02",
    "content_channel": "FEATURED_DAILY|FREEPLAY",
    "new_concept_ids": ["modifier.core.TIMESTAMP_HARDLINE"]
  },
  "binding": {
    "manifest_id": "...",
    "resolved_packs": [
      { "pack_id": "protocol.core", "version": "1.0.0", "content_hash": "hex..." }
    ]
  },
  "incident": {
    "incident_template_id": "...",
    "incident_id": "...",
    "act_profile": "ACT1",
    "turn_limit": 9
  }
}
```

**Daily binding fields (added for replay/share interpretability):**

* `daily_manifest_id`: exact manifest version used
* `schedule_id`: weekly schedule this daily belongs to
* `content_channel`: `FEATURED_DAILY` or `FREEPLAY`
* `new_concept_ids[]`: optional; concepts introduced this week (for analytics)

**RUN_ENDED**

```json
{
  "result": "WIN|LOSS",
  "reason": "TURN_LIMIT|INCIDENT_FAIL|PLAYER_ABORT|...",
  "summary": {
    "turns": 8,
    "audits_triggered": 1,
    "scrutiny_max": "MED",
    "gates_cleared": 2
  }
}
```

---

### 6.2 Content assembly / offers

**INCIDENT_ASSEMBLED**

```json
{
  "incident_id": "...",
  "incident_template_id": "...",
  "lock_target": "FRIDGE",
  "gate_instances": [
    { "instance_id": "G1", "gate_id": "gate.core.NO_SELF_REPORT", "strength": 60, "params": {} }
  ],
  "active_modifiers": [
    { "modifier_id": "mod.core.TIMESTAMP_HARDLINE", "duration_turns": 3, "params": {} }
  ],
  "routine": "STRICT_VERIFY|POLICY_DAEMON|HUMAN_FACTORS",
  "turn_limit": 9
}
```

**DRAFT_OFFERED**

```json
{
  "phase": "START|MID|SHOP",
  "offers": [
    { "offer_id": "O1", "kind": "ARTIFACT", "archetype_id": "artifact.core.APPLE_HEALTH_LOG" },
    { "offer_id": "O2", "kind": "TOOL", "tool_id": "tool.core.METADATA_SCRAPER" }
  ],
  "pick_count": 1,
  "offer_rng_meta": { "namespace": "draft", "draw_index": 3 }
}
```

**DRAFT_PICKED**

```json
{
  "picked_offer_id": "O1",
  "granted": { "kind": "ARTIFACT", "artifact_instance_id": "A7" }
}
```

(Shops mirror this pattern; keep event names consistent rather than inventing parallel systems.)

---

### 6.3 Turn lifecycle

**TURN_STARTED** (authoritative for “store effects” posture)

```json
{
  "turn_index": 3,
  "hand": ["A1","A4","A7","A9","A10"],
  "tools": ["T1","T2"],
  "scrutiny_level": "LOW",
  "active_modifiers": ["MOD_TIMESTAMP_HARDLINE"]
}
```

**TURN_ENDED**

```json
{
  "turn_index": 3,
  "scrutiny_points": 4,
  "scrutiny_level": "LOW"
}
```

> Note: because TURN_STARTED includes `hand`, replay does not re-run draw RNG. This improves patch resilience.

---

### 6.4 Action submission / validation

**ACTION_SUBMITTED**

```json
{
  "action_id": "ACT-9",
  "kind": "INJECT|FLAG|REWIRE|CORROBORATE|CYCLE|EXPLOIT",
  "params": {
    "gate_instance_id": "G1",
    "attachments": [
      { "slot": "slot_1", "artifact_instance_id": "A7" },
      { "slot": "slot_2", "artifact_instance_id": "A4" }
    ],
    "tool_use": { "tool_instance_id": "T1", "target_artifact_instance_id": "A7" }
  }
}
```

**ACTION_REJECTED**

```json
{
  "action_id": "ACT-9",
  "reason_code": "CARD_NOT_IN_HAND|ATTACHMENT_LIMIT_EXCEEDED|TOOL_NO_CHARGES|...",
  "details": { "expected": "..." }
}
```

#### 6.4.1 Rejection rule (v1)

* Rejected actions do **not** consume the turn.
* The player can submit a new action during the same `turn_index`.

(Enforced by validation: TURN_ENDED must not follow an ACTION_REJECTED unless a MOVE_RESOLVED occurred.)

---

### 6.5 Move resolution (authoritative mechanics)

**MOVE_RESOLVED** (authoritative; contains the full state transition as effects)

```json
{
  "action_id": "ACT-9",
  "move": "INJECT",
  "outcome": "PASS|FAIL|ESCALATE|CLEARED",
  "gate_instance_id": "G1",
  "gate_id": "gate.core.NO_SELF_REPORT",
  "selected_counter_path_id": "A_VERIFIED_SENSOR",
  "clause_results": [
    { "clause": "TRUST_AT_LEAST(VERIFIED)", "ok": true },
    { "clause": "TAG_PRESENT(Sensor)", "ok": true }
  ],
  "deltas": { "gate_strength_delta": -35, "scrutiny_delta": -1 },
  "effects": [
    { "type": "GATE_STRENGTH_DELTA", "gate_instance_id": "G1", "delta": -35 },
    { "type": "SCRUTINY_DELTA", "delta": -1 },
    { "type": "CARDS_MOVED", "from": "hand", "to": "discard", "ids": ["A7","A4"] },
    { "type": "TOOL_CHARGE_SPENT", "tool_instance_id": "T1", "delta": -1 },
    { "type": "COOLDOWN_SET", "key": "move:EXPLOIT", "turns": 2 }
  ],
  "outcome_key": {
    "event": "RESOLVE",
    "move": "INJECT",
    "outcome": "PASS",
    "gate_id": "gate.core.NO_SELF_REPORT",
    "scrutiny_level": "LOW",
    "act_profile": "ACT1",
    "reason_code": null
  }
}
```

#### 6.5.1 Effects catalog (v1 minimum)

* `GATE_STRENGTH_DELTA(gate_instance_id, delta)`
* `SCRUTINY_DELTA(delta)`
* `CARDS_MOVED(from, to, ids[])`
* `CARDS_DRAWN(into, ids[])` (if draws occur mid-turn)
* `TOOL_CHARGE_SPENT(tool_instance_id, delta)`
* `CARD_MUTATED(card_instance_id, patch)` (rewire/corroborate changes)
* `MODIFIER_APPLIED(modifier_id, duration_turns, params)`
* `MODIFIER_EXPIRED(modifier_id)`
* `COOLDOWN_SET(key, turns)` / `COOLDOWN_TICK(key, -1)`
* `REWARD_GRANTED(kind, amount|id)` (optional here; can be separate event)

> Design note: `deltas` remains for UX/telemetry, but **effects are authoritative** for replay.

---

### 6.6 Incident / act transitions

**INCIDENT_CLEARED**

```json
{
  "incident_id": "...",
  "turns_used": 6,
  "gates_cleared": ["G1","G2"],
  "rewards": [{ "kind": "CREDITS", "amount": 10 }]
}
```

**INCIDENT_FAILED**

```json
{
  "incident_id": "...",
  "reason": "TURN_LIMIT|AUDIT_PENALTY_LOCK|...",
  "turns_used": 9
}
```

---

### 6.7 Audit events (clarified semantics)

Audits are constraints/penalties, not “mini-games” that must PASS/FAIL, unless a pack explicitly defines hard fail.

**AUDIT_TRIGGERED**

```json
{
  "scrutiny_level": "MED|HIGH",
  "audit_type": "DEEP_VERIFY|NARROW_CHANNEL|SOURCE_LOCK",
  "duration_turns": 2,
  "params": {}
}
```

**AUDIT_EXPIRED**

```json
{ "audit_type": "DEEP_VERIFY" }
```

**AUDIT_CLEARED_EARLY** (optional)

```json
{ "audit_type": "DEEP_VERIFY", "cleared_by": "move:CORROBORATE" }
```

---

## 7) State derivation rules (replay)

### 7.1 Authoritative transitions

State is derived by replaying events in `seq` order:

* RUN_STARTED initializes state + bindings
* INCIDENT_ASSEMBLED sets gates/modifiers/turn_limit/routine
* TURN_STARTED sets the authoritative hand view for the turn
* ACTION_SUBMITTED is input intent (does not mutate)
* ACTION_REJECTED does not mutate and does not end the turn
* MOVE_RESOLVED mutates state by applying `effects[]`
* AUDIT_* mutates audit state (also may appear as effects inside MOVE_RESOLVED; pick one approach and keep consistent)
* INCIDENT_CLEARED/FAILED advances ladder
* RUN_ENDED terminalizes

### 7.2 “Store effects” replay rule

During replay:

* The engine must **apply effects exactly** as recorded.
* It must not attempt to “re-decide” counter paths or recompute deltas for authority.
* It may optionally verify consistency (see §9).

### 7.3 Consistency verification (optional but recommended)

When replaying:

* Recompute expected outcome from current code + bound packs
* Compare to recorded `selected_counter_path_id` and `deltas`
* If mismatch: raise `REPLAY_DIVERGENCE` (fail-closed)

This gives you strong regression detection without making recomputation authoritative.

---

## 8) Save/Load for offline PWA

### 8.1 Storage

IndexedDB stores:

* `run_header` (RUN_STARTED + minimal metadata)
* `events[]` (canonical JSON)
* `snapshots[]` (optional): every K events (e.g., 10) store `state_snapshot` + last `seq`

### 8.2 Resume

On app launch:

* load latest snapshot if exists
* replay events after snapshot to reconstruct current state

### 8.3 Migration policy

Event schema `v` is immutable.

* If changes are required, bump `v` and provide:

  * a v1 replayer; and/or
  * a one-time migration converter (only if you accept lossy migration)

---

## 9) Validation rules for appending events (fail-closed)

Before appending any event:

1. Envelope schema valid
2. `seq == last_seq + 1`
3. `run_id` matches current run
4. Event allowed in current phase (state machine checks)
5. If Tier 1+ hashing enabled:

   * verify `prev_event_hash` / `chain_hash` continuity
6. Semantic validation:

   * cannot append MOVE_RESOLVED without a prior ACTION_SUBMITTED for same action_id in same turn
   * cannot append TURN_ENDED unless a MOVE_RESOLVED occurred for that `turn_index`
   * cannot append INCIDENT_CLEARED/FAILED while incident already terminal

If invalid: reject and keep state unchanged.

---

## 10) Voice and latency: what to store

### 10.1 Authoritative vs optional

Authoritative:

* `outcome_key`, `effects[]`, and (for explainability) `clause_results` in MOVE_RESOLVED

Optional cache (non-authoritative):

* `rendered_line_id` (voice pack bark id chosen)
* `rendered_text` (actual text shown)
* `enhanced_voice_used: boolean`

If cached text missing, client re-renders from OutcomeKey + voice pack.

**Rule:** Never store freeform LLM output as authoritative mechanics state.

---

## 11) Replay compatibility rule (determinism drift prevention)

### 11.1 Self-contained MOVE_RESOLVED

MOVE_RESOLVED must contain all information needed for replay without recomputation:

* `selected_counter_path_id` - which path was matched
* `clause_results[]` - truth table for each clause
* `deltas` - exact strength/scrutiny changes
* `effects[]` - all state mutations
* `outcome_key` - for voice selection

**Rule:** A replay engine should be able to apply MOVE_RESOLVED effects directly without re-running gate evaluation logic.

### 11.2 Golden replay fixtures

Maintain golden replay logs (D21) that must pass across client versions:

* If a client update changes resolver behavior, either:
  * Migrate fixtures to match new behavior (major version bump)
  * Preserve backward compatibility for old event streams

### 11.3 Version compatibility

* Event schema version recorded in RUN_STARTED
* Client must support replaying events from schema version N-1 at minimum
* Breaking changes require schema version bump

---

## 12) Acceptance criteria (v1)

1. A run can be fully reconstructed from RUN_STARTED + event stream.
2. Replays are deterministic across devices for the same event stream and pack bindings.
3. UI remains responsive by rendering outcomes immediately from MOVE_RESOLVED; voice is non-blocking decoration.
4. Hash chaining can be enabled later without changing mechanics semantics.
5. Draw/discard/tool-charge/card-mutation outcomes replay without re-running RNG.

---
