/**
 * Heist Kernel - Catch Reducers
 *
 * Handle CREW_CAUGHT and CLOSE_CALL events.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type { HeistState } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type { CrewCaughtPayload, CloseCallPayload } from '../events.js';

/**
 * Register catch reducers with the registry.
 */
export function registerCatchReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.CREW_CAUGHT, crewCaughtReducer);
  registry.register(HEIST_EVENTS.CLOSE_CALL, closeCallReducer);
}

/**
 * Handle CREW_CAUGHT event.
 */
function crewCaughtReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CrewCaughtPayload;

  // Set result to CAUGHT
  state.result = 'CAUGHT';
}

/**
 * Handle CLOSE_CALL event.
 */
function closeCallReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CloseCallPayload;

  // Close calls add heat but don't end the game
  state.heat += state.config.security.closeCallHeat;
}
