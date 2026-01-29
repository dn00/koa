# Plan: V5 Engine Migration to engine-core

**Discovery:** [discovery.md](./discovery.md)
**Date:** 2026-01-28
**Status:** active

---

## Overview

Migrate V5 game engine from `scripts/v5-engine/` to `packages/engine-core/`, replacing the MVP domain model with V5's "adversarial testimony" design. V5 uses belief scoring, hidden lies, type tax, and objection mechanics instead of MVP's resistance/concerns/scrutiny model.

**Architecture Decision:** V5 Replaces MVP (Option A)

---

## Requirements Expansion

### From R2: Type System Migration

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Card type with branded CardId | `CardId` is branded string type; Card uses CardId | 001 |
| R2.2 | EvidenceType as string literal union | `'DIGITAL' \| 'PHYSICAL' \| 'TESTIMONY' \| 'SENSOR'` | 001 |
| R2.3 | GameState with belief, hand, played, turnResults, objection | All fields present with correct types | 001 |
| R2.4 | V5Puzzle with cards, lies, verdicts, koaBarks | Interface matches scripts/v5-types.ts | 001 |
| R2.5 | GameConfig with scoring functions, tier functions, objection config | Interface matches scripts/v5-types.ts | 002 |
| R2.6 | ModeConfig with display toggles and barkFilter | Interface matches scripts/v5-engine/types.ts | 002 |
| R2.7 | MINI_MODE and ADVANCED_MODE presets | Presets exported and match expected values | 002 |
| R2.8 | TurnResult, ObjectionState types | Types match scripts/v5-types.ts | 001 |

### From R3: Pure Function Pattern Preservation

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | scoreCard is pure (no I/O, no mutation) | Function takes inputs, returns output | 004 |
| R3.2 | checkTypeTax is pure | No side effects | 004 |
| R3.3 | playCard returns new state, doesn't mutate input | Input state unchanged after call | 007 |
| R3.4 | resolveObjection returns new state, doesn't mutate input | Input state unchanged after call | 005 |
| R3.5 | All resolver functions take seed for deterministic randomness | No Math.random() calls | 007 |

### From R4: Result Type Consistency

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | Use engine-core Result<T,E> type | Import from types/index.ts, not redefined | 001 |
| R4.2 | playCard returns Result<TurnOutput, EngineError> | Return type matches | 007 |
| R4.3 | resolveObjection returns Result<ObjectionOutput, EngineError> | Return type matches | 005 |
| R4.4 | EngineError has code and message fields | Type exported with standard codes | 007 |

### From R5: Remove Obsolete MVP Code

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | Remove resolver/damage.ts | File deleted, no imports remain | 010 |
| R5.2 | Remove resolver/contradiction.ts | File deleted, no imports remain | 010 |
| R5.3 | Remove resolver/concerns.ts | File deleted, no imports remain | 010 |
| R5.4 | Remove resolver/scrutiny.ts | File deleted, no imports remain | 010 |
| R5.5 | Remove resolver/corroboration.ts | File deleted, no imports remain | 010 |
| R5.6 | Remove resolver/contested.ts | File deleted, no imports remain | 010 |
| R5.7 | Remove resolver/refutation.ts | File deleted, no imports remain | 010 |
| R5.8 | Remove types/concern.ts | File deleted, no imports remain | 010 |
| R5.9 | Remove types/counter.ts | File deleted, no imports remain | 010 |
| R5.10 | Update barrel exports to exclude removed modules | index.ts files updated | 011 |

### From R6: Pack System Migration

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | PuzzlePack interface with version, id, name, puzzles | Interface exported | 008 |
| R6.2 | PackLoader interface with listPacks, loadPack, getPuzzle | Interface exported | 008 |
| R6.3 | validatePack returns Result<PuzzlePack, ValidationError[]> | Function validates pack structure | 008 |
| R6.4 | BUILTIN_PACK constant available | Exports current puzzles | 009 |
| R6.5 | createBuiltinLoader factory function | Returns PackLoader implementation | 009 |

### From R7: State Hashing for Determinism

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | computeStateHash function for GameState | Returns deterministic hash string | 003 |
| R7.2 | Hash uses canonical JSON (sorted keys) | Same state always produces same hash | 003 |
| R7.3 | Hash excludes non-deterministic fields (none currently) | Only game-affecting fields included | 003 |

### From R8: Event Sourcing Compatibility

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R8.1 | V5GameEvent discriminated union type | Type with CARD_PLAYED, OBJECTION_RESOLVED, GAME_ENDED | 007 |
| R8.2 | playCard can optionally emit events | Function has event output | 007 |
| R8.3 | deriveV5State function from events | Can rebuild state from event log | 007 |

---

## Phases

### Phase 1: Foundation Types

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 001 | V5 Core Types | backlog | - |
| 002 | V5 Config & Mode Types | backlog | - |
| 003 | State Hashing | backlog | 001 |

### Phase 2: Resolver Migration

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 004 | Scoring & Type Tax | backlog | 001, 002 |
| 005 | Objection System | backlog | 001, 002 |
| 006 | Tier Calculation | backlog | 002 |
| 007 | Engine Core | backlog | 001, 002, 004, 005, 006 |

### Phase 3: Pack System

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 008 | Pack Types & Validation | backlog | 001 |
| 009 | Builtin Pack & Loader | backlog | 008 |

### Phase 4: Cleanup

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 010 | Remove Obsolete MVP Code | backlog | 007, 009 |
| 011 | Update Barrel Exports | backlog | 010 |

---

## Dependency Graph

```
001 ──┬──→ 003
      │
      ├──→ 004 ──┐
      │         │
002 ──┼──→ 005 ──┼──→ 007 ──┐
      │         │          │
      └──→ 006 ──┘          │
                            │
001 ──→ 008 ──→ 009 ────────┼──→ 010 ──→ 011
                            │
                            ↓
```

---

## Batch Analysis

| Batch | Tasks | Blocked By | Notes |
|-------|-------|------------|-------|
| 1 | 001, 002 | - | Foundation types, start immediately |
| 2 | 003, 004, 005, 006, 008 | Batch 1 | Core logic and pack types, can parallelize |
| 3 | 007, 009 | Batch 2 | Engine core and builtin pack |
| 4 | 010 | Batch 3 | Remove obsolete code |
| 5 | 011 | Batch 4 | Final exports cleanup |

**Batch size guidance:** Batches 1-3 have good parallelization. Batches 4-5 are cleanup and must be sequential.

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | V5 Core Types | M | backlog |
| 002 | V5 Config & Mode Types | S | backlog |
| 003 | State Hashing | S | backlog |
| 004 | Scoring & Type Tax | S | backlog |
| 005 | Objection System | S | backlog |
| 006 | Tier Calculation | S | backlog |
| 007 | Engine Core | M | backlog |
| 008 | Pack Types & Validation | S | backlog |
| 009 | Builtin Pack & Loader | S | backlog |
| 010 | Remove Obsolete MVP Code | S | backlog |
| 011 | Update Barrel Exports | S | backlog |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Existing tests break when MVP code removed | High | Medium | Run full test suite before removal, fix or remove obsolete tests |
| Type incompatibilities during migration | Medium | Medium | Migrate incrementally, verify TypeScript compilation after each task |
| scripts/play-v5.ts breaks after migration | Medium | Low | Update imports in CLI after migration (separate task) |
| Lost v5-engine test coverage | Low | High | Port tests alongside code |

---

## Open Questions

None remaining — all answered in discovery.

---

## Test Count Estimate

| Task | ACs | ECs | ERRs | Total |
|------|-----|-----|------|-------|
| 001 | 6 | 2 | 1 | 9 |
| 002 | 4 | 1 | 0 | 5 |
| 003 | 3 | 2 | 0 | 5 |
| 004 | 4 | 2 | 0 | 6 |
| 005 | 4 | 1 | 1 | 6 |
| 006 | 3 | 2 | 0 | 5 |
| 007 | 6 | 3 | 3 | 12 |
| 008 | 4 | 2 | 2 | 8 |
| 009 | 3 | 1 | 1 | 5 |
| 010 | 2 | 0 | 0 | 2 |
| 011 | 2 | 0 | 0 | 2 |
| **Total** | **41** | **16** | **8** | **65** |
