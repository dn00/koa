# D10 — PACK VALIDATION & SOLVABILITY CHECKS v2

**Status:** Draft v2.0
**Owner:** Content Platform / Runtime QA
**Last Updated:** 2026-01-26
**Purpose:** Define the deterministic validation and testing harness that ensures packs are safe, playable, balanced, and performant. This doc specifies **fail-closed** rules, **static schema validation**, **D31 solvability checks**, and **contradiction validation** for the fixed-hand model.

**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md is the source of truth for core mechanics.

---

## 1) Goals

1. **Fail-closed correctness:** invalid packs never load; invalid puzzles never ship.
2. **Solvable content:** every Daily puzzle must be solvable with the dealt hand.
3. **Non-degenerate balance:** avoid dominant paths and unwinnable trap states.
4. **Contradiction safety:** no forced MAJOR contradictions in winning paths.
5. **Performance budgets:** pack sizes keep PWA load fast.
6. **Deterministic reproducibility:** validation results must be reproducible.

---

## 2) Non-goals

* Anti-cheat / adversarial security (defer until competitive)
* Multiplayer synchronization (defer)
* Full formal verification (heuristics + simulation sufficient for v1)

---

## 3) Validation stages (pipeline)

### Stage A — Static pack validation (single pack)

* JSON parse, schema conformance
* Local invariants (ranges, required fields, uniqueness)

### Stage B — Pack Set validation (cross-pack)

* Reference resolution across packs
* ID collision detection
* Capability compatibility checks

### Stage C — D31 solvability validation

* Fixed-hand solvability (dealt 6 cards)
* Contradiction analysis
* Multiple winning path requirement
* Win-rate estimation

### Stage D — Publishing gate

* Compute sha256 for each pack
* Record validation report
* Only then allow manifest update

**Fail-closed rule:** any failure blocks publication.

---

## 4) D31 Solvability Checks (New)

### 4.1 Fixed-Hand Solvability

For a 6-card dealt hand, validate:

**S1. All concerns addressable:**
```
For each concern in puzzle.concerns:
  At least one card in dealt_hand proves concern.requiredProof
  If concern.stateRequirement exists:
    At least one card claims a matching state
```

**S2. Sufficient damage potential:**
```
total_power = sum(card.power for card in dealt_hand)
required = puzzle.resistance + 10  // comfortable margin
PASS if total_power >= required
```

**S3. Multiple winning paths (at least 2):**
```
winning_paths = []
For each possible turn sequence:
  If leads to (resistance ≤ 0 AND all concerns addressed):
    Add to winning_paths
PASS if len(winning_paths) >= 2
```

**S4. Trap card limit:**
```
trap_cards = cards that force MAJOR contradiction if played
PASS if len(trap_cards) <= 1
```

**S5. Refutation availability:**
```
For each counter in puzzle.counterEvidence:
  At least one card in dealt_hand refutes this counter
  OR puzzle is winnable despite contested penalty
```

### 4.2 Contradiction Validation

**C1. No forced MAJOR contradictions in winning path:**
```
For each winning path:
  Simulate submissions in order
  Track committed_story claims
  FAIL if any required submission causes MAJOR contradiction
```

**C2. MINOR contradiction budget:**
```
For optimal winning path:
  total_scrutiny = sum(MINOR contradiction costs)
  PASS if total_scrutiny <= 3  // leaves buffer before loss at 5
```

**C3. Contradiction detection consistency:**
```
For each card pair in dealt_hand:
  contradiction_result = detectContradiction(card_a, card_b)
  PASS if result matches expected severity
```

### 4.3 Solvability Thresholds (D31)

| Difficulty | Win Rate Target | Max MINOR | Trap Cards |
|------------|-----------------|-----------|------------|
| Tutorial | 90%+ | 0 | 0 |
| Easy | 80%+ | 1 | 0 |
| Normal | 65%+ | 2 | 1 |
| Hard | 45%+ | 3 | 1 |
| Expert | 30%+ | 4 | 1 |

---

## 5) Stage A — Static validation (per pack type)

### 5.1 Common envelope validation

Required:
* `pack_type`, `pack_id`, `version`, `schema_version`, `content`
* `pack_id` stable format
* `version` SemVer format
* `schema_version == "2.0"` for D31

### 5.2 Puzzle pack validation

* `puzzle_id` unique
* `resistance` > 0
* `turnBudget` >= 4
* `concerns[]` non-empty, valid concern_ids
* `counterEvidence[]` valid counter references
* `dealtHand[]` exactly 6 cards for Normal+ difficulty
* `preGeneratedTestimony.combinations[]` contains all 41 combinations

### 5.3 Evidence card validation

* `card_id` unique, valid prefix
* `power` in range 1-20
* `proves[]` contains valid ProofTypes
* `claims.timeRange` valid format
* At least one claim (location, state, or activity)

### 5.4 Voice pack validation

* Banned vocabulary enforcement (no courtroom terms)
* Bark line length constraints
* Valid mood state references (8 states per D31)
* Fallback config valid

---

## 6) Stage B — Pack Set validation (cross-pack)

### 6.1 ID collision detection

Ensure global uniqueness across Pack Set:
* `concern_id`, `counter_id`
* `evidence_id`, `refutation_id`
* `puzzle_id`
* `voice_id`

### 6.2 Reference resolution checks

* Puzzle `concerns[].concern_id` exists in evidence pack
* Puzzle `counterEvidence[].counter_id` exists
* Counter `refutableBy[]` references valid refutation cards
* Evidence `proves[]` contains valid ProofTypes

### 6.3 Testimony coverage checks

* All 41 combinations have pre-generated content
* Each combination has valid `mechanics` block
* KOA responses have valid `mood` values

---

## 7) Stage C — Dynamic validation (D31)

### 7.1 Simulation harness

For each puzzle:
1. Load dealt hand
2. Enumerate all possible submission sequences
3. Track game state per sequence
4. Identify winning and losing paths
5. Calculate metrics

### 7.2 Player policy models (automated)

For win-rate estimation:

1. **Optimal**: Best possible play (BFS/DFS search)
2. **Greedy-Damage**: Maximize immediate damage
3. **Concern-First**: Address concerns first, then damage
4. **Counter-Aware**: Avoid triggering counters when possible
5. **Random-Legal**: Random among legal submissions

### 7.3 Validation metrics

```json
{
  "puzzle_id": "puzzle.daily.2026_01_26",
  "solvable": true,
  "winning_paths": 4,
  "optimal_turns": 4,
  "min_scrutiny_path": 1,
  "trap_cards": ["evidence.core.GYM_WRISTBAND"],
  "forced_major_contradictions": 0,
  "win_rates": {
    "optimal": 1.0,
    "greedy_damage": 0.85,
    "concern_first": 0.78,
    "counter_aware": 0.92,
    "random_legal": 0.45
  }
}
```

---

## 8) Voice pack coverage checks

### 8.1 Coverage validation

For each puzzle's 41 combinations:
* Pre-generated dialogue exists
* KOA response has valid mood
* No banned vocabulary

### 8.2 Mood state coverage

Each of the 8 mood states should have:
* At least 3 generic barks
* Transition dialogue for common state changes

---

## 9) Performance and size budgets

### 9.1 Pack size limits

* Puzzle pack JSON: ≤ 300 KB (includes 41 combinations)
* Evidence pack JSON: ≤ 500 KB
* Voice pack JSON: ≤ 1 MB

### 9.2 Manifest constraints

* Pack count per manifest: ≤ 10
* Total cached payload: ≤ 5 MB

---

## 10) CI gating policy

### Required on every PR

* Stage A (schema validation)
* Stage B (cross-reference validation)

### Required nightly

* Stage C (full solvability suite)
* Voice coverage sweep

### Required before publishing Daily

* All stages pass
* Puzzle solvability confirmed
* Win-rate within target band for difficulty

---

## 11) Acceptance criteria (v2)

1. Any invalid JSON/schema/reference blocks publication.
2. Every Daily puzzle passes D31 solvability requirements.
3. No forced MAJOR contradictions in any winning path.
4. At least 2 distinct winning paths per puzzle.
5. Validator output is deterministic.
6. All 41 testimony combinations have pre-generated content.

---

## 12) Removed from Daily Mode (per D31)

The following v1 checks are **removed** for Daily mode:

* Draft pool solvability (no draft)
* Draft RNG distribution analysis
* Audit frequency checks (scrutiny 5 = instant loss)
* Multi-act difficulty progression (single puzzle)
* Shop/reward balance (no shop in Daily)

These remain valid for Freeplay mode validation.
