# Discovery: V5 Engine Migration to engine-core

**Date:** 2026-01-28
**Status:** approved
**Author:** Discovery Agent

---

## Overview

### Problem Statement

The v5-engine-modular feature completed successfully in `scripts/v5-engine/` with 114 passing tests. However, migration into `packages/engine-core/src/` was explicitly deferred because of a fundamental architectural challenge: **two incompatible domain models exist**.

| Aspect | engine-core (MVP) | v5-engine |
|--------|------------------|-----------|
| State metric | resistance (decreases) | belief (50-based target) |
| Cards/turn | 1-3 | 1 |
| Turns | configurable | 3 fixed |
| Hidden info | contradictions detected | lies hidden until verdict |
| Mechanics | concerns, scrutiny, corroboration, contested | type tax, objection, tiers |
| Card type | EvidenceCard (power, proves, claims) | Card (strength, evidenceType, isLie) |

### Proposed Solution

Before migrating code, we must decide which domain model is canonical for Home Smart Home. Three options:

1. **V5 Replaces MVP** - V5 is the evolved design; remove MVP resolver
2. **Coexistence** - Both resolvers in engine-core under different modules
3. **Reconciliation** - Merge concepts into a unified model (complex)

### Success Criteria

1. Single canonical domain model in engine-core
2. All v5-engine functionality available from engine-core package
3. Python kernel patterns preserved (pure functions, state hashing, event sourcing)
4. Tests migrated and passing
5. scripts/v5-engine/ deprecated or removed

---

## Requirements

### Must Have (P0)

- **R1:** Architecture Decision — Which Domain Model?
  - Rationale: Can't migrate without knowing target model
  - Verification: ADR document approved by human

- **R2:** Type System Migration
  - Rationale: v5 types (Card, GameState, V5Puzzle) must align with engine-core conventions
  - Verification: Types compile, follow branded ID pattern

- **R3:** Pure Function Pattern Preservation
  - Rationale: Engine functions must have no side effects (per Python kernel)
  - Verification: No I/O in migrated modules

- **R4:** Result Type Consistency
  - Rationale: v5-engine already uses Result<T,E>, must use engine-core's version
  - Verification: Single Result type definition

- **R5:** Remove Obsolete MVP Code
  - Rationale: V5 replaces MVP; dead code adds confusion
  - Verification: No MVP-specific types/resolver modules remain

- **R6:** Pack System Migration
  - Rationale: PuzzlePack, validation belong in engine-core
  - Verification: PackLoader interface in engine-core, validates V5Puzzle

### Should Have (P1)

- **R7:** State Hashing for Determinism
  - Rationale: Python kernel has snapshot_hash(); v5-engine lacks this
  - Verification: GameState has computeHash() method

- **R8:** Event Sourcing Compatibility
  - Rationale: engine-core has event system; v5 should produce events
  - Verification: playCard returns events, not just new state

### Won't Have (this scope)

- CLI refactoring (scripts/play-v5.ts remains a thin wrapper)
- Presentation layer in engine-core (moves to app layer)
- Dialogue system in engine-core (moves to app layer)
- STATUS.md task list cleanup (separate task after migration)

---

## Technical Analysis

### Source Code Inventory (v5-engine)

| File | LOC | Purpose | Migration Notes |
|------|-----|---------|-----------------|
| `types.ts` | 159 | ModeConfig, Result, TurnInput, ExtendedGameState | Merge with engine-core types |
| `engine.ts` | 311 | createGameState, playCard, resolveObjection, getVerdict | Core logic, adapt to event model |
| `presentation.ts` | 221 | Mode-aware formatters | Move to app layer, not engine-core |
| `dialogue-filter.ts` | 489 | Tagged KOA lines, filtering | Separate content, not engine-core |

### Dependencies on scripts/

The v5-engine modules import from:
- `../v5-types.js` - Full V5 type system (310 LOC)
- `../v5-rules.js` - Scoring, tier, objection logic (147 LOC)
- `../v5-dialogue.js` - Narration stitching, bark selection
- `../v5-puzzles.js` - Hardcoded puzzle data

**Total: ~1,100 LOC** to migrate or reconcile.

### Current engine-core Structure

```
packages/engine-core/src/
├── types/           # EvidenceCard, Concern, Counter, Puzzle, state
│   ├── index.ts     # Re-exports, Result type
│   ├── evidence.ts  # EvidenceCard
│   ├── state.ts     # RunState, Submission, MoveResult
│   └── ...
├── resolver/        # Game logic
│   ├── turn.ts      # processTurn
│   ├── damage.ts    # calculateBaseDamage
│   ├── contradiction.ts
│   ├── concerns.ts
│   ├── events.ts    # deriveState, event creators
│   └── ...
└── validation/      # Pack validation
```

### Key Differences in Type Systems

| Concept | engine-core | v5 |
|---------|-------------|-----|
| Card ID | `CardId` (branded) | `string` |
| Evidence type | `ProofType` enum | `EvidenceType` literal |
| Card truth | contradictions detected | `isLie` boolean on card |
| State model | `RunState` (resistance, scrutiny) | `GameState` (belief, objection) |
| Result | `MoveResult` | `TurnOutput` |

### Components Affected

If choosing **V5 Replaces MVP**:
- `engine-core/types/` - Replace EvidenceCard, RunState with V5 equivalents
- `engine-core/resolver/` - Replace damage/concerns/scrutiny with belief/objection/type-tax
- `engine-core/resolver/events.ts` - Adapt for V5 event types

If choosing **Coexistence**:
- Create `engine-core/v5/` subdirectory
- Both models compile, different imports

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `types/v5-card.ts` | V5 Card type with branded ID |
| `types/v5-state.ts` | V5 GameState, TurnResult |
| `types/mode.ts` | ModeConfig, presets |
| `v5/engine.ts` | V5 resolver (playCard, resolveObjection) |
| `v5/scoring.ts` | scoreCard, checkTypeTax, getTier |
| `hash.ts` | State hashing (per Python kernel) |

---

## Constraints

### Technical Constraints

- **Pure Functions:** All engine functions must be pure (Python kernel pattern)
- **No DOM:** engine-core has zero browser dependencies
- **Branded IDs:** Card IDs should be branded for type safety
- **Result Type:** Use existing engine-core Result, not duplicate

### Design Constraints

- **Mini Mode Support:** Types must support Mini vs Advanced presentation
- **Future Extensibility:** KOA Trials (5 hearings, tactic cards) designed for
- **Determinism:** Same inputs must produce same outputs (state hashing verifies)

### Business Constraints

- **MVP Parallel Work:** engine-core MVP features (tasks 003-010) may be in progress
- **No Breaking Changes:** If MVP work depends on current types, careful coordination needed

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MVP and V5 features conflict | High | High | Decide canonical model BEFORE more work |
| Type migration breaks existing tests | Medium | Medium | Run all tests after each change |
| Circular dependencies | Low | Medium | Clear module boundaries |
| Lost work in MVP resolver | Medium | High | V5 may obviate MVP mechanics entirely |

---

## Open Questions

- [x] **Q1: Is V5 the canonical design?** **YES** — V5 replaces MVP.
- [x] **Q2: What happens to MVP tasks in STATUS.md?** Tasks based on MVP mechanics (damage, concerns, scrutiny) are obsolete. Replace with V5-aligned tasks.
- [x] **Q3: Should engine-core support both models?** **NO** — Single model (V5).
- [x] **Q4: Where does presentation layer go?** `packages/app/` — presentation is UI layer, not engine.
- [x] **Q5: Where does dialogue system go?** `packages/app/services/dialogue/` — content/presentation, not core logic.

---

## Architectural Decision: OPTION A CHOSEN

**Decision:** V5 Replaces MVP

**Rationale:** V5 "adversarial testimony" design is the canonical game.

### Implications

1. **Remove MVP resolver** — damage.ts, contradictions.ts, concerns.ts, scrutiny.ts, corroboration.ts, contested.ts, refutation.ts become obsolete
2. **Replace MVP types** — EvidenceCard, RunState, Concern, Counter → V5 Card, GameState, V5Puzzle
3. **Migrate V5 logic** — scoring, type tax, objection, tiers become the engine
4. **Update STATUS.md tasks** — Batch 3-7 tasks based on MVP mechanics need replacement
5. **Preserve patterns** — Pure functions, Result type, event system remain

### What Gets Migrated

| Source | Destination | Notes |
|--------|-------------|-------|
| `scripts/v5-types.ts` | `engine-core/types/` | Card, GameState, V5Puzzle, GameConfig |
| `scripts/v5-rules.ts` | `engine-core/resolver/` | scoring, type tax, objection, tiers |
| `scripts/v5-engine/engine.ts` | `engine-core/resolver/` | playCard, resolveObjection, getVerdict |
| `scripts/v5-engine/types.ts` | `engine-core/types/` | ModeConfig, TurnInput |
| `scripts/v5-packs/` | `engine-core/packs/` | PuzzlePack, PackLoader, validation |

### What Gets Removed from engine-core

| File | Reason |
|------|--------|
| `resolver/damage.ts` | V5 uses belief scoring, not damage |
| `resolver/contradiction.ts` | V5 uses hidden lies, not detected contradictions |
| `resolver/concerns.ts` | V5 has no concerns mechanic |
| `resolver/scrutiny.ts` | V5 has no scrutiny mechanic |
| `resolver/corroboration.ts` | V5 has no corroboration mechanic |
| `resolver/contested.ts` | V5 has no contested mechanic |
| `resolver/refutation.ts` | V5 has no refutation mechanic |
| `types/concern.ts` | No concerns in V5 |
| `types/counter.ts` | No counter-evidence in V5 |

### What Moves to app Layer

| Source | Destination | Notes |
|--------|-------------|-------|
| `scripts/v5-engine/presentation.ts` | `app/services/presentation/` | Mode-aware formatters |
| `scripts/v5-engine/dialogue-filter.ts` | `app/services/dialogue/` | Bark filtering |
| `scripts/v5-dialogue.ts` | `app/services/dialogue/` | Narration, bark selection |

---

## References

- `_process/features/v5-engine-modular/discovery.md` - Completed feature discovery
- `_process/features/v5-engine-modular/v5-engine-modular.plan.md` - Completed feature plan
- `_process/project/ARCHITECTURE.md` - Engine-core layer description
- `docs/source-files/kernel/` - Python reference patterns
- `packages/engine-core/src/` - Current MVP implementation
- `scripts/v5-engine/` - Source to migrate

---

## Next Steps

1. [x] **Human decision on Q1-Q5** — Option A: V5 Replaces MVP
2. [x] Get discovery approved
3. [ ] Hand off to Planner for task breakdown

---

## Handoff Notes for Planner

The migration has three phases:

**Phase 1: Types Migration**
- Migrate V5 types to engine-core with branded IDs
- Add state hashing (per Python kernel pattern)
- Remove obsolete MVP types

**Phase 2: Resolver Migration**
- Migrate scoring, type tax, objection, tier logic
- Adapt to event-based output pattern
- Remove obsolete MVP resolver modules

**Phase 3: Pack System Migration**
- Migrate PuzzlePack, PackLoader, validation
- Integrate with existing validation module

**Phase 4: Cleanup**
- Remove obsolete code from scripts/
- Update STATUS.md task list
- Deprecate MVP-based tasks (003-010, etc.)

**Estimated complexity:** Medium-High (significant type surgery, but clear path)
