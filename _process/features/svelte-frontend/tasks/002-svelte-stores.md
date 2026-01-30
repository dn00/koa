# Task 002: Svelte Stores (V5 + Chat)

**Status:** backlog
**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5

---

## Objective

Create the Svelte stores for V5 game state using engine-core types and functions, plus the chat log store and game phase management needed for the mockup's UX flow.

---

## Context

### Relevant Files
- `packages/engine-core/src/types/v5/` - V5 types (authoritative)
- `packages/engine-core/src/resolver/v5/` - V5 game logic (authoritative)
- `_process/context/v5-design-context.md` - V5 invariants
- `mockups/mockup-brutalist.zip` → `components/KoaMiniPage.tsx` - UX pattern

### Embedded Context

**Engine-core exports to use:**

```typescript
// Types from @hsh/engine-core
import type {
  Card,
  CardId,
  GameState,
  GameConfig,
  V5Puzzle,
  TurnResult,
  ObjectionState,
  EvidenceType,
  Tier,
  ModeConfig,
  VerdictData,
  TurnOutput,
  ObjectionOutput,
  EngineError,
} from '@hsh/engine-core';

import {
  // Mode presets
  MINI_MODE,
  ADVANCED_MODE,
  // Config presets
  DEFAULT_CONFIG,
  // Engine functions
  createGameState,
  playCard,
  resolveObjectionState,
  isGameOver,
  getVerdict,
  shouldTriggerObjection,
  autoResolveObjection,
} from '@hsh/engine-core';
```

**Engine Card interface (from engine-core):**
```typescript
interface Card {
  readonly id: CardId;
  readonly strength: number;           // 1-5
  readonly evidenceType: EvidenceType; // DIGITAL | SENSOR | TESTIMONY | PHYSICAL
  readonly location: string;
  readonly time: string;
  readonly claim: string;              // The evidence statement
  readonly presentLine: string;        // Player narration
  readonly isLie: boolean;             // Hidden from player until reveal
}
```

**UI-only extensions (for frontend display):**
```typescript
// Extended card with UI fields (not in engine)
interface UICard extends Card {
  readonly icon: string;   // Emoji for display (e.g., "🌡️")
  readonly title: string;  // Short display name (e.g., "Thermostat Log")
}

// Evidence type display mapping
const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  DIGITAL: 'LOG',
  SENSOR: 'SENSOR',
  TESTIMONY: 'WITNESS',
  PHYSICAL: 'OBJECT',
};
```

**Chat log types (UI-only, not in engine):**
```typescript
interface MiniLog {
  id: string;
  speaker: 'KOA' | 'PLAYER';
  text?: string;           // KOA messages
  card?: UICard;           // Player messages (card they played)
  timestamp: Date;
}
```

**Game phases (from mockup):**
```typescript
type GamePhase = 'READING' | 'PICKING' | 'VERDICT' | 'SHARE';
```

**Mode (aligned with engine ModeConfig):**
```typescript
type Mode = 'mini' | 'advanced';
// Maps to MINI_MODE or ADVANCED_MODE from engine-core
```

### Source Docs
- `_process/context/v5-design-context.md` - V5 invariants (I4: event sourcing)
- `_process/context/koa-mini-spec.md` - Mini mode spec

---

## Acceptance Criteria

### AC-1: Game State Store (Engine Integration) ← R2.1, R2.2
- **Given:** A puzzle and config from engine-core
- **When:** startGame(puzzle, config) called
- **Then:** gameState store initialized via `createGameState(puzzle, config)`
- **And:** State reflects engine's GameState shape

### AC-2: Play Card Action ← R2.1
- **Given:** Game in progress, card selected
- **When:** playCardAction(cardId) called
- **Then:** Calls engine `playCard(state, cardId, config, seed)`
- **And:** Updates gameState with TurnOutput.state
- **And:** Adds player card to chatLogs
- **And:** Adds KOA response to chatLogs

### AC-3: Mode Store ← R2.3
- **Given:** Mode store
- **When:** mode.set('advanced')
- **Then:** $mode equals 'advanced'
- **And:** Returns ADVANCED_MODE config from engine
- **And:** Persists to localStorage

### AC-4: Chat Log Store ← R2.4
- **Given:** Empty chatLogs array
- **When:** addLog('KOA', 'Hello')
- **Then:** chatLogs contains MiniLog with speaker='KOA', text='Hello'
- **And:** Has generated id and timestamp

### AC-5: Game Phase Store ← R2.5
- **Given:** phase store at 'READING'
- **When:** phase.set('PICKING')
- **Then:** $phase equals 'PICKING'

### AC-6: Objection Handling (Mode-aware) ← R2.1
- **Given:** Turn 2 just completed, mode is 'mini'
- **When:** Objection check runs
- **Then:** Calls `autoResolveObjection(state, config)` automatically
- **And:** Updates gameState with result

---

## Edge Cases

### EC-1: Engine Error Handling
- **Scenario:** playCard returns err (card not in hand, game over)
- **Expected:** Store does NOT update, error surfaced to UI

### EC-2: Mode Persistence
- **Scenario:** User refreshes page
- **Expected:** Mode restored from localStorage

---

## Error Cases

### ERR-1: Invalid Card Play
- **When:** playCardAction called with invalid cardId
- **Then:** Engine returns err with CARD_NOT_IN_HAND
- **Error Message:** From EngineError.message

---

## Scope

**In Scope:**
- gameState writable store (uses engine GameState)
- currentPuzzle writable store (V5Puzzle)
- chatLogs writable store (MiniLog[])
- phase writable store (GamePhase)
- mode writable store with persistence (Mode)
- modeConfig derived store (returns MINI_MODE or ADVANCED_MODE)
- Actions: startGame, playCardAction, resolveObjectionAction, addLog

**Out of Scope:**
- Persistence service (Task 010)
- Pack loader (Task 010)
- UI components
- UICard extension (can be done in puzzle loading or component)

---

## Implementation Hints

```typescript
// stores/game.ts
import { writable, derived } from 'svelte/store';
import type {
  Card, GameState, GameConfig, V5Puzzle, ModeConfig,
  TurnOutput, ObjectionOutput
} from '@hsh/engine-core';
import {
  createGameState, playCard, resolveObjectionState, isGameOver, getVerdict,
  shouldTriggerObjection, autoResolveObjection,
  DEFAULT_CONFIG, MINI_MODE, ADVANCED_MODE
} from '@hsh/engine-core';

// ============================================================================
// Types
// ============================================================================

type GamePhase = 'READING' | 'PICKING' | 'VERDICT' | 'SHARE';
type Mode = 'mini' | 'advanced';

interface UICard extends Card {
  icon: string;
  title: string;
}

interface MiniLog {
  id: string;
  speaker: 'KOA' | 'PLAYER';
  text?: string;
  card?: UICard;
  timestamp: Date;
}

// ============================================================================
// Core Stores
// ============================================================================

export const gameState = writable<GameState | null>(null);
export const currentPuzzle = writable<V5Puzzle | null>(null);
export const chatLogs = writable<MiniLog[]>([]);
export const phase = writable<GamePhase>('READING');

// ============================================================================
// Mode Store (with persistence)
// ============================================================================

function createModeStore() {
  const stored = typeof localStorage !== 'undefined'
    ? (localStorage.getItem('koa-mode') as Mode)
    : null;
  const { subscribe, set } = writable<Mode>(stored || 'mini');

  return {
    subscribe,
    set: (value: Mode) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('koa-mode', value);
      }
      set(value);
    }
  };
}

export const mode = createModeStore();

// Derived: ModeConfig from engine
export const modeConfig = derived(mode, ($mode): ModeConfig => {
  return $mode === 'advanced' ? ADVANCED_MODE : MINI_MODE;
});

// ============================================================================
// Actions
// ============================================================================

export function addLog(speaker: 'KOA' | 'PLAYER', text?: string, card?: UICard) {
  chatLogs.update(logs => [...logs, {
    id: crypto.randomUUID(),
    speaker,
    text,
    card,
    timestamp: new Date()
  }]);
}

export function startGame(puzzle: V5Puzzle, seed: number) {
  const state = createGameState(puzzle, DEFAULT_CONFIG);
  gameState.set(state);
  currentPuzzle.set(puzzle);
  chatLogs.set([]);
  addLog('KOA', puzzle.openingLine || "Access denied. Review the logs.");
  phase.set('READING');
}

export function playCardAction(cardId: string, uiCard: UICard) {
  gameState.update(state => {
    if (!state) return state;

    const result = playCard(state, cardId, DEFAULT_CONFIG, Date.now());

    if (!result.ok) {
      console.error('Engine error:', result.error);
      return state;
    }

    const { state: newState, wasLie, beliefChange } = result.value;

    // Add to chat log
    addLog('PLAYER', undefined, uiCard);

    // Generate KOA response (placeholder - use bark system)
    const response = getKoaResponse(newState.turnsPlayed, wasLie);
    setTimeout(() => addLog('KOA', response), 600);

    // Check for objection (after turn 2)
    if (shouldTriggerObjection(newState.turnsPlayed, DEFAULT_CONFIG)) {
      // In Mini mode, auto-resolve
      // In Advanced mode, show prompt (handled by UI)
    }

    // Check for game over
    if (isGameOver(newState, DEFAULT_CONFIG)) {
      setTimeout(() => phase.set('VERDICT'), 2000);
    }

    return newState;
  });
}

function getKoaResponse(turnsPlayed: number, wasLie: boolean): string {
  // Placeholder - integrate with bark system
  if (turnsPlayed === 3) return "Calculating override probability...";
  if (turnsPlayed === 2) return "System check in progress. One more variable required.";
  return "Noted. Continue.";
}
```

---

## Log

### Planning Notes
**Context:** Stores bridge the engine-core (pure game logic) with the UI (chat, phases, mode). Must use engine types exactly as defined.
**Decisions:**
- Use engine's `Card` type, extend with UI-only fields (icon, title) as `UICard`
- Mode store returns ModeConfig from engine via derived store
- Chat log is UI-only (not persisted to engine events)
- Objection auto-resolved in Mini mode per ModeConfig.playerChoosesObjection
