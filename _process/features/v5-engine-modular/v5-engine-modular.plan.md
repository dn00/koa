# Plan: V5 Engine Modularization

**Discovery:** [discovery.md](./discovery.md)
**Date:** 2026-01-28
**Status:** complete

---

## Overview

Make V5 play engine configurable for KOA Mini mode with pluggable puzzle packs. Mini is a **presentation mode** - both modes use the same scoring engine with different UI surfaces.

**Future Extensibility:** This engine is designed to grow into the full "KOA Trials" system (5 hearings, tactic cards, KOA counters, deckbuilding). Types and interfaces should accommodate future additions without breaking changes.

---

## Requirements Expansion

### From R1: Mode System (Mini vs Advanced)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | ModeConfig type with display toggles | Type compiles, has all required fields | 001 |
| R1.2 | MINI_MODE preset hides numeric UI | Mini config has showBeliefBar=false, etc. | 001 |
| R1.3 | ADVANCED_MODE preset shows all UI | Advanced config has all display flags true | 001 |
| R1.4 | Mini auto-resolves objection (no player choice) | ModeConfig has playerChoosesObjection=false, objection scoring still applies | 001 |

### From R2: Engine/Presentation Separation

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Engine functions are pure (no I/O) | Functions take input, return output, no console/fs | 002 |
| R2.2 | State management extracted to module | createState, updateState pure functions | 002 |
| R2.3 | Presentation layer formats output based on mode | Presenter takes mode config, formats accordingly | 003 |
| R2.4 | CLI delegates to engine for game logic | play-v5.ts only handles I/O, not scoring | 006 |

### From R3: Pluggable Puzzle Packs

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | PuzzlePack interface defined | Type with version, id, name, puzzles | 004 |
| R3.2 | PackLoader interface with list/load/get | Interface defined, builtin loader implements | 004 |
| R3.3 | Builtin pack wraps existing puzzles | V5_PUZZLES wrapped as PuzzlePack | 004 |
| R3.4 | Pack validation returns Result type | validatePack returns Result<PuzzlePack, Error[]> | 004 |

### From R4: Backward Compatibility

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | Default mode is advanced | No --mode flag = advanced behavior | 006 |
| R4.2 | Existing flags work unchanged | --puzzle, --state, --pick, --difficulty all work | 006 |
| R4.3 | JSON output mode unchanged | --json produces same structure | 006 |

### From R5: Mini-Safe Dialogue Filtering

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | DialogueTag type for bark classification | Type with mini-safe, mentions-score, etc. | 005 |
| R5.2 | Existing barks tagged appropriately | All KOA_LINES have tags array | 005 |
| R5.3 | Filter function for mode-aware selection | filterBarksForMode returns mini-safe only | 005 |

### From R6: Mini Barks & System Check

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | Mini barks are axis/pattern-level only | No truth/lie indication per turn, only story-level feedback | 003, 005, 006 |
| R6.2 | Mini shows system check bark after T2 | Narrative tension beat displayed | 003, 006 |
| R6.3 | Mini has no stand/withdraw prompt | No objection choice in Mini | 006 |
| R6.4 | Mini auto-resolves objection internally | Engine applies +2/-4/-2 based on KOA's optimal choice | 002 |
| R6.5 | Truth/lie revealed only at verdict | Lies marked on verdict screen with explanations | 003, 006 |

---

## Phases

### Phase 1: Foundation Types

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 001 | Mode & Engine Types | done | - |

### Phase 2: Core Engine

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 002 | Engine Core (State & Logic) | done | 001 |
| 003 | Presentation Layer | done | 001 |
| 004 | Puzzle Pack System | done | 001 |
| 005 | Dialogue Tagging & Filter | done | 001 |

### Phase 3: Integration

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 006 | CLI Refactor | done | 002, 003, 004, 005 |

---

## Dependency Graph

```
001 ──┬──→ 002 ──┐
      │         │
      ├──→ 003 ──┼──→ 006
      │         │
      ├──→ 004 ──┤
      │         │
      └──→ 005 ──┘
```

---

## Batch Analysis

| Batch | Tasks | Blocked By | Notes |
|-------|-------|------------|-------|
| 1 | 001 | - | Foundation types, start immediately |
| 2 | 002, 003, 004, 005 | Batch 1 | Core modules, can parallelize |
| 3 | 006 | Batch 2 | CLI integration |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Mode & Engine Types | S | done |
| 002 | Engine Core (State & Logic) | M | done |
| 003 | Presentation Layer | M | done |
| 004 | Puzzle Pack System | S | done |
| 005 | Dialogue Tagging & Filter | S | done |
| 006 | CLI Refactor | M | done |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking CLI compatibility | Medium | High | Test all existing flags before/after |
| Dialogue filter too aggressive | Low | Medium | Audit barks, err on side of inclusion |
| Mode differences cause bugs | Low | Medium | Unit test both modes |

---

## Related Future Features

| Feature | Spec | Relationship |
|---------|------|--------------|
| KOA Trials | v5-design.md | Engine extensibility: tactic cards, KOA counters, 5 hearings, deckbuilding |
| Banter System v2 | banter-system.md | Dialogue extensibility: CardDialogue schema, statement stitcher, safety validation |

Task 005 (dialogue tagging) and Task 001 (types) lay groundwork for these future features.

---

## Open Questions

None remaining.

---

## Review Log

### Review 1: 2026-01-28

**Reviewer:** Plan-Level Reviewer
**Verdict:** PASS ✓

#### Test Results
- **Tests:** 666 passed (114 for v5-engine/v5-packs specifically)
- **Type check:** 0 errors

#### Coverage Summary

| Task | AC Coverage | EC Coverage | Tests Pass |
|------|-------------|-------------|------------|
| 001 | 7/7 ✓ | 1/1 ✓ | ✓ |
| 002 | 9/9 ✓ | 2/2 ✓ | ✓ |
| 003 | 7/7 ✓ | 1/1 ✓ | ✓ |
| 004 | 9/9 ✓ | 1/1 ✓ | ✓ |
| 005 | 7/7 ✓ | 1/1 ✓ | ✓ |
| 006 | CLI Integration | - | ✓ Manual |

**Total:** 45 AC/EC test blocks across 5 test files

#### Implementation Verified

- **Task 001:** ModeConfig, presets, Result type, TurnInput, ExtendedGameState
- **Task 002:** Pure engine functions, immutable state, scoring, objection handling
- **Task 003:** Mode-aware formatters for turns, system check, verdict
- **Task 004:** PuzzlePack interface, PackLoader, BUILTIN_PACK, validation
- **Task 005:** Dialogue tags, filtered barks, pickKoaLineFiltered
- **Task 006:** --mode flag, Mini/Advanced presentation, backward compatibility

#### What's Good

- Pure functions throughout (no side effects)
- Immutable state management
- Result type for functional error handling
- Conservative bark tagging (safe by default)
- Future extensibility designed in
- Backward compatibility maintained

#### Issues Found

**Critical:** None
**Should-Fix:** None
**Consider:** Task 006 CLI tests are indirect — acceptable for integration tasks

#### Conclusion

Feature is complete. All tasks implemented per spec, all tests pass, type check clean.
