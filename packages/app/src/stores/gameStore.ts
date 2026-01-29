/**
 * V5 Game Store - Event Sourced State Management
 *
 * Task 002: Migrate Game Store
 *
 * This store implements I4 invariant: event log is canonical, state is derived.
 * V5Event[] is the source of truth. GameState is derived via deriveV5State().
 *
 * Architecture:
 * V5Event[] --> deriveV5State() --> GameState
 *                    |
 *                    v
 *              V5 pure functions
 *              (createGameState, playCard, etc.)
 */

import { create } from 'zustand';
import type { Result } from '@hsh/engine-core';
import {
  BUILTIN_PACK,
  DEFAULT_CONFIG,
  createGameState,
  playCard as v5PlayCard,
  resolveObjectionState,
  isGameOver as v5IsGameOver,
  getVerdict as v5GetVerdict,
  type GameState,
  type GameConfig,
  type V5Puzzle,
  type EngineError,
  type TurnOutput,
  type ObjectionOutput,
  type VerdictData,
} from '@hsh/engine-core';

// ============================================================================
// V5 Event Types
// ============================================================================

/**
 * Game started event - captures initial puzzle and configuration.
 */
export interface GameStartedEvent {
  readonly type: 'GAME_STARTED';
  readonly puzzleSlug: string;
  readonly seed: number;
  readonly configKey: 'default' | 'easy' | 'hard';
  readonly timestamp: number;
}

/**
 * Card played event - records which card was played.
 */
export interface CardPlayedEvent {
  readonly type: 'CARD_PLAYED';
  readonly cardId: string;
  readonly timestamp: number;
}

/**
 * Objection resolved event - records player's choice.
 */
export interface ObjectionResolvedEvent {
  readonly type: 'OBJECTION_RESOLVED';
  readonly choice: 'stood_by' | 'withdrawn';
  readonly timestamp: number;
}

/**
 * V5Event discriminated union type.
 * Exported for persistence layer usage.
 */
export type V5Event = GameStartedEvent | CardPlayedEvent | ObjectionResolvedEvent;

// ============================================================================
// Config Mapping
// ============================================================================

/**
 * Get GameConfig from config key string.
 */
function getConfig(configKey: 'default' | 'easy' | 'hard'): GameConfig {
  // For now, all configs use DEFAULT_CONFIG
  // Future: import EASY_CONFIG, HARD_CONFIG
  switch (configKey) {
    case 'easy':
    case 'hard':
    case 'default':
    default:
      return DEFAULT_CONFIG;
  }
}

// ============================================================================
// State Derivation
// ============================================================================

/**
 * Derive V5 GameState from event log.
 *
 * Pure function that replays all events to reconstruct state.
 * Returns null if events are empty or invalid.
 *
 * @param events - The event log to replay
 * @param puzzles - Map of puzzle slugs to V5Puzzle objects
 * @returns Derived GameState or null
 */
export function deriveV5State(
  events: readonly V5Event[],
  puzzles: Map<string, V5Puzzle>
): GameState | null {
  if (events.length === 0) return null;

  const startEvent = events[0];
  if (startEvent?.type !== 'GAME_STARTED') return null;

  const puzzle = puzzles.get(startEvent.puzzleSlug);
  if (!puzzle) return null;

  const config = getConfig(startEvent.configKey);
  let state = createGameState(puzzle, config);
  let seedCounter = 0;

  for (const event of events.slice(1)) {
    const seed = startEvent.seed + ++seedCounter;

    switch (event.type) {
      case 'CARD_PLAYED': {
        const result = v5PlayCard(state, event.cardId, config, seed);
        if (result.ok) state = result.value.state;
        break;
      }
      case 'OBJECTION_RESOLVED': {
        const result = resolveObjectionState(state, event.choice, config);
        if (result.ok) state = result.value.state;
        break;
      }
      case 'GAME_STARTED':
        // GAME_STARTED is only valid at index 0, skip if encountered later
        break;
    }
  }

  return state;
}

// ============================================================================
// Store Interface
// ============================================================================

/**
 * V5 Game Store interface.
 * Events are the source of truth (I4 invariant).
 */
interface GameStore {
  // Source of truth (I4)
  readonly events: readonly V5Event[];

  // Derived (cached for performance)
  readonly gameState: GameState | null;

  // Context needed for derivation
  readonly currentPuzzle: V5Puzzle | null;
  readonly currentConfig: GameConfig;

  // Actions (append event, then re-derive)
  startGame: (puzzleSlug: string, config?: GameConfig, seed?: number) => void;
  playCard: (cardId: string) => Result<TurnOutput, EngineError>;
  resolveObjection: (choice: 'stood_by' | 'withdrawn') => Result<ObjectionOutput, EngineError>;

  // Queries
  getVerdict: () => VerdictData | null;
  isGameOver: () => boolean;
  shouldShowObjection: () => boolean;

  // Lifecycle
  reset: () => void;
  loadEvents: (events: V5Event[]) => void;
}

// ============================================================================
// Puzzle Lookup
// ============================================================================

/**
 * Build puzzle map from BUILTIN_PACK for O(1) lookup.
 */
function buildPuzzleMap(): Map<string, V5Puzzle> {
  const map = new Map<string, V5Puzzle>();
  for (const puzzle of BUILTIN_PACK.puzzles) {
    map.set(puzzle.slug, puzzle);
  }
  return map;
}

const PUZZLE_MAP = buildPuzzleMap();

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * V5 Game Store using Zustand.
 *
 * Implements event sourcing pattern:
 * - AC-1: events: V5Event[] as source of truth
 * - AC-2: gameState derived from events
 * - AC-3: startGame appends GAME_STARTED event
 * - AC-4: playCard appends CARD_PLAYED event
 * - AC-5: resolveObjection appends OBJECTION_RESOLVED event
 * - AC-6: getVerdict returns VerdictData
 * - AC-7: deriveV5State is deterministic
 * - AC-8: V5Event type exported
 * - EC-1: Empty events returns null state
 * - EC-2: Only GAME_STARTED returns initial state
 * - EC-3: reset() clears events
 * - ERR-1: Invalid cardId not appended
 * - ERR-2: Game over prevents play
 */
export const useGameStore = create<GameStore>((set, get) => ({
  events: [],
  gameState: null,
  currentPuzzle: null,
  currentConfig: DEFAULT_CONFIG,

  startGame: (puzzleSlug, config = DEFAULT_CONFIG, seed = Date.now()) => {
    const puzzle = PUZZLE_MAP.get(puzzleSlug);
    if (!puzzle) {
      console.error(`Puzzle not found: ${puzzleSlug}`);
      return;
    }

    const configKey: 'default' | 'easy' | 'hard' =
      config === DEFAULT_CONFIG ? 'default' : 'default';

    const event: GameStartedEvent = {
      type: 'GAME_STARTED',
      puzzleSlug,
      seed,
      configKey,
      timestamp: Date.now(),
    };

    const newEvents = [event];
    const gameState = deriveV5State(newEvents, PUZZLE_MAP);

    set({
      events: newEvents,
      gameState,
      currentPuzzle: puzzle,
      currentConfig: config,
    });
  },

  playCard: (cardId) => {
    const { events, currentPuzzle, currentConfig } = get();

    if (!currentPuzzle) {
      return {
        ok: false,
        error: { code: 'INVALID_STATE', message: 'No active game' },
      } as Result<TurnOutput, EngineError>;
    }

    // Derive current state to validate
    const currentState = deriveV5State(events, PUZZLE_MAP);
    if (!currentState) {
      return {
        ok: false,
        error: { code: 'INVALID_STATE', message: 'Invalid game state' },
      } as Result<TurnOutput, EngineError>;
    }

    // Check if game is over
    if (v5IsGameOver(currentState, currentConfig)) {
      return {
        ok: false,
        error: {
          code: 'GAME_OVER',
          message: `Game is over. Turns played: ${currentState.turnsPlayed}`,
        },
      } as Result<TurnOutput, EngineError>;
    }

    // Get start event for seed derivation
    const startEvent = events[0] as GameStartedEvent;
    const seedCounter = events.filter((e) => e.type === 'CARD_PLAYED').length + 1;
    const seed = startEvent.seed + seedCounter;

    // Validate card play before appending event
    const result = v5PlayCard(currentState, cardId, currentConfig, seed);

    if (!result.ok) {
      // Don't append event on error
      return result;
    }

    // Append event
    const event: CardPlayedEvent = {
      type: 'CARD_PLAYED',
      cardId,
      timestamp: Date.now(),
    };

    const newEvents = [...events, event];
    const gameState = deriveV5State(newEvents, PUZZLE_MAP);

    set({
      events: newEvents,
      gameState,
    });

    return result;
  },

  resolveObjection: (choice) => {
    const { events, currentPuzzle, currentConfig } = get();

    if (!currentPuzzle) {
      return {
        ok: false,
        error: { code: 'INVALID_STATE', message: 'No active game' },
      } as Result<ObjectionOutput, EngineError>;
    }

    // Derive current state
    const currentState = deriveV5State(events, PUZZLE_MAP);
    if (!currentState) {
      return {
        ok: false,
        error: { code: 'INVALID_STATE', message: 'Invalid game state' },
      } as Result<ObjectionOutput, EngineError>;
    }

    // Validate objection resolution
    const result = resolveObjectionState(currentState, choice, currentConfig);

    if (!result.ok) {
      return result;
    }

    // Append event
    const event: ObjectionResolvedEvent = {
      type: 'OBJECTION_RESOLVED',
      choice,
      timestamp: Date.now(),
    };

    const newEvents = [...events, event];
    const gameState = deriveV5State(newEvents, PUZZLE_MAP);

    set({
      events: newEvents,
      gameState,
    });

    return result;
  },

  getVerdict: () => {
    const { gameState, currentPuzzle, currentConfig } = get();

    if (!gameState || !currentPuzzle) {
      return null;
    }

    if (!v5IsGameOver(gameState, currentConfig)) {
      return null;
    }

    return v5GetVerdict(gameState, currentPuzzle, currentConfig);
  },

  isGameOver: () => {
    const { gameState, currentConfig } = get();

    if (!gameState) {
      return false;
    }

    return v5IsGameOver(gameState, currentConfig);
  },

  shouldShowObjection: () => {
    const { gameState, currentConfig } = get();

    if (!gameState) {
      return false;
    }

    // Objection happens after turn 2 (0-indexed: afterTurn = 1 means after turn 2)
    const isAfterObjectionTurn =
      currentConfig.objection.enabled &&
      gameState.turnsPlayed > currentConfig.objection.afterTurn;

    // Only show if not already resolved
    const notResolved = !gameState.objection?.resolved;

    return isAfterObjectionTurn && notResolved;
  },

  reset: () => {
    set({
      events: [],
      gameState: null,
      currentPuzzle: null,
      currentConfig: DEFAULT_CONFIG,
    });
  },

  loadEvents: (events) => {
    if (events.length === 0) {
      set({
        events: [],
        gameState: null,
        currentPuzzle: null,
        currentConfig: DEFAULT_CONFIG,
      });
      return;
    }

    const startEvent = events[0];
    if (startEvent?.type !== 'GAME_STARTED') {
      console.error('First event must be GAME_STARTED');
      return;
    }

    const puzzle = PUZZLE_MAP.get(startEvent.puzzleSlug);
    if (!puzzle) {
      console.error(`Puzzle not found: ${startEvent.puzzleSlug}`);
      return;
    }

    const config = getConfig(startEvent.configKey);
    const gameState = deriveV5State(events, PUZZLE_MAP);

    set({
      events,
      gameState,
      currentPuzzle: puzzle,
      currentConfig: config,
    });
  },
}));
