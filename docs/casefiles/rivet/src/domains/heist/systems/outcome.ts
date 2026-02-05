/**
 * Heist Kernel - Outcome System
 *
 * Checks for win/lose conditions.
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
 * Outcome system - runs last to check win/lose conditions.
 */
export const outcomeSystem: SystemDefinition = {
  systemId: 'heist.outcome',
  priority: 100, // Runs last
  run(ctx: SystemContext) {
    const state = ctx.state;

    // Already have an outcome
    if (state.result) return;

    // Check for TIMEOUT (heat >= max)
    if (state.heat >= ctx.config.maxHeat) {
      ctx.proposeEvent(HEIST_EVENTS.HEIST_LOST, {
        reason: 'TIMEOUT',
        finalHeat: state.heat,
        totalTicks: state.tickIndex,
      }, { system: 'outcome' });
      return;
    }

    // Check for extraction objective completion
    const objectives = ctx.getEntitiesByType('objective');
    const extractObj = objectives.find((obj) => {
      const objComp = obj.components['heist.objective'] as ObjectiveComponent | undefined;
      return objComp && obj.id.includes('extract');
    });

    if (extractObj) {
      const objComp = extractObj.components['heist.objective'] as ObjectiveComponent | undefined;
      if (objComp && objComp.state === 'DONE') {
        ctx.proposeEvent(HEIST_EVENTS.HEIST_WON, {
          finalHeat: state.heat,
          totalTicks: state.tickIndex,
        }, { system: 'outcome' });
        return;
      }
    }

    // Alternative win check: all crew at exit
    const crew = ctx.getEntitiesByType('crew');
    const exitPos = findExitPosition(ctx);

    if (exitPos && crew.length > 0) {
      const allAtExit = crew.every((agent) => {
        const pos = agent.components['heist.position'] as PositionComponent | undefined;
        return pos && vecEq(pos.pos, exitPos);
      });

      // Check if primary objectives are done
      const primaryDone = objectives.every((obj) => {
        const objComp = obj.components['heist.objective'] as ObjectiveComponent | undefined;
        if (!objComp) return true;
        if (obj.id.includes('extract')) return true; // Extract doesn't need to be pre-done
        return objComp.state === 'DONE';
      });

      if (allAtExit && primaryDone) {
        ctx.proposeEvent(HEIST_EVENTS.HEIST_WON, {
          finalHeat: state.heat,
          totalTicks: state.tickIndex,
        }, { system: 'outcome' });
      }
    }
  },
};

/**
 * Find exit position from map.
 */
function findExitPosition(ctx: SystemContext): { x: number; y: number } | null {
  const { tiles, width, height } = ctx.state.map;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y]?.[x] === 'EXIT') {
        return { x, y };
      }
    }
  }

  return null;
}
