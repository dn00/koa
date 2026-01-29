# Plan: App V5 Migration

**Discovery:** [discovery.md](./discovery.md)
**Date:** 2026-01-28
**Status:** active

---
CERTAIN ARCHITECTURE PATTERNS INVARIANTS ARE OUTDATED WITH THIS MIGRATION
## Overview

Migrate `@hsh/app` from MVP domain model to V5 domain model. The MVP event-sourced pattern with `EvidenceCard`, `Concern`, `Scrutiny` is replaced by V5's direct state with `Card`, `belief`, `objection`.

**Key change:** V5 engine uses pure functions (`playCard`, `getVerdict`). We wrap these in an event sourcing layer to preserve I4 invariant and enable future coop/multi-act features. Events are thin; V5 functions do the work.

---

## Requirements Expansion

### From R1: Replace MVP types with V5 types

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | Import `Card` instead of `EvidenceCard` | TypeScript compiles | 001 |
| R1.2 | Import `V5Puzzle` instead of `Puzzle` | TypeScript compiles | 001 |
| R1.3 | Import `GameState` instead of `RunState` | TypeScript compiles | 002 |
| R1.4 | Import `Tier` instead of `RunStatus` | TypeScript compiles | 001 |
| R1.5 | Remove all imports of deleted types | No import errors | 001 |

### From R2: Migrate gameStore to V5 with event sourcing

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Store holds `V5Event[]` as source of truth (I4 preserved) | Events array exists | 002 |
| R2.2 | Store derives `GameState` from events via `deriveV5State()` | State matches event replay | 002 |
| R2.3 | `startGame(puzzle, config, seed)` appends GAME_STARTED event | Event logged, state derived | 002 |
| R2.4 | `playCard(cardId)` appends CARD_PLAYED event, derives new state | Event logged, state updated | 002 |
| R2.5 | `resolveObjection(choice)` appends OBJECTION_RESOLVED event | Event logged, state updated | 002 |
| R2.6 | `getVerdict()` calls engine `getVerdict()` on derived state | Returns verdict data | 002 |
| R2.7 | `deriveV5State(events)` replays events using V5 pure functions | Deterministic derivation | 002 |
| R2.8 | V5Event type defined with GAME_STARTED, CARD_PLAYED, OBJECTION_RESOLVED | Type exported | 002 |

### From R3: Update RunScreen to V5 gameplay flow

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Show BeliefBar with current belief and target | UI displays correctly | 004 |
| R3.2 | Show cards from `state.hand` with V5 card shape | Cards render | 004 |
| R3.3 | Card selection plays card via store | playCard called | 004 |
| R3.4 | Check `isGameOver()` after each play | Game ends at 3 turns | 004 |
| R3.5 | Show ObjectionPrompt after turn 2 (Advanced mode) | Prompt appears | 005 |
| R3.6 | Navigate to results when game over | Redirect works | 004 |

### From R4: Update EvidenceCard component to V5 card shape

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | Display `card.strength` (not power) | Shows strength badge | 003 |
| R4.2 | Display `card.evidenceType` | Shows type chip | 003 |
| R4.3 | Display `card.claim` (not claims object) | Shows claim text | 003 |
| R4.4 | Display `card.location` and `card.time` | Shows metadata | 003 |
| R4.5 | Remove `proves` and `refutes` display | Fields don't exist | 003 |

### From R5: Update persistence layer for V5 state

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | `StoredRun` stores `GameState` not events | Schema correct | 006 |
| R5.2 | `saveGame(runId, state, puzzle)` persists full state | State saved | 006 |
| R5.3 | `loadGame(runId)` restores full state | State loaded | 006 |
| R5.4 | Database version incremented for migration | Dexie handles upgrade | 006 |

### From R6: Update HUD components for V5

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | `BeliefBar` shows belief vs target with visual indicator | Component works | 004 |
| R6.2 | `TurnsDisplay` shows `turnsPlayed` vs `config.turnsPerGame` | Turns accurate | 004 |
| R6.3 | ResistanceBar renamed/replaced with BeliefBar | No resistance concept | 004 |

### From R7: Remove obsolete MVP components

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | Delete `ConcernChip` component | File removed | 007 |
| R7.2 | Delete `ScrutinyIndicator` component | File removed | 007 |
| R7.3 | Delete `CounterPanel` component | File removed | 007 |
| R7.4 | Update barrel exports to remove deleted components | No dead exports | 007 |
| R7.5 | Remove obsolete store actions (addressConcern, etc.) | No dead code | 002 |

---

## Phases

### Phase 1: Type Compilation

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 001 | Fix Type Imports | backlog | - |
| 002 | Migrate Game Store | backlog | 001 |
| 003 | Update EvidenceCard Component | backlog | 001 |

### Phase 2: Screen Updates

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 004 | Update RunScreen | backlog | 002, 003 |
| 005 | Add Objection Flow | backlog | 004 |
| 006 | Update Persistence | backlog | 002 |

### Phase 3: Cleanup

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| 007 | Remove Obsolete Components | backlog | 004 |
| 008 | Update Results Screen | backlog | 002 |

---

## Dependency Graph

```
001 ──┬──→ 002 ──┬──→ 004 ──→ 005
      │         │     ↓
      │         └──→ 006
      │               ↓
      └──→ 003 ──────→ 007
                       ↓
002 ─────────────────→ 008
```

---

## Batch Analysis

| Batch | Tasks | Blocked By | Notes |
|-------|-------|------------|-------|
| 1 | 001 | - | Foundation: fix imports so TS can parse |
| 2 | 002, 003 | Batch 1 | Core: store + card component |
| 3 | 004, 006 | Batch 2 | Screens: RunScreen + persistence |
| 4 | 005, 007, 008 | Batch 3 | Polish: objection, cleanup, results |

**Batch size guidance:**
- Batch 1 is a single critical task (must compile first)
- Batches 2-4 can parallelize within the batch

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Fix Type Imports | S | backlog |
| 002 | Migrate Game Store | M | backlog |
| 003 | Update EvidenceCard Component | S | backlog |
| 004 | Update RunScreen | M | backlog |
| 005 | Add Objection Flow | S | backlog |
| 006 | Update Persistence | S | backlog |
| 007 | Remove Obsolete Components | S | backlog |
| 008 | Update Results Screen | S | backlog |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Store rewrite is complex | Medium | Medium | Task 002 is Medium complexity; test incrementally |
| Persistence migration breaks existing data | Low | Low | V5 is new; clean slate acceptable |
| Objection UI needs design | Medium | Low | Start with auto-resolve (Mini mode) |
| Project docs outdated | Medium | Low | Update ARCHITECTURE.md in separate task |

---

## Open Questions

None remaining.

---

## Test Count Estimate

| Task | ACs | ECs | ERRs | Total |
|------|-----|-----|------|-------|
| 001 | 5 | 1 | 1 | 7 |
| 002 | 8 | 3 | 2 | 13 |
| 003 | 5 | 2 | 0 | 7 |
| 004 | 6 | 2 | 1 | 9 |
| 005 | 3 | 1 | 1 | 5 |
| 006 | 4 | 1 | 1 | 6 |
| 007 | 4 | 0 | 0 | 4 |
| 008 | 4 | 1 | 0 | 5 |
| **Total** | **39** | **11** | **6** | **56** |
