/**
 * Heist Kernel - Heat Threshold System (Task 002 - heat-thresholds feature)
 *
 * Monitors heat and emits HEAT_THRESHOLD_CROSSED events when thresholds are crossed.
 * This enables auto-pause, forensics, and rule triggers.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type { HeatLevel } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import { computeHeatLevel } from '../utils/heat.js';

/**
 * Heat threshold system - monitors heat and emits crossing events.
 *
 * IMPORTANT: Heat is incremented in heist-kernel.ts AFTER reducers run.
 * This system runs BEFORE heat increment, so we check (state.heat + 1)
 * to detect threshold crossing that will happen this tick.
 */
export const heatThresholdSystem: SystemDefinition = {
  systemId: 'heist.heat_threshold',
  priority: 95, // After most systems, before outcome
  run(ctx: SystemContext) {
    const state = ctx.state;

    // Skip if game already ended
    if (state.result) return;

    // Skip if heatThresholds not configured (defensive for tests with partial config)
    if (!ctx.config.heatThresholds) return;

    const currentLevel = state.heatLevel;

    // Heat will be incremented by 1 after this tick (in heist-kernel.ts post-step)
    // So check what level we'll be at AFTER the increment
    const heatAfterIncrement = state.heat + 1;
    const newLevel = computeHeatLevel(heatAfterIncrement, ctx.config);

    // Only emit if level will increase (thresholds only fire once)
    if (newLevel > currentLevel) {
      // Determine which threshold will be crossed
      const thresholds = [
        ctx.config.heatThresholds.level1Threshold,
        ctx.config.heatThresholds.level2Threshold,
        ctx.config.heatThresholds.level3Threshold,
      ];
      const crossedThreshold = thresholds[newLevel - 1];

      ctx.proposeEvent(HEIST_EVENTS.HEAT_THRESHOLD_CROSSED, {
        previousLevel: currentLevel,
        newLevel,
        heat: heatAfterIncrement,
        threshold: crossedThreshold,
      }, { system: 'heat_threshold' });
    }
  },
};
