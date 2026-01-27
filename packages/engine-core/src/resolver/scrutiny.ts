/**
 * Scrutiny system for tracking player mistakes.
 * Task 010: Scrutiny System
 *
 * MINOR contradictions increase scrutiny. Scrutiny 5 = instant loss.
 */

import type { Scrutiny } from '../types/index.js';
import { ContradictionSeverity } from '../types/index.js';
import type { ContradictionResult } from './contradiction.js';

/**
 * Result of scrutiny change application.
 */
export interface ScrutinyResult {
  readonly previousScrutiny: Scrutiny;
  readonly newScrutiny: Scrutiny;
  readonly delta: number;
  readonly isLossCondition: boolean;
}

/**
 * Scrutiny threshold for loss condition.
 */
const SCRUTINY_LOSS_THRESHOLD = 5;

/**
 * Clamp a number to valid Scrutiny range (0-5).
 */
function clampScrutiny(value: number): Scrutiny {
  if (value <= 0) return 0;
  if (value >= 5) return 5;
  return value as Scrutiny;
}

/**
 * Get scrutiny delta from contradiction result.
 *
 * AC-1: MINOR → +1 scrutiny
 * EC-1: Null contradiction → 0 (no change)
 * EC-2: MAJOR → 0 (blocked at submission, doesn't increase scrutiny)
 *
 * @param contradiction - Result from contradiction detection, or null
 * @returns Delta to apply to scrutiny (0 or 1)
 */
export function getScrutinyDelta(contradiction: ContradictionResult | null): number {
  // EC-1: No contradiction means no scrutiny change
  if (contradiction === null) {
    return 0;
  }

  // AC-1: MINOR contradictions increase scrutiny
  if (contradiction.severity === ContradictionSeverity.MINOR) {
    return 1;
  }

  // EC-2: MAJOR contradictions are blocked at submission, no scrutiny change
  // (the submission would be rejected entirely)
  return 0;
}

/**
 * Apply scrutiny change and check loss condition.
 *
 * AC-2: Scrutiny 5 = loss condition
 * AC-3: Clamped to 0-5 range
 *
 * @param currentScrutiny - Current scrutiny level
 * @param delta - Amount to change (can be negative for future use)
 * @returns Result with new scrutiny and loss condition flag
 */
export function applyScrutinyChange(
  currentScrutiny: Scrutiny,
  delta: number
): ScrutinyResult {
  const newValue = currentScrutiny + delta;
  const newScrutiny = clampScrutiny(newValue);

  return {
    previousScrutiny: currentScrutiny,
    newScrutiny,
    delta,
    isLossCondition: newScrutiny >= SCRUTINY_LOSS_THRESHOLD,
  };
}

/**
 * Check if scrutiny triggers loss condition.
 *
 * AC-2: Scrutiny >= 5 triggers instant loss
 *
 * @param scrutiny - Current scrutiny level
 * @returns True if scrutiny has reached loss threshold
 */
export function isScrutinyLoss(scrutiny: Scrutiny): boolean {
  return scrutiny >= SCRUTINY_LOSS_THRESHOLD;
}
