# D21 — TEST PLAN & FIXTURES.md

**Status:** Draft v1.0 (Ship-blocking)
**Owner:** Engineering (QA + Core Runtime)
**Last Updated:** 2026-01-25
**Purpose:** Define the comprehensive test strategy for Life with AURA, including deterministic resolver tests, gate/counter-path correctness tests, pack validation tests, event log replay integrity, golden fixtures, regression harness, and CI gates. This doc is written to support a real engineering implementation with high confidence in determinism and “fairness physics.”

---

## 0) Test strategy principles

1. **Determinism is a feature:** every mechanical outcome must be reproducible given (manifest + seed + event stream).
2. **Pack-first content means pack-first QA:** all packs must pass schema + solvability + dominance heuristics before release.
3. **Fail-closed is testable:** invalid events/packs must be rejected by construction, not “handled gracefully.”
4. **Golden fixtures are canonical truth:** we maintain a corpus of fixtures that must replay identically across client versions.
5. **Latency independence:** gameplay should not block on voice/LLM; tests ensure mechanics resolve without voice.

---

## 1) Test taxonomy

### 1.1 Unit tests (pure, fast)

Targets:

* Canonical JSON encoding
* Hashing and chain hashing
* PRNG determinism
* Gate evaluation and counter-path selection
* Move resolution math (deltas and status effects)
* Pack schema validation

Expected runtime: < 2s total in CI.

### 1.2 Component tests (client logic)

Targets:

* RunController start/resume/end
* TurnController sequencing and phase legality
* IndexedDB repositories (mocked or in-memory)
* PackLoader + ManifestResolver (mock fetch)

Expected runtime: < 30s in CI.

### 1.3 Integration tests (end-to-end, deterministic)

Targets:

* “3-incident run” flow: start → draft → play turns → audit → shop → boss → win/loss
* Offline resume mid-run (snapshot + events)
* Daily bundle load + play offline
* Share proof generation (Tier 1 hash chain if enabled)

Expected runtime: < 2–4 min in CI.

### 1.4 Content QA tests (pack validation suite)

Targets:

* Solvability checks for each incident template variant
* Anti-dominance heuristics across a batch of generated incidents
* Voice pack coverage checks for OutcomeKeys produced by a run corpus

Expected runtime: variable; run nightly + pre-release.

### 1.5 Non-functional tests

Targets:

* Performance budgets (commit-to-update < 120ms)
* Storage pressure + eviction safety
* Service worker caching correctness
* Accessibility checks (reduce motion, contrast)

---

## 2) Test environments

### 2.1 Local dev

* Node + Vitest/Jest for unit/component tests
* Playwright/Cypress for integration UI tests
* Optional “fixture runner” CLI for deterministic replays

### 2.2 CI

* Run all unit + component tests on every commit
* Run integration tests on PR merge and nightly
* Run pack validation suite nightly and before “daily” publish

### 2.3 Reference devices (manual smoke)

* One mid-tier Android device (Chrome)
* One iOS Safari (if you wrap later; in PWA v1, at least Safari desktop)
* One low-memory device simulation (throttled)

---

## 3) Deterministic test fixtures (the core asset)

### 3.1 Fixture types

1. **Resolver fixtures**: input state + action → expected `MOVE_RESOLVED`
2. **Replay fixtures**: manifest + event stream → expected final derived state
3. **Run fixtures**: manifest + seed → generated incident + deterministic “scripted player” action sequence → expected win/loss
4. **Pack fixtures**: known-good packs + known-bad packs for validator tests
5. **Voice coverage fixtures**: OutcomeKeys produced in run corpus → must exist in voice packs (with fallback rules)

### 3.2 Fixture format

All fixtures are stored as canonical JSON with a small metadata header:

```json
{
  "fixture_v": 1,
  "name": "act1_no_self_report_basic_pass",
  "manifest": { "manifest_id": "...", "pack_hashes": ["sha256:..."] },
  "seed": "12345",
  "inputs": { },
  "expected": { }
}
```

**Rules**

* Fixtures must pin pack hashes to avoid drift.
* Fixtures must avoid client timestamps affecting logic.
* When pack evolution occurs, fixtures are either:

  * migrated to new pack versions intentionally (and renamed), or
  * preserved for backward compatibility if you support old packs.

### 3.3 Python oracle integration (optional CI)

During the TypeScript port, validate determinism by running both engines:

1. Python kernel produces: `{event_stream, final_state_hash, chain_head}`
2. TS engine replays same `{manifest, seed, action_script}`
3. Compare outputs - must be identical

**CI job (until port stable):**

* Run Python oracle vs TS engine on all golden fixtures
* Fail build if any hash mismatch
* Once TS is stable, Python can be retired or kept as regression oracle

### 3.4 Golden fixture format (enhanced for cross-engine validation)

```json
{
  "fixture_v": 1,
  "name": "act1_basic_win",
  "manifest_binding": {
    "manifest_id": "test-manifest-v1",
    "pack_hashes": ["sha256:abc...", "sha256:def..."]
  },
  "seed": "12345",
  "action_script": [
    { "turn": 1, "action": "INJECT", "gate": "NO_SELF_REPORT", "payload": ["card_a"] },
    { "turn": 2, "action": "REWIRE", "tool": "METADATA_SCRAPER", "target": "card_b" }
  ],
  "expected_event_chain_hash": "sha256:abc123...",
  "expected_final_state_hash": "sha256:def456...",
  "expected_outcome": "WIN"
}
```

**Cross-engine test command:**

```bash
# Run Python oracle
python tools/py-kernel/run_fixture.py fixtures/act1_basic_win.json > py_output.json

# Run TS engine
npx ts-node tools/pack-cli/run_fixture.ts fixtures/act1_basic_win.json > ts_output.json

# Compare
diff py_output.json ts_output.json  # Must be empty
```

---

## 4) Unit test specs (pure domain)

## 4.1 Canonical JSON encoding

**Goal:** identical encoding across runtimes.

Tests:

* Key ordering stable across nested objects
* Number formatting stable (`1`, `1.0`, `1e0` behavior pinned)
* Arrays preserved order
* Unicode normalization behavior explicitly chosen (recommend: no normalization, raw UTF-8)

Assertions:

* Canonical encoder output matches a reference byte string for fixed inputs.

## 4.2 Hashing & chain hashing (Tier 1)

Tests:

* `event_hash = sha256(canonical_event_bytes)`
* `chain_hash_i = sha256(chain_hash_{i-1} || event_hash_i)`
* Domain separator constant is applied (`AURA_CHAIN_V1`)

Assertions:

* Known test vectors (hard-coded inputs → expected hashes)

## 4.3 PRNG determinism

If you use a PRNG stream:

* Given `(seed, stream_id)` produce deterministic sequence
* Cross-platform identical output

Assertions:

* First N outputs match known vectors

## 4.4 Gate evaluation & counter-path selection

**Goal:** same state/action always selects same counter path.

Tests:

* For each gate, build minimal payloads satisfying each counter path.
* Verify:

  * correct path is selected
  * failure occurs when missing required trait/tag
  * deltas are correct
  * scrutiny adjustments are correct

Example (NO_SELF_REPORT):

* Path A: Verified + Sensor passes
* Path C: Plausible + Purchase + Timestamped + Tool: Corroborate passes
* Sketchy + Purchase fails and increases scrutiny

## 4.5 Move resolution math

For each move (INJECT, FLAG, REWIRE, CORROBORATE, CYCLE, EXPLOIT):

* validate:

  * legality (blocked by modifiers)
  * token costs
  * status effects
  * delta bounds (no negative strength, etc.)

Edge cases:

* GateStrength already 0 (should end incident)
* Scrutiny maxed (audit trigger)
* Rate limit modifier prevents repeating archetype

---

## 5) Component test specs (application layer)

## 5.1 RunController

Tests:

* `startFreePlay()` creates RUN_STARTED, binds manifest, initializes incident
* `startDaily(dailyId)` fails if daily bundle missing required packs
* `resume(runId)` reconstructs state from snapshot+events and continues
* `endRun()` appends RUN_ENDED and writes archive entry

Failure tests:

* pack missing → run marked invalid
* event seq gap → invalid
* hash chain mismatch (Tier 1) → invalid / unverified

## 5.2 TurnController sequencing

Tests:

* Enforces phase legality:

  * MOVE_RESOLVED cannot appear before ACTION_SUBMITTED
  * DRAFT_PICKED only when DRAFT_OFFERED active
* Rejects illegal action with ACTION_REJECTED
* Audit events trigger at correct thresholds

---

## 6) Integration tests (end-to-end)

### 6.1 Golden daily run

Given:

* daily manifest + packs
* fixed seed
* scripted action plan (deterministic “bot”)

Test:

* run completes in expected turns
* produces expected win/loss
* event chain head equals fixture value (Tier 1)

### 6.2 Offline resume

Flow:

* start run
* take 2 turns
* force “app reload”
* resume from snapshot+events
* continue to completion

Assertions:

* derived state matches “no reload” baseline
* transcript rebuilds without changing mechanics

### 6.3 Pack update safety

Flow:

* start run bound to manifest A
* install new pack versions B in background
* continue run

Assertions:

* run continues using manifest A content
* no mutation of gate rules mid-run
* new packs only apply to new runs

---

## 7) Pack validation tests (content QA suite)

### 7.1 Schema validation

For each pack:

* Must validate against JSON schema (D09)
* Must include required fields, version, pack_id, etc.

Test corpus:

* `good_packs/`
* `bad_packs/` (missing fields, wrong enums, invalid counter paths)

### 7.2 Solvability checks (mandatory)

For each incident template:

* Generate N assembled incidents with different seeds (recommend N=200 for core packs)
* Run a deterministic solver or heuristic:

  * Ensure at least one viable line exists given offered draft packs and turn limits

Output:

* `solvability_report.json` with:

  * fail cases + minimal reproduction (seed, incident_id, gate combo)

### 7.3 Anti-dominance heuristics

Goal: no single archetype or counter path solves everything.

Heuristics:

* For a batch of assembled incidents:

  * track win rate by archetype family (Sensor, Policy, Purchase, Media)
  * flag if one family accounts for > X% of wins (recommend X=60% for v1)
* Track gate-path frequency:

  * flag if one counter path is selected > Y% for a gate across incidents (recommend Y=80%)

### 7.4 Pacing checks

* Audit frequency should be in a target band:

  * Act 1: audits in < 25% of runs
  * Act 2: < 40%
  * Boss: < 55%
    (Adjust after telemetry.)

### 7.5 Voice pack coverage

Given an OutcomeKey corpus (from golden run fixtures):

* Ensure voice selection always finds:

  * specific bark, or
  * tiered fallback bark (per D12)
* Ensure there is no “missing bark” crash.

---

## 8) Regression harness (“Replay Runner”)

### 8.1 CLI tool (recommended)

A small tool to:

* load `manifest + packs` from local fixtures
* load `event_stream.json`
* replay
* output final derived state hash + chain head
* compare against expected

Outputs:

* `PASS/FAIL`
* diffs:

  * first divergent seq
  * state diff at divergence
  * gate/counter mismatch

### 8.2 Golden state hash

Define a “derived state hash”:

* `state_hash = sha256(canonical_json(derived_state_subset))`
  Where subset excludes:
* UI-only fields
* timestamps
* voice lines

This makes regression diffs faster.

---

## 9) Performance test hooks

### 9.1 Commit latency

Instrument:

* time from “INJECT tap” to HUD delta render

Budget:

* p95 < 120ms on mid-tier device

Test:

* synthetic run with 50 turns; compute p95.

### 9.2 Storage

Test:

* simulate pack cache size growth
* ensure eviction does not delete packs referenced by active run manifests

---

## 10) CI gating policy

### Required on every PR

* unit tests
* component tests
* deterministic replay fixtures (small set)
* lint + typecheck

### Required nightly

* full integration suite
* pack validation suite (solvability/dominance/pacing)
* voice coverage sweep

### Required before publishing Daily manifests

* pack validation suite passes on the exact manifest pack hashes
* golden daily run fixture passes
* voice coverage for today’s daily seed passes

---

## 11) Weekly schedule fixtures (authoring support)

### 11.1 Golden weekly fixtures

Maintain a corpus of validated weekly schedules:

```
fixtures/
  weekly/
    week-2026-02-02/
      daily_schedule.json
      daily-2026-02-02.v1.json
      ...
      readiness_report.json
      packs/
        protocol.core@1.0.0.json
        ...
```

### 11.2 Regression requirements

* `simulate-week` output must match readiness report bands
* If metrics drift > 10% from baseline, fail CI with diff report
* New pack versions must not break existing weekly fixture replays

### 11.3 Fixture update policy

* When pack schemas change, fixtures are migrated or versioned
* Old fixtures preserved for backward compatibility testing
* New fixtures added for new content (not replacing old)

---

## 12) Acceptance criteria (v1)

1. Domain unit tests cover:

   * canonical JSON, hashing, PRNG, gate evaluation, moves
2. At least 20 golden replay fixtures exist and pass.
3. Pack validator can reject invalid packs and certify official packs.
4. Solvability suite flags unsolvable incidents with reproducible seeds.
5. Offline resume integration test passes reliably.
6. Daily run can be marked verifiable (Tier 1) with chain head hash.
7. Weekly schedule fixtures exist and pass regression checks.
8. CLI tools (`validate-packs`, `build-weekly-schedule`, `simulate-week`) are tested.
