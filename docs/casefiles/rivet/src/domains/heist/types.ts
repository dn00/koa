/**
 * Heist Kernel - Core Types
 *
 * Extracted and adapted from prototype.ts for modular kernel architecture.
 * Uses component-based entity pattern from packages/kernel.
 */

// === PRIMITIVES ===

export type Vec2 = { x: number; y: number };
export type EntityId = string;
export type TickIndex = number;

// === EVENT ID FIELDS (Task 004) ===

/**
 * Fields used to compute deterministic eventId.
 * eventId = sha256(canonical_json(EventIdFields))
 */
export interface EventIdFields {
  worldId: string;
  tickIndex: TickIndex;
  ordinal: number;
  type: string;
  payload: unknown;
  causedBy: import('./kernel.js').Cause;
  attribution: import('./kernel.js').Attribution;
}

// === ENUMS ===

export type AlertLevel = 'CALM' | 'SUSPICIOUS' | 'ALARM' | 'LOCKDOWN';

export const ALERT_ORDER: readonly AlertLevel[] = ['CALM', 'SUSPICIOUS', 'ALARM', 'LOCKDOWN'] as const;

export function alertGte(current: AlertLevel, threshold: AlertLevel): boolean {
  return ALERT_ORDER.indexOf(current) >= ALERT_ORDER.indexOf(threshold);
}

export type TileType = 'FLOOR' | 'WALL' | 'DOOR' | 'VENT' | 'TERMINAL' | 'EXIT' | 'VAULT' | 'SHADOW';

export type TokenType = 'LIGHTS' | 'RADIO' | 'SMOKE' | 'DECOY' | 'LOOP_CAMERA';

export type GuardState = 'PATROL' | 'INVESTIGATE' | 'PURSUE' | 'RETURN' | 'SWEEP' | 'HOLD';

export type CrewState = 'IDLE' | 'MOVING' | 'WORKING' | 'HIDING' | 'FLEEING';

// === HEAT LEVEL TYPES ===

/**
 * Heat level based on thresholds.
 * 0 = heat < 25 (calm)
 * 1 = heat >= 25 (pressure)
 * 2 = heat >= 50 (danger)
 * 3 = heat >= 75 (critical)
 */
export type HeatLevel = 0 | 1 | 2 | 3;

/**
 * Effects applied at each heat level.
 * Multipliers are applied to base values - lower = more penalty.
 */
export interface HeatLevelEffects {
  /** Multiplier for guard investigate give-up chance (lower = more persistent) */
  investigateGiveUpMultiplier: number;
  /** Multiplier for cover bonus (lower = weaker cover) */
  coverBonusMultiplier: number;
  /** Multiplier for hide progress per tick (lower = slower hiding) */
  hideProgressMultiplier: number;
  /** Multiplier for lockdown threshold (lower = faster lockdown) */
  lockdownThresholdMultiplier: number;
}

// === CAMERA TYPES (perception-systems Task 001) ===

export type CameraType = 'FIXED' | 'DOME' | 'SWEEPING';

export interface SweepPattern {
  minFacing: number;        // degrees
  maxFacing: number;        // degrees
  degreesPerTick: number;   // rotation speed
  direction: 1 | -1;        // current sweep direction
}

export interface CameraComponent {
  cameraType: CameraType;
  facing: number;           // degrees (0-359)
  fovDegrees: number;       // field of view in degrees (360 for DOME)
  range: number;            // tiles
  sweepPattern?: SweepPattern; // required for SWEEPING type
}

export interface CameraState {
  enabled: boolean;
  currentFacing: number;    // degrees (0-359)
  loopedUntilTick?: number; // if looped by token
  /** Detection accumulator per crew target (0-100). Key is crew EntityId. */
  detectionAccum?: Record<EntityId, number>;
  /** Track which targets have crossed NOTICED threshold (for CREW_LOST_BY_CAMERA logic) */
  noticedTargets?: Set<EntityId>;
}

// === OVERLAY TYPES (perception-systems Tasks 005, 007) ===

export interface OverlayFields {
  light: Uint16Array;   // 0-1000 fixed-point (1000 = fully lit)
  smoke: Uint16Array;   // 0-1000 fixed-point (1000 = fully obscured)
}

export interface LightEmitter {
  position: Vec2;
  radius: number;           // tiles
  intensity: number;        // 0-1000 (fixed-point)
  falloff: 'LINEAR' | 'STEP';
  poweredBy?: string;       // powerDomainId for CUT_LIGHTS
}

export interface SmokeSource {
  position: Vec2;
  radius: number;
  intensity: number;        // 0-1000
  untilTick: number;        // when source expires
  falloff: 'LINEAR' | 'CONSTANT';
}

// === EMERGENT SYSTEMS TYPES ===

// Task 001: Crew Stance
export type CrewStance = 'SNEAK' | 'NORMAL' | 'SPRINT';

// Task 002: Door State
export type DoorId = string; // Format: "door_x_y"

export interface DoorState {
  id: DoorId;
  pos: Vec2;
  isOpen: boolean;
}

// Task 003: Alert Behavior Mode (for guard coordination)
export type AlertBehaviorMode = 'CALM' | 'SUSPICIOUS' | 'ALARM' | 'LOCKDOWN';

export interface CoordinationState {
  lastBroadcastTick: TickIndex;
}

// Task 001 (triggers-actions-v2): HackState for START_HACK trigger
export interface HackState {
  agentId: EntityId;
  targetId: string;       // Objective ID
  startTick: number;
  mode: 'normal' | 'quiet';
  progress: number;       // 0-100
}

// === COMPONENTS ===

export interface PositionComponent {
  pos: Vec2;
  facing: Vec2;
}

export interface CrewComponent {
  state: CrewState;
  health: number;
  maxHealth: number;
  path: Vec2[];
  currentObjective?: string;
  overrideFleeUntil?: TickIndex;
  isSpotted: boolean;
  /** Progress toward HIDING state (0-100). When reaches 100, transitions to HIDING. */
  hideProgress?: number;
  /** Crew movement stance (default: 'NORMAL') - Task 001 */
  stance: CrewStance;
  /** Pending stance change from SET_STANCE action - Task 004 */
  pendingStance?: CrewStance;
  /** Pending door toggle from TOGGLE_DOOR action - Task 005 */
  pendingDoorToggle?: DoorId;
  /** Movement points accumulated for fractional speed (0-1) - Task 004 */
  movePoints?: number;
}

export interface GuardComponent {
  state: GuardState;
  patrolRoute: Vec2[];
  patrolIndex: number;
  patrolDelay: number;
  alertTarget?: Vec2;
  lastSeen?: { pos: Vec2; tick: TickIndex };
  visionRange: number;
  visionAngle: number;
  /** Detection accumulator per crew target (0-100). Key is crew EntityId. */
  detectionAccum: Record<EntityId, number>;
  /** Track which targets have crossed NOTICED threshold (for CREW_LOST logic) */
  noticedTargets: Set<EntityId>;
  /** SWEEP: current search waypoint */
  sweepTarget?: Vec2;
  /** SWEEP: ticks until next waypoint change */
  sweepWaypointTimer?: number;
  /** HOLD: chokepoint being held */
  holdTarget?: Vec2;
}

export interface ObjectiveComponent {
  label: string;
  type: 'EXIT' | 'VAULT' | 'TERMINAL' | 'OTHER';
  state: 'LOCKED' | 'ACTIVE' | 'DONE';
  progress: number;
  prerequisites: string[];
}

// === ENTITY ===

export type EntityType = 'crew' | 'guard' | 'objective' | 'camera';

export interface Entity {
  id: EntityId;
  type: EntityType;
  /** When entity was created (optional for backwards compatibility) */
  createdTick?: number;
  /** Tombstone - when entity was deleted (for deterministic replay) */
  deletedTick?: number;
  components: Record<string, unknown>;
}

// === MAP ===

export interface HeistMap {
  width: number;
  height: number;
  tiles: TileType[][];
}

// === ALERT STATE ===

export interface AlertState {
  level: AlertLevel;
  suspicionTimer: number;
  alarmTimer: number;
  suspicionEvidence: number;
  alarmEvidence: number;
}

// === TOKEN STATE ===

export interface TokenState {
  available: {
    LIGHTS: number;
    RADIO: number;
    SMOKE: number;
    DECOY: number;
    LOOP_CAMERA: number;
  };
  cooldownUntil: TickIndex;
}

// === EFFECTS STATE ===

export interface EffectsState {
  lightsOut: boolean;
  lightsOutUntil: TickIndex;
  radioJammed: boolean;
  radioJammedUntil: TickIndex;
  smokeZones: { pos: Vec2; until: TickIndex }[];
  decoyZones: { pos: Vec2; until: TickIndex }[];
}

// === RNG STATE ===

export interface RNGState {
  algo: 'xoroshiro128**';
  s0: string; // 16-char hex
  s1: string; // 16-char hex
}

// === CONFIG REFERENCE ===

/**
 * Runtime config merged from pack and defaults.
 * Systems should read from `ctx.config` instead of importing defaults.
 * Non-system code can still access via `state.config` for backward compatibility.
 */
export interface RuntimeConfig {
  security: {
    guardVisionRange: number;
    guardVisionAngle: number;
    guardPeripheralRange: number;
    suspicionToAlarm: number;
    alarmToLockdown: number;
    suspicionDecayTicks: number;
    alarmDecayTicks: number;
    patrolDelayMin: number;
    patrolDelayMax: number;
    investigateGiveUpChance: number;
    randomInvestigateChance: number;
    suspiciousInvestigateChance: number;
    pursueLostSightTicks: number;
    spottedHeat: number;
    alarmHeat: number;
    lockdownHeat: number;
    closeCallHeat: number;
    lockdownHeatPerTick: number;
  };
  tokens: {
    cooldownTicks: number;
    effects: {
      LIGHTS: { durationTicks: number; visionMultiplier: number };
      RADIO: { durationTicks: number };
      SMOKE: { durationTicks: number; radius: number };
      DECOY: { durationTicks: number; noiseLevel: number };
    };
  };
  crew: {
    moveSpeed: number;
    workProgressPerTick: number;
    overrideFleeDuration: number;
  };
  detection: {
    gainRate: number;
    decayRate: number;
    noticedThreshold: number;
    spottedThreshold: number;
    lostThreshold: number;
  };
  maxHeat: number;
  // Emergent systems config (Tasks 004, 005, 006)
  stance: {
    sneak: { speedMultiplier: number; noiseMultiplier: number; visibilityMultiplier: number };
    sprint: { speedMultiplier: number; noiseMultiplier: number; visibilityMultiplier: number };
  };
  doors: {
    toggleNoise: number;
    toggleTicks: number;
    blocksLOSWhenClosed: boolean;
    defaultOpen: boolean;
  };
  coordination: {
    broadcastRange: number;
    broadcastCooldownTicks: number;
  };
  alertModes: {
    CALM: { investigateChance: number; patrolSpeedMultiplier: number; convergeOnSpotted: boolean; holdChokepoints: boolean };
    SUSPICIOUS: { investigateChance: number; patrolSpeedMultiplier: number; convergeOnSpotted: boolean; holdChokepoints: boolean };
    ALARM: { investigateChance: number; patrolSpeedMultiplier: number; convergeOnSpotted: boolean; holdChokepoints: boolean };
    LOCKDOWN: { investigateChance: number; patrolSpeedMultiplier: number; convergeOnSpotted: boolean; holdChokepoints: boolean };
  };
  sweep: {
    searchRadius: number;
    waypointChangeTicks: number;
  };
  heatThresholds: {
    level1Threshold: number;
    level2Threshold: number;
    level3Threshold: number;
    level1: HeatLevelEffects;
    level2: HeatLevelEffects;
    level3: HeatLevelEffects;
  };
  // Pathing config (crew-pathing Task 001)
  pathing: PathingConfig;
}

// === RULES STATE (imported from rules-types for convenience) ===

export interface RulesState {
  equipped: import('./rules-types.js').DirectiveCard[];
  cooldowns: Map<string, TickIndex>;
  charges: Map<string, number>;
  lastFired?: { ruleId: string; tick: TickIndex } | undefined;
  /** Lockout for vetoed rules - prevents immediate refire (per specss.md 6.3) */
  lockouts: Map<string, TickIndex>;
}

// === PENDING VETO (per specss.md Section 6.3) ===

export interface PendingVeto {
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  predictedIntent: string;
  agentId: string;
}

// === MODULES STATE (per specss.md Section 13) ===

export interface ModulesState {
  equipped: import('./rules-types.js').ModuleCard[];
  /** Track first alert for FIRST_ALERT_DELAYED effect */
  firstAlertOccurred: boolean;
}

// === HEIST STATE ===

export interface HeistState {
  tickIndex: TickIndex;
  worldId: string;

  map: HeistMap;
  entities: Record<EntityId, Entity>;

  alert: AlertState;
  tokens: TokenState;
  effects: EffectsState;

  heat: number;

  /** Heat level derived from heat value and thresholds (0-3) */
  heatLevel: HeatLevel;

  rngStreams: Record<string, RNGState>;

  /** Hash of current state (computed after reducers, excludes hash fields) */
  stateHash: string;

  /** Hash chain tip (links to previous tick) */
  lastEventHash: string;

  /**
   * Runtime config merged from pack and defaults.
   *
   * @deprecated Access config via `ctx.config` in systems instead of
   * `ctx.state.config`. Direct state.config access bypasses the clean
   * separation between state and config. This field remains for backward
   * compatibility and for non-system code that needs config access.
   *
   * @example
   * // In a system - PREFERRED:
   * const { guardVisionRange } = ctx.config.security;
   *
   * // In a system - DEPRECATED:
   * const { guardVisionRange } = ctx.state.config.security;
   */
  config: RuntimeConfig;

  /** Rules state - equipped directives, cooldowns, charges */
  rules?: RulesState;

  /** Modules state - equipped passive effects (per specss.md Section 13) */
  modules?: ModulesState;

  /** Director stance - shifts crew behavior weights (per specss.md Section 8.2) */
  stance: import('./rules-types.js').DirectorStance;

  /** Pending veto - rule waiting for player allow/veto (per specss.md 6.3) */
  pendingVeto?: PendingVeto | undefined;

  result?: 'ESCAPED' | 'CAUGHT' | 'TIMEOUT';

  /** Autopause - set by systems when player attention needed */
  shouldPause?: boolean;
  pauseReason?: string | undefined;

  /** Pending player token use (injected before step) - legacy, no targeting */
  pendingTokenUse?: TokenType;

  /** Pending player token fire with optional targeting (new) */
  pendingTokenFire?: import('./rules-types.js').TokenFire;

  /** Pending player veto decision (injected before step) */
  pendingVetoDecision?: 'ALLOW' | 'VETO' | undefined;

  // === EMERGENT SYSTEMS STATE ===

  /** Door states - Task 002 */
  doors: Record<DoorId, DoorState>;

  /** Guard coordination state - Task 003 */
  coordination: CoordinationState;

  /** Recent noise heard events - Task 012 (for HEARD_NOISE_NEAR trigger) */
  recentNoiseHeard?: Array<{
    guardId: EntityId;
    sourcePos: Vec2;
    tick: TickIndex;
  }>;

  /** Recent camera cone entries - Task 011 (for CAMERA_CONE trigger) */
  recentConeEntries?: Array<{
    crewId: EntityId;
    cameraId: EntityId;
    distance: number;
    tick: TickIndex;
  }>;

  /** Camera cone status from previous tick - Task 011 (for edge detection) */
  coneStatus?: Map<string, Set<string>>;

  // === TRIGGERS-ACTIONS-V2 STATE ===

  /** Current hack state - null when not hacking (Task 001) */
  hackState: HackState | null;

  /** Whether all objectives are done and extraction is ready (Task 001) */
  extractionReady: boolean;

  /** Last known zone per crew member (Task 001) */
  crewZones: Record<EntityId, string>;

  // === PERCEPTION SYSTEMS STATE ===

  /** Camera states by entity ID (perception-systems Task 001) */
  cameras: Record<EntityId, CameraState>;

  /** Light and smoke overlays (perception-systems Tasks 005, 007) */
  overlays: OverlayFields;

  /** Active smoke sources (perception-systems Task 007) */
  smokeSources: SmokeSource[];

  // === PATHING STATE (crew-pathing Task 001) ===

  /** Pathing state - routes, reservations, door queues (crew-pathing Task 001) */
  pathing?: PathingState;
}

// === UTILITY FUNCTIONS ===

export function vecEq(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

export function vecKey(v: Vec2): string {
  return `${v.x},${v.y}`;
}

export function manhattan(a: Vec2, b: Vec2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// === TYPE GUARDS ===

export function isAlertLevel(value: unknown): value is AlertLevel {
  return typeof value === 'string' && ALERT_ORDER.includes(value as AlertLevel);
}

export function isTileType(value: unknown): value is TileType {
  const validTiles: TileType[] = ['FLOOR', 'WALL', 'DOOR', 'VENT', 'TERMINAL', 'EXIT', 'VAULT', 'SHADOW'];
  return typeof value === 'string' && validTiles.includes(value as TileType);
}

export function isTokenType(value: unknown): value is TokenType {
  const validTokens: TokenType[] = ['LIGHTS', 'RADIO', 'SMOKE', 'DECOY', 'LOOP_CAMERA'];
  return typeof value === 'string' && validTokens.includes(value as TokenType);
}

export function isGuardState(value: unknown): value is GuardState {
  const validStates: GuardState[] = ['PATROL', 'INVESTIGATE', 'PURSUE', 'RETURN', 'SWEEP', 'HOLD'];
  return typeof value === 'string' && validStates.includes(value as GuardState);
}

export function isCrewState(value: unknown): value is CrewState {
  const validStates: CrewState[] = ['IDLE', 'MOVING', 'WORKING', 'HIDING', 'FLEEING'];
  return typeof value === 'string' && validStates.includes(value as CrewState);
}

// === EMERGENT SYSTEMS TYPE GUARDS ===

export function isCrewStance(value: unknown): value is CrewStance {
  const validStances: CrewStance[] = ['SNEAK', 'NORMAL', 'SPRINT'];
  return typeof value === 'string' && validStances.includes(value as CrewStance);
}

export function isDoorId(value: unknown): value is DoorId {
  if (typeof value !== 'string') return false;
  // Format: "door_x_y" where x and y are non-negative integers
  const match = value.match(/^door_(\d+)_(\d+)$/);
  return match !== null;
}

export function isAlertBehaviorMode(value: unknown): value is AlertBehaviorMode {
  const validModes: AlertBehaviorMode[] = ['CALM', 'SUSPICIOUS', 'ALARM', 'LOCKDOWN'];
  return typeof value === 'string' && validModes.includes(value as AlertBehaviorMode);
}

// === PATHING TYPE GUARDS (crew-pathing Task 001) ===

export function isMoveKind(value: unknown): value is MoveKind {
  const validKinds: MoveKind[] = ['STEP', 'WAIT', 'OPEN_DOOR', 'QUEUE_DOOR', 'SIDESTEP'];
  return typeof value === 'string' && validKinds.includes(value as MoveKind);
}

export function isMoveReason(value: unknown): value is MoveReason {
  const validReasons: MoveReason[] = [
    'FOLLOW_ROUTE',
    'AVOID_DANGER',
    'DOOR_CLOSED',
    'DOOR_CAPACITY',
    'RESERVATION_BLOCKED',
    'LOCAL_AVOIDANCE',
    'STUCK_REPLAN',
    'YIELD',
    'INTERACTING',
  ];
  return typeof value === 'string' && validReasons.includes(value as MoveReason);
}

// === PATHING TYPES (crew-pathing Task 001) ===

export interface RoutePlanGoal {
  kind: 'tile' | 'objective';
  tileId?: string;         // vecKey format "x,y"
  objectiveId?: string;
}

export interface RoutePlan {
  agentId: EntityId;
  goal: RoutePlanGoal;
  path: readonly Vec2[];   // includes current tile as first element (readonly for immutability)
  cursor: number;          // index into path for next step
  plannedAtTick: TickIndex;
  planHash: string;        // deterministic fingerprint of inputs
  replanCooldownUntilTick: TickIndex;
}

export type MoveKind =
  | 'STEP'          // normal step to next tile
  | 'WAIT'          // choose not to move
  | 'OPEN_DOOR'     // interact to open door edge
  | 'QUEUE_DOOR'    // waiting for door capacity
  | 'SIDESTEP';     // local avoidance

export type MoveReason =
  | 'FOLLOW_ROUTE'
  | 'AVOID_DANGER'
  | 'DOOR_CLOSED'
  | 'DOOR_CAPACITY'
  | 'RESERVATION_BLOCKED'
  | 'LOCAL_AVOIDANCE'
  | 'STUCK_REPLAN'
  | 'YIELD'
  | 'INTERACTING';  // hacking/working

export interface MoveIntent {
  tick: TickIndex;
  agentId: EntityId;
  from: string;            // tileId (vecKey format)
  to: string;              // tileId (may equal from for WAIT)
  kind: MoveKind;
  priorityKey: string;     // deterministic ordering
  why: {
    reason: MoveReason;
    details?: Record<string, unknown>;
  };
}

export interface ReservationTable {
  horizonH: number;        // e.g. 8
  // key: `${tileId}@${tick}` where tick is absolute tick
  reservedBy: Record<string, EntityId>;
}

export interface DoorQueue {
  doorId: string;
  a: string;               // tileId side A
  b: string;               // tileId side B
  state: 'OPEN' | 'CLOSED' | 'OPENING';
  openingByAgent?: EntityId;
  openingCompletesAtTick?: TickIndex;
  queue: EntityId[];       // deterministic FIFO
  lastTraversalTick?: TickIndex;
}

export interface PathingState {
  routes: Record<EntityId, RoutePlan>;
  reservations: ReservationTable;
  doorQueues: Record<string, DoorQueue>;
  /** Ticks each agent has been blocked (for stuckTicks detection) */
  blockedTicks: Record<EntityId, number>;
  /** Increments when overlays change materially (for planHash invalidation) */
  overlayEpoch: number;
}

export interface PathingConfig {
  // A* costs
  dangerCostPerTile: number;
  dangerRadius: number;
  lightCostMultiplier: number;
  crowdCost: number;
  ventCostMultiplier: number;

  // Guard state danger multipliers
  dangerCostByGuardState: Record<GuardState, number>;

  // Route caching
  replanCooldownTicks: number;
  stuckTicks: number;

  // Reservations
  reservationHorizonH: number;
  reservePenaltyBIG: number;

  // Resolution
  allowSwapsSameTeam: boolean;
  allowSwapsAcrossTeams: boolean;
  allowCycleRotate: boolean;

  // Door queues
  doorCapacityPerTick: number;
  doorOpenTicks: number;
  autoCloseDelayTicks: number;

  // Sidestep
  enableSidestep: boolean;
  dangerSidestepMax: number;
}

// === CAMERA TYPE GUARDS (perception-systems Task 001) ===

export function isCameraType(value: unknown): value is CameraType {
  const validTypes: CameraType[] = ['FIXED', 'DOME', 'SWEEPING'];
  return typeof value === 'string' && validTypes.includes(value as CameraType);
}

/**
 * Validate a CameraComponent for correctness.
 * Returns an array of error messages (empty if valid).
 */
export function validateCameraComponent(camera: CameraComponent): string[] {
  const errors: string[] = [];

  // DOME cameras must have 360 degree FOV
  if (camera.cameraType === 'DOME' && camera.fovDegrees !== 360) {
    errors.push('DOME cameras must have 360 degree FOV');
  }

  // SWEEPING cameras must have sweepPattern defined
  if (camera.cameraType === 'SWEEPING' && !camera.sweepPattern) {
    errors.push('SWEEPING cameras require sweepPattern to be defined');
  }

  return errors;
}
