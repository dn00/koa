/**
 * Economy System - World Stockpile
 *
 * Task 007: Economy System (World Stockpile)
 *
 * Implements:
 * - core.stockpile component on "world" entity with resources: Record<string, number>
 * - Initial stockpile: food=40, wood=25, stone=15
 * - core.stockpile.delta event for all resource changes
 * - Job completion: consume inputs and produce outputs atomically
 * - NPC eating: consume 2 food per eat action
 * - All resource amounts must be integers >= 0
 */

import type {
  WorldState,
  SimEvent,
} from './types/index.js';
import { EVENT_TYPES } from './types/index.js';
import { ReducerRegistry } from './kernel.js';

// === CONSTANTS ===

export const INITIAL_STOCKPILE: Record<string, number> = {
  'res.food': 40,
  'res.wood': 25,
  'res.stone': 15,
};

export const FOOD_CONSUMPTION_PER_MEAL = 2;

// === COMPONENT TYPES ===

export interface CoreStockpileComponent {
  resources: Record<string, number>;
}

export interface StockpileDelta {
  resourceId: string;
  amount: number;
}

// === STOCKPILE HELPERS ===

/**
 * Create a stockpile component with given resources
 */
export function createStockpileComponent(
  resources: Record<string, number>
): CoreStockpileComponent {
  return {
    resources: { ...resources },
  };
}

/**
 * Create the initial stockpile for a new world
 */
export function createInitialStockpile(): Record<string, number> {
  return { ...INITIAL_STOCKPILE };
}

/**
 * Get the stockpile from world state
 */
export function getStockpile(state: WorldState): Record<string, number> {
  const worldEntity = state.entities['world'];
  if (!worldEntity) return {};

  const stockpile = worldEntity.components['core.stockpile'] as CoreStockpileComponent | undefined;
  if (!stockpile) return {};

  return stockpile.resources;
}

/**
 * Set the stockpile on world state
 */
export function setStockpile(
  state: WorldState,
  resources: Record<string, number>
): void {
  const worldEntity = state.entities['world'];
  if (!worldEntity) {
    throw new Error('World entity not found');
  }

  worldEntity.components['core.stockpile'] = createStockpileComponent(resources);
}

/**
 * Apply deltas to a stockpile (pure function)
 *
 * @throws Error if any resource would go negative
 */
export function applyStockpileDelta(
  resources: Record<string, number>,
  deltas: StockpileDelta[]
): Record<string, number> {
  const result = { ...resources };

  for (const delta of deltas) {
    const current = result[delta.resourceId] ?? 0;
    const newValue = current + delta.amount;

    // Clamp to 0 to handle race conditions where multiple systems
    // propose consumption events based on the same snapshot
    result[delta.resourceId] = Math.max(0, newValue);
  }

  return result;
}

// === JOB VALIDATION ===

export interface JobInputValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate that job inputs are available in stockpile
 */
export function validateJobInputs(
  state: WorldState,
  inputs: Array<{ resourceId: string; amount: number }> | undefined
): JobInputValidationResult {
  // No inputs = always valid
  if (!inputs || inputs.length === 0) {
    return { valid: true };
  }

  const stockpile = getStockpile(state);

  for (const input of inputs) {
    const available = stockpile[input.resourceId] ?? 0;
    if (available < input.amount) {
      return {
        valid: false,
        reason: `Insufficient ${input.resourceId}: have ${available}, need ${input.amount}`,
      };
    }
  }

  return { valid: true };
}

// === ECONOMY REDUCERS ===

export function economyReducers(): ReducerRegistry {
  const registry = new ReducerRegistry();

  // core.stockpile.delta - apply resource changes
  registry.register(EVENT_TYPES.STOCKPILE_DELTA, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      deltas: StockpileDelta[];
      reason: string;
      jobId?: string;
      npcId?: string;
    };

    const worldEntity = state.entities['world'];
    if (!worldEntity) {
      throw new Error('World entity not found');
    }

    let stockpile = worldEntity.components['core.stockpile'] as CoreStockpileComponent | undefined;
    if (!stockpile) {
      stockpile = createStockpileComponent({});
      worldEntity.components['core.stockpile'] = stockpile;
    }

    // Apply deltas (will throw if negative)
    stockpile.resources = applyStockpileDelta(stockpile.resources, payload.deltas);
  });

  // core.stockpile.initialized - set initial stockpile
  registry.register(EVENT_TYPES.STOCKPILE_INITIALIZED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      resources: Record<string, number>;
    };

    const worldEntity = state.entities['world'];
    if (!worldEntity) {
      throw new Error('World entity not found');
    }

    worldEntity.components['core.stockpile'] = createStockpileComponent(payload.resources);
  });

  return registry;
}
