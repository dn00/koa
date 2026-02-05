/**
 * Heist Kernel - Stance System (Task 004)
 *
 * Handles crew stance changes and applies stance speed multipliers to movement.
 * Uses movement point accumulation for smooth fractional speeds.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type {
  CrewComponent,
  PositionComponent,
  CrewStance,
} from '../types.js';
import { HEIST_EVENTS } from '../events.js';

/**
 * Get speed multiplier for a stance.
 */
function getStanceSpeedMultiplier(
  stance: CrewStance,
  config: { sneak: { speedMultiplier: number }; sprint: { speedMultiplier: number } }
): number {
  switch (stance) {
    case 'SNEAK':
      return config.sneak.speedMultiplier;
    case 'SPRINT':
      return config.sprint.speedMultiplier;
    case 'NORMAL':
    default:
      return 1.0;
  }
}

/**
 * Stance system - handles stance changes and movement speed modulation.
 *
 * Runs after vision but before crew movement to:
 * 1. Process pending stance changes from SET_STANCE action
 * 2. Apply stance speed multiplier to movement using point accumulation
 */
export const stanceSystem: SystemDefinition = {
  systemId: 'heist.stance',
  priority: 15, // After vision (10), before crew movement (20)
  run(ctx: SystemContext) {
    const crew = ctx.getEntitiesByType('crew');
    const state = ctx.state;
    const stanceConfig = ctx.config.stance;

    for (const agent of crew) {
      const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
      const posComp = agent.components['heist.position'] as PositionComponent | undefined;

      if (!crewComp || !posComp) continue;

      // 1. Process pending stance changes
      if (crewComp.pendingStance && crewComp.pendingStance !== crewComp.stance) {
        ctx.proposeEvent(HEIST_EVENTS.CREW_STANCE_CHANGED, {
          crewId: agent.id,
          from: crewComp.stance,
          to: crewComp.pendingStance,
        }, { system: 'stance' });
      }

      // 2. Apply stance speed multiplier to movement
      // Only process if MOVING and has a path
      if (crewComp.state !== 'MOVING' || crewComp.path.length === 0) continue;

      const speedMultiplier = getStanceSpeedMultiplier(crewComp.stance, stanceConfig);

      // Initialize movePoints if not present
      if (crewComp.movePoints === undefined) {
        crewComp.movePoints = 0;
      }

      // Accumulate movement points
      crewComp.movePoints += speedMultiplier;

      // Move while we have enough points
      while (crewComp.movePoints >= 1.0 && crewComp.path.length > 0) {
        const nextPos = crewComp.path[0];
        if (!nextPos) break; // Guard against undefined

        ctx.proposeEvent(HEIST_EVENTS.ENTITY_MOVED, {
          entityId: agent.id,
          from: { ...posComp.pos },
          to: { x: nextPos.x, y: nextPos.y },
        }, { system: 'stance' });

        crewComp.movePoints -= 1.0;

        // Check if reached destination
        if (crewComp.path.length === 1) {
          const nextState = crewComp.currentObjective ? 'WORKING' : 'IDLE';
          ctx.proposeEvent(HEIST_EVENTS.CREW_STATE_CHANGED, {
            crewId: agent.id,
            from: 'MOVING',
            to: nextState,
          }, { system: 'stance' });
          break;
        }

        // Update position for next iteration (reducer will handle actual state)
        posComp.pos = { x: nextPos.x, y: nextPos.y };
        crewComp.path.shift();
      }
    }
  },
};
