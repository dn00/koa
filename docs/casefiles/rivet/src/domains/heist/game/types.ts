/**
 * Game View Types
 *
 * Shared types for game state views, commands, and forensics.
 * These types are used by all adapters (agent-play, agent-playtest, etc.)
 *
 * Design: GameView is a superset of both AgentView and AgentObservation
 * to ensure backward compatibility with existing adapters.
 */

import type { Vec2, AlertLevel, TokenType, PendingVeto } from '../types.js';
import type { DirectorStance } from '../rules-types.js';

// === CREW VIEW ===

/**
 * Crew member view for adapters.
 * Contains all fields from both AgentView and AgentObservation crew types.
 */
export interface CrewView {
  id: string;
  pos: Vec2;
  state: string;
  isSpotted: boolean;
  health: number;
}

// === GUARD VIEW ===

/**
 * Guard view for adapters.
 * Includes detectionAccum for debugging/agents (useful for policy decisions).
 */
export interface GuardView {
  id: string;
  pos: Vec2;
  state: string;
  /** Last known position where crew was seen (from AgentObservation) */
  lastSeen?: Vec2;
  /** Detection accumulator - useful for agents to gauge danger level */
  detectionAccum: number;
}

// === OBJECTIVE VIEW ===

/**
 * Objective view for adapters.
 * Unified from AgentView (with label) and AgentObservation.
 */
export interface ObjectiveView {
  id: string;
  label: string;
  state: string;
  progress: number;
}

// === TOKEN STATE VIEW ===

/**
 * Token availability view.
 * Includes DECOY from both AgentView and AgentObservation.
 */
export interface TokensView {
  LIGHTS: number;
  RADIO: number;
  SMOKE: number;
  DECOY: number;
}

// === EFFECTS VIEW ===

/**
 * Active effects view.
 * Unified from AgentView (string array) and AgentObservation (boolean/count).
 */
export interface EffectsView {
  lightsOut: boolean;
  radioJammed: boolean;
  smokeCount: number;
  decoyCount: number;
}

// === GAME VIEW ===

/**
 * Unified game state view for all adapters.
 *
 * Superset of AgentView and AgentObservation to avoid breaking changes.
 * All adapters should migrate to use this type.
 */
export interface GameView {
  // === Time/Progress ===
  tick: number;
  heat: number;
  maxHeat: number;
  alert: AlertLevel | string;

  // === Director State ===
  stance: DirectorStance;

  // === Game State ===
  result: 'ESCAPED' | 'CAUGHT' | 'TIMEOUT' | null;
  paused: boolean;
  pauseReason: string | null;
  pendingVeto: PendingVeto | null;

  // === Entity Views ===
  crew: CrewView[];
  guards: GuardView[];
  objectives: ObjectiveView[];

  // === Tokens ===
  tokens: TokensView;
  tokenCooldown: number;

  // === Effects ===
  effects: EffectsView;

  // === Equipment ===
  equippedModules: string[];

  // === Map Representation ===
  map: string;
}

// === COMMAND TYPES ===

/**
 * Wait command - continue simulation without action.
 */
export interface WaitCommand {
  type: 'WAIT';
}

/**
 * Token command - use a token, with optional target for cell-targeted tokens.
 */
export interface TokenCommand {
  type: 'TOKEN';
  tokenType: TokenType;
  /** Optional target for cell-targeted tokens like DECOY */
  target?: Vec2;
}

/**
 * Stance command - change director stance.
 */
export interface StanceCommand {
  type: 'STANCE';
  value: DirectorStance;
}

/**
 * Veto decision command - allow or block pending veto rule.
 */
export interface VetoDecisionCommand {
  type: 'VETO_DECISION';
  decision: 'ALLOW' | 'VETO';
}

/**
 * Quit command - end the game session.
 */
export interface QuitCommand {
  type: 'QUIT';
}

/**
 * Discriminated union of all valid commands.
 * Invalid command types will cause TypeScript compile errors.
 */
export type Command =
  | WaitCommand
  | TokenCommand
  | StanceCommand
  | VetoDecisionCommand
  | QuitCommand;

// === FORENSICS ===

/**
 * Event record for forensics.
 */
export interface ForensicsEvent {
  tick: number;
  type: string;
  payload: unknown;
}

/**
 * Post-game forensics data for analysis.
 * Contains information useful for understanding what happened.
 */
export interface Forensics {
  /** Total ticks the game ran */
  totalTicks: number;
  /** Total events generated during the game */
  totalEvents: number;
  /** Last N events (typically 15) for review */
  lastEvents: ForensicsEvent[];
  /** Number of times crew was spotted */
  spotCount: number;
  /** Number of alert level escalations */
  alertEscalations: number;
  /** Reason for loss, or null if won/quit */
  lossReason: string | null;
  /** Suggestion for improvement, or null if won */
  suggestion: string | null;
}
