/**
 * Emergence System
 *
 * Task 002: World Init - Archetype Rates + Need Thresholds
 * Task 004: Daily Consumption + Auto-Spawn Thresholds
 *
 * Implements:
 * - NPC initialization from archetype (rates + critical threshold)
 * - Config validation for emergence parameters
 * - Daily food consumption system
 * - Configurable auto-spawn threshold
 */

import type { EntityRecord } from './types/index.js';
import type { SystemContext } from './kernel.js';
import { EVENT_TYPES, dayIndexFromTick } from './types/index.js';
import type { CoreNpcNeedsComponent } from './npc.js';

// === PACK TYPES (re-declared to avoid circular dependency) ===

export interface NpcArchetypeDef {
  archetypeId: string;
  titleKey: string;
  tags: string[];
  needs: {
    hungerDrainPerTick: number;
    sleepDrainPerTick: number;
  };
  intentWeights: Record<string, number>;
}

export interface PackConfig {
  ticksPerDay: number;
  maxActiveNpcsPerTick: number;
  maxEventsPerTick: number;
  needWarningThreshold: number;
  needCriticalThreshold: number;
  headlineMinScore: number;
  maxHeadlinesPerDay: number;
  minHeadlinesPerDay: number;
  sceneMinScore: number;
  maxScenesPerDay: number;
  initialFavor: number;
  favorCap: number;
  favorRegenPerDay: number;
  maxEdictsPerDay: number;
  maxMiraclesPerDay: number;
  foodConsumptionPerMeal: number;
  dailyFoodConsumptionPerNpc: number;
  foodAutoSpawnThreshold: number;
  criticalNeedOverridesJob: boolean;
}

// === CONSUMPTION CONFIG ===

export interface ConsumptionConfig {
  dailyFoodConsumptionPerNpc: number;
}

// Note: AutoSpawnConfig is defined in job.ts to avoid circular dependency

// === TASK 002: NPC INITIALIZATION FROM ARCHETYPE ===

/**
 * Initialize an NPC entity's need rates and critical threshold from archetype data.
 *
 * Task 002: AC-1, AC-2
 *
 * @param npc - The NPC entity to initialize
 * @param archetypeMap - Map of archetypeId to archetype definition
 * @param config - Pack config containing needCriticalThreshold
 */
export function initializeNpcFromArchetype(
  npc: EntityRecord,
  archetypeMap: Map<string, NpcArchetypeDef>,
  config: PackConfig
): void {
  const npcComp = npc.components['core.npc'] as { archetypeId: string } | undefined;
  if (!npcComp) return;

  const needsComp = npc.components['core.npc.needs'] as CoreNpcNeedsComponent | undefined;
  if (!needsComp) return;

  const archetype = archetypeMap.get(npcComp.archetypeId);

  if (archetype) {
    // AC-1: Use archetype rates (validate to prevent NaN/Infinity propagation)
    const hungerRate = archetype.needs.hungerDrainPerTick;
    const sleepRate = archetype.needs.sleepDrainPerTick;

    if (Number.isFinite(hungerRate)) {
      needsComp.rates.hunger = hungerRate;
    }
    // else: keep default rate (already set by createNpcNeedsComponent)

    if (Number.isFinite(sleepRate)) {
      needsComp.rates.sleep = sleepRate;
    }
    // else: keep default rate
  }
  // EC-1: Unknown archetype falls back to default rates (already set by createNpcNeedsComponent)

  // AC-2: Always apply critical threshold from config
  needsComp.criticalThreshold = config.needCriticalThreshold;
}

/**
 * Validate emergence-related config values.
 *
 * Task 002: ERR-1 - Invalid config thresholds throw error during world creation.
 * Task 004: ERR-1 - Invalid consumption/threshold values throw error during world creation.
 *
 * @param config - Pack config to validate
 * @throws Error if any emergence config value is not a finite number (or negative for threshold)
 */
export function validateEmergenceConfig(config: PackConfig): void {
  if (!Number.isFinite(config.needCriticalThreshold) || config.needCriticalThreshold < 0) {
    throw new Error(
      `Invalid config: needCriticalThreshold must be a finite number >= 0, got ${config.needCriticalThreshold}`
    );
  }
  if (!Number.isFinite(config.dailyFoodConsumptionPerNpc)) {
    throw new Error(
      `Invalid config: dailyFoodConsumptionPerNpc must be a finite number, got ${config.dailyFoodConsumptionPerNpc}`
    );
  }
  if (!Number.isFinite(config.foodAutoSpawnThreshold)) {
    throw new Error(
      `Invalid config: foodAutoSpawnThreshold must be a finite number, got ${config.foodAutoSpawnThreshold}`
    );
  }
}

// === TASK 004: DAILY CONSUMPTION SYSTEM ===

/**
 * Daily consumption system - reduces stockpile based on NPC count.
 *
 * Task 004: AC-1, AC-2, EC-1, EC-2, EC-3, ERR-1
 *
 * Runs at day boundary (before auto-spawn).
 *
 * @param ctx - System context
 * @param prevDayIndex - Previous day index for boundary detection
 * @param consumptionConfig - Configuration with dailyFoodConsumptionPerNpc
 */
export function dailyConsumptionSystem(
  ctx: SystemContext,
  prevDayIndex: number,
  consumptionConfig: ConsumptionConfig
): void {
  const ticksPerDay = ctx.state.calendar.ticksPerDay;
  const currentDayIndex = dayIndexFromTick(ctx.tickIndex, ticksPerDay);

  // Only run at day boundary
  if (currentDayIndex === prevDayIndex) return;

  // ERR-1: Clamp negative values to 0 (means "consumption disabled")
  // NaN/Infinity are caught by validateEmergenceConfig at world creation
  const consumptionPerNpc = Math.max(0, consumptionConfig.dailyFoodConsumptionPerNpc);

  // EC-1, EC-3: Zero consumption = skip
  if (consumptionPerNpc === 0) return;

  // Get NPC count
  const npcs = ctx.getEntitiesByType('npc');
  const npcCount = npcs.length;

  // EC-2: No NPCs = skip
  if (npcCount === 0) return;

  // Calculate required consumption
  const requiredConsumption = npcCount * consumptionPerNpc;

  // Get current food stockpile
  const worldEntity = ctx.state.entities['world'];
  if (!worldEntity) return;

  const stockpile = worldEntity.components['core.stockpile'] as { resources?: Record<string, number> } | undefined;
  const rawCurrentFood = stockpile?.resources?.['res.food'] ?? 0;

  // Handle corrupted state: clamp negative food to 0
  const currentFood = Math.max(0, rawCurrentFood);

  // AC-2: Clamp consumption to available food
  const actualConsumption = Math.min(requiredConsumption, currentFood);

  // Skip if nothing to consume
  if (actualConsumption === 0) return;

  // AC-1: Emit stockpile delta event
  ctx.proposeEvent(EVENT_TYPES.STOCKPILE_DELTA, {
    deltas: [{ resourceId: 'res.food', amount: -actualConsumption }],
    reason: 'daily_consumption',
  }, {}); // Empty attribution for system-generated event
}

// === TASK 004: CONFIGURABLE AUTO-SPAWN THRESHOLD ===

/**
 * Get the configured food auto-spawn threshold.
 *
 * Task 004: AC-3, ERR-1
 *
 * @param config - Pack config containing foodAutoSpawnThreshold
 * @returns The threshold value (clamped to 0 if negative)
 */
export function getConfiguredAutoSpawnThreshold(config: PackConfig): number {
  // ERR-1: Clamp negative values to 0 (means "always spawn if no active job")
  // NaN/Infinity are caught by validateEmergenceConfig at world creation
  return Math.max(0, config.foodAutoSpawnThreshold);
}
