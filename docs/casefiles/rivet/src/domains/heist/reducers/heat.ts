/**
 * Heist Kernel - Heat Threshold Reducers (Task 003 - heat-thresholds feature)
 *
 * Handle HEAT_THRESHOLD_CROSSED event to update state.heatLevel and trigger auto-pause.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type { HeistState, HeatLevel } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type { HeatThresholdCrossedPayload } from '../events.js';

/**
 * Register heat reducers with the registry.
 */
export function registerHeatReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.HEAT_THRESHOLD_CROSSED, heatThresholdCrossedReducer);
}

/**
 * Clamp heat level to valid range 0-3 (defensive).
 */
function clampHeatLevel(level: number): HeatLevel {
  if (level < 0) return 0;
  if (level > 3) return 3;
  return level as HeatLevel;
}

/**
 * Reducer for HEAT_THRESHOLD_CROSSED event.
 * Updates heatLevel and triggers auto-pause.
 */
function heatThresholdCrossedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as HeatThresholdCrossedPayload;

  // Update heat level (with defensive clamp)
  state.heatLevel = clampHeatLevel(payload.newLevel);

  // Trigger auto-pause per spec section 6.1
  state.shouldPause = true;
  state.pauseReason = `Heat crossed ${payload.threshold} (level ${payload.newLevel})`;
}
