# Kernel Hardening Checklist + CI Gate Spec (Daily Kernel)

This formalizes “hardening” into **non-bypassable gates** for dev, CI, and release. It is written to align with your K-Daily architecture (event log + deterministic reducer + module registry + solver gates).

---

## 0) Hardening Objectives

1. **Determinism:** same inputs → same outputs (state hash, projections).
2. **Integrity:** tampering is detectable; state cannot be forged by clients.
3. **Safety:** fail closed; no partial application; bounded attack surface.
4. **Verifiability:** replay, regression, and property checks catch drift early.
5. **Operational resilience:** rollback, canary, and observability are real—not aspirational.

---

## 1) Canonicalization and Hashing (MUST)

### 1.1 Canonical JSON Spec (Normative)

Define a single canonical encoder used for:

* `event_hash`
* `state_hash`
* `pack_hash`

**Rules (minimum)**

* UTF-8, Unicode normalized (NFC)
* Stable key ordering (lexicographic)
* No floats in persisted state/events (use ints/decimals-as-strings)
* No NaN/Infinity
* No duplicate keys
* Arrays preserve order
* Explicit nulls where permitted; disallow implicit missing fields in canonical output

**CI gate**

* `GATE-CANON-01`: canonical encoder roundtrip test suite passes
* `GATE-CANON-02`: known fixtures encode to expected byte sequences

### 1.2 State Hash Contract

`state_hash = H(canonical(state_without_ephemeral_fields))`

Define “ephemeral fields” explicitly (e.g., server timestamps, transient caches) and ensure they’re excluded.

**CI gate**

* `GATE-HASH-01`: same state built via two codepaths yields identical `state_hash`
* `GATE-HASH-02`: no ephemeral fields affect hash (unit tests)

---

## 2) Event Integrity: Tamper-Evident Log (MUST)

### 2.1 Event Hash Chain

Each event stores:

* `prev_event_hash`
* `event_hash = H(prev_event_hash || canonical(event_payload))`
  Optionally:
* `post_state_hash`

**DB constraints**

* `event_seq` strictly increasing per `run_id`
* immutable events (no update/delete permissions for app role)

**CI gate**

* `GATE-ELOG-01`: migration verifies constraints exist
* `GATE-ELOG-02`: replay recomputes chain and matches stored hashes

---

## 3) Action Boundary Hardening (MUST)

### 3.1 Idempotency

Require `client_action_id` UUID on every action.

Server stores:

* `(run_id, player_id, client_action_id) -> event_seq_range + result_code`

Behavior:

* duplicate submission returns the original outcome (no new events).

**CI gate**

* `GATE-ACT-01`: idempotency test (double-submit produces identical results, no extra events)

### 3.2 Exactly-One Resolver Commit (Atomicity)

Resolution must be transactional:

* validate → resolve → append events → update snapshot pointer
* failure anywhere → no events appended

**CI gate**

* `GATE-ACT-02`: forced fault injection (throw mid-resolve) yields zero writes

### 3.3 Per-run Single Writer

All action resolution is serialized per run:

* DB advisory lock or redis lock
* lock held for the whole resolve transaction

**CI gate**

* `GATE-LOCK-01`: concurrent action test (10 parallel submits) yields deterministic ordering and consistent state

---

## 4) Module Capability Enforcement (MUST)

### 4.1 Compile-time allowlist

Pack compiler rejects any:

* widget type not in required modules
* condition type not in required modules
* action type not in required modules/core
* event types not registered

**CI gate**

* `GATE-MOD-01`: negative pack fixtures must fail with correct error codes

### 4.2 Runtime allowlist

Even if a bad pack slips through:

* resolver rejects unknown action types
* gate evaluator rejects unknown condition types
* projection fails safe (error projection) rather than leaking state

**CI gate**

* `GATE-MOD-02`: runtime rejection tests for unknown types

---

## 5) Visibility and Knowledge Hardening (MUST)

### 5.1 No hidden ID leakage

Projection must never include IDs of hidden objects/widgets.

**CI gate**

* `GATE-VIS-01`: snapshot with hidden entities → projection contains none of their IDs

### 5.2 Target validation

Every targeted action must validate:

* target exists
* target visible/perceived
* target in same room/sub-location if required

**CI gate**

* `GATE-VIS-02`: invalid target tests return stable reason codes

---

## 6) Solver and Softlock Gates (MUST for “Daily Eligible”)

### 6.1 Required gates for publishing

Pack cannot publish as daily unless:

* schema valid
* solver finds win path
* softlock detection passes
* text safety scan passes
* required modules’ solver encodings exist

**CI gate**

* `GATE-PUB-01`: publish pipeline simulation enforces gates (cannot bypass)

### 6.2 “No brute force” policy for code inputs

If a keypad/code exists:

* there must be a path to deduce it as a fact (or derive it from clues)
* attempts must be bounded without making puzzle unwinnable

**CI gate**

* `GATE-SOLVE-02`: brute-force detection test (fixture pack fails)

---

## 7) Fuzzing and Property Tests (SHOULD, but recommended as near-MUST)

### 7.1 Property-based invariant tests

Randomly generate:

* valid-ish states
* random action sequences
  Assert:
* invariants hold after each step
* no crashes
* determinism holds for same seed/inputs

**CI gate**

* `GATE-PROP-01`: run N=5k steps per module nightly; smaller N on PR

### 7.2 Adversarial input fuzzing

Fuzz:

* widget inputs (huge strings, unicode oddities)
* action params (wrong types)
* replay/resend patterns
* chat payloads (if enabled)

**CI gate**

* `GATE-FUZZ-01`: fuzz suite produces no panics and fails closed

---

## 8) Golden Transcript Regression (MUST)

Maintain a corpus of canonical runs:

* recorded action streams
* expected final `state_hash`
* expected key projection snapshots at certain event_seq

**CI gate**

* `GATE-GOLD-01`: all golden runs replay to exact hashes
* `GATE-GOLD-02`: projection snapshots match (or are versioned with intentional change)

---

## 9) Observability and Incident Hardening (MUST)

### 9.1 Structured logging

Log per action:

* `run_id`, `player_id`, `client_action_id`, `action_type`
* validation stage result
* latency (validate/resolve/projection)
* error code (if fail)

**CI gate**

* `GATE-OBS-01`: logs emitted with required fields (contract tests)

### 9.2 Metrics

Minimum:

* invalid action rate
* resolver error rate
* median/95p latency
* daily completion rate + stuck-step spikes
* narration budget usage (if premium)

**Release gate**

* `GATE-OPS-01`: dashboard checks exist and are wired

---

## 10) Security Controls (MVP MUST)

### 10.1 Rate limits

* per player per run
* per IP
* per widget attempts

**CI gate**

* `GATE-RATE-01`: rate limit tests for key endpoints

### 10.2 AuthZ checks

Every endpoint enforces:

* membership
* role
* run state (active/ended)

**CI gate**

* `GATE-AUTH-01`: cannot act on runs you’re not a member of

---

## 11) Release Process Gates

### 11.1 Canary + rollback

* ability to point manifest to fallback pack
* disable new runs for broken pack
* preserve existing runs if possible

**Release gate**

* `GATE-REL-01`: rollback drill in staging (must be practiced)

### 11.2 Migration safety

* migrations are reversible or safe-forward
* schema changes don’t break replay

**Release gate**

* `GATE-REL-02`: migration smoke + replay suite passes on migrated DB

---

## 12) Implementation Checklist (What to build next)

If you want to harden in the highest ROI order, implement:

1. Canonical encoder + fixtures
2. State hash contract + test
3. Event hash chain + DB immutability constraints
4. Per-run lock + transactional resolve
5. `client_action_id` idempotency store
6. Golden transcript runner in CI
7. Negative pack fixtures (capability enforcement)
8. Visibility leak tests
9. Solver publish gate in pipeline
10. Fuzz/property tests (start small, scale up)

---

## 13) “Hardening DoD” (Kernel)

Kernel is considered hardened enough to ship Daily MVP when:

* [ ] All **MUST** CI gates above are green on main
* [ ] Golden suite includes at least 10 canonical runs
* [ ] Pack publish pipeline cannot publish a pack that fails solver/softlock/safety checks
* [ ] Event log is tamper-evident (hash chain) and append-only enforced
* [ ] Run resolution is serialized and idempotent
* [ ] Projections never leak hidden IDs
* [ ] Rollback drill has been executed successfully

---

If you want the next doc, I recommend **K-Daily-18: Module Plugin Interfaces + Reference Implementations** because it’s where most hardening bugs surface (type registries, canonical schemas, and deterministic reducers).


---

# Kernel Hardening Checklist + CI Gate Spec (Daily Kernel)


This formalizes “hardening” into **non-bypassable gates** for dev, CI, and release. It is written to align with your K-Daily architecture (event log + deterministic reducer + module registry + solver gates).

---

## 0) Hardening Objectives

1. **Determinism:** same inputs → same outputs (state hash, projections).
2. **Integrity:** tampering is detectable; state cannot be forged by clients.
3. **Safety:** fail closed; no partial application; bounded attack surface.
4. **Verifiability:** replay, regression, and property checks catch drift early.
5. **Operational resilience:** rollback, canary, and observability are real—not aspirational.

---

## 1) Canonicalization and Hashing (MUST)

### 1.1 Canonical JSON Spec (Normative)

Define a single canonical encoder used for:

* `event_hash`
* `state_hash`
* `pack_hash`

**Rules (minimum)**

* UTF-8, Unicode normalized (NFC)
* Stable key ordering (lexicographic)
* No floats in persisted state/events (use ints/decimals-as-strings)
* No NaN/Infinity
* No duplicate keys
* Arrays preserve order
* Explicit nulls where permitted; disallow implicit missing fields in canonical output

**CI gate**

* `GATE-CANON-01`: canonical encoder roundtrip test suite passes
* `GATE-CANON-02`: known fixtures encode to expected byte sequences

### 1.2 State Hash Contract

`state_hash = H(canonical(state_without_ephemeral_fields))`

Define “ephemeral fields” explicitly (e.g., server timestamps, transient caches) and ensure they’re excluded.

**CI gate**

* `GATE-HASH-01`: same state built via two codepaths yields identical `state_hash`
* `GATE-HASH-02`: no ephemeral fields affect hash (unit tests)

---

## 2) Event Integrity: Tamper-Evident Log (MUST)

### 2.1 Event Hash Chain

Each event stores:

* `prev_event_hash`
* `event_hash = H(prev_event_hash || canonical(event_payload))`
  Optionally:
* `post_state_hash`

**DB constraints**

* `event_seq` strictly increasing per `run_id`
* immutable events (no update/delete permissions for app role)

**CI gate**

* `GATE-ELOG-01`: migration verifies constraints exist
* `GATE-ELOG-02`: replay recomputes chain and matches stored hashes

---

## 3) Action Boundary Hardening (MUST)

### 3.1 Idempotency

Require `client_action_id` UUID on every action.

Server stores:

* `(run_id, player_id, client_action_id) -> event_seq_range + result_code`

Behavior:

* duplicate submission returns the original outcome (no new events).

**CI gate**

* `GATE-ACT-01`: idempotency test (double-submit produces identical results, no extra events)

### 3.2 Exactly-One Resolver Commit (Atomicity)

Resolution must be transactional:

* validate → resolve → append events → update snapshot pointer
* failure anywhere → no events appended

**CI gate**

* `GATE-ACT-02`: forced fault injection (throw mid-resolve) yields zero writes

### 3.3 Per-run Single Writer

All action resolution is serialized per run:

* DB advisory lock or redis lock
* lock held for the whole resolve transaction

**CI gate**

* `GATE-LOCK-01`: concurrent action test (10 parallel submits) yields deterministic ordering and consistent state

---

## 4) Module Capability Enforcement (MUST)

### 4.1 Compile-time allowlist

Pack compiler rejects any:

* widget type not in required modules
* condition type not in required modules
* action type not in required modules/core
* event types not registered

**CI gate**

* `GATE-MOD-01`: negative pack fixtures must fail with correct error codes

### 4.2 Runtime allowlist

Even if a bad pack slips through:

* resolver rejects unknown action types
* gate evaluator rejects unknown condition types
* projection fails safe (error projection) rather than leaking state

**CI gate**

* `GATE-MOD-02`: runtime rejection tests for unknown types

---

## 5) Visibility and Knowledge Hardening (MUST)

### 5.1 No hidden ID leakage

Projection must never include IDs of hidden objects/widgets.

**CI gate**

* `GATE-VIS-01`: snapshot with hidden entities → projection contains none of their IDs

### 5.2 Target validation

Every targeted action must validate:

* target exists
* target visible/perceived
* target in same room/sub-location if required

**CI gate**

* `GATE-VIS-02`: invalid target tests return stable reason codes

---

## 6) Solver and Softlock Gates (MUST for “Daily Eligible”)

### 6.1 Required gates for publishing

Pack cannot publish as daily unless:

* schema valid
* solver finds win path
* softlock detection passes
* text safety scan passes
* required modules’ solver encodings exist

**CI gate**

* `GATE-PUB-01`: publish pipeline simulation enforces gates (cannot bypass)

### 6.2 “No brute force” policy for code inputs

If a keypad/code exists:

* there must be a path to deduce it as a fact (or derive it from clues)
* attempts must be bounded without making puzzle unwinnable

**CI gate**

* `GATE-SOLVE-02`: brute-force detection test (fixture pack fails)

---

## 7) Fuzzing and Property Tests (SHOULD, but recommended as near-MUST)

### 7.1 Property-based invariant tests

Randomly generate:

* valid-ish states
* random action sequences
  Assert:
* invariants hold after each step
* no crashes
* determinism holds for same seed/inputs

**CI gate**

* `GATE-PROP-01`: run N=5k steps per module nightly; smaller N on PR

### 7.2 Adversarial input fuzzing

Fuzz:

* widget inputs (huge strings, unicode oddities)
* action params (wrong types)
* replay/resend patterns
* chat payloads (if enabled)

**CI gate**

* `GATE-FUZZ-01`: fuzz suite produces no panics and fails closed

---

## 8) Golden Transcript Regression (MUST)

Maintain a corpus of canonical runs:

* recorded action streams
* expected final `state_hash`
* expected key projection snapshots at certain event_seq

**CI gate**

* `GATE-GOLD-01`: all golden runs replay to exact hashes
* `GATE-GOLD-02`: projection snapshots match (or are versioned with intentional change)

---

## 9) Observability and Incident Hardening (MUST)

### 9.1 Structured logging

Log per action:

* `run_id`, `player_id`, `client_action_id`, `action_type`
* validation stage result
* latency (validate/resolve/projection)
* error code (if fail)

**CI gate**

* `GATE-OBS-01`: logs emitted with required fields (contract tests)

### 9.2 Metrics

Minimum:

* invalid action rate
* resolver error rate
* median/95p latency
* daily completion rate + stuck-step spikes
* narration budget usage (if premium)

**Release gate**

* `GATE-OPS-01`: dashboard checks exist and are wired

---

## 10) Security Controls (MVP MUST)

### 10.1 Rate limits

* per player per run
* per IP
* per widget attempts

**CI gate**

* `GATE-RATE-01`: rate limit tests for key endpoints

### 10.2 AuthZ checks

Every endpoint enforces:

* membership
* role
* run state (active/ended)

**CI gate**

* `GATE-AUTH-01`: cannot act on runs you’re not a member of

---

## 11) Release Process Gates

### 11.1 Canary + rollback

* ability to point manifest to fallback pack
* disable new runs for broken pack
* preserve existing runs if possible

**Release gate**

* `GATE-REL-01`: rollback drill in staging (must be practiced)

### 11.2 Migration safety

* migrations are reversible or safe-forward
* schema changes don’t break replay

**Release gate**

* `GATE-REL-02`: migration smoke + replay suite passes on migrated DB

---

## 12) Implementation Checklist (What to build next)

If you want to harden in the highest ROI order, implement:

1. Canonical encoder + fixtures
2. State hash contract + test
3. Event hash chain + DB immutability constraints
4. Per-run lock + transactional resolve
5. `client_action_id` idempotency store
6. Golden transcript runner in CI
7. Negative pack fixtures (capability enforcement)
8. Visibility leak tests
9. Solver publish gate in pipeline
10. Fuzz/property tests (start small, scale up)

---

## 13) “Hardening DoD” (Kernel)

Kernel is considered hardened enough to ship Daily MVP when:

* [ ] All **MUST** CI gates above are green on main
* [ ] Golden suite includes at least 10 canonical runs
* [ ] Pack publish pipeline cannot publish a pack that fails solver/softlock/safety checks
* [ ] Event log is tamper-evident (hash chain) and append-only enforced
* [ ] Run resolution is serialized and idempotent
* [ ] Projections never leak hidden IDs
* [ ] Rollback drill has been executed successfully

---

If you want the next doc, I recommend **K-Daily-18: Module Plugin Interfaces + Reference Implementations** because it’s where most hardening bugs surface (type registries, canonical schemas, and deterministic reducers).
