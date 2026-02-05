/**
 * Alert Escalation Pattern
 *
 * A multi-level alert system with evidence accumulation and decay.
 * Used for facility alert states, faction relations, threat levels, etc.
 *
 * Key features:
 * - Multiple alert levels with thresholds
 * - Evidence accumulation triggers escalation
 * - Time-based decay returns to baseline
 * - Lockdown state with special rules
 *
 * From: Auto-Heist alert system
 */

import type { TickIndex } from '../types/core.js';

// === TYPES ===

export type AlertLevel = 'CALM' | 'SUSPICIOUS' | 'ALARM' | 'LOCKDOWN' | string;

export interface AlertState {
  level: AlertLevel;
  evidence: number;           // Current evidence level
  lastEvidenceTick: TickIndex;
  escalatedTick?: TickIndex;  // When current level was reached
  lockdownUntil?: TickIndex;  // For timed lockdowns
}

export interface AlertConfig {
  levels: AlertLevelConfig[];
  decayPerTick: number;       // Evidence decay rate
  decayDelayTicks: number;    // Ticks before decay starts
}

export interface AlertLevelConfig {
  name: AlertLevel;
  evidenceThreshold: number;  // Evidence needed to reach this level
  minDurationTicks?: number;  // Minimum time at this level
  isLockdown?: boolean;       // Special lockdown rules apply
}

// === DEFAULT CONFIG ===

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  levels: [
    { name: 'CALM', evidenceThreshold: 0 },
    { name: 'SUSPICIOUS', evidenceThreshold: 30, minDurationTicks: 10 },
    { name: 'ALARM', evidenceThreshold: 70, minDurationTicks: 20 },
    { name: 'LOCKDOWN', evidenceThreshold: 100, minDurationTicks: 50, isLockdown: true },
  ],
  decayPerTick: 2,
  decayDelayTicks: 5,
};

// === FUNCTIONS ===

/**
 * Create initial alert state
 */
export function createAlertState(tick: TickIndex): AlertState {
  return {
    level: 'CALM',
    evidence: 0,
    lastEvidenceTick: tick,
  };
}

/**
 * Add evidence to alert state
 * Returns new state and whether level changed
 */
export function addEvidence(
  state: AlertState,
  config: AlertConfig,
  amount: number,
  tick: TickIndex
): { state: AlertState; levelChanged: boolean; newLevel?: AlertLevel } {
  const newEvidence = Math.min(100, state.evidence + amount);

  // Find appropriate level based on evidence
  let targetLevel = config.levels[0]!;
  for (const level of config.levels) {
    if (newEvidence >= level.evidenceThreshold) {
      targetLevel = level;
    }
  }

  const levelChanged = targetLevel.name !== state.level;

  return {
    state: {
      level: targetLevel.name,
      evidence: newEvidence,
      lastEvidenceTick: tick,
      escalatedTick: levelChanged ? tick : state.escalatedTick,
      lockdownUntil: targetLevel.isLockdown ?
        tick + (targetLevel.minDurationTicks ?? 50) :
        state.lockdownUntil,
    },
    levelChanged,
    newLevel: levelChanged ? targetLevel.name : undefined,
  };
}

/**
 * Process evidence decay
 * Returns new state and whether level changed
 */
export function decayEvidence(
  state: AlertState,
  config: AlertConfig,
  tick: TickIndex
): { state: AlertState; levelChanged: boolean; newLevel?: AlertLevel } {
  // Check decay delay
  const ticksSinceEvidence = tick - state.lastEvidenceTick;
  if (ticksSinceEvidence < config.decayDelayTicks) {
    return { state, levelChanged: false };
  }

  // Check lockdown
  if (state.lockdownUntil && tick < state.lockdownUntil) {
    return { state, levelChanged: false };
  }

  // Check minimum duration at current level
  const currentLevelConfig = config.levels.find(l => l.name === state.level);
  if (currentLevelConfig?.minDurationTicks && state.escalatedTick) {
    const ticksAtLevel = tick - state.escalatedTick;
    if (ticksAtLevel < currentLevelConfig.minDurationTicks) {
      return { state, levelChanged: false };
    }
  }

  // Apply decay
  const decayAmount = config.decayPerTick * (ticksSinceEvidence - config.decayDelayTicks + 1);
  const newEvidence = Math.max(0, state.evidence - decayAmount);

  // Find appropriate level based on evidence
  // When decaying, we use thresholds with hysteresis (require falling below previous level)
  let targetLevel = config.levels[0]!;
  for (const level of config.levels) {
    if (newEvidence >= level.evidenceThreshold) {
      targetLevel = level;
    }
  }

  const levelChanged = targetLevel.name !== state.level;

  return {
    state: {
      level: targetLevel.name,
      evidence: newEvidence,
      lastEvidenceTick: state.lastEvidenceTick, // Keep original for decay calculation
      escalatedTick: levelChanged ? tick : state.escalatedTick,
      lockdownUntil: state.lockdownUntil,
    },
    levelChanged,
    newLevel: levelChanged ? targetLevel.name : undefined,
  };
}

/**
 * Check if currently in lockdown
 */
export function isInLockdown(state: AlertState, tick: TickIndex): boolean {
  if (!state.lockdownUntil) return false;
  return tick < state.lockdownUntil;
}

/**
 * Get alert level index (for comparisons)
 */
export function getAlertLevelIndex(level: AlertLevel, config: AlertConfig): number {
  return config.levels.findIndex(l => l.name === level);
}

/**
 * Check if alert is at or above a specific level
 */
export function isAlertAtLeast(
  state: AlertState,
  level: AlertLevel,
  config: AlertConfig
): boolean {
  const currentIndex = getAlertLevelIndex(state.level, config);
  const targetIndex = getAlertLevelIndex(level, config);
  return currentIndex >= targetIndex;
}

/**
 * Force set alert level (for events/triggers)
 */
export function setAlertLevel(
  state: AlertState,
  level: AlertLevel,
  config: AlertConfig,
  tick: TickIndex
): AlertState {
  const levelConfig = config.levels.find(l => l.name === level);
  if (!levelConfig) return state;

  return {
    level,
    evidence: levelConfig.evidenceThreshold,
    lastEvidenceTick: tick,
    escalatedTick: tick,
    lockdownUntil: levelConfig.isLockdown ?
      tick + (levelConfig.minDurationTicks ?? 50) :
      undefined,
  };
}
