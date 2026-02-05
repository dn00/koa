/**
 * Heist Kernel - Event Types
 *
 * All events that can be emitted by the heist simulation.
 */

export const HEIST_EVENTS = {
  // Vision events
  CREW_SPOTTED: 'heist.crew_spotted',
  CREW_LOST: 'heist.crew_lost',
  CREW_NOTICED: 'heist.crew_noticed',
  DETECTION_ACCUM_UPDATED: 'heist.detection_accum_updated',

  // Movement events
  ENTITY_MOVED: 'heist.entity_moved',
  GUARD_STATE_CHANGED: 'heist.guard_state_changed',
  CREW_STATE_CHANGED: 'heist.crew_state_changed',
  HIDE_PROGRESS: 'heist.hide_progress',

  // Alert events
  ALERT_ESCALATED: 'heist.alert_escalated',
  ALERT_DECAYED: 'heist.alert_decayed',
  SUSPICION_ADDED: 'heist.suspicion_added',
  EVIDENCE_DECAYED: 'heist.evidence_decayed',

  // Objective events
  OBJECTIVE_PROGRESS: 'heist.objective_progress',
  OBJECTIVE_COMPLETE: 'heist.objective_complete',
  OBJECTIVE_UNLOCKED: 'heist.objective_unlocked',

  // Rule events
  RULE_TRIGGERED: 'heist.rule_triggered',
  RULE_ACTION_APPLIED: 'heist.rule_action_applied',

  // Veto events (per specss.md 6.3)
  RULE_PENDING_VETO: 'heist.rule_pending_veto',
  RULE_ALLOWED: 'heist.rule_allowed',
  RULE_VETOED: 'heist.rule_vetoed',

  // Stance events (per specss.md 8.2)
  STANCE_CHANGED: 'heist.stance_changed',

  // Crew stance events (Task 001 - emergent systems)
  CREW_STANCE_CHANGED: 'heist.crew_stance_changed',

  // Door events (Task 002 - emergent systems)
  DOOR_TOGGLED: 'heist.door_toggled',

  // Guard coordination events (Task 003 - emergent systems)
  GUARD_ALERT_BROADCAST: 'heist.guard_alert_broadcast',
  ALERT_BEHAVIOR_CHANGED: 'heist.alert_behavior_changed',

  // Token events
  TOKEN_ACTIVATED: 'heist.token_activated',
  TOKEN_EXPIRED: 'heist.token_expired',

  // Noise events (per AH04 Section 6)
  NOISE_EMITTED: 'heist.noise_emitted',
  NOISE_HEARD: 'heist.noise_heard',

  // Catch events
  CREW_CAUGHT: 'heist.crew_caught',
  CLOSE_CALL: 'heist.close_call',

  // Heat threshold events (Task 002 - heat-thresholds feature)
  HEAT_THRESHOLD_CROSSED: 'heist.heat_threshold_crossed',

  // Camera events (perception-systems Task 003, 010, 011)
  CREW_NOTICED_BY_CAMERA: 'heist.crew_noticed_by_camera',
  CREW_SPOTTED_BY_CAMERA: 'heist.crew_spotted_by_camera',
  CREW_LOST_BY_CAMERA: 'heist.crew_lost_by_camera',
  CAMERA_DETECTION_ACCUM_UPDATED: 'heist.camera_detection_accum_updated',
  CAMERA_LOOPED: 'heist.camera_looped',
  ENTERED_CAMERA_CONE: 'heist.entered_camera_cone',

  // Hack events (triggers-actions-v2 Task 001)
  HACK_STARTED: 'heist.hack_started',
  EXTRACTION_READY: 'heist.extraction_ready',

  // Zone events (triggers-actions-v2 Task 005)
  ZONE_ENTERED: 'heist.zone_entered',

  // Action events (triggers-actions-v2 Task 004)
  TASK_CANCELLED: 'heist.task_cancelled',
  HACK_MODE_CHANGED: 'heist.hack_mode_changed',
  DRAG_STARTED: 'heist.drag_started',

  // End game events
  HEIST_WON: 'heist.won',
  HEIST_LOST: 'heist.lost',

  // Pathing events (crew-pathing Task 001 stubs - full payloads in Task 008)
  ROUTE_PLANNED: 'heist.route_planned',
  ROUTE_CURSOR_ADVANCED: 'heist.route_cursor_advanced',
  AGENT_INTENT: 'heist.agent_intent',
  AGENT_BLOCKED: 'heist.agent_blocked',
  BLOCKED_TICKS_UPDATED: 'heist.blocked_ticks_updated',
  DOOR_QUEUED: 'heist.door_queued',
  DOOR_OPEN_STARTED: 'heist.door_open_started',
  DOOR_OPENED: 'heist.door_opened',
  DEADLOCK_BROKEN: 'heist.deadlock_broken',
} as const;

export type HeistEventType = typeof HEIST_EVENTS[keyof typeof HEIST_EVENTS];

// === EVENT PAYLOAD TYPES ===

import type { Vec2, EntityId, AlertLevel, GuardState, CrewState, TokenType, TickIndex, CrewStance, DoorId, AlertBehaviorMode, HeatLevel } from './types.js';

export interface CrewSpottedPayload {
  guardId: EntityId;
  crewId: EntityId;
  pos: Vec2;
  /** Detection factors and visibility data (Task 009) */
  why?: {
    dist: number;
    hasLOS: boolean;
    inFOV: boolean;
    factors: {
      light: number;
      smoke: number;
      cover: number;
      stance: number;
      distance: number;
    };
    visibility: number;
    detectBefore: number;
    detectAfter: number;
  };
}

export interface CrewLostPayload {
  guardId: EntityId;
  crewId: EntityId;
}

export interface CrewNoticedPayload {
  guardId: EntityId;
  crewId: EntityId;
  pos: Vec2;
  accumulator: number;
  why: {
    dist: number;
    hasLOS: boolean;
    inFOV: boolean;
    factors: {
      light: number;
      smoke: number;
      cover: number;
      stance: number;
      distance: number;
    };
    visibility: number;
    detectBefore: number;
    detectAfter: number;
  };
}

export interface DetectionAccumUpdatedPayload {
  guardId: EntityId;
  crewId: EntityId;
  value: number;
  crossed: 'NOTICED' | 'SPOTTED' | 'LOST' | null;  // Which threshold was crossed
}

export interface EntityMovedPayload {
  entityId: EntityId;
  from: Vec2;
  to: Vec2;
}

export interface GuardStateChangedPayload {
  guardId: EntityId;
  from: GuardState;
  to: GuardState;
  reason?: string;
}

export interface CrewStateChangedPayload {
  crewId: EntityId;
  from: CrewState;
  to: CrewState;
}

export interface HideProgressPayload {
  crewId: EntityId;
  progress: number;
}

export interface AlertEscalatedPayload {
  from: AlertLevel;
  to: AlertLevel;
  reason: string;
}

export interface AlertDecayedPayload {
  from: AlertLevel;
  to: AlertLevel;
}

export interface SuspicionAddedPayload {
  guardId?: EntityId;
  crewId?: EntityId;
  currentEvidence: number;
  reason?: string;
}

export interface EvidenceDecayedPayload {
  suspicionEvidence: number;
  alarmEvidence: number;
}

export interface ObjectiveProgressPayload {
  objectiveId: EntityId;
  crewId: EntityId;
  progress: number;
  milestone?: number;
}

export interface ObjectiveCompletePayload {
  objectiveId: EntityId;
  crewId: EntityId;
}

export interface ObjectiveUnlockedPayload {
  objectiveId: EntityId;
  previousObjectiveId?: EntityId;
}

export interface RuleTriggeredPayload {
  ruleId: string;
  agentId: EntityId;
  triggerId: string;
}

export interface RuleActionAppliedPayload {
  ruleId: string;
  agentId: EntityId;
  actionType: string;
}

export interface RulePendingVetoPayload {
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  predictedIntent: string;
  agentId: EntityId;
}

export interface RuleAllowedPayload {
  ruleId: string;
  agentId: EntityId;
}

export interface RuleVetoedPayload {
  ruleId: string;
  agentId: EntityId;
  lockoutUntil: TickIndex;
}

export interface StanceChangedPayload {
  from: 'SAFE' | 'COMMIT' | 'ABORT';
  to: 'SAFE' | 'COMMIT' | 'ABORT';
}

export interface TokenActivatedPayload {
  tokenType: TokenType;
  pos: Vec2;
  activatedBy?: EntityId;
  byRule?: string;
  expiresAt: TickIndex;
  targetCell?: Vec2;  // Explicit target if cell-targeted
}

export interface TokenExpiredPayload {
  tokenType: TokenType;
}

export interface NoiseEmittedPayload {
  sourceId: EntityId;
  pos: Vec2;
  loudness: number;
  kind: 'FOOTSTEP' | 'DOOR' | 'HACK' | 'OBJECTIVE_COMPLETE' | 'TOKEN';
}

export interface NoiseHeardPayload {
  guardId: EntityId;
  sourcePos: Vec2;
  intensity: number;
}

export interface CrewCaughtPayload {
  crewId: EntityId;
  guardId: EntityId;
  pos: Vec2;
}

export interface CloseCallPayload {
  crewId: EntityId;
  guardId: EntityId;
  pos: Vec2;
}

export interface HeistWonPayload {
  finalHeat: number;
  totalTicks: TickIndex;
}

export interface HeistLostPayload {
  reason: 'CAUGHT' | 'TIMEOUT';
  finalHeat: number;
  totalTicks: TickIndex;
}

// === EMERGENT SYSTEMS PAYLOADS ===

// Task 001: Crew Stance Changed
export interface CrewStanceChangedPayload {
  crewId: EntityId;
  from: CrewStance;
  to: CrewStance;
}

// Task 002: Door Toggled
export interface DoorToggledPayload {
  doorId: DoorId;
  pos: Vec2;
  newState: 'OPEN' | 'CLOSED';
  actorId: EntityId;
}

// Task 003: Guard Alert Broadcast
export interface GuardAlertBroadcastPayload {
  sourceGuardId: EntityId;
  targetPos: Vec2;
  receivingGuardIds: EntityId[];
}

// Task 003: Alert Behavior Changed
export interface AlertBehaviorChangedPayload {
  from: AlertBehaviorMode;
  to: AlertBehaviorMode;
}

// Task 002 (heat-thresholds): Heat Threshold Crossed
export interface HeatThresholdCrossedPayload {
  previousLevel: HeatLevel;
  newLevel: HeatLevel;
  heat: number;
  threshold: number; // The threshold that was crossed (25, 50, or 75)
}

// Task 001 (triggers-actions-v2): Hack Started
export interface HackStartedPayload {
  agentId: EntityId;
  targetId: string;      // Objective ID
  position: Vec2;
}

// Task 001 (triggers-actions-v2): Extraction Ready
export interface ExtractionReadyPayload {
  tick: number;
  objectivesCompleted: string[];  // IDs of completed objectives
}

// Task 005 (triggers-actions-v2): Zone Entered
export type ZoneId = 'objective_area' | 'exit_area' | 'guard_area' | 'open';

export interface ZoneEnteredPayload {
  agentId: EntityId;
  newZone: ZoneId;
  previousZone: ZoneId;
  position: Vec2;
}

// Task 004 (triggers-actions-v2): Task Cancelled
export interface TaskCancelledPayload {
  agentId: EntityId;
  taskType: 'hack' | 'door' | 'other';
  progress: number;
}

// Task 004 (triggers-actions-v2): Hack Mode Changed
export interface HackModeChangedPayload {
  agentId: EntityId;
  newMode: 'normal' | 'quiet';
}

// Task 004 (triggers-actions-v2): Drag Started
export interface DragStartedPayload {
  draggerId: EntityId;
  targetId: EntityId;
  destination: 'cover' | 'shadow';
}

// === CAMERA EVENT PAYLOADS (perception-systems Task 003, 010) ===

// Task 003: Camera noticed crew
export interface CrewNoticedByCameraPayload {
  cameraId: EntityId;
  crewId: EntityId;
  pos: Vec2;
  accumulator: number;
  why: {
    dist: number;
    hasLOS: boolean;
    inFOV: boolean;
    factors: {
      light: number;
      smoke: number;
      cover: number;
      stance: number;
      distance: number;
    };
    visibility: number;
    detectBefore: number;
    detectAfter: number;
  };
}

// Task 003: Camera spotted crew
export interface CrewSpottedByCameraPayload {
  cameraId: EntityId;
  crewId: EntityId;
  pos: Vec2;
  /** Detection factors and visibility data (Task 009) */
  why?: {
    dist: number;
    hasLOS: boolean;
    inFOV: boolean;
    factors: {
      light: number;
      smoke: number;
      cover: number;
      stance: number;
      distance: number;
    };
    visibility: number;
    detectBefore: number;
    detectAfter: number;
  };
}

// Task 003: Camera lost crew
export interface CrewLostByCameraPayload {
  cameraId: EntityId;
  crewId: EntityId;
}

// Task 003: Camera detection accumulator updated
export interface CameraDetectionAccumUpdatedPayload {
  cameraId: EntityId;
  crewId: EntityId;
  value: number;
  crossed: 'NOTICED' | 'SPOTTED' | 'LOST' | null;
}

// Task 010: Camera looped
export interface CameraLoopedPayload {
  cameraId: EntityId;
  untilTick: number;
}

// Task 011: Entered camera cone (perception-systems)
export interface EnteredCameraConePayload {
  crewId: EntityId;
  cameraId: EntityId;
  distance: number;
}

// === PATHING EVENT PAYLOADS (crew-pathing Task 008) ===

import type { RoutePlanGoal, MoveKind, MoveReason } from './types.js';

export interface RoutePlannedPayload {
  agentId: EntityId;
  goal: RoutePlanGoal;
  pathLen: number;
  planHash: string;
  /** Why replan happened */
  trigger: 'initial' | 'goal_changed' | 'stuck' | 'hash_mismatch' | 'step_invalid';
}

export interface AgentIntentPayload {
  agentId: EntityId;
  tick: TickIndex;
  from: Vec2;
  to: Vec2;
  kind: MoveKind;
  priorityKey: string;
  why: {
    reason: MoveReason;
    details?: Record<string, unknown>;
  };
}

export interface AgentBlockedPayload {
  agentId: EntityId;
  from: Vec2;
  to: Vec2;
  reason: 'CONTESTED' | 'CYCLE' | 'RESERVED' | 'DOOR_CAPACITY';
  blockedBy?: EntityId;
  contenders?: EntityId[];
}

export interface RouteCursorAdvancedPayload {
  agentId: EntityId;
  newCursor: number;
}

export interface BlockedTicksUpdatedPayload {
  agentId: EntityId;
  blockedTicks: number;
}

export interface DoorQueuedPayload {
  agentId: EntityId;
  doorId: string;
  position: number; // queue position (0 = first)
}

export interface DoorOpenStartedPayload {
  agentId: EntityId;
  doorId: string;
  completesAtTick: TickIndex;
}

export interface DoorOpenedPayload {
  doorId: string;
  openedBy: EntityId;
}

export interface DeadlockBrokenPayload {
  agents: EntityId[];
  cycleLen: number;
  policy: 'break';
  stayingAgent: EntityId;
}

// === EVENT PAYLOAD MAP ===

export interface HeistEventPayloads {
  [HEIST_EVENTS.CREW_SPOTTED]: CrewSpottedPayload;
  [HEIST_EVENTS.CREW_LOST]: CrewLostPayload;
  [HEIST_EVENTS.CREW_NOTICED]: CrewNoticedPayload;
  [HEIST_EVENTS.DETECTION_ACCUM_UPDATED]: DetectionAccumUpdatedPayload;
  [HEIST_EVENTS.ENTITY_MOVED]: EntityMovedPayload;
  [HEIST_EVENTS.GUARD_STATE_CHANGED]: GuardStateChangedPayload;
  [HEIST_EVENTS.CREW_STATE_CHANGED]: CrewStateChangedPayload;
  [HEIST_EVENTS.HIDE_PROGRESS]: HideProgressPayload;
  [HEIST_EVENTS.ALERT_ESCALATED]: AlertEscalatedPayload;
  [HEIST_EVENTS.ALERT_DECAYED]: AlertDecayedPayload;
  [HEIST_EVENTS.SUSPICION_ADDED]: SuspicionAddedPayload;
  [HEIST_EVENTS.EVIDENCE_DECAYED]: EvidenceDecayedPayload;
  [HEIST_EVENTS.OBJECTIVE_PROGRESS]: ObjectiveProgressPayload;
  [HEIST_EVENTS.OBJECTIVE_COMPLETE]: ObjectiveCompletePayload;
  [HEIST_EVENTS.OBJECTIVE_UNLOCKED]: ObjectiveUnlockedPayload;
  [HEIST_EVENTS.RULE_TRIGGERED]: RuleTriggeredPayload;
  [HEIST_EVENTS.RULE_ACTION_APPLIED]: RuleActionAppliedPayload;
  [HEIST_EVENTS.RULE_PENDING_VETO]: RulePendingVetoPayload;
  [HEIST_EVENTS.RULE_ALLOWED]: RuleAllowedPayload;
  [HEIST_EVENTS.RULE_VETOED]: RuleVetoedPayload;
  [HEIST_EVENTS.STANCE_CHANGED]: StanceChangedPayload;
  [HEIST_EVENTS.TOKEN_ACTIVATED]: TokenActivatedPayload;
  [HEIST_EVENTS.TOKEN_EXPIRED]: TokenExpiredPayload;
  [HEIST_EVENTS.NOISE_EMITTED]: NoiseEmittedPayload;
  [HEIST_EVENTS.NOISE_HEARD]: NoiseHeardPayload;
  [HEIST_EVENTS.CREW_CAUGHT]: CrewCaughtPayload;
  [HEIST_EVENTS.CLOSE_CALL]: CloseCallPayload;
  [HEIST_EVENTS.HEIST_WON]: HeistWonPayload;
  [HEIST_EVENTS.HEIST_LOST]: HeistLostPayload;
  // Emergent systems events
  [HEIST_EVENTS.CREW_STANCE_CHANGED]: CrewStanceChangedPayload;
  [HEIST_EVENTS.DOOR_TOGGLED]: DoorToggledPayload;
  [HEIST_EVENTS.GUARD_ALERT_BROADCAST]: GuardAlertBroadcastPayload;
  [HEIST_EVENTS.ALERT_BEHAVIOR_CHANGED]: AlertBehaviorChangedPayload;
  // Heat threshold events
  [HEIST_EVENTS.HEAT_THRESHOLD_CROSSED]: HeatThresholdCrossedPayload;
  // Hack events (triggers-actions-v2)
  [HEIST_EVENTS.HACK_STARTED]: HackStartedPayload;
  [HEIST_EVENTS.EXTRACTION_READY]: ExtractionReadyPayload;
  // Zone events (triggers-actions-v2 Task 005)
  [HEIST_EVENTS.ZONE_ENTERED]: ZoneEnteredPayload;
  // Action events (triggers-actions-v2 Task 004)
  [HEIST_EVENTS.TASK_CANCELLED]: TaskCancelledPayload;
  [HEIST_EVENTS.HACK_MODE_CHANGED]: HackModeChangedPayload;
  [HEIST_EVENTS.DRAG_STARTED]: DragStartedPayload;
  // Camera events (perception-systems Tasks 003, 010, 011)
  [HEIST_EVENTS.CREW_NOTICED_BY_CAMERA]: CrewNoticedByCameraPayload;
  [HEIST_EVENTS.CREW_SPOTTED_BY_CAMERA]: CrewSpottedByCameraPayload;
  [HEIST_EVENTS.CREW_LOST_BY_CAMERA]: CrewLostByCameraPayload;
  [HEIST_EVENTS.CAMERA_DETECTION_ACCUM_UPDATED]: CameraDetectionAccumUpdatedPayload;
  [HEIST_EVENTS.CAMERA_LOOPED]: CameraLoopedPayload;
  [HEIST_EVENTS.ENTERED_CAMERA_CONE]: EnteredCameraConePayload;
  // Pathing events (crew-pathing Task 008)
  [HEIST_EVENTS.ROUTE_PLANNED]: RoutePlannedPayload;
  [HEIST_EVENTS.ROUTE_CURSOR_ADVANCED]: RouteCursorAdvancedPayload;
  [HEIST_EVENTS.AGENT_INTENT]: AgentIntentPayload;
  [HEIST_EVENTS.AGENT_BLOCKED]: AgentBlockedPayload;
  [HEIST_EVENTS.BLOCKED_TICKS_UPDATED]: BlockedTicksUpdatedPayload;
  [HEIST_EVENTS.DOOR_QUEUED]: DoorQueuedPayload;
  [HEIST_EVENTS.DOOR_OPEN_STARTED]: DoorOpenStartedPayload;
  [HEIST_EVENTS.DOOR_OPENED]: DoorOpenedPayload;
  [HEIST_EVENTS.DEADLOCK_BROKEN]: DeadlockBrokenPayload;
}
