/**
 * Heist Kernel - Objectives System
 *
 * Handles objective progress when crew is working.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type {
  Entity,
  PositionComponent,
  CrewComponent,
  ObjectiveComponent,
} from '../types.js';
import { vecEq } from '../types.js';
import { HEIST_EVENTS } from '../events.js';

/**
 * Objectives system - progresses objectives when crew is working.
 */
export const objectivesSystem: SystemDefinition = {
  systemId: 'heist.objectives',
  priority: 30, // After movement
  run(ctx: SystemContext) {
    const crew = ctx.getEntitiesByType('crew');
    const objectives = ctx.getEntitiesByType('objective');
    const config = ctx.config.crew;

    for (const agent of crew) {
      const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
      const crewPos = agent.components['heist.position'] as PositionComponent | undefined;

      if (!crewComp || !crewPos) continue;

      // Only progress if crew is WORKING
      if (crewComp.state !== 'WORKING') continue;

      // Find objective at crew's position
      for (const obj of objectives) {
        const objComp = obj.components['heist.objective'] as ObjectiveComponent | undefined;
        const objPos = obj.components['heist.position'] as PositionComponent | undefined;

        if (!objComp || !objPos) continue;

        // Skip if not at same position
        if (!vecEq(crewPos.pos, objPos.pos)) continue;

        // Skip if not ACTIVE
        if (objComp.state !== 'ACTIVE') continue;

        // Progress the objective
        const prevProgress = objComp.progress;
        const newProgress = prevProgress + config.workProgressPerTick;

        ctx.proposeEvent(HEIST_EVENTS.OBJECTIVE_PROGRESS, {
          objectiveId: obj.id,
          crewId: agent.id,
          progress: newProgress,
          milestone: getMilestone(prevProgress, newProgress),
        }, { system: 'objectives' });

        // Check for completion
        if (newProgress >= 100) {
          ctx.proposeEvent(HEIST_EVENTS.OBJECTIVE_COMPLETE, {
            objectiveId: obj.id,
            crewId: agent.id,
          }, { system: 'objectives' });
        }
      }
    }
  },
};

/**
 * Get milestone if one was crossed.
 */
function getMilestone(prevProgress: number, newProgress: number): number | undefined {
  const milestones = [25, 50, 75];
  for (const milestone of milestones) {
    if (prevProgress < milestone && newProgress >= milestone) {
      return milestone;
    }
  }
  return undefined;
}
