/**
 * Heist Kernel - Crew Movement System
 *
 * Moves crew along their paths and transitions states.
 * Per Task 009: Emits footstep noise with stance modifier.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type {
  Entity,
  PositionComponent,
  CrewComponent,
  ObjectiveComponent,
  CrewStance,
} from '../types.js';
import { vecEq } from '../types.js';
import { HEIST_EVENTS } from '../events.js';

/** Base noise level for footsteps */
const BASE_FOOTSTEP_NOISE = 20;

/**
 * Get noise multiplier based on crew stance.
 * Per Task 009: SNEAK = 0.5, SPRINT = 2.0, NORMAL = 1.0
 */
function getStanceNoiseMultiplier(
  stance: CrewStance | undefined,
  stanceConfig: { sneak: { noiseMultiplier: number }; sprint: { noiseMultiplier: number } } | undefined
): number {
  if (!stance || !stanceConfig) return 1.0;

  switch (stance) {
    case 'SNEAK':
      return stanceConfig.sneak.noiseMultiplier;
    case 'SPRINT':
      return stanceConfig.sprint.noiseMultiplier;
    case 'NORMAL':
    default:
      return 1.0;
  }
}

/**
 * Crew movement system - moves crew agents along their paths.
 */
export const crewMovementSystem: SystemDefinition = {
  systemId: 'heist.crew_movement',
  priority: 20, // After vision
  run(ctx: SystemContext) {
    const crew = ctx.getEntitiesByType('crew');

    for (const agent of crew) {
      const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
      const posComp = agent.components['heist.position'] as PositionComponent | undefined;

      if (!crewComp || !posComp) continue;

      // Only move if MOVING state and has a path
      if (crewComp.state !== 'MOVING' || crewComp.path.length === 0) continue;

      // Move one tile along path
      const nextPos = crewComp.path[0];

      ctx.proposeEvent(HEIST_EVENTS.ENTITY_MOVED, {
        entityId: agent.id,
        from: { ...posComp.pos },
        to: { ...nextPos },
      }, { system: 'crew_movement' });

      // Emit footstep noise with stance modifier (Task 009)
      const stanceNoiseMultiplier = getStanceNoiseMultiplier(
        crewComp.stance,
        ctx.config.stance
      );
      const footstepLoudness = Math.round(BASE_FOOTSTEP_NOISE * stanceNoiseMultiplier);

      if (footstepLoudness > 0) {
        ctx.proposeEvent(HEIST_EVENTS.NOISE_EMITTED, {
          sourceId: agent.id,
          pos: { ...nextPos },
          loudness: footstepLoudness,
          kind: 'FOOTSTEP',
        }, { system: 'crew_movement' });
      }

      // Check if reached destination (path will have only 1 element left)
      if (crewComp.path.length === 1) {
        // Determine next state
        const nextState = crewComp.currentObjective ? 'WORKING' : 'IDLE';

        ctx.proposeEvent(HEIST_EVENTS.CREW_STATE_CHANGED, {
          crewId: agent.id,
          from: 'MOVING',
          to: nextState,
        }, { system: 'crew_movement' });
      }
    }
  },
};
