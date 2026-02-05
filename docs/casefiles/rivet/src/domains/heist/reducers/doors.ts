/**
 * Heist Kernel - Door Reducers (Task 005)
 *
 * Handle DOOR_TOGGLED event to update door state.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type { HeistState, CrewComponent, DoorId } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type { DoorToggledPayload } from '../events.js';

/**
 * Register door reducers with the registry.
 */
export function registerDoorReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.DOOR_TOGGLED, doorToggledReducer);
}

/**
 * Handle DOOR_TOGGLED event.
 * Updates the door's isOpen state and clears pending toggles from crew.
 */
function doorToggledReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as DoorToggledPayload;
  const { doorId, newState } = payload;

  const door = state.doors[doorId];
  if (!door) return;

  // Update door state
  door.isOpen = newState === 'OPEN';

  // Clear pending toggle from all crew targeting this door
  for (const entity of Object.values(state.entities)) {
    if (entity.type === 'crew') {
      const crewComp = entity.components['heist.crew'] as CrewComponent | undefined;
      if (crewComp && crewComp.pendingDoorToggle === doorId) {
        delete crewComp.pendingDoorToggle;
      }
    }
  }
}
