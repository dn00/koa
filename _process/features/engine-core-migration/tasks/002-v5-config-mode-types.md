# Task 002: V5 Config & Mode Types

**Status:** ready
**Assignee:** -
**Blocked By:** -
**Phase:** 1 - Foundation Types
**Complexity:** S
**Depends On:** none
**Implements:** R2.5, R2.6, R2.7

---

## Objective

Define GameConfig and ModeConfig types with their presets (DEFAULT_CONFIG, MINI_MODE, ADVANCED_MODE). These control game rules and presentation mode.

---

## Context

V5 has configurable scoring rules, tier thresholds, and presentation modes. GameConfig contains functions for scoring and tier calculation. ModeConfig controls what UI elements are shown (belief bar, numeric scoring, etc).

### Relevant Files
- `scripts/v5-types.ts` - GameConfig, DEFAULT_CONFIG, EASY_CONFIG, HARD_CONFIG (lines 152-263)
- `scripts/v5-engine/types.ts` - ModeConfig, MINI_MODE, ADVANCED_MODE (lines 28-96)

### Embedded Context

**GameConfig scoring functions:**
```typescript
scoring: {
  truth: (strength: number) => number;  // Returns belief gain
  lie: (strength: number) => number;    // Returns belief loss (negative)
}
```

**ModeConfig display toggles:**
```typescript
interface ModeConfig {
  mode: 'mini' | 'advanced' | 'trial';
  showBeliefBar: boolean;
  showNumericScoring: boolean;
  playerChoosesObjection: boolean;
  showTypeTaxRule: boolean;
  barkFilter: 'mini-safe' | 'all';
}
```

---

## Acceptance Criteria

### AC-1: GameConfig Interface ← R2.5
- **Given:** GameConfig interface
- **When:** Creating a config object
- **Then:** Has startingBelief, cardsInHand, cardsPerTurn, turnsPerGame, liesPerPuzzle, scoring (object with truth/lie functions), tiers (object with flawless/cleared/close functions), objection config, typeTax config
- **Test Type:** unit

### AC-2: DEFAULT_CONFIG Preset ← R2.5
- **Given:** DEFAULT_CONFIG constant
- **When:** Accessing its values
- **Then:** startingBelief=50, turnsPerGame=3, objection.enabled=true, typeTax.enabled=true
- **Test Type:** unit

### AC-3: ModeConfig Interface ← R2.6
- **Given:** ModeConfig interface
- **When:** Creating a mode config
- **Then:** Has mode, showBeliefBar, showNumericScoring, playerChoosesObjection, showTypeTaxRule, barkFilter
- **Test Type:** unit

### AC-4: MINI_MODE and ADVANCED_MODE Presets ← R2.7
- **Given:** MINI_MODE preset
- **When:** Checking its values
- **Then:** showBeliefBar=false, showNumericScoring=false, playerChoosesObjection=false, barkFilter='mini-safe'
- **Given:** ADVANCED_MODE preset
- **When:** Checking its values
- **Then:** All display flags true, barkFilter='all'
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: GameConfig scoring functions handle edge values
- **Scenario:** scoring.truth(0) and scoring.lie(0)
- **Expected:** Returns 0 for truth, returns 0 or positive value for lie (lie penalty at strength 0)
- **Test Type:** unit

---

## Scope

### In Scope
- GameConfig interface
- DEFAULT_CONFIG, EASY_CONFIG, HARD_CONFIG presets
- ModeConfig interface
- GameMode type ('mini' | 'advanced' | 'trial')
- BarkFilter type ('mini-safe' | 'all')
- MINI_MODE, ADVANCED_MODE presets

### Out of Scope
- Scoring logic (Task 004 uses these types)
- Presentation layer (app layer, not engine-core)

---

## Implementation Hints

1. Create `packages/engine-core/src/types/v5/config.ts`
2. Create `packages/engine-core/src/types/v5/mode.ts`
3. Export from `types/v5/index.ts`
4. Presets should be `as const` for type safety

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No `any` types
- [ ] Types compile without errors
- [ ] Presets exported correctly
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Config types enable the resolver to be configurable. Mode types enable Mini vs Advanced presentation.
**Decisions:** Keep GameConfig functions (scoring.truth, etc.) rather than converting to pure data - they're already pure and this matches the v5-types.ts pattern.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-28 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
| 2026-01-28 | backlog | ready | Planner | No dependencies, ready to start |
