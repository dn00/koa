/**
 * Heist Kernel - Outcome Reducers
 *
 * Handle HEIST_WON and HEIST_LOST events.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type { HeistState } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type { HeistWonPayload, HeistLostPayload } from '../events.js';

/**
 * Register outcome reducers with the registry.
 */
export function registerOutcomeReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.HEIST_WON, heistWonReducer);
  registry.register(HEIST_EVENTS.HEIST_LOST, heistLostReducer);
}

/**
 * Handle HEIST_WON event.
 */
function heistWonReducer(state: HeistState, event: SimEvent): void {
  state.result = 'ESCAPED';
}

/**
 * Handle HEIST_LOST event.
 */
function heistLostReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as HeistLostPayload;

  if (payload.reason === 'CAUGHT') {
    state.result = 'CAUGHT';
  } else {
    state.result = 'TIMEOUT';
  }
}
