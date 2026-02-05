/**
 * Heist Kernel - Main Integration
 *
 * Wires all systems and reducers together into a complete kernel.
 */

import type { HeistState, Entity, TileType, Vec2, RuntimeConfig, RulesState, ModulesState, DoorId, DoorState, CoordinationState } from './types.js';
import type { SystemDefinition, SystemContext, SimEvent, Reducer } from './kernel.js';
import { SystemRegistry, ReducerRegistry } from './kernel.js';
import { createRNG, getRNGState, type RNG } from './rng.js';
import type { HeistPack } from './pack-types.js';
import type { DirectiveCard, ModuleCard } from './rules-types.js';

// Import all systems
import { visionSystem } from './systems/vision.js';
import { crewBehaviorSystem } from './systems/crew-behavior.js';
import { crewMovementSystem } from './systems/crew-movement.js';
import { guardMovementSystem } from './systems/guard-movement.js';
import { alertSystem } from './systems/alert.js';
import { catchSystem } from './systems/catch.js';
import { rulesSystem } from './systems/rules.js';
import { objectivesSystem } from './systems/objectives.js';
import { tokensSystem } from './systems/tokens.js';
import { outcomeSystem } from './systems/outcome.js';
import { noiseSystem } from './systems/noise.js';
// Emergent systems (Tasks 004, 005, 006)
import { stanceSystem } from './systems/stance.js';
import { doorSystem } from './systems/doors.js';
import { coordinationSystem } from './systems/coordination.js';
// Heat threshold system (heat-thresholds feature Task 002)
import { heatThresholdSystem } from './systems/heat.js';

// Import all reducer registrations
import { registerVisionReducers } from './reducers/vision.js';
import { registerMovementReducers } from './reducers/movement.js';
import { registerAlertReducers } from './reducers/alert.js';
import { registerCatchReducers } from './reducers/catch.js';
import { registerRulesReducers } from './reducers/rules.js';
import { registerObjectivesReducers } from './reducers/objectives.js';
import { registerTokensReducers } from './reducers/tokens.js';
import { registerOutcomeReducers } from './reducers/outcome.js';
import { registerNoiseReducers } from './reducers/noise.js';
// Emergent reducers (Tasks 004, 005, 006)
import { registerStanceReducers } from './reducers/stance.js';
import { registerDoorReducers } from './reducers/doors.js';
import { registerCoordinationReducers } from './reducers/coordination.js';
// Heat threshold reducer (heat-thresholds feature Task 003)
import { registerHeatReducers } from './reducers/heat.js';

import { DEFAULT_SECURITY, DEFAULT_TOKEN_CONFIG, DEFAULT_CREW_CONFIG, DEFAULT_HEIST_CONFIG, DEFAULT_DOOR_CONFIG, DEFAULT_STANCE_CONFIG, DEFAULT_COORDINATION_CONFIG, DEFAULT_ALERT_MODES_CONFIG, buildHeistConfig, validateHeistConfig, type ConfigError } from './config.js';
import { validatePack, GENESIS_HASH, computeEventId, computeBatchHash, computeNextLastEventHash, computeStateHash } from './canonical.js';
import type { Cause } from './kernel.js';
// Perception utils (perception-systems Tasks 002, 005, 006, 007, 008)
import { computeLightOverlay } from './utils/perception.js';
// Pathing utils (crew-pathing Task 007)
import { initializePathingState } from './utils/pathfinding.js';

/**
 * Error thrown when config validation fails.
 */
export class ConfigValidationError extends Error {
  constructor(public readonly errors: ConfigError[]) {
    const messages = errors.map(e => e.message).join('; ');
    super(`Config validation failed: ${messages}`);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Heist kernel instance.
 */
export interface HeistKernel {
  systems: SystemRegistry;
  reducers: ReducerRegistry;

  /**
   * Initialize state from a pack.
   * @param pack - The heist pack with facility, cards, etc.
   * @param seed - RNG seed for determinism
   * @param selectedDirectiveIds - Optional list of directive IDs to equip. If not provided, all cards from pool are equipped.
   */
  initState(pack: HeistPack, seed: string, selectedDirectiveIds?: string[]): HeistState;

  /**
   * Execute one tick.
   */
  step(state: HeistState): { state: HeistState; events: SimEvent[] };

  /**
   * Run until outcome or max ticks.
   */
  simulate(
    state: HeistState,
    maxTicks?: number
  ): { finalState: HeistState; events: SimEvent[]; outcome: 'ESCAPED' | 'CAUGHT' | 'TIMEOUT' | 'PENDING' };
}

/**
 * Create a heist kernel with all systems and reducers registered.
 */
export function createHeistKernel(): HeistKernel {
  // Register all systems
  const systems = new SystemRegistry();
  systems.register(rulesSystem);
  systems.register(tokensSystem);
  systems.register(visionSystem);
  systems.register(coordinationSystem); // Task 006: priority 12, after vision
  systems.register(stanceSystem);       // Task 004: priority 15, before crew movement
  systems.register(crewBehaviorSystem);
  systems.register(doorSystem);         // Task 005: priority 18, after crew behavior
  systems.register(crewMovementSystem);
  systems.register(guardMovementSystem);
  systems.register(objectivesSystem);
  systems.register(noiseSystem);
  systems.register(alertSystem);
  systems.register(heatThresholdSystem); // Heat-thresholds Task 002: priority 95, after alert
  systems.register(catchSystem);
  systems.register(outcomeSystem);

  // Register all reducers
  const reducers = new ReducerRegistry();
  registerVisionReducers(reducers);
  registerMovementReducers(reducers);
  registerAlertReducers(reducers);
  registerCatchReducers(reducers);
  registerRulesReducers(reducers);
  registerObjectivesReducers(reducers);
  registerTokensReducers(reducers);
  registerNoiseReducers(reducers);
  registerOutcomeReducers(reducers);
  // Emergent reducers (Tasks 004, 005, 006)
  registerStanceReducers(reducers);
  registerDoorReducers(reducers);
  registerCoordinationReducers(reducers);
  // Heat threshold reducer (heat-thresholds feature Task 003)
  registerHeatReducers(reducers);

  return {
    systems,
    reducers,

    initState(pack: HeistPack, seed: string, selectedDirectiveIds?: string[]): HeistState {
      return initializeState(pack, seed, selectedDirectiveIds);
    },

    step(state: HeistState): { state: HeistState; events: SimEvent[] } {
      return executeStep(systems, reducers, state);
    },

    simulate(
      state: HeistState,
      maxTicks?: number
    ): { finalState: HeistState; events: SimEvent[]; outcome: 'ESCAPED' | 'CAUGHT' | 'TIMEOUT' | 'PENDING' } {
      const allEvents: SimEvent[] = [];
      let currentState = state;
      // Use state's maxHeat as default tick limit (game ends when heat >= maxHeat)
      const tickLimit = maxTicks ?? state.config.maxHeat;

      while (!currentState.result && currentState.tickIndex < tickLimit) {
        const { state: newState, events } = executeStep(systems, reducers, currentState);
        allEvents.push(...events);
        currentState = newState;
      }

      return {
        finalState: currentState,
        events: allEvents,
        outcome: currentState.result || 'PENDING',
      };
    },
  };
}

/**
 * Initialize state from a pack.
 */
function initializeState(pack: HeistPack, seed: string, selectedDirectiveIds?: string[]): HeistState {
  // Validate pack integrity
  validatePack(pack);

  const { facility, directivePool } = pack;

  // Filter directives if selection provided, otherwise use all
  let equippedDirectives: DirectiveCard[] = [];
  if (directivePool && directivePool.length > 0) {
    if (selectedDirectiveIds && selectedDirectiveIds.length > 0) {
      // Filter to only selected cards, maintaining selection order
      equippedDirectives = selectedDirectiveIds
        .map(id => directivePool.find(d => d.id === id))
        .filter((d): d is DirectiveCard => d !== undefined);
    } else {
      // No selection = equip all (backwards compatible)
      equippedDirectives = [...directivePool];
    }
  }

  const entities: Record<string, Entity> = {};

  // Create crew at spawn
  entities['crew-1'] = {
    id: 'crew-1',
    type: 'crew',
    components: {
      'heist.position': {
        pos: { ...facility.crewSpawn },
        facing: { x: 0, y: 1 },
      },
      'heist.crew': {
        state: 'IDLE',
        health: 100,
        maxHealth: 100,
        path: [],
        isSpotted: false,
        stance: 'NORMAL', // Default stance (Task 001)
      },
    },
  };

  // Create guards from spawns
  for (const guardSpawn of facility.guardSpawns) {
    // Calculate initial facing direction towards first patrol waypoint
    let facing = { x: 0, y: -1 };
    if (guardSpawn.patrolRoute.length > 0) {
      const firstWaypoint = guardSpawn.patrolRoute[0];
      const dx = firstWaypoint.x - guardSpawn.pos.x;
      const dy = firstWaypoint.y - guardSpawn.pos.y;
      if (dx !== 0 || dy !== 0) {
        // Normalize to unit direction
        const len = Math.sqrt(dx * dx + dy * dy);
        facing = { x: Math.round(dx / len), y: Math.round(dy / len) };
      }
    }

    entities[guardSpawn.id] = {
      id: guardSpawn.id,
      type: 'guard',
      components: {
        'heist.position': {
          pos: { ...guardSpawn.pos },
          facing,
        },
        'heist.guard': {
          state: 'PATROL',
          patrolRoute: guardSpawn.patrolRoute.map((p) => ({ ...p })),
          patrolIndex: 0,
          patrolDelay: 0,
          lastSeen: undefined,
          alertTarget: undefined,
          visionRange: pack.security?.guardVisionRange ?? DEFAULT_SECURITY.guardVisionRange,
          visionAngle: pack.security?.guardVisionAngle ?? DEFAULT_SECURITY.guardVisionAngle,
          // Detection accumulator fields
          detectionAccum: {},
          noticedTargets: new Set(),
        },
      },
    };
  }

  // Create objectives
  for (const objDef of facility.objectives) {
    entities[objDef.id] = {
      id: objDef.id,
      type: 'objective',
      components: {
        'heist.position': {
          pos: { ...objDef.pos },
          facing: { x: 0, y: 0 },
        },
        'heist.objective': {
          state: objDef.prerequisites.length === 0 ? 'ACTIVE' : 'LOCKED',
          progress: 0,
          label: objDef.id,
          type: objDef.type,
          prerequisites: objDef.prerequisites,
        },
      },
    };
  }

  // Initialize rules state (always, even if no directives)
  const rulesState: RulesState = {
    equipped: equippedDirectives,
    cooldowns: new Map(),
    charges: new Map(),
    lockouts: new Map(),
  };

  // Initialize charges for cards that have them
  for (const card of equippedDirectives) {
    if (card.charges !== undefined) {
      rulesState.charges.set(card.id, card.charges);
    }
  }

  // Initialize modules state
  const modulesState: ModulesState = {
    equipped: pack.modulePool || [],
    firstAlertOccurred: false,
  };

  // Build runtime config using centralized function (Task 004)
  const config = buildHeistConfig(pack.config, pack.security);

  // Validate config and throw if invalid (Task 004)
  const validationErrors = validateHeistConfig(config);
  if (validationErrors.length > 0) {
    throw new ConfigValidationError(validationErrors);
  }

  // Initialize doors from DOOR tiles (Task 002)
  const doors: Record<DoorId, DoorState> = {};
  const doorDefaultOpen = config.doors.defaultOpen;
  for (let y = 0; y < facility.height; y++) {
    for (let x = 0; x < facility.width; x++) {
      if (facility.tiles[y][x] === 'DOOR') {
        const doorId: DoorId = `door_${x}_${y}`;
        doors[doorId] = {
          id: doorId,
          pos: { x, y },
          isOpen: doorDefaultOpen,
        };
      }
    }
  }

  // Initialize coordination state (Task 003)
  const coordination: CoordinationState = {
    lastBroadcastTick: 0,
  };

  // Create cameras from facility config (perception-systems Task 002)
  const cameraStates: Record<string, import('./types.js').CameraState> = {};
  if (facility.cameras && facility.cameras.length > 0) {
    const seenIds = new Set<string>();

    for (const camDef of facility.cameras) {
      // ERR-1: Duplicate camera ID
      if (seenIds.has(camDef.id)) {
        throw new Error(`Duplicate camera ID: ${camDef.id}`);
      }
      seenIds.add(camDef.id);

      // ERR-2: Camera position out of bounds
      if (
        camDef.position.x < 0 ||
        camDef.position.x >= facility.width ||
        camDef.position.y < 0 ||
        camDef.position.y >= facility.height
      ) {
        throw new Error(`Camera ${camDef.id} position out of bounds`);
      }

      // EC-2: Camera on wall tile - log warning but still create
      const tile = facility.tiles[camDef.position.y]?.[camDef.position.x];
      if (tile === 'WALL') {
        // Could log warning: `Camera ${camDef.id} placed on WALL tile`
      }

      const entityId = `camera-${camDef.id}`;

      // Create camera entity
      entities[entityId] = {
        id: entityId,
        type: 'camera',
        components: {
          'heist.position': {
            pos: { ...camDef.position },
            facing: { x: 0, y: -1 }, // Default facing, actual facing in camera component
          },
          'heist.camera': {
            cameraType: camDef.cameraType,
            facing: camDef.facing,
            fovDegrees: camDef.fovDegrees ?? (camDef.cameraType === 'DOME' ? 360 : 90),
            range: camDef.range ?? 6,
            sweepPattern: camDef.sweepPattern
              ? {
                  minFacing: camDef.sweepPattern.minFacing,
                  maxFacing: camDef.sweepPattern.maxFacing,
                  degreesPerTick: camDef.sweepPattern.degreesPerTick ?? 15,
                  direction: 1 as const,
                }
              : undefined,
          },
        },
      };

      // Create camera state
      cameraStates[entityId] = {
        enabled: true,
        currentFacing: camDef.facing,
      };
    }
  }

  const state: HeistState = {
    tickIndex: 0,
    worldId: seed,
    map: {
      width: facility.width,
      height: facility.height,
      tiles: facility.tiles.map((row) => [...row]),
    },
    entities,
    alert: {
      level: 'CALM',
      suspicionTimer: 0,
      alarmTimer: 0,
      suspicionEvidence: 0,
      alarmEvidence: 0,
    },
    tokens: {
      available: {
        LIGHTS: DEFAULT_TOKEN_CONFIG.lightCharges,
        RADIO: DEFAULT_TOKEN_CONFIG.radioCharges,
        SMOKE: DEFAULT_TOKEN_CONFIG.smokeCharges,
        DECOY: DEFAULT_TOKEN_CONFIG.decoyCharges,
        LOOP_CAMERA: 0, // Must be explicitly added to pack
      },
      cooldownUntil: 0,
    },
    effects: {
      lightsOut: false,
      lightsOutUntil: 0,
      radioJammed: false,
      radioJammedUntil: 0,
      smokeZones: [],
      decoyZones: [],
    },
    heat: 0,
    heatLevel: 0,
    rngStreams: {},
    config,
    rules: rulesState,
    modules: modulesState,
    stance: 'COMMIT', // Default stance per specss.md
    // Emergent systems state
    doors,
    coordination,
    // Hash chain fields (Task 003)
    stateHash: '',       // Computed after state is built
    lastEventHash: GENESIS_HASH,
    // Triggers-actions-v2 state (Task 001)
    hackState: null,
    extractionReady: false,
    crewZones: {},
    // Perception systems state (Tasks 001, 002, 005, 007)
    cameras: cameraStates,
    overlays: {
      light: new Uint16Array(facility.width * facility.height),
      smoke: new Uint16Array(facility.width * facility.height),
    },
    smokeSources: [],
    // Pathing state (crew-pathing Task 007)
    pathing: initializePathingState(),
  };

  // Compute light overlay from facility emitters (perception-systems Tasks 005, 006)
  if (facility.lightEmitters && facility.lightEmitters.length > 0) {
    state.overlays.light = computeLightOverlay(
      facility.width,
      facility.height,
      facility.lightEmitters,
      new Set() // No disabled power domains initially
    );
  } else {
    // Initialize light overlay with ambient light
    state.overlays.light.fill(200); // DEFAULT_LIGHT_CONFIG.ambientLevel
  }

  return state;
}

/**
 * Execute a single tick step.
 */
function executeStep(
  systems: SystemRegistry,
  reducers: ReducerRegistry,
  state: HeistState
): { state: HeistState; events: SimEvent[] } {
  const proposedEvents: SimEvent[] = [];
  let eventOrdinal = 0;

  // Create context for systems
  const ctx: SystemContext = {
    state,
    tickIndex: state.tickIndex,
    worldId: state.worldId,
    config: state.config,
    proposeEvent(type: string, payload: unknown, attribution: import('./kernel.js').Attribution, cause?: Cause) {
      const ordinal = eventOrdinal++;
      const causedBy: Cause = cause ?? { kind: 'system', systemId: 'unknown' };
      proposedEvents.push({
        type,
        payload,
        tickIndex: state.tickIndex,
        ordinal,
        attribution,
        causedBy,
        eventId: '', // Computed after all events collected
      } as import('./kernel.js').SimEvent);
    },
    rng(streamId: string): RNG {
      return createRNG(state.worldId, streamId, state.tickIndex);
    },
    getEntitiesByType(entityType: string): Entity[] {
      return Object.values(state.entities)
        .filter((e) => e.type === entityType)
        .sort((a, b) => a.id.localeCompare(b.id));
    },
    getEntity(id: string): Entity | undefined {
      return state.entities[id];
    },
  };

  // Run all systems (they propose events)
  for (const system of systems.getSystems()) {
    system.run(ctx);
  }

  // Compute eventIds for all events (before reducers, event content is final)
  for (const event of proposedEvents) {
    event.eventId = computeEventId({
      worldId: state.worldId,
      tickIndex: event.tickIndex,
      ordinal: event.ordinal,
      type: event.type,
      payload: event.payload,
      causedBy: event.causedBy,
      attribution: event.attribution,
    });
  }

  // Clone state for mutation
  const newState = cloneState(state);

  // Clear pause flag from previous tick - pauses are one-tick signals
  // Reducers can set it again if a new pause condition arises this tick
  newState.shouldPause = false;
  newState.pauseReason = undefined;

  // Apply all proposed events via reducers
  for (const event of proposedEvents) {
    const reducer = reducers.get(event.type);
    if (reducer) {
      reducer(newState, event);
    }
  }

  // Increment tick
  newState.tickIndex++;

  // Increment heat (only if game not ended)
  if (!newState.result) {
    newState.heat++;
  }

  // Decrement cooldowns in rules state
  if (newState.rules) {
    const rulesState = newState.rules;
    for (const [ruleId, cooldown] of rulesState.cooldowns) {
      if (cooldown > 0) {
        rulesState.cooldowns.set(ruleId, cooldown - 1);
      }
    }
  }

  // Decrement guard patrol delays
  for (const entity of Object.values(newState.entities)) {
    if (entity.type === 'guard') {
      const guardComp = entity.components['heist.guard'] as any;
      if (guardComp && guardComp.patrolDelay > 0) {
        guardComp.patrolDelay--;
      }
    }
  }

  // Compute hash chain (after reducers applied, state is final)
  const batchHash = computeBatchHash(proposedEvents);
  const prevLastEventHash = state.lastEventHash ?? GENESIS_HASH;
  newState.lastEventHash = computeNextLastEventHash(prevLastEventHash, batchHash);
  newState.stateHash = computeStateHash(newState);

  return { state: newState, events: proposedEvents };
}

/**
 * Deep clone state for mutation.
 */
function cloneState(state: HeistState): HeistState {
  const cloned: HeistState = {
    tickIndex: state.tickIndex,
    worldId: state.worldId,
    map: {
      width: state.map.width,
      height: state.map.height,
      tiles: state.map.tiles.map((row) => [...row]),
    },
    entities: {},
    alert: { ...state.alert },
    tokens: {
      available: { ...state.tokens.available },
      cooldownUntil: state.tokens.cooldownUntil,
    },
    effects: {
      lightsOut: state.effects.lightsOut,
      lightsOutUntil: state.effects.lightsOutUntil,
      radioJammed: state.effects.radioJammed,
      radioJammedUntil: state.effects.radioJammedUntil,
      smokeZones: state.effects.smokeZones.map((z) => ({
        pos: { ...z.pos },
        until: z.until,
      })),
      decoyZones: (state.effects.decoyZones ?? []).map((z) => ({
        pos: { ...z.pos },
        until: z.until,
      })),
    },
    heat: state.heat,
    heatLevel: state.heatLevel,
    ...(state.result ? { result: state.result } : {}),
    rngStreams: { ...state.rngStreams },
    config: state.config, // Config is immutable during run, just copy reference
    // Autopause - reset each tick (systems will set if needed)
    shouldPause: false,
    pauseReason: undefined,
    ...(state.pendingTokenUse ? { pendingTokenUse: state.pendingTokenUse } : {}),
    ...(state.pendingVetoDecision ? { pendingVetoDecision: state.pendingVetoDecision } : {}),
    ...(state.pendingVeto ? { pendingVeto: { ...state.pendingVeto } } : {}),
    stance: state.stance,
    // Clone emergent systems state
    doors: {},
    coordination: { ...state.coordination },
    // Hash chain fields (Task 003)
    stateHash: state.stateHash,
    lastEventHash: state.lastEventHash,
    // Triggers-actions-v2 state (Task 001)
    hackState: state.hackState ? { ...state.hackState } : null,
    extractionReady: state.extractionReady,
    crewZones: { ...state.crewZones },
    // Perception systems state (Tasks 001, 005, 007)
    cameras: {},
    overlays: state.overlays ? {
      light: new Uint16Array(state.overlays.light),
      smoke: new Uint16Array(state.overlays.smoke),
    } : {
      light: new Uint16Array(state.map.width * state.map.height),
      smoke: new Uint16Array(state.map.width * state.map.height),
    },
    smokeSources: (state.smokeSources ?? []).map((s) => ({
      position: { ...s.position },
      radius: s.radius,
      intensity: s.intensity,
      untilTick: s.untilTick,
      falloff: s.falloff,
    })),
  };

  // Initialize light overlay with ambient if created fresh
  if (!state.overlays) {
    cloned.overlays.light.fill(200); // DEFAULT_LIGHT_CONFIG.ambientLevel
  }

  // Clone camera states (including detection state from Task 003)
  for (const [cameraId, cameraState] of Object.entries(state.cameras ?? {})) {
    cloned.cameras[cameraId] = {
      enabled: cameraState.enabled,
      currentFacing: cameraState.currentFacing,
      ...(cameraState.loopedUntilTick !== undefined ? { loopedUntilTick: cameraState.loopedUntilTick } : {}),
      // Clone detection state (Task 003)
      ...(cameraState.detectionAccum ? { detectionAccum: { ...cameraState.detectionAccum } } : {}),
      ...(cameraState.noticedTargets ? { noticedTargets: new Set(cameraState.noticedTargets) } : {}),
    };
  }

  // Deep clone entities
  for (const [id, entity] of Object.entries(state.entities)) {
    cloned.entities[id] = {
      id: entity.id,
      type: entity.type,
      components: {},
    };

    for (const [compName, comp] of Object.entries(entity.components)) {
      cloned.entities[id].components[compName] = cloneComponent(comp);
    }
  }

  // Clone rules state if present
  if (state.rules) {
    cloned.rules = {
      equipped: state.rules.equipped, // Cards are immutable, no need to deep clone
      cooldowns: new Map(state.rules.cooldowns),
      charges: new Map(state.rules.charges),
      lastFired: state.rules.lastFired ? { ...state.rules.lastFired } : undefined,
      lockouts: new Map(state.rules.lockouts || []),
    };
  }

  // Clone modules state if present
  if (state.modules) {
    cloned.modules = {
      equipped: state.modules.equipped, // Modules are immutable
      firstAlertOccurred: state.modules.firstAlertOccurred,
    };
  }

  // Clone doors state
  for (const [doorId, door] of Object.entries(state.doors)) {
    cloned.doors[doorId] = {
      id: door.id,
      pos: { ...door.pos },
      isOpen: door.isOpen,
    };
  }

  // Clone pathing state if present (crew-pathing Task 007)
  if (state.pathing) {
    cloned.pathing = {
      routes: {},
      reservations: {
        horizonH: state.pathing.reservations.horizonH,
        reservedBy: { ...state.pathing.reservations.reservedBy },
      },
      doorQueues: {},
      blockedTicks: { ...state.pathing.blockedTicks },
      overlayEpoch: state.pathing.overlayEpoch,
    };

    // Clone routes
    for (const [agentId, route] of Object.entries(state.pathing.routes)) {
      cloned.pathing.routes[agentId] = {
        ...route,
        path: [...route.path],
        goal: { ...route.goal },
      };
    }

    // Clone door queues
    for (const [doorId, queue] of Object.entries(state.pathing.doorQueues)) {
      cloned.pathing.doorQueues[doorId] = {
        ...queue,
        queue: [...queue.queue],
      };
    }
  }

  return cloned;
}

/**
 * Clone a component (shallow for simple objects, deep for arrays/objects).
 */
function cloneComponent(comp: unknown): unknown {
  if (comp === null || typeof comp !== 'object') {
    return comp;
  }

  // Handle Set (for noticedTargets)
  if (comp instanceof Set) {
    return new Set(comp);
  }

  if (Array.isArray(comp)) {
    return comp.map((item) => cloneComponent(item));
  }

  const cloned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(comp)) {
    cloned[key] = cloneComponent(value);
  }
  return cloned;
}
