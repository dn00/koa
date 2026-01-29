/**
 * V5 Tier Calculation
 *
 * Pure function for determining game outcome tier based on
 * final belief vs target threshold.
 */

import type { Tier, GameConfig } from '../../types/v5/index.js';

/**
 * Determine the game outcome tier based on belief and target.
 *
 * Tiers are evaluated in order from best to worst:
 * 1. FLAWLESS - belief >= target + 5 (default)
 * 2. CLEARED - belief >= target
 * 3. CLOSE - belief >= target - 5 (default)
 * 4. BUSTED - belief < target - 5 (implicit)
 *
 * The exact thresholds are configurable via GameConfig.tiers functions.
 *
 * @param belief - Final belief score
 * @param target - Target belief threshold for the puzzle
 * @param config - Game configuration with tier threshold functions
 * @returns The tier classification: FLAWLESS, CLEARED, CLOSE, or BUSTED
 */
export function getTier(
  belief: number,
  target: number,
  config: GameConfig
): Tier {
  if (config.tiers.flawless(belief, target)) {
    return 'FLAWLESS';
  }
  if (config.tiers.cleared(belief, target)) {
    return 'CLEARED';
  }
  if (config.tiers.close(belief, target)) {
    return 'CLOSE';
  }
  return 'BUSTED';
}
