/**
 * Heist Kernel - Stance Reducers (Task 004)
 *
 * Handle CREW_STANCE_CHANGED event to update crew stance.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type { HeistState, CrewComponent } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type { CrewStanceChangedPayload } from '../events.js';

/**
 * Register stance reducers with the registry.
 */
export function registerStanceReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.CREW_STANCE_CHANGED, crewStanceChangedReducer);
}

/**
 * Handle CREW_STANCE_CHANGED event.
 * Updates the crew's stance and clears pending stance.
 */
function crewStanceChangedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CrewStanceChangedPayload;
  const { crewId, to } = payload;

  const entity = state.entities[crewId];
  if (!entity) return;

  const crewComp = entity.components['heist.crew'] as CrewComponent | undefined;
  if (!crewComp) return;

  // Update stance
  crewComp.stance = to;

  // Clear pending stance
  delete crewComp.pendingStance;
}
