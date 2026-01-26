We have **most of the conceptual pieces**, but based on what you’ve shared, we have **not yet made the “pack interfaces” explicit enough** to guarantee that extensions are “mostly new pack JSONs” without accidental engine coupling.

So: **yes, you should update the docs** to harden this. And **no**, the weekly-dailies patch we just wrote does **not** fully cover the “pack interface capability contract” (it covered lifecycle/scheduling/immutability/promotion, not extensibility boundaries).

Below is exactly what to patch, and where, in a way your agent can apply cleanly.

---

# What’s missing today (gap list)

1. **Explicit Pack Capability Contract**

* Packs need to declare what engine features they require.
* Engine needs to fail closed if unsupported.

2. **Pack Interface Stability Rules**

* Which JSON fields are stable vs experimental.
* How to evolve schemas without breaking old packs.

3. **“Data-only vs Engine-change” taxonomy**

* A short table defining which extension types require code.

4. **Concrete “effect primitives” for tools/modifiers**

* Tools/modifiers should be expressed as compositions of a fixed set of deterministic effect ops where possible.

Without these, “extensions are easy” is true in theory but fragile in practice.

---

# Docs to update (minimal set)

## 1) D08 — PACK SYSTEM OVERVIEW (primary place)

Add a new section: **“Pack Capability Contract & Extension Boundaries”**

### Insert-ready content (agent can paste)

**New fields (conceptual):**

* `min_engine_version` (semver)
* `capabilities_required[]` (string IDs)
* optional: `capabilities_provided[]` (usually empty; engine provides capabilities, packs require them)

**Rules:**

* Engine must validate:

  * engine_version ≥ min_engine_version
  * all capabilities_required are supported
* If not, **fail closed** (pack not loaded; incident that depends on it not eligible)
* Capabilities are **monotonic**: once introduced, never change meaning; deprecate via new capability IDs.

**Capability naming:**

* `gate.timestamp_window_v1`
* `gate.counterpath_compose_v1`
* `tool.effect_ops_v1`
* `modifier.rate_limit_v1`
* `voice.outcomekey_v1`

**Extension classification:**

* “Data-only extension” if it uses existing capabilities only
* “Engine extension” if it requires a new capability ID

---

## 2) D09 — PACK SCHEMAS (JSON) v1 (authoritative schema change)

Add the fields to every pack root schema:

### Required on all packs

* `pack_id`
* `pack_version`
* `pack_type`
* `min_engine_version`
* `capabilities_required` (default empty list)

### Optional

* `schema_version` (pack schema version)
* `content_channel` (staging/rc/evergreen) if you want it baked into packs (or keep lifecycle outside)

Also add a short normative paragraph:

> A pack may only reference gates/tools/modifiers whose `capabilities_required` are satisfied by the client engine. Unknown IDs are invalid.

---

## 3) D10 — PACK VALIDATION & SOLVABILITY CHECKS (enforce it)

Add validations:

* Check `min_engine_version` and `capabilities_required` against current engine capability set.
* Verify all references resolve:

  * incident references only existing gate IDs, modifier IDs, artifact IDs
* Validate that tools/modifiers only use supported effect ops (see below)

This makes “extension” safety real.

---

## 4) D17 — CLIENT ARCHITECTURE (PWA) (implementation hook)

Add:

* A constant `ENGINE_CAPABILITIES = {...}`
* Pack load pipeline validates capabilities before install
* Expose an internal “Capabilities Debug” panel for development (optional)

---

## Optional but highly recommended (if not already in your docs)

## 5) D06 / D07 (Tools/Modifiers) OR wherever you defined them

Define an **EffectOps** mini-language so tools/modifiers are data-driven:

Example ops:

* `add_tag`, `remove_tag`
* `upgrade_trust_tier`, `downgrade_trust_tier`
* `add_trait`, `remove_trait`
* `grant_token`, `consume_token`
* `apply_status_effect` (from fixed list)
* `set_flag` (bounded keys)

Then tools become:

```json
{
  "tool_id": "tool.core.METADATA_SCRAPER",
  "capabilities_required": ["tool.effect_ops_v1"],
  "effects": [
    {"op":"upgrade_trust_tier","amount":1,"requires":["artifact.trait.timestamped"]},
    {"op":"add_trait","trait":"corroborated"}
  ]
}
```

This is the biggest lever for “extensions are just packs.”

---

# Is this in the weekly-dailies patch?

Only indirectly. The weekly patch added:

* schedules/manifests
* lifecycle and promotion
* hotfix mechanics
* telemetry thresholds

It did **not** add:

* `min_engine_version`
* `capabilities_required`
* effect primitives / data-only taxonomy

So you should add this as a **second patch set**.

---

# Minimal agent instructions (do this in one pass)

1. Patch **D08**: add “Capability Contract & Extension Boundaries”
2. Patch **D09**: add the two fields to all pack schemas + reference resolution rule
3. Patch **D10**: add capability validation checks
4. Patch **D17**: add engine capability registry and pack load enforcement
5. (Optional) Patch **D06/D07**: define `EffectOps` and migrate tools/modifiers to it

