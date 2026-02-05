/**
 * Heist Kernel - Rules Evaluation System
 *
 * Evaluates directive cards and fires matching triggers.
 * Supports veto window for pausesBeforeFire rules (per specss.md 6.3).
 */

import type { SystemDefinition, SystemContext, SimEvent } from '../kernel.js';
import type {
  Entity,
  CrewComponent,
  PositionComponent,
  AlertLevel,
  RulesState,
  HeistState,
  EntityId,
  ObjectiveComponent,
  HackState,
} from '../types.js';
import { alertGte } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type { DirectiveCard, Trigger, Action, RuleCondition } from '../rules-types.js';
import { manhattan, type Vec2, type GuardComponent } from '../types.js';
import type { ZoneId, NoiseEmittedPayload, HackStartedPayload, ZoneEnteredPayload, EnteredCameraConePayload } from '../events.js';

/** Lockout duration for vetoed rules (in ticks) */
const VETO_LOCKOUT_TICKS = 10;

/**
 * Rules evaluation system - runs early to set agent intents.
 * Supports veto window for pausesBeforeFire rules (per specss.md 6.3).
 */
export const rulesSystem: SystemDefinition = {
  systemId: 'heist.rules',
  priority: 5, // Runs very early
  run(ctx: SystemContext) {
    const state = ctx.state;

    // Get rules state from HeistState
    if (!state.rules || !state.rules.equipped || state.rules.equipped.length === 0) {
      return;
    }
    const rulesState = state.rules;

    // Initialize lockouts map if not present
    if (!rulesState.lockouts) {
      rulesState.lockouts = new Map();
    }

    // Handle pending veto decision from previous tick
    if (state.pendingVeto && state.pendingVetoDecision) {
      const { ruleId, agentId } = state.pendingVeto;
      const rule = rulesState.equipped.find((r) => r.id === ruleId);

      if (state.pendingVetoDecision === 'ALLOW' && rule) {
        // Player allowed - fire the rule now
        ctx.proposeEvent(HEIST_EVENTS.RULE_ALLOWED, { ruleId, agentId }, { system: 'rules' });
        ctx.proposeEvent(HEIST_EVENTS.RULE_TRIGGERED, {
          ruleId: rule.id,
          agentId,
          triggerId: rule.trigger.type,
        }, { system: 'rules' });
        const actionType = rule.action?.type ?? rule.actions?.[0]?.type ?? 'UNKNOWN';
        ctx.proposeEvent(HEIST_EVENTS.RULE_ACTION_APPLIED, {
          ruleId: rule.id,
          agentId,
          actionType,
        }, { system: 'rules' });
      } else if (state.pendingVetoDecision === 'VETO') {
        // Player vetoed - put rule on lockout (reducer will set the lockout)
        const lockoutUntil = state.tickIndex + VETO_LOCKOUT_TICKS;
        ctx.proposeEvent(HEIST_EVENTS.RULE_VETOED, { ruleId, agentId, lockoutUntil }, { system: 'rules' });
      }
      // Clear pending veto state (reducer will handle this)
      return; // Don't evaluate more rules this tick
    }

    // If there's a pending veto waiting for decision, don't evaluate new rules
    if (state.pendingVeto) {
      return;
    }

    const crew = ctx.getEntitiesByType('crew');
    const crewIds = crew.map((c) => c.id).sort();

    // Check each equipped rule
    for (const rule of [...rulesState.equipped].sort((a, b) => b.priority - a.priority)) {
      // Check cooldown
      const cooldown = rulesState.cooldowns.get(rule.id) || 0;
      if (cooldown > 0) continue;

      // Check lockout (from veto)
      const lockout = rulesState.lockouts.get(rule.id) || 0;
      if (lockout > state.tickIndex) continue;

      // Check charges
      if (rule.charges !== undefined) {
        const remaining = rulesState.charges.get(rule.id) || 0;
        if (remaining <= 0) continue;
      }

      // Check trigger
      if (!checkTrigger(rule.trigger, ctx, crew)) continue;

      // Check condition (Task 011)
      if (rule.condition && !checkCondition(rule.condition, ctx, crew)) continue;

      // Determine affected agents based on scope
      const affectedAgents = getAffectedAgents(rule.scope, crewIds, ctx);
      if (affectedAgents.length === 0) continue;

      const firstAgentId = affectedAgents[0];

      // If rule has pausesBeforeFire, set pending veto instead of firing
      if (rule.pausesBeforeFire) {
        ctx.proposeEvent(HEIST_EVENTS.RULE_PENDING_VETO, {
          ruleId: rule.id,
          ruleName: rule.name,
          triggerEvent: rule.trigger.type,
          predictedIntent: formatIntent(rule.action),
          agentId: firstAgentId,
        }, { system: 'rules' });
        // Only one pending veto at a time, so stop processing rules
        return;
      }

      // Emit rule triggered event for each affected agent
      const ruleActionType = rule.action?.type ?? rule.actions?.[0]?.type ?? 'UNKNOWN';
      for (const agentId of affectedAgents) {
        ctx.proposeEvent(HEIST_EVENTS.RULE_TRIGGERED, {
          ruleId: rule.id,
          agentId,
          triggerId: rule.trigger.type,
        }, { system: 'rules' });

        ctx.proposeEvent(HEIST_EVENTS.RULE_ACTION_APPLIED, {
          ruleId: rule.id,
          agentId,
          actionType: ruleActionType,
        }, { system: 'rules' });
      }
    }
  },
};

/**
 * Format action intent for display in veto window.
 */
function formatIntent(action: Action | undefined): string {
  if (!action) return 'UNKNOWN';

  switch (action.type) {
    case 'MOVE_TO':
      return `MOVE_TO(${action.target})`;
    case 'HOLD':
      return `HOLD(${action.duration})`;
    case 'HIDE':
      return 'HIDE';
    case 'USE_TOKEN':
      return `USE_TOKEN(${action.token})`;
    case 'CONTINUE':
      return 'CONTINUE';
    case 'FREEZE_GUARDS':
      return `FREEZE_GUARDS(${action.duration})`;
    case 'SET_STANCE':
      return `SET_STANCE(${action.stance})`;
    case 'TOGGLE_DOOR':
      return `TOGGLE_DOOR(${action.target})`;
    // New action types (triggers-actions-v2)
    case 'CANCEL_TASK':
      return 'CANCEL_TASK';
    case 'HACK_MODE':
      return `HACK_MODE(${action.mode})`;
    case 'DRAG_TO':
      return `DRAG_TO(${action.target})`;
    default:
      return 'UNKNOWN';
  }
}

/**
 * Check if a trigger condition is met.
 */
function checkTrigger(
  trigger: Trigger,
  ctx: SystemContext,
  crew: Entity[]
): boolean {
  switch (trigger.type) {
    case 'SPOTTED':
      // Check if any (or specific) crew is spotted
      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        if (crewComp?.isSpotted) {
          if (!trigger.agent || trigger.agent === agent.id) {
            return true;
          }
        }
      }
      return false;

    case 'ALERT_GTE':
      return alertGte(ctx.state.alert.level, trigger.level);

    case 'ALERT_EQ':
      // Task 010: Exact alert level match
      return ctx.state.alert.level === trigger.level;

    case 'OBJECTIVE_DONE':
      // Check objectives for completion
      for (const entity of Object.values(ctx.state.entities)) {
        if (entity.type === 'objective') {
          const objComp = entity.components['heist.objective'] as any;
          if (objComp && entity.id === trigger.id && objComp.state === 'DONE') {
            return true;
          }
        }
      }
      return false;

    case 'HEALTH_LOW':
      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        if (crewComp) {
          const healthPct = (crewComp.health / crewComp.maxHealth) * 100;
          if (healthPct < trigger.threshold) {
            return true;
          }
        }
      }
      return false;

    case 'BLOCKED':
      // Check if any crew is blocked (no path)
      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        if (crewComp && crewComp.state === 'MOVING' && crewComp.path.length === 0) {
          return true;
        }
      }
      return false;

    case 'ALWAYS':
      return true;

    case 'NEAR_DOOR':
      // Task 011: Check if any crew is within 2 tiles of a door
      for (const agent of crew) {
        const posComp = agent.components['heist.position'] as PositionComponent | undefined;
        if (!posComp) continue;

        const nearDoor = findNearestDoor(posComp.pos, ctx.state);
        if (nearDoor && manhattan(posComp.pos, nearDoor.pos) <= 2) {
          return true;
        }
      }
      return false;

    case 'HEARD_NOISE_NEAR': {
      // Task 012: Check if guard heard noise near crew recently
      const { range } = trigger;
      const recentNoise = ctx.state.recentNoiseHeard || [];
      const previousTick = ctx.tickIndex - 1;

      // Check if any guard heard noise recently (last tick) near any crew
      for (const noiseEvent of recentNoise) {
        if (noiseEvent.tick !== previousTick) continue;

        const guardPos = getEntityPosition(ctx, noiseEvent.guardId);
        if (!guardPos) continue;

        // Check if any crew is within range of the guard who heard the noise
        for (const agent of crew) {
          const crewPos = agent.components['heist.position'] as PositionComponent | undefined;
          if (!crewPos) continue;

          if (manhattan(guardPos, crewPos.pos) <= range) {
            return true;
          }
        }
      }
      return false;
    }

    case 'TICK_INTERVAL': {
      // Proactive trigger: fire every N ticks
      const { every } = trigger;
      return ctx.tickIndex > 0 && ctx.tickIndex % every === 0;
    }

    case 'OBJECTIVE_PROGRESS_GTE': {
      // Proactive trigger: fire when objective reaches percentage threshold
      const { id, pct } = trigger;
      for (const entity of Object.values(ctx.state.entities)) {
        if (entity.type === 'objective') {
          const objComp = entity.components['heist.objective'] as any;
          if (!objComp) continue;

          // If id specified, only check that objective
          if (id && entity.id !== id) continue;

          // Check if objective is active and at or above threshold
          if (objComp.state === 'ACTIVE' && objComp.progress >= pct) {
            return true;
          }
        }
      }
      return false;
    }

    case 'HEAT_GTE': {
      // Heat threshold trigger: fire when heatLevel reaches threshold
      // Maps value to heatLevel: 25 -> 1, 50 -> 2, 75 -> 3
      const { value } = trigger;
      const requiredLevel = value === 25 ? 1 : value === 50 ? 2 : 3;
      return ctx.state.heatLevel >= requiredLevel;
    }

    case 'CAMERA_CONE': {
      // Task 011: Crew entered camera FOV
      // Check recent cone entries from previous tick (vision runs after rules)
      const recentEntries = ctx.state.recentConeEntries ?? [];
      const previousTick = ctx.tickIndex - 1;

      // Filter to entries from the previous tick
      const coneEntries = recentEntries.filter(entry => entry.tick === previousTick);

      if (coneEntries.length === 0) return false;

      // If specific cameraId is specified, check for that camera
      if (trigger.cameraId) {
        return coneEntries.some(entry => entry.cameraId === trigger.cameraId);
      }

      // Any camera cone entry
      return true;
    }

    default:
      return false;
  }
}

/**
 * Get list of agent IDs affected by a rule based on scope.
 */
function getAffectedAgents(
  scope: 'self' | 'all' | 'other' | 'nearest',
  crewIds: string[],
  ctx: SystemContext
): string[] {
  switch (scope) {
    case 'all':
      return crewIds;

    case 'self':
      // Find the first spotted agent, or first agent if none spotted
      const crew = ctx.getEntitiesByType('crew');
      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        if (crewComp?.isSpotted) {
          return [agent.id];
        }
      }
      return crewIds.slice(0, 1);

    case 'other':
      // All except the triggered agent
      const spottedId = ctx.getEntitiesByType('crew').find((agent) => {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        return crewComp?.isSpotted;
      })?.id;
      return crewIds.filter((id) => id !== spottedId);

    case 'nearest':
      // Task 012: Return just the first crew (for noise triggers, we select based on proximity)
      // In a more sophisticated implementation, we'd select based on trigger source position
      return crewIds.slice(0, 1);

    default:
      return [];
  }
}

/**
 * Check if a rule condition is met (Task 011).
 */
function checkCondition(
  condition: RuleCondition,
  ctx: SystemContext,
  crew: Entity[]
): boolean {
  switch (condition.type) {
    case 'GUARD_NEARBY': {
      // Check if any guard is within range of any crew
      const guards = ctx.getEntitiesByType('guard');
      for (const agent of crew) {
        const crewPos = agent.components['heist.position'] as PositionComponent | undefined;
        if (!crewPos) continue;

        for (const guard of guards) {
          const guardPos = guard.components['heist.position'] as PositionComponent | undefined;
          if (!guardPos) continue;

          if (manhattan(crewPos.pos, guardPos.pos) <= condition.range) {
            return true;
          }
        }
      }
      return false;
    }

    case 'DOOR_BETWEEN': {
      // Check if there's a door between spotted crew and any guard
      const guards = ctx.getEntitiesByType('guard');
      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        const crewPos = agent.components['heist.position'] as PositionComponent | undefined;
        if (!crewComp?.isSpotted || !crewPos) continue;

        for (const guard of guards) {
          const guardPos = guard.components['heist.position'] as PositionComponent | undefined;
          if (!guardPos) continue;

          // Check if there's a door between crew and guard
          if (isDoorBetween(crewPos.pos, guardPos.pos, ctx.state)) {
            return true;
          }
        }
      }
      return false;
    }

    case 'HAS_TOKEN': {
      // Check if tokens are available
      const available = ctx.state.tokens.available[condition.kind];
      return available > 0;
    }

    case 'GUARD_DIST_GTE': {
      // Proactive condition: all guards must be > N tiles away from all crew
      const guards = ctx.getEntitiesByType('guard');
      for (const agent of crew) {
        const crewPos = agent.components['heist.position'] as PositionComponent | undefined;
        if (!crewPos) continue;

        for (const guard of guards) {
          const guardPos = guard.components['heist.position'] as PositionComponent | undefined;
          if (!guardPos) continue;

          // If any guard is within range, condition fails
          if (manhattan(crewPos.pos, guardPos.pos) < condition.tiles) {
            return false;
          }
        }
      }
      // All guards are far enough away
      return true;
    }

    case 'IN_SHADOW': {
      // Proactive condition: crew is in low-light area
      // Placeholder until light overlay is implemented - check if crew is in cover
      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        // For now, check if crew is in HIDING state or has low visibility
        if (crewComp?.state === 'HIDING') {
          return true;
        }
      }
      // TODO: When light overlay exists, check if tile light < threshold
      return false;
    }

    case 'STANCE_IS': {
      // Check if any crew has the matching stance
      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        if (crewComp && crewComp.stance === condition.stance) {
          return true;
        }
      }
      return false;
    }

    case 'NOT_SPOTTED': {
      // Check if no crew is currently spotted
      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        if (crewComp?.isSpotted) {
          return false;
        }
      }
      return true;
    }

    case 'ALERT_IN_RANGE': {
      // Check if alert level is within the specified range
      const alertLevel = ctx.state.alert.level;
      const alertOrder: AlertLevel[] = ['CALM', 'SUSPICIOUS', 'ALARM', 'LOCKDOWN'];
      const currentIdx = alertOrder.indexOf(alertLevel);
      const minIdx = condition.min ? alertOrder.indexOf(condition.min) : 0;
      const maxIdx = condition.max ? alertOrder.indexOf(condition.max) : alertOrder.length - 1;
      return currentIdx >= minIdx && currentIdx <= maxIdx;
    }

    case 'IS_IDLE': {
      // Check if any crew is idle (not working, not moving to objective)
      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        if (crewComp && crewComp.state === 'IDLE') {
          return true;
        }
      }
      return false;
    }

    case 'TEAMMATE_DISTANT': {
      // Check if nearest teammate is more than N tiles away from any crew
      const crewPositions: Vec2[] = [];
      for (const agent of crew) {
        const posComp = agent.components['heist.position'] as PositionComponent | undefined;
        if (posComp) {
          crewPositions.push(posComp.pos);
        }
      }

      if (crewPositions.length < 2) return false; // Need at least 2 crew

      // Check if any pair of crew is further than the range
      for (let i = 0; i < crewPositions.length; i++) {
        let minDist = Infinity;
        for (let j = 0; j < crewPositions.length; j++) {
          if (i !== j) {
            const dist = manhattan(crewPositions[i], crewPositions[j]);
            minDist = Math.min(minDist, dist);
          }
        }
        if (minDist > condition.range) {
          return true;
        }
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Get an entity's position (Task 012).
 */
function getEntityPosition(ctx: SystemContext, entityId: string): Vec2 | null {
  const entity = ctx.getEntity(entityId);
  if (!entity) return null;
  const posComp = entity.components['heist.position'] as PositionComponent | undefined;
  return posComp?.pos || null;
}

/**
 * Find the nearest door to a position (Task 011).
 */
function findNearestDoor(
  pos: Vec2,
  state: { doors: Record<string, { id: string; pos: Vec2; isOpen: boolean }> }
): { id: string; pos: Vec2; isOpen: boolean } | null {
  let nearest: { id: string; pos: Vec2; isOpen: boolean } | null = null;
  let nearestDist = Infinity;

  for (const door of Object.values(state.doors)) {
    const dist = manhattan(pos, door.pos);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = door;
    }
  }

  return nearest;
}

/**
 * Check if there's a door between two positions (simplified line check).
 */
function isDoorBetween(
  from: Vec2,
  to: Vec2,
  state: { doors: Record<string, { id: string; pos: Vec2; isOpen: boolean }> }
): boolean {
  // Simplified: Check if any door is roughly on the line between from and to
  for (const door of Object.values(state.doors)) {
    const doorPos = door.pos;

    // Check if door is between the two positions (Manhattan-style)
    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y, to.y);

    if (doorPos.x >= minX && doorPos.x <= maxX &&
        doorPos.y >= minY && doorPos.y <= maxY) {
      // Door is within the bounding box
      // Check if it's roughly on the line (for horizontal or vertical paths)
      if (from.x === to.x && doorPos.x === from.x) {
        // Vertical path
        return true;
      }
      if (from.y === to.y && doorPos.y === from.y) {
        // Horizontal path
        return true;
      }
      // For diagonal paths, check if door is adjacent to the line
      const distToLine = Math.min(
        Math.abs(doorPos.x - from.x) + Math.abs(doorPos.y - from.y),
        Math.abs(doorPos.x - to.x) + Math.abs(doorPos.y - to.y)
      );
      if (distToLine <= 2) {
        return true;
      }
    }
  }
  return false;
}

// ============================================================================
// TASK 002: New Trigger Evaluation Functions (triggers-actions-v2)
// ============================================================================

/** Default distance for APPROACH_EXIT trigger */
const DEFAULT_APPROACH_EXIT_DISTANCE = 3;

/**
 * Check if MADE_NOISE trigger should fire.
 * Fires when crew emits a noise event this tick.
 */
export function checkMadeNoiseTrigger(
  state: HeistState,
  events: SimEvent[],
  agentId: EntityId
): boolean {
  return events.some(
    e => e.type === HEIST_EVENTS.NOISE_EMITTED &&
         (e.payload as NoiseEmittedPayload).sourceId === agentId
  );
}

/**
 * Get context for MADE_NOISE trigger.
 */
export function getMadeNoiseContext(
  state: HeistState,
  events: SimEvent[],
  agentId: EntityId
): { loudness: number; pos: Vec2; kind: string } | null {
  const event = events.find(
    e => e.type === HEIST_EVENTS.NOISE_EMITTED &&
         (e.payload as NoiseEmittedPayload).sourceId === agentId
  );
  if (!event) return null;

  const payload = event.payload as NoiseEmittedPayload;
  return {
    loudness: payload.loudness,
    pos: payload.pos,
    kind: payload.kind,
  };
}

/**
 * Check if START_HACK trigger should fire.
 * Fires when HACK_STARTED event emitted for this agent.
 */
export function checkStartHackTrigger(
  state: HeistState,
  events: SimEvent[],
  agentId: EntityId
): boolean {
  return events.some(
    e => e.type === HEIST_EVENTS.HACK_STARTED &&
         (e.payload as HackStartedPayload).agentId === agentId
  );
}

/**
 * Get context for START_HACK trigger.
 */
export function getStartHackContext(
  state: HeistState,
  events: SimEvent[],
  agentId: EntityId
): { agentId: EntityId; targetId: string; position: Vec2 } | null {
  const event = events.find(
    e => e.type === HEIST_EVENTS.HACK_STARTED &&
         (e.payload as HackStartedPayload).agentId === agentId
  );
  if (!event) return null;

  const payload = event.payload as HackStartedPayload;
  return {
    agentId: payload.agentId,
    targetId: payload.targetId,
    position: payload.position,
  };
}

/**
 * Check if DOWNED trigger should fire.
 * Checks health directly - no event needed.
 */
export function checkDownedTrigger(
  trigger: { type: 'DOWNED'; who: 'self' | 'teammate' },
  state: HeistState,
  agentId: EntityId
): boolean {
  const crewEntities = Object.values(state.entities).filter(e => e.type === 'crew');

  if (trigger.who === 'self') {
    const self = crewEntities.find(e => e.id === agentId);
    const crewComp = self?.components['heist.crew'] as CrewComponent | undefined;
    return crewComp ? crewComp.health <= 0 : false;
  } else {
    // teammate = any other crew member downed
    return crewEntities.some(e => {
      if (e.id === agentId) return false;
      const crewComp = e.components['heist.crew'] as CrewComponent | undefined;
      return crewComp ? crewComp.health <= 0 : false;
    });
  }
}

/**
 * Get context for DOWNED trigger.
 */
export function getDownedContext(
  trigger: { type: 'DOWNED'; who: 'self' | 'teammate' },
  state: HeistState,
  agentId: EntityId
): { downedId: EntityId; position: Vec2 } | null {
  const crewEntities = Object.values(state.entities).filter(e => e.type === 'crew');

  if (trigger.who === 'self') {
    const self = crewEntities.find(e => e.id === agentId);
    const crewComp = self?.components['heist.crew'] as CrewComponent | undefined;
    const posComp = self?.components['heist.position'] as PositionComponent | undefined;
    if (crewComp && crewComp.health <= 0 && posComp) {
      return { downedId: agentId, position: posComp.pos };
    }
    return null;
  } else {
    const downed = crewEntities.find(e => {
      if (e.id === agentId) return false;
      const crewComp = e.components['heist.crew'] as CrewComponent | undefined;
      return crewComp && crewComp.health <= 0;
    });
    if (downed) {
      const posComp = downed.components['heist.position'] as PositionComponent | undefined;
      if (posComp) {
        return { downedId: downed.id, position: posComp.pos };
      }
    }
    return null;
  }
}

/**
 * Check if EXTRACT_READY trigger should fire.
 * Edge-triggered: fires when EXTRACTION_READY event emitted.
 */
export function checkExtractReadyTrigger(
  state: HeistState,
  events: SimEvent[]
): boolean {
  return events.some(e => e.type === HEIST_EVENTS.EXTRACTION_READY);
}

/**
 * Check if APPROACH_EXIT trigger should fire.
 * Level-triggered: fires while crew within distance of exit.
 */
export function checkApproachExitTrigger(
  trigger: { type: 'APPROACH_EXIT'; distance?: number },
  state: HeistState,
  agentId: EntityId
): boolean {
  const crew = state.entities[agentId];
  if (!crew) return false;

  const posComp = crew.components['heist.position'] as PositionComponent | undefined;
  if (!posComp) return false;

  const exitTiles = getExitTiles(state.map);
  if (exitTiles.length === 0) return false;

  const distance = trigger.distance ?? DEFAULT_APPROACH_EXIT_DISTANCE;
  const minDist = Math.min(...exitTiles.map(exit => manhattan(posComp.pos, exit)));

  return minDist <= distance;
}

/**
 * Get exit tile positions from map.
 */
function getExitTiles(map: { tiles: string[][]; width: number; height: number }): Vec2[] {
  const exits: Vec2[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.tiles[y]?.[x] === 'EXIT') {
        exits.push({ x, y });
      }
    }
  }
  return exits;
}

// ============================================================================
// TASK 005: Zone Tracking Functions (triggers-actions-v2)
// ============================================================================

/**
 * Compute zone for a tile position based on entity proximity.
 * Priority: objective_area > exit_area > guard_area > open
 */
export function computeTileZone(
  position: Vec2,
  state: HeistState
): ZoneId {
  const entities = Object.values(state.entities);

  // Check proximity to objectives (non-exit)
  const objectives = entities.filter(e =>
    e.type === 'objective' &&
    (e.components['heist.objective'] as ObjectiveComponent | undefined)?.type !== 'EXIT' &&
    (e.components['heist.objective'] as ObjectiveComponent | undefined)?.type !== 'ESCAPE'
  );
  for (const obj of objectives) {
    const pos = (obj.components['heist.position'] as PositionComponent | undefined)?.pos;
    if (pos && manhattan(position, pos) <= 3) {
      return 'objective_area';
    }
  }

  // Check proximity to exits (EXIT or ESCAPE objectives)
  const exits = entities.filter(e =>
    e.type === 'objective' &&
    ((e.components['heist.objective'] as ObjectiveComponent | undefined)?.type === 'EXIT' ||
     (e.components['heist.objective'] as ObjectiveComponent | undefined)?.type === 'ESCAPE')
  );
  for (const exit of exits) {
    const pos = (exit.components['heist.position'] as PositionComponent | undefined)?.pos;
    if (pos && manhattan(position, pos) <= 3) {
      return 'exit_area';
    }
  }

  // Check proximity to guards (dynamic zones)
  const guards = entities.filter(e => e.type === 'guard');
  for (const guard of guards) {
    const pos = (guard.components['heist.position'] as PositionComponent | undefined)?.pos;
    if (pos && manhattan(position, pos) <= 2) {
      return 'guard_area';
    }
  }

  return 'open';
}

/**
 * Check if crew entered a new zone, return ZONE_ENTERED event if so.
 */
export function checkZoneChange(
  state: HeistState,
  agentId: EntityId,
  newPosition: Vec2
): { type: string; tick: number; payload: ZoneEnteredPayload } | null {
  const previousZone = (state.crewZones[agentId] ?? 'open') as ZoneId;
  const newZone = computeTileZone(newPosition, state);

  if (newZone !== previousZone) {
    return {
      type: HEIST_EVENTS.ZONE_ENTERED,
      tick: state.tickIndex,
      payload: {
        agentId,
        newZone,
        previousZone,
        position: newPosition,
      },
    };
  }

  return null;
}

/**
 * Update crew zone in state.
 */
export function updateCrewZone(
  state: HeistState,
  agentId: EntityId,
  newZone: ZoneId
): HeistState {
  return {
    ...state,
    crewZones: {
      ...state.crewZones,
      [agentId]: newZone,
    },
  };
}

/**
 * Check if NEW_ZONE_ENTER trigger should fire.
 */
export function checkNewZoneEnterTrigger(
  state: HeistState,
  events: SimEvent[],
  agentId: EntityId
): boolean {
  return events.some(
    e => e.type === HEIST_EVENTS.ZONE_ENTERED &&
         (e.payload as ZoneEnteredPayload).agentId === agentId
  );
}

// ============================================================================
// TASK 004: Action Execution Functions (triggers-actions-v2)
// ============================================================================

/**
 * Execute CANCEL_TASK action - abort current interaction.
 */
export function executeCancelTask(
  state: HeistState,
  agentId: EntityId
): { state: HeistState; events: Array<{ type: string; tick: number; payload: unknown }> } {
  const events: Array<{ type: string; tick: number; payload: unknown }> = [];

  // Cancel hack if active
  if (state.hackState?.agentId === agentId) {
    events.push({
      type: 'TASK_CANCELLED',
      tick: state.tickIndex,
      payload: {
        agentId,
        taskType: 'hack' as const,
        progress: state.hackState.progress,
      },
    });

    return {
      state: {
        ...state,
        hackState: null,
      },
      events,
    };
  }

  // No active task to cancel
  return { state, events };
}

/**
 * Execute HACK_MODE action - change hack behavior.
 */
export function executeHackMode(
  state: HeistState,
  agentId: EntityId,
  mode: 'normal' | 'quiet'
): { state: HeistState; events: Array<{ type: string; tick: number; payload: unknown }> } {
  if (!state.hackState || state.hackState.agentId !== agentId) {
    return { state, events: [] }; // not hacking
  }

  if (state.hackState.mode === mode) {
    return { state, events: [] }; // already in mode
  }

  return {
    state: {
      ...state,
      hackState: {
        ...state.hackState,
        mode,
      },
    },
    events: [{
      type: 'HACK_MODE_CHANGED',
      tick: state.tickIndex,
      payload: { agentId, newMode: mode },
    }],
  };
}

/**
 * Execute DRAG_TO action - drag downed teammate.
 */
export function executeDragTo(
  state: HeistState,
  draggerId: EntityId,
  target: 'cover' | 'shadow'
): { state: HeistState; events: Array<{ type: string; tick: number; payload: unknown }> } {
  // Find dragger
  const dragger = state.entities[draggerId];
  if (!dragger) return { state, events: [] };

  const draggerPos = (dragger.components['heist.position'] as PositionComponent | undefined)?.pos;
  if (!draggerPos) return { state, events: [] };

  // Find adjacent downed teammate
  const downedTeammate = findAdjacentDownedTeammate(state, draggerPos, draggerId);
  if (!downedTeammate) return { state, events: [] };

  // Emit drag started event
  return {
    state, // Actual dragging is handled by movement system
    events: [{
      type: 'DRAG_STARTED',
      tick: state.tickIndex,
      payload: {
        draggerId,
        targetId: downedTeammate.id,
        destination: target,
      },
    }],
  };
}

/**
 * Find adjacent downed teammate.
 */
function findAdjacentDownedTeammate(
  state: HeistState,
  position: Vec2,
  excludeId: EntityId
): Entity | null {
  const crewEntities = Object.values(state.entities).filter(
    e => e.type === 'crew' && e.id !== excludeId
  );

  for (const crew of crewEntities) {
    const crewComp = crew.components['heist.crew'] as CrewComponent | undefined;
    const posComp = crew.components['heist.position'] as PositionComponent | undefined;

    if (!crewComp || !posComp) continue;

    // Check if downed (health <= 0) and adjacent (distance <= 1)
    if (crewComp.health <= 0 && manhattan(position, posComp.pos) <= 1) {
      return crew;
    }
  }

  return null;
}
