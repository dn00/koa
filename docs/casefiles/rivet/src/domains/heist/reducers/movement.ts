/**
 * Heist Kernel - Movement Reducers
 *
 * Handle ENTITY_MOVED, GUARD_STATE_CHANGED, CREW_STATE_CHANGED events.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type {
  HeistState,
  PositionComponent,
  GuardComponent,
  CrewComponent,
  GuardState,
  CrewState,
  Vec2,
} from '../types.js';
import { vecEq } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type {
  EntityMovedPayload,
  GuardStateChangedPayload,
  CrewStateChangedPayload,
  HideProgressPayload,
} from '../events.js';

/**
 * Register movement reducers with the registry.
 */
export function registerMovementReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.ENTITY_MOVED, entityMovedReducer);
  registry.register(HEIST_EVENTS.GUARD_STATE_CHANGED, guardStateChangedReducer);
  registry.register(HEIST_EVENTS.CREW_STATE_CHANGED, crewStateChangedReducer);
  registry.register(HEIST_EVENTS.HIDE_PROGRESS, hideProgressReducer);
}

/**
 * Create a new ReducerRegistry with movement reducers.
 */
export function createMovementReducers(): ReducerRegistry {
  const { ReducerRegistry } = require('../kernel.js');
  const registry = new ReducerRegistry();
  registerMovementReducers(registry);
  return registry;
}

/**
 * Handle ENTITY_MOVED event.
 * Updates position and facing direction.
 */
function entityMovedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as EntityMovedPayload;
  const { entityId, from, to } = payload;

  const entity = state.entities[entityId];
  if (!entity) return;

  const posComp = entity.components['heist.position'] as PositionComponent | undefined;
  if (!posComp) return;

  // Update facing direction based on movement
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx !== 0 || dy !== 0) {
    posComp.facing = { x: Math.sign(dx), y: Math.sign(dy) };
  }

  // Update position
  posComp.pos = { ...to };

  // Handle entity-specific updates
  if (entity.type === 'crew') {
    const crewComp = entity.components['heist.crew'] as CrewComponent | undefined;
    if (crewComp && crewComp.path.length > 0) {
      // Remove first position from path (we just moved there)
      crewComp.path.shift();
    }
  }

  // Guard patrol index advancement is handled by GUARD_STATE_CHANGED event
  // with reason 'waypoint_reached' - don't duplicate here
}

/**
 * Handle GUARD_STATE_CHANGED event.
 */
function guardStateChangedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as GuardStateChangedPayload & {
    advanceIndex?: boolean;
    delay?: number;
    alertTarget?: { x: number; y: number };
    holdTarget?: { x: number; y: number };
  };
  const { guardId, from, to, reason, advanceIndex, delay, alertTarget } = payload;

  const guard = state.entities[guardId];
  if (!guard) return;

  const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
  if (!guardComp) return;

  guardComp.state = to;

  // Handle waypoint reached - advance patrol index
  if (reason === 'waypoint_reached' && advanceIndex && guardComp.patrolRoute.length > 0) {
    guardComp.patrolIndex = (guardComp.patrolIndex + 1) % guardComp.patrolRoute.length;
    guardComp.patrolDelay = delay ?? 0;
  }

  // Set alertTarget if provided (for investigation)
  if (alertTarget) {
    guardComp.alertTarget = { ...alertTarget };
  }

  // Set holdTarget if provided (for HOLD state)
  if (payload.holdTarget) {
    guardComp.holdTarget = { ...payload.holdTarget };
  }

  // Clear holdTarget when exiting HOLD
  if (from === 'HOLD') {
    delete guardComp.holdTarget;
  }

  // Clear sweep fields when exiting SWEEP
  if (from === 'SWEEP') {
    delete guardComp.sweepTarget;
    delete guardComp.sweepWaypointTimer;
  }

  // Clear alertTarget when returning to patrol
  if (to === 'PATROL' || to === 'RETURN') {
    delete guardComp.alertTarget;
  }
}

/**
 * Handle CREW_STATE_CHANGED event.
 */
function crewStateChangedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CrewStateChangedPayload & {
    path?: Vec2[];
    targetObjective?: string;
  };
  const { crewId, to, path, targetObjective } = payload;

  const crew = state.entities[crewId];
  if (!crew) return;

  const crewComp = crew.components['heist.crew'] as CrewComponent | undefined;
  if (!crewComp) return;

  crewComp.state = to;

  // Set path if provided (when transitioning to MOVING)
  if (path) {
    crewComp.path = path.map(p => ({ ...p }));
  }

  // Set current objective if provided
  if (targetObjective !== undefined) {
    crewComp.currentObjective = targetObjective;
  }

  // Clear path when entering IDLE or WORKING
  if (to === 'IDLE' || to === 'WORKING') {
    crewComp.path = [];
  }

  // Clear current objective when entering IDLE
  if (to === 'IDLE') {
    delete crewComp.currentObjective;
  }

  // Clear hideProgress when entering HIDING (hide complete)
  if (to === 'HIDING') {
    delete crewComp.hideProgress;
  }

  // Clear hideProgress when entering FLEEING (interrupts any in-progress hide)
  if (to === 'FLEEING') {
    delete crewComp.hideProgress;
  }
}

/**
 * Handle HIDE_PROGRESS event.
 * Updates crew's hide progress toward HIDING state.
 */
function hideProgressReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as HideProgressPayload;
  const { crewId, progress } = payload;

  const crew = state.entities[crewId];
  if (!crew) return;

  const crewComp = crew.components['heist.crew'] as CrewComponent | undefined;
  if (!crewComp) return;

  crewComp.hideProgress = progress;
}
