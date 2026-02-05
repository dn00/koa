/**
 * Heist Kernel - Door System (Task 005)
 *
 * Handles door toggle interactions where crew can open/close doors.
 * Emits DOOR_TOGGLED and NOISE_EMITTED events.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type {
  CrewComponent,
  PositionComponent,
  Vec2,
  DoorId,
} from '../types.js';
import { manhattan } from '../types.js';
import { HEIST_EVENTS } from '../events.js';

/**
 * Check if two positions are adjacent (manhattan distance <= 1).
 */
function isAdjacent(a: Vec2, b: Vec2): boolean {
  return manhattan(a, b) <= 1;
}

/**
 * Door system - handles crew door interactions.
 *
 * Runs after crew behavior but before movement to process pending door toggles.
 */
export const doorSystem: SystemDefinition = {
  systemId: 'heist.doors',
  priority: 18, // After crew behavior, before movement
  run(ctx: SystemContext) {
    const state = ctx.state;
    const crew = ctx.getEntitiesByType('crew');
    const doorConfig = ctx.config.doors;

    // Track which doors have been toggled this tick to prevent double toggle
    const toggledDoors = new Set<DoorId>();

    for (const agent of crew) {
      const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
      const posComp = agent.components['heist.position'] as PositionComponent | undefined;

      if (!crewComp || !posComp) continue;

      // Check if crew has pending door interaction
      if (!crewComp.pendingDoorToggle) continue;

      const doorId = crewComp.pendingDoorToggle;

      // Skip if already toggled this tick
      if (toggledDoors.has(doorId)) continue;

      const door = state.doors[doorId];

      // Skip if door doesn't exist
      if (!door) continue;

      // Skip if not adjacent
      if (!isAdjacent(posComp.pos, door.pos)) continue;

      // Determine new state
      const newState = door.isOpen ? 'CLOSED' : 'OPEN';

      // Mark as toggled
      toggledDoors.add(doorId);

      // Emit door toggled event
      ctx.proposeEvent(HEIST_EVENTS.DOOR_TOGGLED, {
        doorId,
        pos: { ...door.pos },
        newState,
        actorId: agent.id,
      }, { system: 'doors' });

      // Door toggle makes noise
      ctx.proposeEvent(HEIST_EVENTS.NOISE_EMITTED, {
        sourceId: agent.id,
        pos: { ...door.pos },
        loudness: doorConfig.toggleNoise,
        kind: 'DOOR',
      }, { system: 'doors' });
    }
  },
};
