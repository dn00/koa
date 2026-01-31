/**
 * V5 Engine Core — Pure State & Logic Functions
 *
 * Task 007: Engine Core
 * Implements: R3.3, R3.5, R4.2, R4.4, R8.1, R8.2, R8.3
 *
 * All functions are pure: they take inputs and return outputs.
 * No console I/O, no file system operations, no mutation.
 */

import { ok, err, type Result } from '../../types/index.js';
import type {
  Card,
  GameState,
  GameConfig,
  V5Puzzle,
  Tier,
  TurnResult,
} from '../../types/v5/index.js';
import { scoreCard, checkTypeTax } from './scoring.js';
import { getTier } from './tier.js';

// ============================================================================
// Error Types
// ============================================================================

/**
 * Engine error codes and messages
 */
export interface EngineError {
  readonly code: 'CARD_NOT_IN_HAND' | 'GAME_OVER' | 'INVALID_STATE' | 'OBJECTION_INVALID';
  readonly message: string;
}

// ============================================================================
// Output Types
// ============================================================================

/**
 * Result of playing a card
 */
export interface TurnOutput {
  readonly state: GameState;
  readonly beliefChange: number;
  readonly wasLie: boolean;
  readonly typeTaxApplied: boolean;
  readonly card: Card;
  readonly narration: string;
  readonly koaResponse: string;
}

/**
 * Result of resolving an objection
 */
export interface ObjectionOutput {
  readonly state: GameState;
  readonly beliefChange: number;
  readonly choice: 'stood_by' | 'withdrawn';
  readonly wasLie: boolean;
}

/**
 * Penalty summary for verdict screen
 */
export interface PenaltySummary {
  /** Number of times type tax was applied */
  readonly typeTaxCount: number;
  /** Total penalty points from type tax */
  readonly typeTaxTotal: number;
  /** Which turns had type tax applied (1-indexed) */
  readonly typeTaxTurns: readonly number[];
}

/**
 * Final verdict data at end of game
 */
export interface VerdictData {
  readonly tier: Tier;
  readonly beliefFinal: number;
  readonly beliefTarget: number;
  readonly koaLine: string;
  readonly playedCards: ReadonlyArray<{
    readonly card: Card;
    readonly wasLie: boolean;
    readonly contradictionReason?: string;
  }>;
  /** Penalty summary (type tax, etc.) */
  readonly penalties: PenaltySummary;
}

// ============================================================================
// State Creation
// ============================================================================

/**
 * Create initial game state from puzzle and config.
 * Pure function - no side effects.
 *
 * @param puzzle - The V5 puzzle to play
 * @param config - Game configuration
 * @returns Initial game state
 */
export function createGameState(puzzle: V5Puzzle, config: GameConfig): GameState {
  return {
    belief: config.startingBelief,
    hand: [...puzzle.cards], // Copy to avoid mutation
    played: [],
    turnResults: [],
    turnsPlayed: 0,
    objection: null,
  };
}

// ============================================================================
// Card Playing
// ============================================================================

/**
 * Play a card from hand.
 * Pure function - returns new state, does not mutate input.
 *
 * @param state - Current game state
 * @param cardId - ID of card to play
 * @param config - Game configuration
 * @param _seed - Random seed for dialogue selection (unused in engine-core, for future use)
 * @returns Result with TurnOutput on success, EngineError on failure
 */
export function playCard(
  state: GameState,
  cardId: string,
  config: GameConfig,
  _seed: number
): Result<TurnOutput, EngineError> {
  // Validate: game not over
  if (state.turnsPlayed >= config.turnsPerGame) {
    return err({
      code: 'GAME_OVER',
      message: `Game is over. Turns played: ${state.turnsPlayed}`,
    });
  }

  // Validate: card in hand
  const card = state.hand.find(c => c.id === cardId);
  if (!card) {
    return err({
      code: 'CARD_NOT_IN_HAND',
      message: `Card ${cardId || '(empty)'} not found in hand`,
    });
  }

  // Get previous card for type tax check
  const previousCard = state.played.length > 0 ? state.played[state.played.length - 1] ?? null : null;
  const typeTaxApplied = checkTypeTax(card, previousCard, config);

  // Calculate scoring
  const { beliefChange, wasLie } = scoreCard(card, config, typeTaxApplied);

  // Calculate new belief
  const newBelief = state.belief + beliefChange;

  // Build turn result
  const turnResult: TurnResult = {
    card,
    beliefChange,
    wasLie,
    typeTaxApplied,
    narration: '', // Engine-core doesn't handle dialogue
    koaResponse: '', // Engine-core doesn't handle dialogue
  };

  // Build new state (immutable)
  const newState: GameState = {
    belief: newBelief,
    hand: state.hand.filter(c => c.id !== cardId),
    played: [...state.played, card],
    turnResults: [...state.turnResults, turnResult],
    turnsPlayed: state.turnsPlayed + 1,
    objection: state.objection,
  };

  return ok({
    state: newState,
    beliefChange,
    wasLie,
    typeTaxApplied,
    card,
    narration: '',
    koaResponse: '',
  });
}

// ============================================================================
// Objection Handling
// ============================================================================

/**
 * Resolve player's objection choice on game state.
 * Pure function - returns new state with objection resolved.
 *
 * Note: This is the full state version that updates GameState.
 * For pure objection logic, use functions from objection.ts.
 *
 * @param state - Current state (must have 1+ cards played)
 * @param choice - Player's choice: stand by or withdraw
 * @param config - Game configuration
 * @returns Result with ObjectionOutput on success, EngineError on failure
 */
export function resolveObjectionState(
  state: GameState,
  choice: 'stood_by' | 'withdrawn',
  config: GameConfig
): Result<ObjectionOutput, EngineError> {
  // Get last played card
  const lastCard = state.played[state.played.length - 1];
  if (!lastCard) {
    return err({
      code: 'OBJECTION_INVALID',
      message: 'No card to challenge',
    });
  }

  const wasLie = lastCard.isLie;

  // Calculate belief change based on choice and truth/lie
  let beliefChange: number;
  if (choice === 'stood_by') {
    beliefChange = wasLie ? config.objection.stoodByLie : config.objection.stoodByTruth;
  } else {
    beliefChange = config.objection.withdrew;
  }

  const newBelief = state.belief + beliefChange;

  const newState: GameState = {
    ...state,
    belief: newBelief,
    objection: {
      challengedCard: lastCard,
      resolved: true,
      result: choice,
      beliefChange,
    },
  };

  return ok({
    state: newState,
    beliefChange,
    choice,
    wasLie,
  });
}

// ============================================================================
// Game End & Verdict
// ============================================================================

/**
 * Check if game is over.
 *
 * @param state - Current game state
 * @param config - Game configuration
 * @returns true if turns exhausted
 */
export function isGameOver(state: GameState, config: GameConfig): boolean {
  return state.turnsPlayed >= config.turnsPerGame;
}

/**
 * Get the verdict bark based on lies played.
 * Uses liesRevealed if available, falls back to tier-based verdict.
 *
 * @param puzzle - The puzzle being played
 * @param played - Cards that were played
 * @param tier - Final tier achieved
 * @returns The KOA bark text
 */
function getVerdictBark(
  puzzle: V5Puzzle,
  played: readonly Card[],
  tier: Tier
): string {
  const liesPlayed = played.filter(c => c.isLie);
  const tierKey = tier.toLowerCase() as keyof typeof puzzle.verdicts;

  // No lies → use tier-based verdict
  if (liesPlayed.length === 0) {
    return puzzle.verdicts[tierKey];
  }

  // Determine lie key based on count
  let lieKey: string;
  if (liesPlayed.length === 1 && liesPlayed[0]) {
    lieKey = liesPlayed[0].id;
  } else if (liesPlayed.length === 2) {
    lieKey = 'multiple';
  } else {
    lieKey = 'all';
  }

  // Try liesRevealed, fallback to tier-based verdict
  const bark = puzzle.koaBarks.liesRevealed?.[lieKey]?.[0];
  return bark ?? puzzle.verdicts[tierKey];
}

/**
 * Calculate final verdict.
 * Pure function - computes tier and verdict data.
 *
 * @param state - Final game state
 * @param puzzle - The puzzle being played
 * @param config - Game configuration
 * @returns Verdict data with tier, scores, and played card info
 */
export function getVerdict(
  state: GameState,
  puzzle: V5Puzzle,
  config: GameConfig
): VerdictData {
  const tier = getTier(state.belief, puzzle.target, config);

  // Get verdict bark based on lies played (uses liesRevealed if available)
  const koaLine = getVerdictBark(puzzle, state.played, tier);

  // Build played cards with lie info
  const playedCards = state.played.map(card => {
    const lieInfo = puzzle.lies.find(l => l.cardId === card.id);
    return {
      card,
      wasLie: card.isLie,
      contradictionReason: lieInfo?.reason,
    };
  });

  // Calculate penalty summary from turn results
  const typeTaxTurns: number[] = [];
  state.turnResults.forEach((result, index) => {
    if (result.typeTaxApplied) {
      typeTaxTurns.push(index + 1); // 1-indexed turns
    }
  });

  const penalties: PenaltySummary = {
    typeTaxCount: typeTaxTurns.length,
    typeTaxTotal: typeTaxTurns.length * config.typeTax.penalty,
    typeTaxTurns,
  };

  return {
    tier,
    beliefFinal: state.belief,
    beliefTarget: puzzle.target,
    koaLine,
    playedCards,
    penalties,
  };
}
