/**
 * Heist Kernel - Noise Reducers
 *
 * Handle NOISE_EMITTED and NOISE_HEARD events.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type { HeistState, GuardComponent } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type { NoiseHeardPayload } from '../events.js';

/**
 * Register noise reducers with the registry.
 */
export function registerNoiseReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.NOISE_HEARD, noiseHeardReducer);
  // NOISE_EMITTED is informational only, no state change needed
}

/**
 * Handle NOISE_HEARD event.
 * Makes guards investigate the noise source.
 */
function noiseHeardReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as NoiseHeardPayload;
  const { guardId, sourcePos } = payload;

  const guard = state.entities[guardId];
  if (!guard) return;

  const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
  if (!guardComp) return;

  // Only react if in PATROL state (not already investigating/pursuing)
  if (guardComp.state === 'PATROL') {
    guardComp.state = 'INVESTIGATE';
    guardComp.alertTarget = { ...sourcePos };
  }
}
