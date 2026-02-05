/**
 * Heist Kernel - Rules Types
 *
 * Extracted from prototype.ts lines 527-607.
 * Defines triggers, actions, and rule cards.
 */

import type { EntityId, AlertLevel, TokenType, TickIndex, CrewStance } from './types.js';

// === TRIGGERS ===

export type Trigger =
  | { type: 'SPOTTED'; agent?: EntityId }
  | { type: 'ALERT_GTE'; level: AlertLevel }
  | { type: 'ALERT_EQ'; level: AlertLevel }  // Task 010: Exact alert level match
  | { type: 'OBJECTIVE_DONE'; id: string }
  | { type: 'HEALTH_LOW'; threshold: number }
  | { type: 'BLOCKED' }
  | { type: 'ALWAYS' }  // Added for unconditional rules
  | { type: 'NEAR_DOOR' }  // Task 011: Crew within 2 tiles of door
  | { type: 'HEARD_NOISE_NEAR'; range: number }  // Task 012: Guard heard noise near crew
  // Proactive triggers (specss.md §11.2)
  | { type: 'TICK_INTERVAL'; every: number }  // Fire every N ticks
  | { type: 'OBJECTIVE_PROGRESS_GTE'; id?: string; pct: number }  // Fire at objective % threshold
  // Heat threshold triggers (specss.md §11.2)
  | { type: 'HEAT_GTE'; value: 25 | 50 | 75 }  // Fire when heat reaches threshold
  // New triggers (triggers-actions-v2)
  | { type: 'MADE_NOISE' }                            // Crew made noise (uses existing NOISE_EMITTED event)
  | { type: 'START_HACK' }                            // Crew started hacking
  | { type: 'DOWNED'; who: 'self' | 'teammate' }      // Crew downed
  | { type: 'EXTRACT_READY' }                         // All objectives done
  | { type: 'APPROACH_EXIT'; distance?: number }      // Crew near exit (default: 3)
  | { type: 'NEW_ZONE_ENTER' }                        // Crew entered new zone
  // Camera cone trigger (perception-systems Task 011)
  | { type: 'CAMERA_CONE'; cameraId?: EntityId };    // Crew entered camera FOV (specific or any)

// === CONDITIONS (Task 011) ===

export type RuleCondition =
  | { type: 'GUARD_NEARBY'; range: number }  // Guard within N tiles of triggering crew
  | { type: 'DOOR_BETWEEN'; target: 'spotter' }  // Door between crew and guard
  | { type: 'HAS_TOKEN'; kind: TokenType }  // Crew has token available
  // Proactive conditions (specss.md §11.2)
  | { type: 'GUARD_DIST_GTE'; tiles: number }  // All guards > N tiles away
  | { type: 'IN_SHADOW' }  // Crew is in low-light area (placeholder until light overlay)
  | { type: 'STANCE_IS'; stance: CrewStance }  // Current stance matches
  | { type: 'NOT_SPOTTED' }  // Crew is not currently spotted
  // New conditions (triggers-actions-v2)
  | { type: 'ALERT_IN_RANGE'; min?: AlertLevel; max?: AlertLevel }  // Alert level within range
  | { type: 'IS_IDLE' }                                              // Crew not doing task
  | { type: 'TEAMMATE_DISTANT'; range: number };                     // Nearest teammate > N tiles

// === ACTIONS ===

export type ActionTarget = 'cover' | 'shadow' | 'exit' | 'objective' | 'leader' | 'teammate';

export type Action =
  | { type: 'MOVE_TO'; target: ActionTarget }
  | { type: 'HOLD'; duration: number }
  | { type: 'HIDE' }
  | { type: 'USE_TOKEN'; token: TokenType }
  | { type: 'CONTINUE' }
  | { type: 'FREEZE_GUARDS'; duration: number } // Added for special abilities
  // Emergent systems actions (Tasks 001, 002)
  | { type: 'SET_STANCE'; stance: CrewStance }
  | { type: 'TOGGLE_DOOR'; target: 'nearest' | 'facing' }
  // New actions (triggers-actions-v2)
  | { type: 'CANCEL_TASK' }                           // Abort current interaction
  | { type: 'HACK_MODE'; mode: 'normal' | 'quiet' }   // Change hack behavior
  | { type: 'DRAG_TO'; target: 'cover' | 'shadow' };  // Drag downed teammate

// === DIRECTIVE CARD ===

export type RuleScope = 'self' | 'all' | 'other' | 'nearest';  // 'nearest' = closest crew to trigger source
export type RuleCategory = 'movement' | 'stealth' | 'support' | 'emergency';

export interface DirectiveCard {
  id: string;
  name: string;
  trigger: Trigger;
  /** Optional condition that must also be true for the rule to fire (Task 011) */
  condition?: RuleCondition;
  /** Single action (optional if actions is provided) */
  action?: Action;
  /** Multiple actions executed in order (triggers-actions-v2) */
  actions?: Action[];
  scope: RuleScope;
  cooldown: TickIndex;
  charges?: number;
  priority: number;
  category?: RuleCategory;
  tags?: string[];
  /** If true, rule pauses for player veto before firing (per specss.md 6.3) */
  pausesBeforeFire?: boolean;
  // Future fields (commented for planning)
  // commandCost?: number;
  // heatDelta?: number;
}

// === OVERRIDE CARD ===

export interface OverrideCard {
  id: string;
  name: string;
  description: string;
  oneTimeUse: boolean;
  effect: OverrideEffect;
}

export type OverrideEffect =
  | { type: 'CANCEL_ALERT_ESCALATION' }
  | { type: 'INSTANT_COMPLETE_OBJECTIVE'; objectiveId: string }
  | { type: 'TELEPORT_CREW'; crewId: EntityId; pos: { x: number; y: number } }
  | { type: 'DISABLE_GUARD'; guardId: EntityId; duration: TickIndex };

// === RELIC ===

export interface Relic {
  id: string;
  name: string;
  description: string;
  passiveEffect: RelicEffect;
}

export type RelicEffect =
  | { type: 'VISION_RANGE_REDUCTION'; amount: number }
  | { type: 'EXTRA_TOKEN'; token: TokenType; count: number }
  | { type: 'HEAT_REDUCTION'; amount: number }
  | { type: 'COOLDOWN_REDUCTION'; ruleId: string; ticks: TickIndex };

// === TOKEN DEFINITION (for rules) ===

export interface TokenDefinition {
  type: TokenType;
  name: string;
  description: string;
  defaultCharges: number;
  cooldownTicks: TickIndex;
  effectDuration: TickIndex;
}

// === TOKEN TARGETING (AH03 Section 6) ===

/**
 * Token target mode determines what the player must select when using a token.
 * - GLOBAL: No target needed, affects entire facility (e.g., RADIO)
 * - ZONE: Target a zone (future - not implemented in v1)
 * - CELL: Target a specific tile position (e.g., DECOY)
 * - ENTITY: Target a specific entity like camera (future - not implemented in v1)
 * - NONE: Token cannot be used manually, rule-only
 */
export type TokenTargetMode = 'GLOBAL' | 'ZONE' | 'CELL' | 'ENTITY' | 'NONE';

/**
 * Token effect kind. Maps to existing TokenType for built-in tokens,
 * but allows pack-defined custom effects.
 */
export type TokenEffectKind = 'CUT_LIGHTS' | 'JAM_COMMS' | 'SMOKE' | 'DECOY' | string;

/**
 * Token definition schema from AH03 spec.
 * More comprehensive than legacy TokenDefinition - used for pack-defined tokens.
 */
export interface TokenDef {
  id: string;
  name: string;
  targetMode: TokenTargetMode;
  effect: {
    kind: TokenEffectKind;
    params: Record<string, number | string | boolean>;
    durationTicks?: number;
  };
  cooldownTicks: number;
  maxCharges: number;
  rarity?: 'common' | 'rare' | 'legendary';
  constraints?: {
    maxRadius?: number;
    allowedZoneTags?: string[];
    disallowSecureZones?: boolean;
  };
}

/**
 * Token fire request - player or rule activation with optional targeting.
 */
export interface TokenFire {
  tokenId: string;  // Maps to TokenType for built-in tokens
  atTick: number;
  target?: {
    zoneId?: string;
    cell?: { x: number; y: number };
    entityId?: string;
  };
}

export const DEFAULT_TOKEN_DEFINITIONS: Record<TokenType, TokenDefinition> = {
  LIGHTS: {
    type: 'LIGHTS',
    name: 'Kill Lights',
    description: 'Halve guard vision range',
    defaultCharges: 1,
    cooldownTicks: 10,
    effectDuration: 12,
  },
  RADIO: {
    type: 'RADIO',
    name: 'Jam Radio',
    description: 'Prevent alert escalation',
    defaultCharges: 1,
    cooldownTicks: 10,
    effectDuration: 15,
  },
  SMOKE: {
    type: 'SMOKE',
    name: 'Smoke Bomb',
    description: 'Block line of sight in area',
    defaultCharges: 1,
    cooldownTicks: 10,
    effectDuration: 10,
  },
  DECOY: {
    type: 'DECOY',
    name: 'Decoy',
    description: 'Create noise at target location to distract guards',
    defaultCharges: 2,
    cooldownTicks: 15,
    effectDuration: 8,
  },
  LOOP_CAMERA: {
    type: 'LOOP_CAMERA',
    name: 'Loop Camera',
    description: 'Blinds a camera by looping its feed for a duration',
    defaultCharges: 1,
    cooldownTicks: 20,
    effectDuration: 15,
  },
};

// === INTENT ===

export interface Intent {
  agentId: EntityId;
  action: Action;
  ruleId: string;
  priority: number;
}

// === MODULE CARD (Passive Effects per specss.md Section 13) ===

export type ModuleEffect =
  | { type: 'CAMERA_CONFIRM_SLOWER'; multiplier: number }  // 1.5 = 50% slower
  | { type: 'HIDE_FASTER'; multiplier: number }            // 0.8 = 20% faster
  | { type: 'FIRST_ALERT_DELAYED'; ticks: number }         // Delay first escalation
  | { type: 'NOISE_DAMPENING'; extraWalls: number }        // Sound travels less
  | { type: 'SHADOW_BONUS'; coverMultiplier: number }      // Shadows more effective
  | { type: 'ALERT_DECAY_SLOWER'; multiplier: number }     // Alert decays slower while unspotted
  | { type: 'HACK_NOISE_REDUCTION'; multiplier: number }   // Hack generates less noise
  | { type: 'SUSPICIOUS_TO_ALARM_DELAYED'; ticks: number } // +N ticks before SUSPICIOUS→ALARM
  | { type: 'NOISE_MODIFIER'; value: number };             // Task 012: Passive noise reduction (negative = quieter)

export interface ModuleCard {
  id: string;
  name: string;
  description: string;
  effect: ModuleEffect;
}

// === DIRECTOR STANCE (per specss.md Section 8.2) ===

export type DirectorStance = 'SAFE' | 'COMMIT' | 'ABORT';
