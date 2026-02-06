# Plan: Solvability Guarantee System

**Discovery:** [discovery.md](./discovery.md)
**Status:** active

---

## Overview

Separate solvability (signal MUST exist) from difficulty (how HARD to find signal). Every published case guarantees at least one catchable contradiction involving the culprit, enabling full difficulty tuning without risk of unsolvable cases.

---

## Requirements Expansion

### From R1: Signal validation after case generation

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | `analyzeSignal()` returns signal type and strength | Unit test with known cases | 001 |
| R1.2 | Signal analysis checks self-contradiction (culprit testimony vs culprit testimony) | Test: culprit lies → `self_contradiction` | 001 |
| R1.3 | Signal analysis checks device contradiction (culprit testimony vs device log) | Test: culprit claims X, device shows Y → `device_contradiction` | 001 |
| R1.4 | Signal analysis checks scene presence (device log places culprit at crime scene) | Test: door log during crime window → `scene_presence` | 001 |
| R1.5 | Signal analysis returns `opportunity_only` when no catchable signal | Test: only motive exists → `opportunity_only`, `hasSignal: false` | 001 |

### From R2: Signal injection when validation fails

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | `injectMinimalSignal()` adds door event catching culprit | Test: after injection, `analyzeSignal().hasSignal === true` | 002 |
| R2.2 | Injection uses RNG for determinism | Test: same seed produces same injection | 002 |
| R2.3 | Injection uses existing door sensor near crime scene | Test: injected event targets real device | 002 |
| R2.4 | Injected event occurs during crime window | Test: event.window === config.crimeWindow | 002 |
| R2.5 | Evidence re-derivation picks up injected event | Test: new device_log evidence exists after injection | 002 |

### From R3: Separation of solvability from difficulty

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Pipeline validates signal AFTER evidence derivation | Integration test: signal check runs post-derive | 003 |
| R3.2 | Pipeline injects signal if validation fails | Integration test: marginal seed → signal injected | 003 |
| R3.3 | Pipeline re-derives evidence after injection | Integration test: new evidence appears | 003 |
| R3.4 | All difficulty levels achieve ≥95% solvability | Batch test: 500 seeds per difficulty | 003 |
| R3.5 | Existing valid cases unchanged | Regression test: valid seed produces same output | 003 |

### From R4: Signal type as tuning dimension (P1 - Future)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | `SignalConfig` type added to `CaseConfig` | Type exists | 004 |
| R4.2 | Director can request specific signal type | Config: `signalType: 'self_contradiction'` → signal type matches | 004 |

### From R5: Signal strength metric in validation (P1 - Future)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | Solver output includes signal analysis | `SolverResult.signalAnalysis` field exists | 004 |
| R5.2 | Signal strength metric available | `signalStrength: 'strong' | 'medium' | 'weak'` | 004 |

---

## Dependency Graph

```
001 ──→ 002 ──→ 003 ──→ 004
        (signal)  (inject)  (integrate)  (tuning)
```

Task 001 (Signal Analysis) must complete first - it defines the types and detection logic that 002 and 003 depend on.

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | M | - | Foundation: types + signal detection |
| 2 | 002 | M | Batch 1 | Injection logic |
| 3 | 003 | M | Batch 2 | Pipeline integration |
| 4 | 004 | S | Batch 3 | Tuning hooks (P1, optional) |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Signal Analysis Function | M | ready |
| 002 | Signal Injection Function | M | backlog |
| 003 | Pipeline Integration | M | backlog |
| 004 | Tuning Hooks (P1) | S | backlog |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Injection feels artificial | Medium | Medium | Inject device events (natural) not testimony (obvious) |
| Breaks existing valid seeds | Low | High | Regression test on 500+ seeds before/after |
| Over-corrects (too easy) | Medium | Medium | Validate difficulty distribution unchanged |
| Performance impact | Low | Low | Validation is O(n²) on evidence count, ~100 items max |

---

## Open Questions

- [x] Should we reject seeds or inject signals? → **Inject** (don't waste seeds)
- [ ] Should signal injection be logged for debugging? → Probably yes, add `injectedSignal: boolean` to CaseConfig
- [ ] Should variety system control signal type distribution now or later? → Later (Task 004, P1)

---

## Verification Commands

```bash
# Run solver on 500 seeds (must achieve ≥95%)
npx tsx src/cli.ts --autosolve --generate 500

# Check specific seed with verbose output
npx tsx src/cli.ts --autosolve --generate 1 --seed 42 -v

# Test signal analysis on known failing seed
npx tsx src/cli.ts --autosolve --generate 1 --seed 14 -v
```
