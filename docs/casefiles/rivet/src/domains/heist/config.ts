/**
 * Heist Kernel - Configuration
 *
 * Tunable parameters extracted from prototype.ts
 */

import type { TickIndex, RuntimeConfig, HeatLevelEffects, PathingConfig, GuardState } from './types.js';

// === SECURITY PROFILE ===

export interface SecurityProfile {
  // Guard vision
  guardVisionRange: number;
  guardVisionAngle: number; // degrees
  guardPeripheralRange: number; // always-visible adjacent range

  // Alert thresholds
  suspicionToAlarm: number; // ticks of evidence needed
  alarmToLockdown: number; // ticks of evidence needed

  // Alert decay
  suspicionDecayTicks: TickIndex;
  alarmDecayTicks: TickIndex;

  // Guard behavior
  patrolDelayMin: number;
  patrolDelayMax: number;
  investigateGiveUpChance: number; // per tick
  randomInvestigateChance: number; // per tick while patrolling
  suspiciousInvestigateChance: number; // per tick while suspicious

  // Catch mechanics
  pursueLostSightTicks: number; // ticks before downgrade to investigate

  // Heat
  spottedHeat: number;
  alarmHeat: number;
  lockdownHeat: number;
  closeCallHeat: number;
  lockdownHeatPerTick: number;

  // Detection accumulator
  detection: {
    gainRate: number;          // Accumulator gain per tick at v=1.0 (default: 25)
    decayRate: number;         // Accumulator decay per tick when not visible (default: 8)
    noticedThreshold: number;  // Emit CREW_NOTICED at this value (default: 35)
    spottedThreshold: number;  // Emit CREW_SPOTTED at this value (default: 70)
    lostThreshold: number;     // Emit CREW_LOST when drops below after noticed (default: 25)
  };
}

export const DEFAULT_SECURITY: SecurityProfile = {
  // Guard vision
  guardVisionRange: 5, // Reduced for viable stealth play
  guardVisionAngle: 90,
  guardPeripheralRange: 1,

  // Alert thresholds
  suspicionToAlarm: 12, // Balanced escalation time
  alarmToLockdown: 15, // More buffer before lockdown

  // Alert decay
  suspicionDecayTicks: 25, // Faster recovery possible
  alarmDecayTicks: 40, // Reasonable alarm decay

  // Guard behavior
  patrolDelayMin: 1,
  patrolDelayMax: 3, // Some delay at waypoints
  investigateGiveUpChance: 0.06, // Moderately persistent (tuned from 0.04)
  randomInvestigateChance: 0.06, // Moderate random searching (tuned from 0.08)
  suspiciousInvestigateChance: 0.20, // Moderate investigation (tuned from 0.25)

  // Catch mechanics
  pursueLostSightTicks: 16, // Moderate pursuit persistence (tuned from 20)

  // Heat
  spottedHeat: 2, // Moderate spotted penalty
  alarmHeat: 8, // Moderate alarm heat
  lockdownHeat: 15, // Serious lockdown
  closeCallHeat: 1, // Minor close call penalty
  lockdownHeatPerTick: 1, // Lockdown still drains heat

  // Detection accumulator
  detection: {
    gainRate: 30,           // Faster detection buildup (was 25)
    decayRate: 6,           // Slower decay - harder to shake (was 8)
    noticedThreshold: 35,
    spottedThreshold: 70,
    lostThreshold: 20,      // Must get further away to lose them (was 25)
  },
};

// === TOKEN CONFIG ===

export interface TokenConfig {
  cooldownTicks: TickIndex;
  lightCharges: number;
  radioCharges: number;
  smokeCharges: number;
  decoyCharges: number;
  loopCameraCharges: number;
  effects: {
    LIGHTS: { durationTicks: TickIndex; visionMultiplier: number };
    RADIO: { durationTicks: TickIndex };
    SMOKE: { durationTicks: TickIndex; radius: number };
    DECOY: { durationTicks: TickIndex; noiseLevel: number };
    LOOP_CAMERA: { durationTicks: TickIndex };
  };
}

export const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  cooldownTicks: 10,
  lightCharges: 2,
  radioCharges: 2,
  smokeCharges: 3,
  decoyCharges: 2,
  loopCameraCharges: 0, // Must be explicitly added
  effects: {
    LIGHTS: { durationTicks: 12, visionMultiplier: 0.5 },
    RADIO: { durationTicks: 15 },
    SMOKE: { durationTicks: 10, radius: 2 },
    DECOY: { durationTicks: 8, noiseLevel: 50 },
    LOOP_CAMERA: { durationTicks: 15 },
  },
};

// === CREW CONFIG ===

export interface CrewConfig {
  moveSpeed: number; // tiles per tick
  workProgressPerTick: number;
  overrideFleeDuration: TickIndex;
}

export const DEFAULT_CREW_CONFIG: CrewConfig = {
  moveSpeed: 1,
  workProgressPerTick: 15, // Boosted for passive playstyles (was 12)
  overrideFleeDuration: 10, // Reasonable override time
};

// === STANCE CONFIG ===

export interface StanceModeConfig {
  speedMultiplier: number;
  noiseMultiplier: number;
  visibilityMultiplier: number;
}

export interface StanceConfig {
  sneak: StanceModeConfig;
  sprint: StanceModeConfig;
}

export const DEFAULT_STANCE_CONFIG: StanceConfig = {
  sneak: { speedMultiplier: 0.5, noiseMultiplier: 0.5, visibilityMultiplier: 0.7 },
  sprint: { speedMultiplier: 1.5, noiseMultiplier: 2.0, visibilityMultiplier: 1.3 },
};

// === DOOR CONFIG ===

export interface DoorConfig {
  toggleNoise: number;
  toggleTicks: number;
  blocksLOSWhenClosed: boolean;
  defaultOpen: boolean;
}

export const DEFAULT_DOOR_CONFIG: DoorConfig = {
  toggleNoise: 30,
  toggleTicks: 1,
  blocksLOSWhenClosed: true,
  defaultOpen: false,
};

// === COORDINATION CONFIG ===

export interface CoordinationConfig {
  broadcastRange: number;
  broadcastCooldownTicks: number;
}

export const DEFAULT_COORDINATION_CONFIG: CoordinationConfig = {
  broadcastRange: 10,
  broadcastCooldownTicks: 5,
};

// === SWEEP CONFIG ===

export interface SweepConfig {
  searchRadius: number;        // tiles from last known position
  waypointChangeTicks: number; // ticks before changing search target
}

export const DEFAULT_SWEEP_CONFIG: SweepConfig = {
  searchRadius: 8,
  waypointChangeTicks: 15,
};

// === ALERT MODES CONFIG ===

export interface AlertModeConfig {
  investigateChance: number;
  patrolSpeedMultiplier: number;
  convergeOnSpotted: boolean;
  holdChokepoints: boolean;
}

export interface AlertModesConfig {
  CALM: AlertModeConfig;
  SUSPICIOUS: AlertModeConfig;
  ALARM: AlertModeConfig;
  LOCKDOWN: AlertModeConfig;
}

export const DEFAULT_ALERT_MODES_CONFIG: AlertModesConfig = {
  CALM: { investigateChance: 0.05, patrolSpeedMultiplier: 1.0, convergeOnSpotted: false, holdChokepoints: false },
  SUSPICIOUS: { investigateChance: 0.15, patrolSpeedMultiplier: 1.0, convergeOnSpotted: false, holdChokepoints: false },
  ALARM: { investigateChance: 0.30, patrolSpeedMultiplier: 1.2, convergeOnSpotted: true, holdChokepoints: false },
  LOCKDOWN: { investigateChance: 0.00, patrolSpeedMultiplier: 0.5, convergeOnSpotted: true, holdChokepoints: true },
};

// === HEAT THRESHOLD CONFIG ===

export interface HeatThresholdConfig {
  /** Heat value for level 1 (default: 25) */
  level1Threshold: number;
  /** Heat value for level 2 (default: 50) */
  level2Threshold: number;
  /** Heat value for level 3 (default: 75) */
  level3Threshold: number;

  /** Effects at level 1 (25+ heat) */
  level1: HeatLevelEffects;
  /** Effects at level 2 (50+ heat) */
  level2: HeatLevelEffects;
  /** Effects at level 3 (75+ heat) */
  level3: HeatLevelEffects;
}

export const DEFAULT_HEAT_THRESHOLD_CONFIG: HeatThresholdConfig = {
  level1Threshold: 25,
  level2Threshold: 50,
  level3Threshold: 75,

  level1: {
    investigateGiveUpMultiplier: 0.5, // Guards investigate 2x longer
    coverBonusMultiplier: 1.0,        // No cover penalty yet
    hideProgressMultiplier: 1.0,      // No hide penalty yet
    lockdownThresholdMultiplier: 1.0, // No lockdown acceleration yet
  },
  level2: {
    investigateGiveUpMultiplier: 0.5, // Still 2x longer
    coverBonusMultiplier: 0.7,        // Cover 30% weaker
    hideProgressMultiplier: 0.7,      // Hiding 30% slower
    lockdownThresholdMultiplier: 1.0, // No lockdown acceleration yet
  },
  level3: {
    investigateGiveUpMultiplier: 0.3, // Guards very persistent
    coverBonusMultiplier: 0.5,        // Cover 50% weaker
    hideProgressMultiplier: 0.5,      // Hiding 50% slower
    lockdownThresholdMultiplier: 0.5, // Lockdown 2x faster
  },
};

// === HACK MODE CONFIG (triggers-actions-v2 Task 003) ===

export interface HackModeConfig {
  normal: {
    durationMultiplier: number;   // 1.0
    noiseMultiplier: number;      // 1.0
  };
  quiet: {
    durationMultiplier: number;   // 2.0 (takes twice as long)
    noiseMultiplier: number;      // 0.3 (70% quieter)
  };
}

export const DEFAULT_HACK_CONFIG = {
  baseDurationTicks: 10,
  baseNoise: 20,
  modes: {
    normal: {
      durationMultiplier: 1.0,
      noiseMultiplier: 1.0,
    },
    quiet: {
      durationMultiplier: 2.0,
      noiseMultiplier: 0.3,
    },
  },
};

// === DRAG CONFIG (triggers-actions-v2 Task 003) ===

export const DEFAULT_DRAG_CONFIG = {
  speedMultiplier: 0.5,       // Half speed while dragging
  requiresAdjacent: true,     // Must be adjacent to drag
};

// === LIGHT CONFIG (perception-systems Task 005) ===

export interface LightConfig {
  ambientLevel: number;       // 0-1000 base light everywhere
  maxLevel: number;           // 1000 fully lit (cap)
}

export const DEFAULT_LIGHT_CONFIG: LightConfig = {
  ambientLevel: 200,          // 0.2 base light everywhere
  maxLevel: 1000,             // 1.0 fully lit
};

// === SMOKE CONFIG (perception-systems Task 007) ===

export interface SmokeConfig {
  decayPerTick: number;       // reduces intensity per tick after source expires
  defaultRadius: number;      // tiles
  defaultIntensity: number;   // 0-1000
  defaultDuration: number;    // ticks
}

export const DEFAULT_SMOKE_CONFIG: SmokeConfig = {
  decayPerTick: 50,
  defaultRadius: 2,
  defaultIntensity: 800,
  defaultDuration: 10,
};

// === CAMERA CONFIG (perception-systems Task 001) ===

export interface CameraTypeConfig {
  fovDegrees: number;
  range: number;
  degreesPerTick?: number;    // only for sweeping
}

export interface CameraConfig {
  fixed: CameraTypeConfig;
  dome: CameraTypeConfig;
  sweeping: CameraTypeConfig & { degreesPerTick: number };
  detection: {
    gainRate: number;
    decayRate: number;
  };
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  fixed: { fovDegrees: 90, range: 6 },
  dome: { fovDegrees: 360, range: 4 },
  sweeping: { fovDegrees: 60, range: 7, degreesPerTick: 15 },
  detection: { gainRate: 25, decayRate: 4 },
};

// === PATHING CONFIG (crew-pathing Task 001) ===

export const DEFAULT_PATHING_CONFIG: PathingConfig = {
  // A* costs
  dangerCostPerTile: 10,
  dangerRadius: 3,
  lightCostMultiplier: 2,
  crowdCost: 2,
  ventCostMultiplier: 0.5,

  // Guard state danger multipliers
  dangerCostByGuardState: {
    PATROL: 1.0,
    INVESTIGATE: 1.5,
    PURSUE: 3.0,
    SWEEP: 2.0,
    HOLD: 1.5,
    RETURN: 1.0,
  } as Record<GuardState, number>,

  // Route caching
  replanCooldownTicks: 6,
  stuckTicks: 10,

  // Reservations
  reservationHorizonH: 8,
  reservePenaltyBIG: 50,

  // Resolution
  allowSwapsSameTeam: true,
  allowSwapsAcrossTeams: false,
  allowCycleRotate: false,

  // Door queues
  doorCapacityPerTick: 1,
  doorOpenTicks: 6,
  autoCloseDelayTicks: 12,

  // Sidestep
  enableSidestep: true,
  dangerSidestepMax: 8,
};

// === HEIST CONFIG ===

export interface HeistConfig {
  security: SecurityProfile;
  tokens: TokenConfig;
  crew: CrewConfig;
  detection?: {
    gainRate?: number;
    decayRate?: number;
    noticedThreshold?: number;
    spottedThreshold?: number;
    lostThreshold?: number;
  };
  maxHeat: number;
  // Emergent systems config
  stance: StanceConfig;
  doors: DoorConfig;
  coordination: CoordinationConfig;
  alertModes: AlertModesConfig;
  sweep?: Partial<SweepConfig>;
  heatThresholds?: Partial<HeatThresholdConfig & {
    level1?: Partial<HeatLevelEffects>;
    level2?: Partial<HeatLevelEffects>;
    level3?: Partial<HeatLevelEffects>;
  }>;
  // Pathing config (crew-pathing Task 001)
  pathing?: Partial<PathingConfig>;
}

export const DEFAULT_HEIST_CONFIG: HeistConfig = {
  security: DEFAULT_SECURITY,
  tokens: DEFAULT_TOKEN_CONFIG,
  crew: DEFAULT_CREW_CONFIG,
  maxHeat: 135, // Higher budget - helps aggressive playstyles finish
  // Emergent systems config
  stance: DEFAULT_STANCE_CONFIG,
  doors: DEFAULT_DOOR_CONFIG,
  coordination: DEFAULT_COORDINATION_CONFIG,
  alertModes: DEFAULT_ALERT_MODES_CONFIG,
  sweep: DEFAULT_SWEEP_CONFIG,
};

// === MERGE CONFIGS ===

export function mergeSecurityProfile(
  base: SecurityProfile,
  overrides: Partial<SecurityProfile>
): SecurityProfile {
  return { ...base, ...overrides };
}

export function mergeHeistConfig(
  base: HeistConfig,
  overrides: Partial<HeistConfig>
): HeistConfig {
  return {
    security: overrides.security
      ? mergeSecurityProfile(base.security, overrides.security)
      : base.security,
    tokens: overrides.tokens ? { ...base.tokens, ...overrides.tokens } : base.tokens,
    crew: overrides.crew ? { ...base.crew, ...overrides.crew } : base.crew,
    maxHeat: overrides.maxHeat ?? base.maxHeat,
    // Emergent systems config
    stance: overrides.stance ? mergeStanceConfig(base.stance, overrides.stance) : base.stance,
    doors: overrides.doors ? { ...base.doors, ...overrides.doors } : base.doors,
    coordination: overrides.coordination ? { ...base.coordination, ...overrides.coordination } : base.coordination,
    alertModes: overrides.alertModes ? mergeAlertModesConfig(base.alertModes, overrides.alertModes) : base.alertModes,
  };
}

// Helper for deep merge of stance config
function mergeStanceConfig(base: StanceConfig, overrides: Partial<StanceConfig>): StanceConfig {
  return {
    sneak: overrides.sneak ? { ...base.sneak, ...overrides.sneak } : base.sneak,
    sprint: overrides.sprint ? { ...base.sprint, ...overrides.sprint } : base.sprint,
  };
}

// Helper for deep merge of alert modes
function mergeAlertModesConfig(base: AlertModesConfig, overrides: Partial<AlertModesConfig>): AlertModesConfig {
  return {
    CALM: overrides.CALM ? { ...base.CALM, ...overrides.CALM } : base.CALM,
    SUSPICIOUS: overrides.SUSPICIOUS ? { ...base.SUSPICIOUS, ...overrides.SUSPICIOUS } : base.SUSPICIOUS,
    ALARM: overrides.ALARM ? { ...base.ALARM, ...overrides.ALARM } : base.ALARM,
    LOCKDOWN: overrides.LOCKDOWN ? { ...base.LOCKDOWN, ...overrides.LOCKDOWN } : base.LOCKDOWN,
  };
}

// === CONFIG VALIDATION ===

export interface ConfigError {
  field: string;
  message: string;
  value: unknown;
  bounds?: { min?: number; max?: number };
}

export interface ConfigBounds {
  min?: number;
  max?: number;
}

/**
 * Bounds for validating RuntimeConfig numeric fields.
 * Keys are dot-path field names matching RuntimeConfig structure.
 */
export const CONFIG_BOUNDS: Record<string, ConfigBounds> = {
  // Security bounds
  'security.guardVisionRange': { min: 1, max: 20 },
  'security.guardVisionAngle': { min: 30, max: 360 },
  'security.guardPeripheralRange': { min: 0, max: 5 },
  'security.suspicionToAlarm': { min: 1, max: 100 },
  'security.alarmToLockdown': { min: 1, max: 100 },
  'security.patrolDelayMin': { min: 0, max: 10 },
  'security.patrolDelayMax': { min: 0, max: 20 },
  'security.investigateGiveUpChance': { min: 0, max: 1 },
  'security.randomInvestigateChance': { min: 0, max: 1 },
  'security.pursueLostSightTicks': { min: 1, max: 100 },
  'security.spottedHeat': { min: 0, max: 50 },
  'security.alarmHeat': { min: 0, max: 50 },
  'security.lockdownHeat': { min: 0, max: 100 },

  // Token bounds
  'tokens.cooldownTicks': { min: 1, max: 100 },
  'tokens.effects.LIGHTS.durationTicks': { min: 1, max: 100 },
  'tokens.effects.RADIO.durationTicks': { min: 1, max: 100 },
  'tokens.effects.SMOKE.durationTicks': { min: 1, max: 100 },
  'tokens.effects.SMOKE.radius': { min: 1, max: 10 },
  'tokens.decoyCharges': { min: 0, max: 10 },
  'tokens.effects.DECOY.durationTicks': { min: 1, max: 50 },
  'tokens.effects.DECOY.noiseLevel': { min: 10, max: 100 },

  // Crew bounds
  'crew.moveSpeed': { min: 0.1, max: 5 },
  'crew.workProgressPerTick': { min: 1, max: 100 },

  // Detection bounds
  'detection.gainRate': { min: 1, max: 100 },
  'detection.decayRate': { min: 0, max: 50 },
  'detection.noticedThreshold': { min: 1, max: 100 },
  'detection.spottedThreshold': { min: 1, max: 100 },

  // Heat
  'maxHeat': { min: 10, max: 1000 },
  // Sweep
  'sweep.searchRadius': { min: 3, max: 20 },
  'sweep.waypointChangeTicks': { min: 5, max: 30 },

  // Heat thresholds
  'heatThresholds.level1Threshold': { min: 1, max: 100 },
  'heatThresholds.level2Threshold': { min: 1, max: 100 },
  'heatThresholds.level3Threshold': { min: 1, max: 100 },
  // Heat level multipliers (min 0.1 to prevent completely disabling effects)
  'heatThresholds.level1.investigateGiveUpMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level1.coverBonusMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level1.hideProgressMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level1.lockdownThresholdMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level2.investigateGiveUpMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level2.coverBonusMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level2.hideProgressMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level2.lockdownThresholdMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level3.investigateGiveUpMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level3.coverBonusMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level3.hideProgressMultiplier': { min: 0.1, max: 2 },
  'heatThresholds.level3.lockdownThresholdMultiplier': { min: 0.1, max: 2 },

  // Pathing bounds (crew-pathing Task 001)
  'pathing.dangerCostPerTile': { min: 0, max: 100 },
  'pathing.dangerRadius': { min: 1, max: 10 },
  'pathing.lightCostMultiplier': { min: 0, max: 10 },
  'pathing.crowdCost': { min: 0, max: 20 },
  'pathing.ventCostMultiplier': { min: 0, max: 5 },
  'pathing.replanCooldownTicks': { min: 1, max: 30 },
  'pathing.stuckTicks': { min: 1, max: 50 },
  'pathing.reservationHorizonH': { min: 1, max: 20 },
  'pathing.reservePenaltyBIG': { min: 10, max: 1000 },
  'pathing.doorCapacityPerTick': { min: 1, max: 5 },
  'pathing.doorOpenTicks': { min: 1, max: 20 },
  'pathing.autoCloseDelayTicks': { min: 1, max: 50 },
  'pathing.dangerSidestepMax': { min: 1, max: 20 },
};

/**
 * Helper to get nested value by dot-path.
 */
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce(
    (acc, key) => (acc as Record<string, unknown>)?.[key],
    obj
  );
}

/**
 * Validate a RuntimeConfig against bounds.
 * Returns an array of errors (empty if valid).
 *
 * @param config - The RuntimeConfig to validate
 */
export function validateHeistConfig(config: RuntimeConfig): ConfigError[] {
  const errors: ConfigError[] = [];

  for (const [path, bounds] of Object.entries(CONFIG_BOUNDS)) {
    const value = getNestedValue(config, path);
    if (value === undefined) continue;

    if (typeof value !== 'number') {
      errors.push({
        field: path,
        message: `${path} must be a number`,
        value,
      });
      continue;
    }

    if (bounds.min !== undefined && value < bounds.min) {
      errors.push({
        field: path,
        message: `${path} must be >= ${bounds.min}, got ${value}`,
        value,
        bounds,
      });
    }

    if (bounds.max !== undefined && value > bounds.max) {
      errors.push({
        field: path,
        message: `${path} must be <= ${bounds.max}, got ${value}`,
        value,
        bounds,
      });
    }
  }

  // Validate heat threshold ordering (level1 < level2 < level3)
  const { heatThresholds } = config;
  if (heatThresholds) {
    const { level1Threshold, level2Threshold, level3Threshold } = heatThresholds;

    if (level2Threshold <= level1Threshold) {
      errors.push({
        field: 'heatThresholds.level2Threshold',
        message: `heatThresholds.level2Threshold (${level2Threshold}) must be > level1Threshold (${level1Threshold})`,
        value: level2Threshold,
      });
    }

    if (level3Threshold <= level2Threshold) {
      errors.push({
        field: 'heatThresholds.level3Threshold',
        message: `heatThresholds.level3Threshold (${level3Threshold}) must be > level2Threshold (${level2Threshold})`,
        value: level3Threshold,
      });
    }
  }

  return errors;
}

// === BUILD CONFIG ===

/**
 * Build a complete RuntimeConfig by merging pack overrides with defaults.
 *
 * Merge priority (highest to lowest):
 * 1. packSecurity (legacy field, takes precedence)
 * 2. packConfig.security / packConfig.* (new fields)
 * 3. DEFAULT_* constants
 *
 * Returns RuntimeConfig (all fields required) not HeistConfig (some optional).
 *
 * @param packConfig - Optional HeistConfig overrides from pack.config
 * @param packSecurity - Optional legacy SecurityProfile overrides from pack.security
 */
export function buildHeistConfig(
  packConfig?: Partial<HeistConfig>,
  packSecurity?: Partial<SecurityProfile>
): RuntimeConfig {
  return {
    security: {
      guardVisionRange: packSecurity?.guardVisionRange ?? packConfig?.security?.guardVisionRange ?? DEFAULT_SECURITY.guardVisionRange,
      guardVisionAngle: packSecurity?.guardVisionAngle ?? packConfig?.security?.guardVisionAngle ?? DEFAULT_SECURITY.guardVisionAngle,
      guardPeripheralRange: packSecurity?.guardPeripheralRange ?? packConfig?.security?.guardPeripheralRange ?? DEFAULT_SECURITY.guardPeripheralRange,
      suspicionToAlarm: packSecurity?.suspicionToAlarm ?? packConfig?.security?.suspicionToAlarm ?? DEFAULT_SECURITY.suspicionToAlarm,
      alarmToLockdown: packSecurity?.alarmToLockdown ?? packConfig?.security?.alarmToLockdown ?? DEFAULT_SECURITY.alarmToLockdown,
      suspicionDecayTicks: packSecurity?.suspicionDecayTicks ?? packConfig?.security?.suspicionDecayTicks ?? DEFAULT_SECURITY.suspicionDecayTicks,
      alarmDecayTicks: packSecurity?.alarmDecayTicks ?? packConfig?.security?.alarmDecayTicks ?? DEFAULT_SECURITY.alarmDecayTicks,
      patrolDelayMin: packSecurity?.patrolDelayMin ?? packConfig?.security?.patrolDelayMin ?? DEFAULT_SECURITY.patrolDelayMin,
      patrolDelayMax: packSecurity?.patrolDelayMax ?? packConfig?.security?.patrolDelayMax ?? DEFAULT_SECURITY.patrolDelayMax,
      investigateGiveUpChance: packSecurity?.investigateGiveUpChance ?? packConfig?.security?.investigateGiveUpChance ?? DEFAULT_SECURITY.investigateGiveUpChance,
      randomInvestigateChance: packSecurity?.randomInvestigateChance ?? packConfig?.security?.randomInvestigateChance ?? DEFAULT_SECURITY.randomInvestigateChance,
      suspiciousInvestigateChance: packSecurity?.suspiciousInvestigateChance ?? packConfig?.security?.suspiciousInvestigateChance ?? DEFAULT_SECURITY.suspiciousInvestigateChance,
      pursueLostSightTicks: packSecurity?.pursueLostSightTicks ?? packConfig?.security?.pursueLostSightTicks ?? DEFAULT_SECURITY.pursueLostSightTicks,
      spottedHeat: packSecurity?.spottedHeat ?? packConfig?.security?.spottedHeat ?? DEFAULT_SECURITY.spottedHeat,
      alarmHeat: packSecurity?.alarmHeat ?? packConfig?.security?.alarmHeat ?? DEFAULT_SECURITY.alarmHeat,
      lockdownHeat: packSecurity?.lockdownHeat ?? packConfig?.security?.lockdownHeat ?? DEFAULT_SECURITY.lockdownHeat,
      closeCallHeat: packSecurity?.closeCallHeat ?? packConfig?.security?.closeCallHeat ?? DEFAULT_SECURITY.closeCallHeat,
      lockdownHeatPerTick: packSecurity?.lockdownHeatPerTick ?? packConfig?.security?.lockdownHeatPerTick ?? DEFAULT_SECURITY.lockdownHeatPerTick,
    },
    tokens: {
      cooldownTicks: packConfig?.tokens?.cooldownTicks ?? DEFAULT_TOKEN_CONFIG.cooldownTicks,
      effects: {
        LIGHTS: {
          durationTicks: packConfig?.tokens?.effects?.LIGHTS?.durationTicks ?? DEFAULT_TOKEN_CONFIG.effects.LIGHTS.durationTicks,
          visionMultiplier: packConfig?.tokens?.effects?.LIGHTS?.visionMultiplier ?? DEFAULT_TOKEN_CONFIG.effects.LIGHTS.visionMultiplier,
        },
        RADIO: {
          durationTicks: packConfig?.tokens?.effects?.RADIO?.durationTicks ?? DEFAULT_TOKEN_CONFIG.effects.RADIO.durationTicks,
        },
        SMOKE: {
          durationTicks: packConfig?.tokens?.effects?.SMOKE?.durationTicks ?? DEFAULT_TOKEN_CONFIG.effects.SMOKE.durationTicks,
          radius: packConfig?.tokens?.effects?.SMOKE?.radius ?? DEFAULT_TOKEN_CONFIG.effects.SMOKE.radius,
        },
        DECOY: {
          durationTicks: packConfig?.tokens?.effects?.DECOY?.durationTicks ?? DEFAULT_TOKEN_CONFIG.effects.DECOY.durationTicks,
          noiseLevel: packConfig?.tokens?.effects?.DECOY?.noiseLevel ?? DEFAULT_TOKEN_CONFIG.effects.DECOY.noiseLevel,
        },
      },
    },
    crew: {
      moveSpeed: packConfig?.crew?.moveSpeed ?? DEFAULT_CREW_CONFIG.moveSpeed,
      workProgressPerTick: packConfig?.crew?.workProgressPerTick ?? DEFAULT_CREW_CONFIG.workProgressPerTick,
      overrideFleeDuration: packConfig?.crew?.overrideFleeDuration ?? DEFAULT_CREW_CONFIG.overrideFleeDuration,
    },
    detection: {
      gainRate: packSecurity?.detection?.gainRate ?? packConfig?.detection?.gainRate ?? DEFAULT_SECURITY.detection.gainRate,
      decayRate: packSecurity?.detection?.decayRate ?? packConfig?.detection?.decayRate ?? DEFAULT_SECURITY.detection.decayRate,
      noticedThreshold: packSecurity?.detection?.noticedThreshold ?? packConfig?.detection?.noticedThreshold ?? DEFAULT_SECURITY.detection.noticedThreshold,
      spottedThreshold: packSecurity?.detection?.spottedThreshold ?? packConfig?.detection?.spottedThreshold ?? DEFAULT_SECURITY.detection.spottedThreshold,
      lostThreshold: packSecurity?.detection?.lostThreshold ?? packConfig?.detection?.lostThreshold ?? DEFAULT_SECURITY.detection.lostThreshold,
    },
    maxHeat: packConfig?.maxHeat ?? DEFAULT_HEIST_CONFIG.maxHeat,
    stance: {
      sneak: {
        speedMultiplier: packConfig?.stance?.sneak?.speedMultiplier ?? DEFAULT_STANCE_CONFIG.sneak.speedMultiplier,
        noiseMultiplier: packConfig?.stance?.sneak?.noiseMultiplier ?? DEFAULT_STANCE_CONFIG.sneak.noiseMultiplier,
        visibilityMultiplier: packConfig?.stance?.sneak?.visibilityMultiplier ?? DEFAULT_STANCE_CONFIG.sneak.visibilityMultiplier,
      },
      sprint: {
        speedMultiplier: packConfig?.stance?.sprint?.speedMultiplier ?? DEFAULT_STANCE_CONFIG.sprint.speedMultiplier,
        noiseMultiplier: packConfig?.stance?.sprint?.noiseMultiplier ?? DEFAULT_STANCE_CONFIG.sprint.noiseMultiplier,
        visibilityMultiplier: packConfig?.stance?.sprint?.visibilityMultiplier ?? DEFAULT_STANCE_CONFIG.sprint.visibilityMultiplier,
      },
    },
    doors: {
      toggleNoise: packConfig?.doors?.toggleNoise ?? DEFAULT_DOOR_CONFIG.toggleNoise,
      toggleTicks: packConfig?.doors?.toggleTicks ?? DEFAULT_DOOR_CONFIG.toggleTicks,
      blocksLOSWhenClosed: packConfig?.doors?.blocksLOSWhenClosed ?? DEFAULT_DOOR_CONFIG.blocksLOSWhenClosed,
      defaultOpen: packConfig?.doors?.defaultOpen ?? DEFAULT_DOOR_CONFIG.defaultOpen,
    },
    coordination: {
      broadcastRange: packConfig?.coordination?.broadcastRange ?? DEFAULT_COORDINATION_CONFIG.broadcastRange,
      broadcastCooldownTicks: packConfig?.coordination?.broadcastCooldownTicks ?? DEFAULT_COORDINATION_CONFIG.broadcastCooldownTicks,
    },
    alertModes: {
      CALM: {
        investigateChance: packConfig?.alertModes?.CALM?.investigateChance ?? DEFAULT_ALERT_MODES_CONFIG.CALM.investigateChance,
        patrolSpeedMultiplier: packConfig?.alertModes?.CALM?.patrolSpeedMultiplier ?? DEFAULT_ALERT_MODES_CONFIG.CALM.patrolSpeedMultiplier,
        convergeOnSpotted: packConfig?.alertModes?.CALM?.convergeOnSpotted ?? DEFAULT_ALERT_MODES_CONFIG.CALM.convergeOnSpotted,
        holdChokepoints: packConfig?.alertModes?.CALM?.holdChokepoints ?? DEFAULT_ALERT_MODES_CONFIG.CALM.holdChokepoints,
      },
      SUSPICIOUS: {
        investigateChance: packConfig?.alertModes?.SUSPICIOUS?.investigateChance ?? DEFAULT_ALERT_MODES_CONFIG.SUSPICIOUS.investigateChance,
        patrolSpeedMultiplier: packConfig?.alertModes?.SUSPICIOUS?.patrolSpeedMultiplier ?? DEFAULT_ALERT_MODES_CONFIG.SUSPICIOUS.patrolSpeedMultiplier,
        convergeOnSpotted: packConfig?.alertModes?.SUSPICIOUS?.convergeOnSpotted ?? DEFAULT_ALERT_MODES_CONFIG.SUSPICIOUS.convergeOnSpotted,
        holdChokepoints: packConfig?.alertModes?.SUSPICIOUS?.holdChokepoints ?? DEFAULT_ALERT_MODES_CONFIG.SUSPICIOUS.holdChokepoints,
      },
      ALARM: {
        investigateChance: packConfig?.alertModes?.ALARM?.investigateChance ?? DEFAULT_ALERT_MODES_CONFIG.ALARM.investigateChance,
        patrolSpeedMultiplier: packConfig?.alertModes?.ALARM?.patrolSpeedMultiplier ?? DEFAULT_ALERT_MODES_CONFIG.ALARM.patrolSpeedMultiplier,
        convergeOnSpotted: packConfig?.alertModes?.ALARM?.convergeOnSpotted ?? DEFAULT_ALERT_MODES_CONFIG.ALARM.convergeOnSpotted,
        holdChokepoints: packConfig?.alertModes?.ALARM?.holdChokepoints ?? DEFAULT_ALERT_MODES_CONFIG.ALARM.holdChokepoints,
      },
      LOCKDOWN: {
        investigateChance: packConfig?.alertModes?.LOCKDOWN?.investigateChance ?? DEFAULT_ALERT_MODES_CONFIG.LOCKDOWN.investigateChance,
        patrolSpeedMultiplier: packConfig?.alertModes?.LOCKDOWN?.patrolSpeedMultiplier ?? DEFAULT_ALERT_MODES_CONFIG.LOCKDOWN.patrolSpeedMultiplier,
        convergeOnSpotted: packConfig?.alertModes?.LOCKDOWN?.convergeOnSpotted ?? DEFAULT_ALERT_MODES_CONFIG.LOCKDOWN.convergeOnSpotted,
        holdChokepoints: packConfig?.alertModes?.LOCKDOWN?.holdChokepoints ?? DEFAULT_ALERT_MODES_CONFIG.LOCKDOWN.holdChokepoints,
      },
    },
    sweep: {
      searchRadius: packConfig?.sweep?.searchRadius ?? DEFAULT_SWEEP_CONFIG.searchRadius,
      waypointChangeTicks: packConfig?.sweep?.waypointChangeTicks ?? DEFAULT_SWEEP_CONFIG.waypointChangeTicks,
    },
    heatThresholds: {
      level1Threshold: packConfig?.heatThresholds?.level1Threshold ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level1Threshold,
      level2Threshold: packConfig?.heatThresholds?.level2Threshold ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level2Threshold,
      level3Threshold: packConfig?.heatThresholds?.level3Threshold ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level3Threshold,
      level1: {
        investigateGiveUpMultiplier: packConfig?.heatThresholds?.level1?.investigateGiveUpMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level1.investigateGiveUpMultiplier,
        coverBonusMultiplier: packConfig?.heatThresholds?.level1?.coverBonusMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level1.coverBonusMultiplier,
        hideProgressMultiplier: packConfig?.heatThresholds?.level1?.hideProgressMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level1.hideProgressMultiplier,
        lockdownThresholdMultiplier: packConfig?.heatThresholds?.level1?.lockdownThresholdMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level1.lockdownThresholdMultiplier,
      },
      level2: {
        investigateGiveUpMultiplier: packConfig?.heatThresholds?.level2?.investigateGiveUpMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level2.investigateGiveUpMultiplier,
        coverBonusMultiplier: packConfig?.heatThresholds?.level2?.coverBonusMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level2.coverBonusMultiplier,
        hideProgressMultiplier: packConfig?.heatThresholds?.level2?.hideProgressMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level2.hideProgressMultiplier,
        lockdownThresholdMultiplier: packConfig?.heatThresholds?.level2?.lockdownThresholdMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level2.lockdownThresholdMultiplier,
      },
      level3: {
        investigateGiveUpMultiplier: packConfig?.heatThresholds?.level3?.investigateGiveUpMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level3.investigateGiveUpMultiplier,
        coverBonusMultiplier: packConfig?.heatThresholds?.level3?.coverBonusMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level3.coverBonusMultiplier,
        hideProgressMultiplier: packConfig?.heatThresholds?.level3?.hideProgressMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level3.hideProgressMultiplier,
        lockdownThresholdMultiplier: packConfig?.heatThresholds?.level3?.lockdownThresholdMultiplier ?? DEFAULT_HEAT_THRESHOLD_CONFIG.level3.lockdownThresholdMultiplier,
      },
    },
    pathing: {
      // A* costs
      dangerCostPerTile: packConfig?.pathing?.dangerCostPerTile ?? DEFAULT_PATHING_CONFIG.dangerCostPerTile,
      dangerRadius: packConfig?.pathing?.dangerRadius ?? DEFAULT_PATHING_CONFIG.dangerRadius,
      lightCostMultiplier: packConfig?.pathing?.lightCostMultiplier ?? DEFAULT_PATHING_CONFIG.lightCostMultiplier,
      crowdCost: packConfig?.pathing?.crowdCost ?? DEFAULT_PATHING_CONFIG.crowdCost,
      ventCostMultiplier: packConfig?.pathing?.ventCostMultiplier ?? DEFAULT_PATHING_CONFIG.ventCostMultiplier,

      // Guard state danger multipliers
      dangerCostByGuardState: packConfig?.pathing?.dangerCostByGuardState ?? DEFAULT_PATHING_CONFIG.dangerCostByGuardState,

      // Route caching
      replanCooldownTicks: packConfig?.pathing?.replanCooldownTicks ?? DEFAULT_PATHING_CONFIG.replanCooldownTicks,
      stuckTicks: packConfig?.pathing?.stuckTicks ?? DEFAULT_PATHING_CONFIG.stuckTicks,

      // Reservations
      reservationHorizonH: packConfig?.pathing?.reservationHorizonH ?? DEFAULT_PATHING_CONFIG.reservationHorizonH,
      reservePenaltyBIG: packConfig?.pathing?.reservePenaltyBIG ?? DEFAULT_PATHING_CONFIG.reservePenaltyBIG,

      // Resolution
      allowSwapsSameTeam: packConfig?.pathing?.allowSwapsSameTeam ?? DEFAULT_PATHING_CONFIG.allowSwapsSameTeam,
      allowSwapsAcrossTeams: packConfig?.pathing?.allowSwapsAcrossTeams ?? DEFAULT_PATHING_CONFIG.allowSwapsAcrossTeams,
      allowCycleRotate: packConfig?.pathing?.allowCycleRotate ?? DEFAULT_PATHING_CONFIG.allowCycleRotate,

      // Door queues
      doorCapacityPerTick: packConfig?.pathing?.doorCapacityPerTick ?? DEFAULT_PATHING_CONFIG.doorCapacityPerTick,
      doorOpenTicks: packConfig?.pathing?.doorOpenTicks ?? DEFAULT_PATHING_CONFIG.doorOpenTicks,
      autoCloseDelayTicks: packConfig?.pathing?.autoCloseDelayTicks ?? DEFAULT_PATHING_CONFIG.autoCloseDelayTicks,

      // Sidestep
      enableSidestep: packConfig?.pathing?.enableSidestep ?? DEFAULT_PATHING_CONFIG.enableSidestep,
      dangerSidestepMax: packConfig?.pathing?.dangerSidestepMax ?? DEFAULT_PATHING_CONFIG.dangerSidestepMax,
    },
  };
}
