# D10 — PACK VALIDATION & SOLVABILITY CHECKS v1

**Status:** Draft v0.1
**Owner:** Content Platform / Runtime QA
**Last Updated:** 2026-01-25
**Purpose:** Define the deterministic validation and testing harness that ensures packs are safe, playable, balanced, and performant. This doc specifies **fail-closed** rules, **static schema validation**, **cross-pack reference validation**, and **dynamic solvability/balance checks** (including Monte Carlo + targeted search) before packs can be published to a Manifest.

---

## 1) Goals

1. **Fail-closed correctness:** invalid packs never load; invalid daily bindings never ship.
2. **Solvable content:** every Daily Featured incident/minirun must be solvable under reasonable play.
3. **Non-degenerate balance:** avoid dominant strategies (“always draft Legal and win”) and avoid unwinnable trap states.
4. **Pacing and feel constraints:** audits/scrutiny should occur within intended bands; avoid “dead hands.”
5. **Performance budgets:** pack sizes and generator complexity must keep PWA load and runtime fast.
6. **Deterministic reproducibility:** validation results must be reproducible (seeded runs).

---

## 2) Non-goals

* Anti-cheat / adversarial player security (defer until competitive leaderboards)
* Multiplayer synchronization checks (defer)
* Full formal verification of game balance (heuristics + simulation is sufficient for v1)

---

## 3) Validation stages (pipeline)

Packs must pass all stages before being eligible for inclusion in any manifest channel.

### Stage A — Static pack validation (single pack)

* JSON parse, schema conformance
* local invariants (ranges, required fields, uniqueness within pack)

### Stage B — Pack Set validation (cross-pack)

* reference resolution across packs
* ID collision detection across Pack Set
* capability compatibility checks

### Stage C — Dynamic validation (simulation + search)

* solvability checks on incident templates and daily assemblies
* degeneracy checks (dominant archetypes, “must-draft” tools)
* pacing checks (audit frequency, dead-hand probability, turn budget utilization)

### Stage D — Publishing gate

* compute sha256 for each pack asset
* record validation report artifact
* only then allow manifest pointer update

**Fail-closed rule:** any failure blocks publication.

---

## 4) Stage A — Static validation (per pack type)

### 4.1 Common envelope validation (all packs)

Required:

* `pack_type`, `pack_id`, `version`, `schema_version`, `content`
* `pack_id` stable format; `version` SemVer format
* `schema_version == "1.0"` for v1
* `requires.capabilities` subset of runtime supported capabilities

### 4.2 Protocol pack static checks

* `gates[]`: unique `gate_id`
* each gate has **2–4** `counter_paths`
* numeric bounds:

  * `gate_strength_delta` within configured bounds (e.g., -100..+100)
  * scrutiny deltas bounded (e.g., -5..+5)
  * scrutiny thresholds strictly increasing
* modifier constraints:

  * `incompatible_with` references existing modifiers
  * no self-incompatibility
* forbidden rule shapes:

  * no “hidden win condition” fields (protocol does not define win directly)

### 4.3 Incident pack static checks

* unique `incident_template_id`, `draft_pack_id`, `reward_table_id`
* `gate_pool` weights > 0; pools non-empty
* `min_gates <= max_gates`; turn_budget min <= max
* draft profiles coherent:

  * `offer_count >= pick_count`
  * source_packs weights > 0

### 4.4 Artifact pack static checks

* unique `artifact_id`, `tool_id`, `upgrade_id`
* `base_power` within band (e.g., 1..10 v1)
* `trust_tier` in allowed enum
* tool effects:

  * `charges >= 1`
  * effect type in `resolver_contract.effect_types_allowed` (from active protocol)
  * tool constraints refer to known tags/trust tiers

### 4.5 Voice pack static checks

* banned vocabulary enforcement (no courtroom terms, no disallowed slurs, etc.)
* bark lines length constraints (avoid excessively long responses)
* OutcomeKey schema valid and uses recognized enums
* fallback config valid (drop_order only contains known dimensions)

---

## 5) Stage B — Pack Set validation (cross-pack)

Given a proposed Pack Set (e.g., from a Manifest or DailySpec binding):

### 5.1 ID collision detection

Ensure global uniqueness across the Pack Set:

* `gate_id`, `modifier_id`, `routine_id`
* `incident_template_id`, `draft_pack_id`, `reward_table_id`
* `artifact_id`, `tool_id`, `upgrade_id`
* `voice_id`

### 5.2 Reference resolution checks

* Each incident template `gate_pool.gate_id` exists in protocol set
* Each incident template `modifier_pool.modifier_id` exists in protocol set
* Each draft pack `artifact_pool.artifact_id` exists in artifact set
* Each draft pack `tool_pool.tool_id` exists in artifact set
* If voice keys reference `gate_id`/`routine`, those must exist (or be droppable via fallback policy; v1 recommends keys be exact and rely on fallback drop-order)

### 5.3 Capability checks

* Validate `min_engine_version` against current engine version
* Validate `capabilities_required` against engine capability registry
* Effect types used by tools/modifiers must be allowed by resolver contract
* If deprecated `requires.capabilities` found (instead of `capabilities_required`), log a deprecation warning but normalize and continue

### 5.3.1 Effect normalization (required before validation)

Tool/modifier effects must be normalized before validation:

1. Parse JSON
2. For each effect in `effects[]`:
   * If legacy format (`type` + `params`), convert to canonical internal struct
   * If EffectOp format (`op` + fields), convert to canonical internal struct
3. Validate normalized struct against `effect_types_allowed` in resolver contract
4. Reject on unknown `type` or `op` (fail-closed)

### 5.3.2 EffectOps validation (v1)

For each normalized effect:

1. **Op support check:** `op` must be in engine's supported ops list
2. **Required fields:** Conditional fields present per op type:
   * `add_tag` / `remove_tag` → requires `tag`
   * `add_trait` / `remove_trait` → requires `trait`
   * `upgrade_trust_tier` / `downgrade_trust_tier` → requires `amount`
   * `grant_token` / `consume_token` → requires `token_id`, `token_amount`
   * `apply_status_effect` → requires `status_effect_id`, `status_duration_turns`
   * `set_flag` → requires `flag_path`
3. **Allowlist checks:**
   * `status_effect_id` must be from `STATUS_EFFECTS_ALLOWED` enum
   * `token_id` must be from `TOKENS_ALLOWED` enum
   * `flag_path` must match allowlisted prefixes (reject `/debug/*` in production)
   * `tag` and `trait` should be from known sets (warn on unknown, fail on reserved)
4. **Predicate validation:**
   * `requires[]` and `forbids[]` predicates must use valid namespace prefixes
   * Unknown predicates are rejected

**Fail-closed:** Any EffectOp validation failure rejects the entire pack.

### 5.4 Determinism hygiene checks

* No pack fields marked “runtime_random” or similar (disallowed)
* All weights are numeric and stable; no environment-dependent logic

---

## 6) Stage C — Dynamic validation (solvability + balance)

Dynamic validation is executed using a deterministic simulation harness.

### 6.1 Inputs

* Pack Set (Protocol + Incident + Artifact + Voice)
* A set of incident templates (or the day’s assembled incidents)
* A set of seeds per template (deterministic seed list)
* Player policy models (see §6.3)

### 6.2 Outputs (validation report)

For each template/day:

* solvable: yes/no
* estimated win rate per policy model
* average turns to win (and distribution)
* audit rate, scrutiny distribution
* dead-hand rate (no viable actions)
* “dominant archetype” signals
* top failure modes (reason codes)

### 6.3 Player policy models (automated “bots”)

We do not attempt perfect play. We use **several simple deterministic policies** to approximate player behavior and detect issues.

Minimum set:

1. **Greedy Counter**: pick actions maximizing immediate gate reduction.
2. **Low Scrutiny**: prefers high-trust plays; avoids scrutiny increases.
3. **Push-Your-Luck**: uses low-trust high-power when close to win.
4. **Tool-First**: prioritizes using tools to upgrade trust then inject.
5. **Random-Within-Legal**: random among legal actions (baseline sanity).

**Rule:** A daily/template must be solvable by at least one non-random policy above at reasonable rates (thresholds below).

### 6.4 Solvability criteria (v1 defaults)

An incident template is considered **solvable** if:

* Across N seeds (default N=200), there exists at least one policy model with:

  * **win_rate ≥ 35%** for Act1 templates
  * **win_rate ≥ 25%** for Act2 templates
  * **win_rate ≥ 15%** for Boss templates
    (These are tuning targets; can be tightened as the game matures.)

Additionally:

* **dead-hand rate ≤ 3%** (states where no legal action improves expected outcome)
* **soft-lock rate = 0%** (no-state-progress loops unless EndTurn exits)

### 6.5 “Dead hand” detection

A state is considered “dead hand” if:

* no legal action exists OR
* all legal actions are strictly dominated by EndTurn and do not change state meaningfully within K turns

We enforce:

* each incident must offer at least one escape hatch path (tool, reroll, or legal low-power move) under normal conditions.

### 6.6 Audit and scrutiny pacing checks

Per incident/act profile:

* audits should not cluster so hard that the run becomes purely punitive
* typical targets (tuneable):

  * Act1 audit probability per run: 10–30%
  * Act2: 20–45%
  * Boss: 35–65%
* if audit triggers nearly every time at Act1, content likely over-penalizes low trust tiers or lacks corroboration tools.

### 6.7 Dominance / degeneracy checks

We flag degeneracy if any of the following holds:

* A single tag family (e.g., `Policy/Legal`) accounts for >70% of wins across multiple incidents in the daily ladder.
* A single tool is “must-pick” (appears in >60% of winning decks where it was offered).
* A single gate has only one viable counter path in practice (despite 2–4 defined), indicated by near-zero usage of other paths.

Mitigation actions:

* adjust weights to diversify draft pools
* add alternative counter paths (or improve existing ones)
* tune scrutiny deltas to penalize spammed patterns

### 6.8 Difficulty cliffs checks

Detect large spikes:

* Act2 win_rate less than half of Act1 win_rate at similar turn budgets
* Boss win_rate collapses below 5% across all policies

Mitigation:

* reduce gate strength bands
* widen turn budget
* add one more draft opportunity or reward

---

## 7) Voice pack coverage checks (ship-blocking for Daily)

Voice packs do not affect outcomes, but must satisfy UX quality constraints.

### 7.1 Coverage validation (required)

For each OutcomeKey family produced in simulations, ensure:

* Either an exact bark exists OR fallback chain resolves to a non-empty line
* Minimum line counts per D12 §9.1.1 coverage matrix

### 7.2 Line count thresholds

| Pattern Frequency | Min Lines Required |
|-------------------|-------------------|
| Common (>10% of runs) | 6-10 |
| Moderate (5-10%) | 4-6 |
| Rare (1-5%) | 2-4 |
| Very rare (<1%) | Fallback OK |

### 7.3 Repetition validation

* Ensure at least K+1 lines exist for any pattern that could repeat within K turns
* Default K=5 for same event type

### 7.4 Banned-terms compliance

* All lines must pass banned-terms check (D12 §6.1)
* No courtroom vocabulary

### 7.5 Publication rules

| Channel | Coverage Required |
|---------|-------------------|
| FEATURED_DAILY | Full coverage matrix pass |
| RELEASE_CANDIDATE | Full coverage matrix pass |
| STAGING | Fallback-only acceptable |
| EVERGREEN | Full coverage matrix pass |

**Fail-closed:** If voice coverage check fails, daily manifest is not published.

---

## 8) Performance and size budgets

These checks prevent packs from degrading PWA startup and runtime.

### 8.1 Pack size limits (defaults)

* Protocol pack JSON: ≤ 250 KB
* Incident pack JSON: ≤ 500 KB
* Artifact pack JSON: ≤ 500 KB
* Voice pack JSON: ≤ 1.5 MB (or split into multiple voice packs)

### 8.2 Manifest load constraints

* Pack count per baseline manifest: target ≤ 8–12 packs
* Total baseline cached payload: target ≤ 5–8 MB (excluding optional cosmetics)

### 8.3 Generator complexity

Incident assembly must complete within:

* 5–20 ms per incident on mid-tier mobile hardware (target; adjust as measured)
  No dynamic LLM calls in assembly.

---

## 9) Validation tooling and CI integration

### 9.1 Pack validator CLI (required)

A deterministic CLI tool (language flexible; TS preferred for parity with PWA) that:

* validates Stage A and B
* runs Stage C simulation suite
* emits a machine-readable report JSON + human summary

### 9.2 CI gates

* Pull request: Stage A + Stage B required
* Pre-release: Stage C required for stable channel
* Daily publication pipeline: Stage C required for that day’s assembled incidents

### 9.3 Golden fixtures

Maintain a repository of:

* Pack Sets
* Seeds
* Expected solvability metrics bands
  Used to detect regressions (e.g., a change causes Boss win rate to drop by 50%).

---

## 10) Publishing policy (fail-closed)

A pack version can only be included in:

* **stable manifest** if it passes Stage A/B/C and budgets
* **beta manifest** if it passes Stage A/B (Stage C recommended)

A DailySpec can only be published if:

* bound Pack Set passes Stage B
* assembled daily ladder passes Stage C thresholds

---

## 11) Acceptance criteria (v1)

1. Any invalid JSON/schema/reference blocks publication.
2. Every Daily Featured ladder passes solvability thresholds and dead-hand constraints.
3. Degeneracy checks run and produce actionable flags (even if not always blocking).
4. Validator output is deterministic (same inputs → same report).
5. Pack size budgets enforced for stable channel.

---

## 12) Open parameters (to tune after first playtests)

* Solvability thresholds per act (win_rate targets)
* Audit pacing bands
* Dominance thresholds (70%/60% defaults)
* Pack size budgets based on real device performance

---

## 13) Featured Daily Readiness Checks (DAILY_READINESS)

A new validation tier specifically for weekly schedule publication.

### 13.1 Required checks (deterministic)

All checks must pass before a daily_manifest can be published:

* **Solvability:** at least one viable line exists for each act given the offered pools and constraints.
* **Dominance heuristic:** no single solution family accounts for > X% of simulated wins.
* **Dead-hand heuristic:** probability of "no viable payload" at turn 1-2 < Y%.
* **Time band:** median simulated turns within target band per act.
* **Audit pacing:** audit trigger rate within acceptable range.

### 13.2 Thresholds (v1 defaults)

| Metric | ACT1 | ACT2 | BOSS |
|--------|------|------|------|
| Win-rate target band | 60-85% | 40-70% | 25-55% |
| Dead-hand rate | < 8% | < 8% | < 8% |
| Dominance (top family) | < 55% | < 55% | < 55% |
| Audit trigger rate | 10-30% | 20-45% | 35-65% |

### 13.3 Output artifact

Validation produces a `readiness_report.json` with pass/fail and the above metrics:

```json
{
  "v": 1,
  "daily_id": "2026-02-02",
  "daily_manifest_id": "daily-2026-02-02.v1",
  "validated_at": "2026-01-25T12:00:00Z",
  "overall": "PASS|FAIL",
  "acts": {
    "ACT1": {
      "pass": true,
      "win_rate": 0.72,
      "dead_hand_rate": 0.03,
      "dominance_top_family": 0.42,
      "audit_trigger_rate": 0.18
    },
    "ACT2": {
      "pass": true,
      "win_rate": 0.55,
      "dead_hand_rate": 0.05,
      "dominance_top_family": 0.48,
      "audit_trigger_rate": 0.32
    },
    "BOSS": {
      "pass": true,
      "win_rate": 0.38,
      "dead_hand_rate": 0.06,
      "dominance_top_family": 0.51,
      "audit_trigger_rate": 0.48
    }
  },
  "failures": []
}
```

### 13.4 Fail-closed rule

If any act fails any threshold:

* The daily_manifest is **not published**.
* The weekly schedule generation **halts** until all 7 days pass.
* Failure reasons are logged for content team triage.

---
