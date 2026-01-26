
## 0) Executive decisions (recommended)

### Decision 1 — D06/D07 mismatch

**Pick Option B now (minimal churn):**

* **Update `index.md`** so it reflects reality:

  * D06 = “CORE GAME LOOP UX”
  * D07 = “ECONOMY, PROGRESSION, & DAILY METAGAME”
* Add a note in the index that **Artifacts/Tools/Modifiers live in D09** (authoritative schemas), with optional future refactor to split them out.

**Why:** Renumbering (Option A) is high-blast-radius and usually not worth it mid-stream. The project stays coherent if the index is truthful and D09 is treated as the source of truth.

---

### Decision 2 — Version field semantics

**Support both, but make the contract explicit:**

* `min_engine_version` = resolver/runtime capability requirement (physics + pack decoder)
* `min_client_version` = optional UI/client feature requirement (only if needed)

**Why:** “Client version” and “engine version” are semantically different. You want both knobs available, but most packs should depend on `min_engine_version` only.

---

### Decision 3 — Capability naming

**Standardize on `capabilities_required` as the canonical name** everywhere, but keep backward compatibility.

* Canonical: `requires.capabilities_required`
* Back-compat alias accepted: `requires.capabilities` (deprecated)

**Why:** Your docs already drift between `requires.capabilities` and `capabilities_required`. Pick one canonical name and allow a temporary alias to avoid breaking existing packs.

---

### Decision 4 — Tool effects format (don’t do a big migration)

**Do NOT rewrite all existing effects.**
Instead: **define a normalization layer** that accepts **both** formats:

* Existing format: `{ "type": "UPGRADE_TRUST_TIER", "params": {...} }`
* New format (optional): `{ "op": "upgrade_trust_tier", ... }`

Internally, the engine converts both into a single normalized representation before resolution.

**Why:** This avoids a massive rewrite while still achieving “extensions are mostly JSON.”

---

## 1) Concrete patch instructions for your agent

### Patch A — Fix the doc inventory truth

**Files:** `index.md`

1. Update D06 label to match actual file content:

* From “ARTIFACTS (CARDS) & TOOLS LIBRARY v1”
* To “CORE GAME LOOP UX”

2. Update D07 label to match actual file content:

* From “BOSSES & MODIFIERS LIBRARY v1”
* To “ECONOMY, PROGRESSION, & DAILY METAGAME”

3. Add one line under D09 in index:

* “D09 contains authoritative definitions for Artifacts/Tools/Modifiers (schemas + libraries) until split-out.”

**Acceptance:** Index matches reality; no phantom docs.

---

### Patch B — Standardize pack “requires” contract

**Files:** `D09`, `D08`, `D10`

#### B1) D09: Update the pack envelope schema (canonical form)

Use this as the *canonical* `requires` object:

```json
{
  "requires": {
    "min_engine_version": "0.2.0",
    "min_client_version": "0.2.0",
    "capabilities_required": ["tool.effect_ops_v1"]
  }
}
```

**Back-compat rule (doc text):**

* If `requires.capabilities` is present and `requires.capabilities_required` absent, treat it as `capabilities_required`.
* Mark `requires.capabilities` as deprecated.

#### B2) D10: Validation rules must reference canonical names

* Validate `min_engine_version` against engine version.
* Validate `capabilities_required` against engine capability registry.
* If deprecated `requires.capabilities` found, log a warning (non-fatal) but normalize.

#### B3) D08: Clarify version semantics

Add a short section:

* “Engine version governs resolver and pack decode.”
* “Client version governs UI-only dependencies.”

**Acceptance:** Every doc uses the same field names; packs remain loadable.

---

### Patch C — Effects: “dual syntax + normalization”

**Files:** `D09`, `D10` (and later `D17` implementation)

#### C1) D09: Define ToolEffect as `oneOf` old/new

Add a schema concept like:

* `ToolEffect` is **oneOf**:

  1. `LegacyEffect` with `type` + `params`
  2. `EffectOp` with `op` + fields

You already have an “effect types allowed list”; keep it.

#### C2) D10: Validation must normalize before validating

Validation order:

1. Parse JSON
2. Normalize effects into canonical internal struct
3. Validate normalized struct against allowlists/capabilities
4. Reject on unknown op/type

#### C3) Add mapping table in docs (deterministic)

Examples:

* `UPGRADE_TRUST_TIER` ↔ `upgrade_trust_tier`
* `ADD_TAG` ↔ `add_tag`
* `APPLY_STATUS` ↔ `apply_status_effect`

**Acceptance:** Existing packs continue to work; new packs may adopt EffectOps gradually.

---

### Patch D — D17 is empty: fill minimal required “capability registry + load pipeline”

**File:** `D17`

At minimum add these sections:

1. **Engine capability registry**

* `ENGINE_VERSION`
* `ENGINE_CAPABILITIES: string[]`
* Capability IDs listed in one place

2. **Pack load pipeline**

* fetch manifest → fetch packs → validate schema → normalize → validate requires/capabilities → install → cache
* fail closed + fallback strategy (ties into your remote flags)

3. **Developer diagnostics**

* a debug view that lists loaded pack IDs + versions + capabilities satisfied
* optional, but very helpful

**Acceptance:** D17 is no longer a hole; docs describe how this actually works.

---

## 2) Updated fragments to add to the patch doc (compatible with your current D09)

### 2.1 Pack envelope `requires` schema fragment

```json
{
  "requires": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "min_engine_version": { "type": "string" },
      "min_client_version": { "type": "string" },
      "capabilities_required": {
        "type": "array",
        "items": { "type": "string" },
        "default": []
      },

      "capabilities": {
        "type": "array",
        "items": { "type": "string" },
        "description": "DEPRECATED alias for capabilities_required"
      }
    }
  }
}
```

### 2.2 Effects dual-format rule (normative)

* Tool/modifier `effects[]` may be either:

  * Legacy: `{type, params}`
  * Op: `{op, ...}`
* Client must normalize into canonical internal representation before execution.

---

## 3) Anything else worth patching right now?

Two small additions that prevent future inconsistency:

1. **Add a “Terminology glossary” section somewhere (D08 or D09):**

* define “engine”, “client”, “resolver”, “pack”, “manifest”, “schedule”, “capability”

2. **Add a “Deprecation policy” for schema fields (D23):**

* deprecated fields remain supported for N releases
* warnings for deprecated usage
* removal only on major bump

---

## What I need from you (not a question—just the safest default)

Given your goal (minimal churn + ship), I recommend we proceed with:

* **Option B** for D06/D07
* **dual version fields** (`min_engine_version` + optional `min_client_version`)
* **canonical `capabilities_required`** with deprecated alias support
* **dual effects format** with normalization

