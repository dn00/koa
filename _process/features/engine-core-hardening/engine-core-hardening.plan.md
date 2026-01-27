# Plan: Engine-Core Hardening

**Discovery:** Audit of engine-core vs Python kernel + kernel-hardening.md (2026-01-26)
**Date:** 2026-01-26
**Status:** ready

---

## Overview

Harden engine-core with patterns from the original Python kernel and requirements from `docs/kernel-hardening.md`. Focus on cryptographic hashing, event log integrity, determinism verification, and property testing.

---

## Requirements Expansion

### From R1: Cryptographic Hash Chain (kernel-hardening §1, §2)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | Use SHA-256 for event hashing (64-char hex) | Hash output is 64 chars | 013 |
| R1.2 | Use SHA-256 for state snapshot hashing | Same state = same hash | 013 |
| R1.3 | GENESIS_HASH matches format (64 zeros) | `GENESIS_HASH === "0".repeat(64)` | 013 |
| R1.4 | Canonical JSON: sorted keys, no whitespace, NFC unicode, no NaN/Infinity | Encoder tests | 013 |

### From R2: EventLog Class (Python kernel pattern)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | EventLog class wraps event array | `new EventLog()` works | 014 |
| R2.2 | Append-only with chain validation | Append rejects bad prevHash | 014 |
| R2.3 | head_hash property tracks chain head | Updates after each append | 014 |
| R2.4 | Iterable and indexable | `for (const e of log)` works | 014 |
| R2.5 | recent_events() for late join | Returns simplified event list | 014 |

### From R3: Turn Processor (Python kernel pattern)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | processTurn() orchestrates full turn | Single function call | 015 |
| R3.2 | Applies damage, corroboration, contested | All modifiers calculated | 015 |
| R3.3 | Detects contradictions and updates scrutiny | Contradiction → scrutiny change | 015 |
| R3.4 | Tracks concern fulfillment | Concerns marked addressed | 015 |
| R3.5 | Returns TurnResult with all effects | Result includes all outcomes | 015 |
| R3.6 | Emits appropriate events | Events added to log | 015 |

### From R4: Golden Transcript Testing (kernel-hardening §8 MUST)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | GoldenTranscript type with events and checkpoints | Type exists | 016 |
| R4.2 | replayTranscript verifies hashes at checkpoints | Replay function works | 016 |
| R4.3 | recordTranscript helper for fixture creation | Helper function works | 016 |
| R4.4 | At least 3 golden fixtures in test suite | Fixtures exist and pass | 016 |

### From R5: Property-Based Testing (kernel-hardening §7 SHOULD)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | Arbitrary generators for domain types | Generators work | 017 |
| R5.2 | Property tests for resolver invariants | Tests pass 100+ runs | 017 |
| R5.3 | Determinism property verified | Same input = same output | 017 |

---

## Phases

### Phase 1: Foundation Hardening (Batch 1)

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 013 | SHA-256 Hash Migration | ready | - |
| 014 | EventLog Class | ready | - |

### Phase 2: Verification (Batch 1, parallel with Phase 1)

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 016 | Golden Transcript Framework | ready | - |
| 017 | Property-Based Tests | ready | - |

### Phase 3: Turn Orchestration (Batch 2)

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 015 | Turn Processor | backlog | 013, 014 |

---

## Dependency Graph

```
013 (SHA-256) ──────┐
                    ├──→ 015 (Turn Processor)
014 (EventLog) ─────┘

016 (Golden Transcripts) ──→ (standalone, benefits from 013)

017 (Property Tests) ──→ (standalone)
```

---

## Batch Analysis

| Batch | Tasks | Blocked By | Notes |
|-------|-------|------------|-------|
| 1 | 013, 014, 016, 017 | - | All independent, start immediately |
| 2 | 015 | 013, 014 | Orchestration layer |

**Parallelization opportunity:** All 4 tasks in Batch 1 can run simultaneously.

---

## Task Summary

| ID | Name | Complexity | Status | Source |
|----|------|------------|--------|--------|
| 013 | SHA-256 Hash Migration | M | ready | Audit + hardening §1 |
| 014 | EventLog Class | M | ready | Python kernel |
| 015 | Turn Processor | M | backlog | Python kernel |
| 016 | Golden Transcript Framework | M | ready | hardening §8 (MUST) |
| 017 | Property-Based Tests | M | ready | hardening §7 (SHOULD) |

---

## Kernel Hardening Coverage

| Section | Requirement | Status | Task |
|---------|-------------|--------|------|
| §1.1 | Canonical JSON (NFC, sorted, no floats) | ✅ Covered | 013 |
| §1.2 | State Hash Contract | ✅ Covered | 013 |
| §2.1 | Event Hash Chain | ✅ Covered | 013, 014 |
| §7 | Property-Based Tests | ✅ Covered | 017 |
| §8 | Golden Transcripts | ✅ Covered | 016 |
| §3-6, §9-11 | Server-side concerns | N/A | - |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| SHA-256 not sync in browsers | Use js-sha256 pure JS library |
| Golden fixtures become stale | Record helper makes updates easy |
| Property tests too slow | Limit iterations in CI, more in nightly |
| Breaking existing event hashes | New functions, deprecate old |

---

## Open Questions

1. **Async hashing:** Should we support Web Crypto async API? Recommendation: No for MVP, pure functions simpler.
2. **Fixture versioning:** How to handle intentional hash changes? Recommendation: Document in fixture, use semver.
3. **fast-check vs other libraries:** Recommendation: fast-check is mature, well-typed, works with vitest.
