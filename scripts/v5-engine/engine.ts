/**
 * V5 Engine Core — Pure State & Logic Functions
 *
 * All functions are pure: they take inputs and return outputs.
 * No console I/O, no file system operations.
 *
 * Uses existing v5-rules.ts for scoring calculations.
 */

import {
  scoreCard,
  checkTypeTax,
  getTier,
  shouldTriggerObjection,
  resolveObjection as resolveObjRules,
  detectAxis,
} from '../v5-rules.js';
import { stitchNarration, pickKoaLine, pickPuzzleBark } from '../v5-dialogue.js';
import type { Result } from './types.js';
import { ok, err } from './types.js';
import type {
  Card,
  GameState,
  GameConfig,
  V5Puzzle,
  Tier,
  TurnResult,
} from '../v5-types.js';

// ============================================================================
// Error Types
// ============================================================================

export interface EngineError {
  code: 'CARD_NOT_IN_HAND' | 'GAME_OVER' | 'INVALID_STATE' | 'OBJECTION_INVALID';
  message: string;
}

// ============================================================================
// Output Types
// ============================================================================

export interface TurnOutput {
  state: GameState;
  beliefChange: number;
  wasLie: boolean;
  typeTaxApplied: boolean;
  card: Card;
  narration: string;
  koaResponse: string;
}

export interface ObjectionOutput {
  state: GameState;
  beliefChange: number;
  choice: 'stood_by' | 'withdrawn';
  wasLie: boolean;
}

export interface VerdictData {
  tier: Tier;
  beliefFinal: number;
  beliefTarget: number;
  koaLine: string;
  playedCards: Array<{
    card: Card;
    wasLie: boolean;
    contradictionReason?: string;
  }>;
}

// ============================================================================
// State Creation
// ============================================================================

/**
 * Create initial game state from puzzle and config.
 * Pure function - no side effects.
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
 * @param state Current game state
 * @param cardId ID of card to play
 * @param config Game configuration
 * @param seed Random seed for dialogue selection
 * @returns Result with TurnOutput on success, EngineError on failure
 */
export function playCard(
  state: GameState,
  cardId: string,
  config: GameConfig,
  seed: number
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
      message: `Card ${cardId} not found in hand`,
    });
  }

  // Get previous card for type tax check
  const previousCard = state.played.length > 0 ? state.played[state.played.length - 1] : null;
  const typeTaxApplied = checkTypeTax(card, previousCard, config);

  // Calculate scoring
  const { beliefChange, wasLie } = scoreCard(card, config, typeTaxApplied);

  // Calculate new belief
  const newBelief = state.belief + beliefChange;

  // Build new state (immutable)
  const newState: GameState = {
    ...state,
    belief: newBelief,
    hand: state.hand.filter(c => c.id !== cardId),
    played: [...state.played, card],
    turnsPlayed: state.turnsPlayed + 1,
    turnResults: [
      ...state.turnResults,
      {
        card,
        beliefChange,
        wasLie,
        typeTaxApplied,
        narration: '', // Will be filled below
        koaResponse: '', // Will be filled below
      },
    ],
  };

  // Generate narration and dialogue
  const turnNum = newState.turnsPlayed;
  const narration = stitchNarration(card, previousCard, turnNum, seed);

  // Detect axis for KOA response
  const { axis, valence, intensity } = detectAxis(card, state.played, wasLie, typeTaxApplied);
  const koaResponse = pickKoaLine('AFTER_PLAY', axis, valence, intensity, seed, {
    location: card.location,
  });

  // Update turn result with narration
  newState.turnResults[newState.turnResults.length - 1] = {
    ...newState.turnResults[newState.turnResults.length - 1],
    narration,
    koaResponse,
  };

  return ok({
    state: newState,
    beliefChange,
    wasLie,
    typeTaxApplied,
    card,
    narration,
    koaResponse,
  });
}

// ============================================================================
// Objection Handling
// ============================================================================

/**
 * Check if objection should be processed this turn.
 */
export function shouldProcessObjection(turnsPlayed: number, config: GameConfig): boolean {
  return shouldTriggerObjection(turnsPlayed, config);
}

/**
 * Resolve player's objection choice.
 * Pure function - returns new state with objection resolved.
 *
 * @param state Current state (must have 2+ cards played)
 * @param choice Player's choice: stand by or withdraw
 * @param config Game configuration
 */
export function resolveObjection(
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
  const beliefChange = resolveObjRules(wasLie, choice, config);
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

/**
 * Auto-resolve objection for Mini mode.
 * KOA "knows" the truth and makes optimal risk-neutral choice.
 *
 * - Truth card: stand by (+2 is better than -2)
 * - Lie card: withdraw (-2 is better than -4)
 */
export function autoResolveObjection(
  card: Card,
  config: GameConfig
): { choice: 'stood_by' | 'withdrawn'; beliefChange: number } {
  if (card.isLie) {
    // Optimal for lie: withdraw (-2 > -4)
    return {
      choice: 'withdrawn',
      beliefChange: config.objection.withdrew,
    };
  } else {
    // Optimal for truth: stand by (+2 > -2)
    return {
      choice: 'stood_by',
      beliefChange: config.objection.stoodByTruth,
    };
  }
}

// ============================================================================
// Game End & Verdict
// ============================================================================

/**
 * Check if game is over.
 */
export function isGameOver(state: GameState, config: GameConfig): boolean {
  return state.turnsPlayed >= config.turnsPerGame;
}

/**
 * Calculate final verdict.
 * Pure function - computes tier and verdict data.
 */
export function getVerdict(
  state: GameState,
  puzzle: V5Puzzle,
  config: GameConfig
): VerdictData {
  const tier = getTier(state.belief, puzzle.target, config);

  // Get verdict line from puzzle
  const koaLine = puzzle.verdicts[tier.toLowerCase() as keyof typeof puzzle.verdicts];

  // Build played cards with lie info
  const playedCards = state.played.map(card => {
    const lieInfo = puzzle.lies.find(l => l.cardId === card.id);
    return {
      card,
      wasLie: card.isLie,
      contradictionReason: lieInfo?.reason,
    };
  });

  return {
    tier,
    beliefFinal: state.belief,
    beliefTarget: puzzle.target,
    koaLine,
    playedCards,
  };
}
