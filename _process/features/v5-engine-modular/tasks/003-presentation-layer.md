# Task 003: Presentation Layer

**Status:** done
**Assignee:** -
**Blocked By:** 001
**Phase:** Core Engine
**Complexity:** M
**Depends On:** 001
**Implements:** R2.3, R6.1

---

## Objective

Create a presentation layer that formats engine output for display based on the current mode (Mini vs Advanced).

---

## Context

The presentation layer transforms raw engine output (belief numbers, scores) into user-facing display data. In Mini mode, it hides numeric details. In Advanced mode, it shows everything.

### Relevant Files
- `scripts/play-v5.ts` - Display functions to extract (printOpening, printHand, printStatus, printTurnResult, printOutcome)
- `scripts/v5-types.ts` - TurnResult, Tier types

### Embedded Context

**Mini Mode Display Rules:**
- NO belief numbers shown
- NO explicit scoring shown
- NO type tax rule mentioned
- Tiers shown (FLAWLESS/CLEARED/CLOSE/BUSTED)
- System check bark shown after T2 (narrative only)
- Verdict shows contradiction explanations

**Advanced Mode Display Rules:**
- Belief bar and numbers shown
- Scoring shown (+3, -4, etc.)
- Type tax indicated when applied
- Full objection prompt with stand/withdraw
- All numeric details in verdict

---

## Acceptance Criteria

### AC-1: TurnPresentation Type ← R2.3
- **Given:** Need mode-aware turn output
- **When:** TurnPresentation interface defined
- **Then:** Has required fields (narration, koaResponse) and optional fields (beliefChange, beliefTotal, typeTaxApplied)
- **Test Type:** unit (type compiles)

### AC-2: formatTurnResult Mini ← R2.3, R6.1
- **Given:** TurnResult with beliefChange=+4, wasLie=false
- **When:** formatTurnResult(result, MINI_MODE) called
- **Then:** Returns TurnPresentation with narration, axis-level koaResponse bark, NO beliefChange numbers, NO truth/lie indication
- **Test Type:** unit

### AC-3: formatTurnResult Advanced ← R2.3
- **Given:** TurnResult with beliefChange=+4, wasLie=false, belief=54
- **When:** formatTurnResult(result, ADVANCED_MODE) called
- **Then:** Returns TurnPresentation with all fields including beliefChange=4, beliefTotal=54
- **Test Type:** unit

### AC-4: formatSystemCheck Mini ← R6.1
- **Given:** Last played card after T2
- **When:** formatSystemCheck(card, MINI_MODE) called
- **Then:** Returns SystemCheckPresentation with narrative bark, no stand/withdraw options
- **Test Type:** unit

### AC-5: formatSystemCheck Advanced ← R2.3
- **Given:** Last played card after T2
- **When:** formatSystemCheck(card, ADVANCED_MODE) called
- **Then:** Returns ObjectionPresentation with bark AND stand/withdraw options with point values
- **Test Type:** unit

### AC-6: formatVerdict Mini ← R2.3
- **Given:** Final state with tier=CLEARED
- **When:** formatVerdict(state, puzzle, MINI_MODE) called
- **Then:** Returns VerdictPresentation with tier, koaLine, played cards with lie marks, contradiction explanations, NO belief numbers
- **Test Type:** unit

### AC-7: formatVerdict Advanced ← R2.3
- **Given:** Final state with tier=CLEARED, belief=62, target=57
- **When:** formatVerdict(state, puzzle, ADVANCED_MODE) called
- **Then:** Returns VerdictPresentation with all fields including beliefFinal=62, beliefTarget=57, turn summary with scores
- **Test Type:** unit

### Edge Cases

#### EC-1: Type Tax Display in Advanced
- **Scenario:** Turn with typeTaxApplied=true in Advanced mode
- **Expected:** TurnPresentation includes typeTaxApplied=true, display can show "(includes type tax)"

---

## Scope

### In Scope
- TurnPresentation interface
- VerdictPresentation interface
- SystemCheckPresentation / ObjectionPresentation interfaces
- formatTurnResult(result, modeConfig)
- formatSystemCheck(card, modeConfig)
- formatVerdict(state, puzzle, modeConfig)

### Out of Scope
- Actual console output (CLI presenter handles that)
- Dialogue selection (Task 005)
- Engine logic (Task 002)

---

## Implementation Hints

Create `scripts/v5-engine/presentation.ts`:
```typescript
import type { TurnResult, GameState, V5Puzzle, ModeConfig, Card } from './types.js';

export interface TurnPresentation {
  narration: string;
  koaResponse: string;
  // Only present if mode allows
  beliefChange?: number;
  beliefTotal?: number;
  typeTaxApplied?: boolean;
}

export function formatTurnResult(
  result: TurnResult,
  modeConfig: ModeConfig
): TurnPresentation {
  const base = {
    narration: result.narration,
    koaResponse: result.koaResponse,
  };

  if (modeConfig.showNumericScoring) {
    return {
      ...base,
      beliefChange: result.beliefChange,
      // etc.
    };
  }

  return base;
}
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Presentation functions are pure
- [ ] Mini mode output has no numeric fields
- [ ] Advanced mode output has all fields
- [ ] No `any` types
- [ ] Self-review completed

---

## Log

### Planning Notes
> Written by Planner

**Context:** Presentation layer is the key to Mini vs Advanced differentiation.
**Decisions:** Return interfaces with optional fields - let CLI decide how to render.
**Questions for Implementer:** Consider if contradiction explanations should be generated here or in engine.

### Implementation Notes
> Written by Implementer

**Files created:**
- `scripts/v5-engine/presentation.ts` - Mode-aware formatting
- `scripts/v5-engine/presentation.test.ts` - Unit tests

**Test count:** 22 tests (7 AC + 1 EC)
- AC-1: 2 tests (TurnPresentation type)
- AC-2: 4 tests (formatTurnResult Mini)
- AC-3: 3 tests (formatTurnResult Advanced)
- AC-4: 2 tests (formatSystemCheck Mini)
- AC-5: 2 tests (formatSystemCheck Advanced)
- AC-6: 5 tests (formatVerdict Mini)
- AC-7: 3 tests (formatVerdict Advanced)
- EC-1: 1 test (type tax display)

**Design decisions:**
- Optional fields in interfaces (undefined in Mini, present in Advanced)
- Contradiction reasons generated from puzzle.lies
- Reuses getTier and pickKoaLine from existing modules

### Review Notes
> Written by Reviewer

### Change Log
- 2026-01-28 Planner: Task created, blocked by 001

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
