/**
 * V5 Scoring Functions
 *
 * Pure functions for calculating belief changes based on card properties.
 * Implements scoring rules and type tax mechanics.
 */

import type { Card, GameConfig } from '../../types/v5/index.js';

/**
 * Result of scoring a card play.
 */
export interface ScoringResult {
  /** Change in belief score (positive or negative) */
  readonly beliefChange: number;
  /** Whether the played card was a lie */
  readonly wasLie: boolean;
}

/**
 * Calculate belief change for playing a card.
 *
 * - Truth cards gain belief equal to their strength
 * - Lie cards lose belief based on strength (typically strength - 1)
 * - Type tax penalty is applied if active and enabled
 *
 * @param card - The card being played
 * @param config - Game configuration with scoring rules
 * @param typeTaxActive - Whether type tax penalty should be applied
 * @returns ScoringResult with belief change and lie status
 */
export function scoreCard(
  card: Card,
  config: GameConfig,
  typeTaxActive: boolean
): ScoringResult {
  const wasLie = card.isLie;
  let beliefChange: number;

  if (wasLie) {
    beliefChange = config.scoring.lie(card.strength);
  } else {
    beliefChange = config.scoring.truth(card.strength);
  }

  // Apply type tax penalty if active and enabled
  if (typeTaxActive && config.typeTax.enabled) {
    beliefChange += config.typeTax.penalty;
  }

  return { beliefChange, wasLie };
}

/**
 * Check if type tax should be applied for playing a card.
 *
 * Type tax triggers when playing the same evidence type consecutively.
 * Returns false if:
 * - Type tax is disabled in config
 * - No previous card was played (first turn)
 * - Evidence types differ
 *
 * @param currentCard - The card being played
 * @param previousCard - The previously played card, or null
 * @param config - Game configuration with type tax settings
 * @returns True if type tax should be applied
 */
export function checkTypeTax(
  currentCard: Card,
  previousCard: Card | null,
  config: GameConfig
): boolean {
  if (!config.typeTax.enabled || !previousCard) {
    return false;
  }
  return currentCard.evidenceType === previousCard.evidenceType;
}
