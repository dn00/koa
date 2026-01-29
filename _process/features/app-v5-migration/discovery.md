# Discovery: App V5 Migration

**Date:** 2026-01-28
**Status:** draft
**Author:** Discovery Agent
**Triggered By:** engine-core-migration integration audit identified @hsh/app as broken consumer

---

## Overview

### Problem Statement

The `engine-core-migration` feature removed MVP domain types from `@hsh/engine-core`, leaving `@hsh/app` with 30+ TypeScript errors. The app currently imports removed types:

- `EvidenceCard`, `Concern`, `Scrutiny`, `RunStatus`, `Puzzle`
- `GameEvent`, `RunState`, `deriveState`
- Event creators: `runStarted`, `cardsSubmitted`, `concernAddressed`, `scrutinyIncreased`, `runEnded`

These types no longer exist. The app must be migrated to use V5 types and patterns.

### Proposed Solution

Migrate `@hsh/app` from the MVP domain model to the V5 domain model:

| MVP Concept | V5 Concept |
|-------------|------------|
| `EvidenceCard` with `power`, `proves`, `claims` | `Card` with `strength`, `evidenceType`, `claim`, `isLie` |
| `Concern` with `addressed` | N/A (removed mechanic) |
| `Puzzle` with `resistance`, `concerns`, `counters` | `V5Puzzle` with `target`, `lies`, `verdicts`, `koaBarks` |
| `RunState` with `resistance`, `scrutiny`, `turnsRemaining` | `GameState` with `belief`, `turnsPlayed`, `objection` |
| Event sourcing via `deriveState(events)` | Direct state via `playCard(state, cardId, config, seed)` |
| `RunStatus` enum (WON/LOST/IN_PROGRESS) | `Tier` type (FLAWLESS/CLEARED/CLOSE/BUSTED) |

### Success Criteria

1. `npm run build` succeeds with no TypeScript errors
2. App renders V5 game UI with belief bar, card hand, objection flow
3. App uses engine-core V5 types exclusively (no local redefinitions)
4. All existing app tests pass (adapted to V5)

---

## Requirements

### Must Have (P0)

- **R1:** Replace MVP types with V5 types
  - Rationale: App cannot compile without this
  - Verification: TypeScript compilation succeeds

- **R2:** Migrate gameStore to V5 state management
  - Rationale: Game logic uses fundamentally different state shape
  - Verification: Store provides V5 `GameState`, uses `playCard()`/`getVerdict()`

- **R3:** Update RunScreen to V5 gameplay flow
  - Rationale: V5 has different mechanics (belief, objection, type tax)
  - Verification: Screen shows belief bar, handles objection prompt, displays verdict

- **R4:** Update EvidenceCard component to V5 card shape
  - Rationale: V5 `Card` has different fields than `EvidenceCard`
  - Verification: Card displays `strength`, `evidenceType`, `claim`, `presentLine`

- **R5:** Update persistence layer for V5 state
  - Rationale: Can no longer persist events; need to persist V5 `GameState`
  - Verification: Game state survives page reload

### Should Have (P1)

- **R6:** Update HUD components for V5
  - Rationale: Resistance/Scrutiny bars not applicable; need Belief bar
  - Verification: BeliefBar component shows current belief vs target

- **R7:** Remove obsolete MVP components
  - Rationale: ConcernChip, ScrutinyIndicator, CounterPanel have no V5 equivalent
  - Verification: No dead imports, no unused components

### Won't Have (this scope)

- Mini mode vs Advanced mode UI toggle (future feature)
- KOA dialogue selection (use empty strings for now)
- Pack loading from CDN (use BUILTIN_PACK)
- Settings migration (keep existing settings schema)

---

## Technical Analysis

### Existing Code

| File | Purpose | Migration Impact |
|------|---------|------------------|
| `stores/gameStore.ts` | Event-sourced state | **Full rewrite** - V5 uses direct state |
| `services/persistence.ts` | IndexedDB event storage | **Major changes** - store GameState not events |
| `services/db.ts` | Dexie schema | **Schema change** - events → state |
| `screens/run/RunScreen.tsx` | Main gameplay | **Major changes** - new HUD, mechanics |
| `components/EvidenceCard/` | Card display | **Major changes** - different data shape |
| `components/hud/ResistanceBar.tsx` | Health display | **Rename/rework** - becomes BeliefBar |
| `components/hud/ScrutinyIndicator.tsx` | Scrutiny display | **Delete** - no V5 equivalent |
| `components/hud/ConcernChip.tsx` | Concern display | **Delete** - no V5 equivalent |
| `components/counter/CounterPanel.tsx` | Counter display | **Delete** - no V5 equivalent |
| `components/story/StoryTimeline.tsx` | Played cards | **Minor changes** - different card shape |
| `screens/results/ResultScreen.tsx` | End game screen | **Major changes** - Tier not RunStatus |

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `BeliefBar` | Shows belief progress toward target |
| `ObjectionPrompt` | Stand/Withdraw choice UI (Advanced mode) |
| `TierResult` | Displays FLAWLESS/CLEARED/CLOSE/BUSTED verdict |

### Dependencies

- `@hsh/engine-core` V5 types: `Card`, `V5Puzzle`, `GameState`, `GameConfig`, `Tier`
- `@hsh/engine-core` V5 functions: `createGameState`, `playCard`, `isGameOver`, `getVerdict`, `shouldTriggerObjection`, `resolveObjectionState`
- `@hsh/engine-core` pack system: `BUILTIN_PACK`, `createBuiltinLoader`

---

## Constraints

### Technical Constraints

- **I4 Invariant preserved**: Project INVARIANTS.md mandates event-sourced truth.
  - **Decision**: Wrap V5 pure functions in event sourcing layer
  - **Rationale**: Future coop and multi-act runs require events for sync, replay, resume
  - Events are thin wrappers; V5 engine functions remain pure

- **Persistence format**: Keep event-based storage (align with MVP pattern)
  - V5Event types replace MVP GameEvent types
  - Same IndexedDB structure, different event shapes

### Business Constraints

- App must remain functional for testing V5 game design
- Don't break existing settings/preferences

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large scope causes delays | High | Medium | Phase 1 focuses on compiling; polish later |
| Invariant I4 violation | Medium | Low | Document decision to update invariants |
| Persistence migration loses data | Low | Low | V5 is new anyway; no real user data |
| Missing UI for objection flow | Medium | Medium | Start with auto-resolve (Mini mode behavior) |

---

## Open Questions

- [x] Event sourcing or direct state? **Decision: Event sourcing wrapper around V5 pure functions**
  - Rationale: Future coop and multi-act runs require events for sync, replay, resume
  - V5 engine stays pure; events are thin wrapper layer
- [x] Handle objection UI? **Decision: Start with auto-resolve, add prompt later**
- [ ] Should project docs (ARCHITECTURE.md, INVARIANTS.md) be updated in this feature or separately?

## Future Considerations

This migration prepares for:
- **Coop mode**: Events enable state sync between players
- **Multi-act runs**: Events enable resume, recap, undo across long sessions
- **Analytics**: Event log provides decision history for analysis

---

## References

- `_process/features/engine-core-migration/integration-audit.json` - Identifies broken imports
- `packages/engine-core/src/types/v5/` - V5 type definitions
- `packages/engine-core/src/resolver/v5/` - V5 game logic functions
- `scripts/play-v5.ts` - Reference V5 CLI implementation

---

## Next Steps

1. [x] Get discovery approved
2. [ ] Hand off to Planner for task breakdown
