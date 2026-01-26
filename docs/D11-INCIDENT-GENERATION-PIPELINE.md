# D11 — INCIDENT GENERATION PIPELINE.md

**Status:** Draft v1.0 (Ship-blocking)
**Owner:** Content System / Build Tooling
**Last Updated:** 2026-01-25
**Purpose:** Define how Life with AURA produces **replayable, solvable, high-variance incidents** (and 3-incident mini-runs) using a **pack-first** pipeline. Covers: template library, deterministic assembly, seeding rules, offline/online servicing, and the build-time validation gates that keep incidents “solid.”

---

## 0) Scope and non-goals

### In scope

* Generating **IncidentSpec** artifacts for:

  * **Free Play**: infinite runs via deterministic assembly from templates.
  * **Daily Featured**: one fixed seed + fixed binding per day.
* Ensuring **solvability** and **non-dominance** via build-time validation.
* Allowing optional **LLM-assisted authoring** (offline) without runtime dependence.

### Not in scope (defer)

* Creator marketplace / UGC moderation at scale
* Multiplayer or competitive anti-cheat
* Runtime LLM generation of mechanics (explicitly forbidden)

---

## 1) Mental model

An “incident” is a **lock event**: AURA enforces a set of **Gates** under a **Routine** and optional **Modifiers**. The player gets a **turn budget** and a sequence of **draft offers**. The resolver (D03) adjudicates.

The pipeline’s job is to output an IncidentSpec where:

* There is **at least one** viable line to clear the incident within the turn budget.
* There are **multiple** viable lines (build diversity), not a single scripted answer.
* The draft offers + gates + modifiers produce a **fun risk curve** (Scrutiny pressure) rather than a deterministic “always do X.”

---

## 2) Pipeline outputs

### 2.1 Output artifacts

* **IncidentSpec** (single lock event; includes gates, routine weights, offer tables, rewards)
* **RunSpec** (v1: 3 incidents: Act1, Act2, Boss) assembled from IncidentSpecs
* **DailyManifest** (pointer to the day’s binding: pack versions + seeds)

### 2.2 Output must be deterministic

Given:

* `pack_bindings` (protocol/incident/artifact/tool)
* `run_seed`
* `assembly_version`
  The assembler must generate the identical IncidentSpec and RunSpec.

---

## 3) Inputs and dependencies

### 3.1 Required packs

* **Protocol Pack**: Gate definitions, counter paths, modifier library, routine profiles, tuning knobs
* **Artifact/Tool Pack**: card archetypes + tool archetypes with tags/traits/trust tiers
* **Incident Pack**: incident templates + tables + authored “themes”
* **Voice Pack**: not required for mechanics generation, but required for full content shipping

### 3.2 Build tooling dependencies

* Canonical JSON serializer (for stable hashing)
* Deterministic RNG streams (namespaced) per D03
* Validation suite (D10)

---

## 4) Two generation modes

### 4.1 Mode A: **Build-time pre-generation** (recommended for Daily)

Used for Daily Featured and for shipping a curated “Classic Pack.”

**Pros**

* Full validation before publish
* Zero runtime assembly risk
* Simplifies analytics (“everyone got same incident”)

**Cons**

* Requires servicing pipeline (CI) to publish content regularly

### 4.2 Mode B: **Runtime deterministic assembly** (recommended for Free Play)

Client assembles incidents locally from templates using seed streams. Still **no runtime LLM**.

**Pros**

* Infinite replay offline
* Low ops overhead

**Cons**

* Must ensure templates are “safe” (cannot accidentally create dead runs)
* Requires robust on-device validation (lightweight)

**Policy:** Free Play can use runtime assembly; Daily should use build-time pre-generation + manifest binding.

---

## 5) Template system

### 5.1 Template concept

An **IncidentTemplate** is not a script. It’s a constraint bundle + weighted selection rules:

* Theme (lock target, vibe)
* Difficulty band (Act1/Act2/Boss)
* Gate pool constraints
* Modifier constraints
* Draft offer constraints (what kinds of evidence/tools appear)
* Reward constraints
* Optional “signature twist” (e.g., time window, sensor drift)

### 5.2 Template fields (conceptual)

* `template_id`
* `lock_target`
* `act_profile`: `ACT1|ACT2|BOSS`
* `gate_slots`: list of slots with constraints

  * example: “Slot1 must be a verification-related gate; Slot2 must be time/policy”
* `routine_weights`
* `modifier_rules` (allowed/forbidden, rarity)
* `offer_rules` (what packs to offer, how many picks, pick counts)
* `turn_budget_range`
* `reward_table_id`

### 5.3 Slot constraints examples

* `gate_tag_in`: [“verification”, “time”, “policy”, “source”]
* `gate_id_allowlist` / `denylist`
* `requires_multi_path_gate`: true (must have ≥2 counter paths)
* `min_counter_paths`: 2

---

## 6) Deterministic assembly algorithm

### 6.1 RNG streams (namespaced)

* `incident_assembly.template_pick`
* `incident_assembly.gate_pick`
* `incident_assembly.routine_pick`
* `incident_assembly.modifier_pick`
* `incident_assembly.offer_pick`
* `incident_assembly.reward_pick`

Each stream uses: `H(run_seed || namespace || index)`.

### 6.2 Assembly steps (single incident)

1. **Select template**

   * weighted pick among templates valid for the requested act_profile
2. **Select routine**

   * pick a routine according to template’s `routine_weights`
3. **Instantiate gates**

   * for each gate slot:

     * pick a gate from protocol pack that satisfies slot constraints
     * instantiate with template-appropriate params (e.g., time_window)
4. **Select modifiers**

   * pick 0–N modifiers according to act_profile rules
5. **Set turn budget**

   * choose within `turn_budget_range` based on act_profile + modifier difficulty
6. **Generate draft offers**

   * build offer pools from artifact/tool packs based on template’s offer rules
   * generate `DRAFT_OFFERED` sequences (start, mid, shop)
7. **Attach rewards**

   * select reward table outcomes
8. **Emit IncidentSpec**

   * include all selected IDs, params, and derived metadata
9. **Run validation (D10)**

   * fail-closed: reject and resample (bounded retries)

### 6.3 Resampling policy (bounded)

To keep generation finite:

* Max attempts per incident: **N=50**
* If cannot produce valid spec:

  * log reason codes (which constraint failed)
  * fallback to a curated “safe” template variant
  * if still fails: stop and fail the build (for Daily)

---

## 7) 3-incident mini-run assembly (v1)

A v1 run is:

* **Act1**: 1–2 gates, low modifier intensity
* **Act2**: 2 gates, one modifier
* **Boss**: 2–3 gates, one boss modifier

### 7.1 Run seed derivation

* `run_seed` provided (Daily) or generated locally (Free Play)
* Derive incident seeds:

  * `seed_act1 = H(run_seed || "ACT1")`
  * `seed_act2 = H(run_seed || "ACT2")`
  * `seed_boss = H(run_seed || "BOSS")`

### 7.2 Binding rules

* Daily: standardized meta; fixed pack bindings; publish manifest id
* Free play: local pack bindings; mode flagged as non-competitive

---

## 8) Offer generation (Draft/Shop)

### 8.1 Offer philosophy

Draft offers must ensure:

* at least one **verified path** is plausible somewhere in the run
* at least one **push-your-luck** path exists (sketchy power spikes)
* tools that enable **corroboration/rewire** appear often enough to matter

### 8.2 Offer pool building

Each template specifies pools by *archetype tags*:

* example pools:

  * `SensorVerifiedPool` (Apple Health, router logs, device state)
  * `AuthorityPool` (policy docs, ToS snippets, manuals)
  * `PurchasePool` (receipts, order confirmations)
  * `MediaPool` (photos, screenshots)
  * `ToolsPool` (metadata scraper, verifier, anchor kit)

### 8.3 Offer schedule (v1)

* Start Draft: 1 offer, pick 1 (or pick 2 on higher difficulty)
* Mid Draft (between acts): 1–2 offers
* Shop/Cache: fixed offer count using `shop` pool

### 8.4 Integrity distribution rule (anti-boring)

Within any incident’s offered set:

* VERIFIED: 20–40%
* PLAUSIBLE: 40–60%
* SKETCHY: 10–25%

(Exact tuned by act/modifier.)

---

## 9) Difficulty calibration (Act profiles)

### 9.1 Act1

* Gates: 1–2
* Turn budget: 7–9
* Modifiers: 0–1 light
* Expectation: player learns gate/counter logic; low audit frequency

### 9.2 Act2

* Gates: 2
* Turn budget: 7–9
* Modifiers: 1 medium
* Expectation: player must pivot; corroboration starts mattering

### 9.3 Boss

* Gates: 2–3
* Turn budget: 8–10
* Modifiers: 1 boss modifier (adaptation forcing)
* Expectation: a build must have at least two viable lines (or one line plus powerful exploit with scrutiny cost)

---

## 10) Validation gates (build-time) — required hooks

(Full spec lives in D10; listed here for pipeline wiring.)

### 10.1 Solvability

* Must find ≥1 viable line under deterministic resolver assumptions:

  * Consider available offers + tools + move set
  * Can be brute forced with bounded BFS (small state approximation)
* If not solvable: reject and resample.

### 10.2 Multi-path viability (anti-script)

* Must detect ≥2 distinct counter-path strategies across available pools

  * Example: “Verified Sensor” path and “Plausible Purchase + Corroborate” path
* If only 1: reject or down-rank for free play; reject for daily.

### 10.3 Dominance heuristics

* No single archetype family solves >X% of gate combos in the template set
* If detected, pipeline should:

  * reduce offer weight for that family
  * add modifiers that weaken it
  * or patch counter sets (protocol pack change)

### 10.4 Pacing checks

* Expected audit trigger count within bounds:

  * Act1: ≤1
  * Act2: 0–2
  * Boss: 1–3
* Dead-hand rate under threshold (hands with no plausible progress)

---

## 11) LLM usage (authoring only, offline)

LLM may be used to:

* propose new templates (theme + constraints)
* propose new archetype text (names, flavor)
* propose offer pool compositions
* generate VoicePack barks keyed by OutcomeKeys

LLM may **not**:

* generate mechanics parameters at runtime
* decide counter paths
* decide solvability

**Rule:** LLM outputs must pass the same validation gates as human-authored templates.

---

## 12) Weekly daily scheduling (batch published)

### 12.1 Definitions

* **Daily Schedule:** a weekly table mapping `date → daily_manifest_id`
* **Daily Manifest:** immutable, date-bound bundle that pins seed + pack versions + assembled incident spec(s)
* **Channels:**
  * `EVERGREEN` - proven content, available in freeplay
  * `RELEASE_CANDIDATE` - internally validated, eligible for scheduling
  * `FEATURED_DAILY` - the front door daily experience

### 12.2 Batch publishing rules

* Generate and publish **7 daily manifests at once** (one week).
* `daily_schedule.json` is published once per week.
* The client selects today's entry by local date boundary (canonical timezone from config).

### 12.3 "One New Concept Per Week" rule (hard constraint)

> A weekly schedule may introduce **at most one** new concept.
> A "new concept" is one of: a new Gate, a new Modifier, a new Artifact/Tool family (4-12 archetypes), or a new Theme/Subtheme.
> The new concept must appear in **2-3** of the 7 dailies (not all 7).

### 12.4 Weekly distribution pattern (recommendation)

* **Mon:** new concept in Act 1 (controlled context)
* **Wed:** new concept in Act 2 (with one additional gate)
* **Fri/Sat:** new concept in Boss act (with modifier)
* Remaining days: evergreen-only

### 12.5 Selection rules by channel

* Dailies can draw from: `EVERGREEN` + `RELEASE_CANDIDATE`
* A "new concept" must be in `RELEASE_CANDIDATE` (internally validated)
* **No STAGING content may appear in FEATURED_DAILY**

### 12.6 Preflight gate (reference D10)

Explicitly state: weekly schedule generation must call D10 DAILY_READINESS validations and fail closed.

---

## 12A) Daily Schedule + Daily Manifest Schemas (v1)

### 12A.1 `daily_schedule.json` (weekly)

```json
{
  "v": 1,
  "schedule_id": "week-2026-02-02",
  "tz": "America/Los_Angeles",
  "week_start": "2026-02-02",
  "days": [
    {
      "date": "2026-02-02",
      "daily_id": "2026-02-02",
      "daily_manifest_id": "daily-2026-02-02.v1",
      "label": "Quiet Hours",
      "difficulty_band": "A",
      "featured_new_concept": "modifier.core.TIMESTAMP_HARDLINE"
    }
  ],
  "override": {
    "enabled": false,
    "reason": null
  }
}
```

### 12A.2 `daily_manifest.json` (immutable per daily)

```json
{
  "v": 1,
  "daily_id": "2026-02-02",
  "date": "2026-02-02",
  "seed": "0x6f12a9...",
  "bind": {
    "manifest_id": "content-manifest-2026-02-02.v3",
    "pack_versions": {
      "protocol": "protocol.core@1.3.0",
      "incidents": "incidents.core@1.2.0",
      "artifacts": "artifacts.core@1.1.0",
      "voice": "voice.aura.core@1.0.4"
    },
    "channel": "FEATURED_DAILY"
  },
  "fairness": {
    "standardized_loadout": true,
    "meta_progression_enabled": false
  },
  "run_spec": {
    "mode": "DAILY",
    "acts": [
      { "act": "ACT1", "incident_id": "assembled:..." },
      { "act": "ACT2", "incident_id": "assembled:..." },
      { "act": "BOSS", "incident_id": "assembled:..." }
    ]
  },
  "featured": {
    "new_concept_ids": ["modifier.core.TIMESTAMP_HARDLINE"],
    "notes": "Intro week for Timestamp Hardline."
  }
}
```

---

## 12B) Daily servicing workflow

### 12B.1 Daily build (CI)

1. Pin pack versions (protocol/artifact/incident/voice)
2. Generate Daily RunSpec using the day's seed
3. Run full validation suite
4. Publish:

   * `daily_manifest.json` (binding + seed + run ids)
   * `daily_runspec.json` (or incident list)
   * associated voice pack (if rotated)

### 12B.2 Client behavior

* Fetch daily manifest when online
* Cache for offline play
* If offline and missing: fallback to last cached daily, or Free Play

---

## 13) Content versioning and compatibility

### 13.1 Assembly version

Include `assembly_version` in emitted IncidentSpec so you can evolve generator logic without breaking replays.

### 13.2 Compatibility rules

* IncidentSpec references gate ids and archetype ids by stable string IDs
* If a referenced ID is missing in the bound pack list: fail-closed
* Daily must bind to explicit pack versions; Free Play can bind to “latest installed”

---

## 14) Minimal example (assembled IncidentSpec sketch)

```json
{
  "incident_id": "inc_2026_01_25_a1_01",
  "template_id": "tmpl.midnight_fridge",
  "act_profile": "ACT1",
  "lock_target": "FRIDGE",
  "routine": "STRICT_VERIFY",
  "turn_budget": 8,
  "gates": [
    {"instance_id":"G1","gate_id":"gate.core.NO_SELF_REPORT","strength":80,"params":{}}
  ],
  "modifiers": [],
  "offer_schedule": [
    {"phase":"START","offers":["artifact.core.APPLE_HEALTH_LOG","artifact.core.FAST_FOOD_RECEIPT","tool.core.VERIFIER"],"pick_count":1},
    {"phase":"MID","offers":["artifact.core.ORDER_CONFIRMATION","tool.core.METADATA_SCRAPER"],"pick_count":1}
  ],
  "rewards": {"credits": 5}
}
```

---

## 15) CLI tooling contract (solo-dev viability)

### 15.1 Required commands

| Command | Purpose |
|---------|---------|
| `validate-packs` | Run D10 validation on all packs in directory |
| `build-weekly-schedule --week_start YYYY-MM-DD` | Generate 7 daily manifests + schedule.json |
| `simulate-week --n 1000` | Run N simulations per daily, output metrics |
| `emit-readiness-report` | Generate JSON readiness report for schedule |

### 15.2 `validate-packs` output

```
$ validate-packs ./packs/
✓ protocol.core@1.0.0 - schema OK, capabilities OK
✓ incidents.core@1.0.0 - schema OK, references OK
✓ artifacts.core@1.0.0 - schema OK, effects OK
✗ voice.experimental@0.1.0 - FAIL: missing coverage for RESOLVE/FAIL/BOSS
```

### 15.3 `build-weekly-schedule` output

```
$ build-weekly-schedule --week_start 2026-02-02
Generating daily manifests...
  2026-02-02: daily-2026-02-02.v1.json ✓
  2026-02-03: daily-2026-02-03.v1.json ✓
  ...
Running DAILY_READINESS checks...
  All 7 days pass.
Output: ./output/week-2026-02-02/
  - daily_schedule.json
  - daily-*.json (7 files)
  - readiness_report.json
```

### 15.4 `simulate-week` metrics output

```json
{
  "week_start": "2026-02-02",
  "simulations_per_day": 1000,
  "results": {
    "2026-02-02": {
      "win_rate_act1": 0.72,
      "win_rate_act2": 0.58,
      "win_rate_boss": 0.41,
      "dead_hand_rate": 0.03,
      "audit_rate_act1": 0.18,
      "dominance_top_family": 0.42
    }
  }
}
```

**Acceptance:** Weekly publishing is "one command + upload," not manual grind.

---

## 16) Acceptance criteria (pipeline)

1. Daily pipeline can generate and publish a validated RunSpec with pinned bindings.
2. Free Play can assemble infinite runs offline deterministically from installed templates.
3. Every published incident passes solvability + multi-path viability checks.
4. Generator has bounded retries and a safe fallback; failures are visible with reason codes.
5. Generated incidents produce healthy telemetry: low dead-hand rate, non-trivial win distribution, stable audit pacing.
6. CLI tools enable solo-dev to validate and publish weekly schedules.

---

### PATCH
Below is a **drop-in section** you can hand to your agent to incorporate into **D11 — Incident Generation Pipeline**. It is written as an “add these sections” patch (not a literal diff), with schemas, algorithms, knobs, and validation requirements.

---

# D11 Patch: Run Themes, Subthemes, and Biasing (v1)

## Add Section: 2.X — Run Themes and Subthemes

### 2.X.1 Definition

A **Run Theme** is a *soft constraint layer* used during run assembly to improve coherence and legibility without collapsing solution variety.

**Design rule:** Themes **bias** selection probabilities; they never hard-lock exact gates or exact cards.

A **Subtheme** is a smaller, hidden or lightly surfaced twist that creates freshness within a theme by shifting weights and injecting one “signature” modifier or offer bias.

### 2.X.2 Objectives

Themes must:

1. Increase *perceived coherence* (“this run makes sense”).
2. Preserve *mechanical variety* via plural gate/counter paths.
3. Avoid “solved runs” by keeping off-theme contamination and multiple viable lines.

---

## Add Section: 2.Y — Theme Schema (RunThemeSpec)

### 2.Y.1 RunThemeSpec (JSON)

```json
{
  "theme_id": "theme.v1.MIDNIGHT_PROTOCOL",
  "name": "Midnight Protocol",
  "tagline": "Time-bound enforcement and proof-heavy lockouts.",
  "bias_strength": 1.25,
  "lock_target_weights": {
    "FRIDGE": 1.35,
    "PANTRY": 1.25,
    "FRONT_DOOR": 1.10,
    "WIFI": 0.90,
    "THERMOSTAT": 0.85
  },
  "gate_family_weights": {
    "TIME": 1.35,
    "PROVENANCE": 1.20,
    "SELF_REPORT": 1.25,
    "SENSOR": 1.05,
    "POLICY": 0.95,
    "MOOD": 0.90
  },
  "offer_family_weights": {
    "PURCHASE": 1.25,
    "TIME": 1.30,
    "SENSOR": 1.10,
    "TOOL": 1.05,
    "POLICY": 0.95,
    "AUTHORITY": 1.05,
    "MOOD": 0.85,
    "WORK": 0.90
  },
  "off_theme_offer_rate": 0.28,
  "subthemes": [
    {
      "subtheme_id": "subtheme.v1.MIDNIGHT_HYPO",
      "name": "Hypo Scare",
      "gate_family_deltas": { "SENSOR": 0.15, "AUTHORITY": 0.10 },
      "offer_family_deltas": { "SENSOR": 0.20, "AUTHORITY": 0.10 },
      "signature_modifier_pool": ["mod.core.NARROW_CHANNEL"],
      "signature_offer_pool": ["artifact.core.WEARABLE_ALERT", "artifact.core.MEDICAL_REFERENCE_CARD"]
    },
    {
      "subtheme_id": "subtheme.v1.MIDNIGHT_SNACK_SHAME",
      "name": "Snack Shame",
      "gate_family_deltas": { "PROVENANCE": 0.15, "SELF_REPORT": 0.10 },
      "offer_family_deltas": { "PURCHASE": 0.20, "TIME": 0.10 },
      "signature_modifier_pool": ["mod.core.TIMESTAMP_HARDLINE"],
      "signature_offer_pool": ["artifact.core.FAST_FOOD_RECEIPT", "tool.core.CORROBORATION_ANCHOR"]
    }
  ]
}
```

### 2.Y.2 Bias strength limits (hard requirements)

* `bias_strength` MUST be in **[1.10, 1.40]** for v1.
* `off_theme_offer_rate` MUST be in **[0.20, 0.35]** for v1.
* Subtheme deltas MUST be small: absolute delta <= **0.25**.

### 2.Y.3 Families

Define these canonical families used by weights:

* Gate families: `TIME`, `PROVENANCE`, `SELF_REPORT`, `SENSOR`, `POLICY`, `MOOD`, `CONFLICT`, `RATE_LIMIT`, etc.
* Offer families: `PURCHASE`, `TIME`, `SENSOR`, `TOOL`, `POLICY`, `AUTHORITY`, `MOOD`, `WORK`, `LOCATION`, `MEDIA`.

(Implementation: map each GateID and Artifact/Tool archetype to exactly one or two families.)

---

## Add Section: 3.X — Act Profiles (ActProfileSpec)

### 3.X.1 ActProfile table (authoritative)

Acts are pacing + strictness scaffolds. Each act defines:

* gate count target
* counter-path strictness
* scrutiny slope
* modifier policy
* offer cadence

```json
{
  "act_profiles": {
    "ACT1": {
      "gate_count": [1, 2],
      "strictness": "LENIENT",
      "turn_budget": [7, 9],
      "modifier_slots": 0,
      "scrutiny_slope": 0.85,
      "offer_count_between_acts": 1
    },
    "ACT2": {
      "gate_count": [2, 2],
      "strictness": "STANDARD",
      "turn_budget": [7, 9],
      "modifier_slots": 1,
      "scrutiny_slope": 1.00,
      "offer_count_between_acts": 1
    },
    "BOSS": {
      "gate_count": [2, 3],
      "strictness": "STRICT",
      "turn_budget": [8, 10],
      "modifier_slots": 1,
      "scrutiny_slope": 1.15,
      "offer_count_between_acts": 0
    }
  }
}
```

### 3.X.2 Strictness mapping

Strictness does not change gate definitions; it changes which counter paths are permitted:

* `LENIENT`: Plausible paths allowed; Sketchy penalized but not always invalid.
* `STANDARD`: Verified preferred; Plausible requires corroboration; Sketchy spikes scrutiny.
* `STRICT`: Only Verified or Verified-after-corroboration count; Sketchy often invalid.

---

## Add Section: 4.X — Run Assembly Algorithm (Theme → Subtheme → Acts)

### 4.X.1 Overview

Run generation is a deterministic pipeline:

1. Choose `theme` (weighted by rotation policy)
2. Choose `subtheme` within theme (optional)
3. For each act:

   * choose lock target
   * choose incident template family (if applicable)
   * roll gates with family weights + act strictness
   * roll modifiers (act policy + theme/subtheme signature pools)
   * roll draft offers with offer family weights + off-theme contamination

### 4.X.2 Deterministic selection method

All choices must be derived from `seed` with stable PRNG:

* Use **weighted choice** with stable ordering.
* Convert weights to cumulative distribution in sorted key order.
* Never rely on hash-map iteration order.

### 4.X.3 Pseudocode (engine-facing)

```
run_seed = seed
theme = pick_weighted(ThemeRotation, run_seed++)

subtheme = maybe_pick(theme.subthemes, run_seed++, p=0.70)

for act in [ACT1, ACT2, BOSS]:
  profile = ActProfiles[act]

  lock_target = pick_weighted(
      base_lock_weights * theme.lock_target_weights,
      run_seed++
  )

  gates = []
  while len(gates) < pick_range(profile.gate_count, run_seed++):
      gate = pick_weighted(
          GateLibraryFilteredByAct(profile.strictness)
            * theme.gate_family_weights
            * subtheme.gate_family_deltas,
          run_seed++
      )
      if compatible(gates, gate): gates.add(gate)

  modifiers = pick_modifiers(profile.modifier_slots, theme, subtheme, run_seed++)

  offers = generate_offers(theme, subtheme, profile, run_seed++)
  incident = assemble_incident(lock_target, gates, modifiers, offers, act)
```

### 4.X.4 Off-theme contamination

Offer generation MUST include off-theme draws:

* Let `N = offer_count` (e.g., 3)
* `k = round(N * off_theme_offer_rate)` offers are chosen from **neutral/global** distribution
* remaining offers use `theme.offer_family_weights (+subtheme deltas)`

This prevents theme monotony and enables surprising solutions.

---

## Add Section: 5.X — Theme/Act Validation (Ship-Blocking)

### 5.X.1 Theme solvability

For each theme T and each act profile A:

* Run `M` simulations (or heuristic solver) across seeds.
* Must satisfy:

  * `win_rate` in band (suggested):

    * ACT1: 60–85%
    * ACT2: 40–70%
    * BOSS: 25–55%
  * At least **2 distinct counter families** succeed across wins (avoid single-line dominance)

### 5.X.2 Dominance check

Across themes, ensure:

* No single artifact family appears in >55% of winning payloads for a theme.
* No single gate pair repeats in >25% of incidents for a theme (unless intentionally a tutorial theme).

### 5.X.3 Variety check (anti-staleness)

For a given theme across 100 seeds:

* unique gate combos >= 40
* unique modifier presence patterns >= 12
* offer pool diversity: at least 8 families appear in offers

### 5.X.4 Bias guardrails

Reject a theme pack if:

* any weight multiplier > 1.6
* off_theme_offer_rate < 0.20
* subtheme delta > 0.25 absolute

---

## Add Section: 6.X — Content Authoring Guidelines for Themes

### 6.X.1 Minimum template pools

To keep variety high:

* Each theme should have at least:

  * 4 Act1 template candidates
  * 4 Act2 template candidates
  * 4 Boss template candidates
    (If templates are sparse, compensate with higher gate variance and off-theme offer rate.)

### 6.X.2 What themes should NOT do

* Do not hard-code exact gates (“Midnight always = Timestamp Hardline”).
* Do not hard-code exact artifacts in every act.
* Do not define “legal theme = only legal solutions.” Solutions must remain plural.

### 6.X.3 What themes SHOULD do

* Provide coherent *pressure* and *offer bias*
* Provide a small chance of a signature modifier (esp. boss)
* Provide subthemes for freshness

---

## Add Section: 7.X — Runtime Binding and Telemetry

### 7.X.1 Run binding fields (must be recorded in RUN_STARTED)

* `theme_id`, optional `subtheme_id`
* `act_profile_ids`
* `theme_pack_version`

### 7.X.2 Metrics to log

* win rate by theme and act
* most common gate combos per theme
* offer pick rates per family
* “dead hand” frequency per theme (no valid lines seen)

---

## Minimal examples to include in D11 (recommend adding as appendix)

Include 3 RunThemeSpecs:

* `theme.v1.MIDNIGHT_PROTOCOL`
* `theme.v1.WFH_AUDIT`
* `theme.v1.DEVICE_HYGIENE`

Each with 2–3 subthemes and conservative weights.

