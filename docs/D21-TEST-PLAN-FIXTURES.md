# D21 — TEST PLAN & FIXTURES v2

**Status:** Draft v2.0 (Ship-blocking)
**Owner:** Engineering (QA + Core Runtime)
**Last Updated:** 2026-01-26
**Purpose:** Define the comprehensive test strategy for Home Smart Home, including deterministic resolver tests, D31 mechanics tests (contradiction, counter-evidence, refutation, corroboration), pack validation tests, event log replay integrity, golden fixtures, and CI gates.

**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md is the source of truth for core mechanics.

---

## 0) Test strategy principles

1. **Determinism is a feature:** every mechanical outcome must be reproducible given (puzzle + seed + event stream).
2. **D31 mechanics coverage:** contradiction detection, counter-evidence, refutation, corroboration must be tested.
3. **Fail-closed is testable:** invalid events/packs must be rejected by construction.
4. **Golden fixtures are canonical truth:** we maintain a corpus that must replay identically.
5. **Pre-generated content:** all dialogue is pre-computed; no runtime LLM testing needed.

---

## 1) Test taxonomy

### 1.1 Unit tests (pure, fast)

Targets:
* Canonical JSON encoding
* Hashing and chain hashing
* **Contradiction detection** (D31)
* **Corroboration detection** (D31)
* **Counter-evidence targeting** (D31)
* **Damage calculation** (base + contested + corroboration)
* **Concern fulfillment** logic
* Pack schema validation

Expected runtime: < 5s total in CI.

### 1.2 Component tests (client logic)

Targets:
* RunController start/resume/end
* TurnController sequencing
* IndexedDB repositories (mocked)
* PackLoader + ManifestResolver

Expected runtime: < 30s in CI.

### 1.3 Integration tests (end-to-end)

Targets:
* Daily puzzle flow: load → play turns → win/loss
* Offline resume mid-run
* Share proof generation

Expected runtime: < 2 min in CI.

### 1.4 Content QA tests (pack validation)

Targets:
* D31 solvability checks
* Contradiction consistency
* Testimony coverage (41 combinations)

Expected runtime: variable; run nightly.

---

## 2) D31 Fixture Categories (New)

### 2.1 Contradiction Detection Fixtures

Test time-gap severity classification:

```json
{
  "fixture_v": 2,
  "name": "contradiction_minor_time_gap",
  "category": "CONTRADICTION",
  "inputs": {
    "committed_story": [
      { "card_id": "evidence.core.SLEEP_TRACKER", "claims": { "state": "ASLEEP", "timeRange": ["2:00am", "2:30am"] } }
    ],
    "new_card": {
      "card_id": "evidence.core.SMART_WATCH",
      "claims": { "state": "AWAKE", "timeRange": ["2:08am", "2:15am"] }
    }
  },
  "expected": {
    "severity": "MINOR",
    "explanation": "ASLEEP @ 2:00am → AWAKE @ 2:08am (8-minute gap)",
    "scrutiny_cost": 1
  }
}
```

**Test cases:**
* 0-5 minute gap → MAJOR (impossible)
* 5-15 minute gap → MINOR (suspicious)
* 15+ minute gap → NONE (acceptable)
* Same location, different state → severity rules
* Different locations, overlapping times → MAJOR

### 2.2 Counter-Evidence Fixtures

Test counter targeting and contested state:

```json
{
  "fixture_v": 2,
  "name": "counter_evidence_contested",
  "category": "COUNTER_EVIDENCE",
  "inputs": {
    "submission": [
      { "card_id": "evidence.core.FACE_ID", "proves": ["IDENTITY"], "power": 12 }
    ],
    "active_counters": [
      { "counter_id": "counter.visual.SECURITY_CAMERA", "targets": ["IDENTITY"] }
    ]
  },
  "expected": {
    "counter_triggered": "counter.visual.SECURITY_CAMERA",
    "contested_cards": ["evidence.core.FACE_ID"],
    "damage_multiplier": 0.5,
    "effective_damage": 6
  }
}
```

### 2.3 Refutation Fixtures

Test counter nullification and damage restoration:

```json
{
  "fixture_v": 2,
  "name": "refutation_restores_damage",
  "category": "REFUTATION",
  "inputs": {
    "previous_contested": {
      "counter_id": "counter.visual.SECURITY_CAMERA",
      "contested_cards": ["evidence.core.FACE_ID"],
      "lost_damage": 6
    },
    "refutation_card": {
      "card_id": "refutation.core.MAINTENANCE_LOG",
      "refutes": ["counter.visual.SECURITY_CAMERA"]
    }
  },
  "expected": {
    "counter_status": "SPENT",
    "damage_restored": 6,
    "koa_mood": "GRUDGING"
  }
}
```

### 2.4 Corroboration Fixtures

Test claim matching bonus:

```json
{
  "fixture_v": 2,
  "name": "corroboration_same_location",
  "category": "CORROBORATION",
  "inputs": {
    "submission": [
      { "card_id": "evidence.core.FACE_ID", "claims": { "location": "KITCHEN" }, "power": 12 },
      { "card_id": "evidence.core.VOICE_LOG", "claims": { "location": "KITCHEN" }, "power": 8 }
    ]
  },
  "expected": {
    "corroboration_triggered": true,
    "shared_claims": ["KITCHEN"],
    "bonus_multiplier": 1.25,
    "base_damage": 20,
    "final_damage": 25
  }
}
```

### 2.5 Concern Fulfillment Fixtures

Test proof type satisfaction:

```json
{
  "fixture_v": 2,
  "name": "concern_alertness_requires_state",
  "category": "CONCERN",
  "inputs": {
    "concern": {
      "concern_id": "concern.core.ALERTNESS",
      "requiredProof": ["ALERTNESS"],
      "stateRequirement": ["AWAKE", "ALERT", "ACTIVE"]
    },
    "submission": [
      { "card_id": "evidence.core.SLEEP_TRACKER", "proves": ["ALERTNESS"], "claims": { "state": "ASLEEP" } }
    ]
  },
  "expected": {
    "concern_addressed": false,
    "reason": "Card proves ALERTNESS but claims ASLEEP, which does not satisfy stateRequirement"
  }
}
```

### 2.6 Power Damage Fixtures

Test damage formula:

```json
{
  "fixture_v": 2,
  "name": "damage_full_formula",
  "category": "DAMAGE",
  "inputs": {
    "submission": [
      { "card_id": "card_a", "power": 10 },
      { "card_id": "card_b", "power": 8 }
    ],
    "contested_cards": ["card_a"],
    "corroboration": true
  },
  "expected": {
    "base_power": 18,
    "contested_penalty": -5,
    "corroboration_bonus": 3,
    "final_damage": 16
  }
}
```

---

## 3) Golden Fixture Format (D31)

### 3.1 Full puzzle replay fixture

```json
{
  "fixture_v": 2,
  "name": "daily_puzzle_win_path",
  "category": "REPLAY",
  "puzzle_binding": {
    "puzzle_id": "puzzle.test.001",
    "puzzle_hash": "sha256:abc..."
  },
  "dealt_hand": [
    { "card_id": "evidence.core.FACE_ID", "power": 12 },
    { "card_id": "evidence.core.SMART_WATCH", "power": 10 },
    { "card_id": "evidence.core.VOICE_LOG", "power": 8 },
    { "card_id": "refutation.core.MAINTENANCE_LOG", "power": 5 },
    { "card_id": "refutation.core.NOISE_COMPLAINT", "power": 5 },
    { "card_id": "evidence.core.RECEIPT", "power": 6 }
  ],
  "action_script": [
    { "turn": 1, "submit": ["evidence.core.FACE_ID", "evidence.core.VOICE_LOG"] },
    { "turn": 2, "submit": ["refutation.core.MAINTENANCE_LOG"] },
    { "turn": 3, "submit": ["evidence.core.SMART_WATCH"] },
    { "turn": 4, "submit": ["evidence.core.RECEIPT"] }
  ],
  "expected_outcome": "WIN",
  "expected_final_state": {
    "resistance": 0,
    "concerns_addressed": ["IDENTITY", "ALERTNESS", "INTENT"],
    "scrutiny": 1,
    "counters_spent": ["counter.visual.SECURITY_CAMERA"]
  }
}
```

---

## 4) Unit test specs (D31 mechanics)

### 4.1 Contradiction detection

**Goal:** Consistent severity classification.

Tests:
* Time gap → severity mapping
* Location conflict detection
* State transition validation
* Activity impossibility detection

Assertions:
* Known test vectors produce expected severity
* Edge cases (exactly 5 min, exactly 15 min) are deterministic

### 4.2 Corroboration detection

**Goal:** Accurate claim matching.

Tests:
* Same location → triggers corroboration
* Same state → triggers corroboration
* Multiple shared claims → single bonus (not stacking)
* No shared claims → no bonus

### 4.3 Counter-evidence targeting

**Goal:** Correct counter selection.

Tests:
* Counter targets ProofType, not specific card
* First applicable counter triggers
* Spent counters do not trigger again
* Refutation nullifies correct counter

### 4.4 Damage calculation

**Goal:** Correct formula application.

Formula: `final = round(base × contested × corroboration)`

Tests:
* Base case: no contest, no corroboration
* Contested only: 50% penalty
* Corroboration only: 25% bonus
* Both: penalties and bonuses combine
* Rounding rules

---

## 5) Integration test specs

### 5.1 Daily puzzle win path

Given:
* Puzzle pack + voice pack
* Scripted action plan

Test:
* Run completes in expected turns
* Produces WIN result
* All concerns addressed
* Resistance reaches 0

### 5.2 Contradiction blocking

Flow:
* Select cards that would cause MAJOR contradiction
* Press SUBMIT
* Verify SUBMISSION_BLOCKED event
* Verify UI shows error modal

### 5.3 Scrutiny loss

Flow:
* Accumulate MINOR contradictions
* Reach scrutiny 5
* Verify instant loss (no audit phase)
* Verify RUN_ENDED with reason SCRUTINY_MAX

### 5.4 Counter and refutation flow

Flow:
* Submit evidence that triggers counter
* Verify COUNTER_EVIDENCE_PLAYED event
* Verify damage is contested (50%)
* Submit refutation card
* Verify COUNTER_EVIDENCE_REFUTED event
* Verify damage restored

---

## 6) Pack validation tests

### 6.1 Schema validation

For each pack type:
* Must validate against JSON schema (D09 v2)
* Must include required D31 fields

Test corpus:
* `good_packs/` - valid D31 packs
* `bad_packs/` - missing fields, invalid enums

### 6.2 Solvability checks

For each test puzzle:
* Enumerate winning paths
* Verify at least 2 exist
* Verify no forced MAJOR contradictions
* Verify win-rate within target band

### 6.3 Testimony coverage

For each puzzle:
* Verify all 41 combinations have pre-generated content
* Verify KOA responses have valid mood values
* Verify no banned vocabulary

---

## 7) Removed Fixtures (Daily Mode)

The following v1 fixture categories are **removed** for Daily mode:

* Draft RNG fixtures (no draft)
* Multi-incident run fixtures (single puzzle)
* Audit trigger fixtures (scrutiny 5 = instant loss)
* Shop/reward fixtures (no shop)
* Tool effect fixtures (no tools in Daily)

These remain valid for Freeplay mode testing.

---

## 8) CI gating policy

### Required on every PR

* Unit tests (contradiction, corroboration, counter, damage)
* Component tests
* Schema validation
* Deterministic replay fixtures (small set)

### Required nightly

* Full D31 fixture suite
* Pack solvability suite
* Voice coverage sweep

### Required before publishing Daily

* Puzzle passes solvability
* All 41 combinations have content
* Win-rate within target band

---

## 9) Acceptance criteria (v2)

1. D31 unit tests cover: contradiction, corroboration, counter-evidence, refutation, damage.
2. At least 30 D31 golden fixtures exist and pass.
3. Pack validator can reject invalid D31 packs.
4. Solvability suite confirms all concerns addressable with dealt hand.
5. Offline resume integration test passes.
6. Scrutiny 5 instant loss behavior verified.
7. No draft RNG fixtures in Daily test suite.
