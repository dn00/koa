# D09 — PACK SCHEMAS (JSON) v1.1

**Status:** Draft v1.1
**Owner:** Content Platform / Runtime
**Last Updated:** 2026-01-26
**Purpose:** Define the canonical JSON schemas for AURA packs (Protocol, Incident, Artifact/Tool, Voice) with required fields, invariants, and minimal examples. These schemas are designed for deterministic offline-first execution and fail-closed validation.

**Mode:** Option B — Artifacts include `impact` field for Daily compliance formula. Freeplay uses `base_power` for full formula.

---

## 1) Conventions (applies to all pack types)

### 1.1 Envelope (required for all packs)

All pack files are JSON objects with this top-level structure:

```json
{
  "pack_type": "protocol|incident|artifact|voice",
  "pack_id": "string",
  "version": "MAJOR.MINOR.PATCH",
  "schema_version": "1.0",
  "created_at": "YYYY-MM-DD",
  "requires": {
    "min_engine_version": "0.1.0",
    "min_client_version": "0.1.0",
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
* `schema_version` for v1 is `"1.0"`.

**Version field semantics:**

* `min_engine_version`: resolver/runtime capability requirement (physics + pack decoder). Most packs should use this.
* `min_client_version`: optional UI/client feature requirement (rarely needed).

**Backward compatibility:**

* If `requires.capabilities` is present and `requires.capabilities_required` is absent, treat `capabilities` as `capabilities_required`.
* `requires.capabilities` is **DEPRECATED** and will be removed in schema v2.

### 1.2 IDs and namespacing

All definitions referenced across packs must use stable, prefixed IDs.

**Required prefix convention:**

| Entity Type | Prefix Pattern | Example |
|-------------|----------------|---------|
| Gate | `gate.<namespace>.<NAME>` | `gate.core.NO_SELF_REPORT` |
| Modifier | `mod.<namespace>.<NAME>` | `mod.core.TIMESTAMP_HARDLINE` |
| Routine | `routine.<namespace>.<NAME>` | `routine.core.STRICT_VERIFY` |
| Artifact | `artifact.<namespace>.<NAME>` | `artifact.core.APPLE_HEALTH_LOG` |
| Tool | `tool.<namespace>.<NAME>` | `tool.core.METADATA_SCRAPER` |
| Incident | `incident.<namespace>.<NAME>` | `incident.kitchen.MIDNIGHT_SNACK_V1` |
| Voice | `voice.<namespace>` | `voice.default` |

**Validation regex (enforced by D10):**

* Gates: `^gate\.[a-z0-9_]+\.[A-Z0-9_]+$`
* Modifiers: `^mod\.[a-z0-9_]+\.[A-Z0-9_]+$`
* Tools: `^tool\.[a-z0-9_]+\.[A-Z0-9_]+$`
* Artifacts: `^artifact\.[a-z0-9_]+\.[A-Z0-9_]+$`

**Rule:** IDs must be unique across an activated Pack Set. Prefix prevents collision between entity types.

### 1.3 Determinism requirements

* Pack JSON must not contain dynamic fields that affect mechanics (no “now”, no implicit time).
* Random selection behavior (draft/shop/voice selection) must be driven by seed + RNG stream keys defined in runtime, not ad hoc randomness in packs.

---

## 2) Protocol Pack schema (`pack_type = "protocol"`)

### 2.1 Purpose

Defines rules: gates, counter-sets, scrutiny/audit model parameters, boss modifiers, and routine profiles.

### 2.2 `content` structure

```json
{
  "gates": [ { "gate_id": "...", "display": {...}, "counter_paths": [...], "rules": {...} } ],
  "scrutiny_model": { ... },
  "modifiers": [ { "modifier_id": "...", "display": {...}, "effects": [...], "constraints": {...} } ],
  "routines": [ { "routine_id": "...", "display": {...}, "weights": {...} } ],
  "resolver_contract": { ... }
}
```

### 2.3 Gate definition

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
        "any_tags": [],
        "traits_all": [],
        "traits_any": []
      },
      "requires_tool": null,
      "effect_on_pass": { "gate_strength_delta": -35, "scrutiny_delta": -1 },
      "effect_on_fail": { "gate_strength_delta": 0, "scrutiny_delta": +2 }
    }
  ],
  "rules": {
    "stacking": "ALLOW|DISALLOW",
    "repeats": { "same_artifact_penalty": 0.5 },
    "time_policy": "IGNORE|PREFER_TIMESTAMP|REQUIRE_TIMESTAMP"
  }
}
```

**Rules:**

* Each gate must have **2–4** `counter_paths` (v1 balancing requirement).
* `effect_on_pass` and `effect_on_fail` are **bounded** by validation (D10): deltas must be within configured ranges.

### 2.4 Scrutiny model

```json
{
  "levels": ["LOW", "MED", "HIGH"],
  "thresholds": { "LOW_TO_MED": 5, "MED_TO_HIGH": 10 },
  "audit_trigger": {
    "on_reach_level": "MED|HIGH",
    "cooldown_turns": 2,
    "audit_penalty": { "gate_strength_delta": +10 }
  },
  "trust_tier_scrutiny": {
    "VERIFIED": -1,
    "PLAUSIBLE": +0,
    "SKETCHY": +2
  }
}
```

### 2.5 Modifier definition (Boss/modifier library)

```json
{
  "modifier_id": "mod.core.TIMESTAMP_HARDLINE",
  "display": { "name": "Timestamp Hardline", "chip": "TIME HARDLINE" },
  "effects": [
    { "type": "ENFORCE_TIME_POLICY", "params": { "policy": "REQUIRE_TIMESTAMP" } }
  ],
  "constraints": {
    "allowed_acts": ["BOSS"],
    "incompatible_with": ["mod.core.NARROW_CHANNEL"]
  }
}
```

### 2.6 Routine profile (AURA “routine”, non-mechanical flavor weights allowed)

```json
{
  "routine_id": "routine.core.STRICT_VERIFY",
  "display": { "name": "Strict Verify", "chip": "STRICT VERIFY" },
  "weights": {
    "audit_likelihood": 1.2,
    "skeptical_to_sketchy": 1.3
  }
}
```

**Rule:** `weights` may influence *which claims/barks are selected* but must not affect legality rules unless explicitly encoded as a modifier/gate parameter.

### 2.7 Resolver contract (capability gating)

```json
{
  "capabilities_required": ["tool.effect_ops_v1", "rng_streams.v1"],
  "effect_types_allowed": ["ENFORCE_TIME_POLICY", "GATE_STRENGTH_DELTA", "SCRUTINY_DELTA", "UPGRADE_TRUST_TIER", "ADD_TAG", "REMOVE_TAG", "ADD_TRAIT", "APPLY_STATUS"]
}
```

**Capability naming convention:**

* `gate.<capability>_v<N>` - gate-related capabilities
* `tool.effect_ops_v<N>` - tool effect primitives
* `modifier.<capability>_v<N>` - modifier-related capabilities
* `voice.outcomekey_v<N>` - voice/bark selection

---

## 3) Incident Pack schema (`pack_type = "incident"`)

### 3.1 Purpose

Defines incident templates used to assemble Daily incidents and Free Play runs.

### 3.2 `content` structure

```json
{
  "incident_templates": [ ... ],
  "draft_packs": [ ... ],
  "reward_tables": [ ... ]
}
```

### 3.3 Incident template

```json
{
  "incident_template_id": "incident.kitchen.MIDNIGHT_SNACK_V1",
  "display": {
    "name": "Midnight Snack Lock",
    "theme": "kitchen",
    "target": "FRIDGE"
  },
  "act_profile": "ACT1|ACT2|BOSS",
  "turn_budget": { "min": 7, "max": 9 },
  "gate_bundle": {
    "min_gates": 1,
    "max_gates": 2,
    "gate_pool": [
      { "gate_id": "gate.core.NO_SELF_REPORT", "weight": 1.0 },
      { "gate_id": "gate.core.TIMESTAMP_REQUIRED", "weight": 0.8 }
    ]
  },
  "modifier_pool": [
    { "modifier_id": "mod.core.TIMESTAMP_HARDLINE", "weight": 0.4 }
  ],
  "draft_offer_profile": {
    "offer_count": 3,
    "pick_count": 1,
    "source_packs": [
      { "draft_pack_id": "incident.core.DPACK_HEALTH_LOGS", "weight": 1.0 },
      { "draft_pack_id": "incident.core.DPACK_TRASH_BIN", "weight": 0.8 }
    ]
  },
  "win_condition": { "type": "REDUCE_GATE_STRENGTH_TO_ZERO" },
  "difficulty_band": "EASY|MED|HARD"
}
```

**Rules:**

* `gate_pool` references `gate_id` from the active Protocol Pack Set.
* Templates must declare an act profile. (Generator assembles 3-incident ladder by act.)

### 3.4 Draft pack definition (“Data Pack”)

```json
{
  "draft_pack_id": "incident.core.DPACK_HEALTH_LOGS",
  "display": { "name": "Health Logs" },
  "artifact_pool": [
    { "artifact_id": "artifact.core.APPLE_HEALTH_LOG", "weight": 1.0 },
    { "artifact_id": "artifact.core.SLEEP_SCORE_SNAPSHOT", "weight": 0.7 }
  ],
  "tool_pool": [
    { "tool_id": "tool.core.METADATA_SCRAPER", "weight": 0.3 }
  ]
}
```

### 3.5 Reward table

```json
{
  "reward_table_id": "incident.core.REWARDS_ACT1",
  "rewards": [
    { "type": "CURRENCY", "amount": 5, "weight": 1.0 },
    { "type": "ADD_TOOL", "tool_id": "tool.core.CORROBORATE_KIT", "weight": 0.4 }
  ]
}
```

---

## 4) Artifact/Tool Pack schema (`pack_type = "artifact"`)

### 4.1 Purpose

Defines archetypes for artifacts (“cards”) and tools used in payload assembly.

### 4.2 `content` structure

```json
{
  "tags": [ "Sensor", "Purchase", "Policy", "Location", "Time", "Media", "Work", "Authority" ],
  "trust_tiers": ["VERIFIED", "PLAUSIBLE", "SKETCHY"],
  "traits": [ "Timestamped", "Editable", "Corroboratable", "SourceTrusted" ],
  "artifacts": [ ... ],
  "tools": [ ... ],
  "upgrades": [ ... ]
}
```

### 4.3 Artifact definition

```json
{
  "artifact_id": "artifact.core.APPLE_HEALTH_LOG",
  "display": { "name": "Apple Health Log", "short": "Health Log" },
  "impact": 8,
  "base_power": 6,
  "trust_tier": "VERIFIED",
  "tags": ["Sensor", "Authority"],
  "traits": ["Timestamped", "SourceTrusted"],
  "params": {
    "time_window": "LAST_2H|TODAY|NONE"
  }
}
```

**Rules:**

* `impact` (required): Integer 1-15. Used in Daily compliance formula: `floor(Impact × resonance)`.
* `base_power` (required): Integer 1-10. Used in Freeplay power_scalar formula.
* `trust_tier` is explicit; can be modified only via Tool effects.

**Daily compliance formula:** `compliance = min(floor(sum(impact) × resonance), 30)`
**Freeplay formula:** Uses `base_power` in `power_scalar = 1 + (power - 5) * 0.05`

**Mode usage:**
| Field | Daily | Freeplay |
|-------|-------|----------|
| `impact` | Primary (compliance) | Ignored |
| `base_power` | Ignored | Primary (power_scalar) |

### 4.4 Tool definition

```json
{
  "tool_id": "tool.core.METADATA_SCRAPER",
  "display": { "name": "Metadata Scraper", "short": "Scraper" },
  "charges": 2,
  "capabilities_required": ["tool.effect_ops_v1"],
  "effects": [
    {
      "type": "UPGRADE_TRUST_TIER",
      "params": { "from": "PLAUSIBLE", "to": "VERIFIED", "requires_trait": "Corroboratable" }
    }
  ],
  "constraints": {
    "usable_on_tags_any": ["Media", "Purchase"],
    "not_usable_on_trust_tiers": ["VERIFIED"]
  }
}
```

### 4.4.1 Tool effects: dual format support

Tool/modifier `effects[]` may use **either** format:

**Legacy format (v1):**
```json
{ "type": "UPGRADE_TRUST_TIER", "params": { "from": "PLAUSIBLE", "to": "VERIFIED" } }
```

**EffectOp format (v1.1+):**
```json
{ "op": "upgrade_trust_tier", "amount": 1, "requires": ["artifact.trait.corroboratable"] }
```

The engine normalizes both into a canonical internal representation before execution.

**Effect type mapping (deterministic):**

| Legacy `type` | EffectOp `op` |
|---------------|---------------|
| `UPGRADE_TRUST_TIER` | `upgrade_trust_tier` |
| `DOWNGRADE_TRUST_TIER` | `downgrade_trust_tier` |
| `ADD_TAG` | `add_tag` |
| `REMOVE_TAG` | `remove_tag` |
| `ADD_TRAIT` | `add_trait` |
| `REMOVE_TRAIT` | `remove_trait` |
| `APPLY_STATUS` | `apply_status_effect` |
| `GRANT_TOKEN` | `grant_token` |
| `CONSUME_TOKEN` | `consume_token` |
| `SET_FLAG` | `set_flag` |

**Rule:** Unknown `type` or `op` values are rejected at validation time (fail-closed).

### 4.4.2 EffectOp schema (v1)

Full EffectOp format with conditional requirements:

```json
{
  "op": "add_tag|remove_tag|add_trait|remove_trait|upgrade_trust_tier|downgrade_trust_tier|grant_token|consume_token|apply_status_effect|set_flag",

  "tag": "string (required for add_tag/remove_tag)",
  "trait": "string (required for add_trait/remove_trait)",
  "amount": "integer 1-10 (required for upgrade/downgrade_trust_tier)",

  "token_id": "string (required for grant/consume_token)",
  "token_amount": "integer 1-10 (required for grant/consume_token)",

  "status_effect_id": "string (required for apply_status_effect)",
  "status_duration_turns": "integer 1-10 (required for apply_status_effect)",

  "flag_path": "string /path/format (required for set_flag)",
  "flag_value": "any (optional for set_flag)",

  "requires": ["predicate strings - must all be true"],
  "forbids": ["predicate strings - must all be false"],
  "target": "payload_artifact|all_payload_artifacts|run_state|gate_instance|scrutiny|hand"
}
```

**Predicate namespace (for `requires` / `forbids`):**

* `trait.<name>` - artifact has trait (e.g., `trait.timestamped`)
* `tag.<name>` - artifact has tag (e.g., `tag.sensor`)
* `trust.<tier>` - artifact trust tier (e.g., `trust.verified`)
* `gate.<gate_id>_active` - gate is currently active
* `modifier.<modifier_id>_active` - modifier is active

**Example with conditionals:**

```json
{
  "tool_id": "tool.core.METADATA_SCRAPER",
  "name": "Metadata Scraper",
  "capabilities_required": ["tool.effect_ops_v1"],
  "effects": [
    {
      "op": "add_trait",
      "trait": "corroborated",
      "requires": ["tag.media"],
      "target": "payload_artifact"
    },
    {
      "op": "upgrade_trust_tier",
      "amount": 1,
      "requires": ["trait.timestamped"],
      "forbids": ["trust.verified"]
    }
  ]
}
```

**Validation rules:**

* `set_flag` paths must match allowlisted prefixes (e.g., `/debug/*` forbidden in production)
* `status_effect_id` must be from allowed enum
* `token_id` must be from allowed enum
```

### 4.5 Upgrade/sidegrade definitions (optional v1)

```json
{
  "upgrade_id": "upgrade.core.SCRAPER_PLUS",
  "from_tool_id": "tool.core.METADATA_SCRAPER",
  "to_tool_id": "tool.core.METADATA_SCRAPER_PLUS",
  "cost": { "currency": 7 }
}
```

### 4.6 Ship Minimum tool library (v1)

The following 5 tools are required for Ship Minimum (D24):

| Tool ID | Purpose | Charges | Primary Effect |
|---------|---------|---------|----------------|
| `tool.core.CORROBORATE` | Anchor two artifacts for trust upgrade | 3 | `upgrade_trust_tier` if combo valid |
| `tool.core.METADATA_SCRAPER` | Extract timestamp from Media/Purchase | 2 | `add_trait: Timestamped` |
| `tool.core.HASH_RECEIPT` | Add provenance hash to editable artifact | 2 | `add_trait: Hashed` |
| `tool.core.REDACT` | Remove PII to satisfy PRIVACY_REDACTION | 2 | `add_trait: Redacted` |
| `tool.core.REWIRE_ANCHOR` | Enable REWIRE move on non-editable artifact | 1 | `add_trait: Rewireable` |

**Target v1.0 additional tools:**

| Tool ID | Purpose |
|---------|---------|
| `tool.core.SAFE_MODE` | Reduce gate strength but increase later strictness |
| `tool.core.CLASSIFIER_SHIFT` | Reinterpret tag family (e.g., Food→Health) |
| `tool.core.TIMESTAMP_INJECT` | Add timestamp to artifact lacking one |

---

## 5) Voice Pack schema (`pack_type = "voice"`)

### 5.1 Purpose

Defines non-blocking AURA bark lines keyed by deterministic outcomes (OutcomeKey), plus tone/lexicon constraints.

### 5.2 `content` structure

```json
{
  "voice_id": "voice.default",
  "style": { "tone": "jailbreak_daemon", "banned_terms": [ ... ] },
  "barks": [ ... ],
  "fallbacks": { ... }
}
```

### 5.3 OutcomeKey bark entry

```json
{
  "key": {
    "event": "RESOLVE",
    "routine": "STRICT_VERIFY",
    "gate_id": "gate.core.NO_SELF_REPORT",
    "outcome": "PASS",
    "scrutiny": "LOW",
    "move": "INJECT"
  },
  "lines": [
    "Sync complete. Verified source accepted. Gate weakened.",
    "You found a real signal. Fine. That counts."
  ],
  "selection_policy": {
    "mode": "DETERMINISTIC_HASH",
    "avoid_repeat_window": 5
  }
}
```

### 5.4 Fallback policy

```json
{
  "fallbacks": {
    "missing_exact_key": "DROP_DIMENSIONS_IN_ORDER",
    "drop_order": ["move", "scrutiny", "gate_id", "routine"],
    "ultimate_default": "Generic resolve line."
  }
}
```

**Rules:**

* No bark line may contain banned courtroom terminology (enforced by validator).
* Voice lines must not promise mechanical effects not represented in the resolver output.

---

## 6) Cross-pack reference rules

Validation must enforce:

* incident templates reference only gate_ids/modifier_ids present in Protocol Pack Set
* incident draft packs reference only artifact_ids/tool_ids present in Artifact Pack Set
* voice pack references only known routine enums and move enums (or uses wildcards if supported later)

**V1 rule:** no wildcards in `OutcomeKey`; use fallback logic instead.

---

## 7) Minimal examples (one per pack type)

### 7.1 Minimal Protocol pack (excerpt)

```json
{
  "pack_type": "protocol",
  "pack_id": "protocol-core",
  "version": "1.0.0",
  "schema_version": "1.0",
  "content": {
    "gates": [],
    "scrutiny_model": { "levels": ["LOW","MED","HIGH"], "thresholds": { "LOW_TO_MED": 5, "MED_TO_HIGH": 10 }, "audit_trigger": { "on_reach_level": "MED", "cooldown_turns": 2, "audit_penalty": { "gate_strength_delta": 10 } }, "trust_tier_scrutiny": { "VERIFIED": -1, "PLAUSIBLE": 0, "SKETCHY": 2 } },
    "modifiers": [],
    "routines": [],
    "resolver_contract": { "capabilities_required": ["effects.v1","rng_streams.v1"], "effect_types_allowed": ["GATE_STRENGTH_DELTA","SCRUTINY_DELTA"] }
  }
}
```

### 7.2 Minimal Incident pack (excerpt)

```json
{
  "pack_type": "incident",
  "pack_id": "incident-core",
  "version": "1.0.0",
  "schema_version": "1.0",
  "content": { "incident_templates": [], "draft_packs": [], "reward_tables": [] }
}
```

### 7.3 Minimal Artifact pack (excerpt)

```json
{
  "pack_type": "artifact",
  "pack_id": "artifacts-core",
  "version": "1.0.0",
  "schema_version": "1.0",
  "content": { "tags": [], "trust_tiers": ["VERIFIED","PLAUSIBLE","SKETCHY"], "traits": [], "artifacts": [], "tools": [], "upgrades": [] }
}
```

### 7.4 Minimal Voice pack (excerpt)

```json
{
  "pack_type": "voice",
  "pack_id": "voice-default",
  "version": "1.0.0",
  "schema_version": "1.0",
  "content": { "voice_id": "voice.default", "style": { "tone": "jailbreak_daemon", "banned_terms": ["objection","verdict","guilty","not guilty","cross-examination"] }, "barks": [], "fallbacks": { "missing_exact_key": "DROP_DIMENSIONS_IN_ORDER", "drop_order": ["move","scrutiny","gate_id","routine"], "ultimate_default": "..." } }
}
```

---

## 8) Validation constraints summary (enforced in D10)

* Envelope fields present and well-formed
* Unique IDs across Pack Set
* Gate counter-path count 2–4
* Numeric ranges bounded (base_power, deltas, thresholds)
* All references resolvable
* Voice pack banned terms enforced
* Pack size budgets (e.g., max bark count per pack) enforced

---

## 9) Open items (for v0.2)

1. Whether to allow “patch packs” to override gate counter-sets (recommended: no in v1).
2. Whether to support OutcomeKey wildcards (recommended: no in v1; use fallback drop-order).
3. Whether to formalize time params (`time_window`) in a shared enum.

