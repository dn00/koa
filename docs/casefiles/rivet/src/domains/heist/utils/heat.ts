/**
 * Heat Threshold Utilities
 *
 * Provides functions for computing heat levels and retrieving effect multipliers.
 */

import type { HeatLevel, HeatLevelEffects, RuntimeConfig } from '../types.js';

/**
 * Get effect multiplier for current heat level.
 * Returns 1.0 for level 0 (no penalty).
 *
 * @param heatLevel - Current heat level (0-3)
 * @param effect - The effect multiplier to retrieve
 * @param config - Runtime config containing heat threshold settings
 * @returns The multiplier value for the specified effect at the given heat level
 */
export function getHeatEffectMultiplier(
  heatLevel: HeatLevel,
  effect: keyof HeatLevelEffects,
  config: RuntimeConfig
): number {
  if (heatLevel === 0) return 1.0;

  const levelConfig = heatLevel === 1
    ? config.heatThresholds.level1
    : heatLevel === 2
    ? config.heatThresholds.level2
    : config.heatThresholds.level3;

  return levelConfig[effect];
}

/**
 * Compute heat level from raw heat value.
 *
 * @param heat - Current heat value
 * @param config - Runtime config containing heat threshold settings
 * @returns Heat level (0-3) based on threshold values
 */
export function computeHeatLevel(heat: number, config: RuntimeConfig): HeatLevel {
  const { level3Threshold, level2Threshold, level1Threshold } = config.heatThresholds;
  if (heat >= level3Threshold) return 3;
  if (heat >= level2Threshold) return 2;
  if (heat >= level1Threshold) return 1;
  return 0;
}
