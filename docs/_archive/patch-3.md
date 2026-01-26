Send it to your agent, but I recommend sending it in a more “agent-executable” format (explicit doc targets + insert headings + acceptance checks). Here is a ready-to-paste instruction block.

---

## Agent patch instructions (execute in this order)

### Patch Set A — Ops Safety (ship-blocking)

**Docs:** D18, D23 (optionally D17)

1. **Add “Remote Flags / Safe Mode” section**

* Add a small `remote_flags.json` concept (CDN-served, cached).
* Flags:

  * `disable_enhanced_voice: bool`
  * `exclude_channels: string[]` (e.g., `["RELEASE_CANDIDATE"]`)
  * `disable_pack_ids: string[]`
  * `fallback_to_last_known_good_daily: bool`
  * `disable_daily_override: bool`
* Client behavior:

  * If today’s daily manifest fails to load/validate, fall back to last known good daily manifest.
  * If no LKG exists, fall back to deterministic “Practice Daily” (non-leaderboard).

**Acceptance:** One bad pack/schedule cannot brick the app.

---

### Patch Set B — Voice Coverage Gating (ship-blocking)

**Docs:** D12, D10

2. **Define OutcomeKey coverage requirements**

* Add a “Coverage Matrix v1” table:

  * events: `RESOLVE`, `SCRUTINY_UP`, `SCRUTINY_DOWN`, `HINT`
  * outcomes: `PASS`, `FAIL`, `ESCALATE`, `CLEARED`
  * routines: all v1 routines
  * top N gates (e.g., 10) must have dedicated lines
* Minimum lines per key-pattern (example):

  * 6–10 variations for common patterns
  * 2–4 for rare patterns
* Add repetition avoidance rules (no repeat within last K).

3. **Add D10 validation**

* `voice_pack_coverage_check`: fail release if below threshold.

**Acceptance:** Every common resolution produces non-repetitive bark without runtime LLM.

---

### Patch Set C — EffectOps (enables “extensions = packs”)

**Docs:** D06/D07 (or wherever tools/modifiers live), D09, D10

4. **Introduce `EffectOps` mini-language**
   Define supported ops (v1):

* `add_tag`, `remove_tag`
* `add_trait`, `remove_trait`
* `upgrade_trust_tier`, `downgrade_trust_tier`
* `grant_token`, `consume_token`
* `apply_status_effect` (enum only)
* `set_flag` (bounded keys only)

5. **Update pack schemas (D09)**

* Tools and modifiers accept:

  * `effects: EffectOp[]`
* Add `capabilities_required: ["tool.effect_ops_v1"]` as needed.

6. **Update validation (D10)**

* Validate:

  * all ops are supported by engine capabilities
  * flags/status_effect IDs are from allowed enums
  * no tool/modifier refers to unknown tags/traits

**Acceptance:** New tools/modifiers can usually be authored in JSON without code changes.

---

### Patch Set D — Authoring pipeline (solo-dev viability)

**Docs:** D11, D18, D21

7. **Add minimal CLI/tooling contract**
   Commands:

* `validate-packs`
* `build-weekly-schedule --week_start YYYY-MM-DD`
* `simulate-week --n 1000` (estimates: win rate by act, dominance, dead-hand, audit rate)
* `emit-readiness-report` (JSON output stored with schedule)

8. **Add test fixtures (D21)**

* Include golden “weekly schedule + manifest + packs” fixtures.
* Regression runs must match readiness report bands.

**Acceptance:** Weekly publishing is “one command + upload,” not manual grind.

---

### Patch Set E — Determinism drift prevention (recommended)

**Docs:** D04, D21, D23

9. **Replay compatibility rule**

* MOVE_RESOLVED contains selected counter path + deltas (no recomputation required).
* Add golden replay logs for regression.

**Acceptance:** Replays don’t break across client updates.

---

## Deliverables the agent should produce

* Updated sections in each doc
* A short “Changelog” note per doc describing what was added
* Updated capability list (engine capability registry)

---
LLM CTA:

If you want, I can also generate the *exact JSON schema fragments* for `remote_flags.json` and `EffectOp` so the agent doesn’t have to interpret anything.

---

USER: OK

---

Below are **insert-ready JSON fragments** you can paste into your patch doc (or directly into D09/D18/D10). I’m giving you:

1. `remote_flags.json` schema + example
2. `EffectOp` JSON Schema (v1)
3. Tool/Modifier schema fragments that embed `EffectOp[]`
4. Validation checklist snippets for D10
5. Capability IDs list to register in D17/D08

You can hand this whole block to your agent.

---

# Patch Fragments: Remote Flags + EffectOps (v1)

## A) `remote_flags.json` (CDN-served) — Schema + Example

### A.1 JSON Schema (draft-07 style)

```json
{
  "$id": "https://aura.game/schemas/remote_flags.v1.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RemoteFlags",
  "type": "object",
  "additionalProperties": false,
  "required": ["v", "issued_at", "flags"],
  "properties": {
    "v": { "type": "integer", "const": 1 },
    "issued_at": { "type": "string", "format": "date-time" },
    "ttl_seconds": { "type": "integer", "minimum": 60, "maximum": 604800, "default": 21600 },
    "flags": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "disable_enhanced_voice",
        "exclude_channels",
        "disable_pack_ids",
        "fallback_to_last_known_good_daily",
        "disable_daily_override"
      ],
      "properties": {
        "disable_enhanced_voice": { "type": "boolean", "default": false },
        "exclude_channels": {
          "type": "array",
          "items": { "type": "string", "enum": ["STAGING", "RELEASE_CANDIDATE", "FEATURED_DAILY", "EVERGREEN"] },
          "default": []
        },
        "disable_pack_ids": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 },
          "default": []
        },
        "fallback_to_last_known_good_daily": { "type": "boolean", "default": false },
        "disable_daily_override": { "type": "boolean", "default": false }
      }
    }
  }
}
```

### A.2 Example payload

```json
{
  "v": 1,
  "issued_at": "2026-01-25T21:00:00Z",
  "ttl_seconds": 21600,
  "flags": {
    "disable_enhanced_voice": true,
    "exclude_channels": ["RELEASE_CANDIDATE"],
    "disable_pack_ids": ["voice.experimental.sarcasm@0.1.0"],
    "fallback_to_last_known_good_daily": true,
    "disable_daily_override": false
  }
}
```

### A.3 Client behavior requirements (normative text)

* If `fallback_to_last_known_good_daily=true` and today’s daily manifest fails fetch/validate, load the **Last Known Good** daily manifest from cache.
* If no LKG exists, generate a deterministic **Practice Daily** (same seed derivation, but not leaderboard-eligible).
* If `exclude_channels` includes `RELEASE_CANDIDATE`, daily selection must ignore dailies/manifests marked with that channel.
* If `disable_pack_ids` contains a pack id/version, the pack loader must fail closed on that pack and exclude any manifest requiring it.
* If `disable_daily_override=true`, ignore override schedule even if present.

---

## B) `EffectOp` (v1) — JSON Schema

### B.1 EffectOp schema

```json
{
  "$id": "https://aura.game/schemas/effect_op.v1.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "EffectOp",
  "type": "object",
  "additionalProperties": false,
  "required": ["op"],
  "properties": {
    "op": {
      "type": "string",
      "enum": [
        "add_tag",
        "remove_tag",
        "add_trait",
        "remove_trait",
        "upgrade_trust_tier",
        "downgrade_trust_tier",
        "grant_token",
        "consume_token",
        "apply_status_effect",
        "set_flag"
      ]
    },

    "tag": { "type": "string" },
    "trait": { "type": "string" },

    "amount": { "type": "integer", "minimum": 1, "maximum": 10 },

    "token_id": { "type": "string" },
    "token_amount": { "type": "integer", "minimum": 1, "maximum": 10 },

    "status_effect_id": { "type": "string" },
    "status_duration_turns": { "type": "integer", "minimum": 1, "maximum": 10 },

    "flag_path": { "type": "string", "pattern": "^/[-a-zA-Z0-9_/]+$" },
    "flag_value": {
      "type": ["string", "number", "integer", "boolean", "null", "object", "array"]
    },

    "requires": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "forbids": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },

    "target": {
      "type": "string",
      "enum": ["payload_artifact", "all_payload_artifacts", "run_state", "gate_instance", "scrutiny", "hand"],
      "default": "payload_artifact"
    }
  },

  "allOf": [
    {
      "if": { "properties": { "op": { "const": "add_tag" } } },
      "then": { "required": ["tag"] }
    },
    {
      "if": { "properties": { "op": { "const": "remove_tag" } } },
      "then": { "required": ["tag"] }
    },
    {
      "if": { "properties": { "op": { "const": "add_trait" } } },
      "then": { "required": ["trait"] }
    },
    {
      "if": { "properties": { "op": { "const": "remove_trait" } } },
      "then": { "required": ["trait"] }
    },
    {
      "if": { "properties": { "op": { "const": "upgrade_trust_tier" } } },
      "then": { "required": ["amount"] }
    },
    {
      "if": { "properties": { "op": { "const": "downgrade_trust_tier" } } },
      "then": { "required": ["amount"] }
    },
    {
      "if": { "properties": { "op": { "const": "grant_token" } } },
      "then": { "required": ["token_id", "token_amount"] }
    },
    {
      "if": { "properties": { "op": { "const": "consume_token" } } },
      "then": { "required": ["token_id", "token_amount"] }
    },
    {
      "if": { "properties": { "op": { "const": "apply_status_effect" } } },
      "then": { "required": ["status_effect_id", "status_duration_turns"] }
    },
    {
      "if": { "properties": { "op": { "const": "set_flag" } } },
      "then": { "required": ["flag_path"] }
    }
  ]
}
```

### B.2 Notes (normative)

* `requires[]` and `forbids[]` are evaluated against a deterministic predicate namespace (e.g., `trait.timestamped`, `tag.sensor`, `trust.verified`, `gate.NO_SELF_REPORT_active`).
* `set_flag` is restricted to allowlisted `flag_path` prefixes (e.g., `/debug/*` forbidden in production).

---

## C) Tool and Modifier schema fragments (D09 insert)

### C.1 ToolDef (fragment)

```json
{
  "$id": "https://aura.game/schemas/tool_def.v1.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["tool_id", "name", "effects"],
  "properties": {
    "tool_id": { "type": "string" },
    "name": { "type": "string" },
    "rarity": { "type": "string", "enum": ["common", "uncommon", "rare", "legendary"], "default": "common" },
    "capabilities_required": {
      "type": "array",
      "items": { "type": "string" },
      "default": ["tool.effect_ops_v1"]
    },
    "effects": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "https://aura.game/schemas/effect_op.v1.schema.json" }
    }
  }
}
```

### C.2 ModifierDef (fragment)

```json
{
  "$id": "https://aura.game/schemas/modifier_def.v1.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["modifier_id", "name", "timing", "effects"],
  "properties": {
    "modifier_id": { "type": "string" },
    "name": { "type": "string" },
    "timing": { "type": "string", "enum": ["on_turn_start", "on_move_resolve", "on_audit_trigger", "static"] },
    "duration_turns": { "type": ["integer", "null"], "minimum": 1, "maximum": 10, "default": null },
    "capabilities_required": {
      "type": "array",
      "items": { "type": "string" },
      "default": ["modifier.effect_ops_v1"]
    },
    "effects": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "https://aura.game/schemas/effect_op.v1.schema.json" }
    }
  }
}
```

### C.3 Example tool using EffectOps

```json
{
  "tool_id": "tool.core.METADATA_SCRAPER",
  "name": "Metadata Scraper",
  "rarity": "common",
  "capabilities_required": ["tool.effect_ops_v1"],
  "effects": [
    { "op": "add_trait", "trait": "corroborated", "requires": ["tag.media"] },
    { "op": "upgrade_trust_tier", "amount": 1, "requires": ["trait.timestamped"] }
  ]
}
```

---

## D) D10 Validation Snippets (insert-ready checklist)

Add a validation stage **CAPABILITY_VALIDATION**:

1. **Engine capability check**

* verify `engine_version >= pack.min_engine_version`
* verify each entry in `pack.capabilities_required` exists in engine registry

2. **Reference resolution**

* every `gate_id`, `modifier_id`, `artifact_id`, `tool_id` referenced by incidents exists in the bound packs

3. **EffectOps validation**

* each `effects[].op` is supported by engine
* `status_effect_id`, `token_id`, `tag`, `trait`, `flag_path` are from allowlists
* `set_flag` paths must match allowlisted prefixes only

4. **Fail closed**

* any failure rejects pack install and rejects any manifest that depends on it

---

## E) Capability IDs (register in D08/D17)

Minimum capability set (v1):

* `voice.outcomekey_v1`
* `daily.schedule_v1`
* `daily.manifest_v1`
* `tool.effect_ops_v1`
* `modifier.effect_ops_v1`
* `pack.capabilities_contract_v1`

Optional (future):

* `gate.timestamp_window_v1`
* `gate.counterpath_compose_v2`
* `anti_tamper.pack_signature_v1`

