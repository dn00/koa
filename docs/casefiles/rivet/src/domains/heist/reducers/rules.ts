/**
 * Heist Kernel - Rules Reducers
 *
 * Handle RULE_TRIGGERED, RULE_ACTION_APPLIED, and veto events.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type { HeistState, CrewComponent, PositionComponent, Vec2, RulesState, PendingVeto } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type {
  RuleTriggeredPayload,
  RuleActionAppliedPayload,
  RulePendingVetoPayload,
  RuleAllowedPayload,
  RuleVetoedPayload,
  StanceChangedPayload,
} from '../events.js';
import type { DirectiveCard } from '../rules-types.js';
import { findPath, findNearestCover, findNearestShadow } from '../utils/pathfinding.js';

/**
 * Register rules reducers with the registry.
 */
export function registerRulesReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.RULE_TRIGGERED, ruleTriggeredReducer);
  registry.register(HEIST_EVENTS.RULE_ACTION_APPLIED, ruleActionAppliedReducer);
  registry.register(HEIST_EVENTS.RULE_PENDING_VETO, rulePendingVetoReducer);
  registry.register(HEIST_EVENTS.RULE_ALLOWED, ruleAllowedReducer);
  registry.register(HEIST_EVENTS.RULE_VETOED, ruleVetoedReducer);
  registry.register(HEIST_EVENTS.STANCE_CHANGED, stanceChangedReducer);
}

/**
 * Handle RULE_TRIGGERED event.
 * Updates cooldowns and charges.
 */
function ruleTriggeredReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as RuleTriggeredPayload;
  const { ruleId } = payload;

  if (!state.rules) return;
  const rulesState = state.rules;

  const rule = rulesState.equipped.find((r) => r.id === ruleId);
  if (!rule) return;

  // Set cooldown
  rulesState.cooldowns.set(ruleId, rule.cooldown);

  // Consume charge if applicable
  if (rule.charges !== undefined) {
    const current = rulesState.charges.get(ruleId) || 0;
    rulesState.charges.set(ruleId, current - 1);
  }

  // Track last fired
  rulesState.lastFired = { ruleId, tick: state.tickIndex };
}

/**
 * Handle RULE_ACTION_APPLIED event.
 * Applies the action to the affected agent.
 */
function ruleActionAppliedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as RuleActionAppliedPayload;
  const { ruleId, agentId, actionType } = payload;

  if (!state.rules) return;
  const rulesState = state.rules;

  const rule = rulesState.equipped.find((r) => r.id === ruleId);
  if (!rule) return;

  const agent = state.entities[agentId];
  if (!agent || agent.type !== 'crew') return;

  const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
  const posComp = agent.components['heist.position'] as PositionComponent | undefined;
  if (!crewComp || !posComp) return;

  // Apply action based on type
  switch (rule.action.type) {
    case 'MOVE_TO': {
      let targetPos: Vec2 | null = null;

      switch (rule.action.target) {
        case 'cover':
          targetPos = findNearestCover(posComp.pos, state.map);
          break;
        case 'shadow':
          targetPos = findNearestShadow(posComp.pos, state.map);
          break;
        case 'exit':
          targetPos = findExitPosition(state);
          break;
        case 'objective':
          targetPos = findActiveObjectivePosition(state);
          break;
        case 'leader':
          targetPos = findLeaderPosition(state, agentId);
          break;
      }

      if (targetPos) {
        const path = findPath(posComp.pos, targetPos, state.map);
        if (path.length > 0) {
          crewComp.path = path;
          crewComp.state = 'MOVING';
        }
      }
      break;
    }

    case 'HOLD':
      crewComp.state = 'IDLE';
      crewComp.path = [];
      break;

    case 'HIDE':
      // Start hide transition (crew-behavior system will progress it)
      // Per AH04: HIDING takes time, affected by HIDE_FASTER module
      crewComp.hideProgress = 0;
      crewComp.state = 'IDLE'; // Stay idle while hiding
      break;

    case 'CONTINUE':
      crewComp.overrideFleeUntil = state.tickIndex + state.config.crew.overrideFleeDuration;
      break;

    case 'USE_TOKEN': {
      const token = rule.action.token;
      const tokenConfig = state.config.tokens;
      if (state.tokens.available[token] > 0 && state.tokens.cooldownUntil <= state.tickIndex) {
        state.tokens.available[token]--;
        state.tokens.cooldownUntil = state.tickIndex + tokenConfig.cooldownTicks;

        switch (token) {
          case 'LIGHTS':
            state.effects.lightsOut = true;
            state.effects.lightsOutUntil = state.tickIndex + tokenConfig.effects.LIGHTS.durationTicks;
            break;
          case 'RADIO':
            state.effects.radioJammed = true;
            state.effects.radioJammedUntil = state.tickIndex + tokenConfig.effects.RADIO.durationTicks;
            break;
          case 'SMOKE':
            state.effects.smokeZones.push({
              pos: { ...posComp.pos },
              until: state.tickIndex + tokenConfig.effects.SMOKE.durationTicks,
            });
            break;
        }
      }
      break;
    }

    case 'FREEZE_GUARDS':
      // Future: implement guard freeze
      break;

    case 'SET_STANCE':
      // Set pending stance change (stance system will process it)
      crewComp.pendingStance = rule.action.stance;
      break;

    case 'TOGGLE_DOOR':
      // Set pending door toggle (door system will process it)
      if (state.doors) {
        const doors = Object.values(state.doors);
        const nearestDoor = doors
          .filter((d) => {
            const dx = Math.abs(d.pos.x - posComp.pos.x);
            const dy = Math.abs(d.pos.y - posComp.pos.y);
            return dx + dy <= 1; // Adjacent only
          })
          .sort((a, b) => {
            const distA = Math.abs(a.pos.x - posComp.pos.x) + Math.abs(a.pos.y - posComp.pos.y);
            const distB = Math.abs(b.pos.x - posComp.pos.x) + Math.abs(b.pos.y - posComp.pos.y);
            return distA - distB;
          })[0];
        if (nearestDoor) {
          crewComp.pendingDoorToggle = nearestDoor.id;
        }
      }
      break;
  }
}

/**
 * Find exit position from map.
 */
function findExitPosition(state: HeistState): Vec2 | null {
  const { tiles, width, height } = state.map;

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
 * Find active objective position.
 */
function findActiveObjectivePosition(state: HeistState): Vec2 | null {
  for (const entity of Object.values(state.entities)) {
    if (entity.type === 'objective') {
      const objComp = entity.components['heist.objective'] as any;
      const posComp = entity.components['heist.position'] as PositionComponent | undefined;
      if (objComp?.state === 'ACTIVE' && posComp) {
        return posComp.pos;
      }
    }
  }
  return null;
}

/**
 * Find leader (first crew member) position.
 */
function findLeaderPosition(state: HeistState, excludeId: string): Vec2 | null {
  const crewIds = Object.keys(state.entities)
    .filter((id) => {
      const entity = state.entities[id];
      return entity && entity.type === 'crew' && id !== excludeId;
    })
    .sort();

  if (crewIds.length === 0) return null;

  const leaderId = crewIds[0];
  if (!leaderId) return null;

  const leader = state.entities[leaderId];
  const posComp = leader?.components['heist.position'] as PositionComponent | undefined;
  return posComp?.pos || null;
}

/**
 * Handle RULE_PENDING_VETO event.
 * Sets pending veto state and pauses the game.
 */
function rulePendingVetoReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as RulePendingVetoPayload;

  state.pendingVeto = {
    ruleId: payload.ruleId,
    ruleName: payload.ruleName,
    triggerEvent: payload.triggerEvent,
    predictedIntent: payload.predictedIntent,
    agentId: payload.agentId,
  };

  // Auto-pause for veto decision
  state.shouldPause = true;
  state.pauseReason = `Veto window: ${payload.ruleName}`;
}

/**
 * Handle RULE_ALLOWED event.
 * Clears pending veto state.
 */
function ruleAllowedReducer(state: HeistState, event: SimEvent): void {
  // Clear pending veto state
  state.pendingVeto = undefined;
  state.pendingVetoDecision = undefined;
}

/**
 * Handle RULE_VETOED event.
 * Clears pending veto state and sets lockout.
 */
function ruleVetoedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as RuleVetoedPayload;

  // Set lockout for the vetoed rule
  if (state.rules) {
    if (!state.rules.lockouts) {
      state.rules.lockouts = new Map();
    }
    state.rules.lockouts.set(payload.ruleId, payload.lockoutUntil);
  }

  // Clear pending veto state
  state.pendingVeto = undefined;
  state.pendingVetoDecision = undefined;
}

/**
 * Handle STANCE_CHANGED event.
 * Updates the director stance.
 */
function stanceChangedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as StanceChangedPayload;
  state.stance = payload.to;
}
