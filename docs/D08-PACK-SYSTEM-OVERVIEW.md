# D08 — PACK SYSTEM OVERVIEW (AURA) v1

**Status:** Draft v0.1
**Owner:** Content Platform / Runtime
**Last Updated:** 2026-01-25
**Purpose:** Define the pack system that services Life with AURA: what packs are, how they are versioned, loaded, validated, and bound to daily/free-play runs—while keeping gameplay deterministic and offline-first.

---

## 1) Goals

1. **Ship content without app releases** (incidents, gates, artifacts, voice, tuning).
2. **Deterministic gameplay**: packs define rules and content; the resolver remains authoritative.
3. **Fail-closed**: invalid packs never partially apply.
4. **Offline-first**: packs are cacheable and usable without network after first fetch.
5. **Composable**: multiple packs can be active; layering rules are explicit and predictable.
6. **Monetization-ready**: enable “free baseline + paid expansions” by pack entitlements (without pay-to-win for Daily).

---

## 2) Non-goals

* Marketplace/UGC moderation workflows (defer)
* Multiplayer pack synchronization (defer)
* Runtime LLM dependence (voice may be enhanced optionally; not required)
* Complex dependency resolution (keep v1 simple and explicit)

---

## 3) Definitions and invariants

### 3.1 Pack

A **Pack** is a versioned, immutable content artifact (JSON) that declares:

* domain definitions (gates, artifacts, modifiers, incidents),
* tuning parameters,
* and text/audio assets references (voice barks).

Once published, a pack version is **immutable**.

### 3.2 Pack Set

A **Pack Set** is the exact set of pack versions active for a run:

* `{(pack_type, pack_id, version) …}`

A run must record/bind to a specific Pack Set (or Manifest ID) to ensure reproducibility.

### 3.3 Determinism rule

Resolver outcomes depend only on:

* initial state,
* RNG seed(s),
* Pack Set,
* player actions.

No wall-clock data, locale, or online responses may affect outcomes.

---

## 4) Pack types (v1)

### 4.1 Protocol Pack

Defines the **rules of enforcement**:

* Gate library and counter-sets
* Scrutiny mechanics parameters (thresholds, audit triggers)
* Boss modifier definitions (effects hooks and constraints)
* Optional routine profiles (claim weighting profiles)

**Principle:** Protocol packs define *what can happen*, not *what will happen today*.

### 4.2 Incident Pack

Defines **scenario templates**:

* Lock targets (fridge/thermostat/router/etc.)
* Gate bundles and weights
* Draft offer pools (“Data Packs”) and reward tables
* Act tuning bands (Act1/Act2/Boss)
* Constraints ensuring solvability and variety

**Principle:** Incidents are *procedurally assembled* from templates, not freeform text.

### 4.3 Artifact/Tool Pack

Defines the player’s **building blocks**:

* Artifact archetypes (tags, trust tiers, traits, base power bands)
* Tool definitions (corroborate/transform/tag-scrape effects)
* Upgrade paths and sidegrades
* Any deterministic synergy rules (if used)

### 4.4 Voice Pack

Defines AURA’s **barks**, keyed by deterministic outcomes:

* OutcomeKey → list of lines (with selection policy)
* Intros/outros/recaps (optional)
* Banned vocabulary lists and tone constraints (“jailbreak daemon,” not “courtroom”)

**Important:** Voice never changes mechanics; it only renders results.

---

## 5) Versioning and compatibility

### 5.1 Semantic versioning

Packs use SemVer: `MAJOR.MINOR.PATCH`

* **PATCH**: text fixes, tuning within defined constraints, additive bark lines
* **MINOR**: additive content (new gates/artifacts/incidents) that does not break resolver contract
* **MAJOR**: breaking changes to schemas or mechanics that require client/runtime changes

### 5.2 Runtime compatibility

The client declares:

* supported schema versions per pack type
* minimum compatible protocol pack version(s)
* supported engine capabilities

If a pack requires an unsupported schema or runtime capability, it must be rejected (fail-closed).

### 5.3 Version field semantics

* **Engine version** (`min_engine_version`): governs resolver and pack decode. This is the primary compatibility check for most packs.
* **Client version** (`min_client_version`): governs UI-only dependencies (rarely needed; use sparingly).

**Rule:** Most packs should depend only on `min_engine_version`. Use `min_client_version` only for UI-specific features (e.g., new screen types).

### 5.4 Capability contract

Packs declare required capabilities via `requires.capabilities_required[]`. The engine must:

1. Validate that `engine_version >= pack.min_engine_version`
2. Validate that all `capabilities_required` are in the engine's supported capability set
3. If either check fails, **fail closed** (pack not loaded; incidents depending on it not eligible)

**Capability naming convention:**

* `gate.<name>_v<N>` - gate-related capabilities
* `tool.effect_ops_v<N>` - tool effect primitives
* `modifier.<name>_v<N>` - modifier-related capabilities
* `voice.outcomekey_v<N>` - voice/bark selection

**Extension classification:**

* **Data-only extension:** uses existing capabilities only (just new JSON)
* **Engine extension:** requires a new capability ID (needs code change)

Capabilities are **monotonic**: once introduced, they never change meaning. Deprecate via new capability IDs.

---

## 6) Composition and override rules (pack layering)

We need explicit rules for “multiple packs are active.”

### 6.1 Namespacing

All definitions are addressed by stable IDs:

* `gate_id`, `modifier_id`, `artifact_id`, `tool_id`, `incident_template_id`, `voice_pack_id`
  IDs must be globally unique within a Pack Set.

Recommended naming:

* `gate.core.NO_SELF_REPORT`
* `artifact.core.APPLE_HEALTH_LOG`
* `incident.kitchen.MIDNIGHT_SNACK_V1`

### 6.2 Add vs override

A pack may:

* **Add** new definitions (safe default)
* **Override** existing definitions only if explicitly allowed via an “override contract”

**V1 recommendation:** Allow overrides only for:

* voice lines (safe)
* incident pools/weights (safe if validated)
* tuning parameters that are explicitly marked overridable

Avoid overriding gate semantics in v1 unless you also ship strict compatibility tests.

### 6.3 Precedence

If overrides are allowed, define precedence:

1. Daily/Run-bound overrides (rare, hotfix)
2. Explicit “patch packs” (targeted adjustments)
3. Base packs (core)

Precedence must be deterministic and recorded in the Pack Set.

---

## 7) Loading model (offline-first)

### 7.1 Manifest-driven

The backend publishes a **Manifest** that lists the recommended Pack Set per channel. The client:

* fetches manifest (short TTL),
* downloads missing pack versions,
* verifies integrity (sha256),
* caches packs in IndexedDB.

### 7.2 Fail-closed loading

On load:

1. Parse JSON
2. Validate schema
3. Validate internal invariants (IDs unique, required fields present)
4. Validate cross-pack references
5. Only then “activate” the Pack Set

If any step fails, the pack is rejected and the last-known-good Pack Set remains active.

### 7.3 Daily binding

A DailySpec must bind to:

* a specific manifest_id or explicit pack versions
* so “today’s daily” is stable even if packs update mid-day.

---

## 8) Pack validation (high-level; detailed in D10)

Pack validation has two layers:

### 8.1 Static validation (per pack)

* schema conformance
* unique IDs, non-empty lists, sane ranges
* forbidden vocabulary checks (voice pack)
* no undefined references

### 8.2 Dynamic validation (Pack Set)

* solvability checks for each incident template under expected draft distributions
* dominance checks (no single archetype solves everything)
* pacing checks (audit frequency, dead-hand rates)
* performance budgets (pack size, number of templates)

---

## 9) RNG and seeding contracts (pack-relevant)

### 9.1 Seed inputs

* DailySpec provides a seed.
* Free Play generates a seed locally.

### 9.2 Stream keys

The generator must use named RNG streams (or keyed derivations) so:

* adding cosmetic randomness does not perturb gameplay-critical randomness
* incident assembly randomness is stable

Pack system implication: each incident template specifies which RNG stream keys it consumes (at least at a conceptual level) to preserve reproducibility.

---

## 10) Voice pack selection policy (non-blocking)

Voice selection must not block mechanics.

**Recommended policy:**

* Resolver produces `OutcomeKey`.
* Voice system selects a line deterministically or semi-deterministically:

  * Deterministic option: hash(OutcomeKey + tick_id) mod N
  * Semi option: local RNG stream `voice_rng` keyed by seed but isolated from gameplay RNG

Repetition control:

* maintain a small “recently used” cache per OutcomeKey family.

---

## 11) Entitlements and packaging (monetization-ready)

### 11.1 Baseline packs

* A minimal “core” Pack Set is free and cached.

### 11.2 Paid packs

Paid expansions unlock additional packs:

* more incident templates (new themes)
* more artifact/tool archetypes (new strategies)
* more voice packs/cosmetics

**Fairness rule:** Daily mode should not become pay-to-win.
Options:

* Daily uses only baseline artifacts/tools, or
* Daily standardizes the available pool for all players.

---

## 12) Operational workflows (thin live service)

### 12.1 Publishing

* Build pack → validate → compute sha256 → upload immutable version to CDN → update manifest pointer.

### 12.2 Rollout

* Channels: stable/beta
* Optional percentage rollout field in manifest (defer if not needed)

### 12.3 Emergency rollback

* Repoint manifest to previous Pack Set (no pack deletion)
* If a daily is affected, publish a corrected daily_id (do not silently mutate)

---

## 13) Acceptance criteria (v1)

1. Client can load a Pack Set deterministically and run fully offline after initial caching.
2. Any invalid pack fails closed and does not corrupt cached “last known good” content.
3. DailySpec is reproducible: same seed + same Pack Set + same actions ⇒ same outcomes.
4. Pack updates can ship without client release via manifest update.
5. Voice packs can be swapped/updated without affecting gameplay results.

---

## 14) Terminology glossary

| Term | Definition |
|------|------------|
| **Engine** | The deterministic resolver runtime that computes game outcomes |
| **Client** | The PWA application (UI + engine + storage) |
| **Resolver** | Pure function that computes move outcomes given state + action + packs |
| **Pack** | Versioned, immutable content artifact (JSON) containing game definitions |
| **Manifest** | Immutable document listing exact pack versions for a content release |
| **Schedule** | Weekly table mapping dates to daily manifests |
| **Capability** | A named feature flag that packs can require and engines can provide |
| **Daily** | A featured seed + manifest binding for a specific calendar date |
| **Free Play** | Offline mode using locally cached packs with player-generated seed |

---

## 15) Open decisions (to finalize before D09)

1. Override policy scope: do we allow any gate overrides in v1, or strictly additive only?
2. How strict do we want pack size/perf budgets (especially voice)?
3. Whether to support "patch packs" as first-class artifacts in v1 or just treat them as ordinary packs with higher precedence.

---

