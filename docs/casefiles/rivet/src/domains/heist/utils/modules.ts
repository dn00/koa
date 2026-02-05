/**
 * Heist Kernel - Module Effects Utility
 *
 * Helper functions to query equipped module effects.
 * Modules are passive effects per specss.md Section 13.
 */

import type { HeistState, ModulesState } from '../types.js';
import type { ModuleCard, ModuleEffect } from '../rules-types.js';

/**
 * Check if a module effect of a given type is equipped.
 */
export function hasModuleEffect(
  modules: ModulesState | undefined,
  effectType: ModuleEffect['type']
): boolean {
  if (!modules?.equipped) return false;
  return modules.equipped.some((m) => m.effect.type === effectType);
}

/**
 * Get the module effect of a given type if equipped.
 */
export function getModuleEffect<T extends ModuleEffect['type']>(
  modules: ModulesState | undefined,
  effectType: T
): Extract<ModuleEffect, { type: T }> | undefined {
  if (!modules?.equipped) return undefined;
  const module = modules.equipped.find((m) => m.effect.type === effectType);
  if (!module) return undefined;
  return module.effect as Extract<ModuleEffect, { type: T }>;
}

/**
 * Get camera confirm speed multiplier.
 * Returns 1.0 if no module, or the multiplier if CAMERA_CONFIRM_SLOWER is equipped.
 */
export function getCameraConfirmMultiplier(modules: ModulesState | undefined): number {
  const effect = getModuleEffect(modules, 'CAMERA_CONFIRM_SLOWER');
  return effect?.multiplier ?? 1.0;
}

/**
 * Get hide speed multiplier.
 * Returns 1.0 if no module, or the multiplier if HIDE_FASTER is equipped.
 */
export function getHideSpeedMultiplier(modules: ModulesState | undefined): number {
  const effect = getModuleEffect(modules, 'HIDE_FASTER');
  return effect?.multiplier ?? 1.0;
}

/**
 * Get first alert delay in ticks.
 * Returns 0 if no module, or the ticks if FIRST_ALERT_DELAYED is equipped.
 */
export function getFirstAlertDelay(modules: ModulesState | undefined): number {
  const effect = getModuleEffect(modules, 'FIRST_ALERT_DELAYED');
  return effect?.ticks ?? 0;
}

/**
 * Get noise dampening extra walls.
 * Returns 0 if no module, or the extra walls if NOISE_DAMPENING is equipped.
 */
export function getNoiseDampening(modules: ModulesState | undefined): number {
  const effect = getModuleEffect(modules, 'NOISE_DAMPENING');
  return effect?.extraWalls ?? 0;
}

/**
 * Get shadow bonus cover multiplier.
 * Returns 1.0 if no module, or the multiplier if SHADOW_BONUS is equipped.
 */
export function getShadowBonus(modules: ModulesState | undefined): number {
  const effect = getModuleEffect(modules, 'SHADOW_BONUS');
  return effect?.coverMultiplier ?? 1.0;
}

/**
 * Get alert decay multiplier (slower = higher value).
 * Returns 1.0 if no module, or the multiplier if ALERT_DECAY_SLOWER is equipped.
 */
export function getAlertDecayMultiplier(modules: ModulesState | undefined): number {
  const effect = getModuleEffect(modules, 'ALERT_DECAY_SLOWER');
  return effect?.multiplier ?? 1.0;
}

/**
 * Get hack noise reduction multiplier.
 * Returns 1.0 if no module, or the multiplier if HACK_NOISE_REDUCTION is equipped.
 */
export function getHackNoiseMultiplier(modules: ModulesState | undefined): number {
  const effect = getModuleEffect(modules, 'HACK_NOISE_REDUCTION');
  return effect?.multiplier ?? 1.0;
}

/**
 * Get SUSPICIOUS→ALARM delay in extra ticks.
 * Returns 0 if no module, or the ticks if SUSPICIOUS_TO_ALARM_DELAYED is equipped.
 */
export function getSuspiciousToAlarmDelay(modules: ModulesState | undefined): number {
  const effect = getModuleEffect(modules, 'SUSPICIOUS_TO_ALARM_DELAYED');
  return effect?.ticks ?? 0;
}
