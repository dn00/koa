/**
 * Heist Kernel - Crew Behavior System
 *
 * Gives crew default behavior when no rule overrides.
 * Drives crew toward active objectives and manages work state.
 * Applies Director Stance effects (per specss.md Section 8.2).
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type {
  Entity,
  PositionComponent,
  CrewComponent,
  ObjectiveComponent,
  Vec2,
} from '../types.js';
import { vecEq, alertGte } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import { findPath, findNearestCover } from '../utils/pathfinding.js';
import type { DirectorStance } from '../rules-types.js';
import { getHideSpeedMultiplier } from '../utils/modules.js';
import { getHeatEffectMultiplier } from '../utils/heat.js';

/** Base hide progress per tick (without modules) */
const BASE_HIDE_PROGRESS = 25; // 4 ticks to fully hide at base rate

/**
 * Crew behavior system - runs before crew-movement to set up paths/states.
 * Applies Director Stance effects (per specss.md Section 8.2):
 * - SAFE: Crew prefers cover/hide over objective progress
 * - COMMIT: Crew continues working even when spotted
 * - ABORT: Crew immediately heads to exit, ignores objectives
 */
export const crewBehaviorSystem: SystemDefinition = {
  systemId: 'heist.crew_behavior',
  priority: 15, // Before crew-movement (20)
  run(ctx: SystemContext) {
    const crew = ctx.getEntitiesByType('crew');
    const objectives = ctx.getEntitiesByType('objective');
    const stance = ctx.state.stance;

    for (const agent of crew) {
      const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
      const posComp = agent.components['heist.position'] as PositionComponent | undefined;

      if (!crewComp || !posComp) continue;

      // Skip if fleeing (override active)
      if (crewComp.state === 'FLEEING') continue;

      // Skip if override flee is active
      if (crewComp.overrideFleeUntil && crewComp.overrideFleeUntil > ctx.tickIndex) continue;

      // === HIDE PROGRESS - Process hide transition ===
      // Per AH04: Hiding takes time, affected by HIDE_FASTER module
      if (crewComp.hideProgress !== undefined && crewComp.hideProgress < 100) {
        // Apply HIDE_FASTER multiplier (lower = faster, e.g., 0.8 = 20% faster)
        const hideMultiplier = getHideSpeedMultiplier(ctx.state.modules);
        // Invert multiplier for progress: lower multiplier = more progress per tick
        const baseProgress = Math.ceil(BASE_HIDE_PROGRESS / hideMultiplier);

        // Apply heat multiplier (Task 005: hide takes longer at 50+ heat)
        const heatMultiplier = getHeatEffectMultiplier(ctx.state.heatLevel, 'hideProgressMultiplier', ctx.config);
        const progressPerTick = Math.ceil(baseProgress * heatMultiplier);

        const newProgress = Math.min(100, crewComp.hideProgress + progressPerTick);

        if (newProgress >= 100) {
          // Hide complete - transition to HIDING state
          ctx.proposeEvent(HEIST_EVENTS.CREW_STATE_CHANGED, {
            crewId: agent.id,
            from: crewComp.state,
            to: 'HIDING',
          }, { system: 'crew_behavior' });
        } else {
          // Still hiding - emit progress update
          ctx.proposeEvent(HEIST_EVENTS.HIDE_PROGRESS, {
            crewId: agent.id,
            progress: newProgress,
          }, { system: 'crew_behavior' });
        }
        continue; // Don't process other behavior while hiding
      }

      // === STANCE: ABORT - Immediately head to exit ===
      if (stance === 'ABORT') {
        const exitPos = findExitPosition(ctx);
        if (exitPos && !vecEq(posComp.pos, exitPos)) {
          const path = findPath(posComp.pos, exitPos, ctx.state.map);
          if (path.length > 0 && crewComp.state !== 'MOVING') {
            emitPathToTarget(ctx, agent, crewComp, path, undefined);
          }
        }
        continue; // Skip normal behavior
      }

      // === STANCE: SAFE - Prefer cover when alert is high ===
      if (stance === 'SAFE' && alertGte(ctx.state.alert.level, 'SUSPICIOUS')) {
        // If spotted and working, stop and seek cover
        if (crewComp.isSpotted && crewComp.state === 'WORKING') {
          const coverPos = findNearestCover(posComp.pos, ctx.state.map);
          if (coverPos && !vecEq(posComp.pos, coverPos)) {
            const path = findPath(posComp.pos, coverPos, ctx.state.map);
            if (path.length > 0) {
              ctx.proposeEvent(HEIST_EVENTS.CREW_STATE_CHANGED, {
                crewId: agent.id,
                from: crewComp.state,
                to: 'MOVING',
                path: path,
              }, { system: 'crew_behavior' });
              continue; // Skip normal behavior
            }
          }
        }
      }

      // === STANCE: COMMIT - Continue working even when spotted ===
      // This is the default behavior, so no special handling needed
      // The crew will continue to their objective

      // Find the target objective (either current or first active)
      const targetObjective = findTargetObjective(crewComp, objectives, ctx);

      if (!targetObjective) {
        // No active objectives - try to find exit if all done
        const allDone = areAllObjectivesDone(objectives);
        if (allDone) {
          const exitPos = findExitPosition(ctx);
          if (exitPos && !vecEq(posComp.pos, exitPos)) {
            // Path to exit
            const path = findPath(posComp.pos, exitPos, ctx.state.map);
            if (path.length > 0 && crewComp.state !== 'MOVING') {
              emitPathToTarget(ctx, agent, crewComp, path, undefined);
            }
          }
        }
        continue;
      }

      const objPos = targetObjective.components['heist.position'] as PositionComponent | undefined;
      if (!objPos) continue;

      // Case 1: IDLE with no path -> find active objective -> path to it
      if ((crewComp.state === 'IDLE' || crewComp.state === 'HIDING') && crewComp.path.length === 0) {
        if (!vecEq(posComp.pos, objPos.pos)) {
          // Not at objective - path to it
          const path = findPath(posComp.pos, objPos.pos, ctx.state.map);
          if (path.length > 0) {
            emitPathToTarget(ctx, agent, crewComp, path, targetObjective.id);
          }
        } else {
          // At objective position -> set state to WORKING
          ctx.proposeEvent(HEIST_EVENTS.CREW_STATE_CHANGED, {
            crewId: agent.id,
            from: crewComp.state,
            to: 'WORKING',
          }, { system: 'crew_behavior' });
        }
      }

      // Case 2: MOVING but arrived at objective (path empty but not WORKING yet)
      if (crewComp.state === 'MOVING' && crewComp.path.length === 0) {
        if (vecEq(posComp.pos, objPos.pos)) {
          ctx.proposeEvent(HEIST_EVENTS.CREW_STATE_CHANGED, {
            crewId: agent.id,
            from: 'MOVING',
            to: 'WORKING',
          }, { system: 'crew_behavior' });
        }
      }

      // Case 3: WORKING but objective at current position is DONE -> go IDLE to pick next objective
      if (crewComp.state === 'WORKING') {
        // Find objective at crew's current position
        const objAtPosition = findObjectiveAtPosition(posComp.pos, objectives);
        if (!objAtPosition) {
          // No objective here anymore, go idle
          ctx.proposeEvent(HEIST_EVENTS.CREW_STATE_CHANGED, {
            crewId: agent.id,
            from: 'WORKING',
            to: 'IDLE',
          }, { system: 'crew_behavior' });
        } else {
          const objComp = objAtPosition.components['heist.objective'] as ObjectiveComponent | undefined;
          if (objComp && objComp.state === 'DONE') {
            ctx.proposeEvent(HEIST_EVENTS.CREW_STATE_CHANGED, {
              crewId: agent.id,
              from: 'WORKING',
              to: 'IDLE',
            }, { system: 'crew_behavior' });
          }
        }
      }
    }
  },
};

/**
 * Find the target objective for the crew member.
 */
function findTargetObjective(
  crewComp: CrewComponent,
  objectives: Entity[],
  ctx: SystemContext
): Entity | undefined {
  // If crew has a current objective, check if it's still valid
  if (crewComp.currentObjective) {
    const current = ctx.getEntity(crewComp.currentObjective);
    if (current) {
      const objComp = current.components['heist.objective'] as ObjectiveComponent | undefined;
      if (objComp && objComp.state === 'ACTIVE') {
        return current;
      }
    }
  }

  // Find first ACTIVE objective (excluding escape/exit types initially)
  for (const obj of objectives) {
    const objComp = obj.components['heist.objective'] as ObjectiveComponent | undefined;
    if (objComp && objComp.state === 'ACTIVE' && !isExitObjective(objComp.type)) {
      return obj;
    }
  }

  // If no non-exit objectives, find exit/escape objective
  for (const obj of objectives) {
    const objComp = obj.components['heist.objective'] as ObjectiveComponent | undefined;
    if (objComp && objComp.state === 'ACTIVE' && isExitObjective(objComp.type)) {
      return obj;
    }
  }

  return undefined;
}

/**
 * Check if an objective type is an exit/escape type.
 */
function isExitObjective(type: string): boolean {
  return type === 'EXIT' || type === 'ESCAPE';
}

/**
 * Find objective at a given position.
 */
function findObjectiveAtPosition(pos: Vec2, objectives: Entity[]): Entity | undefined {
  for (const obj of objectives) {
    const objPos = obj.components['heist.position'] as PositionComponent | undefined;
    if (objPos && vecEq(objPos.pos, pos)) {
      return obj;
    }
  }
  return undefined;
}

/**
 * Check if all objectives (except EXIT/ESCAPE) are done.
 */
function areAllObjectivesDone(objectives: Entity[]): boolean {
  for (const obj of objectives) {
    const objComp = obj.components['heist.objective'] as ObjectiveComponent | undefined;
    if (!objComp) continue;
    if (isExitObjective(objComp.type)) continue; // Exit/escape doesn't need to be done
    if (objComp.state !== 'DONE') return false;
  }
  return true;
}

/**
 * Find exit position from map.
 */
function findExitPosition(ctx: SystemContext): Vec2 | null {
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

/**
 * Emit events to start moving toward a target.
 */
function emitPathToTarget(
  ctx: SystemContext,
  agent: Entity,
  crewComp: CrewComponent,
  path: Vec2[],
  objectiveId: string | undefined
): void {
  // Emit crew state changed to MOVING with path info
  // The reducer will set the path
  ctx.proposeEvent(HEIST_EVENTS.CREW_STATE_CHANGED, {
    crewId: agent.id,
    from: crewComp.state,
    to: 'MOVING',
    path: path,
    targetObjective: objectiveId,
  }, { system: 'crew_behavior' });
}
