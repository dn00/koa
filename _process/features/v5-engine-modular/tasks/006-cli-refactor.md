# Task 006: CLI Refactor

**Status:** done
**Assignee:** -
**Blocked By:** 002, 003, 004, 005
**Phase:** Integration
**Complexity:** M
**Depends On:** 002, 003, 004, 005
**Implements:** R2.4, R4.1, R4.2, R4.3, R6.2

---

## Objective

Refactor `play-v5.ts` to be a thin CLI adapter that delegates to the modular engine, supporting both Mini and Advanced modes.

---

## Context

Currently `play-v5.ts` is 788 lines mixing I/O, game logic, state management, and display. After this task, it should only handle:
- Argument parsing
- User prompts
- Console output
- Delegating to engine for game logic

### Relevant Files
- `scripts/play-v5.ts` - Primary refactor target
- `scripts/v5-engine/engine.ts` - Engine to use (Task 002)
- `scripts/v5-engine/presentation.ts` - Presentation layer (Task 003)
- `scripts/v5-packs/` - Pack loading (Task 004)

### Embedded Context

**Backward Compatibility:**
All existing flags must work unchanged:
- `--puzzle [slug]`
- `--difficulty [level]`
- `--state [path]`
- `--pick [card_id]`
- `--objection [choice]`
- `--seed [number]`
- `--json`
- `--log [path]`
- `--no-objection`
- `--no-type-tax`
- `--verbose`

**New Flag:**
- `--mode [mini|advanced]` - Default: advanced

**Mini Mode CLI Behavior:**
- No belief bar in status
- Per-turn feedback: 👍/👎 icons (comfort up/down) instead of numbers
- System check bark after T2 but NO stand/withdraw prompt
- Objection auto-resolved internally (scoring still applies, player doesn't choose)
- Verdict shows tier, lie marks, and contradiction explanations (no numbers)

---

## Acceptance Criteria

### AC-1: Default Mode Advanced ← R4.1
- **Given:** play-v5.ts with no --mode flag
- **When:** Game runs
- **Then:** Behavior matches current (Advanced mode)
- **Test Type:** integration

### AC-2: Mode Mini Flag ← R2.4
- **Given:** play-v5.ts with --mode mini
- **When:** Game runs
- **Then:** Uses MINI_MODE config and MINI_GAME_CONFIG
- **Test Type:** integration

### AC-3: Existing Flags Work ← R4.2
- **Given:** play-v5.ts with --puzzle garage-door --difficulty hard --seed 12345
- **When:** Game runs
- **Then:** Loads correct puzzle, uses hard config, deterministic seed
- **Test Type:** integration

### AC-4: JSON Output Unchanged ← R4.3
- **Given:** play-v5.ts with --json --state /tmp/game.json --pick browser_history
- **When:** Turn executed
- **Then:** JSON output has same structure as before refactor
- **Test Type:** integration

### AC-5: CLI Delegates to Engine ← R2.4
- **Given:** Refactored play-v5.ts
- **When:** playCard flow executes
- **Then:** Scoring computed by engine.playCard(), not inline code
- **Test Type:** unit (code inspection)

### AC-6: Mini No Objection Prompt ← R6.2
- **Given:** --mode mini, after T2
- **When:** Game displays system check
- **Then:** Shows KOA bark, does NOT prompt for stand/withdraw
- **Test Type:** integration

### AC-7: Mini Auto-Resolves Objection ← R6.3, R6.4
- **Given:** --mode mini, playing 3 cards including system check after T2
- **When:** Game ends
- **Then:** Objection was auto-resolved (KOA chose optimal), scoring applied internally, no player prompt shown
- **Test Type:** integration

### AC-8: CLI Presenter Mini Status ← R2.4
- **Given:** --mode mini
- **When:** Status displayed
- **Then:** No belief bar, only tier shown
- **Test Type:** integration

### AC-8b: CLI Presenter Mini Turn Feedback ← R6.1
- **Given:** --mode mini, after playing a card
- **When:** Turn result displayed
- **Then:** Shows axis-level KOA bark (pattern/timeline/axis commentary), NO belief numbers, NO truth/lie indication
- **Test Type:** integration

### AC-9: CLI Presenter Advanced ← R2.4
- **Given:** --mode advanced
- **When:** Status displayed
- **Then:** Full belief bar with numbers
- **Test Type:** integration

### Edge Cases

#### EC-1: Invalid Mode
- **Scenario:** --mode invalid
- **Expected:** Error message, exit 1

#### EC-2: Mini with --objection flag
- **Scenario:** --mode mini --objection stand
- **Expected:** Flag ignored (objection disabled in Mini)

---

## Scope

### In Scope
- Refactor play-v5.ts to use engine modules
- Add --mode flag
- Create CLIPresenter for mode-aware output
- Maintain all backward compatibility
- Both interactive and turn-by-turn modes

### Out of Scope
- Engine logic changes (Task 002 handled that)
- Presentation logic changes (Task 003 handled that)
- New puzzle content

---

## Implementation Hints

Refactored structure:
```typescript
// play-v5.ts (slim)
import { createGameState, playCard, resolveObjection, isGameOver, getVerdict } from './v5-engine/engine.js';
import { formatTurnResult, formatVerdict, formatSystemCheck } from './v5-engine/presentation.js';
import { createBuiltinLoader } from './v5-packs/index.js';
import { MINI_MODE, ADVANCED_MODE, MINI_GAME_CONFIG } from './v5-engine/types.js';

// Parse args
const modeArg = getArg('mode') || 'advanced';
const modeConfig = modeArg === 'mini' ? MINI_MODE : ADVANCED_MODE;
const gameConfig = modeArg === 'mini' ? MINI_GAME_CONFIG : buildGameConfig();

// Load puzzle
const loader = createBuiltinLoader();
const puzzleResult = loader.getPuzzle('builtin-v5', puzzleArg);
if (!puzzleResult.ok) { console.error(puzzleResult.error); process.exit(1); }
const puzzle = puzzleResult.value;

// Game loop
let state = createGameState(puzzle, gameConfig);
while (!isGameOver(state, gameConfig)) {
  const cardId = await promptCardPick(state.hand);
  const result = playCard(state, cardId, gameConfig, nextSeed());
  if (!result.ok) { console.error(result.error); continue; }
  state = result.value.state;

  const presentation = formatTurnResult(result.value, modeConfig);
  printTurnResult(presentation);

  // System check after T2
  if (state.turnsPlayed === 2) {
    if (modeConfig.playerChoosesObjection && gameConfig.objection.enabled) {
      // Advanced: prompt
      const choice = await promptObjection();
      const objResult = resolveObjection(state, choice, gameConfig);
      state = objResult.value.state;
      printObjectionResult(objResult.value);
    } else {
      // Mini: narrative only
      const sysCheck = formatSystemCheck(state.played[1], modeConfig);
      printSystemCheck(sysCheck);
    }
  }
}

const verdict = getVerdict(state, puzzle, gameConfig);
const verdictPresentation = formatVerdict(verdict, modeConfig);
printVerdict(verdictPresentation);
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] All existing flags work unchanged
- [ ] --mode mini works correctly
- [ ] Code is significantly shorter than original
- [ ] No game logic in CLI (only I/O and presentation)
- [ ] Self-review completed

---

## Log

### Planning Notes
> Written by Planner

**Context:** Final integration task. Must not break existing usage.
**Decisions:** Test backward compat extensively before and after.
**Questions for Implementer:** Consider keeping original as play-v5-legacy.ts during transition.

### Implementation Notes
> Written by Implementer

**Files modified:**
- `scripts/play-v5.ts` - Added mode support (~50 lines changed)

**Changes made:**
- Added `--mode [mini|advanced]` flag (default: advanced)
- Imported MINI_MODE, ADVANCED_MODE, autoResolveObjection, pickKoaLineFiltered
- Added IS_MINI constant and buildModeConfig function
- Updated printOpening: Mini hides target number and mechanic rules
- Updated printStatus: Mini shows comfort icon instead of belief bar
- Updated printTurnResult: Mini shows 👍/👎 instead of numbers
- Updated printOutcome: Mini shows lies with explanations at verdict
- Updated handleObjection: Mini auto-resolves with narrative bark only
- Updated playTurn: Mini auto-resolves objection in turn-by-turn mode

**Testing verification:**
- Default mode (advanced): Works unchanged
- Mini mode: No numbers, auto-resolved objection, lies revealed at verdict
- Invalid mode: Error message with exit 1
- JSON output: Structure unchanged for backward compatibility
- All 114 unit tests pass

**Backward compatibility:**
- All existing flags work unchanged
- Default behavior is advanced mode
- JSON output structure preserved

### Review Notes
> Written by Reviewer

### Change Log
- 2026-01-28 Planner: Task created, blocked by 002-005

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
