/**
 * V5 Objection System
 *
 * Pure functions for the objection mechanic where KOA challenges
 * the last played card after a configured turn.
 */

import type { Card, GameConfig } from '../../types/v5/index.js';

/**
 * Player's choice when facing an objection.
 */
export type ObjectionChoice = 'stood_by' | 'withdrawn';

/**
 * Result of auto-resolving an objection (Mini mode).
 */
export interface AutoResolveResult {
  /** The optimal choice made by KOA */
  readonly choice: ObjectionChoice;
  /** Resulting belief change */
  readonly beliefChange: number;
}

/**
 * Check if an objection should trigger based on turns played.
 *
 * Objection triggers exactly once, on the turn after the configured afterTurn.
 * For example, with afterTurn=1, objection triggers when turnsPlayed=2.
 *
 * @param turnsPlayed - Number of turns completed
 * @param config - Game configuration with objection settings
 * @returns True if objection should trigger this turn
 */
export function shouldTriggerObjection(
  turnsPlayed: number,
  config: GameConfig
): boolean {
  return config.objection.enabled && turnsPlayed === config.objection.afterTurn + 1;
}

/**
 * Calculate belief change from objection resolution.
 *
 * - Standing by a truth: gains configured stoodByTruth bonus
 * - Standing by a lie: loses configured stoodByLie penalty
 * - Withdrawing: loses configured withdrew penalty (regardless of truth/lie)
 *
 * @param wasLie - Whether the challenged card was a lie
 * @param choice - Player's choice: 'stood_by' or 'withdrawn'
 * @param config - Game configuration with objection values
 * @returns Belief change (positive or negative)
 */
export function resolveObjection(
  wasLie: boolean,
  choice: ObjectionChoice,
  config: GameConfig
): number {
  if (choice === 'stood_by') {
    return wasLie ? config.objection.stoodByLie : config.objection.stoodByTruth;
  }
  return config.objection.withdrew;
}

/**
 * Auto-resolve an objection making the optimal choice.
 *
 * Used in Mini mode where KOA "knows" the truth and makes
 * the best choice for the player:
 * - Truth: stand by (+2 is better than -2)
 * - Lie: withdraw (-2 is better than -4)
 *
 * @param card - The card being challenged
 * @param config - Game configuration with objection values
 * @returns AutoResolveResult with optimal choice and belief change
 */
export function autoResolveObjection(
  card: Card,
  config: GameConfig
): AutoResolveResult {
  const wasLie = card.isLie;

  if (wasLie) {
    // Lie: withdraw is always better than standing by a lie
    return {
      choice: 'withdrawn',
      beliefChange: config.objection.withdrew,
    };
  }

  // Truth: standing by is always better than withdrawing
  return {
    choice: 'stood_by',
    beliefChange: config.objection.stoodByTruth,
  };
}
