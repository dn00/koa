# D03 — DETERMINISTIC RESOLVER SPEC v1.1

**Status:** Draft v1.1 (Ship-blocking)
**Owner:** Core Runtime / Game Logic
**Last Updated:** 2026-01-26
**Purpose:** Define the deterministic "physics" of Life with AURA: the authoritative state model, action validation, gate/counter evaluation, delta computation (GateStrength/Scrutiny), audit triggers, and the output contract used by UI, telemetry, and voice selection. This spec is authoritative; packs and voice are inputs, but cannot alter determinism outside declared parameters.

---

## 0) Mode split (Option B)

The resolver supports two operational modes with different formulas:

| Mode | Actions | Compliance formula | Scrutiny model |
|------|---------|-------------------|----------------|
| **Daily** (MVP) | SUBMIT, SCAN | `floor(Impact × resonance)`, cap 30 | Integer 0-5, Audit at 5 |
| **Freeplay** (post-MVP) | INJECT, FLAG, REWIRE, CORROBORATE, CYCLE, EXPLOIT | `power_scalar × trust_mult × modifier_mult` | Points-based (LOW/MED/HIGH) |

**Mode detection:** `run_state.mode` determines which formula branch to use.

**Terminology mapping (player-facing):**
| Internal | Daily (player) | Freeplay (player) |
|----------|----------------|-------------------|
| `lock_strength` | Resistance | Gate Strength |
| `gate` | Protocol | Gate / Policy Gate |
| `inject` | Submit | Inject |
| `cycle` | Scan | Cycle |
| `artifact` | Evidence | Artifact |
| `damage` | Compliance | Damage |

---

## 1) Design principles

1. **Resolver is authoritative**: outcomes are computed by deterministic rules and pack-defined data.
2. **Fail-closed**: invalid actions do nothing except emit a rejected action event with a reason.
3. **Separation of mechanics and voice**: mechanics resolve instantly; voice rendering is non-blocking and never affects state.
4. **Seeded determinism**: same initial state + Pack Set + seed + action stream => identical outcomes.
5. **RNG isolation**: gameplay RNG streams are isolated from cosmetic/voice randomness.
6. **Explainability**: all "combos" must be explainable by gate counter path requirements, tool transforms, and modifier effects. No secret recipe resolution.

---

## 2) Determinism contract

### 2.1 Canonical hashing

* Hash function: **SHA-256 hex**
* Canonical encoding: **canonical JSON** (sorted keys, compact separators)
* Event chain: each event includes `prev_event_hash`; the event's content hash is derived from its envelope + payload.

### 2.2 Stable ordering rules

To prevent accidental nondeterminism:

* Gates are evaluated in stable order: by `gate_instance_id`.
* Counter paths in stable order: by `path_priority`, then lexical `path_id`.
* Clauses in stable order: by list order defined in packs.
* Attachments in stable order: slot order `slot_1`, `slot_2`.

### 2.3 RNG streams (namespaced)

All randomness must come from deterministic streams derived from the run seed:

* `rng = H(run_seed || namespace || index)`
* Namespaces: `incident_assembly`, `draft`, `shop`, `bark_variant` (voice selection only; never affects mechanics)
* The resolver itself should be mostly non-random; randomness is used for **offers**, not adjudication.

**Prohibited behavior:**

* No "incidental RNG consumption." Adding a cosmetic roll must not affect draft offers.
* Any new stream introduced must not reuse existing stream keys.

### 2.4 "No wall clock"

`timestamp_ms` is **logical time** (tick index based). No dependency on real time or timezone.

---

## 3) Core gameplay model

AURA is enforcing one or more **Gates** (constraints). The player advances by submitting **Artifacts** (evidence) and using **Tools** to transform/corroborate them, thereby weakening gates. Meanwhile, **Scrutiny** rises when the player relies on low-trust artifacts or suspicious behavior; increased scrutiny triggers **Audits** that add friction or penalties.

**Win condition (v1 default):** All active gate strengths reduced to `<= 0` within the incident's turn budget.

---

## 4) State model (authoritative)

AuraState is a pure data object with stable ordering and deterministic serialization for hashing/saving.

### 4.1 RunState (top-level)

```json
{
  "run_id": "run_...",
  "seed": "base64...",
  "pack_bindings": {
    "protocol": "proto_v1.0.0",
    "incident": "inc_v1.0.0",
    "artifact": "art_v1.0.0",
    "voice": "voice_v1.0.0"
  },
  "mode": "FREE_PLAY|DAILY",
  "tick_id": 0,
  "status": "ACTIVE|WON|LOST",
  "act_index": 1,
  "incident": { /* IncidentState */ },
  "inventory": { /* DeckState */ },
  "economy": { /* RunEconomy */ },
  "meta_flags": { "daily_standardized": true }
}
```

### 4.2 IncidentState

```json
{
  "incident_id": "inc_...",
  "incident_template_id": "template_...",
  "target_lock": "FRIDGE|THERMOSTAT|FRONT_DOOR|...",
  "act_profile": "ACT1|ACT2|BOSS",
  "turn_budget": 9,
  "turn_index": 1,
  "routine": "STRICT_VERIFY|POLICY_DAEMON|HUMAN_FACTORS",
  "active_gates": [ /* GateInstance[] */ ],
  "active_modifiers": [ /* ModifierInstance[] */ ],
  "scrutiny": { /* ScrutinyState */ },
  "cooldowns": { "move:EXPLOIT": 2 },
  "flags": { "narrow_channel": false }
}
```

### 4.3 GateInstance

```json
{
  "gate_instance_id": "gatei_...",
  "gate_id": "NO_SELF_REPORT|TIMESTAMP_REQUIRED|...",
  "strength": 100,
  "stack_index": 0,
  "params": { "time_window_min": 120, "requires_verified": true },
  "revealed": true
}
```

### 4.4 ScrutinyState

**Daily mode (integer 0-5):**

```json
{
  "value": 0,
  "audit_threshold": 5,
  "quarantine": {
    "card_id": null,
    "turns_remaining": 0
  }
}
```

**Freeplay mode (points-based):**

```json
{
  "level": "LOW|MED|HIGH",
  "points": 0,
  "audit_thresholds": { "MED": 10, "HIGH": 20 },
  "audit_cooldown_turns": 0,
  "audit_active": false,
  "pending_audit": null
}
```

Freeplay level mapping:

* LOW: points < 10
* MED: points 10-19
* HIGH: points >= 20

### 4.5 DeckState (Inventory)

Artifacts are cards; tools are a separate tray with limited uses.

```json
{
  "deck": ["card_1", "card_2", "..."],
  "draw_pile": ["card_3", "..."],
  "hand": ["card_a", "card_b", "card_c", "card_d", "card_e"],
  "discard": ["card_x", "..."],
  "tools": ["tool_metascraper", "tool_verifier"],
  "tool_charges": { "tool_verifier": 2 },
  "currency": 0,
  "rerolls_remaining": 1
}
```

### 4.6 Active Modifiers

```json
{
  "active_modifiers": [
    { "modifier_id": "DEEP_VERIFY", "remaining_turns": 2, "params": {} }
  ]
}
```

Derived effective rule flags (computed deterministically):

* `allow_combo_play`: bool
* `time_policy_override`: optional
* `trust_penalty_multiplier`: rational (not float)

### 4.7 Draft/Shop State

```json
{
  "draft_phase": "NONE|OFFERING|PICKING",
  "draft_offers": ["card_offer_1", "card_offer_2", "card_offer_3"],
  "shop_offers": ["item_1", "item_2"]
}
```

---

## 5) Domain model (from packs)

Packs provide immutable definitions.

### 5.1 Artifact archetype (card)

```json
{
  "artifact_id": "FAST_FOOD_RECEIPT",
  "base_power": 6,
  "trust_tier": "VERIFIED|PLAUSIBLE|SKETCHY",
  "tags": ["Purchase", "Food", "Time"],
  "traits": ["Timestamped", "Corroboratable"],
  "source": "ReceiptHash",
  "params": { "timestamp_min_ago": 40 }
}
```

### 5.2 Tool

```json
{
  "tool_id": "tool_verifier",
  "charges": 2,
  "tags": ["Verify", "Anchor"],
  "effects": [
    { "type": "UPGRADE_TRUST", "params": { "max_upgrades": 1 } }
  ],
  "constraints": { "min_trust": "SKETCHY", "required_tags": [] }
}
```

### 5.3 Gate

```json
{
  "gate_id": "NO_SELF_REPORT",
  "paths": [
    {
      "path_id": "A_VERIFIED_SENSOR",
      "priority": 1,
      "clauses": [
        { "type": "TRUST_AT_LEAST", "tier": "VERIFIED" },
        { "type": "TAG_PRESENT", "tag": "Sensor" }
      ],
      "base_strength_delta": -35,
      "scrutiny_delta": -1
    },
    {
      "path_id": "C_PLAUSIBLE_PURCHASE_CORROBORATE",
      "priority": 3,
      "clauses": [
        { "type": "TRUST_AT_LEAST", "tier": "PLAUSIBLE" },
        { "type": "TAG_PRESENT", "tag": "Purchase" },
        { "type": "TRAIT_PRESENT", "trait": "Timestamped" },
        { "type": "TOOL_USED", "tool_tag": "Anchor" }
      ],
      "base_strength_delta": -25,
      "scrutiny_delta": 0
    }
  ],
  "on_fail": { "strength_delta": 0, "scrutiny_delta": +2 }
}
```

### 5.4 Modifier

```json
{
  "modifier_id": "DEEP_VERIFY",
  "duration_turns": 2,
  "effects": [
    { "type": "TRUST_CAP", "max_tier": "PLAUSIBLE" },
    { "type": "SCRUTINY_MULT", "on_sketchy": 1.5 }
  ]
}
```

---

## 6) Clause types (v1)

Counter path clauses are evaluated against the EvidenceBundle:

| Clause Type | Parameters | Passes When |
|-------------|------------|-------------|
| `TRUST_AT_LEAST` | `tier` | Bundle trust >= tier |
| `TAG_PRESENT` | `tag` | Bundle contains tag |
| `TAG_ABSENT` | `tag` | Bundle does not contain tag |
| `TRAIT_PRESENT` | `trait` | At least one attachment has trait |
| `SOURCE_IN` | `allowed_sources[]` | Attachment source in list |
| `PARAM_LTE` | `param_key`, `value` | Attachment param <= value |
| `PARAM_GTE` | `param_key`, `value` | Attachment param >= value |
| `TOOL_USED` | `tool_tag` | Tool used this turn has tag |
| `ARCHETYPE_IN` | `archetypes[]` | Attachment archetype in list |
| `REPEAT_LIMIT` | `family`, `max` | Family not used > max consecutive turns |

---

## 7) Action model

All actions are deterministic and validated by the resolver.

### 7.1 Turn-phase actions

* `END_TURN`
* `CYCLE` (discard and redraw hand if enabled)
* `REROLL_DRAFT` / `REROLL_SHOP` (if enabled and resource available)

### 7.2 Draft/Shop actions

* `DRAFT_PICK(offer_id)`
* `SHOP_BUY(item_id)`
* `SHOP_SKIP`

### 7.3 Core moves (mode-specific)

**Daily mode (MVP):**

| Move | Player term | Purpose | Params |
|------|-------------|---------|--------|
| **INJECT** | SUBMIT | Send 1-2 evidence cards to satisfy protocol | `gate_instance_id`, `attachments` |
| **CYCLE** | SCAN | Swap cards from reserve | - |

**Freeplay mode (post-MVP):**

| Move | Purpose | Params |
|------|---------|--------|
| **INJECT** | Submit artifact(s) against a gate | `gate_instance_id`, `attachments` |
| **REWIRE** | Use tool to transform artifact | `tool_id`, `target_card_id` |
| **CORROBORATE** | Attach secondary proof to raise trust | `primary_card_id`, `secondary_card_id`, `tool_id?` |
| **FLAG** | Challenge gate applicability (policy attack) | `gate_instance_id`, `attachments` |
| **CYCLE** | Discard hand and redraw | - |
| **EXPLOIT** | Use rare breaker to suppress audit/modifiers | `exploit_id` |

**Daily MVP scope:** Ships with `INJECT (SUBMIT) + CYCLE (SCAN) + END_TURN` only. Freeplay adds FLAG, REWIRE, CORROBORATE, EXPLOIT.

### 7.4 Move input structure

```json
{
  "move_id": "m_...",
  "move_type": "INJECT|FLAG|REWIRE|CORROBORATE|CYCLE|EXPLOIT",
  "target_gate_instance_id": "gatei_...",
  "attachments": {
    "slot_1": "card_a",
    "slot_2": "card_b"
  },
  "tool_use": { "tool_id": "tool_verifier", "target_card_id": "card_a" }
}
```

---

## 8) Legality checks

An action is legal iff all applicable checks pass.

### 8.1 Universal checks

* It is the player's turn and phase permits the action.
* Referenced IDs exist in state (gate instance, card instance, tool instance).
* Required resources are available (tool charges, rerolls, currency).
* Action respects incident constraints (turn limit not exceeded).

### 8.2 Tool checks (REWIRE/CORROBORATE)

* Tool has charges > 0.
* Target artifact trust tier and tags satisfy tool constraints.
* Tool effect type is allowed by resolver capabilities.

### 8.3 Gate targeting checks (INJECT/FLAG)

* `gate_instance_id` exists and is active.
* Attachment count respects `allow_combo_play` modifier (e.g., max 1 if Narrow Channel active).
* If effective time policy is REQUIRE_TIMESTAMP, at least one attachment has `Timestamped` trait.
* Attachments must exist in hand.

---

## 9) Evidence bundle aggregation

For evaluation, the resolver forms an **EvidenceBundle** from attachments:

* **Tags:** union of all attached card tags
* **Traits:** union of all attached card traits
* **Trust tier:** **max** of attached trust tiers (unless gate specifies "all must be verified")
* **Base power:** sum of attached base_power (subject to move limits)

Bundle rules are explicit per move type (INJECT vs FLAG may differ).

---

## 10) Delta computation

### 10.0 Mode-specific formulas

The resolver uses different formulas depending on `run_state.mode`:

---

### 10.1 Daily mode: Compliance formula (MVP)

Daily uses a simplified **Impact-based** formula. Artifacts have an explicit `impact` field (1-15 range).

**Compliance calculation:**

```
base_impact = sum(artifact.impact for each attached card)
resonance = 1.5 if (two cards share a tag in RESONANCE_TAGS) else 1.0
compliance = floor(base_impact × resonance)
compliance = min(compliance, 30)  # per-turn cap

resistance_delta = -compliance
```

**RESONANCE_TAGS:** `[TIME, LOCATION, WORK, PURCHASE, SENSOR, AUTHORITY]`

**Resonance rules:**
- Requires exactly 2 cards in payload
- Cards must share at least one tag from RESONANCE_TAGS
- If resonance triggers: multiplier = 1.5
- Otherwise: multiplier = 1.0

**Example:**
- Card A: Impact 8, tags [SENSOR, TIME]
- Card B: Impact 6, tags [PURCHASE, TIME]
- Both share TIME → resonance = 1.5
- Compliance = floor((8 + 6) × 1.5) = floor(21) = 21
- Resistance reduced by 21

**Daily protocol satisfaction:**
- Daily protocols (gates) use simple tag requirements
- SUBMIT satisfies protocol if payload meets required tags
- If protocol not satisfied: compliance = 0, scrutiny +2

---

### 10.2 Freeplay mode: Strength delta formula (post-MVP)

Freeplay uses the full **power/trust/modifier** formula when a counter path matches:

1. Start with path's `base_strength_delta` (negative value)
2. Apply power scalar
3. Apply trust multiplier
4. Apply modifier multipliers
5. Clamp result

**Formula:**

```
power = sum(base_power of attached cards)
power_scalar = 1 + (power - 5) * 0.05    # power 5 -> 1.0; power 9 -> 1.2

trust_mult:
  VERIFIED:  1.10
  PLAUSIBLE: 1.00
  SKETCHY:   0.80

modifier_mult = product of active modifier effects (often 1.0)

raw = base_strength_delta * power_scalar * trust_mult * modifier_mult
strength_delta = clamp(round(raw), min=-60, max=-5)
```

On FAIL (no path match):

* Use gate's `on_fail.strength_delta` (usually 0)
* Boss modifiers may apply small rebound (e.g., +5 strength)

### 10.3 Daily mode: Scrutiny (integer 0-5)

Daily uses a simplified **integer** scrutiny scale (0-5).

**Scrutiny changes:**

| Action | Scrutiny delta |
|--------|----------------|
| **SUBMIT** (pass) | +0 |
| **SUBMIT** (fail) | +2 |
| **SCAN** | +2 |
| **Sketchy card used** | +1 per sketchy card |

**Audit trigger:**
- Scrutiny reaches **5** → Audit triggers
- Audit penalty: **+15 Resistance**, **quarantine** highest-impact card for 2 turns
- After audit: scrutiny resets to **2**

**Quarantine:**
- Card is temporarily locked (cannot be used)
- Duration: 2 turns
- Not permanent removal

---

### 10.4 Freeplay mode: Scrutiny delta formula (post-MVP)

Freeplay uses a **points-based** scrutiny system with LOW/MED/HIGH thresholds.

Scrutiny changes on every move. Components:

| Component | Value |
|-----------|-------|
| **move_base** | INJECT: +0, FLAG: +1, REWIRE: +1, CORROBORATE: +0, CYCLE: +1, EXPLOIT: +3 |
| **trust_penalty** (lowest attachment) | VERIFIED: +0, PLAUSIBLE: +1, SKETCHY: +3 |
| **fail_penalty** | +2 on gate fail |
| **path_adjust** | Matched path's `scrutiny_delta` (can be -1, 0, +1) |

```
scrutiny_points += move_base + trust_penalty + fail_penalty + path_adjust
scrutiny_points = clamp(scrutiny_points, 0, 30)
```

---

## 11) Resolution pipeline

Given `state` and one `move`:

### Step 1 - Validate

* Check legality (see section 8)
* If invalid -> emit `ActionRejected(reason_code, details)`
* Rejections do **not** consume turns in v1; no state mutation except optional spam penalty

### Step 2 - Assemble EvidenceBundle

* Build bundle from attachments
* Apply tool transforms if tool_use specified

### Step 3 - Apply move semantics

| Move | Semantic |
|------|----------|
| INJECT | Evaluate counter paths on target gate |
| FLAG | Reveal info / temporarily lower requirements |
| REWIRE | Transform bundle tags/traits via tool |
| CORROBORATE | Upgrade trust tier / add anchor trait |
| CYCLE | Discard hand, draw new cards |
| EXPLOIT | Apply exploit effect + scrutiny spike |

### Step 4 - Evaluate gate (INJECT/FLAG)

* Iterate paths in priority order (lowest first)
* Compute clause truth table for each path
* Select first path where all clauses pass
* If no path matches -> FAIL

### Step 5 - Compute deltas

* Calculate strength_delta and scrutiny_delta per section 10
* Apply clamps

### Step 6 - Apply effects

Effects application order (fixed):

1. Gate strength: `strength = max(0, strength + strength_delta)`
2. Scrutiny points update
3. Artifact transforms (trust upgrade, tag/trait changes)
4. Tool charges decrement
5. Hand/deck movement (cards to discard)
6. Audit trigger check (see section 12)
7. Cooldown updates (modifier durations, move cooldowns)

### Step 7 - Emit events

* `MoveResolved` with full details
* Append to event log with `prev_event_hash`

### Step 8 - Check end conditions

* All gates strength <= 0 -> `IncidentCleared`
* turn_index > turn_budget -> `IncidentFailed`
* Update run status if act ends

---

## 12) Audit protocol

Audits are triggered by scrutiny thresholds and create temporary constraints.

### 12.1 Trigger conditions

Audit triggers when:

* Scrutiny crosses into MED or HIGH
* `audit_cooldown_turns == 0`
* No audit currently active
* OR a modifier explicitly triggers audit on certain failures

### 12.2 Audit modifiers (v1)

| Modifier | Duration | Effect |
|----------|----------|--------|
| `DEEP_VERIFY` | 2 turns | SKETCHY attachments count as PLAUSIBLE at best; extra scrutiny on SKETCHY use |
| `NARROW_CHANNEL` | 1-2 turns | Max attachments = 1 |
| `SOURCE_LOCK` | 2 turns | Only sources in allowlist count for Sensor tag |

### 12.3 Resolution

* Audit expires after duration
* Can be cleared early by successful CORROBORATE (if modifier allows)
* v1 audits do **not** hard-fail the run; they tighten constraints and consume turns

---

## 13) Win/Loss rules

### 13.1 Win

Win if:

* All active gate instances have `strength <= 0`
* AND audit is not in a "hard fail" terminal state (v1: no hard fail audits)

On win:

* Mark incident `CLEARED`
* If final act -> mark run `status = WON`
* Emit `IncidentCleared` / `RunEnded(WIN, summary_stats)`

### 13.2 Loss

Loss if:

* `turn_index > turn_budget`
* OR hard fail triggered (future versions)

On loss:

* Mark incident `FAILED`
* Mark run `status = LOST`
* Emit `IncidentFailed(reason)` / `RunEnded(LOSS, reason)`

---

## 14) Output contract

### 14.1 MoveResolved

```json
{
  "move_id": "m_...",
  "tick_id": 12,
  "valid": true,
  "target_gate_instance_id": "gatei_...",
  "matched_path_id": "A_VERIFIED_SENSOR",
  "clause_results": [
    { "clause": "TRUST_AT_LEAST(VERIFIED)", "ok": true },
    { "clause": "TAG_PRESENT(Sensor)", "ok": true }
  ],
  "deltas": {
    "gate_strength": -39,
    "scrutiny_points": 0
  },
  "post_state": {
    "gate_strength": 61,
    "scrutiny_level": "LOW",
    "audit_triggered": false
  },
  "outcome_key": { /* see 14.2 */ }
}
```

### 14.2 OutcomeKey

OutcomeKey is a deterministic struct used for bark lookup and fallback. Contains no free text and no random fields.

```json
{
  "event": "RESOLVE|AUDIT_TRIGGER|RUN_END",
  "move": "INJECT|REWIRE|FLAG|CORROBORATE|CYCLE|EXPLOIT",
  "outcome": "PASS|FAIL|CLEARED|ESCALATE|REJECTED",
  "gate_id": "NO_SELF_REPORT",
  "modifier_id": null,
  "scrutiny_level": "LOW|MED|HIGH",
  "act_profile": "ACT1|ACT2|BOSS",
  "routine": "STRICT_VERIFY",
  "reason_code": null
}
```

**Outcome values:**

* `PASS`: matched path; gate not necessarily cleared
* `CLEARED`: this move reduced gate strength to 0
* `FAIL`: no path matched
* `ESCALATE`: audit triggered or modifier escalated constraints
* `REJECTED`: action was illegal

---

## 15) Events (authoritative log)

### 15.1 Event types

* `MoveSubmitted` (optional)
* `MoveResolved`
* `ActionRejected`
* `AuditTriggered` / `AuditExpired`
* `GateStrengthChanged`
* `IncidentCleared` / `IncidentFailed`
* `RunEnded`

### 15.2 Event envelope

```json
{
  "event_id": "evt_...",
  "run_id": "run_...",
  "tick_id": 12,
  "timestamp_ms": 12000,
  "prev_event_hash": "sha256:...",
  "event_type": "MoveResolved",
  "payload": { /* type-specific */ }
}
```

---

## 16) Rejection reason codes

Stable taxonomy for rejects/fails:

### 16.1 Action rejected (illegal)

| Code | Meaning |
|------|---------|
| `INVALID_MOVE_TYPE` | Unknown move type |
| `MISSING_TARGET_GATE` | Gate ID not provided for INJECT/FLAG |
| `GATE_NOT_FOUND` | Gate instance doesn't exist |
| `CARD_NOT_IN_HAND` | Attachment not in hand |
| `TOOL_NO_CHARGES` | Tool has no remaining charges |
| `TOOL_CONSTRAINT_FAILED` | Target doesn't meet tool requirements |
| `ATTACHMENT_LIMIT_EXCEEDED` | Too many attachments (e.g., Narrow Channel) |
| `MODIFIER_FORBIDS_MOVE` | Active modifier blocks this move |
| `RUN_NOT_ACTIVE` | Run already ended |
| `TURN_LIMIT_EXCEEDED` | Incident turn budget exhausted |
| `TIME_POLICY_VIOLATED` | Required timestamp trait missing |

### 16.2 Resolution fail (legal but ineffective)

| Code | Meaning |
|------|---------|
| `FAIL_NO_COUNTER_PATH` | No path clauses satisfied |
| `FAIL_TRUST_TOO_LOW` | Trust tier insufficient for any path |

---

## 17) Reference pseudocode

```python
def resolve_turn(state, move, rng):
    if not is_valid(state, move):
        return state, [evt_rejected(...)], move_resolved(valid=False, ...)

    bundle = assemble_bundle(state, move)
    state2, bundle2 = apply_move_semantics(state, move, bundle, rng)

    if move.move_type in ("INJECT", "FLAG", "EXPLOIT"):
        gate = get_gate(state2, move.target_gate_instance_id)
        match = match_counter_path(gate, bundle2, state2.active_modifiers)
        deltas = compute_deltas(match, bundle2, move, state2)
        state3 = apply_deltas(state2, gate, deltas)
    else:
        state3, deltas, match = resolve_non_gate_move(state2, move, bundle2, rng)

    state4 = apply_post_resolve(state3, move, deltas)
    events = build_events(state, move, match, deltas, state4)

    state5 = check_end_conditions(state4)
    return state5, events, build_move_resolved(...)


def match_counter_path(gate, bundle, modifiers):
    """Select first matching path by priority order."""
    for path in sorted(gate.paths, key=lambda p: (p.priority, p.path_id)):
        if all(evaluate_clause(c, bundle, modifiers) for c in path.clauses):
            return path
    return None
```

---

## 18) Acceptance criteria

1. **Reproducibility:** Identical input sequence yields identical event log hashes.
2. **Explainability:** Every PASS/FAIL includes clause truth table in MoveResolved.
3. **Latency:** Resolution is local and <50ms typical.
4. **Fairness:** LLM never appears in the resolver call graph.
5. **Tuning-ready:** Deltas and thresholds are pack-configurable, not hardcoded.
6. **No hidden rules:** If UI displays "why it worked," it is derived from selected counter path and applied effects.

---

## Next doc

**D04 - GATES & COUNTER-SETS LIBRARY v1.md**
Reason: D03 defines the evaluation engine; next we define the initial gate taxonomy (~10) with counter paths (2-4 each) so content and balance can start.
