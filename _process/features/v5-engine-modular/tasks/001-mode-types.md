# Task 001: Mode & Engine Types

**Status:** done
**Assignee:** -
**Blocked By:** -
**Phase:** Foundation Types
**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4

---

## Objective

Define TypeScript types for game modes and engine configuration that enable Mini vs Advanced presentation modes.

---

## Context

The V5 engine needs to support two presentation modes:
- **Mini:** Hides numeric UI, shows 👍/👎 feedback, auto-resolves objection, filters barks
- **Advanced:** Full V5 experience with all mechanics visible and player choices

Both modes use the same underlying scoring engine - the difference is presentation and whether player makes certain choices (like objection).

### Relevant Files
- `scripts/v5-types.ts` - Existing types to extend
- `packages/engine-core/src/types/` - Result pattern to adopt

### Embedded Context

**Result Type Pattern (from engine-core):**
```typescript
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

**Mini Mode Constraints:**
- Per-turn feedback: Axis/pattern-level barks only (no truth/lie indication, no numbers)
- Objection: Auto-resolved by engine (KOA makes optimal choice), scoring still applies (+2/-4/-2)
- System check bark shown after T2, but no player stand/withdraw prompt
- Barks filtered to mini-safe subset (no mechanic mentions)
- Truth/lie revealed only at verdict (with contradiction explanations)

**Future Extensibility (KOA Trials):**
Types should be designed to accommodate future additions without breaking changes:
- **Tactic cards:** Player deck with Signal/Control/Protect abilities
- **KOA Counters:** Enemy cards (Channel Reliance, Rehearsed, Timeline Drift, etc.)
- **Variable hearings:** 3 (Mini daily), 5 (standard trial), 7 (weekly case file)
- **Drafting:** Between-hearing card picks

Design interfaces with optional fields and extension points rather than locked-down structures.

---

## Acceptance Criteria

### AC-1: ModeConfig Type ← R1.1
- **Given:** TypeScript module `v5-engine/types.ts`
- **When:** ModeConfig type is defined
- **Then:** Type has fields: mode, showBeliefBar, showNumericScoring, playerChoosesObjection, showTypeTaxRule, barkFilter
- **Test Type:** unit (type compiles)

### AC-2: MINI_MODE Preset ← R1.2
- **Given:** ModeConfig type exists
- **When:** MINI_MODE constant is defined
- **Then:** mode='mini', showBeliefBar=false, showNumericScoring=false, playerChoosesObjection=false, showTypeTaxRule=false, barkFilter='mini-safe'
- **Test Type:** unit

### AC-3: ADVANCED_MODE Preset ← R1.3
- **Given:** ModeConfig type exists
- **When:** ADVANCED_MODE constant is defined
- **Then:** mode='advanced', all show* flags=true, barkFilter='all'
- **Test Type:** unit

### AC-4: ModeConfig playerChoosesObjection ← R1.4
- **Given:** ModeConfig type
- **When:** MINI_MODE defined
- **Then:** playerChoosesObjection=false (objection auto-resolved by engine, scoring still applies)
- **Test Type:** unit

### AC-5: Result Type Utilities
- **Given:** Need error handling pattern
- **When:** Result type and ok/err helpers defined
- **Then:** Can create Result<T, E> values using ok() and err()
- **Test Type:** unit

### AC-6: TurnInput Interface (Extensible) ← Future
- **Given:** Need turn input that can grow to include tactic cards
- **When:** TurnInput interface defined
- **Then:** Has cardId (required), optional tacticId field for future
- **Test Type:** unit (type compiles)

### AC-7: GameState Extension Points ← Future
- **Given:** GameState needs to grow for KOA Trials
- **When:** GameState reviewed/extended
- **Then:** Has optional fields: tacticDeck?, koaCounters?, hearingNumber?
- **Test Type:** unit (type compiles)

### Edge Cases

#### EC-1: Type Inference
- **Scenario:** Using ok() and err() without explicit type
- **Expected:** TypeScript infers correct Result type

---

## Scope

### In Scope
- ModeConfig type definition
- GameMode type ('mini' | 'advanced')
- MINI_MODE and ADVANCED_MODE constants
- Result<T, E> type and helpers
- BarkFilter type ('mini-safe' | 'all')
- TurnInput interface with extensibility for tacticId
- GameState extension points (optional fields for future)
- HearingConfig concept (turnsPerGame as "hearings")

### Out of Scope
- Engine logic (Task 002)
- Presentation logic (Task 003)
- Actual bark filtering (Task 005)
- Tactic card types (future scope)
- KOA counter types (future scope)
- Deckbuilding types (future scope)

---

## Implementation Hints

Create new file `scripts/v5-engine/types.ts`:
```typescript
// Re-export existing types
export * from '../v5-types.js';

// Add new types
export type GameMode = 'mini' | 'advanced' | 'trial';  // 'trial' for future
export type BarkFilter = 'mini-safe' | 'all';

export interface ModeConfig {
  mode: GameMode;
  showBeliefBar: boolean;
  showNumericScoring: boolean;
  playerChoosesObjection: boolean;  // false = auto-resolve
  showTypeTaxRule: boolean;
  barkFilter: BarkFilter;
  // Future: showTacticCards, showKoaCounters, etc.
}

export const MINI_MODE: ModeConfig = {
  mode: 'mini',
  showBeliefBar: false,
  showNumericScoring: false,
  playerChoosesObjection: false,  // Auto-resolve, scoring still applies
  showTypeTaxRule: false,
  barkFilter: 'mini-safe',
};

export const ADVANCED_MODE: ModeConfig = {
  mode: 'advanced',
  showBeliefBar: true,
  showNumericScoring: true,
  playerChoosesObjection: true,
  showTypeTaxRule: true,
  barkFilter: 'all',
};

// Turn input - extensible for tactics
export interface TurnInput {
  cardId: string;          // Evidence card to play
  tacticId?: string;       // Future: tactic card to play
}

// Extended GameState - optional fields for future
export interface ExtendedGameState extends GameState {
  hearingNumber?: number;  // Future: which hearing (1-5)
  tacticDeck?: Card[];     // Future: player's tactic deck
  koaCounters?: string[];  // Future: active KOA counters
}

// Result type
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No `any` types
- [ ] Types exported from v5-engine/index.ts
- [ ] Self-review completed

---

## Log

### Planning Notes
> Written by Planner

**Context:** Foundation types enable all subsequent tasks. Must be done first.
**Decisions:** Adopted Result pattern from engine-core for consistency.
**Questions for Implementer:** None

### Implementation Notes
> Written by Implementer

**Files created:**
- `scripts/v5-engine/types.ts` - Mode types, Result utilities, extensible interfaces
- `scripts/v5-engine/index.ts` - Module exports
- `scripts/v5-engine/types.test.ts` - Unit tests

**Test count:** 34 tests (7 AC + 1 EC, multiple assertions per criterion)
- AC-1: 3 tests (ModeConfig fields, GameMode values, BarkFilter values)
- AC-2: 6 tests (MINI_MODE preset properties)
- AC-3: 6 tests (ADVANCED_MODE preset properties)
- AC-4: 2 tests (playerChoosesObjection behavior)
- AC-5: 5 tests (Result type, ok/err helpers)
- AC-6: 3 tests (TurnInput extensibility)
- AC-7: 5 tests (ExtendedGameState optional fields)
- EC-1: 4 tests (type inference with narrowing)

**Notes:**
- Updated vitest.config.ts to include scripts/**/*.test.ts pattern
- Types re-export base v5-types for backward compatibility
- Added 'trial' mode in GameMode union for future KOA Trials feature

### Review Notes
> Written by Reviewer

### Change Log
- 2026-01-28 Planner: Task created, status ready

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | ready | Planner | Created, no deps |
