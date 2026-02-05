/**
 * Heist Kernel - Catch System
 *
 * Handles guard catching crew members.
 * Catch requires ALARM+ alert level and same tile.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type { PositionComponent, GuardComponent, CrewComponent } from '../types.js';
import { manhattan, vecEq, alertGte } from '../types.js';
import { HEIST_EVENTS } from '../events.js';

/**
 * Catch system - checks for guard-crew adjacency and catch conditions.
 */
export const catchSystem: SystemDefinition = {
  systemId: 'heist.catch',
  priority: 50, // After alert
  run(ctx: SystemContext) {
    const state = ctx.state;
    const guards = ctx.getEntitiesByType('guard');
    const crew = ctx.getEntitiesByType('crew');

    // Only catch if alert is at ALARM or higher
    if (!alertGte(state.alert.level, 'ALARM')) {
      // Can still have close calls during SUSPICIOUS
      if (alertGte(state.alert.level, 'SUSPICIOUS')) {
        checkCloseCall(ctx, guards, crew);
      }
      return;
    }

    for (const guard of guards) {
      const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
      const guardPos = guard.components['heist.position'] as PositionComponent | undefined;

      if (!guardComp || !guardPos) continue;

      // Only pursuing guards can catch
      if (guardComp.state !== 'PURSUE') continue;

      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        const crewPos = agent.components['heist.position'] as PositionComponent | undefined;

        if (!crewComp || !crewPos) continue;

        const dist = manhattan(guardPos.pos, crewPos.pos);

        // Same tile = caught
        if (dist === 0) {
          ctx.proposeEvent(HEIST_EVENTS.CREW_CAUGHT, {
            crewId: agent.id,
            guardId: guard.id,
            pos: { ...crewPos.pos },
          }, { system: 'catch' });
        } else if (dist === 1) {
          // Adjacent - close call if crew is moving, caught if stationary
          if (crewComp.state === 'MOVING' && crewComp.path.length > 0) {
            ctx.proposeEvent(HEIST_EVENTS.CLOSE_CALL, {
              crewId: agent.id,
              guardId: guard.id,
              pos: { ...crewPos.pos },
            }, { system: 'catch' });
          } else {
            // Stationary and adjacent during pursuit = caught
            ctx.proposeEvent(HEIST_EVENTS.CREW_CAUGHT, {
              crewId: agent.id,
              guardId: guard.id,
              pos: { ...crewPos.pos },
            }, { system: 'catch' });
          }
        }
      }
    }
  },
};

/**
 * Check for close calls during SUSPICIOUS (before ALARM)
 */
function checkCloseCall(
  ctx: SystemContext,
  guards: ReturnType<SystemContext['getEntitiesByType']>,
  crew: ReturnType<SystemContext['getEntitiesByType']>
): void {
  for (const guard of guards) {
    const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
    const guardPos = guard.components['heist.position'] as PositionComponent | undefined;

    if (!guardComp || !guardPos) continue;
    if (guardComp.state !== 'PURSUE') continue;

    for (const agent of crew) {
      const crewPos = agent.components['heist.position'] as PositionComponent | undefined;
      if (!crewPos) continue;

      const dist = manhattan(guardPos.pos, crewPos.pos);

      if (dist <= 1) {
        ctx.proposeEvent(HEIST_EVENTS.CLOSE_CALL, {
          crewId: agent.id,
          guardId: guard.id,
          pos: { ...crewPos.pos },
        }, { system: 'catch' });
      }
    }
  }
}
