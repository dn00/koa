/**
 * Heist Kernel - Guard Movement System
 *
 * Handles guard patrol, investigation, pursuit, and return behavior.
 * Per Task 007: Uses alertModes config for alert-level-driven behavior.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type {
  Entity,
  PositionComponent,
  GuardComponent,
  GuardState,
  Vec2,
  RuntimeConfig,
  AlertLevel,
  DoorState,
} from '../types.js';
import { vecEq, manhattan, alertGte } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import { findPath } from '../utils/pathfinding.js';
import { getHeatEffectMultiplier } from '../utils/heat.js';

/**
 * Find the nearest door position from an entity's position.
 * Returns null if no doors exist.
 */
function findNearestDoor(pos: Vec2, doors: Record<string, DoorState>): DoorState | null {
  let nearest: DoorState | null = null;
  let nearestDist = Infinity;

  for (const door of Object.values(doors)) {
    const dist = manhattan(pos, door.pos);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = door;
    }
  }

  return nearest;
}

/**
 * Guard movement system - handles all guard movement states.
 */
export const guardMovementSystem: SystemDefinition = {
  systemId: 'heist.guard_movement',
  priority: 25, // After crew movement
  run(ctx: SystemContext) {
    const guards = ctx.getEntitiesByType('guard');
    const rng = ctx.rng('guard_movement');
    const state = ctx.state;
    const config = ctx.config.security;

    for (const guard of guards) {
      const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
      const posComp = guard.components['heist.position'] as PositionComponent | undefined;

      if (!guardComp || !posComp) continue;

      switch (guardComp.state) {
        case 'PATROL':
          handlePatrol(ctx, guard, guardComp, posComp, rng, config);
          break;
        case 'INVESTIGATE':
          handleInvestigate(ctx, guard, guardComp, posComp, rng, config);
          break;
        case 'PURSUE':
          handlePursue(ctx, guard, guardComp, posComp, config);
          break;
        case 'RETURN':
          handleReturn(ctx, guard, guardComp, posComp);
          break;
        case 'SWEEP':
          handleSweep(ctx, guard, guardComp, posComp);
          break;
        case 'HOLD':
          handleHold(ctx, guard, guardComp, posComp);
          break;
      }
    }
  },
};

/**
 * Handle PATROL state - follow route with random delays.
 * Per Task 007: Uses alertModes config for investigate chance and chokepoint holding.
 */
function handlePatrol(
  ctx: SystemContext,
  guard: Entity,
  guardComp: GuardComponent,
  posComp: PositionComponent,
  rng: ReturnType<SystemContext['rng']>,
  config: RuntimeConfig['security']
): void {
  const state = ctx.state;
  const alertLevel = state.alert.level as AlertLevel;
  const modeConfig = ctx.config.alertModes[alertLevel];

  // LOCKDOWN: transition to HOLD state (Task 003 - replaces old holdChokepoints workaround)
  if (alertGte(alertLevel, 'LOCKDOWN')) {
    const nearestDoor = findNearestDoor(posComp.pos, state.doors || {});
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'PATROL',
      to: 'HOLD',
      reason: 'lockdown_hold',
      holdTarget: nearestDoor ? { ...nearestDoor.pos } : undefined,
    }, { system: 'guard_movement' });
    return;
  }

  // ALARM (but not LOCKDOWN): transition to SWEEP state (Task 002)
  if (alertGte(alertLevel, 'ALARM')) {
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'PATROL',
      to: 'SWEEP',
      reason: 'alarm_sweep',
    }, { system: 'guard_movement' });
    return;
  }

  // Handle delay at waypoints
  if (guardComp.patrolDelay > 0) {
    return; // Delay is handled by reducer
  }

  // No patrol route
  if (guardComp.patrolRoute.length === 0) return;

  const targetPos = guardComp.patrolRoute[guardComp.patrolIndex];

  // Already at waypoint - advance to next
  if (targetPos && vecEq(posComp.pos, targetPos)) {
    // Calculate random delay
    const delay = config.patrolDelayMin +
      rng.nextInt(config.patrolDelayMax - config.patrolDelayMin + 1);

    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'PATROL',
      to: 'PATROL',
      reason: 'waypoint_reached',
      advanceIndex: true,
      delay,
    }, { system: 'guard_movement' });
    return;
  }

  // Move toward waypoint
  if (targetPos) {
    const path = findPath(posComp.pos, targetPos, ctx.state.map);
    if (path.length > 0) {
      ctx.proposeEvent(HEIST_EVENTS.ENTITY_MOVED, {
        entityId: guard.id,
        from: { ...posComp.pos },
        to: { ...path[0] },
      }, { system: 'guard_movement' });
    }
  }

  // Random investigation check - use alertModes config (Task 007 AC-1, AC-2)
  const investigateChance = modeConfig.investigateChance;

  if (rng.nextFloat() < investigateChance) {
    // Pick a random position to investigate (e.g., in maintenance corridor)
    // For now, just use a position near center of map
    const halfW = Math.max(1, Math.floor(ctx.state.map.width / 2));
    const halfH = Math.max(1, Math.floor(ctx.state.map.height / 2));
    const randomX = Math.floor(ctx.state.map.width / 4) + rng.nextInt(halfW);
    const randomY = Math.floor(ctx.state.map.height / 4) + rng.nextInt(halfH);

    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'PATROL',
      to: 'INVESTIGATE',
      reason: 'random_check',
      alertTarget: { x: randomX, y: randomY },
    }, { system: 'guard_movement' });
  }
}

/**
 * Handle INVESTIGATE state - move to last seen position or give up.
 */
function handleInvestigate(
  ctx: SystemContext,
  guard: Entity,
  guardComp: GuardComponent,
  posComp: PositionComponent,
  rng: ReturnType<SystemContext['rng']>,
  config: RuntimeConfig['security']
): void {
  const targetPos = guardComp.alertTarget || guardComp.lastSeen?.pos;

  if (!targetPos) {
    // No target - return to patrol
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'INVESTIGATE',
      to: 'RETURN',
      reason: 'no_target',
    }, { system: 'guard_movement' });
    return;
  }

  // Reached target or random give up
  // Apply heat multiplier to give-up chance (Task 004: guards investigate longer at 25+ heat)
  const baseGiveUpChance = config.investigateGiveUpChance;
  const heatMultiplier = getHeatEffectMultiplier(ctx.state.heatLevel, 'investigateGiveUpMultiplier', ctx.config);
  const effectiveGiveUpChance = baseGiveUpChance * heatMultiplier;

  if (vecEq(posComp.pos, targetPos) || rng.nextFloat() < effectiveGiveUpChance) {
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'INVESTIGATE',
      to: 'RETURN',
      reason: vecEq(posComp.pos, targetPos) ? 'reached_target' : 'gave_up',
    }, { system: 'guard_movement' });
    return;
  }

  // Move toward target
  const path = findPath(posComp.pos, targetPos, ctx.state.map);
  if (path.length > 0) {
    ctx.proposeEvent(HEIST_EVENTS.ENTITY_MOVED, {
      entityId: guard.id,
      from: { ...posComp.pos },
      to: { ...path[0] },
    }, { system: 'guard_movement' });
  }
}

/**
 * Handle PURSUE state - chase spotted crew.
 */
function handlePursue(
  ctx: SystemContext,
  guard: Entity,
  guardComp: GuardComponent,
  posComp: PositionComponent,
  config: RuntimeConfig['security']
): void {
  const lastSeen = guardComp.lastSeen;

  if (!lastSeen) {
    // Lost track - return to patrol
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'PURSUE',
      to: 'RETURN',
      reason: 'lost_target',
    }, { system: 'guard_movement' });
    return;
  }

  // Check if lost sight for too long
  const ticksSinceSeen = ctx.state.tickIndex - lastSeen.tick;
  if (ticksSinceSeen > config.pursueLostSightTicks) {
    // Downgrade to investigate last known position
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'PURSUE',
      to: 'INVESTIGATE',
      reason: 'lost_sight',
    }, { system: 'guard_movement' });
    return;
  }

  // Move toward last seen position
  const path = findPath(posComp.pos, lastSeen.pos, ctx.state.map);
  if (path.length > 0) {
    ctx.proposeEvent(HEIST_EVENTS.ENTITY_MOVED, {
      entityId: guard.id,
      from: { ...posComp.pos },
      to: { ...path[0] },
    }, { system: 'guard_movement' });
  }
}

/**
 * Handle RETURN state - go back to patrol route.
 */
function handleReturn(
  ctx: SystemContext,
  guard: Entity,
  guardComp: GuardComponent,
  posComp: PositionComponent
): void {
  if (guardComp.patrolRoute.length === 0) {
    // No patrol route - just become PATROL
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'RETURN',
      to: 'PATROL',
      reason: 'no_route',
    }, { system: 'guard_movement' });
    return;
  }

  const returnTarget = guardComp.patrolRoute[guardComp.patrolIndex];

  // Reached patrol position
  if (returnTarget && vecEq(posComp.pos, returnTarget)) {
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'RETURN',
      to: 'PATROL',
      reason: 'reached_route',
    }, { system: 'guard_movement' });
    return;
  }

  // Move toward patrol position
  if (returnTarget) {
    const path = findPath(posComp.pos, returnTarget, ctx.state.map);
    if (path.length > 0) {
      ctx.proposeEvent(HEIST_EVENTS.ENTITY_MOVED, {
        entityId: guard.id,
        from: { ...posComp.pos },
        to: { ...path[0] },
      }, { system: 'guard_movement' });
    }
  }
}

/**
 * Handle SWEEP state - search area with pseudo-random waypoints during ALARM.
 * Per Task 002: Uses deterministic RNG for waypoint generation.
 */
function handleSweep(
  ctx: SystemContext,
  guard: Entity,
  guardComp: GuardComponent,
  posComp: PositionComponent
): void {
  const state = ctx.state;
  const sweepConfig = ctx.config.sweep;
  const rng = ctx.rng('guard_movement');

  // Exit SWEEP if alert drops below ALARM
  if (!alertGte(state.alert.level, 'ALARM')) {
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'SWEEP',
      to: 'RETURN',
      reason: 'alert_deescalated',
    }, { system: 'guard_movement' });
    return;
  }

  // If LOCKDOWN, transition to HOLD (HOLD takes precedence over SWEEP)
  if (alertGte(state.alert.level, 'LOCKDOWN')) {
    const nearestDoor = findNearestDoor(posComp.pos, state.doors || {});
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'SWEEP',
      to: 'HOLD',
      reason: 'lockdown_hold',
      holdTarget: nearestDoor ? { ...nearestDoor.pos } : undefined,
    }, { system: 'guard_movement' });
    return;
  }

  // Generate/update sweep waypoint
  if (!guardComp.sweepTarget || guardComp.sweepWaypointTimer === 0) {
    const center = guardComp.lastSeen?.pos ?? posComp.pos;
    const radius = sweepConfig.searchRadius;

    // Deterministic random offset using ctx.rng
    const angle = rng.nextFloat() * 2 * Math.PI;
    const dist = rng.nextFloat() * radius;
    const newTarget: Vec2 = {
      x: Math.floor(center.x + Math.cos(angle) * dist),
      y: Math.floor(center.y + Math.sin(angle) * dist),
    };

    // Clamp to map bounds
    guardComp.sweepTarget = {
      x: Math.max(0, Math.min(state.map.width - 1, newTarget.x)),
      y: Math.max(0, Math.min(state.map.height - 1, newTarget.y)),
    };
    guardComp.sweepWaypointTimer = sweepConfig.waypointChangeTicks;
  }

  // Move toward sweep target
  if (guardComp.sweepTarget && !vecEq(posComp.pos, guardComp.sweepTarget)) {
    const path = findPath(posComp.pos, guardComp.sweepTarget, ctx.state.map);
    if (path.length > 0) {
      ctx.proposeEvent(HEIST_EVENTS.ENTITY_MOVED, {
        entityId: guard.id,
        from: { ...posComp.pos },
        to: { ...path[0] },
      }, { system: 'guard_movement' });
    } else {
      // Unreachable - pick new waypoint next tick
      guardComp.sweepWaypointTimer = 0;
    }
  } else {
    // Reached target - pick new one
    guardComp.sweepWaypointTimer = 0;
  }

  // Decrement timer
  if (guardComp.sweepWaypointTimer && guardComp.sweepWaypointTimer > 0) {
    guardComp.sweepWaypointTimer--;
  }
}

/**
 * Handle HOLD state - hold chokepoint position during LOCKDOWN.
 * Per Task 003: Guards hold indefinitely without giveUpChance.
 */
function handleHold(
  ctx: SystemContext,
  guard: Entity,
  guardComp: GuardComponent,
  posComp: PositionComponent
): void {
  const state = ctx.state;

  // Exit HOLD if alert drops below LOCKDOWN
  if (!alertGte(state.alert.level, 'LOCKDOWN')) {
    // Determine target state based on current alert level
    const targetState = alertGte(state.alert.level, 'ALARM') ? 'SWEEP' : 'RETURN';
    ctx.proposeEvent(HEIST_EVENTS.GUARD_STATE_CHANGED, {
      guardId: guard.id,
      from: 'HOLD',
      to: targetState,
      reason: 'alert_deescalated',
    }, { system: 'guard_movement' });
    return;
  }

  // Move to hold target if not there
  if (guardComp.holdTarget && !vecEq(posComp.pos, guardComp.holdTarget)) {
    const path = findPath(posComp.pos, guardComp.holdTarget, ctx.state.map);
    if (path.length > 0) {
      ctx.proposeEvent(HEIST_EVENTS.ENTITY_MOVED, {
        entityId: guard.id,
        from: { ...posComp.pos },
        to: { ...path[0] },
      }, { system: 'guard_movement' });
    }
    // If path fails, hold current position (don't wander)
    return;
  }

  // At hold position or no target - stay put
  // Key difference from INVESTIGATE: no give-up chance, hold indefinitely
}
