/**
 * Needs System Pattern
 *
 * A 0-1000 need value system with drain rates and thresholds.
 * Used for hunger, sleep, morale, energy, etc.
 *
 * Key features:
 * - Lazy evaluation (store value + lastTick, compute on read)
 * - Per-need drain rates
 * - Warning and critical thresholds
 * - Intent scoring based on need urgency
 *
 * From: Godhood Terrarium NPC system
 */

import type { TickIndex } from '../types/core.js';

// === TYPES ===

export type NeedId = string;

export interface NeedState {
  value: number;           // 0-1000 (0 = satisfied, 1000 = critical)
  lastUpdateTick: number;  // For lazy evaluation
}

export interface NeedConfig {
  drainPerTick: number;    // How much need increases per tick
  warningThreshold: number;  // When to start considering satisfying (e.g., 400)
  criticalThreshold: number; // When need becomes urgent (e.g., 850)
  satisfyPlaceTag?: string;  // Place tag where need can be satisfied (e.g., 'food', 'rest')
}

export interface NeedsComponent {
  needs: Record<NeedId, NeedState>;
  rates: Record<NeedId, number>;
  criticalThreshold: number;
  criticalEmitted?: Record<NeedId, boolean>;
}

// === DEFAULT CONFIGS ===

export const DEFAULT_NEED_CONFIGS: Record<string, NeedConfig> = {
  hunger: {
    drainPerTick: 3,
    warningThreshold: 400,
    criticalThreshold: 850,
    satisfyPlaceTag: 'food',
  },
  sleep: {
    drainPerTick: 2,
    warningThreshold: 400,
    criticalThreshold: 850,
    satisfyPlaceTag: 'rest',
  },
  morale: {
    drainPerTick: 1,
    warningThreshold: 300,
    criticalThreshold: 700,
  },
};

// === FUNCTIONS ===

/**
 * Create a needs component with default values
 */
export function createNeedsComponent(
  needIds: NeedId[],
  configs: Record<NeedId, NeedConfig>,
  tick: TickIndex
): NeedsComponent {
  const needs: Record<NeedId, NeedState> = {};
  const rates: Record<NeedId, number> = {};

  for (const needId of needIds) {
    const config = configs[needId];
    if (!config) continue;
    needs[needId] = { value: 0, lastUpdateTick: tick };
    rates[needId] = config.drainPerTick;
  }

  return {
    needs,
    rates,
    criticalThreshold: 850, // Default, can be overridden
    criticalEmitted: {},
  };
}

/**
 * Get current need value with lazy evaluation
 * Computes value based on stored value + elapsed time * rate
 */
export function getNeedValue(
  component: NeedsComponent,
  needId: NeedId,
  tick: TickIndex
): number {
  const need = component.needs[needId];
  if (!need) return 0;

  const rate = component.rates[needId] ?? 0;
  const elapsed = tick - need.lastUpdateTick;
  const computed = need.value + elapsed * rate;

  return Math.min(1000, Math.max(0, computed));
}

/**
 * Update need state (call after computing to persist)
 */
export function updateNeedState(
  component: NeedsComponent,
  needId: NeedId,
  tick: TickIndex
): void {
  const need = component.needs[needId];
  if (!need) return;

  need.value = getNeedValue(component, needId, tick);
  need.lastUpdateTick = tick;
}

/**
 * Satisfy a need (set to 0)
 */
export function satisfyNeed(
  component: NeedsComponent,
  needId: NeedId,
  tick: TickIndex
): void {
  const need = component.needs[needId];
  if (!need) return;

  need.value = 0;
  need.lastUpdateTick = tick;

  // Reset critical flag
  if (component.criticalEmitted) {
    component.criticalEmitted[needId] = false;
  }
}

/**
 * Check if need is at or above critical threshold
 */
export function isCritical(
  component: NeedsComponent,
  needId: NeedId,
  tick: TickIndex
): boolean {
  return getNeedValue(component, needId, tick) >= component.criticalThreshold;
}

/**
 * Get the most urgent need that should be satisfied
 * Returns null if no need is above warning threshold
 */
export function getMostUrgentNeed(
  component: NeedsComponent,
  configs: Record<NeedId, NeedConfig>,
  tick: TickIndex
): { needId: NeedId; value: number } | null {
  let mostUrgent: { needId: NeedId; value: number } | null = null;

  for (const needId of Object.keys(component.needs)) {
    const config = configs[needId];
    if (!config) continue;

    const value = getNeedValue(component, needId, tick);
    if (value < config.warningThreshold) continue;

    if (!mostUrgent || value > mostUrgent.value) {
      mostUrgent = { needId, value };
    }
  }

  return mostUrgent;
}

/**
 * Score an intent to satisfy a need
 * Higher score = more urgent
 *
 * Formula: 3 * needValue - distanceCost
 */
export function scoreNeedIntent(needValue: number, distanceCost: number): number {
  return 3 * needValue - distanceCost;
}

/**
 * Check for critical threshold crossing (for events)
 * Returns the need that just crossed, or null
 */
export function checkCriticalCrossing(
  component: NeedsComponent,
  configs: Record<NeedId, NeedConfig>,
  tick: TickIndex
): { needId: NeedId; value: number } | null {
  for (const needId of Object.keys(component.needs)) {
    const config = configs[needId];
    if (!config) continue;

    const value = getNeedValue(component, needId, tick);
    const wasCritical = component.criticalEmitted?.[needId] ?? false;

    if (value >= config.criticalThreshold && !wasCritical) {
      // Mark as emitted
      if (!component.criticalEmitted) {
        component.criticalEmitted = {};
      }
      component.criticalEmitted[needId] = true;

      return { needId, value };
    }
  }

  return null;
}
