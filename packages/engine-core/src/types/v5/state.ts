/**
 * V5 Game State Types
 * GameState, TurnResult, ObjectionState
 */

import type { Card } from './card.js';

/**
 * Result of a single turn in the game.
 * Tracks what happened when a card was played.
 */
export interface TurnResult {
  /** The card that was played */
  readonly card: Card;

  /** Change in belief score (positive or negative) */
  readonly beliefChange: number;

  /** Whether the played card was a lie */
  readonly wasLie: boolean;

  /** Whether type tax penalty was applied this turn */
  readonly typeTaxApplied: boolean;

  /** Player's narration (presentLine from card) */
  readonly narration: string;

  /** KOA's response to this play */
  readonly koaResponse: string;
}

/**
 * State of an objection challenge.
 * After turn 2, KOA may challenge the last played card.
 */
export interface ObjectionState {
  /** The card being challenged (null if no card challenged) */
  readonly challengedCard: Card | null;

  /** Whether the objection has been resolved */
  readonly resolved: boolean;

  /** Player's choice: 'stood_by', 'withdrawn', or null if unresolved */
  readonly result: 'stood_by' | 'withdrawn' | null;

  /** Belief change from objection resolution */
  readonly beliefChange: number;
}

/**
 * Complete game state for a V5 puzzle run.
 * Tracks belief score, cards, and turn history.
 */
export interface GameState {
  /** Current belief score */
  readonly belief: number;

  /** Cards in the player's hand (not yet played) */
  readonly hand: readonly Card[];

  /** Cards that have been played */
  readonly played: readonly Card[];

  /** History of turn results */
  readonly turnResults: readonly TurnResult[];

  /** Number of turns completed */
  readonly turnsPlayed: number;

  /** Current objection state, if any */
  readonly objection: ObjectionState | null;
}
